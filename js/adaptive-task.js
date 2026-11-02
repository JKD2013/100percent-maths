// ============================================================
// 100Percent — Adaptive Task Engine (KS3)
// Uses teacher-created questions from Supabase question_bank.
// Adapts difficulty based on student performance, age, curriculum.
// ============================================================

/* global sb, answersMatch, gsap, window, document */

(function () {
  'use strict';

  // ============================================================
  // PART 1 — Topic selector (runs on task.html)
  // Loads topics from Supabase topics table.
  // ============================================================
  var topicSelector = document.getElementById('topicSelector');
  if (topicSelector) {
    if (typeof sb === 'undefined') {
      topicSelector.innerHTML = '<p class="empty-state">System offline. Please refresh.</p>';
      return;
    }

    requireSession(function (session) {
      var userId = session.user.id;

      // Load topics from Supabase
      sb.from('topics')
        .select('code, title')
        .order('code', { ascending: true })
        .then(function (_ref) {
          var topics = _ref.data || [];
          if (!topics.length) {
            topicSelector.innerHTML = '<p class="empty-state">No topics available yet.</p>';
            return;
          }

          topics.forEach(function (t) {
            var card = document.createElement('article');
            card.className = 'topic-card';
            card.innerHTML =
              '<div class="topic-kicker-badge">KS3 <span class="difficulty-chip difficulty-medium">Adaptive</span></div>' +
              '<h3 class="topic-title">' + escapeHtml(t.title) + '</h3>' +
              '<p class="topic-desc">Questions adapt to your level based on performance.</p>' +
              '<div class="topic-meta-row">' +
              '  <div class="topic-meta-item"><span class="topic-meta-label">Source</span><span class="topic-meta-value">Teacher bank</span></div>' +
              '  <div class="topic-meta-item"><span class="topic-meta-label">XP</span><span class="topic-meta-value">+10/q</span></div>' +
              '</div>';
            card.addEventListener('click', function () {
              localStorage.setItem('100p_topic', t.code);
              localStorage.setItem('100p_difficulty', '2'); // start at medium (2/5)
              localStorage.removeItem('100p_streak');
              window.location.href = 'question.html';
            });
            topicSelector.appendChild(card);
          });
        });
    });
  }

  // ============================================================
  // PART 2 — Adaptive question engine (runs on question.html)
  // Loads teacher-created questions from Supabase question_bank.
  // Adapts difficulty based on correct/incorrect answers.
  // ============================================================
  if (!document.getElementById('questionExpression')) return;
  if (typeof sb === 'undefined' || typeof answersMatch === 'undefined') return;

  var topicEl = document.getElementById('questionTopic');
  var textEl = document.getElementById('questionText');
  var exprEl = document.getElementById('questionExpression');
  var typeBadge = document.getElementById('questionTypeBadge');
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
  var statCorrect = document.getElementById('statCorrect');
  var statStreak = document.getElementById('statStreak');
  var statXp = document.getElementById('statXp');
  var statLabel = document.getElementById('difficultyLabel');
  var statFill = document.getElementById('difficultyFill');

  var hintBtn = document.getElementById('hintBtn');
  var hintsRemainingEl = document.getElementById('hintsRemaining');
  var hintContents = [document.getElementById('hint1'), document.getElementById('hint2'), document.getElementById('hint3')];
  var explanationPanel = document.getElementById('explanationPanel');
  var explanationContent = document.getElementById('explanationContent');
  var explanationAnswer = document.getElementById('explanationAnswer');

  if (!topicEl || !inputEl || !submitBtn) return;

  // State
  var userId = null;
  var userAge = null;
  var userCurriculum = null;
  var topicKey = localStorage.getItem('100p_topic') || '';
  var currentDifficulty = parseInt(localStorage.getItem('100p_difficulty') || '2', 10);
  var questions = [];
  var currentIdx = 0;
  var correctCount = 0;
  var currentStreakCount = 0;
  var totalXP = 0;
  var hintsUsed = 0;
  var answeredQuestions = {};
  var sessionStart = Date.now();

  requireSession(function (session) {
    userId = session.user.id;
    loadProfileAndQuestions();
  });

  function loadProfileAndQuestions() {
    // Load profile for age/curriculum context
    sb.from('profiles')
      .select('full_name, age, curriculum')
      .eq('id', userId)
      .single()
      .then(function (_ref) {
        var profile = _ref.data || {};
        userAge = profile.age || null;
        userCurriculum = profile.curriculum || 'KS3';
        loadQuestions();
      });
  }

  function loadQuestions() {
    if (!topicKey) {
      textEl.textContent = 'No topic selected.';
      submitBtn.style.display = 'none';
      return;
    }

    sb.from('question_bank')
      .select('*')
      .eq('topic_code', topicKey)
      .order('created_at', { ascending: false })
      .then(function (_ref) {
        var allQs = _ref.data || [];

        // Also include public questions from other teachers
        sb.from('question_bank')
          .select('*')
          .eq('topic_code', topicKey)
          .eq('is_public', true)
          .then(function (_ref2) {
            var publicQs = _ref2.data || [];
            // Merge, preferring own questions
            var seen = {};
            var merged = [];
            allQs.forEach(function (q) { seen[q.id] = q; merged.push(q); });
            publicQs.forEach(function (q) { if (!seen[q.id]) { seen[q.id] = q; merged.push(q); } });

            if (!merged.length) {
              textEl.textContent = 'No questions for this topic yet. Ask your teacher to create some.';
              submitBtn.style.display = 'none';
              return;
            }

            // Filter by current difficulty (1-5)
            questions = merged.filter(function (q) {
              var d = parseInt(q.difficulty, 10) || 3;
              return d === currentDifficulty;
            });

            // If not enough at current difficulty, fill from nearby
            if (questions.length < 5) {
              var others = merged.filter(function (q) {
                var d = parseInt(q.difficulty, 10) || 3;
                return d !== currentDifficulty;
              });
              questions = questions.concat(others.slice(0, 5 - questions.length));
            }

            questions = questions.slice(0, 5);

            if (totalEl) totalEl.textContent = questions.length;
            if (topicEl) topicEl.textContent = topicKey.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
            if (typeBadge) typeBadge.textContent = userCurriculum || 'KS3';
            updateDifficultyUI();
            render(0);
          });
      });
  }

  function updateDifficultyUI() {
    if (!statLabel || !statFill) return;
    var labels = ['', '1 — Easy', '2', '3 — Medium', '4', '5 — Hard'];
    statLabel.textContent = labels[currentDifficulty] || currentDifficulty;
    statFill.className = 'difficulty-fill ' + (currentDifficulty <= 2 ? 'easy' : currentDifficulty >= 4 ? 'hard' : 'medium');
    statFill.style.width = (currentDifficulty / 5 * 100) + '%';
  }

  function adjustDifficulty(correct) {
    if (correct) {
      currentStreakCount++;
      if (currentStreakCount >= 3 && currentDifficulty < 5) {
        currentDifficulty++;
        currentStreakCount = 0;
        localStorage.setItem('100p_difficulty', currentDifficulty.toString());
        updateDifficultyUI();
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(statFill, { scale: 1.3 }, { scale: 1, duration: 0.3 });
        }
      }
    } else {
      currentStreakCount = 0;
      if (currentDifficulty > 1) {
        currentDifficulty--;
        localStorage.setItem('100p_difficulty', currentDifficulty.toString());
        updateDifficultyUI();
      }
    }
  }

  function render(idx) {
    if (idx < 0 || idx >= questions.length) return;
    currentIdx = idx;
    var q = questions[idx];

    if (topicEl) topicEl.textContent = topicKey.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
    if (textEl) textEl.textContent = q.prompt || 'Answer the question.';
    if (exprEl) exprEl.innerHTML = escapeHtml(q.expression);
    if (typeBadge) typeBadge.textContent = q.question_type || 'Text Input';

    var pct = ((currentIdx + 1) / questions.length) * 100;
    if (progressFill) progressFill.style.width = pct + '%';
    if (currentEl) currentEl.textContent = currentIdx + 1;
    if (scoreEl) scoreEl.textContent = correctCount + '/' + questions.length;
    if (statCorrect) statCorrect.textContent = correctCount;
    if (statStreak) statStreak.textContent = currentStreakCount;
    if (statXp) statXp.textContent = totalXP;

    if (navEl) {
      navEl.innerHTML = '';
      questions.forEach(function (_q, i) {
        var btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'q-dot';
        btn.textContent = (i + 1).toString();
        if (i === currentIdx) btn.classList.add('current');
        else if (answeredQuestions[_q.id]) btn.classList.add('answered-' + (answeredQuestions[_q.id].isCorrect ? 'correct' : 'incorrect'));
        btn.addEventListener('click', function () { render(i); });
        navEl.appendChild(btn);
      });
    }

    hintsUsed = 0;
    hintsRemainingEl.textContent = '(3 left)';
    hintBtn.disabled = false;
    hintContents.forEach(function (h) { if (h) h.classList.remove('visible'); });
    explanationPanel.classList.remove('visible');

    var existing = answeredQuestions[q.id];
    if (existing) {
      inputEl.value = existing.answer;
      inputEl.style.borderColor = existing.isCorrect ? '#10b981' : '#ef4444';
      inputEl.classList.toggle('correct', existing.isCorrect);
      inputEl.classList.toggle('incorrect', !existing.isCorrect);
      submitBtn.textContent = existing.isCorrect ? 'Correct!' : 'Try again';
      submitBtn.disabled = true;
      explanationPanel.classList.add('visible');
      explanationContent.textContent = q.explanation || 'No explanation provided.';
      explanationAnswer.textContent = 'Answer: ' + q.answer;
      showFeedback(existing.isCorrect, existing.isCorrect ? 'Correct!' : 'Not quite — ' + q.answer);
    } else {
      inputEl.value = '';
      inputEl.focus();
      inputEl.style.borderColor = '';
      inputEl.classList.remove('correct', 'incorrect');
      submitBtn.textContent = 'Submit Answer';
      submitBtn.disabled = false;
      submitBtn.classList.remove('correct', 'incorrect');
      hideFeedback();
      explanationPanel.classList.remove('visible');
    }
  }

  function showFeedback(correct, message) {
    if (!feedbackEl) return;
    feedbackEl.className = 'feedback-overlay show ' + (correct ? 'correct' : 'incorrect');
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

  if (hintBtn) {
    hintBtn.addEventListener('click', function () {
      if (hintsUsed >= 3) return;
      hintsUsed++;
      hintsRemainingEl.textContent = '(' + (3 - hintsUsed) + ' left)';
      if (hintsUsed >= 3) hintBtn.disabled = true;
      var h = hintContents[hintsUsed - 1];
      if (h) h.classList.add('visible');
      var q = questions[currentIdx];
      if (h) h.textContent = q.hint || 'No hint available.';
    });
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
    inputEl.classList.toggle('correct', correct);
    inputEl.classList.toggle('incorrect', !correct);
    submitBtn.classList.toggle('correct', correct);
    submitBtn.classList.toggle('incorrect', !correct);

    showFeedback(correct, correct ? 'Correct! Well done.' : 'Not quite. The answer is ' + q.answer + '.');

    explanationPanel.classList.add('visible');
    explanationContent.textContent = q.explanation || 'No explanation provided.';
    explanationAnswer.textContent = 'Answer: ' + q.answer;

    var isNewCorrect = correct && (!answeredQuestions[q.id] || !answeredQuestions[q.id].isCorrect);
    if (isNewCorrect) {
      correctCount++;
      totalXP += 10;
      adjustDifficulty(true);
    } else {
      adjustDifficulty(false);
    }

    if (xpEl) xpEl.textContent = totalXP;
    if (scoreEl) scoreEl.textContent = correctCount + '/' + questions.length;
    if (statCorrect) statCorrect.textContent = correctCount;
    if (statStreak) statStreak.textContent = currentStreakCount;
    if (statXp) statXp.textContent = totalXP;

    answeredQuestions[q.id] = { answer: given, isCorrect: correct, timeTaken: Math.round((Date.now() - sessionStart) / 1000) };

    saveAttempt(userId, q.id, given, correct).then(function () {
      if (isNewCorrect) {
        awardXP(userId, 10).then(function () {
          checkBadges(userId, correctCount, totalXP);
        });
      } else {
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
    }, correct ? 1500 : 2000);
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
      }).then(function () {
        return updateSpacedRepetition(uId, qId, isCorrect);
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

  function updateSpacedRepetition(uId, qId, isCorrect) {
    return sb.from('spaced_repetition')
      .select('*')
      .eq('user_id', uId)
      .eq('question_id', qId)
      .single()
      .then(function (_ref) {
        var sr = _ref.data;
        var today = new Date().toISOString().split('T')[0];
        if (!sr) {
          return sb.from('spaced_repetition').insert({
            user_id: uId,
            question_id: qId,
            interval_days: 1,
            ease_factor: 2.5,
            next_review_date: today,
            repetitions: 0,
            last_result: isCorrect
          });
        }
        var newInterval = sr.interval_days;
        var newEase = sr.ease_factor;
        var newReps = sr.repetitions;
        if (isCorrect) {
          newReps += 1;
          newInterval = Math.round(newInterval * newEase);
          newEase = Math.max(1.3, newEase + 0.1);
        } else {
          newInterval = 1;
          newEase = Math.max(1.3, newEase - 0.2);
          newReps = 0;
        }
        var nextDate = new Date();
        nextDate.setDate(nextDate.getDate() + newInterval);
        return sb.from('spaced_repetition').upsert({
          user_id: uId,
          question_id: qId,
          interval_days: newInterval,
          ease_factor: newEase,
          next_review_date: nextDate.toISOString().split('T')[0],
          repetitions: newReps,
          last_result: isCorrect
        }, { onConflict: 'user_id,question_id' });
      });
  }

  function checkBadges(uId, correctCount, totalXP) {
    sb.from('badges').select('*').then(function (_ref) {
      var allBadges = _ref.data || [];
      sb.from('user_badges').select('badge_id').eq('user_id', uId).then(function (_ref2) {
        var earned = (_ref2.data || []).map(function (b) { return b.badge_id; });
        allBadges.forEach(function (badge) {
          if (earned.includes(badge.id)) return;
          var shouldEarn = false;
          if (badge.criteria_type === 'questions' && correctCount >= badge.criteria_value) shouldEarn = true;
          if (badge.criteria_type === 'xp' && totalXP >= badge.criteria_value) shouldEarn = true;
          if (badge.criteria_type === 'perfect' && correctCount >= badge.criteria_value) shouldEarn = true;
          if (shouldEarn) {
            sb.from('user_badges').insert({ user_id: uId, badge_id: badge.id }).then(function () {
              if (typeof gsap !== 'undefined') {
                gsap.to('.q-dot', { scale: 1.2, duration: 0.1, yoyo: true, repeat: 1 });
              }
              alert('🏆 Badge earned: ' + badge.name + ' — ' + badge.description);
            });
          }
        });
      });
    });
  }

  function showCompletion() {
    textEl.textContent = 'Task complete — great work!';
    exprEl.style.display = 'none';
    inputEl.style.display = 'none';
    submitBtn.style.display = 'none';
    hintBtn.style.display = 'none';
    hideFeedback();

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
      '<div class="completion-stat"><span class="completion-stat-value">' + correctCount + '</span><span class="completion-stat-label">correct</span></div>' +
      '<div class="completion-stat"><span class="completion-stat-value">+' + totalXP + '</span><span class="completion-stat-label">XP</span></div>' +
      '<div class="completion-stat"><span class="completion-stat-value">' + currentDifficulty + '/5</span><span class="completion-stat-label">final difficulty</span></div>' +
      '</div>' +
      '</div>';
    document.querySelector('.question-card').appendChild(banner);

    gsap.fromTo(banner, { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: 0.5 });

    var actions = document.createElement('div');
    actions.className = 'completion-actions';
    actions.innerHTML =
      '<a href="dashboard.html" class="btn btn-ghost btn-sm btn-bracket">Dashboard</a>' +
      '<a href="task.html" class="btn btn-primary btn-sm btn-bracket">Try another topic</a>';
    banner.appendChild(actions);
  }

  function escapeHtml(text) {
    if (!text) return '';
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
