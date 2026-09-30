
(function () {
  'use strict';

  function HeroSlider(root) {
    this.root = root;
    this.slides = Array.prototype.slice.call(root.querySelectorAll('[data-slide-bg]'));
    if (this.slides.length < 2) return;

    this.index = 0;
    this.timer = null;
    this.interval = parseInt(root.getAttribute('data-autoplay'), 10) || 5000;
    this.reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    this.prevBtn = root.querySelector('.hero-arrow-prev');
    this.nextBtn = root.querySelector('.hero-arrow-next');
    this.pagination = root.querySelector('.hero-pagination');

    this.applyBackgrounds();
    this.buildPagination();
    this.bind();
    this.goTo(0, true);
    this.start();
  }

  HeroSlider.prototype.applyBackgrounds = function () {
    this.slides.forEach(function (slide) {
      slide.style.backgroundImage = 'url("' + slide.getAttribute('data-slide-bg') + '")';
    });
  };

  HeroSlider.prototype.buildPagination = function () {
    if (!this.pagination) return;

    var self = this;
    this.bullets = this.slides.map(function (slide, i) {
      var button = document.createElement('button');
      button.type = 'button';
      button.className = 'hero-bullet';
      button.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      button.innerHTML =
        '<svg viewBox="0 0 24 24" aria-hidden="true">' +
        '<circle class="bullet-ring" cx="12" cy="12" r="10"></circle>' +
        '<circle class="bullet-ring-2" cx="12" cy="12" r="10"></circle>' +
        '</svg>';
      button.addEventListener('click', function () {
        self.goTo(i);
        self.restart();
      });
      self.pagination.appendChild(button);
      return button;
    });
  };

  HeroSlider.prototype.bind = function () {
    var self = this;

    if (this.prevBtn) {
      this.prevBtn.addEventListener('click', function () {
        self.goTo(self.index - 1);
        self.restart();
      });
    }

    if (this.nextBtn) {
      this.nextBtn.addEventListener('click', function () {
        self.goTo(self.index + 1);
        self.restart();
      });
    }

    this.root.addEventListener('mouseenter', function () { self.stop(); });
    this.root.addEventListener('mouseleave', function () { self.start(); });
    document.addEventListener('visibilitychange', function () {
      if (document.hidden) self.stop();
      else self.start();
    });

    var startX = null;
    this.root.addEventListener('touchstart', function (e) {
      startX = e.changedTouches[0].clientX;
    }, { passive: true });

    this.root.addEventListener('touchend', function (e) {
      if (startX === null) return;
      var delta = e.changedTouches[0].clientX - startX;
      if (Math.abs(delta) > 50) {
        self.goTo(self.index + (delta < 0 ? 1 : -1));
        self.restart();
      }
      startX = null;
    }, { passive: true });
  };

  HeroSlider.prototype.goTo = function (next, initial) {
    var count = this.slides.length;
    var index = ((next % count) + count) % count;

    this.slides.forEach(function (slide, i) {
      slide.classList.toggle('is-active', i === index);
      slide.setAttribute('aria-hidden', i === index ? 'false' : 'true');
    });

    if (this.bullets) {
      this.bullets.forEach(function (bullet, i) {
        bullet.classList.toggle('is-active', i === index);
      });
    }

    this.index = index;
    this.updateArrowPreviews();
    this.animateCaption(this.slides[index], initial);
  };

  HeroSlider.prototype.updateArrowPreviews = function () {
    var count = this.slides.length;
    var prev = this.slides[(this.index - 1 + count) % count];
    var next = this.slides[(this.index + 1) % count];

    set(this.prevBtn, prev);
    set(this.nextBtn, next);

    function set(button, slide) {
      if (!button) return;
      var img = button.querySelector('.hero-arrow-preview-img');
      if (img) img.style.backgroundImage = 'url("' + slide.getAttribute('data-slide-bg') + '")';
    }
  };

  HeroSlider.prototype.animateCaption = function (slide, initial) {
    var items = Array.prototype.slice.call(
      this.root.querySelectorAll('[data-caption-animate]')
    );

    items.forEach(function (item) {
      item.classList.remove('is-animated');
      item.style.animationName = '';
      item.style.animationDelay = '';
      item.style.animationDuration = '';
    });

    if (this.reduced) {
      items.forEach(function (item) { item.classList.add('is-animated'); });
      return;
    }

    var active = Array.prototype.slice.call(
      slide.querySelectorAll('[data-caption-animate]')
    );

    void this.root.offsetWidth;

    active.forEach(function (item) {
      var delay = parseInt(item.getAttribute('data-caption-delay'), 10) || 0;
      var duration = parseInt(item.getAttribute('data-caption-duration'), 10) || 0;

      item.style.animationName = item.getAttribute('data-caption-animate');
      if (delay) item.style.animationDelay = (initial ? delay + 200 : delay) + 'ms';
      if (duration) item.style.animationDuration = duration + 'ms';
      item.classList.add('is-animated');
    });
  };

  HeroSlider.prototype.start = function () {
    if (this.timer || this.reduced) return;
    var self = this;
    this.timer = setInterval(function () { self.goTo(self.index + 1); }, this.interval);
  };

  HeroSlider.prototype.stop = function () {
    clearInterval(this.timer);
    this.timer = null;
  };

  HeroSlider.prototype.restart = function () {
    this.stop();
    this.start();
  };

  function init() {
    var root = document.querySelector('[data-hero-slider]');
    if (root) new HeroSlider(root);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
