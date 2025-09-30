import React from "react";

const Footer = () => {
  return (
    <footer className="mt-12 border-t bg-white/60">
      <div className="max-w-6xl mx-auto px-4 py-6 flex items-center justify-between text-sm text-gray-600">
        <p>© {new Date().getFullYear()} MentorMesh</p>
        <div className="flex items-center gap-4">
          <a href="#" className="hover:text-primaryGreen">Privacy</a>
          <a href="#" className="hover:text-primaryGreen">Terms</a>
          <a href="#" className="hover:text-primaryGreen">Contact</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;


