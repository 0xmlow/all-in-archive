/* Podcast corpus viewer. Renders entirely from data/*.json. */

const D = {};
const root = document.documentElement;
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;' }[c]));
const bl = n => `assets/blossom-${n}.svg`;
const inline = v => esc(v)
  .replace(/&lt;b&gt;/g, '<b>').replace(/&lt;\/b&gt;/g, '</b>')
  .replace(/&lt;a href=&quot;([^&"]+)&quot;[^&]*&gt;/g, '<a href="$1" target="_blank" rel="noopener">')
  .replace(/&lt;\/a&gt;/g, '</a>');
const vidOf = e => { const u = e.youtube || ''; return u.includes('=') ? u.split('=').pop() : u.split('/').pop(); };
const thumbOf = e => { const v = vidOf(e); if (!v) return ''; return (typeof THUMBS !== 'undefined' && THUMBS[v]) ? THUMBS[v] : `https://i.ytimg.com/vi/${v}/mqdefault.jpg`; };
const fmtDate = d => {
  const [y, m, dd] = d.split('-');
  return new Date(+y, +m - 1, +dd).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
};

/* ---------------- theme ---------------- */
const saved = (() => { try { return localStorage.getItem('eis-theme'); } catch { return null; } })();
if (saved) root.setAttribute('data-theme', saved);
else if (window.matchMedia && matchMedia('(prefers-color-scheme: dark)').matches) root.setAttribute('data-theme', 'dark');

function isDark(){ return root.getAttribute('data-theme') === 'dark'; }
function syncLogos() {
  // The logo swaps files because the eye is true colour and must not invert.
  // The blossom marks are solid black svgs, so CSS inverts those instead.
  const v = isDark() ? 'white' : 'black';
  $$('img[data-logo], img[src*="logo-"]').forEach(i => {
    i.setAttribute('src', `assets/logo-${v}.png`);
  });
}
$('#theme-toggle').addEventListener('click', () => {
  const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  try { localStorage.setItem('eis-theme', next); } catch {}
  syncLogos();
});

/* ---------------- tabs ---------------- */
$$('.tab').forEach(t => t.addEventListener('click', () => {
  $$('.tab').forEach(x => x.setAttribute('aria-selected', 'false'));
  t.setAttribute('aria-selected', 'true');
  $$('.panel').forEach(p => p.classList.remove('active'));
  $('#panel-' + t.dataset.panel).classList.add('active');
  window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
}));

/* ---------------- block renderer ---------------- */
function block(b) {
  switch (b.t) {
    case 'p': return `<p>${b.v}</p>`;
    case 'h': return `<h3>${esc(b.v)}</h3>`;
    case 'ul': return `<ul>${b.v.map(x => `<li>${x}</li>`).join('')}</ul>`;
    case 'ol': return `<ol>${b.v.map(x => `<li>${x}</li>`).join('')}</ol>`;
    case 'rules': return `<ol class="rules">${b.v.map(x => `<li>${x}</li>`).join('')}</ol>`;
    case 'quote': return `<blockquote class="q"><p>${esc(b.v)}</p><cite>${esc(b.cite || '')}</cite></blockquote>`;
    case 'pair': return `<div class="grid2">${b.v.map(c => `
        <div class="card"><span class="pill k">${esc(c.label)}</span>
        <h4 style="margin-top:12px">${esc(c.h)}</h4><p>${inline(c.p)}</p></div>`).join('')}</div>`;
    case 'cards': return `<div class="grid3" style="margin:24px 0">${b.v.map(c => `
        <div class="card"><h4>${esc(c.h)}</h4><p>${inline(c.p)}</p></div>`).join('')}</div>`;
    case 'cards2': return `<div class="grid2" style="margin:24px 0">${b.v.map(c => `
        <div class="card"><h4>${esc(c.h)}</h4><ul style="font-size:15px;padding-left:1.1em">${c.items.map(i => `<li>${i}</li>`).join('')}</ul></div>`).join('')}</div>`;
    case 'ksplit': return `<div class="ksplit">
        <div class="kleg up"><h4>&uarr; ${esc(b.up.h)}</h4><ul>${b.up.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>
        <div class="kleg down"><h4>&darr; ${esc(b.down.h)}</h4><ul>${b.down.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div></div>`;
    case 'timeline': return `<ul class="tl">${b.v.map(i => `<li><span class="when">${esc(i.when)}</span><p>${inline(i.p)}</p></li>`).join('')}</ul>`;
    case 'table': return `<div class="tw"><table><thead><tr>${b.cols.map(c => `<th>${esc(c)}</th>`).join('')}</tr></thead>
        <tbody>${b.rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
    case 'holdings': return `<div class="hold">${b.v.map(c => `
        <div class="hold-col ${c.tone}"><h4>${esc(c.label)}</h4>
        <ul>${c.items.map(i => `<li>${esc(i)}</li>`).join('')}</ul></div>`).join('')}</div>`;
    default: return '';
  }
}

/* ---------------- report ---------------- */
function renderReport() {
  const r = D.report;
  $('#hero-dek').textContent = r.meta.subtitle;
  $('#foot-updated').textContent = 'Corpus last updated ' + fmtDate(r.meta.updated);
  $('#report').innerHTML = r.sections.map(s => `
    <section class="sec" id="s-${s.id}">
      <div class="sec-head">
        <img class="bl" src="${bl(s.blossom)}" alt="" aria-hidden="true">
        <div><p class="eyebrow">${esc(s.eyebrow)}</p><h2>${esc(s.title)}</h2></div>
      </div>
      ${s.blocks.map(block).join('')}
    </section>`).join('');
  $('#toc').innerHTML = r.sections.map(s => `<a href="#s-${s.id}">${esc(s.title)}</a>`).join('');

  const obs = new IntersectionObserver(es => es.forEach(e => {
    if (e.isIntersecting) {
      $$('#toc a').forEach(a => a.classList.remove('on'));
      const a = $(`#toc a[href="#${e.target.id}"]`);
      if (a) a.classList.add('on');
    }
  }), { rootMargin: '-80px 0px -70% 0px' });
  $$('.sec').forEach(s => obs.observe(s));
}

