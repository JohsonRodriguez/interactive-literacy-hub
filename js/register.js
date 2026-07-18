(() => {
  "use strict";
  const form = document.querySelector("#registerForm");
  if (!form) return;
  const status = document.querySelector("#registerStatus");
  const submit = document.querySelector("#createAccountButton");
  const password = document.querySelector("#registerPassword");
  document.querySelector("#toggleRegisterPassword")?.addEventListener("click", event => {
    const visible = password.type === "text";
    password.type = visible ? "password" : "text";
    event.currentTarget.textContent = visible ? "Show" : "Hide";
    event.currentTarget.setAttribute("aria-pressed", String(!visible));
  });
  if (!window.supabaseClient) { status.textContent = "Registration is not configured yet."; status.className = "auth-message error"; submit.disabled = true; }

  form.addEventListener("submit", async event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    status.textContent = "Creating your educator account…"; status.className = "auth-message loading"; submit.disabled = true;
    try {
      const metadata = { display_name: form.elements.displayName.value.trim(), role: "teacher", registration_source: "public_educator", educator_type: form.elements.educatorType.value, avatar: "book" };
      const { data, error } = await window.supabaseClient.auth.signUp({ email: form.elements.email.value.trim(), password: password.value, options: { data: metadata } });
      if (error) throw error;
      if (!data.session) { status.textContent = "Account created. Check your email to confirm it, then sign in."; status.className = "auth-message success"; form.reset(); return; }
      const { error: syncError } = await window.supabaseClient.rpc("sync_my_public_profile");
      if (syncError) throw syncError;
      status.textContent = "Educator account created! Opening your dashboard…"; status.className = "auth-message success";
      window.location.replace("teacher-dashboard.html");
    } catch (error) {
      console.error("Educator registration error:", error);
      const message = String(error?.message || "").toLowerCase();
      status.textContent = message.includes("already registered") ? "An account already uses that email. Try signing in instead." : "We could not create the educator account. Check the information and try again.";
      status.className = "auth-message error";
    } finally { submit.disabled = false; }
  });
})();
