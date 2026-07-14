const q = (selector, context = document) => context.querySelector(selector);
const qa = (selector, context = document) => [...context.querySelectorAll(selector)];

let favicon = q('link[rel="icon"]');
if (!favicon) {
  favicon = document.createElement("link");
  favicon.rel = "icon";
  favicon.type = "image/svg+xml";
  document.head.append(favicon);
}
favicon.href = "assets/icons/logo.svg";

const currentPage = location.pathname.split("/").pop() || "index.html";
qa(".main-nav a").forEach((link) => {
  if (link.dataset.page === currentPage) link.classList.add("active");
});

const menu = q(".menu-toggle");
const nav = q(".main-nav");
menu?.addEventListener("click", () => nav.classList.toggle("open"));

q("[data-open-teacher]")?.addEventListener("click", () => q("#teacherModal").classList.add("open"));
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
  toast("Reflection saved.");
});

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

const homeHero = q(".hero");
if (homeHero && currentPage === "index.html") {
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

  homeHero.prepend(starLayer);
}
