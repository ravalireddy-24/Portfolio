const AVATAR_URL = "/static/models/ravali-avatar.glb";
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
const canvas = document.getElementById("avatarCanvas");
const voiceBtn = document.getElementById("voiceBtn");
const voiceBtnText = document.getElementById("voiceBtnText");
const statusText = document.getElementById("status");
const transcriptText = document.getElementById("transcriptText");
const assistantTitle = document.getElementById("assistantTitle");
const assistantMessage = document.getElementById("assistantMessage");

let recognition;
let currentState = "idle";
let avatarRoot;
let headBone;
let armBone;
let morphTargets = [];
let baseScale = 1;
let baseY = 0;
let speakingTimeout;
let voices = [];

function updateAssistant(title, message, status) {
  assistantTitle.textContent = title;
  assistantMessage.textContent = message;
  statusText.textContent = status;
}
function setAvatarState(state) {
  currentState = state;
  avatarShell.dataset.avatarState = state;
  ["idle", "listening", "thinking", "talking", "pointing", "speaking"].forEach((name) => {
    avatarShell.classList.toggle(`is-${name}`, state === name || (name === "speaking" && state === "talking"));
  });
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
  clearTimeout(speakingTimeout);
  setAvatarState("speaking");
    setAvatarState("talking");
  updateAssistant(assistantTitle.textContent, assistantMessage.textContent, "Speaking");

  if ("speechSynthesis" in window) {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(message);
        const voice = getFemaleEnglishVoice();
    if (voice) utterance.voice = voice;
    utterance.lang = voice?.lang || "en-US";
    utterance.rate = 0.96;
    utterance.pitch = 1.08;
    utterance.onstart = () => setAvatarState("talking");
    utterance.onend = () => {
      setAvatarState("idle");
      statusText.textContent = "Ready";
    };
    utterance.onerror = () => {
      setAvatarState("idle");
      statusText.textContent = "Ready";
    };
    window.speechSynthesis.speak(utterance);
  } else {
    speakingTimeout = window.setTimeout(() => {
      setAvatarState("idle");
      statusText.textContent = "Ready";
    }, 4200);  }
}

