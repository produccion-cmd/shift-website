// SHIFT Manager — document HTML templates.
// Extracted from manager_v2.html (2026-07-02) so template edits cannot
// break the app shell. Loaded by manager_v2.html BEFORE the main script;
// depends on globals defined there (esc, fmtPrice, ...) at call time only.

// ── SHARED BRAND ASSETS ────────────────────────────────────────────────────
// Embedded as data URIs so generated documents show the logo correctly
// everywhere they live: blob-URL live previews, print/PDF windows,
// downloaded files and emailed copies — no dependency on shiftevnts.com
// being reachable (or the file sitting next to SHIFT-ICON.svg) at view time.
const SHIFT_ICON_URI = 'data:image/svg+xml,' + encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1125.13 1080.02"><path d="M1125.06,2.46s0,0,0,0V0H0v1080.02h21.25v-.07l412.21-1.16,529.12-4.5s0,0,0,0h.2s0-.02,0-.02c.07,0,.13,0,.2-.02,98.2-16.88,162.16-83.8,162.15-182.96l-.08-888.84ZM1106.43,467.27c0,.09,0,.18-.01.28-6.53,60.8-18.72,115.27-47.07,167.18-.07.12-.14.24-.23.35-104.18,135.23-271.11,166.73-392.6,311.63-.05.06-.11.12-.16.18-70.12,68.87-154.75,99.55-252.51,111.89H21.25V21.25h1084.28l.9,446.02ZM654.19,1002.6c62.16-54.15,121.78-113.4,192.06-156.77,49.21-30.36,101.05-56.35,149-88.77,45.1-30.49,79.67-69.67,102.28-119.51,1.12-2.47,4.81-1.56,4.69,1.14-4.46,96.29-78.96,167.65-167.61,205.29-73.2,31.08-139.9,67.36-206.04,116.1-24.46,18.03-46.81,33.9-71.64,46.55-2.59,1.32-4.93-2.13-2.74-4.04ZM703.1,1019.86c50.72-38.27,110.57-73.54,173.77-103l135.15-63c43.5-20.28,67.62-60.4,86.43-103.92,1.07-2.47,4.75-1.67,4.71,1.03-1.19,84.71-60.09,147.07-139.35,176.68l-258.36,96.49c-2.65.99-4.61-2.56-2.35-4.26ZM971.95,1018.72l-193.99,26.51c-2.94.4-3.94-3.79-1.13-4.76l200.89-68.97c58.21-19.98,100.35-57.14,125.43-114.04,1.09-2.48,4.81-1.58,4.7,1.12-3.27,77.75-54.42,149-135.9,160.14Z"/></svg>');
const SHIFT_BRAND_FONT_CSS = "@font-face{font-family:'SHIFTBrand';src:url(data:font/woff2;base64,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) format('woff2');font-display:swap}";

