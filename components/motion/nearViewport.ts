const INTERACTION_EVENTS = [
  "scroll",
  "wheel",
  "touchstart",
  "pointerdown",
  "keydown",
] as const;
const INTERACTION_LISTENER_OPTIONS: AddEventListenerOptions = { passive: true };
const TOP_OF_PAGE = 0;

export function whenInteracted(onInteract: () => void): () => void {
  if (window.scrollY > TOP_OF_PAGE) {
    onInteract();
    return () => undefined;
  }
  const stop = () => {
    for (const type of INTERACTION_EVENTS) {
      window.removeEventListener(type, handle, INTERACTION_LISTENER_OPTIONS);
    }
  };
  const handle = () => {
    stop();
    onInteract();
  };
  for (const type of INTERACTION_EVENTS) {
    window.addEventListener(type, handle, INTERACTION_LISTENER_OPTIONS);
  }
  return stop;
}

export function whenNearViewport(
  element: Element,
  rootMargin: string,
  onNear: () => void,
): () => void {
  if (typeof IntersectionObserver === "undefined") {
    onNear();
    return () => undefined;
  }
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        observer.disconnect();
        onNear();
      }
    },
    { rootMargin },
  );
  observer.observe(element);
  return () => observer.disconnect();
}
