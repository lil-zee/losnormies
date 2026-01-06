export function generateShortId(fullId: string): string {
  // Generate a short 8-character ID from the full cuid
  return fullId.slice(0, 8);
}
