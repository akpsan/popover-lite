// popover-lite — v0.2.0 (Pragmatic Edition)
// Lightweight Popper‑style helper built on the native Popover API + CSS Anchor Positioning.
// MIT © 2025 — https://github.com/akpsan/popover-lite

/*************************************************
 *              Public Types & API               *
 *************************************************/
export type Placement = "top" | "bottom" | "left" | "right";

export interface PopoverOptions {
  /** Preferred placement. If it doesn't fit, we'll try others. */
  placement?: Placement;
  /** Gap between popover and anchor, in px. Default: 8 */
  offset?: number;
  /** Fallback order when preferred placement doesn't fit. Default: all directions */
  fallbacks?: Placement[];
}

export interface PopoverController {
  readonly element: HTMLElement;
  show(): void;
  hide(): void;
  toggle(): void;
  update(): void;
  destroy(): void;
}

/*************************************************
 *                 Helper utils                  *
 *************************************************/
function ensureAnchorId(anchor: HTMLElement): string {
  if (!anchor.id) {
    anchor.id = `popover-anchor-${crypto.randomUUID()}`;
  }
  return anchor.id;
}

function setPlacement(el: HTMLElement, placement: Placement) {
  el.style.setProperty("--placement", placement);
  el.dataset.placement = placement;
}

function setOffset(el: HTMLElement, offset: number) {
  el.style.setProperty("--offset", `${offset}px`);
}

function getScrollParents(el: HTMLElement): HTMLElement[] {
  const parents: HTMLElement[] = [];
  let current: HTMLElement | null = el.parentElement;

  while (current) {
    const style = getComputedStyle(current);
    const overflow = style.overflow + style.overflowX + style.overflowY;
    if (/auto|scroll|overlay/.test(overflow)) {
      parents.push(current);
    }
    current = current.parentElement;
  }

  parents.push(document.documentElement);
  return parents;
}

/*************************************************
 *            Simple placement logic             *
 *************************************************/
function getAvailableSpace(anchor: HTMLElement, placement: Placement): number {
  const rect = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  switch (placement) {
    case "top":
      return rect.top;
    case "bottom":
      return vh - rect.bottom;
    case "left":
      return rect.left;
    case "right":
      return vw - rect.right;
  }
}

function findBestPlacement(
  anchor: HTMLElement,
  popover: HTMLElement,
  preferred: Placement,
  fallbacks: Placement[]
): Placement {
  const needed = {
    width: popover.offsetWidth,
    height: popover.offsetHeight,
  };

  // Try preferred first
  const preferredSpace = getAvailableSpace(anchor, preferred);
  const requiredSpace =
    preferred === "top" || preferred === "bottom"
      ? needed.height
      : needed.width;

  if (preferredSpace >= requiredSpace) {
    return preferred;
  }

  // Try fallbacks
  for (const fallback of fallbacks) {
    const space = getAvailableSpace(anchor, fallback);
    const required =
      fallback === "top" || fallback === "bottom"
        ? needed.height
        : needed.width;

    if (space >= required) {
      return fallback;
    }
  }

  // Nothing fits perfectly, use the one with most space
  const options = [preferred, ...fallbacks];
  return options.reduce((best, current) => {
    const bestSpace = getAvailableSpace(anchor, best);
    const currentSpace = getAvailableSpace(anchor, current);
    return currentSpace > bestSpace ? current : best;
  });
}

/*************************************************
 *                createPopover                  *
 *************************************************/
export function createPopover(
  anchor: HTMLElement,
  opts: PopoverOptions = {}
): PopoverController {
  const {
    placement = "bottom",
    offset = 8,
    fallbacks = ["top", "right", "left"].filter(
      (p) => p !== placement
    ) as Placement[],
  } = opts;

  const anchorId = ensureAnchorId(anchor);

  const popover = document.createElement("div");
  popover.setAttribute("popover", "auto");
  popover.setAttribute("anchor", anchorId);
  popover.className = "popover-lite";
  popover.tabIndex = -1;

  setOffset(popover, offset);
  setPlacement(popover, placement);

  document.body.appendChild(popover);

  function update() {
    const best = findBestPlacement(anchor, popover, placement, fallbacks);
    setPlacement(popover, best);
  }

  function show() {
    update();
    if ("showPopover" in popover && typeof popover.showPopover === "function") {
      popover.showPopover();
    } else {
      // Fallback for older browsers
      popover.style.display = "block";
    }
  }

  function hide() {
    if ("hidePopover" in popover && typeof popover.hidePopover === "function") {
      popover.hidePopover();
    } else {
      popover.style.display = "none";
    }
  }

  function toggle() {
    const isOpen =
      popover.matches(":popover-open") || popover.style.display === "block";
    isOpen ? hide() : show();
  }

  function destroy() {
    resizeObserver.disconnect();
    scrollParents.forEach((parent) =>
      parent.removeEventListener("scroll", update)
    );
    popover.remove();
  }

  // Set up reactive updates
  const resizeObserver = new ResizeObserver(update);
  resizeObserver.observe(anchor);
  resizeObserver.observe(popover);

  const scrollParents = getScrollParents(anchor);
  scrollParents.forEach((parent) =>
    parent.addEventListener("scroll", update, { passive: true })
  );

  return {
    element: popover,
    show,
    hide,
    toggle,
    update,
    destroy,
  };
}
