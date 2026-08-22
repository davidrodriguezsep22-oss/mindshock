(() => {
  const publicEmail = 'ventas@mindshock.app';
  const operationalEmail = 'davidrodriguezsep22@gmail.com';

  function applyPublicSalesEmail(root = document) {
    root.querySelectorAll?.('a[href^="mailto:"]').forEach((anchor) => {
      const text = (anchor.textContent || '').trim();
      const href = anchor.getAttribute('href') || '';
      if (text === operationalEmail || href.includes(operationalEmail)) {
        anchor.textContent = publicEmail;
        anchor.href = `mailto:${publicEmail}`;
      }
    });

    root.querySelectorAll?.('script[type="application/ld+json"]').forEach((script) => {
      if (script.textContent?.includes(operationalEmail)) {
        script.textContent = script.textContent.replaceAll(operationalEmail, publicEmail);
      }
    });

    root.querySelectorAll?.('.ms-identity-line').forEach((line) => {
      line.innerHTML = `MindShock · Colombia · Correo comercial: <a href="mailto:${publicEmail}">${publicEmail}</a> · <a href="/terminos.html">Términos</a> · <a href="/privacidad.html">Privacidad</a>`;
    });

    ['form-status', 'rescue-status'].forEach((id) => {
      const status = document.getElementById(id);
      if (!status) return;
      let text = status.textContent || '';
      text = text
        .replace(`Te responderemos desde ${operationalEmail} con`, 'Te responderemos por correo con')
        .replace(`te responderemos desde ${operationalEmail} con`, 'te responderemos por correo con')
        .replaceAll(operationalEmail, publicEmail);
      if (status.textContent !== text) status.textContent = text;
    });
  }

  applyPublicSalesEmail();
  const observer = new MutationObserver(() => applyPublicSalesEmail());
  observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
})();
