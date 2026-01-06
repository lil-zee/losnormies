const PALETTE = [
  'text-green-500 border-green-500', 
  'text-cyan-400 border-cyan-500', 
  'text-amber-400 border-amber-500', 
  'text-rose-400 border-rose-500', 
  'text-violet-400 border-violet-500',
  'text-blue-400 border-blue-500'
];

export function getColorClasses(id: string) {
  if (!id) return { text: 'text-green-500', border: 'border-green-500' };
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const cls = PALETTE[Math.abs(hash) % PALETTE.length];
  const [text, border] = cls.split(' ');
  return { text, border };
}
