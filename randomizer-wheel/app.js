const promptNameInput = document.getElementById("promptName");
const promptDescriptionInput = document.getElementById("promptDescription");
const promptLinkInput = document.getElementById("promptLink");
const promptFileInput = document.getElementById("promptFile");
const bulkPromptsInput = document.getElementById("bulkPrompts");
const setupPanel = document.getElementById("setupPanel");
const wheelSection = document.getElementById("wheelSection");
const contentSection = document.querySelector(".content");
const addPromptBtn = document.getElementById("addPromptBtn");
const importPastedBtn = document.getElementById("importPastedBtn");
const startWheelBtn = document.getElementById("startWheelBtn");
const editPromptsBtn = document.getElementById("editPromptsBtn");
const clearPromptsBtn = document.getElementById("clearPromptsBtn");
const spinBtn = document.getElementById("spinBtn");
const guestImageFileInput = document.getElementById("guestImageFile");
const guestImageEl = document.getElementById("guestImage");
const spinText = document.getElementById("spinText");
const wheel = document.getElementById("wheel");
const pointerEl = document.querySelector(".pointer");
const usedPromptList = document.getElementById("usedPromptList");
const resultDialog = document.getElementById("resultDialog");
const resultName = document.getElementById("resultName");
const resultDescription = document.getElementById("resultDescription");
const resultLinkWrap = document.getElementById("resultLinkWrap");
const resultLink = document.getElementById("resultLink");
const resultOutcomeInputs = document.querySelectorAll('input[name="resultOutcome"]');
const selectedByInput = document.getElementById("selectedByInput");
const closeResultBtn = document.getElementById("closeResultBtn");
const fireworksCanvas = document.getElementById("fireworksCanvas");

console.log("[randomizer-wheel] loaded");

const defaultPrompts = [];

let prompts = [...defaultPrompts];
let usedPrompts = [];
let isSpinning = false;
let currentRotation = 0;
let currentResultId = null;
let isPlayMode = false;
const PEG_RADIUS_FACTOR = 0.94;

function setGuestImageEnabled(enabled) {
  if (!spinBtn || !guestImageEl || !wheel) {
    return;
  }
  spinBtn.dataset.hasGuest = enabled ? "true" : "false";
  wheel.classList.toggle("has-guest-center", enabled);
  if (enabled) {
    guestImageEl.hidden = false;
  } else {
    guestImageEl.hidden = true;
    // Keep src, but hide. If you want it removed, we can clear it here.
  }
}

const wheelColors = [
  "#f7b801",
  "#6bcB77",
  "#4d96ff",
  "#c77dff",
  "#00c2a8",
  "#ff922b",
  "#f06595",
  "#cc1818",
  "#f1c84d",
  "#05d020",
  "#4e4e4e",
  "#003681",
  "#6403ae",       
  "#743800",
  "#4a001a",
  "#18c3cc",
  "#eeeeee",
  "#00ffd0",
  "#7a7aff"
];

function sanitizePrompt(prompt) {
  return {
    id: prompt?.id ?? `prompt-${crypto.randomUUID()}`,
    name: String(prompt?.name ?? "").trim(),
    description: String(prompt?.description ?? "").trim(),
    link: String(prompt?.link ?? "").trim(),
    selectedBy: String(prompt?.selectedBy ?? "").trim(),
    outcome: String(prompt?.outcome ?? "").trim().toLowerCase()
  };
}

function isValidPrompt(prompt) {
  return prompt.name.length > 0;
}

function buildSegmentColors(count) {
  if (count <= wheelColors.length) {
    return wheelColors.slice(0, count);
  }

  const colors = [...wheelColors];
  for (let i = wheelColors.length; i < count; i += 1) {
    const hue = (i * 137.508) % 360;
    colors.push(`hsl(${hue.toFixed(1)} 78% 58%)`);
  }
  return colors;
}

function buildWheelGradient() {
  if (!prompts.length) {
    return "conic-gradient(#2f3f5f 0deg 360deg)";
  }

  const segmentSize = 360 / prompts.length;
  const segmentColors = buildSegmentColors(prompts.length);
  const parts = prompts.map((_, index) => {
    const start = index * segmentSize;
    const end = start + segmentSize;
    return `${segmentColors[index]} ${start}deg ${end}deg`;
  });
  return `conic-gradient(${parts.join(",")})`;
}

