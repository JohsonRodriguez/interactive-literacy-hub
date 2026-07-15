const textEvidenceSetupForm = document.querySelector("#textEvidenceSetupForm");
const textEvidenceStudentForm = document.querySelector("#textEvidenceStudentForm");
const textEvidenceSetupView = document.querySelector("#textEvidenceSetupView");
const textEvidenceShareView = document.querySelector("#textEvidenceShareView");
const textEvidenceStudentView = document.querySelector("#textEvidenceStudentView");
const textEvidenceGameView = document.querySelector("#textEvidenceGameView");
const textEvidenceBuilders = document.querySelector("#textEvidenceBuilders");
const textEvidenceSetupError = document.querySelector("#textEvidenceSetupError");
const textEvidenceNameError = document.querySelector("#textEvidenceNameError");
const textEvidenceQuestions = document.querySelector("#textEvidenceQuestions");
const textEvidenceProgress = document.querySelector("#textEvidenceProgress");
const textEvidenceHint = document.querySelector("#textEvidenceHint");
const textEvidenceGameMessage = document.querySelector("#textEvidenceGameMessage");
const textEvidenceDownload = document.querySelector("#downloadTextEvidencePdf");
const textEvidenceQr = document.querySelector("#textEvidenceQr");
const textEvidenceShareStatus = document.querySelector("#textEvidenceShareStatus");

let textEvidenceItems = [];
let textEvidenceResponses = [];
let textEvidenceStudentName = "";
let textEvidenceActivityUrl = "";

for (let index = 0; index < 3; index += 1) {
  const builder = document.createElement("section");
  builder.className = "question-builder";
  builder.innerHTML = `
    <h3>Question ${index + 1}</h3>
    <div class="builder-grid">
      <div class="builder-field full"><label>Reading passage</label><textarea name="passage-${index}" rows="4" maxlength="500" placeholder="Write a short passage" required></textarea></div>
      <div class="builder-field full"><label>Idea or claim to support</label><input name="claim-${index}" maxlength="160" placeholder="Write the idea students must support" required></div>
      <div class="choice-grid">${[0, 1, 2].map(choice => `<div class="builder-field"><label>Possible text detail ${choice + 1}</label><input name="option-${index}-${choice}" maxlength="120" required></div>`).join("")}</div>
      <div class="builder-field full"><label>Correct option</label><select name="correct-${index}"><option value="0">Option 1</option><option value="1">Option 2</option><option value="2">Option 3</option></select></div>
    </div>`;
  textEvidenceBuilders.append(builder);
}

function encodeTextEvidence(items) {
  const payload = items.map(({ passage, claim, options, correct }) => ({ passage, claim, options, correct }));
  const bytes = new TextEncoder().encode(JSON.stringify(payload));
  let binary = "";
  bytes.forEach(byte => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function decodeTextEvidence(value) {
  try {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, "="));
    const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
    const decoded = JSON.parse(new TextDecoder().decode(bytes));
    if (!Array.isArray(decoded) || decoded.length !== 3) return null;
    const invalid = decoded.some(item =>
      typeof item.passage !== "string" || !item.passage.trim() ||
      typeof item.claim !== "string" || !item.claim.trim() ||
      !Array.isArray(item.options) || item.options.length !== 3 ||
      item.options.some(option => typeof option !== "string" || !option.trim()) ||
      !Number.isInteger(item.correct) || item.correct < 0 || item.correct > 2
    );
    if (invalid) return null;
    return decoded.map((item, index) => ({ id: `evidence-${index}`, passage: item.passage.trim().slice(0, 500), claim: item.claim.trim().slice(0, 160), options: item.options.map(option => option.trim().slice(0, 120)), correct: item.correct }));
  } catch (error) { return null; }
}

function showTextEvidenceStudent() {
  textEvidenceSetupView.hidden = true;
  textEvidenceShareView.hidden = true;
  textEvidenceStudentView.hidden = false;
  textEvidenceStudentView.scrollIntoView({ behavior: "smooth" });
}

