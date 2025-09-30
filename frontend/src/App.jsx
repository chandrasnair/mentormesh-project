import React from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Signup from "./pages/Signup.jsx";
import MentorDashboard from "./pages/MentorDashboard";


function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path = "/mentor-dashboard" element={<MentorDashboard />}/>
      </Routes>
    </BrowserRouter>
  );
}

export default App;


