import React, { useState } from "react";

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="sticky top-0 z-20 bg-white/90 backdrop-blur border-b">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <a href="/" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primaryGreen" />
          <span className="text-lg font-extrabold text-primaryGreen">MentorMesh</span>
        </a>

        <div className="flex items-center gap-4">
          <a href="/mentor-dashboard" className="text-sm text-gray-700 hover:text-primaryGreen">Dashboard</a>
          <a href="#" className="text-sm text-gray-700 hover:text-primaryGreen">Sessions</a>
          <div className="relative">
            <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 rounded-full border px-2 py-1 hover:shadow">
              <span className="h-7 w-7 rounded-full bg-lightGreen inline-block" />
              <span className="text-sm font-medium text-gray-800">John Doe</span>
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-44 rounded-md border bg-white shadow-md">
                <a href="#" className="block px-3 py-2 text-sm hover:bg-gray-50">Profile</a>
                <a href="#" className="block px-3 py-2 text-sm hover:bg-gray-50">Settings</a>
                <div className="h-px bg-gray-100" />
                <button className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50">Logout</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;


