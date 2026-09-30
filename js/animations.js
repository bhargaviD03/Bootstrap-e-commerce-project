
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

    var ticking = false;

    function sweep() {
      ticking = false;
      var limit = window.innerHeight;
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
