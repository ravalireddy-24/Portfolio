const voiceBtn = document.getElementById("voiceBtn");
const statusText = document.getElementById("status");
const avatarBtn = document.getElementById("avatarBtn");
const greetingMessage = "Hie, welcome to my portfolio. How can I help you? Which section would you like to explore?";
import React, { createElement as h, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { motion } from "framer-motion";


const gsap = window.gsap;

const AVATAR_STATES = {
  IDLE: "idle",
  LISTENING: "listening",
  THINKING: "thinking",
  TALKING: "talking",
};

const sectionNarration = {
  experience: "Here is Ravali's experience section. She has strong experience in software development, cloud, data, and full stack applications.",
  projects: "Here are Ravali's projects. You can explore her work in web development, artificial intelligence, cloud, and automation.",
  skills: "Here are Ravali's technical skills including Python, Java, JavaScript, React, Flask, SQL, AWS, and AI tools.",
  contact: "Here is the contact information section. You can reach Ravali through email, LinkedIn, or GitHub.",
};

const commandMap = [
  { id: "experience", phrases: ["show experience", "experience", "work history"] },
  { id: "projects", phrases: ["show projects", "projects", "portfolio projects"] },
  { id: "skills", phrases: ["show skills", "skills", "technical skills"] },
  { id: "contact", phrases: ["contact information", "show contact", "contact"] },
];

const idleAnimation = {
  y: [0, -8, 0],
  rotate: [0, -1.2, 1.1, 0],
  scale: [1, 1.015, 1],
  transition: { duration: 4.8, repeat: Infinity, ease: "easeInOut" },
};

const listenAnimation = {
  rotate: [0, -4, -3, -4],
  scale: [1, 1.025, 1.015, 1.025],
  transition: { duration: 1.8, repeat: Infinity, ease: "easeInOut" },
};

const thinkingAnimation = {
  rotate: [0, 3, -1, 3],
  y: [0, -3, 1, -3],
  transition: { duration: 1.6, repeat: Infinity, ease: "easeInOut" },
};

const talkAnimation = {
  y: [0, -4, 1, -3, 0],
  rotate: [0, -2, 2, -1, 0],
  transition: { duration: 1.2, repeat: Infinity, ease: "easeInOut" },
};

const waveAnimation = {
  rotate: [0, 24, -18, 22, -10, 0],
  transition: { duration: 1.25, ease: "easeInOut" },
};

const pointAnimation = {
  x: [0, 26, 18, 26, 0],
  rotate: [0, -10, -8, -10, 0],
  transition: { duration: 1.2, ease: "easeInOut" },
};

const walkAnimation = {
  x: [0, 40, 90, 120],
  y: [0, -4, 2, 0],
  transition: { duration: 1.25, ease: "easeInOut" },
};

function setActiveSection(sectionId) {
  document.querySelectorAll(".section").forEach((section) => {
    section.classList.toggle("active", section.id === sectionId);
  });
}
function findCommand(transcript) {
  const normalized = transcript.toLowerCase();
  return commandMap.find((command) => command.phrases.some((phrase) => normalized.includes(phrase)));
}

function AvatarController({ avatarSrc }) {
  const [avatarState, setAvatarState] = useState(AVATAR_STATES.IDLE);
  const [status, setStatus] = useState("Try saying: “Show Experience”, “Show Projects”, “Show Skills”, or “Contact Information”.");
  const [bubble, setBubble] = useState({ title: "Hi! 👋", lines: ["Welcome to my portfolio.", "I can guide you with voice commands.", "Which section would you like to explore?"] });
  const [gesture, setGesture] = useState("wave");
  const avatarRef = useRef(null);
  const handRef = useRef(null);
  const mouthRef = useRef(null);
  const recognitionRef = useRef(null);
  const activeSpeechRef = useRef(null);


  const speak = useCallback((text, onEnd) => {
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    activeSpeechRef.current = utterance;
    utterance.rate = 1;
    utterance.pitch = 1.04;
    utterance.volume = 1;
    utterance.onstart = () => setAvatarState(AVATAR_STATES.TALKING);
    utterance.onend = () => {
      activeSpeechRef.current = null;
      setAvatarState(AVATAR_STATES.IDLE);
      if (onEnd) onEnd();
    };
    utterance.onerror = utterance.onend;
    window.speechSynthesis.speak(utterance);
  }, []);

  const greet = useCallback(() => {
    setGesture("wave");
    setBubble({ title: "Hi! 👋", lines: ["I’m Ravali’s virtual assistant.", "Ask me to show experience, projects, skills, or contact information."] });
    speak("Hi, welcome to Ravali's portfolio. I can show experience, projects, skills, or contact information. How can I help you?");
  }, [speak]);

 const navigateToSection = useCallback((sectionId) => {
    const label = document.getElementById(sectionId)?.dataset.sectionTitle || sectionId;
    setAvatarState(AVATAR_STATES.THINKING);
    setGesture("walk");
    setBubble({ title: "On it!", lines: [`I understood: ${label}.`, "Let me take you there."] });
    setStatus(`Navigating to ${label}...`);

    if (gsap && avatarRef.current) {
      gsap.timeline()
        .to(avatarRef.current, { x: 120, y: -8, duration: 0.55, ease: "power2.inOut" })
        .to(avatarRef.current, { x: 0, y: 0, duration: 0.55, ease: "power2.inOut" });
    }

    window.setTimeout(() => {
      setActiveSection(sectionId);
      setGesture("point");
      setBubble({ title: label, lines: ["Here is the section you requested.", "I’ll point out the highlights."] });
      setStatus(`Showing ${label}.`);
      speak(`Absolutely. Showing ${label}. ${sectionNarration[sectionId]}`);
    }, 950);
  }, [speak]);

  const handleCommand = useCallback((transcript) => {
    const command = findCommand(transcript);
    setAvatarState(AVATAR_STATES.THINKING);
    setGesture("thinking");
    setStatus(`You said: ${transcript}`);

    if (command) {
      setGesture("nod");
      window.setTimeout(() => navigateToSection(command.id), 500);
      return;
    }

    setBubble({ title: "Thinking...", lines: ["I didn’t catch a matching section.", "Try experience, projects, skills, or contact."] });
    speak("Sorry, I did not understand. You can say show experience, show projects, show skills, or contact information.");
  }, [navigateToSection, speak]);

  const startListening = useCallback(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setStatus("Voice recognition is not supported in this browser. Please use Chrome or Edge.");
      speak("Voice recognition is not supported in this browser. Please use Chrome or Edge.");
      return;
    }

    window.speechSynthesis.cancel();
    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.continuous = false;

    recognition.onstart = () => {
      setAvatarState(AVATAR_STATES.LISTENING);
      setGesture("listen");
      setBubble({ title: "I’m listening...", lines: ["Tell me where you want to go.", "Example: Show Projects."] });
      setStatus("Listening...");
    };
    recognition.onresult = (event) => handleCommand(event.results[0][0].transcript);
    recognition.onerror = () => {
      setAvatarState(AVATAR_STATES.IDLE);
      setStatus("Voice error. Please try again.");
    };
    recognition.onend = () => {
      if (avatarState === AVATAR_STATES.LISTENING) setAvatarState(AVATAR_STATES.IDLE);
    };
    recognition.start();
  }, [avatarState, handleCommand, speak]);

  useEffect(() => {
    const timer = window.setTimeout(greet, 700);
    return () => {
      window.clearTimeout(timer);
      window.speechSynthesis.cancel();
      recognitionRef.current?.abort();
    };
  }, [greet]);

  useEffect(() => {
    if (!mouthRef.current || !handRef.current) return;
    if (!gsap) return;
    gsap.killTweensOf([mouthRef.current, handRef.current]);
    if (avatarState === AVATAR_STATES.TALKING) {
      gsap.to(mouthRef.current, { scaleY: 1.9, duration: 0.16, repeat: -1, yoyo: true, transformOrigin: "center", ease: "sine.inOut" });
      gsap.to(handRef.current, { rotate: -12, x: 8, duration: 0.7, repeat: -1, yoyo: true, ease: "sine.inOut" });
    } else {
      gsap.set(mouthRef.current, { scaleY: 1 });
    }
  }, [avatarState]);

  const currentAnimation = useMemo(() => {
    if (gesture === "walk") return walkAnimation;
    if (avatarState === AVATAR_STATES.LISTENING) return listenAnimation;
    if (avatarState === AVATAR_STATES.THINKING) return thinkingAnimation;
    if (avatarState === AVATAR_STATES.TALKING) return talkAnimation;
    return idleAnimation;
  }, [avatarState, gesture]);

  const handAnimation = gesture === "wave" ? waveAnimation : gesture === "point" ? pointAnimation : undefined;

  return h("div", { className: `assistant-shell is-${avatarState}` },
    h("div", { className: "avatar-area" },
      h(motion.button, {
        ref: avatarRef,
        className: `avatar-button gesture-${gesture}`,
        type: "button",
        "aria-label": "Greet the virtual assistant",
        animate: currentAnimation,
        onClick: greet,
      },
        h("span", { className: "listening-ring", "aria-hidden": true }),
        h("img", { src: avatarSrc, className: "avatar", alt: "Ravali portfolio avatar maintaining friendly eye contact" }),
        h("span", { className: "avatar-eye avatar-eye-left", "aria-hidden": true }),
        h("span", { className: "avatar-eye avatar-eye-right", "aria-hidden": true }),
        h("span", { ref: mouthRef, className: "avatar-mouth", "aria-hidden": true }),
        h(motion.span, { ref: handRef, className: "avatar-hand", "aria-hidden": true, animate: handAnimation })
      ),
      h("div", { className: "speech-box", role: "status", "aria-live": "polite" },
        h("h2", null, bubble.title),
        bubble.lines.map((line) => h("p", { key: line }, line))
      )
    ),
    h("button", { id: "voiceBtn", className: "voice-btn", type: "button", onClick: startListening },
      h("span", { "aria-hidden": true, className: "voice-icon" }),
      avatarState === AVATAR_STATES.LISTENING ? "Listening..." : "Click to Speak"
    ),
    h("p", { id: "status" }, status)
  );
}


function goHome() {
  setActiveSection("home");
  window.speechSynthesis.cancel();
}
window.goHome = goHome;

const avatarRoot = document.getElementById("avatar-root");
if (avatarRoot) {
  createRoot(avatarRoot).render(h(AvatarController, { avatarSrc: avatarRoot.dataset.avatarSrc }));

}

