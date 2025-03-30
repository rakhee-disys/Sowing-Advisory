import os
import chromadb
from sentence_transformers import SentenceTransformer

# Load the embedding model
embed_model = SentenceTransformer("BAAI/bge-small-en")

# Load the ChromaDB client and collection
chroma_client = chromadb.PersistentClient(path="./chroma_db")
collection = chroma_client.get_collection(name="doc_chunks")

# Function to search for relevant chunks
def search_query(query, top_k=5):
    query_embedding = embed_model.encode(query).tolist()
    results = collection.query(
        query_embeddings=[query_embedding],
        n_results=top_k,
        include=["documents", "metadatas"]
    )

    # Display search results
    for i in range(top_k):
        chunk = results['documents'][0][i]
        metadata = results['metadatas'][0][i]
        print(f"📄 Source Document: {metadata['filename']}, Chunk Index: {metadata['chunk_index']}")
        print(f"📝 Text Chunk: {chunk}\n")

# Example query
user_query = "Best sowing practices for rice in monsoon season in Tamilnadu"
search_query(user_query)
