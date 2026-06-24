const COMMANDS = {
  home: ["home", "start", "intro", "introduction"],
  experience: ["experience", "work", "work history", "career"],
  projects: ["projects", "apps", "applications", "portfolio"],
  skills: ["skills", "technologies", "tools", "tech stack"],
  contact: ["contact", "email", "linkedin", "github", "reach"],
  resume: ["resume", "résumé", "cv", "curriculum vitae"]
};
const SECTION_SCRIPTS = {
  home: "Hi, welcome to Ravali’s portfolio. I can guide you through experience, projects, skills, resume, and contact.",
  experience: "Ravali builds full-stack applications, data workflows, cloud services, APIs, and automation.",
  projects: "Ravali’s projects include AI features, Flask and React apps, dashboards, cloud integrations, and automation.",
  skills: "Ravali works with Python, Java, JavaScript, React, Flask, SQL, AWS, REST APIs, HTML, CSS, Git, and AI tools.",
  resume: "The resume section summarizes Ravali’s education, experience, projects, and technical strengths.",
  contact: "You can contact Ravali through email, LinkedIn, or GitHub for software, data, cloud, and AI-focused roles."
};
const POLL_INTERVAL_MS = 5000;
const MAX_POLLS = 72;

const avatarShell = document.getElementById("avatarShell");
const voiceBtn = document.getElementById("voiceBtn");
const voiceBtnText = document.getElementById("voiceBtnText");
const statusText = document.getElementById("status");
const assistantTitle = document.getElementById("assistantTitle");
const assistantMessage = document.getElementById("assistantMessage");

let recognition;
let currentState = "idle";
let speakingTimeout;

function updateAssistant(title, message, status) {
  assistantTitle.textContent = title;
  assistantMessage.textContent = message;
  statusText.textContent = status;
}
function setAvatarState(state) {
  currentState = state;
  avatarShell.classList.toggle("is-speaking", state === "speaking");
  avatarShell.classList.toggle("is-listening", state === "listening");
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
  return Object.entries(COMMANDS).find(([, phrases]) => {
    return phrases.some((phrase) => normalized.includes(phrase));
  })?.[0];
}


function speak(message) {
  clearTimeout(speakingTimeout);
  setAvatarState("speaking");

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
    utterance.rate = 0.96;
    utterance.pitch = 1.06;
    utterance.onend = () => setAvatarState("idle");
    window.speechSynthesis.speak(utterance);
  } else {
    speakingTimeout = window.setTimeout(() => setAvatarState("idle"), 4200);
  }
}

function runCommand(sectionId) {
    const label = document.getElementById(sectionId)?.dataset.sectionTitle || sectionId;
  const script = SECTION_SCRIPTS[sectionId] || SECTION_SCRIPTS.home;
  scrollToSection(sectionId);
  updateAssistant(label, script, "Animating mouth, eyes, and hand gestures locally.");
  speak(script);
}
function handleTranscript(transcript) {
  updateAssistant("You said:", transcript, "Detecting command...");
  const command = findCommand(transcript);

  if (command) runCommand(command);
  else {
    const helpText = "Sorry, I did not understand. You can say experience, projects, skills, contact, resume, or home.";
    updateAssistant("Please try again", helpText, "No matching command found.");
    speak(helpText);
  }
}

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    const helpText = "Speech recognition works best in Chrome or Edge over HTTPS or localhost. You can still use the quick command buttons.";
    updateAssistant("Voice unavailable", helpText, "Voice recognition is not supported in this browser.");
    speak(helpText);    return;
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
        updateAssistant("I’m listening...", "Say experience, projects, skills, contact, resume, or home.", "Listening...");
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
function goHome() {
  runCommand("home");
}

voiceBtn.addEventListener("click", startListening);

document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => runCommand(button.dataset.command));
});
window.addEventListener("beforeunload", () => {
  recognition?.abort();
  window.speechSynthesis?.cancel();
  clearTimeout(speakingTimeout);
});

window.goHome = goHome;

