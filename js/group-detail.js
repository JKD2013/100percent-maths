// ============================================================
// 100Percent — Group Detail controller
// Teachers: view students in a group and their assignments
// ============================================================

/* global sb, gsap, window, document, URLSearchParams */

(function () {
  'use strict';

  if (typeof sb === 'undefined') return;

  var params = new URLSearchParams(window.location.search);
  var groupId = params.get('group');
  var groupName = params.get('name');

  if (!groupId) {
    window.location.href = 'teacher-dashboard.html';
    return;
  }

  var studentsList = document.getElementById('studentsList');
  var assignmentsList = document.getElementById('assignmentsList');
  var studentCountEl = document.getElementById('groupStudentCount');
  var assignmentCountEl = document.getElementById('groupAssignmentCount');

  // Load group members
  sb.from('group_members')
    .select('student_id, joined_at')
    .eq('group_id', groupId)
    .then(function (_ref) {
      var members = _ref.data || [];
      if (studentCountEl) studentCountEl.textContent = members.length;

      if (!members.length) {
        studentsList.innerHTML = '<p class="empty-state">No students in this group yet.</p>';
        return;
      }

      // Load student profiles
      var studentIds = members.map(function (m) { return m.student_id; });
      sb.from('profiles').select('id, full_name, email, role').in('id', studentIds).then(function (_ref2) {
        var students = _ref2.data || [];
        studentsList.innerHTML = '';
        students.forEach(function (s) {
          var card = document.createElement('div');
          card.className = 'student-card';
          card.innerHTML =
            '<div class="student-info">' +
            '  <div class="student-avatar">' + (s.full_name ? s.full_name.charAt(0).toUpperCase() : '?') + '</div>' +
            '  <div>' +
            '    <div class="student-name">' + escapeHtml(s.full_name || 'Unknown') + '</div>' +
            '    <div class="student-email">' + escapeHtml(s.email || '') + '</div>' +
            '  </div>' +
            '</div>' +
            '<div class="student-actions">' +
            '  <button class="btn btn-sm btn-ghost view-student-btn" data-student-id="' + s.id + '">View Progress</button>' +
            '</div>';
          studentsList.appendChild(card);
        });
      });
    });

  // Load assignments
  sb.from('assignments').select('*').eq('group_id', groupId).order('created_at', { ascending: false }).then(function (_ref) {
    var assignments = _ref.data || [];
    if (assignmentCountEl) assignmentCountEl.textContent = assignments.length;

    if (!assignments.length) {
      assignmentsList.innerHTML = '<p class="empty-state">No assignments yet. Create one to get started.</p>';
      return;
    }

    assignmentsList.innerHTML = '';
    assignments.forEach(function (a) {
      var card = document.createElement('div');
      card.className = 'assignment-card';
      card.innerHTML =
        '<div class="assignment-info">' +
        '  <div class="assignment-title">' + escapeHtml(a.title) + '</div>' +
        '  <div class="assignment-meta">' +
        '    <span>' + (a.due_date ? new Date(a.due_date).toLocaleDateString() : 'No due date') + '</span>' +
        '    <span class="assignment-status">' + a.status + '</span>' +
        '  </div>' +
        '</div>' +
        '<div class="assignment-actions">' +
        '  <button class="btn btn-sm btn-primary view-assignment-btn" data-assignment-id="' + a.id + '" data-assignment-title="' + escapeHtml(a.title) + '">View Progress</button>' +
        '</div>';
      assignmentsList.appendChild(card);
    });

    document.querySelectorAll('.view-assignment-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var aid = btn.getAttribute('data-assignment-id');
        var atitle = btn.getAttribute('data-assignment-title');
        window.location.href = 'assignment-progress.html?assignment=' + encodeURIComponent(aid) + '&title=' + encodeURIComponent(atitle);
      });
    });
  });

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
