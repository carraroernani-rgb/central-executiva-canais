/* =========================================================
   RADAR DE PARCERIAS — script.js
   1. Animação do radar no canvas do hero
   2. Menu mobile (burger)
   3. Submit da newsletter (visual, pronto pra plugar backend)
========================================================= */

// ---------------------------------------------------------
// 1. ANIMAÇÃO DE RADAR NO CANVAS
// ---------------------------------------------------------
(function initRadarCanvas() {
  const canvas = document.getElementById('radarCanvas');
  if (!canvas) return;

  const ctx = canvas.getContext('2d');
  let width, height, cx, cy;
  let beamAngle = 0;

  // Blips: pontos que piscam em posições fixas ao redor do centro
  const blips = [
    { angle: 0.4, dist: 0.7, phase: 0 },
    { angle: 2.1, dist: 0.5, phase: 1.2 },
    { angle: 3.6, dist: 0.85, phase: 2.4 },
    { angle: 5.0, dist: 0.35, phase: 0.6 },
    { angle: 1.3, dist: 0.9, phase: 3.1 },
  ];

  function resize() {
    width = canvas.width = canvas.offsetWidth * devicePixelRatio;
    height = canvas.height = canvas.offsetHeight * devicePixelRatio;
    cx = width / 2;
    cy = height / 2;
  }

  function draw() {
    ctx.clearRect(0, 0, width, height);

    const maxRadius = Math.min(width, height) * 0.42;
    const rings = 4;

    // Círculos concêntricos
    ctx.strokeStyle = 'rgba(28, 42, 56, 0.8)';
    ctx.lineWidth = 1 * devicePixelRatio;
    for (let i = 1; i <= rings; i++) {
      ctx.beginPath();
      ctx.arc(cx, cy, (maxRadius / rings) * i, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Beam girando (gradiente ciano -> verde, opacidade suave)
    const beamWidth = Math.PI / 5;
    const gradient = ctx.createConicGradient
      ? ctx.createConicGradient(beamAngle, cx, cy)
      : null;

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, maxRadius, beamAngle, beamAngle + beamWidth);
    ctx.closePath();

    const linGrad = ctx.createLinearGradient(
      cx, cy,
      cx + Math.cos(beamAngle) * maxRadius,
      cy + Math.sin(beamAngle) * maxRadius
    );
    linGrad.addColorStop(0, 'rgba(0, 229, 255, 0.35)');
    linGrad.addColorStop(1, 'rgba(26, 255, 107, 0.0)');
    ctx.fillStyle = linGrad;
    ctx.fill();
    ctx.restore();

    // Blips piscando
    const t = Date.now() / 1000;
    blips.forEach((b) => {
      const bx = cx + Math.cos(b.angle) * maxRadius * b.dist;
      const by = cy + Math.sin(b.angle) * maxRadius * b.dist;
      const pulse = (Math.sin(t * 1.5 + b.phase) + 1) / 2; // 0..1
      const radius = (2 + pulse * 3) * devicePixelRatio;
      const alpha = 0.3 + pulse * 0.7;

      ctx.beginPath();
      ctx.arc(bx, by, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(0, 229, 255, ${alpha})`;
      ctx.fill();
    });

    beamAngle += 0.012;
    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  requestAnimationFrame(draw);
})();

// ---------------------------------------------------------
// 2. MENU MOBILE
// ---------------------------------------------------------
(function initMobileMenu() {
  const burger = document.getElementById('burgerBtn');
  const menu = document.getElementById('mobileMenu');
  if (!burger || !menu) return;

  burger.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('is-open');
    burger.classList.toggle('is-open', isOpen);
    burger.setAttribute('aria-expanded', String(isOpen));
    burger.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
  });

  // Fecha o menu ao clicar em qualquer link
  menu.querySelectorAll('a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('is-open');
      burger.classList.remove('is-open');
      burger.setAttribute('aria-expanded', 'false');
      burger.setAttribute('aria-label', 'Abrir menu');
    });
  });
})();

// ---------------------------------------------------------
// 3. NEWSLETTER (visual — pronto para plugar backend)
// ---------------------------------------------------------
(function initNewsletterForm() {
  const form = document.getElementById('newsletterForm');
  const msg = document.getElementById('newsletterMsg');
  if (!form || !msg) return;

  form.addEventListener('submit', handleNewsletterSubmit);

  function handleNewsletterSubmit(event) {
    event.preventDefault();

    const emailInput = document.getElementById('emailInput');
    const email = emailInput.value.trim();

    if (!email || !emailInput.checkValidity()) {
      msg.style.color = '#ff5c5c';
      msg.textContent = 'Digita um e-mail válido pra entrar no radar.';
      return;
    }

    // -----------------------------------------------------
    // PLUGUE AQUI SEU PROVEDOR DE E-MAIL (Mailchimp, ConvertKit, Beehiiv...)
    //
    // Exemplo genérico com fetch:
    //
    // fetch('https://SEU_ENDPOINT_DO_PROVEDOR', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ email }),
    // })
    //   .then((res) => {
    //     if (!res.ok) throw new Error('Falha ao assinar');
    //     showSuccess();
    //   })
    //   .catch(() => showError());
    //
    // Por enquanto, simulamos sucesso localmente:
    // -----------------------------------------------------
    showSuccess();

    function showSuccess() {
      msg.style.color = '#1AFF6B';
      msg.textContent = `Boa, ${email.split('@')[0]}! Você tá no radar agora.`;
      form.reset();
    }
  }
})();

// ---------------------------------------------------------
// 4. NAV — sombra sutil ao rolar (opcional, reforça o sticky+blur)
// ---------------------------------------------------------
(function initNavScrollState() {
  const nav = document.getElementById('nav');
  if (!nav) return;

  function onScroll() {
    if (window.scrollY > 8) {
      nav.style.boxShadow = '0 8px 24px rgba(0, 0, 0, 0.35)';
    } else {
      nav.style.boxShadow = 'none';
    }
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
})();
