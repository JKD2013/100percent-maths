// ============================================================
// 100Percent — Auth controller (login.html)
// Sign in, sign up, and OAuth (Google, Microsoft) via Supabase Auth.
// Routes teachers → teacher-dashboard.html, students → dashboard.html.
// ============================================================

/* global sb, window */

(function () {
  'use strict';

  var signInForm = document.getElementById('signInForm');
  var signUpForm = document.getElementById('signUpForm');
  var signInBtn = document.getElementById('signinSubmitBtn');
  var signUpBtn = document.getElementById('signupSubmitBtn');
  var switchToSignup = document.getElementById('switchToSignup');
  var switchToSignin = document.getElementById('switchToSignin');
  var authTitle = document.getElementById('authTitle');
  var authDesc = document.getElementById('authDesc');
  var oauthGoogle = document.getElementById('oauthGoogleBtn');
  var oauthMicrosoft = document.getElementById('oauthMicrosoftBtn');

  if (!signInForm || typeof sb === 'undefined') return;

  // ---------- Form mode toggle ----------
  function showSignUp() {
    signInForm.classList.add('hidden');
    signUpForm.classList.remove('hidden');
    if (authTitle) authTitle.textContent = 'Create an account';
    if (authDesc) authDesc.textContent = 'Join 100Percent and start building maths confidence.';
  }

  function showSignIn() {
    signUpForm.classList.add('hidden');
    signInForm.classList.remove('hidden');
    if (authTitle) authTitle.textContent = 'Welcome back';
    if (authDesc) authDesc.textContent = 'Sign in to continue your mathematical journey.';
  }

  if (switchToSignup) switchToSignup.addEventListener('click', function (e) { e.preventDefault(); showSignUp(); });
  if (switchToSignin) switchToSignin.addEventListener('click', function (e) { e.preventDefault(); showSignIn(); });

  // ---------- Password toggles ----------
  function setupToggle(toggleId, inputId) {
    var toggle = document.getElementById(toggleId);
    var input = document.getElementById(inputId);
    if (!toggle || !input) return;
    var visible = false;
    toggle.addEventListener('click', function () {
      visible = !visible;
      input.type = visible ? 'text' : 'password';
      var svg = toggle.querySelector('svg');
      if (svg) {
        svg.innerHTML = visible
          ? '<path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.06M9 9h.01M17 17h.01M12 20a8 8 0 0 0-6.24-11.15M18.76 3.84A10.05 10.05 0 0 1 22 12c0 7-7 11-11 11a18.45 18.45 0 0 1-5.06-5.06"></path>'
          : '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle>';
      }
    });
  }
  setupToggle('toggleSigninPassword', 'signinPassword');
  setupToggle('toggleSignupPassword', 'signupPassword');

  // ---------- Error UI ----------
  function clearErrors(formEl) {
    formEl.querySelectorAll('.error').forEach(function (el) {
      el.classList.remove('error');
      el.style.borderColor = '';
    });
    var old = formEl.querySelector('.error-message');
    if (old) old.remove();
  }

  function showError(input, message) {
    if (!input) return;
    input.classList.add('error');
    input.style.borderColor = '#ef4444';
    var div = document.createElement('div');
    div.className = 'error-message';
    div.textContent = message;
    div.style.color = '#ef4444';
    div.style.fontSize = '12px';
    div.style.marginTop = '6px';
    input.parentNode.appendChild(div);
  }

  function setLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
      btn.textContent = 'Working…';
      btn.disabled = true;
      btn.style.opacity = '0.7';
    } else {
      btn.textContent = btn.dataset.originalText || btn.textContent;
      btn.disabled = false;
      btn.style.opacity = '1';
    }
  }

  // ---------- Role-based redirect ----------
  function redirectByRole(role) {
    if (role === 'teacher') {
      window.location.href = 'teacher-dashboard.html';
    } else {
      window.location.href = 'dashboard.html';
    }
  }

  // ---------- Sign in ----------
  if (signInBtn) signInBtn.dataset.originalText = signInBtn.textContent;
  if (signInForm) {
    signInForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors(signInForm);

      var email = (document.getElementById('signinEmail').value || '').trim();
      var password = document.getElementById('signinPassword').value || '';

      if (!email) { showError(document.getElementById('signinEmail'), 'Enter your email address'); return; }
      if (!password) { showError(document.getElementById('signinPassword'), 'Enter your password'); return; }

      setLoading(signInBtn, true);

      sb.auth.signInWithPassword({ email: email, password: password }).then(function (_ref) {
        var data = _ref.data;
        var error = _ref.error;
        setLoading(signInBtn, false);

        if (error) {
          if (/invalid login credentials/.test(error.message || '')) {
            showError(document.getElementById('signinEmail'), 'Email or password is incorrect');
            showError(document.getElementById('signinPassword'), 'Email or password is incorrect');
          } else {
            showError(document.getElementById('signinEmail'), error.message || 'Sign-in failed. Try again.');
          }
          return;
        }

        // Redirect based on role from profile
        var role = data.user.user_metadata.role || 'student';
        redirectByRole(role);
      });
    });
  }

  // ---------- Sign up ----------
  if (signUpBtn) signUpBtn.dataset.originalText = signUpBtn.textContent;
  if (signUpForm) {
    signUpForm.addEventListener('submit', function (e) {
      e.preventDefault();
      clearErrors(signUpForm);

      var fullName = (document.getElementById('signupFullName').value || '').trim();
      var email = (document.getElementById('signupEmail').value || '').trim();
      var password = document.getElementById('signupPassword').value || '';
      var confirm = document.getElementById('signupConfirmPassword').value || '';
      var role = document.getElementById('signupRole').value;

      if (!fullName) { showError(document.getElementById('signupFullName'), 'Enter your full name'); return; }
      if (!email) { showError(document.getElementById('signupEmail'), 'Enter your email address'); return; }
      if (!password) { showError(document.getElementById('signupPassword'), 'Enter a password'); return; }
      if (password !== confirm) {
        showError(document.getElementById('signupConfirmPassword'), 'Passwords do not match');
        return;
      }
      if (password.length < 6) {
        showError(document.getElementById('signupPassword'), 'Password must be at least 6 characters');
        return;
      }

      setLoading(signUpBtn, true);

      sb.auth.signUp({
        email: email,
        password: password,
        options: { data: { full_name: fullName, role: role } }
      }).then(function (_ref) {
        var data = _ref.data;
        var error = _ref.error;
        setLoading(signUpBtn, false);

        if (error) {
          if (/already registered/.test(error.message || '') || /User already exists/.test(error.message || '')) {
            showError(document.getElementById('signupEmail'), 'An account with this email already exists. Sign in instead.');
          } else if (/password should be at least/.test(error.message || '')) {
            showError(document.getElementById('signupPassword'), error.message);
          } else {
            showError(document.getElementById('signupEmail'), error.message || 'Sign-up failed. Try again.');
          }
          return;
        }

        // If email confirmations are required, data.session is null → tell user to check email
        if (!data.session) {
          signUpForm.reset();
          showSignIn();
          var emailInput = document.getElementById('signinEmail');
          if (emailInput) emailInput.value = email;
          alert('Account created! Please check your email to confirm your address, then sign in.');
          return;
        }

        redirectByRole(role);
      });
    });
  }

  // ---------- OAuth helpers ----------
  function oauthSignIn(provider) {
    if (!sb) return;
    sb.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: window.location.origin + '/login.html'
      }
    }).then(function (_ref) {
      var error = _ref.error;
      if (error) {
        alert('OAuth sign-in not yet configured: ' + (error.message || error));
        console.error('OAuth error:', error);
      }
    });
  }

  if (oauthGoogle) oauthGoogle.addEventListener('click', function () { oauthSignIn('google'); });
  if (oauthMicrosoft) oauthMicrosoft.addEventListener('click', function () { oauthSignIn('microsoft'); });

  // ---------- Forgot password ----------
  var forgotLink = document.getElementById('forgotPasswordLink');
  if (forgotLink) {
    forgotLink.addEventListener('click', function (e) {
      e.preventDefault();
      var email = (document.getElementById('signinEmail').value || '').trim();
      if (!email) {
        alert('Enter your email address first.');
        return;
      }
      sb.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + '/login.html' }).then(function (_ref) {
        var error = _ref.error;
        if (error) { alert(error.message || 'Could not send reset link.'); return; }
        alert('Password reset link sent to ' + email);
      });
    });
  }

  // ---------- Auto-redirect if already signed in ----------
  sb.auth.getSession().then(function (_ref) {
    var session = _ref.data.session;
    if (session) {
      var role = session.user.user_metadata.role || 'student';
      redirectByRole(role);
    }
  });
})();
