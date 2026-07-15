const inferenceSetupForm = document.querySelector("#inferenceSetupForm");
const inferenceStudentForm = document.querySelector("#inferenceStudentForm");
const inferenceSetupView = document.querySelector("#inferenceSetupView");
const inferenceShareView = document.querySelector("#inferenceShareView");
const inferenceStudentView = document.querySelector("#inferenceStudentView");
const inferenceGameView = document.querySelector("#inferenceGameView");
const inferenceBuilders = document.querySelector("#inferenceBuilders");
const inferenceSetupError = document.querySelector("#inferenceSetupError");
const inferenceNameError = document.querySelector("#inferenceNameError");
const inferenceQuestions = document.querySelector("#inferenceQuestions");
const inferenceProgress = document.querySelector("#inferenceProgress");
const inferenceHint = document.querySelector("#inferenceHint");
const inferenceGameMessage = document.querySelector("#inferenceGameMessage");
const inferenceDownload = document.querySelector("#downloadInferencePdf");
const inferenceQr = document.querySelector("#inferenceQr");
const inferenceShareStatus = document.querySelector("#inferenceShareStatus");

let inferenceItems = [];
let inferenceResponses = [];
let inferenceStudentName = "";
let inferenceActivityUrl = "";

for (let index = 0; index < 3; index += 1) {
  const builder = document.createElement("section");
  builder.className = "question-builder";
  builder.innerHTML = `
    <h3>Question ${index + 1}</h3>
    <div class="builder-grid">
      <div class="builder-field full"><label>Reading passage</label><textarea name="passage-${index}" rows="4" maxlength="500" placeholder="Write a short passage" required></textarea></div>
      <div class="builder-field"><label>Text clue</label><input name="clue-${index}" maxlength="140" required></div>
      <div class="builder-field"><label>What students may already know</label><input name="knowledge-${index}" maxlength="140" required></div>
      <div class="choice-grid">${[0, 1, 2].map(choice => `<div class="builder-field"><label>Possible inference ${choice + 1}</label><input name="option-${index}-${choice}" maxlength="120" required></div>`).join("")}</div>
      <div class="builder-field full"><label>Correct option</label><select name="correct-${index}"><option value="0">Option 1</option><option value="1">Option 2</option><option value="2">Option 3</option></select></div>
    </div>`;
  inferenceBuilders.append(builder);
}

function encodeInference(items) {
  const payload = items.map(({ passage, clue, knowledge, options, correct }) => ({ passage, clue, knowledge, options, correct }));
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeInference(value) {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    const decoded = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(decoded) || decoded.length !== 3) return null;
    const invalid = decoded.some(item =>
      typeof item.passage !== "string" || !item.passage.trim() ||
      typeof item.clue !== "string" || !item.clue.trim() || typeof item.knowledge !== "string" || !item.knowledge.trim() ||
      !Array.isArray(item.options) || item.options.length !== 3 ||
      item.options.some(option => typeof option !== "string" || !option.trim()) ||
      !Number.isInteger(item.correct) || item.correct < 0 || item.correct > 2
    );
    if (invalid) return null;
    return decoded.map((item, index) => ({ id: `inference-${index}`, passage: item.passage.trim().slice(0, 500), clue: item.clue.trim().slice(0, 140), knowledge: item.knowledge.trim().slice(0, 140), options: item.options.map(option => option.trim().slice(0, 120)), correct: item.correct }));
  } catch (error) { return null; }
}

function showInferenceStudent() {
  inferenceSetupView.hidden = true;
  inferenceShareView.hidden = true;
  inferenceStudentView.hidden = false;
  inferenceStudentView.scrollIntoView({ behavior: "smooth" });
}

function showInferenceShare() {
  const url = new URL(window.location.href);
  url.hash = `inference=${encodeInference(inferenceItems)}`;
  inferenceActivityUrl = url.href;
  inferenceQr.replaceChildren();
  inferenceQr.classList.remove("qr-unavailable");
  inferenceShareStatus.textContent = "";
  try {
    if (typeof QRCode !== "function") throw new Error("QR library unavailable");
    new QRCode(inferenceQr, { text: inferenceActivityUrl, width: 220, height: 220, colorDark: "#11245f", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.L });
  } catch (error) {
    inferenceQr.textContent = "The QR code could not load. You can still copy the activity link.";
    inferenceQr.classList.add("qr-unavailable");
  }
  inferenceSetupView.hidden = true;
  inferenceShareView.hidden = false;
  inferenceShareView.scrollIntoView({ behavior: "smooth" });
}

inferenceSetupForm.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(inferenceSetupForm);
  inferenceItems = Array.from({ length: 3 }, (_, index) => ({
    id: `inference-${index}`,
    passage: data.get(`passage-${index}`).trim(),
    clue: data.get(`clue-${index}`).trim(),
    knowledge: data.get(`knowledge-${index}`).trim(),
    options: [0, 1, 2].map(choice => data.get(`option-${index}-${choice}`).trim()),
    correct: Number(data.get(`correct-${index}`))
  }));
  if (inferenceItems.some(item => !item.passage || !item.clue || !item.knowledge || item.options.some(option => !option))) {
    inferenceSetupError.textContent = "Please complete all fields for the 3 questions.";
    return;
  }
  inferenceSetupError.textContent = "";
  showInferenceShare();
});

document.querySelector("#copyInferenceLink").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(inferenceActivityUrl);
    inferenceShareStatus.textContent = "Link copied. It is ready to send to your students.";
  } catch (error) { inferenceShareStatus.textContent = "The link could not be copied. Please try again."; }
});
document.querySelector("#openInferenceHere").addEventListener("click", showInferenceStudent);
document.querySelector("#editInference").addEventListener("click", () => {
  inferenceShareView.hidden = true;
  inferenceSetupView.hidden = false;
  inferenceSetupView.scrollIntoView({ behavior: "smooth" });
});

