(() => {
    const STORAGE_KEY = 'fedrampFieldGuide.v1';
    const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
    const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

    function activateTab(tab, moveFocus = false) {
      tabs.forEach((item) => {
        const selected = item === tab;
        item.setAttribute('aria-selected', String(selected));
        item.tabIndex = selected ? 0 : -1;
      });
      panels.forEach((panel) => panel.classList.toggle('active', panel.id === tab.getAttribute('aria-controls')));
      if (moveFocus) tab.focus();
      saveState();
    }

    let savedState = {};
    try { savedState = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}') || {}; }
    catch (error) { savedState = {}; }

    function saveState() {
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify({
          activeTab: document.querySelector('[role="tab"][aria-selected="true"]')?.id || 'tab-overview',
          checklist: checks.map((item) => item.checked),
          quizAnswer: document.querySelector('.choice.correct, .choice.incorrect')?.dataset.answer || null
        }));
      } catch (error) {
        const status = document.getElementById('save-status');
        if (status) status.textContent = 'Saving is unavailable in this browser session.';
      }
    }

    tabs.forEach((tab, index) => {
      tab.addEventListener('click', () => activateTab(tab));
      tab.addEventListener('keydown', (event) => {
        let nextIndex = index;
        if (event.key === 'ArrowRight') nextIndex = (index + 1) % tabs.length;
        else if (event.key === 'ArrowLeft') nextIndex = (index - 1 + tabs.length) % tabs.length;
        else if (event.key === 'Home') nextIndex = 0;
        else if (event.key === 'End') nextIndex = tabs.length - 1;
        else return;
        event.preventDefault();
        activateTab(tabs[nextIndex], true);
      });
    });

    const choices = Array.from(document.querySelectorAll('.choice'));
    const feedback = document.getElementById('answer-feedback');
    const reveal = document.getElementById('activity-reveal');

    choices.forEach((choice) => {
      choice.addEventListener('click', () => {
        choices.forEach((button) => button.classList.remove('correct', 'incorrect'));
        const correct = choice.dataset.answer === 'c';
        choice.classList.add(correct ? 'correct' : 'incorrect');
        feedback.className = 'feedback ' + (correct ? 'good' : 'try');
        feedback.textContent = correct
          ? 'Correct. The agency decides whether its specific use is in scope.'
          : 'Not quite. A broad rule or a quick assumption is not enough. The agency evaluates the specific use case.';
        reveal.classList.toggle('show', correct);
        saveState();
      });
    });

    document.getElementById('reset-activity').addEventListener('click', () => {
      choices.forEach((button) => button.classList.remove('correct', 'incorrect'));
      feedback.textContent = '';
      feedback.className = 'feedback';
      reveal.classList.remove('show');
      saveState();
      choices[0].focus();
    });

    const checks = Array.from(document.querySelectorAll('.checklist input'));
    const fill = document.getElementById('progress-fill');
    const progressText = document.getElementById('progress-text');
    const progressPercent = document.getElementById('progress-percent');
    const progressBar = document.querySelector('[role="progressbar"]');

    function updateProgress() {
      const count = checks.filter((item) => item.checked).length;
      const percent = Math.round((count / checks.length) * 100);
      fill.style.width = percent + '%';
      progressText.textContent = count + ' of ' + checks.length + ' items checked';
      progressPercent.textContent = percent + '%';
      progressBar.setAttribute('aria-valuenow', String(percent));
    }
    checks.forEach((item, index) => {
      item.checked = Boolean(savedState.checklist?.[index]);
      item.addEventListener('change', () => { updateProgress(); saveState(); });
    });
    document.getElementById('clear-checklist').addEventListener('click', () => {
      checks.forEach((item) => { item.checked = false; });
      updateProgress();
      saveState();
    });

    updateProgress();
    const savedTab = tabs.find((tab) => tab.id === savedState.activeTab);
    if (savedTab) activateTab(savedTab);
    const savedAnswer = choices.find((choice) => choice.dataset.answer === savedState.quizAnswer);
    if (savedAnswer) savedAnswer.click();
  })();
