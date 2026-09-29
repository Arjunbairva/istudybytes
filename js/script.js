/* iStudyBytes shared client-side behavior */

(function () {
  const faqQuestions = document.querySelectorAll(".faq-question");

  faqQuestions.forEach(function (question) {
    question.addEventListener("click", function () {
      const currentItem = question.closest(".faq-item, .home-faq-item");

      document.querySelectorAll(".faq-item, .home-faq-item").forEach(function (item) {
        if (item !== currentItem) {
          item.classList.remove("active");
        }
      });

      if (currentItem) {
        currentItem.classList.toggle("active");
      }
    });
  });
})();

/* Load the homepage course price for every visitor, including logged-out users. */
(function loadHomepageCoursePrice() {
  const priceElement = document.getElementById("home-course-price");

  if (!priceElement || typeof supabaseClient === "undefined") {
    return;
  }

  supabaseClient
    .from("courses")
    .select("price")
    .eq("slug", "class-9")
    .single()
    .then(function (result) {
      const data = result.data;
      const error = result.error;

      if (error || !data || data.price === null || data.price === undefined) {
        priceElement.textContent = "Price unavailable";
        console.error("Homepage course price could not be loaded:", error);
        return;
      }

      priceElement.textContent = "₹" + Number(data.price).toLocaleString("en-IN");
    })
    .catch(function (error) {
      priceElement.textContent = "Price unavailable";
      console.error("Homepage course price request failed:", error);
    });
})();
