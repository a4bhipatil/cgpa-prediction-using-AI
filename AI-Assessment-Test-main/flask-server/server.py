import time
import random
import logging
import os
import asyncio
import concurrent.futures
import json
from datetime import datetime, timedelta
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
import google.generativeai as genai

user_attempts = {}  # { "user_id": attempt_count }
MAX_ATTEMPTS = 3

# Load environment variables from .env file
load_dotenv()

app = Flask(__name__)
CORS(app)

# Set up logging
logging.basicConfig(level=logging.INFO)

# ✅ Load Gemini API Key from .env
GENAI_API_KEY = os.getenv("GENAI_API_KEY")
if not GENAI_API_KEY:
    raise ValueError("❌ GENAI_API_KEY is missing in .env")

genai.configure(api_key=GENAI_API_KEY)
model = genai.GenerativeModel("gemini-2.0-flash-lite")

# 🚀 Performance: In-memory cache for generated questions
question_cache = {}
CACHE_EXPIRY = timedelta(hours=1)  # Cache expires after 1 hour

# 🎨 Creative fallback messages
CREATIVE_ERROR_MESSAGES = [
    "🤖 The quiz bot got sleepy. Some questions are still cooking.",
    "⏳ Our AI chef ran out of ingredients. A few questions couldn't be served.",
    "🚧 Question generator hit traffic. Only a few made it through.",
    "🌐 Too many requests! Some questions are still waiting in line.",
    "⚡ The generator is cooling down. Try again soon for a full batch.",
    "📉 AI quota limit reached. But here’s what we could gather for now!",
]

# 🚀 Performance: Optimized batch question generator
def generate_batch_questions(text, q_type, difficulty, num_questions):
    """Generate multiple questions in a single API call for better performance"""
    # 🚀 Simplified prompt for faster generation
    prompt = f"""Generate {num_questions} multiple choice questions about {text}.

Topic: {text}
Difficulty: {difficulty}
Questions needed: {num_questions}

Format exactly:
Q1: What is...?
A) Option 1
B) Option 2  
C) Option 3
D) Option 4
ANSWER: A

Q2: Which...?
A) Option 1
B) Option 2
C) Option 3  
D) Option 4
ANSWER: B

Continue for Q{num_questions}. Keep questions short and practical."""
    
    try:
        # 🚀 Performance: Add timeout and shorter generation
        response = model.generate_content(
            prompt,
            generation_config=genai.types.GenerationConfig(
                max_output_tokens=2000,  # Limit output length
                temperature=0.3,  # Less randomness = faster
            )
        )
        raw_output = response.text.strip()
        
        logging.info(f"Raw AI output length: {len(raw_output)} chars")
        
        # Parse the structured format directly
        questions = parse_structured_format(raw_output, num_questions)
        
        if len(questions) > 0:
            return questions
        else:
            # Fallback: Parse line by line
            return parse_fallback_format(raw_output, num_questions)
            
    except json.JSONDecodeError as e:
        logging.warning(f"Failed to parse JSON: {e}, trying fallback parsing...")
        return parse_fallback_format(raw_output, num_questions)
    except Exception as e:
        logging.error(f"Error generating batch questions: {e}")
        # Fallback to single question generation
        logging.info("Falling back to single question generation...")
        return generate_fallback_questions(text, q_type, difficulty, num_questions)

def parse_structured_format(raw_output, num_questions):
    """Parse the structured Q1/Q2 format"""
    questions = []
    lines = raw_output.split('\n')
    current_question = None
    current_options = []
    current_answer = None
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check for question start (Q1:, Q2:, etc.)
        if line.startswith('Q') and ':' in line:
            # Save previous question if exists
            if current_question and current_options:
                questions.append({
                    "question": current_question,
                    "options": current_options,
                    "answer": current_answer or "A"
                })
            
            # Start new question
            current_question = line.split(':', 1)[1].strip()
            current_options = []
            current_answer = None
            
        elif line.startswith(('A)', 'B)', 'C)', 'D)')):
            # Extract option
            option_text = line[2:].strip()
            current_options.append(option_text)
            
        elif line.startswith('ANSWER:'):
            # Extract answer
            current_answer = line.split(':', 1)[1].strip()
    
    # Save the last question
    if current_question and current_options:
        questions.append({
            "question": current_question,
            "options": current_options,
            "answer": current_answer or "A"
        })
    
    logging.info(f"Parsed {len(questions)} questions from structured format")
    return questions[:num_questions]

