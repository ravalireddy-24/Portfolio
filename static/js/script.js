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
  "avatar-greeting",
  "avatar-listening",
  "avatar-thinking",
  "avatar-talking",
  "avatar-pointing",
];
const welcomeMessage = "Hi, welcome to Ravali’s portfolio. How can I help you today?";

const sectionNarration = {
  experience: "Here is Ravali's experience section. She has experience in software development, data engineering, cloud, APIs, and full stack applications.",
  projects: "Here are Ravali's projects, including AI, web apps, cloud, and automation projects.",
  skills: "Here are Ravali's skills, including Python, Java, JavaScript, React, Flask, SQL, AWS, APIs, HTML, CSS, and AI tools.",
  contact: "Here is Ravali's contact section. You can contact her through email, LinkedIn, or GitHub.",
  resume: "Here is Ravali's resume section, where you can review education, experience, projects, and technical strengths in one place.",
};

const commands = [
  { id: "experience", phrases: ["experience", "work", "work history", "job", "career"] },
  { id: "projects", phrases: ["projects", "portfolio projects", "apps", "applications"] },
  { id: "skills", phrases: ["skills", "technical skills", "technologies", "tools"] },
  { id: "contact", phrases: ["contact", "email", "linkedin", "github", "reach"] },
  { id: "resume", phrases: ["resume", "résumé", "cv", "curriculum vitae"] },
];

let recognition;
let currentState = "idle";
let thinkingTimer;
let highlightTimer;
let hasGreeted = false;

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

function highlightSection(sectionId) {
  window.clearTimeout(highlightTimer);
  document.querySelectorAll(".section").forEach((section) => section.classList.remove("section-highlight"));
  const section = document.getElementById(sectionId);
  if (!section) return;
  section.classList.add("section-highlight");
  highlightTimer = window.setTimeout(() => section.classList.remove("section-highlight"), 3500);
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

const targetTop = section.getBoundingClientRect().top + 80;
  const maxTop = Math.max(24, window.innerHeight - assistantPanel.offsetHeight - 24);
  assistantPanel.style.top = `${Math.min(Math.max(24, targetTop), maxTop)}px`;
  assistantPanel.style.bottom = "auto";
  setAvatarState("pointing");
    highlightSection(sectionId);
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
    updateAssistant("Try again", "Say experience, projects, skills, contact, or resume.", "Command not recognized.");
    speak("Sorry, I did not understand. You can say experience, projects, skills, contact, or resume.");
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
    hasGreeted = true;
  setAvatarState("greeting");
  updateAssistant("Hi! 👋", "Ask me to show experience, projects, skills, resume, or contact.", welcomeMessage);
  speak(welcomeMessage);
}

function goHome() {
  window.speechSynthesis?.cancel();
    assistantPanel.style.top = "";
  assistantPanel.style.bottom = "";
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
  if (currentState === "pointing") {
    assistantPanel.style.top = "";
    assistantPanel.style.bottom = "";
  }
}, { passive: true });

window.addEventListener("load", () => {
  setAvatarState("greeting");
  window.setTimeout(() => {
    if (!hasGreeted) greet();
  }, 650);
});

