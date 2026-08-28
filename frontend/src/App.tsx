import { BrowserRouter, Routes, Route } from "react-router-dom";
import Layout from "@/components/Layout";
import Home from "@/pages/Home";
import ApplyForm from "@/pages/apply/ApplyForm";
import Dashboard from "@/pages/hr/Dashboard";
import Review from "@/pages/hr/Review";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Home />} />
          <Route path="/apply" element={<ApplyForm />} />
          <Route path="/hr" element={<Dashboard />} />
          <Route path="/hr/review/:id" element={<Review />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;