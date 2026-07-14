const entryRows = document.querySelector("#entryRows");
const setupForm = document.querySelector("#wordSetupForm");
const studentForm = document.querySelector("#studentForm");
const setupView = document.querySelector("#setupView");
const studentView = document.querySelector("#studentView");
const shareView = document.querySelector("#shareView");
const gameView = document.querySelector("#gameView");
const setupError = document.querySelector("#setupError");
const nameError = document.querySelector("#nameError");
const wordBank = document.querySelector("#customWordBank");
const definitionBank = document.querySelector("#customDefinitionBank");
const matchCount = document.querySelector("#matchCount");
const selectedHint = document.querySelector("#selectedHint");
const gameMessage = document.querySelector("#gameMessage");
const downloadButton = document.querySelector("#downloadProgress");
const activityQr = document.querySelector("#activityQr");
const shareStatus = document.querySelector("#shareStatus");

let pairs = [];
let studentName = "";
let selectedWord = null;
let attempts = [];
let activityUrl = "";

function encodeActivity(items) {
  const bytes = new TextEncoder().encode(JSON.stringify(items.map(({ word, description }) => ({ word, description }))));
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeActivity(value) {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const bytes = Uint8Array.from(binary, (character) => character.charCodeAt(0));
    const decoded = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(decoded) || decoded.length !== 5) return null;
    if (decoded.some((item) => typeof item.word !== "string" || typeof item.description !== "string" || !item.word.trim() || !item.description.trim())) return null;
    return decoded.map((item, index) => ({ id: `pair-${index}`, word: item.word.trim().slice(0, 100), description: item.description.trim().slice(0, 300) }));
  } catch (error) {
    return null;
  }
}

function getActivityUrl() {
  const url = new URL(window.location.href);
  url.hash = `activity=${encodeActivity(pairs)}`;
  return url.href;
}

function showStudentView() {
  setupView.hidden = true;
  shareView.hidden = true;
  studentView.hidden = false;
  studentView.scrollIntoView({ behavior: "smooth", block: "start" });
}

function showShareView() {
  const url = getActivityUrl();
  activityUrl = url;
  activityQr.replaceChildren();
  activityQr.classList.remove("qr-unavailable");
  shareStatus.textContent = "";

  if (typeof QRCode === "function") {
    new QRCode(activityQr, { text: url, width: 220, height: 220, colorDark: "#11245f", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.L });
  } else {
    activityQr.textContent = "The QR code could not load. You can still copy the activity link.";
    activityQr.classList.add("qr-unavailable");
  }

  setupView.hidden = true;
  shareView.hidden = false;
  shareView.scrollIntoView({ behavior: "smooth", block: "start" });
}

for (let index = 0; index < 5; index += 1) {
  const row = document.createElement("div");
  row.className = "entry-row";
  row.innerHTML = `
    <span class="entry-number">${index + 1}</span>
    <input name="word-${index}" aria-label="Word ${index + 1}" placeholder="Word ${index + 1}" maxlength="60" autocomplete="off" required>
    <input name="description-${index}" aria-label="Description for word ${index + 1}" placeholder="Write its description" maxlength="180" autocomplete="off" required>
  `;
  entryRows.append(row);
}

function shuffled(items) {
  const copy = [...items];
  for (let index = copy.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));
    [copy[index], copy[randomIndex]] = [copy[randomIndex], copy[index]];
  }
  return copy;
}

function chooseWord(button) {
  if (button.classList.contains("attempted")) return;
  document.querySelectorAll(".custom-word").forEach((word) => word.classList.remove("selected"));
  selectedWord = button.dataset.id;
  button.classList.add("selected");
  selectedHint.textContent = `Selected: ${button.textContent}. Choose one description. You have one attempt.`;
}

function attemptMatch(zone, wordId) {
  if (!wordId || attempts.some((attempt) => attempt.wordId === wordId)) return;
  const pair = pairs.find((item) => item.id === wordId);
  const word = wordBank.querySelector(`[data-id="${wordId}"]`);
  const isCorrect = zone.dataset.id === wordId;

  attempts.push({
    wordId,
    word: pair.word,
    chosenDescription: zone.dataset.description,
    correctDescription: pair.description,
    isCorrect
  });

  word.classList.remove("selected");
  word.classList.add("attempted");
  zone.classList.remove("wrong", "drag-over");
  if (isCorrect) {
    zone.classList.add("correct");
    zone.innerHTML = `<strong class="matched-word">${pair.word}:</strong> ${pair.description}`;
    selectedHint.textContent = "Correct! Choose another word.";
  } else {
    void zone.offsetWidth;
    zone.classList.add("wrong");
    selectedHint.textContent = `One attempt used for ${pair.word}. Choose another word.`;
  }

  selectedWord = null;
  matchCount.textContent = `${attempts.length} of 5 attempted`;
  if (attempts.length === 5) {
    selectedHint.textContent = "All five attempts are complete. Select Finish to see your result.";
  }
}

