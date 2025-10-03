import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Settings = () => {
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  
  const [formData, setFormData] = useState({
    fullName: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [activeTab, setActiveTab] = useState("profile");

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    
    // Initialize form with user data
    setFormData(prev => ({
      ...prev,
      fullName: user.fullName || ""
    }));
  }, [user, navigate]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setError("");
    setSuccess("");
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!formData.fullName.trim()) {
        setError("Full name is required");
        return;
      }

      const result = await updateProfile({
        fullName: formData.fullName.trim()
      });

      if (result.success) {
        setSuccess("Profile updated successfully!");
      } else {
        setError(result.error || "Failed to update profile");
      }
    } catch (err) {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (!formData.currentPassword) {
        setError("Current password is required");
        return;
      }
      if (!formData.newPassword || formData.newPassword.length < 6) {
        setError("New password must be at least 6 characters");
        return;
      }
      if (formData.newPassword !== formData.confirmPassword) {
        setError("New passwords do not match");
        return;
      }

      // In real app, make API call to update password
      // const result = await updatePassword({
      //   currentPassword: formData.currentPassword,
      //   newPassword: formData.newPassword
      // });

      // Mock success for now
      setSuccess("Password updated successfully!");
      setFormData(prev => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      }));
    } catch (err) {
      setError("Failed to update password");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (window.confirm("Are you sure you want to delete your account? This action cannot be undone.")) {
      if (window.confirm("This will permanently delete all your data. Are you absolutely sure?")) {
        try {
          // In real app, make API call to delete account
          // await deleteAccount();
          alert("Account deletion would be processed here");
          logout();
          navigate("/home");
        } catch (err) {
          setError("Failed to delete account");
        }
      }
    }
  };

  if (!user) return null;

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto] bg-gray-50">
      <Navbar />
      
      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">Account Settings</h1>
            <p className="text-gray-600 mt-2">Manage your account preferences and security</p>
          </div>

          {/* Tab Navigation */}
          <div className="bg-white rounded-xl shadow-sm border mb-6">
            <div className="flex border-b">
              <button
                onClick={() => setActiveTab("profile")}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "profile"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Profile Information
              </button>
              <button
                onClick={() => setActiveTab("security")}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "security"
                    ? "text-blue-600 border-b-2 border-blue-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Security
              </button>
              <button
                onClick={() => setActiveTab("danger")}
                className={`px-6 py-3 text-sm font-medium ${
                  activeTab === "danger"
                    ? "text-red-600 border-b-2 border-red-600"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                Danger Zone
              </button>
            </div>

            <div className="p-6">
              {/* Profile Information Tab */}
              {activeTab === "profile" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Profile Information</h2>
                  
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div>
                      <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        type="text"
                        id="fullName"
                        name="fullName"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        type="email"
                        value={user.email}
                        disabled
                        className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-100 text-gray-500"
                      />
                      <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Roles
                      </label>
                      <div className="flex gap-2">
                        {user.roles.map((role) => (
                          <span
                            key={role}
                            className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                          >
                            {role.charAt(0).toUpperCase() + role.slice(1)}
                          </span>
                        ))}
                      </div>
                    </div>

                    {error && (
                      <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-md text-sm">
                        {success}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? "Updating..." : "Update Profile"}
                    </button>
                  </form>
                </div>
              )}

              {/* Security Tab */}
              {activeTab === "security" && (
                <div>
                  <h2 className="text-xl font-semibold text-gray-900 mb-4">Change Password</h2>
                  
                  <form onSubmit={handlePasswordUpdate} className="space-y-4">
                    <div>
                      <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        id="currentPassword"
                        name="currentPassword"
                        value={formData.currentPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        New Password
                      </label>
                      <input
                        type="password"
                        id="newPassword"
                        name="newPassword"
                        value={formData.newPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        minLength={6}
                        required
                      />
                    </div>

                    <div>
                      <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">
                        Confirm New Password
                      </label>
                      <input
                        type="password"
                        id="confirmPassword"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        minLength={6}
                        required
                      />
                    </div>

                    {error && (
                      <div className="p-3 bg-red-100 border border-red-300 text-red-700 rounded-md text-sm">
                        {error}
                      </div>
                    )}

                    {success && (
                      <div className="p-3 bg-green-100 border border-green-300 text-green-700 rounded-md text-sm">
                        {success}
                      </div>
                    )}

                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? "Updating..." : "Update Password"}
                    </button>
                  </form>
                </div>
              )}

              {/* Danger Zone Tab */}
              {activeTab === "danger" && (
                <div>
                  <h2 className="text-xl font-semibold text-red-600 mb-4">Danger Zone</h2>
                  
                  <div className="border border-red-200 rounded-md p-4 bg-red-50">
                    <h3 className="text-lg font-medium text-red-800 mb-2">Delete Account</h3>
                    <p className="text-red-700 text-sm mb-4">
                      Once you delete your account, there is no going back. Please be certain.
                    </p>
                    
                    <button
                      onClick={handleDeleteAccount}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Settings;
