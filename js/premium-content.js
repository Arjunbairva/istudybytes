/* Loads premium chapter HTML only after chapter-access.js grants access. */
(function () {
  "use strict";

  var page = document.body;
  var target = document.getElementById("premium-content");
  if (!page || !target || page.dataset.premiumChapter !== "true") return;

  var loaded = false;

  function showError(title, message) {
    target.innerHTML =
      '<section class="chapter-section">' +
        '<div class="chapter-section-head">' +
          '<span class="chapter-section-label">CHAPTER ACCESS</span>' +
          '<h2>' + title + '</h2>' +
          '<p>' + message + '</p>' +
        '</div>' +
      '</section>';
  }

  async function loadContent() {
    if (loaded || !page.classList.contains("chapter-access-ready")) return;
    loaded = true;

    try {
      if (typeof supabaseClient === "undefined") {
        throw new Error("Learning service is unavailable.");
      }

      var courseSlug = page.dataset.course || "";
      var subject = page.dataset.subject || "";
      var chapterNumber = Number(page.dataset.chapter || 0);

      if (!courseSlug || !subject || !Number.isInteger(chapterNumber) || chapterNumber < 1) {
        throw new Error("Invalid chapter configuration.");
      }

      var result = await supabaseClient.functions.invoke("get-chapter-content", {
        body: {
          course_slug: courseSlug,
          subject: subject,
          chapter_number: chapterNumber
        }
      });

      if (result.error) {
        throw result.error;
      }

      var html = result.data && result.data.chapter && result.data.chapter.content_html;
      if (!html) {
        throw new Error("Chapter content is not available.");
      }

      target.innerHTML = html;
      target.setAttribute("data-loaded", "true");
    } catch (error) {
      console.error("Premium chapter content load failed:", error);
      loaded = false;
      showError(
        "Chapter content could not be loaded",
        "Please refresh the page and try again. If the problem continues, contact iStudyBytes support."
      );
    }
  }

  if (page.classList.contains("chapter-access-ready")) {
    loadContent();
  } else {
    window.addEventListener("chapter-access-granted", loadContent, { once: true });
  }
})();