const q = (selector, context = document) => context.querySelector(selector);
const qa = (selector, context = document) => [...context.querySelectorAll(selector)];

// Update visible terminology without changing technical database identifiers.
const reflectionCopyWalker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
while (reflectionCopyWalker.nextNode()) {
  const node = reflectionCopyWalker.currentNode;
  node.nodeValue = node.nodeValue
    .replace(/\bReflections\b/g, "Metacognition")
    .replace(/\bReflection\b/g, "Metacognition")
    .replace(/\breflections\b/g, "metacognition responses")
    .replace(/\breflection\b/g, "metacognition");
}

qa('img[src="assets/images/student-reading.svg"]').forEach((image) => {
  image.src = "assets/images/student-reading.png";
  image.style.transform = "scale(.9)";
  image.style.transformOrigin = "bottom center";
});

let favicon = q('link[rel="icon"]');
if (!favicon) {
  favicon = document.createElement("link");
  favicon.rel = "icon";
  favicon.type = "image/png";
  document.head.append(favicon);
}
favicon.type = "image/png";
favicon.href = "assets/icons/logo.png";

const currentPage = location.pathname.split("/").pop() || "index.html";
qa(".main-nav a").forEach((link) => {
  if (link.dataset.page === currentPage) link.classList.add("active");
});

const resourceMenu = q(".nav-dropdown");
const resourceSummary = resourceMenu?.querySelector("summary");
if (resourceSummary) resourceSummary.textContent = "How It Works";
qa('.main-nav a[href="technology.html"]').forEach(link => link.remove());
if (resourceMenu && q(".nav-dropdown-menu a.active", resourceMenu)) {
  q("summary", resourceMenu).classList.add("active");
}
document.addEventListener("click", (event) => {
  if (resourceMenu?.open && !resourceMenu.contains(event.target)) resourceMenu.removeAttribute("open");
});

const menu = q(".menu-toggle");
const nav = q(".main-nav");
menu?.addEventListener("click", () => nav.classList.toggle("open"));

qa(".teacher-link").forEach((button) => {
  button.textContent = "Sign In";
  button.removeAttribute("data-open-teacher");
  button.addEventListener("click", () => window.location.assign("login.html"));
});
qa("[data-close-modal]").forEach((button) => {
  button.onclick = () => q("#teacherModal").classList.remove("open");
});

qa(".option").forEach((option) => {
  option.onclick = () => {
    qa(".option", option.parentElement).forEach((item) => item.classList.remove("selected"));
    option.classList.add("selected");
  };
});

function toast(text) {
  const message = q(".toast");
  message.textContent = text;
  message.classList.add("show");
  setTimeout(() => message.classList.remove("show"), 2200);
}

let savedProgress = +localStorage.getItem("hubProgress") || 0;
function progress(value) {
  savedProgress = Math.min(100, savedProgress + value);
  localStorage.setItem("hubProgress", savedProgress);
  qa("[data-progress]").forEach((item) => (item.style.width = `${savedProgress}%`));
  qa("[data-progress-label]").forEach((item) => (item.textContent = `${savedProgress}%`));
  toast(`Progress saved: ${savedProgress}%`);
}

qa("[data-progress]").forEach((item) => (item.style.width = `${savedProgress}%`));
qa("[data-progress-label]").forEach((item) => (item.textContent = `${savedProgress}%`));
qa("[data-complete]").forEach((button) => (button.onclick = () => progress(20)));

if (["collaborate.html", "culture.html", "technology.html"].includes(currentPage)) {
  qa("[data-complete]").forEach((button) => {
    const link = document.createElement("a");
    link.className = button.className;
    link.href = "reading-library.html";
    link.textContent = "Sign in to practice →";
    button.replaceWith(link);
  });
  q("[data-reflect]")?.replaceWith(Object.assign(document.createElement("div"), {
    className: "public-practice-preview",
    innerHTML: '<p>Signed-in learners can save private metacognition responses as part of a Reading Journey.</p><a class="btn btn-primary" href="reading-library.html">Sign in to practice →</a>'
  }));
}

qa("[data-check-answer]").forEach((button) => {
  button.onclick = () => {
    const activity = button.closest(".activity");
    const answer = q(".option.selected", activity);
    const feedback = q(".feedback", activity);
    if (!answer) {
      feedback.textContent = "Choose an answer first.";
      feedback.className = "feedback show try";
      return;
    }
    const isCorrect = answer.dataset.correct === "true";
    feedback.textContent = isCorrect ? "Great thinking!" : "Good try. Look for another clue.";
    feedback.className = `feedback show ${isCorrect ? "good" : "try"}`;
    progress(isCorrect ? 25 : 10);
  };
});

