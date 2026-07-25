(() => {
  "use strict";
  const params = new URLSearchParams(location.search);
  const reading = window.hubReadings?.[params.get("reading") || ""];
  if (!reading) { location.replace("teacher-reading-library/"); return; }
  const $ = selector => document.querySelector(selector);
  const safe = value => { const node = document.createElement("span"); node.textContent = value ?? ""; return node.innerHTML; };
  let activeStage;

  function stageBody(stage) {
    const content = stage.content || {};
    if (stage.type === "text") return `<span class="badge">Read the Text</span><h2>${safe(reading.title)}</h2><div class="reading-text">${String(content.text || "").split(/\r?\n/).map(line => line.trim()).filter(Boolean).map(line => `<p>${safe(line)}</p>`).join("")}</div>`;
    if (stage.type === "prediction" || stage.type === "choice") return `<span class="badge">${safe(stage.title)}</span><h2>${safe(content.prompt)}</h2>${stage.image ? `<figure class="before-reading-image"><img src="${safe(stage.image)}" alt=""></figure>` : ""}<ol class="preview-option-list">${(content.options || []).map(option => `<li>${safe(option)}</li>`).join("")}</ol>`;
    if (stage.type === "match") return `<span class="badge">Vocabulary</span><h2>${safe(content.prompt)}</h2><div class="preview-vocabulary"><div><h3>Words learners will match</h3><ol>${(content.words || []).map(word => `<li>${safe(word)}</li>`).join("")}</ol></div><div><h3>Available meanings</h3><ol>${(content.definitions || []).map(definition => `<li>${safe(definition)}</li>`).join("")}</ol></div></div>`;
    if (stage.type === "quiz") return `<span class="badge">Reading Comprehension</span><h2>Questions learners will answer</h2>${(content.questions || []).map((question, index) => `<article class="preview-question"><h3>${index + 1}. ${safe(question.prompt)}</h3><ol>${(question.options || []).map(option => `<li>${safe(option)}</li>`).join("")}</ol></article>`).join("")}`;
    if (stage.type === "reflection") return `<span class="badge">Metacognition</span><h2>Reflection prompts learners will complete</h2><ul class="preview-prompt-list"><li>What did you learn?</li><li>What part was easiest?</li><li>What part was challenging?</li><li>How confident do you feel?</li></ul>`;
    if (stage.type === "forum") return `<span class="badge">Collaboration Forum</span><h2>Share ideas and perspectives</h2><p>Learners share one idea inspired by the reading and respond respectfully to a classmate in their private learning group.</p><div class="forum-privacy-note">Student posts are not shown in this content preview.</div>`;
    return `<p class="auth-message">This stage has no preview content.</p>`;
  }

  function renderNav() {
    $("#previewStageNav").innerHTML = reading.stages.map((stage, index) => `<button type="button" data-stage="${safe(stage.slug)}" class="${stage === activeStage ? "active" : ""}"><span>${index + 1}. ${safe(stage.title)}</span><small>View only</small></button>`).join("");
    $("#previewStageNav").querySelectorAll("button").forEach(button => button.onclick = () => showStage(reading.stages.find(stage => stage.slug === button.dataset.stage)));
  }

  async function showStage(stage) {
    activeStage = stage;
    history.replaceState(null, "", `teacher-reading-preview/?reading=${encodeURIComponent(reading.id)}&stage=${encodeURIComponent(stage.slug)}`);
    $("#previewStagePanel").innerHTML = '<p class="auth-message loading">Loading this stage…</p>';
    renderNav();
    try {
      if (stage.type !== "reflection" && stage.type !== "forum" && !stage.content) {
        const { data, error } = await window.supabaseClient.rpc("get_reading_stage_content", { target_activity_id: stage.id });
        if (error) throw error;
        stage.content = data || {};
      }
      $("#previewStagePanel").innerHTML = stageBody(stage);
    } catch (error) {
      console.error("Educator preview error:", error);
      $("#previewStagePanel").innerHTML = '<p class="auth-message error">We could not load this stage. Check the reading content permissions and try again.</p>';
    }
  }

  document.addEventListener("hub:auth-ready", () => {
    $("#teacherPreviewContent").hidden = false;
    $("#previewTheme").textContent = reading.theme;
    $("#previewTitle").textContent = reading.title;
    $("#previewDescription").textContent = reading.description;
    $("#previewImage").src = reading.image;
    $("#previewImage").alt = `Cover for ${reading.title}`;
    showStage(reading.stages.find(stage => stage.slug === params.get("stage")) || reading.stages[0]);
  }, { once: true });
  if (window.hubCurrentUser) document.dispatchEvent(new CustomEvent("hub:auth-ready", { detail: window.hubCurrentUser }));
  document.querySelector("[data-logout]")?.addEventListener("click", () => window.hubAuth.signOutAndRedirect());
})();
