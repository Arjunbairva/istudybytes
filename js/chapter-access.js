/* iStudyBytes premium chapter authorization */
(function () {
  var page = document.body;
  if (!page || page.dataset.premiumChapter !== "true") return;

  var courseSlug = page.dataset.course || "";
  var courseLabel = courseSlug === "class-9" ? "Class 9" : courseSlug === "class-10" ? "Class 10" : "this course";
  var courseUrl = courseSlug === "class-9" ? "product-class9.html" : courseSlug === "class-10" ? "product-class10.html" : "store.html";

  function ready() {
    page.classList.add("chapter-access-ready");
    window.dispatchEvent(new CustomEvent("chapter-access-granted"));
  }

  function showGate(title, message, primaryLabel, primaryHref, secondaryLabel, secondaryHref) {
    var main = document.querySelector("main");
    if (!main) {
      ready();
      return;
    }

    main.innerHTML =
      '<section class="card chapter-access-gate" aria-live="polite">' +
        '<span class="icon-tile"><i class="fa-solid fa-lock" aria-hidden="true"></i></span>' +
        '<span class="eyebrow">Premium chapter</span>' +
        '<h1>' + title + '</h1>' +
        '<p class="card__text">' + message + '</p>' +
        '<div class="chapter-access-actions">' +
          '<a class="btn btn-primary" href="' + primaryHref + '">' + primaryLabel + ' <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></a>' +
          (secondaryHref ? '<a class="btn btn-secondary" href="' + secondaryHref + '">' + secondaryLabel + '</a>' : '') +
        '</div>' +
        '<p class="card__meta">Chapter 1 remains free. Premium chapters require active course access.</p>' +
      '</section>';

    ready();
  }

  async function checkAccess() {
    try {
      if (typeof supabaseClient === "undefined") {
        showGate(
          "Access could not be verified",
          "Please refresh the page or return to the Store. Premium chapter access is only shown after your account is verified.",
          "Open Store",
          "store.html",
          "Go Home",
          "index.html"
        );
        return;
      }

      var userResult = await supabaseClient.auth.getUser();
      var user = userResult && userResult.data ? userResult.data.user : null;

      if (!user) {
        showGate(
          "Sign in to access this chapter",
          "This chapter is part of the " + courseLabel + " Complete Course. Sign in to check whether your account already has access.",
          "Sign In",
          "login.html",
          "View Course",
          courseUrl
        );
        return;
      }

      var courseResult = await supabaseClient
        .from("courses")
        .select("id")
        .eq("slug", courseSlug)
        .single();

      if (courseResult.error || !courseResult.data) {
        showGate(
          "Access could not be verified",
          "We could not verify the course associated with this chapter. Please return to the Store and try again.",
          "Open Store",
          "store.html",
          "Go Home",
          "index.html"
        );
        return;
      }

      var enrollmentResult = await supabaseClient
        .from("enrollments")
        .select("id")
        .eq("user_id", user.id)
        .eq("course_id", courseResult.data.id)
        .eq("status", "active")
        .limit(1);

      if (enrollmentResult.error) {
        console.error("Premium chapter enrollment check failed:", enrollmentResult.error);
        showGate(
          "Access could not be verified",
          "We could not verify your course access right now. Please try again in a moment.",
          "Try Again",
          "index.html",
          "Open Dashboard",
          "dashboard.html"
        );
        return;
      }

      if (!enrollmentResult.data || enrollmentResult.data.length === 0) {
        showGate(
          "This chapter is part of the Complete Course",
          "Your account does not have active access to the " + courseLabel + " Complete Course. Purchase the course to unlock premium chapters.",
          "View " + courseLabel + " Course",
          courseUrl,
          "Open Dashboard",
          "dashboard.html"
        );
        return;
      }

      ready();
    } catch (error) {
      console.error("Premium chapter authorization failed:", error);
      showGate(
        "Access could not be verified",
        "Please refresh the page. If the problem continues, contact iStudyBytes support.",
        "Try Again",
        "index.html",
        "Contact Support",
        "contact.html"
      );
    }
  }

  checkAccess();
})();