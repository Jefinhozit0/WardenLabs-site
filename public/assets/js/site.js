(function () {
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var mobile = window.matchMedia('(max-width: 900px)');

  // Se o Brasa 3D não carregar (navegador antigo, erro de rede), mostra o Brasa em SVG
  function brasa2d() {
    document.querySelectorAll('[data-brasa3d]').forEach(function (h) {
      var box = h.closest('[data-follow]');
      if (box && !box.classList.contains('has-3d')) box.classList.add('no-3d');
    });
  }
  if (!('noModule' in HTMLScriptElement.prototype)) brasa2d();
  window.addEventListener('error', function (e) {
    if (e.target && e.target.tagName === 'SCRIPT' && /brasa3d|three/.test(e.target.src || '')) brasa2d();
  }, true);
  setTimeout(brasa2d, 12000);

  // Cabeçalho ganha borda ao rolar
  var header = document.getElementById('cabecalho');
  function onHeader() { header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onHeader, { passive: true }); onHeader();

  // Menu mobile
  var toggle = document.getElementById('menu-toggle');
  var nav = document.getElementById('nav');
  function setMenu(open) {
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    nav.classList.toggle('open', open);
  }
  if (toggle && nav) {
    toggle.addEventListener('click', function () { setMenu(toggle.getAttribute('aria-expanded') !== 'true'); });
    nav.addEventListener('click', function (e) { if (e.target.closest('a')) setMenu(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && nav.classList.contains('open')) { setMenu(false); toggle.focus(); } });
  }

  // Brasa acompanha o cursor com os olhos e inclina a cabeça; no celular, segue o toque
  var brasas = [];
  document.querySelectorAll('[data-follow]').forEach(function (a) {
    var pupils = a.querySelector('.brasa-pupils'), head = a.querySelector('.brasa-head');
    if (pupils && head) brasas.push({ art: a, pupils: pupils, head: head });
  });
  if (brasas.length && !reduce) {
    var raf = 0, mx = 0, my = 0;
    var look = function () {
      raf = 0;
      brasas.forEach(function (b) {
        var r = b.art.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var cx = r.left + r.width / 2, cy = r.top + r.height * 0.55;
        var dx = Math.max(-1, Math.min(1, (mx - cx) / (window.innerWidth / 2)));
        var dy = Math.max(-1, Math.min(1, (my - cy) / (window.innerHeight / 2)));
        b.pupils.setAttribute('transform', 'translate(' + (dx * 4).toFixed(2) + ' ' + (dy * 2.5).toFixed(2) + ')');
        b.head.style.transform = 'rotate(' + (dx * 3).toFixed(2) + 'deg)';
      });
    };
    window.addEventListener('pointermove', function (e) {
      mx = e.clientX; my = e.clientY;
      if (!raf) raf = requestAnimationFrame(look);
    }, { passive: true });
  }

  // Vídeos: só tocam quando aparecem na tela
  if (!reduce && 'IntersectionObserver' in window) {
    var vio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { if (!v.dataset.userPaused) { var pr = v.play(); if (pr && pr.catch) pr.catch(function () {}); } }
        else if (!v.paused) { v.dataset.auto = '1'; v.pause(); }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('video[data-autoplay]').forEach(function (v) {
      v.addEventListener('pause', function () { if (!v.dataset.auto) v.dataset.userPaused = '1'; delete v.dataset.auto; });
      v.addEventListener('play', function () { delete v.dataset.userPaused; });
      vio.observe(v);
    });
  }

  // Aparecer ao rolar
  if ('IntersectionObserver' in window && !reduce) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('seen'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -10% 0px' });
    document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('.reveal').forEach(function (el) { el.classList.add('seen'); });
  }

  // Seções guiadas pela rolagem: cada uma tem N etapas; no computador a seção fica presa
  // e a rolagem troca a etapa; no celular, as etapas trocam pelo toque.
  var scrubs = [];
  document.querySelectorAll('[data-scrub]').forEach(function (root) {
    var n = parseInt(root.getAttribute('data-scrub'), 10);
    var s = {
      root: root, n: n, active: -1,
      triggers: root.querySelectorAll('[data-step]'),
      panes: root.querySelectorAll('[data-pane]'),
      fill: root.querySelector('.fill'),
      count: root.querySelector('.count')
    };
    s.triggers.forEach(function (t) {
      t.addEventListener('click', function () {
        var i = parseInt(t.getAttribute('data-step'), 10);
        if (pinned()) {
          var top = root.getBoundingClientRect().top + window.scrollY;
          var span = root.offsetHeight - window.innerHeight;
          window.scrollTo({ top: top + span * (i + 0.5) / n, behavior: reduce ? 'auto' : 'smooth' });
        } else setActive(s, i, (i + 1) / n);
      });
    });
    scrubs.push(s);
    setActive(s, 0, 0);
  });

  function pinned() { return !mobile.matches && !reduce; }

  function setActive(s, i, progress) {
    if (s.fill) s.fill.style.width = (Math.max(progress, (i + 1) / s.n * 0.06) * 100).toFixed(2) + '%';
    if (i === s.active) return;
    s.active = i;
    if (s.count) s.count.textContent = '0' + (i + 1) + ' / 0' + s.n;
    s.triggers.forEach(function (t) {
      var k = parseInt(t.getAttribute('data-step'), 10);
      t.classList.toggle('on', k === i);
      t.classList.toggle('done', k < i);
      if (t.hasAttribute('aria-selected')) t.setAttribute('aria-selected', k === i ? 'true' : 'false');
    });
    s.panes.forEach(function (p) {
      var on = parseInt(p.getAttribute('data-pane'), 10) === i;
      p.classList.toggle('on', on);
      p.setAttribute('aria-hidden', on ? 'false' : 'true');
    });
  }

  function layout() {
    scrubs.forEach(function (s) {
      s.root.style.height = pinned() ? (s.n * 70 + 40) + 'vh' : '';
    });
    update();
  }

  var ticking = false;
  function update() {
    ticking = false;
    if (!pinned()) return;
    var vh = window.innerHeight;
    scrubs.forEach(function (s) {
      var r = s.root.getBoundingClientRect();
      var span = r.height - vh;
      var p = span > 0 ? Math.min(1, Math.max(0, -r.top / span)) : 0;
      setActive(s, Math.min(s.n - 1, Math.floor(p * s.n)), p);
    });
  }
  window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  window.addEventListener('resize', layout);
  if (mobile.addEventListener) mobile.addEventListener('change', layout);
  layout();

  // Perguntas
  var qs = document.querySelectorAll('.q');
  var answers = document.querySelectorAll('.answer');
  function openQ(i, focus) {
    qs.forEach(function (q, k) { q.setAttribute('aria-selected', k === i ? 'true' : 'false'); q.tabIndex = k === i ? 0 : -1; });
    answers.forEach(function (a, k) { a.classList.toggle('on', k === i); a.hidden = false; a.setAttribute('aria-hidden', k === i ? 'false' : 'true'); });
    if (focus) qs[i].focus();
  }
  qs.forEach(function (q, i) {
    q.addEventListener('click', function () { openQ(i); });
    q.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown' || e.key === 'ArrowRight') { e.preventDefault(); openQ((i + 1) % qs.length, true); }
      if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') { e.preventDefault(); openQ((i - 1 + qs.length) % qs.length, true); }
    });
  });
  if (qs.length) openQ(0);
})();
