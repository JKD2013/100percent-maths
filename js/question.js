// ============================================================
// 100Percent — Question controller (question.html)
// Operate surface: requires session, loads the active task's
// questions from Supabase, renders them one at a time, records
// each attempt (RLS-protected), and awards XP on correct answers.
// ============================================================

/* global sb, answersMatch, window */

(function () {
  'use strict';

  var page = document.querySelector('.question-page');
  if (!page || typeof sb === 'undefined' || typeof answersMatch === 'undefined') return;

  requireSession(function (session) {
    var userId = session.user.id;
    var currentIdx = 0;
    var questions = [];
    var task = null;

    // ---------- DOM ----------
    var topicEl = document.querySelector('.question-topic');
    var textEl = document.querySelector('.question-text');
    var exprEl = document.querySelector('.question-expression');
    var inputEl = document.querySelector('.question-answer-input');
    var submitBtn = document.querySelector('.submit-answer-btn');
    var navEl = document.querySelector('.question-nav');

    if (!exprEl || !inputEl || !submitBtn) return;

    // ---------- Load active task ----------
    sb.from('tasks')
      .select('*')
      .eq('status', 'active')
      .order('created_at', { ascending: false })
      .limit(1)
      .then(function (_ref) {
        var tasks = _ref.data || [];
        if (!tasks.length) {
          textEl.textContent = 'No active task assigned.';
          submitBtn.style.display = 'none';
          return;
        }
        task = tasks[0];

        sb.from('questions')
          .select('*')
          .eq('task_id', task.id)
          .order('position', { ascending: true })
          .then(function (_ref2) {
            questions = _ref2.data || [];
            if (!questions.length) {
              textEl.textContent = 'This task has no questions yet.';
              submitBtn.style.display = 'none';
              return;
            }
            if (topicEl) topicEl.textContent = (task.topic_code || '') + ' — ' + (task.title || '');
            render(0);

            // Defensive fallback: guarantee the topic label shows even if the
            // task object arrived late (Supabase schema-cache quirk).
            setTimeout(function () {
              if (topicEl && !topicEl.textContent.trim() && task && task.topic_code) {
                topicEl.textContent = task.topic_code + ' — ' + (task.title || '');
              }
            }, 500);
          });
      });

    // ---------- Render ----------
    function render(idx) {
      if (idx < 0 || idx >= questions.length) return;
      currentIdx = idx;
      var q = questions[idx];

      if (topicEl) topicEl.textContent = (task.topic_code || '') + ' — ' + (task.title || '');
      if (textEl) textEl.textContent = q.prompt || 'Answer the question.';
      if (exprEl) exprEl.textContent = q.expression;

      // nav buttons
      if (navEl) {
        navEl.innerHTML = '';
        questions.forEach(function (_q, i) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'q-button';
          btn.textContent = (i + 1).toString();
          if (i === currentIdx) btn.classList.add('current');
          btn.addEventListener('click', function () { render(i); });
          navEl.appendChild(btn);
        });
      }

      inputEl.value = '';
      inputEl.focus();
      inputEl.style.borderColor = '';
      submitBtn.textContent = 'Submit Answer';
      submitBtn.disabled = false;
      submitBtn.classList.remove('correct');
    }

    // ---------- Submit ----------
    submitBtn.addEventListener('click', function () {
      var given = (inputEl.value || '').trim();
      if (!given) {
        inputEl.style.borderColor = '#ef4444';
        inputEl.focus();
        return;
      }

      var q = questions[currentIdx];
      var correct = answersMatch(given, q.answer);

      submitBtn.textContent = correct ? 'Correct!' : 'Try again';
      submitBtn.disabled = true;
      inputEl.style.borderColor = correct ? '#10b981' : '#ef4444';
      submitBtn.classList.toggle('correct', correct);

      // Record attempt
      sb.from('attempts').insert({
        user_id: userId,
        question_id: q.id,
        answer: given,
        is_correct: correct
      }).then(function () {
        // Award XP + streak on correct answers (profile updated directly)
        if (correct) {
          sb.from('profiles')
            .select('xp, streak, trophies')
            .eq('id', userId)
            .single()
            .then(function (_ref3) {
              var prof = _ref3.data || {};
              var newXp = (prof.xp || 0) + 10;
              var newTrophies = (prof.trophies || 0) + (newXp % 50 === 0 ? 1 : 0);
              sb.from('profiles')
                .update({ xp: newXp, trophies: newTrophies })
                .eq('id', userId);
            });
        }
      });

      // Auto-advance after a beat
      setTimeout(function () {
        if (currentIdx + 1 < questions.length) {
          render(currentIdx + 1);
        } else {
          textEl.textContent = 'Task complete — great work.';
          exprEl.style.display = 'none';
          inputEl.style.display = 'none';
          submitBtn.style.display = 'none';
          submitBtn.textContent = 'Finished';
        }
      }, correct ? 900 : 1500);
    });

    inputEl.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') submitBtn.click();
    });
  });
})();
