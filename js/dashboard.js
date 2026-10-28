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
    var railAvatar = document.getElementById('railAvatar');
    var railName = document.getElementById('railName');
    var statXp = document.getElementById('statXp');
    var statLevel = document.getElementById('statLevel');
    var statStreak = document.getElementById('statStreak');
    var statMastery = document.getElementById('statMastery');
    var railTrophyCount = document.getElementById('railTrophyCount');
    var railTrophies = document.getElementById('railTrophies');
    var railTaskEmpty = document.getElementById('railTaskEmpty');
    var railTaskActive = document.getElementById('railTaskActive');
    var railTaskTitle = document.getElementById('railTaskTitle');
    var railTaskBtn = document.getElementById('railTaskBtn');
    var masteryGrid = document.getElementById('masteryGrid');
    var tasksList = document.getElementById('tasksList');
    var badgesList = document.getElementById('badgesList');
    var emptyHistory = document.getElementById('emptyHistory');

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

        if (railName) railName.textContent = profile.full_name || 'Student';
        if (railAvatar) railAvatar.textContent = (profile.full_name || 'S').charAt(0).toUpperCase();
        if (statXp) statXp.textContent = (profile.xp || 0).toLocaleString();
        if (statLevel) statLevel.textContent = Math.floor((profile.xp || 0) / 100) + 1;
        if (statStreak) statStreak.textContent = (profile.streak || 0);
        if (statMastery) statMastery.textContent = '0%';
        if (railTrophyCount) railTrophyCount.textContent = (profile.trophies || 0);

        renderTrophies(profile.trophies || 0);
      });

    // ---------- Trophies / Achievements ----------
    function renderTrophies(earnedCount) {
      if (!railTrophies) return;
      var total = 7;
      var earned = Math.min(Math.max(earnedCount || 0, 0), total);

      railTrophies.innerHTML = '';
      for (var i = 1; i <= total; i++) {
        var card = document.createElement('div');
        card.className = 'rail-trophy-card ' + (i <= earned ? 'earned' : 'locked');
        card.innerHTML = i <= earned ? '\u2605' : '';
        railTrophies.appendChild(card);
      }

      if (typeof gsap !== 'undefined') {
        gsap.fromTo('.rail-trophy-card.earned',
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
      if (!groups || groups.length === 0) {
        if (tasksList) tasksList.innerHTML = '';
        if (emptyHistory) emptyHistory.style.display = 'block';
        if (railTaskEmpty) railTaskEmpty.style.display = 'block';
        if (railTaskActive) railTaskActive.style.display = 'none';
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
      if (!tasksList) return;

      tasksList.innerHTML = '';
      var firstAssignment = null;

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

        if (!firstAssignment) firstAssignment = assignment;

        var card = document.createElement('div');
        card.className = 'task-item';
        card.innerHTML =
          '<div class="task-icon">Q</div>' +
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

      // Show first assignment as active work in rail
      if (firstAssignment) {
        if (railTaskEmpty) railTaskEmpty.style.display = 'none';
        if (railTaskActive) railTaskActive.style.display = 'block';
        if (railTaskTitle) railTaskTitle.textContent = firstAssignment.title || '—';
        if (railTaskBtn) {
          railTaskBtn.onclick = function () {
            window.location.href = 'question.html';
          };
        }
      }
    }

    // ---------- Mastery per topic ----------
    function renderMastery(userId) {
      var topics = [
        { code: '394h', label: 'Negative & Fractional Indices' },
        { code: '214n', label: 'Algebraic Fractions' },
        { code: '552p', label: 'Surds' }
      ];

      masteryGrid.innerHTML = '';
      topics.forEach(function (topic) {
        var row = document.createElement('div');
        row.className = 'mastery-row';
        row.innerHTML =
          '<div class="mastery-label-row">' +
          '  <span>' + escapeHtml(topic.label) + '</span>' +
          '  <span>0%</span>' +
          '</div>' +
          '<div class="mastery-bar"><div></div></div>';
        masteryGrid.appendChild(row);

        sb.from('questions')
          .select('id, task_id')
          .then(function (_ref) {
            var questions = _ref.data || [];
            var taskIds = questions.map(function (q) { return q.task_id; }).filter(Boolean);
            if (!taskIds.length) return;
            sb.from('tasks')
              .select('id, topic_code')
              .in('id', taskIds)
              .then(function (_ref2) {
                var tasks = _ref2.data || [];
                var taskTopic = {};
                tasks.forEach(function (t) { taskTopic[t.id] = t.topic_code; });
                var qIds = questions.filter(function (q) { return taskTopic[q.task_id] === topic.code; }).map(function (q) { return q.id; });

                if (!qIds.length) return;
                sb.from('attempts')
                  .select('is_correct')
                  .eq('user_id', userId)
                  .in('question_id', qIds)
                  .then(function (_ref3) {
                    var attempts = _ref3.data || [];
                    var correct = attempts.filter(function (a) { return a.is_correct; }).length;
                    var pct = attempts.length ? Math.round((correct / attempts.length) * 100) : 0;
                    var fill = row.querySelector('.mastery-bar > div');
                    var labelSpan = row.querySelector('.mastery-label-row span:last-child');
                    if (fill) {
                      fill.style.width = '0%';
                      setTimeout(function () {
                        fill.style.width = pct + '%';
                      }, 50);
                    }
                    if (labelSpan) labelSpan.textContent = pct + '%';
                  });
              });
          });
      });
    }

    renderMastery(userId);

    // ---------- Badges ----------
    sb.from('user_badges')
      .select('badge_id')
      .eq('user_id', userId)
      .then(function (_ref) {
        var earnedBadgeIds = (_ref.data || []).map(function (b) { return b.badge_id; });

        sb.from('badges').select('*').then(function (_ref2) {
          var allBadges = _ref2.data || [];
          if (!badgesList) return;
          badgesList.innerHTML = '';

          allBadges.forEach(function (badge) {
            var earned = earnedBadgeIds.includes(badge.id);
            var card = document.createElement('div');
            card.className = 'badge-card ' + (earned ? 'earned' : 'badge-locked');
            card.innerHTML =
              '<div class="badge-icon">' + (badge.icon || '\u2605') + '</div>' +
              '<div class="badge-name">' + escapeHtml(badge.name) + '</div>' +
              '<div class="badge-description">' + escapeHtml(badge.description) + '</div>' +
              '<div class="badge-criteria">' + badge.criteria_value + ' required</div>';
            badgesList.appendChild(card);
          });
        });
      });
  });

  function escapeHtml(text) {
    var div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
})();
