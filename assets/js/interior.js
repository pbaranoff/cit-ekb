/* Content-page tools and image viewer; shares the existing header/search behavior. */
(() => {
  'use strict';

  const tools = document.querySelector('.page-tools');
  const mobile = window.matchMedia('(max-width: 1359px)');
  const syncTools = () => {
    if (tools) tools.open = !mobile.matches;
  };
  syncTools();
  mobile.addEventListener('change', syncTools);

  const viewer = document.querySelector('#media-viewer');
  if (!viewer) return;
  const image = viewer.querySelector('img[data-viewer-image]');
  let trigger = null;

  document.querySelectorAll('a[data-media-viewer]').forEach(link => {
    link.addEventListener('click', event => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
      event.preventDefault();
      trigger = link;
      image.src = link.href;
      image.alt = link.querySelector('img:not([aria-hidden])')?.alt || 'Фотография терминала';
      viewer.showModal();
      document.body.classList.add('is-media-open');
    });
  });

  const releaseViewer = () => {
    // Ignore a delayed close event if another image has already been opened.
    if (viewer.open) return;
    document.body.classList.remove('is-media-open');
    trigger?.focus({ preventScroll: true });
    trigger = null;
    image.removeAttribute('src');
  };
  const closeViewer = () => {
    viewer.close();
    // Release scroll immediately; the native close event may be queued until rendering.
    releaseViewer();
  };
  viewer.querySelector('[data-viewer-close]').addEventListener('click', closeViewer);
  viewer.addEventListener('cancel', event => {
    event.preventDefault();
    closeViewer();
  });
  viewer.addEventListener('click', event => {
    if (event.target !== viewer) return;
    const rect = viewer.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeViewer();
  });
  viewer.addEventListener('close', releaseViewer);
})();
