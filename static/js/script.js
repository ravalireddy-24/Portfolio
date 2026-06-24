import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

const AVATAR_FILE = "/static/models/ravali-avatar.glb";
const USE_PROCEDURAL_PREMIUM_AVATAR = true;
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
let proceduralAvatar;
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
const fillLight = new THREE.DirectionalLight(0x8fdcff, 1.1);
fillLight.position.set(-3, 2, 4);
scene.add(fillLight);

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
function buildPremiumAvatar() {
  const root = new THREE.Group();
  root.name = "PremiumSouthIndianFemaleVirtualAssistant";

  const skin = new THREE.MeshStandardMaterial({ color: 0xb97858, roughness: 0.54, metalness: 0.015 });
  const skinBlush = new THREE.MeshStandardMaterial({ color: 0xd99181, roughness: 0.62, transparent: true, opacity: 0.38 });
  const blazerMat = new THREE.MeshStandardMaterial({ color: 0x050507, roughness: 0.68, metalness: 0.1 });
  const topMat = new THREE.MeshStandardMaterial({ color: 0x010102, roughness: 0.76, metalness: 0.05 });
  const trouserMat = new THREE.MeshStandardMaterial({ color: 0x08080b, roughness: 0.72, metalness: 0.06 });
  const sneakerMat = new THREE.MeshStandardMaterial({ color: 0xf7f7f2, roughness: 0.48, metalness: 0.02 });
  const hairMat = new THREE.MeshStandardMaterial({ color: 0x030305, roughness: 0.82, metalness: 0.12 });
  const browMat = new THREE.MeshStandardMaterial({ color: 0x100b0a, roughness: 0.7 });
  const eyeWhiteMat = new THREE.MeshStandardMaterial({ color: 0xfff7ef, roughness: 0.35 });
  const irisMat = new THREE.MeshStandardMaterial({ color: 0x21140f, roughness: 0.24 });
  const lipMat = new THREE.MeshStandardMaterial({ color: 0x8c3440, roughness: 0.5 });

  const make = (geo, mat, pos, scale = [1, 1, 1], name = "") => {
    const mesh = new THREE.Mesh(geo, mat);
    mesh.position.set(...pos);
    mesh.scale.set(...scale);
    mesh.name = name;
    mesh.castShadow = true;
    root.add(mesh);
    return mesh;
  };

// Realistic cartoon proportions in a full standing figure: head 15%, torso 45%, legs 40%.
  const neck = make(new THREE.CapsuleGeometry(0.055, 0.18, 10, 24), skin, [0, 1.08, 0], [1, 1, 0.9], "visible neck");
  const head = make(new THREE.SphereGeometry(0.19, 64, 40), skin, [0, 1.31, 0.02], [0.82, 1.18, 0.76], "oval South Indian face");
  const torso = make(new THREE.CapsuleGeometry(0.23, 0.8, 14, 36), blazerMat, [0, 0.55, 0], [0.92, 1, 0.52], "tailored black blazer torso");
  const waist = make(new THREE.CapsuleGeometry(0.18, 0.2, 10, 28), trouserMat, [0, 0.08, 0], [0.9, 1, 0.5], "visible waist");
  make(new THREE.CapsuleGeometry(0.16, 0.72, 12, 32), topMat, [0, 0.58, 0.04], [0.78, 1, 0.38], "black professional top");
  const leftLapel = make(new THREE.BoxGeometry(0.1, 0.52, 0.035), blazerMat, [-0.105, 0.68, 0.145], [1, 1, 1], "left blazer lapel");
  leftLapel.rotation.z = -0.22;
  const rightLapel = make(new THREE.BoxGeometry(0.1, 0.52, 0.035), blazerMat, [0.105, 0.68, 0.145], [1, 1, 1], "right blazer lapel");
  rightLapel.rotation.z = 0.22;

  const leftLeg = make(new THREE.CapsuleGeometry(0.075, 0.86, 10, 28), trouserMat, [-0.09, -0.43, 0], [0.88, 1, 0.65], "left proportionate trouser leg");
  const rightLeg = make(new THREE.CapsuleGeometry(0.075, 0.86, 10, 28), trouserMat, [0.09, -0.43, 0], [0.88, 1, 0.65], "right proportionate trouser leg");
  make(new THREE.BoxGeometry(0.2, 0.07, 0.34), sneakerMat, [-0.09, -0.92, 0.09], [1, 1, 1], "left white sneaker");
  make(new THREE.BoxGeometry(0.2, 0.07, 0.34), sneakerMat, [0.09, -0.92, 0.09], [1, 1, 1], "right white sneaker");

  const leftArm = make(new THREE.CapsuleGeometry(0.045, 0.69, 8, 24), blazerMat, [-0.31, 0.53, 0.005], [1, 1, 0.86], "left visible arm");
  leftArm.rotation.z = -0.14;
  const rightArm = make(new THREE.CapsuleGeometry(0.045, 0.69, 8, 24), blazerMat, [0.31, 0.53, 0.005], [1, 1, 0.86], "right visible arm");
  rightArm.rotation.z = 0.14;
  const leftHand = make(new THREE.SphereGeometry(0.052, 28, 18), skin, [-0.34, 0.12, 0.07], [0.86, 1.15, 0.48], "left visible hand");
  const rightHand = make(new THREE.SphereGeometry(0.052, 28, 18), skin, [0.34, 0.12, 0.07], [0.86, 1.15, 0.48], "right visible hand");

  make(new THREE.SphereGeometry(0.035, 24, 14), skinBlush, [-0.07, 1.29, 0.16], [1.25, 0.55, 0.22], "soft left cheek");
  make(new THREE.SphereGeometry(0.035, 24, 14), skinBlush, [0.07, 1.29, 0.16], [1.25, 0.55, 0.22], "soft right cheek");
  make(new THREE.SphereGeometry(0.021, 24, 12), eyeWhiteMat, [-0.058, 1.34, 0.158], [1.35, 0.72, 0.22], "natural left eye white");
  make(new THREE.SphereGeometry(0.021, 24, 12), eyeWhiteMat, [0.058, 1.34, 0.158], [1.35, 0.72, 0.22], "natural right eye white");
  make(new THREE.SphereGeometry(0.012, 18, 10), irisMat, [-0.052, 1.337, 0.173], [1, 1, 0.22], "left dark iris");
  make(new THREE.SphereGeometry(0.012, 18, 10), irisMat, [0.064, 1.337, 0.173], [1, 1, 0.22], "right dark iris");
  const leftBrow = make(new THREE.BoxGeometry(0.072, 0.01, 0.01), browMat, [-0.058, 1.382, 0.17], [1, 1, 1], "natural left eyebrow");
  leftBrow.rotation.z = 0.1;
  const rightBrow = make(new THREE.BoxGeometry(0.072, 0.01, 0.01), browMat, [0.058, 1.382, 0.17], [1, 1, 1], "natural right eyebrow");
  rightBrow.rotation.z = -0.1;
  const nose = make(new THREE.ConeGeometry(0.018, 0.052, 24), skin, [0.006, 1.303, 0.174], [0.65, 1, 0.36], "natural nose");
  nose.rotation.x = Math.PI / 2;
  const smile = make(new THREE.TorusGeometry(0.043, 0.0045, 8, 36, Math.PI), lipMat, [0, 1.255, 0.176], [1, 0.45, 1], "soft smile mouth");
  smile.rotation.set(0, 0, Math.PI);

  make(new THREE.SphereGeometry(0.17, 56, 28, 0, Math.PI * 2, 0, Math.PI * 0.66), hairMat, [-0.018, 1.385, -0.018], [1.08, 0.92, 0.92], "side parted black hair crown");
  for (let i = 0; i < 14; i++) {
    const leftSide = i < 9;
    const side = leftSide ? -1 : 1;
    const row = leftSide ? i : i - 9;
    const curl = make(new THREE.TorusKnotGeometry(0.035 + row * 0.002, 0.011, 72, 8), hairMat, [side * (0.13 + (row % 3) * 0.027), 1.22 - row * 0.06, -0.015], [0.62, 1.08, 0.56], "shoulder length black wavy hair");
    curl.rotation.set(0.56, side * 0.18, side * (0.36 + row * 0.05));
  }

  root.position.set(0, -0.08, 0);
  root.scale.setScalar(2.05);
  scene.add(root);
  avatarRoot = root;
  proceduralAvatar = { head, neck, torso, waist, leftArm, rightArm, leftHand, rightHand, leftLeg, rightLeg, smile };}


