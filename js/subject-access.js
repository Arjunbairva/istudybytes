/* iStudyBytes subject-page premium chapter links */
(function () {
  var page = document.querySelector(".subject-page");
  if (!page) return;

  var courseSlug = page.dataset.course || "";
  var premiumLinks = document.querySelectorAll(".chapter-access.premium");
  if (!premiumLinks.length || typeof supabaseClient === "undefined") return;

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

      premiumLinks.forEach(function (badge) {
        var card = badge.closest(".chapter");
        if (!card) return;

        var link = card.querySelector(".chapter-link");
        if (!link) return;

        var target = link.getAttribute("data-premium-target");
        if (target) link.setAttribute("href", target);
        link.removeAttribute("data-premium-target");
        link.classList.add("chapter-link-unlocked");
        link.innerHTML = 'Open Chapter <i class="fa-solid fa-arrow-right"></i>';
      });
    } catch (error) {
      console.error("Subject-page premium access check failed:", error);
    }
  }

  updateLinks();
})();