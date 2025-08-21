const chatBox = document.getElementById("chat-box");
const input = document.getElementById("user-input");

function appendMessage(content, type) {
    const msg = document.createElement("div");
    msg.className = type === "bot" ? "bot-msg" : "user-msg";
    msg.innerText = content;
    chatBox.appendChild(msg);
    chatBox.scrollTop = chatBox.scrollHeight;
}

function sendMessage() {
    const userMsg = input.value.trim();
    if (!userMsg) return;

    appendMessage(userMsg, "user");
    input.value = "";

    fetch("/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMsg })
    })
    .then(res => res.json())
    .then(data => {
        appendMessage(data.reply, "bot");
        speak(data.reply);
    });
}

function speak(text) {
    if ('speechSynthesis' in window) {
        const speech = new SpeechSynthesisUtterance(text);
        speechSynthesis.speak(speech);
    }
}

function startVoice() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
        alert("Voice input only works on Chrome.");
        return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.start();

    recognition.onresult = function (event) {
        const voiceText = event.results[0][0].transcript;
        input.value = voiceText;
        sendMessage();
    };
}