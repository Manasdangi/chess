import { useState } from "react";
import { useNavigate } from "react-router-dom";
import socket from "../../Socket/socket";
import styles from "./Home.module.scss";

export default function Home() {
  const [roomId, setRoomId] = useState("");
  const navigate = useNavigate();

  const handleJoin = () => {
    console.log("joinRoom", roomId);
    socket.emit("joinRoom", roomId);
    navigate(`/room/${roomId}`);
  };

  return (
    <div className={styles.container}>
      <h2>Play Chess Online</h2>
      <input
        placeholder="Enter Room ID"
        value={roomId}
        onChange={(e) => setRoomId(e.target.value)}
      />
      <button onClick={handleJoin}>Join Game</button>
    </div>
  );
}
