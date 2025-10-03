import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { authAPI } from "../services/api";
import "./Login.css";

import boy from "../assets/boy.png";
import twowoman from "../assets/twowoman.png";
import laptop from "../assets/laptop.png";

// Slide carousel data
const slides = [
  { img: boy, text: "Expand your journey by adding a new role." },
  { img: twowoman, text: "Become both a mentor and mentee for complete growth." },
  { img: laptop, text: "Unlock new opportunities with additional roles." },
];

// Role-specific fields
const roleFields = {
  mentee: [
    { name: "interests", placeholder: "Learning interests (Python, Web Dev…)", type: "textarea", required: false },
    { name: "goals", placeholder: "Your learning goals", type: "textarea", required: false },
    { name: "currentLevel", placeholder: "Current skill level", type: "select", required: false, options: ["beginner", "intermediate", "advanced"] },
    { name: "menteeBio", placeholder: "Short bio about yourself", type: "textarea", required: false },
    { name: "learningGoals", placeholder: "Specific learning goals", type: "textarea", required: false },
  ],
  mentor: [
    { name: "mentorSkills", placeholder: "Your skills (Python, Data Science…)", type: "textarea", required: true },
    { name: "mentorBio", placeholder: "Short bio about you", type: "textarea", required: true },
    { name: "expertise", placeholder: "Area of expertise", type: "text", required: false },
    { name: "experience", placeholder: "Years of experience", type: "number", required: false },
  ],
};

const AddRole = () => {
  const [current, setCurrent] = useState(0);
  const [selectedRole, setSelectedRole] = useState("");
  const [profileData, setProfileData] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [existingRoles, setExistingRoles] = useState([]);
  const [fetchingRoles, setFetchingRoles] = useState(false);
  
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get email and existing roles from location state
  const email = location.state?.email || "";
  const initialExistingRoles = location.state?.existingRoles || [];

  // Slide carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Initialize existing roles
  useEffect(() => {
    if (initialExistingRoles.length > 0) {
      setExistingRoles(initialExistingRoles);
    } else if (email) {
      // If we don't have existing roles, we'll assume the user has at least one role
      // and let them choose from both mentor and mentee (the backend will validate)
      setExistingRoles([]);
    }
  }, [initialExistingRoles, email]);

  // Determine available roles (roles user doesn't have yet)
  // If we don't know existing roles, show both options and let backend validate
  const availableRoles = existingRoles.length === 0 
    ? ["mentor", "mentee"] 
    : ["mentor", "mentee"].filter(role => !existingRoles.includes(role));

  // Auto-select role if only one is available
  useEffect(() => {
    if (availableRoles.length === 1) {
      setSelectedRole(availableRoles[0]);
    }
  }, [availableRoles]);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
      navigate("/login");
    }
  }, [email, navigate]);

  const handleFieldChange = (fieldName, value) => {
    setProfileData((prev) => ({ ...prev, [fieldName]: value }));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    try {
      const response = await authAPI.addRole(email, selectedRole, profileData);

      if (response.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate("/login", { 
            state: { 
              message: `${selectedRole} role added successfully! Please login again.`,
              email: email 
            }
          });
        }, 2000);
      } else {
        setError(response.message || "Failed to add role");
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* LEFT PANEL */}
      <div className="left-panel">
        {slides.map((slide, index) => (
          <div className={`slide ${index === current ? "active" : ""}`} key={index}>
            <img src={slide.img} alt="slide" />
            <p>{slide.text}</p>
          </div>
        ))}
      </div>

      {/* RIGHT PANEL */}
      <div className="right-panel">
        <div className="login-box">
          <h1 className="brand-name">MentorMesh</h1>
          <h2 className="welcome-text">Add New Role</h2>
          
          <div className="user-info-display">
            <p>Adding role for: <strong>{email}</strong></p>
            {existingRoles.length > 0 ? (
              <p>Existing roles: <strong>{existingRoles.join(", ")}</strong></p>
            ) : (
              <p>Select the additional role you want to add to your account</p>
            )}
          </div>

          <form onSubmit={handleSubmit}>
            {/* Role selection */}
            {availableRoles.length > 1 ? (
              <div className="role-selection">
                <label>Select role to add:</label>
                <div className="role-checkboxes">
                  {availableRoles.map((role) => (
                    <label key={role}>
                      <input
                        type="radio"
                        name="role"
                        value={role}
                        checked={selectedRole === role}
                        onChange={(e) => setSelectedRole(e.target.value)}
                        required
                      />
                      {role.charAt(0).toUpperCase() + role.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <div className="role-display">
                <p>Adding role: <strong>{selectedRole}</strong></p>
              </div>
            )}

            {/* Role-specific fields */}
            {selectedRole && roleFields[selectedRole].map((field) => (
              <div key={field.name}>
                {field.type === "textarea" ? (
                  <textarea
                    placeholder={field.placeholder}
                    value={profileData[field.name] || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    required={field.required}
                  />
                ) : field.type === "select" ? (
                  <select
                    value={profileData[field.name] || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    required={field.required}
                  >
                    <option value="">Select {field.placeholder}</option>
                    {field.options.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    placeholder={field.placeholder}
                    value={profileData[field.name] || ""}
                    onChange={(e) => handleFieldChange(field.name, e.target.value)}
                    required={field.required}
                  />
                )}
              </div>
            ))}

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">Role added successfully! Redirecting to login...</div>}

            <button type="submit" disabled={loading || !selectedRole}>
              {loading ? "Adding Role..." : `Add ${selectedRole} Role`}
            </button>
          </form>

          <div className="extra-links">
            <button 
              type="button" 
              onClick={() => navigate("/login")}
              className="link-button"
            >
              Back to Login
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddRole;