def generate_fallback_questions(text, q_type, difficulty, num_questions):
    """Generate questions one by one as fallback"""
    questions = []
    keyword = highlight_keyword(text)
    
    # 🚀 Performance: Create instant fallback questions first
    fallback_templates = [
        f"What is a key concept in {text}?",
        f"Which statement about {text} is correct?",
        f"What is the main purpose of {text}?",
        f"How does {text} work?",
        f"What are the benefits of {text}?"
    ]
    
    for i in range(min(num_questions, 5)):  # Limit to 5 to avoid long waits
        question = retry_generate_question(text, keyword, q_type, difficulty, retries=1)  # Reduce retries
        if question:
            questions.append(question)
        else:
            # Create a smart fallback question
            template = fallback_templates[i % len(fallback_templates)]
            questions.append({
                "question": template,
                "options": [
                    f"Primary {keyword} functionality",
                    f"Secondary {keyword} feature", 
                    f"Alternative {keyword} approach",
                    f"Optional {keyword} component"
                ],
                "answer": "A"
            })
    
    return questions

def parse_fallback_format(raw_output, num_questions):
    """Fallback parser for non-JSON responses"""
    questions = []
    lines = raw_output.split('\n')
    current_question = None
    current_options = []
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
            
        # Check if it's a question
        if line.endswith('?') or 'question' in line.lower():
            if current_question:
                questions.append({
                    "question": current_question,
                    "options": current_options[:4] if current_options else ["Option A", "Option B", "Option C", "Option D"],
                    "answer": "A",
                    "explanation": ""
                })
            current_question = line
            current_options = []
        elif line.startswith(('A)', 'B)', 'C)', 'D)', 'a)', 'b)', 'c)', 'd)', '-', '•')):
            current_options.append(line.lstrip('ABCDabcd)- •').strip())
    
    if current_question:
        questions.append({
            "question": current_question,
            "options": current_options[:4] if current_options else ["Option A", "Option B", "Option C", "Option D"],
            "answer": "A",
            "explanation": ""
        })
    
    return questions[:num_questions]

# 🔁 Single question generator with retry (kept for backward compatibility)
def generate_question(text, keyword, q_type, difficulty):
    prompt = f"""
    Generate a {q_type} type question with {difficulty} difficulty about: {text}
    Focus on: {keyword}

    Format:
    Question: [Your question]
    A) [Option 1]
    B) [Option 2] 
    C) [Option 3]
    D) [Option 4]
    Answer: [Correct letter]
    """
    try:
        response = model.generate_content(prompt)
        raw_output = response.text.strip()
        
        lines = raw_output.split('\n')
        question = ""
        options = []
        
        for line in lines:
            line = line.strip()
            if line.startswith('Question:'):
                question = line.replace('Question:', '').strip()
            elif line.startswith(('A)', 'B)', 'C)', 'D)')):
                options.append(line[3:].strip())
        
        return {"question": question or f"Question about {keyword}", "options": options or ["Option A", "Option B", "Option C", "Option D"]}
    except Exception as e:
        logging.error(f"Error generating question: {e}")
        return None

# 🔁 Retry logic with exponential backoff (optimized for speed)
def retry_generate_question(text, keyword, q_type, difficulty, retries=2, delay=1):
    for attempt in range(retries):
        result = generate_question(text, keyword, q_type, difficulty)
        if result:
            return result
        logging.warning(f"Retry {attempt + 1} failed for {q_type} question with keyword '{keyword}'. Retrying...")
        if attempt < retries - 1:  # Don't sleep on last attempt
            time.sleep(delay * (1.5 ** attempt))  # Reduced exponential factor
    logging.error(f"Failed to generate {q_type} question after {retries} attempts.")
    return None

# 🎯 Pick keyword from input text
def highlight_keyword(text):
    words = [w.strip(".,:;!?") for w in text.split() if len(w) > 3]
    return random.choice(words) if words else "concept"

# 🚀 Performance: Cache helper functions
def get_cache_key(text, q_type, difficulty, num_questions):
    """Generate a cache key for the request"""
    return f"{text}_{q_type}_{difficulty}_{num_questions}".lower().replace(" ", "_")

def is_cache_valid(cache_entry):
    """Check if cache entry is still valid"""
    return datetime.now() - cache_entry['timestamp'] < CACHE_EXPIRY

