
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".nav-links");
  if (toggle && menu) {
    toggle.addEventListener("click", () => menu.classList.toggle("open"));
    menu.querySelectorAll("a").forEach(a => a.addEventListener("click", () => menu.classList.remove("open")));
  }
});
