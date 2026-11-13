// Scroll-in reveal for page sections. Sections are found automatically (any <main> section after the
// first, which is the hero), including ones React adds later when the visitor switches tabs.
const SELECTOR = 'main section:not(:first-of-type), main [data-reveal]';

export function initReveal() {
  if (typeof window === 'undefined' || !('IntersectionObserver' in window)) return;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;

  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.replace('reveal-armed', 'reveal-in');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
  );

  const arm = () => {
    for (const el of document.querySelectorAll(SELECTOR)) {
      if (el.dataset.revealSeen) continue;
      el.dataset.revealSeen = '1';
      const r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92) continue; // already on screen: leave it visible
      el.classList.add('reveal-armed');
      io.observe(el);
    }
  };

  arm();
  new MutationObserver(() => requestAnimationFrame(arm)).observe(document.getElementById('root'), { childList: true, subtree: true });
}
