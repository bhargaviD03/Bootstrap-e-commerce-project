
(function () {
  'use strict';

  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i;


  var snackbar = {
    node: null,
    timer: null,

    show: function (message, type) {
      this.node = this.node || document.getElementById('form-output-global');
      if (!this.node) return;

      clearTimeout(this.timer);
      this.node.className = 'snackbars is-visible' + (type ? ' is-' + type : '');
      this.node.innerHTML =
        '<p><span class="mdi ' +
        (type === 'error' ? 'mdi-close' : 'mdi-email') +
        '" aria-hidden="true"></span><span>' + message + '</span></p>';
      this.node.setAttribute('role', 'status');

      this.timer = setTimeout(function () {
        this.node.classList.remove('is-visible');
      }.bind(this), 4500);
    }
  };


  function fieldsOf(form) {
    return Array.prototype.slice.call(form.querySelectorAll('[data-constraints]'));
  }

  function wrapOf(field) {
    return field.closest('.form-wrap');
  }

  function labelOf(field) {
    var wrap = wrapOf(field);
    return wrap ? wrap.querySelector('.form-label') : null;
  }

  function isFilled(field) {
    return String(field.value || '').trim() !== '';
  }

  function syncLabel(field, focused) {
    var label = labelOf(field);
    if (!label) return;
    label.classList.toggle('is-hidden', focused || isFilled(field));
  }

  function validate(field) {
    var rules = field.getAttribute('data-constraints') || '';
    var value = String(field.value || '').trim();

    if (rules.indexOf('@Required') !== -1) {
      if (field.tagName === 'SELECT' && (value === '' || field.selectedIndex === 0)) {
        return 'Please choose an option';
      }
      if (value === '') return 'Required field';
    }

    if (rules.indexOf('@Email') !== -1 && value !== '' && !EMAIL_RE.test(value)) {
      return 'Please enter a valid email';
    }

    return '';
  }

  function showError(field, message) {
    var wrap = wrapOf(field);
    if (!wrap) return;

    wrap.classList.toggle('has-error', !!message);
    wrap.classList.toggle('has-success', !message && isFilled(field));
    field.setAttribute('aria-invalid', message ? 'true' : 'false');

    var note = wrap.querySelector('.form-validation');

    if (!message) {
      if (note) note.remove();
      return;
    }

    if (!note) {
      note = document.createElement('span');
      note.className = 'form-validation';
      wrap.appendChild(note);
    }
    note.textContent = message;
  }

  function submitForm(form, payload) {
    void form;
    void payload;

    return new Promise(function (resolve) {
      setTimeout(function () { resolve({ ok: true }); }, 900);
    });
  }

  function collect(form) {
    var data = {};
    Array.prototype.forEach.call(form.elements, function (el) {
      if (el.name) data[el.name] = el.value;
    });
    return data;
  }


  function enhance(form) {
    var fields = fieldsOf(form);
    var button = form.querySelector('[type="submit"]');
    var type = form.getAttribute('data-form-type') || 'contact';

    form.setAttribute('novalidate', 'novalidate');

    fields.forEach(function (field) {
      syncLabel(field, false);

      field.addEventListener('focus', function () {
        var wrap = wrapOf(field);
        if (wrap) wrap.classList.add('has-focus');
        syncLabel(field, true);
      });

      field.addEventListener('blur', function () {
        var wrap = wrapOf(field);
        if (wrap) wrap.classList.remove('has-focus');
        syncLabel(field, false);
        showError(field, validate(field));
      });

      field.addEventListener('input', function () {
        syncLabel(field, true);
        var wrap = wrapOf(field);
        if (wrap && wrap.classList.contains('has-error') && !validate(field)) {
          showError(field, '');
        }
      });

      field.addEventListener('change', function () {
        syncLabel(field, false);
        showError(field, validate(field));
      });
    });

    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var firstInvalid = null;
      fields.forEach(function (field) {
        var message = validate(field);
        showError(field, message);
        if (message && !firstInvalid) firstInvalid = field;
      });

      if (firstInvalid) {
        firstInvalid.focus();
        snackbar.show('Please correct the highlighted fields.', 'error');
        return;
      }

      var original = button ? button.innerHTML : '';
      if (button) {
        button.disabled = true;
        button.classList.add('is-busy');
        button.innerHTML = '<span class="content-original">Sending&hellip;</span>';
      }

      submitForm(form, collect(form))
        .then(function () {
          form.reset();
          fields.forEach(function (field) {
            syncLabel(field, false);
            showError(field, '');
            var wrap = wrapOf(field);
            if (wrap) wrap.classList.remove('has-success');
          });

          snackbar.show(
            type === 'subscribe'
              ? 'Thank you! You are now subscribed.'
              : 'Thank you! Your table request has been sent.',
            'success'
          );
        })
        .catch(function () {
          snackbar.show('Something went wrong. Please try again.', 'error');
        })
        .then(function () {
          if (!button) return;
          button.disabled = false;
          button.classList.remove('is-busy');
          button.innerHTML = original;
        });
    });
  }

  function init() {
    Array.prototype.forEach.call(document.querySelectorAll('[data-form]'), enhance);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
