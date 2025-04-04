#!/usr/bin/env python3

from fastapi import FastAPI, APIRouter, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from openai import AzureOpenAI
from dotenv import load_dotenv
import os
import json
import chromadb
from sentence_transformers import SentenceTransformer
import subprocess
import whisperx
import torch
from gtts import gTTS
import uuid
import shutil
import imageio_ffmpeg as ffmpeg
from omegaconf import ListConfig
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles
from fastapi import status

# Mounting the static files directory for serving TTS audio files
# This line is moved below the app initialization

# Allowing ListConfig as a safe global for Torch serialization
torch.serialization.add_safe_globals([ListConfig])

# Loading environment variables from the `.env` file
def load_env():
    # Try .env file first, then fall back to Docker secrets
    dotenv_path = os.path.join(os.path.dirname(__file__), ".env")
    if os.path.exists(dotenv_path):
        load_dotenv(dotenv_path=dotenv_path)
    
    return {
        "AZURE_OPENAI_ENDPOINT": os.getenv("AZURE_OPENAI_ENDPOINT"),
        "AZURE_OPENAI_DEPLOYMENT": os.getenv("AZURE_OPENAI_DEPLOYMENT"),
        "AZURE_OPENAI_API_KEY": os.getenv("AZURE_OPENAI_API_KEY") or open("/run/secrets/azure_api_key").read().strip(),
        "AZURE_OPENAI_API_VERSION": os.getenv("AZURE_OPENAI_API_VERSION", "2024-05-01-preview")
    }

# Storing environment variables in a dictionary
env_vars = load_env()
print("Loading environment variables")

# Initializing the Azure OpenAI client
client = AzureOpenAI(
    api_key=env_vars["AZURE_OPENAI_API_KEY"],
    api_version=env_vars["AZURE_OPENAI_API_VERSION"],
    azure_endpoint=env_vars["AZURE_OPENAI_ENDPOINT"]
)

# Defining a function to generate GPT-4o responses
def generate_gpt_response(query_text, context=""):
    messages = [
        {"role": "system", "content": "You are a highly knowledgeable assistant specializing in agriculture."},
        {"role": "user", "content": f"Context: {context}\n\nQuery: {query_text}"}
    ]
    try:
        # Sending a request to Azure OpenAI to generate a response
        response = client.chat.completions.create(
            model=env_vars["AZURE_OPENAI_DEPLOYMENT"],
            messages=messages,
            temperature=0.7,
            max_tokens=800
        )
        return response.choices[0].message.content.strip()
    except Exception as e:
        # Raising an HTTP exception if an error occurs
        raise HTTPException(status_code=500, detail=str(e))

# Initializing ChromaDB for document storage and retrieval
embed_model = SentenceTransformer("BAAI/bge-small-en")
chroma_client = chromadb.PersistentClient(path="backend/COMBINE/chroma_db")
collection = chroma_client.get_or_create_collection(name="doc_chunks")

# Defining a function to query ChromaDB
def search_query(query, top_k=5):
    if collection.count() == 0:
        return []
    query_embedding = embed_model.encode(query).tolist()
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas"]
    )
    return [{"document": results["documents"][0][i], "filename": results["metadatas"][0][i]["filename"], "chunk_index": results["metadatas"][0][i]["chunk_index"]} for i in range(len(results["documents"][0]))]

# Initializing WhisperX for speech-to-text (STT) processing
device = "cuda" if torch.cuda.is_available() else "cpu"
stt_model = whisperx.load_model("small", device, compute_type="float32")

# Creating a temporary directory for audio files
TEMP_AUDIO_DIR = os.path.join(os.path.dirname(__file__), "temp_audio")
os.makedirs(TEMP_AUDIO_DIR, exist_ok=True)

