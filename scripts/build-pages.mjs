// Generates every inner page (and syncs the shared header/footer into index.html).
// Run: node scripts/build-pages.mjs   (also runs automatically before `npm run build`)
import fs from 'fs';
import path from 'path';
import { SITE, SERVICES, TEAMS, PEOPLE, ROLES, CASES, REVIEWS } from './content.mjs';

const ROOT = path.resolve(import.meta.dirname, '..');
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const pad = (n) => String(n).padStart(2, '0');
const svg = (p, s = 26) => `<svg viewBox="0 0 24 24" width="${s}" height="${s}" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${p}</svg>`;
const h2 = (a, b, tag = 'h2') => `<${tag} class="split">${esc(a)} <span class="serif"><em>${esc(b)}</em></span></${tag}>`;
const PASTELS = ['#ffdf99', '#c6e8e8', '#d4d4ff', '#ffc4a6', '#e4f222', '#fffdf6'];
const initials = (n) => n.split(' ').map((w) => w[0]).join('').slice(0, 2);
const svcUrl = (s) => `services/${s.slug}.html`;

/* ---------- page registry ---------- */
const NAV = [
  ['Technology', 'technology.html'], ['Why Us', 'why-us.html'], ['Our Experts', 'our-experts.html'], ['Careers', 'careers.html'],
  ['How It Works', 'how-it-works.html'], ['Pricing', 'pricing.html'], ['Results', 'results.html'], ['Contact', 'contact.html'],
];
const LEGAL = [['Company information', 'legal/company-information.html'], ['Privacy', 'legal/privacy.html'], ['Security', 'legal/security.html'], ['Complaints', 'legal/complaints.html']];

/* ---------- shared partials ---------- */
function head({ title, desc, theme = 'dark' }) {
  return `<!doctype html>
<html lang="en" data-theme="${theme}">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${esc(title)} | KKS Insurance Services</title>
  <meta name="description" content="${esc(desc)}" />
  <meta property="og:title" content="${esc(title)} | KKS Insurance Services" />
  <meta property="og:description" content="${esc(desc)}" />
  <meta name="theme-color" content="#12121a" />
  <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Geist:wght@300..700&family=Geist+Mono:wght@400;500&family=Instrument+Serif:ital@0;1&display=swap" rel="stylesheet" />
</head>`;
}

function svcLinks(b, cur) {
  return SERVICES.map((s, i) => `<a href="${b}${svcUrl(s)}"${cur === s.slug ? ' aria-current="page"' : ''}><i aria-hidden="true">${pad(i + 1)}</i>${esc(s.short || s.name)}</a>`).join('');
}

function header(b, cur, home = false) {
  const homeHref = home ? '#top' : `${b}index.html`;
  const item = ([n, u]) => `<li><a href="${b}${u}"${cur === u ? ' aria-current="page"' : ''}>${n}</a></li>`;
  const curSvc = cur.startsWith('services/') ? cur.slice(9, -5) : '';
  return `<header class="site-header" id="header">
    <div class="wrap header-inner">
      <a href="${homeHref}" class="brand" aria-label="KKS Insurance Services home">
        <span class="mark" aria-hidden="true">K</span>
        <span class="wm"><b>KKS</b><small>Insurance Services</small></span>
      </a>
      <nav class="main-nav" aria-label="Primary">
        <ul>
          <li><a href="${homeHref}"${home ? ' aria-current="page"' : ''}>Home</a></li>
          <li class="has-drop">
            <button class="drop-btn${curSvc ? ' is-cur' : ''}" aria-expanded="false" aria-controls="svc-menu">Services <span class="chev" aria-hidden="true">▾</span></button>
            <div class="dropdown" id="svc-menu"><p class="mono">9 service lines</p><div class="drop-grid">${svcLinks(b, curSvc)}</div></div>
          </li>
          ${NAV.map(item).join('\n          ')}
        </ul>
      </nav>
      <a class="phone" href="tel:${SITE.tel}"><span class="dot" aria-hidden="true"></span>${SITE.phone}</a>
      <button class="burger" aria-label="Open menu" aria-expanded="false" aria-controls="mobile-menu"><span></span><span></span></button>
    </div>
    <div class="mobile-menu" id="mobile-menu" hidden>
      <ul>
        <li><a href="${homeHref}">Home</a></li>
        <li>
          <button class="m-drop-btn" aria-expanded="false" aria-controls="m-svc">Services <span aria-hidden="true">▾</span></button>
          <div class="m-svc" id="m-svc" hidden>${svcLinks(b, curSvc)}</div>
        </li>
        ${NAV.map(item).join('\n        ')}
      </ul>
      <a class="btn btn-lime" href="tel:${SITE.tel}">Call ${SITE.phone}</a>
    </div>
  </header>`;
}

function footer(b, home = false) {
  const homeHref = home ? '#top' : `${b}index.html`;
  return `<footer class="site-footer" data-theme="black">
    <div class="wrap foot-grid">
      <div>
        <a href="${homeHref}" class="brand"><span class="mark" aria-hidden="true">K</span><span class="wm"><b>KKS</b><small>Insurance Services</small></span></a>
        <p class="muted">Insurance operations execution partner for independent agencies, brokers and MGAs. A structured 50+ member team.</p>
        <div class="socials"><a href="#" aria-label="LinkedIn (placeholder)">in</a><a href="#" aria-label="Freelance profile (placeholder)">★</a><a href="#" aria-label="X (placeholder)">X</a></div>
      </div>
      <div>
        <h4 class="mono">Quick Links</h4>
        <ul class="quick">
          <li><a href="${homeHref}">Home</a></li><li><a href="${home ? '#services' : b + 'index.html#services'}">Services</a></li>${NAV.map(([n, u]) => `<li><a href="${b}${u}">${n}</a></li>`).join('')}
        </ul>
      </div>
      <div>
        <h4 class="mono">Services</h4>
        <ul class="contact">${SERVICES.map((s) => `<li><a href="${b}${svcUrl(s)}">${esc(s.short || s.name)}</a></li>`).join('')}</ul>
      </div>
      <div>
        <h4 class="mono">Get in Touch</h4>
        <ul class="contact">
          <li><a href="mailto:${SITE.email}">${SITE.email}</a></li>
          <li><a href="tel:${SITE.tel}">${SITE.phone}</a></li>
          <li><a href="${SITE.wa}" target="_blank" rel="noopener">Chat on WhatsApp</a></li>
          <li><a href="${b}contact.html">Contact form</a></li>
        </ul>
      </div>
    </div>
    <div class="giant serif" aria-hidden="true">KKS<em>insurance</em></div>
    <div class="wrap legal">
      <p>Preview build: names, phone, email, addresses, reviews, case studies and logos are placeholders.</p>
      <p>${LEGAL.map(([n, u]) => `<a href="${b}${u}">${n}</a>`).join(' · ')}</p>
      <p>© <span data-year>2026</span> KKS Insurance Services. All rights reserved.</p>
    </div>
  </footer>

  <a class="wa-float" href="${SITE.wa}" target="_blank" rel="noopener" aria-label="Chat with us on WhatsApp">
    <svg viewBox="0 0 32 32" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M16 3a13 13 0 0 0-11.2 19.6L3 29l6.6-1.7A13 13 0 1 0 16 3zm0 23.6c-2 0-4-.6-5.7-1.6l-.4-.2-3.9 1 1-3.8-.3-.4A10.6 10.6 0 1 1 16 26.6zm5.8-7.9c-.3-.2-1.9-.9-2.2-1-.3-.1-.5-.2-.7.2l-1 1.2c-.2.2-.4.2-.7.1a8.7 8.7 0 0 1-4.3-3.8c-.3-.6.3-.5.9-1.7.1-.2 0-.4 0-.6l-1-2.4c-.3-.6-.5-.5-.7-.5h-.6c-.2 0-.6.1-.9.4-.3.3-1.2 1.1-1.2 2.8s1.2 3.2 1.4 3.5c.2.2 2.4 3.7 5.8 5.1 2.2.9 3 1 4.1.8.7-.1 1.9-.8 2.2-1.5.3-.7.3-1.4.2-1.5-.1-.2-.3-.3-.6-.4z"/></svg>
    <span>Let's Talk</span>
  </a>`;
}

