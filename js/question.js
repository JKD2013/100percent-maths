// ============================================================
// 100Percent — Question controller (question.html)
// Operate surface: requires session, loads the active task's
// questions from Supabase, renders them one at a time, records
// each attempt (RLS-protected), awards XP on correct answers.
// Supports resuming where the student left off — every answer
// is saved so progress is never lost.
// ============================================================

/* global sb, answersMatch, gsap, window, document */

(function () {
  'use strict';

  var page = document.querySelector('.question-page');
  if (!page || typeof sb === 'undefined' || typeof answersMatch === 'undefined') return;

  requireSession(function (session) {
    var userId = session.user.id;
    var currentIdx = 0;
    var questions = [];
    var task = null;
    var correctCount = 0;
    var totalXP = 0;
    var answeredQuestions = {}; // questionId -> {answer, isCorrect}

    // ---------- DOM ----------
    var topicEl = document.getElementById('questionTopic');
    var textEl = document.getElementById('questionText');
    var exprEl = document.getElementById('questionExpression');
    var inputEl = document.querySelector('.question-answer-input');
    var submitBtn = document.getElementById('submitBtn');
    var navEl = document.querySelector('.question-nav');
    var progressFill = document.getElementById('progressFill');
    var currentEl = document.getElementById('questionCurrent');
    var totalEl = document.getElementById('questionTotal');
    var xpEl = document.getElementById('questionXp');
    var scoreEl = document.getElementById('questionScore');
    var feedbackEl = document.getElementById('questionFeedback');
    var feedbackIcon = document.getElementById('feedbackIcon');
    var feedbackMessage = document.getElementById('feedbackMessage');

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

            // Limit to 5 questions per task as requested
            if (questions.length > 5) {
              questions = questions.slice(0, 5);
            }

            if (totalEl) totalEl.textContent = questions.length;
            if (topicEl) topicEl.textContent = (task.topic_code || '') + ' — ' + (task.title || '');

            // Load existing progress from database
            loadExistingProgress(userId, questions).then(function (existing) {
              answeredQuestions = existing;
              correctCount = Object.values(existing).filter(function (a) { return a.isCorrect; }).length;
              totalXP = correctCount * 10;
              if (xpEl) xpEl.textContent = totalXP;
              if (scoreEl) scoreEl.textContent = 'Score: ' + correctCount + '/' + questions.length;
              render(0);
            });
          });
      });

    // ---------- Load existing progress ----------
    function loadExistingProgress(userId, questions) {
      var questionIds = questions.map(function (q) { return q.id; });
      return sb.from('student_assignment_progress')
        .select('*')
        .eq('student_id', userId)
        .in('question_id', questionIds)
        .then(function (_ref) {
          var progress = _ref.data || [];
          var result = {};
          progress.forEach(function (p) {
            result[p.question_id] = { answer: p.answer, isCorrect: p.is_correct };
          });
          return result;
        });
    }

    // ---------- Render ----------
    function render(idx) {
      if (idx < 0 || idx >= questions.length) return;
      currentIdx = idx;
      var q = questions[idx];

      if (topicEl) topicEl.textContent = (task.topic_code || '') + ' — ' + (task.title || '');
      if (textEl) textEl.textContent = q.prompt || 'Answer the question.';
      if (exprEl) exprEl.textContent = q.expression;

      // Update progress
      var pct = ((currentIdx + 1) / questions.length) * 100;
      if (progressFill) {
        progressFill.style.width = pct + '%';
      }
      if (currentEl) currentEl.textContent = currentIdx + 1;
      if (scoreEl) scoreEl.textContent = 'Score: ' + correctCount + '/' + questions.length;

      // nav buttons
      if (navEl) {
        navEl.innerHTML = '';
        questions.forEach(function (_q, i) {
          var btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'q-button';
          btn.textContent = (i + 1).toString();

          if (i === currentIdx) btn.classList.add('current');
          else if (answeredQuestions[_q.id]) btn.classList.add('answered');

          btn.addEventListener('click', function () { render(i); });
          navEl.appendChild(btn);
        });
      }

      // Load existing answer if any
      var existing = answeredQuestions[q.id];
      if (existing) {
        inputEl.value = existing.answer;
        inputEl.style.borderColor = existing.isCorrect ? '#10b981' : '#ef4444';
        submitBtn.textContent = existing.isCorrect ? 'Correct!' : 'Try again';
        submitBtn.disabled = true;
        submitBtn.classList.toggle('correct', existing.isCorrect);
        submitBtn.classList.toggle('incorrect', !existing.isCorrect);
      } else {
        inputEl.value = '';
        inputEl.focus();
        inputEl.style.borderColor = '';
        submitBtn.textContent = 'Submit Answer';
        submitBtn.disabled = false;
        submitBtn.classList.remove('correct', 'incorrect');
      }

      // Hide feedback overlay
      if (feedbackEl) {
        feedbackEl.classList.remove('show', 'correct', 'incorrect');
      }
    }

    // ---------- Feedback overlay ----------
    function showFeedback(correct, message) {
      if (!feedbackEl) return;
      feedbackEl.className = 'question-feedback show ' + (correct ? 'correct' : 'incorrect');
      feedbackIcon.textContent = correct ? '✓' : '✗';
      feedbackMessage.textContent = message;

      if (typeof gsap !== 'undefined') {
        gsap.fromTo(feedbackEl,
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' }
        );
      }
    }

    function hideFeedback() {
      if (!feedbackEl) return;
      feedbackEl.classList.remove('show');
    }

    // ---------- Submit ----------
    submitBtn.addEventListener('click', function () {
      var given = (inputEl.value || '').trim();
      if (!given) {
        inputEl.style.borderColor = '#ef4444';
        inputEl.focus();
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(inputEl, { x: -10 }, { x: 10, duration: 0.06, repeat: 3, yoyo: true, ease: 'power2', clearProps: 'x' });
        }
        return;
      }

      var q = questions[currentIdx];
      var correct = answersMatch(given, q.answer);

      submitBtn.textContent = correct ? 'Correct!' : 'Try again';
      submitBtn.disabled = true;
      inputEl.style.borderColor = correct ? '#10b981' : '#ef4444';
      submitBtn.classList.toggle('correct', correct);
      submitBtn.classList.toggle('incorrect', !correct);

      showFeedback(correct, correct ? 'Correct! Well done.' : 'Not quite. Try again.');

      if (correct && (!answeredQuestions[q.id] || !answeredQuestions[q.id].isCorrect)) {
        correctCount++;
        totalXP += 10;
        if (xpEl) xpEl.textContent = totalXP;
        if (scoreEl) scoreEl.textContent = 'Score: ' + correctCount + '/' + questions.length;
      }

      // Mark as answered
      answeredQuestions[q.id] = { answer: given, isCorrect: correct };

      // Save attempt to database
      sb.from('student_assignment_progress').upsert({
        assignment_id: null,
        student_id: userId,
        question_id: q.id,
        answer: given,
        is_correct: correct
      }, { onConflict: 'assignment_id,student_id,question_id' }).then(function () {
        // Also save to attempts table
        sb.from('attempts').insert({
          user_id: userId,
          question_id: q.id,
          answer: given,
          is_correct: correct
        }).then(function () {
          // Award XP on correct answers (only if newly correct)
          if (correct && answeredQuestions[q.id].isCorrect) {
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
      });

      // Auto-advance after feedback
      setTimeout(function () {
        hideFeedback();
        if (currentIdx + 1 < questions.length) {
          render(currentIdx + 1);
        } else {
          // Task complete
          textEl.textContent = 'Task complete — great work!';
          exprEl.style.display = 'none';
          inputEl.style.display = 'none';
          submitBtn.style.display = 'none';
          feedbackEl.style.display = 'none';

          if (typeof gsap !== 'undefined') {
            gsap.to(textEl, { scale: 1.1, duration: 0.3, yoyo: true, repeat: 1 });
          }

          var banner = document.createElement('div');
          banner.className = 'completion-banner';
          banner.innerHTML =
            '<div class="completion-icon">🎉</div>' +
            '<div class="completion-text">' +
            '<div class="completion-title">Task Complete!</div>' +
            '<div class="completion-stats">' +
            '<span>' + correctCount + '/' + questions.length + ' correct</span>' +
            '<span>+' + totalXP + ' XP</span>' +
            '</div>' +
            '</div>';
          document.querySelector('.question-card').appendChild(banner);

          gsap.fromTo(banner, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 });
        }
      }, correct ? 1200 : 1800);
    });

    inputEl.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') submitBtn.click();
    });
  });
})();
