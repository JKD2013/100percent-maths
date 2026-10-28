// ============================================================
// 100Percent — Ultra Question Engine
// Adaptive difficulty, spaced repetition, streak tracking,
// multi-format questions, full progress persistence.
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
    var answeredQuestions = {};
    var sessionStart = Date.now();

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
    var streakEl = document.getElementById('questionStreak');
    var feedbackEl = document.getElementById('questionFeedback');
    var feedbackIcon = document.getElementById('feedbackIcon');
    var feedbackMessage = document.getElementById('feedbackMessage');
    var explanationEl = document.getElementById('questionExplanation');

    if (!exprEl || !inputEl || !submitBtn) return;

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
            if (questions.length > 5) questions = questions.slice(0, 5);

            if (totalEl) totalEl.textContent = questions.length;
            if (topicEl) topicEl.textContent = (task.topic_code || '') + ' — ' + (task.title || '');

            loadExistingProgress(userId, questions).then(function (existing) {
              answeredQuestions = existing;
              correctCount = Object.values(existing).filter(function (a) { return a.isCorrect; }).length;
              totalXP = correctCount * 10;
              if (xpEl) xpEl.textContent = totalXP;
              if (scoreEl) scoreEl.textContent = 'Score: ' + correctCount + '/' + questions.length;
              loadStreak(userId).then(function (s) {
                currentStreak = s || 0;
                if (streakEl) streakEl.textContent = newStreak + ' day streak 🔥';
              });
              render(0);
            });
          });
      });

    function loadExistingProgress(uId, qs) {
      var qIds = qs.map(function (q) { return q.id; });
      return sb.from('student_assignment_progress')
        .select('*')
        .eq('student_id', uId)
        .in('question_id', qIds)
        .then(function (_ref) {
          var progress = _ref.data || [];
          var result = {};
          progress.forEach(function (p) {
            result[p.question_id] = { answer: p.answer, isCorrect: p.is_correct, timeTaken: p.time_taken };
          });
          return result;
        });
    }

    function loadStreak(uId) {
      return sb.from('user_streaks')
        .select('current_streak')
        .eq('user_id', uId)
        .single()
        .then(function (_ref) {
          return (_ref.data && _ref.data.current_streak) || 0;
        }).catch(function () { return 0; });
    }

    function render(idx) {
      if (idx < 0 || idx >= questions.length) return;
      currentIdx = idx;
      var q = questions[idx];

      if (topicEl) topicEl.textContent = (task.topic_code || '') + ' — ' + (task.title || '');
      if (textEl) textEl.textContent = q.prompt || 'Answer the question.';
      if (exprEl) exprEl.textContent = q.expression;

      var pct = ((currentIdx + 1) / questions.length) * 100;
      if (progressFill) progressFill.style.width = pct + '%';
      if (currentEl) currentEl.textContent = currentIdx + 1;
      if (scoreEl) scoreEl.textContent = 'Score: ' + correctCount + '/' + questions.length;

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

      var existing = answeredQuestions[q.id];
      if (existing) {
        inputEl.value = existing.answer;
        inputEl.style.borderColor = existing.isCorrect ? '#10b981' : '#ef4444';
        submitBtn.textContent = existing.isCorrect ? 'Correct!' : 'Try again';
        submitBtn.disabled = true;
        submitBtn.classList.toggle('correct', existing.isCorrect);
        submitBtn.classList.toggle('incorrect', !existing.isCorrect);
        showExistingExplanation(q, existing);
      } else {
        inputEl.value = '';
        inputEl.focus();
        inputEl.style.borderColor = '';
        submitBtn.textContent = 'Submit Answer';
        submitBtn.disabled = false;
        submitBtn.classList.remove('correct', 'incorrect');
        if (explanationEl) explanationEl.style.display = 'none';
      }

      if (feedbackEl) feedbackEl.classList.remove('show', 'correct', 'incorrect');
    }

    function showExistingExplanation(q, existing) {
      if (!explanationEl) return;
      if (q.explanation) {
        explanationEl.innerHTML = '<strong>Explanation:</strong> ' + q.explanation;
        explanationEl.style.display = 'block';
        explanationEl.style.color = existing.isCorrect ? '#10b981' : '#ef4444';
      } else {
        explanationEl.style.display = 'none';
      }
    }

    function showFeedback(correct, message) {
      if (!feedbackEl) return;
      feedbackEl.className = 'question-feedback show ' + (correct ? 'correct' : 'incorrect');
      feedbackIcon.textContent = correct ? '✓' : '✗';
      feedbackMessage.textContent = message;
      if (typeof gsap !== 'undefined') {
        gsap.fromTo(feedbackEl, { scale: 0.8, opacity: 0 }, { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(1.7)' });
      }
    }

    function hideFeedback() {
      if (!feedbackEl) return;
      feedbackEl.classList.remove('show');
    }

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

      var isNewCorrect = correct && (!answeredQuestions[q.id] || !answeredQuestions[q.id].isCorrect);
      if (isNewCorrect) {
        correctCount++;
        totalXP += 10;
        if (xpEl) xpEl.textContent = totalXP;
        if (scoreEl) scoreEl.textContent = 'Score: ' + correctCount + '/' + questions.length;
      }

      answeredQuestions[q.id] = { answer: given, isCorrect: correct, timeTaken: Math.round((Date.now() - sessionStart) / 1000) };

      saveAttempt(userId, q.id, given, correct).then(function () {
        if (correct && isNewCorrect) {
          awardXP(userId, 10).then(function () {
            updateStreak(userId).then(function (newStreak) {
              currentStreak = newStreak;
              if (streakEl) streakEl.textContent = newStreak + ' day streak 🔥';
              checkBadges(userId, correctCount, totalXP);
            });
          });
        } else {
          updateStreak(userId).then(function (newStreak) {
            currentStreak = newStreak;
            if (streakEl) streakEl.textContent = newStreak + ' day streak 🔥';
          });
          checkBadges(userId, correctCount, totalXP);
        }
      });

      setTimeout(function () {
        hideFeedback();
        if (currentIdx + 1 < questions.length) {
          render(currentIdx + 1);
        } else {
          showCompletion();
        }
      }, correct ? 1200 : 1800);
    });

    inputEl.addEventListener('keypress', function (e) {
      if (e.key === 'Enter') submitBtn.click();
    });

    function saveAttempt(uId, qId, answer, isCorrect) {
      return sb.from('student_assignment_progress').upsert({
        assignment_id: null,
        student_id: uId,
        question_id: qId,
        answer: answer,
        is_correct: isCorrect
      }, { onConflict: 'assignment_id,student_id,question_id' }).then(function () {
        return sb.from('attempts').insert({
          user_id: uId,
          question_id: qId,
          answer: answer,
          is_correct: isCorrect,
          attempted_at: new Date().toISOString()
        });
      });
    }

    function awardXP(uId, xpAmount) {
      return sb.from('user_progression')
        .select('total_xp, level')
        .eq('user_id', uId)
        .single()
        .then(function (_ref) {
          var prof = _ref.data || { total_xp: 0, level: 1 };
          var newXp = (prof.total_xp || 0) + xpAmount;
          var newLevel = Math.floor(newXp / 100) + 1;
          return sb.from('user_progression').upsert({
            user_id: uId,
            total_xp: newXp,
            level: newLevel
          }, { onConflict: 'user_id' }).then(function () {
            return newXp;
          });
        });
    }

    function updateStreak(uId) {
      return sb.from('user_streaks')
        .select('current_streak, last_practiced_date')
        .eq('user_id', uId)
        .single()
        .then(function (_ref) {
          var data = _ref.data || { current_streak: 0, last_practiced_date: null };
          var today = new Date().toISOString().split('T')[0];
          var newStreak = data.current_streak || 0;

          if (data.last_practiced_date === today) {
            return newStreak;
          }

          var yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);
          yesterday = yesterday.toISOString().split('T')[0];

          if (data.last_practiced_date === yesterday) {
            newStreak += 1;
          } else {
            newStreak = 1;
          }

          return sb.from('user_streaks').upsert({
            user_id: uId,
            current_streak: newStreak,
            last_practiced_date: today
          }, { onConflict: 'user_id' }).then(function () {
            return newStreak;
          });
        });
    }

    function showCompletion() {
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
  });
})();


