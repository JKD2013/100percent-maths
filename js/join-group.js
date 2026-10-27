// ============================================================
// 100Percent — Join Group controller (dashboard.html)
// Students: join a group using a 6-digit join code
// ============================================================

/* global sb, window, document */

(function () {
  'use strict';

  if (typeof sb === 'undefined') return;

  requireSession(function (session) {
    var userId = session.user.id;

    var joinGroupBtn = document.getElementById('joinGroupBtn');
    var joinGroupCode = document.getElementById('joinGroupCode');

    if (!joinGroupBtn || !joinGroupCode) return;

    joinGroupBtn.addEventListener('click', function () {
      var code = (joinGroupCode.value || '').trim().toUpperCase();
      if (!code) {
        alert('Enter a group code');
        return;
      }
      if (code.length !== 6) {
        alert('Group code must be 6 characters');
        return;
      }

      joinGroupBtn.textContent = 'Joining…';
      joinGroupBtn.disabled = true;

      // Find the group by join_code
      sb.from('groups').select('*').eq('join_code', code).limit(1).then(function (_ref) {
        var error = _ref.error;
        var groups = _ref.data || [];

        if (error) {
          alert(error.message || 'Failed to join group');
          joinGroupBtn.textContent = 'Join Group';
          joinGroupBtn.disabled = false;
          return;
        }

        if (!groups.length) {
          alert('Invalid group code');
          joinGroupBtn.textContent = 'Join Group';
          joinGroupBtn.disabled = false;
          return;
        }

        var group = groups[0];

        // Check if already a member
        sb.from('group_members').select('*').eq('group_id', group.id).eq('student_id', userId).then(function (_ref2) {
          var members = _ref2.data || [];
          if (members.length) {
            alert('You are already a member of this group');
            joinGroupBtn.textContent = 'Join Group';
            joinGroupBtn.disabled = false;
            return;
          }

          // Add student to group
          sb.from('group_members').insert({
            group_id: group.id,
            student_id: userId
          }).then(function (_ref3) {
            var err2 = _ref3.error;
            if (err2) {
              alert(err2.message || 'Failed to join group');
              joinGroupBtn.textContent = 'Join Group';
              joinGroupBtn.disabled = false;
              return;
            }

            alert('Joined group: ' + group.name);
            joinGroupCode.value = '';
            joinGroupBtn.textContent = 'Join Group';
            joinGroupBtn.disabled = false;

            // Reload the page to reflect changes
            window.location.reload();
          });
        });
      });
    });

    // Auto-uppercase as user types
    joinGroupCode.addEventListener('input', function () {
      joinGroupCode.value = joinGroupCode.value.toUpperCase();
    });
  });
})();