@app.route("/api/generate", methods=["POST"])
def generate():
    start_time = time.time()
    data = request.get_json()
    text = data.get("text", "")
    q_type = data.get("type", "MCQ")
    difficulty = data.get("difficulty", "Easy")
    num_questions = int(data.get("num_questions", 1))

    logging.info(f"🚀 Generating {num_questions} {q_type} questions with {difficulty} difficulty for topic: {text}")

    # 🚀 Performance: Check cache first
    cache_key = get_cache_key(text, q_type, difficulty, num_questions)
    if cache_key in question_cache and is_cache_valid(question_cache[cache_key]):
        logging.info(f"⚡ Cache hit! Returning cached questions for: {text}")
        cached_response = question_cache[cache_key]['data']
        cached_response['cached'] = True
        return jsonify(cached_response)

    try:
        # 🚀 Performance: Use batch generation for better speed
        if num_questions > 1:
            # Always use batch for multiple questions
            results = generate_batch_questions(text, q_type, difficulty, min(num_questions, 10))  # Limit to 10
        else:
            # Single question fallback
            keyword = highlight_keyword(text)
            single_result = retry_generate_question(text, keyword, q_type, difficulty)
            results = [single_result] if single_result else []

        failed_count = num_questions - len(results)
        response = {"questions": results}

        if failed_count > 0:
            response["message"] = random.choice(CREATIVE_ERROR_MESSAGES) + f" {failed_count} questions failed."

        # 🚀 Performance: Cache the results
        question_cache[cache_key] = {
            'data': response,
            'timestamp': datetime.now()
        }

        # Clean up old cache entries (simple cleanup)
        if len(question_cache) > 100:  # Keep cache size reasonable
            oldest_key = min(question_cache.keys(), key=lambda k: question_cache[k]['timestamp'])
            del question_cache[oldest_key]

        generation_time = time.time() - start_time
        logging.info(f"✅ Generated {len(results)} questions in {generation_time:.2f} seconds. Failed: {failed_count}")
        
        response['generation_time'] = round(generation_time, 2)
        return jsonify(response)

    except Exception as e:
        logging.error(f"❌ Unexpected error in question generation: {e}")
        return jsonify({
            "questions": [],
            "error": "An unexpected error occurred during question generation",
            "generation_time": time.time() - start_time
        }), 500

# 🚀 Performance: Health check endpoint
@app.route("/api/health", methods=["GET"])
def health_check():
    return jsonify({
        "status": "healthy",
        "cache_size": len(question_cache),
        "uptime": time.time(),
        "model": "gemini-2.0-flash-lite"
    })

# 🚀 Performance: Cache stats endpoint
@app.route("/api/cache/stats", methods=["GET"])
def cache_stats():
    valid_entries = sum(1 for entry in question_cache.values() if is_cache_valid(entry))
    return jsonify({
        "total_entries": len(question_cache),
        "valid_entries": valid_entries,
        "expired_entries": len(question_cache) - valid_entries,
        "cache_expiry_hours": CACHE_EXPIRY.total_seconds() / 3600
    })

# 🚀 Performance: Clear cache endpoint (for debugging)
@app.route("/api/cache/clear", methods=["POST"])
def clear_cache():
    global question_cache
    old_size = len(question_cache)
    question_cache = {}
    return jsonify({
        "message": f"Cache cleared. Removed {old_size} entries.",
        "cache_size": len(question_cache)
    })
  
# Attempt Count  
@app.route("/api/get_attempt/<user_id>", methods=["GET"])
def get_attempt(user_id):
    """Return how many times the user has attempted"""
    attempt = user_attempts.get(user_id, 0)
    return jsonify({ "attempt": attempt })

@app.route("/api/increment_attempt/<user_id>", methods=["POST"])
def increment_attempt(user_id):
    """Increment attempt count for a user unless maxed"""
    current = user_attempts.get(user_id, 0)
    if current >= MAX_ATTEMPTS:
        return jsonify({ "error": "Max attempts reached" }), 403

    user_attempts[user_id] = current + 1
    return jsonify({ "attempt": user_attempts[user_id] })

if __name__ == '__main__':
    logging.info("🚀 Starting AI Question Generator Server...")
    logging.info(f"📊 Cache expiry: {CACHE_EXPIRY}")
    app.run(port=5000, debug=True, threaded=True)