// ---------- Badge checking ----------
function checkBadges(uId, correctCount, totalXP) {
  sb.from('badges').select('*').then(function (_ref) {
    var allBadges = _ref.data || [];
    sb.from('user_badges').select('badge_id').eq('user_id', uId).then(function (_ref2) {
      var earned = (_ref2.data || []).map(function (b) { return b.badge_id; });
      var newBadges = [];

      allBadges.forEach(function (badge) {
        if (earned.includes(badge.id)) return;

        var shouldEarn = false;
        if (badge.criteria_type === 'questions' && correctCount >= badge.criteria_value) shouldEarn = true;
        if (badge.criteria_type === 'xp' && totalXP >= badge.criteria_value) shouldEarn = true;
        if (badge.criteria_type === 'streak' && currentStreak >= badge.criteria_value) shouldEarn = true;
        if (badge.criteria_type === 'perfect' && correctCount >= badge.criteria_value) shouldEarn = true;

        if (shouldEarn) {
          newBadges.push(badge.id);
          sb.from('user_badges').insert({ user_id: uId, badge_id: badge.id }).then(function () {
            // Show badge earned notification
            if (typeof gsap !== 'undefined') {
              gsap.fromTo(document.createElement('div'), { opacity: 0 }, { opacity: 1 });
            }
            alert('🏆 Badge earned: ' + badge.name + ' - ' + badge.description);
          });
        }
      });
    });
  });
}

