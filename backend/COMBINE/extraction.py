import os
from docling.document_converter import DocumentConverter
import chromadb
from nltk.tokenize import sent_tokenize
from sentence_transformers import SentenceTransformer
from dotenv import load_dotenv
from pathlib import Path

load_dotenv()

embed_model = SentenceTransformer("BAAI/bge-small-en")
MAX_TOKENS = 50  

BASE_DIR = Path(__file__).resolve().parent

pdf_folder = BASE_DIR / "COMBINE"
output_folder = pdf_folder / "md_files"

os.makedirs(output_folder, exist_ok=True)

pdf_files = [f for f in os.listdir(pdf_folder) if f.endswith(".pdf")]

converter = DocumentConverter()

chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_or_create_collection(name="doc_chunks")

def chunk_text(text, max_tokens=MAX_TOKENS):
    sentences = sent_tokenize(text)
    chunks, current_chunk, current_length = [], [], 0

    for sentence in sentences:
        sentence_length = len(sentence.split())

        if current_length + sentence_length > max_tokens:
            chunks.append(" ".join(current_chunk))
            current_chunk, current_length = [sentence], sentence_length
        else:
            current_chunk.append(sentence)
            current_length += sentence_length

    if current_chunk:
        chunks.append(" ".join(current_chunk))

    return chunks

for pdf_file in pdf_files:
    pdf_path = os.path.join(pdf_folder, pdf_file)
    result = converter.convert(pdf_path)

    document = result.document
    markdown_output = document.export_to_markdown()

    output_file = os.path.join(output_folder, pdf_file.replace(".pdf", ".md"))
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(markdown_output)

    with open(output_file, "r", encoding="utf-8") as f:
        document_text = f.read()

    chunks = chunk_text(document_text)

    for idx, chunk in enumerate(chunks):
        embedding = embed_model.encode(chunk).tolist()
        collection.add(
            ids=[f"{pdf_file}_{idx}"],
            embeddings=[embedding],
            documents=[chunk],
            metadatas=[{"filename": pdf_file, "chunk_index": idx}]
        )

    print(f"✅ Successfully processed {pdf_file} with {len(chunks)} chunks.")

print(f"✅ Successfully stored text segments from {len(pdf_files)} PDFs in ChromaDB!")
