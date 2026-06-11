/* ============ Navoiy viloyati yuridik xizmat markazlari — SPA ============ */
(function () {
  'use strict';

  /* ============================================================
     AUTH BOOTSTRAP — Supabase sozlangan bo'lsa, avval kirish darvozasi
     ============================================================ */
  const CFG = window.AUTH_CONFIG || {};

  /* Splash kirish ekrani — darhol boshqariladi (gate'dan mustaqil) */
  const splash = document.getElementById('splash');
  if (sessionStorage.getItem('splashed')) {
    splash.style.display = 'none';
  } else {
    setTimeout(() => {
      splash.classList.add('done');
      try { sessionStorage.setItem('splashed', '1'); } catch (e) {}
      setTimeout(() => splash.remove(), 800);
    }, 1450);
  }

  const gate = document.getElementById('authGate');
  const gateForm = document.getElementById('authForm');
  const gateErr = document.getElementById('authErr');
  const gateBtn = document.getElementById('authBtn');
  const gateCard = document.querySelector('.ag-card');

  document.getElementById('authEye').addEventListener('click', () => {
    const p = document.getElementById('authPass');
    p.type = p.type === 'password' ? 'text' : 'password';
  });

  function gateShow() { gate.hidden = false; }
  function gateHide() {
    gate.classList.add('done');
    setTimeout(() => gate.remove(), 800);
  }
  function gateError(msg) {
    gateErr.textContent = msg;
    gateErr.hidden = false;
    gateCard.classList.remove('shake');
    void gateCard.offsetWidth;
    gateCard.classList.add('shake');
  }
  function gateBusy(b) {
    gateBtn.disabled = b;
    gateBtn.querySelector('.ag-btn-txt').hidden = b;
    gateBtn.querySelector('.ag-spin').hidden = !b;
  }

  function bootstrap() {
    const demo = new URLSearchParams(location.search).has('demoAuth');

    if (!CFG.url || !CFG.anonKey) {
      // Supabase hali ulanmagan — ochiq rejim (demo bayrog'i bilan darvozani ko'rish mumkin)
      if (demo) {
        gateShow();
        gateForm.addEventListener('submit', e => {
          e.preventDefault();
          gateBusy(true);
          setTimeout(() => { gateHide(); initApp(null); }, 900);
        });
      } else {
        initApp(null);
      }
      return;
    }

    const client = window.supabase.createClient(CFG.url, CFG.anonKey);

    async function loadAndStart() {
      const { data: row, error } = await client.from('site_data').select('data').eq('id', 1).single();
      if (error || !row) { gateShow(); gateError('Maʼlumotni yuklashda xatolik. Qayta urinib koʻring.'); gateBusy(false); return; }
      let profile = null;
      try {
        const { data: u } = await client.auth.getUser();
        const { data: p } = await client.from('profiles').select('*').eq('user_id', u.user.id).single();
        profile = p;
      } catch (e) {}
      window.SITE_DATA = row.data;
      gateHide();
      initApp({ client, profile });
    }

    client.auth.getSession().then(({ data }) => {
      if (data.session) loadAndStart();
      else gateShow();
    });

    gateForm.addEventListener('submit', async e => {
      e.preventDefault();
      gateErr.hidden = true;
      gateBusy(true);
      const login = document.getElementById('authLogin').value.trim().toLowerCase();
      const pass = document.getElementById('authPass').value;
      const { error } = await client.auth.signInWithPassword({
        email: login.includes('@') ? login : login + '@navoiy-adliya.uz',
        password: pass
      });
      if (error) {
        gateBusy(false);
        gateError('Login yoki parol notoʻgʻri');
        return;
      }
      loadAndStart();
    });
  }

  /* ============================================================
     ASOSIY ILOVA
     ============================================================ */
  function initApp(authCtx) {

  const DATA = window.SITE_DATA;
  const app = document.getElementById('app');
  const navEl = document.getElementById('districtNav');
  const searchInput = document.getElementById('globalSearch');

  // Server rejimida tahrirlarni umumiy bazaga yozish
  async function pushData() {
    if (!authCtx) return;
    const clean = JSON.parse(JSON.stringify({ districts: DATA.districts },
      (k, v) => k.startsWith('_') ? undefined : v));
    const { error } = await authCtx.client.from('site_data')
      .update({ data: clean, updated_by: authCtx.profile ? authCtx.profile.login : 'admin', updated_at: new Date().toISOString() })
      .eq('id', 1);
    if (error) alert('Saqlashda xatolik: ' + error.message);
  }

  /* ---------- Admin tahrirlari: indekslash + saqlangan o'zgarishlarni qo'llash ---------- */
  function getOverrides() {
    try { return JSON.parse(localStorage.getItem('overrides') || '{}'); } catch (e) { return {}; }
  }
  (function initData() {
    const ov = authCtx ? {} : getOverrides(); // server rejimida lokal tahrirlar ishlatilmaydi
    DATA.districts.forEach(d => {
      d.orgs.forEach((o, i) => {
        o._di = d.id; o._oi = i;
        ['r', 'k', 'b'].forEach(role => {
          const key = `org|${d.id}|${i}|${role}`;
          if (ov[key]) { o[role].fio = ov[key].fio; o[role].tel = ov[key].tel; }
        });
      });
      d.markaz.forEach((s, i) => {
        s._di = d.id; s._si = i;
        const key = `staff|${d.id}|${i}`;
        if (ov[key]) { s.fio = ov[key].fio; s.tel = ov[key].tel; }
      });
    });
  })();

  const esc = s => String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

  const ICONS = {
    pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/><circle cx="12" cy="10" r="3"/></svg>',
    phone: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>',
    user: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.6-6.5 8-6.5s8 2.5 8 6.5"/></svg>',
    award: '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="9" r="6"/><path d="m9 14-1.5 7L12 18.5 16.5 21 15 14"/></svg>',
    search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
    chief: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    calc: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M8 6h8"/><path d="M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h.01M16 19h.01"/></svg>'
  };

  /* ---------- helpers ---------- */
  const catOfOrg = o => /dmtt/i.test(o.org) ? 'dmtt' : /^\d+\s*-?\s*maktab/i.test(o.org) ? 'maktab' : 'other';
  const isCity = d => /shahri/i.test(d.name);
  const CITY_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 22V4a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v18Z"/><path d="M6 12H4a2 2 0 0 0-2 2v8h4"/><path d="M18 9h2a2 2 0 0 1 2 2v11h-4"/><path d="M10 6h4M10 10h4M10 14h4M10 18h4"/></svg>';

  // qidiruv so'rovini normallashtirish: kirill kiritilsa lotinga o'girish
  const C2L = { 'а':'a','б':'b','в':'v','г':'g','д':'d','е':'e','ё':'yo','ж':'j','з':'z','и':'i','й':'y','к':'k','л':'l','м':'m','н':'n','о':'o','п':'p','р':'r','с':'s','т':'t','у':'u','ф':'f','х':'x','ц':'ts','ч':'ch','ш':'sh','щ':'sh','ъ':'ʼ','ь':'','э':'e','ю':'yu','я':'ya','ў':'oʻ','қ':'q','ғ':'gʻ','ҳ':'h','ы':'i' };
  function normQuery(q) {
    q = q.trim().toLowerCase();
    if (/[а-яёўқғҳ]/.test(q)) q = q.split('').map(c => C2L[c] !== undefined ? C2L[c] : c).join('');
    return q;
  }

  // topilgan so'zni natijalarda <mark> bilan belgilash
  function highlight(container, q) {
    if (!q || q.length < 2) return;
    const re = new RegExp('(' + q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') + ')', 'gi');
    const walker = document.createTreeWalker(container, NodeFilter.SHOW_TEXT);
    const nodes = [];
    let n;
    while ((n = walker.nextNode())) {
      if (n.parentElement.closest('mark, script, style, .edit-btn')) continue;
      if (re.test(n.nodeValue)) nodes.push(n);
      re.lastIndex = 0;
    }
    nodes.forEach(node => {
      const frag = document.createDocumentFragment();
      node.nodeValue.split(re).forEach((part, i) => {
        if (i % 2) {
          const m = document.createElement('mark');
          m.textContent = part;
          frag.appendChild(m);
        } else if (part) {
          frag.appendChild(document.createTextNode(part));
        }
      });
      node.parentNode.replaceChild(frag, node);
    });
  }

  const TEL_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z"/></svg>';

  function telLinks(tels) {
    if (!tels || !tels.length) return '';
    return tels.map(t =>
      `<a href="tel:${t.replace(/\s/g, '')}">${TEL_ICON}${esc(t)}</a>`
    ).join('');
  }

  const EDIT_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>';

  function personHtml(label, cls, icon, p, di, oi, detail) {
    const hasData = (p.fio && p.fio.length) || (p.tel && p.tel.length);
    const actions = detail && p.fio && p.tel && p.tel.length
      ? `<div class="card-actions">
           <button class="mini-btn" data-vcf data-fio="${esc(p.fio)}" data-pos="${esc(label)}" data-tel="${esc(p.tel[0])}">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>
             Kontaktga
           </button>
           <button class="mini-btn" data-qr data-fio="${esc(p.fio)}" data-tel="${esc(p.tel[0])}">
             <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM21 14v3M14 21h3M21 21h.01"/></svg>
             QR-kod
           </button>
         </div>`
      : '';
    return `<div class="person ${cls}${detail ? ' detail' : ''}">
      <button class="edit-btn" data-edit="org" data-d="${di}" data-i="${oi}" data-role="${cls}" title="Tahrirlash">${EDIT_ICON}</button>
      <div class="label">${icon}${label}</div>
      ${hasData
        ? `${p.fio ? `<div class="fio">${esc(p.fio)}</div>` : ''}
           <div class="tels">${telLinks(p.tel)}</div>${actions}`
        : '<div class="empty">Maʼlumot kiritilmagan</div>'}
    </div>`;
  }

  /* Ixcham tashkilot kartasi — bosganda ichiga kiriladi */
  const CAT_META = {
    maktab: { name: 'Maktab', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c3 3 9 3 12 0v-5"/></svg>' },
    dmtt:   { name: 'DMTT', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><path d="M9 9h.01M15 9h.01"/></svg>' },
    other:  { name: 'Tashkilot', icon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l7-4 7 4v14"/><path d="M9 9h.01M15 9h.01M9 13h.01M15 13h.01M9 17h6"/></svg>' }
  };

  function orgCard(o, idx) {
    const cat = catOfOrg(o);
    return `<a class="orgc tilt rv c-${cat}" href="#/hudud/${o._di}/t/${o._oi}">
      <span class="orgc-icon">${CAT_META[cat].icon}</span>
      <span class="orgc-body">
        <span class="orgc-name">${esc(o.org)}</span>
        <span class="orgc-sub">${o.r.fio ? esc(o.r.fio) : 'Rahbar koʻrsatilmagan'}</span>
      </span>
      <span class="orgc-go" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
      </span>
    </a>`;
  }

  function orgRow(o, idx) {
    return `<div class="org-row rv">
      <div class="org-head"><span class="num">${idx}</span><h4>${esc(o.org)}</h4></div>
      <div class="org-people">
        ${personHtml('Rahbar', 'r', ICONS.chief, o.r, o._di, o._oi)}
        ${personHtml('Kadrlar boʻlimi', 'k', ICONS.team, o.k, o._di, o._oi)}
        ${personHtml('Buxgalter', 'b', ICONS.calc, o.b, o._di, o._oi)}
      </div>
    </div>`;
  }

  function staffCard(s) {
    const isChief = /boshli/i.test(s.lavozim);
    const vacant = /^vakant$/i.test(s.fio);
    const photo = s.photo
      ? `<img src="${esc(s.photo)}" alt="${esc(s.fio)}" loading="lazy"
           onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">
         <div class="ph-fallback" style="display:none">${ICONS.user}<span>Rasm mavjud emas</span></div>`
      : `<div class="ph-fallback">${ICONS.user}<span>${vacant ? 'Boʻsh lavozim' : 'Rasm mavjud emas'}</span></div>`;
    return `<div class="staff-card tilt rv${vacant ? ' vacant' : ''}">
      <div class="staff-photo">
        ${photo}
        <span class="staff-role${isChief ? ' chief' : ''}">${isChief ? 'MARKAZ BOSHLIGʻI' : 'BOSH YURISKONSULT'}</span>
        <button class="edit-btn" data-edit="staff" data-d="${s._di}" data-i="${s._si}" title="Tahrirlash">${EDIT_ICON}</button>
      </div>
      <div class="staff-body">
        <h4>${esc(s.fio)}</h4>
        <div class="pos">${esc(s.lavozim)}</div>
        ${s.tel && s.tel.length
          ? `<a class="tel-link" href="tel:${s.tel[0].replace(/\s/g, '')}">${ICONS.phone}${esc(s.tel[0])}</a>
             <div class="card-actions">
               <button class="mini-btn" data-vcf data-fio="${esc(s.fio)}" data-pos="${esc(s.lavozim)}" data-tel="${esc(s.tel[0])}">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><path d="M17 21v-8H7v8"/><path d="M7 3v5h8"/></svg>
                 Kontaktga
               </button>
               <button class="mini-btn" data-qr data-fio="${esc(s.fio)}" data-tel="${esc(s.tel[0])}">
                 <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><path d="M14 14h3v3h-3zM21 14v3M14 21h3M21 21h.01"/></svg>
                 QR-kod
               </button>
             </div>`
          : '<span class="tel-link" style="color:#aab4c4">—</span>'}
        ${s.yutuq
          ? `<button class="yutuq-toggle" data-toggle>${ICONS.award} Yutuqlari</button>
             <div class="yutuq-text">${esc(s.yutuq)}</div>`
          : ''}
      </div>
    </div>`;
  }

  /* ---------- views ---------- */
  function renderHome() {
    const totalOrgs = DATA.districts.reduce((a, d) => a + d.orgs.length, 0);
    const totalStaff = DATA.districts.reduce((a, d) => a + d.markaz.length, 0);
    app.innerHTML = `
      <section class="hero hero-split rv">
        <div class="hero-left">
          <span class="hero-badge"><span class="dot"></span>Rasmiy maʼlumotnoma</span><span class="update-badge"><span class="pulse"></span>Maʼlumotlar 2026-yil iyun holatiga</span>
          <h1>Yuridik xizmat koʻrsatish markazlari maʼlumotnomasi</h1>
          <p>Navoiy viloyati tuman va shaharlaridagi yuridik xizmat koʻrsatish markazlari xodimlari hamda
             tashkilotlarning masʼul xodimlari (rahbar, kadrlar boʻlimi, buxgalter) toʻgʻrisidagi maʼlumotlar.
             Kerakli hududni tanlang yoki qidiruvdan foydalaning.</p>
          <div class="hero-stats">
            <div class="stat tilt"><b data-counter="${DATA.districts.length}">0</b><span>tuman va shahar</span></div>
            <div class="stat tilt"><b data-counter="${totalStaff}">0</b><span>markaz xodimi</span></div>
            <div class="stat tilt"><b data-counter="${totalOrgs}">0</b><span>tashkilot</span></div>
          </div>
          <div class="hero-cta">
            <a class="btn-main" href="#hududlar" data-scroll>Hududni tanlash
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg></a>
            <a class="btn-ghost" href="#/statistika"><svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/></svg>Statistika</a>
          </div>
        </div>
        <div class="hero-right" aria-hidden="true">
          <span class="emblem-ring"></span>
          <div class="emblem-tile">
            <img src="img/logo.png" alt="Adliya vazirligi gerbi">
          </div>
          <span class="float-chip c1"><b>${DATA.districts.length}</b> tuman va shahar</span>
          <span class="float-chip c2"><b>${totalOrgs}</b> tashkilot</span>
          <span class="float-chip c3"><b>${totalStaff}</b> markaz xodimi</span>
        </div>
      </section>
      ${[
        { title: 'Shaharlar', items: DATA.districts.filter(isCity), anchor: 'hududlar' },
        { title: 'Tumanlar', items: DATA.districts.filter(d => !isCity(d)), anchor: '' }
      ].map(g => `
      <h2 class="section-title rv" ${g.anchor ? `id="${g.anchor}"` : ''}><span class="bar"></span>${g.title}
        <span class="count">${g.items.length}</span></h2>
      <div class="district-grid">
        ${g.items.map(d => `
          <a class="district-card tilt rv${isCity(d) ? ' city' : ''}" href="#/hudud/${d.id}">
            <span class="dc-type">${isCity(d) ? 'Shahar' : 'Tuman'}</span>
            <div class="dc-top">
              <span class="dc-icon">${isCity(d) ? CITY_ICON : ICONS.pin}</span>
              <h3>${esc(d.name.replace(/ (shahri|tumani)$/i, ''))}</h3>
            </div>
            <div class="district-meta">
              <span>${d.markaz.length} markaz xodimi</span>
              <span>${d.orgs.length} tashkilot</span>
            </div>
            <span class="go">Batafsil <span aria-hidden="true">→</span></span>
          </a>`).join('')}
      </div>`).join('')}
      <h2 class="section-title rv"><span class="bar"></span>Tashkilotlar soni — hududlar kesimida</h2>
      <section class="hero rv chart-wrap" style="padding:26px 30px">
        ${[...DATA.districts].sort((a, b) => b.orgs.length - a.orgs.length).map(d => {
          const max = Math.max(...DATA.districts.map(x => x.orgs.length));
          return `<a class="chart-row" href="#/hudud/${d.id}">
            <span class="cname">${esc(d.name)}</span>
            <span class="cbar"><i data-w="${Math.round(d.orgs.length / max * 100)}"></i></span>
            <span class="cval">${d.orgs.length}</span>
          </a>`;
        }).join('')}
      </section>`;
    enhance();
  }

  function renderDistrict(id) {
    const d = DATA.districts.find(x => x.id === id);
    if (!d) { renderHome(); return; }
    app.innerHTML = `
      <section class="dist-head rv">
        <div class="breadcrumb"><a href="#/">Bosh sahifa</a> / ${esc(d.name)}</div>
        <h1>${esc(d.name)}</h1>
        <div class="sub">${esc(d.center)}</div>
      </section>

      <h2 class="section-title rv"><span class="bar"></span>Yuridik xizmat markazi xodimlari
        <span class="count">${d.markaz.length}</span></h2>
      <div class="staff-grid">${d.markaz.map(staffCard).join('')}</div>

      <h2 class="section-title rv"><span class="bar"></span>Tashkilotlar masʼul xodimlari
        <span class="count">${d.orgs.length}</span></h2>
      <div class="org-tools">
        <div class="org-search">${ICONS.search}
          <input type="search" id="orgFilter" placeholder="Tashkilot, F.I.O. yoki telefon boʻyicha izlash..." autocomplete="off">
        </div>
        <div class="filter-chips" id="orgChips">
          <button class="fchip active" data-f="all">Barchasi</button>
          <button class="fchip" data-f="maktab">Maktablar</button>
          <button class="fchip" data-f="dmtt">DMTT</button>
          <button class="fchip" data-f="other">Boshqa tashkilotlar</button>
        </div>
        <span class="org-count" id="orgCount">${d.orgs.length} ta tashkilot</span>
      </div>
      <div class="orgc-grid" id="orgList">
        ${d.orgs.map((o, i) => orgCard(o, i + 1)).join('')}
      </div>`;

    const filter = document.getElementById('orgFilter');
    const list = document.getElementById('orgList');
    const count = document.getElementById('orgCount');
    const chips = document.getElementById('orgChips');
    let activeCat = 'all';

    const catOf = catOfOrg;

    function applyOrgFilter() {
      const q = normQuery(filter.value);
      const qd = q.replace(/\D/g, '');
      const hits = d.orgs.filter(o => {
        if (activeCat !== 'all' && catOf(o) !== activeCat) return false;
        if (!q) return true;
        const hay = [o.org, o.r.fio, o.k.fio, o.b.fio].join(' ').toLowerCase();
        const tels = [...o.r.tel, ...o.k.tel, ...o.b.tel].join(' ').replace(/\D/g, '');
        return hay.includes(q) || (qd.length >= 3 && tels.includes(qd));
      });
      list.innerHTML = hits.length
        ? hits.map((o, i) => orgCard(o, i + 1)).join('')
        : '<div class="no-results">Hech narsa topilmadi</div>';
      count.textContent = `${hits.length} ta tashkilot`;
      if (q) highlight(list, q);
      enhance();
    }

    filter.addEventListener('input', applyOrgFilter);
    chips.addEventListener('click', e => {
      const c = e.target.closest('.fchip');
      if (!c) return;
      chips.querySelectorAll('.fchip').forEach(x => x.classList.remove('active'));
      c.classList.add('active');
      activeCat = c.dataset.f;
      applyOrgFilter();
    });
    enhance();
  }

  function renderSearch(q) {
    const ql = normQuery(q);
    const qd = ql.replace(/\D/g, '');
    if (ql.length < 2) { route(); return; }

    let staffHits = [], orgHits = [];
    DATA.districts.forEach(d => {
      d.markaz.forEach(s => {
        const tels = (s.tel || []).join(' ').replace(/\D/g, '');
        if (s.fio.toLowerCase().includes(ql) || (qd.length >= 3 && tels.includes(qd)))
          staffHits.push({ d, s });
      });
      d.orgs.forEach(o => {
        const hay = [o.org, o.r.fio, o.k.fio, o.b.fio].join(' ').toLowerCase();
        const tels = [...o.r.tel, ...o.k.tel, ...o.b.tel].join(' ').replace(/\D/g, '');
        if (hay.includes(ql) || (qd.length >= 3 && tels.includes(qd)))
          orgHits.push({ d, o });
      });
    });

    let html = `<section class="dist-head rv">
      <div class="breadcrumb"><a href="#/">Bosh sahifa</a> / Qidiruv</div>
      <h1>Qidiruv natijalari: «${esc(q)}»</h1>
      <div class="sub">${staffHits.length} markaz xodimi, ${orgHits.length} tashkilot topildi</div>
    </section>`;

    if (!staffHits.length && !orgHits.length) {
      html += '<div class="no-results">Hech narsa topilmadi. Qidiruv soʻzini oʻzgartirib koʻring.</div>';
    }

    if (staffHits.length) {
      html += `<h2 class="section-title"><span class="bar"></span>Markaz xodimlari
        <span class="count">${staffHits.length}</span></h2>`;
      const byD = {};
      staffHits.forEach(h => (byD[h.d.id] = byD[h.d.id] || { d: h.d, items: [] }).items.push(h.s));
      Object.values(byD).forEach(g => {
        html += `<div class="sr-district">${esc(g.d.name)}</div>
          <div class="staff-grid" style="margin-bottom:10px">${g.items.map(staffCard).join('')}</div>`;
      });
    }

    if (orgHits.length) {
      html += `<h2 class="section-title"><span class="bar"></span>Tashkilotlar
        <span class="count">${orgHits.length}</span></h2>`;
      const byD = {};
      orgHits.forEach(h => (byD[h.d.id] = byD[h.d.id] || { d: h.d, items: [] }).items.push(h.o));
      Object.values(byD).forEach(g => {
        html += `<div class="sr-district">${esc(g.d.name)} — ${g.items.length} ta</div>
          <div class="org-list" style="margin-bottom:14px">
            ${g.items.slice(0, 80).map((o, i) => orgRow(o, i + 1)).join('')}
          </div>`;
      });
    }
    app.innerHTML = html;
    highlight(app, ql);
    enhance();
  }

  /* ---------- visual enhancements: reveal, tilt, counters ---------- */
  const revealObserver = new IntersectionObserver(entries => {
    entries.forEach(en => {
      if (en.isIntersecting) {
        en.target.classList.add('in');
        revealObserver.unobserve(en.target);
      }
    });
  }, { threshold: .06, rootMargin: '0px 0px -30px 0px' });

  // motion.dev — spring fizikasi
  const M = (window.Motion && window.Motion.animate && window.Motion.animateValue)
    ? window.Motion : null;

  function animateCounter(el) {
    const target = +el.dataset.counter;
    if (M && M.animate) {
      M.animate(0, target, {
        type: 'spring', stiffness: 60, damping: 18,
        onUpdate: v => { el.textContent = Math.round(v); }
      });
      return;
    }
    const dur = 900, t0 = performance.now();
    const ease = t => 1 - Math.pow(1 - t, 3);
    (function tick(now) {
      const p = Math.min(1, (now - t0) / dur);
      el.textContent = Math.round(ease(p) * target);
      if (p < 1) requestAnimationFrame(tick);
    })(t0);
  }

  function enhance() {
    app.querySelectorAll('.rv:not(.in)').forEach((el, i) => {
      el.style.transitionDelay = Math.min(i % 12 * 45, 400) + 'ms';
      revealObserver.observe(el);
    });
    app.querySelectorAll('[data-counter]:not(.done)').forEach(el => {
      el.classList.add('done');
      animateCounter(el);
    });
    app.querySelectorAll('.cbar i[data-w], .sbar i[data-w]').forEach((el, i) => {
      if (M && M.animate) {
        // transform asosida (performant): width darhol, scaleX spring bilan
        el.style.width = el.dataset.w + '%';
        el.style.transition = 'none';
        M.animate(el, { scaleX: [0, 1] }, {
          type: 'spring', stiffness: 80, damping: 20,
          delay: .2 + i * .045
        });
      } else {
        setTimeout(() => { el.style.width = el.dataset.w + '%'; }, 250 + i * 40);
      }
    });
    applyLang();
  }

  /* 3D tilt — pointer-follow, delegated */
  const fine = matchMedia('(pointer: fine)').matches &&
               !matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (fine) {
    let raf = null;
    app.addEventListener('pointermove', e => {
      const card = e.target.closest('.tilt');
      if (!card) return;
      if (raf) cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - .5;
        const py = (e.clientY - r.top) / r.height - .5;
        card.style.setProperty('--mx', ((px + .5) * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((py + .5) * 100).toFixed(1) + '%');
        card.style.transition = 'box-shadow .4s';
        card.style.transform =
          `translateY(-8px) rotateX(${(-py * 7).toFixed(2)}deg) rotateY(${(px * 8).toFixed(2)}deg) scale(1.018)`;
      });
    });
    app.addEventListener('pointerout', e => {
      const card = e.target.closest('.tilt');
      if (card && !card.contains(e.relatedTarget)) {
        card.style.transition = '';
        card.style.transform = '';
      }
    }, true);
  }

  /* ---------- Tashkilot ichki sahifasi ---------- */
  function renderOrgDetail(di, oi) {
    const d = DATA.districts.find(x => x.id === di);
    const o = d && d.orgs[oi];
    if (!o) { renderDistrict(di); return; }
    const cat = catOfOrg(o);
    const phones = [...o.r.tel, ...o.k.tel, ...o.b.tel].length;
    app.innerHTML = `
      <section class="dist-head rv">
        <div class="breadcrumb">
          <a href="#/">Bosh sahifa</a> / <a href="#/hudud/${d.id}">${esc(d.name)}</a> / ${esc(o.org)}
        </div>
        <div class="orgd-head">
          <span class="orgd-icon c-${cat}">${CAT_META[cat].icon}</span>
          <div>
            <h1>${esc(o.org)}</h1>
            <div class="sub">${esc(d.name)} · ${CAT_META[cat].name} · ${phones} ta telefon raqami</div>
          </div>
        </div>
      </section>

      <h2 class="section-title rv"><span class="bar"></span>Masʼul xodimlar</h2>
      <div class="detail-people">
        ${personHtml('Rahbar', 'r', ICONS.chief, o.r, o._di, o._oi, true)}
        ${personHtml('Kadrlar boʻlimi', 'k', ICONS.team, o.k, o._di, o._oi, true)}
        ${personHtml('Buxgalter', 'b', ICONS.calc, o.b, o._di, o._oi, true)}
      </div>

      <div class="detail-nav rv">
        <a class="btn-ghost" href="#/hudud/${d.id}">
          <svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          ${esc(d.name)}ga qaytish
        </a>
        ${oi > 0 ? `<a class="btn-ghost" href="#/hudud/${d.id}/t/${oi - 1}">← ${esc(d.orgs[oi - 1].org)}</a>` : ''}
        ${oi < d.orgs.length - 1 ? `<a class="btn-ghost" href="#/hudud/${d.id}/t/${oi + 1}">${esc(d.orgs[oi + 1].org)} →</a>` : ''}
      </div>`;
    enhance();
  }

  /* ---------- Statistika sahifasi ---------- */
  function renderStats() {
    const totals = { maktab: 0, dmtt: 0, other: 0 };
    DATA.districts.forEach(d => d.orgs.forEach(o => totals[catOfOrg(o)]++));
    const totalOrgs = totals.maktab + totals.dmtt + totals.other;
    const totalStaff = DATA.districts.reduce((a, d) => a + d.markaz.length, 0);
    const pM = totals.maktab / totalOrgs * 100;
    const pD = totals.dmtt / totalOrgs * 100;
    const maxOrg = Math.max(...DATA.districts.map(d => d.orgs.length));

    app.innerHTML = `
      <section class="dist-head rv">
        <div class="breadcrumb"><a href="#/">Bosh sahifa</a> / Statistika</div>
        <h1>Statistika</h1>
        <div class="sub">Navoiy viloyati boʻyicha umumiy koʻrsatkichlar</div>
      </section>

      <div class="hero-stats" style="margin-top:26px">
        <div class="stat tilt rv"><b data-counter="${DATA.districts.length}">0</b><span>tuman va shahar</span></div>
        <div class="stat tilt rv"><b data-counter="${totalStaff}">0</b><span>markaz xodimi</span></div>
        <div class="stat tilt rv"><b data-counter="${totals.maktab}">0</b><span>maktab</span></div>
        <div class="stat tilt rv"><b data-counter="${totals.dmtt}">0</b><span>DMTT</span></div>
        <div class="stat tilt rv"><b data-counter="${totals.other}">0</b><span>boshqa tashkilot</span></div>
      </div>

      <div class="stats-grid">
        <div class="stat-panel rv">
          <h3><span class="dot9"></span>Tashkilotlar turlari boʻyicha</h3>
          <div class="donut-wrap">
            <div class="donut" style="background: conic-gradient(
              #2f54a8 0 ${pM}%,
              #c9a227 ${pM}% ${pM + pD}%,
              #157347 ${pM + pD}% 100%)">
              <div class="donut-center"><b>${totalOrgs}</b><span>tashkilot</span></div>
            </div>
            <div class="legend">
              <div class="li"><span class="sw c-m"></span>Maktablar <b>${totals.maktab}</b></div>
              <div class="li"><span class="sw c-d"></span>DMTT <b>${totals.dmtt}</b></div>
              <div class="li"><span class="sw c-o"></span>Boshqa tashkilotlar <b>${totals.other}</b></div>
            </div>
          </div>
        </div>

        <div class="stat-panel rv">
          <h3><span class="dot9"></span>Markaz xodimlari — hududlar boʻyicha</h3>
          <div class="stack-rows">
            ${[...DATA.districts].sort((a, b) => b.markaz.length - a.markaz.length).map(d => {
              const maxS = Math.max(...DATA.districts.map(x => x.markaz.length));
              return `<a class="stack-row" href="#/hudud/${d.id}">
                <span class="sname">${esc(d.name)}</span>
                <span class="sbar"><i class="sm" data-w="${Math.round(d.markaz.length / maxS * 100)}"></i></span>
                <span class="stotal">${d.markaz.length}</span>
              </a>`;
            }).join('')}
          </div>
        </div>

        <div class="stat-panel rv" style="grid-column: 1 / -1">
          <h3><span class="dot9"></span>Hududlar kesimida — maktab / DMTT / boshqa tashkilotlar</h3>
          <div class="stack-rows">
            ${[...DATA.districts].sort((a, b) => b.orgs.length - a.orgs.length).map(d => {
              const c = { maktab: 0, dmtt: 0, other: 0 };
              d.orgs.forEach(o => c[catOfOrg(o)]++);
              const w = n => Math.round(n / maxOrg * 100);
              return `<a class="stack-row" href="#/hudud/${d.id}">
                <span class="sname">${esc(d.name)}</span>
                <span class="sbar">
                  <i class="sm" data-w="${w(c.maktab)}" title="Maktablar: ${c.maktab}"></i>
                  <i class="sd" data-w="${w(c.dmtt)}" title="DMTT: ${c.dmtt}"></i>
                  <i class="so" data-w="${w(c.other)}" title="Boshqa: ${c.other}"></i>
                </span>
                <span class="stotal">${d.orgs.length}</span>
              </a>`;
            }).join('')}
          </div>
          <div class="legend" style="flex-direction: row; gap: 22px; margin-top: 18px; flex-wrap: wrap">
            <div class="li"><span class="sw c-m"></span>Maktablar</div>
            <div class="li"><span class="sw c-d"></span>DMTT</div>
            <div class="li"><span class="sw c-o"></span>Boshqa tashkilotlar</div>
          </div>
        </div>
      </div>`;
    enhance();
  }

  /* ---------- nav / routing ---------- */
  const CHART_ICON = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M3 3v18h18"/><path d="M7 15v3M12 10v8M17 6v12"/></svg>';

  function renderNav(activeId) {
    navEl.innerHTML =
      `<a class="dchip${activeId === 'stats' ? ' active' : ''}" href="#/statistika">${CHART_ICON}Statistika</a>` +
      DATA.districts.map(d =>
        `<a class="dchip${d.id === activeId ? ' active' : ''}" href="#/hudud/${d.id}">${esc(d.name)}</a>`
      ).join('');
  }

  const loadbar = document.getElementById('loadbar');
  let firstRoute = true;
  function doRender() {
    const hash = location.hash || '#/';
    const mo = hash.match(/^#\/hudud\/([a-z]+)\/t\/(\d+)/);
    const m = hash.match(/^#\/hudud\/([a-z]+)/);
    app.classList.remove('page-in');
    void app.offsetWidth;
    if (mo) {
      renderNav(mo[1]);
      renderOrgDetail(mo[1], +mo[2]);
    } else if (m) {
      renderNav(m[1]);
      renderDistrict(m[1]);
    } else if (/^#\/statistika/.test(hash)) {
      renderNav('stats');
      renderStats();
    } else {
      renderNav(null);
      renderHome();
    }
    app.classList.add('page-in');
    requestAnimationFrame(() => {
      loadbar.style.width = '100%';
      setTimeout(() => {
        loadbar.classList.remove('go');
        setTimeout(() => { loadbar.style.width = '0'; }, 320);
      }, 280);
    });
  }
  function route() {
    loadbar.classList.add('go');
    loadbar.style.width = '72%';
    window.scrollTo({ top: 0 });
    if (firstRoute) { firstRoute = false; doRender(); return; }
    // skeleton shimmer — qisqa yuklanish taassuroti
    app.innerHTML = `<div class="sk-wrap">
      <div class="sk sk-hero"></div>
      <div class="sk-grid">${'<div class="sk sk-card"></div>'.repeat(8)}</div>
    </div>`;
    setTimeout(doRender, 190);
  }

  window.addEventListener('hashchange', () => {
    searchInput.value = '';
    route();
  });

  let searchTimer;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      const q = searchInput.value;
      if (q.trim().length >= 2) { renderNav(null); renderSearch(q); saveRecent(q.trim()); }
      else route();
    }, 220);
  });

  /* ---------- So'nggi qidiruvlar ---------- */
  function getRecent() {
    try { return JSON.parse(localStorage.getItem('recentq') || '[]'); } catch (e) { return []; }
  }
  function renderRecent() {
    document.getElementById('searchHist').innerHTML =
      getRecent().map(q => `<option value="${esc(q)}">`).join('');
  }
  let recentTimer;
  function saveRecent(q) {
    clearTimeout(recentTimer);
    recentTimer = setTimeout(() => {
      let list = getRecent().filter(x => x.toLowerCase() !== q.toLowerCase());
      list.unshift(q);
      list = list.slice(0, 8);
      try { localStorage.setItem('recentq', JSON.stringify(list)); } catch (e) {}
      renderRecent();
    }, 1400);
  }
  renderRecent();

  /* ---------- Tezkor klavishlar ---------- */
  document.addEventListener('keydown', e => {
    if (e.key === '/' && !/INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) {
      e.preventDefault();
      searchInput.focus();
    }
  });

  app.addEventListener('click', e => {
    const btn = e.target.closest('[data-toggle]');
    if (btn) btn.nextElementSibling.classList.toggle('open');
    const sc = e.target.closest('[data-scroll]');
    if (sc) {
      e.preventDefault();
      const t = document.querySelector(sc.getAttribute('href'));
      if (t) t.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });

  /* ---------- Boshqaruv paneli (drawer) ---------- */
  const drawer = document.getElementById('drawer');
  const menuBtn = document.getElementById('menuBtn');
  const overlay = document.getElementById('drawerOverlay');

  function setDrawer(open) {
    document.body.classList.toggle('drawer-open', open);
  }
  menuBtn.addEventListener('click', () => setDrawer(!document.body.classList.contains('drawer-open')));
  overlay.addEventListener('click', () => setDrawer(false));
  document.getElementById('drawerClose').addEventListener('click', () => setDrawer(false));
  document.addEventListener('keydown', e => { if (e.key === 'Escape') setDrawer(false); });

  // statistika
  const tOrgs = DATA.districts.reduce((a, d) => a + d.orgs.length, 0);
  const tStaff = DATA.districts.reduce((a, d) => a + d.markaz.length, 0);
  document.getElementById('drawerStats').innerHTML = `
    <div class="ds"><b>${DATA.districts.length}</b><span>hudud</span></div>
    <div class="ds"><b>${tStaff}</b><span>xodim</span></div>
    <div class="ds"><b>${tOrgs}</b><span>tashkilot</span></div>`;

  // hudud havolalari — vazmin, professional plitkalar (shahar — oltin, tuman — ko'k)
  document.getElementById('drawerLinks').innerHTML = [
    { label: 'Shaharlar', items: DATA.districts.filter(isCity), city: true },
    { label: 'Tumanlar', items: DATA.districts.filter(d => !isCity(d)), city: false }
  ].map(g => `
    <div class="dl-group">${g.label}<i></i><b>${g.items.length}</b></div>
    ${g.items.map(d =>
      `<a href="#/hudud/${d.id}" data-did="${d.id}">
         <span class="dli ${g.city ? 'c' : 't'}">${g.city ? CITY_ICON : ICONS.pin}</span>
         <span class="dl-name">${esc(d.name)}</span>
         <span class="cnt">${d.orgs.length}</span>
       </a>`).join('')}`).join('');

  function updateDrawerActive() {
    const m = (location.hash || '').match(/^#\/hudud\/([a-z]+)/);
    document.querySelectorAll('#drawerLinks a').forEach(a =>
      a.classList.toggle('active', !!m && a.dataset.did === m[1]));
  }
  window.addEventListener('hashchange', updateDrawerActive);
  updateDrawerActive();
  document.getElementById('drawerLinks').addEventListener('click', () => setDrawer(false));

  // qulayliklar
  document.getElementById('toolPrint').addEventListener('click', () => { setDrawer(false); setTimeout(() => window.print(), 350); });
  const fontBtn = document.getElementById('toolFont');
  fontBtn.addEventListener('click', () => {
    const big = document.body.classList.toggle('big');
    fontBtn.lastChild.textContent = big ? ' Oddiy shrift' : ' Katta shrift';
    try { localStorage.setItem('bigfont', big ? '1' : ''); } catch (e) {}
  });
  try {
    if (localStorage.getItem('bigfont') === '1') {
      document.body.classList.add('big');
      fontBtn.lastChild.textContent = ' Oddiy shrift';
    }
  } catch (e) {}
  document.getElementById('toolCopy').addEventListener('click', function () {
    navigator.clipboard.writeText(location.href).then(() => {
      const old = this.lastChild.textContent;
      this.lastChild.textContent = ' Nusxalandi ✓';
      setTimeout(() => { this.lastChild.textContent = old; }, 1600);
    });
  });
  document.getElementById('toolTop').addEventListener('click', () => { setDrawer(false); window.scrollTo({ top: 0, behavior: 'smooth' }); });

  /* ---------- Yuqoriga tugmasi ---------- */
  const toTop = document.getElementById('toTop');
  window.addEventListener('scroll', () => {
    toTop.classList.toggle('show', window.scrollY > 500);
  }, { passive: true });
  toTop.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));

  /* ---------- Tun/kun rejimi ---------- */
  const themeBtn = document.getElementById('themeBtn');
  function setTheme(dark) {
    document.body.classList.toggle('dark', dark);
    try { localStorage.setItem('theme', dark ? 'dark' : 'light'); } catch (e) {}
  }
  themeBtn.addEventListener('click', () => setTheme(!document.body.classList.contains('dark')));
  try { if (localStorage.getItem('theme') === 'dark') setTheme(true); } catch (e) {}

  /* ---------- Lotin ⇄ Kirill ---------- */
  const langBtn = document.getElementById('langBtn');
  const txtOrig = new WeakMap();

  function lat2cyr(s) {
    const map1 = { a:'а', b:'б', d:'д', f:'ф', g:'г', h:'ҳ', i:'и', j:'ж', k:'к', l:'л',
                   m:'м', n:'н', o:'о', p:'п', q:'қ', r:'р', s:'с', t:'т', u:'у', v:'в',
                   x:'х', z:'з', c:'ц', w:'в' };
    const AP = /[ʻʼ'`´’‘]/;
    let out = '';
    for (let i = 0; i < s.length; i++) {
      const c = s[i], cl = c.toLowerCase();
      const next = s[i + 1] || '', nl = next.toLowerCase();
      const isUp = c !== cl;
      const cs = r => isUp ? r.toUpperCase() : r;
      if ((cl === 'o' || cl === 'g') && AP.test(next)) { out += cs(cl === 'o' ? 'ў' : 'ғ'); i++; continue; }
      if (cl === 's' && nl === 'h') { out += cs('ш'); i++; continue; }
      if (cl === 'c' && nl === 'h') { out += cs('ч'); i++; continue; }
      if (cl === 'y') {
        if (nl === 'a') { out += cs('я'); i++; continue; }
        if (nl === 'o') { out += cs('ё'); i++; continue; }
        if (nl === 'u') { out += cs('ю'); i++; continue; }
        if (nl === 'e') { out += cs('е'); i++; continue; }
        out += cs('й'); continue;
      }
      if (cl === 'e') {
        const prev = s[i - 1] || '';
        out += cs(/[a-zA-Zа-яёўқғҳА-ЯЁЎҚҒҲ]/.test(prev) ? 'е' : 'э');
        continue;
      }
      if (AP.test(c)) {
        const prev = s[i - 1] || '';
        if (/[a-zA-Zа-яўқғҳА-ЯЎҚҒҲ]/.test(prev) && /[a-zA-Z]/.test(next)) { out += 'ъ'; continue; }
        out += c; continue;
      }
      if (map1[cl] !== undefined) { out += cs(map1[cl]); continue; }
      out += c;
    }
    return out;
  }

  function isCyr() {
    try { return localStorage.getItem('lang') === 'cyr'; } catch (e) { return false; }
  }

  function applyLang() {
    const cyr = isCyr();
    langBtn.textContent = cyr ? 'LAT' : 'КИР';
    document.documentElement.lang = cyr ? 'uz-Cyrl' : 'uz';
    const roots = [app, document.querySelector('.topbar'), drawer, document.querySelector('.footer'), document.querySelector('.qr-modal')];
    roots.forEach(root => {
      if (!root) return;
      const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        if (!n.nodeValue.trim()) continue;
        if (n.parentElement && n.parentElement.closest('script, style')) continue;
        if (cyr) {
          if (!txtOrig.has(n)) txtOrig.set(n, n.nodeValue);
          n.nodeValue = lat2cyr(txtOrig.get(n));
        } else if (txtOrig.has(n)) {
          n.nodeValue = txtOrig.get(n);
        }
      }
    });
    document.querySelectorAll('input[placeholder]').forEach(inp => {
      if (!inp.dataset.ph) inp.dataset.ph = inp.placeholder;
      inp.placeholder = cyr ? lat2cyr(inp.dataset.ph) : inp.dataset.ph;
    });
  }

  langBtn.addEventListener('click', () => {
    try { localStorage.setItem('lang', isCyr() ? 'lat' : 'cyr'); } catch (e) {}
    applyLang();
  });

  /* ---------- Excel (CSV) eksport ---------- */
  document.getElementById('toolExcel').addEventListener('click', () => {
    const m = (location.hash || '').match(/^#\/hudud\/([a-z]+)/);
    const dists = m ? DATA.districts.filter(d => d.id === m[1]) : DATA.districts;
    const cyr = isCyr();
    const T = s => cyr ? lat2cyr(s) : s;
    const Q = s => '"' + String(s ?? '').replace(/"/g, '""') + '"';
    const rows = [['Hudud', 'T/r', 'Tashkilot', 'Rahbar', 'Rahbar tel', 'Kadrlar boʻlimi', 'Kadr tel', 'Buxgalter', 'Buxgalter tel'].map(h => Q(T(h))).join(';')];
    dists.forEach(d => {
      d.orgs.forEach((o, i) => {
        rows.push([T(d.name), i + 1, T(o.org),
          T(o.r.fio), o.r.tel.join(', '), T(o.k.fio), o.k.tel.join(', '),
          T(o.b.fio), o.b.tel.join(', ')].map(Q).join(';'));
      });
      rows.push('');
      rows.push([T(d.center), '', '', '', '', '', '', '', ''].map(Q).join(';'));
      d.markaz.forEach((s, i) => {
        rows.push([T(d.name), i + 1, T('Yuridik xizmat markazi'), T(s.fio + ' (' + s.lavozim + ')'), s.tel.join(', '), '', '', '', ''].map(Q).join(';'));
      });
      rows.push('');
    });
    const blob = new Blob(['﻿' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = (m ? m[1] : 'navoiy-viloyati') + '-malumotnoma.csv';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  /* ---------- Xatolik haqida xabar ---------- */
  document.getElementById('toolReport').addEventListener('click', function () {
    this.href = 'mailto:mrsaidov221@gmail.com'
      + '?subject=' + encodeURIComponent('Maʼlumotnoma saytida xatolik')
      + '&body=' + encodeURIComponent('Sahifa: ' + location.href + '\n\nXatolik tavsifi:\n');
  });

  /* ---------- vCard va QR-kod ---------- */
  const qrModal = document.createElement('div');
  qrModal.className = 'qr-modal';
  qrModal.innerHTML = `<div class="qr-box">
    <h5 id="qrName"></h5>
    <div class="qr-tel" id="qrTel"></div>
    <div id="qrCanvas"></div>
    <div class="qr-hint">Telefon kamerasi bilan skanerlang — raqam avtomatik chiqadi</div>
    <button class="qr-close" id="qrClose">Yopish</button>
  </div>`;
  document.body.appendChild(qrModal);
  qrModal.addEventListener('click', e => {
    if (e.target === qrModal || e.target.id === 'qrClose') qrModal.classList.remove('open');
  });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') qrModal.classList.remove('open'); });

  app.addEventListener('click', e => {
    const v = e.target.closest('[data-vcf]');
    if (v) {
      const fio = v.dataset.fio, pos = v.dataset.pos, tel = v.dataset.tel.replace(/\s/g, '');
      const vcf = ['BEGIN:VCARD', 'VERSION:3.0', 'FN:' + fio,
        'ORG:Yuridik xizmat koʻrsatish markazi', 'TITLE:' + pos,
        'TEL;TYPE=CELL:' + tel, 'END:VCARD'].join('\r\n');
      const blob = new Blob([vcf], { type: 'text/vcard;charset=utf-8' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = fio.replace(/[^\wЀ-ӿ]+/g, '_') + '.vcf';
      a.click();
      URL.revokeObjectURL(a.href);
      return;
    }
    const q = e.target.closest('[data-qr]');
    if (q && window.QRCode) {
      const fio = q.dataset.fio, tel = q.dataset.tel;
      document.getElementById('qrName').textContent = isCyr() ? lat2cyr(fio) : fio;
      document.getElementById('qrTel').textContent = tel;
      const cv = document.getElementById('qrCanvas');
      cv.innerHTML = '';
      new QRCode(cv, { text: 'tel:' + tel.replace(/\s/g, ''), width: 190, height: 190, correctLevel: QRCode.CorrectLevel.M });
      qrModal.classList.add('open');
    }
  });

  /* ---------- Parallax (sichqoncha) ---------- */
  if (fine) {
    const scene = document.querySelector('.bg-scene');
    const grid = document.querySelector('.bg-grid');
    let pRaf = null;
    document.addEventListener('mousemove', e => {
      if (pRaf) return;
      pRaf = requestAnimationFrame(() => {
        pRaf = null;
        const nx = e.clientX / innerWidth - .5;
        const ny = e.clientY / innerHeight - .5;
        scene.style.transform = `translate3d(${nx * -28}px, ${ny * -20}px, 0)`;
        grid.style.transform = `translate3d(${nx * 14}px, ${ny * 10}px, 0)`;
        const hr = app.querySelector('.hero-right');
        if (hr) hr.style.transform = `translate3d(${nx * 22}px, ${ny * 16}px, 0)`;
      });
    }, { passive: true });
  }

  /* ---------- Magnit tugmalar ---------- */
  if (fine) {
    document.addEventListener('pointermove', e => {
      const m = e.target.closest('.magnet, .btn-main, .btn-ghost');
      if (!m) return;
      const r = m.getBoundingClientRect();
      const dx = (e.clientX - r.left) / r.width - .5;
      const dy = (e.clientY - r.top) / r.height - .5;
      m.style.transform = `translate(${(dx * 9).toFixed(1)}px, ${(dy * 7).toFixed(1)}px) scale(1.045)`;
    });
    document.addEventListener('pointerout', e => {
      const m = e.target.closest('.magnet, .btn-main, .btn-ghost');
      if (m && !m.contains(e.relatedTarget)) m.style.transform = '';
    }, true);
  }

  /* ---------- Admin rejimi ---------- */
  const ADMIN_PASS = 'adliya2026';
  const adminBtn = document.getElementById('adminBtn');

  function setAdmin(on) {
    document.body.classList.toggle('admin', on);
    try { sessionStorage.setItem('admin', on ? '1' : ''); } catch (e) {}
    adminBtn.lastChild.textContent = on ? ' Admin: chiqish' : ' Admin rejimi';
  }
  adminBtn.addEventListener('click', () => {
    if (document.body.classList.contains('admin')) { setAdmin(false); return; }
    if (authCtx) {
      // Server rejimi: huquq profil orqali aniqlanadi, parol so'ralmaydi
      if (authCtx.profile && authCtx.profile.is_admin) { setAdmin(true); setDrawer(false); }
      else alert('Sizda tahrirlash huquqi yoʻq. Administratorga murojaat qiling.');
      return;
    }
    const p = prompt('Admin parolini kiriting:');
    if (p === ADMIN_PASS) { setAdmin(true); setDrawer(false); }
    else if (p !== null) alert('Parol notoʻgʻri');
  });
  try { if (sessionStorage.getItem('admin') === '1') setAdmin(true); } catch (e) {}

  // Server rejimida: chiqish tugmasi + foydalanuvchi belgisi
  if (authCtx) {
    const out = document.createElement('button');
    out.className = 'tool-btn full';
    out.innerHTML = '<span class="ti r"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><path d="m16 17 5-5-5-5"/><path d="M21 12H9"/></svg></span>'
      + ' Chiqish' + (authCtx.profile ? ' (' + esc(authCtx.profile.login) + ')' : '');
    out.addEventListener('click', async () => {
      await authCtx.client.auth.signOut();
      location.reload();
    });
    document.getElementById('toolReport').after(out);
    document.getElementById('adminReset').style.display = 'none';
  }

  const adminBadge = document.createElement('div');
  adminBadge.className = 'admin-badge';
  adminBadge.innerHTML = EDIT_ICON.replace('<svg ', '<svg width="12" height="12" ') + ' ADMIN REJIMI';
  document.body.appendChild(adminBadge);

  // tahrirlash modali
  const editModal = document.createElement('div');
  editModal.className = 'qr-modal';
  editModal.innerHTML = `<div class="qr-box">
    <h5 style="margin-bottom:12px">Maʼlumotni tahrirlash</h5>
    <div class="edit-form">
      <label>F.I.O.<input id="editFio" autocomplete="off"></label>
      <label>Telefon(lar) — vergul bilan<input id="editTel" autocomplete="off" placeholder="+998 90 123 45 67"></label>
      <div class="edit-actions">
        <button class="ghost" id="editCancel">Bekor</button>
        <button class="qr-close" id="editSave">Saqlash</button>
      </div>
    </div>
  </div>`;
  document.body.appendChild(editModal);
  let editTarget = null;

  app.addEventListener('click', e => {
    const eb = e.target.closest('[data-edit]');
    if (!eb) return;
    e.preventDefault(); e.stopPropagation();
    const d = DATA.districts.find(x => x.id === eb.dataset.d);
    if (!d) return;
    let obj;
    if (eb.dataset.edit === 'org') obj = d.orgs[+eb.dataset.i][eb.dataset.role];
    else obj = d.markaz[+eb.dataset.i];
    editTarget = { type: eb.dataset.edit, di: eb.dataset.d, i: +eb.dataset.i, role: eb.dataset.role, obj };
    document.getElementById('editFio').value = obj.fio || '';
    document.getElementById('editTel').value = (obj.tel || []).join(', ');
    editModal.classList.add('open');
  }, true);

  editModal.addEventListener('click', e => {
    if (e.target === editModal || e.target.id === 'editCancel') editModal.classList.remove('open');
    if (e.target.id === 'editSave' && editTarget) {
      const fio = document.getElementById('editFio').value.trim();
      const tel = document.getElementById('editTel').value.split(',').map(s => s.trim()).filter(Boolean);
      editTarget.obj.fio = fio;
      editTarget.obj.tel = tel;
      if (authCtx) {
        pushData(); // umumiy bazaga — barcha foydalanuvchilarda yangilanadi
      } else {
        const ov = getOverrides();
        const key = editTarget.type === 'org'
          ? `org|${editTarget.di}|${editTarget.i}|${editTarget.role}`
          : `staff|${editTarget.di}|${editTarget.i}`;
        ov[key] = { fio, tel };
        try { localStorage.setItem('overrides', JSON.stringify(ov)); } catch (e2) {}
      }
      editModal.classList.remove('open');
      route();
    }
  });

  // data.js eksport (tahrirlangan holatda)
  document.getElementById('adminExport').addEventListener('click', () => {
    const json = JSON.stringify({ districts: DATA.districts },
      (k, v) => k.startsWith('_') ? undefined : v);
    const blob = new Blob(['window.SITE_DATA = ' + json + ';\n'], { type: 'text/javascript;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'data.js';
    a.click();
    URL.revokeObjectURL(a.href);
  });

  document.getElementById('adminReset').addEventListener('click', () => {
    if (confirm('Barcha mahalliy tahrirlar bekor qilinsinmi?')) {
      localStorage.removeItem('overrides');
      location.reload();
    }
  });

  route();
  }

  bootstrap();
})();
