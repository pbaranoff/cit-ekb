// A reference in the URL identifies one snapshot in the current tab.
// INN and container numbers stay out of the address and browser history URLs.
const timeSlotBooking = {
  save(booking) {
    const id = crypto.randomUUID ? crypto.randomUUID() : Array.from(
      crypto.getRandomValues(new Uint32Array(4)), value => value.toString(16).padStart(8, '0')
    ).join('');
    booking.reference = 'ДЕМО-' + id.slice(0, 8).toUpperCase();
    sessionStorage.setItem('cit.time-slot.' + id, JSON.stringify(booking));
    return id;
  },

  read(id) {
    if (!id || !/^[a-f0-9-]{32,36}$/.test(id)) return null;
    try {
      const booking = JSON.parse(sessionStorage.getItem('cit.time-slot.' + id));
      return booking?.draft && Array.isArray(booking.rows) ? booking : null;
    } catch {
      return null;
    }
  },

  renderRows(list, rows) {
    list.replaceChildren(...rows.map(([title, value]) => {
      const row = document.createElement('div');
      const term = document.createElement('dt');
      const detail = document.createElement('dd');
      term.textContent = title.toUpperCase();
      detail.textContent = value;
      row.append(term, detail);
      return row;
    }));
  }
};
