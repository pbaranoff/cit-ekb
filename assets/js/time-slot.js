(() => {
  'use strict';

  const form = document.getElementById('booking-form');
  const byId = id => document.getElementById(id);
  const operations = [...form.querySelectorAll('.operation')];
  const inn = byId('inn');
  const day = 86400000;
  const yekaterinburgOffset = 5 * 3600000;
  const demoOperationPrice = 4800;
  const starts = [480, 510, 540, 570, 600, 630, 660, 690, 780, 810, 840, 870];
  const occupied = new Set([480, 570, 690]);
  const priceFormat = new Intl.NumberFormat('ru-RU', { style: 'currency', currency: 'RUB' });
  // Dates below are UTC midnights representing calendar days in Yekaterinburg.
  const today = () => Math.floor((Date.now() + yekaterinburgOffset) / day) * day;
  let selectedDate = today() + 2 * day;
  let selectedTime = 600;
  let month = firstOfMonth(selectedDate);

  function firstOfMonth(date, offset = 0) {
    const d = new Date(date);
    return Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + offset, 1);
  }
  function formatDate(date, options = {}) {
    return new Date(date).toLocaleDateString('ru-RU', { timeZone: 'UTC', ...options });
  }
  function clock(minutes) {
    return [Math.floor(minutes / 60), minutes % 60].map(n => String(n).padStart(2, '0')).join(':');
  }
  function available(date, minutes) {
    return date > today() && !occupied.has(minutes) &&
      date + minutes * 60000 - yekaterinburgOffset >= Date.now() + day;
  }
  function drawCalendar() {
    byId('month-label').textContent = formatDate(month, { month: 'long', year: 'numeric' }).replace(' г.', '');
    form.querySelector('[data-month="-1"]').disabled = month <= firstOfMonth(today());
    const days = document.createDocumentFragment();
    for (let date = month; date < firstOfMonth(month, 1); date += day) {
      const cell = document.createElement('button');
      cell.type = 'button';
      cell.textContent = new Date(date).getUTCDate();
      if (date === month) cell.style.gridColumnStart = (new Date(month).getUTCDay() + 6) % 7 + 1;
      cell.dataset.date = date;
      cell.setAttribute('aria-label', formatDate(date, { dateStyle: 'full' }));
      cell.setAttribute('aria-pressed', String(date === selectedDate));
      cell.disabled = !starts.some(minutes => available(date, minutes));
      days.append(cell);
    }
    byId('calendar-days').replaceChildren(days);
    byId('date-label').textContent = formatDate(selectedDate, { day: 'numeric', month: 'long', year: 'numeric' }) +
      ', ' + formatDate(selectedDate, { weekday: 'long' });
  }
  function drawSlots() {
    byId('slots-hint').textContent = 'Слоты по 30 минут на ' + formatDate(selectedDate) + '. Время указано местное (Екатеринбург, UTC+5).';
    const slots = starts.map(minutes => {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.minutes = minutes;
      button.disabled = !available(selectedDate, minutes);
      button.setAttribute('aria-pressed', String(selectedTime === minutes));
      const label = document.createElement('small');
      label.textContent = button.disabled ? 'недоступен' : 'свободен';
      if (occupied.has(minutes)) label.textContent = 'занят';
      if (selectedTime === minutes) label.textContent = 'выбран';
      button.append('с ' + clock(minutes) + ' до ' + clock(minutes + 30), label);
      return button;
    });
    byId('slots').replaceChildren(...slots);
  }
  function selectedOperations() {
    return operations.filter(row => row.querySelector('.operation-toggle').checked).map(row => {
      const value = row.querySelector('.booking-code input').value;
      const numberless = row.querySelector('.no-number')?.checked;
      let detail = value.replace(/^([A-Z]{4})(\d+)/, '$1 $2') || 'Введите номер контейнера';
      if (numberless) detail = 'безномерное обслуживание';
      return row.dataset.name + '\n' + detail;
    });
  }
  function summaryRows() {
    const rows = [
      ['ИНН', inn.value || '—'],
      ['Дата обслуживания', formatDate(selectedDate) + ', ' + formatDate(selectedDate, { weekday: 'long' })],
      ['Слот прибытия', selectedTime === null ? 'Выберите время' : clock(selectedTime) + ' – ' + clock(selectedTime + 30)]
    ];
    selectedOperations().forEach((value, index) => rows.push(['Операция ' + (index + 1), value]));
    return rows;
  }
  function drawSummary() {
    timeSlotBooking.renderRows(byId('booking-details'), summaryRows());
    byId('booking-price').textContent = priceFormat.format(selectedOperations().length * demoOperationPrice);
    inn.parentElement.classList.toggle('inn-short', inn.value.length <= 10);
    byId('booking-error').hidden = true;
  }
  function syncOperation(row) {
    const enabled = row.querySelector('.operation-toggle').checked;
    row.querySelector('.operation__details').hidden = !enabled;
    const unnumbered = row.querySelector('.no-number');
    if (unnumbered) unnumbered.disabled = !enabled;
    row.querySelector('.booking-code input').disabled = !enabled || Boolean(unnumbered?.checked);
  }
  form.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (!button || button.disabled) return;
    if (button.dataset.month) {
      month = firstOfMonth(month, Number(button.dataset.month));
      drawCalendar();
    } else if (button.dataset.date) {
      const date = Number(button.dataset.date);
      if (date !== selectedDate) selectedTime = null;
      selectedDate = date;
      drawCalendar();
      drawSlots();
      byId('calendar-days').querySelector('[aria-pressed=true]').focus({ preventScroll: true });
      drawSummary();
    } else if (button.dataset.minutes) {
      selectedTime = Number(button.dataset.minutes);
      drawSlots();
      byId('slots').querySelector('[aria-pressed=true]').focus({ preventScroll: true });
      drawSummary();
    }
  });
  form.addEventListener('input', event => {
    const input = event.target;
    if (input.matches('.booking-code input')) {
      const normalized = input === inn ? input.value.replace(/\D/g, '') : input.value.toUpperCase().replace(/\s/g, '');
      if (normalized !== input.value) {
        const position = Math.max(0, input.selectionStart - (input.value.length - normalized.length));
        input.value = normalized;
        input.setSelectionRange(position, position);
      }
    }
    const row = input.closest('.operation');
    if (row) syncOperation(row);
    drawSummary();
  });

  form.addEventListener('submit', event => {
    event.preventDefault();
    let message = '';
    let target;
    if (!selectedOperations().length) {
      message = 'Выберите хотя бы одну операцию.';
      target = form.querySelector('.operation-toggle');
    } else if (selectedTime === null || !available(selectedDate, selectedTime)) {
      selectedTime = null;
      drawSlots();
      drawCalendar();
      drawSummary();
      message = 'Выберите доступную дату и время прибытия.';
      target = byId('slots').querySelector('button:not(:disabled)') || form.querySelector('[data-month="1"]');
    }
    if (message) {
      byId('booking-error').textContent = message;
      byId('booking-error').hidden = false;
      target.focus();
      return;
    }
    const deadline = formatDate(selectedDate - day) + ', ' + clock(selectedTime);
    const price = byId('booking-price').textContent;
    const draft = {
      inn: inn.value, date: selectedDate, minutes: selectedTime,
      operations: operations.map(row => ({
        enabled: row.querySelector('.operation-toggle').checked,
        value: row.querySelector('.booking-code input').value,
        numberless: Boolean(row.querySelector('.no-number')?.checked)
      }))
    };
    let id;
    try {
      id = timeSlotBooking.save({ rows: summaryRows(), price, deadline, draft });
    } catch {
      byId('booking-error').textContent = 'Не удалось сохранить заявку. Разрешите хранение данных для этой страницы и попробуйте ещё раз.';
      byId('booking-error').hidden = false;
      return;
    }
    location.assign('time-slot-confirmation.html?id=' + encodeURIComponent(id));
  });

  const saved = timeSlotBooking.read(new URLSearchParams(location.search).get('edit'));
  if (saved) {
    const draft = saved.draft;
    inn.value = draft.inn;
    selectedDate = draft.date > today() ? draft.date : today() + day;
    selectedTime = available(selectedDate, draft.minutes) && selectedDate === draft.date ? draft.minutes : null;
    month = firstOfMonth(selectedDate);
    operations.forEach((row, index) => {
      const entry = draft.operations[index];
      row.querySelector('.operation-toggle').checked = entry.enabled;
      row.querySelector('.booking-code input').value = entry.value;
      const unnumbered = row.querySelector('.no-number');
      if (unnumbered) unnumbered.checked = entry.numberless;
    });
  }
  operations.forEach(syncOperation);
  drawCalendar();
  drawSlots();
  drawSummary();
  document.querySelector('.booking-submit').disabled = false;
})();