function loadAvatar() {
    if (USE_PROCEDURAL_PREMIUM_AVATAR) {
    buildPremiumAvatar();
    canvas.hidden = false;
    fallback?.setAttribute("hidden", "");
    setAvatarState("idle");
    return;
  }
  new GLTFLoader().load(AVATAR_FILE, (gltf) => {
    avatarRoot = gltf.scene;
    avatarRoot.position.set(0, -1.45, 0);
    avatarRoot.scale.setScalar(1.75);
    scene.add(avatarRoot);
    mixer = new THREE.AnimationMixer(avatarRoot);
    gltf.animations.forEach((clip) => {
      clips[clip.name.toLowerCase()] = clip;
    });
    findRigParts(avatarRoot);
    canvas.hidden = false;
   fallback?.setAttribute("hidden", "");
    setAvatarState("idle");
  }, undefined, () => {
    buildPremiumAvatar();
    canvas.hidden = false;
       fallback?.setAttribute("hidden", "");
    setAvatarState("idle");
  });
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
    if (proceduralAvatar) {
    proceduralAvatar.head.scale.y = blink ? 0.96 : 1.04;
    proceduralAvatar.torso.position.y = 0.42 + Math.sin(t * 1.4) * 0.012;
    proceduralAvatar.head.rotation.x = currentState === "listening" ? 0.18 : Math.sin(t * 1.2) * 0.025;
    proceduralAvatar.smile.scale.y = currentState === "talking" ? 0.5 + mouth * 1.8 : 0.5;
    proceduralAvatar.rightArm.rotation.z = currentState === "pointing" ? -1.18 : currentState === "greeting" ? -0.85 + Math.sin(t * 9) * 0.22 : currentState === "talking" ? 0.22 + Math.sin(t * 5) * 0.14 : 0.22;
    proceduralAvatar.leftArm.rotation.z = currentState === "talking" ? -0.22 + Math.sin(t * 4.2) * 0.12 : -0.22;
    proceduralAvatar.rightHand.position.y = currentState === "greeting" ? 0.28 + Math.sin(t * 9) * 0.1 : -0.03;
    proceduralAvatar.leftHand.position.y = currentState === "talking" ? -0.03 + Math.sin(t * 4.2) * 0.04 : -0.03;
  }
  avatarRoot.rotation.y = Math.sin(t * 0.8) * 0.035;
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

