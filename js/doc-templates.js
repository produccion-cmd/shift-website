// SHIFT Manager — document HTML templates.
// Extracted from manager_v2.html (2026-07-02) so template edits cannot
// break the app shell. Loaded by manager_v2.html BEFORE the main script;
// depends on globals defined there (esc, fmtPrice, ...) at call time only.

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
<link rel="icon" type="image/svg+xml" href="SHIFT-ICON.svg">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0b;color:#d4d4d8;font-family:'Inter',system-ui,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased;min-height:100vh;display:flex;flex-direction:column}
@font-face{font-family:'SHIFTBrand';src:url('fonts/shift-brand.woff2') format('woff2'),url('fonts/shift-brand.woff') format('woff');font-display:swap}
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
    <div class="ctr-logo"><img src="SHIFT-ICON.svg" alt=""/><span>SHIFT</span></div>
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
    <div class="ctr-footer-logo"><img src="SHIFT-ICON.svg" alt=""/><span>SHIFT</span></div>
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
<link rel="icon" type="image/svg+xml" href="SHIFT-ICON.svg">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
:root{--bg:#0a0a0b;--panel:#111114;--line:#1e1e22;--line-soft:#161619;--white:#f2f2f4;--mute:#8a8a96;--dim:#545460;--gold:#c8a84b;--maxw:1100px}
@font-face{font-family:'SHIFTBrand';src:url('fonts/shift-brand.woff2') format('woff2'),url('fonts/shift-brand.woff') format('woff');font-display:swap}
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
  <img src="SHIFT-ICON.svg" alt="" style="height:40px;filter:brightness(0)invert(1);opacity:.3;margin-bottom:22px"/>
  <div style="font-size:11px;font-weight:600;letter-spacing:.28em;text-transform:uppercase;color:var(--dim);margin-bottom:16px">${L.expired}</div>
  <h2 style="font-family:'Sora',sans-serif;font-weight:700;font-size:clamp(24px,5vw,44px);letter-spacing:-.02em;margin-bottom:16px">${L.expiredBody}</h2>
  <p style="font-size:14px;color:var(--mute);max-width:38ch;line-height:1.65">Contacta a SHIFT para una propuesta actualizada.</p>
  <a href="mailto:Produccion@5hift.com.mx" style="display:inline-flex;align-items:center;gap:12px;margin-top:32px;padding:15px 30px;border:1px solid var(--white);color:var(--white);text-decoration:none;font-family:'Sora',sans-serif;font-weight:600;font-size:13px">${L.contact}</a>
</div>
<nav>
  <a href="SHIFT_proposals_hub.html" class="nav-logo"><img src="SHIFT-ICON.svg" alt=""/><span>SHIFT</span></a>
  <div class="nav-actions">
    <button type="button" class="back" onclick="setPrintMode(false)">${L.pdf}</button>
    <button type="button" class="back" onclick="setPrintMode(true)" title="${es ? 'Imprime con imágenes y el diseño completo — activa Gráficos de fondo en el diálogo' : 'Prints with images and the full look — enable Background graphics in the dialog'}">${es ? 'PDF Completo' : 'Full PDF'}</button>
    <a href="SHIFT_proposals_hub.html" class="back">${L.back}</a>
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
  <a href="SHIFT_proposals_hub.html" class="fmark"><img src="SHIFT-ICON.svg" alt=""/><span>SHIFT</span></a>
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
<link rel="icon" type="image/svg+xml" href="SHIFT-ICON.svg">
<link href="https://fonts.googleapis.com/css2?family=Sora:wght@300;400;600;700;800&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
<style>
*{box-sizing:border-box;margin:0;padding:0}
body{background:#0a0a0b;color:#f2f2f4;font-family:'Inter',system-ui,sans-serif;line-height:1.6;-webkit-font-smoothing:antialiased;min-height:100vh;display:flex;flex-direction:column}
@font-face{font-family:'SHIFTBrand';src:url('fonts/shift-brand.woff2') format('woff2'),url('fonts/shift-brand.woff') format('woff');font-display:swap}
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
    <div class="inv-logo"><img src="SHIFT-ICON.svg" alt=""/><span>SHIFT</span></div>
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
    <div class="inv-footer-logo"><img src="SHIFT-ICON.svg" alt=""/><span>SHIFT</span></div>
    <small>+1 (346) 332-7077 · Houston, Texas 77064</small>
  </div>
</div>
</body></html>`;
}

// ── EVENT SHEET / BEO TEMPLATE ───────────────────────────────
// One or many events → a presentation-style sheet: cover block per event,
// schedule, venue, POC, services, staff & shifts, links, notes.
// Screen = dark brand; print = clean light reference, one event per page.
function generateEventSheetHTML(events) {
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
    const svcRows = svcs.map(s => `<tr><td class="chk">☐</td><td>${esc(s.name)}</td><td class="num">${s.price?fmtCur(s.price,s.currency):'—'}</td></tr>`).join('');
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
  ${svcs.length ? `
  <div class="es-sec">
    <div class="es-sec-lbl">Services &amp; Pack List</div>
    <table class="es-table"><thead><tr><th class="chk"></th><th>Service / Equipment</th><th class="num">Amount</th></tr></thead>
    <tbody>${svcRows}</tbody>
    ${totalStr ? `<tfoot><tr><td class="chk"></td><td>Total</td><td class="num">${totalStr}</td></tr></tfoot>` : ''}</table>
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
<html lang="en"><head>
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
  <div class="brand"><img src="https://shiftevnts.com/SHIFT-ICON.svg" alt=""/><span>SHIFT</span></div>
  <small>${one ? 'Event Sheet' : 'Event Pack · ' + events.length + ' events'}${client ? ' · ' + esc(client) : ''}</small>
</div>
<button class="print-btn" onclick="window.print()">↓ Save PDF</button>
${events.map(evSection).join('')}
<div class="doc-ft"><span>SHIFT · Event Production</span><span>Produccion@5hift.com.mx · Houston, TX</span></div>
</body></html>`;
}
