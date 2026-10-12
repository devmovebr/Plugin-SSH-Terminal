import { describe, expect, it, vi } from "vitest";
import { forwardAppShortcut } from "../../../src/frontend/lib/app-shortcut-forwarding";

function keyEvent(init: Partial<KeyboardEvent> & Pick<KeyboardEvent, "code">) {
  const event = {
    type: "keydown",
    key: "",
    altKey: false,
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    defaultPrevented: false,
    stopPropagation: vi.fn(),
    preventDefault() {
      event.defaultPrevented = true;
    },
    ...init,
  };
  return event as unknown as KeyboardEvent & {
    stopPropagation: ReturnType<typeof vi.fn>;
  };
}

const uses = (e: KeyboardEvent) => e.preventDefault();
const ignores = () => {};

describe("forwardAppShortcut", () => {
  it("hands Cmd+Shift+\\ to the shell on macOS", () => {
    const e = keyEvent({ code: "Backslash", metaKey: true, shiftKey: true });
    const handler = vi.fn(uses);

    expect(forwardAppShortcut(e, handler, true)).toBe(false);
    expect(handler).toHaveBeenCalledWith(e);
    expect(e.stopPropagation).toHaveBeenCalled();
  });

  it("keeps Ctrl+Shift working on macOS", () => {
    const e = keyEvent({ code: "BracketRight", ctrlKey: true, shiftKey: true });
    expect(forwardAppShortcut(e, uses, true)).toBe(false);
  });

  it("leaves Cmd+Shift alone outside macOS", () => {
    const handler = vi.fn(uses);
    const e = keyEvent({ code: "Backslash", metaKey: true, shiftKey: true });

    expect(forwardAppShortcut(e, handler, false)).toBeNull();
    expect(handler).not.toHaveBeenCalled();
  });

  it("lets Option+arrow reach the shell when there is no pane to move to", () => {
    const e = keyEvent({ code: "ArrowLeft", altKey: true });

    expect(forwardAppShortcut(e, ignores, true)).toBeNull();
    expect(e.stopPropagation).not.toHaveBeenCalled();
  });

  it("moves between panes with Option+arrow inside a split", () => {
    const e = keyEvent({ code: "ArrowRight", altKey: true });
    expect(forwardAppShortcut(e, uses, true)).toBe(false);
  });

  it("lets a chord the global handler did not use bubble to the window", () => {
    const e = keyEvent({ code: "KeyE", metaKey: true, shiftKey: true });

    expect(forwardAppShortcut(e, ignores, true)).toBe(false);
    expect(e.stopPropagation).not.toHaveBeenCalled();
  });

  it("ignores plain Cmd and Ctrl keys", () => {
    expect(
      forwardAppShortcut(keyEvent({ code: "KeyC", metaKey: true }), uses, true),
    ).toBeNull();
    expect(
      forwardAppShortcut(
        keyEvent({ code: "Minus", ctrlKey: true }),
        uses,
        true,
      ),
    ).toBeNull();
  });
});