// ── CONTRACT HTML TEMPLATE ───────────────────────────────────
function generateContractHTML(d) {
  const es = d.lang === 'es';
  const fmtDate = iso => {
    if (!iso) return '—';
    return new Date(iso+' 00:00').toLocaleDateString(es?'es-MX':'en-US',{year:'numeric',month:'long',day:'numeric'});
  };
  const fmtMoney = v => '$'+v.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
  const scopeRows = d.items.map(it => `
    <tr>
      <td style="padding:11px 0;border-bottom:1px solid #1e1e22;font-size:13.5px;color:#d4d4d8;line-height:1.4">${esc(it.desc)}</td>
      <td style="padding:11px 0;border-bottom:1px solid #1e1e22;font-size:13.5px;color:#d4d4d8;text-align:right;white-space:nowrap">${fmtMoney(it.amount)}</td>
    </tr>`).join('');

  return `<!DOCTYPE html>
<html lang="${d.lang}">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>SHIFT ${es?'Contrato de Servicios':'Service Agreement'} ${esc(d.contractNum)} — ${esc(d.client)}</title>
<link rel="icon" type="image/svg+xml" href="${SHIFT_ICON_URI}">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0b;color:#d4d4d8;font-family:'Inter',system-ui,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased;min-height:100vh;display:flex;flex-direction:column}
${SHIFT_BRAND_FONT_CSS}
.page{max-width:800px;width:100%;margin:0 auto;padding:clamp(40px,6vw,72px) clamp(24px,5vw,60px);flex:1;display:flex;flex-direction:column}
/* Header */
.ctr-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:20px;margin-bottom:clamp(36px,5vw,56px);flex-wrap:wrap}
.ctr-logo{display:flex;align-items:center;gap:10px}
.ctr-logo img{height:24px;filter:brightness(0)invert(1)}
.ctr-logo span{font-family:'SHIFTBrand',sans-serif;font-size:20px;line-height:1;color:#f2f2f4;letter-spacing:.5em}
.ctr-title-block{text-align:right}
.ctr-title{font-family:'Sora',sans-serif;font-weight:800;font-size:clamp(22px,4vw,34px);letter-spacing:-.03em;color:#f2f2f4}
.ctr-num-lbl{font-size:11px;font-weight:600;letter-spacing:.2em;text-transform:uppercase;color:#545460;margin-top:5px}
/* Parties */
.parties{display:grid;grid-template-columns:1fr 1fr;gap:2px;background:#1e1e22;margin-bottom:clamp(28px,4vw,44px)}
@media(max-width:520px){.parties{grid-template-columns:1fr}}
.party-cell{background:#111114;padding:18px 22px}
.party-lbl{font-size:9px;font-weight:700;letter-spacing:.24em;text-transform:uppercase;color:#545460;margin-bottom:10px}
.party-name{font-family:'Sora',sans-serif;font-weight:700;font-size:15px;color:#f2f2f4;margin-bottom:6px}
.party-detail{font-size:12.5px;color:#8a8a96;line-height:1.65}
/* Section */
.sec{margin-bottom:clamp(28px,4vw,44px)}
.sec-lbl{font-size:9px;font-weight:700;letter-spacing:.26em;text-transform:uppercase;color:#545460;margin-bottom:14px;padding-bottom:10px;border-bottom:1px solid #1e1e22}
.sec-body{font-size:13.5px;color:#8a8a96;line-height:1.75;white-space:pre-wrap}
/* Event bar */
.event-bar{background:#111114;border:1px solid #1e1e22;padding:18px 22px;margin-bottom:clamp(28px,4vw,44px);display:grid;grid-template-columns:1fr 1fr 1fr;gap:16px}
@media(max-width:520px){.event-bar{grid-template-columns:1fr}}
.ev-lbl{font-size:9px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#545460;margin-bottom:5px}
.ev-val{font-size:14px;color:#f2f2f4;font-weight:500}
/* Scope table */
table{width:100%;border-collapse:collapse;margin-bottom:12px}
thead th{font-size:9px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#545460;padding:0 0 12px;border-bottom:1px solid #1e1e22;text-align:left}
thead th:last-child{text-align:right}
.scope-total{display:flex;justify-content:flex-end;margin-bottom:clamp(28px,4vw,44px)}
.scope-total-box{border-top:1px solid #f2f2f4;padding-top:14px;min-width:220px;display:flex;justify-content:space-between;align-items:baseline;gap:24px}
.scope-total-lbl{font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:#f2f2f4}
.scope-total-val{font-family:'Sora',sans-serif;font-weight:800;font-size:clamp(22px,3.5vw,28px);color:#f2f2f4}
/* Payment schedule */
.pay-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px;background:#1e1e22;margin-bottom:clamp(28px,4vw,44px)}
@media(max-width:520px){.pay-grid{grid-template-columns:1fr}}
.pay-cell{background:#111114;padding:16px 22px}
.pay-cell-lbl{font-size:9px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#545460;margin-bottom:6px}
.pay-cell-amt{font-family:'Sora',sans-serif;font-weight:800;font-size:20px;color:#f2f2f4}
.pay-cell-date{font-size:12px;color:#8a8a96;margin-top:4px}
.pay-inst{font-size:12.5px;color:#8a8a96;margin-top:14px;line-height:1.65;white-space:pre-wrap}
/* Signature block */
.sig-block{margin-top:auto;padding-top:clamp(32px,5vw,52px)}
.sig-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-top:24px}
@media(max-width:480px){.sig-grid{grid-template-columns:1fr}}
.sig-party{border-top:1px solid #545460;padding-top:14px}
.sig-role{font-size:9px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:#545460;margin-bottom:8px}
.sig-line{height:40px;border-bottom:1px solid #2a2a2a;margin-bottom:8px}
.sig-name{font-size:12px;color:#8a8a96}
.sig-date-row{display:flex;align-items:center;gap:8px;margin-top:12px}
.sig-date-lbl{font-size:9px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:#545460}
.sig-date-line{flex:1;border-bottom:1px solid #2a2a2a;height:20px}
/* Footer */
.ctr-footer{margin-top:clamp(28px,4vw,44px);padding-top:20px;border-top:1px solid #161619;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px}
.ctr-footer-logo{display:flex;align-items:center;gap:8px}
.ctr-footer-logo img{height:16px;filter:brightness(0)invert(1);opacity:.35}
.ctr-footer-logo span{font-family:'SHIFTBrand',sans-serif;font-size:12px;color:#545460;letter-spacing:.5em}
.ctr-footer small{font-size:10px;letter-spacing:.14em;text-transform:uppercase;color:#333}
@media print{
  body{background:#fff!important;color:#111!important;display:block!important}
  .page{display:block!important}
  .ctr-logo img{filter:brightness(0)!important}
  .ctr-title,.party-name,.ev-val,.scope-total-val,.pay-cell-amt{color:#111!important}
  .parties,.pay-grid{background:#ccc!important}
  .party-cell,.pay-cell{background:#f5f5f5!important}
  .party-lbl,.party-detail,.ev-lbl,.pay-cell-lbl,.pay-cell-date,.sec-lbl,.sec-body,.pay-inst,.sig-role,.sig-name,.sig-date-lbl{color:#666!important}
  .event-bar{background:#f5f5f5!important;border-color:#ddd!important}
  .ctr-num-lbl,.ctr-footer-logo span,.ctr-footer small{color:#aaa!important}
  thead th,tr td{border-color:#ddd!important}
  .scope-total-box{border-top-color:#111!important}
  .scope-total-lbl{color:#111!important}
  .sig-party{border-top-color:#888!important}
  .sig-line,.sig-date-line{border-color:#999!important}
  .ctr-footer{border-color:#ddd!important}
  .ctr-footer-logo img{opacity:.5!important;filter:brightness(0)!important}
}
</style>
</head>
<body>
<div class="page">
  <div class="ctr-hd">
    <div class="ctr-logo"><img src="${SHIFT_ICON_URI}" alt=""/><span>SHIFT</span></div>
    <div class="ctr-title-block">
      <div class="ctr-title">${es?'Contrato de Servicios':'Service Agreement'}</div>
      <div class="ctr-num-lbl">${esc(d.contractNum)} &nbsp;·&nbsp; ${fmtDate(d.date)}</div>
    </div>
  </div>

  <div class="parties">
    <div class="party-cell">
      <div class="party-lbl">${es?'Proveedor de Servicios':'Service Provider'}</div>
      <div class="party-name">Shift Events LLC</div>
      <div class="party-detail">17350 State Hwy 249, Ste 220 #24547<br>Houston, Texas 77064<br>+1 (346) 332-7077</div>
    </div>
    <div class="party-cell">
      <div class="party-lbl">${es?'Cliente':'Client'}</div>
      <div class="party-name">${esc(d.client)}</div>
      <div class="party-detail">${[d.company, d.addr, d.city, d.country].filter(Boolean).map(s=>esc(s)).join('<br>')}</div>
    </div>
  </div>

  <div class="event-bar">
    <div><div class="ev-lbl">${es?'Evento':'Event'}</div><div class="ev-val">${esc(d.eventName)||'—'}</div></div>
    <div><div class="ev-lbl">${es?'Fecha del Evento':'Event Date'}</div><div class="ev-val">${fmtDate(d.eventDate)}</div></div>
    <div><div class="ev-lbl">${es?'Lugar':'Venue'}</div><div class="ev-val">${esc(d.venue)||'—'}</div></div>
  </div>

  <div class="sec">
    <div class="sec-lbl">${es?'Alcance de Servicios':'Scope of Work'}</div>
    <table>
      <thead><tr>
        <th style="width:70%">${es?'Servicio / Entregable':'Service / Deliverable'}</th>
        <th style="text-align:right">${es?'Monto':'Amount'}</th>
      </tr></thead>
      <tbody>${scopeRows}</tbody>
    </table>
    <div class="scope-total">
      <div class="scope-total-box">
        <span class="scope-total-lbl">${es?'Total del Contrato':'Contract Total'}</span>
        <span class="scope-total-val">${fmtMoney(d.total)}</span>
      </div>
    </div>
  </div>

  <div class="sec">
    <div class="sec-lbl">${es?'Calendario de Pagos':'Payment Schedule'}</div>
    <div class="pay-grid">
      <div class="pay-cell">
        <div class="pay-cell-lbl">${es?'Anticipo':'Deposit'} (${d.depositPct}%)</div>
        <div class="pay-cell-amt">${fmtMoney(d.depositAmt)}</div>
        <div class="pay-cell-date">${es?'Vence':'Due'} ${fmtDate(d.depositDue)}</div>
      </div>
      <div class="pay-cell">
        <div class="pay-cell-lbl">${es?'Saldo Restante':'Balance'} (${100-d.depositPct}%)</div>
        <div class="pay-cell-amt">${fmtMoney(d.balanceAmt)}</div>
        <div class="pay-cell-date">${es?'Vence':'Due'} ${fmtDate(d.balanceDue)}</div>
      </div>
    </div>
    ${d.paymentInst?`<div class="pay-inst">${esc(d.paymentInst)}</div>`:''}
  </div>

  ${d.cancelPolicy?`<div class="sec"><div class="sec-lbl">${es?'Política de Cancelación':'Cancellation Policy'}</div><div class="sec-body">${esc(d.cancelPolicy)}</div></div>`:''}
  ${d.liability?`<div class="sec"><div class="sec-lbl">${es?'Limitación de Responsabilidad':'Limitation of Liability'}</div><div class="sec-body">${esc(d.liability)}</div></div>`:''}
  ${d.additionalTerms?`<div class="sec"><div class="sec-lbl">${es?'Términos Adicionales':'Additional Terms'}</div><div class="sec-body">${esc(d.additionalTerms)}</div></div>`:''}

  <div class="sig-block">
    <div class="sec-lbl">${es?'Firmas':'Signatures'}</div>
    <p style="font-size:12.5px;color:#545460;margin-top:10px;margin-bottom:24px">
      ${es
        ? 'Las partes abajo firmantes aceptan los términos y condiciones de este contrato.'
        : 'By signing below, both parties agree to the terms and conditions set forth in this agreement.'}
    </p>
    <div class="sig-grid">
      <div class="sig-party">
        <div class="sig-role">${es?'Cliente':'Client'}</div>
        <div class="sig-line"></div>
        <div class="sig-name">${esc(d.client)}</div>
        <div class="sig-date-row"><span class="sig-date-lbl">${es?'Fecha':'Date'}</span><div class="sig-date-line"></div></div>
      </div>
      <div class="sig-party">
        <div class="sig-role">Shift Events LLC</div>
        <div class="sig-line"></div>
        <div class="sig-name">Edwin &nbsp;·&nbsp; Authorized Representative</div>
        <div class="sig-date-row"><span class="sig-date-lbl">${es?'Fecha':'Date'}</span><div class="sig-date-line"></div></div>
      </div>
    </div>
  </div>

  <div class="ctr-footer">
    <div class="ctr-footer-logo"><img src="${SHIFT_ICON_URI}" alt=""/><span>SHIFT</span></div>
    <small>+1 (346) 332-7077 &nbsp;·&nbsp; Houston, Texas 77064</small>
  </div>
</div>
</body></html>`;
}

