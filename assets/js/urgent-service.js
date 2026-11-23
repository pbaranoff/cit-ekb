(() => {
  const page = document.querySelector('.urgent-service');
  const receipt = document.querySelector('.urgent-receipt');
  if (!page || !receipt) return;

  const showExample = new URLSearchParams(location.search).get('results') === '1';
  if (showExample) {
    const exampleLink = page.querySelector('.urgent-example');
    exampleLink.href = 'urgent-service.html';
    exampleLink.textContent = 'Вернуться к пустой форме';
  }

  function resetOffer(result) {
    const select = result.querySelector('select');
    if (!select) return;
    select.selectedIndex = 0;
    result.querySelector('.offer-time').textContent = select.selectedOptions[0].textContent;
    result.querySelector('.offer-picker').hidden = true;
    result.querySelector('[data-change-slot]').setAttribute('aria-expanded', 'false');
  }

  page.querySelectorAll('.urgent-operation').forEach(operation => {
    const form = operation.querySelector('form');
    const result = operation.querySelector('.urgent-result');
    const calculate = form.querySelector('.calculate');
    const input = form.elements.namedItem('container');

    function setResultVisible(visible) {
      result.hidden = !visible;
      calculate.setAttribute('aria-expanded', String(visible));
      if (visible) resetOffer(result);
    }

    calculate.disabled = false;
    if (showExample) {
      if (input) input.value = input.dataset.example;
      setResultVisible(true);
    }
    input?.addEventListener('input', () => {
      const normalize = value => value.replace(/\s+/g, '').toUpperCase();
      const position = normalize(input.value.slice(0, input.selectionStart)).length;
      if (input.value !== normalize(input.value)) {
        input.value = normalize(input.value);
        input.setSelectionRange(position, position);
      }
      input.setCustomValidity(input.validity.patternMismatch ? 'Введите 4 латинские буквы и 7 цифр, например MSKU1234567.' : '');
      setResultVisible(input.value !== '' && input.validity.valid);
    });
    form.addEventListener('submit', event => {
      event.preventDefault();
      setResultVisible(true);
      result.focus({ preventScroll: true });
      result.scrollIntoView({ block: 'nearest' });
    });

    const select = result.querySelector('select');
    if (!select) return;
    const change = result.querySelector('[data-change-slot]');
    const picker = result.querySelector('.offer-picker');
    change.addEventListener('click', () => {
      picker.hidden = !picker.hidden;
      change.setAttribute('aria-expanded', String(!picker.hidden));
      if (!picker.hidden) select.focus();
    });
    select.addEventListener('change', () => {
      result.querySelector('.offer-time').textContent = select.selectedOptions[0].textContent;
    });
    result.querySelector('[data-book]').addEventListener('click', () => {
      const values = {
        operation: form.querySelector('h3').textContent,
        number: input?.value.replace(/^([A-Z]{4})/, '$1 ') || 'Для приёма номер не требуется',
        time: result.querySelector('time').textContent + ', ' + select.selectedOptions[0].textContent + ' (Екатеринбург)',
        price: result.querySelector('.offer-price').textContent
      };
      receipt.querySelectorAll('[data-summary]').forEach(field => {
        field.textContent = values[field.dataset.summary];
      });
      receipt.showModal();
      document.body.classList.add('is-media-open');
    });
  });
  receipt.addEventListener('close', () => {
    if (!receipt.open) document.body.classList.remove('is-media-open');
  });
})();
