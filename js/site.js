/* iStudyBytes — shared shell behaviour (header menu, account menu, auth state).
   Loaded with `defer` on every page by tools/sync-shell.py. */
(function () {
  "use strict";

  var root = document.documentElement;
  var toggle = document.getElementById("site-menu-toggle");
  var nav = document.getElementById("site-nav");
  var userBtn = document.getElementById("userButton");
  var userMenu = document.getElementById("userMenu");
  var logout = document.getElementById("logout-btn");

  /* ---- Mobile navigation ---- */
  function setNav(open) {
    if (!toggle || !nav) return;
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }
  if (toggle && nav) {
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      setNav(!nav.classList.contains("is-open"));
    });
    nav.addEventListener("click", function (e) {
      if (e.target.closest("a") && !e.target.closest(".site-user__menu")) setNav(false);
    });
  }

  /* ---- Account menu ---- */
  function setMenu(open) {
    if (!userBtn || !userMenu) return;
    userMenu.classList.toggle("show", open);
    userBtn.setAttribute("aria-expanded", String(open));
  }
  if (userBtn && userMenu) {
    userBtn.addEventListener("click", function (e) {
      e.stopPropagation();
      setMenu(!userMenu.classList.contains("show"));
    });
  }
  document.addEventListener("click", function (e) {
    setMenu(false);
    if (nav && toggle && !e.target.closest("#site-header")) setNav(false);
  });
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { setMenu(false); setNav(false); }
  });
  window.addEventListener("resize", function () {
    if (window.innerWidth > 900) setNav(false);
  });

  /* ---- Auth state ----
     The inline script in the header sets .has-session when a Supabase token is
     in localStorage (so signed-in visitors never see a "Log in" flash). Here we
     confirm the session is real and fill in the name. Signed-out visitors
     (no token) make no network request at all. */
  if (!root.classList.contains("has-session")) return;

  function loadScript(src) {
    return new Promise(function (resolve, reject) {
      var s = document.createElement("script");
      s.src = src; s.onload = resolve; s.onerror = reject;
      document.head.appendChild(s);
    });
  }

  async function getClient() {
    if (typeof supabaseClient !== "undefined") return supabaseClient;
    if (!window.supabase) await loadScript("https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2");
    await loadScript("js/supabase-config.js");
    return typeof supabaseClient !== "undefined" ? supabaseClient : null;
  }

  (async function () {
    try {
      var client = await getClient();
      if (!client) return;
      var res = await client.auth.getSession();
      var session = res && res.data && res.data.session;
      if (!session) { root.classList.remove("has-session"); return; }

      var u = session.user || {};
      var meta = u.user_metadata || {};
      var name = meta.full_name || meta.name || (u.email ? u.email.split("@")[0] : "") || "Account";
      var label = document.getElementById("site-user-name");
      if (label) label.textContent = name;

      if (logout) {
        logout.addEventListener("click", async function (e) {
          e.preventDefault();
          try { await client.auth.signOut(); } catch (err) { console.error(err); }
          window.location.href = "login.html";
        });
      }
    } catch (err) {
      console.error("Site shell auth check failed:", err);
    }
  })();
})();
