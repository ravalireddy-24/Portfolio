import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const AVATAR_FILE = "/static/models/ravali-avatar.glb";
const COMMANDS = {
  home: ["home", "start", "intro", "introduction"],
  experience: ["experience", "work", "work history", "career"],
  projects: ["projects", "apps", "applications", "portfolio"],
  skills: ["skills", "technologies", "tools", "tech stack"],
  contact: ["contact", "email", "linkedin", "github", "reach"],
  resume: ["resume", "résumé", "cv", "curriculum vitae"]
};
const SECTION_NARRATION = {
  experience: "Here is Ravali's experience section. She builds full stack software, data engineering workflows, cloud services, APIs, and automation.",
  projects: "Here are Ravali's projects, including AI features, web applications, cloud integrations, dashboards, and automation projects.",
  skills: "Here are Ravali's skills, including Python, Java, JavaScript, React, Flask, SQL, AWS, APIs, HTML, CSS, and AI tools.",
  contact: "Here is Ravali's contact section. You can connect with her through email, LinkedIn, or GitHub.",
  resume: "Here is Ravali's resume section, with education, experience, projects, and technical strengths in one place."
};

const assistantPanel = document.getElementById("assistantPanel");
const avatarBtn = document.getElementById("avatarBtn");
const canvas = document.getElementById("avatarCanvas");
const fallback = document.getElementById("avatarFallback");
const cartoonAvatar = document.getElementById("cartoonAvatar");
const voiceBtn = document.getElementById("voiceBtn");
const voiceBtnText = document.getElementById("voiceBtnText");
const statusText = document.getElementById("status");
const assistantTitle = document.getElementById("assistantTitle");
const assistantMessage = document.getElementById("assistantMessage");

let recognition;
let currentState = "idle";
let avatarRoot;
let mixer;
let morphTargets = [];
let bones = {};
let clips = {};
let activeAction;
let speechStart = 0;
let highlightTimer;
let hasGreeted = false;
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
camera.position.set(0, 1.55, 5.2);
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.outputColorSpace = THREE.SRGBColorSpace;
scene.add(new THREE.HemisphereLight(0xffffff, 0x28335f, 2.5));
const keyLight = new THREE.DirectionalLight(0xffffff, 2.2);
keyLight.position.set(2.5, 4, 3);
scene.add(keyLight);

function resizeAvatar() {
  const rect = canvas.getBoundingClientRect();
  renderer.setSize(rect.width, rect.height, false);
  camera.aspect = rect.width / rect.height;
  camera.updateProjectionMatrix();
}

function findRigParts(root) {
  root.traverse((node) => {
    const name = node.name.toLowerCase();
    if (node.isBone) {
      if (name.includes("head")) bones.head = node;
      if (name.includes("neck")) bones.neck = node;
      if (name.includes("spine")) bones.spine = node;
      if (name.includes("left") && (name.includes("hand") || name.includes("wrist"))) bones.leftHand = node;
      if (name.includes("right") && (name.includes("hand") || name.includes("wrist"))) bones.rightHand = node;
      if (name.includes("right") && (name.includes("arm") || name.includes("shoulder"))) bones.rightArm = node;
    }
    if (node.isMesh && node.morphTargetDictionary && node.morphTargetInfluences) {
      const dict = node.morphTargetDictionary;
      Object.keys(dict).forEach((key) => {
        const lower = key.toLowerCase();
        if (["blink", "eye", "mouth", "jaw", "viseme", "aa", "oh", "ee"].some((token) => lower.includes(token))) {
          morphTargets.push({ mesh: node, name: lower, index: dict[key] });
        }
      });
    }
  });
}

function loadAvatar() {
  new GLTFLoader().load(AVATAR_FILE, (gltf) => {
    avatarRoot = gltf.scene;
    avatarRoot.position.set(0, -1.45, 0);
    avatarRoot.scale.setScalar(1.75);
    scene.add(avatarRoot);
    mixer = new THREE.AnimationMixer(avatarRoot);
    gltf.animations.forEach((clip) => { clips[clip.name.toLowerCase()] = clip; });
    findRigParts(avatarRoot);
        canvas.hidden = false;
    cartoonAvatar.hidden = true;
    fallback.hidden = true;
    setAvatarState("idle");
  }, undefined, () => {
    fallback.hidden = false;
    updateAssistant("Cartoon guide ready", "Use the visible cartoon guide now. Tap the microphone once and say: show projects, skills, resume, contact, experience, or home.", "Actionable check: click microphone once, then say a section name.");  });
}

function playClip(match, loop = true) {
  if (!mixer) return false;
  const clipName = Object.keys(clips).find((name) => match.some((word) => name.includes(word)));
  if (!clipName) return false;
  activeAction?.fadeOut(0.15);
  activeAction = mixer.clipAction(clips[clipName]);
  activeAction.reset().setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce).fadeIn(0.15).play();
  return true;
}


