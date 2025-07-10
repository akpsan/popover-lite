// popover-lite — v0.1.2
// Lightweight Popper‑style helper built on the native Popover API + CSS Anchor Positioning.
// MIT © 2025 — https://github.com/akpsan/popover-lite

/*************************************************
 *              Public Types & API               *
 *************************************************/
export type Placement = 'top' | 'bottom' | 'left' | 'right';

export interface PopoverOptions {
  /** Preferred placement or priority list. */
  placement?: Placement | Placement[];
  /** Gap between popover and anchor, in px. */
  offset?: number | { x?: number; y?: number };
  /** Extra bias per placement used in scoring. */
  preference?: Partial<Record<Placement, number>>;
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
function setPlacementVar(el: HTMLElement, p: Placement) {
  el.style.setProperty('--placement', p);
  el.dataset.side = p;
}

function applyOffsetVars(el: HTMLElement, off: PopoverOptions['offset']) {
  if (typeof off === 'number') {
    el.style.setProperty('--gap', `${off}px`);
  } else if (off) {
    if (off.x != null) el.style.setProperty('--offset-x', `${off.x}px`);
    if (off.y != null) el.style.setProperty('--offset-y', `${off.y}px`);
  }
}

function getScrollParents(el: HTMLElement): HTMLElement[] {
  const parents: HTMLElement[] = [];
  let p: HTMLElement | null = el.parentElement;
  while (p) {
    const st = getComputedStyle(p);
    if (/auto|scroll|overlay/.test(st.overflow + st.overflowX + st.overflowY)) {
      parents.push(p);
    }
    p = p.parentElement;
  }
  parents.push(document.documentElement);
  return parents;
}

/*************************************************
 *          Placement scoring engine             *
 *************************************************/
export interface PlacementScore {
  placement: Placement;
  space: number;
  overflow: number;
  misalign: number;
  preference: number;
  score: number;
}

export function computeScores(
  anchor: HTMLElement,
  size: { width: number; height: number },
  prefs: Partial<Record<Placement, number>> = {},
): PlacementScore[] {
  const r = anchor.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;

  const candidates: Record<Placement, PlacementScore> = {
    top: {
      placement: 'top',
      space: r.top,
      overflow: Math.max(size.height - r.top, 0),
      misalign: Math.abs(r.left + r.width / 2 - (r.left + size.width / 2)),
      preference: prefs.top ?? 0,
      score: 0,
    },
    bottom: {
      placement: 'bottom',
      space: vh - r.bottom,
      overflow: Math.max(size.height - (vh - r.bottom), 0),
      misalign: Math.abs(r.left + r.width / 2 - (r.left + size.width / 2)),
      preference: prefs.bottom ?? 0,
      score: 0,
    },
    left: {
      placement: 'left',
      space: r.left,
      overflow: Math.max(size.width - r.left, 0),
      misalign: Math.abs(r.top + r.height / 2 - (r.top + size.height / 2)),
      preference: prefs.left ?? 0,
      score: 0,
    },
    right: {
      placement: 'right',
      space: vw - r.right,
      overflow: Math.max(size.width - (vw - r.right), 0),
      misalign: Math.abs(r.top + r.height / 2 - (r.top + size.height / 2)),
      preference: prefs.right ?? 0,
      score: 0,
    },
  };

  for (const s of Object.values(candidates)) {
    s.score = s.space - s.overflow - s.misalign + s.preference;
  }
  return Object.values(candidates).sort((a, b) => b.score - a.score);
}

/*************************************************
 *                createPopover                  *
 *************************************************/
export function createPopover(
  anchor: HTMLElement,
  opts: PopoverOptions = {},
): PopoverController {
  const { placement = 'bottom', offset = 8, preference = {} } = opts;

  if (!anchor.id) anchor.id = `anchor-${Math.random().toString(36).slice(2)}`;
  const anchorId = anchor.id;

  const pop = document.createElement('div');
  pop.setAttribute('popover', 'auto');
  pop.setAttribute('anchor', anchorId);
  pop.className = 'popover-lite';
  pop.tabIndex = -1;

  applyOffsetVars(pop, offset);
  setPlacementVar(pop, Array.isArray(placement) ? placement[0] : placement);

  document.body.appendChild(pop);

  function computeBest(): Placement {
    const order = Array.isArray(placement) ? placement : [placement];
    const size = { width: pop.offsetWidth, height: pop.offsetHeight };
    const scores = computeScores(anchor, size, preference);
    for (let i = 0; i < order.length; i++) {
      const bonus = (order.length - i) * 10_000;
      const s = scores.find(x => x.placement === order[i]);
      if (s) s.score += bonus;
    }
    return scores[0].placement;
  }

  function update() {
    setPlacementVar(pop, computeBest());
  }
  function show() {
    update();
    // @ts-ignore
    pop.showPopover ? pop.showPopover() : pop.togglePopover?.();
  }
  function hide() {
    // @ts-ignore
    pop.hidePopover ? pop.hidePopover() : pop.togglePopover?.();
  }
  function toggle() {
    pop.matches(':popover-open') ? hide() : show();
  }
  function destroy() {
    ro.disconnect();
    scrollParents.forEach(p => p.removeEventListener('scroll', update));
    pop.remove();
  }

  const ro = new ResizeObserver(() => update());
  ro.observe(anchor);
  const scrollParents = getScrollParents(anchor);
  scrollParents.forEach(p => p.addEventListener('scroll', update, { passive: true }));

  const controller: PopoverController = { element: pop, show, hide, toggle, update, destroy };
  return controller;
}
