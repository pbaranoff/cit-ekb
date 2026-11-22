(() => {
  const viewer = document.querySelector('.gallery-viewer');
  const gallery = document.querySelector('.gallery');
  if (!gallery || !viewer) return;

  const title = viewer.querySelector('h2');
  const counter = viewer.querySelector('.gallery-viewer__counter');
  const image = viewer.querySelector('.gallery-viewer__photo');
  const caption = viewer.querySelector('figcaption');
  const thumbs = viewer.querySelector('.gallery-viewer__thumbs');
  let opener;
  let album;
  let directory;
  let total;
  let current;

  function showPhoto(index) {
    current = (index - 1 + total) % total + 1;
    image.src = new URL(current + '.jpg', directory).href;
    image.alt = album.querySelector(`[data-photo="${current}"] img`)?.alt || title.textContent + ', фото ' + current;
    const descriptions = album.querySelector('.album__captions')?.content;
    caption.textContent = descriptions?.querySelector(`[data-photo="${current}"]`)?.textContent.trim() || '';
    caption.hidden = !caption.textContent;
    caption.scrollTop = 0;
    counter.textContent = current + ' / ' + total;

    thumbs.querySelector('[aria-current]')?.removeAttribute('aria-current');
    const selected = thumbs.children[current - 1];
    selected.setAttribute('aria-current', 'true');
    selected.scrollIntoView({ block: 'nearest', inline: 'nearest', behavior: 'instant' });
  }

  function openAlbum(link) {
    album = link.closest('.album');
    directory = new URL('.', link.href);
    total = Number(album.dataset.photoCount);
    title.textContent = album.querySelector('h2').textContent;
    opener = link;

    const items = document.createDocumentFragment();
    for (let i = 1; i <= total; i++) {
      const button = document.createElement('button');
      button.type = 'button';
      button.dataset.index = i;
      button.setAttribute('aria-label', 'Фото ' + i);
      const thumb = document.createElement('img');
      thumb.alt = '';
      thumb.loading = 'lazy';
      thumb.src = new URL('thumb/' + i + '.jpg', directory).href;
      button.append(thumb);
      items.append(button);
    }
    thumbs.replaceChildren(items);
    viewer.showModal();
    document.body.classList.add('is-media-open');
    showPhoto(Number(link.dataset.photo));
  }

  gallery.addEventListener('click', event => {
    const link = event.target.closest('a[data-photo]');
    if (!link || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) return;
    event.preventDefault();
    openAlbum(link);
  });
  thumbs.addEventListener('click', event => {
    const button = event.target.closest('button');
    if (button) showPhoto(Number(button.dataset.index));
  });
  viewer.querySelector('.gallery-viewer__prev').addEventListener('click', () => showPhoto(current - 1));
  viewer.querySelector('.gallery-viewer__next').addEventListener('click', () => showPhoto(current + 1));
  viewer.querySelector('.gallery-viewer__close').addEventListener('click', () => viewer.close());
  viewer.addEventListener('keydown', event => {
    if (event.key !== 'ArrowLeft' && event.key !== 'ArrowRight') return;
    event.preventDefault();
    showPhoto(current + (event.key === 'ArrowRight' ? 1 : -1));
    if (thumbs.contains(document.activeElement)) thumbs.children[current - 1].focus({ preventScroll: true });
  });
  viewer.addEventListener('close', () => {
    if (viewer.open) return;
    document.body.classList.remove('is-media-open');
    opener?.focus({ preventScroll: true });
  });
})();
