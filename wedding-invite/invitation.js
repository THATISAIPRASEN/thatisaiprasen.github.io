// Scene timings, easing and layer transforms follow the user-licensed AfterFX template.
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const clamp = (value, min = 0, max = 1) => Math.max(min, Math.min(max, value));
const segment = (value, start, end) => clamp((value - start) / (end - start));
const lerp = (start, end, progress) => start + (end - start) * progress;
const easeOut = value => 1 - Math.pow(1 - value, 3);
const easeIn = value => value * value;
const easeInOut = value => value < 0.5 ? 2 * value * value : 1 - Math.pow(-2 * value + 2, 2) / 2;
const scenes = [];
const freeUpdates = [];
const animatedElements = new Set();
let frame = 0;
let snap = true;

function transform(element, value) {
  if (element) {
    animatedElements.add(element);
    element.style.transform = value;
  }
}

function opacity(element, value) {
  if (element) {
    animatedElements.add(element);
    element.style.opacity = String(value);
  }
}

function registerScene(id, duration, update) {
  const element = document.getElementById(id);
  if (element) {
    scenes.push({ element, duration, update, current: 0, target: 0, drawn: -1 });
  }
}

function drawScenes() {
  frame = 0;
  if (reducedMotion.matches) {
    return;
  }
  let unfinished = false;
  const height = window.innerHeight;
  for (const scene of scenes) {
    const bounds = scene.element.getBoundingClientRect();
    scene.target = clamp(-bounds.top / Math.max(1, scene.element.offsetHeight - height));
    if (bounds.bottom < -height || bounds.top > 2 * height) {
      scene.current = scene.target;
      continue;
    }
    const difference = scene.target - scene.current;
    if (snap || Math.abs(difference) < 0.0006) {
      scene.current = scene.target;
    } else {
      scene.current += 0.14 * difference;
      unfinished = true;
    }
    if (scene.drawn !== scene.current) {
      scene.update(scene.current * scene.duration);
      scene.drawn = scene.current;
    }
  }
  freeUpdates.forEach(update => update(height));
  snap = false;
  if (unfinished) {
    requestDraw();
  }
}

function requestDraw() {
  if (!frame) {
    frame = window.requestAnimationFrame(drawScenes);
  }
}

const gopuram = $('#hGop');
const names = $('#hNames');
const treeLeft = $('#treeL');
const treeRight = $('#treeR');
const heroClouds = $$('#hero .cloud');
registerScene('hero', 6.8, time => {
  const rise = segment(time, 0, 4);
  const zoom = easeIn(segment(time, 4, 7));
  const trees = segment(time, 0.5, 3.5);
  const mist = segment(time, 4.4, 6.4);
  transform(gopuram, `translate(-50%,${lerp(60, 0, rise) + lerp(0, -50, zoom)}%) scale(${1 + 5 * zoom})`);
  transform(names, `translateY(${-45 * rise}%)`);
  opacity(names, 1 - segment(time, 3.4, 4.6));
  transform(treeLeft, `translate(${-80 * zoom}%,${80 * (1 - trees)}%) scale(${1 + 0.9 * zoom})`);
  transform(treeRight, `translate(${80 * zoom}%,${80 * (1 - trees)}%) scale(${1 + 0.9 * zoom})`);
  heroClouds.forEach(cloud => {
    transform(cloud, `translateX(${1.6 * Number(cloud.dataset.dx) * segment(time, 0, 7)}px) scale(${1 + 0.6 * mist})`);
    opacity(cloud, 1 - mist);
  });
  opacity($('#hHint'), 1 - segment(time, 0, 0.4));
  opacity($('#hFlash'), 0.35 * segment(time, 5.6, 6.8));
});

const invitationLines = $$('#invite .ln');
const invitationDuration = 0.42 * Math.max(0, invitationLines.length - 1) + 0.1 + 0.8;
registerScene('invite', invitationDuration, time => {
  invitationLines.forEach((line, index) => {
    const progress = easeOut(segment(time, 0.42 * index - 0.5, 0.42 * index + 0.1));
    opacity(line, progress);
    transform(line, `translateY(${24 * (1 - progress)}px)`);
  });
});