qa(".tab-btn").forEach((button) => {
  button.onclick = () => {
    const tabs = button.closest("[data-tabs]");
    qa(".tab-btn", tabs).forEach((item) => item.classList.remove("active"));
    qa(".tab-panel", tabs).forEach((item) => item.classList.remove("active"));
    button.classList.add("active");
    q(`#${button.dataset.tab}`, tabs).classList.add("active");
  };
});

qa("[draggable=true]").forEach((item) => {
  item.ondragstart = (event) => event.dataTransfer.setData("text", item.dataset.word);
});

qa(".dropzone").forEach((zone) => {
  zone.ondragover = (event) => event.preventDefault();
  zone.ondrop = (event) => {
    event.preventDefault();
    const word = event.dataTransfer.getData("text");
    if (word === zone.dataset.answer) {
      zone.textContent = `${word} ✓`;
      zone.classList.add("correct");
      progress(10);
    } else {
      toast("Try another match.");
    }
  };
});

qa("[data-print]").forEach((button) => (button.onclick = () => print()));
q("[data-reflect]")?.addEventListener("submit", (event) => {
  event.preventDefault();
  localStorage.setItem("reflection", q("textarea", event.target).value);
  toast("Metacognition response saved.");
});

if (currentPage === "vocabulary.html") {
  const wordLab = q(".word-game")?.closest(".activity");
  if (wordLab) {
    wordLab.closest(".section")?.classList.add("word-challenge-section");
    wordLab.innerHTML = `
      <h3>Build Your Own Word Detective Challenge</h3>
      <p class="lead" style="max-width:820px">
        Enter the 5 words your student does not recognize. In the other column,
        write a clear description for each word. Then let your student match every
        word to its correct description.
      </p>
      <a class="btn btn-primary" href="word-detective.html">Start →</a>
    `;
  }

  const contextLab = q("[data-check-answer]")?.closest(".activity");
  if (contextLab) {
    contextLab.closest(".section")?.classList.add("context-challenge-section");
    contextLab.innerHTML = `
      <h3>Build Your Own Context Clue Challenge</h3>
      <p class="lead" style="max-width:820px">
        Write a sentence and highlight the vocabulary word you want to practice.
        Then provide three answer choices and identify the correct meaning.
      </p>
      <a class="btn btn-primary" href="context-clue.html">Start →</a>
    `;
  }
}

if (currentPage === "reading.html") {
  const mainIdeaLab = q("#m");
  if (mainIdeaLab) {
    mainIdeaLab.innerHTML = `
      <h3>Build Your Own Main Idea Challenge</h3>
      <p class="lead" style="max-width:820px">
        Create three short reading passages. Add three possible main ideas for each
        passage and select the correct answer. Then share the activity with your students.
      </p>
      <a class="btn btn-primary" href="main-idea.html">Start &rarr;</a>
    `;
  }

  const inferenceLab = q("#i");
  if (inferenceLab) {
    inferenceLab.innerHTML = `
      <h3>Build Your Own Inference Challenge</h3>
      <p class="lead" style="max-width:820px">
        Create three short reading passages. Add three possible inferences for each
        passage and select the conclusion best supported by the text clues.
      </p>
      <a class="btn btn-primary" href="inference.html">Start &rarr;</a>
    `;
  }

  const textEvidenceLab = q("#e");
  if (textEvidenceLab) {
    textEvidenceLab.innerHTML = `
      <h3>Build Your Own Text Evidence Challenge</h3>
      <p class="lead" style="max-width:820px">
        Create three short reading passages. Add three possible text details for each
        passage and select the evidence that best supports the stated idea.
      </p>
      <a class="btn btn-primary" href="text-evidence.html">Start &rarr;</a>
    `;
  }
}

