
const COMMANDS = {
  home: ["home", "start", "intro", "introduction"],
  experience: ["experience", "work", "work history", "career"],
  projects: ["projects", "apps", "applications", "portfolio"],
  skills: ["skills", "technologies", "tools", "tech stack"],
  contact: ["contact", "email", "linkedin", "github", "reach"],
  resume: ["resume", "résumé", "cv", "curriculum vitae"]
};
const SECTION_SCRIPTS = {
  home: "[wave] Hi, welcome to Ravali’s portfolio. [smile] I can guide you through experience, projects, skills, resume, and contact. [point] Let me show you the selected section. [nod] Thanks for visiting Ravali’s portfolio.",
  experience: "[wave] Hi, welcome to Ravali’s portfolio. [smile] Ravali builds full-stack applications, data workflows, cloud services, APIs, and automation. [point] Let me show you the selected experience section. [nod] Thanks for visiting Ravali’s portfolio.",
  projects: "[wave] Hi, welcome to Ravali’s portfolio. [smile] Ravali’s projects include AI features, Flask and React apps, dashboards, cloud integrations, and automation. [point] Let me show you the selected projects section. [nod] Thanks for visiting Ravali’s portfolio.",
  skills: "[wave] Hi, welcome to Ravali’s portfolio. [smile] Ravali works with Python, Java, JavaScript, React, Flask, SQL, AWS, REST APIs, HTML, CSS, Git, and AI tools. [point] Let me show you the selected skills section. [nod] Thanks for visiting Ravali’s portfolio.",
  resume: "[wave] Hi, welcome to Ravali’s portfolio. [smile] The resume section summarizes Ravali’s education, experience, projects, and technical strengths. [point] Let me show you the selected resume section. [nod] Thanks for visiting Ravali’s portfolio.",
  contact: "[wave] Hi, welcome to Ravali’s portfolio. [smile] You can contact Ravali through email, LinkedIn, or GitHub for software, data, cloud, and AI-focused roles. [point] Let me show you the selected contact section. [nod] Thanks for visiting Ravali’s portfolio."
};
const POLL_INTERVAL_MS = 5000;
const MAX_POLLS = 72;

const avatarVideo = document.getElementById("avatarVideo");
const videoPlaceholder = document.getElementById("videoPlaceholder");
const voiceBtn = document.getElementById("voiceBtn");
const voiceBtnText = document.getElementById("voiceBtnText");
const statusText = document.getElementById("status");
const assistantTitle = document.getElementById("assistantTitle");
const assistantMessage = document.getElementById("assistantMessage");

let recognition;

let activePoll;
function updateAssistant(title, message, status) {
  assistantTitle.textContent = title;
  assistantMessage.textContent = message;
  statusText.textContent = status;
}


function setActiveSection(sectionId) {
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.toggle("active", section.id === sectionId);
  });}


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
  })?.[0];}

async function generateAvatarVideo(sectionId) {
  clearTimeout(activePoll);
  const label = document.getElementById(sectionId)?.dataset.sectionTitle || sectionId;
  const script = SECTION_SCRIPTS[sectionId] || SECTION_SCRIPTS.home;

  updateAssistant(label, "Starting a realistic HeyGen avatar render...", "Sending script to Flask.");
  videoPlaceholder.hidden = false;
  avatarVideo.removeAttribute("src");
  avatarVideo.load();

  try {
    const response = await fetch("/api/generate-avatar-video", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ section: sectionId, script })
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not start HeyGen video generation.");

    updateAssistant(label, "HeyGen is rendering the talking avatar video.", `Video ID: ${data.video_id}`);
    pollVideoStatus(data.video_id, label, 0);
  } catch (error) {
    updateAssistant("Render error", error.message, "Please check Flask logs and your .env settings.");
  }
}

async function pollVideoStatus(videoId, label, attempt) {
  if (attempt >= MAX_POLLS) {
    updateAssistant("Render timeout", "HeyGen is still rendering. Try again later or increase MAX_POLLS.", "Polling stopped.");
    return;
  }

  try {
    const response = await fetch(`/api/video-status/${encodeURIComponent(videoId)}`);
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Could not check HeyGen video status.");

    if (data.status === "completed" && data.video_url) {
      avatarVideo.src = data.video_url;
      videoPlaceholder.hidden = true;
      await avatarVideo.play().catch(() => undefined);
      updateAssistant(label, "Your realistic HeyGen avatar MP4 is ready.", "Video ready.");
      return;
    }

    updateAssistant(label, "HeyGen is still rendering. This page is polling without blocking Flask.", `Status: ${data.status}`);
    activePoll = setTimeout(() => pollVideoStatus(videoId, label, attempt + 1), POLL_INTERVAL_MS);
  } catch (error) {
    updateAssistant("Status error", error.message, "Polling paused. Try another command when ready.");
  }
}

function runCommand(sectionId) {
  scrollToSection(sectionId);
  generateAvatarVideo(sectionId);
}
function handleTranscript(transcript) {
  updateAssistant("You said:", transcript, "Detecting command...");
  const command = findCommand(transcript);

  if (command) navigateToSection(command);
  else speak("Sorry, I did not understand. You can say experience, projects, skills, contact, resume, or home.");
}

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    updateAssistant("Voice unavailable", "Speech recognition works best in Chrome or Edge over HTTPS or localhost.", "Voice recognition is not supported in this browser.");
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
        updateAssistant("I’m listening...", "Say experience, projects, skills, contact, resume, or home.", "Listening...");
  };

  recognition.onresult = (event) => handleTranscript(event.results[0][0].transcript);

  recognition.onerror = () => {
    setAvatarState("idle");
  recognition.onerror = () => updateAssistant("Please try again", "I had trouble hearing that command.", "Voice error. Please try again.");  };

  recognition.onend = () => {
    voiceBtn.disabled = false;
    voiceBtnText.textContent = "Click microphone";
    if (currentState === "listening") setAvatarState("idle");
  };

  recognition.start();
}
voiceBtn.addEventListener("click", startListening);

document.querySelectorAll("[data-command]").forEach((button) => {
  button.addEventListener("click", () => runCommand(button.dataset.command));
});
window.addEventListener("beforeunload", () => {
  recognition?.abort();
  clearTimeout(activePoll);
});
