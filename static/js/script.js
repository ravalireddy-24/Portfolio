const voiceBtn = document.getElementById("voiceBtn");
const statusText = document.getElementById("status");

function speak(text) {
  const voice = new SpeechSynthesisUtterance(text);
  voice.rate = 1;
  voice.pitch = 1;
  voice.volume = 1;
  window.speechSynthesis.speak(voice);
}

function showSection(sectionId, message) {
  document.querySelectorAll(".section").forEach(section => {
    section.classList.remove("active");
  });

  document.getElementById(sectionId).classList.add("active");
  speak(message);
}

function goHome() {
  showSection(
    "home",
    "Welcome back. Which section would you like to explore?"
  );
}

function handleCommand(command) {
  command = command.toLowerCase();

  if (command.includes("experience")) {
    showSection(
      "experience",
      "Here is Ravali's experience section. She has strong experience in software development, cloud, data, and full stack applications."
    );
  }
  else if (command.includes("project")) {
    showSection(
      "projects",
      "Here are Ravali's projects. You can explore her work in web development, artificial intelligence, cloud, and automation."
    );
  }
  else if (command.includes("skill")) {
    showSection(
      "skills",
      "Here are Ravali's technical skills including Python, Java, JavaScript, React, Flask, SQL, AWS, and AI tools."
    );
  }
  else if (command.includes("contact")) {
    showSection(
      "contact",
      "Here is the contact section. You can reach Ravali through email, LinkedIn, or GitHub."
    );
  }
  else if (command.includes("home")) {
    goHome();
  }
  else {
    speak("Sorry, I did not understand. You can say experience, projects, skills, or contact.");
  }
}

voiceBtn.addEventListener("click", () => {
  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    alert("Voice recognition is not supported in this browser. Please use Chrome.");
    return;
  }

  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.start();

  statusText.innerText = "Listening...";

  recognition.onresult = function(event) {
    const command = event.results[0][0].transcript;
    statusText.innerText = `You said: ${command}`;
    handleCommand(command);
  };

  recognition.onerror = function() {
    statusText.innerText = "Voice error. Please try again.";
  };
});

window.onload = () => {
  setTimeout(() => {
    speak("Hi, welcome to my portfolio. How can I help you? Which section would you like to explore?");
  }, 800);
};