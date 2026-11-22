(() => {
  const form = document.querySelector('.plate-form');
  if (!form) return;

  const input = form.elements.namedItem('plate');
  const error = document.getElementById('plate-error');
  const summary = document.querySelector('.plate-history__summary');
  const records = document.querySelector('.plate-history__records');
  const exampleSummary = summary.cloneNode(true);
  const latinLetters = 'ABEKMHOPCTYX';
  const russianLetters = 'АВЕКМНОРСТУХ';

  function normalize(value) {
    return value.toUpperCase().replace(/[\s-]/g, '').replace(/[ABEKMHOPCTYX]/g,
      letter => russianLetters[latinLetters.indexOf(letter)]);
  }

  input.addEventListener('input', () => {
    const value = normalize(input.value);
    if (input.value !== value) {
      const cursor = normalize(input.value.slice(0, input.selectionStart)).length;
      input.value = value;
      input.setSelectionRange(cursor, cursor);
    }
    input.removeAttribute('aria-invalid');
    error.hidden = true;
    records.hidden = true;
    summary.textContent = '';
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    const plate = normalize(input.value);
    if (!/^[АВЕКМНОРСТУХ]\d{3}[АВЕКМНОРСТУХ]{2}\d{2,3}$/.test(plate)) {
      records.hidden = true;
      summary.textContent = '';
      input.setAttribute('aria-invalid', 'true');
      error.textContent = 'Введите номер в формате А123ВС96 или А123ВС196.';
      error.hidden = false;
      input.focus();
      return;
    }

    error.hidden = true;
    input.removeAttribute('aria-invalid');
    records.hidden = plate !== records.dataset.plate;
    if (records.hidden) {
      summary.textContent = 'В демонстрационной истории нет записей для этого номера.';
    } else {
      summary.replaceChildren(...exampleSummary.cloneNode(true).childNodes);
    }
  });
})();
