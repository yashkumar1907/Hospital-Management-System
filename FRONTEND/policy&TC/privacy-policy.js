// ==============================
// DOM ELEMENTS
// ==============================

const menuBtn = document.querySelector(".menu-toggle");
const navbar = document.querySelector(".navbar");
const headerRight = document.querySelector(".header-right");
const navLinks = document.querySelectorAll(".navbar a");


// ==============================
// MOBILE MENU TOGGLE
// ==============================
if(menuBtn) {
    menuBtn.addEventListener("click", (e) => {

        e.stopPropagation();
    
        navbar.classList.toggle("active");
        headerRight.classList.toggle("active");
    
    });
}


// ==============================
// CLOSE MENU AFTER LINK CLICK
// ==============================
navLinks.forEach(link => {
    link.addEventListener("click", () => {
        navbar.classList.remove("active");
        headerRight.classList.remove("active");
    });
});


// ==============================
// CLOSE MENU WHEN CLICKING OUTSIDE
// ==============================
document.addEventListener("click", (e) => {
    if (!navbar.contains(e.target) && !menuBtn.contains(e.target) && !headerRight.contains(e.target)) {
        navbar.classList.remove("active");
        headerRight.classList.remove("active");
    }
});


// ==============================
// RESET MENU ON DESKTOP
// ==============================
window.addEventListener("resize", () => {
    if (window.innerWidth > 768) {
        navbar.classList.remove("active");
        headerRight.classList.remove("active");
    }
});