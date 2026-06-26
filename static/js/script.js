const COMMANDS = {
  about: ["about", "about me", "home", "start", "intro", "introduction"],
    overview: ["overview", "dashboard", "workspace"],
  experience: ["experience", "work", "work history", "career"],
  projects: ["projects", "apps", "applications", "portfolio"],
  skills: ["skills", "technologies", "tools", "tech stack"],
  contact: ["contact", "email", "linkedin", "github", "reach"],
  resume: ["resume", "résumé", "cv", "curriculum vitae"],
  certifications: ["certifications", "certification", "certificates", "credentials"],
  education: ["education", "school", "degree", "academic"]
};
const SECTION_SCRIPTS = {
    overview: "Welcome to Ravali’s professional workspace dashboard. Explore career stats, experience, projects, skills, credentials, achievements, and contact.",
  about: "Hi, welcome to Ravali’s detailed portfolio. I can guide you through experience, projects, skills, certifications, education, and contact.",
  experience: "Ravali builds full-stack applications, data workflows, cloud services, APIs, and automation.",  projects: "Ravali’s projects include AI features, Flask and React apps, dashboards, cloud integrations, and automation.",
  skills: "Ravali works with Python, Java, JavaScript, React, Flask, SQL, AWS, REST APIs, HTML, CSS, Git, and AI tools.",
  resume: "The resume section summarizes Ravali’s education, experience, projects, and technical strengths.",
  contact: "You can contact Ravali through email, LinkedIn, or GitHub for software, data, cloud, and AI-focused roles.",
  certifications: "Ravali continues to build credentials across software engineering, cloud, data, and applied AI topics.",
  education: "Ravali’s education supports programming fundamentals, databases, systems thinking, and analytical problem solving."};

const LANDING_SCRIPTS = {
  portfolio: "Opening Ravali’s portfolio. You can ask about experience, projects, skills, certifications, education, or contact.",
  resume: "Ravali’s resume is ready to download. It highlights software engineering, data workflows, cloud services, APIs, and automation.",
  contact: "You can contact Ravali by email, LinkedIn, or GitHub from this portfolio.",
  welcome: "Hi, I’m Ravali’s voice assistant. Say portfolio to explore the details, resume to download the resume, or contact to connect."
};
const avatarShell = document.getElementById("avatarShell");
const assistantAvatar = document.getElementById("assistantAvatar");
const landingAvatarVideo = document.getElementById("landingAvatarVideo");
const landingVoiceBtn = document.getElementById("landingVoiceBtn");
const landingVoiceStatus = document.getElementById("landingVoiceStatus");
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
function getAvatarVideos() {
  return [assistantAvatar, landingAvatarVideo].filter(Boolean);
}

function playAvatarVideos() {
  getAvatarVideos().forEach((video) => {
    video.loop = true;
    video.play().catch((error) => console.warn("Avatar video could not play:", error));
  });
}

function stopAvatarVideos() {
  getAvatarVideos().forEach((video) => {
    video.pause();
    video.currentTime = 0;
  });
}

function updateStatusLabel(label) {
  if (statusText) statusText.textContent = label;
  if (avatarStatusLabel) avatarStatusLabel.textContent = label;
}

function updateAssistant(title, message, status) {
  if (assistantTitle) assistantTitle.textContent = title;
  if (assistantMessage) assistantMessage.textContent = message;
  updateStatusLabel(status);
}
function setAvatarState(state) {
  currentState = state;

  if (state === "speaking" || state === "talking") {
    playAvatarVideos();
  } else {
    stopAvatarVideos();
  }

  if (!avatarShell) return;
  avatarShell.dataset.avatarState = state;
  ["idle", "listening", "thinking", "talking", "speaking"].forEach((name) => {
    avatarShell.classList.toggle(`is-${name}`, state === name || (name === "speaking" && state === "talking"));
  });
}

function getSpeechRecognition() {
  return window.SpeechRecognition || window.webkitSpeechRecognition;
}

function unsupportedSpeechMessage() {
  return "Speech recognition is not supported in this browser. Please use Chrome at http://127.0.0.1:5000 or use the quick command buttons.";
}

