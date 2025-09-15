import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
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

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="login-container">
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

      <div className="right-panel">
        <div className="login-box">
          <h1 className="brand-name">MentorMesh</h1>
          <h2 className="welcome-text">Welcome</h2>

          <form>
            <input type="text" placeholder="Email or Username" required />
            <input type="password" placeholder="Password" required />
            <button type="submit">Login</button>
          </form>

          <div className="extra-links">
            <Link to="#">Forgot Password?</Link> | <Link to="/signup">Create Account</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;