freeUpdates.push(height => {
  const photoFrame = $('#frame');
  if (photoFrame) {
    const bounds = photoFrame.getBoundingClientRect();
    if (bounds.top < 1.5 * height && bounds.bottom > -height) {
      const progress = clamp((0.95 * height - bounds.top) / (0.55 * height));
      transform(photoFrame, `translateY(${-30 * (1 - progress)}%) rotate(${-4 * (1 - progress)}deg) scale(${0.9 + 0.1 * progress})`);
    }
  }
  const venueArt = $('#vGold');
  if (venueArt) {
    const bounds = venueArt.getBoundingClientRect();
    if (bounds.top < 1.5 * height && bounds.bottom > -height) {
      const progress = clamp((height - bounds.top) / (0.8 * height));
      transform(venueArt, `translateY(${30 * (1 - progress)}%)`);
      opacity(venueArt, 0.3 + 0.7 * progress);
    }
  }
});

function applyMotionPreference() {
  document.documentElement.classList.toggle('animated-scenes', !reducedMotion.matches);
  if (reducedMotion.matches) {
    $('#invite').style.removeProperty('height');
    animatedElements.forEach(element => {
      element.style.removeProperty('transform');
      element.style.removeProperty('opacity');
    });
  } else {
    $('#invite').style.height = `${Math.round(140 + 14 * invitationLines.length)}vh`;
  }
  scenes.forEach(scene => { scene.drawn = -1; });
  snap = true;
  requestDraw();
}

window.addEventListener('scroll', requestDraw, { passive: true });
window.addEventListener('resize', () => { snap = true; requestDraw(); });
reducedMotion.addEventListener('change', applyMotionPreference);
applyMotionPreference();

if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.documentElement.classList.add('motion-ready');
  $$('.rv').forEach(element => observer.observe(element));
}

const gate = $('#gate');
const app = $('#app');
const openButton = $('#openBtn');
let unlockTimer;
let gateTimer;

const hero = $('#hero');
const invitation = $('#invite');
const introStatus = $('#introStatus');
const sequenceDuration = 3000;
const introTiming = { temple: 1500, entrance: 200, card: 1300 };
let sequenceFrame = 0;
let activeSequence = null;
let sequenceDirection = 1;
let introRequested = false;
let sequenceStartedAt = 0;
let sequencePausedAt = null;
let touchOrigin = null;
let lastScrollInput = { direction: 0, time: -Infinity };
let lastScrollY = window.scrollY;

function stopSequence() {
  window.cancelAnimationFrame(sequenceFrame);
  sequenceFrame = 0;
  activeSequence = null;
  introRequested = false;
  sequencePausedAt = null;
  lastScrollInput = { direction: 0, time: -Infinity };
}

function sequenceBounds() {
  return { start: hero.offsetTop, end: invitation.offsetTop + invitation.offsetHeight - window.innerHeight };
}

function sequencePosition(time) {
  const { start, end } = sequenceBounds();
  const { temple, entrance, card } = introTiming;
  const heroEnd = hero.offsetTop + hero.offsetHeight - window.innerHeight;
  const cardStart = invitation.offsetTop;
  if (time < temple) {
    return lerp(start, heroEnd, clamp(time / temple));
  }
  if (time < temple + entrance) {
    return lerp(heroEnd, cardStart, easeInOut(segment(time, temple, temple + entrance)));
  }
  return lerp(cardStart, end, segment(time, temple + entrance, temple + entrance + card));
}

function sequenceTimeAtPosition(top) {
  const { start, end } = sequenceBounds();
  const { temple, entrance, card } = introTiming;
  const heroEnd = hero.offsetTop + hero.offsetHeight - window.innerHeight;
  const cardStart = invitation.offsetTop;
  if (top <= heroEnd) {
    return temple * segment(top, start, heroEnd);
  }
  if (top < cardStart) {
    const progress = segment(top, heroEnd, cardStart);
    const inverseEasing = progress < 0.5 ? Math.sqrt(progress / 2) : 1 - Math.sqrt((1 - progress) / 2);
    return temple + entrance * inverseEasing;
  }
  return temple + entrance + card * segment(top, cardStart, end);
}

function finishSequence() {
  const direction = sequenceDirection;
  const bounds = sequenceBounds();
  const destination = direction > 0 ? invitation : $('#coupleNames');
  stopSequence();
  window.scrollTo({ top: direction > 0 ? bounds.end : bounds.start, behavior: 'instant' });
  snap = true;
  requestDraw();
  destination.focus({ preventScroll: true });
  introStatus.textContent = direction < 0 ? 'Returned to the temple entrance. Scroll to continue.' :
    'Invitation open. Scroll to see the celebrations.';
}