// ── PROPOSAL HTML TEMPLATE ───────────────────────────────────
// printFull=true pre-arms the page so auto-print keeps the dark look, hero
// and every image ("full" mode). Default print is the stripped light
// reference copy. The page also carries its own PDF / Full PDF buttons.
function generateProposalHTML(d, printFull) {
  const evts = d.events || [];
  const cur = d.currency || 'USD';
  const total = d.services.reduce((s,x)=>s+(parseFloat(x.price)||0),0)
              + evts.reduce((s,e)=>s+(parseFloat(e.price)||0),0);
  const deposit = total * d.depositPct / 100;
  const balance = total - deposit;
  const heroImg = d.heroImg || 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=1920&q=85&fit=crop';
  // Gallery entries: plain URLs (→ end gallery) or {url, pos} with
  // pos ∈ intro | pricing | terms | gallery.
  const galleryItems = (d.gallery || []).map(g => typeof g === 'string' ? { url: g, pos: 'gallery' } : g);
  const imgBand = pos => {
    const list = galleryItems.filter(g => (g.pos || 'gallery') === pos);
    if (!list.length) return '';
    return `
  <section class="img-band"><div class="wrap"><div class="gallery">
    ${list.map(g => `<figure class="reveal"><img src="${esc(g.url)}" alt="" loading="lazy" onerror="this.closest('figure').style.display='none'"/></figure>`).join('')}
  </div></div></section>`;
  };
  const es = d.lang === 'es';
  const L = {
    scope: es ? 'Alcance de Servicios' : 'Scope of Services',
    together: es ? 'El trabajo que haremos juntos.' : "The work we'll do together.",
    inv: es ? 'Estructura de Inversión' : 'Investment Structure',
    transparent: es ? 'Transparencia total en cada línea.' : 'Full transparency on every line.',
    service: es ? 'Servicio' : 'Service',
    investment: es ? `Inversión (${cur})` : `Investment (${cur})`,
    total: 'Total',
    terms: es ? 'Términos' : 'Terms',
    simple: es ? 'Simples, claros, sin sorpresas.' : 'Simple, clear, no surprises.',
    deposit: es ? 'Anticipo' : 'Deposit',
    depositDesc: es ? 'del costo total al inicio.' : 'of total cost to start.',
    balance: es ? 'Saldo' : 'Balance',
    balanceDesc: es ? 'a la entrega final.' : 'upon final delivery.',
    notes: es ? 'Notas' : 'Notes',
    next: es ? 'Siguiente Paso' : 'Next Step',
    cta: es ? 'Aprobemos esta propuesta y comenzamos.' : "Let's approve this and get started.",
    approve: es ? 'Aprobar Propuesta' : 'Approve Proposal',
    back: es ? '← Portal del Cliente' : '← Client Portal',
    active: es ? 'Propuesta activa' : 'Active proposal',
    expired: es ? 'Propuesta Vencida' : 'Proposal Expired',
    expiredBody: es ? 'Esta propuesta ya no está activa.' : 'This proposal is no longer active.',
    contact: es ? 'Contactar SHIFT →' : 'Contact SHIFT →',
    validate: es ? 'Validar Propuesta' : 'Validate Proposal',
    validateCTA: es ? '¿Todo listo? Demos el primer paso.' : "Ready? Let's take the first step.",
    form: es ? 'Completar Formulario' : 'Fill Out Form',
    date: es ? 'Fecha' : 'Date',
    totalInv: es ? 'Inversión Total' : 'Total Investment',
    city: es ? 'Ciudad' : 'City',
    scroll: 'Scroll',
    dateLocale: es ? 'es-MX' : 'en-US',
    expiresIn: es ? 'Vence en' : 'Expires in',
    days: es ? 'días' : 'days',
    validUntil: es ? 'Válida hasta' : 'Valid until',
    pdf: es ? 'Descargar PDF' : 'Download PDF'
  };

  const fmtEvDate = iso => iso ? new Date(iso + 'T12:00:00').toLocaleDateString(es ? 'es-MX' : 'en-US', { month:'short', day:'numeric', year:'numeric' }) : '';
  const tableRows =
    evts.map((ev,i) => `
    <tr>
      <td><div class="service-name">${es?'Evento':'Event'} ${i+1} · ${esc(ev.name)}</div>${ev.venue?`<div class="service-desc">${esc(ev.venue)}${ev.date?' · '+fmtEvDate(ev.date):''}</div>`:''}</td>
      <td>$${fmtPrice(ev.price)}</td>
    </tr>`).join('')
    + d.services.map(s => `
    <tr>
      <td><div class="service-name">${esc(s.name)}</div>${s.desc?`<div class="service-desc">${esc(s.desc)}</div>`:''}</td>
      <td>$${fmtPrice(s.price)}</td>
    </tr>`).join('');

  // Per-event breakdown blocks — venue, date/time, equipment list, price.
  const eventsSection = evts.length ? `
  <section><div class="wrap">
    <div class="sec-eyebrow reveal">${es ? 'Desglose por Evento' : 'Event Breakdown'}</div>
    <h2 class="sec-lead reveal">${es ? 'Cada evento, cubierto.' : 'Every event, covered.'}</h2>
    ${evts.map((ev,i) => `
    <div class="pev reveal">
      <div class="pev-hd">
        <div>
          <div class="pev-eyebrow">${es?'Evento':'Event'} ${i+1}${ev.date ? ' · ' + fmtEvDate(ev.date) : ''}${ev.startTime ? ' · ' + ev.startTime : ''}</div>
          <h3 class="pev-name">${esc(ev.name)}${ev.venue ? ` <span class="pev-venue">— ${esc(ev.venue)}</span>` : ''}</h3>
        </div>
        <div class="pev-price">$${fmtPrice(ev.price)}${cur !== 'USD' ? `<span class="pev-cur"> ${cur}</span>` : ''}</div>
      </div>
      ${ev.items && ev.items.length ? `
      <div class="pev-grps">
        ${ev.items.map(it => `
        <div class="pev-grp">
          <div class="pev-grp-hd"><span>${esc(it.name)}</span>${it.price > 0 ? `<span class="pev-grp-price">$${fmtPrice(it.price)}${cur !== 'USD' ? ' ' + cur : ''}</span>` : ''}</div>
          ${it.elements && it.elements.length ? `<ul class="pev-eq">${it.elements.map(q => `<li>${esc(q)}</li>`).join('')}</ul>` : ''}
        </div>`).join('')}
      </div>`
      : (ev.equipment && ev.equipment.length ? `<ul class="pev-eq">${ev.equipment.map(q => `<li>${esc(q)}</li>`).join('')}</ul>` : '')}
    </div>`).join('')}
  </div></section>` : '';

  // End gallery (default position) — gets the "Visual References" headline.
  const endGalleryItems = galleryItems.filter(g => (g.pos || 'gallery') === 'gallery');
  const gallerySection = endGalleryItems.length ? `
  <section><div class="wrap">
    <div class="sec-eyebrow reveal">${es ? 'Referencias Visuales' : 'Visual References'}</div>
    <h2 class="sec-lead reveal">${es ? 'Así se ve nuestro trabajo.' : 'What this looks like live.'}</h2>
    <div class="gallery">
      ${endGalleryItems.map(g => `<figure class="reveal"><img src="${esc(g.url)}" alt="" loading="lazy" onerror="this.closest('figure').style.display='none'"/></figure>`).join('')}
    </div>
  </div></section>` : '';

  const formsSection = d.formsUrl ? `
  <section>
    <div class="wrap">
      <div style="display:flex;flex-direction:column;align-items:center;text-align:center;gap:28px">
        <div class="sec-eyebrow reveal">${L.validate}</div>
        <h2 style="font-family:'Sora',sans-serif;font-weight:700;font-size:clamp(26px,4.5vw,52px);line-height:1.04;letter-spacing:-.02em;max-width:22ch" class="reveal">${L.validateCTA}</h2>
        <a class="btn reveal" href="${esc(d.formsUrl)}" target="_blank" rel="noopener">${L.form} <span class="arr">→</span></a>
      </div>
    </div>
  </section>` : '';

  const introSection = d.intro ? `<p class="sec-para reveal">${esc(d.intro)}</p>` : '';
  const notesItem = d.notes ? `<div class="term-item" style="grid-column:1/-1"><div class="t-label">${L.notes}</div><div class="t-val" style="color:var(--mute)">${esc(d.notes)}</div></div>` : '';

  const dateDisplay = (() => {
    if (!d.proposalDate) return '';
    const dt = new Date(d.proposalDate + 'T12:00:00');
    return dt.toLocaleDateString(L.dateLocale, {month:'long',year:'numeric'});
  })();

  return `<!DOCTYPE html>
<html lang="${d.lang}"${printFull ? ' class="print-full"' : ''}>
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>SHIFT ${es?'Propuesta':'Proposal'} × ${esc(d.company||d.client)} — ${esc(d.title)}</title>
<link rel="icon" type="image/svg+xml" href="${SHIFT_ICON_URI}">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
:root{--bg:#0a0a0b;--panel:#111114;--line:#1e1e22;--line-soft:#161619;--white:#f2f2f4;--mute:#8a8a96;--dim:#545460;--gold:#c8a84b;--maxw:1100px}
${SHIFT_BRAND_FONT_CSS}
*{box-sizing:border-box;margin:0;padding:0}html{scroll-behavior:smooth}
body{background:var(--bg);color:var(--white);font-family:'Inter',system-ui,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased;overflow-x:hidden}
::selection{background:#fff;color:#000}
@keyframes bgIn{from{opacity:0}to{opacity:1}}
#bg-canvas{position:fixed;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;animation:bgIn 2.4s ease 1.8s both}
#expired-overlay{display:none;position:fixed;inset:0;z-index:9997;background:var(--bg);flex-direction:column;align-items:center;justify-content:center;text-align:center;padding:40px}
nav{position:fixed;top:0;left:0;width:100%;z-index:50;display:flex;justify-content:space-between;align-items:center;padding:20px 48px;border-bottom:1px solid var(--line);background:rgba(10,10,11,.88);backdrop-filter:blur(20px)}
.nav-logo{display:flex;align-items:center;gap:12px;text-decoration:none}.nav-logo img{height:28px;filter:brightness(0)invert(1)}
.nav-logo span{font-family:'SHIFTBrand',sans-serif;font-size:20px;line-height:1;color:var(--white);letter-spacing:.5em}
nav a.back,nav button.back{font-size:11px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--mute);text-decoration:none;background:none;border:none;font-family:inherit;cursor:pointer}
nav a.back:hover,nav button.back:hover{color:var(--white)}
.nav-actions{display:flex;align-items:center;gap:20px}
@media print{.nav-actions .back{display:none!important}}
@media(max-width:600px){nav{padding:16px 24px}}
.hero{position:relative;height:100svh;min-height:640px;overflow:hidden;display:flex;flex-direction:column;justify-content:flex-end;z-index:1}
.hero-bg{position:absolute;inset:0;z-index:0}.hero-bg img{width:100%;height:100%;object-fit:cover;filter:brightness(.4)saturate(.7)}
.hero-overlay{position:absolute;inset:0;z-index:1;background:linear-gradient(to top,rgba(10,10,11,1) 0%,rgba(10,10,11,.6) 40%,rgba(10,10,11,.1) 100%)}
.hero-content{position:relative;z-index:2;padding:clamp(32px,6vw,80px);padding-bottom:clamp(48px,8vh,96px)}
.hero-client{font-size:clamp(12px,1.3vw,15px);letter-spacing:.22em;text-transform:uppercase;color:var(--gold);margin-bottom:12px}
.hero-title{font-family:'Sora',sans-serif;font-weight:800;font-size:clamp(36px,8vw,110px);line-height:.92;letter-spacing:-.03em;max-width:14ch}
.hero-sub{margin-top:22px;font-size:clamp(14px,1.7vw,18px);color:var(--mute);max-width:52ch;line-height:1.6}
.hero-meta{margin-top:38px;display:flex;gap:36px;flex-wrap:wrap}
.hero-meta-item .lbl{font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--dim);margin-bottom:5px}
.hero-meta-item .val{font-family:'Sora',sans-serif;font-size:14px;font-weight:600;color:var(--white)}
.expiry-badge{display:inline-flex;align-items:center;gap:8px;margin-bottom:14px;padding:5px 13px;border:1px solid var(--line);background:rgba(255,255,255,.04);font-size:10.5px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:var(--dim)}
.expiry-badge .dot{width:5px;height:5px;border-radius:50%;background:#4caf50;box-shadow:0 0 8px #4caf50}
.expiry-badge.expiring .dot{background:var(--gold);box-shadow:0 0 8px var(--gold)}
.scroll-cue{position:absolute;bottom:24px;right:48px;z-index:2;display:flex;flex-direction:column;align-items:center;gap:7px;font-size:10px;letter-spacing:.3em;text-transform:uppercase;color:var(--dim)}
.scroll-cue i{width:1px;height:28px;background:linear-gradient(var(--dim),transparent);animation:drift 2s ease-in-out infinite}
@keyframes drift{0%,100%{transform:scaleY(.5);opacity:.4}50%{transform:scaleY(1);opacity:1}}
main{position:relative;z-index:1;background:var(--bg)}.wrap{max-width:var(--maxw);margin:0 auto;padding:0 clamp(24px,5vw,64px)}
section{padding:clamp(72px,12vh,140px) 0;border-top:1px solid var(--line-soft)}
.sec-eyebrow{font-size:10.5px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:var(--dim)}
.sec-lead{font-family:'Sora',sans-serif;font-weight:700;font-size:clamp(28px,4.5vw,52px);line-height:1.05;letter-spacing:-.02em;margin-top:.5em;max-width:20ch}
.sec-para{font-size:clamp(15px,1.8vw,17px);color:var(--mute);max-width:62ch;margin-top:1.4em;line-height:1.65}
.price-table{width:100%;border-collapse:collapse;margin-top:2.5em}
.price-table thead tr{border-bottom:1px solid var(--line)}
.price-table th{font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--dim);padding:0 0 13px;text-align:left}
.price-table th:last-child{text-align:right}.price-table tbody tr{border-bottom:1px solid var(--line-soft)}.price-table tbody tr:last-child{border-bottom:none}
.price-table td{padding:20px 0;vertical-align:top}.price-table td:last-child{text-align:right;font-family:'Sora',sans-serif;font-weight:700;font-size:17px;color:var(--white);white-space:nowrap}
.service-name{font-family:'Sora',sans-serif;font-weight:600;font-size:15px;color:var(--white);margin-bottom:3px}.service-desc{font-size:12.5px;color:var(--mute)}
.price-table tfoot tr{border-top:1px solid var(--white)}.price-table tfoot td{padding-top:20px;font-family:'Sora',sans-serif;font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:var(--dim)}
.price-table tfoot td:last-child{font-size:clamp(24px,4vw,38px);letter-spacing:-.02em;text-transform:none;color:var(--white)}
.terms-grid{display:grid;grid-template-columns:1fr 1fr;gap:2px;margin-top:2.2em;background:var(--line)}
@media(max-width:640px){.terms-grid{grid-template-columns:1fr}}
.term-item{background:var(--panel);padding:24px 28px}
.term-item .t-label{font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--dim);margin-bottom:9px}
.term-item .t-val{font-size:clamp(14px,1.6vw,16px);color:var(--white);line-height:1.55}
.term-item .t-val b{font-family:'Sora',sans-serif;font-weight:700}
.cta-lead{font-family:'Sora',sans-serif;font-weight:700;font-size:clamp(26px,4.5vw,52px);line-height:1.04;letter-spacing:-.02em;max-width:20ch;margin-top:.5em}
.btn{display:inline-flex;align-items:center;gap:13px;margin-top:2em;padding:15px 30px;border:1px solid var(--white);color:var(--white);text-decoration:none;font-family:'Sora',sans-serif;font-weight:600;font-size:14px;letter-spacing:.04em;transition:background .25s,color .25s,transform .2s}
.btn:hover{background:var(--white);color:#000;transform:translateY(-2px)}.btn .arr{transition:transform .25s}.btn:hover .arr{transform:translateX(5px)}
.contact-block{margin-top:2.2em;font-size:12.5px;color:var(--mute);letter-spacing:.04em;line-height:1.9}.contact-block b{color:var(--white);font-weight:600}
footer{border-top:1px solid var(--line-soft);padding:40px 0;position:relative;z-index:1}
footer .wrap{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}
.fmark{display:inline-flex;align-items:center;gap:10px;text-decoration:none}
.fmark img{height:20px;filter:brightness(0)invert(1);opacity:.5}.fmark span{font-family:'SHIFTBrand',sans-serif;font-size:16px;color:var(--mute);letter-spacing:.5em}
footer small{font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim)}
.reveal{opacity:0;transform:translateY(20px);transition:opacity 1.05s cubic-bezier(.22,1,.36,1),transform 1.05s cubic-bezier(.22,1,.36,1)}.reveal.in{opacity:1;transform:none}
.gallery{display:grid;grid-template-columns:1fr 1fr;gap:14px;margin-top:3em}
.gallery figure{margin:0;overflow:hidden;border:1px solid var(--line-soft);aspect-ratio:16/10;background:#111}
.gallery img{width:100%;height:100%;object-fit:cover;filter:saturate(.85);transition:transform 1.4s cubic-bezier(.22,1,.36,1),filter .8s}
.gallery figure:hover img{transform:scale(1.035);filter:saturate(1)}
.gallery figure:nth-child(3n+1){grid-column:1/-1;aspect-ratio:21/9}
@media(max-width:640px){.gallery{grid-template-columns:1fr}.gallery figure{aspect-ratio:16/10!important;grid-column:auto!important}}
.cta-actions{display:flex;gap:14px;flex-wrap:wrap;align-items:center}
.btn.btn-ghost{border-color:var(--line);color:var(--mute)}
.btn.btn-ghost:hover{border-color:var(--white);color:var(--white)}
.cta-note{margin-top:1.6em;font-size:12.5px;color:var(--dim);max-width:44ch;line-height:1.7}
/* Event breakdown blocks */
.pev{border:1px solid var(--line);background:var(--panel);padding:clamp(20px,3vw,30px);margin-top:16px;break-inside:avoid}
.pev-hd{display:flex;justify-content:space-between;align-items:flex-start;gap:18px;flex-wrap:wrap}
.pev-eyebrow{font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--gold, #c8a84b);margin-bottom:7px}
.pev-name{font-family:'Sora',sans-serif;font-weight:700;font-size:clamp(17px,2.4vw,22px);letter-spacing:-.01em;line-height:1.25}
.pev-venue{font-weight:400;color:var(--mute);font-size:.85em}
.pev-price{font-family:'Sora',sans-serif;font-weight:800;font-size:clamp(17px,2.4vw,22px);white-space:nowrap}
.pev-cur{font-size:.6em;color:var(--mute);font-weight:600}
.pev-grps{margin-top:18px;display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:18px}
.pev-grp-hd{display:flex;justify-content:space-between;gap:12px;align-items:baseline;font-size:11px;font-weight:700;letter-spacing:.2em;text-transform:uppercase;color:var(--gold,#c8a84b);border-bottom:1px solid var(--line-soft);padding-bottom:7px}
.pev-grp-price{color:var(--mute);font-weight:600;letter-spacing:.06em}
.pev-grp .pev-eq{margin-top:10px;columns:1}
.pev-eq{margin-top:16px;padding:0;list-style:none;columns:2;column-gap:32px}
.pev-eq li{font-size:12.5px;color:var(--mute);padding:4px 0;border-bottom:1px solid var(--line-soft);break-inside:avoid}
.pev-eq li::before{content:'— ';color:var(--dim)}
@media(max-width:640px){.pev-eq{columns:1}}
@media print{
/* shared: both print modes */
nav,#bg-canvas,#cur-dot,#cur-ring,#expired-overlay,.scroll-cue{display:none!important}
.reveal{opacity:1!important;transform:none!important;transition:none!important}
.price-table,.terms-grid{break-inside:avoid}
section{break-inside:avoid-page}
/* STRIPPED (default): light reference copy, no images or buttons */
html:not(.print-full){--bg:#fff;--white:#111;--mute:#555;--dim:#888;--line:#ddd;--line-soft:#eee;--panel:#f5f5f5}
html:not(.print-full) body{background:#fff;color:#111;cursor:auto}
html:not(.print-full) section{border-color:#e0e0e0}
html:not(.print-full) .hero{height:auto!important;min-height:0!important}
html:not(.print-full) .hero-bg,html:not(.print-full) .hero-overlay{display:none!important}
html:not(.print-full) .hero-content{padding-top:40px}
html:not(.print-full) .btn,html:not(.print-full) .cta-actions,html:not(.print-full) .cta-note,html:not(.print-full) .gallery{display:none!important}
/* FULL: keep the dark look, hero and every image (enable "Background
   graphics" in the print dialog for best results) */
html.print-full{print-color-adjust:exact;-webkit-print-color-adjust:exact}
html.print-full body{background:var(--bg)!important}
html.print-full .hero{height:auto!important;min-height:480px!important}
html.print-full .hero-bg,html.print-full .hero-overlay{display:block!important}
html.print-full .gallery figure{border-color:#333}
html.print-full .img-band,html.print-full .gallery{break-inside:avoid}
}
</style>
</head>
<body>
<canvas id="bg-canvas"></canvas>
<div id="expired-overlay">
  <img src="${SHIFT_ICON_URI}" alt="" style="height:40px;filter:brightness(0)invert(1);opacity:.3;margin-bottom:22px"/>
  <div style="font-size:11px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:var(--dim);margin-bottom:16px">${L.expired}</div>
  <h2 style="font-family:'Sora',sans-serif;font-weight:700;font-size:clamp(24px,5vw,44px);letter-spacing:-.02em;margin-bottom:16px">${L.expiredBody}</h2>
  <p style="font-size:14px;color:var(--mute);max-width:38ch;line-height:1.65">Contacta a SHIFT para una propuesta actualizada.</p>
  <a href="mailto:Produccion@5hift.com.mx" style="display:inline-flex;align-items:center;gap:12px;margin-top:32px;padding:15px 30px;border:1px solid var(--white);color:var(--white);text-decoration:none;font-family:'Sora',sans-serif;font-weight:600;font-size:13px">${L.contact}</a>
</div>
<nav>
  <a href="https://shiftevnts.com/SHIFT_proposals_hub.html" class="nav-logo"><img src="${SHIFT_ICON_URI}" alt=""/><span>SHIFT</span></a>
  <div class="nav-actions">
    <button type="button" class="back" onclick="setPrintMode(false)">${L.pdf}</button>
    <button type="button" class="back" onclick="setPrintMode(true)" title="${es ? 'Imprime con imágenes y el diseño completo — activa Gráficos de fondo en el diálogo' : 'Prints with images and the full look — enable Background graphics in the dialog'}">${es ? 'PDF Completo' : 'Full PDF'}</button>
    <a href="https://shiftevnts.com/SHIFT_proposals_hub.html" class="back">${L.back}</a>
  </div>
</nav>
<header class="hero">
  <div class="hero-bg"><img src="${esc(heroImg)}" alt="" onerror="this.style.display='none';this.parentElement.style.background='linear-gradient(135deg,#111 0%,#000 100%)'"/></div>
  <div class="hero-overlay"></div>
  <div class="hero-content">
    <div class="expiry-badge" id="expiry-badge"><span class="dot"></span><span id="expiry-badge-text">${L.active}</span></div>
    <div class="hero-client">${esc(d.client)}${d.company?' · '+esc(d.company):''}</div>
    <h1 class="hero-title">${esc(d.title)}</h1>
    ${d.subtitle?`<p class="hero-sub">${esc(d.subtitle)}</p>`:''}
    <div class="hero-meta">
      ${dateDisplay?`<div class="hero-meta-item"><div class="lbl">${L.date}</div><div class="val">${esc(dateDisplay)}</div></div>`:''}
      <div class="hero-meta-item"><div class="lbl">${L.totalInv}</div><div class="val">$${fmtPrice(total)} ${cur}</div></div>
      ${d.city?`<div class="hero-meta-item"><div class="lbl">${L.city}</div><div class="val">${esc(d.city)}</div></div>`:''}
    </div>
  </div>
  <div class="scroll-cue"><span>${L.scroll}</span><i></i></div>
</header>
<main>
  <section><div class="wrap">
    <div class="sec-eyebrow reveal">01 — ${L.scope}</div>
    <h2 class="sec-lead reveal">${L.together}</h2>
    ${introSection}
  </div></section>
  ${eventsSection}
  ${imgBand('intro')}
  <section><div class="wrap">
    <div class="sec-eyebrow reveal">02 — ${L.inv}</div>
    <h2 class="sec-lead reveal">${L.transparent}</h2>
    <table class="price-table reveal" style="margin-top:3em">
      <thead><tr><th>${L.service}</th><th>${L.investment}</th></tr></thead>
      <tbody>${tableRows}</tbody>
      <tfoot><tr><td>${L.total}</td><td>$${fmtPrice(total)}</td></tr></tfoot>
    </table>
  </div></section>
  ${imgBand('pricing')}
  <section><div class="wrap">
    <div class="sec-eyebrow reveal">03 — ${L.terms}</div>
    <h2 class="sec-lead reveal">${L.simple}</h2>
    <div class="terms-grid reveal" style="margin-top:2.2em">
      <div class="term-item"><div class="t-label">${L.deposit}</div><div class="t-val"><b>${d.depositPct}%</b> ${L.depositDesc}<br><span style="color:var(--mute);font-size:12px;display:block;margin-top:5px">$${fmtPrice(deposit)} ${cur}</span></div></div>
      <div class="term-item"><div class="t-label">${L.balance}</div><div class="t-val"><b>${100-d.depositPct}%</b> ${L.balanceDesc}<br><span style="color:var(--mute);font-size:12px;display:block;margin-top:5px">$${fmtPrice(balance)} ${cur}</span></div></div>
      ${notesItem}
    </div>
  </div></section>
  ${imgBand('terms')}
  ${gallerySection}
  ${formsSection}
  <section style="padding-bottom:clamp(72px,12vh,140px)"><div class="wrap">
    <div class="sec-eyebrow reveal">${L.next}</div>
    <h2 class="cta-lead reveal">${L.cta}</h2>
    <div class="cta-actions reveal">
      <a class="btn" href="mailto:Produccion@5hift.com.mx?subject=${encodeURIComponent('APPROVED: ' + (d.company||d.client) + ' — ' + d.title)}&body=${encodeURIComponent(es ? 'Aprobamos la propuesta. Siguiente paso por favor.' : 'We approve this proposal. Please send the next steps.')}">${L.approve} <span class="arr">→</span></a>
      <a class="btn btn-ghost" href="https://wa.me/13463327077?text=${encodeURIComponent((es ? 'Hola SHIFT, tengo preguntas sobre la propuesta: ' : 'Hi SHIFT, I have questions about the proposal: ') + d.title)}" target="_blank" rel="noopener">${es ? 'Preguntas · WhatsApp' : 'Questions · WhatsApp'}</a>
    </div>
    <p class="cta-note reveal">${es ? 'Al aprobar, te enviamos el contrato y la factura del anticipo el mismo día. Tu fecha queda bloqueada al recibir el depósito.' : 'Once you approve, we send the contract and deposit invoice the same day. Your date is locked in when the deposit lands.'}</p>
    <div class="contact-block reveal"><b>SHIFT</b><br>Edwin · Produccion@5hift.com.mx<br>Houston, TX</div>
  </div></section>
</main>
<footer><div class="wrap">
  <a href="https://shiftevnts.com/SHIFT_proposals_hub.html" class="fmark"><img src="${SHIFT_ICON_URI}" alt=""/><span>SHIFT</span></a>
  <small>${esc(d.client)}${d.company?' · '+esc(d.company):''}${d.city?' · '+esc(d.city):''}</small>
</div></footer>
<script>
const EXPIRY='${d.expiryDate||addDaysISO(30)}';
(function(){const ex=new Date(EXPIRY+'T23:59:59'),now=new Date(),dl=Math.ceil((ex-now)/864e5);
const fmt=ex.toLocaleDateString('${L.dateLocale}',{year:'numeric',month:'long',day:'numeric'});
if(now>ex){document.getElementById('expired-overlay').style.display='flex';document.body.style.overflow='hidden';}
else{const b=document.getElementById('expiry-badge'),t=document.getElementById('expiry-badge-text');
if(dl<=7){b.classList.add('expiring');t.textContent='${L.expiresIn} '+dl+' ${L.days}';}
else t.textContent='${L.active} · ${L.validUntil} '+fmt;}})();
(function(){const c=document.getElementById('bg-canvas');if(!c)return;const ctx=c.getContext('2d');
const C=52,R=30,RW=.52,RH=1.5,BO=.022,PO=.09,RAD=170,SP=.10,DM=.72,IA=.025,IS=.22;
let W,H,rects=[],mx=-9999,my=-9999,tx=-9999,ty=-9999,t0=performance.now();
function build(){W=c.width=window.innerWidth;H=c.height=window.innerHeight;const cw=W/C,ch=H/R;rects=[];
for(let r=0;r<R;r++)for(let col=0;col<C;col++)rects.push({x:(col+.5)*cw,y:(r+.5)*ch,w:cw*RW,ang:0,vel:0,phase:col*.31+r*.47});}
function loop(){requestAnimationFrame(loop);const t=(performance.now()-t0)*.001;mx+=(tx-mx)*.09;my+=(ty-my)*.09;ctx.clearRect(0,0,W,H);
for(const rec of rects){const dx=rec.x-mx,dy=rec.y-my,d=Math.sqrt(dx*dx+dy*dy),inf=Math.max(0,1-d/RAD),fall=inf*inf*inf;
let tg=fall>.005?Math.atan2(dy,dx):Math.sin(t*IS+rec.phase)*IA;
let df=tg-rec.ang;df=Math.atan2(Math.sin(df),Math.cos(df));rec.vel+=df*SP*(fall>.005?1:.15);rec.vel*=DM;rec.ang+=rec.vel;
const op=BO+fall*(PO-BO);ctx.save();ctx.translate(rec.x,rec.y);ctx.rotate(rec.ang);ctx.fillStyle='rgba(255,255,255,'+op.toFixed(4)+')';ctx.fillRect(-rec.w*.5,-RH*.5,rec.w,RH);ctx.restore();}}
document.addEventListener('mousemove',e=>{tx=e.clientX;ty=e.clientY;});document.addEventListener('mouseleave',()=>{tx=-9999;ty=-9999;});
window.addEventListener('resize',build,{passive:true});build();loop();})();
// Two print modes: stripped light reference (default) vs full visual with
// hero + all images. The class survives auto-print from the manager too.
function setPrintMode(full){document.documentElement.classList.toggle('print-full',!!full);window.print();}
// Custom cursor removed 2026-07-02 — kept motion subtle so clients aren't
// distracted; the canvas field above fades in late and reacts gently instead.
(function(){const io=new IntersectionObserver(e=>e.forEach(x=>{if(x.isIntersecting){x.target.classList.add('in');io.unobserve(x.target);}}),{threshold:.1,rootMargin:'0px 0px -6% 0px'});document.querySelectorAll('.reveal').forEach((el,i)=>{el.style.transitionDelay=i%5*90+'ms';io.observe(el);});})();
// Reveal everything before printing so no section is blank in the PDF.
window.addEventListener('beforeprint',()=>document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in')));
<\/script>
</body></html>`;
}