function buildInferenceGame() {
  inferenceResponses = [];
  inferenceQuestions.replaceChildren();
  inferenceProgress.textContent = "0 of 3 answered";
  inferenceHint.textContent = `Good luck, ${inferenceStudentName}! Each question has one attempt.`;
  inferenceGameMessage.textContent = "";
  inferenceGameMessage.className = "game-message";
  inferenceDownload.hidden = true;
  inferenceItems.forEach((item, index) => {
    const card = document.createElement("section");
    card.className = "context-question";
    card.innerHTML = `<h3>Passage ${index + 1}</h3><p class="context-sentence"></p><div class="inference-builder"><button type="button" class="inference-step clue-step"><strong>Text clue</strong><span>Tap to reveal</span></button><span class="inference-symbol">+</span><button type="button" class="inference-step knowledge-step" disabled><strong>What I know</strong><span>Connect the clue first</span></button><span class="inference-symbol">=</span><div class="inference-result"><strong>Inference</strong><span>Choose below</span></div></div><div class="context-options"></div>`;
    card.querySelector(".context-sentence").textContent = item.passage;
    const clueStep = card.querySelector(".clue-step");
    const knowledgeStep = card.querySelector(".knowledge-step");
    clueStep.addEventListener("click", () => {
      clueStep.querySelector("span").textContent = item.clue;
      clueStep.classList.add("revealed");
      clueStep.disabled = true;
      knowledgeStep.disabled = false;
    });
    knowledgeStep.addEventListener("click", () => {
      knowledgeStep.querySelector("span").textContent = item.knowledge;
      knowledgeStep.classList.add("revealed");
      knowledgeStep.disabled = true;
      card.querySelectorAll(".context-choice").forEach(option => { option.disabled = false; });
    });
    const options = card.querySelector(".context-options");
    item.options.forEach((option, optionIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "context-choice";
      button.disabled = true;
      button.textContent = option;
      button.addEventListener("click", () => answerInference(card, item, optionIndex));
      options.append(button);
    });
    inferenceQuestions.append(card);
  });
}

function answerInference(card, item, selected) {
  if (inferenceResponses.some(response => response.id === item.id)) return;
  const correct = selected === item.correct;
  inferenceResponses.push({ id: item.id, passage: item.passage, selected: item.options[selected], correctAnswer: item.options[item.correct], correct });
  const choices = [...card.querySelectorAll(".context-choice")];
  choices.forEach(button => { button.disabled = true; });
  choices[selected].classList.add(correct ? "correct" : "incorrect");
  inferenceProgress.textContent = `${inferenceResponses.length} of 3 answered`;
  inferenceHint.textContent = correct ? "Correct! Continue to the next passage." : "One attempt used. Continue to the next passage.";
}

inferenceStudentForm.addEventListener("submit", event => {
  event.preventDefault();
  inferenceStudentName = document.querySelector("#inferenceStudentName").value.trim();
  if (!inferenceStudentName) { inferenceNameError.textContent = "Please enter your name."; return; }
  inferenceNameError.textContent = "";
  buildInferenceGame();
  inferenceStudentView.hidden = true;
  inferenceGameView.hidden = false;
  inferenceGameView.scrollIntoView({ behavior: "smooth" });
});

document.querySelector("#finishInference").addEventListener("click", () => {
  if (inferenceResponses.length < 3) {
    inferenceGameMessage.textContent = `Answer the remaining ${3 - inferenceResponses.length} ${3 - inferenceResponses.length === 1 ? "question" : "questions"} first.`;
    inferenceGameMessage.className = "game-message try";
    return;
  }
  const score = inferenceResponses.filter(response => response.correct).length;
  inferenceGameMessage.textContent = `${inferenceStudentName}, your final score is ${score} out of 3.`;
  inferenceGameMessage.className = score >= 2 ? "game-message success" : "game-message try";
  inferenceDownload.hidden = false;
});
document.querySelector("#retryInference").addEventListener("click", buildInferenceGame);

function pdfSafe(value) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"); }
function makeInferencePdf() {
  const score = inferenceResponses.filter(response => response.correct).length;
  const lines = [`Interactive Literacy Hub`, `Inference Challenge - Progress Report`, `Student: ${inferenceStudentName}`, `Score: ${score} out of 3`, `Date: ${new Date().toLocaleDateString()}`];
  inferenceResponses.forEach((response, index) => lines.push(`${index + 1}. ${response.correct ? "Correct" : "Incorrect"}`, `Selected: ${response.selected}`.slice(0, 82), `Correct answer: ${response.correctAnswer}`.slice(0, 82)));
  const stream = lines.map((line, index) => `BT /F1 ${index < 2 ? 16 : 11} Tf 0.15 0.19 0.37 rg 54 ${755 - index * 32} Td (${pdfSafe(line)}) Tj ET`).join("\n");
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>", `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  let pdf = "%PDF-1.4\n"; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length; pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`; offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

inferenceDownload.addEventListener("click", () => {
  const url = URL.createObjectURL(makeInferencePdf());
  const link = document.createElement("a"); link.href = url; link.download = `inference-${inferenceStudentName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "student"}.pdf`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const sharedInference = window.location.hash.startsWith("#inference=") ? decodeInference(window.location.hash.slice("#inference=".length)) : null;
if (sharedInference) { inferenceItems = sharedInference; showInferenceStudent(); }
