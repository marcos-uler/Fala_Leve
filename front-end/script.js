const signupSection = document.querySelector(".signup");

if (signupSection && "IntersectionObserver" in window) {
    const signupObserver = new IntersectionObserver((entries, observer) => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                signupSection.classList.add("is-visible");
                observer.unobserve(signupSection);
            }
        }
    }, { threshold: 0.18 });

    signupObserver.observe(signupSection);
} else if (signupSection) {
    signupSection.classList.add("is-visible");
}
const heroMessage = document.querySelector(".hero-content p");

if (heroMessage) {
    const message = heroMessage.textContent.replace(/\s+/g, " ").trim();
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    heroMessage.setAttribute("aria-label", message);

    if (reducedMotion) {
        heroMessage.textContent = message;
    } else {
        heroMessage.replaceChildren();
        heroMessage.classList.add("message-reveal-ready");

        const characters = Array.from(message);
        const reveal = document.createElement("span");
        reveal.className = "message-reveal";
        reveal.setAttribute("aria-hidden", "true");

        characters.forEach((character, index) => {
            const letter = document.createElement("span");
            letter.className = "message-letter";
            letter.textContent = character === " " ? "\u00a0" : character;
            letter.style.animationDelay = `${(index / Math.max(characters.length - 1, 1)) * 4}s`;
            reveal.append(letter);
        });

        heroMessage.append(reveal);
    }
}

const signupCards = document.querySelectorAll(".signup-card");

signupCards.forEach((card, index) => {
    const theme = ["theme-red", "theme-green", "theme-blue"][index];
    if (!theme) return;

    const themes = ["theme-red", "theme-green", "theme-blue"];
    const applyTheme = () => {
        document.body.classList.remove(...themes);
        document.body.classList.add(theme);
    };
    const clearTheme = () => document.body.classList.remove(...themes);

    card.addEventListener("pointerenter", applyTheme);
    card.addEventListener("pointerleave", clearTheme);
    card.addEventListener("focus", applyTheme);
    card.addEventListener("blur", clearTheme);
});