function showTextEvidenceShare() {
  const url = new URL(window.location.href);
  url.hash = `text-evidence=${encodeTextEvidence(textEvidenceItems)}`;
  textEvidenceActivityUrl = url.href;
  textEvidenceQr.replaceChildren();
  textEvidenceQr.classList.remove("qr-unavailable");
  textEvidenceShareStatus.textContent = "";
  try {
    if (typeof QRCode !== "function") throw new Error("QR library unavailable");
    new QRCode(textEvidenceQr, { text: textEvidenceActivityUrl, width: 220, height: 220, colorDark: "#11245f", colorLight: "#ffffff", correctLevel: QRCode.CorrectLevel.L });
  } catch (error) {
    textEvidenceQr.textContent = "The QR code could not load. You can still copy the activity link.";
    textEvidenceQr.classList.add("qr-unavailable");
  }
  textEvidenceSetupView.hidden = true;
  textEvidenceShareView.hidden = false;
  textEvidenceShareView.scrollIntoView({ behavior: "smooth" });
}

textEvidenceSetupForm.addEventListener("submit", event => {
  event.preventDefault();
  const data = new FormData(textEvidenceSetupForm);
  textEvidenceItems = Array.from({ length: 3 }, (_, index) => ({
    id: `evidence-${index}`,
    passage: data.get(`passage-${index}`).trim(),
    claim: data.get(`claim-${index}`).trim(),
    options: [0, 1, 2].map(choice => data.get(`option-${index}-${choice}`).trim()),
    correct: Number(data.get(`correct-${index}`))
  }));
  if (textEvidenceItems.some(item => !item.passage || !item.claim || item.options.some(option => !option))) {
    textEvidenceSetupError.textContent = "Please complete all fields for the 3 questions.";
    return;
  }
  textEvidenceSetupError.textContent = "";
  showTextEvidenceShare();
});

document.querySelector("#copyTextEvidenceLink").addEventListener("click", async () => {
  try {
    await navigator.clipboard.writeText(textEvidenceActivityUrl);
    textEvidenceShareStatus.textContent = "Link copied. It is ready to send to your students.";
  } catch (error) { textEvidenceShareStatus.textContent = "The link could not be copied. Please try again."; }
});
document.querySelector("#openTextEvidenceHere").addEventListener("click", showTextEvidenceStudent);
document.querySelector("#editTextEvidence").addEventListener("click", () => {
  textEvidenceShareView.hidden = true;
  textEvidenceSetupView.hidden = false;
  textEvidenceSetupView.scrollIntoView({ behavior: "smooth" });
});

function buildTextEvidenceGame() {
  textEvidenceResponses = [];
  textEvidenceQuestions.replaceChildren();
  textEvidenceProgress.textContent = "0 of 3 answered";
  textEvidenceHint.textContent = `Good luck, ${textEvidenceStudentName}! Each question has one attempt.`;
  textEvidenceGameMessage.textContent = "";
  textEvidenceGameMessage.className = "game-message";
  textEvidenceDownload.hidden = true;
  textEvidenceItems.forEach((item, index) => {
    const card = document.createElement("section");
    card.className = "context-question";
    card.innerHTML = `<h3>Passage ${index + 1}</h3><p class="context-sentence"></p><div class="evidence-claim-box"><strong>Idea to support</strong><span class="evidence-claim"></span></div><p class="evidence-direction">Select the text evidence to highlight it.</p><div class="evidence-lines"></div>`;
    card.querySelector(".context-sentence").textContent = item.passage;
    card.querySelector(".evidence-claim").textContent = item.claim;
    const options = card.querySelector(".evidence-lines");
    item.options.forEach((option, optionIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "evidence-line";
      button.textContent = option;
      button.addEventListener("click", () => answerTextEvidence(card, item, optionIndex));
      options.append(button);
    });
    textEvidenceQuestions.append(card);
  });
}

