export function classNames(...classes: (string | boolean | undefined | null)[]) {
  return classes.filter(Boolean).join(' ');
}

export const formatTime = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const secs = (seconds % 60).toString().padStart(2, '0');
  return `${mins}:${secs}`;
};

export const pieceMap: { [key: number]: string } = {
  1: 'white_king',
  2: 'white_queen',
  3: 'white_bishop',
  4: 'white_knight',
  5: 'white_rook',
  6: 'white_pawn',
  '-1': 'black_king',
  '-2': 'black_queen',
  '-3': 'black_bishop',
  '-4': 'black_knight',
  '-5': 'black_rook',
  '-6': 'black_pawn',
};

const pieceImages: Record<string, string> = {};
const images = import.meta.glob<{ default: string }>('/src/assets/chess_pieces/*.svg', {
  eager: true,
});

for (const path in images) {
  const filename = path.split('/').pop()?.replace('.svg', ''); // Ensure filename is valid
  if (filename) {
    pieceImages[filename] = images[path].default; // ✅ TypeScript now recognizes this correctly
  }
}

export default pieceImages;
