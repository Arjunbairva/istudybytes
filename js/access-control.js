/* iStudyBytes premium access control */
(function () {
  var root = document.documentElement;
  var body = document.body;
  var isPremiumPage = body && body.dataset && body.dataset.premiumChapter === "true";
  var courseSlug = body && body.dataset ? body.dataset.courseSlug : "";
  var subjectPage = body && body.dataset ? body.dataset.subjectPage : "";

  function hidePremiumPage() {
    root.classList.add("premium-access-checking");
  }

  function showPremiumPage() {
    root.classList.remove("premium-access-checking");
    root.classList.add("premium-access-granted");
  }

  function redirectToSubject() {
    if (subjectPage) {
      window.location.replace(subjectPage + "?locked=1");
    } else {
      window.location.replace("store.html");
    }
  }

  async function hasCourseAccess(userId) {
    var courseResult = await supabaseClient
      .from("courses")
      .select("id")
      .eq("slug", courseSlug)
      .maybeSingle();

    if (courseResult.error || !courseResult.data) {
      console.error("Unable to identify course for access check:", courseResult.error);
      return false;
    }

    var enrollmentResult = await supabaseClient
      .from("enrollments")
      .select("id")
      .eq("user_id", userId)
      .eq("course_id", courseResult.data.id)
      .eq("status", "active")
      .limit(1);

    if (enrollmentResult.error) {
      console.error("Unable to verify course access:", enrollmentResult.error);
      return false;
    }

    return Array.isArray(enrollmentResult.data) && enrollmentResult.data.length > 0;
  }

  async function updateSubjectLinks() {
    if (!courseSlug) return;

    var links = document.querySelectorAll(".premium-chapter-link[data-premium-target]");
    if (!links.length) return;

    var userResult = await supabaseClient.auth.getUser();
    var user = userResult.data && userResult.data.user;

    if (!user) {
      links.forEach(function (link) {
        link.textContent = "Unlock Course →";
        link.href = courseSlug === "class-9" ? "product-class9.html" : "product-class10.html";
      });
      return;
    }

    var access = await hasCourseAccess(user.id);

    links.forEach(function (link) {
      if (access) {
        link.textContent = "Open Chapter →";
        link.href = link.dataset.premiumTarget;
      } else {
        link.textContent = "Unlock Course →";
        link.href = courseSlug === "class-9" ? "product-class9.html" : "product-class10.html";
      }
    });
  }

  async function protectPremiumPage() {
    hidePremiumPage();

    var userResult = await supabaseClient.auth.getUser();
    var user = userResult.data && userResult.data.user;

    if (!user) {
      redirectToSubject();
      return;
    }

    var access = await hasCourseAccess(user.id);

    if (!access) {
      redirectToSubject();
      return;
    }

    showPremiumPage();
  }

  if (isPremiumPage) {
    protectPremiumPage();
  } else {
    updateSubjectLinks();
  }
})();