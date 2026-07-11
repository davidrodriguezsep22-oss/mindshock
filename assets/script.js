const toggle=document.querySelector('.menu-toggle');const menu=document.querySelector('#menu');
if(toggle&&menu){toggle.addEventListener('click',()=>{const open=menu.classList.toggle('open');toggle.setAttribute('aria-expanded',String(open));});menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{menu.classList.remove('open');toggle.setAttribute('aria-expanded','false');}));}
document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{const id=a.getAttribute('href');if(id==='#')return;const el=document.querySelector(id);if(el){e.preventDefault();el.scrollIntoView({behavior:'smooth',block:'start'});}}));

document.addEventListener("DOMContentLoaded", () => {
  const leadForm = document.getElementById("leadForm");
  if (!leadForm) return;

  leadForm.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = document.getElementById("leadName").value.trim();
    const country = document.getElementById("leadCountry").value;
    const service = document.getElementById("leadService").value;
    const role = document.getElementById("leadRole").value.trim();

    const message = [
      `Hola MindShock, mi nombre es ${name}.`,
      `Busco empleo en: ${country}.`,
      `Me interesa: ${service}.`,
      role ? `Mi cargo o área objetivo es: ${role}.` : "",
      "Quiero conocer el alcance, precio y tiempo de entrega."
    ].filter(Boolean).join("\n");

    window.open(`https://wa.me/573022805656?text=${encodeURIComponent(message)}`, "_blank", "noopener");
  });
});