function nextSequence(direction = 1) {
  if (reducedMotion.matches || (!gate.hidden && !gate.classList.contains('open'))) {
    return null;
  }
  if (!gate.hidden) {
    return direction > 0 ? 'intro' : null;
  }
  const { start, end } = sequenceBounds();
  const entry = 0.15 * window.innerHeight;
  return (direction > 0 ? window.scrollY >= start - entry && window.scrollY < end - 1 :
    window.scrollY <= end + entry && window.scrollY > start + 1) ? 'intro' : null;
}

function playSequence(sequence, direction = 1) {
  if (!sequence || reducedMotion.matches || (activeSequence && sequenceDirection === direction)) {
    return;
  }
  if (activeSequence) {
    stopSequence();
  }
  if (!gate.hidden) {
    introRequested = true;
    return;
  }
  // Use the same timeline in reverse, including its easing, without jumping on direction changes.
  const startTime = sequenceTimeAtPosition(window.scrollY);
  const startOffset = window.scrollY - sequencePosition(startTime);
  activeSequence = sequence;
  sequenceDirection = direction;
  sequenceStartedAt = performance.now();
  introStatus.textContent = direction < 0 ?
    'Returning through the temple. Press Escape to return to its entrance.' :
    'Opening your invitation. Press Escape to view the full card.';

  function advanceSequence(now) {
    if (sequencePausedAt === null) {
      const elapsed = now - sequenceStartedAt;
      if (elapsed >= sequenceDuration) {
        finishSequence();
        return;
      }
      const progress = clamp(elapsed / sequenceDuration);
      const time = lerp(startTime, direction > 0 ? sequenceDuration : 0, progress);
      const top = sequencePosition(time) + startOffset * (1 - progress);
      window.scrollTo({ top, behavior: 'instant' });
      snap = true;
      requestDraw();
    }
    sequenceFrame = window.requestAnimationFrame(advanceSequence);
  }
  sequenceFrame = window.requestAnimationFrame(advanceSequence);
}

function handleScrollInput(event, direction) {
  if (!direction) {
    return;
  }
  lastScrollInput = { direction, time: performance.now() };
  const sequence = activeSequence || nextSequence(direction);
  if (sequence) {
    if (event.cancelable) {
      event.preventDefault();
    }
    playSequence(sequence, direction);
  }
}

window.addEventListener('wheel', event => {
  if (event.ctrlKey || event.metaKey) {
    return;
  }
  const direction = Math.abs(event.deltaY) >= Math.abs(event.deltaX) ? Math.sign(event.deltaY) : 0;
  handleScrollInput(event, direction);
}, { passive: false });

window.addEventListener('touchstart', event => {
  touchOrigin = event.touches.length === 1 ? { x: event.touches[0].clientX, y: event.touches[0].clientY } : null;
}, { passive: true });
window.addEventListener('touchmove', event => {
  if (event.touches.length !== 1) {
    return;
  }
  const dx = touchOrigin ? touchOrigin.x - event.touches[0].clientX : 0;
  const dy = touchOrigin ? touchOrigin.y - event.touches[0].clientY : 0;
  const direction = Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx) ? Math.sign(dy) : 0;
  handleScrollInput(event, direction);
  if (direction) {
    touchOrigin = { x: event.touches[0].clientX, y: event.touches[0].clientY };
  }
}, { passive: false });
window.addEventListener('touchend', () => { touchOrigin = null; }, { passive: true });
window.addEventListener('touchcancel', () => { touchOrigin = null; }, { passive: true });

window.addEventListener('scroll', () => {
  const previousY = lastScrollY;
  lastScrollY = window.scrollY;
  const direction = Math.sign(lastScrollY - previousY);
  if (activeSequence || reducedMotion.matches || !gate.hidden || direction !== lastScrollInput.direction ||
    performance.now() - lastScrollInput.time > 1000) {
    return;
  }
  // Catch a gesture crossing either boundary without requiring another scroll.
  const bounds = sequenceBounds();
  const boundary = direction > 0 ? bounds.start : bounds.end;
  const crossed = direction > 0 ? previousY < boundary && lastScrollY >= boundary :
    previousY > boundary && lastScrollY <= boundary;
  if (crossed) {
    window.scrollTo({ top: boundary, behavior: 'instant' });
    playSequence('intro', direction);
    return;
  }
  playSequence(nextSequence(direction), direction);
}, { passive: true });

