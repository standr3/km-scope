// ─────────────────────────────────────────────────────────────────────────────
// YJS UTILS
// Operează direct pe Y.Array — nu sunt funcții pure
// ─────────────────────────────────────────────────────────────────────────────

export function removeEventsWhere(yEventsArray, predicate) {
  const arr = yEventsArray.toArray();
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) {
      yEventsArray.delete(i, 1);
    }
  }
}

export function removeEventById(yEventsArray, eventId) {
  const arr = yEventsArray.toArray();
  const index = arr.findIndex((e) => e.id === eventId);
  if (index !== -1) {
    yEventsArray.delete(index, 1);
  }
}

export function hasEventsWhere(yEventsArray, predicate) {
  const arr = yEventsArray.toArray();
  for (let i = arr.length - 1; i >= 0; i--) {
    if (predicate(arr[i])) return true;
  }
  return false;
}