import { isMacPlatform } from "@termix-ssh/plugin-sdk/ui";

/** Keys the shell binds to Ctrl+Shift (Cmd+Shift on macOS). */
const APP_CHORD_CODES = [
  "BracketRight",
  "BracketLeft",
  "Backslash",
  "Minus",
  "Enter",
  "KeyE",
  "KeyF",
];

/** Alt (Option) plus these moves between split panes. */
const PANE_MOVE_CODES = ["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"];

/** Ctrl+Shift, or Cmd+Shift on macOS, where Ctrl belongs to the shell. */
export function isAppChord(e: KeyboardEvent, mac = isMacPlatform()): boolean {
  if (!e.shiftKey || e.altKey) return false;
  if (e.ctrlKey && !e.metaKey) return true;
  return mac && e.metaKey && !e.ctrlKey;
}

/**
 * Hands the shell's own shortcuts to AppShell. xterm stops the keys it
 * handles from bubbling, so the window listener alone never hears them, and
 * synthetic re-dispatch is unreliable.
 *
 * Returns false when xterm must leave the key alone, null when the key is
 * the terminal's. A shortcut the shell used is stopped here so the window
 * listener does not run it twice. One it did not use keeps bubbling to the
 * other window listeners, except Alt+arrow outside a split, which goes back
 * to the shell (Option+arrow moves by word on macOS).
 */
export function forwardAppShortcut(
  e: KeyboardEvent,
  handler: ((e: KeyboardEvent) => void) | null | undefined,
  mac = isMacPlatform(),
): false | null {
  const chord = isAppChord(e, mac) && APP_CHORD_CODES.includes(e.code);
  const paneMove =
    e.altKey &&
    !e.ctrlKey &&
    !e.shiftKey &&
    !e.metaKey &&
    PANE_MOVE_CODES.includes(e.code);
  if (!chord && !paneMove) return null;

  handler?.(e);
  if (e.defaultPrevented) {
    e.stopPropagation();
    return false;
  }
  return paneMove ? null : false;
}
