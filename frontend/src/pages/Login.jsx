import React, { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "./Login.css";

import boy from "../assets/boy.png";
import twowoman from "../assets/twowoman.png";
import laptop from "../assets/laptop.png";

const slides = [
  { img: boy, text: "Learn new skills and grow your career with experts." },
  { img: twowoman, text: "Build your future through collaboration and learning." },
  { img: laptop, text: "Unlock success with guidance from experts." },
];

const Login = () => {
  const [current, setCurrent] = useState(0);
  const [formData, setFormData] = useState({
    emailOrUsername: "",
    password: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [showAddRoleSection, setShowAddRoleSection] = useState(false);
  const [userEmail, setUserEmail] = useState("");
  const [existingRoles, setExistingRoles] = useState([]);
  const [loading, setLoading] = useState(false);

  const { login, addRole } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Slide animation
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);
    return () => clearInterval(timer);
  }, []);

  // Handle messages from signup or other pages
  useEffect(() => {
    if (location.state?.message) {
      setSuccess(location.state.message);
      setTimeout(() => setSuccess(""), 5000);
    }
    if (location.state?.email) {
      setFormData(prev => ({ ...prev, emailOrUsername: location.state.email }));
      setUserEmail(location.state.email);
      // Show add role section immediately if redirected from signup with existing email
      if (location.state?.message?.toLowerCase().includes("already registered")) {
        setShowAddRoleSection(true);
        // We don't know the existing roles yet, so we'll handle this in the add role page
        setExistingRoles([]);
      }
    }
  }, [location.state]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
    setSuccess("");
    setShowAddRoleSection(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    setShowAddRoleSection(false);

    try {
      const result = await login(formData.emailOrUsername, formData.password);

      if (result.success) {
        const loggedUser = result.user;

        // Redirect based on roles - always go to home or select-role
        if (loggedUser.roles.length > 1) {
          navigate("/select-role");
        } else {
          navigate("/home");
        }
      } else {
        setError(result.error);
        // Show add role section if login failed due to missing credentials
        if (formData.emailOrUsername) {
          setUserEmail(formData.emailOrUsername);
          setShowAddRoleSection(true);
        }
      }
    } catch (err) {
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddRoleRedirect = () => {
    navigate("/add-role", { 
      state: { 
        email: userEmail,
        existingRoles: existingRoles 
      }
    });
  };

  return (
    <div className="login-container">
      {/* LEFT PANEL with slides */}
      <div className="left-panel">
        {slides.map((slide, index) => (
          <div
            className={`slide ${index === current ? "active" : ""}`}
            key={index}
          >
            <img src={slide.img} alt="slide" />
            <p>{slide.text}</p>
          </div>
        ))}
      </div>

      {/* RIGHT PANEL with login box */}
      <div className="right-panel">
        <div className="login-box">
          <h1 className="brand-name">MentorMesh</h1>
          <h2 className="welcome-text">Welcome</h2>

          <form onSubmit={handleSubmit}>
            <input
              type="text"
              name="emailOrUsername"
              placeholder="Email or Username"
              value={formData.emailOrUsername}
              onChange={handleChange}
              required
            />
            <input
              type="password"
              name="password"
              placeholder="Password"
              value={formData.password}
              onChange={handleChange}
              required
            />

            {error && <div className="error-message">{error}</div>}
            {success && <div className="success-message">{success}</div>}

            <button type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          {/* Add Role Option */}
          {showAddRoleSection && (
            <div className="add-role-section">
              <div className="add-role-info">
                <p>Don't have an account with the required role?</p>
                <button 
                  onClick={handleAddRoleRedirect} 
                  disabled={loading}
                  className="add-role-btn"
                >
                  Add Role
                </button>
              </div>
            </div>
          )}

          <div className="extra-links">
            <Link to="#">Forgot Password?</Link> |{" "}
            <Link to="/signup">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
