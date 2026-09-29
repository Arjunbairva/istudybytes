/* iStudyBytes dashboard course progress */
(function () {
  "use strict";

  var style = document.createElement("style");
  style.textContent = ".dashboard-progress{margin-top:1rem;padding:1rem;border:1px solid rgba(37,99,235,.14);border-radius:14px;background:rgba(37,99,235,.035)}.dashboard-progress__row{display:flex;align-items:center;justify-content:space-between;gap:1rem}.dashboard-progress__bar{height:7px;margin:.65rem 0 0;overflow:hidden;border-radius:999px;background:rgba(15,23,42,.1)}.dashboard-progress__fill{height:100%;width:0;border-radius:inherit;background:#2563eb;transition:width 180ms ease}.dashboard-progress__meta{margin:.55rem 0 0;opacity:.72}.dashboard-progress__continue{display:inline-flex;margin-top:.75rem}.dashboard-progress--empty{opacity:.8}";
  document.head.appendChild(style);

  function addProgress(container, percent, completed, total, label) {
    var box = document.createElement("div");
    box.className = "dashboard-progress" + (total ? "" : " dashboard-progress--empty");
    var safePercent = Math.max(0, Math.min(100, Math.round(percent)));
    box.innerHTML =
      '<div class="dashboard-progress__row"><strong>Course progress</strong><span>' + safePercent + '%</span></div>' +
      '<div class="dashboard-progress__bar" aria-hidden="true"><div class="dashboard-progress__fill" style="width:' + safePercent + '%"></div></div>' +
      '<p class="dashboard-progress__meta">' + (total ? (completed + ' of ' + total + ' chapters completed') : 'No published chapter content is available yet') + '</p>';
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