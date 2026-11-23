(() => {
  const byId = id => document.getElementById(id);
  const id = new URLSearchParams(location.search).get('id');
  const receipt = timeSlotBooking.read(id);
  document.querySelector('.service-links a[href="time-slot.html"]').setAttribute('aria-current', 'location');
  if (!receipt) return;

  byId('time-slot-title').textContent = 'Заявка принята к исполнению';
  byId('receipt-lead').textContent = 'Уважаемый незарегистрированный пользователь! Ваша заявка на гарантированное обслуживание принята к исполнению на следующих условиях.';
  timeSlotBooking.renderRows(byId('booking-details'), receipt.rows);
  byId('booking-price').textContent = receipt.price;
  byId('contract-deadline').textContent = 'до ' + receipt.deadline;
  byId('advance').textContent = receipt.price;
  byId('receipt-reference').textContent = 'Демонстрационная заявка № ' + receipt.reference;
  byId('edit-booking').href = 'time-slot.html?edit=' + encodeURIComponent(id);
  byId('download').addEventListener('click', () => downloadBookingPdf(receipt));
  byId('start-booking').hidden = true;
  byId('confirmation').hidden = false;
})();
