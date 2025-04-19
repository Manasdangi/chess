import ChessBoard from "./Screens/ChessBoard/ChessBoard";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import Home from "./Screens/Home/Home";
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/room/:roomId" element={<ChessBoard />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
