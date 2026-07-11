/* Werkwoorden PWA - quiz logica */
(function () {
  'use strict';

  // ---------- Elementen ----------
  const $ = (id) => document.getElementById(id);
  const screens = {
    start:  $('screen-start'),
    quiz:   $('screen-quiz'),
    result: $('screen-result'),
  };
  const el = {
    loadStatus:  $('load-status'),
    btnStart:    $('btn-start'),
    selCount:    $('select-count'),
    selMode:     $('select-mode'),

    progressBar: $('progress-bar'),
    progressTxt: $('progress-text'),
    scoreTxt:    $('score-text'),
    infinitief:  $('infinitief'),
    verbType:    $('verb-type'),
    askLabel:    $('ask-label'),
    form:        $('answer-form'),
    inputOvt:    $('input-ovt'),
    inputVd:     $('input-vd'),
    fieldOvt:    $('input-ovt').parentElement,
    fieldVd:     $('input-vd').parentElement,
    btnCheck:    $('btn-check'),
    btnNext:     $('btn-next'),
    feedback:    $('feedback'),

    resultEmoji: $('result-emoji'),
    resultTitle: $('result-title'),
    bigScore:    $('big-score'),
    scoreDetail: $('score-detail'),
    scoreComment:$('score-comment'),
    mistakesTitle: $('mistakes-title'),
    mistakesList:  $('mistakes-list'),
    btnAgain:    $('btn-again'),
    btnHome:     $('btn-home'),
  };

  // ---------- State ----------
  let allVerbs = [];
  let quiz = null; // { items, index, correct, wrong, mistakes, mode }

  // ---------- Helpers ----------
  function show(screen) {
    Object.values(screens).forEach(s => s.classList.remove('active'));
    screens[screen].classList.add('active');
    window.scrollTo(0, 0);
  }

  function shuffle(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  }

  // Normaliseer voor vergelijking: lowercase, trim, spaties samenvoegen, diakritische tekens verwijderen
  function normalize(s) {
    return (s || '')
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  // Antwoord kan meerdere geldige varianten hebben, gescheiden door "/" of ","
  // Als het juiste antwoord "-" is (bestaat niet), dan is een leeg antwoord ook goed.
  function isCorrect(userAnswer, correctAnswer) {
    const u = normalize(userAnswer);
    const noAnswer = normalize(correctAnswer) === '-';
    if (!u) return noAnswer;
    const variants = correctAnswer.split(/[\/,]/).map(normalize).filter(Boolean);
    return variants.includes(u);
  }

  function displayAnswer(a) { return a; }

  // ---------- Laden ----------
  async function loadVerbs() {
    try {
      const res = await fetch('werkwoorden.json', { cache: 'no-cache' });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const data = await res.json();
      allVerbs = Array.isArray(data) ? data : (data.werkwoorden || []);
      if (!allVerbs.length) throw new Error('Geen werkwoorden gevonden');
      el.loadStatus.textContent = allVerbs.length + ' werkwoorden geladen ✓';
      el.btnStart.disabled = false;
    } catch (err) {
      console.error(err);
      el.loadStatus.textContent = '⚠️ Kon werkwoorden niet laden: ' + err.message;
      el.btnStart.disabled = true;
    }
  }

  // ---------- Quiz besturing ----------
  function startQuiz() {
    const mode = el.selMode.value; // 'both' | 'ovt' | 'vd'
    const countRaw = el.selCount.value;
    const shuffled = shuffle(allVerbs);
    const count = countRaw === 'all' ? shuffled.length : Math.min(parseInt(countRaw, 10), shuffled.length);
    const items = shuffled.slice(0, count).map(v => ({
      verb: v,
      attempts: 0,       // aantal foute pogingen
      status: 'pending', // 'pending' | 'correct' | 'wrong'
      userOvt: '',
      userVd: '',
    }));
    quiz = {
      items,
      index: 0,
      correct: 0,
      wrong: 0,
      mistakes: [],
      mode,
    };
    // Toon/verberg juiste velden
    const showOvt = mode === 'both' || mode === 'ovt';
    const showVd  = mode === 'both' || mode === 'vd';
    el.fieldOvt.classList.toggle('hidden', !showOvt);
    el.fieldVd.classList.toggle('hidden', !showVd);
    el.askLabel.textContent =
      mode === 'ovt' ? 'Geef de o.v.t. (ik-vorm)' :
      mode === 'vd'  ? 'Geef het voltooid deelwoord' :
                       'Geef de o.v.t. én het voltooid deelwoord';

    show('quiz');
    renderQuestion();
  }

  function renderQuestion() {
    const item = quiz.items[quiz.index];
    const v = item.verb;
    el.infinitief.textContent = v.infinitief;
    // Geen sterk/zwak/onregelmatig label tonen bij de vraag — dat maakt het te gemakkelijk.
    el.verbType.textContent = '';
    el.verbType.style.display = 'none';

    el.inputOvt.value = '';
    el.inputVd.value = '';
    el.inputOvt.classList.remove('ok', 'wrong', 'warn');
    el.inputVd.classList.remove('ok', 'wrong', 'warn');
    el.inputOvt.disabled = false;
    el.inputVd.disabled  = false;

    el.feedback.textContent = '';
    el.feedback.className = 'feedback';
    el.btnCheck.classList.remove('hidden');
    el.btnCheck.disabled = false;
    el.btnNext.classList.add('hidden');

    el.progressTxt.textContent = (quiz.index + 1) + ' / ' + quiz.items.length;
    el.scoreTxt.textContent = '✓ ' + quiz.correct + '  ✗ ' + quiz.wrong;
    el.progressBar.style.width = (quiz.index / quiz.items.length * 100) + '%';

    // Focus eerste zichtbare veld
    setTimeout(() => {
      if (!el.fieldOvt.classList.contains('hidden')) el.inputOvt.focus();
      else el.inputVd.focus();
    }, 50);
  }

  function checkAnswer(e) {
    if (e) e.preventDefault();
    const item = quiz.items[quiz.index];
    const v = item.verb;
    const mode = quiz.mode;
    const needOvt = mode === 'both' || mode === 'ovt';
    const needVd  = mode === 'both' || mode === 'vd';

    const userOvt = el.inputOvt.value;
    const userVd  = el.inputVd.value;
    item.userOvt = userOvt;
    item.userVd  = userVd;

    const ovtOk = !needOvt || isCorrect(userOvt, v.ovt_ev);
    const vdOk  = !needVd  || isCorrect(userVd,  v.vd);
    const allOk = ovtOk && vdOk;

    // Markeer velden
    if (needOvt) el.inputOvt.classList.add(ovtOk ? 'ok' : 'wrong');
    if (needVd)  el.inputVd.classList.add(vdOk ? 'ok' : 'wrong');

    if (allOk) {
      item.status = 'correct';
      quiz.correct++;
      el.feedback.className = 'feedback show good';
      el.feedback.innerHTML = '✅ <strong>Juist!</strong>';
      lockAndAdvance();
      return;
    }

    // Fout
    item.attempts++;
    if (item.attempts === 1) {
      // Eén extra poging
      el.feedback.className = 'feedback show warn';
      el.feedback.innerHTML = '⚠️ <strong>Bijna!</strong> Nog één poging.';
      // Reset alleen de foute velden zodat de gebruiker opnieuw kan proberen
      if (needOvt && !ovtOk) {
        el.inputOvt.classList.remove('wrong');
        el.inputOvt.classList.add('warn');
        el.inputOvt.value = '';
      }
      if (needVd && !vdOk) {
        el.inputVd.classList.remove('wrong');
        el.inputVd.classList.add('warn');
        el.inputVd.value = '';
      }
      setTimeout(() => {
        if (needOvt && !ovtOk) el.inputOvt.focus();
        else if (needVd && !vdOk) el.inputVd.focus();
      }, 50);
      return;
    }

    // Tweede fout: toon antwoord
    item.status = 'wrong';
    quiz.wrong++;
    quiz.mistakes.push({
      infinitief: v.infinitief,
      type: v.type,
      needOvt, needVd,
      userOvt: item.userOvt,
      userVd:  item.userVd,
      correctOvt: v.ovt_ev,
      correctVd:  v.vd,
      ovtOk, vdOk,
    });
    let html = '❌ <strong>Fout.</strong> Het juiste antwoord is:<br>';
    if (needOvt) html += '• o.v.t.: <strong>' + displayAnswer(v.ovt_ev) + '</strong> (mv: ' + displayAnswer(v.ovt_mv) + ')<br>';
    if (needVd)  html += '• voltooid deelwoord: <strong>' + displayAnswer(v.vd) + '</strong>';
    el.feedback.className = 'feedback show bad';
    el.feedback.innerHTML = html;
    lockAndAdvance();
  }

  function lockAndAdvance() {
    el.inputOvt.disabled = true;
    el.inputVd.disabled  = true;
    el.btnCheck.classList.add('hidden');
    el.btnNext.classList.remove('hidden');
    el.scoreTxt.textContent = '✓ ' + quiz.correct + '  ✗ ' + quiz.wrong;
    setTimeout(() => el.btnNext.focus(), 50);
  }

  function nextQuestion() {
    quiz.index++;
    if (quiz.index >= quiz.items.length) {
      finishQuiz();
    } else {
      renderQuestion();
    }
  }

  // ---------- Resultaat ----------
  function finishQuiz() {
    const total = quiz.items.length;
    const correct = quiz.correct;
    const pct = total === 0 ? 0 : Math.round((correct / total) * 100);
    el.bigScore.textContent = pct + '%';
    el.scoreDetail.textContent = correct + ' van ' + total + ' juist';

    let emoji, title, comment;
    if (pct === 100)      { emoji = '🏆'; title = 'Perfect!';       comment = 'Foutloos! Jij bent een werkwoordenkampioen!'; }
    else if (pct >= 90)   { emoji = '🌟'; title = 'Uitstekend!';    comment = 'Bijna perfect — geweldig gedaan!'; }
    else if (pct >= 75)   { emoji = '🎉'; title = 'Heel goed!';     comment = 'Prima resultaat, blijf oefenen!'; }
    else if (pct >= 60)   { emoji = '👍'; title = 'Goed bezig!';    comment = 'Nog even doorzetten en je hebt het onder de knie.'; }
    else if (pct >= 40)   { emoji = '💪'; title = 'Op de goede weg'; comment = 'Oefening baart kunst — probeer het nog eens!'; }
    else                  { emoji = '📖'; title = 'Blijf oefenen';   comment = 'Bekijk de fouten en probeer opnieuw.'; }
    el.resultEmoji.textContent = emoji;
    el.resultTitle.textContent = title;
    el.scoreComment.textContent = comment;

    // Fouten lijst
    el.mistakesList.innerHTML = '';
    if (quiz.mistakes.length === 0) {
      el.mistakesTitle.textContent = 'Geen fouten 🎊';
      const li = document.createElement('li');
      li.className = 'm-empty';
      li.textContent = 'Je hebt alles juist beantwoord!';
      el.mistakesList.appendChild(li);
    } else {
      el.mistakesTitle.textContent = 'Fouten (' + quiz.mistakes.length + ')';
      quiz.mistakes.forEach(m => {
        const li = document.createElement('li');
        const parts = ['<div class="m-inf">' + m.infinitief + (m.type ? ' <span class="badge">' + m.type + '</span>' : '') + '</div>'];
        if (m.needOvt) {
          parts.push(
            '<div class="m-row"><span>o.v.t.</span>' +
            (m.userOvt ? '<span class="wrong-a">' + escapeHtml(m.userOvt) + '</span>' : '<span class="wrong-a">(leeg)</span>') +
            '<span class="right-a">' + escapeHtml(m.correctOvt) + '</span></div>'
          );
        }
        if (m.needVd) {
          parts.push(
            '<div class="m-row"><span>v.d.</span>' +
            (m.userVd ? '<span class="wrong-a">' + escapeHtml(m.userVd) + '</span>' : '<span class="wrong-a">(leeg)</span>') +
            '<span class="right-a">' + escapeHtml(m.correctVd) + '</span></div>'
          );
        }
        li.innerHTML = parts.join('');
        el.mistakesList.appendChild(li);
      });
    }
    show('result');
  }

  function escapeHtml(s) {
    return (s || '').replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ---------- Events ----------
  el.btnStart.addEventListener('click', startQuiz);
  el.form.addEventListener('submit', checkAnswer);
  el.btnNext.addEventListener('click', nextQuestion);
  el.btnAgain.addEventListener('click', startQuiz);
  el.btnHome.addEventListener('click', () => show('start'));

  // Enter in eerste veld → naar tweede veld (indien beide zichtbaar en tweede leeg)
  el.inputOvt.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && quiz && quiz.mode === 'both') {
      if (!el.inputVd.disabled && !el.inputVd.value) {
        e.preventDefault();
        el.inputVd.focus();
      }
    }
  });

  // ---------- Service worker ----------
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch(err => console.warn('SW registratie mislukt:', err));
    });
  }

  // ---------- Init ----------
  el.btnStart.disabled = true;
  loadVerbs();
})();
