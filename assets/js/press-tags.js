// Only tags assigned in the content markup participate in a local selection.
(() => {
  const tag = new URLSearchParams(location.search).get('tag');
  const labels = new Map([['digital', 'Цифровизация'], ['terminal', 'Умный терминал'], ['media', 'СМИ о нас']]);
  if (!labels.has(tag)) return;
  const summary = document.querySelector('.press-tag-summary');
  summary.hidden = false;
  summary.querySelector('strong').textContent = '#' + labels.get(tag);
  document.querySelectorAll('.press-story').forEach(card => {
    card.hidden = !(card.dataset.tags || '').split(' ').includes(tag);
  });
  document.querySelector('.press-feature').closest('section').hidden = true;
  document.querySelector('.press-pages').hidden = true;
})();
