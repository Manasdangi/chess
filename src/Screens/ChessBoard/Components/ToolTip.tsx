import styles from "./ToolTip.module.scss";
import pieceImages, { pieceMap } from "../../../utils/Util";

const ToolTip = ({
  x,
  y,
  showBlack,
  selectPiece,
}: {
  x: number;
  y: number;
  showBlack: boolean;
  selectPiece: (piece: number) => void;
}) => {
  const white_piece_array = [2, 3, 4, 5];
  const black_piece_array = [-2, -3, -4, -5];
  const finalArray = showBlack ? black_piece_array : white_piece_array;

  return (
    <div
      className={styles.container}
      style={{
        position: "absolute",
        left: x,
        top: y - 18,
        backgroundColor: "grey",
        borderRadius: "5px",
        fontSize: "12px",
        whiteSpace: "nowrap",
        transform: "translate(-50%, -100%)", // Center align & position above
      }}
    >
      {finalArray.map((item) => (
        <img
          onClick={() => {
            selectPiece(item);
          }}
          src={pieceImages[pieceMap[item]]}
          width="40"
          height="40"
        />
      ))}
    </div>
  );
};

export default ToolTip;
