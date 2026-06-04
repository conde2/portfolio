// Year
document.getElementById('year').textContent = new Date().getFullYear();

// Sticky nav shadow
const nav = document.getElementById('nav');
const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 8);
onScroll();
window.addEventListener('scroll', onScroll, { passive: true });

// Mobile menu
const toggle = document.getElementById('navToggle');
const links = document.querySelector('.nav__links');
toggle.addEventListener('click', () => {
  const open = links.classList.toggle('is-open');
  toggle.setAttribute('aria-expanded', String(open));
});
links.addEventListener('click', (e) => {
  if (e.target.tagName === 'A') {
    links.classList.remove('is-open');
    toggle.setAttribute('aria-expanded', 'false');
  }
});

// Scroll reveal
if (matchMedia('(prefers-reduced-motion: no-preference)').matches) {
  const revealEls = document.querySelectorAll('.section, .game--featured, .game--card');
  revealEls.forEach((el) => el.classList.add('reveal'));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealEls.forEach((el) => io.observe(el));
}

// Lightbox gallery
const lb = document.getElementById('lightbox');
const lbImg = document.getElementById('lightboxImg');
const thumbs = Array.from(document.querySelectorAll('.gallery__thumb'));
const sources = thumbs.map((t) => t.dataset.full);
let index = 0;

function openLightbox(i) {
  index = i;
  lbImg.src = sources[index];
  lb.classList.add('is-open');
  lb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  lb.classList.remove('is-open');
  lb.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}
function step(dir) {
  index = (index + dir + sources.length) % sources.length;
  lbImg.src = sources[index];
}

thumbs.forEach((t, i) => t.addEventListener('click', () => openLightbox(i)));
document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightboxNext').addEventListener('click', () => step(1));
document.getElementById('lightboxPrev').addEventListener('click', () => step(-1));
lb.addEventListener('click', (e) => { if (e.target === lb) closeLightbox(); });
document.addEventListener('keydown', (e) => {
  if (!lb.classList.contains('is-open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') step(1);
  if (e.key === 'ArrowLeft') step(-1);
});

// Inline video modal (YouTube)
const vb = document.getElementById('videobox');
const vbFrame = document.getElementById('videoFrame');

function openVideo(id) {
  vbFrame.src = `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`;
  vb.classList.add('is-open');
  vb.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}
function closeVideo() {
  vb.classList.remove('is-open');
  vb.setAttribute('aria-hidden', 'true');
  vbFrame.src = ''; // stop playback
  document.body.style.overflow = '';
}

document.querySelectorAll('.game__media--video').forEach((btn) => {
  btn.addEventListener('click', () => openVideo(btn.dataset.video));
});
document.getElementById('videoClose').addEventListener('click', closeVideo);
vb.addEventListener('click', (e) => { if (e.target === vb) closeVideo(); });
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && vb.classList.contains('is-open')) closeVideo();
});
