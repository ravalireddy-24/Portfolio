const assistantPanel = document.getElementById("assistantPanel");
const avatarBtn = document.getElementById("avatarBtn");
const cartoonAvatar = document.getElementById("cartoonAvatar");
const mouth = document.getElementById("mouth");
const voiceBtnText = document.getElementById("voiceBtnText");
const statusText = document.getElementById("status");

const assistantTitle = document.getElementById("assistantTitle");
const assistantMessage = document.getElementById("assistantMessage");

const mouthShapes = ["mouth-open-a", "mouth-closed", "mouth-open-b", "mouth-open-c", "mouth-closed"];
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
  cartoonAvatar.className.baseVal = `cartoon-avatar avatar-${state}`;
  assistantPanel.dataset.state = state;
}
function setMouthShape(shape) {
  mouth.classList.remove("mouth-smile", "mouth-open-a", "mouth-open-b", "mouth-open-c", "mouth-closed");
  mouth.classList.add(shape);
}
function startLipSync() {
  stopLipSync(false);
  let index = 0;
  lipTimer = window.setInterval(() => {
    setMouthShape(mouthShapes[index % mouthShapes.length]);
    index += 1;
  }, 115);
}
function stopLipSync(smile = true) {
  window.clearInterval(lipTimer);
  lipTimer = undefined;
  setMouthShape(smile ? "mouth-smile" : "mouth-closed");
}
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
  utterance.onstart = () => setAvatarState("talking");
  utterance.onstart = () => {
    setAvatarState("talking");
    startLipSync();
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

