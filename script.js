/* ==========================================================================
   KAHANI TASTE KI — script.js
   Vanilla JavaScript only. No libraries, no build step.

   CONTENTS
   01. Helpers
   02. Footer year
   03. Navbar scroll behaviour
   04. Mobile menu (animated drawer)
   05. Scroll reveal animations
   06. Active navigation link highlighting
   07. Parallax (hero + layered images)
   08. Smooth scrolling for in-page links
   09. Graceful image fallback
   ========================================================================== */

(function () {
  'use strict';

  /* ========================================================================
     01. HELPERS
     ======================================================================== */

  /** Shorthand for querySelector. */
  const $ = (selector, scope) => (scope || document).querySelector(selector);

  /** Shorthand for querySelectorAll, returned as a real array. */
  const $$ = (selector, scope) =>
    Array.prototype.slice.call((scope || document).querySelectorAll(selector));

  /** True when the visitor has asked the system for reduced motion. */
  const prefersReducedMotion = window.matchMedia(
    '(prefers-reduced-motion: reduce)'
  ).matches;

  /**
   * Runs a callback at most once per animation frame.
   * Keeps scroll listeners cheap and smooth.
   */
  function onFrame(callback) {
    let ticking = false;
    return function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(function () {
        callback();
        ticking = false;
      });
    };
  }


  /* ========================================================================
     02. FOOTER YEAR — keeps the copyright line current automatically
     ======================================================================== */
  const yearEl = $('#year');
  if (yearEl) {
    yearEl.textContent = String(new Date().getFullYear());
  }


  /* ========================================================================
     03. NAVBAR SCROLL BEHAVIOUR
     The bar sits transparent over the hero and turns solid cream as soon
     as the visitor scrolls past the first 60 pixels.
     ======================================================================== */
  const nav = $('#nav');
  const SOLID_AFTER = 60; // px scrolled before the bar turns cream

  function updateNavbar() {
    nav.classList.toggle('is-scrolled', window.scrollY > SOLID_AFTER);
  }

  if (nav) {
    const handleNavScroll = onFrame(updateNavbar);
    window.addEventListener('scroll', handleNavScroll, { passive: true });
    updateNavbar(); // run once in case the page loads part-way down
  }


  /* ========================================================================
     04. MOBILE MENU
     A slide-in drawer with a scrim, an animated hamburger and
     keyboard support (Escape closes it).
     ======================================================================== */
  const burger = $('#navBurger');
  const navLinks = $('#navLinks');
  const scrim = $('#navScrim');

  function openMenu() {
    navLinks.classList.add('is-open');
    burger.classList.add('is-open');
    nav.classList.add('is-menu-open');
    burger.setAttribute('aria-expanded', 'true');
    burger.setAttribute('aria-label', 'Close menu');
    document.body.classList.add('is-locked');

    scrim.hidden = false;
    // Next frame, so the opacity transition actually runs
    window.requestAnimationFrame(function () {
      scrim.classList.add('is-open');
    });
  }

  function closeMenu() {
    navLinks.classList.remove('is-open');
    burger.classList.remove('is-open');
    nav.classList.remove('is-menu-open');
    burger.setAttribute('aria-expanded', 'false');
    burger.setAttribute('aria-label', 'Open menu');
    document.body.classList.remove('is-locked');

    scrim.classList.remove('is-open');
    window.setTimeout(function () {
      scrim.hidden = true;
    }, 450);
  }

  function toggleMenu() {
    if (navLinks.classList.contains('is-open')) {
      closeMenu();
    } else {
      openMenu();
    }
  }

  if (burger && navLinks && scrim) {
    burger.addEventListener('click', toggleMenu);
    scrim.addEventListener('click', closeMenu);

    // Close after choosing a destination
    $$('a', navLinks).forEach(function (link) {
      link.addEventListener('click', closeMenu);
    });

    // Escape closes the drawer and returns focus to the button
    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && navLinks.classList.contains('is-open')) {
        closeMenu();
        burger.focus();
      }
    });

    // If the window grows to desktop width, reset everything
    window.addEventListener('resize', function () {
      if (window.innerWidth >= 960 && navLinks.classList.contains('is-open')) {
        closeMenu();
      }
    });
  }


  /* ========================================================================
     05. SCROLL REVEAL
     Any element with [data-reveal] fades and lifts into place once.
     Add data-reveal-delay="120" (milliseconds) to stagger a group.
     ======================================================================== */
  const revealItems = $$('[data-reveal]');

  // Apply the stagger delays declared in the HTML
  revealItems.forEach(function (el) {
    const delay = el.getAttribute('data-reveal-delay');
    if (delay) {
      el.style.setProperty('--reveal-delay', delay + 'ms');
    }
  });

  if (prefersReducedMotion || !('IntersectionObserver' in window)) {
    // No animation: just show everything
    revealItems.forEach(function (el) {
      el.classList.add('is-visible');
    });
  } else {
    const revealObserver = new IntersectionObserver(
      function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target); // reveal once, then stop watching
        });
      },
      {
        threshold: 0.12,
        rootMargin: '0px 0px -8% 0px'
      }
    );

    revealItems.forEach(function (el) {
      revealObserver.observe(el);
    });
  }


  /* ========================================================================
     06. ACTIVE NAVIGATION LINK
     Underlines the nav item matching the section currently on screen.
     ======================================================================== */
  const sections = $$('main section[id]');
  const navAnchors = $$('.nav__links > a[href^="#"]');

  if (sections.length && navAnchors.length && 'IntersectionObserver' in window) {
    const sectionObserver = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          const id = '#' + entry.target.id;
          navAnchors.forEach(function (anchor) {
            anchor.classList.toggle(
              'is-active',
              anchor.getAttribute('href') === id
            );
          });
        });
      },
      { rootMargin: '-45% 0px -50% 0px' }
    );

    sections.forEach(function (section) {
      sectionObserver.observe(section);
    });
  }


  /* ========================================================================
     07. PARALLAX
     Elements with data-parallax="0.25" drift at a fraction of scroll speed.
     Only runs on larger screens and when motion is allowed.
     ======================================================================== */
  const parallaxItems = $$('[data-parallax]');

  function updateParallax() {
    const viewportH = window.innerHeight;

    parallaxItems.forEach(function (el) {
      const rect = el.getBoundingClientRect();

      // Skip anything comfortably off screen
      if (rect.bottom < -200 || rect.top > viewportH + 200) return;

      const speed = parseFloat(el.getAttribute('data-parallax')) || 0.15;
      // Distance of the element's centre from the viewport's centre
      const offset = (rect.top + rect.height / 2) - viewportH / 2;
      el.style.transform = 'translate3d(0, ' + (-offset * speed).toFixed(2) + 'px, 0)';
    });
  }

  function initParallax() {
    if (prefersReducedMotion || !parallaxItems.length) return;
    if (window.innerWidth < 768) {
      // Reset any transform left over from a wider viewport
      parallaxItems.forEach(function (el) { el.style.transform = ''; });
      return;
    }
    updateParallax();
  }

  if (parallaxItems.length && !prefersReducedMotion) {
    const handleParallax = onFrame(initParallax);
    window.addEventListener('scroll', handleParallax, { passive: true });
    window.addEventListener('resize', handleParallax);
    initParallax();
  }


  /* ========================================================================
     08. SMOOTH SCROLLING
     CSS `scroll-behavior: smooth` does most of the work; this adds a
     reliable fallback and keeps the URL hash tidy.
     ======================================================================== */
  $$('a[href^="#"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
      const href = anchor.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector(href);
      if (!target) return;

      event.preventDefault();

      const navHeight = nav ? nav.offsetHeight : 0;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight + 1;

      window.scrollTo({
        top: top,
        behavior: prefersReducedMotion ? 'auto' : 'smooth'
      });

      // Update the address bar without another jump
      if (history.replaceState) {
        history.replaceState(null, '', href);
      }
    });
  });


  /* ========================================================================
     09. GRACEFUL IMAGE FALLBACK
     If a placeholder URL ever fails to load, the image is replaced with a
     warm gradient block instead of a broken-image icon. Once you swap in
     your own restaurant photos this simply never fires.
     ======================================================================== */
  $$('img').forEach(function (img) {
    img.addEventListener(
      'error',
      function () {
        img.style.background =
          'linear-gradient(135deg, #E7D9C3 0%, #D9C4A6 50%, #C9AE86 100%)';
        img.style.minHeight = '220px';
        img.removeAttribute('src'); // stops the browser drawing a broken icon
      },
      { once: true }
    );
  });

})();