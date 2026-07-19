const pages = document.querySelectorAll('.page');
const navButtons = document.querySelectorAll('.nav-btn');
const validTargets = new Set(Array.from(pages).map(p => p.id));

function showPage(target) {
  if (!validTargets.has(target)) target = 'home';

  pages.forEach(p => p.classList.toggle('active', p.id === target));
  navButtons.forEach(b => b.classList.toggle('active', b.dataset.target === target));
  document.querySelector('main').scrollTo({ top: 0, behavior: 'instant' });
  window.scrollTo({ top: 0, behavior: 'instant' });
}

navButtons.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.target;
    history.pushState(null, '', `#${target}`);
    showPage(target);
  });
});

window.addEventListener('popstate', () => {
  showPage(window.location.hash.slice(1));
});

showPage(window.location.hash.slice(1) || 'home');