/* ---------------- stats ---------------- */
function renderChrome() {
  const s = D.stats, L = s.links || {};
  const show = s.show || 'Podcast';
  document.title = show + ' Decoded';
  $('#hero-show').textContent = show;
  $('#hero-title').innerHTML = esc(show) + ' <span class="em">Decoded</span>';
  if (s.brand?.wordmark) $('#wordmark').textContent = s.brand.wordmark;
  $('#cover-cap').textContent = [s.host, s.first ? 'since ' + fmtDate(s.first) : '']
    .filter(Boolean).join(' \u00b7 ');
  $('#foot-note').textContent =
    `Analysis of ${show}. Independent summary and commentary, not affiliated with the show.`;
  const order = [['youtube','YouTube'],['substack','Substack'],['apple','Apple'],
                 ['spotify','Spotify'],['web','Website']];
  $('#show-links').innerHTML = order
    .filter(([k]) => L[k])
    .map(([k, l]) => `<a class="chip" href="${L[k]}" target="_blank" rel="noopener">${l}</a>`)
    .join('') +
    `<span style="flex-basis:100%;height:0"></span>` +
    `<a class="chip dl" href="downloads/report.pdf" download>PDF</a>` +
    `<a class="chip dl" href="downloads/report.docx" download>Word</a>`;
  const img = $('#cover-img');
  if (img) img.onerror = () => { img.closest('.cover').style.display = 'none'; };
}

function renderStats() {
  const s = D.stats;
  const cells = [
    ['episodes', s.episodes, 'Episodes'],
    ['transcripts', s.transcripts, 'Transcripts'],
    ['words', (s.words / 1000).toFixed(0) + 'k', 'Words read'],
    ['hours', s.hours, 'Hours of audio'],
    ['sub', s.substackPosts, 'Substack posts'],
    ['guests', s.guests, 'Guests indexed'],
  ].filter(([k, v]) => !(k === 'sub' && !v));
  $('#stats').innerHTML = cells.map(([k, v, l]) => `<div class="stat"><b>${v}</b><small>${l}</small></div>`).join('');
  if (s.first && s.last) {
    const f = new Date(s.first), l = new Date(s.last);
    const o = { month: 'short', year: 'numeric' };
    $('#hero-range').textContent = f.toLocaleDateString('en-GB', o) + ' to ' + l.toLocaleDateString('en-GB', o);
  }
}

/* ---------------- episodes ---------------- */
const state = { q: '', kind: 'all', theme: 'all' };
const KINDS = [['all', 'All'], ['deep-dive', 'Deep dive'], ['wrap', 'Weekly wrap'], ['masterclass', 'Masterclass']];

