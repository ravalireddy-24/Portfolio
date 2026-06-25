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


const avatarShell = document.getElementById("avatarShell");
const voiceBtn = document.getElementById("voiceBtn");
const voiceBtnText = document.getElementById("voiceBtnText");
const statusText = document.getElementById("status");
const transcriptText = document.getElementById("transcriptText");
const assistantTitle = document.getElementById("assistantTitle");
const assistantMessage = document.getElementById("assistantMessage");
const avatarStatusLabel = document.getElementById("avatarStatusLabel");

let recognition;
let currentState = "idle";
let thinkingTimeout;
let speakingTimeout;
let voices = [];
function updateStatusLabel(label) {
  statusText.textContent = label;
  if (avatarStatusLabel) avatarStatusLabel.textContent = label;
}

function updateAssistant(title, message, status) {
  assistantTitle.textContent = title;
  assistantMessage.textContent = message;
  updateStatusLabel(status);
}
function setAvatarState(state) {
  currentState = state;
  avatarShell.dataset.avatarState = state;
  ["idle", "listening", "thinking", "talking", "speaking"].forEach((name) => {
    avatarShell.classList.toggle(`is-${name}`, state === name || (name === "speaking" && state === "talking"));
  });
}
function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    const helpText = "Speech recognition is not supported in this browser. Please use Chrome at http://127.0.0.1:5000 or use the quick command buttons.";
    updateAssistant("Voice unsupported", helpText, "Ready");
    transcriptText.textContent = helpText;
    console.error(helpText);
    return;
  }

  stopSpeaking();
  recognition?.abort();

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  recognition.continuous = false;

  recognition.onstart = () => {
    setAvatarState("listening");
    voiceBtn.disabled = true;
    voiceBtnText.textContent = "Listening...";
    updateAssistant("I’m listening...", "Say experience, projects, skills, contact, resume, or home.", "Listening...");
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map((result) => result[0].transcript).join(" ").trim();
    transcriptText.textContent = transcript;
    if (event.results[event.results.length - 1].isFinal) handleTranscript(transcript);
  };

  recognition.onerror = (event) => {
    const messages = {
      "not-allowed": "Microphone access was blocked. Please allow microphone permission for this site and try again.",
      "service-not-allowed": "Speech recognition is blocked for this browser or site. Please use Chrome and allow microphone access.",
      "no-speech": "I did not hear anything. Please click the microphone and say a command like projects or skills.",
      "audio-capture": "No microphone was found. Please connect or enable your microphone and try again.",
      network: "Speech recognition needs an internet connection in some browsers. Please check the connection and try again."
    };
    const message = messages[event.error] || "I had trouble hearing that command. Please try again.";
    stopListening();
    updateAssistant("Please try again", message, "Ready");
    transcriptText.textContent = message;
    console.error("Speech recognition error:", event.error, event.message || message);
  };

  recognition.onend = () => {
    voiceBtn.disabled = false;
    voiceBtnText.textContent = "Click microphone";
    if (currentState === "listening") stopListening();
  };

  recognition.start();
}

function stopListening() {
  if (currentState === "listening") {
    setAvatarState("idle");
    updateStatusLabel("Ready");
  }
}

function startThinking() {
  clearTimeout(thinkingTimeout);
  setAvatarState("thinking");
  updateStatusLabel("Thinking...");
}

function stopThinking() {
  if (currentState === "thinking") {
    setAvatarState("idle");
    updateStatusLabel("Ready");
  }
}

function startSpeaking() {
  clearTimeout(speakingTimeout);
  clearTimeout(thinkingTimeout);
  setAvatarState("speaking");
  updateStatusLabel("Speaking...");
}

function stopSpeaking() {
  clearTimeout(speakingTimeout);
  window.speechSynthesis?.cancel();
  if (currentState === "speaking" || currentState === "talking") {
    setAvatarState("idle");
    updateStatusLabel("Ready");
  }
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
  return Object.entries(COMMANDS).find(([, phrases]) => phrases.some((phrase) => normalized.includes(phrase)))?.[0];
}

function getFemaleEnglishVoice() {
  voices = window.speechSynthesis?.getVoices() || [];
  return voices.find((voice) => /en/i.test(voice.lang) && /female|samantha|victoria|zira|aria|jenny|susan|karen/i.test(voice.name))
    || voices.find((voice) => /en/i.test(voice.lang))
    || voices[0];
}
function speak(message) {
   startSpeaking();

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
        const voice = getFemaleEnglishVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || "en-US";
    utterance.rate = 0.96;
    utterance.pitch = 1.08;
      utterance.onstart = startSpeaking;
    utterance.onend = stopSpeaking;
    utterance.onerror = stopSpeaking;
    window.speechSynthesis.speak(utterance);
  } else {
    speakingTimeout = window.setTimeout(stopSpeaking, 4200);
  }
}

function runCommand(sectionId) {
    const label = document.getElementById(sectionId)?.dataset.sectionTitle || sectionId;
  const script = SECTION_SCRIPTS[sectionId] || SECTION_SCRIPTS.home;

  scrollToSection(sectionId);
  updateAssistant(label, script, "Thinking...");
  startThinking();
  thinkingTimeout = window.setTimeout(() => {
    stopThinking();
    speak(script);
  }, 420);
}
function handleTranscript(transcript) {
    console.log("Voice transcript:", transcript);
  transcriptText.textContent = transcript;
  updateAssistant("You said:", transcript, "Thinking...");
  startThinking();
  const command = findCommand(transcript);

   window.setTimeout(() => {
    if (command) runCommand(command);
    else {
      const helpText = "Sorry, I did not understand. You can say experience, projects, skills, contact, resume, or home.";
      updateAssistant("Please try again", helpText, "Thinking...");
      speak(helpText);
    }
   }, 300);
   }

function goHome() {
  runCommand("home");
}

voiceBtn.addEventListener("click", startListening);

document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => runCommand(button.dataset.command));
});

if ("speechSynthesis" in window) {
  voices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    voices = window.speechSynthesis.getVoices();
  };
}

window.addEventListener("beforeunload", () => {
  recognition?.abort();
  window.speechSynthesis?.cancel();
clearTimeout(thinkingTimeout);
});

window.startListening = startListening;
window.stopListening = stopListening;
window.startThinking = startThinking;
window.stopThinking = stopThinking;
window.startSpeaking = startSpeaking;
window.stopSpeaking = stopSpeaking;
window.goHome = goHome;