function crumbs(b, trail) {
  return `<nav class="crumbs mono" aria-label="Breadcrumb"><a href="${b}index.html">Home</a>${trail.map(([n, u]) => `<span aria-hidden="true">/</span>${u ? `<a href="${b}${u}">${esc(n)}</a>` : `<span aria-current="page">${esc(n)}</span>`}`).join('')}</nav>`;
}

function hero(b, { trail, eyebrow, t1, t2, lead, ctas = [], visual = '', center = false, theme = 'dark', small = false }) {
  return `<section class="ph${center ? ' center' : ''}${small ? ' small' : ''}${visual ? '' : ' novis'}" id="top" data-theme="${theme}">
      <div class="ph-bg" aria-hidden="true"><span class="orb o1"></span><span class="orb o2"></span><span class="gridlines"></span></div>
      <div class="wrap ph-grid">
        <div class="ph-copy">
          ${crumbs(b, trail)}
          <p class="mono eyebrow"><span class="pulse" aria-hidden="true"></span>${esc(eyebrow)}</p>
          <h1 class="ph-title"><span class="l1">${esc(t1)}</span><span class="l2 serif"><em>${esc(t2)}</em></span></h1>
          ${lead ? `<p class="lead">${esc(lead)}</p>` : ''}
          ${ctas.length ? `<div class="ctas">${ctas.map(([t, u, c = 'btn-lime']) => `<a class="btn ${c}" href="${u}">${esc(t)}${c === 'btn-lime' ? ' <span aria-hidden="true">→</span>' : ''}</a>`).join('')}</div>` : ''}
        </div>
        ${visual ? `<div class="ph-visual">${visual}</div>` : ''}
      </div>
    </section>`;
}

function cta(b, a = 'Ready to Scale', c = 'Without New Headcount?', lead = 'Book a call and we\u2019ll map an operations model around your agency\u2019s lines, carriers and volume.') {
  return `<section class="sec cta" data-theme="blue">
      <div class="wrap cta-inner">
        ${h2(a, c)}
        <p class="lead">${esc(lead)}</p>
        <div class="ctas center"><a class="btn btn-lime lg" href="${b}contact.html">Book Your Consultation <span aria-hidden="true">→</span></a><a class="btn btn-line lg" href="${b}pricing.html">See Pricing</a></div>
        <p class="small">No commitment, just a conversation about your operations.</p>
      </div>
    </section>`;
}

function faq(items, title = ['Questions,', 'Answered'], theme = 'cream') {
  return `<section class="sec faq-sec" data-theme="${theme}">
      <div class="wrap faq-grid">
        <div><p class="mono label">FAQ</p>${h2(...title)}</div>
        <div class="faq" data-faq>
          ${items.map(([q, a], i) => `<div class="qa" data-reveal><h3><button aria-expanded="false" aria-controls="faq-${i}" id="faq-b-${i}">${esc(q)}<span class="pm" aria-hidden="true"></span></button></h3><div class="ans" id="faq-${i}" role="region" aria-labelledby="faq-b-${i}" hidden><p>${esc(a)}</p></div></div>`).join('\n          ')}
        </div>
      </div>
    </section>`;
}

function pinSteps({ label, t, steps, viz = () => '', theme = 'dark', id = 'steps' }) {
  return `<section class="sec ps" id="${id}" data-theme="${theme}" data-pinsteps style="--n:${steps.length}">
      <div class="ps-pin">
        <div class="wrap ps-grid">
          <div class="ps-copy">
            <p class="mono label">${esc(label)}</p>
            ${h2(...t)}
            <ol class="ps-list">${steps.map(([a, d], i) => `<li${i ? '' : ' class="on"'}><i class="mono">${pad(i + 1)}</i><div><b>${esc(a)}</b><span>${esc(d)}</span></div></li>`).join('')}</ol>
            <div class="ps-progress" aria-hidden="true"><span></span></div>
          </div>
          <div class="ps-stage">
            ${steps.map(([a, d], i) => `<article class="ps-card${i ? '' : ' on'}" style="--c:${PASTELS[i % 4]}"><span class="ps-num serif">${pad(i + 1)}</span><div class="ps-viz" aria-hidden="true">${viz(i, a)}</div><h3>${esc(a)}</h3><p>${esc(d)}</p></article>`).join('\n            ')}
          </div>
        </div>
      </div>
    </section>`;
}

function stat([to, suf, label, pre = ''], cls = '') {
  return `<div class="st-card ${cls}" data-reveal><dt class="serif">${pre ? `<small>${esc(pre)}</small>` : ''}<span class="count" data-to="${to}" data-suffix="${esc(suf)}">0</span></dt><dd>${esc(label)}</dd></div>`;
}

function page({ file, title, desc, body, theme }) {
  const depth = file.split('/').length - 1, b = '../'.repeat(depth);
  const html = `${head({ title, desc, theme })}
<body class="inner" data-page="${file.replace(/\.html$/, '').replace(/\//g, '-')}">
  <a class="skip" href="#main">Skip to content</a>

  ${header(b, file)}

  <main id="main">
    ${body(b)}
  </main>

  ${footer(b)}

  <script type="module" src="/src/page.js"></script>
</body>
</html>
`;
  fs.mkdirSync(path.dirname(path.join(ROOT, file)), { recursive: true });
  fs.writeFileSync(path.join(ROOT, file), html);
  written.push(file);
}
const written = [];