function renderFilters() {
  $('#kind-filters').innerHTML = KINDS.map(([k, l]) =>
    `<button class="f ${k === 'all' ? 'on' : ''}" data-kind="${k}">${l}</button>`).join('');
  $('#theme-filters').innerHTML = `<button class="f on" data-theme-f="all">All themes</button>` +
    Object.entries(D.themes).map(([k, v]) => `<button class="f" data-theme-f="${k}">${esc(v.label)}</button>`).join('');
  $$('[data-kind]').forEach(b => b.addEventListener('click', () => {
    state.kind = b.dataset.kind;
    $$('[data-kind]').forEach(x => x.classList.toggle('on', x === b));
    renderEpisodes();
  }));
  $$('[data-theme-f]').forEach(b => b.addEventListener('click', () => {
    state.theme = b.dataset.themeF;
    $$('[data-theme-f]').forEach(x => x.classList.toggle('on', x === b));
    renderEpisodes();
  }));
  $('#q').addEventListener('input', e => { state.q = e.target.value.toLowerCase().trim(); renderEpisodes(); });
}

function renderEpisodes() {
  const list = D.episodes.filter(e => {
    if (state.kind !== 'all' && e.kind !== state.kind) return false;
    if (state.theme !== 'all' && !(e.themes || []).includes(state.theme)) return false;
    if (state.q) {
      const hay = (e.title + ' ' + (e.desc || '') + ' ' + (e.guests || []).join(' ')).toLowerCase();
      if (!hay.includes(state.q)) return false;
    }
    return true;
  }).slice().reverse();

  $('#count').textContent = `${list.length} of ${D.episodes.length}`;
  $('#eplist').innerHTML = list.length ? list.map(e => {
    const links = [
      e.youtube  ? `<a class="lnk" href="${e.youtube}" target="_blank" rel="noopener">YouTube</a>` : '',
      e.substack ? `<a class="lnk" href="${e.substack}" target="_blank" rel="noopener">Substack</a>` : '',
      e.audio    ? `<a class="lnk" href="${e.audio}" target="_blank" rel="noopener">Audio</a>` : '',
    ].filter(Boolean).join('');
    const themes = (e.themes || []).map(t => `<span class="pill th">${esc(D.themes[t]?.label || t)}</span>`).join('');
    const guests = (e.guests || []).length ? `<span class="pill">${esc(e.guests.join(', '))}</span>` : '';
    const th = thumbOf(e);
    return `<article class="ep">
      <div class="when"><b>${fmtDate(e.date)}</b>${e.num ? 'Ep ' + e.num : e.kind === 'wrap' ? 'Wrap' : ''}${e.minutes ? '<br>' + e.minutes + ' min' : ''}</div>
      ${th ? `<a class="epthumb" href="${e.youtube || '#'}" target="_blank" rel="noopener"><img loading="lazy" src="${th}" alt=""></a>` : '<div class="epthumb ph"></div>'}
      <div>
        <h4>${esc(e.title)}</h4>
        <p class="desc">${esc((e.desc || '').split('\n')[0])}</p>
        <div class="meta">${guests}${themes}${e.paid ? '<span class="pill paid">Paid</span>' : ''}</div>
      </div>
      <div class="acts">${links}</div>
    </article>`;
  }).join('') : `<div class="empty">Nothing blooming here yet.</div>`;
}

function renderBonus() {
  if (!D.bonus?.length) return;
  $('#bonus-block').innerHTML = `
    <h3 style="margin-top:48px">Bonus videos, not in the podcast feed</h3>
    <p style="color:var(--fg-muted);font-size:15px;max-width:70ch">
      The YouTube channel carries material that never reached the RSS feed, including panels and reaction episodes.</p>
    <div class="eplist">${D.bonus.map(b => `<article class="ep">
      <div class="when"><b>Bonus</b>${b.words ? Math.round(b.words / 130) + ' min' : ''}</div>
      <div><h4>${esc(b.title)}</h4></div>
      <div class="acts"><a class="lnk" href="${b.youtube}" target="_blank" rel="noopener">YouTube</a></div>
    </article>`).join('')}</div>`;
}

