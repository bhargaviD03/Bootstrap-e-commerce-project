/* ==========================================================================
   Gallery: masonry layout + lightbox
   Replaces Isotope and lightGallery.

   Masonry mirrors Isotope's placement rule: each cell drops into the set of
   adjacent columns whose tallest point is lowest, left-most wins on a tie.
   Column counts and per-cell spans come from data attributes so the markup
   stays declarative.
   ========================================================================== */

(function () {
  'use strict';

  var GAP = 10;

  /* ---------------------------------------------------------------- Masonry */

  function Masonry(grid) {
    this.grid = grid;
    this.cells = Array.prototype.slice.call(grid.querySelectorAll('.gallery-cell'));
    if (!this.cells.length) return;

    this.layout = this.layout.bind(this);
    this.grid.classList.add('is-laid-out');

    this.layout();
    this.watchImages();

    var frame = null;
    window.addEventListener('resize', function () {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(this.layout);
    }.bind(this));
  }

  Masonry.prototype.columns = function () {
    var w = window.innerWidth;
    if (w >= 1200) return 6;
    if (w >= 576) return 3;
    return 2;
  };

  Masonry.prototype.spanOf = function (cell, columns) {
    var attr = columns === 6 ? 'data-span-xl' : columns === 3 ? 'data-span-sm' : 'data-span-xs';
    var span = parseInt(cell.getAttribute(attr), 10) || 1;
    return Math.min(span, columns);
  };

  Masonry.prototype.layout = function () {
    var columns = this.columns();
    var gridWidth = this.grid.clientWidth;
    var colWidth = gridWidth / columns;
    var offsets = new Array(columns).fill(0);

    this.cells.forEach(function (cell) {
      var span = this.spanOf(cell, columns);

      // Find the placement whose tallest column is lowest.
      var best = 0;
      var bestY = Infinity;
      for (var c = 0; c <= columns - span; c++) {
        var y = Math.max.apply(null, offsets.slice(c, c + span));
        if (y < bestY - 0.5) {
          bestY = y;
          best = c;
        }
      }

      cell.style.width = (colWidth * span) + 'px';
      cell.style.transform = 'translate(' + (colWidth * best) + 'px, ' + bestY + 'px)';

      var height = cell.getBoundingClientRect().height;
      for (var i = best; i < best + span; i++) offsets[i] = bestY + height + GAP;
    }, this);

    this.grid.style.height = (Math.max.apply(null, offsets) - GAP) + 'px';
  };

  /* Images without intrinsic sizing change the cell height once decoded. */
  Masonry.prototype.watchImages = function () {
    var images = this.grid.querySelectorAll('img');
    var pending = images.length;
    if (!pending) return;

    Array.prototype.forEach.call(images, function (img) {
      if (img.complete) {
        if (--pending === 0) this.layout();
        return;
      }
      var done = function () {
        if (--pending === 0) this.layout();
      }.bind(this);
      img.addEventListener('load', done, { once: true });
      img.addEventListener('error', done, { once: true });
    }, this);
  };

  /* --------------------------------------------------------------- Lightbox */

  function Lightbox() {
    this.items = [];
    this.index = 0;
    this.lastFocus = null;
    this.build();
    this.bind();
  }

  Lightbox.prototype.build = function () {
    var el = document.createElement('div');
    el.className = 'lightbox';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-modal', 'true');
    el.setAttribute('aria-label', 'Image viewer');
    el.innerHTML =
      '<figure class="lightbox-figure"><img src="" alt=""></figure>' +
      '<button type="button" class="lightbox-btn lightbox-prev mdi mdi-arrow-left" aria-label="Previous image"></button>' +
      '<button type="button" class="lightbox-btn lightbox-next mdi mdi-arrow-right" aria-label="Next image"></button>' +
      '<button type="button" class="lightbox-btn lightbox-close" aria-label="Close viewer"><span class="mdi mdi-close"></span></button>' +
      '<div class="lightbox-counter"></div>';

    document.body.appendChild(el);

    this.el = el;
    this.figure = el.querySelector('.lightbox-figure');
    this.img = el.querySelector('img');
    this.counter = el.querySelector('.lightbox-counter');
    this.closeBtn = el.querySelector('.lightbox-close');
  };

  Lightbox.prototype.bind = function () {
    var self = this;

    this.el.querySelector('.lightbox-prev').addEventListener('click', function () { self.step(-1); });
    this.el.querySelector('.lightbox-next').addEventListener('click', function () { self.step(1); });
    this.closeBtn.addEventListener('click', function () { self.close(); });

    // Clicking the dim area (but not the picture) closes the viewer.
    this.el.addEventListener('click', function (e) {
      if (e.target === self.el) self.close();
    });

    document.addEventListener('keydown', function (e) {
      if (!self.el.classList.contains('is-open')) return;
      if (e.key === 'Escape') self.close();
      else if (e.key === 'ArrowLeft') self.step(-1);
      else if (e.key === 'ArrowRight') self.step(1);
      else if (e.key === 'Tab') {
        // Keep focus inside the dialog while it is open.
        e.preventDefault();
        self.closeBtn.focus();
      }
    });
  };

  Lightbox.prototype.open = function (items, index) {
    this.items = items;
    this.lastFocus = document.activeElement;
    this.el.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    this.show(index);
    this.closeBtn.focus();
  };

  Lightbox.prototype.show = function (index) {
    var count = this.items.length;
    this.index = ((index % count) + count) % count;

    var item = this.items[this.index];
    this.figure.classList.add('is-loading');

    var next = new Image();
    next.onload = function () {
      this.img.src = next.src;
      this.img.alt = item.alt || '';
      this.figure.classList.remove('is-loading');
    }.bind(this);
    next.src = item.src;

    this.counter.textContent = (this.index + 1) + ' / ' + count;
  };

  Lightbox.prototype.step = function (delta) {
    this.show(this.index + delta);
  };

  Lightbox.prototype.close = function () {
    this.el.classList.remove('is-open');
    document.body.style.overflow = '';
    if (this.lastFocus) this.lastFocus.focus();
  };

  /* ------------------------------------------------------------------- Init */

  function init() {
    Array.prototype.forEach.call(
      document.querySelectorAll('[data-masonry-grid]'),
      function (grid) { new Masonry(grid); }
    );

    var triggers = Array.prototype.slice.call(document.querySelectorAll('[data-lightbox]'));
    if (!triggers.length) return;

    var lightbox = new Lightbox();

    // Each `data-lightbox` value forms its own navigable set.
    var groups = {};
    triggers.forEach(function (trigger) {
      var name = trigger.getAttribute('data-lightbox');
      (groups[name] = groups[name] || []).push(trigger);
    });

    triggers.forEach(function (trigger) {
      trigger.addEventListener('click', function (e) {
        e.preventDefault();

        var group = groups[trigger.getAttribute('data-lightbox')];
        var items = group.map(function (node) {
          var img = node.querySelector('img');
          return { src: node.getAttribute('href'), alt: img ? img.alt : '' };
        });

        lightbox.open(items, group.indexOf(trigger));
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
