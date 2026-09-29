(function () {
  "use strict";

  async function run() {
    if (typeof supabaseClient === "undefined") return;

    var sessionResult = await supabaseClient.auth.getSession();
    var user = sessionResult.data && sessionResult.data.session && sessionResult.data.session.user;
    if (!user) return;

    var section = document.getElementById("quiz-history");
    var list = document.getElementById("quiz-history-list");
    if (!section || !list) return;

    var result = await supabaseClient
      .from("quiz_attempts")
      .select("id,class_level,subject,chapter,question_count,score,completed_at")
      .eq("user_id", user.id)
      .order("completed_at", { ascending: false })
      .limit(5);

    if (result.error) {
      console.error("Unable to load quiz history:", result.error);
      list.replaceChildren();
      var error = document.createElement("div");
      error.className = "course-empty";
      error.textContent = "Unable to load quiz history. Please refresh and try again.";
      list.appendChild(error);
      return;
    }

    list.replaceChildren();

    if (!result.data || !result.data.length) {
      var empty = document.createElement("div");
      empty.className = "course-empty";
      var heading = document.createElement("h3");
      heading.textContent = "No completed quizzes yet";
      var copy = document.createElement("p");
      copy.textContent = "Complete a chapter quiz to build your learning history.";
      var link = document.createElement("a");
      link.className = "course-btn";
      link.href = "quiz.html";
      link.textContent = "Take a Quiz →";
      empty.append(heading, copy, link);
      list.appendChild(empty);
      return;
    }

    result.data.forEach(function (attempt) {
      var card = document.createElement("article");
      card.className = "course-card";

      var badge = document.createElement("span");
      badge.className = "course-badge";
      badge.textContent = "QUIZ COMPLETED";

      var title = document.createElement("h3");
      title.textContent = "Class " + attempt.class_level + " " + attempt.subject;

      var chapter = document.createElement("p");
      chapter.textContent = attempt.chapter;

      var score = document.createElement("strong");
      score.textContent = "Score: " + attempt.score + "/" + attempt.question_count;

      var date = document.createElement("p");
      date.textContent = new Date(attempt.completed_at).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit"
      });

      card.append(badge, title, chapter, score, date);
      list.appendChild(card);
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();