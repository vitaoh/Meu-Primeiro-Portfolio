// EDITMODE persisted defaults
  window.__TWEAKS = /*EDITMODE-BEGIN*/{
    "theme": "noir",
    "density": "normal",
    "intensity": "bold",
    "projectsLayout": "horizontal",
    "cursor": true
  }/*EDITMODE-END*/;

/* ============================================================
   APP
   ============================================================ */
(() => {
  'use strict';

  const T = window.__TWEAKS;
  const body = document.body;

  /* ── apply tweaks to DOM ─────────────────────────────────── */
  const applyTweaks = () => {
    body.setAttribute('data-theme', T.theme);
    body.setAttribute('data-density', T.density);
    body.setAttribute('data-intensity', T.intensity);
    body.setAttribute('data-projects-layout', T.projectsLayout);
    body.classList.toggle('cursor-on', T.cursor === true || T.cursor === 'true');

    document.querySelectorAll('[data-tweak]').forEach(btn => {
      const key = btn.dataset.tweak;
      const val = btn.dataset.value;
      const active = String(T[key]) === val;
      btn.classList.toggle('active', active);
    });
  };

  const setTweak = (key, value) => {
    if (value === 'true') value = true;
    else if (value === 'false') value = false;
    T[key] = value;
    applyTweaks();
    try {
      window.parent.postMessage({ type: '__edit_mode_set_keys', edits: { [key]: value } }, '*');
    } catch (e) {}
  };

  applyTweaks();

  /* ── tweaks panel wiring ─────────────────────────────────── */
  const panel = document.getElementById('tweaks');
  const toggle = document.getElementById('tweaksToggle');
  const closeBtn = document.getElementById('tweaksClose');

  document.querySelectorAll('[data-tweak]').forEach(btn => {
    btn.addEventListener('click', () => {
      setTweak(btn.dataset.tweak, btn.dataset.value);
    });
  });

  let editModeOn = false;
  const showPanel = () => { editModeOn = true; panel.classList.add('open'); toggle.classList.remove('visible'); };
  const hidePanel = () => {
    editModeOn = false;
    panel.classList.remove('open');
    try { window.parent.postMessage({ type: '__edit_mode_dismissed' }, '*'); } catch (e) {}
  };

  closeBtn.addEventListener('click', hidePanel);
  toggle.addEventListener('click', showPanel);

  window.addEventListener('message', (e) => {
    const msg = e.data;
    if (!msg || !msg.type) return;
    if (msg.type === '__activate_edit_mode') showPanel();
    if (msg.type === '__deactivate_edit_mode') hidePanel();
  });

  try { window.parent.postMessage({ type: '__edit_mode_available' }, '*'); } catch (e) {}

  /* fallback: keyboard 't' to toggle panel */
  document.addEventListener('keydown', (e) => {
    if (e.key === 't' && !e.target.matches('input,textarea')) {
      editModeOn ? hidePanel() : showPanel();
    }
  });

  /* ── nav scroll state ─────────────────────────────────────── */
  const nav = document.getElementById('nav');
  const progress = document.getElementById('progress');
  const navLinks = document.querySelectorAll('.nav__link');
  const sections = ['about', 'work', 'vision', 'contact'].map(id => document.getElementById(id));

  let ticking = false;
  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      nav.classList.toggle('scrolled', y > 30);

      const docH = document.documentElement.scrollHeight - window.innerHeight;
      const pct = docH > 0 ? (y / docH) * 100 : 0;
      progress.style.transform = `scaleX(${pct / 100})`;

      const cur = y + window.innerHeight * 0.3;
      let activeIdx = -1;
      sections.forEach((sec, i) => {
        if (sec && sec.offsetTop <= cur) activeIdx = i;
      });
      navLinks.forEach((l, i) => l.classList.toggle('active', i === activeIdx));

      ticking = false;
    });
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* ── intersection reveals ─────────────────────────────────── */
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      io.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -10% 0px' });

  document.querySelectorAll('.reveal, [data-stagger], .skill, .about__bio').forEach(el => io.observe(el));

  /* hero title — fire shortly after load */
  setTimeout(() => {
    document.getElementById('heroTitle').classList.add('in');
  }, 220);

  /* number counter animation for hero stats */
  const animateCount = (el, target) => {
    const dur = 1400;
    const start = performance.now();
    const suffix = el.dataset.suffix || '';
    const tick = (now) => {
      const t = Math.min(1, (now - start) / dur);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased) + suffix;
      if (t < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  };
  document.querySelectorAll('.hero__side__stat__num').forEach(el => {
    const raw = el.textContent.trim();
    const num = parseInt(raw, 10);
    const suffix = raw.replace(/[0-9]/g, '');
    el.dataset.suffix = suffix;
    el.textContent = '0' + suffix;
    setTimeout(() => animateCount(el, num), 800);
  });

  /* magnetic effect on buttons */
  document.querySelectorAll('.nav__cta, .form__submit, .projects__nav-btn').forEach(el => {
    el.classList.add('magnetic');
    el.addEventListener('pointermove', (e) => {
      const r = el.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      const k = T.intensity === 'subtle' ? 0.08 : T.intensity === 'bold' ? 0.25 : 0.15;
      el.style.transform = `translate(${x * k}px, ${y * k}px)`;
    });
    el.addEventListener('pointerleave', () => { el.style.transform = ''; });
  });

  /* 3D tilt on project cards */
  document.querySelectorAll('.project').forEach(card => {
    card.addEventListener('pointermove', (e) => {
      if (T.intensity === 'subtle') return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width - 0.5;
      const y = (e.clientY - r.top) / r.height - 0.5;
      const k = T.intensity === 'bold' ? 8 : 4;
      card.style.transform = `perspective(1000px) rotateY(${x * k}deg) rotateX(${-y * k}deg) translateY(-4px)`;
    });
    card.addEventListener('pointerleave', () => { card.style.transform = ''; });
  });

  /* ── projects horizontal scroll buttons ───────────────────── */
  const strip = document.getElementById('prjStrip');
  const prjPrev = document.getElementById('prj-prev');
  const prjNext = document.getElementById('prj-next');
  const projectNav = document.querySelector('.projects__head__nav');
  const work = document.getElementById('work');
  const projectOriginalCards = Array.from(strip.querySelectorAll('.project'));

  let projectCloneSets = 0;
  const maxProjectCloneSets = 2;
  const appendProjectCloneSet = () => {
    projectOriginalCards.forEach((card) => {
      const clone = card.cloneNode(true);
      clone.dataset.projectClone = 'true';
      clone.setAttribute('aria-hidden', 'true');
      clone.classList.add('in');
      clone.querySelectorAll('[id]').forEach(el => el.removeAttribute('id'));
      clone.querySelectorAll('a, button, input, textarea, select').forEach(el => {
        el.tabIndex = -1;
      });
      strip.appendChild(clone);
    });
    projectCloneSets += 1;
  };

  for (let i = 0; i < maxProjectCloneSets; i += 1) appendProjectCloneSet();

  let isProjectStripHovering = false;
  let isProjectNavHovering = false;
  let hasProjectFocus = false;
  let isProjectDragging = false;

  const getProjectGap = () => {
    const styles = window.getComputedStyle(strip);
    const columnGap = parseFloat(styles.columnGap);
    const gap = Number.isNaN(columnGap) ? parseFloat(styles.gap) : columnGap;
    return Number.isNaN(gap) ? 0 : gap;
  };

  const getProjectStep = () => {
    const card = projectOriginalCards[0] || strip.querySelector('.project');
    return card ? card.getBoundingClientRect().width + getProjectGap() : 0;
  };

  const getProjectLoopWidth = () => {
    const firstCard = projectOriginalCards[0];
    const firstClone = strip.querySelector('[data-project-clone="true"]');
    if (!firstCard || !firstClone) return 0;
    return firstClone.offsetLeft - firstCard.offsetLeft;
  };

  const ensureProjectCloneBuffer = () => {
    if (T.projectsLayout !== 'horizontal' || isProjectDragging) return;
    const loopWidth = getProjectLoopWidth();
    if (loopWidth <= 0) return;
    if (strip.scrollLeft >= loopWidth * maxProjectCloneSets) strip.scrollLeft -= loopWidth;
  };

  const prepareProjectLoop = (dir) => {
    if (T.projectsLayout !== 'horizontal') return;
    const loopWidth = getProjectLoopWidth();
    if (loopWidth <= 0) return;
    ensureProjectCloneBuffer();
    if (dir < 0 && strip.scrollLeft <= 2) strip.scrollLeft += loopWidth;
  };

  const scrollByCard = (dir) => {
    const dist = getProjectStep();
    if (!dist) return;
    prepareProjectLoop(dir);
    const rawIndex = strip.scrollLeft / dist;
    const currentIndex = dir > 0
      ? Math.floor(rawIndex + 0.04)
      : Math.ceil(rawIndex - 0.04);
    const targetLeft = Math.max(0, (currentIndex + dir) * dist);
    strip.scrollTo({ left: targetLeft, behavior: 'smooth' });
    window.setTimeout(() => {
      ensureProjectCloneBuffer();
      requestProjectMediaPlayback();
    }, 700);
  };

  const projectAutoScrollMs = 3600;
  const isProjectSectionVisible = () => {
    if (!work) return false;
    const rect = work.getBoundingClientRect();
    return (
      T.projectsLayout === 'horizontal' &&
      rect.top < window.innerHeight * 0.74 &&
      rect.bottom > window.innerHeight * 0.26
    );
  };

  const getAnimatedProjectImages = () => Array.from(strip.querySelectorAll('.project__cover__img[data-animated-src]'));

  const setProjectImagePlayback = (img, shouldAnimate) => {
    if (!img.dataset.posterSrc) img.dataset.posterSrc = img.getAttribute('src');
    const nextSrc = shouldAnimate ? img.dataset.animatedSrc : img.dataset.posterSrc;
    if (img.getAttribute('src') !== nextSrc) img.setAttribute('src', nextSrc);
  };

  const updateProjectMediaPlayback = () => {
    const animatedImages = getAnimatedProjectImages();
    if (!animatedImages.length) return;

    if (!isProjectSectionVisible()) {
      animatedImages.forEach(img => setProjectImagePlayback(img, false));
      return;
    }

    const stripRect = strip.getBoundingClientRect();
    const stripCenter = stripRect.left + stripRect.width / 2;
    const hoveredProject = strip.querySelector('.project:hover');
    let activeProject = hoveredProject?.querySelector('.project__cover__img[data-animated-src]')
      ? hoveredProject
      : null;

    if (!activeProject) {
      let closestDistance = Infinity;
      animatedImages.forEach((img) => {
        const project = img.closest('.project');
        const rect = project.getBoundingClientRect();
        const isVisible = (
          rect.right > stripRect.left &&
          rect.left < stripRect.right &&
          rect.bottom > 0 &&
          rect.top < window.innerHeight
        );
        if (!isVisible) return;

        const distance = Math.abs((rect.left + rect.right) / 2 - stripCenter);
        if (distance < closestDistance) {
          closestDistance = distance;
          activeProject = project;
        }
      });
    }

    animatedImages.forEach((img) => {
      setProjectImagePlayback(img, img.closest('.project') === activeProject);
    });
  };

  let projectMediaTicking = false;
  const requestProjectMediaPlayback = () => {
    if (projectMediaTicking) return;
    projectMediaTicking = true;
    requestAnimationFrame(() => {
      updateProjectMediaPlayback();
      projectMediaTicking = false;
    });
  };

  const isProjectAutoPaused = () => (
    isProjectStripHovering ||
    isProjectNavHovering ||
    hasProjectFocus ||
    isProjectDragging ||
    document.hidden
  );
  const canAutoScrollProjects = () => (
    T.projectsLayout === 'horizontal' &&
    projectOriginalCards.length > 1 &&
    isProjectSectionVisible() &&
    strip.scrollWidth > strip.clientWidth + 4
  );
  const lockProjectScroll = () => {
    strip.scrollTo({ left: strip.scrollLeft, behavior: 'auto' });
  };

  const autoScrollProjects = () => {
    if (!canAutoScrollProjects() || isProjectAutoPaused()) return;
    scrollByCard(1);
  };

  let projectAutoTimer = null;
  const pauseProjectAutoScroll = () => {
    if (projectAutoTimer) window.clearTimeout(projectAutoTimer);
    projectAutoTimer = null;
  };
  const queueProjectAutoScroll = (delay = projectAutoScrollMs) => {
    pauseProjectAutoScroll();
    if (isProjectAutoPaused() || !canAutoScrollProjects()) return;
    projectAutoTimer = window.setTimeout(() => {
      autoScrollProjects();
      queueProjectAutoScroll();
    }, delay);
  };
  const manualProjectScroll = (dir) => {
    scrollByCard(dir);
    queueProjectAutoScroll();
  };

  prjPrev.addEventListener('click', (e) => {
    e.currentTarget.blur();
    manualProjectScroll(-1);
  });
  prjNext.addEventListener('click', (e) => {
    e.currentTarget.blur();
    manualProjectScroll(1);
  });
  queueProjectAutoScroll();

  strip.addEventListener('pointerenter', () => {
    isProjectStripHovering = true;
    lockProjectScroll();
    pauseProjectAutoScroll();
    requestProjectMediaPlayback();
  });

  strip.addEventListener('pointerleave', () => {
    isProjectStripHovering = false;
    queueProjectAutoScroll();
    requestProjectMediaPlayback();
  });

  strip.addEventListener('pointermove', requestProjectMediaPlayback, { passive: true });

  strip.addEventListener('focusin', () => {
    hasProjectFocus = true;
    lockProjectScroll();
    pauseProjectAutoScroll();
  });

  strip.addEventListener('focusout', (e) => {
    if (!strip.contains(e.relatedTarget) && !projectNav?.contains(e.relatedTarget)) {
      hasProjectFocus = false;
      queueProjectAutoScroll();
    }
  });

  projectNav?.addEventListener('pointerenter', () => {
    isProjectNavHovering = true;
    lockProjectScroll();
    pauseProjectAutoScroll();
  });

  projectNav?.addEventListener('pointerleave', () => {
    isProjectNavHovering = false;
    queueProjectAutoScroll();
  });

  let projectBufferTimer = null;
  strip.addEventListener('scroll', () => {
    window.clearTimeout(projectBufferTimer);
    requestProjectMediaPlayback();
    projectBufferTimer = window.setTimeout(() => {
      ensureProjectCloneBuffer();
      requestProjectMediaPlayback();
    }, 180);
  }, { passive: true });

  const updateProjectNavVisibility = () => {
    if (!projectNav || !work) return;
    const stripRect = strip.getBoundingClientRect();
    const navY = Math.min(
      window.innerHeight - 82,
      Math.max(82, stripRect.top + stripRect.height / 2)
    );
    projectNav.style.setProperty('--projects-nav-y', `${navY}px`);
    projectNav.classList.toggle('is-visible', isProjectSectionVisible());
  };

  let projectNavTicking = false;
  const requestProjectNavVisibility = () => {
    if (projectNavTicking) return;
    projectNavTicking = true;
    requestAnimationFrame(() => {
      updateProjectNavVisibility();
      projectNavTicking = false;
    });
  };

  window.addEventListener('scroll', requestProjectNavVisibility, { passive: true });
  window.addEventListener('resize', requestProjectNavVisibility);
  let projectPageScrollTimer = null;
  window.addEventListener('scroll', () => {
    if (!isProjectSectionVisible()) {
      pauseProjectAutoScroll();
      requestProjectMediaPlayback();
      return;
    }
    pauseProjectAutoScroll();
    requestProjectMediaPlayback();
    window.clearTimeout(projectPageScrollTimer);
    projectPageScrollTimer = window.setTimeout(() => queueProjectAutoScroll(), 1000);
  }, { passive: true });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pauseProjectAutoScroll();
    else queueProjectAutoScroll();
    requestProjectMediaPlayback();
  });
  updateProjectNavVisibility();
  requestProjectMediaPlayback();

  /* keyboard nav for projects when section is in view */
  document.addEventListener('keydown', (e) => {
    if (e.target.matches('input,textarea')) return;
    const rect = work.getBoundingClientRect();
    if (rect.top > window.innerHeight || rect.bottom < 0) return;
    if (T.projectsLayout !== 'horizontal') return;
    if (e.key === 'ArrowRight') { e.preventDefault(); manualProjectScroll(1); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); manualProjectScroll(-1); }
  });

  /* drag to scroll on the strip */
  let isDown = false, startX = 0, scrollLeft = 0;
  strip.addEventListener('pointerdown', (e) => {
    if (T.projectsLayout !== 'horizontal') return;
    if (e.target.closest('a, button')) return;
    isDown = true;
    isProjectDragging = true;
    lockProjectScroll();
    pauseProjectAutoScroll();
    startX = e.pageX - strip.offsetLeft;
    scrollLeft = strip.scrollLeft;
    strip.setPointerCapture(e.pointerId);
    strip.style.cursor = 'grabbing';
  });
  strip.addEventListener('pointermove', (e) => {
    if (!isDown) return;
    e.preventDefault();
    const x = e.pageX - strip.offsetLeft;
    strip.scrollLeft = scrollLeft - (x - startX) * 1.4;
  });
  const endDrag = () => {
    isDown = false;
    isProjectDragging = false;
    strip.style.cursor = '';
    window.setTimeout(() => {
      ensureProjectCloneBuffer();
      requestProjectMediaPlayback();
    }, 80);
    queueProjectAutoScroll();
  };
  strip.addEventListener('pointerup', endDrag);
  strip.addEventListener('pointerleave', endDrag);
  strip.addEventListener('pointercancel', endDrag);

  /* ── smooth anchor scroll ─────────────────────────────────── */
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href').slice(1);
      const t = document.getElementById(id);
      if (!t) return;
      e.preventDefault();
      window.scrollTo({ top: t.offsetTop - 60, behavior: 'smooth' });
    });
  });

  /* ── custom cursor ────────────────────────────────────────── */
  const cursor = document.getElementById('cursor');
  const canUseCursor = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let cx = 0, cy = 0, tx = 0, ty = 0, cursorRaf = null, cursorReady = false;

  const stopCursor = () => {
    if (cursorRaf) cancelAnimationFrame(cursorRaf);
    cursorRaf = null;
  };

  const followCursor = () => {
    cx += (tx - cx) * 0.22;
    cy += (ty - cy) * 0.22;
    cursor.style.transform = `translate(${cx}px, ${cy}px) translate(-50%, -50%)`;

    const dx = Math.abs(tx - cx);
    const dy = Math.abs(ty - cy);
    if (dx > 0.1 || dy > 0.1) {
      cursorRaf = requestAnimationFrame(followCursor);
      return;
    }

    cursorRaf = null;
  };

  if (cursor && canUseCursor) {
    window.addEventListener('pointermove', (e) => {
      if (!body.classList.contains('cursor-on')) return;
      tx = e.clientX;
      ty = e.clientY;
      if (!cursorReady) {
        cx = tx;
        cy = ty;
        cursorReady = true;
      }
      if (!cursorRaf) cursorRaf = requestAnimationFrame(followCursor);
    }, { passive: true });

    document.addEventListener('pointerover', (e) => {
      const t = e.target;
      const isHover = t.closest('a, button, [data-cursor="hover"]');
      const isText = t.matches('input, textarea');
      cursor.classList.toggle('cursor--hover', !!isHover && !isText);
      cursor.classList.toggle('cursor--text', !!isText);
    });

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) stopCursor();
    });
  }

  /* ── form ─────────────────────────────────────────────────── */
  const form = document.getElementById('contactForm');
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const data = Object.fromEntries(new FormData(form));
    if (!data.name || !data.email || !data.subject || !data.message) {
      alert('Por favor, preencha todos os campos.');
      return;
    }
    const subject = encodeURIComponent(data.subject);
    const body = encodeURIComponent(
      `Olá Victor!\n\nNome: ${data.name}\nEmail: ${data.email}\n\nMensagem:\n${data.message}\n\n--\nVia portfolio`
    );
    window.location.href = `mailto:herculinvictorr@gmail.com?subject=${subject}&body=${body}`;
  });

  /* ── parallax for vision pillars ──────────────────────────── */
  const visionPillars = document.querySelectorAll('.pillar');
  let parallaxTicking = false;
  const updatePillarParallax = () => {
    if (T.intensity !== 'subtle') {
      visionPillars.forEach((p, i) => {
        const r = p.getBoundingClientRect();
        if (r.top > window.innerHeight || r.bottom < 0) return;
        const center = (r.top + r.bottom) / 2 - window.innerHeight / 2;
        const k = T.intensity === 'bold' ? 0.04 : 0.02;
        p.style.transform = `translateY(${center * k * (i - 1)}px)`;
      });
    }
    parallaxTicking = false;
  };

  window.addEventListener('scroll', () => {
    if (parallaxTicking) return;
    parallaxTicking = true;
    requestAnimationFrame(updatePillarParallax);
  }, { passive: true });

  /* show fallback toggle after 1.5s if host hasn't activated edit mode */
  setTimeout(() => {
    if (!editModeOn && !document.referrer.includes('omnimode')) {
      toggle.classList.add('visible');
    }
  }, 1500);

})();