/* ---------------- themes ---------------- */
function renderThemes() {
  const counts = {};
  Object.keys(D.themes).forEach(k => counts[k] = D.episodes.filter(e => (e.themes || []).includes(k)));
  const order = Object.keys(D.themes).sort((a, b) => counts[b].length - counts[a].length);
  const max = Math.max(...order.map(k => counts[k].length), 1);

  $('#themes').innerHTML = `
    <div class="sec-head"><img class="bl" src="${bl('05')}" alt="" aria-hidden="true">
      <div><p class="eyebrow">Coverage map</p><h2>What the show actually talks about</h2></div></div>
    <p style="max-width:70ch;color:var(--fg-muted)">Each theme counts the episodes where its vocabulary appears heavily,
       measured across every transcript. Click a theme to read its episodes in order.</p>
    <div class="grid3" style="margin-top:32px">
      ${order.map(k => {
        const t = D.themes[k], eps = counts[k];
        const pct = Math.round(eps.length / max * 100);
        const first = eps[0], last = eps[eps.length - 1];
        return `<div class="card">
          <div style="display:flex;gap:12px;align-items:center;margin-bottom:12px">
            <img src="${bl(t.blossom)}" alt="" style="width:26px;height:26px">
            <h4 style="margin:0">${esc(t.label)}</h4>
          </div>
          <div style="height:6px;background:var(--bg-muted);border-radius:999px;overflow:hidden;margin-bottom:10px">
            <div style="height:100%;width:${pct}%;background:var(--accent)"></div>
          </div>
          <p style="font-family:var(--font-mono);font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:var(--fg-dim);margin:0">
            ${eps.length} episodes${first ? ' &middot; ' + first.date.slice(0, 7) + ' to ' + last.date.slice(0, 7) : ''}
          </p>
          <button class="f" style="margin-top:14px" data-jump="${k}">Show episodes</button>
        </div>`;
      }).join('')}
    </div>`;

  $$('[data-jump]').forEach(b => b.addEventListener('click', () => {
    state.theme = b.dataset.jump; state.kind = 'all'; state.q = ''; $('#q').value = '';
    $('.tab[data-panel="episodes"]').click();
    $$('[data-theme-f]').forEach(x => x.classList.toggle('on', x.dataset.themeF === state.theme));
    $$('[data-kind]').forEach(x => x.classList.toggle('on', x.dataset.kind === 'all'));
    renderEpisodes();
  }));
}

/* ---------------- guests ---------------- */
function renderGuests() {
  const count = g => D.episodes.filter(e => (e.guests || []).includes(g.name)).length;
  const rec = D.guests.filter(g => g.recurring).sort((a, b) => count(b) - count(a));
  const one = D.guests.filter(g => !g.recurring).sort((a, b) => a.name.localeCompare(b.name));
  const card = g => {
    const n = count(g);
    return `<div class="gcard">
      <h4>${esc(g.name)}</h4>
      <span class="firm">${esc(g.firm)}</span>
      <p class="beat">${esc(g.beat)}</p>
      <p>${esc(g.note)}</p>
      <div style="display:flex;gap:6px;flex-wrap:wrap;align-items:center">
        ${n ? `<span class="pill">${n} episode${n > 1 ? 's' : ''}</span>` : ''}
        ${g.link ? `<a class="lnk" href="${g.link}" target="_blank" rel="noopener">Profile</a>` : ''}
        <button class="lnk" data-guest="${esc(g.name)}">Episodes</button>
      </div></div>`;
  };
  $('#guests').innerHTML = `
    <div class="sec-head"><img class="bl" src="${bl('06')}" alt="" aria-hidden="true">
      <div><p class="eyebrow">The bench</p><h2>Who comes on</h2></div></div>
    <p style="max-width:70ch;color:var(--fg-muted)">${esc(D.stats.guestNote ||
       'Everyone who has appeared on the show, with their affiliation, beat and appearance count.')}</p>
    <h3>Recurring cast</h3><div class="grid3">${rec.map(card).join('')}</div>
    <h3 style="margin-top:48px">Notable one-offs</h3><div class="grid3">${one.map(card).join('')}</div>`;

  $$('[data-guest]').forEach(b => b.addEventListener('click', () => {
    state.q = b.dataset.guest.toLowerCase(); state.kind = 'all'; state.theme = 'all';
    $('.tab[data-panel="episodes"]').click();
    $('#q').value = b.dataset.guest;
    $$('[data-theme-f]').forEach(x => x.classList.toggle('on', x.dataset.themeF === 'all'));
    $$('[data-kind]').forEach(x => x.classList.toggle('on', x.dataset.kind === 'all'));
    renderEpisodes();
  }));
}

