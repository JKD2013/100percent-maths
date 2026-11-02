// ============================================================
// 100Percent — Adaptive Task Engine (KS3)
// Part 1: Topic selector (runs on task.html)
// Part 2: Adaptive question engine (runs on question.html)
// ============================================================

/* global sb, answersMatch, gsap, window, document */

(function () {
  'use strict';

  // ----------------------------------------------------------
  // KS3 Question Bank — adaptive by difficulty
  // Difficulty adjusts: correct x3 → step up; wrong → step down.
  // ----------------------------------------------------------
  var QUESTION_BANK = {
    'negative-fractional-indices': {
      label: 'Negative & Fractional Indices',
      topicCode: '394h',
      questions: {
        easy: [
          {
            id: 'nfi-e1', prompt: 'Evaluate:', expression: '2<sup>-3</sup>', answer: '1/8',
            hint1: 'A negative index means take the reciprocal: a<sup>-n</sup> = 1 / a<sup>n</sup>.',
            hint2: '2<sup>-3</sup> = 1 / 2<sup>3</sup>.',
            hint3: '2<sup>3</sup> = 8, so 2<sup>-3</sup> = 1/8.',
            explanation: 'A negative index means take the reciprocal. 2<sup>-3</sup> = 1 / 2<sup>3</sup> = 1/8.',
            type: 'indices'
          },
          {
            id: 'nfi-e2', prompt: 'Evaluate:', expression: '5<sup>-2</sup>', answer: '1/25',
            hint1: '5<sup>-2</sup> = 1 / 5<sup>2</sup>.',
            hint2: '5<sup>2</sup> = 25.',
            hint3: 'So 5<sup>-2</sup> = 1/25.',
            explanation: '5<sup>-2</sup> = 1 / 5<sup>2</sup> = 1/25.',
            type: 'indices'
          },
          {
            id: 'nfi-e3', prompt: 'Evaluate:', expression: '10<sup>-1</sup>', answer: '0.1',
            hint1: '10<sup>-1</sup> = 1 / 10<sup>1</sup> = 1/10.',
            hint2: '1/10 as a decimal is 0.1.',
            hint3: '',
            explanation: '10<sup>-1</sup> = 1/10 = 0.1.',
            type: 'indices'
          }
        ],
        medium: [
          {
            id: 'nfi-m1', prompt: 'Evaluate:', expression: '27<sup>1/3</sup>', answer: '3',
            hint1: 'A fractional index 1/3 means cube root.',
            hint2: 'What number cubed gives 27?',
            hint3: '3 × 3 × 3 = 27, so the cube root of 27 is 3.',
            explanation: '27<sup>1/3</sup> means the cube root of 27. Since 3³ = 27, the answer is 3.',
            type: 'indices'
          },
          {
            id: 'nfi-m2', prompt: 'Evaluate:', expression: '16<sup>1/2</sup>', answer: '4',
            hint1: 'An index of 1/2 means square root.',
            hint2: '√16 = ?',
            hint3: '4 × 4 = 16.',
            explanation: '16<sup>1/2</sup> = √16 = 4.',
            type: 'indices'
          },
          {
            id: 'nfi-m3', prompt: 'Simplify:', expression: 'x<sup>-2</sup> × x<sup>5</sup>', answer: 'x^3',
            hint1: 'When multiplying with the same base, add the indices: -2 + 5.',
            hint2: '-2 + 5 = 3.',
            hint3: 'So x<sup>-2</sup> × x<sup>5</sup> = x<sup>3</sup>.',
            explanation: 'x<sup>-2</sup> × x<sup>5</sup> = x<sup>-2+5</sup> = x<sup>3</sup>.',
            type: 'indices'
          }
        ],
        hard: [
          {
            id: 'nfi-h1', prompt: 'Simplify:', expression: '(1/4)<sup>-3/2</sup>', answer: '8',
            hint1: 'Negative index → reciprocal: (1/4)<sup>-3/2</sup> = 4<sup>3/2</sup>.',
            hint2: '4<sup>3/2</sup> = (√4)<sup>3</sup> = 2<sup>3</sup>.',
            hint3: '2<sup>3</sup> = 8.',
            explanation: '(1/4)<sup>-3/2</sup> = 4<sup>3/2</sup> = (√4)<sup>3</sup> = 2<sup>3</sup> = 8.',
            type: 'indices'
          },
          {
            id: 'nfi-h2', prompt: 'Evaluate:', expression: '64<sup>-2/3</sup>', answer: '1/16',
            hint1: '64<sup>-2/3</sup> = 1 / 64<sup>2/3</sup>.',
            hint2: '64<sup>1/3</sup> = 4, then 4<sup>2</sup> = 16.',
            hint3: 'So 64<sup>-2/3</sup> = 1/16.',
            explanation: '64<sup>-2/3</sup> = 1 / 64<sup>2/3</sup> = 1 / (∛64)<sup>2</sup> = 1 / 4<sup>2</sup> = 1/16.',
            type: 'indices'
          },
          {
            id: 'nfi-h3', prompt: 'Simplify:', expression: '(27/8)<sup>-2/3</sup>', answer: '4/9',
            hint1: 'Flip the fraction first: (27/8)<sup>-2/3</sup> = (8/27)<sup>2/3</sup>.',
            hint2: '(8/27)<sup>1/3</sup> = 2/3, then square it: (2/3)<sup>2</sup>.',
            hint3: '(2/3)<sup>2</sup> = 4/9.',
            explanation: '(27/8)<sup>-2/3</sup> = (8/27)<sup>2/3</sup> = (∛(8/27))<sup>2</sup> = (2/3)<sup>2</sup> = 4/9.',
            type: 'indices'
          }
        ]
      }
    },
    'algebraic-fractions': {
      label: 'Algebraic Fractions',
      topicCode: '214n',
      questions: {
        easy: [
          {
            id: 'af-e1', prompt: 'Simplify:', expression: '6x / 3x', answer: '2',
            hint1: 'Cancel the x on top and bottom.',
            hint2: '6 / 3 = 2.',
            hint3: '',
            explanation: '6x / 3x = 2 (cancel x).',
            type: 'algebra'
          },
          {
            id: 'af-e2', prompt: 'Simplify:', expression: '10y / 5', answer: '2y',
            hint1: '10 / 5 = 2.',
            hint2: 'So 10y / 5 = 2y.',
            hint3: '',
            explanation: '10y / 5 = 2y.',
            type: 'algebra'
          }
        ],
        medium: [
          {
            id: 'af-m1', prompt: 'Simplify:', expression: '(x<sup>2</sup> - 9) / (x - 3)', answer: 'x + 3',
            hint1: 'Factor the numerator: x<sup>2</sup> - 9 = (x - 3)(x + 3).',
            hint2: 'Cancel (x - 3) from top and bottom.',
            hint3: 'Leaves x + 3.',
            explanation: '(x<sup>2</sup> - 9) / (x - 3) = (x-3)(x+3) / (x-3) = x + 3.',
            type: 'algebra'
          },
          {
            id: 'af-m2', prompt: 'Simplify:', expression: '2x / 6x<sup>2</sup>', answer: '1/(3x)',
            hint1: '2/6 = 1/3.',
            hint2: 'x / x<sup>2</sup> = 1/x.',
            hint3: 'So 2x / 6x<sup>2</sup> = 1/(3x).',
            explanation: '2x / 6x<sup>2</sup> = (1/3) · (1/x) = 1/(3x).',
            type: 'algebra'
          }
        ],
        hard: [
          {
            id: 'af-h1', prompt: 'Simplify:', expression: '(x<sup>2</sup> - 4) / (x<sup>2</sup> - 4x + 4)', answer: '(x + 2) / (x - 2)',
            hint1: 'Factor: x<sup>2</sup> - 4 = (x - 2)(x + 2).',
            hint2: 'Factor: x<sup>2</sup> - 4x + 4 = (x - 2)<sup>2</sup>.',
            hint3: 'Cancel (x - 2): (x + 2) / (x - 2).',
            explanation: '(x<sup>2</sup> - 4)/(x<sup>2</sup> - 4x + 4) = (x-2)(x+2) / (x-2)<sup>2</sup> = (x+2)/(x-2).',
            type: 'algebra'
          }
        ]
      }
    },
    'surds': {
      label: 'Surds',
      topicCode: '552p',
      questions: {
        easy: [
          {
            id: 's-e1', prompt: 'Simplify:', expression: '√50', answer: '5√2',
            hint1: 'Find the largest square factor of 50: 25 × 2.',
            hint2: '√50 = √(25 × 2) = 5√2.',
            hint3: '',
            explanation: '√50 = √25 · √2 = 5√2.',
            type: 'surds'
          },
          {
            id: 's-e2', prompt: 'Simplify:', expression: '√32', answer: '4√2',
            hint1: '32 = 16 × 2.',
            hint2: '√32 = 4√2.',
            hint3: '',
            explanation: '√32 = √16 · √2 = 4√2.',
            type: 'surds'
          }
        ],
        medium: [
          {
            id: 's-m1', prompt: 'Simplify:', expression: '√72', answer: '6√2',
            hint1: '72 = 36 × 2.',
            hint2: '√72 = 6√2.',
            hint3: '',
            explanation: '√72 = √36 · √2 = 6√2.',
            type: 'surds'
          },
          {
            id: 's-m2', prompt: 'Simplify:', expression: '3√5 + 2√5', answer: '5√5',
            hint1: 'Like terms: 3√5 + 2√5 = (3+2)√5.',
            hint2: '3 + 2 = 5.',
            hint3: '',
            explanation: '3√5 + 2√5 = 5√5.',
            type: 'surds'
          }
        ],
        hard: [
          {
            id: 's-h1', prompt: 'Rationalise:', expression: '1 / √3', answer: '√3 / 3',
            hint1: 'Multiply top and bottom by √3.',
            hint2: '√3 / (√3 × √3) = √3 / 3.',
            hint3: '',
            explanation: '1/√3 × √3/√3 = √3 / 3.',
            type: 'surds'
          },
          {
            id: 's-h2', prompt: 'Simplify:', expression: '(2 + √3)(2 - √3)', answer: '1',
            hint1: 'Difference of squares: (a + b)(a - b) = a<sup>2</sup> - b<sup>2</sup>.',
            hint2: '2<sup>2</sup> - (√3)<sup>2</sup> = 4 - 3.',
            hint3: '4 - 3 = 1.',
            explanation: '(2+√3)(2-√3) = 4 - 3 = 1.',
            type: 'surds'
          }
        ]
      }
    },
    'linear-equations': {
      label: 'Linear Equations',
      topicCode: 'lin1',
      questions: {
        easy: [
          {
            id: 'le-e1', prompt: 'Solve:', expression: '3x + 6 = 15', answer: '3',
            hint1: 'Subtract 6 from both sides: 3x = 9.',
            hint2: 'Divide by 3: x = 3.',
            hint3: '',
            explanation: '3x + 6 = 15 → 3x = 9 → x = 3.',
            type: 'algebra'
          },
          {
            id: 'le-e2', prompt: 'Solve:', expression: 'x - 5 = 8', answer: '13',
            hint1: 'Add 5 to both sides: x = 8 + 5.',
            hint2: 'x = 13.',
            hint3: '',
            explanation: 'x - 5 = 8 → x = 13.',
            type: 'algebra'
          }
        ],
        medium: [
          {
            id: 'le-m1', prompt: 'Solve:', expression: '4x - 7 = 2x + 5', answer: '6',
            hint1: 'Subtract 2x from both sides: 2x - 7 = 5.',
            hint2: 'Add 7: 2x = 12.',
            hint3: 'Divide by 2: x = 6.',
            explanation: '4x - 7 = 2x + 5 → 2x = 12 → x = 6.',
            type: 'algebra'
          },
          {
            id: 'le-m2', prompt: 'Solve:', expression: '5(x - 2) = 25', answer: '7',
            hint1: 'Divide by 5: x - 2 = 5.',
            hint2: 'Add 2: x = 7.',
            hint3: '',
            explanation: '5(x-2) = 25 → x - 2 = 5 → x = 7.',
            type: 'algebra'
          }
        ],
        hard: [
          {
            id: 'le-h1', prompt: 'Solve:', expression: '2(x + 3) = 3(x - 1)', answer: '9',
            hint1: 'Expand: 2x + 6 = 3x - 3.',
            hint2: 'Subtract 2x: 6 = x - 3.',
            hint3: 'Add 3: x = 9.',
            explanation: '2x + 6 = 3x - 3 → x = 9.',
            type: 'algebra'
          }
        ]
      }
    },
    'pythagoras': {
      label: 'Pythagoras & Trigonometry',
      topicCode: 'pyt1',
      questions: {
        easy: [
          {
            id: 'pt-e1', prompt: 'Find the hypotenuse:', expression: 'a = 3, b = 4', answer: '5',
            hint1: 'a<sup>2</sup> + b<sup>2</sup> = c<sup>2</sup>.',
            hint2: '3<sup>2</sup> + 4<sup>2</sup> = 9 + 16 = 25.',
            hint3: '√25 = 5.',
            explanation: 'c = √(3² + 4²) = √25 = 5.',
            type: 'geometry'
          }
        ],
        medium: [
          {
            id: 'pt-m1', prompt: 'Find the missing side:', expression: 'a = 5, c = 13', answer: '12',
            hint1: 'b<sup>2</sup> = c<sup>2</sup> - a<sup>2</sup> = 13<sup>2</sup> - 5<sup>2</sup>.',
            hint2: '169 - 25 = 144.',
            hint3: '√144 = 12.',
            explanation: 'b = √(13² - 5²) = √144 = 12.',
            type: 'geometry'
          }
        ],
        hard: [
          {
            id: 'pt-h1', prompt: 'Find hypotenuse:', expression: 'a = 8, b = 15', answer: '17',
            hint1: '8<sup>2</sup> + 15<sup>2</sup> = 64 + 225 = 289.',
            hint2: '√289 = 17.',
            hint3: '',
            explanation: 'c = √(8² + 15²) = √289 = 17.',
            type: 'geometry'
          }
        ]
      }
    }
  };

  // ============================================================
  // PART 1 — Topic selector (runs on task.html)
  // ============================================================
  var topicSelector = document.getElementById('topicSelector');
  if (topicSelector) {
    Object.keys(QUESTION_BANK).forEach(function (key) {
      var topic = QUESTION_BANK[key];
      var card = document.createElement('article');
      card.className = 'topic-card';
      card.innerHTML =
        '<div class="topic-kicker-badge">KS3 <span class="difficulty-chip difficulty-medium">Medium</span></div>' +
        '<h3 class="topic-title">' + topic.label + '</h3>' +
        '<p class="topic-desc">Adaptive questions from easy → hard. 5 questions per task.</p>' +
        '<div class="topic-meta-row">' +
        '  <div class="topic-meta-item"><span class="topic-meta-label">Questions</span><span class="topic-meta-value">5</span></div>' +
        '  <div class="topic-meta-item"><span class="topic-meta-label">XP</span><span class="topic-meta-value">+50</span></div>' +
        '</div>';
      card.addEventListener('click', function () {
        localStorage.setItem('100p_topic', key);
        localStorage.setItem('100p_difficulty', 'medium');
        window.location.href = 'question.html';
      });
      topicSelector.appendChild(card);
    });
  }

  // ============================================================
  // PART 2 — Adaptive question engine (runs on question.html)
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
  var topicKey = localStorage.getItem('100p_topic') || 'negative-fractional-indices';
  var topicData = QUESTION_BANK[topicKey];
  var currentDifficulty = localStorage.getItem('100p_difficulty') || 'medium';
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
    loadQuestions();
  });

  function loadQuestions() {
    var bank = topicData.questions[currentDifficulty];
    questions = bank.slice(0, 5);
    if (totalEl) totalEl.textContent = questions.length;
    if (topicEl) topicEl.textContent = topicData.label;
    if (typeBadge) typeBadge.textContent = topicData.topicCode || 'KS3';
    updateDifficultyUI();
    render(0);
  }

  function updateDifficultyUI() {
    if (!statLabel || !statFill) return;
    statLabel.textContent = currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1);
    statFill.className = 'difficulty-fill ' + currentDifficulty;
    var pct = currentDifficulty === 'easy' ? 33 : currentDifficulty === 'medium' ? 66 : 100;
    statFill.style.width = pct + '%';
  }

  function adjustDifficulty(correct) {
    if (correct) {
      currentStreakCount++;
      if (currentStreakCount >= 3 && currentDifficulty !== 'hard') {
        currentDifficulty = currentDifficulty === 'easy' ? 'medium' : 'hard';
        currentStreakCount = 0;
        localStorage.setItem('100p_difficulty', currentDifficulty);
        updateDifficultyUI();
        if (typeof gsap !== 'undefined') {
          gsap.fromTo(statFill, { scale: 1.3 }, { scale: 1, duration: 0.3 });
        }
      }
    } else {
      currentStreakCount = 0;
      if (currentDifficulty !== 'easy') {
        currentDifficulty = currentDifficulty === 'hard' ? 'medium' : 'easy';
        localStorage.setItem('100p_difficulty', currentDifficulty);
        updateDifficultyUI();
      }
    }
  }

  function render(idx) {
    if (idx < 0 || idx >= questions.length) return;
    currentIdx = idx;
    var q = questions[idx];

    if (topicEl) topicEl.textContent = topicData.label;
    if (textEl) textEl.textContent = q.prompt || 'Answer the question.';
    if (exprEl) exprEl.innerHTML = q.expression;
    if (typeBadge) typeBadge.textContent = q.type || topicData.topicCode || 'KS3';

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
      explanationContent.textContent = q.explanation;
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
      var hintText = q['hint' + hintsUsed];
      if (h) h.textContent = hintText;
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
    explanationContent.textContent = q.explanation;
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
      '<div class="completion-stat"><span class="completion-stat-value">' + currentDifficulty.charAt(0).toUpperCase() + currentDifficulty.slice(1) + '</span><span class="completion-stat-label">final difficulty</span></div>' +
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
})();
