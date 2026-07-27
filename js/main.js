/* Progressive enhancement + conversion tracking. Deferred, no framework, fully usable without JS.
   Nothing loads and no cookie is set while EC_CONFIG is empty (privacy-friendly default).

   DO NOT PASTE IDs INTO THIS FILE, or into the /js/main.js on a deployed site.
   IDs belong in <trade>/packs/<slug>.json under `tracking`:
       "tracking": { "adsId": "AW-…", "adsCallLabel": "AW-…/…", "adsFormLabel": "AW-…/…" }
   gen.js rewrites the two anchor lines below at build time (renderKitJs) and will ABORT if it cannot
   find them, so a hand-edit here is both overwritten on the next build and able to break the build.
   It is also wrong in a way that costs money: the fallback line below fires the CALL label, so a
   hand-pasted ADS_CALL_LABEL books form submissions as phone calls and Smart Bidding then optimises
   toward a conversion type that never happened. The generated version uses two separate labels. */
var EC_CONFIG = { GTM_ID: "", GA4_ID: "", ADS_ID: "", ADS_CALL_LABEL: "" };

(function () {
  "use strict";
  window.dataLayer = window.dataLayer || [];
  function gtag() { window.dataLayer.push(arguments); }
  window.gtag = window.gtag || gtag;

  // ---- Consent Mode v2 ----
  // REGION-SCOPED, in this order (a later default() only overrides the regions it names):
  //  1. global default = granted — these sites serve Ontario, Canada. Under PIPEDA, implied consent
  //     covers non-sensitive analytics/advertising cookies that the privacy policy discloses, so a
  //     blanket "denied" here bought no compliance and silently broke every conversion: tags fired
  //     but reported cookieless/modelled, and enhanced conversions could never match.
  //  2. EEA + UK + CH = denied until the visitor opts in — GDPR/ePrivacy needs PRIOR consent, and
  //     Google's EU user-consent policy requires it for ads there. wait_for_update holds the pings.
  // A visitor who has explicitly opted out (ec_consent = "denied") is honoured everywhere.
  var EEA = ["AT","BE","BG","HR","CY","CZ","DK","EE","FI","FR","DE","GR","HU","IS","IE","IT","LV","LI","LT","LU","MT","NL","NO","PL","PT","RO","SK","SI","ES","SE","GB","CH"];
  gtag("consent", "default", { ad_storage: "granted", analytics_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" });
  gtag("consent", "default", { region: EEA, ad_storage: "denied", analytics_storage: "denied", ad_user_data: "denied", ad_personalization: "denied", wait_for_update: 500 });
  try {
    var ec = localStorage.getItem("ec_consent");
    if (ec === "granted") gtag("consent", "update", { ad_storage: "granted", analytics_storage: "granted", ad_user_data: "granted", ad_personalization: "granted" });
    else if (ec === "denied") gtag("consent", "update", { ad_storage: "denied", analytics_storage: "denied", ad_user_data: "denied", ad_personalization: "denied" });
  } catch (e) {}
  // Opt-out hook for the privacy page: ecConsent("denied") / ecConsent("granted").
  window.ecConsent = function (state) {
    var g = state === "granted";
    try { localStorage.setItem("ec_consent", g ? "granted" : "denied"); } catch (e) {}
    gtag("consent", "update", { ad_storage: g ? "granted" : "denied", analytics_storage: g ? "granted" : "denied", ad_user_data: g ? "granted" : "denied", ad_personalization: g ? "granted" : "denied" });
  };

  function loadScript(src) { var s = document.createElement("script"); s.async = true; s.src = src; document.head.appendChild(s); }
  if (EC_CONFIG.GTM_ID) {
    (function (w, d, i) { w.dataLayer.push({ "gtm.start": +new Date(), event: "gtm.js" }); var f = d.getElementsByTagName("script")[0], j = d.createElement("script"); j.async = true; j.src = "https://www.googletagmanager.com/gtm.js?id=" + i; f.parentNode.insertBefore(j, f); })(window, document, EC_CONFIG.GTM_ID);
  } else if (EC_CONFIG.GA4_ID || EC_CONFIG.ADS_ID) {
    var firstId = EC_CONFIG.GA4_ID || EC_CONFIG.ADS_ID; loadScript("https://www.googletagmanager.com/gtag/js?id=" + firstId);
    gtag("js", new Date()); if (EC_CONFIG.GA4_ID) gtag("config", EC_CONFIG.GA4_ID); if (EC_CONFIG.ADS_ID) gtag("config", EC_CONFIG.ADS_ID, { allow_enhanced_conversions: true });
  }

  function track(name, params) {
    var data = Object.assign({ event: name }, params || {});
    window.dataLayer.push(data);
    if (EC_CONFIG.GA4_ID && window.gtag) window.gtag("event", name, data);
    if (EC_CONFIG.ADS_CALL_LABEL && window.gtag && name === "phone_click") window.gtag("event", "conversion", { send_to: EC_CONFIG.ADS_CALL_LABEL });
  }
  window.ecTrack = track;

  document.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a"); if (!a) return;
    var href = (a.getAttribute("href") || "").toLowerCase();
    if (href.indexOf("tel:") === 0) track("phone_click", { phone: href.replace("tel:", "") });
    else if (href.indexOf("sms:") === 0) track("sms_click");
    else if (a.hasAttribute("data-book") || /\/(estimate|book|contact)(\/|$|#|\?)/.test(href)) track("book_click");
  }, true);

  var quote = document.querySelector("form.quote-form");
  if (quote) quote.addEventListener("submit", function () {
    if (!quote.checkValidity()) return;
    // PROOF-OF-SUBMIT token. The form POSTs away and Web3Forms redirects back to /thank-you/, where the
    // lead conversion fires. Without this token ANY load of /thank-you/ counted a lead — a bookmark, a
    // crawler, the owner checking the page. Inflated conversions are worse than none: Smart Bidding
    // optimises toward whatever produced them. The token is written here, and /thank-you/ requires and
    // CONSUMES it. If sessionStorage is unavailable the conversion is skipped rather than guessed —
    // under-counting is the safe direction.
    try { sessionStorage.setItem("ec_pending", "P" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8) + "|" + Date.now()); } catch (e) {}
    track("generate_lead", { form: "estimate", currency: "CAD", value: 100 });
    var b = quote.querySelector('button[type="submit"]'); if (b) { b.disabled = true; b.textContent = "Sending…"; }
  });

  var btn = document.querySelector(".menu-btn"), links = document.querySelector(".nav-links");
  if (btn && links) {
    btn.addEventListener("click", function () { var o = links.classList.toggle("open"); btn.setAttribute("aria-expanded", o ? "true" : "false"); btn.setAttribute("aria-label", o ? "Close menu" : "Open menu"); });
    links.addEventListener("click", function (e) { if (e.target.tagName === "A") links.classList.remove("open"); });
    document.addEventListener("keydown", function (e) { if (e.key === "Escape" && links.classList.contains("open")) { links.classList.remove("open"); btn.setAttribute("aria-expanded", "false"); btn.focus(); } });
  }
  var header = document.querySelector("header.site");
  if (header) { var on = false, tick = false; var ap = function () { var w = window.scrollY > 8; if (w !== on) { on = w; header.style.boxShadow = w ? "0 6px 20px rgba(0,0,0,.25)" : "none"; } tick = false; }; window.addEventListener("scroll", function () { if (!tick) { tick = true; requestAnimationFrame(ap); } }, { passive: true }); ap(); }
  var faqs = document.querySelectorAll(".faq details"), closing = false;
  Array.prototype.forEach.call(faqs, function (d) { d.addEventListener("toggle", function () { if (closing || !d.open) return; closing = true; Array.prototype.forEach.call(faqs, function (o) { if (o !== d && o.open) o.open = false; }); closing = false; }); });
})();
