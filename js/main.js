/* ==========================================================================
   Site behaviour
     - preloader + page reveal
     - sticky header, mobile menu, gallery side panel
     - "winona" button label duplication
     - testimonials carousel (centre mode, looped)
     - features carousel (paged, dots)
     - scroll-to-top
     - copyright year
   ========================================================================== */

(function () {
  'use strict';

  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ------------------------------------------------------------ Preloader */

  function initPreloader() {
    var preloader = document.querySelector('.preloader');
    var page = document.querySelector('.page');
    if (!page) return;

    function reveal() {
      page.classList.add('is-ready');
      if (preloader) preloader.classList.add('loaded');
      // Keep it out of the a11y tree and off the tab order once hidden.
      setTimeout(function () {
        if (preloader) preloader.setAttribute('aria-hidden', 'true');
      }, 400);
    }

    if (!preloader) {
      reveal();
      return;
    }

    // Show the loader long enough to read as intentional, but never block.
    var MIN_VISIBLE = reducedMotion ? 0 : 600;
    var started = Date.now();

    function finish() {
      var waited = Date.now() - started;
      setTimeout(reveal, Math.max(0, MIN_VISIBLE - waited));
    }

    if (document.readyState === 'complete') finish();
    else window.addEventListener('load', finish);

    // Safety net: never leave the page behind the loader.
    setTimeout(reveal, 6000);
  }

  /* --------------------------------------------------------- Sticky header */

  function initStickyHeader() {
    var navbar = document.querySelector('.navbar-main');
    var header = document.querySelector('.page-header');
    if (!navbar || !header) return;

    var placeholder = document.createElement('div');
    placeholder.setAttribute('aria-hidden', 'true');
    placeholder.style.display = 'none';
    header.appendChild(placeholder);

    var stuck = false;
    var ticking = false;

    function update() {
      ticking = false;

      // Only stick on layouts where the desktop bar is in play.
      if (window.innerWidth < 992) {
        if (stuck) unstick();
        return;
      }

      var threshold = header.offsetTop + navbar.offsetHeight + 56;

      if (!stuck && window.scrollY > threshold) {
        placeholder.style.height = navbar.offsetHeight + 'px';
        placeholder.style.display = 'block';
        navbar.classList.add('is-stuck');
        stuck = true;
      } else if (stuck && window.scrollY <= threshold) {
        unstick();
      }
    }

    function unstick() {
      navbar.classList.remove('is-stuck');
      placeholder.style.display = 'none';
      stuck = false;
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    update();
  }

  /* ----------------------------------------------------------- Mobile menu */

  /* Bootstrap Collapse drives the panel itself; this only closes it after a
     link is tapped, which Bootstrap does not do on its own. */
  function initMobileMenu() {
    var target = document.getElementById('primary-navigation');
    if (!target || !window.bootstrap) return;

    target.addEventListener('click', function (e) {
      if (!e.target.closest('.nav-link-custom')) return;
      if (window.innerWidth >= 992) return;
      var collapse = window.bootstrap.Collapse.getInstance(target);
      if (collapse) collapse.hide();
    });
  }

  /* --------------------------------------------------------- Winona buttons */

  /* Duplicates each button's label so the hover effect can slide one out
     while the other slides in. */
  function initWinonaButtons() {
    Array.prototype.forEach.call(
      document.querySelectorAll('.btn-custom:not([data-no-winona])'),
      function (button) {
        if (button.querySelector('.content-original')) return;
        var content = button.innerHTML;
        button.innerHTML =
          '<span class="content-original">' + content + '</span>' +
          '<span class="content-dubbed" aria-hidden="true">' + content + '</span>';
      }
    );
  }

  /* -------------------------------------------------- Testimonials carousel */

  function initTestimonials() {
    var root = document.querySelector('[data-testimonials]');
    if (!root) return;

    var viewport = root.querySelector('.testimonials-viewport');
    var track = root.querySelector('.testimonials-track');
    var originals = Array.prototype.slice.call(track.children);
    var count = originals.length;
    if (!count) return;

    // Three copies give room to scroll either way before we silently jump
    // back to the middle set.
    originals.forEach(function (item) {
      track.insertBefore(item.cloneNode(true), track.firstChild);
    });
    originals.forEach(function (item) {
      track.appendChild(item.cloneNode(true));
    });

    var items = Array.prototype.slice.call(track.children);
    var index = count; // centre of the middle set
    var timer = null;
    var animating = false;

    function perView() {
      var w = window.innerWidth;
      if (w >= 992) return 3;
      if (w >= 576) return 2;
      return 1;
    }

    function place(animate) {
      var width = viewport.clientWidth / perView();

      items.forEach(function (item, i) {
        item.style.width = width + 'px';
        item.classList.toggle('is-center', i === index);
      });

      var offset = index * width + width / 2 - viewport.clientWidth / 2;

      track.style.transition = animate && !reducedMotion ? 'transform .4s ease' : 'none';
      track.style.transform = 'translateX(' + -offset + 'px)';
    }

    var settleTimer = null;

    function settle() {
      clearTimeout(settleTimer);
      animating = false;

      // Snap back into the middle set so the loop never runs out of slides.
      if (index < count || index >= count * 2) {
        index = count + (((index - count) % count) + count) % count;
        place(false);
      }
    }

    function step(delta) {
      if (animating) return;
      animating = true;
      index += delta;
      place(true);

      // `transitionend` does not fire when the transition is suppressed
      // (reduced motion, off-screen, an unchanged transform). Without this
      // fallback the carousel would latch and never advance again.
      clearTimeout(settleTimer);
      settleTimer = setTimeout(settle, 600);
    }

    track.addEventListener('transitionend', function (e) {
      if (e.propertyName === 'transform') settle();
    });

    var prev = root.querySelector('[data-testimonials-prev]');
    var next = root.querySelector('[data-testimonials-next]');
    if (prev) prev.addEventListener('click', function () { step(-1); restart(); });
    if (next) next.addEventListener('click', function () { step(1); restart(); });

    // Clicking a side card brings it to the centre.
    track.addEventListener('click', function (e) {
      var item = e.target.closest('.testimonial-item');
      if (!item || item.classList.contains('is-center')) return;
      step(items.indexOf(item) - index);
      restart();
    });

    function start() {
      if (timer || reducedMotion) return;
      timer = setInterval(function () { step(1); }, 5000);
    }

    function stop() {
      clearInterval(timer);
      timer = null;
    }

    function restart() { stop(); start(); }

    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);

    var frame = null;
    window.addEventListener('resize', function () {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(function () { place(false); });
    });

    place(false);
    start();
  }

  /* ------------------------------------------------------ Features carousel */

  function initFeatures() {
    var root = document.querySelector('[data-features]');
    if (!root) return;

    var viewport = root.querySelector('.features-viewport');
    var track = root.querySelector('.features-track');
    var items = Array.prototype.slice.call(track.children);
    var dotsWrap = root.querySelector('.features-dots');
    if (!items.length) return;

    var page = 0;

    function perView() {
      var w = window.innerWidth;
      if (w >= 1200) return 4;
      if (w >= 992) return 2;
      return 1;
    }

    function pages() {
      return Math.ceil(items.length / perView());
    }

    function renderDots() {
      if (!dotsWrap) return;
      dotsWrap.innerHTML = '';

      for (var i = 0; i < pages(); i++) {
        (function (i) {
          var dot = document.createElement('button');
          dot.type = 'button';
          dot.setAttribute('aria-label', 'Go to slide ' + (i + 1));
          dot.className = i === page ? 'is-active' : '';
          dot.addEventListener('click', function () { go(i); });
          dotsWrap.appendChild(dot);
        })(i);
      }
    }

    function go(next) {
      page = Math.max(0, Math.min(next, pages() - 1));
      track.style.transform = 'translateX(' + (-page * viewport.clientWidth) + 'px)';
      renderDots();
    }

    function layout() {
      var width = viewport.clientWidth / perView();
      items.forEach(function (item) { item.style.flexBasis = width + 'px'; });
      go(Math.min(page, pages() - 1));
    }

    var frame = null;
    window.addEventListener('resize', function () {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(layout);
    });

    layout();
  }

  /* ------------------------------------------------------- Scroll to top */

  function initScrollTop() {
    var button = document.querySelector('.ui-to-top');
    if (!button) return;

    var ticking = false;

    function update() {
      ticking = false;
      button.classList.toggle('is-active', window.scrollY > 300);
    }

    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }, { passive: true });

    button.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reducedMotion ? 'auto' : 'smooth' });
    });

    update();
  }

  /* --------------------------------------------------------------- Misc */

  function initCopyrightYear() {
    Array.prototype.forEach.call(
      document.querySelectorAll('.copyright-year'),
      function (node) { node.textContent = new Date().getFullYear(); }
    );
  }

  function init() {
    initPreloader();
    initStickyHeader();
    initMobileMenu();
    initWinonaButtons();
    initTestimonials();
    initFeatures();
    initScrollTop();
    initCopyrightYear();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