if (currentPage === "family.html") {
  const familyActivities = [
    { title: "Story Night", description: "Take turns reading, listening, or retelling in any language." },
    { title: "Family Interview", description: "Ask about a childhood memory, tradition, journey, or meaningful place." },
    { title: "Everyday Literacy", description: "Read a recipe, sign, message, direction, menu, or label together." },
    { title: "Tell a Family Story", description: "Choose a favorite family memory and tell it with a beginning, middle, and end." },
    { title: "Learn a New Word", description: "Find one useful word, explain its meaning, and use it in a new sentence." },
    { title: "Ask a “Why” Question", description: "Ask why something happened in a story and discuss possible answers together." }
  ];
  const activityCards = q(".section .cards");
  if (activityCards) {
    activityCards.classList.add("family-activity-cards");
    activityCards.innerHTML = familyActivities.map((activity, index) => `<article class="card family-activity-card" data-family-choice="${index}" role="button" tabindex="0" aria-label="Select ${activity.title}"><span class="family-card-number">${index + 1}</span><h3>${activity.title}</h3><p>${activity.description}</p></article>`).join("");
  }
  const bingo = qa(".activity").find(item => /Family Reading Bingo/i.test(item.textContent));
  if (bingo) {
    bingo.className = "family-wheel-experience";
    bingo.innerHTML = `<div class="family-wheel-copy"><span class="badge">Today’s family activity</span><h2>Spin the Family Learning Wheel</h2><p>Let the wheel choose one activity, or select any card above that feels right for your family today.</p><div id="familyWheelResult" class="family-wheel-result" role="status" aria-live="polite"><small>Your activity will appear here</small><strong>Ready to spin?</strong></div><button id="spinFamilyWheel" class="btn btn-primary" type="button">Spin the Wheel</button></div><div class="family-wheel-wrap"><span class="family-wheel-pointer" aria-hidden="true"></span><div id="familyWheel" class="family-wheel" aria-label="Six family literacy activities">${familyActivities.map((activity, index) => `<span class="family-wheel-label" style="--n:${index}">${index + 1}</span>`).join("")}<span class="family-wheel-center" aria-hidden="true">★</span></div><ol class="family-wheel-legend">${familyActivities.map((activity, index) => `<li><span>${index + 1}</span>${activity.title}</li>`).join("")}</ol></div>`;
    const wheel = q("#familyWheel"), result = q("#familyWheelResult"), spinButton = q("#spinFamilyWheel");
    let turns = 0;
    const selectActivity = (index, fromWheel = false) => {
      qa("[data-family-choice]").forEach(card => card.classList.toggle("selected", Number(card.dataset.familyChoice) === index));
      result.innerHTML = `<small>${fromWheel ? "The wheel chose" : "You chose"}</small><strong>${familyActivities[index].title}</strong><p>${familyActivities[index].description}</p>`;
    };
    qa("[data-family-choice]").forEach(card => {card.addEventListener("click", () => selectActivity(Number(card.dataset.familyChoice)));card.addEventListener("keydown", event => {if(event.key === "Enter" || event.key === " "){event.preventDefault();selectActivity(Number(card.dataset.familyChoice));}});});
    spinButton?.addEventListener("click", () => {
      spinButton.disabled = true;
      const selected = Math.floor(Math.random() * familyActivities.length);
      turns += 5 + Math.floor(Math.random() * 3);
      wheel.style.transform = `rotate(${turns * 360 + (360 - selected * 60 - 30)}deg)`;
      setTimeout(() => { selectActivity(selected, true); spinButton.disabled = false; spinButton.textContent = "Spin Again"; }, 1900);
    });
  }
}