function answerTextEvidence(card, item, selected) {
  if (textEvidenceResponses.some(response => response.id === item.id)) return;
  const correct = selected === item.correct;
  textEvidenceResponses.push({ id: item.id, passage: item.passage, selected: item.options[selected], correctAnswer: item.options[item.correct], correct });
  const choices = [...card.querySelectorAll(".evidence-line")];
  choices.forEach(button => { button.disabled = true; });
  choices[selected].classList.add(correct ? "correct" : "incorrect");
  textEvidenceProgress.textContent = `${textEvidenceResponses.length} of 3 answered`;
  textEvidenceHint.textContent = correct ? "Correct! Continue to the next passage." : "One attempt used. Continue to the next passage.";
}

textEvidenceStudentForm.addEventListener("submit", event => {
  event.preventDefault();
  textEvidenceStudentName = document.querySelector("#textEvidenceStudentName").value.trim();
  if (!textEvidenceStudentName) { textEvidenceNameError.textContent = "Please enter your name."; return; }
  textEvidenceNameError.textContent = "";
  buildTextEvidenceGame();
  textEvidenceStudentView.hidden = true;
  textEvidenceGameView.hidden = false;
  textEvidenceGameView.scrollIntoView({ behavior: "smooth" });
});

document.querySelector("#finishTextEvidence").addEventListener("click", () => {
  if (textEvidenceResponses.length < 3) {
    textEvidenceGameMessage.textContent = `Answer the remaining ${3 - textEvidenceResponses.length} ${3 - textEvidenceResponses.length === 1 ? "question" : "questions"} first.`;
    textEvidenceGameMessage.className = "game-message try";
    return;
  }
  const score = textEvidenceResponses.filter(response => response.correct).length;
  textEvidenceGameMessage.textContent = `${textEvidenceStudentName}, your final score is ${score} out of 3.`;
  textEvidenceGameMessage.className = score >= 2 ? "game-message success" : "game-message try";
  textEvidenceDownload.hidden = false;
});
document.querySelector("#retryTextEvidence").addEventListener("click", buildTextEvidenceGame);

function pdfSafe(value) { return value.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)"); }
function makeTextEvidencePdf() {
  const score = textEvidenceResponses.filter(response => response.correct).length;
  const lines = [`Interactive Literacy Hub`, `Text Evidence Challenge - Progress Report`, `Student: ${textEvidenceStudentName}`, `Score: ${score} out of 3`, `Date: ${new Date().toLocaleDateString()}`];
  textEvidenceResponses.forEach((response, index) => lines.push(`${index + 1}. ${response.correct ? "Correct" : "Incorrect"}`, `Selected: ${response.selected}`.slice(0, 82), `Correct answer: ${response.correctAnswer}`.slice(0, 82)));
  const stream = lines.map((line, index) => `BT /F1 ${index < 2 ? 16 : 11} Tf 0.15 0.19 0.37 rg 54 ${755 - index * 32} Td (${pdfSafe(line)}) Tj ET`).join("\n");
  const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>", `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];
  let pdf = "%PDF-1.4\n"; const offsets = [0];
  objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
  const xref = pdf.length; pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`; offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return new Blob([pdf], { type: "application/pdf" });
}

textEvidenceDownload.addEventListener("click", () => {
  const url = URL.createObjectURL(makeTextEvidencePdf());
  const link = document.createElement("a"); link.href = url; link.download = `text-evidence-${textEvidenceStudentName.toLowerCase().replace(/[^a-z0-9]+/g, "-") || "student"}.pdf`; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
});

const sharedTextEvidence = window.location.hash.startsWith("#text-evidence=") ? decodeTextEvidence(window.location.hash.slice("#text-evidence=".length)) : null;
if (sharedTextEvidence) { textEvidenceItems = sharedTextEvidence; showTextEvidenceStudent(); }
