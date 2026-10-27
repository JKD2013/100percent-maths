// ============================================================
// 100Percent — Teacher Dashboard controller
// Teachers: create groups, view groups, create assignments,
// view student progress per assignment.
// ============================================================

/* global sb, gsap, window, document */

(function () {
  'use strict';

  if (typeof sb === 'undefined') return;

  requireSession(function (session) {
    var userId = session.user.id;

    // ---------- DOM ----------
    var groupsList = document.getElementById('groupsList');
    var statGroups = document.getElementById('statGroups');
    var statStudents = document.getElementById('statStudents');
    var statAssignments = document.getElementById('statAssignments');
    var createGroupBtn = document.querySelector('.create-group-btn');
    var newGroupName = document.getElementById('newGroupName');

    // ---------- Load teacher data ----------
    loadTeacherData(userId);

    // ---------- Create Group ----------
    if (createGroupBtn) {
      createGroupBtn.addEventListener('click', function () {
        var name = (newGroupName.value || '').trim();
        if (!name) {
          alert('Enter a group name');
          return;
        }
        sb.from('groups').insert({ name: name, teacher_id: userId }).then(function (_ref) {
          var error = _ref.error;
          if (error) { alert(error.message || 'Failed to create group'); return; }
          newGroupName.value = '';
          loadTeacherData(userId);
        });
      });
    }

    function loadTeacherData(uid) {
      // Load groups
      sb.from('groups').select('*').eq('teacher_id', uid).order('created_at', { ascending: false }).then(function (_ref) {
        var groups = _ref.data || [];
        if (statGroups) statGroups.textContent = groups.length;
        renderGroups(groups);

        // Count total students across groups
        var totalStudents = 0;
        var totalAssignments = 0;
        groups.forEach(function (g) {
          sb.from('group_members').select('student_id').eq('group_id', g.id).then(function (_ref2) {
            totalStudents += (_ref2.data || []).length;
            if (statStudents) statStudents.textContent = totalStudents;
          });
          sb.from('assignments').select('id').eq('group_id', g.id).then(function (_ref3) {
            totalAssignments += (_ref3.data || []).length;
            if (statAssignments) statAssignments.textContent = totalAssignments;
          });
        });
      });
    }

    function renderGroups(groups) {
      if (!groupsList) return;
      groupsList.innerHTML = '';

      groups.forEach(function (group) {
        var card = document.createElement('div');
        card.className = 'group-card';
        card.innerHTML =
          '<div class=\"group-card-header\">' +
          '  <div class=\"group-name\">' + escapeHtml(group.name) + '</div>' +
          '  <div class=\"group-code\">Code: ' + escapeHtml(group.join_code) + '</div>' +
          '  <div class=\"group-member-count\" id=\"memberCount-' + group.id + '\">0 students</div>' +
          '</div>' +
          '<div class=\"group-actions\">' +
          '  <button class=\"btn btn-sm btn-primary view-group-btn\" data-group-id=\"' + group.id + '\" data-group-name=\"' + escapeHtml(group.name) + '\">View Group</button>' +
          '  <button class=\"btn btn-sm btn-ghost create-assignment-btn\" data-group-id=\"' + group.id + '\">Set Homework</button>' +
          '</div>';
        groupsList.appendChild(card);

        // Load member count
        sb.from('group_members').select('student_id').eq('group_id', group.id).then(function (_ref) {
          var count = (_ref.data || []).length;
          var el = document.getElementById('memberCount-' + group.id);
          if (el) el.textContent = count + ' student' + (count !== 1 ? 's' : '');
        });
      });

      // Wire up buttons
      document.querySelectorAll('.view-group-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var gid = btn.getAttribute('data-group-id');
          var gname = btn.getAttribute('data-group-name');
          window.location.href = 'group-detail.html?group=' + encodeURIComponent(gid) + '&name=' + encodeURIComponent(gname);
        });
      });

      document.querySelectorAll('.create-assignment-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var gid = btn.getAttribute('data-group-id');
          window.location.href = 'create-assignment.html?group=' + encodeURIComponent(gid);
        });
      });
    }
  });

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