if (currentPage === "index.html") {
  const primaryAction = q('.hero-copy .actions .btn-primary');
  if (primaryAction) { primaryAction.href = "reading-library.html"; primaryAction.textContent = "Choose Your Reading →"; }
  const homeTitle = q(".hero-copy h1");
  if (homeTitle && !q(".beyond-test", homeTitle.parentElement)) {
    const labelStyles = document.createElement("style");
    labelStyles.textContent = `
      .beyond-test {
        width: fit-content;
        display: flex;
        align-items: center;
        gap: 10px;
        margin: 4px 0 22px 8px;
        padding: 8px 18px 9px;
        background: var(--pink);
        color: #fff;
        font-family: "Baloo 2", sans-serif;
        font-size: clamp(1.15rem, 2vw, 1.55rem);
        font-weight: 800;
        line-height: 1;
        transform: rotate(-2deg);
        clip-path: polygon(5% 4%, 95% 0, 100% 86%, 7% 100%, 0 18%);
        box-shadow: 0 8px 0 rgba(239, 95, 145, .16);
      }
      .beyond-test-heart {
        font-family: Arial, sans-serif;
        font-size: 1.5em;
        line-height: .7;
      }
      @media (max-width: 900px) {
        .beyond-test { margin-inline: auto; }
      }
    `;
    document.head.append(labelStyles);

    const label = document.createElement("div");
    label.className = "beyond-test";
    label.innerHTML = '<span>Beyond the Test.</span><span class="beyond-test-heart" aria-hidden="true">♡</span>';
    homeTitle.insertAdjacentElement("afterend", label);
  }

  const homeLead = q(".hero-copy .lead");
  if (homeLead && !homeLead.querySelector(".lead-highlight")) {
    homeLead.innerHTML = homeLead.textContent
      .replace("fourth-grade", '<span class="lead-highlight" style="color:var(--pink)">fourth-grade</span>')
      .replace("English learner", '<span class="lead-highlight" style="color:var(--aqua)">English learner</span>');
  }

  const heroArt = q(".hero-art");
  const shareNote = q(".float-note.n3", heroArt);
  if (heroArt && shareNote && !q(".reader-quote-card", heroArt)) {
    const quoteStyles = document.createElement("style");
    quoteStyles.textContent = `
      .hero-art .n3 { bottom: 205px; right: 10px; }
      .reader-quote-card {
        position: absolute;
        right: 8px;
        bottom: 4px;
        z-index: 5;
        width: 178px;
        min-height: 190px;
        display: flex;
        flex-direction: column;
        justify-content: center;
        padding: 28px 20px 22px;
        background: #fff;
        color: var(--navy);
        font-family: "Baloo 2", sans-serif;
        font-size: 1rem;
        font-weight: 800;
        line-height: 1.45;
        transform: rotate(4deg);
        box-shadow: 0 18px 34px rgba(17, 36, 95, .18);
      }
      .reader-quote-card::before {
        content: "";
        position: absolute;
        top: -8px;
        left: 50%;
        width: 76px;
        height: 18px;
        background: rgba(239, 95, 145, .78);
        transform: translateX(-50%) rotate(-2deg);
      }
      .reader-quote-card span { display: block; }
      .reader-quote-card span + span { margin-top: 5px; }
      .reader-quote-heart {
        align-self: flex-end;
        margin-top: 9px;
        font-family: Arial, sans-serif;
        font-size: 2rem;
        line-height: .8;
      }
      @media (max-width: 620px) {
        .hero-art .n3 { bottom: 178px; }
        .reader-quote-card { right: 2px; width: 150px; min-height: 165px; padding: 24px 16px 18px; font-size: .86rem; }
      }
    `;
    document.head.append(quoteStyles);

    const quoteCard = document.createElement("div");
    quoteCard.className = "reader-quote-card";
    quoteCard.innerHTML = `
      <span>Every reader.</span>
      <span>Every day.</span>
      <span>Every step<br>forward.</span>
      <span class="reader-quote-heart" aria-hidden="true">♡</span>
    `;
    heroArt.append(quoteCard);
  }
}

if (currentPage === "about.html") {
  const aboutArt = q(".page-hero-art");
  const aboutKid = q('img[src="assets/images/about-kid.png"]', aboutArt);
  if (aboutArt && aboutKid && !q(".about-hero-blob", aboutArt)) {
    const aboutStyles = document.createElement("style");
    aboutStyles.textContent = `
      .page-hero-art.about-art-with-blob { position: relative; }
      .about-hero-blob {
        position: absolute;
        inset: 8px 20px;
        z-index: 0;
        background: var(--navy);
        border-radius: 45% 55% 49% 51% / 41% 42% 58% 59%;
        box-shadow: var(--shadow);
      }
      .about-art-with-blob > img {
        position: relative;
        z-index: 2;
      }
      @media (max-width: 620px) {
        .about-hero-blob { inset: 14px 5px; }
      }
    `;
    document.head.append(aboutStyles);
    aboutArt.classList.add("about-art-with-blob");
    const blob = document.createElement("div");
    blob.className = "about-hero-blob";
    blob.setAttribute("aria-hidden", "true");
    aboutArt.prepend(blob);
  }
}

const confidenceNote = q(".float-note.n1");
if (confidenceNote && !confidenceNote.querySelector("img")) {
  const icon = document.createElement("img");
  icon.src = "assets/icons/heart.svg";
  icon.alt = "";
  icon.width = 42;
  icon.height = 42;
  icon.style.cssText = "width:42px;height:42px;object-fit:contain;margin:0 auto 10px";
  confidenceNote.prepend(icon);
  confidenceNote.style.textAlign = "center";
}

