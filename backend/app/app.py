from flask import Flask, request, jsonify
import os
import fitz  
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import FAISS
from flask_cors import CORS
from transformers import pipeline 
import hashlib  

app = Flask(__name__)
CORS(app)
UPLOAD_FOLDER = "uploads"
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
app.config["UPLOAD_FOLDER"] = UPLOAD_FOLDER

embedding_model = HuggingFaceEmbeddings(model_name="sentence-transformers/all-MiniLM-L6-v2")  

vector_db = None  

SIMILARITY_THRESHOLD = 0.4  

summarizer = pipeline("summarization", model="facebook/bart-large-cnn")  
rephraser = pipeline("text2text-generation", model="t5-small")  
clarity_classifier = pipeline("text-classification", model="distilbert-base-uncased")  

response_cache = {}

def extract_text_from_pdf(pdf_path):
    with fitz.open(pdf_path) as doc:
        return " ".join([page.get_text("text") for page in doc]).strip()
    
def merge_chunks(results, query):
    results = sorted(results, key=lambda x: x[1])  
    merged_text = []
    seen_chunks = set()

    for doc, score in results:
        for sentence in doc.page_content.split(". "):  
            if sentence not in seen_chunks:
                merged_text.append(sentence)
                seen_chunks.add(sentence)

    return ". ".join(merged_text)  

def summarize_passage(passage, parah_length, length="medium"):
    if length == "short":
        max_length = 50
    elif length == "medium":
        max_length = 100
    elif length == "detailed":
        max_length = parah_length

    summary = summarizer(passage, max_length=max_length, min_length=50, do_sample=False)
    return summary[0]["summary_text"]

def rephrase_passage(passage):
    rephrased = rephraser(f"paraphrase: {passage}", max_length=len(passage.split()) + 10)
    return rephrased[0]["generated_text"]

def is_passage_unclear(passage):
    result = clarity_classifier(passage)
    return result[0]["label"] == "unclear"

def cache_response(query, summary_length, response):
    query_hash = hashlib.md5(f"{query}_{summary_length}".encode()).hexdigest()
    response_cache[query_hash] = response

def get_cached_response(query, summary_length):
    query_hash = hashlib.md5(f"{query}_{summary_length}".encode()).hexdigest()
    return response_cache.get(query_hash)

@app.route("/upload", methods=["POST"])
def upload_pdf():
    global vector_db  

    file = request.files.get("file")
    if not file or not file.filename.lower().endswith(".pdf"):
        return jsonify({"error": "Invalid file. Only PDF allowed"}), 400

    filepath = os.path.join(app.config["UPLOAD_FOLDER"], file.filename)
    file.save(filepath)

    extracted_text = extract_text_from_pdf(filepath)
    text_splitter = RecursiveCharacterTextSplitter(chunk_size=300, chunk_overlap=100)  
    docs = text_splitter.split_text(extracted_text)

    docs_with_metadata = [
        {"page_content": doc, "metadata": {"chunk_index": i}} for i, doc in enumerate(docs)
    ]

    vector_db = FAISS.from_texts(
        [doc["page_content"] for doc in docs_with_metadata],
        embedding_model,
        metadatas=[doc["metadata"] for doc in docs_with_metadata],
        normalize_L2=True
    )  

    return jsonify({"message": "PDF uploaded and indexed successfully", "total_chunks": len(docs)})

@app.route("/search", methods=["POST"])
def search_query():
    global vector_db  
    if vector_db is None:
        return jsonify({"summary": "No indexed data available. Upload PDF first", "err_code":"ERR"}), 200

    data = request.get_json()
    query = data.get("query", "").strip()
    summary_length = data.get("summary_length", "short")  

    if not query:
        return jsonify({"error": "Query required"}), 400

    cached_response = get_cached_response(query,summary_length)
    if cached_response:
        return jsonify(cached_response)

    results = vector_db.similarity_search_with_score(query, k=3)  

    valid_results = [(doc, score) for doc, score in results if SIMILARITY_THRESHOLD <= score <= 1.0]

    if not valid_results:
        return jsonify({"query": query, "summary": "Query rejected due to low similarity. Please try a different query.", "err_code": "ERR"}), 200

    merged_passage = merge_chunks(valid_results, query)

    if not is_passage_unclear(merged_passage) and len(merged_passage.split()) < 120:
        response = {
            "query": query,
            "matched_text": merged_passage,
            "similarity_score": float(valid_results[0][1]), 
            "err_code": ""
        }
        cache_response(query,summary_length, response)
        return jsonify(response)

    if is_passage_unclear(merged_passage):
        merged_passage = rephrase_passage(merged_passage)

    if len(merged_passage.split()) >= 120:
        parah_length = len(merged_passage.split())
        merged_passage = summarize_passage(merged_passage, parah_length,length=summary_length)

    response = {
        "query": query,
        "matched_text": merged_passage,
        "similarity_score": float(valid_results[0][1]), 
        "err_code": ""
    }

    cache_response(query,summary_length, response)

    return jsonify(response)

if __name__ == "__main__":
    app.run(debug=True)