function runCommand(sectionId) {
    const label = document.getElementById(sectionId)?.dataset.sectionTitle || sectionId;
  const script = SECTION_SCRIPTS[sectionId] || SECTION_SCRIPTS.home;
  updateAssistant(label, script, "3D avatar is guiding this section.");
  speak(script);
    setAvatarState("pointing");
  scrollToSection(sectionId);
  updateAssistant(label, script, "Thinking");
  window.setTimeout(() => speak(script), 420);
}
function handleTranscript(transcript) {
    console.log("Voice transcript:", transcript);
  transcriptText.textContent = transcript;
  setAvatarState("thinking");
  updateAssistant("You said:", transcript, "Thinking");
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
    const helpText = "Speech recognition is not supported in this browser. Please use Chrome at http://127.0.0.1:5000 or use the quick command buttons.";
    updateAssistant("Voice unsupported", helpText, "Ready");
    transcriptText.textContent = helpText;
    console.error(helpText);
    return;
  }

  window.speechSynthesis?.cancel();
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

  recognition.onresult = (event) => handleTranscript(event.results[0][0].transcript);
    recognition.onresult = (event) => {
    const transcript = Array.from(event.results).map((result) => result[0].transcript).join(" ").trim();
    transcriptText.textContent = transcript;
    if (event.results[event.results.length - 1].isFinal) handleTranscript(transcript);
  };

  recognition.onerror = (event) => {
    setAvatarState("idle");
    updateAssistant("Please try again", "I had trouble hearing that command.", "Voice error. Please try again.");
  };
  recognition.onend = () => {
    voiceBtn.disabled = false;
    voiceBtnText.textContent = "Click microphone";
    if (currentState === "listening") {
      setAvatarState("idle");
      statusText.textContent = "Ready";
    }
  };

  recognition.start();
}
async function initThreeAvatar() {
  const THREE = await import("https://cdn.jsdelivr.net/npm/three@0.165.0/build/three.module.js");
  const { GLTFLoader } = await import("https://cdn.jsdelivr.net/npm/three@0.165.0/examples/jsm/loaders/GLTFLoader.js");

  const scene = new THREE.Scene();
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.08;

  const camera = new THREE.PerspectiveCamera(28, 1, 0.1, 100);
  camera.position.set(0, 1.45, 6.2);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x6e78a8, 2.4));
  const keyLight = new THREE.DirectionalLight(0xffffff, 3.2);
  keyLight.position.set(3.4, 5, 4.5);
  scene.add(keyLight);
  const rimLight = new THREE.DirectionalLight(0x66ddff, 2.1);
  rimLight.position.set(-3, 3.2, -2.5);
  scene.add(rimLight);

  const loader = new GLTFLoader();
  loader.load(AVATAR_URL, (gltf) => {
    avatarRoot = gltf.scene;
    const box = new THREE.Box3().setFromObject(avatarRoot);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    baseScale = 3.65 / Math.max(size.x, size.y, size.z);
    avatarRoot.scale.setScalar(baseScale);
    avatarRoot.position.set(-center.x * baseScale, -box.min.y * baseScale - 2.0, -0.18);
    avatarRoot.rotation.y = -0.08;
    baseY = avatarRoot.position.y;

    avatarRoot.traverse((node) => {
      if (node.isMesh) {
        node.frustumCulled = false;
        node.castShadow = true;
        node.receiveShadow = true;
        if (node.morphTargetInfluences?.length) morphTargets.push(node);
      }
      if (node.isBone) {
        const name = node.name.toLowerCase();
        if (!headBone && /head|neck/.test(name)) headBone = node;
        if (!armBone && /(right|r_).*?(upperarm|arm|hand)|shoulder_r|mixamorigrightarm/.test(name)) armBone = node;
      }
    });

    scene.add(avatarRoot);
    avatarShell.classList.add("is-loaded");
    console.log("GLB avatar loaded successfully:", AVATAR_URL);
  }, undefined, (error) => {
    console.error("GLB avatar failed to load:", AVATAR_URL, error);
    document.getElementById("avatarLoadMessage").textContent = "3D avatar failed to load.";
  });

  function resize() {
    const { clientWidth, clientHeight } = canvas.parentElement;
    renderer.setSize(clientWidth, clientHeight, false);
    camera.aspect = clientWidth / clientHeight;
    camera.updateProjectionMatrix();
  }

  function animate(now = 0) {
    resize();
    const t = now * 0.001;
    if (avatarRoot) {
      avatarRoot.position.y = baseY + Math.sin(t * 1.35) * 0.035;
      avatarRoot.rotation.x = Math.sin(t * 1.1) * 0.012;
      avatarRoot.rotation.z = 0;
      avatarRoot.rotation.y = -0.08 + Math.sin(t * 0.8) * 0.025;

      if (currentState === "listening") {
        avatarRoot.rotation.x = -0.075;
        avatarRoot.position.z = 0.08;
      } else if (currentState === "thinking") {
        avatarRoot.rotation.z = Math.sin(t * 2.6) * 0.035 + 0.04;
      } else if (currentState === "talking") {
        const nod = Math.sin(t * 8) * 0.04;
        if (headBone) headBone.rotation.x = nod;
        morphTargets.forEach((mesh) => {
          mesh.morphTargetInfluences[0] = (Math.sin(t * 14) + 1) * 0.28;
        });
      } else if (currentState === "pointing") {
        avatarRoot.rotation.y = -0.38;
        if (armBone) {
          armBone.rotation.z = -0.85;
          armBone.rotation.x = 0.35;
        }
      } else {
        if (headBone) headBone.rotation.x = Math.sin(t * 1.7) * 0.015;
        if (armBone) {
          armBone.rotation.z *= 0.9;
          armBone.rotation.x *= 0.9;
        }
        morphTargets.forEach((mesh) => mesh.morphTargetInfluences.fill(0));
      }
    }
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  }

  animate();
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

initThreeAvatar().catch((error) => {
  console.error("GLB avatar failed to initialize:", error);
  document.getElementById("avatarLoadMessage").textContent = "3D avatar could not initialize.";
});
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

