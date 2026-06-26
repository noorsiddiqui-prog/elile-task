import { Routes, Route } from "react-router-dom";
import GraphPage from "./pages/IdentityGraph";
import NotFound from "./pages/NotFound";

function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<GraphPage />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}

export default App;
