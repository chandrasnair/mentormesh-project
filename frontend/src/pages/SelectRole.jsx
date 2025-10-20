import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Login.css";

import boy from "../assets/boy.png";
import twowoman from "../assets/twowoman.png";
import laptop from "../assets/laptop.png";

const SelectRole = () => {
  const { user, setActiveRole } = useAuth();
  const navigate = useNavigate();

  // Redirect if user doesn't have multiple roles
  useEffect(() => {
    // If user data is available but they don't have multiple roles,
    // or if the only other role is a pending mentor, redirect away.
    if (user) {
      const activeRoles = user.roles?.filter(role => role === 'mentee' || (role === 'mentor' && user.accountStatus === 'active'));
      // If there are less than 2 active roles to choose from, redirect.
      if (!activeRoles || activeRoles.length < 2) {
        navigate("/home"); // Redirect to home if they land here incorrectly
      }
    }
  }, [user, navigate]);

  const handleRoleSelect = (role) => {
    setActiveRole(role);
    // Always redirect to home page after role selection
    navigate("/home");
  };

  // Show a loading state or return null if user data isn't ready yet
  // or if they don't have multiple roles.
  const availableRoles = user?.roles?.filter(role => role === 'mentee' || (role === 'mentor' && user.accountStatus === 'active'));
  if (!user || !availableRoles || availableRoles.length < 2) {
    return null;
  }

  return (
    <div className="login-container">
      {/* LEFT PANEL with welcome image */}
      <div className="left-panel">
        <div className="slide active">
          <img src={twowoman} alt="multi-role user" />
          <p>Welcome back! Choose your role to continue your journey.</p>
        </div>
      </div>

      {/* RIGHT PANEL with role selection */}
      <div className="right-panel">
        <div className="login-box">
          <h1 className="brand-name">MentorMesh</h1>
          <h2 className="welcome-text">Welcome, {user.fullName}!</h2>
          <p style={{ marginBottom: '2rem', color: '#666', fontSize: '0.9rem' }}>
            You have multiple roles. Please select how you'd like to continue:
          </p>

          <div className="role-buttons">
            {user.roles.includes("mentor") && user.accountStatus === "active" && (
              <button
                className="role-btn"
                onClick={() => handleRoleSelect("mentor")}
              >
                Continue as Mentor
                <span style={{ fontSize: '0.8rem', display: 'block', marginTop: '0.5rem', opacity: 0.8 }}>
                  Share your knowledge and guide mentees
                </span>
              </button>
            )}
            {user.roles.includes("mentor") && user.accountStatus !== "active" && (
              <div
                className="role-btn disabled"
                style={{ opacity: 0.6, cursor: 'not-allowed' }}
                title="Your mentor application is under review. You will be notified once approved."
              >
                Mentor Application Pending
                <span style={{ fontSize: '0.8rem', display: 'block', marginTop: '0.5rem', opacity: 0.8 }}>
                  Application under review by admin team
                </span>
              </div>
            )}
            {user.roles.includes("mentee") && (
              <button
                className="role-btn"
                onClick={() => handleRoleSelect("mentee")}
              >
                Continue as Mentee
                <span style={{ fontSize: '0.8rem', display: 'block', marginTop: '0.5rem', opacity: 0.8 }}>
                  Learn from experts and grow your skills
                </span>
              </button>
            )}
          </div>

          <div className="extra-links" style={{ marginTop: '2rem' }}>
            <button 
              onClick={() => navigate("/home")}
              className="link-button"
            >
              Go to Home Page
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SelectRole;
