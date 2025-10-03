import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { skillsAPI } from "../services/api";
import "./Login.css";

import boy from "../assets/boy.png";
import twowoman from "../assets/twowoman.png";
import laptop from "../assets/laptop.png";

// Slide carousel data
const slides = [
  { img: boy, text: "Learn new skills and grow your career with experts." },
  { img: twowoman, text: "Build your future through collaboration and learning." },
  { img: laptop, text: "Unlock success with guidance from experts." },
];

// Role-specific fields
const roleFields = {
  mentee: [
    { name: "interests", placeholder: "Learning interests (Python, Web Dev…)", type: "textarea", required: false },
    { name: "goals", placeholder: "Your learning goals", type: "textarea", required: false },
    { name: "currentLevel", placeholder: "Current skill level", type: "select", required: false, options: ["beginner", "intermediate", "advanced"] },
  ],
  mentor: [
    { name: "mentorSkills", placeholder: "Your skills (Python, Data Science…)", type: "textarea", required: true },
    { name: "mentorBio", placeholder: "Short bio about you", type: "textarea", required: true },
    { name: "expertise", placeholder: "Area of expertise", type: "text", required: false },
    { name: "experience", placeholder: "Years of experience", type: "number", required: false },
  ],
};

const Signup = () => {
  const [current, setCurrent] = useState(0);
  const [roles, setRoles] = useState(() => {
    const saved = localStorage.getItem("signupRoles");
    return saved ? JSON.parse(saved) : ["mentee"];
  });
  const [dynamicFields, setDynamicFields] = useState({});
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [availableSkills, setAvailableSkills] = useState([]);

  const { signup, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Slide carousel
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) navigate("/home");
  }, [isAuthenticated, navigate]);

  // Load skills
  useEffect(() => {
    const loadSkills = async () => {
      try {
        const response = await skillsAPI.getSkills();
        setAvailableSkills(response.skills);
      } catch (err) {
        console.error("Failed to load skills:", err);
      }
    };
    loadSkills();
  }, []);

  // Persist roles selection
  useEffect(() => {
    localStorage.setItem("signupRoles", JSON.stringify(roles));
  }, [roles]);

  const handleRoleChange = (role) => {
    if (roles.includes(role)) {
      setRoles(roles.filter((r) => r !== role));
    } else {
      setRoles([...roles, role]);
    }
    setError("");
  };

  const handleFieldChange = (fieldName, value) => {
    setDynamicFields((prev) => ({ ...prev, [fieldName]: value }));
    setError("");
  };

  const handleSignupSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess(false);

    const formData = {
      fullName: e.target[0].value,
      email: e.target[1].value,
      password: e.target[2].value,
      confirmPassword: e.target[3].value,
      roles,
      ...dynamicFields, // spread the dynamic fields directly
    };

    try {
      const result = await signup(formData);

      if (result.success) {
        setSuccess(true);
        const user = result.user;

        if (user.roles.length > 1) {
          navigate("/select-role");
        } else {
          navigate("/home");
        }
      } else if (result.emailExists) {
        setError("Email already exists. Redirecting to login page...");
        setTimeout(() => {
          navigate("/login", { 
            state: { 
              email: formData.email,
              message: "This email is already registered. Please login or add a new role."
            }
          });
        }, 2000);
      } else {
        setError(result.error || result.message || "Signup failed");
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
          <h2 className="welcome-text">Create your Account</h2>

          <form onSubmit={handleSignupSubmit}>
            <input type="text" placeholder="Full Name" required />
            <input type="email" placeholder="Email" required />
            <input type="password" placeholder="Password" required />
            <input type="password" placeholder="Confirm Password" required />

            {/* Role checkboxes */}
            <div className="role-selection">
              <label>Select your role(s):</label>
              <div className="role-checkboxes">
                <label>
                  <input
                    type="checkbox"
                    checked={roles.includes("mentee")}
                    onChange={() => handleRoleChange("mentee")}
                  />
                  Mentee
                </label>
                <label>
                  <input
                    type="checkbox"
                    checked={roles.includes("mentor")}
                    onChange={() => handleRoleChange("mentor")}
                  />
                  Mentor
                </label>
              </div>
            </div>

            {/* Role dynamic fields */}
            {roles.map((role) =>
              roleFields[role].map((field) => (
                <div key={`${role}-${field.name}`}>
                  {field.type === "textarea" ? (
                    <textarea
                      placeholder={field.placeholder}
                      value={dynamicFields[field.name] || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      required={field.required}
                    />
                  ) : field.type === "select" ? (
                    <select
                      value={dynamicFields[field.name] || ""}
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
                      value={dynamicFields[field.name] || ""}
                      onChange={(e) => handleFieldChange(field.name, e.target.value)}
                      required={field.required}
                    />
                  )}
                </div>
              ))
            )}

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">Account created successfully!</div>}

            <button type="submit" disabled={loading || roles.length === 0}>
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <div className="extra-links">
            <Link to="/login">Already have an account? Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