# Defining a function to convert speech to text
def convert_speech_to_text(audio_file):
    try:
        # Defining paths for input and converted audio files
        input_audio_path = os.path.join(TEMP_AUDIO_DIR, audio_file.filename)
        converted_audio_path = os.path.join(TEMP_AUDIO_DIR, "converted.wav")

        # Saving the uploaded audio file
        with open(input_audio_path, "wb") as buffer:
            buffer.write(audio_file.file.read())

        # Getting the FFmpeg executable path from imageio
        ffmpeg_path = ffmpeg.get_ffmpeg_exe()

        # Running FFmpeg to convert the audio file to the required format
        subprocess.run(
            [ffmpeg_path, "-y", "-i", input_audio_path, "-ar", "16000", "-ac", "1", converted_audio_path],
            stdout=subprocess.PIPE, stderr=subprocess.PIPE, check=True
        )

        # Loading and transcribing the audio using WhisperX
        audio = whisperx.load_audio(converted_audio_path)
        result = stt_model.transcribe(audio)

        # Combining the transcribed text
        text_output = " ".join([segment["text"] for segment in result.get("segments", [])])
        return {"text": text_output}

    except subprocess.CalledProcessError as e:
        # Raising an HTTP exception if FFmpeg fails
        raise HTTPException(status_code=500, detail=f"FFmpeg Error: {e.stderr.decode()}")
    except Exception as e:
        # Raising an HTTP exception for other errors
        raise HTTPException(status_code=500, detail=f"STT Processing Error: {str(e)}")

# Creating a directory for TTS output files
OUTPUT_DIR = os.path.join(static_dir, "tts")
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Defining a function to generate speech from text
def generate_speech(text: str):
    try:
        if not text.strip():
            raise HTTPException(status_code=422, detail="Text field cannot be empty.")

        filename = f"tts_{uuid.uuid4().hex}.mp3"
        filepath = os.path.join(OUTPUT_DIR, filename)

        tts = gTTS(text)
        tts.save(filepath)

        # Construct full URL for access
        full_url = f"http://127.0.0.1:8000/static/tts/{filename}"  # Adjust if hosted differently

        return JSONResponse(content={"audio_url": full_url})

    except Exception as e:
        print(f"TTS Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"TTS Error: {str(e)}")

# Initializing the FastAPI application
app = FastAPI(title="Sowing Advisory API", version="1.0.0")

# Mounting the static files directory for serving TTS audio files
# Get absolute path for static files
static_dir = os.path.join(os.path.dirname(os.path.abspath(__file__)), "static")
os.makedirs(static_dir, exist_ok=True)
app.mount("/static", StaticFiles(directory=static_dir), name="static")

# Adding CORS middleware to allow cross-origin requests
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allowing all origins (change to your frontend URL if needed)
    allow_credentials=True,
    allow_methods=["*"],  # Allowing all HTTP methods
    allow_headers=["*"],  # Allowing all headers
)

# Defining API routers
chat_router = APIRouter()
query_router = APIRouter()
stt_router = APIRouter()
tts_router = APIRouter()

# Defining Pydantic models for request and response validation
class ChatRequest(BaseModel):
    message: str

class ChatResponse(BaseModel):
    reply: str

# Defining the chat endpoint
@chat_router.post("/", response_model=ChatResponse)
async def get_chat_response(request: ChatRequest):
    return {"reply": generate_gpt_response(request.message)}

# Defining the query endpoint
class QueryRequest(BaseModel):
    query: str

@query_router.post("/")
async def handle_query(request: QueryRequest):
    return {"query": request.query, "answer": generate_gpt_response(request.query)}

# Defining the speech-to-text endpoint
@stt_router.post("/speech-to-text/")
async def speech_to_text(audio: UploadFile = File(...)):
    return convert_speech_to_text(audio)

# Defining the text-to-speech endpoint
@tts_router.post("/text-to-speech/")
async def text_to_speech(request: ChatRequest):
    return generate_speech(request.message)

# Including the routers in the FastAPI application
app.include_router(chat_router, prefix="/chat")
app.include_router(query_router, prefix="/query")
app.include_router(stt_router, prefix="/stt")
app.include_router(tts_router, prefix="/tts")

# Defining the root endpoint
@app.get("/")
async def root():
    return {"message": "Sowing Advisory Backend is Running!"}

@app.get("/healthcheck", status_code=status.HTTP_200_OK)
async def healthcheck():
    return {"status": "healthy"}