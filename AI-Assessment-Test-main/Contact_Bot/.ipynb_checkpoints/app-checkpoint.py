from flask import Flask, render_template, request, jsonify
import csv
import os
import re

app = Flask(__name__)

CONTACT_FILE = os.path.join("data", "contacts.csv")

user_states = {}

# Dramatic and funny chatbot responses
qa_pairs = {
    "how are you": "I'm doing great! Just recharged with some electrons. How about you?",
    "who are you": "I'm Ourahhh — your smart, stylish AI assistant.",
    "what is your name": "Ourahhh! Yes, I’ve got a flair for the dramatic!",
    "nice name": "Thank you! I was named by a star.",
    "how to enroll": "Ah, you seek wisdom! Let's get started. May I have your name?",
    "i want to enroll": "Absolutely! Let’s start with your name.",
    "how to contact you": "Just share your contact details and I’ll beam them up.",
    "contact": "I can help you with that! What’s your name?",
    "working hours": "From 9 AM to 6 PM, Monday to Friday — but I never sleep.",
    "location": "Based in Hyderabad, but my mind floats in the cloud.",
    "hello": "Hey there! You look great today. What can I do for you?",
    "hi": "Hi,hi! Ask me anything!",
    "thank you": "You're most welcome, noble soul!",
    "thanks": "No problem, my pleasure!",
    "bye": "Goodbye! May your Wi-Fi always be strong.",
    "help": "I’m here to assist — ask away!",
    "are you real": "Real enough to answer your questions and steal your chips.",
    "do you have feelings": "I feel... binary emotions. Like love and 0110.",
    "joke": "Why did the computer show up late to work? It had a hard drive!",
    "what can you do": "I answer questions, collect contact info, and make you smile.",
    "tell me something": "Be yourself. Unless you’re a bug in the code.",
    "sing a song": "010101010101~ This is my digital melody ~010101010101",
    "what’s the meaning of life": "Success with failure",
    "Thankyou": "your welcome"
}

def is_valid_email(email):
    return re.match(r"[^@]+@[^@]+\.[^@]+", email)

@app.route("/")
def index():
    return render_template("index.html")
@app.route("/chat", methods=["POST"])
def chat():
    user_input = request.json.get("message", "").lower()
    user_id = request.remote_addr  # simplistic user session
    user_state = user_states.get(user_id, {"step": None, "data": {}})

    # Reset flow if user says 'new chat', 'start over', or 'clear chat'
    if any(keyword in user_input for keyword in ["new chat", "start over", "clear chat", "reset"]):
        user_states[user_id] = {"step": None, "data": {}}
        return jsonify({"reply": "Alright! Let's start fresh. You can say 'I want to enroll' or ask me anything."})

    # Contact detail steps
    if user_state["step"] == "name":
        user_state["data"]["name"] = user_input
        user_state["step"] = "email"
        user_states[user_id] = user_state
        return jsonify({"reply": "Thanks! Now, can you give me your email address?"})

    elif user_state["step"] == "email":
        if is_valid_email(user_input):
            user_state["data"]["email"] = user_input
            user_state["step"] = "message"
            user_states[user_id] = user_state
            return jsonify({"reply": "Awesome! Finally, what message would you like to send us?"})
        else:
            return jsonify({"reply": "Hmm, that doesn't look like a valid email. Can you try again?"})

    elif user_state["step"] == "message":
        user_state["data"]["message"] = user_input
        with open(CONTACT_FILE, "a", newline="") as f:
            writer = csv.writer(f)
            writer.writerow([
                user_state["data"]["name"],
                user_state["data"]["email"],
                user_state["data"]["message"]
            ])
        user_states.pop(user_id, None)
        return jsonify({"reply": "Thank you! Your message has been received and saved. Our team will reach out to you soon."})

    # Trigger contact flow
    contact_triggers = ["enroll", "talk", "contact", "message", "reach", "want to join"]
    if any(trigger in user_input for trigger in contact_triggers):
        user_states[user_id] = {"step": "name", "data": {}}
        return jsonify({"reply": "Sure! Let's get started. What's your name?"})

    # General responses
    for question, answer in qa_pairs.items():
        if question in user_input:
            return jsonify({"reply": answer})

    # Fallback
    return jsonify({"reply": "I'm your friendly AI assistant. Ask me anything or say 'I want to contact' to get started."})


if __name__ == "__main__":
    os.makedirs("data", exist_ok=True)
    if not os.path.exists(CONTACT_FILE):
        with open(CONTACT_FILE, "w", newline="") as f:
            writer = csv.writer(f)
            writer.writerow(["Name", "Email", "Message"])
    app.run(debug=True)