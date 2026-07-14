const setupForm = document.querySelector("#contextSetupForm");
const studentForm = document.querySelector("#contextStudentForm");
const setupView = document.querySelector("#contextSetupView");
const studentView = document.querySelector("#contextStudentView");
const gameView = document.querySelector("#contextGameView");
const builders = document.querySelector("#questionBuilders");
const setupError = document.querySelector("#contextSetupError");
const nameError = document.querySelector("#contextNameError");
const questionsHost = document.querySelector("#contextQuestions");
const progressLabel = document.querySelector("#contextProgress");
const hint = document.querySelector("#contextHint");
const gameMessage = document.querySelector("#contextGameMessage");
const downloadButton = document.querySelector("#downloadContextPdf");
let questions = [], responses = [], studentName = "";

for (let index = 0; index < 3; index += 1) {
  const builder = document.createElement("section");
  builder.className = "question-builder";
  builder.innerHTML = `<h3>Question ${index + 1}</h3><div class="builder-grid"><div class="builder-field"><label>Target word</label><input name="word-${index}" placeholder="Example: relieved" required></div><div class="builder-field"><label>Sentence containing the word</label><input name="sentence-${index}" placeholder="Maya was relieved when she found her book." required></div><div class="choice-grid">${[0,1,2].map(choice => `<div class="builder-field"><label>Option ${choice + 1}</label><input name="option-${index}-${choice}" required></div>`).join("")}</div><div class="builder-field full"><label>Correct option</label><select name="correct-${index}"><option value="0">Option 1</option><option value="1">Option 2</option><option value="2">Option 3</option></select></div></div>`;
  builders.append(builder);
}

function escapeHtml(value) { const span=document.createElement("span"); span.textContent=value; return span.innerHTML; }
function highlightedSentence(sentence, word) { const safe=escapeHtml(sentence), escaped=word.replace(/[.*+?^${}()|[\]\\]/g,"\\$&"); return safe.replace(new RegExp(`(${escaped})`,"i"),"<mark>$1</mark>"); }

setupForm.addEventListener("submit", event => {
  event.preventDefault(); const data=new FormData(setupForm);
  questions=Array.from({length:3},(_,index)=>({id:`q-${index}`,word:data.get(`word-${index}`).trim(),sentence:data.get(`sentence-${index}`).trim(),options:[0,1,2].map(choice=>data.get(`option-${index}-${choice}`).trim()),correct:+data.get(`correct-${index}`)}));
  if(questions.some(question=>!question.word||!question.sentence||question.options.some(option=>!option))){setupError.textContent="Please complete all fields for the 3 questions.";return;}
  if(questions.some(question=>!question.sentence.toLowerCase().includes(question.word.toLowerCase()))){setupError.textContent="Each sentence must contain its target word.";return;}
  setupError.textContent=""; setupView.hidden=true; studentView.hidden=false; studentView.scrollIntoView({behavior:"smooth"});
});

studentForm.addEventListener("submit", event => { event.preventDefault(); studentName=document.querySelector("#contextStudentName").value.trim(); if(!studentName){nameError.textContent="Please enter your name.";return;} nameError.textContent=""; buildGame(); studentView.hidden=true; gameView.hidden=false; gameView.scrollIntoView({behavior:"smooth"}); });

function buildGame(){responses=[];questionsHost.replaceChildren();progressLabel.textContent="0 of 3 answered";hint.textContent=`Good luck, ${studentName}! Each question has one attempt.`;gameMessage.textContent="";gameMessage.className="game-message";downloadButton.hidden=true;
  questions.forEach((question,index)=>{const card=document.createElement("section");card.className="context-question";card.innerHTML=`<h3>Question ${index+1}</h3><p class="context-sentence">${highlightedSentence(question.sentence,question.word)}</p><div class="context-options"></div>`;const options=card.querySelector(".context-options");question.options.forEach((option,optionIndex)=>{const button=document.createElement("button");button.type="button";button.className="context-choice";button.textContent=option;button.onclick=()=>answerQuestion(card,question,optionIndex);options.append(button);});questionsHost.append(card);});
}