/* ---------- SERVICE PAGES ---------- */
SERVICES.forEach((s, idx) => {
  const others = SERVICES.filter((o) => o !== s);
  page({
    file: svcUrl(s), title: s.name, desc: `${s.name} support for US insurance agencies: ${s.lead.slice(0, 120)}`,
    body: (b) => `${hero(b, {
      trail: [['Services', 'index.html#services'], [s.short || s.name]], eyebrow: `Service ${pad(idx + 1)} / 09 · ${s.short || s.name}`,
      t1: s.h1[0], t2: s.h1[1], lead: s.lead,
      ctas: [['Book a Strategy Call', `${b}contact.html`], ['See Pricing', `${b}pricing.html`, 'btn-line']],
      visual: `<div class="qcard" data-queue>
            <div class="qc-head"><span class="svc-ico sm">${svg(s.icon, 20)}</span><div><small class="mono">Live queue · sample</small><b>${esc(s.short || s.name)} desk</b></div><span class="chip lime">QA on</span></div>
            <ul>${s.queue.map(([t, st]) => `<li><span class="t">${esc(t)}</span><span class="st" data-st="${esc(st)}">In progress</span></li>`).join('')}</ul>
            <div class="qc-foot"><span class="mono">Turnaround</span><span class="qbar"><i></i></span><b class="mono">On time</b></div>
          </div>`,
    })}

    <section class="sec handle" data-theme="cream">
      <div class="ticker" aria-hidden="true"><div class="ticker-track">${[0, 1].map((d) => s.handle.map(([h]) => `<span${d ? ' data-dup' : ''}>${esc(h)}</span>`).join('')).join('')}</div></div>
      <div class="wrap">
        <div class="head-split"><p class="mono label">What We Handle</p>${h2('The Work,', 'Owned End to End')}<p class="lead">Each task follows a written procedure and passes a QA check before it reaches your producer, client or carrier.</p></div>
        <div class="card-grid" data-stagger>
          ${s.handle.map(([h, d, id], i) => `<article class="hcard tilt"${id ? ` id="${id}"` : ''} style="--c:${PASTELS[i % 4]}"><i class="mono">${pad(i + 1)}</i><h3>${esc(h)}</h3><p>${esc(d)}</p></article>`).join('\n          ')}
        </div>
      </div>
    </section>

    ${pinSteps({ label: 'Workflow', t: ['How a Request', 'Moves Through Our Desk'], steps: s.steps, id: 'workflow',
      viz: (i) => `<div class="mini">${['Inbox', 'Specialist', 'QA', 'Delivered'].map((x, j) => `<span class="${j <= i ? 'on' : ''}">${j < i ? '✓ ' : ''}${x}</span>`).join('')}</div>` })}

    <section class="sec deliver" data-theme="cream">
      <div class="wrap">
        <div class="head-split"><p class="mono label">Deliverables &amp; Turnaround</p>${h2('What You Get,', 'and How Fast')}</div>
        <dl class="st-row">${s.stats.map((x) => stat(x)).join('')}</dl>
        <div class="deliver-grid">
          <div class="dcard" data-reveal><p class="mono">Deliverables</p><ul class="checklist">${s.deliver.map((d) => `<li>${esc(d)}</li>`).join('')}</ul></div>
          <div class="dcard dark" data-reveal><p class="mono">Service levels (sample)</p><table class="tbl"><thead><tr><th scope="col">Task</th><th scope="col">Standard</th><th scope="col">Rush</th></tr></thead><tbody>${s.steps.map(([st], i) => `<tr><td>${esc(st)}</td><td>${['Same day', '4 h', '1 business day', '2 business days'][i % 4]}</td><td>${['1 h', '2 h', '4 h', 'Same day'][i % 4]}</td></tr>`).join('')}</tbody></table><p class="small muted">Turnaround targets are placeholders for this preview.</p></div>
        </div>
      </div>
    </section>

    <section class="sec tools" data-theme="black">
      <div class="wrap">
        <div class="head-split"><p class="mono label">Carriers &amp; Tools</p>${h2('Working Inside', 'Your Systems')}<p class="lead">We use your logins, your templates and your carrier appointments. No new software for your team to learn.</p></div>
        <div class="tool-grid" data-stagger>${s.tools.map((t, i) => `<div class="tool"><span class="tdot" style="--c:${PASTELS[i % 5]}"></span>${esc(t)}</div>`).join('')}</div>
      </div>
      <div class="marquee" aria-hidden="true"><div class="marquee-track">${[0, 1].map(() => ['Alpha', 'Beta', 'Gamma', 'Delta', 'Epsilon', 'Zeta', 'Theta', 'Kappa'].map((n) => `<div class="logo dark">${n} Carrier</div>`).join('')).join('')}</div></div>
      <p class="wrap note mono">Carrier and platform names shown are generic placeholders.</p>
    </section>

    ${faq(s.faq)}

    <section class="sec more" data-theme="cream">
      <div class="wrap">
        <div class="head-split"><p class="mono label">Other Services</p>${h2('Add Another', 'Line of Support')}</div>
        <div class="svc-links" data-stagger>${others.map((o) => `<a href="${b}${svcUrl(o)}"><span class="svc-ico sm">${svg(o.icon, 18)}</span><b>${esc(o.short || o.name)}</b><span aria-hidden="true">→</span></a>`).join('')}</div>
      </div>
    </section>

    ${cta(b, 'Ready to Hand It Off?', 'Start This Month.', `Book a call and we\u2019ll scope ${/^[aeiou]/i.test(s.short || s.name) ? 'an' : 'a'} ${(s.short || s.name).toLowerCase()} desk around your agency\u2019s carriers, volume and workflows.`)}`,
  });
});

/* ---------- TECHNOLOGY ---------- */
const stack3d = (labels) => `<div class="stack3d" data-stack3d>${labels.map((l, i) => `<div class="layer" style="--i:${i}"><span class="mono">${pad(i + 1)}</span><b>${esc(l)}</b></div>`).join('')}</div>`;
const TECH = [
  ['Agency management systems', 'Client records, activities, documents and accounting kept in your AMS of record.', '<rect x="3" y="4" width="18" height="14" rx="2"/><path d="M3 9h18M8 21h8"/>'],
  ['Comparative raters', 'Personal and small commercial rating across your appointed carriers.', '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>'],
  ['Carrier & MGA portals', 'Quoting, endorsements, claims and documents in the portals you already use.', '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>'],
  ['Certificate management', 'COI templates, holder lists and audit trails inside your certificate system.', '<path d="M6 3h9l4 4v14H6z"/><path d="M9 13l2 2 4-4"/>'],
  ['E-signature & forms', 'Applications and authorizations sent for signature and filed automatically.', '<path d="M3 17c3-4 5 2 8-2s4-6 7-3"/><path d="M3 21h18"/>'],
  ['Workflow automation', 'Routing, reminders and status updates built with the tools you own.', '<path d="M13 2L4 14h7l-1 8 9-12h-7z"/>'],
  ['Shared inboxes & ticketing', 'Requests captured, assigned and time-stamped so nothing gets lost.', '<path d="M3 13l3-8h12l3 8v6H3z"/><path d="M3 13h5l1 3h6l1-3h5"/>'],
  ['Reporting & dashboards', 'Turnaround, volume and quality reported weekly and monthly.', '<path d="M4 20V4M4 20h16M8 16l4-5 3 3 5-7"/>'],
];
page({
  file: 'technology.html', title: 'Technology', desc: 'The tools and secure access model KKS uses to work inside your agency systems.',
  body: (b) => `${hero(b, { trail: [['Technology']], eyebrow: 'Technology & Security', t1: 'Your Systems.', t2: 'Our Trained Hands.', lead: 'We don\u2019t ask you to change software. Our specialists are trained on the categories of tools US agencies run every day, and they work inside your environment with access you control.', ctas: [['Talk to Our Team', `${b}contact.html`], ['How It Works', `${b}how-it-works.html`, 'btn-line']], visual: stack3d(['Your AMS of record', 'Carrier & MGA portals', 'KKS workflow & QA layer', 'Reports to your team']) })}

    <section class="sec" data-theme="cream">
      <div class="wrap">
        <div class="head-split"><p class="mono label">Tool Categories</p>${h2('Trained on the Stack', 'Agencies Actually Use')}<p class="lead">Specialists are certified internally on each category before they touch a live account.</p></div>
        <div class="tech-grid" data-stagger>${TECH.map(([t, d, ic], i) => `<article class="tcard tilt"><span class="svc-ico sm">${svg(ic, 20)}</span><i class="mono">${pad(i + 1)}</i><h3>${esc(t)}</h3><p>${esc(d)}</p></article>`).join('')}</div>
      </div>
    </section>

    ${pinSteps({ label: 'Secure by Design', t: ['How We Protect', 'Your Agency Data'], id: 'security', steps: [
      ['Access you control', 'You issue named logins with the permissions you choose, and you can revoke them at any time.'],
      ['Secure workstations', 'Specialists work on managed devices with disk encryption, screen locks and no local downloads.'],
      ['Verified people', 'Background checks, signed confidentiality agreements and annual privacy training for every team member.'],
      ['Audit trail', 'Every task is time-stamped and logged in your systems, so you can see who did what and when.'],
    ], viz: (i) => `<div class="lock l${i}">${svg(['<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>', '<circle cx="12" cy="8" r="4"/><path d="M4 21c1-4 4-6 8-6s7 2 8 6"/>', '<path d="M5 4h14v16H5z"/><path d="M8 8h8M8 12h8M8 16h5"/>'][i], 54)}</div>` })}

    <section class="sec flow" data-theme="cream">
      <div class="wrap">
        <div class="head-split"><p class="mono label">Task Flow</p>${h2('One Request,', 'Fully Traceable')}</div>
        <ol class="flow-row" data-flow>${['Request captured', 'Assigned to specialist', 'Worked in your systems', 'QA checked', 'Delivered & logged'].map((t, i) => `<li><i class="mono">${pad(i + 1)}</i><b>${esc(t)}</b></li>`).join('')}</ol>
      </div>
    </section>

    ${faq([
      ['Do we need to install anything?', 'No. We work through your existing cloud systems and portals with the logins you provide.'],
      ['Can we limit what your team can see?', 'Yes. Permissions follow the roles you set in each system.'],
      ['Where is our data stored?', 'In your systems. We avoid keeping copies outside them unless you ask us to.'],
      ['Can you sign our confidentiality agreement?', 'Yes. We can sign your NDA and data handling agreement before onboarding.'],
    ])}
    ${cta(b)}`,
});

