/* ==========================================================================
   Parallax backgrounds
   Replaces the jQuery "material parallax" plugin.

   Each [data-parallax-img] gets an over-tall `.parallax-layer` child holding
   the artwork, which is then translated as the section crosses the viewport.
   Sizing the layer at 128% of the section guarantees `cover` at any viewport
   while leaving 28% of slack to travel through.

   Touch devices and reduced-motion users get a flat cover image — the
   original disabled the effect on mobile for the same reason.
   ========================================================================== */

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

        // 0 as the section enters from the bottom, 1 as it leaves the top.
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
