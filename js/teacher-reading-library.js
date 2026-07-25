(() => {
  "use strict";
  const safe = value => { const node = document.createElement("span"); node.textContent = value ?? ""; return node.innerHTML; };
  const readings = Object.values(window.hubReadings || {});
  document.querySelector("#teacherReadingCards").innerHTML = readings.map((reading, index) => `<article class="reading-card"><div class="reading-card-image"><img src="${safe(reading.image)}" loading="lazy" decoding="async" alt="Cover for ${safe(reading.title)}"><span>Reading ${index + 1} of 10</span></div><div><span class="badge">${safe(reading.theme)}</span><h2>${safe(reading.title)}</h2><p>${safe(reading.description)}</p><p><strong>${safe(reading.difficulty)}</strong> · About ${reading.minutes} minutes · 9 stages</p><a class="btn btn-primary" href="teacher-reading-preview.html?reading=${encodeURIComponent(reading.id)}">Preview content →</a></div></article>`).join("");
  document.addEventListener("hub:auth-ready", () => { document.querySelector("#teacherLibraryContent").hidden = false; }, { once: true });
  if (window.hubCurrentUser) document.dispatchEvent(new CustomEvent("hub:auth-ready", { detail: window.hubCurrentUser }));
  document.querySelector("[data-logout]")?.addEventListener("click", () => window.hubAuth.signOutAndRedirect());
})();
