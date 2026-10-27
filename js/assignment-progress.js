// ============================================================
// 100Percent — Assignment Progress controller
// Teachers: view student progress on a specific assignment
// ============================================================

/* global sb, gsap, window, document, URLSearchParams */

(function () {
  'use strict';

  if (typeof sb === 'undefined') return;

  var params = new URLSearchParams(window.location.search);
  var assignmentId = params.get('assignment');
  var assignmentTitle = params.get('title');

  if (!assignmentId) {
    window.location.href = 'teacher-dashboard.html';
    return;
  }

  var titleDisplay = document.getElementById('assignmentTitleDisplay');
  var avgScoreEl = document.getElementById('assignmentAvgScore');
  var submittedCountEl = document.getElementById('assignmentSubmittedCount');
  var progressList = document.getElementById('studentsProgressList');

  if (titleDisplay) titleDisplay.textContent = assignmentTitle || 'Assignment Progress';

  // Load assignment questions
  sb.from('assignment_questions').select('question_id').eq('assignment_id', assignmentId).order('position', { ascending: true }).then(function (_ref) {
    var aqs = _ref.data || [];
    var questionIds = aqs.map(function (aq) { return aq.question_id; });

    // Load questions for reference
    sb.from('questions').select('id, expression, prompt, answer').in('id', questionIds).then(function (_ref2) {
      var questions = _ref2.data || [];
      var qMap = {};
      questions.forEach(function (q) { qMap[q.id] = q; });

      // Load student progress
      sb.from('student_assignment_progress').select('*').eq('assignment_id', assignmentId).then(function (_ref3) {
        var progress = _ref3.data || [];

        // Group by student
        var studentProgress = {};
        progress.forEach(function (p) {
          if (!studentProgress[p.student_id]) {
            studentProgress[p.student_id] = { correct: 0, total: 0, answers: [] };
          }
          studentProgress[p.student_id].total++;
          if (p.is_correct) studentProgress[p.student_id].correct++;
          studentProgress[p.student_id].answers.push({
            question_id: p.question_id,
            answer: p.answer,
            is_correct: p.is_correct
          });
        });

        var studentIds = Object.keys(studentProgress);

        // Load student profiles
        sb.from('profiles').select('id, full_name, email').in('id', studentIds).then(function (_ref4) {
          var students = _ref4.data || [];
          var sMap = {};
          students.forEach(function (s) { sMap[s.id] = s; });

          // Render
          if (submittedCountEl) submittedCountEl.textContent = studentIds.length;

          var totalCorrect = 0;
          var totalQuestions = 0;

          studentIds.forEach(function (sid) {
            var sp = studentProgress[sid];
            var s = sMap[sid] || { full_name: 'Unknown', email: '' };
            var pct = sp.total ? Math.round((sp.correct / sp.total) * 100) : 0;
            totalCorrect += sp.correct;
            totalQuestions += sp.total;

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
            '<div class="student-score">' +
            '  <div class="score-value">' + pct + '%</div>' +
            '  <div class="score-detail">' + sp.correct + '/' + sp.total + ' correct</div>' +
            '</div>';
            progressList.appendChild(card);
          });

          if (avgScoreEl) {
            var avg = totalQuestions ? Math.round((totalCorrect / totalQuestions) * 100) : 0;
            avgScoreEl.textContent = avg + '%';
          }

          if (!studentIds.length) {
            progressList.innerHTML = '<p class="empty-state">No students have submitted yet.</p>';
          }
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
