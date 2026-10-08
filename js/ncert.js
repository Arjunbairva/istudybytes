/* iStudyBytes — free NCERT Solutions.
   Class -> Subject -> Chapter -> Solution. Entirely independent of the premium
   course system: it never reads enrollments, course access or payment state. */
(function () {
  var view = document.getElementById("ncert-view");
  var landing = document.getElementById("ncert-landing");
  if (!view || !landing) return;

  var params = new URLSearchParams(location.search);
  var cls = params.get("class") || "";
  var subject = params.get("subject") || "";
  var chapterKey = params.get("chapter") || "";
  var catalogue = window.ISB_CHAPTERS || {};
  var list = catalogue[cls + "|" + subject] || [];

  var title = document.getElementById("ncert-title");
  var intro = document.getElementById("ncert-intro");

  var esc = function (v) {
    return String(v == null ? "" : v).replace(/[&<>'"]/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[c];
    });
  };
  var q = encodeURIComponent;
  var base = "ncert-solutions.html?class=" + q(cls) + "&subject=" + q(subject);
  var courseUrl = cls === "10" ? "product-class10.html" : "product-class9.html";

  function show(html) {
    landing.hidden = true;
    view.hidden = false;
    view.innerHTML = html;
  }

  /* ---- Chapter list --------------------------------------------------- */
  function chapterCard(item, index) {
    var n = index + 1;
    return '<a class="card card--row card--sm lesson" href="' + base + "&chapter=" + q(item[1]) + '">' +
      '<span class="lesson__num" aria-hidden="true">' + String(n).padStart(2, "0") + "</span>" +
      '<span class="lesson__body card__body"><strong>' + esc(item[0]) + "</strong><small>Chapter " + n + "</small></span>" +
      '<span class="card__arrow" aria-hidden="true">→</span></a>';
  }

  function showChapterList() {
    title.textContent = "Class " + cls + " " + subject + " NCERT Solutions";
    intro.textContent = "Select a chapter to read its free NCERT solutions.";
    document.title = "Class " + cls + " " + subject + " NCERT Solutions | iStudyBytes";
    var html = '<a class="link-arrow quiz-back" href="ncert-solutions.html"><span aria-hidden="true">←</span> All subjects</a>' +
      '<div class="section__head"><span class="eyebrow">Chapter selector</span><h2>Select a chapter</h2></div>';
    if (cls === "9" && subject === "Mathematics") {
      html += '<section class="quiz-part"><h3 class="quiz-part__title">Part 1 <span>Chapters 1–8</span></h3><div class="grid grid--2">' +
        list.slice(0, 8).map(chapterCard).join("") + "</div></section>" +
        '<section class="quiz-part"><h3 class="quiz-part__title">Part 2 <span>Chapters 9–14</span></h3><div class="grid grid--2">' +
        list.slice(8).map(function (item, i) { return chapterCard(item, i + 8); }).join("") + "</div></section>";
    } else {
      html += '<div class="grid grid--2">' + list.map(chapterCard).join("") + "</div>";
    }
    show(html);
  }

  /* ---- Chapter view --------------------------------------------------- */
  function solutionsHtml(rows) {
    if (!rows || !rows.length) {
      return '<div class="empty-state"><h3>Solutions are being added</h3>' +
        "<p>The NCERT solutions for this chapter are being prepared. Meanwhile, you can take the free chapter quiz.</p></div>";
    }
    var html = "", current = null;
    rows.forEach(function (row) {
      if (row.exercise !== current) {
        if (current !== null) html += "</div></section>";
        current = row.exercise;
        html += '<section class="quiz-part"><h3 class="quiz-part__title">' + esc(current) + '</h3><div class="grid grid--2">';
      }
      var label = row.question_number ? "Q" + esc(row.question_number) : "";
      html += '<article class="card">' + (label ? '<span class="eyebrow">' + label + "</span>" : "") +
        '<p class="card__text"><strong>Question.</strong> ' + esc(row.question) + "</p>" +
        String(row.solution).split(/\n+/).filter(Boolean).map(function (line, i) {
          return '<p class="card__text">' + (i === 0 ? "<strong>Solution.</strong> " : "") + esc(line) + "</p>";
        }).join("") + "</article>";
    });
    return html + "</div></section>";
  }

  function premiumCard(name, text, href, action) {
    return '<a class="card" href="' + href + '"><span class="badge">Premium</span>' +
      '<h3 class="card__title">' + name + '</h3><p class="card__text">' + text + "</p>" +
      '<span class="card__foot link-arrow">' + action + ' <span aria-hidden="true">→</span></span></a>';
  }

  function showChapter(item, index) {
    var n = index + 1;
    var quizUrl = "quiz.html?class=" + q(cls) + "&subject=" + q(subject) + "&chapter=" + q(item[1]);
    var isFreeGuide = item[3] === "free";
    title.textContent = item[0];
    intro.textContent = "Class " + cls + " " + subject + " · Chapter " + n;
    document.title = item[0] + " — Class " + cls + " " + subject + " NCERT Solutions | iStudyBytes";

    var notes = isFreeGuide
      ? '<a class="card" href="' + item[2] + '"><span class="badge badge--success">Free</span><h3 class="card__title">Chapter guide</h3>' +
        '<p class="card__text">A free guide to this chapter with key ideas and a study path.</p>' +
        '<span class="card__foot link-arrow">Open guide <span aria-hidden="true">→</span></span></a>'
      : premiumCard("Premium Notes", "Detailed chapter notes, key concepts and exam focus.", item[2], "Open chapter notes");

    show(
      '<a class="link-arrow quiz-back" href="' + base + '"><span aria-hidden="true">←</span> All chapters</a>' +
      '<section class="section" aria-labelledby="free-title">' +
        '<div class="section__head"><span class="eyebrow">Free for this chapter</span><h2 id="free-title">NCERT Solution and quiz</h2>' +
        "<p>No login and no purchase needed.</p></div>" +
        '<div class="grid grid--2">' +
          '<a class="card" href="#ncert-solution-list"><span class="badge badge--success">Free</span><h3 class="card__title">NCERT Solution</h3>' +
            '<p class="card__text">Step-by-step solutions for the textbook questions in this chapter.</p>' +
            '<span class="card__foot link-arrow">Read solutions <span aria-hidden="true">↓</span></span></a>' +
          '<a class="card" href="' + quizUrl + '"><span class="badge badge--success">Free</span><h3 class="card__title">Chapter quiz</h3>' +
            '<p class="card__text">Check your understanding with a free chapter quiz.</p>' +
            '<span class="card__foot link-arrow">Start quiz <span aria-hidden="true">→</span></span></a>' +
        "</div></section>" +
      '<section class="section" id="ncert-solution-list" aria-labelledby="solution-title">' +
        '<div class="section__head"><span class="eyebrow">NCERT Solution</span><h2 id="solution-title">Solutions for this chapter</h2></div>' +
        '<div id="ncert-solutions-body"><div class="empty-state">Loading solutions…</div></div></section>' +
      '<section class="section" aria-labelledby="premium-title">' +
        '<div class="section__head"><span class="eyebrow">Premium for this chapter</span><h2 id="premium-title">Go deeper with the course</h2>' +
        "<p>Optional paid resources. The free solutions and quiz above stay free.</p></div>" +
        '<div class="grid grid--2">' + notes +
          premiumCard("One-Shot Video", "A fast revision video covering the whole chapter.", courseUrl, "View course") +
          premiumCard("PPT", "Slide presentations that summarise the chapter.", courseUrl, "View course") +
          premiumCard("Premium Test", "Chapter tests with exam-style questions.", courseUrl, "View course") +
        "</div></section>"
    );
    loadSolutions(item[1]);
  }

  async function loadSolutions(key) {
    var holder = document.getElementById("ncert-solutions-body");
    var rows = [];
    try {
      if (typeof supabaseClient !== "undefined") {
        var request = supabaseClient.from("ncert_solutions").select("*")
          .eq("published", true).eq("class_level", cls).eq("subject", subject).eq("chapter", key)
          .order("display_order", { ascending: true }).limit(500);
        var r = await Promise.race([
          request,
          new Promise(function (resolve) { setTimeout(function () { resolve({ error: new Error("timeout"), data: null }); }, 5000); })
        ]);
        if (!r.error && Array.isArray(r.data)) rows = r.data;
      }
    } catch (e) {
      console.warn("NCERT solutions unavailable.", e);
    }
    holder.innerHTML = solutionsHtml(rows);
  }

  /* ---- Route ---------------------------------------------------------- */
  if (!list.length) return; // landing stays visible
  if (!chapterKey) { showChapterList(); return; }
  var index = list.findIndex(function (item) { return item[1] === chapterKey; });
  if (index < 0) { showChapterList(); return; }
  showChapter(list[index], index);
})();
