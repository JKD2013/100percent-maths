// ============================================================
// 100Percent — Contact controller (contact-us.html)
// Inserts into contact_submissions (RLS allows anon inserts).
// No auth required. Shows a success state on submit.
// ============================================================

/* global sb, window */

(function () {
  'use strict';

  var form = document.querySelector('form.login-card');
  if (!form || typeof sb === 'undefined') return;

  var nameEl = document.getElementById('contact-name');
  var emailEl = document.getElementById('contact-email');
  var messageEl = document.getElementById('contact-message');

  if (!nameEl || !emailEl || !messageEl) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();

    var name = (nameEl.value || '').trim();
    var email = (emailEl.value || '').trim();
    var message = (messageEl.value || '').trim();

    if (!name || !email || !message) {
      alert('Please fill in all fields.');
      return;
    }

    var btn = form.querySelector('button[type="submit"]');
    var origText = btn ? btn.textContent : '';
    if (btn) { btn.textContent = 'Sending…'; btn.disabled = true; }

    sb.from('contact_submissions')
      .insert({ name: name, email: email, message: message })
      .then(function (_ref) {
        var error = _ref.error;
        if (error) {
          alert('Send failed — please try again.');
          if (btn) { btn.textContent = origText; btn.disabled = false; }
          return;
        }
        form.reset();
        if (btn) btn.textContent = 'Sent';
        setTimeout(function () {
          if (btn) { btn.textContent = 'Send message'; btn.disabled = false; }
        }, 2000);
      });
  });
})();