window.addEventListener('keydown', event => {
  if (event.ctrlKey || event.metaKey || event.altKey || (!gate.hidden && !gate.classList.contains('open'))) {
    return;
  }
  let direction = 0;
  if (!event.target.closest('input, textarea, select, [contenteditable], dialog')) {
    if (['ArrowDown', 'PageDown'].includes(event.key)) {
      direction = 1;
    } else if (['ArrowUp', 'PageUp'].includes(event.key)) {
      direction = -1;
    } else if ([' ', 'Spacebar'].includes(event.key) && !event.target.closest('a, button')) {
      direction = event.shiftKey ? -1 : 1;
    }
  }
  if (!direction) {
    lastScrollInput = { direction: 0, time: -Infinity };
  }
  if (activeSequence && ['Escape', 'End', 'Tab'].includes(event.key)) {
    finishSequence();
    if (event.key !== 'Tab') {
      event.preventDefault();
    }
  } else if (activeSequence && event.key === 'Home') {
    stopSequence();
    introStatus.textContent = 'Animation stopped. Continue scrolling to explore.';
  } else {
    handleScrollInput(event, direction);
  }
});

$('#hHint').addEventListener('click', event => {
  if (activeSequence || nextSequence(1) === 'intro') {
    event.preventDefault();
    playSequence('intro');
  }
});
document.addEventListener('visibilitychange', () => {
  if (activeSequence) {
    if (document.hidden) {
      sequencePausedAt = performance.now();
    } else if (sequencePausedAt !== null) {
      sequenceStartedAt += performance.now() - sequencePausedAt;
      sequencePausedAt = null;
    }
  }
});
reducedMotion.addEventListener('change', () => {
  lastScrollInput = { direction: 0, time: -Infinity };
  if (reducedMotion.matches && activeSequence) {
    finishSequence();
  }
});

function unlockInvitation() {
  document.body.classList.remove('locked');
  app.inert = false;
  snap = true;
  requestDraw();
}

function finishOpening() {
  window.clearTimeout(unlockTimer);
  window.clearTimeout(gateTimer);
  gate.hidden = true;
  window.scrollTo({ top: 0, behavior: 'instant' });
  unlockInvitation();
  $('#coupleNames').focus({ preventScroll: true });
  if (introRequested) {
    introRequested = false;
    playSequence('intro');
  }
}

function showGate() {
  stopSequence();
  touchOrigin = null;
  introStatus.textContent = '';
  window.clearTimeout(unlockTimer);
  window.clearTimeout(gateTimer);
  gate.classList.remove('open');
  gate.hidden = false;
  openButton.disabled = false;
  document.body.classList.add('locked');
  app.inert = true;
  window.scrollTo({ top: 0, behavior: 'instant' });
  openButton.focus({ preventScroll: true });
}

openButton.addEventListener('click', () => {
  window.scrollTo({ top: 0, behavior: 'instant' });
  openButton.disabled = true;
  gate.classList.add('open');
  if (reducedMotion.matches) {
    finishOpening();
  } else {
    unlockTimer = window.setTimeout(unlockInvitation, 900);
    gateTimer = window.setTimeout(finishOpening, 1800);
  }
});

gate.addEventListener('keydown', event => {
  if (event.key === 'Escape') {
    finishOpening();
  } else if (event.key === 'Tab') {
    event.preventDefault();
    openButton.focus();
  }
});

const replay = $('.replay');
replay.hidden = false;
replay.addEventListener('click', showGate);
if (!window.location.hash) {
  showGate();
}

function mandala(color, rings) {
  let shapes = '';
  for (let ring = 1; ring <= rings; ring++) {
    const radius = 15 * ring;
    const petals = 8 + 4 * ring;
    shapes += `<circle r="${radius - 4}" fill="none" stroke="${color}" stroke-width=".8"/>`;
    for (let petal = 0; petal < petals; petal++) {
      shapes += `<ellipse cx="0" cy="${-radius}" rx="${2 + 0.7 * ring}" ry="${5 + 0.8 * ring}" fill="none" stroke="${color}" stroke-width=".9" transform="rotate(${360 * petal / petals})"/>`;
    }
  }
  return `<svg viewBox="-100 -100 200 200" width="100%" aria-hidden="true">${shapes}</svg>`;
}
$$('.emb').forEach(element => { element.innerHTML = mandala('#c9a36a', 7); });