function answerQuestion(card,question,selected){if(responses.some(response=>response.id===question.id))return;const correct=selected===question.correct;responses.push({id:question.id,word:question.word,sentence:question.sentence,selected:question.options[selected],correctAnswer:question.options[question.correct],correct});const choices=[...card.querySelectorAll(".context-choice")];choices.forEach(button=>button.disabled=true);choices[selected].classList.add(correct?"correct":"incorrect");progressLabel.textContent=`${responses.length} of 3 answered`;hint.textContent=correct?"Correct! Continue to the next question.":"One attempt used. Continue to the next question.";}

document.querySelector("#finishContext").onclick=()=>{if(responses.length<3){gameMessage.textContent=`Answer the remaining ${3-responses.length} ${3-responses.length===1?"question":"questions"} first.`;gameMessage.className="game-message try";return;}const score=responses.filter(response=>response.correct).length;gameMessage.textContent=`${studentName}, your final score is ${score} out of 3.`;gameMessage.className=score>=2?"game-message success":"game-message try";downloadButton.hidden=false;};
document.querySelector("#retryContext").onclick=()=>{buildGame();gameView.scrollIntoView({behavior:"smooth"});};

function pdfEscape(value){return value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^\x20-\x7E]/g,"").replace(/\\/g,"\\\\").replace(/\(/g,"\\(").replace(/\)/g,"\\)");}
function makePdf(){const score=responses.filter(response=>response.correct).length;const lines=[{t:"Interactive Literacy Hub",s:20,y:755,c:"0.067 0.141 0.373"},{t:"Context Clue Challenge - Progress Report",s:16,y:725,c:"0.937 0.373 0.569"},{t:`Student: ${studentName}`,s:12,y:690,c:"0.15 0.19 0.37"},{t:`Score: ${score} out of 3`,s:12,y:670,c:"0.15 0.19 0.37"},{t:`Date: ${new Date().toLocaleDateString()}`,s:12,y:650,c:"0.15 0.19 0.37"}];responses.forEach((r,i)=>{const y=605-i*145;lines.push({t:`${i+1}. ${r.word} - ${r.correct?"Correct":"Incorrect"}`,s:12,y,c:r.correct?"0.30 0.49 0.13":"0.72 0.18 0.37"},{t:`Sentence: ${r.sentence}`.slice(0,82),s:9,y:y-22,c:"0.25 0.28 0.40"},{t:`Selected: ${r.selected}`.slice(0,82),s:10,y:y-43,c:"0.25 0.28 0.40"},{t:`Correct answer: ${r.correctAnswer}`.slice(0,82),s:10,y:y-64,c:"0.25 0.28 0.40"});});const stream=lines.map(l=>`BT /F1 ${l.s} Tf ${l.c} rg 54 ${l.y} Td (${pdfEscape(l.t)}) Tj ET`).join("\n");const objects=["<< /Type /Catalog /Pages 2 0 R >>","<< /Type /Pages /Kids [3 0 R] /Count 1 >>","<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>",`<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`,"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>"];let pdf="%PDF-1.4\n";const offsets=[0];objects.forEach((object,index)=>{offsets.push(pdf.length);pdf+=`${index+1} 0 obj\n${object}\nendobj\n`;});const xref=pdf.length;pdf+=`xref\n0 ${objects.length+1}\n0000000000 65535 f \n`;offsets.slice(1).forEach(offset=>pdf+=`${String(offset).padStart(10,"0")} 00000 n \n`);pdf+=`trailer\n<< /Size ${objects.length+1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;return new Blob([pdf],{type:"application/pdf"});}
downloadButton.onclick=()=>{const url=URL.createObjectURL(makePdf()),link=document.createElement("a");link.href=url;link.download=`context-clue-${studentName.toLowerCase().replace(/[^a-z0-9]+/g,"-")||"student"}.pdf`;link.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