function startListening() {
 const SpeechRecognition = getSpeechRecognition();

  if (!SpeechRecognition) {
    const helpText = unsupportedSpeechMessage();    updateAssistant("Voice unsupported", helpText, "Ready");
    if (transcriptText) transcriptText.textContent = helpText;
    console.error(helpText);
    return;
  }

  stopSpeaking();
  recognition?.abort();

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
  if (voiceBtn) voiceBtn.disabled = true;
  if (voiceBtnText) voiceBtnText.textContent = "Listening...";

  recognition.onstart = () => {
    setAvatarState("listening");
    if (voiceBtn) voiceBtn.disabled = true;
    if (voiceBtnText) voiceBtnText.textContent = "Listening...";
    updateAssistant("I’m listening...", "Say experience, projects, skills, certifications, education, contact, or about.", "Listening...");
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map((result) => result[0].transcript).join(" ").trim();
    if (transcriptText) transcriptText.textContent = transcript;
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
    if (transcriptText) transcriptText.textContent = message;
    console.error("Speech recognition error:", event.error, event.message || message);
  };

  recognition.onend = () => {
    if (voiceBtn) voiceBtn.disabled = false;
    if (voiceBtnText) voiceBtnText.textContent = "Click microphone";
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
      } else {
    stopAvatarVideos();
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
function speak(message, onDone) {
  startSpeaking();

  const finishSpeaking = () => {
    stopSpeaking();
    if (typeof onDone === "function") onDone();
  };


  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
        const voice = getFemaleEnglishVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || "en-US";
    utterance.rate = 0.96;
    utterance.pitch = 1.08;
     utterance.onstart = startSpeaking;
    utterance.onend = finishSpeaking;
    utterance.onerror = finishSpeaking;
    window.speechSynthesis.speak(utterance);
  } else {
    speakingTimeout = window.setTimeout(finishSpeaking, 4200);
  }
}

function runCommand(sectionId) {
    const label = document.getElementById(sectionId)?.dataset.sectionTitle || sectionId;
  const script = SECTION_SCRIPTS[sectionId] || SECTION_SCRIPTS.about;
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
  if (transcriptText) transcriptText.textContent = transcript;
  updateAssistant("You said:", transcript, "Thinking...");
  startThinking();
  const command = findCommand(transcript);

   window.setTimeout(() => {
    if (command) runCommand(command);
    else {
      const helpText = "Sorry, I did not understand. You can say experience, projects, skills, certifications, education, contact, or about.";
      updateAssistant("Please try again", helpText, "Thinking...");      speak(helpText);
    }
   }, 300);
   }
   function startLandingListening() {
  const SpeechRecognition = getSpeechRecognition();

  if (!SpeechRecognition) {
    const message = unsupportedSpeechMessage();
    if (landingVoiceStatus) landingVoiceStatus.textContent = message;
    console.error(message);
    return;
  }

  stopSpeaking();
  recognition?.abort();

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;

  recognition.onstart = () => {
    setAvatarState("listening");
    if (landingVoiceBtn) landingVoiceBtn.classList.add("is-listening");
    if (landingVoiceStatus) landingVoiceStatus.textContent = "Listening... say portfolio, resume, or contact.";
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map((result) => result[0].transcript).join(" ").trim();
    if (landingVoiceStatus) landingVoiceStatus.textContent = `You said: ${transcript}`;
    if (event.results[event.results.length - 1].isFinal) handleLandingTranscript(transcript);
  };

  recognition.onerror = (event) => {
    stopListening();
    if (landingVoiceBtn) landingVoiceBtn.classList.remove("is-listening");
    if (landingVoiceStatus) landingVoiceStatus.textContent = "I could not hear that. Please allow the microphone and try again.";
    console.error("Landing speech recognition error:", event.error);
  };

  recognition.onend = () => {
    if (landingVoiceBtn) landingVoiceBtn.classList.remove("is-listening");
    if (currentState === "listening") stopListening();
  };

  recognition.start();
}

function handleLandingTranscript(transcript) {
  const normalized = transcript.toLowerCase();
  let action = "welcome";

  if (/portfolio|explore|projects|experience|skills/.test(normalized)) action = "portfolio";
  if (/resume|résumé|cv/.test(normalized)) action = "resume";
  if (/contact|email|linkedin|github/.test(normalized)) action = "contact";

  const message = LANDING_SCRIPTS[action];
  if (landingVoiceStatus) landingVoiceStatus.textContent = message;

  speak(message, () => {
    if (action === "portfolio") window.location.href = "/portfolio";
    if (action === "resume") window.location.href = "/static/Ravali_N_Resume.pdf";
  });
}

function goHome() {
  runCommand("overview");
}

voiceBtn?.addEventListener("click", startListening);
landingVoiceBtn?.addEventListener("click", startLandingListening);

document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => runCommand(button.dataset.command));
});
document.querySelectorAll("[data-landing-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.landingAction;
    const message = LANDING_SCRIPTS[action] || LANDING_SCRIPTS.welcome;
    if (landingVoiceStatus) landingVoiceStatus.textContent = message;

    if (action === "resume") {
      window.location.href = "/static/Ravali_N_Resume.pdf";
      return;
    }

    if (action === "portfolio") {
      window.location.href = "/portfolio";
    }
  });
});

if ("speechSynthesis" in window) {
  voices = window.speechSynthesis.getVoices();
  window.speechSynthesis.onvoiceschanged = () => {
    voices = window.speechSynthesis.getVoices();
  };
}
window.addEventListener("DOMContentLoaded", stopAvatarVideos);
window.addEventListener("beforeunload", () => {
  recognition?.abort();
  window.speechSynthesis?.cancel();
  clearTimeout(thinkingTimeout);
  stopAvatarVideos();
});

window.startListening = startListening;
window.stopListening = stopListening;
window.goHome = goHome;

// Dashboard interactions: reveal-on-scroll, active nav, and subtle mouse parallax.
const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) entry.target.classList.add("is-visible");
  });
}, { threshold: 0.14 });

document.querySelectorAll(".reveal-card").forEach((card) => revealObserver.observe(card));

const sectionObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (!entry.isIntersecting) return;
    const id = entry.target.id;
    document.querySelectorAll(".dashboard-topbar nav a").forEach((link) => {
      link.classList.toggle("is-active", link.getAttribute("href") === `#${id}`);
    });
  });
}, { rootMargin: "-35% 0px -55% 0px", threshold: 0.01 });

document.querySelectorAll(".dashboard-section, #education").forEach((section) => sectionObserver.observe(section));

document.querySelectorAll(".tilt-card, .dashboard-card, .project-card").forEach((card) => {
  card.addEventListener("pointermove", (event) => {
    const rect = card.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    card.style.setProperty("--mx", `${x}%`);
    card.style.setProperty("--my", `${y}%`);
    if (!card.classList.contains("tilt-card")) return;
    const rotateX = ((event.clientY - rect.top) / rect.height - 0.5) * -5;
    const rotateY = ((event.clientX - rect.left) / rect.width - 0.5) * 5;
    card.style.transform = `translateY(-7px) rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
  });
  card.addEventListener("pointerleave", () => {
    card.style.removeProperty("--mx");
    card.style.removeProperty("--my");
    if (card.classList.contains("tilt-card")) card.style.transform = "";
  });
});


