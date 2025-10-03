import React, { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Navbar = () => {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAuthenticated, logout, activeRole } = useAuth ? useAuth() : { user: null, isAuthenticated: false, logout: () => {}, activeRole: null };
  const [query, setQuery] = useState("");

  return (
    <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/home" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primaryGreen" />
          <span className="text-lg font-extrabold text-primaryGreen">MentorMesh</span>
        </Link>

        <div className="flex items-center gap-4">
          <Link to="/home" className="text-sm text-gray-700 hover:text-primaryGreen">Home</Link>
          
          {/* Sessions link for mentors */}
          {isAuthenticated && (activeRole === 'mentor' || user?.roles?.includes('mentor')) && (
            <Link to="/sessions" className="text-sm text-gray-700 hover:text-primaryGreen">Sessions</Link>
          )}

          {/* Global search always visible */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (!query.trim()) return;
              navigate(`/search?q=${encodeURIComponent(query.trim())}`);
              setQuery("");
            }}
            className="hidden md:flex items-center gap-2"
          >
            <input
              type="text"
              placeholder="Search skills"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="px-3 py-1.5 rounded-md border ring-1 ring-gray-200 focus:outline-none focus:ring-primaryGreen"
            />
            <button className="px-3 py-1.5 rounded-md bg-primaryGreen text-white text-sm">Search</button>
          </form>

          {/* Auth actions */}
          {isAuthenticated ? (
            <div className="relative">
              <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-full border px-2 py-1 hover:shadow">
                <span className="h-7 w-7 rounded-full bg-lightGreen inline-block" />
                <span className="text-sm font-medium text-gray-800">{user?.fullName || 'Profile'}</span>
              </button>
              {open && (
                <div className="absolute right-0 mt-2 w-48 rounded-md border bg-white shadow-md">
                  {/* Show role-specific profile link */}
                  {activeRole === 'mentor' || (user?.roles?.includes('mentor') && user?.roles?.length === 1) ? (
                    <Link to="/mentor-profile" className="block px-3 py-2 text-sm hover:bg-gray-50">Mentor Profile</Link>
                  ) : activeRole === 'mentee' || (user?.roles?.includes('mentee') && user?.roles?.length === 1) ? (
                    <Link to="/mentee-profile" className="block px-3 py-2 text-sm hover:bg-gray-50">Mentee Profile</Link>
                  ) : (
                    <>
                      {user?.roles?.includes('mentor') && (
                        <Link to="/mentor-profile" className="block px-3 py-2 text-sm hover:bg-gray-50">Mentor Profile</Link>
                      )}
                      {user?.roles?.includes('mentee') && (
                        <Link to="/mentee-profile" className="block px-3 py-2 text-sm hover:bg-gray-50">Mentee Profile</Link>
                      )}
                    </>
                  )}
                  
                  <Link to="/settings" className="block px-3 py-2 text-sm hover:bg-gray-50">Settings</Link>
                  <div className="h-px bg-gray-100" />
                  <button 
                    onClick={() => { 
                      logout(); 
                      navigate('/home'); 
                      setOpen(false);
                    }} 
                    className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="px-3 py-1.5 rounded-md border text-sm hover:bg-gray-50">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
};

export default Navbar;


