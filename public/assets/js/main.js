(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  // Abertura: só na primeira visita da sessão
  var loader = document.getElementById('preloader');
  if (loader) {
    var seen = false;
    try { seen = sessionStorage.getItem('wl-intro') === '1'; sessionStorage.setItem('wl-intro', '1'); } catch (e) {}
    if (seen || reduce) loader.remove();
    else loader.addEventListener('animationend', function (e) { if (e.target === loader) loader.remove(); });
  }
  var intro = loader && loader.isConnected ? 1350 : 0;

  // Títulos entram palavra por palavra
  function splitWords(el) {
    var i = 0;
    (function walk(node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (c) {
        if (c.nodeType === 3) {
          if (!c.nodeValue.trim()) return;
          var group = document.createElement('span');
          c.nodeValue.split(/(\s+)/).forEach(function (part) {
            if (!part) return;
            if (!part.trim()) { group.appendChild(document.createTextNode(' ')); return; }
            var w = document.createElement('span');
            w.className = 'wi'; w.style.setProperty('--i', i++); w.textContent = part;
            group.appendChild(w);
          });
          node.replaceChild(group, c);
        } else if (c.nodeType === 1 && c.tagName !== 'IMG' && c.tagName.toLowerCase() !== 'svg') walk(c);
      });
    })(el);
  }
  if (!reduce) {
    document.querySelectorAll('.h1').forEach(function (h) {
      splitWords(h);
      h.classList.remove('in');
      h.style.setProperty('--d', (intro + 80) + 'ms');
      h.classList.add('words-in');
    });
    var heads = document.querySelectorAll('.h2');
    if ('IntersectionObserver' in window) {
      var wordObs = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (!e.isIntersecting) return;
          e.target.classList.add('words-in');
          wordObs.unobserve(e.target);
        });
      }, { rootMargin: '0px 0px -12% 0px' });
      heads.forEach(function (h) { splitWords(h); wordObs.observe(h); });
    }
  }

  // Brilho que segue o cursor nos cartões
  if (!reduce && finePointer) {
    document.addEventListener('pointermove', function (ev) {
      var c = ev.target.closest && ev.target.closest('.card, .feature');
      if (!c) return;
      var r = c.getBoundingClientRect();
      c.style.setProperty('--mx', (ev.clientX - r.left) + 'px');
      c.style.setProperty('--my', (ev.clientY - r.top) + 'px');
    }, { passive: true });
  }

  // Cabeçalho ganha borda ao rolar
  var header = document.getElementById('cabecalho');
  function onScroll() { header.classList.toggle('scrolled', window.scrollY > 8); }
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();

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

  // Link ativo do menu e linha dos passos acendendo
  if ('IntersectionObserver' in window) {
    var links = {};
    document.querySelectorAll('.nav-link').forEach(function (a) { links[a.getAttribute('href').slice(1)] = a; });
    var navObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var l = links[e.target.id]; if (!l) return;
        if (e.isIntersecting) { Object.keys(links).forEach(function (k) { links[k].classList.remove('active'); }); l.classList.add('active'); }
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    ['planos', 'como-funciona', 'guarda'].forEach(function (id) { var el = document.getElementById(id); if (el) navObs.observe(el); });

    var steps = document.querySelectorAll('.step');
    var stepObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var i = Array.prototype.indexOf.call(steps, e.target);
        setTimeout(function () { e.target.classList.add('lit'); }, reduce ? 0 : i * 180);
        stepObs.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    steps.forEach(function (s) { stepObs.observe(s); });
  } else {
    document.querySelectorAll('.step').forEach(function (s) { s.classList.add('lit'); });
  }

  // Brasa acompanha o cursor com os olhos
  var pupils = document.getElementById('brasa-pupils');
  var head = document.getElementById('brasa-head');
  var art = document.getElementById('hero-art');
  if (!reduce && pupils && art && finePointer) {
    var raf = 0;
    window.addEventListener('pointermove', function (ev) {
      if (raf) return;
      raf = requestAnimationFrame(function () {
        raf = 0;
        var r = art.getBoundingClientRect();
        if (r.bottom < 0 || r.top > window.innerHeight) return;
        var cx = r.left + r.width / 2, cy = r.top + r.height * 0.55;
        var dx = Math.max(-1, Math.min(1, (ev.clientX - cx) / (window.innerWidth / 2)));
        var dy = Math.max(-1, Math.min(1, (ev.clientY - cy) / (window.innerHeight / 2)));
        pupils.setAttribute('transform', 'translate(' + (dx * 4).toFixed(2) + ' ' + (dy * 2.5).toFixed(2) + ')');
        head.style.transform = 'rotate(' + (dx * 3).toFixed(2) + 'deg)';
      });
    }, { passive: true });
  }

  // Vídeos do N1 Portal: só baixam e tocam quando aparecem na tela
  if (!reduce && 'IntersectionObserver' in window) {
    var videoObs = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var v = e.target;
        if (e.isIntersecting) { if (!v.dataset.userPaused) { var p = v.play(); if (p && p.catch) p.catch(function () {}); } }
        else if (!v.paused) { v.dataset.auto = '1'; v.pause(); }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('video[data-autoplay]').forEach(function (v) {
      v.addEventListener('pause', function () { if (!v.dataset.auto) v.dataset.userPaused = '1'; delete v.dataset.auto; });
      v.addEventListener('play', function () { delete v.dataset.userPaused; });
      videoObs.observe(v);
    });
  }

  // Globo pontilhado atrás da chamada final: pontos numa esfera, mantidos onde um ruído suave forma "continentes"
  function globe(section) {
    var box = document.createElement('div');
    box.className = 'globe'; box.setAttribute('aria-hidden', 'true');
    var cv = document.createElement('canvas');
    box.appendChild(cv); section.appendChild(box); section.classList.add('has-globe');
    var ctx = cv.getContext('2d');
    if (!ctx) return;

    // x, y, z e 1 para terra / 0 para mar
    var pts = [], N = 7000;
    for (var i = 0; i < N; i++) {
      var y = 1 - 2 * (i + 0.5) / N, r = Math.sqrt(1 - y * y), th = i * 2.399963;
      var x = Math.cos(th) * r, z = Math.sin(th) * r;
      var n = Math.sin(x * 3.2 + 1.3) * Math.sin(y * 2.7 + 0.5) + 0.7 * Math.sin(z * 4.1 + y * 1.3 + 2.2) + 0.35 * Math.sin(x * 7 + z * 5);
      pts.push(x, y, z, n > 0.05 && Math.abs(y) < 0.92 ? 1 : 0);
    }

    var size = 0, dpr = 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      size = Math.round(box.clientWidth * dpr);
      cv.width = cv.height = size;
    }

    var tilt = 0.12, ct = Math.cos(tilt), st = Math.sin(tilt);
    function draw(a) {
      var c = size / 2, R = size * 0.4;
      ctx.clearRect(0, 0, size, size);

      var halo = ctx.createRadialGradient(c, c, R * 0.8, c, c, R * 1.24);
      halo.addColorStop(0, 'rgba(245, 120, 40, 0)');
      halo.addColorStop(0.44, 'rgba(245, 130, 45, 0.6)');
      halo.addColorStop(0.5, 'rgba(255, 180, 90, 0.95)');
      halo.addColorStop(0.62, 'rgba(245, 120, 40, 0.35)');
      halo.addColorStop(1, 'rgba(245, 120, 40, 0)');
      ctx.fillStyle = halo;
      ctx.fillRect(0, 0, size, size);

      var body = ctx.createRadialGradient(c, c - R * 0.4, R * 0.1, c, c, R);
      body.addColorStop(0, '#24140f');
      body.addColorStop(0.75, '#120b09');
      body.addColorStop(1, '#3a1a0c');
      ctx.beginPath(); ctx.arc(c, c, R, 0, Math.PI * 2); ctx.fillStyle = body; ctx.fill();

      var ca = Math.cos(a), sa = Math.sin(a), d = Math.max(1.5, R / 150);
      for (var k = 0; k < pts.length; k += 4) {
        var px = pts[k], py = pts[k + 1], pz = pts[k + 2], land = pts[k + 3];
        var x1 = px * ca + pz * sa, z1 = -px * sa + pz * ca;
        var y2 = py * ct - z1 * st, z2 = py * st + z1 * ct;
        if (z2 <= 0.02) continue;
        ctx.fillStyle = 'rgba(255, 236, 214, ' + ((0.12 + 0.8 * z2) * (land ? 1 : 0.14)).toFixed(3) + ')';
        var s = d * (0.6 + 0.8 * z2) * (land ? 1 : 0.7);
        ctx.fillRect(c + x1 * R - s / 2, c - y2 * R - s / 2, s, s);
      }
    }

    resize();
    var angle = 0, last = 0, running = false, raf = 0;
    function frame(t) {
      if (!running) return;
      if (last) angle += (t - last) * 0.00008;
      last = t;
      draw(angle);
      raf = requestAnimationFrame(frame);
    }
    window.addEventListener('resize', function () { resize(); draw(angle); });
    if (reduce || !('IntersectionObserver' in window)) { draw(0.6); return; }
    new IntersectionObserver(function (entries) {
      running = entries[0].isIntersecting;
      if (running) { last = 0; raf = requestAnimationFrame(frame); } else cancelAnimationFrame(raf);
    }).observe(box);
  }
  document.querySelectorAll('.contact').forEach(globe);

  // Relógio do painel de exemplo
  var clock = document.getElementById('panel-clock');
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function tick() { var d = new Date(); clock.textContent = 'última checagem ' + pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds()); }
  if (clock) { tick(); setInterval(tick, 1000); }

  // Copiar e-mail
  var btn = document.getElementById('copy-email');
  var email = document.getElementById('email');
  function selectEmail() { var s = window.getSelection(), rg = document.createRange(); rg.selectNodeContents(email); s.removeAllRanges(); s.addRange(rg); }
  if (btn && email) btn.addEventListener('click', function () {
    var text = email.textContent;
    function ok() { btn.textContent = 'Copiado'; btn.classList.add('done'); setTimeout(function () { btn.textContent = 'Copiar e-mail'; btn.classList.remove('done'); }, 2000); }
    try {
      navigator.clipboard.writeText(text).then(ok, function () { selectEmail(); btn.textContent = 'Selecionado, use Ctrl+C'; });
    } catch (e) { selectEmail(); btn.textContent = 'Selecionado, use Ctrl+C'; }
  });
})();
