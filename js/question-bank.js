// ============================================================
// 100Percent — Question Bank Builder
// Teachers: create, edit, and manage their question bank
// ============================================================

/* global sb, gsap, window, document */

(function () {
  'use strict';

  if (typeof sb === 'undefined') return;

  requireSession(function (session) {
    var userId = session.user.id;

    var topicsSelect = document.getElementById('qbTopic');
    var createBtn = document.getElementById('createQuestionBtn');
    var questionsList = document.getElementById('questionsBankList');
    var statQuestionsCreated = document.getElementById('statQuestionsCreated');
    var statPublicQuestions = document.getElementById('statPublicQuestions');
    var statPrivateQuestions = document.getElementById('statPrivateQuestions');

    var allTopics = [];
    var allQuestions = [];

    // ---------- Load topics ----------
    sb.from('topics').select('*').order('code', { ascending: true }).then(function (_ref) {
      allTopics = _ref.data || [];
      allTopics.forEach(function (t) {
        var opt = document.createElement('option');
        opt.value = t.code;
        opt.textContent = t.title;
        topicsSelect.appendChild(opt);
      });
    });

    // ---------- Load questions ----------
    function loadQuestions() {
      sb.from('question_bank')
        .select('*')
        .eq('created_by', userId)
        .order('created_at', { ascending: false })
        .then(function (_ref) {
          var qs = _ref.data || [];
          allQuestions = qs;
          renderQuestions(qs);
          updateStats(qs);
        });
    }

    function renderQuestions(qs) {
      if (!questionsList) return;
      questionsList.innerHTML = '';

      if (!qs.length) {
        questionsList.innerHTML = '<p class="empty-state">No questions created yet. Create your first question above.</p>';
        return;
      }

      qs.forEach(function (q) {
        var card = document.createElement('div');
        card.className = 'question-bank-card';
        card.innerHTML =
          '<div class="qb-card-header">' +
          '  <div class="qb-card-title">' + escapeHtml(q.title || q.expression) + '</div>' +
          '  <div class="qb-card-topic">' + (q.topic_code || '') + '</div>' +
          '</div>' +
          '<div class="qb-card-body">' +
          '  <div class="qb-card-expression">' + escapeHtml(q.expression) + '</div>' +
          '  <div class="qb-card-answer"><strong>Answer:</strong> ' + escapeHtml(q.answer) + '</div>' +
          '  <div class="qb-card-difficulty">Difficulty: ' + q.difficulty + '/5</div>' +
          '</div>' +
          '<div class="qb-card-actions">' +
          '  <button class="btn btn-sm btn-ghost edit-q-btn" data-id="' + q.id + '">Edit</button>' +
          '  <button class="btn btn-sm btn-ghost delete-q-btn" data-id="' + q.id + '">Delete</button>' +
          '</div>';
        questionsList.appendChild(card);
      });

      document.querySelectorAll('.delete-q-btn').forEach(function (btn) {
        btn.addEventListener('click', function () {
          var id = btn.getAttribute('data-id');
          if (confirm('Delete this question?')) {
            sb.from('question_bank').delete().eq('id', id).then(function () {
              loadQuestions();
            });
          }
        });
      });
    }

    function updateStats(qs) {
      if (statQuestionsCreated) statQuestionsCreated.textContent = qs.length;
      if (statPublicQuestions) statPublicQuestions.textContent = qs.filter(function (q) { return q.is_public; }).length;
      if (statPrivateQuestions) statPrivateQuestions.textContent = qs.filter(function (q) { return !q.is_public; }).length;
    }

    // ---------- Create question ----------
    if (createBtn) {
      createBtn.addEventListener('click', function () {
        var topic = document.getElementById('qbTopic').value;
        var expression = document.getElementById('qbExpression').value.trim();
        var prompt = document.getElementById('qbPrompt').value.trim();
        var answer = document.getElementById('qbAnswer').value.trim();
        var hint = document.getElementById('qbHint').value.trim();
        var explanation = document.getElementById('qbExplanation').value.trim();
        var difficulty = parseInt(document.getElementById('qbDifficulty').value) || 1;
        var qType = document.getElementById('qbType').value;
        var isPublic = document.getElementById('qbPublic').checked;

        if (!topic || !expression || !prompt || !answer) {
          alert('Please fill in all required fields');
          return;
        }

        createBtn.textContent = 'Creating...';
        createBtn.disabled = true;

        sb.from('question_bank').insert({
          title: expression,
          expression: expression,
          prompt: prompt,
          answer: answer,
          hint: hint || null,
          explanation: explanation || null,
          difficulty: difficulty,
          question_type: qType,
          topic_code: topic,
          created_by: userId,
          is_public: isPublic
        }).then(function (_ref) {
          var error = _ref.error;
          if (error) {
            alert(error.message || 'Failed to create question');
            createBtn.textContent = 'Create Question';
            createBtn.disabled = false;
            return;
          }
          document.getElementById('qbExpression').value = '';
          document.getElementById('qbPrompt').value = '';
          document.getElementById('qbAnswer').value = '';
          document.getElementById('qbHint').value = '';
          document.getElementById('qbExplanation').value = '';
          createBtn.textContent = 'Create Question';
          createBtn.disabled = false;
          loadQuestions();
        });
      });
    }

    loadQuestions();
  });

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
