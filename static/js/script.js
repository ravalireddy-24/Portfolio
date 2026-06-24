const assistantPanel = document.getElementById("assistantPanel");
const avatarBtn = document.getElementById("avatarBtn");
const cartoonAvatar = document.getElementById("cartoonAvatar");
const mouth = document.getElementById("mouth");
const voiceBtn = document.getElementById("voiceBtn");
const voiceBtnText = document.getElementById("voiceBtnText");
const statusText = document.getElementById("status");

const assistantTitle = document.getElementById("assistantTitle");
const assistantMessage = document.getElementById("assistantMessage");

const welcomeMessage = "Welcome to Ravali’s portfolio. I can show experience, projects, skills, resume, or contact details.";
const mouthShapes = ["mouth-open-a", "mouth-open-b", "mouth-closed", "mouth-open-c", "mouth-open-b", "mouth-closed"];
const sectionNarration = {
  experience: "Here is Ravali's experience section. She builds full stack software, data engineering workflows, cloud services, APIs, and automation.",
  projects: "Here are Ravali's projects, including AI features, web applications, cloud integrations, dashboards, and automation projects.",
  skills: "Here are Ravali's skills, including Python, Java, JavaScript, React, Flask, SQL, AWS, APIs, HTML, CSS, and AI tools.",
  contact: "Here is Ravali's contact section. You can connect with her through email, LinkedIn, or GitHub.",
  resume: "Here is Ravali's resume section, with education, experience, projects, and technical strengths in one place."
};

const commands = [
  { id: "experience", phrases: ["show experience", "experience", "work", "work history", "career"] },
  { id: "projects", phrases: ["show projects", "projects", "apps", "applications"] },
  { id: "skills", phrases: ["show skills", "skills", "technologies", "tools"] },
  { id: "contact", phrases: ["contact", "email", "linkedin", "github", "reach"] },
  { id: "resume", phrases: ["resume", "résumé", "cv", "curriculum vitae"] }
];

let recognition;
let currentState = "idle";
let lipTimer;
let thinkingTimer;
let highlightTimer;
let hasGreeted = false;

function setAvatarState(state) {
  currentState = state;
  const stateClasses = [
    "avatar-idle",
    "avatar-listening",
    "avatar-thinking",
    "avatar-talking",
    "avatar-greeting",
    "avatar-pointing"
  ];

  cartoonAvatar.classList.remove(...stateClasses);
  cartoonAvatar.classList.add(`avatar-${state}`);
  assistantPanel.dataset.state = state;
}
function setMouthShape(shape) {
  mouth.classList.remove("mouth-smile", "mouth-open-a", "mouth-open-b", "mouth-open-c", "mouth-closed");
  mouth.classList.add(shape);
  const openShape = mouth.querySelector(".mouth-open");
  const smileLine = mouth.querySelector(".mouth-shape");
  if (!openShape || !smileLine) return;

  const shapes = {
    "mouth-open-a": { rx: 10, ry: 9, cy: 176, smile: "M146 170c10 9 26 9 36 0" },
    "mouth-open-b": { rx: 17, ry: 6, cy: 175, smile: "M144 170c12 7 30 7 42 0" },
    "mouth-open-c": { rx: 13, ry: 13, cy: 178, smile: "M147 169c9 11 25 11 34 0" },
    "mouth-closed": { rx: 14, ry: 2, cy: 174, smile: "M145 171c10 6 27 6 38 0" },
    "mouth-smile": { rx: 15, ry: 4, cy: 174, smile: "M140 170c12 15 35 15 47 0" }
  };
function updateAssistant(title, message, status) {
  assistantTitle.textContent = title;
  assistantMessage.textContent = message;
  statusText.textContent = status;
}

function speak(text, onEnd) {
  if (!("speechSynthesis" in window)) {
    onEnd?.();
    return;
  }

  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 1;
  utterance.pitch = 1.08;
  utterance.volume = 1;
  utterance.onstart = () => {
    setAvatarState("talking");
  };
    utterance.onend = () => {
    setAvatarState("idle");
    onEnd?.();
  };
  utterance.onerror = utterance.onend;
  window.speechSynthesis.speak(utterance);
}

function setActiveSection(sectionId) {
  document.querySelectorAll(".section").forEach((section) => section.classList.toggle("active", section.id === sectionId));
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

const targetTop = section.getBoundingClientRect().top + 92;
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
    updateAssistant("Try again", "Say show experience, show projects, show skills, contact, or resume.", "Command not recognized.");
    speak("Sorry, I did not understand. You can say show experience, show projects, show skills, contact, or resume.");
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
    stopLipSync();
  recognition?.abort();

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.continuous = false;

  recognition.onstart = () => {
    setAvatarState("listening");
    voiceBtn.disabled = true;
    voiceBtnText.textContent = "Listening...";
    updateAssistant("I’m listening...", "Try saying “show projects” or “contact”.", "Listening...");
  };

  recognition.onresult = (event) => handleTranscript(event.results[0][0].transcript);

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
  window.setTimeout(() => speak(welcomeMessage), 250);
}

function goHome() {
  window.speechSynthesis?.cancel();
  stopLipSync();
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
  setAvatarState("waving");
  window.setTimeout(() => {
    if (!hasGreeted) greet();
  }, 650);
});

