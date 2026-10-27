// ============================================================
// 100Percent — Supabase client
// Auth + database access. The anon key is a PUBLISHABLE key:
// safe to embed client-side; all writes are protected by RLS.
// ============================================================

/* global supabase */

(function () {
  'use strict';

  var SUPABASE_URL = 'https://zdumqvlbzhmcygmnsekv.supabase.co';
  var SUPABASE_ANON_KEY = 'sb_publishable_4ZvyQ03abHddcmKlOeyJEw_2JrJskXM';

  if (typeof supabase === 'undefined') {
    console.error('[100Percent] Supabase JS failed to load — check network/CSP.');
    window.sb = null;
    return;
  }

  window.sb = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
  window.__SUPABASE_ENABLED = true;

  // ---------- Shared helpers ----------

  // Redirect to login when there is no session.
  window.requireSession = function (callback) {
    window.sb.auth.getSession().then(function (_ref) {
      var session = _ref.data.session;
      if (!session) {
        window.location.href = 'login.html';
        return;
      }
      callback(session);
    });
  };

  // Load the signed-in user's profile row.
  window.loadProfile = function (userId, callback) {
    window.sb
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(function (_ref) {
        var data = _ref.data;
        callback(data);
      });
  };

  // Answer checking: exact text OR numeric equivalence (fractions/decimals).
  window.answersMatch = function (given, expected) {
    var norm = function (s) {
      return String(s || '').trim().toLowerCase().replace(/\s+/g, '');
    };
    if (norm(given) === norm(expected)) return true;

    var parse = function (s) {
      s = norm(s);
      var frac = s.match(/^(-?\d+)\/(-?\d+)$/);
      if (frac) return parseInt(frac[1], 10) / parseInt(frac[2], 10);
      if (/^-?\d+(\.\d+)?$/.test(s)) return parseFloat(s);
      return null;
    };

    var g = parse(given);
    var e = parse(expected);
    if (g !== null && e !== null) return Math.abs(g - e) < 1e-9;
    return false;
  };
})();
