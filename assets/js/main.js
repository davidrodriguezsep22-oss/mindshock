
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".menu-toggle");
  const menu = document.querySelector(".nav-links");

  if (toggle && menu) {
    toggle.addEventListener("click", () => {
      const open = menu.classList.toggle("open");
      toggle.setAttribute("aria-expanded", String(open));
    });

    menu.querySelectorAll("a").forEach(link => {
      link.addEventListener("click", () => {
        menu.classList.remove("open");
        toggle.setAttribute("aria-expanded", "false");
      });
    });
  }

  const form = document.getElementById("profileForm");
  if (!form) return;

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const experience = Number(document.getElementById("experience").value);
    const updated = Number(document.getElementById("updated").value);
    const linkedin = Number(document.getElementById("linkedin").value);
    const target = Number(document.getElementById("target").value);

    const raw = experience * 8 + updated * 12 + linkedin * 12 + target * 10;
    const score = Math.min(100, 34 + raw);

    let title = "";
    let text = "";
    const tips = [];

    if (score < 55) {
      title = "Tu perfil necesita una actualización prioritaria";
      text = "Tienes una oportunidad clara de mejorar estructura, enfoque y presencia digital.";
    } else if (score < 75) {
      title = "Tienes una base útil, pero falta enfoque";
      text = "Tu perfil puede volverse más competitivo al definir mejor el cargo objetivo y fortalecer LinkedIn.";
    } else if (score < 90) {
      title = "Tu perfil está bien encaminado";
      text = "La prioridad es pulir palabras clave, logros y coherencia entre hoja de vida y LinkedIn.";
    } else {
      title = "Tu perfil está muy bien preparado";
      text = "Conviene revisar detalles finales y adaptar cada postulación al cargo específico.";
    }

    if (updated < 2) tips.push("Actualizar fechas, funciones y formación en tu hoja de vida.");
    if (linkedin < 2) tips.push("Completar titular, Acerca de, experiencia y aptitudes en LinkedIn.");
    if (target < 2) tips.push("Definir uno o dos cargos objetivo para orientar el perfil.");
    if (experience <= 1) tips.push("Resaltar proyectos, prácticas, formación y resultados concretos.");
    if (!tips.length) tips.push("Adaptar palabras clave y logros a cada vacante.");

    document.getElementById("resultEmpty").classList.add("hidden");
    document.getElementById("resultContent").classList.remove("hidden");
    document.getElementById("resultScore").textContent = score + "/100";
    document.getElementById("resultTitle").textContent = title;
    document.getElementById("resultText").textContent = text;

    const tipsList = document.getElementById("resultTips");
    tipsList.innerHTML = "";
    tips.forEach(tip => {
      const li = document.createElement("li");
      li.textContent = tip;
      tipsList.appendChild(li);
    });

    const message = encodeURIComponent(
      `Hola, hice la revisión rápida de MindShock y obtuve ${score}/100. Quiero una revisión personalizada de mi perfil profesional.`
    );
    document.getElementById("resultWhatsapp").href = `https://wa.me/573022805656?text=${message}`;
  });
});
