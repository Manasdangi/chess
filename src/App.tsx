import ChessBoard from "./Screens/ChessBoard/ChessBoard";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./Screens/Home/Home";
import styles from "./App.module.scss";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<ChessBoard />} />
        <Route path="*" element={
          <div className={styles.errorContainer}>
            <h1>404 - Page Not Found</h1>
            <p>The page you are looking for does not exist.</p>
            <button onClick={() => window.location.href = "/"}>Go to Home</button>
          </div>
        } />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
