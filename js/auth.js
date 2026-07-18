(() => {
  "use strict";

  const friendlyError = (error) => {
    console.error("Authentication error:", error);
    if (!navigator.onLine) return "You appear to be offline. Check your connection and try again.";
    const message = String(error?.message || "").toLowerCase();
    if (message.includes("invalid login")) return "That email or password does not match. Please try again.";
    if (message.includes("email not confirmed")) return "Check your email and confirm this account before signing in.";
    return "We could not sign you in right now. Please try again in a moment.";
  };

  async function getCurrentUserAndProfile() {
    const client = window.supabaseClient;
    if (!client) throw new Error("Supabase is not configured.");
    const { data: { session }, error: sessionError } = await client.auth.getSession();
    if (sessionError) throw sessionError;
    if (!session?.user) return { session: null, user: null, profile: null };
    const { data: profile, error } = await client.from("profiles").select("id, display_name, username, role, avatar, total_points, current_level").eq("id", session.user.id).maybeSingle();
    if (error) throw error;
    return { session, user: session.user, profile };
  }

  const roleDestination = (role) => role === "student" ? "student-dashboard.html" : ["teacher", "admin"].includes(role) ? "teacher-dashboard.html" : null;

  async function signOutAndRedirect() {
    try { await window.supabaseClient?.auth.signOut(); }
    catch (error) { console.error("Sign-out error:", error); }
    window.location.replace("login.html");
  }

  window.hubAuth = { getCurrentUserAndProfile, roleDestination, signOutAndRedirect, friendlyError };

  const form = document.querySelector("#loginForm");
  if (!form) return;
  const loginLead=document.querySelector(".auth-welcome .lead");if(loginLead)loginLead.textContent="Sign in to keep your practice, points, and Eagle Journey together.";
  const registrationLink = document.querySelector(".auth-switch");
  if (registrationLink) registrationLink.innerHTML = '<strong>New here?</strong> <a href="register.html"><strong>Create an educator account</strong></a>';
  const identifierInput = form.elements.email;
  const identifierLabel = document.querySelector('label[for="email"]');
  identifierInput.type = "text";
  identifierInput.autocomplete = "username";
  if (identifierLabel) identifierLabel.textContent = "Email or learner username";
  const status = document.querySelector("#loginStatus");
  const button = document.querySelector("#signInButton");
  const password = document.querySelector("#password");
  const passwordField=password.closest(".password-field");
  const recoveryButton=document.createElement("button");
  recoveryButton.id="forgotPasswordButton";recoveryButton.type="button";recoveryButton.className="forgot-password-link";recoveryButton.textContent="Forgot your educator password?";
  passwordField.after(recoveryButton);
  const recoveryPanel=document.createElement("div");recoveryPanel.id="passwordRecoveryPanel";recoveryPanel.className="password-recovery-panel";recoveryPanel.hidden=true;recoveryPanel.innerHTML='<label for="recoveryEmail">Educator email</label><input id="recoveryEmail" type="email" autocomplete="email" placeholder="teacher@example.com" required><div><button id="sendRecoveryButton" class="btn btn-primary" type="button">Send recovery email</button><button id="cancelRecoveryButton" class="btn btn-secondary" type="button">Cancel</button></div><p id="recoveryStatus" class="auth-message" role="status" aria-live="polite"></p>';
  recoveryButton.after(recoveryPanel);
  document.querySelector("#togglePassword")?.addEventListener("click", (event) => {
    const visible = password.type === "text";
    password.type = visible ? "password" : "text";
    event.currentTarget.textContent = visible ? "Show" : "Hide";
    event.currentTarget.setAttribute("aria-pressed", String(!visible));
  });
  recoveryButton.addEventListener("click",()=>{recoveryPanel.hidden=false;recoveryButton.hidden=true;const current=form.email.value.trim();if(current.includes("@"))document.querySelector("#recoveryEmail").value=current;document.querySelector("#recoveryEmail").focus();});
  document.querySelector("#cancelRecoveryButton").addEventListener("click",()=>{recoveryPanel.hidden=true;recoveryButton.hidden=false;});
  document.querySelector("#sendRecoveryButton").addEventListener("click",async event=>{const email=document.querySelector("#recoveryEmail").value.trim().toLowerCase(),recoveryStatus=document.querySelector("#recoveryStatus");if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){recoveryStatus.textContent="Enter the email used for your educator account.";recoveryStatus.className="auth-message error";return;}event.currentTarget.disabled=true;recoveryStatus.textContent="Sending recovery instructions…";recoveryStatus.className="auth-message loading";try{const redirectTo=new URL("reset-password.html",window.location.href).href;const {error}=await window.supabaseClient.auth.resetPasswordForEmail(email,{redirectTo});if(error)throw error;recoveryStatus.textContent="If an educator account uses that email, recovery instructions have been sent.";recoveryStatus.className="auth-message success";}catch(error){console.error("Password recovery error",error);recoveryStatus.textContent="We could not send the recovery email. Please wait a moment and try again.";recoveryStatus.className="auth-message error";event.currentTarget.disabled=false;}});

  if (!window.supabaseClient) {
    status.textContent = "This learning hub still needs its Supabase connection. Ask the site owner for help.";
    status.className = "auth-message error";
    button.disabled = true;
  } else {
    getCurrentUserAndProfile().then(({ profile }) => {
      const destination = roleDestination(profile?.role);
      if (destination) window.location.replace(destination);
    }).catch((error) => console.error("Session check error:", error));
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    status.textContent = "Signing you in…";
    status.className = "auth-message loading";
    button.disabled = true;
    button.setAttribute("aria-busy", "true");
    try {
      const identifier = form.email.value.trim().toLowerCase();
      const email = identifier.includes("@") ? identifier : `${identifier.replace(/[^a-z0-9]/g, "")}@learners.interactive-literacy-hub.invalid`;
      const { error } = await window.supabaseClient.auth.signInWithPassword({ email, password: password.value });
      if (error) throw error;
      const { error: syncError } = await window.supabaseClient.rpc("sync_my_public_profile");
      if (syncError && syncError.code !== "PGRST202") console.error("Profile sync error:", syncError);
      const { profile } = await getCurrentUserAndProfile();
      const destination = roleDestination(profile?.role);
      if (!destination) {
        await window.supabaseClient.auth.signOut();
        throw new Error("No valid profile exists for this account.");
      }
      status.textContent = "Welcome! Opening your dashboard…";
      status.className = "auth-message success";
      window.location.replace(destination);
    } catch (error) {
      status.textContent = String(error?.message || "").includes("valid profile")
        ? "This account needs a profile. Please ask your teacher or site administrator for help."
        : friendlyError(error);
      status.className = "auth-message error";
      button.disabled = false;
      button.removeAttribute("aria-busy");
    }
  });
})();
