(() => {
  const endpoint = 'https://zssjhpogljzxvfukesgf.supabase.co/functions/v1/site-track';
  const sessionKey = 'mindshock_funnel_session';
  const campaignKey = 'mindshock_funnel_campaign';

  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = [...bytes].map((value) => value.toString(16).padStart(2, '0')).join('');
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }

  function safeSessionGet(key) {
    try { return sessionStorage.getItem(key); } catch (_) { return null; }
  }

  function safeSessionSet(key, value) {
    try { sessionStorage.setItem(key, value); } catch (_) { /* no-op */ }
  }

  let sessionId = safeSessionGet(sessionKey);
  if (!sessionId) {
    sessionId = uuid();
    safeSessionSet(sessionKey, sessionId);
  }

  const params = new URLSearchParams(location.search);
  const incomingCampaign = {
    utm_source: params.get('utm_source') || null,
    utm_medium: params.get('utm_medium') || null,
    utm_campaign: params.get('utm_campaign') || null,
    utm_content: params.get('utm_content') || null,
    utm_term: params.get('utm_term') || null,
  };
  const hasIncomingCampaign = Object.values(incomingCampaign).some(Boolean);

  let campaign = null;
  try { campaign = JSON.parse(safeSessionGet(campaignKey) || 'null'); } catch (_) { campaign = null; }
  if (hasIncomingCampaign) {
    campaign = incomingCampaign;
    safeSessionSet(campaignKey, JSON.stringify(campaign));
  } else if (!campaign) {
    campaign = incomingCampaign;
    safeSessionSet(campaignKey, JSON.stringify(campaign));
  }

  let referrerHost = null;
  if (document.referrer) {
    try { referrerHost = new URL(document.referrer).hostname || null; } catch (_) { referrerHost = null; }
  }

  function track(eventName) {
    const payload = {
      event_name: eventName,
      session_id: sessionId,
      page_path: location.pathname,
      referrer_host: referrerHost,
      utm_source: campaign?.utm_source || null,
      utm_medium: campaign?.utm_medium || null,
      utm_campaign: campaign?.utm_campaign || null,
      utm_content: campaign?.utm_content || null,
      utm_term: campaign?.utm_term || null,
    };

    fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      keepalive: true,
      credentials: 'omit',
    }).catch(() => {});
  }

  window.mindshockTrack = track;
  track('page_view');

  document.addEventListener('click', (event) => {
    const anchor = event.target.closest?.('a[href="#revision"]');
    if (!anchor) return;
    if (anchor.closest('#demo-result')) track('post_demo_validate_click');
    else track('validate_click');
  }, { passive: true });

  const demoForm = document.getElementById('demo-form');
  const demoStatus = document.getElementById('demo-status');
  let demoSubmitted = false;
  if (demoForm) {
    demoForm.addEventListener('submit', () => {
      demoSubmitted = true;
      track('demo_start');
    });
  }
  if (demoStatus) {
    new MutationObserver(() => {
      if (!demoSubmitted) return;
      const state = demoStatus.classList.contains('success') ? 'success' : demoStatus.classList.contains('error') ? 'error' : '';
      if (!state) return;
      demoSubmitted = false;
      track(state === 'success' ? 'demo_complete' : 'demo_fail');
    }).observe(demoStatus, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }

  const reviewForm = document.getElementById('express-form');
  const reviewStatus = document.getElementById('form-status');
  if (reviewForm) {
    let reviewStarted = false;
    const startReview = () => {
      if (reviewStarted) return;
      reviewStarted = true;
      track('review_start');
    };
    reviewForm.addEventListener('focusin', startReview, { once: true });
    reviewForm.addEventListener('input', startReview, { once: true });
  }
  if (reviewStatus) {
    let lastReviewState = '';
    new MutationObserver(() => {
      const state = reviewStatus.classList.contains('success') ? 'success' : reviewStatus.classList.contains('error') ? 'error' : '';
      if (!state || state === lastReviewState) return;
      lastReviewState = state;
      track(state === 'success' ? 'review_submit' : 'review_fail');
    }).observe(reviewStatus, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });
  }
})();
