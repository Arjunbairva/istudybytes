/* iStudyBytes dashboard course progress */
(function () {
  "use strict";

  function addProgress(container, percent, completed, total, label) {
    var box = document.createElement("div");
    box.className = "dashboard-progress" + (total ? "" : " dashboard-progress--empty");
    var safePercent = Math.max(0, Math.min(100, Math.round(percent)));
    box.innerHTML =
      '<div class="dashboard-progress__row"><strong>Course progress</strong><span>' + safePercent + '%</span></div>' +
      '<div class="progress" role="progressbar" aria-label="Course progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="' + safePercent + '"><span class="progress__bar"></span></div>' +
      '<p class="card__meta">' + (total ? (completed + ' of ' + total + ' chapters completed') : 'No published chapter content is available yet') + '</p>';
    box.querySelector(".progress__bar").style.width = safePercent + "%";
    container.appendChild(box);
  }

  async function run() {
    if (typeof supabaseClient === "undefined") return;
    var sessionResult = await supabaseClient.auth.getSession();
    var user = sessionResult.data && sessionResult.data.session && sessionResult.data.session.user;
    if (!user) return;

    var enrollmentsResult = await supabaseClient.from("enrollments").select("course_id,courses(id,slug)").eq("user_id", user.id).eq("status", "active");
    if (enrollmentsResult.error || !enrollmentsResult.data || !enrollmentsResult.data.length) return;

    var ids = enrollmentsResult.data.map(function (item) { return item.course_id; });
    var contentResult = await supabaseClient.from("chapter_content").select("course_id,subject,chapter_number").in("course_id", ids);
    var progressResult = await supabaseClient.from("user_chapter_progress").select("course_id,subject,chapter_number,completed").eq("user_id", user.id).in("course_id", ids);
    if (contentResult.error || progressResult.error) return;

    var contentByCourse = new Map();
    (contentResult.data || []).forEach(function (row) {
      var key = String(row.course_id);
      if (!contentByCourse.has(key)) contentByCourse.set(key, []);
      contentByCourse.get(key).push(row);
    });
    var progressSet = new Set();
    (progressResult.data || []).forEach(function (row) {
      if (row.completed) progressSet.add(String(row.course_id) + "|" + row.subject + "|" + row.chapter_number);
    });

    var cards = Array.from(document.querySelectorAll("#enrolled-courses .course-card"));
    enrollmentsResult.data.forEach(function (enrollment, index) {
      var card = cards[index];
      if (!card) return;
      var content = contentByCourse.get(String(enrollment.course_id)) || [];
      var completed = content.filter(function (row) {
        return progressSet.has(String(row.course_id) + "|" + row.subject + "|" + row.chapter_number);
      }).length;
      addProgress(card, content.length ? completed / content.length * 100 : 0, completed, content.length, enrollment.courses && enrollment.courses.name);
    });

    var first = enrollmentsResult.data[0];
    var continueCard = document.querySelector("#continue-card .continue-card");
    if (first && continueCard) {
      var content = contentByCourse.get(String(first.course_id)) || [];
      var completed = content.filter(function (row) {
        return progressSet.has(String(row.course_id) + "|" + row.subject + "|" + row.chapter_number);
      }).length;
      var box = document.createElement("div");
      addProgress(box, content.length ? completed / content.length * 100 : 0, completed, content.length, first.courses && first.courses.name);
      continueCard.appendChild(box.firstElementChild);
    }
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", run, { once: true });
  else run();
})();