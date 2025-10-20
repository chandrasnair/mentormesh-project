import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import { authAPI } from '../services/api';
import './Login.css'; // Reusing styles from Login/Signup

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
  const [message, setMessage] = useState('Verifying your email address...');

  const token = searchParams.get('token');
  const email = searchParams.get('email');

  useEffect(() => {
    if (!token || !email) {
      setStatus('error');
      setMessage('Invalid verification link. The link is missing necessary information.');
      return;
    }

    const verify = async () => {
      try {
        const response = await authAPI.verifyEmail(token, email);

        if (response.success) {
          setStatus('success');
          setMessage(response.message || 'Your email has been successfully verified!');
        } else {
          setStatus('error');
          setMessage(response.message || 'Verification failed. The link may be invalid or expired.');
        }
      } catch (err) {
        setStatus('error');
        setMessage(err.message || 'An unexpected error occurred. Please try again later.');
      }
    };

    verify();
  }, [token, email]);

  const handleResend = async () => {
    if (!email) {
      setMessage('Cannot resend verification without an email address.');
      return;
    }
    setStatus('verifying'); // Show loading state
    setMessage('Resending verification email...');
    try {
      const response = await authAPI.resendVerification(email);
      if (response.success) {
        setStatus('success');
        setMessage('A new verification email has been sent. Please check your inbox.');
      } else {
        setStatus('error');
        setMessage(response.message || 'Failed to resend verification email.');
      }
    } catch (err) {
      setStatus('error');
      setMessage(err.message || 'An error occurred while resending the email.');
    }
  };

  const getStatusBoxClass = () => {
    switch (status) {
      case 'success':
        return 'success-message';
      case 'error':
        return 'error-message';
      default:
        return 'info-message'; // For 'verifying' state
    }
  };

  return (
    <div className="login-container">
      <div className="left-panel">
        {/* You can add static images or a carousel here if you like */}
        <div className="slide active">
          <img src="/src/assets/laptop.png" alt="Verification" />
          <p>Welcome to MentorMesh. Let's get you verified.</p>
        </div>
      </div>
      <div className="right-panel">
        <div className="login-box">
          <h1 className="brand-name">MentorMesh</h1>
          <h2 className="welcome-text">Email Verification</h2>

          <div className={getStatusBoxClass()}>
            <p>{message}</p>
          </div>

          {status === 'success' && (
            <div className="extra-links">
              <button
                onClick={() => navigate('/login', { state: { email } })}
                className="primary-button"
              >
                Proceed to Login
              </button>
            </div>
          )}

          {status === 'error' && (
            <div className="extra-links">
              <button onClick={handleResend} className="link-button">
                Resend Verification Email
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default VerifyEmail;