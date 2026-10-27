// =========================
// BOTÃO "COMECE AGORA"
// =========================

function começar() {
    alert("Bem-vindo ao MenteBem!");
}


// =========================
// FAQ
// =========================

function toggleFAQ(button) {

    const item = button.parentElement;

    const todos = document.querySelectorAll(".faq-item");

    todos.forEach((faq) => {

        if (faq !== item) {
            faq.classList.remove("open");

            const icon = faq.querySelector("span");
            icon.textContent = "+";
        }

    });


    item.classList.toggle("open");

    const icon = button.querySelector("span");

    if (item.classList.contains("open")) {
        icon.textContent = "−";
    } else {
        icon.textContent = "+";
    }
}


// =========================
// HEADER
// =========================

const links = document.querySelectorAll(".nav a");

links.forEach(link => {

    link.addEventListener("click", () => {

        links.forEach(item => {
            item.classList.remove("active");
        });

        link.classList.add("active");

    });

});