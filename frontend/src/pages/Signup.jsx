import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "./Login.css";

import boy from "../assets/boy.png";
import twowoman from "../assets/twowoman.png";
import laptop from "../assets/laptop.png";

const slides = [
  { img: boy, text: "Learn new skills and grow your career with experts." },
  { img: twowoman, text: "Build your future through collaboration and learning." },
  { img: laptop, text: "Unlock success with guidance from experts." }
];

const roleFields = {
  mentee: [],
  mentor: [
    { name: "skills", placeholder: "List your skills separated by commas (e.g., Python, Data Science)", type: "textarea", required: true },
    { name: "bio", placeholder: "Short bio / description about you", type: "textarea", required: true }
  ],
};

const Signup = () => {
  const [current, setCurrent] = useState(0);
  const [role, setRole] = useState("mentee");
  const [dynamicFields, setDynamicFields] = useState({});

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  const handleFieldChange = (fieldName, value) => {
    setDynamicFields((prev) => ({ ...prev, [fieldName]: value }));
  };

  const handleSignupSubmit = (e) => {
    e.preventDefault();

    const formData = {
      fullName: e.target[0].value,
      email: e.target[1].value,
      password: e.target[2].value,
      confirmPassword: e.target[3].value,
      role,
      ...dynamicFields,
    };

    console.log("Signup Data Submitted:", formData);

    // Example: Send formData to backend API
    // fetch('/api/signup', { method: 'POST', body: JSON.stringify(formData) })
  };

  return (
    <div className="login-container">
      <div className="left-panel">
        {slides.map((slide, index) => (
          <div className={`slide ${index === current ? "active" : ""}`} key={index}>
            <img src={slide.img} alt="slide" />
            <p>{slide.text}</p>
          </div>
        ))}
      </div>

      <div className="right-panel">
        <div className="login-box">
          <h1 className="brand-name">MentorMesh</h1>
          <h2 className="welcome-text">Create your Account</h2>

          <form onSubmit={handleSignupSubmit}>
            <input type="text" placeholder="Full Name" required />
            <input type="email" placeholder="Email" required />
            <input type="password" placeholder="Password" required />
            <input type="password" placeholder="Confirm Password" required />

            <select value={role} onChange={(e) => setRole(e.target.value)} required>
              <option value="mentee">Mentee</option>
              <option value="mentor">Mentor</option>
            </select>

            {roleFields[role].map((field) => (
              <textarea
                key={field.name}
                placeholder={field.placeholder}
                value={dynamicFields[field.name] || ""}
                onChange={(e) => handleFieldChange(field.name, e.target.value)}
                required={field.required}
              />
            ))}

            <button type="submit">Sign Up</button>
          </form>

          <div className="extra-links">
            <Link to="/">Already have an account? Login</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
