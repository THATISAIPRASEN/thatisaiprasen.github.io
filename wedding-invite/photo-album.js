// Page curl: StPageFlip 2.0.7 (MIT), with its license retained in vendor/page-flip.LICENSE.
(() => {
  const photos = document.querySelector('#photos');
  const gallery = document.querySelector('#photoGallery');
  const shell = document.querySelector('#albumShell');
  const stage = document.querySelector('#albumStage');
  const previous = document.querySelector('#albumPrev');
  const next = document.querySelector('#albumNext');
  const counter = document.querySelector('#albumPage');
  const errorStatus = document.querySelector('#albumError');
  const sources = [...gallery.querySelectorAll('a')];
  let book = null;
  let host;
  let ready = false;
  let failed = false;
  function syncPages(state) {
    if (!book || !ready) {
      return;
    }
    const index = book.getCurrentPageIndex();
    const count = book.getPageCount();
    const orientation = book.getOrientation();
    const currentState = state || book.getState();
    const busy = currentState === 'flipping' || currentState === 'user_fold';
    const spread = orientation === 'landscape' && index > 0 && index < count - 1;
    host.dataset.currentPage = String(index);
    host.dataset.orientation = orientation;
    host.dataset.state = currentState;
    previous.disabled = index === 0 || busy;
    next.disabled = index === count - 1 || busy;
    const label = spread ? `Pages ${index + 1}-${Math.min(index + 2, count)} of ${count}` : `Page ${index + 1} of ${count}`;
    if (counter.textContent !== label) {
      counter.textContent = label;
    }
    host.querySelectorAll('.album-page').forEach(page => {
      const pageIndex = Number(page.dataset.albumIndex);
      const visible = pageIndex === index || (spread && pageIndex === index + 1);
      page.inert = !visible;
      page.setAttribute('aria-hidden', String(!visible));
    });
  }

  function turn(direction) {
    if (!ready || reducedMotion.matches) {
      return;
    }
    const state = book.getState();
    if (state === 'flipping' || state === 'user_fold') {
      return;
    }
    const index = book.getCurrentPageIndex();
    if (direction > 0 && index < book.getPageCount() - 1) {
      book.flipNext('bottom');
    } else if (direction < 0 && index > 0) {
      book.flipPrev('bottom');
    }
  }

  function pageElement(index, className, content, hard = false) {
    const page = document.createElement('div');
    page.className = `album-page ${className}`;
    page.dataset.albumIndex = String(index);
    if (hard) {
      page.dataset.density = 'hard';
    }
    const inner = document.createElement('div');
    inner.className = 'page-inner';
    if (content) {
      inner.innerHTML = content;
    }
    page.appendChild(inner);
    return page;
  }

  function createPages() {
    const pages = [pageElement(0, 'album-cover',
      '<p class="script">Our moments</p><span class="cover-mark" aria-hidden="true">&amp;</span><p class="cover-names"><span>Sai Prasen</span><span>&amp;</span><span>Thanusha</span></p><span class="cover-rule" aria-hidden="true"></span><p class="cover-caption">A little book of us</p>', true)];
    sources.forEach((link, index) => {
      const page = pageElement(index + 1, 'album-photo');
      const inner = page.firstElementChild;
      const figure = document.createElement('figure');
      const image = link.querySelector('img').cloneNode();
      image.loading = 'eager';
      image.addEventListener('error', () => reportAssetError(image.src));
      figure.appendChild(image);
      const footer = document.createElement('div');
      footer.className = 'page-footer';
      const view = document.createElement('a');
      view.className = 'gallery-open';
      view.href = link.href;
      view.textContent = 'View full photo';
      view.setAttribute('aria-label', link.getAttribute('aria-label'));
      const number = document.createElement('span');
      number.textContent = String(index + 1).padStart(2, '0');
      number.setAttribute('aria-hidden', 'true');
      footer.append(view, number);
      inner.append(figure, footer);
      pages.push(page);
    });
    pages.push(pageElement(pages.length, 'album-closing',
      '<span class="cover-mark" aria-hidden="true">&amp;</span><p class="script">With love,</p><p class="cover-names"><span>Sai Prasen</span><span>&amp;</span><span>Thanusha</span></p>'));
    pages.push(pageElement(pages.length, 'album-cover',
      '<p class="script">Together, always</p><span class="cover-rule" aria-hidden="true"></span><p class="cover-caption">More memories to come</p>', true));
    return pages;
  }

  function showFailure(error) {
    failed = true;
    ready = false;
    shell.hidden = true;
    photos.classList.remove('album-ready');
    errorStatus.hidden = false;
    errorStatus.textContent = 'The page-turning album could not load. You can still view every photo below.';
    console.error('Photo album could not initialize:', error);
  }

  function initializeBook() {
    if (typeof St === 'undefined' || typeof St.PageFlip !== 'function') {
      showFailure(new Error('The local page-turning library is unavailable.'));
      return;
    }
    host = document.createElement('div');
    host.id = 'photoBook';
    host.className = 'photo-book';
    host.tabIndex = 0;
    host.setAttribute('role', 'region');
    host.setAttribute('aria-roledescription', 'photo book');
    host.setAttribute('aria-label', 'Our moments photo album');
    host.setAttribute('aria-describedby', 'albumHint');
    stage.appendChild(host);
    shell.hidden = false;
    try {
      book = new St.PageFlip(host, {
        width: 190,
        height: 280,
        size: 'stretch',
        minWidth: 190,
        maxWidth: 400,
        minHeight: 214,
        maxHeight: 590,
        flippingTime: 850,
        startPage: 0,
        showCover: true,
        usePortrait: true,
        mobileScrollSupport: true,
        clickEventForward: true,
        maxShadowOpacity: 0.35,
        swipeDistance: 35,
      });
      book.on('init', () => {
        ready = true;
        photos.classList.add('album-ready');
        syncPages();
      });
      book.on('flip', () => syncPages());
      book.on('changeOrientation', () => window.requestAnimationFrame(() => syncPages()));
      book.on('changeState', event => {
        syncPages(event.data);
      });
      host.addEventListener('keydown', event => {
        if (!ready || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
        if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
          turn(event.key === 'ArrowRight' ? 1 : -1);
        } else {
          book.turnToPage(event.key === 'Home' ? 0 : book.getPageCount() - 1);
        }
      });
      book.loadFromHTML(createPages());
    } catch (error) {
      showFailure(error);
    }
  }

  function applyAlbumPreference() {
    if (reducedMotion.matches) {
      const focused = shell.contains(document.activeElement);
      photos.classList.remove('album-ready');
      shell.hidden = true;
      if (focused) {
        sources[0].focus({ preventScroll: true });
      }
    } else if (!failed) {
      const focused = gallery.contains(document.activeElement);
      if (!book) {
        initializeBook();
      } else {
        shell.hidden = false;
        photos.classList.add('album-ready');
        book.update();
        syncPages();
      }
      if (focused && ready) {
        host.focus({ preventScroll: true });
      }
    }
  }

  previous.addEventListener('click', () => turn(-1));
  next.addEventListener('click', () => turn(1));
  reducedMotion.addEventListener('change', applyAlbumPreference);
  applyAlbumPreference();
})();