// ── INVOICE HTML TEMPLATE ────────────────────────────────────
function generateInvoiceHTML(d) {
  const es = d.lang === 'es';
  const fmtDate = iso => {
    if (!iso) return '';
    const dt = new Date(iso + 'T12:00:00');
    return dt.toLocaleDateString(es ? 'es-MX' : 'en-US', {year:'numeric',month:'long',day:'numeric'});
  };
  const itemRows = d.items.map(item => `
    <tr>
      <td style="padding:14px 0;border-bottom:1px solid #1e1e22;font-size:14px;color:#f2f2f4;line-height:1.4">${esc(item.desc)}</td>
      <td style="padding:14px 0;border-bottom:1px solid #1e1e22;font-size:14px;color:#8a8a96;text-align:center">${item.qty}</td>
      <td style="padding:14px 0;border-bottom:1px solid #1e1e22;font-size:14px;color:#8a8a96;text-align:right">$${fmtPrice(item.unitPrice)}</td>
      <td style="padding:14px 0;border-bottom:1px solid #1e1e22;font-family:'Sora',sans-serif;font-weight:700;font-size:15px;color:#f2f2f4;text-align:right;white-space:nowrap">$${fmtPrice(item.amount)}</td>
    </tr>`).join('');

  const taxRow = d.taxPct > 0 ? `
    <tr><td colspan="3" style="padding:10px 0;text-align:right;font-size:12px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;color:#545460">Tax (${d.taxPct}%)</td>
    <td style="padding:10px 0;text-align:right;font-size:14px;color:#f2f2f4">$${fmtPrice(d.taxAmt)}</td></tr>` : '';

  return `<!DOCTYPE html>
<html lang="${d.lang}">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>SHIFT ${es?'Factura':'Invoice'} ${esc(d.invoiceNum)} — ${esc(d.client)}</title>
<link rel="icon" type="image/svg+xml" href="${SHIFT_ICON_URI}">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0b;color:#f2f2f4;font-family:'Inter',system-ui,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased;min-height:100vh;display:flex;flex-direction:column}
${SHIFT_BRAND_FONT_CSS}
.page{max-width:820px;width:100%;margin:0 auto;padding:clamp(40px,6vw,80px) clamp(24px,5vw,64px);flex:1;display:flex;flex-direction:column}
.inv-header{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;margin-bottom:clamp(40px,6vw,72px);flex-wrap:wrap}
.inv-logo{display:flex;align-items:center;gap:10px}
.inv-logo img{height:28px;filter:brightness(0)invert(1)}
.inv-logo span{font-family:'SHIFTBrand',sans-serif;font-size:22px;line-height:1;color:#f2f2f4;letter-spacing:.5em}
.inv-num-block{text-align:right}
.inv-word{font-family:'Sora',sans-serif;font-weight:800;font-size:clamp(24px,4vw,40px);letter-spacing:-.03em;color:#f2f2f4}
.inv-num{font-size:13px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;color:#545460;margin-top:4px}
.inv-meta{display:grid;grid-template-columns:1fr 1fr;gap:2px;background:#1e1e22;margin-bottom:clamp(32px,5vw,56px)}
.inv-meta-cell{background:#111114;padding:18px 22px}
.inv-meta-label{font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:#545460;margin-bottom:7px}
.inv-meta-val{font-size:14px;color:#f2f2f4;line-height:1.5}
.inv-meta-val b{font-family:'Sora',sans-serif;font-weight:700}
@media(max-width:560px){.inv-meta{grid-template-columns:1fr}}
table{width:100%;border-collapse:collapse}
thead th{font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:#545460;padding:0 0 12px;text-align:left;border-bottom:1px solid #1e1e22}
thead th:not(:first-child){text-align:right}
.inv-total-section{margin-top:24px;display:flex;justify-content:flex-end}
.inv-total-box{min-width:260px}
.inv-total-row{display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid #161619;font-size:13px;color:#8a8a96}
.inv-total-row:last-child{border-bottom:none;border-top:1px solid #f2f2f4;padding-top:14px;margin-top:6px}
.inv-total-row.final .label{font-family:'Sora',sans-serif;font-size:14px;font-weight:600;letter-spacing:.1em;text-transform:uppercase;color:#f2f2f4}
.inv-total-row.final .val{font-family:'Sora',sans-serif;font-weight:800;font-size:clamp(22px,3.5vw,32px);color:#f2f2f4}
.inv-payment{margin-top:clamp(32px,5vw,56px);border-top:1px solid #1e1e22;padding-top:clamp(24px,4vw,40px)}
.inv-payment-label{font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:#545460;margin-bottom:10px}
.inv-payment-body{font-size:13.5px;color:#8a8a96;line-height:1.75;white-space:pre-wrap}
.inv-notes{margin-top:28px;font-size:13px;color:#545460;line-height:1.65;white-space:pre-wrap}
.inv-footer{margin-top:auto;padding-top:clamp(32px,4vw,56px);padding-bottom:0;border-top:1px solid #161619;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px}
.inv-footer-logo{display:flex;align-items:center;gap:9px}
.inv-footer-logo img{height:18px;filter:brightness(0)invert(1);opacity:.4}
.inv-footer-logo span{font-family:'SHIFTBrand',sans-serif;font-size:14px;color:#545460;letter-spacing:.5em}
.inv-footer small{font-size:11px;letter-spacing:.16em;text-transform:uppercase;color:#444}
@media print{body{background:#fff;color:#111;display:block}
.page{display:block}
.inv-logo img{filter:brightness(0)!important}
.inv-word,.inv-meta-val,.inv-total-row.final .val,.inv-total-row.final .label{color:#111!important}
.inv-meta{background:#ccc!important}.inv-meta-cell{background:#f5f5f5!important}
.inv-meta-label,.inv-num,.inv-meta-val b,.inv-payment-label,.thead th{color:#888!important}
.inv-meta-val,.inv-payment-body,.inv-notes{color:#444!important}
table thead th{border-bottom-color:#ccc!important}tr td{border-bottom-color:#eee!important}
.inv-total-box .inv-total-row{border-bottom-color:#eee!important}.inv-total-row.final{border-top-color:#111!important}
.inv-footer,.inv-payment,.inv-total-section{border-color:#ddd!important}
.inv-footer-logo span,.inv-footer small{color:#999!important}
.inv-footer-logo img{opacity:.6!important}}
</style>
</head>
<body>
<div class="page">
  <div class="inv-header">
    <div class="inv-logo"><img src="${SHIFT_ICON_URI}" alt=""/><span>SHIFT</span></div>
    <div class="inv-num-block">
      <div class="inv-word">${es?'Factura':'Invoice'}</div>
      <div class="inv-num">${esc(d.invoiceNum)}</div>
    </div>
  </div>

  <div class="inv-meta">
    <div class="inv-meta-cell">
      <div class="inv-meta-label">${es?'Facturar a':'Bill To'}</div>
      <div class="inv-meta-val"><b>${esc(d.client)}</b>${d.company?'<br>'+esc(d.company):''}${d.addr?'<br>'+esc(d.addr):''}${d.city?'<br>'+esc(d.city):''}${d.country?'<br>'+esc(d.country):''}${d.email?'<br><span style="color:#8a8a96">'+esc(d.email)+'</span>':''}</div>
    </div>
    <div class="inv-meta-cell">
      <div class="inv-meta-label">${es?'De':'From'}</div>
      <div class="inv-meta-val"><b>Shift Events LLC</b><br>17350 State Hwy 249, Ste 220 #24547<br>Houston, Texas 77064<br><span style="color:#8a8a96">+1 (346) 332-7077</span></div>
    </div>
    <div class="inv-meta-cell">
      <div class="inv-meta-label">${es?'Fecha de Emisión':'Invoice Date'}</div>
      <div class="inv-meta-val">${fmtDate(d.date)||'—'}</div>
    </div>
    <div class="inv-meta-cell">
      <div class="inv-meta-label">${es?'Fecha de Vencimiento':'Due Date'}</div>
      <div class="inv-meta-val" style="color:#c8a84b"><b>${fmtDate(d.dueDate)||'—'}</b></div>
    </div>
  </div>

  <table>
    <thead>
      <tr>
        <th style="text-align:left;width:46%">${es?'Descripción':'Description'}</th>
        <th style="width:14%">${es?'Cant.':'Qty'}</th>
        <th style="width:20%">${es?'Precio Unit.':'Unit Price'}</th>
        <th style="width:20%">${es?'Monto':'Amount'}</th>
      </tr>
    </thead>
    <tbody>${itemRows}</tbody>
  </table>

  <div class="inv-total-section">
    <div class="inv-total-box">
      <div class="inv-total-row"><span>${es?'Subtotal':'Subtotal'}</span><span>$${fmtPrice(d.subtotal)}</span></div>
      ${taxRow}
      <div class="inv-total-row final"><span class="label">${es?'Total a Pagar':'Total Due'}</span><span class="val">$${fmtPrice(d.total)} <span style="font-size:.45em;font-weight:400;color:#8a8a96;vertical-align:middle">USD</span></span></div>
    </div>
  </div>

  ${d.payment?`<div class="inv-payment"><div class="inv-payment-label">${es?'Información de Pago':'Payment Information'}</div><div class="inv-payment-body">${esc(d.payment)}</div></div>`:''}
  ${d.notes?`<div class="inv-notes">${esc(d.notes)}</div>`:''}

  <div class="inv-footer">
    <div class="inv-footer-logo"><img src="${SHIFT_ICON_URI}" alt=""/><span>SHIFT</span></div>
    <small>+1 (346) 332-7077 · Houston, Texas 77064</small>
  </div>
</div>
</body></html>`;
}

