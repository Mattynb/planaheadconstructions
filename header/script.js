// make link of current page active
const current = location.pathname;

const links = document.querySelectorAll(".nav-links a");

links.forEach(link => {
    const href = link.getAttribute("href");
    
    if (current === "/planaheadconstructions" && href === "/") {
        link.classList.add("active");
    }
    else if (href !== "/planaheadconstructions" && current.includes(href)) {
        link.classList.add("active");
    }
});

const hamburger = document.querySelector(".hamburger");
const navLinks = document.querySelector(".nav-links");

hamburger.addEventListener("click", () => {
    hamburger.classList.toggle("active");
    navLinks.classList.toggle("active");
});

// Close mobile menu when clicking a link
document.querySelectorAll(".nav-links a").forEach(link => {
    link.addEventListener("click", () => {
        hamburger.classList.remove("active");
        navLinks.classList.remove("active");
    });
});
