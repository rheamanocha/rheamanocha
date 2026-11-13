/* Portfolio renderer. All words live in /content; edit those, not this file.
   One page, routed by the URL hash: #home, #work, #lab, #about, #case-<slug>, #for-<lens>.
   A lens (see "lenses" in content/site.json) reorders projects and swaps the hero words. */
const $ = (s, r = document) => r.querySelector(s);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const md = s => esc(s)
  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
  .replace(/\[([^\]]+)\]\((https?:[^)\s]+|[\w\-./?=#]+)\)/g, '<a href="$2">$1</a>');
const paras = s => String(s ?? '').split(/\n\s*\n/).filter(Boolean).map(p => `<p>${md(p)}</p>`).join('');
const getJSON = p => fetch(p, { cache: 'no-cache' }).then(r => { if (!r.ok) throw new Error(p + ' ' + r.status); return r.json(); });
const csLink = slug => `#case-${encodeURIComponent(slug)}`;
const cache = new Map();
const study = slug => {
  if (!cache.has(slug)) cache.set(slug, getJSON(`content/case-studies/${slug}.json`).catch(() => null));
  return cache.get(slug);
};
let site, runId = 0, activeLens = null;
const app = () => $('#app');
const lensOf = () => (site.lenses || []).find(l => l.key === activeLens) || null;
const featuredList = () => lensOf()?.featured || site.featured || [];

function cover(cs, hero) {
  const c = cs.cover || {};
  const kind = c.kind || 'document';
  let inner;
  if (hero && c.hero) inner = `<img src="${esc(c.hero)}" alt="${esc(c.heroAlt || c.alt || cs.title)}">`;
  else if (c.image) inner = `<img src="${esc(c.image)}" alt="${esc(c.alt || cs.title)}">`;
  else if (kind === 'video') inner = `<div class="art art-video"><div class="win"><div class="tb"><i></i><i></i><i></i></div><div class="scr"><i class="l w60"></i><i class="l w80"></i><i class="l w40"></i><span class="rec">Recording 0:12</span></div></div></div>`;
  else if (kind === 'agent') inner = `<div class="art art-agent"><div class="step">Read the thread</div><div class="step">Draft the reply</div><div class="step run">Send for review</div></div>`;
  else if (kind === 'health') inner = `<div class="art art-health"><svg viewBox="0 0 300 160" role="img" aria-label="A care path with four stops"><path d="M20 120 C80 120 70 40 140 50 S220 130 280 40" fill="none" stroke="#0B1B3F" stroke-width="3" stroke-dasharray="2 9" stroke-linecap="round"/><circle cx="20" cy="120" r="12" fill="#FFD84D"/><circle cx="105" cy="68" r="12" fill="#2B50FF"/><circle cx="195" cy="104" r="12" fill="#0FB5A6"/><circle cx="280" cy="40" r="12" fill="#fff" stroke="#0B1B3F" stroke-width="3"/></svg></div>`;
  else inner = `<div class="art art-doc"><div class="pg"><i class="l w60"></i><i class="l"></i><div class="hl"><b>While you were away</b><i class="l w70"></i><i class="l w50"></i></div><i class="l w80"></i><i class="l w40"></i></div></div>`;
  return `<div class="cover k-${esc(kind)}">${inner}</div>`;
}

function renderHeader(route) {
  const L = site.links || {};
  const item = (t, h, cls = '', cur = false) => `<a class="${cls}" href="${h}"${cur ? ' aria-current="page"' : ''}>${t}</a>`;
  const home = activeLens ? `#for-${activeLens}` : '#home';
  $('#header').innerHTML = `<div class="wrap bar"><a class="brand" href="${home}">${esc(site.name)}</a>
    <nav class="nav" aria-label="Main">${item('Work', '#work')}${item('Lab', '#lab', 'hide-s')}${item('About', '#about', '', route === 'about')}
    ${L.linkedin ? `<a class="hide-s" href="${esc(L.linkedin)}" rel="noopener">LinkedIn</a>` : ''}
    ${L.resume ? `<a class="pill" href="${esc(L.resume)}">Resume</a>` : ''}</nav></div>`;
}

function renderFooter() {
  const L = site.links || {};
  $('#footer').innerHTML = `<div class="wrap"><h2>${esc(site.footer?.headline || 'Say hello.')}</h2>
    <div class="foot-links">
      ${L.email ? `<a class="btn btn-primary" href="mailto:${esc(L.email)}">Email me</a>` : ''}
      ${L.linkedin ? `<a class="btn ${L.email ? 'btn-ghost' : 'btn-primary'}" href="${esc(L.linkedin)}" rel="noopener">Connect on LinkedIn</a>` : ''}
      ${L.resume ? `<a class="btn btn-ghost" href="${esc(L.resume)}">Read my resume</a>` : ''}
    </div>
    ${L.email ? `<p class="fine">${esc(L.email)}</p>` : ''}
    <p class="fine">${esc(site.footer?.note || '')}</p></div>`;
}

function heroDemo(prompts, my) {
  const input = $('#ask-text'), out = $('#ask-out'), rel = $('#ask-rel');
  if (!input || !prompts?.length) return;
  const show = p => {
    out.innerHTML = `<div class="res-title">${esc(p.title)}</div>` + (p.lines || []).map(l => `<div class="res-line"><i></i>${esc(l)}</div>`).join('');
    rel.innerHTML = p.slug ? `Related: <a href="${csLink(p.slug)}">${esc(p.related || 'Read the case study')}</a>.` : '';
    out.classList.add('in');
  };
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { input.textContent = prompts[0].prompt; show(prompts[0]); return; }
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  (async () => {
    for (let i = 0; my === runId; i++) {
      const p = prompts[i % prompts.length];
      out.classList.remove('in'); input.textContent = ''; await sleep(450);
      for (const ch of p.prompt) { if (my !== runId) return; input.textContent += ch; await sleep(36); }
      await sleep(380); if (my !== runId) return; show(p); await sleep(3600);
    }
  })();
}

async function renderHome(my) {
  const lens = lensOf() || {};
  const h = site.hero || {}, L = site.links || {};
  const featured = featuredList();
  const allPillars = site.pillars || [];
  const pillars = (lens.pillarOrder || allPillars.map((_, i) => i)).map(i => allPillars[i]).filter(Boolean);
  const f0 = featured[0];
  const prompts = [...(h.prompts || [])].sort((a, b) => (b.slug === f0) - (a.slug === f0));
  const hero = `
  <section class="hero"><div class="wrap hero-grid">
    <div class="reveal-hero"><h1>${esc(lens.headline || h.headline)}</h1><p class="lede">${md(lens.intro || h.intro)}</p>
    </div>
    <div class="grid-bg"><div class="ask">
      <div class="ask-in"><span class="sp" aria-hidden="true"></span><span id="ask-text"></span><span class="caret" aria-hidden="true"></span></div>
      <div class="ask-out" id="ask-out" aria-live="polite"></div></div>
      <p class="demo-note"><span id="ask-rel"></span> Illustrative, not real product UI.</p></div>
  </div></section>`;
  const sections = {
    work: `<section class="section" id="work"><div class="wrap">
      <div class="sec-head"><h2>${esc(site.work?.title || 'Selected work')}</h2>${(lens.workIntro || site.work?.intro) ? `<p>${esc(lens.workIntro || site.work?.intro)}</p>` : ''}</div>
      <div class="work-grid" id="work-grid"></div></div></section>`,
    strengths: `<section class="section wash" id="strengths"><div class="wrap">
      ${pillars.map(p => `<div class="pillar"><h3>${esc(p.title)}</h3><div>${paras(p.text)}</div></div>`).join('')}
      </div></section>`,
    lab: `<section class="section" id="lab"><div class="wrap">
      <div class="sec-head"><h2>${esc(site.lab?.title || 'Lab')}</h2><p>${esc(site.lab?.intro || '')}</p></div></div>
      <div class="car"><div class="car-track" tabindex="0" aria-label="Lab projects">${[0, 1, 2].map(copy => (site.lab?.items || []).map(i => {
        const tag = i.url ? 'a' : 'div';
        const clone = copy ? ' aria-hidden="true"' + (i.url ? ' tabindex="-1"' : '') : '';
        return `<${tag} class="car-tile" ${i.url ? `href="${esc(i.url)}" rel="noopener"${/^https?:/.test(i.url) ? ' target="_blank"' : ''}` : ''}${clone}><span class="car-img">${i.image ? `<img src="${esc(i.image)}" alt="${copy ? '' : 'Preview of ' + esc(i.title)}" loading="lazy">` : ''}</span><h3>${esc(i.title)}</h3><p>${esc(i.text)}</p></${tag}>`;
      }).join('')).join('')}</div>
      <div class="car-nav"><button type="button" data-car="-1" aria-label="Previous projects">&larr;</button><button type="button" data-car="1" aria-label="Next projects">&rarr;</button></div></div></section>`
  };
  const order = lens.sectionOrder || ['work', 'strengths', 'lab'];
  app().innerHTML = hero + order.map(k => sections[k] || '').join('');
  initCarousel();
  heroDemo(prompts, my);
  const studies = await Promise.all(featured.map(study));
  if (my !== runId) return;
  $('#work-grid').innerHTML = studies.filter(Boolean).map(cs => `
    <a class="tile" href="${csLink(cs.slug)}">${cover(cs)}
      <h3>${esc(cs.title)}</h3><p>${esc(cs.summary)}</p>
      <div class="tags">${(cs.tags || []).map(t => `<span class="tag">${esc(t)}</span>`).join('')}</div></a>`).join('');
}

function pubs(p) {
  if (!p || !(p.items || []).length) return '';
  const link = (title, url) => url ? `<a href="${esc(url)}" target="_blank" rel="noopener">${esc(title)}</a>` : esc(title);
  const items = p.items.map(x => `<li class="pub"><span class="pub-year">${esc(x.year)}</span><div><h3>${link(x.title, x.url)}</h3>
      <p class="pub-by">${esc(x.authors || '')}</p><p class="pub-venue">${esc(x.venue || '')}${x.kind ? ` <em>${esc(x.kind)}</em>` : ''}</p></div></li>`).join('');
  const th = p.thanks && (p.thanks.items || []).length ? `<p class="pub-thanks"><strong>${esc(p.thanks.label || 'Also acknowledged in')}:</strong> ${p.thanks.items.map(x => `${link(x.title, x.url)} (${esc(x.venue)}, ${esc(x.year)})`).join('; ')}</p>` : '';
  return `<section class="section wash"><div class="wrap"><div class="sec-head"><h2>${esc(p.title || 'Publications')}</h2></div>
    ${p.intro ? `<p class="pub-intro">${esc(p.intro)}</p>` : ''}<ul class="pubs">${items}</ul>${th}</div></section>`;
}

function renderAbout() {
  const a = site.about || {};
  app().innerHTML = `
  <div class="wrap about-hero reveal-hero">
    <div><h1>${esc(a.headline)}</h1>${paras(a.intro)}</div>
    <div class="portrait" role="img" aria-label="Portrait">${a.photo ? `<img src="${esc(a.photo)}" alt="Portrait of ${esc(site.name)}">` : esc((site.firstName || site.name || 'R')[0])}</div>
  </div>
  <section class="section"><div class="wrap"><div class="sec-head"><h2>How I work</h2></div>
    <div class="how">${(a.how || []).map(x => `<div><h3>${esc(x.title)}</h3><p>${md(x.text)}</p></div>`).join('')}</div></div></section>
  <section class="section wash"><div class="wrap"><div class="sec-head"><h2>Where I've worked</h2></div>
    <div class="xp">${(a.experience || []).map(x => `<div class="xp-row"><div><h3>${esc(x.org)}</h3><span>${esc(x.role)}</span></div><p>${md(x.text)}</p></div>`).join('')}</div></div></section>
  ${pubs(a.publications)}
  <section class="section"><div class="wrap"><div class="sec-head"><h2>Outside the work</h2></div>
    <div style="max-width:680px">${paras(a.outside)}</div></div></section>`;
}

async function renderCase(slug, my) {
  const missing = `<div class="wrap" style="padding:80px 28px"><h1>That project isn't here</h1><p><a href="#work">Back to my work</a></p></div>`;
  if (!/^[a-z0-9-]+$/.test(slug)) { app().innerHTML = missing; return; }
  const cs = await study(slug);
  if (my !== runId) return;
  if (!cs) { app().innerHTML = missing; return; }
  document.title = `${cs.title} | ${site.name}`;
  const meta = [['Company', cs.company], ['Role', cs.role], ['Timeline', cs.timeline], ['Team', cs.team], ['Status', cs.status]].filter(m => m[1]);
  const secs = cs.sections || [];
  const body = secs.map((s, i) => {
    const head = s.heading ? `<h2>${esc(s.heading)}</h2>` : '';
    let b;
    if (s.type === 'bullets') b = `<ul>${(s.items || []).map(x => `<li>${md(x)}</li>`).join('')}</ul>`;
    else if (s.type === 'metrics') b = `<div class="metrics">${(s.metrics || []).map(m => `<div class="metric"><b>${esc(m.value)}</b><span>${esc(m.label)}</span></div>`).join('')}</div>`;
    else if (s.type === 'image') b = `<figure><div class="shot">${s.image ? `<img src="${esc(s.image)}" alt="${esc(s.caption || '')}">` : 'Add a screenshot or prototype here'}</div>${s.caption ? `<figcaption>${esc(s.caption)}</figcaption>` : ''}</figure>`;
    else if (s.type === 'gallery') b = `${s.body ? paras(s.body) : ''}<figure><div class="gallery">${(s.items || []).map(x => `<div class="g-item"><img src="${esc(x.image)}" alt="${esc(x.alt || x.caption || '')}" loading="lazy">${x.caption ? `<span>${esc(x.caption)}</span>` : ''}</div>`).join('')}</div>${s.caption ? `<figcaption>${esc(s.caption)}</figcaption>` : ''}</figure>`;
    else if (s.type === 'button') b = `${s.body ? paras(s.body) : ''}<p><a class="btn btn-primary" href="${esc(s.url)}" target="_blank" rel="noopener">${esc(s.label || 'Open')} <span aria-hidden="true">&#8599;</span></a></p>`;
    else if (s.type === 'embed') b = `<figure class="embed"><iframe src="${esc(s.src)}" title="${esc(s.title || s.heading || 'Embedded document')}" loading="lazy" allow="fullscreen"></iframe>${s.caption ? `<figcaption>${esc(s.caption)}${s.link ? ` <a href="${esc(s.link)}" target="_blank" rel="noopener">Open the full PDF</a>` : ''}</figcaption>` : ''}</figure>`;
    else if (s.type === 'quote') b = `<blockquote>${esc(s.quote)}${s.attribution ? `<cite>${esc(s.attribution)}</cite>` : ''}</blockquote>`;
    else b = paras(s.body);
    return `<section class="cs-sec" id="s${i}">${head}${b}</section>`;
  }).join('');
  const toc = secs.map((s, i) => s.heading ? `<button type="button" data-t="s${i}">${esc(s.heading)}</button>` : '').join('');
  const feat = featuredList();
  const nextSlug = feat[(feat.indexOf(cs.slug) + 1) % feat.length];
  const n = nextSlug && nextSlug !== cs.slug ? await study(nextSlug) : null;
  if (my !== runId) return;
  app().innerHTML = `<div class="wrap"><div class="cs-head reveal-hero"><a class="back" href="#work">Back to my work</a>
    <h1>${esc(cs.title)}</h1><p class="cs-sum">${esc(cs.summary)}</p>
    <dl class="meta">${meta.map(([k, v]) => `<div><dt>${k}</dt><dd>${esc(v)}</dd></div>`).join('')}</dl></div>
    <div class="cs-cover">${cover(cs, true)}</div>
    ${cs.draft ? `<div class="draft"><strong>Draft outline.</strong> Replace the bracketed prompts with your story, then set draft to false.</div>` : ''}
    <div class="cs-body"><nav class="toc" aria-label="On this page">${toc}</nav><div>${body}
    ${n ? `<div class="next"><p>Next project</p><a href="${csLink(n.slug)}">${esc(n.title)}</a></div>` : ''}</div></div></div>`;
  app().querySelectorAll('.toc button').forEach(b => b.addEventListener('click', () => document.getElementById(b.dataset.t)?.scrollIntoView({ behavior: 'smooth' })));
}

async function route() {
  const my = ++runId;
  const hash = decodeURIComponent((location.hash || '').slice(1));
  const lensHash = hash.match(/^for-([a-z0-9-]+)$/);
  if (lensHash) activeLens = (site.lenses || []).some(l => l.key === lensHash[1]) ? lensHash[1] : null;
  else if (hash === '' || hash === 'home') activeLens = null;
  document.title = `${site.name} | Product designer for AI`;
  let name = 'home';
  if (hash === 'about') name = 'about';
  else if (hash.startsWith('case-')) name = 'case';
  renderHeader(name);
  if (name === 'about') { document.title = `About | ${site.name}`; renderAbout(); window.scrollTo(0, 0); }
  else if (name === 'case') { await renderCase(hash.slice(5), my); window.scrollTo(0, 0); }
  else {
    await renderHome(my);
    const target = ['work', 'strengths', 'lab'].includes(hash) ? document.getElementById(hash) : null;
    if (target) target.scrollIntoView(); else window.scrollTo(0, 0);
  }
}

(async function init() {
  try {
    site = await getJSON('content/site.json');
    renderFooter();
    window.addEventListener('hashchange', route);
    await route();
  } catch (e) {
    console.error(e);
    app().innerHTML = `<div class="wrap" style="padding:80px 28px"><h1>Content didn't load</h1><p>Check that content/site.json exists and is valid JSON.</p></div>`;
  }
})();

document.addEventListener('click', e => {
  const b = e.target.closest('[data-car]'); if (!b) return;
  const t = document.querySelector('.car-track'); if (!t) return;
  t.scrollBy({ left: Number(b.dataset.car) * t.clientWidth * 0.8, behavior: 'smooth' });
});

function initCarousel() {
  const t = document.querySelector('.car-track');
  if (!t || t.children.length < 3) return;
  const n = t.children.length / 3;
  const span = () => t.children[n].offsetLeft - t.children[0].offsetLeft;
  const pad = () => parseFloat(getComputedStyle(t).paddingLeft) || 0;
  t.style.scrollBehavior = 'auto';
  t.scrollLeft = t.children[n].offsetLeft - pad();
  t.style.scrollBehavior = '';
  let timer;
  t.addEventListener('scroll', () => {
    clearTimeout(timer);
    timer = setTimeout(() => {
      const w = span(), mid = t.children[n].offsetLeft - pad();
      if (t.scrollLeft < mid - w * 0.5 || t.scrollLeft > mid + w * 0.5) {
        t.style.scrollBehavior = 'auto';
        t.scrollLeft += t.scrollLeft < mid ? w : -w;
        t.style.scrollBehavior = '';
      }
    }, 140);
  }, { passive: true });
}
