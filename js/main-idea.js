const mainIdeaSetupForm = document.querySelector("#mainIdeaSetupForm");
const mainIdeaStudentForm = document.querySelector("#mainIdeaStudentForm");
const mainIdeaSetupView = document.querySelector("#mainIdeaSetupView");
const mainIdeaShareView = document.querySelector("#mainIdeaShareView");
const mainIdeaStudentView = document.querySelector("#mainIdeaStudentView");
const mainIdeaGameView = document.querySelector("#mainIdeaGameView");
const mainIdeaBuilders = document.querySelector("#mainIdeaBuilders");
const mainIdeaSetupError = document.querySelector("#mainIdeaSetupError");
const mainIdeaNameError = document.querySelector("#mainIdeaNameError");
const mainIdeaQuestions = document.querySelector("#mainIdeaQuestions");
const mainIdeaProgress = document.querySelector("#mainIdeaProgress");
const mainIdeaHint = document.querySelector("#mainIdeaHint");
const mainIdeaGameMessage = document.querySelector("#mainIdeaGameMessage");
const mainIdeaDownload = document.querySelector("#downloadMainIdeaPdf");
const mainIdeaQr = document.querySelector("#mainIdeaQr");
const mainIdeaShareStatus = document.querySelector("#mainIdeaShareStatus");

let mainIdeaItems = [];
let mainIdeaResponses = [];
let mainIdeaStudentName = "";
let mainIdeaActivityUrl = "";

for (let index = 0; index < 3; index += 1) {
  const builder = document.createElement("section");
  builder.className = "question-builder";
  builder.innerHTML = `
    <h3>Question ${index + 1}</h3>
    <div class="builder-grid">
      <div class="builder-field full"><label>Reading passage</label><textarea name="passage-${index}" rows="4" maxlength="500" placeholder="Write a short passage" required></textarea></div>
      <div class="choice-grid">${[0, 1, 2].map(choice => `<div class="builder-field"><label>Possible main idea ${choice + 1}</label><input name="option-${index}-${choice}" maxlength="120" required></div>`).join("")}</div>
      <div class="builder-field full"><label>Correct option</label><select name="correct-${index}"><option value="0">Option 1</option><option value="1">Option 2</option><option value="2">Option 3</option></select></div>
    </div>`;
  mainIdeaBuilders.append(builder);
}

function encodeMainIdea(items) {
  const payload = items.map(({ passage, options, correct }) => ({ passage, options, correct }));
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeMainIdea(value) {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    const decoded = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(decoded) || decoded.length !== 3) return null;
    const invalid = decoded.some(item =>
      typeof item.passage !== "string" || !item.passage.trim() ||
      !Array.isArray(item.options) || item.options.length !== 3 ||
      item.options.some(option => typeof option !== "string" || !option.trim()) ||
      !Number.isInteger(item.correct) || item.correct < 0 || item.correct > 2
    );
    if (invalid) return null;
    return decoded.map((item, index) => ({ id: `main-${index}`, passage: item.passage.trim().slice(0, 500), options: item.options.map(option => option.trim().slice(0, 120)), correct: item.correct }));
  } catch (error) { return null; }
}

function showMainIdeaStudent() {
  mainIdeaSetupView.hidden = true;
  mainIdeaShareView.hidden = true;
  mainIdeaStudentView.hidden = false;
  mainIdeaStudentView.scrollIntoView({ behavior: "smooth" });
}

function showMainIdeaShare() {
  const url = new URL(window.location.href);
  url.hash = `main-idea=${encodeMainIdea(mainIdeaItems)}`;
  mainIdeaActivityUrl = url.href;
  mainIdeaQr.replaceChildren();
  mainIdeaQr.classList.remove("qr-unavailable");
  mainIdeaShareStatus.textContent = "";
  try {
    if (typeof QRCode !== "function") throw new Error("QR library unavailable");
    new QRCode(mainIdeaQr, { text: mainIdeaActivityUrl, width: 220, height: 220, colorDark: "#11245f", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.L });
  } catch (error) {
    mainIdeaQr.textContent = "The QR code could not load. You can still copy the activity link.";
    mainIdeaQr.classList.add("qr-unavailable");
  }
  mainIdeaSetupView.hidden = true;
  mainIdeaShareView.hidden = false;
  mainIdeaShareView.scrollIntoView({ behavior: "smooth" });
}

mainIdeaSetupForm.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(mainIdeaSetupForm);
  mainIdeaItems = Array.from({ length: 3 }, (_, index) => ({
    id: `main-${index}`,
    passage: data.get(`passage-${index}`).trim(),
    options: [0, 1, 2].map(choice => data.get(`option-${index}-${choice}`).trim()),
    correct: Number(data.get(`correct-${index}`))
  }));
  if (mainIdeaItems.some(item => !item.passage || item.options.some(option => !option))) {
    mainIdeaSetupError.textContent = "Please complete all fields for the 3 questions.";
    return;
  }
  mainIdeaSetupError.textContent = "";
  showMainIdeaShare();
});

