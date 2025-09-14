import React, { useState, useEffect } from "react";
import "./Login.css";

const slides = [
  {
    img: "/src/assets/boy.png",
    text: `"Learn new skills and grow your career with mentorship."`,
  },
  {
    img: "/src/assets/twowoman.png",
    text: `"Build your future through collaboration and shared knowledge."`,
  },
  {
    img: "/src/assets/laptop.png",
    text: `"Unlock success with guidance from experts."`,
  },
];

const Login: React.FC = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 4000); // slide every 4s
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="login-container">
      {/* Left Slideshow */}
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

      {/* Right Login Form */}
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
            <a href="#">Forgot Password?</a> | <a href="#">Create Account</a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;