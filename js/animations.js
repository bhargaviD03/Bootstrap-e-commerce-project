/* ==========================================================================
   Scroll-triggered animation system
   Replaces WOW.js. Declarative API:

     <div data-animation="fadeInUp" data-delay="150" data-duration="700">

   `data-delay`    — milliseconds before the animation starts (default 0)
   `data-duration` — milliseconds the animation runs (default 700)

   Elements stay hidden until they enter the viewport, then animate once.
   Without JS or with prefers-reduced-motion the content renders normally.
   ========================================================================== */

(function () {
  'use strict';

  var SELECTOR = '[data-animation]';
  var THRESHOLD = 0.12;

  function play(el) {
    var delay = parseInt(el.getAttribute('data-delay'), 10);
    var duration = parseInt(el.getAttribute('data-duration'), 10);

    if (delay > 0) el.style.animationDelay = delay + 'ms';
    if (duration > 0) el.style.animationDuration = duration + 'ms';

    el.classList.add('is-animated');
  }

  function init() {
    var elements = Array.prototype.slice.call(document.querySelectorAll(SELECTOR));
    if (!elements.length) return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Mark as JS-controlled so the CSS may hide them; without this class the
    // content is always visible.
    elements.forEach(function (el) { el.classList.add('js-anim'); });

    if (reduced || !('IntersectionObserver' in window)) {
      elements.forEach(function (el) { el.classList.add('is-animated'); });
      return;
    }

    var pending = [];

    function reveal(el) {
      play(el);
      observer.unobserve(el);
      var i = pending.indexOf(el);
      if (i !== -1) pending.splice(i, 1);
      if (!pending.length) window.removeEventListener('scroll', onScroll);
    }

    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) reveal(entry.target);
      });
    }, { threshold: THRESHOLD, rootMargin: '0px 0px -40px 0px' });

    // A large jump (anchor link, End key, restored scroll position) can skip
    // past elements without ever intersecting them on a rendered frame, so
    // the observer alone would leave them hidden. This sweep catches them.
    var ticking = false;

    function sweep() {
      ticking = false;
      var limit = window.innerHeight;
      // Copy first: reveal() mutates `pending` while we iterate.
      pending.slice().forEach(function (el) {
        if (el.getBoundingClientRect().top < limit) reveal(el);
      });
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(sweep);
    }

    elements.forEach(function (el) {
      // Reveal anything already on screen, and anything the page has
      // already scrolled past, immediately.
      if (el.getBoundingClientRect().top < window.innerHeight) {
        play(el);
      } else {
        pending.push(el);
        observer.observe(el);
      }
    });

    if (pending.length) window.addEventListener('scroll', onScroll, { passive: true });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
