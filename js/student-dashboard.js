(() => {
  "use strict";
  const $ = (selector) => document.querySelector(selector);
  const escape = (value) => { const node = document.createElement("span"); node.textContent = value ?? ""; return node.innerHTML; };
  const positiveLabel = (percent) => percent >= 100 ? "Completed" : percent >= 75 ? "Almost there" : percent >= 40 ? "Making progress" : percent > 0 ? "Growing" : "Just started";
  const activityUrl = (activity) => activity.page_url || ({ vocabulary: "vocabulary.html", reading: "reading.html", collaboration: "collaborate.html", culture: "culture.html", technology: "technology.html", family: "family.html" }[activity.category] || "index.html");
  const practiceLink=document.querySelector('.dashboard-nav a[href="vocabulary.html"]');
  if(practiceLink){practiceLink.href="reading-library.html";practiceLink.textContent="Choose Your Reading";}
  const avatarFiles=Array.from({length:6},(_,index)=>`avatar${index+1}.png`);
  const eagleProgressImages=["progrees1.png","progress2.png","progress3.png","progress4.png","progress5.png","progress6.png","progress7.png","progress8.png","progress9.png","progress10.png"];
  const avatarPath=file=>`assets/images/avatar/${file}`;
  const renderAvatar=file=>{const host=$("#studentAvatar");if(avatarFiles.includes(file))host.innerHTML=`<img src="${avatarPath(file)}" alt="My selected avatar">`;else host.textContent="🙂";};
  function openAvatarPicker(required=false){if($("#avatarPicker"))return;let selected="";const picker=document.createElement("div");picker.id="avatarPicker";picker.className="avatar-picker-backdrop";picker.setAttribute("role","dialog");picker.setAttribute("aria-modal","true");picker.setAttribute("aria-labelledby","avatarPickerTitle");picker.innerHTML=`<section class="avatar-picker-card"><span class="badge">Make it yours</span><h2 id="avatarPickerTitle">Choose your avatar</h2><p>Select the character that will represent you during your learning journey.</p><div class="avatar-choice-grid">${avatarFiles.map((file,index)=>`<button type="button" data-avatar="${file}" aria-label="Choose avatar ${index+1}"><img src="${avatarPath(file)}" alt="Avatar option ${index+1}"><span>Avatar ${index+1}</span></button>`).join("")}</div><p id="avatarPickerStatus" class="auth-message" role="status"></p><div class="avatar-picker-actions">${required?"":'<button type="button" class="btn btn-secondary" data-close-avatar>Cancel</button>'}<button type="button" class="btn btn-primary" data-save-avatar disabled>Save My Avatar</button></div></section>`;document.body.append(picker);picker.querySelectorAll("[data-avatar]").forEach(button=>button.onclick=()=>{picker.querySelectorAll("[data-avatar]").forEach(item=>{item.classList.remove("selected");item.setAttribute("aria-pressed","false");});button.classList.add("selected");button.setAttribute("aria-pressed","true");selected=button.dataset.avatar;picker.querySelector("[data-save-avatar]").disabled=false;});picker.querySelector("[data-close-avatar]")?.addEventListener("click",()=>picker.remove());picker.querySelector("[data-save-avatar]").onclick=async event=>{const status=picker.querySelector("#avatarPickerStatus");event.currentTarget.disabled=true;status.textContent="Saving your avatar…";status.className="auth-message loading";const {data,error}=await window.supabaseClient.rpc("choose_my_avatar",{avatar_file:selected});if(error){console.error("Avatar save error",error);status.textContent="We could not save your avatar. Please try again.";status.className="auth-message error";event.currentTarget.disabled=false;return;}renderAvatar(data?.avatar||selected);picker.remove();};picker.querySelector("[data-avatar]")?.focus();}

  function renderActivity(activity, note) {
    return `<a class="activity-row" href="${escape(activityUrl(activity))}"><span><strong>${escape(activity.title)}</strong><small>${escape(activity.category || "Practice")}</small></span><span>${escape(note)}</span></a>`;
  }

  async function loadDashboard(event) {
    const { user, profile } = event.detail;
    const status = $("#dashboardStatus");
    $("#dashboardContent").hidden = false;
    $("#studentName").textContent = profile.display_name || profile.username || "Reader";
    renderAvatar(profile.avatar);
    $("#studentAvatar").setAttribute("role","button");
    $("#studentAvatar").setAttribute("tabindex","0");
    $("#studentAvatar").setAttribute("aria-label","Change my avatar");
    $("#studentAvatar").onclick=()=>openAvatarPicker(false);
    $("#studentAvatar").onkeydown=event=>{if(event.key==="Enter"||event.key===" "){event.preventDefault();openAvatarPicker(false);}};
    if(!avatarFiles.includes(profile.avatar))setTimeout(()=>openAvatarPicker(true),100);
    $("#studentAvatar").textContent = profile.avatar === "owl" ? "🦉" : "📚";
    renderAvatar(profile.avatar);
    $("#totalPoints").textContent = profile.total_points || 0;
    $("#currentLevel").textContent = profile.current_level || 1;
    if (!$("#currentJourneyCard")) {
      const card=document.createElement("section");card.id="currentJourneyCard";card.className="dashboard-card current-journey-card";
      card.innerHTML='<div><span class="badge">Current Reading Journey</span><h2 id="currentJourneyTitle">Choose Your Reading</h2><p id="currentJourneySummary">Start with one complete, welcoming story.</p><div class="progress-track"><span id="currentJourneyBar" style="width:0%"></span></div><p id="currentJourneyProgress">Ready to explore</p></div><a id="currentJourneyButton" class="btn btn-primary" href="reading-library.html">Choose Your Reading →</a>';
      $("#dashboardStatus").after(card);
    }
    try {
      const client = window.supabaseClient;
      const [activitiesResult, progressResult, journeysResult, readingsResult] = await Promise.all([
        client.from("activities").select("id,title,description,category,skill,page_url,total_points,activity_order,reading_id,is_required").eq("is_active", true).order("activity_order"),
        client.from("student_progress").select("activity_id,status,score,attempts,confidence_level,completed_at,updated_at").eq("student_id", user.id).order("updated_at", { ascending: false }),
        client.from("student_readings").select("reading_id,status,current_activity_id,updated_at,readings(title,theme,image_path)").eq("student_id",user.id).order("updated_at",{ascending:false}),
        client.from("readings").select("id,title,theme,image_path,reading_order").eq("is_active",true).order("reading_order")
      ]);
      if (activitiesResult.error) throw activitiesResult.error;
      if (progressResult.error) throw progressResult.error;
      if (journeysResult.error) throw journeysResult.error;
      if (readingsResult.error) throw readingsResult.error;
      let activities = activitiesResult.data || [];
      const allReadingActivities=activities.filter(activity=>activity.reading_id&&activity.is_required!==false);
      const progress = progressResult.data || [];
      const progressMap = new Map(progress.map(item => [item.activity_id, item]));
      const earnedResult={data:[]};
      const currentJourney=(journeysResult.data||[])[0];
      const journeyMap=new Map((journeysResult.data||[]).map(item=>[item.reading_id,item]));
      const readingCatalog=readingsResult.data||[];
      const firstUnstartedIndex=readingCatalog.findIndex(reading=>!journeyMap.has(reading.id));
      const nextIsUnlocked=firstUnstartedIndex===0||(firstUnstartedIndex>0&&readingCatalog.slice(0,firstUnstartedIndex).every(reading=>journeyMap.get(reading.id)?.status==="completed"));
      const visibleReadings=readingCatalog.filter((reading,index)=>journeyMap.has(reading.id)||(nextIsUnlocked&&index===firstUnstartedIndex));
      let readingProgressSection=$("#readingProgressSection");
      if(!readingProgressSection){readingProgressSection=document.createElement("section");readingProgressSection.id="readingProgressSection";readingProgressSection.className="dashboard-card";readingProgressSection.innerHTML='<div class="reading-progress-heading"><div><span class="badge">My Reading Progress</span><h2>My Reading Journeys</h2><p>New readings appear as you move forward.</p></div><a class="btn btn-secondary" href="reading-library.html">Reading Library</a></div><div id="readingProgressCards" class="student-reading-progress-grid"></div>';$(".progress-overview")?.closest(".dashboard-grid")?.after(readingProgressSection);}
      $("#readingProgressCards").innerHTML=visibleReadings.map(reading=>{const stages=allReadingActivities.filter(activity=>activity.reading_id===reading.id),completedStages=stages.filter(activity=>progressMap.get(activity.id)?.status==="completed").length,total=stages.length||9,percentage=Math.round(completedStages/total*100),journey=journeyMap.get(reading.id),statusText=percentage===100?"Completed":journey?"In progress":"Next reading",actionText=percentage===100?"Read Again":journey?"Continue":"Start Reading";return `<article class="student-reading-progress-card ${journey?"is-started":"is-next"}"><img src="${escape(reading.image_path||"assets/icons/book.svg")}" alt="Reference cover for ${escape(reading.title)}"><div><span class="badge">${escape(statusText)}</span><h3>${escape(reading.title)}</h3><p>${completedStages} of ${total} stages completed</p><div class="progress-track" role="progressbar" aria-label="${escape(reading.title)} progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${percentage}"><span style="width:${percentage}%"></span></div><strong>${percentage}%</strong><a class="btn ${journey?"btn-primary":"btn-secondary"}" href="reading-journey.html?reading=${encodeURIComponent(reading.id)}">${actionText} →</a></div></article>`;}).join("");
      const dashboardReadingId=currentJourney?.reading_id||"community-garden";
      activities=activities.filter(activity=>activity.reading_id===dashboardReadingId&&activity.is_required!==false);
      const completedReadings=(journeysResult.data||[]).filter(item=>item.status==="completed").length,eagleStage=Math.min(completedReadings,10),eagleImage=eagleProgressImages[Math.max(0,eagleStage-1)];
      const completionCard=$(".progress-overview"),summaryGrid=completionCard?.parentElement,recommendedCard=$(".recommended-card");let eagleCard=$("#eagleProgressCard");if(!eagleCard){eagleCard=document.createElement("article");eagleCard.id="eagleProgressCard";eagleCard.className="dashboard-card eagle-progress-card";summaryGrid?.insertBefore(eagleCard,recommendedCard);}if(recommendedCard?.parentElement===summaryGrid){summaryGrid.after(recommendedCard);recommendedCard.classList.add("recommended-wide-card");}eagleCard.classList.toggle("locked",eagleStage===0);eagleCard.innerHTML=`<div id="eagleProgressWidget" class="eagle-progress-widget"><span class="badge">My Eagle Journey</span><h2>Eagle Progress</h2><div class="eagle-progress-image"><span class="eagle-spark" aria-hidden="true">✦</span><img src="assets/images/progress/${eagleImage}" alt="Eagle growth stage ${Math.max(1,eagleStage)}"></div><strong>${eagleStage===0?"Your first eagle stage is waiting!":`Eagle stage ${eagleStage} unlocked!`}</strong><p>${eagleStage} of 10 readings completed</p><div class="progress-track"><span style="width:${eagleStage*10}%"></span></div></div>`;
      if(currentJourney){const journeyActivities=activities.filter(item=>item.reading_id===currentJourney.reading_id||String(item.id).startsWith(`${currentJourney.reading_id}-`));const journeyDone=journeyActivities.filter(item=>progressMap.get(item.id)?.status==="completed").length;const journeyPercent=journeyActivities.length?Math.round(journeyDone/journeyActivities.length*100):0;$("#currentJourneyTitle").textContent=currentJourney.readings?.title||"The Community Garden";$("#currentJourneySummary").textContent=`${currentJourney.readings?.theme||"Family and Community"} · ${positiveLabel(journeyPercent)}`;$("#currentJourneyBar").style.width=`${journeyPercent}%`;$("#currentJourneyProgress").textContent=`${journeyPercent}% completed`;$("#currentJourneyButton").href=`reading-journey.html?reading=${currentJourney.reading_id}`;$("#currentJourneyButton").textContent=journeyPercent===100?"Read Again →":"Continue Reading →";}
      const completed = activities.filter(activity => progressMap.get(activity.id)?.status === "completed");
      const pending = activities.filter(activity => progressMap.get(activity.id)?.status !== "completed");
      const percent = activities.length ? Math.round(completed.length / activities.length * 100) : 0;
      const scored = progress.filter(item => item.status === "completed" && item.score !== null && item.score !== undefined && Number.isFinite(Number(item.score)));
      const accuracy = scored.length ? Math.round(scored.reduce((sum, item) => sum + Number(item.score), 0) / scored.length) : null;
      $("#completedCount").textContent = completed.length;
      $("#skillAccuracy").textContent = accuracy === null ? "Just started" : `${accuracy}%`;
      $("#overallPercent").textContent = `${percent}%`;
      $("#progressRing").style.setProperty("--progress", `${percent * 3.6}deg`);
      $("#progressLabel").textContent = positiveLabel(percent);
      $("#encouragement").textContent = `${positiveLabel(percent)} — every step forward helps your confidence grow.`;
      $("#activityCounts").textContent = `${completed.length} of ${activities.length} activities completed`;

      const grouped = activities.reduce((map, activity) => { (map[activity.category] ||= []).push(activity); return map; }, {});
      Object.keys(grouped).forEach(category=>{if(category.toLowerCase()==="culture")delete grouped[category];});
      $("#categoryProgress").innerHTML = Object.entries(grouped).map(([category, items]) => {
        const count = items.filter(item => progressMap.get(item.id)?.status === "completed").length;
        const value = Math.round(count / items.length * 100);
        return `<div class="category-row"><div><strong>${escape(category)}</strong><span>${positiveLabel(value)} · ${value}%</span></div><div class="progress-track" role="progressbar" aria-label="${escape(category)} progress" aria-valuenow="${value}" aria-valuemin="0" aria-valuemax="100"><span style="width:${value}%"></span></div></div>`;
      }).join("") || '<p class="empty-state">No active activities are available yet.</p>';
      $("#completedActivities").innerHTML = completed.map(activity => {const score=progressMap.get(activity.id)?.score;return renderActivity(activity,score===null||score===undefined?"Completed":Number(score)===0?"Needs retry":`${score}%`);}).join("") || '<p class="empty-state">Your first completed activity will appear here. You’ve got this!</p>';
      $("#pendingActivities").innerHTML = pending.slice(0, 6).map(activity => renderActivity(activity, progressMap.has(activity.id) ? "Keep growing" : "Start")).join("") || '<p class="empty-state">You completed every active activity!</p>';
      const exploreCard=$("#pendingActivities")?.closest(".dashboard-card"),exploreGrid=exploreCard?.parentElement;if(exploreCard){exploreGrid?.classList.add("completed-only-grid");exploreCard.remove();}
      const recommended = pending[0];
      if (recommended) { $("#recommendedTitle").textContent = recommended.title; $("#recommendedDescription").textContent = recommended.description || "Take one small, friendly step."; $("#recommendedLink").href = activityUrl(recommended); }
      else if (activities.length) { $("#recommendedTitle").textContent = "You completed every activity!"; $("#recommendedDescription").textContent = "Revisit a favorite activity to keep growing."; $("#recommendedLink").href = activityUrl(activities[0]); $("#recommendedLink").textContent = "Practice again →"; }
      $("#badgesList").innerHTML = (earnedResult.data || []).map(item => `<article class="earned-badge">${item.badges?.icon_path ? `<img src="${escape(item.badges.icon_path)}" alt="">` : "🏅"}<strong>${escape(item.badges?.name || "Badge")}</strong><span>${escape(item.badges?.description || "Learning milestone")}</span></article>`).join("") || '<p class="empty-state">Badges are waiting for your learning milestones.</p>';
      const byId = new Map(activities.map(activity => [activity.id, activity]));
      $("#recentHistory").innerHTML = progress.slice(0, 5).map(item => {
        const activity = byId.get(item.activity_id); if (!activity) return "";
        const date = new Date(item.completed_at || item.updated_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });
        return renderActivity(activity, `${positiveLabel(item.status === "completed" ? 100 : 25)} · ${date}`);
      }).join("") || '<p class="empty-state">Recent practice will appear here.</p>';
      status.textContent = activities.length ? "Your dashboard is up to date." : "No activities are active yet. Please check back soon.";
      status.className = "dashboard-status success";
    } catch (error) {
      console.error("Student dashboard error:", error);
      status.textContent = navigator.onLine ? "We could not load your progress right now. Please refresh and try again." : "You are offline. Reconnect to see your progress.";
      status.className = "dashboard-status error";
    }
  }
  document.addEventListener("hub:auth-ready", loadDashboard, { once: true });
  if (window.hubCurrentUser) loadDashboard({ detail: window.hubCurrentUser });
  document.querySelector("[data-logout]")?.addEventListener("click", () => window.hubAuth.signOutAndRedirect());
})();
