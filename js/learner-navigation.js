(() => {
  "use strict";
  document.addEventListener("click", event => {
    const learnerLink = event.target.closest(".learner-detail-link");
    if (!learnerLink) return;
    event.preventDefault();
    window.location.assign(learnerLink.href);
  });
})();
