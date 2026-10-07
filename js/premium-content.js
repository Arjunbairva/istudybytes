/* iStudyBytes chapter progress tracking */
(function () {
  "use strict";
  var page = document.body;
  var target = document.getElementById("premium-content");
  if (!page || !target || page.dataset.premiumChapter !== "true") return;

  var loaded = false;

  function showError(title, message) {
    target.innerHTML =
      '<section class="chapter-section"><div class="chapter-section-head">' +
      '<span class="chapter-section-label">CHAPTER ACCESS</span><h1>' + title + '</h1><p>' + message + '</p>' +
      '</div></section>';
  }

  function appendProgressControl(courseId, subject, chapterNumber) {
    var section = document.createElement("section");
    section.className = "card chapter-progress";
    section.setAttribute("aria-label", "Chapter progress");
    section.innerHTML =
      '<div class="chapter-progress__top"><strong>Chapter progress</strong><span data-progress-percent>0%</span></div>' +
      '<div class="progress" aria-hidden="true"><span class="progress__bar" data-progress-fill></span></div>' +
      '<div class="chapter-progress__actions"><p class="chapter-progress__status" data-progress-status>Mark this chapter complete when you finish studying it.</p>' +
      '<button type="button" class="btn btn-primary chapter-progress__button" data-progress-button>Mark as complete</button></div>' +
      '<p class="chapter-progress__error" data-progress-error hidden></p>';
    target.appendChild(section);

    var button = section.querySelector("[data-progress-button]");
    var percent = section.querySelector("[data-progress-percent]");
    var fill = section.querySelector("[data-progress-fill]");
    var status = section.querySelector("[data-progress-status]");
    var error = section.querySelector("[data-progress-error]");

    function render(completed) {
      percent.textContent = completed ? "100%" : "0%";
      fill.style.width = completed ? "100%" : "0%";
      button.textContent = completed ? "Completed" : "Mark as complete";
      button.classList.toggle("is-complete", completed);
      status.textContent = completed ? "Chapter completed. You can revisit it anytime." : "Mark this chapter complete when you finish studying it.";
    }

    async function loadProgress() {
      var result = await supabaseClient.from("user_chapter_progress").select("completed")
        .eq("course_id", courseId).eq("subject", subject).eq("chapter_number", chapterNumber).maybeSingle();
      if (result.error) throw result.error;
      render(Boolean(result.data && result.data.completed));
    }

    button.addEventListener("click", async function () {
      error.hidden = true;
      button.disabled = true;
      try {
        var userResult = await supabaseClient.auth.getUser();
        if (!userResult.data.user) throw new Error("You are no longer signed in.");
        var nextCompleted = !button.classList.contains("is-complete");
        var now = new Date().toISOString();
        var result = await supabaseClient.from("user_chapter_progress").upsert({
          user_id: userResult.data.user.id,
          course_id: courseId,
          subject: subject,
          chapter_number: chapterNumber,
          completed: nextCompleted,
          completed_at: nextCompleted ? now : null,
          last_opened_at: now,
          updated_at: now
        }, { onConflict: "user_id,course_id,subject,chapter_number" });
        if (result.error) throw result.error;
        render(nextCompleted);
      } catch (err) {
        console.error("Chapter progress update failed:", err);
        error.textContent = "Progress could not be saved. Please try again.";
        error.hidden = false;
      } finally {
        button.disabled = false;
      }
    });

    loadProgress().catch(function (err) {
      console.error("Chapter progress load failed:", err);
      error.textContent = "Progress could not be loaded. You can still study the chapter.";
      error.hidden = false;
    });
  }

  async function loadContent() {
    if (loaded || !page.classList.contains("chapter-access-ready")) return;
    loaded = true;
    try {
      if (typeof supabaseClient === "undefined") throw new Error("Learning service is unavailable.");
      var courseSlug = page.dataset.course || "";
      var subject = page.dataset.subject || "";
      var chapterNumber = Number(page.dataset.chapter || 0);
      if (!courseSlug || !subject || !Number.isInteger(chapterNumber) || chapterNumber < 1) throw new Error("Invalid chapter configuration.");

      var result = await supabaseClient.functions.invoke("get-chapter-content", {
        body: { course_slug: courseSlug, subject: subject, chapter_number: chapterNumber }
      });
      if (result.error) throw result.error;
      var html = result.data && result.data.chapter && result.data.chapter.content_html;
      if (!html) throw new Error("Chapter content is not available.");

      var courseResult = await supabaseClient.from("courses").select("id").eq("slug", courseSlug).single();
      if (courseResult.error || !courseResult.data) throw new Error("Course could not be identified.");

      target.innerHTML = html;
      target.setAttribute("data-loaded", "true");
      appendProgressControl(courseResult.data.id, subject, chapterNumber);

      var userResult = await supabaseClient.auth.getUser();
      if (userResult.data.user) {
        var now = new Date().toISOString();
        var progressResult = await supabaseClient.from("user_chapter_progress").upsert({
          user_id: userResult.data.user.id,
          course_id: courseResult.data.id,
          subject: subject,
          chapter_number: chapterNumber,
          last_opened_at: now,
          updated_at: now
        }, { onConflict: "user_id,course_id,subject,chapter_number" });
        if (progressResult.error) console.error("Chapter open progress save failed:", progressResult.error);
      }
    } catch (error) {
      console.error("Premium chapter content load failed:", error);
      loaded = false;
      showError("Chapter content could not be loaded", "Please refresh the page and try again. If the problem continues, contact iStudyBytes support.");
    }
  }

  if (page.classList.contains("chapter-access-ready")) loadContent();
  else window.addEventListener("chapter-access-granted", loadContent, { once: true });
})();