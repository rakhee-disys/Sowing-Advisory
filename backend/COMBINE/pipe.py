import sys
import json
from openai import AzureOpenAI
from dotenv import load_dotenv
import os

# ✅ Load environment variables
load_dotenv()

AZURE_OPENAI_ENDPOINT = os.getenv("AZURE_OPENAI_ENDPOINT")
AZURE_OPENAI_DEPLOYMENT = os.getenv("AZURE_OPENAI_DEPLOYMENT")
AZURE_OPENAI_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_OPENAI_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2024-05-01-preview")

if not all([AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT, AZURE_OPENAI_API_KEY]):
    print(json.dumps({"error": "❌ Missing Azure OpenAI credentials in .env file."}))
    sys.exit(1)

# ✅ Read command-line arguments
if len(sys.argv) < 3:
    print(json.dumps({"error": "❌ Missing query and context parameters."}))
    sys.exit(1)

query_text = sys.argv[1]
context = sys.argv[2]

# ✅ Initialize OpenAI Client
client = AzureOpenAI(
    api_key=AZURE_OPENAI_API_KEY,
    api_version=AZURE_OPENAI_API_VERSION,
    azure_endpoint=AZURE_OPENAI_ENDPOINT
)

# ✅ Define the GPT-4o Prompt
messages = [
    {"role": "system", "content": "You are a highly knowledgeable assistant specializing in agriculture."},
    {"role": "user", "content": f"Context: {context}\n\nQuery: {query_text}"}
]

# ✅ Call OpenAI API
try:
    response = client.chat.completions.create(
        model=AZURE_OPENAI_DEPLOYMENT,
        messages=messages,
        temperature=0.7,
        max_tokens=300
    )

    gpt4o_answer = response.choices[0].message.content.strip()
    print(json.dumps({"answer": gpt4o_answer}))  # ✅ Output JSON format for `main.py`

except Exception as e:
    print(json.dumps({"error": str(e)}))
    sys.exit(1)
