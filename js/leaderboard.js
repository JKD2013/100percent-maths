// ============================================================
// 100Percent — Leaderboard Controller
// Weekly XP leaderboards with badges
// ============================================================

/* global sb, gsap, window, document */

(function () {
  'use strict';

  if (typeof sb === 'undefined') return;

  requireSession(function (session) {
    var userId = session.user.id;

    var statRank = document.getElementById('statRank');
    var statLeague = document.getElementById('statLeague');
    var statWeekXP = document.getElementById('statWeekXP');
    var leaderboardBody = document.getElementById('leaderboardBody');
    var badgesList = document.getElementById('badgesList');

    var userXP = 0;
    var userBadges = [];

    // ---------- Load user progression ----------
    sb.from('user_progression')
      .select('total_xp, level, trophies, badges')
      .eq('user_id', userId)
      .single()
      .then(function (_ref) {
        var prof = _ref.data || { total_xp: 0, level: 1, trophies: 0, badges: [] };
        userXP = prof.total_xp || 0;
        userBadges = prof.badges || [];
      });

    // ---------- Load leaderboard ----------
    sb.from('user_progression')
      .select('user_id, total_xp, level')
      .order('total_xp', { ascending: false })
      .limit(50)
      .then(function (_ref) {
        var rows = _ref.data || [];
        renderLeaderboard(rows);
      });

    // ---------- Load badges ----------
    sb.from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)
      .then(function (_ref) {
        var ub = _ref.data || [];
        var badgeIds = ub.map(function (b) { return b.badge_id; });

        sb.from('badges').select('*').then(function (_ref2) {
          var allBadges = _ref2.data || [];
          renderBadges(allBadges, badgeIds);
        });
      });

    // ---------- Render leaderboard ----------
    function renderLeaderboard(rows) {
      if (!leaderboardBody) return;
      leaderboardBody.innerHTML = '';

      var userRank = 0;
      rows.forEach(function (row, i) {
        var rowEl = document.createElement('tr');
        var isMe = row.user_id === userId;
        var rank = i + 1;
        if (isMe) userRank = rank;

        var badgeClass = '';
        if (rank === 1) badgeClass = 'rank-1';
        else if (rank === 2) badgeClass = 'rank-2';
        else if (rank === 3) badgeClass = 'rank-3';

        card = document.createElement('tr');
        card.className = 'leaderboard-row ' + (isMe ? 'highlight' : '');
        card.innerHTML =
          '<td>' +
          '  <span class="rank-badge rank-' + rank + '">' + rank + '</span>' +
          '</td>' +
          '<td>' +
          '  <div class="student-row">' +
          '    <div class="student-avatar-small">' + (row.user_id.substring(0, 1).toUpperCase()) + '</div>' +
          '    <div class="student-info">' +
          '      <div class="student-name">' + (row.user_id.substring(0, 8)) + '</div>' +
          '      <div class="student-school">Level ' + (row.level || 1) + '</div>' +
          '    </div>' +
          '  </div>' +
          '</td>' +
          '<td>' + row.total_xp + '</td>' +
          '<td>' + countQuestionsForUser(row.user_id) + '</td>' +
          '</td>';
        leaderboardBody.appendChild(card);
      });

      if (statRank) statRank.textContent = userRank > 0 ? '#' + userRank : '-';
    }

    function countQuestionsForUser(userId) {
      return 0; // Would query attempts table
    }

    // ---------- Render badges ----------
    function renderBadges(allBadges, earnedBadgeIds) {
      if (!badgesList) return;
      badgesList.innerHTML = '';

      allBadges.forEach(function (badge) {
        var earned = earnedBadgeIds.includes(badge.id);
        var card = document.createElement('div');
        card.className = 'badge-card ' + (earned ? 'earned' : 'badge-locked');
        card.innerHTML =
          '<div class="badge-icon">' + (badge.icon || '🏅') + '</div>' +
          '<div class="badge-name">' + escapeHtml(badge.name) + '</div>' +
          '<div class="badge-description">' + escapeHtml(badge.description) + '</div>' +
          '<div class="badge-criteria">' + badge.criteria_value + ' required</div>';
        badgesList.appendChild(card);
      });
    }

    function escapeHtml(text) {
      var div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    }
  });
})();