const countdown = $('#cd');
const countStatus = $('#countStatus');
const weddingTime = Date.parse(countdown.dataset.target);
if (Number.isNaN(weddingTime)) {
  countStatus.textContent = 'The countdown is unavailable. Please see the wedding date above.';
  console.error('Invalid wedding countdown date:', countdown.dataset.target);
} else {
  countdown.hidden = false;
  const units = Object.fromEntries(['days', 'hours', 'minutes', 'seconds'].map(unit => [unit, countdown.querySelector(`[data-unit="${unit}"]`)]));
  const updateCountdown = () => {
    const remaining = Math.max(0, Math.ceil((weddingTime - Date.now()) / 1000));
    const values = {
      days: Math.floor(remaining / 86400),
      hours: Math.floor((remaining % 86400) / 3600),
      minutes: Math.floor((remaining % 3600) / 60),
      seconds: remaining % 60
    };
    Object.entries(values).forEach(([unit, value]) => { units[unit].textContent = String(value).padStart(2, '0'); });
    if (remaining === 0) {
      countStatus.textContent = 'The wedding celebration has begun!';
    }
    return remaining;
  };
  if (updateCountdown() > 0) {
    const countdownTimer = window.setInterval(() => {
      if (updateCountdown() === 0) {
        window.clearInterval(countdownTimer);
      }
    }, 1000);
  }
}

const magic = $('#magic');
const photoLinks = $$('#photoGallery .gallery-open');
const photoImages = photoLinks.map(link => link.querySelector('img'));
const cards = Array.from({ length: 8 }, (_, index) => {
  const card = document.createElement('div');
  card.className = 'pc';
  card.setAttribute('aria-hidden', 'true');
  const photo = document.createElement('div');
  photo.className = 'ph';
  const image = photoImages[index % photoImages.length].cloneNode();
  image.alt = '';
  photo.appendChild(image);
  card.appendChild(photo);
  magic.appendChild(card);
  return card;
});
const photoTimers = new Set();
let magicVisible = false;

function moveCard(card, x, y, angle, scale, duration, easing = 'ease') {
  const width = magic.clientWidth;
  const height = magic.clientHeight;
  const cardWidth = card.offsetWidth;
  const cardHeight = card.offsetHeight;
  if (width > 0 && height > 0) {
    // Reserve full-size rotated bounds, including between animation keyframes.
    const inset = 20 + Math.hypot(cardWidth, cardHeight) / 2 * Math.max(1, scale);
    x = clamp(x + cardWidth / 2, inset, width - inset) - cardWidth / 2;
    y = clamp(y + cardHeight / 2, inset, height - inset) - cardHeight / 2;
  }
  card.style.transition = duration && !reducedMotion.matches ? `transform ${duration}s ${easing}` : 'none';
  card.style.transform = `translate(${x}px,${y}px) rotate(${angle}deg) scale(${scale})`;
}

function stackPhotos() {
  cards.forEach((card, index) => moveCard(card, magic.clientWidth / 2 - card.offsetWidth / 2 + 6 * (index % 3 - 1), magic.clientHeight * 0.55 - card.offsetHeight / 2 + 1.5 * index, 37 * index % 24 - 12, 1, 0));
}

function animatePhotos(x, y) {
  if (reducedMotion.matches) {
    return;
  }
  photoTimers.forEach(timer => window.clearTimeout(timer));
  photoTimers.clear();
  opacity($('#mgHint'), 0.25);
  const width = magic.clientWidth;
  const height = magic.clientHeight;
  const inset = 20 + Math.max(...cards.map(card => Math.hypot(card.offsetWidth, card.offsetHeight) / 2));
  const availableWidth = Math.max(0, width - 2 * inset);
  const availableHeight = Math.max(0, height - 2 * inset);
  cards.forEach(card => moveCard(card, x - card.offsetWidth / 2, y - card.offsetHeight / 2, 0, 0.2, 0));
  // Commit the initial pose before starting the reference's scatter transition.
  magic.getBoundingClientRect();
  cards.forEach((card, index) => {
    photoTimers.add(window.setTimeout(() => {
      moveCard(card, inset + Math.random() * availableWidth - card.offsetWidth / 2, inset + Math.random() * availableHeight - card.offsetHeight / 2, 60 * Math.random() - 30, 1, 0.7, 'cubic-bezier(.2,.8,.2,1)');
    }, 30 * index));
  });
  photoTimers.add(window.setTimeout(() => {
    cards.forEach((card, index) => {
      const angle = index / cards.length * Math.PI * 2;
      const radius = Math.min(availableWidth / 32, availableHeight / 30);
      const heartX = width / 2 + 16 * Math.pow(Math.sin(angle), 3) * radius - card.offsetWidth / 2;
      const heartY = height / 2 - 2 * radius - (13 * Math.cos(angle) - 5 * Math.cos(2 * angle) - 2 * Math.cos(3 * angle) - Math.cos(4 * angle)) * radius - card.offsetHeight / 2;
      moveCard(card, heartX, heartY, 20 * Math.random() - 10, 1, 1.1, 'cubic-bezier(.65,0,.35,1)');
    });
  }, 1000));
}