function clearWheelLabels() {
  wheel.querySelectorAll(".wheel-label").forEach((label) => label.remove());
}

function clearWheelPegs() {
  wheel.querySelectorAll(".peg").forEach((peg) => peg.remove());
}

function renderWheelPegs() {
  clearWheelPegs();
  if (!prompts.length) {
    return;
  }

  const w = wheel.clientWidth;
  const radius = w / 2;
  const segmentSize = 360 / prompts.length;
  const pegRadius = radius * PEG_RADIUS_FACTOR; // slightly inside the rim
  const pegSize = 14;

  for (let i = 0; i < prompts.length; i += 1) {
    // Place pegs on slice boundaries (like the Amazon wheel).
    const angleDeg = i * segmentSize - 90; // match the label rotation frame
    const angle = (angleDeg * Math.PI) / 180;
    const x = radius + Math.cos(angle) * pegRadius;
    const y = radius + Math.sin(angle) * pegRadius;

    const peg = document.createElement("div");
    peg.className = "peg";
    peg.style.left = `${x - pegSize / 2}px`;
    peg.style.top = `${y - pegSize / 2}px`;
    wheel.appendChild(peg);
  }
}

function renderWheelLabels() {
  clearWheelLabels();
  if (!prompts.length) {
    return;
  }

  const radius = wheel.clientWidth / 2;
  const segmentSize = 360 / prompts.length;
  const textRadius = radius * 0.82;

  prompts.forEach((prompt, index) => {
    // Conic gradients start at 12 o'clock, while CSS rotate(0deg) starts at 3 o'clock.
    // Shift by -90deg so label centerlines align with wheel slice centerlines.
    const angleDeg = index * segmentSize + segmentSize / 2 - 90;
    const label = document.createElement("div");
    label.className = "wheel-label";
    label.textContent = prompt.name;
    label.style.transform = `rotate(${angleDeg}deg) translateX(${textRadius}px) translateY(-50%)`;
    wheel.appendChild(label);
  });
}

function updatePointerShape() {
  if (!pointerEl || !wheel) {
    return;
  }

  const w = wheel.clientWidth;

  // Triangle is built from borders:
  // - border-top controls triangle height (downwards apex)
  // - top controls where the base starts
  // Align tip to the top peg center so it visually "hits" the dot.
  const radius = w / 2;
  const pegRadius = radius * PEG_RADIUS_FACTOR;
  const targetTipY = radius - pegRadius + Math.round(w * 0.012);
  const top = Math.round(-w * 0.03);
  const borderTop = Math.max(20, Math.round(targetTipY - top));
  const side = Math.max(10, Math.round(w * 0.04));

  pointerEl.style.top = `${top}px`;
  pointerEl.style.borderTop = `${borderTop}px solid var(--accent-2)`;
  pointerEl.style.borderLeft = `${side}px solid transparent`;
  pointerEl.style.borderRight = `${side}px solid transparent`;
}

function renderUsedPromptList() {
  usedPromptList.innerHTML = "";
  if (!usedPrompts.length) {
    const li = document.createElement("li");
    li.textContent = "No prompts used yet.";
    usedPromptList.appendChild(li);
    return;
  }

  usedPrompts.forEach((prompt) => {
    const li = document.createElement("li");
    const outcome = prompt.outcome === "success" ? "Success" : prompt.outcome === "fail" ? "Fail" : "-";
    li.classList.toggle("used-success", prompt.outcome === "success");
    li.classList.toggle("used-fail", prompt.outcome === "fail");
    li.innerHTML = `<strong>${escapeHtml(prompt.name)}: ${outcome}</strong>`;
    usedPromptList.appendChild(li);
  });
}

function renderWheel() {
  wheel.style.background = buildWheelGradient();
  renderWheelPegs();
  renderWheelLabels();
  updatePointerShape();
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addPrompt() {
  const prompt = sanitizePrompt({
    name: promptNameInput.value,
    description: promptDescriptionInput.value,
    link: promptLinkInput.value
  });

  if (!isValidPrompt(prompt)) {
    alert("Prompt name is required.");
    return;
  }

  prompts.push(prompt);
  promptNameInput.value = "";
  promptDescriptionInput.value = "";
  promptLinkInput.value = "";
  renderWheel();
}

function parseCsv(text) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim().length > 0);
  if (lines.length < 2) {
    return [];
  }

  const header = lines[0].split(",").map((x) => x.trim().toLowerCase());
  const nameIdx = header.indexOf("name");
  const descIdx = header.indexOf("description");
  const linkIdx = header.indexOf("link");

  if (nameIdx === -1 || descIdx === -1) {
    throw new Error("CSV must include name and description columns.");
  }

  return lines.slice(1).map((line) => {
    const cols = line.split(",");
    return sanitizePrompt({
      name: cols[nameIdx] ?? "",
        description: cols[descIdx] ?? "",
        link: linkIdx >= 0 ? (cols[linkIdx] ?? "") : ""
    });
  });
}

