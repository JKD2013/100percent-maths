// ============================================================
// 100Percent — Create Assignment controller
// Teachers: create assignments and select questions for a group
// ============================================================

/* global sb, gsap, window, document, URLSearchParams */

(function () {
  'use strict';

  if (typeof sb === 'undefined') return;

  var params = new URLSearchParams(window.location.search);
  var groupId = params.get('group');

  if (!groupId) {
    window.location.href = 'teacher-dashboard.html';
    return;
  }

  var questionsList = document.getElementById('questionsList');
  var createBtn = document.getElementById('createAssignmentBtn');
  var titleInput = document.getElementById('assignmentTitle');
  var dueDateInput = document.getElementById('assignmentDueDate');
  var questionCountEl = document.getElementById('questionCount');

  var allQuestions = [];
  var selectedQuestionIds = new Set();

  // Load all questions
  sb.from('questions').select('*').order('code', { ascending: true }).then(function (_ref) {
    allQuestions = _ref.data || [];
    if (questionCountEl) questionCountEl.textContent = allQuestions.length;
    renderQuestions();
  });

  function renderQuestions() {
    if (!questionsList) return;
    questionsList.innerHTML = '';

    allQuestions.forEach(function (q) {
      var isSelected = selectedQuestionIds.has(q.id);
      var card = document.createElement('div');
      card.className = 'question-select-card ' + (isSelected ? 'selected' : '');
      card.innerHTML =
        '<div class="question-select-header">' +
        '  <span class="question-code">' + (q.expression || q.id.substring(0, 8)) + '</span>' +
        '  <input type="checkbox" class="question-checkbox" data-qid="' + q.id + '" ' + (isSelected ? 'checked' : '') + ' />' +
        '</div>' +
        '<div class="question-select-body">' +
        '  <div class="question-prompt">' + escapeHtml(q.prompt || 'Answer the question') + '</div>' +
        '  <div class="question-answer">' + escapeHtml(q.answer) + '</div>' +
        '</div>';
      card.addEventListener('click', function (e) {
        if (e.target.tagName === 'INPUT') return;
        var checkbox = card.querySelector('.question-checkbox');
        checkbox.checked = !checkbox.checked;
        toggleQuestion(q.id, checkbox.checked);
      });
      card.querySelector('.question-checkbox').addEventListener('change', function (e) {
        toggleQuestion(q.id, e.target.checked);
      });
      questionsList.appendChild(card);
    });
  }

  function toggleQuestion(qid, checked) {
    if (checked) selectedQuestionIds.add(qid);
    else selectedQuestionIds.delete(qid);
    renderQuestions();
  }

  if (createBtn) {
    createBtn.addEventListener('click', function () {
      var title = (titleInput.value || '').trim();
      var dueDate = dueDateInput.value || null;

      if (!title) {
        alert('Enter an assignment title');
        return;
      }
      if (!selectedQuestionIds.size) {
        alert('Select at least one question');
        return;
      }

      sb.from('assignments').insert({
        title: title,
        teacher_id: sb.auth.getSession().then(function (_ref) {
          return _ref.data.session.user.id;
        }),
        group_id: groupId,
        due_date: dueDate,
        status: 'active'
      }).then(function (_ref) {
        var error = _ref.error;
        if (error) { alert(error.message || 'Failed to create assignment'); return; }

        var assignmentId = _ref.data[0].id;

        // Insert assignment questions
        var aqInserts = Array.from(selectedQuestionIds).map(function (qid, idx) {
          return { assignment_id: assignmentId, question_id: qid, position: idx + 1 };
        });

        sb.from('assignment_questions').insert(aqInserts).then(function (_ref2) {
          var err2 = _ref2.error;
          if (err2) { alert(err2.message || 'Failed to add questions'); return; }
          window.location.href = 'group-detail.html?group=' + encodeURIComponent(groupId);
        });
      });
    });
  }

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
