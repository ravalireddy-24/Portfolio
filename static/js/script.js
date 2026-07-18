const INTENT_DEFINITIONS = {
  about: {
    phrases: ["about ravali", "about you", "who are you", "introduce yourself", "tell me about yourself"],
    keywords: ["ravali", "about", "profile", "introduction", "intro"]
  },
  portfolio: {
    phrases: ["explore portfolio", "view portfolio", "show portfolio", "show your work", "my work"],
    keywords: ["portfolio", "work", "overview", "dashboard", "workspace"]
  },
  projects: {
    phrases: ["ai projects", "data projects", "software projects", "work samples", "data engineering projects"],
    keywords: ["projects", "project", "samples", "applications", "apps", "engineering"]
  },
  skills: {
    phrases: ["tech stack", "programming languages", "what technologies", "technologies does ravali use", "technologies does she use"],
    keywords: ["skills", "skill", "technologies", "technology", "tools", "languages", "stack"]
  },
  experience: {
    phrases: ["work experience", "professional experience", "professional background", "career background"],
    keywords: ["experience", "career", "employment", "professional", "background", "jobs", "roles"]
  },
  contact: {
    phrases: ["get in touch", "contact ravali", "email ravali", "hire ravali"],
    keywords: ["contact", "email", "linkedin", "hire", "github", "connect"]
  },
    education: {
    phrases: ["education", "academic background", "show education", "college", "university"],
    keywords: ["education", "academic", "college", "university", "degree", "masters", "bachelor"]
  },

};
const GENERIC_WORDS = new Set(["tell", "show", "please", "can", "could", "would", "like", "want", "me", "you", "your", "her", "his", "the", "a", "an", "i", "to", "about", "where", "what", "how", "does", "do", "is", "are", "ravali"]);
const SECTION_SCRIPTS = {
  home: "Taking you back to the home page.",
  overview: "Welcome to Ravali’s professional workspace dashboard. Explore career stats, experience, projects, skills, achievements, and contact.",  about: "Hi, welcome to Ravali’s detailed portfolio. I can guide you through experience, projects, skills, certifications, education, and contact.",
  experience: "Ravali builds full-stack applications, data workflows, cloud services, APIs, and automation.",  projects: "Ravali’s projects include AI features, Flask and React apps, dashboards, cloud integrations, and automation.",
  skills: "Ravali works with Python, Java, JavaScript, React, Flask, SQL, AWS, REST APIs, HTML, CSS, Git, and AI tools.",
  contact: "You can contact Ravali through email or GitHub",
  education: "Ravali completed a Master's in Data Science and Artificial Intelligence from Campbellsville University, a Master's in Computer Science from Northwest Missouri State University, and a Bachelor's in Computer Science from JNTU."};

const LANDING_SCRIPTS = {
  portfolio: "Opening Ravali’s portfolio. You can ask about experience, projects, skills, certifications, education, or contact.",
  contact: "You can contact Ravali by email,GitHub or from this portfolio.",
  about: "Ravali is a Software Engineer and Senior Data Engineer with over five years of experience building scalable cloud platforms, modern data solutions, and AI-powered applications using Azure, Databricks, AWS, Python, and Spark.",
  projects: "Ravali’s projects include AI portfolio features, Flask and React applications, dashboards, cloud integrations, and automation workflows.",
  skills: "Ravali works with Python, Java, JavaScript, React, Flask, SQL, Azure, AWS, Databricks, PySpark, REST APIs, Git, and AI tools.",
  experience: "Ravali has over 5+ years of experience building ETL pipelines, cloud data platforms, full-stack applications, APIs, and automation solutions.",
  welcome: "Hi, I’m Ravali’s voice assistant. Say portfolio to explore the details"

};
const avatarShell = document.getElementById("avatarShell");
const assistantAvatar = document.getElementById("assistantAvatar");
const landingAvatarVideo = document.getElementById("landingAvatarVideo");
const landingVoiceBtn = document.getElementById("landingVoiceBtn");
const landingVoiceStatus = document.getElementById("landingVoiceStatus");
const avatarMicBtn = document.getElementById("avatarMicBtn");
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

