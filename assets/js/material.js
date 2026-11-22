(() => {
  const share = document.querySelector('.material-share');
  const preview = ['localhost', '127.0.0.1', '[::1]'].includes(location.hostname);
  const url = /^https?:$/.test(location.protocol) && !preview
    ? new URL(location.pathname, location.origin).href
    : share.dataset.source;

  for (const link of share.querySelectorAll('a')) {
    const target = new URL(link.href);
    target.searchParams.set('url', url);
    link.href = target.href;
  }
  const copy = share.querySelector('button');
  copy.hidden = false;
  copy.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(url);
      share.querySelector('output').textContent = 'Ссылка скопирована';
    } catch {
      window.prompt('Скопируйте ссылку на материал', url);
    }
  });
})();