function buildGame() {
  attempts = [];
  selectedWord = null;
  matchCount.textContent = "0 of 5 attempted";
  selectedHint.textContent = `Good luck, ${studentName}! Choose a word to begin.`;
  gameMessage.textContent = "";
  gameMessage.className = "game-message";
  downloadButton.hidden = true;
  wordBank.replaceChildren();
  definitionBank.replaceChildren();

  shuffled(pairs).forEach((pair) => {
    const word = document.createElement("button");
    word.type = "button";
    word.className = "custom-word";
    word.draggable = true;
    word.dataset.id = pair.id;
    word.textContent = pair.word;
    word.addEventListener("click", () => chooseWord(word));
    word.addEventListener("dragstart", (event) => event.dataTransfer.setData("text/plain", pair.id));
    wordBank.append(word);
  });

  shuffled(pairs).forEach((pair) => {
    const zone = document.createElement("button");
    zone.type = "button";
    zone.className = "custom-definition";
    zone.dataset.id = pair.id;
    zone.dataset.description = pair.description;
    zone.textContent = pair.description;
    zone.addEventListener("click", () => attemptMatch(zone, selectedWord));
    zone.addEventListener("dragover", (event) => {
      event.preventDefault();
      zone.classList.add("drag-over");
    });
    zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
    zone.addEventListener("drop", (event) => {
      event.preventDefault();
      attemptMatch(zone, event.dataTransfer.getData("text/plain"));
    });
    definitionBank.append(zone);
  });
}

setupForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const formData = new FormData(setupForm);
  pairs = Array.from({ length: 5 }, (_, index) => ({
    id: `pair-${index}`,
    word: formData.get(`word-${index}`).trim(),
    description: formData.get(`description-${index}`).trim()
  }));

  const normalizedWords = pairs.map((pair) => pair.word.toLowerCase());
  if (pairs.some((pair) => !pair.word || !pair.description)) {
    setupError.textContent = "Please complete all 5 words and descriptions.";
    return;
  }
  if (new Set(normalizedWords).size !== 5) {
    setupError.textContent = "Please use 5 different words.";
    return;
  }

  setupError.textContent = "";
  showShareView();
});

document.querySelector("#copyActivityLink").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(activityUrl);
    shareStatus.textContent = "Link copied. It is ready to send to your students.";
  } catch (error) {
    shareStatus.textContent = "The link could not be copied. Please try again.";
  }
});

document.querySelector("#openActivityHere").addEventListener("click", showStudentView);
document.querySelector("#editActivity").addEventListener("click", () => {
  shareView.hidden = true;
  setupView.hidden = false;
  setupView.scrollIntoView({ behavior: "smooth", block: "start" });
});

studentForm.addEventListener("submit", (event) => {
  event.preventDefault();
  studentName = document.querySelector("#studentName").value.trim();
  if (!studentName) {
    nameError.textContent = "Please enter your name.";
    return;
  }
  nameError.textContent = "";
  buildGame();
  studentView.hidden = true;
  gameView.hidden = false;
  gameView.scrollIntoView({ behavior: "smooth", block: "start" });
});

document.querySelector("#finishGame").addEventListener("click", () => {
  if (attempts.length < 5) {
    gameMessage.textContent = `Complete your remaining ${5 - attempts.length} ${5 - attempts.length === 1 ? "attempt" : "attempts"} first.`;
    gameMessage.className = "game-message try";
    return;
  }
  const score = attempts.filter((attempt) => attempt.isCorrect).length;
  gameMessage.textContent = `${studentName}, your final score is ${score} out of 5.`;
  gameMessage.className = score >= 4 ? "game-message success" : "game-message try";
  downloadButton.hidden = false;
});

document.querySelector("#tryAgain").addEventListener("click", () => {
  buildGame();
  gameView.scrollIntoView({ behavior: "smooth", block: "start" });
});

function pdfEscape(value) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7E]/g, "")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function makeProgressPdf() {
  const score = attempts.filter((attempt) => attempt.isCorrect).length;
  const lines = [
    { text: "Interactive Literacy Hub", size: 20, y: 755, color: "0.067 0.141 0.373" },
    { text: "Word Detective Lab - Progress Report", size: 16, y: 725, color: "0.937 0.373 0.569" },
    { text: `Student: ${studentName}`, size: 12, y: 690, color: "0.15 0.19 0.37" },
    { text: `Score: ${score} out of 5`, size: 12, y: 670, color: "0.15 0.19 0.37" },
    { text: `Date: ${new Date().toLocaleDateString()}`, size: 12, y: 650, color: "0.15 0.19 0.37" }
  ];

  attempts.forEach((attempt, index) => {
    const y = 610 - index * 88;
    lines.push(
      { text: `${index + 1}. ${attempt.word} - ${attempt.isCorrect ? "Correct" : "Incorrect"}`, size: 12, y, color: attempt.isCorrect ? "0.30 0.49 0.13" : "0.72 0.18 0.37" },
      { text: `Selected: ${attempt.chosenDescription}`.slice(0, 78), size: 10, y: y - 21, color: "0.25 0.28 0.40" },
      { text: `Correct answer: ${attempt.correctDescription}`.slice(0, 78), size: 10, y: y - 39, color: "0.25 0.28 0.40" }
    );
  });

  const stream = lines.map((line) => `BT /F1 ${line.size} Tf ${line.color} rg 54 ${line.y} Td (${pdfEscape(line.text)}) Tj ET`).join("\n");
  const objects = [
    "<< /Type /Catalog /Pages 2 0 R >>",
    "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
    "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",
    `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,
    "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"
  ];

  let pdf = "%PDF-1.4\n";
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(pdf.length);
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xrefOffset = pdf.length;
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  offsets.slice(1).forEach((offset) => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

downloadButton.addEventListener("click", () => {
  const url = URL.createObjectURL(makeProgressPdf());
  const link = document.createElement("a");
  link.href = url;
  link.download = `word-detective-${studentName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "student"}.pdf`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const sharedActivity = window.location.hash.startsWith("#activity=")
  ? decodeActivity(window.location.hash.slice("#activity=".length))
  : null;

if (sharedActivity) {
  pairs = sharedActivity;
  showStudentView();
}