function normalizeTranscript(transcript = "") {
  return transcript
    .toLowerCase()
    .replace(/[’‘`´]/g, "'")
    .replace(/\b(ravalee|ravali\.|ravalli|rivali|rawali|ravely)\b/g, "ravali")
    .replace(/\blinked in\b/g, "linkedin")
    .replace(/\be mail\b/g, "email")
    .replace(/\bc v\b/g, "cv")
    .replace(/\btech-stack\b/g, "tech stack")
    .replace(/[^a-z0-9'\s]/g, " ")
    .replace(/\b(\w+)'s\b/g, "$1")
    .replace(/\b(can't|cannot)\b/g, "can not")
    .replace(/\s+/g, " ")
    .trim();
}

function detectIntent(transcript = "") {
  const normalized = normalizeTranscript(transcript);
  const scores = Object.fromEntries(Object.keys(INTENT_DEFINITIONS).map((intent) => [intent, 0]));

  Object.entries(INTENT_DEFINITIONS).forEach(([intent, definition]) => {
    definition.phrases.forEach((phrase) => {
      const normalizedPhrase = normalizeTranscript(phrase);
      if (normalizedPhrase && normalized.includes(normalizedPhrase)) scores[intent] += normalizedPhrase.split(" ").length * 4;
    });
  });

  const words = normalized.split(" ").filter(Boolean);
  Object.entries(INTENT_DEFINITIONS).forEach(([intent, definition]) => {
    definition.keywords.forEach((keyword) => {
      const normalizedKeyword = normalizeTranscript(keyword);
      if (!normalizedKeyword || GENERIC_WORDS.has(normalizedKeyword)) return;
      if (normalizedKeyword.includes(" ")) {
        if (normalized.includes(normalizedKeyword)) scores[intent] += normalizedKeyword.split(" ").length * 2;
        return;
      }
      if (words.includes(normalizedKeyword)) scores[intent] += 2;
    });
  });

  if (normalized.includes("ravali") && /about|who|introduce|yourself/.test(normalized)) scores.about += 3;
  if (normalized.includes("data engineering") && /project|projects|work/.test(normalized)) scores.projects += 5;
  if (/technology|technologies|programming|tools|stack/.test(normalized)) scores.skills += 4;
  if (/contact|email|linkedin|hire|get in touch|connect/.test(normalized)) scores.contact += 4;
    if (/education|academic|college|university|degree|masters|bachelor/.test(normalized)) scores.education += 4;

  const ranked = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  const [intent, score] = ranked[0] || [null, 0];
  return score > 0 ? { intent, score, normalized, scores } : { intent: null, score: 0, normalized, scores };
}

function getRecognitionErrorMessage(error) {
  const messages = {
    "not-allowed": "Microphone access was blocked. Please allow microphone permission for this site and try again.",
    "permission-denied": "Microphone access was blocked. Please allow microphone permission for this site and try again.",
    "service-not-allowed": "Speech recognition is blocked for this browser or site. Please use Chrome and allow microphone access.",
    "no-speech": "No speech was detected. Please click the microphone and say a command like projects or skills.",
    "audio-capture": "No microphone was found. Please connect or enable your microphone and try again.",
    aborted: "Recognition ended unexpectedly. Please click the microphone and try again.",
    network: "Speech recognition needs an internet connection in some browsers. Please check the connection and try again."
  };
  return messages[error] || "I had trouble hearing that command. Please try again.";
}
function startListening() {
 const SpeechRecognition = getSpeechRecognition();
   console.log("microphone clicked");

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
    recognition.continuous = false;
  if (voiceBtn) voiceBtn.disabled = true;
    if (avatarMicBtn) avatarMicBtn.disabled = true;
  if (voiceBtnText) voiceBtnText.textContent = "Listening...";

  recognition.onstart = () => {
    setAvatarState("listening");
    if (voiceBtn) voiceBtn.disabled = true;
        if (avatarMicBtn) avatarMicBtn.disabled = true;
    if (voiceBtnText) voiceBtnText.textContent = "Listening...";
    updateAssistant("I’m listening...", "Say experience, projects, skills, certifications, education, contact, or about.", "Listening...");
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map((result) => result[0].transcript).join(" ").trim();
        console.log("transcript received", transcript);
    if (transcriptText) transcriptText.textContent = transcript;
    if (event.results[event.results.length - 1].isFinal) handleTranscript(transcript);
  };

  recognition.onerror = (event) => {
    const message = getRecognitionErrorMessage(event.error);
    console.error("recognition error", event.error, event.message || message);
    stopListening();
    updateAssistant("Please try again", message, "Ready");
    if (transcriptText) transcriptText.textContent = message;
    console.error("Speech recognition error:", event.error, event.message || message);
  };

  recognition.onend = () => {
        console.log("recognition ended");
    if (voiceBtn) voiceBtn.disabled = false;
        if (avatarMicBtn) avatarMicBtn.disabled = false;
    if (voiceBtnText) voiceBtnText.textContent = "Click microphone";
    if (currentState === "listening") stopListening();
  };

  try {
    recognition.start();
  } catch (error) {
    console.error("recognition error", error);
    updateAssistant("Please try again", "Recognition ended unexpectedly. Please click the microphone and try again.", "Ready");
    if (voiceBtn) voiceBtn.disabled = false;
        if (avatarMicBtn) avatarMicBtn.disabled = false;
    if (voiceBtnText) voiceBtnText.textContent = "Click microphone";
  }
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
  let section = document.getElementById(sectionId);
  if (!section) return;
  setActiveSection(sectionId);
  section.scrollIntoView({ behavior: "smooth", block: "start" });
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
    if (sectionId === "portfolio") sectionId = "overview";
  if (sectionId === "home") {
        console.log("action executed", sectionId);
    const message = SECTION_SCRIPTS.home;
    updateAssistant("Going home", message, "Navigating...");
    speak(message, () => {
      window.location.href = "/";
    });
    return;
  }



  const section = document.getElementById(sectionId);
  const script = SECTION_SCRIPTS[sectionId] || SECTION_SCRIPTS.about;
    const label = section?.dataset.sectionTitle || sectionId.charAt(0).toUpperCase() + sectionId.slice(1);
  console.log("action executed", sectionId);
  if (section) scrollToSection(sectionId);
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
  const result = detectIntent(transcript);
  console.log("normalized transcript", result.normalized);
  console.log("detected intent", result.intent, result);
  window.setTimeout(() => {
    if (result.intent) runCommand(result.intent);
    else {
      const helpText = "I didn’t fully understand. You can ask about Overview, projects, skills, experience, portfolio";
      console.log("action executed", "fallback");
      updateAssistant("Please try again", helpText, "Thinking...");
      speak(helpText);
    }
   }, 300);
   }

   function startLandingListening() {
   console.log("microphone clicked");
  const SpeechRecognition = getSpeechRecognition();

  if (!SpeechRecognition) {
    const message = unsupportedSpeechMessage();
    if (landingVoiceStatus) landingVoiceStatus.textContent = message;
    console.error("recognition error", "unsupported browser", message);
    return;
  }

  stopSpeaking();
  recognition?.abort();

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = true;
    recognition.continuous = false;

  recognition.onstart = () => {
        console.log("recognition started");
    if (landingVoiceStatus) landingVoiceStatus.textContent = "Listening... ask about Ravali, portfolio, projects, skills, experience, contact";
  };

  recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map((result) => result[0].transcript).join(" ").trim();
        console.log("transcript received", transcript);
    if (landingVoiceStatus) landingVoiceStatus.textContent = `You said: ${transcript}`;
    if (event.results[event.results.length - 1].isFinal) handleLandingTranscript(transcript);
  };

  recognition.onerror = (event) => {
        const message = getRecognitionErrorMessage(event.error);
    console.error("recognition error", event.error, event.message || message);
    stopListening();
    if (landingVoiceBtn) landingVoiceBtn.classList.remove("is-listening");
    if (landingVoiceStatus) landingVoiceStatus.textContent = message;
  };

  recognition.onend = () => {
        console.log("recognition ended");
    if (landingVoiceBtn) landingVoiceBtn.classList.remove("is-listening");
    if (currentState === "listening") stopListening();
  };


    try {
    recognition.start();
  } catch (error) {
    console.error("recognition error", error);
    if (landingVoiceStatus) landingVoiceStatus.textContent = "Recognition ended unexpectedly. Please click the microphone and try again.";
  }
}

function handleLandingTranscript(transcript) {
  console.log("raw transcript", transcript);
  const result = detectIntent(transcript);
  console.log("normalized transcript", result.normalized);
  console.log("detected intent", result.intent, result);

  const action = result.intent || "welcome";
  const message = LANDING_SCRIPTS[action] || LANDING_SCRIPTS.welcome;
  if (landingVoiceStatus) landingVoiceStatus.textContent = message;
    console.log("action executed", action);

  speak(message, () => {
     const portfolioIntents = new Set(["portfolio", "about", "projects", "skills", "experience"]);
    if (portfolioIntents.has(action)) window.location.href = `/portfolio#${action === "portfolio" ? "overview" : action}`;

  });
}

function goHome() {
  runCommand("homepage");
}

voiceBtn?.addEventListener("click", startListening);
avatarMicBtn?.addEventListener("click", startListening);
landingVoiceBtn?.addEventListener("click", startLandingListening);

document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => runCommand(button.dataset.command));
});
document.querySelectorAll("[data-landing-action]").forEach((button) => {
  button.addEventListener("click", () => {
    const action = button.dataset.landingAction;
    const message = LANDING_SCRIPTS[action] || LANDING_SCRIPTS.welcome;
    if (landingVoiceStatus) landingVoiceStatus.textContent = message;
    
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
window.normalizeTranscript = normalizeTranscript;
window.detectIntent = detectIntent;
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