function syncMagicVisibility(visible) {
  const shouldPlay = visible && !reducedMotion.matches;
  if (shouldPlay === magicVisible) {
    return;
  }
  magicVisible = shouldPlay;
  if (shouldPlay) {
    animatePhotos(magic.clientWidth / 2, magic.clientHeight / 2);
  } else {
    photoTimers.forEach(timer => window.clearTimeout(timer));
    photoTimers.clear();
    opacity($('#mgHint'), 1);
    stackPhotos();
  }
}

function checkMagicVisibility() {
  const bounds = magic.getBoundingClientRect();
  const visibleHeight = Math.min(bounds.bottom, window.innerHeight) - Math.max(bounds.top, 0);
  syncMagicVisibility(bounds.height > 0 && visibleHeight >= 0.25 * bounds.height);
}

function resetPhotos() {
  photoTimers.forEach(timer => window.clearTimeout(timer));
  photoTimers.clear();
  stackPhotos();
  magicVisible = false;
  checkMagicVisibility();
}

stackPhotos();
if ('IntersectionObserver' in window) {
  const photoObserver = new IntersectionObserver(entries => {
    entries.forEach(entry => syncMagicVisibility(entry.isIntersecting && entry.intersectionRatio >= 0.25));
  }, { threshold: [0, 0.25] });
  photoObserver.observe(magic);
} else {
  window.addEventListener('scroll', checkMagicVisibility, { passive: true });
  checkMagicVisibility();
}
window.addEventListener('resize', resetPhotos);
reducedMotion.addEventListener('change', resetPhotos);

const viewer = $('.photo-viewer');
const viewerImage = viewer.querySelector('img');
const viewerDownload = viewer.querySelector('a');
let viewerTrigger;
if (typeof viewer.showModal === 'function') {
  document.addEventListener('click', event => {
    const link = event.target.closest('a.gallery-open');
    if (!link || event.defaultPrevented || event.button !== 0 || event.ctrlKey || event.metaKey || event.shiftKey || event.altKey) {
      return;
    }
    event.preventDefault();
    viewerTrigger = link;
    const sourceImage = link.querySelector('img') || photoLinks.find(photo => photo.href === link.href)?.querySelector('img');
    const isInvitation = new URL(link.href).pathname === new URL('./invite.jpeg', window.location.href).pathname;
    viewer.setAttribute('aria-label', isInvitation ? 'Full invitation picture' : 'Full-size couple photo');
    viewerImage.src = link.href;
    viewerImage.alt = sourceImage ? sourceImage.alt : 'Full wedding invitation for Sai Prasen and Thanusha.';
    viewerImage.loading = 'eager';
    viewerImage.removeAttribute('width');
    viewerImage.removeAttribute('height');
    viewerDownload.href = link.href;
    viewerDownload.textContent = isInvitation ? 'Download invitation picture' : 'Download photo';
    viewer.showModal();
    document.body.classList.add('viewer-active');
  });
  $('.close-viewer').addEventListener('click', () => viewer.close());
  viewer.addEventListener('keydown', event => {
    if (event.key === 'Escape') {
      event.preventDefault();
      viewer.close();
    }
  });
  viewer.addEventListener('click', event => {
    const bounds = viewer.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) {
      viewer.close();
    }
  });
  viewer.addEventListener('close', () => {
    document.body.classList.remove('viewer-active');
    if (viewerTrigger) {
      viewerTrigger.focus({ preventScroll: true });
    }
  });
}

function reportAssetError(url) {
  const status = $('#assetStatus');
  status.hidden = false;
  status.textContent = 'Some invitation artwork could not load. Please refresh to try again.';
  console.error('Invitation artwork failed to load:', url);
}
$$('img').forEach(image => {
  image.addEventListener('load', () => { snap = true; requestDraw(); });
  image.addEventListener('error', () => reportAssetError(image.src));
  if (image.complete && !image.naturalWidth) {
    reportAssetError(image.src);
  }
});
['door', 'sky', 'pillar', 'ev2'].forEach(name => {
  const image = new Image();
  image.onerror = () => reportAssetError(image.src);
  image.src = `./assets/${name}.webp`;
});
if (document.fonts) {
  document.fonts.ready.then(() => { snap = true; requestDraw(); });
}
