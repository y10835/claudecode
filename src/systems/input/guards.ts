/** Blocks browser gestures that would break play on phones. */
export function installGestureGuards(): void {
  const stop = (e: Event): void => e.preventDefault();
  const opts: AddEventListenerOptions = { passive: false };
  document.addEventListener('touchstart', stop, opts); // double-tap zoom, long-press
  document.addEventListener('touchmove', stop, opts); // scroll / rubber band / pinch
  document.addEventListener('touchend', stop, opts);
  document.addEventListener('contextmenu', stop);
  document.addEventListener('dblclick', stop);
  document.addEventListener('selectstart', stop);
  document.addEventListener('dragstart', stop);
  // iOS Safari pinch
  document.addEventListener('gesturestart', stop, opts);
  document.addEventListener('gesturechange', stop, opts);
  window.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey) e.preventDefault();
    },
    opts,
  );
}
