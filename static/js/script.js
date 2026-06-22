const assistantPanel = document.getElementById("assistantPanel");
const avatarBtn = document.getElementById("avatarBtn");
const mainAvatar = document.getElementById("mainAvatar");
const voiceBtn = document.getElementById("voiceBtn");
const voiceBtnText = document.getElementById("voiceBtnText");
const statusText = document.getElementById("status");

const assistantTitle = document.getElementById("assistantTitle");
const assistantMessage = document.getElementById("assistantMessage");

const avatarStates = [
  "avatar-idle",
  "avatar-listening",
  "avatar-thinking",
  "avatar-talking",
  "avatar-pointing",
  "avatar-greeting",
];
const welcomeMessage = "Hi, welcome to Ravali’s portfolio. How can I help you?";

const sectionNarration = {
  experience: "Showing Ravali's experience section. She has experience in software development, data engineering, cloud, APIs, and full stack applications.",
  projects: "Showing Ravali's projects section. Here you can explore AI, web apps, cloud, and automation projects.",
  skills: "Showing Ravali's skills section. Her skills include Python, Java, JavaScript, React, Flask, SQL, AWS, APIs, HTML, CSS, and AI tools.",
  contact: "Showing Ravali's contact section. You can contact her through email, LinkedIn, or GitHub.",
};

const commands = [
  { id: "experience", phrases: ["show experience", "experience", "work history"] },
  { id: "projects", phrases: ["show projects", "projects", "projects"] },
  { id: "skills", phrases: ["show skills", "skills", "technical skills"] },
  { id: "contact", phrases: ["contact information", "show contact", "contact information"] },
];

let recognition;
let currentState = "idle";
let thinkingTimer;

function setAvatarState(state) {
  currentState = state;
  avatarStates.forEach((className) => mainAvatar.classList.remove(className));
  mainAvatar.classList.add(`avatar-${state}`);
  assistantPanel.dataset.state = state;
}

function updateAssistant(title, message, status) {
  assistantTitle.textContent = title;
  assistantMessage.textContent = message;
  statusText.textContent = status;
}

function speak(text, onEnd) {
  if (!("speechSynthesis" in window)) {
    if (onEnd) onEnd();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1.05;
  utterance.volume = 1;
  utterance.onstart = () => setAvatarState("talking");
  utterance.onend = () => {
    setAvatarState("idle");
    if (onEnd) onEnd();
  };
  utterance.onerror = utterance.onend;
  window.speechSynthesis.speak(utterance);
}

function setActiveSection(sectionId) {
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.toggle("active", section.id === sectionId);
  });
}
function scrollToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;
  setActiveSection(sectionId);
  section.scrollIntoView({ behavior: "smooth", block: "start" });
}

function findCommand(transcript) {
  const normalized = transcript.toLowerCase();
  return commands.find((command) => command.phrases.some((phrase) => normalized.includes(phrase)));
}

function pointToSection(sectionId) {
  const section = document.getElementById(sectionId);
  if (!section) return;

  const sectionTop = section.offsetTop;
  const maxTop = Math.max(24, window.innerHeight - assistantPanel.offsetHeight - 24);
  assistantPanel.style.top = `${Math.min(Math.max(24, sectionTop + 80 - window.scrollY), maxTop)}px`;
  setAvatarState("pointing");
}

function navigateToSection(sectionId) {
  const label = document.getElementById(sectionId)?.dataset.sectionTitle || sectionId;
  setAvatarState("thinking");
  updateAssistant("Thinking...", `I heard ${label}. Give me one second.`, "Thinking...");

  window.clearTimeout(thinkingTimer);
  thinkingTimer = window.setTimeout(() => {
    scrollToSection(sectionId);
    window.setTimeout(() => pointToSection(sectionId), 350);
    updateAssistant(label, "Here is the section you asked for.", `Showing ${label}.`);
    speak(sectionNarration[sectionId]);
  }, 1000);
}
function handleTranscript(transcript) {
  updateAssistant("You said:", transcript, "Thinking...");
  const command = findCommand(transcript);

  if (command) {
    navigateToSection(command.id);
    return;
  }

  setAvatarState("thinking");
  window.setTimeout(() => {
    updateAssistant("Try again", "Say show experience, show projects, show skills, or contact.", "Command not recognized.");
    speak("Sorry, I did not understand. You can say show experience, show projects, show skills, or contact.");
  }, 1000);
}

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    updateAssistant("Voice unavailable", "Speech recognition works best in Chrome or Edge.", "Voice recognition is not supported in this browser.");
    speak("Voice recognition is not supported in this browser. Please use Chrome or Edge.");
    return;
  }

  window.speechSynthesis?.cancel();
  recognition?.abort();

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onstart = () => {
    setAvatarState("listening");
    voiceBtn.disabled = true;
    voiceBtnText.textContent = "Listening...";
    updateAssistant("I’m listening...", "Tell me where you want to go.", "Listening...");
  };

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    handleTranscript(transcript);
  };

  recognition.onerror = () => {
    setAvatarState("idle");
    updateAssistant("Please try again", "I had trouble hearing that command.", "Voice error. Please try again.");
  };

  recognition.onend = () => {
    voiceBtn.disabled = false;
    voiceBtnText.textContent = "Click microphone";
    if (currentState === "listening") setAvatarState("idle");
  };

  recognition.start();
}
function greet() {
  setAvatarState("greeting");
  updateAssistant("Hi! 👋", "Ask me to show experience, projects, skills, or contact.", welcomeMessage);
  speak(welcomeMessage);
}

function goHome() {
  window.speechSynthesis?.cancel();
  scrollToSection("home");
  setAvatarState("greeting");
  updateAssistant("Welcome back", "What would you like to explore next?", "Ready for your command.");
  window.setTimeout(() => setAvatarState("idle"), 1300);

}
window.goHome = goHome;

avatarBtn.addEventListener("click", greet);
voiceBtn.addEventListener("click", startListening);
window.addEventListener("beforeunload", () => {
  recognition?.abort();
  window.speechSynthesis?.cancel();
});
window.addEventListener("scroll", () => {
  if (currentState === "pointing") assistantPanel.style.top = "";
}, { passive: true });

window.addEventListener("load", () => {
  setAvatarState("greeting");
  window.setTimeout(greet, 650);
});

