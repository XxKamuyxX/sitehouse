import Lenis from '@studio-freight/lenis';

let lenis: Lenis | null = null;

export function initLenis() {
  if (typeof window === 'undefined') return;

  // Destroy existing instance if any
  if (lenis) {
    lenis.destroy();
    lenis = null;
  }

  lenis = new Lenis({
    duration: 1.2,
    easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
    orientation: 'vertical',
    gestureOrientation: 'vertical',
    smoothWheel: true,
    wheelMultiplier: 1,
    smoothTouch: false, // Disable smooth scroll on touch devices to prevent lag
    touchMultiplier: 2,
    infinite: false,
  });

  function raf(time: number) {
    lenis?.raf(time);
    requestAnimationFrame(raf);
  }

  requestAnimationFrame(raf);

  // Handle hash links
  lenis.on('scroll', () => {
    // Allow native scroll for hash navigation
  });

  return lenis;
}

export function destroyLenis() {
  if (lenis) {
    lenis.destroy();
    lenis = null;
  }
}