document.querySelector("#copyMainIdeaLink").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(mainIdeaActivityUrl);
    mainIdeaShareStatus.textContent = "Link copied. It is ready to send to your students.";
  } catch (error) { mainIdeaShareStatus.textContent = "The link could not be copied. Please try again."; }
});
document.querySelector("#openMainIdeaHere").addEventListener("click", showMainIdeaStudent);
document.querySelector("#editMainIdea").addEventListener("click", () => {
  mainIdeaShareView.hidden = true;
  mainIdeaSetupView.hidden = false;
  mainIdeaSetupView.scrollIntoView({ behavior: "smooth" });
});

function buildMainIdeaGame() {
  mainIdeaResponses = [];
  mainIdeaQuestions.replaceChildren();
  mainIdeaProgress.textContent = "0 of 3 answered";
  mainIdeaHint.textContent = `Good luck, ${mainIdeaStudentName}! Each question has one attempt.`;
  mainIdeaGameMessage.textContent = "";
  mainIdeaGameMessage.className = "game-message";
  mainIdeaDownload.hidden = true;
  mainIdeaItems.forEach((item, index) => {
    const card = document.createElement("section");
    card.className = "context-question";
    card.innerHTML = `<h3>Passage ${index + 1}</h3><p class="context-sentence"></p><div class="context-options"></div>`;
    card.querySelector(".context-sentence").textContent = item.passage;
    const options = card.querySelector(".context-options");
    item.options.forEach((option, optionIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "context-choice";
      button.textContent = option;
      button.addEventListener("click", () => answerMainIdea(card, item, optionIndex));
      options.append(button);
    });
    mainIdeaQuestions.append(card);
  });
}

function answerMainIdea(card, item, selected) {
  if (mainIdeaResponses.some(response => response.id === item.id)) return;
  const correct = selected === item.correct;
  mainIdeaResponses.push({ id: item.id, passage: item.passage, selected: item.options[selected], correctAnswer: item.options[item.correct], correct });
  const choices = [...card.querySelectorAll(".context-choice")];
  choices.forEach(button => { button.disabled = true; });
  choices[selected].classList.add(correct ? "correct" : "incorrect");
  mainIdeaProgress.textContent = `${mainIdeaResponses.length} of 3 answered`;
  mainIdeaHint.textContent = correct ? "Correct! Continue to the next passage." : "One attempt used. Continue to the next passage.";
}

mainIdeaStudentForm.addEventListener("submit", event => {
  event.preventDefault();
  mainIdeaStudentName = document.querySelector("#mainIdeaStudentName").value.trim();
  if (!mainIdeaStudentName) { mainIdeaNameError.textContent = "Please enter your name."; return; }
  mainIdeaNameError.textContent = "";
  buildMainIdeaGame();
  mainIdeaStudentView.hidden = true;
  mainIdeaGameView.hidden = false;
  mainIdeaGameView.scrollIntoView({ behavior: "smooth" });
});

document.querySelector("#finishMainIdea").addEventListener("click", () => {
  if (mainIdeaResponses.length < 3) {
    mainIdeaGameMessage.textContent = `Answer the remaining ${3 - mainIdeaResponses.length} ${3 - mainIdeaResponses.length === 1 ? "question" : "questions"} first.`;
    mainIdeaGameMessage.className = "game-message try";
    return;
  }
  const score = mainIdeaResponses.filter(response => response.correct).length;
  mainIdeaGameMessage.textContent = `${mainIdeaStudentName}, your final score is ${score} out of 3.`;
  mainIdeaGameMessage.className = score >= 2 ? "game-message success" : "game-message try";
  mainIdeaDownload.hidden = false;
  window.hubProgress?.recordCompletedActivity("reading-main-idea-01", score / 3 * 100, 1, { messageElement: mainIdeaGameMessage });
});
document.querySelector("#retryMainIdea").addEventListener("click", buildMainIdeaGame);

function pdfSafe(value) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"); }
function makeMainIdeaPdf() {
  const score = mainIdeaResponses.filter(response => response.correct).length;
  const lines = [`Interactive Literacy Hub`, `Main Idea Challenge - Progress Report`, `Student: ${mainIdeaStudentName}`, `Score: ${score} out of 3`, `Date: ${new Date().toLocaleDateString()}`];
  mainIdeaResponses.forEach((response, index) => lines.push(`${index + 1}. ${response.correct ? "Correct" : "Incorrect"}`, `Selected: ${response.selected}`.slice(0, 82), `Correct answer: ${response.correctAnswer}`.slice(0, 82)));
  const stream = lines.map((line, index) => `BT /F1 ${index < 2 ? 16 : 11} Tf 0.15 0.19 0.37 rg 54 ${755 - index * 32} Td (${pdfSafe(line)}) Tj ET`).join("\n");
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>", `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  let pdf = "%PDF-1.4\n"; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length; pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`; offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

mainIdeaDownload.addEventListener("click", () => {
  const url = URL.createObjectURL(makeMainIdeaPdf());
  const link = document.createElement("a"); link.href = url; link.download = `main-idea-${mainIdeaStudentName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "student"}.pdf`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const sharedMainIdea = window.location.hash.startsWith("#main-idea=") ? decodeMainIdea(window.location.hash.slice("#main-idea=".length)) : null;
if (sharedMainIdea) { mainIdeaItems = sharedMainIdea; showMainIdeaStudent(); }
