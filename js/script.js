const faqQuestions = document.querySelectorAll(".faq-question");

faqQuestions.forEach(function(question){

    question.addEventListener("click", function(){

        const currentItem = question.parentElement;

        document.querySelectorAll(".faq-item").forEach(function(item){

            if(item !== currentItem){
                item.classList.remove("active");
            }

        });

        currentItem.classList.toggle("active");

    });

});