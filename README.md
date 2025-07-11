# popover-lite

A lightweight, pragmatic popover library built on the native Popover API and CSS Anchor Positioning. No dependencies, no framework lock-in, just simple popovers that work.

## Why popover-lite?

- **Tiny**: ~2KB minified, because your bundle size matters
- **Modern**: Uses native browser APIs (Popover API + CSS Anchor Positioning)
- **Smart**: Automatically finds the best placement when your preferred spot doesn't fit
- **Zero dependencies**: No React, no jQuery, no drama
- **TypeScript**: Fully typed for better DX

## Installation

```bash
npm install popover-lite
```

## Quick Start

```javascript
import { createPopover } from "popover-lite";

const button = document.querySelector("#my-button");
const popover = createPopover(button);

// Add your content
popover.element.innerHTML = "<p>Hello, world!</p>";

// Show it
button.addEventListener("click", () => popover.show());
```

That's it. No complex setup, no configuration hell.

## API Reference

### `createPopover(anchor, options)`

Creates a popover attached to an anchor element.

**Parameters:**

- `anchor: HTMLElement` - The element to attach the popover to
- `options: PopoverOptions` - Optional configuration

**Returns:** `PopoverController`

### PopoverOptions

```typescript
interface PopoverOptions {
  /** Preferred placement. Default: 'bottom' */
  placement?: "top" | "bottom" | "left" | "right";

  /** Gap between popover and anchor in pixels. Default: 8 */
  offset?: number;

  /** Fallback placements when preferred doesn't fit. Default: ['top', 'right', 'left'] */
  fallbacks?: Placement[];
}
```

### PopoverController

```typescript
interface PopoverController {
  readonly element: HTMLElement; // The popover element
  show(): void; // Show the popover
  hide(): void; // Hide the popover
  toggle(): void; // Toggle visibility
  update(): void; // Recalculate position
  destroy(): void; // Clean up everything
}
```

## Examples

### Basic Tooltip

```javascript
const tooltip = createPopover(button, {
  placement: "top",
  offset: 4,
});

tooltip.element.textContent = "This is a tooltip";
tooltip.element.className = "tooltip";

button.addEventListener("mouseenter", () => tooltip.show());
button.addEventListener("mouseleave", () => tooltip.hide());
```

### Dropdown Menu

```javascript
const dropdown = createPopover(menuButton, {
  placement: "bottom",
  fallbacks: ["top"],
});

dropdown.element.innerHTML = `
  <ul class="menu">
    <li><a href="#profile">Profile</a></li>
    <li><a href="#settings">Settings</a></li>
    <li><a href="#logout">Logout</a></li>
  </ul>
`;

menuButton.addEventListener("click", () => dropdown.toggle());
```

### Smart Positioning

```javascript
// This will try 'right' first, then fall back to 'left', 'top', 'bottom'
const smartPopover = createPopover(element, {
  placement: "right",
  fallbacks: ["left", "top", "bottom"],
});
```

## CSS Styling

popover-lite adds minimal CSS classes and custom properties you can style:

```css
.popover-lite {
  /* Your base popover styles */
  background: white;
  border: 1px solid #ccc;
  border-radius: 4px;
  padding: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* Style based on placement */
.popover-lite[data-placement="top"] {
  /* Styles when placed above anchor */
}

.popover-lite[data-placement="bottom"] {
  /* Styles when placed below anchor */
}

/* Use CSS custom properties */
.popover-lite {
  /* Access the offset value */
  margin: var(--offset);
}
```

## Browser Support

- **Modern browsers**: Full support with Popover API + CSS Anchor Positioning
- **Older browsers**: Graceful fallback to basic show/hide

Requires browsers that support:

- CSS Anchor Positioning (Chrome 125+, Firefox 131+)
- Popover API (Chrome 114+, Firefox 125+)
- ResizeObserver (widely supported)

## Framework Integration

### React

```jsx
import { useEffect, useRef } from "react";
import { createPopover } from "popover-lite";

function MyComponent() {
  const buttonRef = useRef(null);
  const popoverRef = useRef(null);

  useEffect(() => {
    if (buttonRef.current) {
      const popover = createPopover(buttonRef.current);
      popoverRef.current = popover;

      return () => popover.destroy();
    }
  }, []);

  return (
    <button ref={buttonRef} onClick={() => popoverRef.current?.toggle()}>
      Click me
    </button>
  );
}
```

### Vue

```vue
<template>
  <button ref="button" @click="toggle">Click me</button>
</template>

<script>
import { createPopover } from "popover-lite";

export default {
  mounted() {
    this.popover = createPopover(this.$refs.button);
  },

  beforeUnmount() {
    this.popover?.destroy();
  },

  methods: {
    toggle() {
      this.popover?.toggle();
    },
  },
};
</script>
```

## Migration from v0.1.x

- `placement` option no longer accepts arrays - use `fallbacks` instead
- `offset` is now a simple number, not an object
- `preference` option removed - use `fallbacks` for priority
- Misalignment scoring removed - positioning is now simpler and more predictable

## Contributing

Found a bug? Want a feature? [Open an issue](https://github.com/akpsan/popover-lite/issues) or submit a PR.

## License

MIT © 2025