// ── EVENT SHEET / BEO TEMPLATE ───────────────────────────────
// One or many events → a presentation-style sheet: cover block per event,
// schedule, venue, POC, services, staff & shifts, links, notes.
// Screen = dark brand; print = clean light reference, one event per page.
// crew=true strips every price — the version you hand PMs, stagehands and
// techs. Elements are organized into departments like a rental pull sheet.
function generateEventSheetHTML(events, crew) {

  // Classify a line into a department (big-company pull-sheet style)
  const DEPTS = [
    { id: 'Audio / DJ',        re: /audio|sound|speaker|\bpa\b|\bdj\b|mic|console|subwoofer|monitor|cdj|djm|playback|line array|serato/i },
    { id: 'Lighting',          re: /light|beam|wash|laser|uplight|dmx|haze|spark|robe|claypaky|\bpar\b|follow spot/i },
    { id: 'Video / LED',       re: /video|\bled\b|pixel|projector|screen|\btv\b|visual|wall/i },
    { id: 'Staging / Rigging', re: /stage|truss|rig|pipe|drape|riser|totem/i },
    { id: 'Power',             re: /power|generator|distro|distribution|\b30a\b|\b220v\b/i },
    { id: 'Crew / Personnel',  re: /personnel|crew|technician|engineer|operator|labor|stagehand|escort/i },
  ];
  const deptFor = t => (DEPTS.find(d => d.re.test(t)) || { id: 'Production / Other' }).id;
  const one = events.length === 1;
  const client = events[0]?.client || '';
  const docTitle = one
    ? `SHIFT Event Sheet — ${events[0].title}`
    : `SHIFT Event Pack — ${client || 'Events'} — ${events.length} Events`;
  const fmtCur = (v,c) => '$' + fmtPrice(v) + (c && c !== 'USD' ? ' ' + c : '');
  const DOW = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

  const evSection = ev => {
    const dt = ev.date ? new Date(ev.date + 'T12:00:00') : null;
    const dateLong = dt ? `${DOW[dt.getDay()]}, ${MONTHS[dt.getMonth()]} ${dt.getDate()}, ${dt.getFullYear()}` : '—';
    const dayNum = dt ? dt.getDate() : '—';
    const monShort = dt ? MONTHS[dt.getMonth()].slice(0,3).toUpperCase() : '';
    const svcs = ev.services || [];
    const byCur = {};
    svcs.forEach(s => { const c = s.currency||'USD'; byCur[c] = (byCur[c]||0) + (s.price||0); });
    const totalStr = Object.entries(byCur).filter(([,v])=>v>0).map(([c,v])=>fmtCur(v,c)).join(' + ');
    // Money table: only priced lines (PM view; hidden entirely on crew sheets)
    const priced = svcs.filter(s => (s.price||0) > 0);
    const svcRows = priced.map(s => `<tr><td>${esc(s.name)}</td><td class="num">${fmtCur(s.price,s.currency)}</td></tr>`).join('');
    // Department pull list: every element, one row each, grouped by dept
    const deptMap = {};
    const pushRow = (dept, txt) => { (deptMap[dept] = deptMap[dept] || []).push(txt); };
    svcs.forEach(s => {
      const n = (s.name||'').trim();
      if (!n) return;
      const detail = n.startsWith('· ');
      const body = detail ? n.slice(2) : n;
      const gm = body.match(/^([^:]{2,40}):\s*(.+)$/);
      if (detail && gm) {
        const dept = deptFor(gm[1]) !== 'Production / Other' ? deptFor(gm[1]) : deptFor(gm[2]);
        gm[2].split(/,\s(?![^()]*\))/).forEach(el => pushRow(dept, el.trim()));
      } else if (detail) {
        pushRow(deptFor(body), body);
      } else if (!(s.price||0)) {
        pushRow(deptFor(body), body);
      }
    });
    const deptOrder = ['Audio / DJ','Lighting','Video / LED','Staging / Rigging','Power','Crew / Personnel','Production / Other'];
    const deptHTML = deptOrder.filter(d => deptMap[d] && deptMap[d].length).map(d => `
    <div class="es-dept">
      <div class="es-dept-hd">${d}</div>
      ${deptMap[d].map(el => `<div class="es-pull"><span class="chk">☐</span><span>${esc(el)}</span></div>`).join('')}
    </div>`).join('');
    const staff = ev.staff || [];
    const staffRows = staff.map(s => `<tr><td>${esc(s.name)}</td><td>${esc(s.role||'—')}</td><td>${esc(s.phone||'—')}</td><td class="num">${s.callTime||'—'}</td><td class="num">${s.outTime||'—'}</td></tr>`).join('');
    const links = ev.links || [];
    const linkRows = links.map(l => `<div class="es-link"><span class="es-link-lbl">${esc(l.label)}</span><a href="${esc(l.url)}" target="_blank" rel="noopener">${esc(l.url)}</a></div>`).join('');
    const mapsUrl = ev.venue ? 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent(ev.venue) : '';
    return `
<section class="ev-page">
  <header class="es-cover">
    <div class="es-date-block"><div class="es-day">${dayNum}</div><div class="es-mon">${monShort}</div></div>
    <div class="es-cover-main">
      <div class="es-eyebrow">${esc(ev.client || '')}${ev.type ? ' · ' + esc(ev.type.toUpperCase()) : ''}</div>
      <h1 class="es-title">${esc(ev.title)}</h1>
      <div class="es-cover-meta">
        <span>${dateLong}</span>
        ${ev.startTime ? `<span>⏱ ${ev.startTime}${ev.endTime ? ' – ' + ev.endTime : ''}</span>` : ''}
      </div>
    </div>
  </header>
  <div class="es-grid">
    <div class="es-cell"><div class="es-lbl">Venue</div><div class="es-val">${ev.venue ? `${esc(ev.venue)}${mapsUrl ? `<br><a class="es-maps" href="${mapsUrl}" target="_blank" rel="noopener">Open in Google Maps ↗</a>` : ''}` : '—'}</div></div>
    <div class="es-cell"><div class="es-lbl">Schedule</div><div class="es-val">${ev.startTime ? `Start <b>${ev.startTime}</b>` : 'Start —'}<br>${ev.endTime ? `End <b>${ev.endTime}</b>` : 'End —'}</div></div>
    <div class="es-cell"><div class="es-lbl">POC — On-site Contact</div><div class="es-val">${ev.pocName ? `<b>${esc(ev.pocName)}</b>${ev.pocPhone ? '<br>' + esc(ev.pocPhone) : ''}` : '—'}</div></div>
  </div>
  ${priced.length ? `
  <div class="es-sec es-money">
    <div class="es-sec-lbl">Services &amp; Investment</div>
    <table class="es-table"><thead><tr><th>Service</th><th class="num">Amount</th></tr></thead>
    <tbody>${svcRows}</tbody>
    ${totalStr ? `<tfoot><tr><td>Total</td><td class="num">${totalStr}</td></tr></tfoot>` : ''}</table>
  </div>` : ''}
  ${deptHTML ? `
  <div class="es-sec">
    <div class="es-sec-lbl">Pull Sheet — by Department</div>
    <div class="es-depts">${deptHTML}</div>
  </div>` : ''}
  ${staff.length ? `
  <div class="es-sec">
    <div class="es-sec-lbl">Staff &amp; Shifts</div>
    <table class="es-table"><thead><tr><th>Name</th><th>Role</th><th>Contact</th><th class="num">Call</th><th class="num">Out</th></tr></thead>
    <tbody>${staffRows}</tbody></table>
  </div>` : ''}
  ${links.length ? `
  <div class="es-sec">
    <div class="es-sec-lbl">Documents &amp; Links (BEO, run of show…)</div>
    ${linkRows}
  </div>` : ''}
  ${ev.notes ? `
  <div class="es-sec">
    <div class="es-sec-lbl">Notes &amp; Logistics</div>
    <div class="es-notes">${esc(ev.notes)}</div>
  </div>` : ''}
</section>`;
  };

  return `<!DOCTYPE html>
<html lang="en"${crew ? ' class="no-prices"' : ''}><head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0">
<title>${esc(docTitle)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
:root{--bg:#0a0a0b;--panel:#111114;--line:#1e1e22;--line-soft:#161619;--white:#f2f2f4;--mute:#8a8a96;--dim:#545460;--gold:#c8a84b}
*{box-sizing:border-box;margin:0;padding:0}
body{background:var(--bg);color:var(--white);font-family:'Inter',system-ui,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased}
.doc-hd{max-width:900px;margin:0 auto;padding:34px 32px 0;display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap}
.doc-hd .brand{display:flex;align-items:center;gap:11px}
.doc-hd img{height:22px;filter:brightness(0)invert(1)}
.doc-hd .brand span{font-family:'Sora',sans-serif;font-weight:800;font-size:17px;letter-spacing:.45em}
.doc-hd small{font-size:10px;font-weight:600;letter-spacing:.22em;text-transform:uppercase;color:var(--dim)}
.ev-page{max-width:900px;margin:0 auto;padding:38px 32px 52px;border-bottom:1px solid var(--line)}
.ev-page:last-of-type{border-bottom:none}
.es-cover{display:flex;gap:26px;align-items:center;border-bottom:1px solid var(--line);padding-bottom:26px;margin-bottom:26px}
.es-date-block{flex:none;width:92px;text-align:center;border:1px solid var(--line);padding:14px 8px;background:var(--panel)}
.es-day{font-family:'Sora',sans-serif;font-weight:800;font-size:38px;line-height:1}
.es-mon{font-size:11px;font-weight:600;letter-spacing:.3em;color:var(--gold);margin-top:5px}
.es-eyebrow{font-size:10.5px;font-weight:600;letter-spacing:.24em;text-transform:uppercase;color:var(--gold);margin-bottom:8px}
.es-title{font-family:'Sora',sans-serif;font-weight:800;font-size:clamp(22px,4vw,34px);letter-spacing:-.02em;line-height:1.08}
.es-cover-meta{display:flex;gap:20px;flex-wrap:wrap;margin-top:10px;font-size:13px;color:var(--mute)}
.es-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));gap:1px;background:var(--line);border:1px solid var(--line);margin-bottom:26px}
.es-cell{background:var(--panel);padding:16px 18px}
.es-lbl{font-size:9.5px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--dim);margin-bottom:8px}
.es-val{font-size:13.5px;color:var(--mute);line-height:1.7}
.es-val b{color:var(--white);font-weight:600}
.es-maps{color:var(--gold);text-decoration:none;font-size:12px}
.es-sec{margin-bottom:26px}
.es-sec-lbl{font-size:9.5px;font-weight:700;letter-spacing:.22em;text-transform:uppercase;color:var(--dim);margin-bottom:12px;border-bottom:1px solid var(--line-soft);padding-bottom:8px}
.es-table{width:100%;border-collapse:collapse;font-size:13px}
.es-table th{text-align:left;font-size:9.5px;font-weight:700;letter-spacing:.18em;text-transform:uppercase;color:var(--dim);padding:8px 10px 8px 0;border-bottom:1px solid var(--line)}
.es-table td{padding:9px 10px 9px 0;border-bottom:1px solid var(--line-soft);color:var(--mute)}
.es-table td:first-child{color:var(--white)}
.es-table .num{text-align:right}
.es-table .chk{width:26px;color:var(--dim);font-size:14px}
.es-depts{display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:22px}
.es-dept{break-inside:avoid}
.es-dept-hd{font-size:10px;font-weight:800;letter-spacing:.26em;text-transform:uppercase;color:var(--gold);border-bottom:1px solid var(--line);padding-bottom:7px;margin-bottom:6px}
.es-pull{display:flex;gap:10px;align-items:baseline;font-size:12.5px;color:var(--mute);padding:5px 0;border-bottom:1px solid var(--line-soft)}
.es-pull .chk{color:var(--dim);font-size:13px}
html.no-prices .es-money{display:none!important}
.es-table tfoot td{border-top:1px solid var(--white);border-bottom:none;font-weight:700;color:var(--white);font-family:'Sora',sans-serif}
.es-link{display:flex;gap:14px;align-items:baseline;padding:7px 0;border-bottom:1px solid var(--line-soft);font-size:12.5px;flex-wrap:wrap}
.es-link-lbl{flex:0 0 160px;color:var(--white);font-weight:600}
.es-link a{color:var(--mute);text-decoration:none;word-break:break-all}
.es-link a:hover{color:var(--gold)}
.es-notes{font-size:13px;color:var(--mute);line-height:1.75;white-space:pre-wrap}
.doc-ft{max-width:900px;margin:0 auto;padding:26px 32px 44px;display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;font-size:10px;letter-spacing:.18em;text-transform:uppercase;color:var(--dim)}
.print-btn{position:fixed;top:18px;right:18px;background:var(--white);color:#111;border:none;font-family:'Inter',sans-serif;font-size:10.5px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;padding:11px 18px;cursor:pointer}
@media print{
  .print-btn{display:none!important}
  :root{--bg:#fff;--panel:#f7f7f7;--line:#ddd;--line-soft:#eee;--white:#111;--mute:#444;--dim:#777;--gold:#8a6d1d}
  body{background:#fff;color:#111}
  .doc-hd img{filter:brightness(0)}
  .ev-page{page-break-after:always;border-bottom:none;padding-top:28px}
  .ev-page:last-of-type{page-break-after:auto}
  .es-table tfoot td{border-top-color:#111}
  .es-cell{border:1px solid #e5e5e5}
  a{color:#444!important}
}
</style></head>
<body>
<div class="doc-hd">
  <div class="brand"><img src="${SHIFT_ICON_URI}" alt=""/><span>SHIFT</span></div>
  <small>${one ? 'Event Sheet' : 'Event Pack · ' + events.length + ' events'}${client ? ' · ' + esc(client) : ''}</small>
</div>
<button class="print-btn" onclick="document.documentElement.classList.remove('no-prices');window.print()">↓ PDF</button>
<button class="print-btn" style="right:110px;background:transparent;color:var(--gold,#c8a84b);border:1px solid var(--gold,#c8a84b)" title="No prices — for PMs, stagehands and techs" onclick="document.documentElement.classList.add('no-prices');window.print()">👷 Crew PDF</button>
${events.map(evSection).join('')}
<div class="doc-ft"><span>SHIFT · Event Production</span><span>Produccion@5hift.com.mx · Houston, TX</span></div>
</body></html>`;
}