/* ---------- WHY US ---------- */
const COMPARE = [
  ['Fully loaded cost per hour', 'High', 'Varies', 'From $6/hr'],
  ['Insurance-trained from day one', '✓', '–', '✓'],
  ['QA on every task', 'Depends', '–', '✓'],
  ['Coverage when someone is out', '–', '–', '✓'],
  ['Documented procedures', 'Depends', '–', '✓'],
  ['Scale up or down monthly', '–', '✓', '✓'],
  ['Management overhead', 'High', 'High', 'Low'],
];
const WHY = [
  ['Insurance-trained, not generalists', 'Every specialist completes our insurance operations training before working on a live account.'],
  ['A team, not a single freelancer', 'Pods with a team lead and QA reviewer mean work continues when someone is on leave.'],
  ['QA on every task', 'A second reviewer checks certificates, quotes and endorsements before they leave our desk.'],
  ['Your systems, your rules', 'We work in your tools, follow your naming conventions and use your templates.'],
  ['Clear reporting', 'Weekly summaries of volume, turnaround and open items. No guessing what we did.'],
  ['Flexible commitments', 'Start part-time, add hours as you grow, and adjust every month.'],
];
page({
  file: 'why-us.html', title: 'Why Us', desc: 'Why US agencies choose KKS Insurance Services as their operations partner.',
  body: (b) => `${hero(b, { trail: [['Why Us']], eyebrow: 'Why Agencies Choose KKS', t1: 'Not a Task List.', t2: 'A Working Ops Desk.', lead: 'We plug into your agency like an in-house department, with the same workflows and standards, minus the hiring, training and overhead.', ctas: [['Book a Strategy Call', `${b}contact.html`], ['See Results', `${b}results.html`, 'btn-line']], visual: `<div class="price-badge"><span class="mono">Rates from</span><strong class="serif">$6<small>/hr</small></strong><span>Insurance-trained operations talent</span></div>` })}

    <section class="sec" data-theme="cream">
      <div class="wrap">
        <dl class="st-row">${[[50, '+', 'Trained specialists'], [50, '', 'States of experience'], [99, '%', 'Certificate accuracy'], [11000, '+', 'Hours delivered']].map((x) => stat(x)).join('')}</dl>
      </div>
    </section>

    <section class="sec why-cards" data-theme="cream">
      <div class="wrap why-grid">
        <div class="why-copy"><p class="mono label">Six Reasons</p>${h2('What Makes', 'the Difference')}<p class="lead">The things agency owners mention most after their first 90 days with us.</p><a class="btn btn-dark sm" href="${b}our-experts.html">Meet the Experts</a></div>
        <div class="pstack">${WHY.map(([t, d], i) => `<article class="pcard" style="--c:${PASTELS[i % 4]};--i:${i}"><span class="mono">${pad(i + 1)}</span><h3 class="serif">${esc(t)}</h3><p>${esc(d)}</p></article>`).join('')}</div>
      </div>
    </section>

    <section class="sec" data-theme="dark">
      <div class="wrap">
        <div class="head-split"><p class="mono label">The Comparison</p>${h2('In-House, Freelancer,', 'or KKS?')}</div>
        <div class="tbl-wrap" data-reveal><table class="tbl big"><thead><tr><th scope="col"></th><th scope="col">In-house hire</th><th scope="col">Solo freelancer</th><th scope="col" class="hl">KKS team</th></tr></thead><tbody>${COMPARE.map((r) => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map((c, i) => `<td${i === 2 ? ' class="hl"' : ''}>${esc(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
        <p class="small muted">Illustrative comparison for this preview.</p>
      </div>
    </section>

    <section class="sec quote-sec" data-theme="cream">
      <div class="wrap"><blockquote class="big-quote" data-reveal><p class="serif">\u201cFelt like an extension of our own office from week one.\u201d</p><footer class="mono">Sample Reviewer J · COO, Multi-State Agency (placeholder)</footer></blockquote></div>
    </section>
    ${cta(b)}`,
});

/* ---------- OUR EXPERTS ---------- */
page({
  file: 'our-experts.html', title: 'Our Experts', desc: 'Meet the insurance-trained specialists behind KKS Insurance Services.',
  body: (b) => `${hero(b, { trail: [['Our Experts']], eyebrow: 'The People', t1: 'Six Focused Teams.', t2: 'One Partner.', lead: 'Every function has its own insurance-trained crew, a team lead and QA checkpoints. Names and photos below are placeholders for this preview.', ctas: [['Work With Us', `${b}contact.html`], ['Join the Team', `${b}careers.html`, 'btn-line']], visual: `<div class="orbit-css" aria-hidden="true">${PEOPLE.slice(0, 8).map((p, i) => `<span class="oa" style="--i:${i};--c:${PASTELS[i % 4]}">${initials(p[0])}</span>`).join('')}<span class="core serif">K</span></div>` })}

    <section class="sec" data-theme="cream">
      <div class="wrap">
        <div class="head-split"><p class="mono label">Leadership</p>${h2('Run by People Who', 'Know Insurance Ops')}</div>
        <div class="leaders" data-stagger>${PEOPLE.slice(0, 3).map(([n, r, , d], i) => `<article class="leader"><div class="av lg" style="--c:${['#4f50ff', '#2f8f6b', '#c96a18'][i]}"><span class="serif">${initials(n)}</span></div><div><h3>${esc(n)}</h3><p class="mono">${esc(r)}</p><p>${esc(d)}</p></div></article>`).join('')}</div>
      </div>
    </section>

    <section class="sec" data-theme="cream" id="team">
      <div class="wrap">
        <div class="head-split"><p class="mono label">The Team</p>${h2('Specialists by', 'Function')}</div>
        <div class="filters" role="group" aria-label="Filter by team" data-filter-group="people"><button class="fchip on" aria-pressed="true" data-f="all">All</button>${TEAMS.map((t) => `<button class="fchip" aria-pressed="false" data-f="${esc(t)}">${esc(t)}</button>`).join('')}</div>
        <div class="people" data-filter-list="people">${PEOPLE.slice(3).map(([n, r, t, d], i) => `<article class="person" data-team="${esc(t)}"><div class="av" style="--c:${PASTELS[i % 4]}"><span class="serif">${initials(n)}</span></div><h3>${esc(n)}</h3><p class="prole">${esc(r)}</p><span class="chip">${esc(t)}</span><p class="bio">${esc(d)}</p></article>`).join('')}</div>
        <p class="small muted" data-empty hidden>No one in this team yet.</p>
      </div>
    </section>

    <section class="sec" data-theme="dark">
      <div class="wrap">
        <div class="head-split"><p class="mono label">How Teams Are Structured</p>${h2('Pods Built Around', 'Your Agency')}</div>
        <ol class="team-cards" data-stagger>${TEAMS.map((t, i) => `<li><i class="mono">${pad(i + 1)}</i><b>${esc(t)}</b><span>${['Personal, commercial and trucking quotes across carriers and MGA portals.', 'Accurate COIs for lenders, vendors and contractors in minutes.', 'Loss-run reviews, risk summaries and carrier appetite matching.', 'FNOL intake, documentation, carrier updates and status tracking.', 'Document collection and corrections that prevent cancellations.', 'Renewal tracking, remarketing and client retention workflows.'][i]}</span></li>`).join('')}</ol>
      </div>
    </section>
    ${cta(b, 'Put These Teams', 'to Work for You')}`,
});

/* ---------- CAREERS ---------- */
const uniq = (i) => [...new Set(ROLES.map((r) => r[i]))];
page({
  file: 'careers.html', title: 'Careers', desc: 'Open roles at KKS Insurance Services: insurance operations careers with structured training.',
  body: (b) => `${hero(b, { trail: [['Careers']], eyebrow: 'Careers at KKS', t1: 'Build a Career', t2: 'in Insurance Ops.', lead: 'Structured training, clear growth paths and real work for US agencies. Roles below are sample listings for this preview.', ctas: [['See Open Roles', '#roles'], ['Apply Now', '#apply', 'btn-line']], visual: `<dl class="hero-stats">${[[ROLES.length, '', 'Open roles'], [6, '', 'Specialist teams'], [8, ' wks', 'Paid training']].map(([n, s, l]) => `<div><dt class="serif"><span class="count" data-to="${n}" data-suffix="${s}">0</span></dt><dd>${l}</dd></div>`).join('')}</dl>` })}

    <section class="sec" data-theme="cream">
      <div class="wrap">
        <div class="head-split"><p class="mono label">Life at KKS</p>${h2('Why People', 'Stay With Us')}</div>
        <div class="card-grid" data-stagger>${[['Paid insurance training', 'An 8-week program covering lines, forms, carrier portals and QA.'], ['Clear growth path', 'Associate → Specialist → Senior → Team Lead, with reviews twice a year.'], ['Health cover', 'Medical cover for you and your family (sample benefit).'], ['Shift allowance', 'Additional pay for US-hours overlap shifts (sample benefit).'], ['Learning budget', 'Support for recognised insurance certifications (sample benefit).'], ['Real ownership', 'Own a desk for a partner agency and see the impact of your work.']].map(([t, d], i) => `<article class="hcard" style="--c:${PASTELS[i % 4]}"><i class="mono">${pad(i + 1)}</i><h3>${t}</h3><p>${d}</p></article>`).join('')}</div>
      </div>
    </section>

    <section class="sec" data-theme="cream" id="roles">
      <div class="wrap">
        <div class="head-split"><p class="mono label">Open Roles</p>${h2('Find Your', 'Next Role')}</div>
        <div class="role-filters">
          <label class="search"><span class="sr-only">Search roles</span><input type="search" placeholder="Search roles" data-role-search /></label>
          <label><span class="sr-only">Team</span><select data-role-f="1"><option value="">All teams</option>${uniq(1).map((t) => `<option>${esc(t)}</option>`).join('')}</select></label>
          <label><span class="sr-only">Shift</span><select data-role-f="2"><option value="">All shifts</option>${uniq(2).map((t) => `<option>${esc(t)}</option>`).join('')}</select></label>
          <label><span class="sr-only">Type</span><select data-role-f="3"><option value="">All types</option>${uniq(3).map((t) => `<option>${esc(t)}</option>`).join('')}</select></label>
        </div>
        <p class="small muted" aria-live="polite" data-role-count>${ROLES.length} roles</p>
        <ul class="roles">${ROLES.map(([t, team, shift, type, exp, d]) => `<li class="role" data-v="${esc([t, team, shift, type].join('|'))}"><div class="r-main"><h3>${esc(t)}</h3><p>${esc(d)}</p></div><div class="r-meta"><span class="chip">${esc(team)}</span><span class="chip">${esc(shift)}</span><span class="chip">${esc(type)}</span><span class="chip">${esc(exp)}</span></div><a class="btn btn-dark sm" href="#apply" data-apply="${esc(t)}">Apply <span aria-hidden="true">→</span></a></li>`).join('')}</ul>
        <p class="small muted" data-role-empty hidden>No roles match these filters. Try clearing one.</p>
      </div>
    </section>

    <section class="sec" data-theme="dark" id="apply">
      <div class="wrap form-wrap">
        <div><p class="mono label">Apply</p>${h2('Send Us Your', 'Application')}<p class="lead">This is a demo form for the preview build. Nothing is uploaded or sent.</p><p class="small muted">Prefer email? Write to <a href="mailto:${SITE.careersEmail}">${SITE.careersEmail}</a> (placeholder).</p></div>
        <form class="kform" data-form="apply" novalidate>
          <div class="frow"><label>Full name *<input name="name" required autocomplete="name" /></label><label>Email *<input name="email" type="email" required autocomplete="email" /></label></div>
          <div class="frow"><label>Phone<input name="phone" type="tel" autocomplete="tel" placeholder="Optional" /></label><label>Role *<select name="role" required><option value="">Choose a role</option>${ROLES.map((r) => `<option>${esc(r[0])}</option>`).join('')}</select></label></div>
          <div class="frow"><label>Experience *<select name="exp" required><option value="">Select</option><option>Fresher</option><option>Under 1 year</option><option>1–3 years</option><option>3–5 years</option><option>5+ years</option></select></label><label>LinkedIn profile<input name="url" type="url" placeholder="https://" /></label></div>
          <label class="file">Resume (PDF or DOC) *<input name="resume" type="file" accept=".pdf,.doc,.docx" required /><span class="file-ui"><b>Choose a file</b> or drop it here</span></label>
          <label>Why KKS?<textarea name="msg" rows="4" placeholder="A few lines about you"></textarea></label>
          <label class="check"><input type="checkbox" name="consent" required /> I agree to be contacted about this application *</label>
          <button class="btn btn-lime" type="submit">Submit Application <span aria-hidden="true">→</span></button>
          <p class="form-note small muted" role="status" aria-live="polite"></p>
        </form>
        <div class="success" data-success="apply" hidden tabindex="-1"><span class="tick" aria-hidden="true">✓</span><h3 class="serif">Application received</h3><p>Thanks! This is a demo, so nothing was sent. In the live site, our hiring team would reply within 5 business days.</p><button class="btn btn-line sm" type="button" data-reset="apply">Submit another</button></div>
      </div>
    </section>`,
});

/* ---------- HOW IT WORKS ---------- */
const HOW = [
  ['Discovery call', 'A 30-minute call about your lines, carriers, volume and the tasks slowing your team down.'],
  ['Process mapping', 'We document your workflows, templates and naming conventions into a written playbook.'],
  ['Team & access setup', 'We assign specialists, a team lead and a QA reviewer. You issue logins with the permissions you choose.'],
  ['Two-week pilot', 'We start with a defined set of tasks. Your team reviews output daily and we tune the playbook.'],
  ['Scale & report', 'Add tasks and hours as trust builds. You get weekly reports and a monthly review call.'],
];
const howViz = (i) => [
  `<div class="vz-call"><span class="av sm" style="--c:#ffdf99">AP</span><span class="wave"><i></i><i></i><i></i><i></i><i></i></span><span class="av sm" style="--c:#c6e8e8">YOU</span></div>`,
  `<div class="vz-map"><span>Request</span><span>Specialist</span><span>QA</span><span>Done</span></div>`,
  `<div class="vz-team">${['TL', 'QA', 'S1', 'S2', 'S3'].map((x, j) => `<span class="av sm" style="--c:${PASTELS[j % 4]}">${x}</span>`).join('')}</div>`,
  `<div class="vz-bars">${[.3, .5, .65, .8, .92].map((h) => `<i style="--h:${h}"></i>`).join('')}</div>`,
  `<div class="vz-report"><b class="serif">+25 hrs</b><span class="mono">freed per week (sample)</span></div>`,
][i];
page({
  file: 'how-it-works.html', title: 'How It Works', desc: 'How KKS onboards your agency: discovery, process mapping, setup, pilot and scale.',
  body: (b) => `${hero(b, { trail: [['How It Works']], eyebrow: 'Onboarding in 5 Steps', t1: 'From First Call', t2: 'to Full Desk in 30 Days.', lead: 'A structured onboarding that starts small, proves quality and then scales with your agency.', ctas: [['Start With a Call', `${b}contact.html`], ['See Pricing', `${b}pricing.html`, 'btn-line']], center: true })}

    ${pinSteps({ label: 'The Process', t: ['Five Steps,', 'No Surprises'], steps: HOW, viz: howViz, id: 'process' })}

    <section class="sec" data-theme="cream">
      <div class="wrap">
        <div class="head-split"><p class="mono label">Timeline</p>${h2('What the First', 'Month Looks Like')}</div>
        <ol class="weeks" data-stagger>${[['Week 1', 'Discovery, playbook draft, access requests'], ['Week 2', 'Pilot tasks begin with daily review'], ['Week 3', 'Playbook tuned, volume increases'], ['Week 4', 'Full scope live, first monthly report']].map(([w, d], i) => `<li style="--c:${PASTELS[i]}"><b class="serif">${w}</b><span>${d}</span></li>`).join('')}</ol>
      </div>
    </section>

    <section class="sec" data-theme="cream">
      <div class="wrap">
        <div class="head-split"><p class="mono label">What You Need</p>${h2('Your Side of', 'the Setup')}</div>
        <ul class="checklist big" data-stagger>${['One point of contact at your agency', 'Logins for the systems we will work in', 'Sample work and templates to learn from', 'A shared inbox or task queue for requests', '30 minutes a week for the first month'].map((t) => `<li>${t}</li>`).join('')}</ul>
      </div>
    </section>
    ${faq([
      ['How long until we see results?', 'Most agencies see backlog relief within the two-week pilot.'],
      ['Is there a long contract?', 'No. Plans are month to month; annual plans simply lower the hourly rate.'],
      ['What if the fit isn\u2019t right?', 'We review after the pilot. If it is not working, you can stop with no further commitment.'],
      ['Can we change tasks later?', 'Yes. Scope is reviewed monthly and the playbook is updated as you go.'],
    ])}
    ${cta(b)}`,
});

/* ---------- PRICING ---------- */
const PLANS = [
  { n: 'Essentials', m: 6.75, a: 6, d: 'Admin, data entry, certificates and document work.', f: ['Admin & inbox triage', 'Certificates of insurance', 'Data entry & indexing', 'Weekly report'], tag: '' },
  { n: 'Specialist', m: 8.5, a: 7.75, d: 'Quoting, submissions, endorsements, claims and renewals.', f: ['Everything in Essentials', 'Multi-carrier quoting', 'Submissions & endorsements', 'Claims & renewals support', 'QA on every task'], tag: 'Most popular' },
  { n: 'Dedicated Pod', m: 10.5, a: 9.5, d: 'A team of 3+ specialists with a team lead and QA reviewer.', f: ['Everything in Specialist', 'Dedicated team lead', 'Dedicated QA reviewer', 'Coverage during leave', 'Monthly ops review'], tag: 'Best for scale' },
];
const CMP = [
  ['Insurance-trained specialists', 1, 1, 1], ['Certificates & admin', 1, 1, 1], ['Quoting & submissions', 0, 1, 1], ['Claims & renewals', 0, 1, 1],
  ['Second-reviewer QA', 'Sampled', 1, 1], ['Dedicated team lead', 0, 0, 1], ['Leave coverage', 0, 'Add-on', 1], ['Reporting', 'Weekly', 'Weekly', 'Weekly + monthly review'], ['Minimum hours / month', '80', '80', '480 (3 people)'],
];
const cell = (v) => (v === 1 ? '<span class="yes" aria-label="Included">✓</span>' : v === 0 ? '<span class="no" aria-label="Not included">–</span>' : esc(v));
page({
  file: 'pricing.html', title: 'Pricing', desc: 'Simple hourly pricing for insurance operations support, from $6/hr.',
  body: (b) => `${hero(b, { trail: [['Pricing']], eyebrow: 'Simple, Hourly Pricing', t1: 'Rates From $6/hr.', t2: 'No Hiring Overhead.', lead: 'Pick a plan, choose your monthly hours, and change either as your agency grows. Prices are sample figures for this preview.', center: true })}

    <section class="sec pricing" data-theme="cream" id="plans">
      <div class="wrap">
        <div class="p-controls">
          <div class="seg" role="group" aria-label="Billing"><button aria-pressed="false" data-bill="m">Monthly</button><button aria-pressed="true" data-bill="a">Annual <span class="chip lime">Save ~10%</span></button></div>
          <div class="seg" role="group" aria-label="Hours per month per specialist">${[80, 120, 160].map((h, i) => `<button aria-pressed="${i === 2}" data-hours="${h}">${h} hrs${['', '', ' · full-time'][i]}</button>`).join('')}</div>
        </div>
        <div class="plans" data-stagger>${PLANS.map((p) => `<article class="plan${p.tag === 'Most popular' ? ' pop' : ''}" data-m="${p.m}" data-a="${p.a}">${p.tag ? `<span class="chip ${p.tag === 'Most popular' ? 'lime' : ''}">${p.tag}</span>` : '<span class="chip">Start here</span>'}<h3>${p.n}</h3><p class="pd">${p.d}</p><div class="price"><span class="serif" data-rate>$${p.a.toFixed(2)}</span><small>/hr per specialist</small></div><p class="est mono" data-est>≈ $${Math.round(p.a * 160).toLocaleString('en-US')} / month at 160 hrs · billed annually</p><ul class="checklist">${p.f.map((f) => `<li>${f}</li>`).join('')}</ul><a class="btn ${p.tag === 'Most popular' ? 'btn-lime' : 'btn-dark'}" href="${b}contact.html">Get Started</a></article>`).join('')}</div>
        <p class="small muted center-t">All figures are placeholders. Final pricing depends on lines, volume and shift coverage.</p>
      </div>
    </section>

    <section class="sec" data-theme="dark">
      <div class="wrap">
        <div class="head-split"><p class="mono label">Compare Plans</p>${h2('Everything Side', 'by Side')}</div>
        <div class="tbl-wrap" data-reveal><table class="tbl big"><thead><tr><th scope="col">Feature</th>${PLANS.map((p) => `<th scope="col"${p.tag === 'Most popular' ? ' class="hl"' : ''}>${p.n}</th>`).join('')}</tr></thead><tbody>${CMP.map((r) => `<tr><th scope="row">${esc(r[0])}</th>${r.slice(1).map((v, i) => `<td${i === 1 ? ' class="hl"' : ''}>${cell(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>
      </div>
    </section>
    ${faq([
      ['Is $6/hr really the starting rate?', 'In this sample pricing, $6/hr is the Essentials rate on an annual plan. Monthly plans are slightly higher.'],
      ['Are there setup fees?', 'No setup fees in the sample plans. Onboarding and the two-week pilot are included.'],
      ['How are hours tracked?', 'Time is logged per task and summarized in your weekly report.'],
      ['Can we mix plans?', 'Yes. Many agencies combine an Essentials specialist for admin with Specialist hours for quoting.'],
      ['How do we pay?', 'Monthly invoices in USD. Payment terms are agreed during onboarding.'],
    ], ['Pricing', 'Questions'])}
    ${cta(b, 'Get a Quote for', 'Your Agency')}`,
});

/* ---------- RESULTS ---------- */
page({
  file: 'results.html', title: 'Results', desc: 'Sample case studies and results from agencies working with KKS.',
  body: (b) => `${hero(b, { trail: [['Results']], eyebrow: 'Results & Case Studies', t1: 'What Steady Execution', t2: 'Delivers.', lead: 'Sample case studies that show the kind of outcomes agencies look for. All agencies and figures here are placeholders.', ctas: [['Get Similar Results', `${b}contact.html`], ['Read Reviews', '#reviews', 'btn-line']], center: true })}

    <section class="sec" data-theme="cream">
      <div class="wrap"><dl class="st-row">${[[50, '+', 'Agencies supported'], [11000, '+', 'Hours delivered'], [99, '%', 'Certificate accuracy'], [4.9, '★', 'Average rating']].map(([t, s, l]) => `<div class="st-card" data-reveal><dt class="serif"><span class="count" data-to="${t}" data-suffix="${s}"${t % 1 ? ' data-dec="1"' : ''}>0</span></dt><dd>${l}</dd></div>`).join('')}</dl></div>
    </section>

    <section class="sec" data-theme="cream" id="cases">
      <div class="wrap">
        <div class="head-split"><p class="mono label">Case Studies</p>${h2('Four Agencies,', 'Four Bottlenecks')}</div>
        <div class="cases">${CASES.map(([n, who, prob, fix, ms], i) => `<article class="case" style="--c:${PASTELS[i % 4]}" data-reveal><div class="case-l"><span class="mono">Case ${pad(i + 1)} · Sample</span><h3 class="serif">${esc(n)}</h3><p class="who">${esc(who)}</p><p><b>Challenge:</b> ${esc(prob)}</p><p><b>What we set up:</b> ${esc(fix)}</p></div><dl class="case-r">${ms.map(([k, v]) => `<div><dt>${esc(k)}</dt><dd class="serif">${esc(v)}</dd></div>`).join('')}</dl></article>`).join('')}</div>
      </div>
    </section>

    <section class="sec" data-theme="dark">
      <div class="wrap">
        <div class="head-split"><p class="mono label">Before &amp; After</p>${h2('Turnaround,', 'Before and After')}</div>
        <div class="ba" data-ba>${[['Commercial quote', 72, 8, 'hrs'], ['Standard COI', 24, 0.25, 'hrs'], ['Endorsement', 48, 12, 'hrs'], ['Claim update gap', 21, 7, 'days']].map(([t, a, z, u]) => `<div class="ba-row" data-reveal><span class="ba-t">${t}</span><div class="ba-bars"><span class="b0" style="--w:1"><em>Before · ${a} ${u}</em></span><span class="b1" style="--w:${Math.max(z / a, 0.04).toFixed(3)}"><em>With KKS · ${z} ${u}</em></span></div></div>`).join('')}</div>
        <p class="small muted">Illustrative sample figures.</p>
      </div>
    </section>

    <section class="sec" data-theme="cream" id="reviews">
      <div class="wrap">
        <div class="head-split"><p class="mono label">Client Feedback</p>${h2('What Agencies', 'Tell Us')}<p class="lead">Placeholder reviews for this demo. Swap in verified client feedback before launch.</p></div>
        <div class="rv-wall">${REVIEWS.map(([q, n, r], i) => `<article class="rv" style="--c:${PASTELS[i % PASTELS.length]}" data-reveal><div class="stars" aria-label="5 out of 5 stars">★★★★★</div><q>${esc(q)}</q><div class="who"><b>${esc(n)}</b>${esc(r)}</div></article>`).join('')}</div>
      </div>
    </section>
    ${cta(b)}`,
});

/* ---------- CONTACT ---------- */
page({
  file: 'contact.html', title: 'Contact', desc: 'Contact KKS Insurance Services to book a strategy call.',
  body: (b) => `${hero(b, { trail: [['Contact']], eyebrow: 'Book a Strategy Call', t1: 'Let\u2019s Map Your', t2: 'Operations Model.', lead: 'Tell us about your agency and we\u2019ll come back with a suggested team and plan. Contact details on this preview are placeholders.', center: true })}

    <section class="sec contact-sec" data-theme="cream" id="form">
      <div class="wrap form-wrap light">
        <form class="kform" data-form="contact" novalidate>
          <div class="frow"><label>Full name *<input name="name" required autocomplete="name" /></label><label>Work email *<input name="email" type="email" required autocomplete="email" /></label></div>
          <div class="frow"><label>Phone<input name="phone" type="tel" autocomplete="tel" placeholder="Optional" /></label><label>Agency name *<input name="agency" required autocomplete="organization" /></label></div>
          <div class="frow"><label>Agency size<select name="size"><option value="">Select</option><option>1–5 people</option><option>6–20 people</option><option>21–50 people</option><option>50+ people</option></select></label><label>Hours needed / month<select name="hours"><option value="">Not sure yet</option><option>Under 80</option><option>80–160</option><option>160–480</option><option>480+</option></select></label></div>
          <fieldset><legend>Services you\u2019re interested in *</legend><div class="cbx">${SERVICES.map((s) => `<label class="check"><input type="checkbox" name="svc" value="${esc(s.slug)}" /> ${esc(s.short || s.name)}</label>`).join('')}</div></fieldset>
          <label>Message *<textarea name="msg" rows="5" required minlength="10" placeholder="What would you like to hand off first?"></textarea></label>
          <label class="check"><input type="checkbox" name="consent" required /> I agree to be contacted about my enquiry *</label>
          <button class="btn btn-lime" type="submit">Send Message <span aria-hidden="true">→</span></button>
          <p class="form-note small muted" role="status" aria-live="polite"></p>
        </form>
        <div class="success" data-success="contact" hidden tabindex="-1"><span class="tick" aria-hidden="true">✓</span><h3 class="serif">Thanks, we\u2019ve got it</h3><p>This is a demo form, so nothing was sent. On the live site, our team would reply within one business day.</p><button class="btn btn-line sm" type="button" data-reset="contact">Send another</button></div>
        <aside class="c-side">
          <div class="c-card"><p class="mono">Email</p><a href="mailto:${SITE.email}">${SITE.email}</a></div>
          <div class="c-card"><p class="mono">Phone</p><a href="tel:${SITE.tel}">${SITE.phone}</a><span class="small muted">Mon–Fri, US business hours</span></div>
          <a class="c-card wa" href="${SITE.wa}" target="_blank" rel="noopener"><p class="mono">WhatsApp</p><b>Chat with us on WhatsApp →</b><span class="small">Placeholder number</span></a>
        </aside>
      </div>
    </section>

    <section class="sec" data-theme="dark" id="offices">
      <div class="wrap">
        <div class="head-split"><p class="mono label">Offices</p>${h2('Where We', 'Work From')}</div>
        <div class="offices" data-stagger>${[['US Client Office (placeholder)', '000 Example Avenue, Suite 0', 'Sample City, ST 00000, USA', 'Client meetings by appointment'], ['Operations Centre (placeholder)', 'Plot 00, Sample Business Park', 'Example City 000000, India', 'Shifts overlap US business hours']].map(([t, a1, a2, n], i) => `<article class="office"><div class="map" aria-hidden="true"><span class="pin" style="--x:${[38, 70][i]}%;--y:${[44, 58][i]}%"></span></div><h3>${t}</h3><p>${a1}<br />${a2}</p><p class="small muted">${n}</p></article>`).join('')}</div>
      </div>
    </section>`,
});

/* ---------- LEGAL ---------- */
const LEGAL_PAGES = {
  'legal/company-information.html': ['Company information', 'About this business', [
    ['Business name', 'KKS Insurance Services (placeholder legal entity name for this preview).'],
    ['What we do', 'KKS provides back-office operations support to licensed insurance agencies, brokers and MGAs. We are not an insurance carrier and do not sell, solicit or negotiate insurance, or give insurance advice to consumers.'],
    ['Registered address', '000 Example Avenue, Suite 0, Sample City, ST 00000, USA (placeholder).'],
    ['Company registration', 'Registration number: 00000000 (placeholder).'],
    ['Contact', `Email ${SITE.email} or call ${SITE.phone} (placeholders).`],
  ]],
  'legal/privacy.html': ['Privacy', 'How we handle personal information', [
    ['Who this applies to', 'This notice explains how KKS handles personal information of website visitors, job applicants and the business contacts of our agency clients.'],
    ['Information we collect', 'Contact details you submit through forms, basic analytics about website use, and information our agency clients provide to us so we can perform services on their behalf.'],
    ['How we use it', 'To respond to enquiries, deliver services under our client agreements, assess job applications and keep our services secure.'],
    ['Client data', 'When we work for an agency, we act on its instructions. Data stays in the agency\u2019s systems wherever possible and is only accessed by assigned team members.'],
    ['Sharing', 'We do not sell personal information. We share it only with service providers who help us operate, or where required by law.'],
    ['Retention', 'We keep information only as long as needed for the purposes above or as required by law and client contracts.'],
    ['Your choices', `You can ask to access, correct or delete your information by emailing ${SITE.email} (placeholder).`],
  ]],
  'legal/security.html': ['Security', 'How we protect agency data', [
    ['Access control', 'Agencies issue named, role-based logins to our team members and can revoke them at any time. Access is reviewed monthly.'],
    ['Devices', 'Work is done on managed devices with full-disk encryption, automatic screen lock, endpoint protection and restricted downloads.'],
    ['People', 'Team members complete background checks, sign confidentiality agreements and take privacy and security training every year.'],
    ['Network', 'Office networks are segmented and protected by firewalls. Remote access uses multi-factor authentication.'],
    ['Incidents', 'Suspected incidents are escalated immediately and affected clients are notified without undue delay.'],
    ['Reporting a concern', `Report a security concern to ${SITE.email} with the subject line \u201cSecurity\u201d (placeholder).`],
  ]],
  'legal/complaints.html': ['Complaints', 'How to raise a concern', [
    ['Our commitment', 'We take every complaint seriously and aim to resolve it quickly and fairly.'],
    ['How to complain', `Email ${SITE.email} with \u201cComplaint\u201d in the subject line, call ${SITE.phone}, or use our contact form. Please include your agency name and the details of the issue (placeholders).`],
    ['What happens next', 'We acknowledge complaints within 2 business days and aim to send a full response within 10 business days.'],
    ['Escalation', 'If you are not satisfied with our response, you can ask for the complaint to be reviewed by a member of our leadership team.'],
    ['Insurance policy complaints', 'Complaints about an insurance policy or claim decision should be directed to your insurance agency or carrier, as KKS does not make coverage decisions.'],
  ]],
};
Object.entries(LEGAL_PAGES).forEach(([file, [title, sub, secs]]) => page({
  file, title, desc: `${title} for KKS Insurance Services.`, theme: 'cream',
  body: (b) => `${hero(b, { trail: [['Legal'], [title]], eyebrow: 'Legal', t1: title, t2: sub + '.', theme: 'cream', small: true, center: true })}
    <section class="sec legal-sec" data-theme="cream">
      <div class="wrap legal-grid">
        <aside class="toc"><p class="mono">On this page</p><ol>${secs.map(([h], i) => `<li><a href="#s${i + 1}">${esc(h)}</a></li>`).join('')}</ol><p class="mono" style="margin-top:28px">Legal pages</p><ul>${LEGAL.map(([n, u]) => `<li><a href="${b}${u}"${u === file ? ' aria-current="page"' : ''}>${n}</a></li>`).join('')}</ul></aside>
        <article class="prose">
          <p class="notice">Placeholder text for the preview build. Have this page reviewed by qualified counsel before launch. Last updated: 15 November 2026.</p>
          ${secs.map(([h, p], i) => `<h2 id="s${i + 1}">${esc(h)}</h2><p>${esc(p)}</p>`).join('\n          ')}
          <p><a class="text-link" href="${b}contact.html">Contact us <span aria-hidden="true">→</span></a></p>
        </article>
      </div>
    </section>`,
}));

/* ---------- sync shared header/footer into index.html ---------- */
const idxPath = path.join(ROOT, 'index.html');
let idx = fs.readFileSync(idxPath, 'utf8');
idx = idx.replace(/<header class="site-header"[\s\S]*?<\/header>/, header('', '', true));
idx = idx.replace(/<footer class="site-footer"[\s\S]*?<\/footer>\s*<a class="wa-float"[\s\S]*?<\/a>/, footer('', true));
fs.writeFileSync(idxPath, idx);

/* ---------- old coming-soon links → redirect page ---------- */
const MAP = { careers: 'careers.html', 'how-it-works': 'how-it-works.html', pricing: 'pricing.html', reviews: 'results.html#reviews', company: 'legal/company-information.html', privacy: 'legal/privacy.html', security: 'legal/security.html', complaints: 'legal/complaints.html', hospitality: 'services/commercial-lines.html#hospitality', trucking: 'services/trucking-transportation.html', certificates: 'services/certificates-endorsements.html', automations: 'services/automations-agency-admin.html' };
SERVICES.forEach((s) => (MAP[s.slug] = svcUrl(s)));
NAV.forEach(([, u]) => (MAP[u.replace('.html', '')] = u));
fs.writeFileSync(path.join(ROOT, 'coming-soon.html'), `<!doctype html>
<html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1.0" /><meta name="robots" content="noindex" />
<title>Redirecting… | KKS Insurance Services</title>
<script>
// Legacy URL (coming-soon.html?page=…) → real page.
var M=${JSON.stringify(MAP)};var p=new URLSearchParams(location.search).get('page')||'';location.replace(M[p]||'index.html');
</script>
<noscript><meta http-equiv="refresh" content="0; url=index.html" /></noscript>
</head><body><p>Redirecting… <a href="index.html">Go to the homepage</a></p></body></html>
`);

fs.writeFileSync(path.join(ROOT, 'scripts/pages.json'), JSON.stringify(['index.html', ...written, 'coming-soon.html'], null, 2));
console.log(`Generated ${written.length} pages; index.html header/footer synced.`);