/* ---------------- update panel ---------------- */
function renderAbout() {
  const s = D.stats;
  $('#about').innerHTML = `
    <div class="sec-head"><img class="bl" src="${bl('07')}" alt="" aria-hidden="true">
      <div><p class="eyebrow">Keeping it current</p><h2>How to refresh this after a new episode</h2></div></div>
    <p style="max-width:70ch">This site reads entirely from JSON in <code>site/data/</code>. Nothing is hard coded.
       Running one command pulls any new episodes, fetches their transcripts, recomputes the theme map and rebuilds
       every page you are looking at.</p>
    <div class="card" style="max-width:70ch;margin:24px 0">
      <h4>One command</h4>
      <pre style="font-family:var(--font-mono);font-size:13px;background:var(--bg-muted);padding:16px;border-radius:14px;overflow-x:auto;margin:12px 0 0"><code>python3 pc_fetch.py --root . &amp;&amp; python3 pc_build.py --root .</code></pre>
    </div>
    <h3>What it does, in order</h3>
    <ol class="rules">
      <li><b>Pulls the feed.</b> Downloads the Megaphone RSS and diffs it against the episodes already on file.</li>
      <li><b>Finds new videos.</b> Lists the YouTube channel and matches new uploads to the new episodes by title.</li>
      <li><b>Fetches transcripts.</b> Pulls captions for anything new. Where captions are missing, it downloads the
          podcast audio and transcribes locally with Whisper, then scores the result for loops and dropout.</li>
      <li><b>Refreshes Substack.</b> Re-reads the archive so paid-only episodes stay counted.</li>
      <li><b>Rebuilds the data layer.</b> Recomputes themes, guests, statistics and links, then writes
          <code>site/data/*.json</code>.</li>
      <li><b>Reports.</b> Prints what changed so you know which episodes to read into the narrative.</li>
    </ol>
    <h3>What stays manual</h3>
    <p style="max-width:70ch">The narrative in The Report lives in <code>site/data/report.json</code>, one JSON file with
       plain text blocks. Adding a paragraph or a new timeline entry means editing that file. Everything else, the
       episode list, the theme map, the guest counts and the statistics, updates itself.</p>
    <p style="max-width:70ch">To add a guest, append an entry to <code>guests.json</code> with a name, firm, beat,
       note and any spellings the transcripts use. The matcher picks them up on the next build.</p>
    <h3>Current corpus</h3>
    <div class="tw"><table><thead><tr><th>Artefact</th><th>What it holds</th><th>Count</th></tr></thead><tbody>
      <tr><td>site/data/episodes.json</td><td>Every episode with dates, guests, themes, and links</td><td>${s.episodes}</td></tr>
      <tr><td>transcripts/</td><td>Caption tracks, cleaned and timestamped</td><td>${D.episodes.filter(e=>e.transcriptSrc==='captions').length}</td></tr>
      <tr><td>transcripts_whisper/</td><td>Local Whisper transcripts where captions were missing</td><td>${D.episodes.filter(e=>e.transcriptSrc==='whisper').length}</td></tr>
      <tr><td>site/data/guests.json</td><td>Guest registry with affiliations and links</td><td>${s.guests}</td></tr>
      <tr><td>site/data/themes.json</td><td>Theme vocabulary used to classify episodes</td><td>${Object.keys(D.themes).length}</td></tr>
      <tr><td>digest/</td><td>Every passage on each theme, in date order, for reading</td><td>10</td></tr>
    </tbody></table></div>
    <p class="note">Quotations throughout come from automated transcripts. They are short and dated, but check the
       wording against source audio before republishing any of them. Whisper output is a machine draft.</p>`;
}

/* ---------------- boot ---------------- */
Promise.all(['report', 'episodes', 'stats', 'themes', 'guests', 'bonus', 'extras']
  .map(n => fetch(`data/${n}.json`).then(r => r.ok ? r.json() : null).catch(() => null)))
  .then(([report, episodes, stats, themes, guests, bonus, extras]) => {
    Object.assign(D, { report, episodes, stats, themes, guests, bonus, extras });
    renderChrome(); renderStats(); renderReport(); renderFilters(); renderEpisodes();
    renderBonus(); renderThemes(); renderGuests(); renderAbout();
    syncLogos();
  })
  .catch(err => {
    $('#report').innerHTML = `<div class="empty">Could not load the data files. Serve this folder over http, for example <code>python3 -m http.server</code>.</div>`;
    console.error(err);
  });
