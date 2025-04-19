import { useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../../Socket/socket";
import styles from "./Home.module.scss";
import Popup from "./Popup";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const [error, setError] = useState("");
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [popupType, setPopupType] = useState<"success" | "error">("success");
  const navigate = useNavigate();

  const showMessage = (message: string, type: "success" | "error" = "success") => {
    setPopupMessage(message);
    setPopupType(type);
    setShowPopup(true);
  };

  const handleJoin = () => {
    if (!roomId) {
      showMessage("Please enter a room ID", "error");
      return;
    }
    
    socket.emit("checkRoom", roomId, (exists: boolean) => {
      if (exists) {
        console.log("joining room", roomId);
        console.log("joinRoom", roomId);
        socket.emit("joinRoom", roomId);
        showMessage("Joining room...");
        navigate(`/room/${roomId}`);
      } else {
        showMessage("Room does not exist", "error");
      }
    });
  };

  const handleCreate = () => {
    console.log("handleCreate");
    const newRoomId = Math.random().toString(36).substring(2, 8);
    socket.emit("checkRoom", newRoomId, (exists: boolean) => {
      if (exists) {
        console.log("room exists, trying again");
        handleCreate();
      } else {
        console.log("room does not exist, creating room");
        setRoomId(newRoomId);
        console.log("createRoom", newRoomId);
        socket.emit("joinRoom", newRoomId, true);
        navigate(`/room/${newRoomId}`);
      }
    });
  };

  return (
    <div className={styles.container}>
      <h2>Play Chess Online</h2>
      <div className={styles.inputContainer}>
        <input
          placeholder="Enter Room ID"
          value={roomId}
          onChange={(e) => {
            setRoomId(e.target.value);
            setError("");
          }}
        />
        <button onClick={handleJoin}>Join Game</button>
      </div>
      {error && <div className={styles.error}>{error}</div>}
      <div className={styles.divider}>OR</div>
      <button onClick={handleCreate}>Create New Game</button>
      {showPopup && (
        <Popup
          message={popupMessage}
          onClose={() => setShowPopup(false)}
          type={popupType}
        />
      )}
    </div>
  );
}
