/* iStudyBytes dashboard course progress */
(function () {
  "use strict";

  function addProgress(container, percent, completed, total) {
    var existing = container.querySelector(".dashboard-progress");
    if (existing) existing.remove();

    var box = document.createElement("div");
    box.className = "dashboard-progress" + (total ? "" : " dashboard-progress--empty");

    var safePercent = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));

    box.innerHTML =
      '<div class="dashboard-progress__row"><strong>Course progress</strong><span>' + safePercent + '%</span></div>' +
      '<div class="progress" role="progressbar" aria-label="Course progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + safePercent + '"><span class="progress__bar"></span></div>' +
      '<p class="card__meta">' +
      (total ? (completed + " of " + total + " chapters completed") : "No course chapters are available yet") +
      "</p>";

    var bar = box.querySelector(".progress__bar");
    if (bar) bar.style.width = safePercent + "%";
    container.appendChild(box);
  }

  function chapterKey(row) {
    return String(row.course_id) + "|" + row.subject + "|" + row.chapter_number;
  }

  function chapterLabel(row) {
    return row ? "Chapter " + row.chapter_number + " — " + row.chapter_name : "";
  }

  function subjectUrl(slug, subject) {
    if (slug === "class-9" && subject === "Science") return "class9-science.html";
    if (slug === "class-9" && subject === "Mathematics") return "class9-maths.html";
    if (slug === "class-10" && subject === "Science") return "class10-science.html";
    if (slug === "class-10" && subject === "Mathematics") return "class10-maths.html";
    return slug === "class-9" ? "course-class9.html" : slug === "class-10" ? "course-class10.html" : "store.html";
  }

  async function run() {
    if (typeof supabaseClient === "undefined") return;

    var sessionResult = await supabaseClient.auth.getSession();
    var user = sessionResult.data && sessionResult.data.session && sessionResult.data.session.user;
    if (!user) return;

    var enrollmentsResult = await supabaseClient
      .from("enrollments")
      .select("course_id,courses(id,slug)")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (enrollmentsResult.error || !enrollmentsResult.data || !enrollmentsResult.data.length) return;

    var enrollments = enrollmentsResult.data;
    var ids = enrollments.map(function (item) { return item.course_id; });

    var chapterResult = await supabaseClient
      .from("course_chapters")
      .select("course_id,subject,chapter_number,chapter_name")
      .in("course_id", ids)
      .order("course_id")
      .order("chapter_number");

    var progressResult = await supabaseClient
      .from("user_chapter_progress")
      .select("course_id,subject,chapter_number,completed")
      .eq("user_id", user.id)
      .in("course_id", ids);

    var courseProgressResult = await supabaseClient
      .from("user_progress")
      .select("course_id,progress_percent")
      .eq("user_id", user.id)
      .in("course_id", ids);

    if (chapterResult.error || progressResult.error || courseProgressResult.error) {
      console.error("Unable to load dashboard progress");
      return;
    }

    var chaptersByCourse = new Map();
    (chapterResult.data || []).forEach(function (row) {
      var key = String(row.course_id);
      if (!chaptersByCourse.has(key)) chaptersByCourse.set(key, []);
      chaptersByCourse.get(key).push(row);
    });

    var completedSet = new Set();
    (progressResult.data || []).forEach(function (row) {
      if (row.completed) completedSet.add(chapterKey(row));
    });

    var progressByCourse = new Map();
    (courseProgressResult.data || []).forEach(function (row) {
      progressByCourse.set(String(row.course_id), Number(row.progress_percent) || 0);
    });

    var cards = Array.from(document.querySelectorAll("#enrolled-courses .course-card"));

    enrollments.forEach(function (enrollment, index) {
      var card = cards[index];
      if (!card) return;

      var chapters = chaptersByCourse.get(String(enrollment.course_id)) || [];
      var completed = chapters.filter(function (row) {
        return completedSet.has(chapterKey(row));
      }).length;

      var percent = progressByCourse.has(String(enrollment.course_id))
        ? progressByCourse.get(String(enrollment.course_id))
        : (chapters.length ? completed / chapters.length * 100 : 0);

      addProgress(card, percent, completed, chapters.length);
    });

    var first = enrollments[0];
    var continueCard = document.getElementById("continue-card");
    if (!first || !continueCard) return;

    var firstCourseId = String(first.course_id);
    var firstChapters = chaptersByCourse.get(firstCourseId) || [];
    var firstCompleted = firstChapters.filter(function (row) {
      return completedSet.has(chapterKey(row));
    }).length;

    var firstPercent = progressByCourse.has(firstCourseId)
      ? progressByCourse.get(firstCourseId)
      : (firstChapters.length ? firstCompleted / firstChapters.length * 100 : 0);

    var currentChapter = firstChapters.find(function (row) {
      return !completedSet.has(chapterKey(row));
    }) || firstChapters[firstChapters.length - 1];

    var existingContinue = continueCard.querySelector(".continue-card");
    if (!existingContinue) return;

    addProgress(existingContinue, firstPercent, firstCompleted, firstChapters.length);

    var description = existingContinue.querySelector(".card__body p");
    var button = existingContinue.querySelector("a.btn");

    if (currentChapter && description) {
      description.textContent = firstCompleted >= firstChapters.length
        ? "Course completed. Review your chapters anytime."
        : "Continue with " + chapterLabel(currentChapter) + ".";
    }

    if (currentChapter && button) {
      var slug = first.courses && first.courses.slug;
      var url = subjectUrl(slug, currentChapter.subject);
      button.href = url;
      button.textContent = firstCompleted >= firstChapters.length ? "Review Course" : "Continue";
      var icon = document.createElement("i");
      icon.className = "fa-solid fa-arrow-right";
      icon.setAttribute("aria-hidden", "true");
      button.appendChild(document.createTextNode(" "));
      button.appendChild(icon);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();