function handlePromptFileUpload(event) {
  const [file] = event.target.files || [];
  if (!file) {
    return;
  }

  const reader = new FileReader();
  reader.onload = () => {
    const text = String(reader.result || "");
    let uploaded = [];
    try {
      if (file.name.toLowerCase().endsWith(".json")) {
        const parsed = JSON.parse(text);
        if (!Array.isArray(parsed)) {
          throw new Error("JSON file must be an array of prompts.");
        }
        uploaded = parsed.map(sanitizePrompt);
      } else {
        uploaded = parseCsv(text);
      }
    } catch (error) {
      alert(`Could not import prompts: ${error.message}`);
      return;
    }

    const valid = uploaded.filter(isValidPrompt);
    if (!valid.length) {
      alert("No valid prompts found in file.");
      return;
    }

    prompts = valid;
    renderWheel();
  };

  reader.readAsText(file);
}

function parseBulkPrompts(text) {
  const lines = String(text)
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  return lines.map((line) => {
    let parts;
    if (line.includes("\t")) {
      parts = line.split("\t");
    } else if (line.includes("|")) {
      parts = line.split("|");
    } else if (line.includes(",")) {
      parts = line.split(",");
    } else {
      parts = [line];
    }

    const [namePart, descriptionPart = "", linkPart = ""] = parts;
    return sanitizePrompt({
      name: (namePart || "").trim(),
      description: descriptionPart.trim(),
      link: linkPart.trim()
    });
  });
}

function importPastedPrompts() {
  const raw = bulkPromptsInput.value;
  if (!raw.trim()) {
    alert("Paste prompts first.");
    return;
  }

  const uploaded = parseBulkPrompts(raw);
  const valid = uploaded.filter(isValidPrompt);
  if (!valid.length) {
    alert("No valid prompts found. Use: name | description");
    return;
  }

  prompts = valid;
  usedPrompts = [];
  renderUsedPromptList();
  renderWheel();
}

function showResult(prompt) {
  resultName.textContent = prompt.name;
  resultDescription.textContent = prompt.description || "No description provided.";
  selectedByInput.value = "";
  resultOutcomeInputs.forEach((input) => {
    input.checked = false;
  });
  currentResultId = prompt.id;
  if (prompt.link) {
    resultLink.href = prompt.link;
    resultLinkWrap.style.display = "block";
  } else {
    resultLinkWrap.style.display = "none";
  }
  resultDialog.showModal();
}

function getWinningIndex(finalRotation) {
  const normalized = ((finalRotation % 360) + 360) % 360;
  const pointerAngle = (360 - normalized) % 360;
  const segmentSize = 360 / prompts.length;
  return Math.floor(pointerAngle / segmentSize) % prompts.length;
}

function spinWheel() {
  if (!isPlayMode) {
    startWheelMode();
  }

  if (isSpinning || prompts.length < 1) {
    if (prompts.length < 1) {
      alert("No prompts left on the wheel.");
    }
    return;
  }

  isSpinning = true;
  const extra = 360 * (6 + Math.floor(Math.random() * 3));
  const randomOffset = Math.random() * 360;
  currentRotation += extra + randomOffset;
  wheel.style.transform = `rotate(${currentRotation}deg)`;

  setTimeout(() => {
    const winningIndex = getWinningIndex(currentRotation);
    const winner = prompts.splice(winningIndex, 1)[0];
    showResult(winner);
    usedPrompts.unshift(winner);
    renderWheel();
    renderUsedPromptList();
    runFireworks();
    isSpinning = false;
  }, 6100);
}

function clearPrompts() {
  prompts = [];
  usedPrompts = [];
  renderWheel();
  renderUsedPromptList();
}


