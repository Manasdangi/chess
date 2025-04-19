export interface Move {
  from: string;
  to: string;
  piece: string;
  color: 'white' | 'black';
  promotion?: string;
} 