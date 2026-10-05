
(function () {
  'use strict';

  var OVERSIZE = 0.28;                                   // extra layer height
  var TRAVEL = OVERSIZE / (1 + OVERSIZE) * 100;          // as % of the layer

  function init() {
    var sections = Array.prototype.slice.call(
      document.querySelectorAll('[data-parallax-img]')
    );
    if (!sections.length) return;

    var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var coarse = window.matchMedia('(hover: none)').matches;
    var stat = reduced || coarse;

    var layers = sections.map(function (section) {
      var layer = document.createElement('div');
      layer.className = 'parallax-layer' + (stat ? ' is-static' : '');
      layer.setAttribute('aria-hidden', 'true');
      layer.style.backgroundImage = 'url("' + section.getAttribute('data-parallax-img') + '")';
      section.insertBefore(layer, section.firstChild);
      return layer;
    });

    if (stat) return;

    var ticking = false;

    function update() {
      ticking = false;
      var viewport = window.innerHeight;

      sections.forEach(function (section, i) {
        var rect = section.getBoundingClientRect();
        if (rect.bottom < 0 || rect.top > viewport) return;

        var progress = (viewport - rect.top) / (viewport + rect.height);
        progress = Math.min(1, Math.max(0, progress));

        layers[i].style.transform = 'translateY(' + (-progress * TRAVEL).toFixed(3) + '%)';
      });
    }

    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(update);
    }

    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
    window.addEventListener('load', update);
    update();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();




