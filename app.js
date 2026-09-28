(() => {
  "use strict";

  const OUTCOMES = [
    { message: "Ganhou brinde!", state: "win" },
    { message: "Não ganhou...", state: "lose" },
    { message: "Ganhou brinde!", state: "win" },
    { message: "Não ganhou...", state: "lose" },
    { message: "Ganhou brinde!", state: "win" },
    { message: "Não ganhou...", state: "lose" },
    { message: "Ganhou brinde!", state: "win" },
    { message: "Não ganhou...", state: "lose" },
  ];

  const wheelAction = document.querySelector("#wheelAction");
  const wheel = document.querySelector("#wheel");
  const canvas = document.querySelector("#wheelCanvas");
  const spinButton = document.querySelector("#spinButton");
  const spinButtonText = document.querySelector("#spinButtonText");
  const result = document.querySelector("#result");
  const resultText = document.querySelector("#resultText");
  const confetti = document.querySelector("#confetti");
  const context = canvas.getContext("2d");
  const segmentDegrees = 360 / OUTCOMES.length;

  let spinning = false;
  let selectedIndex = 0;
  let finishTimer = null;

  function normalizeDegrees(degrees) {
    return ((degrees % 360) + 360) % 360;
  }

  function getRotationDegrees(element) {
    const transform = window.getComputedStyle(element).transform;
    if (!transform || transform === "none") return 0;

    const values = transform.match(/matrix\(([^)]+)\)/);
    if (!values) return 0;
    const matrix = values[1].split(",").map(Number);
    return (Math.atan2(matrix[1], matrix[0]) * 180) / Math.PI;
  }

  function resizeCanvas() {
    const size = Math.max(1, Math.round(canvas.getBoundingClientRect().width));
    const pixelRatio = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width = size * pixelRatio;
    canvas.height = size * pixelRatio;
    context.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    drawWheel(size);
  }

  function drawWheel(size) {
    const radius = size / 2;
    const outerRadius = radius - 3;
    const segmentAngle = (Math.PI * 2) / OUTCOMES.length;
    context.clearRect(0, 0, size, size);
    context.save();
    context.translate(radius, radius);

    OUTCOMES.forEach((outcome, index) => {
      const start = -Math.PI / 2 - segmentAngle / 2 + index * segmentAngle;
      const end = start + segmentAngle;
      const isWin = outcome.state === "win";
      const gradient = context.createRadialGradient(0, 0, radius * 0.08, 0, 0, outerRadius);
      gradient.addColorStop(0, isWin ? "#27b77f" : "#ee6370");
      gradient.addColorStop(1, isWin ? "#159b67" : "#d94754");

      context.beginPath();
      context.moveTo(0, 0);
      context.arc(0, 0, outerRadius, start, end);
      context.closePath();
      context.fillStyle = gradient;
      context.fill();
      context.lineWidth = Math.max(2, size * 0.009);
      context.strokeStyle = "rgba(255, 255, 255, 0.93)";
      context.stroke();

      const middle = start + segmentAngle / 2;
      const labelRadius = outerRadius * 0.62;
      context.save();
      let labelRotation = middle + Math.PI / 2;
      if (labelRotation > Math.PI / 2 && labelRotation < (Math.PI * 3) / 2) {
        labelRotation += Math.PI;
      }
      context.rotate(labelRotation);
      context.translate(0, -labelRadius);
      context.fillStyle = "#ffffff";
      context.textAlign = "center";
      context.textBaseline = "middle";
      context.font = `900 ${Math.max(10, size * 0.045)}px system-ui, sans-serif`;
      context.fillText(isWin ? "GANHOU" : "NÃO", 0, -size * 0.026);
      context.font = `800 ${Math.max(9, size * 0.037)}px system-ui, sans-serif`;
      context.fillText(isWin ? "BRINDE!" : "GANHOU...", 0, size * 0.026);
      context.restore();
    });

    context.beginPath();
    context.arc(0, 0, outerRadius, 0, Math.PI * 2);
    context.lineWidth = Math.max(3, size * 0.013);
    context.strokeStyle = "#ffffff";
    context.stroke();
    context.restore();
  }

  function setResult(message, state, icon) {
    result.dataset.state = state;
    result.querySelector(".result__icon").textContent = icon;
    resultText.textContent = message;
  }

  function setWheelRotation(startDegrees, endDegrees, duration) {
    wheel.style.transition = "none";
    wheel.style.transform = `rotate(${startDegrees}deg)`;
    void wheel.offsetWidth;
    wheel.style.transition = `transform ${duration}ms cubic-bezier(0.12, 0.72, 0.12, 1)`;
    wheel.style.transform = `rotate(${endDegrees}deg)`;
  }

  function finishSpin() {
    window.clearTimeout(finishTimer);
    spinning = false;
    const outcome = OUTCOMES[selectedIndex];
    setResult(outcome.message, outcome.state, outcome.state === "win" ? "✦" : "•");
    spinButtonText.textContent = "Girar novamente";
    wheelAction.setAttribute("aria-label", "Girar a roleta novamente");
    if (outcome.state === "win") launchConfetti();
  }

  function scheduleFinish(duration) {
    window.clearTimeout(finishTimer);
    finishTimer = window.setTimeout(finishSpin, duration + 45);
  }

  function startSpin() {
    if (spinning) {
      finishSoon();
      return;
    }

    spinning = true;
    selectedIndex = Math.floor(Math.random() * OUTCOMES.length);
    const current = getRotationDegrees(wheel);
    const target = normalizeDegrees(-selectedIndex * segmentDegrees);
    const distance = normalizeDegrees(target - current);
    const finalRotation = current + 5 * 360 + distance;

    setResult("Girando… toque na roleta para parar mais rápido.", "spinning", "↻");
    spinButtonText.textContent = "Parar mais rápido";
    wheelAction.setAttribute("aria-label", "Parar a roleta mais rápido");
    setWheelRotation(current, finalRotation, 4000);
    scheduleFinish(4000);
  }

  function finishSoon() {
    if (!spinning) return;
    const current = getRotationDegrees(wheel);
    const target = normalizeDegrees(-selectedIndex * segmentDegrees);
    const distance = normalizeDegrees(target - current);
    const finalRotation = current + 360 + distance;
    setWheelRotation(current, finalRotation, 650);
    scheduleFinish(650);
  }

  function launchConfetti() {
    const colors = ["#f36b21", "#662976", "#159b67", "#ffd24c", "#ee6370"];
    for (let index = 0; index < 26; index += 1) {
      const piece = document.createElement("span");
      piece.className = "confetti__piece";
      piece.style.left = `${6 + Math.random() * 88}%`;
      piece.style.background = colors[index % colors.length];
      piece.style.setProperty("--drift", `${-90 + Math.random() * 180}px`);
      piece.style.setProperty("--rotate", `${Math.random() * 180}deg`);
      piece.style.animationDelay = `${Math.random() * 0.16}s`;
      confetti.appendChild(piece);
      window.setTimeout(() => piece.remove(), 1600);
    }
  }

  wheelAction.addEventListener("click", startSpin);
  spinButton.addEventListener("click", startSpin);
  window.addEventListener("resize", resizeCanvas, { passive: true });
  resizeCanvas();

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
      navigator.serviceWorker.register("./sw.js").catch(() => {
        // The game remains usable even if a browser blocks service workers.
      });
    });
  }
})();
