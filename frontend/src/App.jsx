import React from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Login from "./pages/Login";
import Signup from "./pages/Signup.jsx";
import AddRole from "./pages/AddRole.jsx";
import MentorDashboard from "./pages/MentorDashboard";
import MenteeDashboard from "./pages/MenteeDashboard";
import Sessions from "./pages/Sessions";
import Settings from "./pages/Settings";
import Home from "./pages/Home";
import SearchResults from "./pages/SearchResults";
import SelectRole from "./pages/SelectRole";


function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Navigate to="/home" replace />} />
          <Route path="/select-role" element={<SelectRole />} />
          <Route path="/home" element={<Home />} />
          <Route path="/search" element={<SearchResults />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/add-role" element={<AddRole />} />
          <Route path="/mentor-profile" element={<MentorDashboard />}/>
          <Route path="/mentee-profile" element={<MenteeDashboard />}/>
          <Route path="/sessions" element={<Sessions />}/>
          <Route path="/settings" element={<Settings />}/>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;


