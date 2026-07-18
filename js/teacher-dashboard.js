(() => {
  "use strict";
  const $ = selector => document.querySelector(selector);
  const safe = value => { const node = document.createElement("span"); node.textContent = value ?? ""; return node.innerHTML; };
  $("label[for='schoolYear']")?.remove();
  $("#schoolYear")?.remove();

  const pdfSafe = value => String(value).normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^\x20-\x7E]/g, "").replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  function downloadCredentialsPdf({ displayName, username, loginCode, groupName }) {
    const lines = ["Interactive Literacy Hub", "Learner Sign-In Card", `Learner: ${displayName}`, `Learning group: ${groupName}`, `Username: ${username}`, `Login code: ${loginCode}`, "Sign in at the Interactive Literacy Hub login page.", "Keep this card private and give it only to the learner or caregiver."];
    const stream = lines.map((line, index) => `BT /F1 ${index < 2 ? 17 : 11} Tf 0.07 0.14 0.37 rg 54 ${750 - index * 48} Td (${pdfSafe(line)}) Tj ET`).join("\n");
    const objects = ["<< /Type /Catalog /Pages 2 0 R >>", "<< /Type /Pages /Kids [3 0 R] /Count 1 >>", "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 5 0 R >> >> /Contents 4 0 R >>", `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`, "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold >>"];
    let pdf = "%PDF-1.4\n"; const offsets = [0];
    objects.forEach((object, index) => { offsets.push(pdf.length); pdf += `${index + 1} 0 obj\n${object}\nendobj\n`; });
    const xref = pdf.length; pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
    offsets.slice(1).forEach(offset => { pdf += `${String(offset).padStart(10, "0")} 00000 n \n`; });
    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
    const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
    const link = document.createElement("a"); link.href = url; link.download = `learner-credentials-${username}.pdf`; link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }

  function renderLearnerCreator(classes) {
    const note = $("#learnerProvisioningNote");
    if (!note) return;
    if (!classes.length) {
      note.innerHTML = '<span class="badge">Learner accounts</span><h2>Create a group first</h2><p>After creating a learning group, you can generate learner sign-in credentials here.</p>';
      return;
    }
    note.innerHTML = `<span class="badge">Learner accounts</span><h2>Create a learner</h2><p>Use an alias. The username and temporary login code are shown once after creation.</p><form id="createLearnerForm" class="group-form learner-form"><label for="learnerDisplayName">Learner name or alias<input id="learnerDisplayName" name="displayName" maxlength="60" required></label><label for="learnerClass">Learning group<select id="learnerClass" name="classId" required>${classes.map(item => `<option value="${safe(item.id)}">${safe(item.class_name)}</option>`).join("")}</select></label><button class="btn btn-primary" type="submit">Generate Login</button><p id="createLearnerStatus" class="auth-message" role="status" aria-live="polite"></p></form><div id="learnerCredentials" class="learner-credentials" hidden><p>Download or copy these credentials now. The login code will not be shown again.</p><div><span>Username</span><strong id="generatedUsername"></strong></div><div><span>Login code</span><strong id="generatedCode"></strong></div><div class="credential-actions"><button id="downloadLearnerCredentials" class="btn btn-primary" type="button">Download credentials PDF</button><button id="copyLearnerCredentials" class="btn btn-secondary" type="button">Copy credentials</button></div></div>`;
    $("#createLearnerForm").addEventListener("submit", createLearner);
  }

  function addLearnerToGroupCard({ classId, learnerId, displayName }) {
    const editForm = document.querySelector(`.edit-group-form[data-class-id="${CSS.escape(classId)}"]`);
    const card = editForm?.closest(".group-summary-card");
    if (!card) return;
    const count = card.querySelector(".group-card-meta strong");
    const label = card.querySelector(".group-card-meta span");
    const nextCount = (Number(count?.textContent) || 0) + 1;
    if (count) count.textContent = String(nextCount);
    if (label) label.textContent = nextCount === 1 ? "learner" : "learners";
    const panel = card.querySelector(".class-students-panel");
    if (!panel) return;
    let body = panel.querySelector("tbody");
    if (!body) {
      const groupName = card.querySelector(".group-card-title")?.textContent || "Learning group";
      panel.innerHTML = `<div class="class-students-heading"><h3>${safe(groupName)} learners</h3><button class="close-group-panel" type="button" data-close-panel="${safe(panel.id)}">Close</button></div><div class="table-wrap"><table><thead><tr><th>Learner</th><th>Current Reading / Stage</th><th>Journey Progress</th><th>Latest completed activity</th><th>Credentials</th></tr></thead><tbody></tbody></table></div>`;
      body = panel.querySelector("tbody");
      panel.querySelector("[data-close-panel]")?.addEventListener("click", () => {
        panel.hidden = true;
        const toggle = card.querySelector(".group-card-toggle");
        toggle?.setAttribute("aria-expanded", "false");
        if (toggle) toggle.textContent = "View learners →";
        card.classList.remove("is-open");
      });
    }
    const learnerLabel = learnerId ? `<a class="learner-detail-link" href="student-progress.html?student=${encodeURIComponent(learnerId)}">${safe(displayName)}</a>` : safe(displayName);
    body.insertAdjacentHTML("beforeend", `<tr><td>${learnerLabel}</td><td>Choose a reading<small class="table-subtext">Not started</small></td><td><span class="teacher-progress">0%</span></td><td>Just started</td><td>Credentials available above</td></tr>`);
  }

  async function createLearner(event) {
    event.preventDefault();
    const form = event.currentTarget;
    const status = $("#createLearnerStatus");
    const button = form.querySelector('button[type="submit"]');
    status.textContent = "Creating a secure learner login…"; status.className = "auth-message loading"; button.disabled = true;
    try {
      const { data, error } = await window.supabaseClient.functions.invoke("create-learner", { body: { displayName: form.elements.displayName.value.trim(), classId: form.elements.classId.value } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      $("#generatedUsername").textContent = data.username;
      $("#generatedCode").textContent = data.loginCode;
      $("#learnerCredentials").hidden = false;
      const studentCount = $("#studentCount");
      if (studentCount) studentCount.textContent = String((Number(studentCount.textContent) || 0) + 1);
      addLearnerToGroupCard({ classId: form.elements.classId.value, learnerId: data.learnerId, displayName: data.displayName });
      status.textContent = `${data.displayName} was added to the learning group.`; status.className = "auth-message success";
      form.elements.displayName.value = "";
      const groupName = form.elements.classId.options[form.elements.classId.selectedIndex].textContent;
      $("#downloadLearnerCredentials").onclick = () => downloadCredentialsPdf({ displayName: data.displayName, username: data.username, loginCode: data.loginCode, groupName });
      $("#copyLearnerCredentials").onclick = async () => {
        const credentials = `Interactive Literacy Hub\nUsername: ${data.username}\nLogin code: ${data.loginCode}`;
        try { await navigator.clipboard.writeText(credentials); $("#copyLearnerCredentials").textContent = "Copied!"; }
        catch (copyError) { console.error("Credential copy error:", copyError); }
      };
    } catch (error) {
      console.error("Create learner error:", error);
      let detail = "";
      try {
        if (error?.context instanceof Response) {
          const payload = await error.context.clone().json();
          detail = String(payload?.error || "");
        }
      } catch (responseError) { console.error("Function error response:", responseError); }
      const friendlyMessages = {
        "Authentication required": "Your session expired. Sign in again and retry.",
        "Session is not valid": "Your session expired. Sign in again and retry.",
        "Educator role required": "This account is not marked as an Educator. Run the public educator registration migration, then sign in again.",
        "Educator profile could not be read": "The Edge Function could not query profiles. Check its logs and protected project environment variables.",
        "Educator profile was not found": "The signed-in account has no profile in the Supabase project used by the Edge Function.",
        "Learning group could not be read": "The Edge Function could not query learning groups. Check its Supabase logs.",
        "Learning group not found": "That learning group does not belong to this Educator or is inactive.",
        "Function configuration is incomplete": "The Edge Function is missing its protected Supabase environment configuration.",
        "The learner account could not be created": "Supabase could not create or link the learner. Open the create-learner function logs for the technical cause."
      };
      status.textContent = friendlyMessages[detail] || (detail ? `Learner creation error: ${detail}` : "The Edge Function responded with an error. Open its Supabase logs for details.");
      status.className = "auth-message error";
    } finally { button.disabled = false; }
  }

  document.addEventListener("hub:auth-ready", async (event) => {
    const { profile } = event.detail;
    const status = $("#teacherStatus");
    $("#teacherContent").hidden = false;
    const classesList = $("#classesList");
    if (classesList && !$("#learnerProvisioningNote")) {
      const note = document.createElement("section");
      note.id = "learnerProvisioningNote";
      note.className = "dashboard-card learner-provisioning-note";
      note.innerHTML = '<span class="badge">Learner accounts</span><h2>Learners only sign in</h2><p>Learners cannot register publicly. Until secure educator provisioning is deployed, learner credentials must be created manually in Supabase and assigned to the appropriate group.</p>';
      classesList.before(note);
    }
    $("#teacherName").textContent = profile.display_name || profile.username || "Educator";
    try {
      const { data: classes, error } = await window.supabaseClient.from("classes").select("id,class_name,class_code,school_name,school_year").eq("teacher_id", profile.id).eq("is_active", true).order("created_at");
      if (error) throw error;
      const allClasses = classes || [];
      const classIds = allClasses.map(item => item.id);
      const [membersResult, activitiesResult] = classIds.length ? await Promise.all([
        window.supabaseClient.from("class_members").select("class_id,student_id").in("class_id", classIds),
        window.supabaseClient.from("activities").select("id", { count: "exact", head: true }).eq("is_active", true)
      ]) : [{ data: [], error: null }, { count: 0, error: null }];
      if (membersResult.error) throw membersResult.error;
      if (activitiesResult.error) throw activitiesResult.error;
      const members = membersResult.data || [];
      const studentIds = [...new Set(members.map(item => item.student_id))];
      const profilesResult = studentIds.length
        ? await window.supabaseClient.from("profiles").select("id,display_name,username,avatar,student_progress(activity_id,status,score,completed_at,updated_at,confidence_level,activities(title,reading_id,skill,is_active,is_required))").in("id", studentIds)
        : { data: [], error: null };
      if (profilesResult.error) throw profilesResult.error;
      const profilesById = new Map((profilesResult.data || []).map(student => [student.id, student]));
      const journeysResult = studentIds.length ? await window.supabaseClient.from("student_readings").select("student_id,reading_id,status,current_activity_id,updated_at,readings(title)").in("student_id",studentIds).order("updated_at",{ascending:false}) : {data:[],error:null};
      if(journeysResult.error) throw journeysResult.error;
      const journeysByStudent=new Map();(journeysResult.data||[]).forEach(item=>{if(!journeysByStudent.has(item.student_id))journeysByStudent.set(item.student_id,item);});
      const activeTotal = activitiesResult.count || 0;
      const studentTotal = studentIds.length;
      $("#classCount").textContent = allClasses.length;
      $("#studentCount").textContent = studentTotal;
      $("#classesList").innerHTML = allClasses.map(item => {
        const students = members.filter(member => member.class_id === item.id).map(member => profilesById.get(member.student_id)).filter(Boolean);
        const rows = students.map(student => {
          const records = student.student_progress || [];
          const done = records.filter(record => record.status === "completed");
          const latest = [...done].sort((a, b) => new Date(b.completed_at || b.updated_at) - new Date(a.completed_at || a.updated_at))[0];
          const percent = activeTotal ? Math.round(done.length / activeTotal * 100) : 0;
          const journey=journeysByStudent.get(student.id);const journeyRecords=records.filter(record=>record.activities?.reading_id===journey?.reading_id&&record.activities?.is_active&&record.activities?.is_required);const journeyDone=journeyRecords.filter(record=>record.status==="completed").length;const journeyPercent=journey?Math.round(journeyDone/9*100):0;const currentStage=journeyRecords.find(record=>record.activity_id===journey?.current_activity_id)?.activities?.title||"Not started";
          return `<tr><td><a class="learner-detail-link" href="student-progress.html?student=${encodeURIComponent(student.id)}">${safe(student.display_name || student.username || "Student")}</a></td><td>${safe(journey?.readings?.title||"Choose a reading")}<small class="table-subtext">${safe(currentStage)}</small></td><td><span class="teacher-progress">${journeyPercent}%</span></td><td>${safe(latest?.activities?.title || "Just started")}</td><td><button class="credential-pdf-button" type="button" data-learner-id="${safe(student.id)}" data-class-id="${safe(item.id)}" data-group-name="${safe(item.class_name)}">Download PDF</button></td></tr>`;
        }).join("");
        const panelId=`class-students-${item.id}`;
        return `<article class="dashboard-card class-card group-summary-card"><div class="group-card-summary"><div class="group-card-copy"><span class="badge">Group code: ${safe(item.class_code)}</span><div class="editable-group-text"><strong class="group-card-title">${safe(item.class_name)}</strong><button class="pencil-edit" type="button" data-edit-field="name" aria-label="Edit group name" title="Edit group name">✎</button></div><div class="editable-group-text"><span class="group-card-organization">${safe(item.school_name || "Organization or setting not added")}</span><button class="pencil-edit" type="button" data-edit-field="organization" aria-label="Edit organization or setting" title="Edit organization or setting">✎</button></div></div><div class="group-card-meta"><strong>${students.length}</strong><span>${students.length===1?"learner":"learners"}</span><button class="group-card-toggle" type="button" aria-expanded="false" aria-controls="${safe(panelId)}">View learners →</button></div></div><form class="edit-group-form" data-class-id="${safe(item.id)}" data-editing-field="name" hidden><label>Group name<input name="fieldValue" maxlength="80" value="${safe(item.class_name)}" required></label><div><button class="btn btn-primary" type="submit">Save</button><button class="btn btn-secondary cancel-group-edit" type="button">Cancel</button></div><p class="auth-message" role="status" aria-live="polite"></p></form><form class="edit-group-form" data-class-id="${safe(item.id)}" data-editing-field="organization" hidden><label>Organization or setting<input name="fieldValue" maxlength="100" value="${safe(item.school_name || "")}" placeholder="School, tutoring practice, or homeschool"></label><div><button class="btn btn-primary" type="submit">Save</button><button class="btn btn-secondary cancel-group-edit" type="button">Cancel</button></div><p class="auth-message" role="status" aria-live="polite"></p></form><div id="${safe(panelId)}" class="class-students-panel" hidden>${rows ? `<div class="class-students-heading"><h3>${safe(item.class_name)} learners</h3><button class="close-group-panel" type="button" data-close-panel="${safe(panelId)}">Close</button></div><div class="table-wrap"><table><thead><tr><th>Learner</th><th>Current Reading / Stage</th><th>Journey Progress</th><th>Latest completed activity</th><th>Credentials</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="empty-state">No learners have joined this group yet.</p>'}</div></article>`;
      }).join("") || '<article class="dashboard-card empty-state"><h2>No active classes yet</h2><p>Your classes will appear here after they are created in Supabase.</p></article>';
      renderLearnerCreator(allClasses);
      status.textContent = allClasses.length ? "Learning group information is up to date." : "Create your first learning group above.";
      status.className = "dashboard-status success";
      document.querySelectorAll(".credential-pdf-button").forEach(button => button.addEventListener("click", resetAndDownloadCredentials));
      document.querySelectorAll(".group-card-toggle").forEach(button=>button.addEventListener("click",()=>{
        const panel=document.getElementById(button.getAttribute("aria-controls"));
        const opening=button.getAttribute("aria-expanded")!=="true";
        document.querySelectorAll(".group-card-toggle").forEach(other=>{other.setAttribute("aria-expanded","false");other.textContent="View learners →";});
        document.querySelectorAll(".group-summary-card").forEach(card=>card.classList.remove("is-open"));
        document.querySelectorAll(".class-students-panel").forEach(other=>{other.hidden=true;});
        button.setAttribute("aria-expanded",String(opening));
        button.textContent=opening?"Hide learners ↑":"View learners →";
        panel.hidden=!opening;
        button.closest(".group-summary-card")?.classList.toggle("is-open",opening);
        if(opening)panel.scrollIntoView({behavior:"smooth",block:"nearest"});
      }));
      document.querySelectorAll("[data-close-panel]").forEach(button=>button.addEventListener("click",()=>{
        const panel=document.getElementById(button.dataset.closePanel);
        panel.hidden=true;
        const toggle=document.querySelector(`[aria-controls="${CSS.escape(button.dataset.closePanel)}"]`);
        toggle?.setAttribute("aria-expanded","false");
        if(toggle)toggle.textContent="View learners →";
        toggle?.closest(".group-summary-card")?.classList.remove("is-open");
      }));
      document.querySelectorAll(".pencil-edit").forEach(button=>button.addEventListener("click",()=>{
        const card=button.closest(".group-summary-card"),form=card.querySelector(`[data-editing-field="${button.dataset.editField}"]`);
        card.querySelectorAll(".edit-group-form").forEach(other=>{other.hidden=true;});
        form.hidden=false;form.elements.fieldValue.focus();form.elements.fieldValue.select();
      }));
      document.querySelectorAll(".cancel-group-edit").forEach(button=>button.addEventListener("click",()=>{
        button.closest(".edit-group-form").hidden=true;
      }));
      document.querySelectorAll(".edit-group-form").forEach(form=>form.addEventListener("submit",async event=>{
        event.preventDefault();const value=form.elements.fieldValue.value.trim(),field=form.dataset.editingField,message=form.querySelector(".auth-message"),save=form.querySelector('[type="submit"]');
        if(field==="name"&&value.length<2){message.textContent="Enter at least 2 characters.";message.className="auth-message error";return;}
        save.disabled=true;message.textContent="Saving…";message.className="auth-message loading";
        const request=field==="name"?window.supabaseClient.rpc("rename_learning_group",{target_class_id:form.dataset.classId,new_group_name:value}):window.supabaseClient.rpc("update_learning_group_organization",{target_class_id:form.dataset.classId,new_organization_name:value||null});
        const {error}=await request;
        if(error){console.error("Edit group error",error);message.textContent="We could not update this information.";message.className="auth-message error";save.disabled=false;return;}
        const card=form.closest(".group-summary-card");if(field==="name"){card.querySelector(".group-card-title").textContent=value;card.querySelector(".class-students-heading h3")?.replaceChildren(`${value} learners`);}else card.querySelector(".group-card-organization").textContent=value||"Organization or setting not added";
        message.textContent="Information updated.";message.className="auth-message success";
        setTimeout(()=>{form.hidden=true;save.disabled=false;},700);
      }));
    } catch (error) {
      console.error("Teacher dashboard error:", error);
      status.textContent = navigator.onLine ? "We could not load class information. Check the teacher RLS policies and try again." : "You are offline. Reconnect to see your classes.";
      status.className = "dashboard-status error";
    }
  }, { once: true });

  if (window.hubCurrentUser) {
    document.dispatchEvent(new CustomEvent("hub:auth-ready", { detail: window.hubCurrentUser }));
  }

  async function resetAndDownloadCredentials(event) {
    const button = event.currentTarget;
    const originalText = button.textContent;
    button.disabled = true; button.textContent = "Generating…";
    try {
      const { data, error } = await window.supabaseClient.functions.invoke("create-learner", { body: { action: "reset", learnerId: button.dataset.learnerId, classId: button.dataset.classId } });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      downloadCredentialsPdf({ displayName: data.displayName, username: data.username, loginCode: data.loginCode, groupName: button.dataset.groupName });
      button.textContent = "Downloaded";
      setTimeout(() => { button.textContent = originalText; button.disabled = false; }, 1800);
    } catch (error) {
      console.error("Credential PDF error:", error);
      button.textContent = "Try again"; button.disabled = false;
    }
  }
  document.querySelector("#createClassForm")?.addEventListener("submit", async event => {
    event.preventDefault();
    const form = event.currentTarget;
    const status = document.querySelector("#createClassStatus");
    const button = form.querySelector('button[type="submit"]');
    status.textContent = "Creating your private group…"; status.className = "auth-message loading"; button.disabled = true;
    try {
      const { data, error } = await window.supabaseClient.rpc("create_learning_group", { group_name: form.elements.className.value.trim(), organization_name: form.elements.schoolName.value.trim() || null, learning_year: null });
      if (error) throw error;
      status.textContent = `Group created. Its private code is ${data}.`;
      status.className = "auth-message success";
      setTimeout(() => window.location.reload(), 900);
    } catch (error) {
      console.error("Create group error:", error);
      status.textContent = "We could not create the group. Make sure the public-registration SQL migration has been run.";
      status.className = "auth-message error"; button.disabled = false;
    }
  });
  document.querySelector("[data-logout]")?.addEventListener("click", () => window.hubAuth.signOutAndRedirect());
})();
