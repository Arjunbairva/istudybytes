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
    .select("price, launch_price, launch_offer_ends_at")
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

      const active = data.launch_price != null && data.launch_offer_ends_at && new Date() < new Date(data.launch_offer_ends_at);
      priceElement.innerHTML = active
        ? "₹" + Number(data.launch_price).toLocaleString("en-IN") + ' <span style="text-decoration:line-through;opacity:.5;font-size:.72em;margin-left:6px">₹' + Number(data.price).toLocaleString("en-IN") + '</span> <span style="color:#16a34a;font-size:.7em;margin-left:6px">50% OFF</span>'
        : "₹" + Number(data.price).toLocaleString("en-IN");
    })
    .catch(function (error) {
      priceElement.textContent = "Price unavailable";
      console.error("Homepage course price request failed:", error);
    });
})();
