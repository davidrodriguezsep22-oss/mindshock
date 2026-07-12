const toggle=document.querySelector('.menu-toggle');
const menu=document.querySelector('#menu');

if(toggle&&menu){
  toggle.addEventListener('click',()=>{
    const open=menu.classList.toggle('open');
    toggle.setAttribute('aria-expanded',String(open));
  });

  menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>{
    menu.classList.remove('open');
    toggle.setAttribute('aria-expanded','false');
  }));
}

document.querySelectorAll('a[href^="#"]').forEach(a=>a.addEventListener('click',e=>{
  const id=a.getAttribute('href');
  const el=document.querySelector(id);
  if(el){
    e.preventDefault();
    el.scrollIntoView({behavior:'smooth',block:'start'});
  }
}));

const leadForm=document.getElementById('leadForm');

if(leadForm){
  leadForm.addEventListener('submit',event=>{
    event.preventDefault();

    const name=document.getElementById('leadName').value.trim();
    const country=document.getElementById('leadCountry').value.trim();
    const region=document.getElementById('leadRegion')?.value.trim()||'';
    const destination=country.toLowerCase()==='otro territorio o región'&&region ? region : country;
    const service=document.getElementById('leadService').value;
    const role=document.getElementById('leadRole').value.trim();

    const message=[
      `Hola MindShock, mi nombre es ${name}.`,
      `Busco empleo en: ${destination}.`,
      `Me interesa: ${service}.`,
      role ? `Mi cargo o área objetivo es: ${role}.` : '',
      'Quiero conocer el alcance y el tiempo de entrega.'
    ].filter(Boolean).join('\n');

    trackEvent('lead_submit',{country:destination,service,role:role||'no_especificado'});
    window.open(`https://wa.me/573022805656?text=${encodeURIComponent(message)}`,'_blank','noopener');
  });
}


// País/territorio personalizado
const countryInput=document.getElementById('leadCountry');
const regionWrap=document.getElementById('leadRegionWrap');
const regionInput=document.getElementById('leadRegion');

function updateRegionField(){
  if(!countryInput||!regionWrap||!regionInput) return;
  const custom=countryInput.value.trim().toLowerCase()==='otro territorio o región';
  regionWrap.hidden=!custom;
  regionInput.required=custom;
  if(!custom) regionInput.value='';
}

if(countryInput){
  countryInput.addEventListener('input',updateRegionField);
  countryInput.addEventListener('change',updateRegionField);
  updateRegionField();
}

// Eventos de conversión para Google Analytics
function trackEvent(name,params={}){
  if(typeof window.gtag==='function'){
    window.gtag('event',name,params);
  }
}

document.querySelectorAll('[data-analytics]').forEach(element=>{
  element.addEventListener('click',()=>{
    trackEvent(element.dataset.analytics,{
      link_url:element.href||'',
      link_text:(element.textContent||'').trim().slice(0,100)
    });
  });
});

// El botón internacional de PayPal usa data-analytics="paypal_click".
