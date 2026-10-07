(async function () {
  try {
    const { data: userData, error: userError } = await supabaseClient.auth.getUser();
    if (userError) {
      console.error("Homepage auth check failed:", userError);
    }

    const user = userData?.user || null;

    const { data: courses, error: courseError } = await supabaseClient
      .from("courses")
      .select("id,slug,price")
      .in("slug", ["class-9", "class-10"]);

    const courseMap = new Map();

    if (!courseError && Array.isArray(courses)) {
      courses.forEach(function (course) {
        courseMap.set(course.slug, course);

        const price = document.getElementById(
          course.slug === "class-9" ? "home-course-price-9" : "home-course-price-10"
        );

        if (price) {
          price.textContent = "₹" + Number(course.price).toLocaleString("en-IN");
        }
      });
    } else if (courseError) {
      console.error("Homepage course catalogue request failed:", courseError);
    }

    if (!user) return;

    const { data: enrollments, error: enrollmentError } = await supabaseClient
      .from("enrollments")
      .select("course_id,status")
      .eq("user_id", user.id)
      .eq("status", "active");

    if (enrollmentError) {
      console.error("Homepage enrollment check failed:", enrollmentError);
      return;
    }

    const enrolledSlugs = new Set(
      (enrollments || [])
        .map(function (row) {
          const course = [...courseMap.values()].find(function (item) {
            return String(item.id) === String(row.course_id);
          });
          return course?.slug || null;
        })
        .filter(Boolean)
    );

    ["class-9", "class-10"].forEach(function (slug) {
      if (!enrolledSlugs.has(slug)) return;

      const n = slug === "class-9" ? "9" : "10";
      const badge = document.getElementById("home-course-badge-" + n);
      const action = document.getElementById("home-course-action-" + n);
      const priceWrap = document.getElementById("home-course-price-" + n)?.parentElement;

      if (badge) badge.textContent = "CLASS " + n + " • ENROLLED";

      if (action) {
        action.href = slug === "class-9" ? "course-class9.html" : "course-class10.html";
        action.innerHTML = "Open Class " + n + ' <i class="fa-solid fa-arrow-right"></i>';
        action.classList.replace("btn-primary", "btn-dark");
      }

      if (priceWrap) {
        priceWrap.hidden = true;
      }
    });
  } catch (error) {
    console.error("Unable to load homepage course/auth state:", error);
  }
})();