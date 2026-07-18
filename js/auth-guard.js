(() => {
  "use strict";
  const root = document.documentElement;
  root.classList.add("auth-checking");

  async function guard() {
    if (!window.supabaseClient || !window.hubAuth) {
      window.location.replace("login.html?reason=configuration");
      return;
    }
    try {
      const { session, profile } = await window.hubAuth.getCurrentUserAndProfile();
      if (!session) return window.location.replace("login.html?reason=session");
      if (!profile) {
        await window.supabaseClient.auth.signOut();
        return window.location.replace("login.html?reason=profile");
      }
      const allowed = (document.body.dataset.allowedRoles || "student,teacher,admin").split(",").map(role => role.trim());
      if (!allowed.includes(profile.role)) {
        const destination = window.hubAuth.roleDestination(profile.role) || "login.html";
        return window.location.replace(destination);
      }
      window.hubCurrentUser = { session, user: session.user, profile };
      if (profile.role === "student") {
        let dashboardLink=document.querySelector('a.btn[href="student-dashboard.html"]:not(.brand), .dashboard-nav a[href="student-dashboard.html"]');
        if(dashboardLink){dashboardLink.textContent="My Dashboard";dashboardLink.classList.add("student-dashboard-menu-link");}
        else {
          let shell=document.querySelector(".dashboard-header .nav-shell");
          if(!shell){const header=document.createElement("header");header.className="dashboard-header student-quick-header";header.innerHTML='<div class="container nav-shell"><a class="brand" href="student-dashboard.html"><img src="assets/icons/logo.png" alt=""><span class="brand-copy"><strong>Interactive</strong><span>Literacy Hub</span></span></a></div>';document.body.insertBefore(header,document.body.firstChild);shell=header.querySelector(".nav-shell");}
          dashboardLink=document.createElement("a");dashboardLink.href="student-dashboard.html";dashboardLink.className="btn btn-secondary student-dashboard-menu-link";dashboardLink.textContent="My Dashboard";shell.append(dashboardLink);
        }
      }
      root.classList.remove("auth-checking");
      root.classList.add("auth-ready");
      document.dispatchEvent(new CustomEvent("hub:auth-ready", { detail: window.hubCurrentUser }));
      const recoveryKey = `hub-auth-retry:${window.location.pathname}`;
      window.setTimeout(() => {
        if (!document.querySelector("main[hidden]")) {
          sessionStorage.removeItem(recoveryKey);
          return;
        }
        if (sessionStorage.getItem(recoveryKey) !== "1") {
          sessionStorage.setItem(recoveryKey, "1");
          window.location.reload();
        }
      }, 7000);
    } catch (error) {
      console.error("Page protection error:", error);
      window.location.replace(`login.html?reason=${navigator.onLine ? "session" : "network"}`);
    }
  }

  window.supabaseClient?.auth.onAuthStateChange((event) => {
    if (event === "SIGNED_OUT") window.location.replace("login.html?reason=session");
  });
  guard();
})();
