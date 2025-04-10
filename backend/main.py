#!/usr/bin/env python3
import sys
from huggingface_hub import hf_hub_download
sys.modules['huggingface_hub.cached_download'] = hf_hub_download

import os
import json
import uuid
import shutil
import subprocess
from pathlib import Path
from typing import List, Dict, Optional

from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi import status
from pydantic import BaseModel
from openai import AzureOpenAI
from dotenv import load_dotenv
import chromadb
from sentence_transformers import SentenceTransformer
import whisperx
import torch
from gtts import gTTS
import imageio_ffmpeg as ffmpeg
from omegaconf import ListConfig, OmegaConf

# Initialize FastAPI application
app = FastAPI(title="Sowing Advisory API", version="1.0.0")

# Setup static files directory
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Create directories for temporary files
TEMP_AUDIO_DIR = os.path.join(os.path.dirname(__file__), "temp_audio")
os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)
OUTPUT_DIR = os.path.join(static_dir, "tts")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Environment variables configuration
def load_env():
    env_vars = {
        "AZURE_OPENAI_ENDPOINT": os.getenv("AZURE_OPENAI_ENDPOINT"),
        "AZURE_OPENAI_DEPLOYMENT": os.getenv("AZURE_OPENAI_DEPLOYMENT_NAME"),
        "AZURE_OPENAI_API_VERSION": os.getenv("AZURE_OPENAI_API_VERSION", "2024-05-01-preview")
    }

    # Try to read API key from Docker secret first
    secret_path = os.getenv("AZURE_OPENAI_API_KEY_FILE", "/run/secrets/azure_api_key")
    if os.path.exists(secret_path):
        with open(secret_path) as f:
            env_vars["AZURE_OPENAI_API_KEY"] = f.read().strip()
    else:
        env_vars["AZURE_OPENAI_API_KEY"] = os.getenv("AZURE_OPENAI_API_KEY")

    # Validate required variables
    required = ["AZURE_OPENAI_ENDPOINT", "AZURE_OPENAI_DEPLOYMENT", "AZURE_OPENAI_API_KEY"]
    if not all(env_vars[k] for k in required):
        missing = [k for k in required if not env_vars[k]]
        raise ValueError(f"Missing required environment variables: {', '.join(missing)}")
    
    return env_vars
    

# Load environment variables
env_vars = load_env()
print("Environment variables loaded successfully")

# Initialize Azure OpenAI client
client = AzureOpenAI(
    api_key=env_vars["AZURE_OPENAI_API_KEY"],
    api_version=env_vars["AZURE_OPENAI_API_VERSION"],
    azure_endpoint=env_vars["AZURE_OPENAI_ENDPOINT"]
)

# Initialize ChromaDB
try:
    embed_model = SentenceTransformer("BAAI/bge-small-en")
    chroma_client = chromadb.PersistentClient(path="backend/COMBINE/chroma_db")
    collection = chroma_client.get_or_create_collection(name="doc_chunks")
    print("ChromaDB initialized successfully")
except Exception as e:
    print(f"Failed to initialize ChromaDB: {str(e)}")
    raise

# Initialize WhisperX
device = "cuda" if torch.cuda.is_available() else "cpu"
try:
    stt_model = whisperx.load_model("small", device, compute_type="float32")
    print("WhisperX model loaded successfully")
except Exception as e:
    print(f"Failed to load WhisperX model: {str(e)}")
    raise

# Pydantic models for request/response validation
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

class QueryRequest(BaseModel):
    query: str

# API routers
chat_router = APIRouter()
query_router = APIRouter()
stt_router = APIRouter()
tts_router = APIRouter()

def generate_gpt_response(query_text: str, context: str = "") -> str:
    """Generate response from Azure OpenAI."""
    messages = [
        {"role": "system", "content": "You are a highly knowledgeable assistant specializing in agriculture."},
        {"role": "user", "content": f"Context: {context}\n\nQuery: {query_text}"}
    ]
    try:
        response = client.chat.completions.create(
            model=env_vars["AZURE_OPENAI_DEPLOYMENT"],
            messages=messages,
            temperature=0.7,
            max_tokens=800
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

def search_query(query: str, top_k: int = 5) -> List[Dict]:
    """Search documents in ChromaDB."""
    if collection.count() == 0:
        return []
    query_embedding = embed_model.encode(query).tolist()
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas"]
    )
    return [{
        "document": results["documents"][0][i],
        "filename": results["metadatas"][0][i]["filename"],
        "chunk_index": results["metadatas"][0][i]["chunk_index"]
    } for i in range(len(results["documents"][0]))]

def convert_speech_to_text(audio_file: UploadFile) -> Dict:
    """Convert speech to text using WhisperX."""
    try:
        input_audio_path = os.path.join(TEMP_AUDIO_DIR, audio_file.filename)
        converted_audio_path = os.path.join(TEMP_AUDIO_DIR, "converted.wav")

        # Save uploaded file
        with open(input_audio_path, "wb") as buffer:
            shutil.copyfileobj(audio_file.file, buffer)

        # Convert audio format
        ffmpeg_path = ffmpeg.get_ffmpeg_exe()
        subprocess.run(
            [ffmpeg_path, "-y", "-i", input_audio_path, "-ar", "16000", "-ac", "1", converted_audio_path],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True
        )

        # Transcribe audio
        audio = whisperx.load_audio(converted_audio_path)
        result = stt_model.transcribe(audio)
        text_output = " ".join([segment["text"] for segment in result.get("segments", [])])

        # Clean up temporary files
        os.remove(input_audio_path)
        os.remove(converted_audio_path)

        return {"text": text_output}

    except subprocess.CalledProcessError as e:
        raise HTTPException(status_code=500, detail=f"FFmpeg Error: {e.stderr.decode()}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"STT Processing Error: {str(e)}")

def generate_speech(text: str) -> JSONResponse:
    """Generate speech from text using gTTS."""
    try:
        if not text.strip():
            raise HTTPException(status_code=422, detail="Text field cannot be empty.")

        filename = f"tts_{uuid.uuid4().hex}.mp3"
        filepath = os.path.join(OUTPUT_DIR, filename)

        tts = gTTS(text)
        tts.save(filepath)

        return JSONResponse(content={"audio_url": f"/static/tts/{filename}"})

    except Exception as e:
        print(f"TTS Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS Error: {str(e)}")

# API endpoints
@chat_router.post("/", response_model=ChatResponse)
async def get_chat_response(request: ChatRequest):
    return {"reply": generate_gpt_response(request.message)}

@query_router.post("/")
async def handle_query(request: QueryRequest):
    return {"query": request.query, "answer": generate_gpt_response(request.query)}

@stt_router.post("/speech-to-text/")
async def speech_to_text(audio: UploadFile = File(...)):
    return convert_speech_to_text(audio)

@tts_router.post("/text-to-speech/")
async def text_to_speech(request: ChatRequest):
    return generate_speech(request.message)

# Include routers
app.include_router(chat_router, prefix="/chat")
app.include_router(query_router, prefix="/query")
app.include_router(stt_router, prefix="/stt")
app.include_router(tts_router, prefix="/tts")

# Health check endpoints
@app.get("/")
async def root():
    return {"message": "Sowing Advisory Backend is Running!"}

@app.get("/healthcheck", status_code=status.HTTP_200_OK)
async def healthcheck():
    return {
        "status": "healthy",
        "services": {
            "chromadb": collection.count() >= 0 if collection else False,
            "whisperx": stt_model is not None,
            "azure_openai": client is not None
        }
    }