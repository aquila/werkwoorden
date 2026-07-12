/* Franse werkwoorden PWA - quiz logica */
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
    loadStatus:   $('load-status'),
    btnStart:     $('btn-start'),
    selCount:     $('select-count'),

    progressBar:  $('progress-bar'),
    progressTxt:  $('progress-text'),
    scoreTxt:     $('score-text'),
    nlVerb:       $('nl-verb'),
    frInfinitif:  $('fr-infinitif'),
    personLabel:  $('person-label'),
    form:         $('answer-form'),
    inputAnswer:  $('input-answer'),
    btnCheck:     $('btn-check'),
    btnNext:      $('btn-next'),
    feedback:     $('feedback'),

    resultEmoji:  $('result-emoji'),
    resultTitle:  $('result-title'),
    bigScore:     $('big-score'),
    scoreDetail:  $('score-detail'),
    scoreComment: $('score-comment'),
    mistakesTitle:$('mistakes-title'),
    mistakesList: $('mistakes-list'),
    btnAgain:     $('btn-again'),
    btnHome:      $('btn-home'),
  };

  // ---------- Persoon-definities ----------
  const PERSONS = [
    { key: '1s', pronoun: 'je',        label: '1e persoon enkelvoud',  short: '1e enk.' },
    { key: '2s', pronoun: 'tu',        label: '2e persoon enkelvoud',  short: '2e enk.' },
    { key: '3s', pronoun: 'il/elle',   label: '3e persoon enkelvoud',  short: '3e enk.' },
    { key: '1p', pronoun: 'nous',      label: '1e persoon meervoud',   short: '1e mv.' },
    { key: '2p', pronoun: 'vous',      label: '2e persoon meervoud',   short: '2e mv.' },
    { key: '3p', pronoun: 'ils/elles', label: '3e persoon meervoud',   short: '3e mv.' },
  ];
  const PERSON_BY_KEY = Object.fromEntries(PERSONS.map(p => [p.key, p]));

  // ---------- State ----------
  let allVerbs = [];
  let quiz = null; // { items, index, correct, wrong, mistakes }

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

  // Normaliseer voor vergelijking: lowercase, trim, diakritische tekens weg,
  // en optioneel voorvoegsel-voornaamwoord (je/j'/tu/il/elle/on/nous/vous/ils/elles) weghalen.
  function normalize(s) {
    return (s || '')
      .toString()
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' ')
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  }

  function stripPronoun(s) {
    // Verwijder een eventueel meegetypt persoonlijk voornaamwoord vooraan
    // Bv. "je vais" -> "vais", "j'ai" -> "ai", "il/elle a" -> "a".
    return s
      .replace(/^(j['’]|je\s+|tu\s+|il\s+|elle\s+|on\s+|il\/elle\s+|nous\s+|vous\s+|ils\s+|elles\s+|ils\/elles\s+)/, '')
      .trim();
  }

  function isCorrect(userAnswer, correctAnswer) {
    const u = stripPronoun(normalize(userAnswer));
    if (!u) return false;
    const variants = correctAnswer.split(/[\/,]/).map(v => stripPronoun(normalize(v))).filter(Boolean);
    return variants.includes(u);
  }

  // ---------- Laden ----------
  async function loadVerbs() {
    try {
      const res = await fetch('frans.json', { cache: 'no-cache' });
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
  function buildQuestions(count) {
    // Kies willekeurige (werkwoord, persoon) combinaties zonder herhaling.
    const combos = [];
    for (const v of allVerbs) {
      for (const p of PERSONS) {
        combos.push({ verb: v, person: p });
      }
    }
    const shuffled = shuffle(combos);
    const n = count === 'all' ? shuffled.length : Math.min(parseInt(count, 10), shuffled.length);
    return shuffled.slice(0, n).map(c => ({
      verb: c.verb,
      person: c.person,
      attempts: 0,
      status: 'pending',
      userAnswer: '',
    }));
  }

  function startQuiz() {
    const items = buildQuestions(el.selCount.value);
    quiz = { items, index: 0, correct: 0, wrong: 0, mistakes: [] };
    show('quiz');
    renderQuestion();
  }

  function renderQuestion() {
    const item = quiz.items[quiz.index];
    const v = item.verb;
    const p = item.person;

    el.nlVerb.textContent = v.nl;
    el.frInfinitif.textContent = v.infinitif;
    el.personLabel.textContent = p.pronoun + '  (' + p.label + ')';

    el.inputAnswer.value = '';
    el.inputAnswer.classList.remove('ok', 'wrong', 'warn');
    el.inputAnswer.disabled = false;
    el.inputAnswer.placeholder = 'vervoeging na "' + p.pronoun + '"';

    el.feedback.textContent = '';
    el.feedback.className = 'feedback';
    el.btnCheck.classList.remove('hidden');
    el.btnCheck.disabled = false;
    el.btnNext.classList.add('hidden');

    el.progressTxt.textContent = (quiz.index + 1) + ' / ' + quiz.items.length;
    el.scoreTxt.textContent = '✓ ' + quiz.correct + '  ✗ ' + quiz.wrong;
    el.progressBar.style.width = (quiz.index / quiz.items.length * 100) + '%';

    requestAnimationFrame(() => el.inputAnswer.focus());
  }

  function conjugationTableHtml(verb, highlightKey) {
    const rows = PERSONS.map(p => {
      const form = verb.present[p.key];
      const isHi = p.key === highlightKey;
      return '<tr' + (isHi ? ' class="hi"' : '') + '>' +
        '<td class="pron">' + escapeHtml(p.pronoun) + '</td>' +
        '<td class="form">' + escapeHtml(form) + '</td>' +
        '</tr>';
    }).join('');
    return '<table class="conj-table"><tbody>' + rows + '</tbody></table>';
  }

  function checkAnswer(e) {
    if (e) e.preventDefault();
    const item = quiz.items[quiz.index];
    const v = item.verb;
    const p = item.person;
    const correctForm = v.present[p.key];

    const userAnswer = el.inputAnswer.value;
    item.userAnswer = userAnswer;

    const ok = isCorrect(userAnswer, correctForm);
    el.inputAnswer.classList.add(ok ? 'ok' : 'wrong');

    if (ok) {
      item.status = 'correct';
      quiz.correct++;
      el.feedback.className = 'feedback show good';
      el.feedback.innerHTML = '✅ <strong>Juist!</strong> ' +
        escapeHtml(p.pronoun) + ' ' + escapeHtml(correctForm) +
        '<div class="conj-wrap">' + conjugationTableHtml(v, p.key) + '</div>';
      lockAndAdvance();
      return;
    }

    item.attempts++;
    if (item.attempts === 1) {
      el.feedback.className = 'feedback show warn';
      el.feedback.innerHTML = '⚠️ <strong>Bijna!</strong> Nog één poging.';
      el.inputAnswer.classList.remove('wrong');
      el.inputAnswer.classList.add('warn');
      el.inputAnswer.value = '';
      requestAnimationFrame(() => el.inputAnswer.focus());
      return;
    }

    // Tweede fout: toon antwoord + volledige vervoegingstabel
    item.status = 'wrong';
    quiz.wrong++;
    quiz.mistakes.push({
      nl: v.nl,
      infinitif: v.infinitif,
      personShort: p.short,
      pronoun: p.pronoun,
      personKey: p.key,
      userAnswer: item.userAnswer,
      correctForm: correctForm,
      present: v.present,
    });
    el.feedback.className = 'feedback show bad';
    el.feedback.innerHTML = '❌ <strong>Fout.</strong> Het juiste antwoord is: ' +
      '<strong>' + escapeHtml(p.pronoun) + ' ' + escapeHtml(correctForm) + '</strong>' +
      '<div class="conj-wrap"><div class="conj-title">Volledige présent-vervoeging van <em>' +
      escapeHtml(v.infinitif) + '</em></div>' +
      conjugationTableHtml(v, p.key) + '</div>';
    lockAndAdvance();
  }

  function lockAndAdvance() {
    el.inputAnswer.disabled = true;
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
    if (pct === 100)      { emoji = '🏆'; title = 'Parfait!';        comment = 'Foutloos! Chapeau!'; }
    else if (pct >= 90)   { emoji = '🌟'; title = 'Excellent!';      comment = 'Bijna perfect — geweldig gedaan!'; }
    else if (pct >= 75)   { emoji = '🎉'; title = 'Très bien!';      comment = 'Prima resultaat, blijf oefenen!'; }
    else if (pct >= 60)   { emoji = '👍'; title = 'Pas mal!';        comment = 'Nog even doorzetten en je hebt het onder de knie.'; }
    else if (pct >= 40)   { emoji = '💪'; title = 'Op de goede weg'; comment = 'Oefening baart kunst — probeer het nog eens!'; }
    else                  { emoji = '📖'; title = 'Blijf oefenen';   comment = 'Bekijk de fouten en probeer opnieuw.'; }
    el.resultEmoji.textContent = emoji;
    el.resultTitle.textContent = title;
    el.scoreComment.textContent = comment;

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
        const parts = [
          '<div class="m-inf">' + escapeHtml(m.nl) + ' → <em>' + escapeHtml(m.infinitif) + '</em> <span class="badge">' + escapeHtml(m.personShort) + '</span></div>',
          '<div class="m-row"><span>' + escapeHtml(m.pronoun) + '</span>' +
            (m.userAnswer ? '<span class="wrong-a">' + escapeHtml(m.userAnswer) + '</span>' : '<span class="wrong-a">(leeg)</span>') +
            '<span class="right-a">' + escapeHtml(m.correctForm) + '</span></div>',
          '<div class="conj-wrap">' + conjugationTableHtml({ present: m.present }, m.personKey) + '</div>'
        ];
        li.innerHTML = parts.join('');
        el.mistakesList.appendChild(li);
      });
    }
    show('result');
  }

  function escapeHtml(s) {
    return (s || '').toString().replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }

  // ---------- Events ----------
  el.btnStart.addEventListener('click', startQuiz);
  el.form.addEventListener('submit', checkAnswer);
  el.btnNext.addEventListener('click', nextQuestion);
  el.btnAgain.addEventListener('click', startQuiz);
  el.btnHome.addEventListener('click', () => show('start'));

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