const thinkNote = q(".float-note.n2");
if (thinkNote && !thinkNote.querySelector("img")) {
  const icon = document.createElement("img");
  icon.src = "assets/icons/lightbulb.svg";
  icon.alt = "";
  icon.width = 42;
  icon.height = 42;
  icon.style.cssText = "width:42px;height:42px;object-fit:contain;margin:0 auto 10px";
  thinkNote.prepend(icon);
  thinkNote.style.textAlign = "center";
}

const pageHero = q(".hero, .page-hero");
if (pageHero) {
  const starStyles = document.createElement("style");
  starStyles.textContent = `
    .hero-stars {
      position: absolute;
      inset: 0;
      z-index: 0;
      overflow: hidden;
      pointer-events: none;
    }
    .hero-stars + .container {
      position: relative;
      z-index: 1;
    }
    .hero-star {
      position: absolute;
      display: block;
      color: var(--star-color);
      font-size: var(--star-size);
      line-height: 1;
      opacity: .58;
      filter: drop-shadow(0 3px 5px rgba(17, 36, 95, .08));
      animation: star-float var(--star-speed) ease-in-out var(--star-delay) infinite alternate;
    }
    @keyframes star-float {
      from { transform: translate3d(0, 8px, 0) rotate(-10deg) scale(.85); opacity: .35; }
      to { transform: translate3d(14px, -18px, 0) rotate(18deg) scale(1.12); opacity: .82; }
    }
    @media (prefers-reduced-motion: reduce) {
      .hero-star { animation: none; }
    }
  `;
  document.head.append(starStyles);

  const starLayer = document.createElement("div");
  starLayer.className = "hero-stars";
  starLayer.setAttribute("aria-hidden", "true");

  const colors = ["#f7c94b", "#ef5f91", "#45c6bf", "#8f75d2", "#98c957"];
  const positions = [
    [5, 12], [14, 73], [23, 28], [31, 88], [40, 9], [48, 65],
    [57, 22], [65, 82], [73, 8], [81, 58], [89, 19], [95, 76],
    [9, 45], [27, 54], [52, 92], [68, 43], [85, 91], [96, 39]
  ];

  positions.forEach(([left, top], index) => {
    const star = document.createElement("span");
    star.className = "hero-star";
    star.textContent = index % 3 === 0 ? "✦" : "★";
    star.style.left = `${left}%`;
    star.style.top = `${top}%`;
    star.style.setProperty("--star-color", colors[index % colors.length]);
    star.style.setProperty("--star-size", `${14 + (index % 4) * 6}px`);
    star.style.setProperty("--star-speed", `${3.2 + (index % 5) * .7}s`);
    star.style.setProperty("--star-delay", `${-(index % 6) * .6}s`);
    starLayer.append(star);
  });

  pageHero.prepend(starLayer);
}

const siteFooter = q(".footer");
if (siteFooter) {
  siteFooter.classList.add("footer-enhanced");

  const footerGrid = q(".footer-grid", siteFooter);
  if (footerGrid) {
    footerGrid.innerHTML = `
      <div class="footer-about">
        <a class="footer-brand" href="index.html" aria-label="Interactive Literacy Hub home">
          <span class="footer-logo"><img src="assets/icons/logo.png" alt=""></span>
          <span><strong>Interactive</strong><small>Literacy Hub</small></span>
        </a>
        <p>A welcoming space where learners read, think, share ideas, and grow with confidence.</p>
        <span class="footer-purpose">Made for educators, learners, and families.</span>
      </div>
      <nav class="footer-links" aria-label="Explore">
        <h3>Explore</h3>
        <a href="about.html">About the Hub</a>
        <a href="reading.html">How It Works</a>
        <a href="family.html">For Families</a>
        <a href="privacy.html">Privacy</a>
      </nav>
      <nav class="footer-links" aria-label="Account access">
        <h3>Get Started</h3>
        <a href="login.html">Sign In</a>
        <a href="register.html">Create Educator Account</a>
      </nav>
    `;
  }

  const footerBottom = q(".footer-bottom", siteFooter);
  if (footerBottom) {
    footerBottom.innerHTML = `
      <span>Student-first, low-anxiety, culturally responsive literacy practice.</span>
      <span>&copy; ${new Date().getFullYear()} Interactive Literacy Hub</span>
    `;
  }
}
