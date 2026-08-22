(() => {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const salesEmail = 'davidrodriguezsep22@gmail.com';
  const oldSalesEmail = 'ventas@mindshock.app';

  document.querySelectorAll(`a[href^="mailto:${oldSalesEmail}"]`).forEach((anchor) => {
    anchor.href = anchor.href.replace(oldSalesEmail, salesEmail);
    if ((anchor.textContent || '').trim() === oldSalesEmail) anchor.textContent = salesEmail;
  });
  document.querySelectorAll('script[type="application/ld+json"]').forEach((script) => {
    if (script.textContent?.includes(oldSalesEmail)) script.textContent = script.textContent.replaceAll(oldSalesEmail, salesEmail);
  });

  const style = document.createElement('style');
  style.textContent = `
    .ms-trust-section{padding:76px 0;background:#f4f1e9;color:#11151c}
    .ms-trust-shell{width:min(1160px,calc(100% - 44px));margin:auto}
    .ms-trust-kicker{margin:0 0 12px;color:#667800;font:900 11px Consolas,monospace;text-transform:uppercase;letter-spacing:.12em}
    .ms-trust-title{max-width:860px;margin:0;font-size:clamp(36px,5vw,58px);line-height:1;letter-spacing:-.05em}
    .ms-trust-intro{max-width:780px;margin:18px 0 0;color:#657080;font-size:16px;line-height:1.65}
    .ms-trust-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:30px}
    .ms-trust-card{padding:22px;border:1px solid #d4cfc3;border-radius:15px;background:#fff}
    .ms-trust-card strong{display:block;margin-bottom:7px;font-size:17px}
    .ms-trust-card p{margin:0;color:#657080;font-size:13px;line-height:1.6}
    .ms-flow{display:grid;grid-template-columns:repeat(5,1fr);gap:10px;margin-top:26px}
    .ms-flow-step{padding:15px;border:1px solid #d4cfc3;border-radius:12px;background:#ebe6da}
    .ms-flow-step b{display:block;color:#657700;font:800 10px Consolas,monospace;text-transform:uppercase;letter-spacing:.08em}
    .ms-flow-step span{display:block;margin-top:7px;color:#4f5968;font-size:12px;line-height:1.5}
    .ms-protection{margin-top:20px;padding:17px 19px;border:1px solid #9faa69;border-radius:12px;background:#f3f6df;color:#4d5631;font-size:13px;line-height:1.6}
    .ms-protection strong{color:#11151c}
    .ms-identity-line{margin-top:17px;color:#657080;font-size:12px;line-height:1.55}
    .ms-identity-line a{font-weight:900;text-decoration:underline}
    @media(max-width:860px){.ms-trust-grid{grid-template-columns:1fr}.ms-flow{grid-template-columns:1fr 1fr}}
    @media(max-width:600px){.ms-trust-shell{width:min(100% - 28px,560px)}.ms-trust-section{padding:62px 0}.ms-flow{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function makeTrustSection(kind) {
    const section = document.createElement('section');
    section.className = 'ms-trust-section';
    section.id = kind === 'rescue' ? 'confianza-rescate' : 'confianza';
    const isRescue = kind === 'rescue';
    section.innerHTML = `
      <div class="ms-trust-shell">
        <p class="ms-trust-kicker">${isRescue ? 'Confianza antes de pagar' : 'Quién está detrás del servicio'}</p>
        <h2 class="ms-trust-title">${isRescue ? 'Sabes qué pasa antes y después de enviar tu solicitud.' : 'Una marca nueva debe ganarse la confianza con reglas claras.'}</h2>
        <p class="ms-trust-intro">MindShock es un servicio digital coordinado desde Colombia. El canal comercial y operativo que podemos atender directamente es <a href="mailto:${salesEmail}">${salesEmail}</a>. El alcance, el precio, los insumos y cualquier dependencia externa se confirman por escrito antes de solicitar pago.</p>
        <div class="ms-trust-grid">
          <div class="ms-trust-card"><strong>Canal comercial atendido</strong><p>La coordinación continúa por el correo de ventas que los agentes de MindShock pueden revisar y responder directamente.</p></div>
          <div class="ms-trust-card"><strong>Sin testimonios inventados</strong><p>Los ejemplos actuales están marcados como demostrativos. Un caso de cliente solo se publicará cuando exista una experiencia real y autorización suficiente.</p></div>
        </div>
        <div class="ms-flow" aria-label="Qué ocurre después de enviar una solicitud">
          <div class="ms-flow-step"><b>01 · Envías</b><span>Describes el archivo o proceso sin pagar.</span></div>
          <div class="ms-flow-step"><b>02 · Revisamos</b><span>Confirmamos si el caso realmente encaja.</span></div>
          <div class="ms-flow-step"><b>03 · Recibes</b><span>Alcance, plazo, precio, insumos y dependencias por correo.</span></div>
          <div class="ms-flow-step"><b>04 · Decides</b><span>Si estás de acuerdo, recibes el método de pago.</span></div>
          <div class="ms-flow-step"><b>05 · Empezamos</b><span>Solo con las condiciones de inicio ya confirmadas.</span></div>
        </div>
        <div class="ms-protection"><strong>Protección de cumplimiento:</strong> si una causa atribuible a MindShock impide cumplir materialmente un servicio ya pagado y no es posible corregirlo para cumplir el alcance acordado, se devuelve el importe recibido por ese servicio, sin limitar los derechos obligatorios que correspondan.</div>
        <p class="ms-identity-line">Colombia · <a href="mailto:${salesEmail}">${salesEmail}</a> · <a href="/terminos.html">Términos</a> · <a href="/privacidad.html">Privacidad</a></p>
      </div>`;
    return section;
  }

  function improveSuccess(status, messageBuilder) {
    if (!status) return;
    const apply = () => {
      const success = status.classList.contains('success');
      if (!success || status.dataset.msEnhanced === '1') return;
      status.dataset.msEnhanced = '1';
      status.textContent = messageBuilder(status.textContent);
    };
    new MutationObserver(apply).observe(status, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
    apply();
  }

  if (path === '/') {
    const compare = document.getElementById('comparar');
    const examples = document.getElementById('ejemplos');
    if (compare && examples && examples.nextElementSibling !== compare) {
      examples.insertAdjacentElement('afterend', compare);
    }

    const review = document.getElementById('revision');
    if (review && !document.getElementById('confianza')) {
      review.insertAdjacentElement('beforebegin', makeTrustSection('operations'));
    }

    const footerLinks = document.querySelector('.footer-links');
    if (footerLinks && !footerLinks.querySelector('a[href="#confianza"]')) {
      const link = document.createElement('a');
      link.href = '#confianza';
      link.textContent = 'Confianza';
      footerLinks.insertBefore(link, footerLinks.firstChild);
    }

    improveSuccess(document.getElementById('form-status'), () =>
      `Solicitud recibida. Siguiente paso: revisaremos el encaje y te responderemos desde ${salesEmail} con el alcance, los insumos, las dependencias, las condiciones que activan las 48 horas y el precio confirmado. No se ha realizado ningún cobro.`
    );
  }

  if (path === '/rescate-express') {
    const formSection = document.getElementById('solicitud');
    if (formSection && !document.getElementById('confianza-rescate')) {
      formSection.insertAdjacentElement('beforebegin', makeTrustSection('rescue'));
    }

    improveSuccess(document.getElementById('rescue-status'), (current) => {
      const idMatch = current.match(/\(#\d+\)/);
      const id = idMatch ? ` ${idMatch[0]}` : '';
      return `Solicitud recibida${id}. Siguiente paso: revisaremos si Rescate Express es la opción correcta y te responderemos desde ${salesEmail} con resultado esperado, archivos necesarios, plazo, precio y exclusiones. Solo después decides si pagas.`;
    });
  }
})();
