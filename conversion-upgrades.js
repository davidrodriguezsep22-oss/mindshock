(() => {
  const path = location.pathname.replace(/\/+$/, '') || '/';
  const salesEmail = 'davidrodriguezsep22@gmail.com';
  const oldSalesEmail = 'ventas@mindshock.app';
  const responseWindow = 'siguiente día hábil';

  // Mientras el buzón del dominio no reenvíe de forma fiable a Gmail,
  // todos los enlaces de contacto deben llegar al canal que sí se atiende.
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
    .ms-trust-intro{max-width:800px;margin:18px 0 0;color:#657080;font-size:16px;line-height:1.65}
    .ms-trust-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:14px;margin-top:30px}
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
    .ms-inline-signals{display:flex;flex-wrap:wrap;gap:7px;margin:13px 0 0}
    .ms-inline-signal{padding:7px 9px;border:1px solid rgba(108,231,255,.32);border-radius:999px;color:#b7c4d3;background:rgba(108,231,255,.055);font:750 10px Consolas,monospace;line-height:1.3}
    .ms-inline-signals.light .ms-inline-signal{border-color:#b8b39f;color:#59616d;background:#f8f6ef}
    .ms-calc-section{padding:76px 0;background:#111722;color:#fff}
    .ms-calc-grid{display:grid;grid-template-columns:.85fr 1.15fr;gap:38px;align-items:start}
    .ms-calc-section .ms-trust-kicker{color:#c7ff4a}
    .ms-calc-section .ms-trust-title{color:#fff}
    .ms-calc-section .ms-trust-intro{color:#9aa7b7}
    .ms-calc-box{padding:24px;border:1px solid #354253;border-radius:18px;background:#0d131c}
    .ms-calc-fields{display:grid;grid-template-columns:1fr 1fr;gap:12px}
    .ms-calc-field label{display:block;margin:0 0 7px;color:#d9e0e8;font-size:12px;font-weight:850}
    .ms-calc-field input{width:100%;padding:12px 13px;border:1px solid #3c4858;border-radius:9px;background:#111722;color:#fff}
    .ms-calc-result{margin-top:16px;padding:18px;border:1px solid #52652f;border-radius:12px;background:rgba(199,255,74,.055)}
    .ms-calc-result strong{display:block;color:#c7ff4a;font-size:28px;letter-spacing:-.04em}
    .ms-calc-result span{display:block;margin-top:5px;color:#a0adbd;font-size:12px;line-height:1.55}
    .ms-calc-note{margin:12px 0 0;color:#728095;font-size:11px;line-height:1.55}
    @media(max-width:860px){.ms-trust-grid{grid-template-columns:1fr}.ms-flow{grid-template-columns:1fr 1fr}.ms-calc-grid{grid-template-columns:1fr}}
    @media(max-width:600px){.ms-trust-shell{width:min(100% - 28px,560px)}.ms-trust-section,.ms-calc-section{padding:62px 0}.ms-flow,.ms-calc-fields{grid-template-columns:1fr}}
  `;
  document.head.appendChild(style);

  function makeTrustSection(kind) {
    const section = document.createElement('section');
    section.className = 'ms-trust-section';
    section.id = kind === 'rescue' ? 'confianza-rescate' : 'confianza';
    const isRescue = kind === 'rescue';
    section.innerHTML = `
      <div class="ms-trust-shell">
        <p class="ms-trust-kicker">${isRescue ? 'Confianza antes de pagar' : 'Reglas claras antes de empezar'}</p>
        <h2 class="ms-trust-title">${isRescue ? 'Sabes qué pasa antes, durante y después de enviar tu solicitud.' : 'Menos incertidumbre antes de comprometer dinero.'}</h2>
        <p class="ms-trust-intro">MindShock es un servicio digital coordinado desde Colombia. La solicitud no genera cobro. Primero confirmamos por escrito si el caso encaja, qué resultado se entregará, qué archivos hacen falta, el plazo y el precio.</p>
        <div class="ms-trust-grid">
          <div class="ms-trust-card"><strong>Revisión durante el ${responseWindow}</strong><p>Revisamos la solicitud en el siguiente día hábil y te indicamos el siguiente paso. Esto no cambia el plazo de entrega, que se confirma antes de pagar.</p></div>
          <div class="ms-trust-card"><strong>Control de calidad incluido</strong><p>Antes de entregar, contrastamos la salida con los archivos de entrada dentro del alcance acordado y señalamos campos dudosos o inconsistencias que requieran validación humana.</p></div>
          <div class="ms-trust-card"><strong>Sin testimonios inventados</strong><p>Los ejemplos actuales son demostrativos. Un caso de cliente solo se publicará cuando exista una experiencia real y autorización suficiente.</p></div>
        </div>
        <div class="ms-flow" aria-label="Qué ocurre después de enviar una solicitud">
          <div class="ms-flow-step"><b>01 · Envías</b><span>Describes el archivo o proceso sin pagar.</span></div>
          <div class="ms-flow-step"><b>02 · Revisamos</b><span>Confirmamos si el caso realmente encaja.</span></div>
          <div class="ms-flow-step"><b>03 · Recibes</b><span>Alcance, plazo, precio, insumos y dependencias por correo.</span></div>
          <div class="ms-flow-step"><b>04 · Decides</b><span>Si estás de acuerdo, recibes el método de pago.</span></div>
          <div class="ms-flow-step"><b>05 · Empezamos</b><span>Solo con las condiciones de inicio ya confirmadas.</span></div>
        </div>
        <div class="ms-protection"><strong>Protección de cumplimiento:</strong> si una causa atribuible a MindShock impide cumplir materialmente un servicio ya pagado y no es posible corregirlo para cumplir el alcance acordado, se devuelve el importe recibido por ese servicio, sin limitar los derechos obligatorios que correspondan.</div>
        <p class="ms-identity-line">MindShock · Colombia · correo operativo atendido: <a href="mailto:${salesEmail}">${salesEmail}</a> · <a href="/terminos.html">Términos</a> · <a href="/privacidad.html">Privacidad</a></p>
      </div>`;
    return section;
  }

  function makeOperationsCalculator() {
    const section = document.createElement('section');
    section.className = 'ms-calc-section';
    section.id = 'tiempo-repetitivo';
    section.innerHTML = `
      <div class="ms-trust-shell ms-calc-grid">
        <div>
          <p class="ms-trust-kicker">Haz visible el trabajo repetitivo</p>
          <h2 class="ms-trust-title">¿Cuánto tiempo consume hoy esa tarea?</h2>
          <p class="ms-trust-intro">Introduce cuánto tarda una ejecución y cuántas veces la haces al mes. La calculadora muestra el tiempo actual dedicado a la tarea; no promete que todo ese tiempo vaya a ahorrarse.</p>
        </div>
        <div class="ms-calc-box">
          <div class="ms-calc-fields">
            <div class="ms-calc-field"><label for="ms-minutes">Minutos por ejecución</label><input id="ms-minutes" type="number" min="1" max="1440" step="1" value="15" inputmode="numeric"></div>
            <div class="ms-calc-field"><label for="ms-times">Veces al mes</label><input id="ms-times" type="number" min="1" max="10000" step="1" value="20" inputmode="numeric"></div>
          </div>
          <div class="ms-calc-result" aria-live="polite"><strong id="ms-monthly-hours">5 horas/mes</strong><span id="ms-annual-hours">Equivale a 60 horas/año dedicadas hoy a esa tarea.</span></div>
          <p class="ms-calc-note">Cálculo informativo: minutos × repeticiones. El ahorro real depende del proceso, las excepciones y el alcance que se confirme.</p>
        </div>
      </div>`;
    return section;
  }

  function wireOperationsCalculator(section) {
    if (!section) return;
    const minutes = section.querySelector('#ms-minutes');
    const times = section.querySelector('#ms-times');
    const monthly = section.querySelector('#ms-monthly-hours');
    const annual = section.querySelector('#ms-annual-hours');
    let tracked = false;
    const update = () => {
      const m = Math.max(0, Number(minutes?.value || 0));
      const t = Math.max(0, Number(times?.value || 0));
      const monthlyHours = (m * t) / 60;
      const annualHours = monthlyHours * 12;
      const format = (value) => Number.isInteger(value) ? String(value) : value.toLocaleString('es-CO', { maximumFractionDigits: 1 });
      if (monthly) monthly.textContent = `${format(monthlyHours)} horas/mes`;
      if (annual) annual.textContent = `Equivale a ${format(annualHours)} horas/año dedicadas hoy a esa tarea.`;
      if (!tracked && m > 0 && t > 0 && typeof window.mindshockTrack === 'function') {
        tracked = true;
        window.mindshockTrack('ops_time_calculator_use');
      }
    };
    minutes?.addEventListener('input', update);
    times?.addEventListener('input', update);
    update();
  }

  function addSignals(container, light = false) {
    if (!container || container.querySelector('.ms-inline-signals')) return;
    const row = document.createElement('div');
    row.className = `ms-inline-signals${light ? ' light' : ''}`;
    row.innerHTML = `
      <span class="ms-inline-signal">Revisión: siguiente día hábil</span>
      <span class="ms-inline-signal">Control de calidad incluido</span>
      <span class="ms-inline-signal">Sin cobro al solicitar</span>`;
    container.appendChild(row);
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

    const rescueLink = document.querySelector('a[href="/rescate-express/"], a[data-rescue-entry]');
    const rescueCard = rescueLink?.closest('.choice');
    addSignals(rescueCard || rescueLink?.parentElement, false);

    const review = document.getElementById('revision');
    if (review && !document.getElementById('confianza')) {
      review.insertAdjacentElement('beforebegin', makeTrustSection('operations'));
    }
    if (review && !document.getElementById('tiempo-repetitivo')) {
      const calculator = makeOperationsCalculator();
      review.insertAdjacentElement('beforebegin', calculator);
      wireOperationsCalculator(calculator);
    }

    const footerLinks = document.querySelector('.footer-links');
    if (footerLinks && !footerLinks.querySelector('a[href="#confianza"]')) {
      const link = document.createElement('a');
      link.href = '#confianza';
      link.textContent = 'Confianza';
      footerLinks.insertBefore(link, footerLinks.firstChild);
    }

    improveSuccess(document.getElementById('form-status'), () =>
      `Solicitud recibida. La revisaremos durante el ${responseWindow}. Te responderemos desde ${salesEmail} con el alcance, los insumos, las dependencias, las condiciones que activan las 48 horas y el precio confirmado. No se ha realizado ningún cobro.`
    );
  }

  if (path === '/rescate-express') {
    const heroActions = document.querySelector('.hero .actions');
    addSignals(heroActions?.parentElement || heroActions, false);

    const formSection = document.getElementById('solicitud');
    if (formSection && !document.getElementById('confianza-rescate')) {
      formSection.insertAdjacentElement('beforebegin', makeTrustSection('rescue'));
    }

    improveSuccess(document.getElementById('rescue-status'), (current) => {
      const idMatch = current.match(/\(#\d+\)/);
      const id = idMatch ? ` ${idMatch[0]}` : '';
      return `Solicitud recibida${id}. La revisaremos durante el ${responseWindow}. Te responderemos desde ${salesEmail} con resultado esperado, archivos necesarios, plazo, precio y exclusiones. Solo después decides si pagas.`;
    });
  }
})();
