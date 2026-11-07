"use client";

import { useState } from "react";

/**
 * Whether a form's values differ from what was last saved (or what it
 * opened with), so its save button can stay off while nothing changed.
 * `value` must be JSON-serialisable; key order counts, so build it the same
 * way every render. After a save that keeps the form open, call
 * `markSaved(snapshot)` with the snapshot taken when the save started.
 */
export function useDirty(value: unknown) {
  const snapshot = JSON.stringify(value);
  const [baseline, setBaseline] = useState(snapshot);
  return { dirty: snapshot !== baseline, snapshot, markSaved: setBaseline };
}
