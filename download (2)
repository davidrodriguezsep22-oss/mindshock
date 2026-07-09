document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".navlinks");

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      menu.classList.toggle("open");
    });

    menu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => menu.classList.remove("open"));
    });
  }
});