function setAvatarState(state) {
  currentState = state;
    cartoonAvatar?.classList.toggle("is-listening", state === "listening");
  cartoonAvatar?.classList.toggle("is-talking", state === "talking");
  cartoonAvatar?.classList.toggle("is-pointing", state === "pointing");
  cartoonAvatar?.classList.toggle("is-greeting", state === "greeting");
  if (state === "listening") playClip(["listen", "idle"]);
  if (state === "talking") playClip(["talk", "speak", "gesture"]);
  if (state === "greeting") playClip(["wave", "greet"]);
  if (state === "pointing") playClip(["point"]);
  if (state === "idle") playClip(["idle", "breath"]);
  assistantPanel.dataset.state = state;
}

function updateAssistant(title, message, status) {
  assistantTitle.textContent = title;
  assistantMessage.textContent = message;
  statusText.textContent = status;
}
function setMorph(token, value) {
  morphTargets.forEach((target) => {
    if (target.name.includes(token)) target.mesh.morphTargetInfluences[target.index] = value;
  });
}

function proceduralRig(time) {
    animateCartoonFallback();
  if (!avatarRoot) return;
  const t = time / 1000;
  const blink = Math.sin(t * 2.1) > 0.985 ? 1 : 0;
  setMorph("blink", blink);
  const talking = currentState === "talking";
  const mouth = talking ? (Math.sin((t - speechStart) * 18) + 1) / 2 : 0;
  ["mouth", "jaw", "viseme", "aa", "oh", "ee"].forEach((token) => setMorph(token, mouth));
  if (bones.head) bones.head.rotation.x = currentState === "talking" ? Math.sin(t * 7) * 0.08 : currentState === "listening" ? 0.12 : 0;
  if (bones.neck) bones.neck.rotation.z = currentState === "thinking" ? Math.sin(t * 3) * 0.12 : 0;
  if (bones.spine) bones.spine.rotation.x = currentState === "listening" ? -0.08 : 0;
  if (bones.rightArm) bones.rightArm.rotation.z = currentState === "pointing" ? -0.9 : currentState === "greeting" ? -0.55 : 0;
  if (bones.rightHand) bones.rightHand.rotation.z = currentState === "greeting" ? Math.sin(t * 11) * 0.45 : currentState === "talking" ? Math.sin(t * 5) * 0.18 : 0;
  if (bones.leftHand) bones.leftHand.rotation.z = currentState === "talking" ? Math.sin(t * 4.5) * 0.16 : 0;
  avatarRoot.rotation.y = Math.sin(t * 0.8) * 0.035;
}
function animateCartoonFallback() {
  if (!cartoonAvatar || cartoonAvatar.hidden) return;
  cartoonAvatar.classList.toggle("is-active", currentState !== "idle");
}

function animate(time) {
  requestAnimationFrame(animate);
  mixer?.update(0.016);
  proceduralRig(time);
  renderer.render(scene, camera);
}

function speak(text, onEnd) {
  if (!("speechSynthesis" in window)) { onEnd?.(); return; }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "en-US";
  utterance.rate = 1;
  utterance.pitch = 1.08;
  utterance.onstart = () => { speechStart = performance.now() / 1000; setAvatarState("talking"); };
  utterance.onend = () => { setAvatarState("idle"); onEnd?.(); };
  utterance.onerror = utterance.onend;
  window.speechSynthesis.speak(utterance);
}

function setActiveSection(sectionId) {
  document.querySelectorAll(".section").forEach((section) => section.classList.toggle("active", section.id === sectionId));
}

function highlightSection(sectionId) {
  clearTimeout(highlightTimer);
  document.querySelectorAll(".section").forEach((section) => section.classList.remove("section-highlight"));
  const section = document.getElementById(sectionId);
  if (!section) return;
  section.classList.add("section-highlight");
  highlightTimer = setTimeout(() => section.classList.remove("section-highlight"), 3500);}
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
  setTimeout(() => {
    if (sectionId === "home") assistantPanel.removeAttribute("style");
    scrollToSection(sectionId);
    setTimeout(() => pointToSection(sectionId), 350);
    updateAssistant(label, "Here is the section you asked for.", `Showing ${label}.`);
    speak(SECTION_NARRATION[sectionId]);
  }, 650)
}
function handleTranscript(transcript) {
  updateAssistant("You said:", transcript, "Thinking...");
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
function greet() {
    hasGreeted = true;
  setAvatarState("greeting");
  updateAssistant("Hi! 👋", "Ask me to show experience, projects, skills, resume, home, or contact.", SECTION_NARRATION.home);
  setTimeout(() => speak(SECTION_NARRATION.home), 250);
}

function goHome() {
  window.speechSynthesis?.cancel();
  assistantPanel.removeAttribute("style");
  scrollToSection("home");
  setAvatarState("greeting");
  updateAssistant("Welcome back", "What would you like to explore next?", "Ready for your command.");
  setTimeout(() => setAvatarState("idle"), 1300);

}
window.goHome = goHome;

avatarBtn.addEventListener("click", greet);
voiceBtn.addEventListener("click", startListening);
window.addEventListener("resize", resizeAvatar);
window.addEventListener("beforeunload", () => { recognition?.abort(); window.speechSynthesis?.cancel(); });
window.addEventListener("scroll", () => { if (currentState === "pointing") assistantPanel.removeAttribute("style"); }, { passive: true });
window.addEventListener("load", () => setTimeout(() => { if (!hasGreeted) greet(); }, 650));

resizeAvatar();
loadAvatar();
requestAnimationFrame(animate);

