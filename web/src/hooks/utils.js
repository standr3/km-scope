

export const gridPos = (idx) => {
  const col = idx % 6;
  const row = Math.floor(idx / 6);
  return { x: col * 220, y: row * 140 };
};
