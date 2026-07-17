import pieceImages, { pieceMap } from '../../../utils/Util';
import styles from '../ChessBoard.module.scss';

const RenderPieces: React.FC<{
  val: number;
}> = ({ val }) => {
  const shouldDrawPiece = () => {
    if (val == 0) return false;
    return true;
  };

  const renderContent = () => {
    if (val === 0 || !shouldDrawPiece()) return null; // No need for an else block

    const pieceURL = pieceImages[pieceMap[val]];
    return <img src={pieceURL} className={styles.piece} alt="" draggable={false} />;
  };

  return renderContent();
};

export default RenderPieces;
