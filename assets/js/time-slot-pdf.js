// One A4 page. Rasterizing the local text preserves Cyrillic when opened via file://.
function downloadBookingPdf({ rows, price, deadline, reference }) {
  const canvas = document.createElement('canvas');
  canvas.width = 1240;
  canvas.height = 1754;
  const pen = canvas.getContext('2d');
  pen.fillStyle = '#fff';
  pen.fillRect(0, 0, canvas.width, canvas.height);
  pen.textBaseline = 'top';
  let y = 84;
  function line(text, size, color = '#222', weight = 400) {
    pen.fillStyle = color;
    pen.font = weight + ' ' + size + 'px "PF BeauSans Pro", Arial, sans-serif';
    pen.fillText(text, 88, y);
    y += size * 1.5;
  }
  line('C.I.T.  /  TIME-СЛОТ', 24, '#932934', 700);
  line('Гарантированное обслуживание', 46, '#222', 700);
  line('Демонстрационная заявка · без бронирования', 26);
  line(reference, 24);
  y += 30;
  for (const [title, value] of rows) {
    line(title.toUpperCase(), 20, '#666');
    value.split('\n').forEach(part => line(part, 30));
    y += 14;
  }
  line('Стоимость: ' + price, 32, '#932934', 700);
  y += 22;
  line('Условия обслуживания', 30, '#222', 700);
  line('Заключить договор до ' + deadline + ' (Екатеринбург).', 24);
  line('Авансовый платёж — 100% стоимости услуги.', 24);
  line('Для получения контейнера нужен оригинал доверенности.', 24);

  const jpeg = Uint8Array.from(atob(canvas.toDataURL('image/jpeg', 0.92).split(',')[1]), c => c.charCodeAt(0));
  const encoder = new TextEncoder();
  const chunks = [];
  const offsets = [0];
  let length = 0;
  function append(value) {
    const bytes = typeof value === 'string' ? encoder.encode(value) : value;
    chunks.push(bytes);
    length += bytes.length;
  }
  function object(id, ...parts) {
    offsets[id] = length;
    append(id + ' 0 obj\n');
    parts.forEach(append);
    append('\nendobj\n');
  }
  append('%PDF-1.4\n');
  object(1, '<< /Type /Catalog /Pages 2 0 R >>');
  object(2, '<< /Type /Pages /Kids [3 0 R] /Count 1 >>');
  object(3, '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /XObject << /Sheet 4 0 R >> >> /Contents 5 0 R >>');
  object(4, '<< /Type /XObject /Subtype /Image /Width 1240 /Height 1754 /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ' + jpeg.length + ' >>\nstream\n', jpeg, '\nendstream');
  const draw = 'q 595 0 0 842 0 0 cm /Sheet Do Q\n';
  object(5, '<< /Length ' + draw.length + ' >>\nstream\n' + draw + 'endstream');
  const start = length;
  append('xref\n0 6\n0000000000 65535 f \n');
  offsets.slice(1).forEach(offset => append(String(offset).padStart(10, '0') + ' 00000 n \n'));
  append('trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n' + start + '\n%%EOF\n');
  const url = URL.createObjectURL(new Blob(chunks, { type: 'application/pdf' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = 'time-slot.pdf';
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