function startWheelMode() {
  if (!prompts.length) {
    alert("Add at least one prompt before starting.");
    return;
  }
  setupPanel.style.visibility = "hidden";
  setupPanel.style.pointerEvents = "none";
  setupPanel.setAttribute("aria-hidden", "true");
  wheelSection.classList.remove("hidden");
  isPlayMode = true;
  renderWheel();
}

function editPromptsMode() {
  setupPanel.style.visibility = "visible";
  setupPanel.style.pointerEvents = "auto";
  setupPanel.removeAttribute("aria-hidden");
  wheelSection.classList.add("hidden");
  isPlayMode = false;
}

function saveSelectedByAndClose() {
  if (currentResultId) {
    const selectedBy = selectedByInput.value.trim();
    const checkedOutcome = Array.from(resultOutcomeInputs).find((input) => input.checked);
    const outcome = checkedOutcome ? checkedOutcome.value : "";
    usedPrompts = usedPrompts.map((prompt) => {
      if (prompt.id === currentResultId) {
        return { ...prompt, selectedBy, outcome };
      }
      return prompt;
    });
    renderUsedPromptList();
  }
  currentResultId = null;
  resultDialog.close();
}

function resizeCanvas() {
  fireworksCanvas.width = window.innerWidth;
  fireworksCanvas.height = window.innerHeight;
}

function runFireworks() {
  const ctx = fireworksCanvas.getContext("2d");
  if (!ctx) {
    return;
  }

  resizeCanvas();
  const particles = [];
  const durationMs = 1800;
  const start = performance.now();

  // Spawn around the result dialog so the popup appears "in" the confetti burst.
  const dialogRect = resultDialog.getBoundingClientRect();
  const originX = dialogRect.width ? dialogRect.left + dialogRect.width / 2 : fireworksCanvas.width / 2;
  const originY = dialogRect.width ? dialogRect.top + dialogRect.height / 2 : fireworksCanvas.height * 0.45;

  const confettiCount = 260;
  for (let i = 0; i < confettiCount; i += 1) {
    const angle = Math.random() * Math.PI * 2;
    const speed = 2.5 + Math.random() * 7;
    const vx = Math.cos(angle) * speed;
    const vy = Math.sin(angle) * speed - 1.5; // slightly upward

    const w = 2 + Math.random() * 6;
    const h = 6 + Math.random() * 12;
    particles.push({
      x: originX,
      y: originY,
      vx,
      vy,
      alpha: 1,
      rot: Math.random() * Math.PI * 2,
      vr: (Math.random() - 0.5) * 0.3,
      w,
      h,
      color: wheelColors[i % wheelColors.length]
    });
  }

  function frame(now) {
    ctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    particles.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.03; // gravity
      p.vx *= 0.992; // drag
      p.rot += p.vr;
      p.alpha -= 0.008;
      if (p.alpha > 0) {
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.fillRect(-p.w / 2, -p.h / 2, p.w, p.h);
        ctx.restore();
      }
    });
    ctx.globalAlpha = 1;

    if (now - start < durationMs) {
      requestAnimationFrame(frame);
    } else {
      ctx.clearRect(0, 0, fireworksCanvas.width, fireworksCanvas.height);
    }
  }

  requestAnimationFrame(frame);
}

addPromptBtn.addEventListener("click", addPrompt);
importPastedBtn.addEventListener("click", importPastedPrompts);
startWheelBtn.addEventListener("click", startWheelMode);
editPromptsBtn.addEventListener("click", editPromptsMode);
clearPromptsBtn.addEventListener("click", clearPrompts);
spinBtn.addEventListener("click", spinWheel);
promptFileInput.addEventListener("change", handlePromptFileUpload);
closeResultBtn.addEventListener("click", saveSelectedByAndClose);
window.addEventListener("resize", () => {
  renderWheelLabels();
  resizeCanvas();
  updatePointerShape();
});

renderWheel();
renderUsedPromptList();
resizeCanvas();

// Optional: replace the center "SPIN" with an uploaded guest image.
if (guestImageFileInput && guestImageEl) {
  setGuestImageEnabled(false);

  guestImageFileInput.addEventListener("change", () => {
    const file = guestImageFileInput.files?.[0];
    if (!file) {
      setGuestImageEnabled(false);
      guestImageEl.src = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      guestImageEl.src = String(reader.result);
      setGuestImageEnabled(true);
    };
    reader.readAsDataURL(file);
  });
}