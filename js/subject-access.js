/* iStudyBytes subject-page premium chapter links */
(function () {
  var courseSlug = document.body.dataset.course || "";
  var premiumCards = document.querySelectorAll('[data-access="premium"]');
  if (!courseSlug || !premiumCards.length || typeof supabaseClient === "undefined") return;

  async function updateLinks() {
    try {
      var userResult = await supabaseClient.auth.getUser();
      var user = userResult && userResult.data ? userResult.data.user : null;
      if (!user) return;

      var courseResult = await supabaseClient
        .from("courses")
        .select("id")
        .eq("slug", courseSlug)
        .single();

      if (courseResult.error || !courseResult.data) return;

      var enrollmentResult = await supabaseClient
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseResult.data.id)
        .eq("status", "active")
        .limit(1);

      if (enrollmentResult.error || !enrollmentResult.data || !enrollmentResult.data.length) return;

      premiumCards.forEach(function (card) {
        var link = card.querySelector("[data-premium-target]");
        if (!link) return;

        var target = link.getAttribute("data-premium-target");
        if (target) link.setAttribute("href", target);
        link.removeAttribute("data-premium-target");
        link.classList.replace("btn-secondary", "btn-primary");
        link.innerHTML = 'Open chapter <i class="fa-solid fa-arrow-right" aria-hidden="true"></i>';

        var badge = card.querySelector("[data-access-badge]");
        if (badge) {
          badge.textContent = "Unlocked";
          badge.classList.add("badge--success");
        }
      });
    } catch (error) {
      console.error("Subject-page premium access check failed:", error);
    }
  }

  updateLinks();
})();