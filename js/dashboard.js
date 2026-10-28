// ============================================================
// 100Percent — Dashboard controller (dashboard.html)
// Monitor surface: requires session, renders user stats,
// trophies/achievements, assignments with progress tracking.
// All reads go through Supabase RLS.
// ============================================================

/* global sb, gsap, window, document */

(function () {
  'use strict';

  if (typeof sb === 'undefined') return;

  requireSession(function (session) {
    var userId = session.user.id;

    // ---------- DOM ----------
    var nameEl = document.querySelector('.user-name-dashboard');
    var schoolEl = document.querySelector('.user-school');
    var avatarEl = document.querySelector('.user-avatar-lg');
    var xpEl = document.getElementById('statXp');
    var streakEl = document.getElementById('statStreak');
    var masteryEl = document.getElementById('statMastery');
    var trophyCountEl = document.getElementById('trophyCount');
    var trophiesGrid = document.getElementById('trophiesGrid');

    var profileData = {};

    // ---------- Load user profile ----------
    sb.from('profiles')
      .select('*')
      .eq('id', userId)
      .single()
      .then(function (_ref) {
        var profile = _ref.data;
        if (!profile) return;

        profileData = profile;

        if (nameEl) nameEl.textContent = profile.full_name || 'Student';
        if (schoolEl) schoolEl.textContent = profile.school || "Gordon's School";
        if (avatarEl) avatarEl.textContent = (profile.full_name || 'S').charAt(0).toUpperCase();
        if (xpEl) xpEl.textContent = profile.xp.toLocaleString();
        if (streakEl) streakEl.textContent = profile.streak + ' days';
        if (trophyCountEl) trophyCountEl.textContent = profile.trophies;

        // wire nav user info too
        var navName = document.querySelector('.user-name');
        var navSchool = document.querySelector('.user-school');
        if (navName) navName.textContent = profile.full_name || 'Student';
        if (navSchool) navSchool.textContent = profile.school || "Gordon's School";

        renderTrophies(profile.trophies);
      });

    // ---------- Trophies / Achievements ----------
    function renderTrophies(earnedCount) {
      if (!trophiesGrid) return;
      var total = 37;
      var earned = Math.min(Math.max(earnedCount || 0, 0), total);

      trophiesGrid.innerHTML = '';
      for (var i = 1; i <= total; i++) {
        var card = document.createElement('div');
        card.className = 'trophy-card ' + (i <= earned ? 'earned' : 'locked');
        card.innerHTML = i <= earned ? '\u2605' : '';
        trophiesGrid.appendChild(card);
      }

      if (typeof gsap !== 'undefined') {
        gsap.fromTo('.trophy-card.earned',
          { scale: 0.8, opacity: 0 },
          { scale: 1, opacity: 1, duration: 0.4, stagger: 0.05, ease: 'back.out(1.7)' }
        );
      }
    }

    // ---------- Load student's groups ----------
    var studentGroups = [];

    sb.from('group_members')
      .select('group_id')
      .eq('student_id', userId)
      .then(function (_ref) {
        var members = _ref.data || [];
        var groupIds = members.map(function (m) { return m.group_id; });

        if (groupIds.length === 0) {
          renderAssignments([]);
          return;
        }

        sb.from('groups').select('*').in('id', groupIds).then(function (_ref2) {
          studentGroups = _ref2.data || [];
          renderAssignments(studentGroups);
        });
      });

    // ---------- Render assignments with progress ----------
    function renderAssignments(groups) {
      var tasksList = document.getElementById('tasksList');
      var emptyHistory = document.getElementById('emptyHistory');
      var nextWorkEmpty = document.getElementById('nextWorkEmpty');
      var nextWorkActive = document.getElementById('nextWorkActive');
      var openTaskBtn = document.getElementById('openTaskBtn');
      var activeTaskTitle = document.getElementById('activeTaskTitle');

      if (!groups || groups.length === 0) {
        if (tasksList) tasksList.innerHTML = '';
        if (emptyHistory) emptyHistory.style.display = 'block';
        if (nextWorkEmpty) nextWorkEmpty.style.display = 'block';
        if (nextWorkActive) nextWorkActive.style.display = 'none';
        return;
      }

      if (emptyHistory) emptyHistory.style.display = 'none';

      // Load assignments for these groups
      var groupIds = groups.map(function (g) { return g.id; });

      sb.from('assignments')
        .select('*')
        .in('group_id', groupIds)
        .order('created_at', { ascending: false })
        .then(function (_ref) {
          var assignments = _ref.data || [];

          if (!assignments.length) {
            if (tasksList) tasksList.innerHTML = '';
            if (emptyHistory) emptyHistory.style.display = 'block';
            if (nextWorkEmpty) nextWorkEmpty.style.display = 'block';
            if (nextWorkActive) nextWorkActive.style.display = 'none';
            return;
          }

          // Load assignment questions and student progress
          var assignmentIds = assignments.map(function (a) { return a.id; });

          sb.from('assignment_questions')
            .select('assignment_id, question_id')
            .in('assignment_id', assignmentIds)
            .then(function (_ref2) {
              var aqs = _ref2.data || [];
              var qIds = aqs.map(function (aq) { return aq.question_id; });

              if (qIds.length === 0) {
                renderAssignmentsUI(assignments, {});
                return;
              }

              // Load student's progress on these questions
              sb.from('student_assignment_progress')
                .select('question_id, is_correct')
                .eq('student_id', userId)
                .in('question_id', qIds)
                .then(function (_ref3) {
                  var progress = _ref3.data || [];
                  var qProgress = {};
                  progress.forEach(function (p) {
                    qProgress[p.question_id] = p.is_correct;
                  });
                  renderAssignmentsUI(assignments, aqs, qProgress);
                });
            });
        });
    }

    function renderAssignmentsUI(assignments, aqs, qProgress) {
      var tasksList = document.getElementById('tasksList');
      var nextWorkEmpty = document.getElementById('nextWorkEmpty');
      var nextWorkActive = document.getElementById('nextWorkActive');
      var openTaskBtn = document.getElementById('openTaskBtn');
      var activeTaskTitle = document.getElementById('activeTaskTitle');

      if (!tasksList) return;

      tasksList.innerHTML = '';

      assignments.forEach(function (assignment) {
        // Get questions for this assignment
        var assignmentQIds = aqs
          .filter(function (aq) { return aq.assignment_id === assignment.id; })
          .map(function (aq) { return aq.question_id; });

        var totalQuestions = assignmentQIds.length;
        var correctCount = 0;
        var answeredCount = 0;

        assignmentQIds.forEach(function (qId) {
          if (qProgress[qId] !== undefined) {
            answeredCount++;
            if (qProgress[qId]) correctCount++;
          }
        });

        var pct = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;
        var isComplete = totalQuestions > 0 && answeredCount === totalQuestions;

        var card = document.createElement('div');
        card.className = 'task-item';
        card.innerHTML =
          '<div class="task-info">' +
          '  <div class="task-title">' + escapeHtml(assignment.title) + '</div>' +
          '  <div class="task-meta">' + answeredCount + '/' + totalQuestions + ' questions answered</div>' +
          '</div>' +
          '<div class="task-badge ' + (isComplete ? 'done' : '') + '">' +
          (isComplete ? 'Done' : 'In Progress') +
          '</div>';
        card.addEventListener('click', function () {
          window.location.href = 'question.html';
        });
        tasksList.appendChild(card);
      });

      // Show first assignment as active work
      if (assignments.length > 0) {
        if (nextWorkEmpty) nextWorkEmpty.style.display = 'none';
        if (nextWorkActive) nextWorkActive.style.display = 'block';
        if (openTaskBtn) {
          openTaskBtn.onclick = function () {
            window.location.href = 'question.html';
          };
        }
        if (activeTaskTitle) activeTaskTitle.textContent = assignments[0].title || '—';
      }
    }

    // ---------- Mastery per topic ----------
    function renderMastery(userId) {
      var bars = [
        { el: document.querySelector('.mastery-bar.mastery-1'), topic: '394h', label: 'Negative & Fractional Indices' },
        { el: document.querySelector('.mastery-bar.mastery-2'), topic: '214n', label: 'Algebraic Fractions' },
        { el: document.querySelector('.mastery-bar.mastery-3'), topic: '552p', label: 'Surds' }
      ];

      sb.from('questions')
        .select('id, task_id')
        .then(function (_ref) {
          var questions = _ref.data || [];
          var taskIds = questions.map(function (q) { return q.task_id; }).filter(Boolean);
          if (!taskIds.length) {
            bars.forEach(function (b) {
              if (b.el) {
                var fill = b.el.querySelector('div');
                if (fill) fill.style.width = '0%';
                var labelEl = b.el.parentNode.querySelector('.mastery-label-row');
                if (labelEl) labelEl.children[1].textContent = '0%';
              }
            });
            return;
          }
          sb.from('tasks')
            .select('id, topic_code')
            .in('id', taskIds)
            .then(function (_ref2) {
              var tasks = _ref2.data || [];
              var taskTopic = {};
              tasks.forEach(function (t) { taskTopic[t.id] = t.topic_code; });
              var byTopic = {};
              questions.forEach(function (q) {
                var code = taskTopic[q.task_id] || 'unknown';
                byTopic[code] = byTopic[code] || [];
                byTopic[code].push(q.id);
              });
              bars.forEach(function (bar) {
                if (!bar.el) return;
                var qIds = byTopic[bar.topic] || [];
                var fill = bar.el.querySelector('div');
                var labelEl = bar.el.parentNode.querySelector('.mastery-label-row');
                var pctText = labelEl ? labelEl.children[1] : null;

                if (!qIds.length) {
                  if (fill) fill.style.width = '0%';
                  if (pctText) pctText.textContent = '0%';
                  return;
                }
                sb.from('attempts')
                  .select('is_correct')
                  .eq('user_id', userId)
                  .in('question_id', qIds)
                  .then(function (_ref3) {
                    var attempts = _ref3.data || [];
                    var correct = attempts.filter(function (a) { return a.is_correct; }).length;
                    var pct = attempts.length ? Math.round((correct / attempts.length) * 100) : 0;
                    if (fill) {
                      fill.style.width = '0%';
                      setTimeout(function () {
                        fill.classList.add('filled');
                        fill.style.width = pct + '%';
                      }, 50);
                    }
                    if (pctText) pctText.textContent = pct + '%';
                  });
              });
            });
        });
    }

    renderMastery(userId);
  });

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
