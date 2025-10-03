import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import AvailabilityCard from "../components/AvailabilityCard";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import EditSkillsModal from "../components/EditSkillsModal";
import EditAvailabilityModal from "../components/EditAvailabilityModal";

const MentorDashboard = () => {
    const { user, updateProfile } = useAuth();
    const [showSkills, setShowSkills] = useState(false);
    const [showAvailability, setShowAvailability] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [profilePicture, setProfilePicture] = useState(null);

    // Use actual user data instead of mock data
    const mentorData = user ? {
        name: user.fullName,
        skills: user.mentorProfile?.skills || [],
        bio: user.mentorProfile?.bio || "",
        expertise: user.mentorProfile?.expertise || "",
        experience: user.mentorProfile?.experience || 0,
        availability: user.mentorProfile?.availability || []
    } : null;

    return (
        <div className="min-h-screen grid grid-rows-[auto_1fr_auto] bg-gray-50">
            <Navbar />
            {/* Full-width horizontal banner */}
            <section className="px-4 sm:px-6 pt-4 sm:pt-6">
                <div className="relative h-40 sm:h-48 md:h-64 max-w-5xl mx-auto rounded-2xl overflow-hidden ring-1 ring-gray-200">
                    <img src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1800&auto=format&fit=crop" alt="mentor" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-primaryGreen/30" />
                    <div className="relative h-full px-6 flex items-center">
                        <div className="bg-white/80 backdrop-blur rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow">
                            <p className="text-primaryGreen text-sm sm:text-base md:text-xl italic font-semibold">
                                Empower mentees by sharing your knowledge and experience.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Single-column content below banner */}
            <main className="px-4 sm:px-6 pb-10 -mt-6">
                <div className="w-full max-w-3xl md:max-w-4xl mx-auto bg-white rounded-2xl shadow p-6 md:p-8 ring-1 ring-gray-200">
                    {/* Email Verification Alert */}
                    {user && !user.isVerified && (
                        <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <div className="flex items-center">
                                <div className="flex-shrink-0">
                                    <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </div>
                                <div className="ml-3">
                                    <p className="text-sm text-yellow-800">
                                        <strong>Verify your email</strong> to get your verification badge and unlock all features.
                                        <button className="ml-2 underline hover:no-underline">
                                            Resend verification email
                                        </button>
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center justify-between mb-8">
                        <div className="flex items-center gap-4">
                            {/* Profile Picture */}
                            <div className="relative">
                                <div className="h-20 w-20 rounded-full bg-lightGreen flex items-center justify-center overflow-hidden">
                                    {profilePicture ? (
                                        <img src={profilePicture} alt="Profile" className="h-full w-full object-cover" />
                                    ) : (
                                        <span className="text-2xl font-bold text-primaryGreen">
                                            {mentorData?.name?.charAt(0) || 'M'}
                                        </span>
                                    )}
                                </div>
                                <button
                                    onClick={() => document.getElementById('profile-picture-input').click()}
                                    className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-primaryGreen text-white flex items-center justify-center text-xs hover:bg-opacity-80"
                                >
                                    ✎
                                </button>
                                <input
                                    id="profile-picture-input"
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files[0];
                                        if (file) {
                                            const reader = new FileReader();
                                            reader.onload = (e) => setProfilePicture(e.target.result);
                                            reader.readAsDataURL(file);
                                        }
                                    }}
                                />
                            </div>
                            
                            <div>
                                <div className="flex items-center gap-2">
                                    <h1 className="text-2xl md:text-3xl font-extrabold text-primaryGreen">
                                        Welcome back, {mentorData?.name}
                                    </h1>
                                    {user?.isVerified && (
                                        <div className="flex items-center justify-center h-6 w-6 rounded-full bg-blue-500 text-white text-xs font-bold" title="Verified">
                                            ✓
                                        </div>
                                    )}
                                </div>
                                <p className="text-gray-600 text-sm">Mentor Profile</p>
                            </div>
                        </div>
                        
                        <button
                            onClick={() => setShowEditProfile(true)}
                            className="px-4 py-2 text-sm bg-primaryGreen text-white rounded-lg hover:bg-opacity-90"
                        >
                            Edit Profile
                        </button>
                    </div>

                    <div className="mt-8 space-y-8">
                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-900">Your Skills</h3>
                                <button onClick={() => setShowSkills(true)} className="text-sm text-primaryGreen hover:underline">
                                    {mentorData?.skills?.length === 0 ? "Add" : "Edit"}
                                </button>
                            </div>
                            
                            {mentorData?.skills?.length === 0 ? (
                                <div className="text-center py-6 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                    <p className="text-gray-600 text-sm mb-3">
                                        Add your skills to help mentees find you for the right topics.
                                    </p>
                                    <button 
                                        onClick={() => setShowSkills(true)}
                                        className="px-4 py-2 bg-primaryGreen text-white rounded-lg hover:bg-opacity-90 text-sm font-medium"
                                    >
                                        Add Your Skills
                                    </button>
                                </div>
                            ) : (
                                <div className="flex gap-2 flex-wrap">
                                    {mentorData.skills.map((skill, index) => (
                                        <span key={index} className="bg-lightGreen text-primaryGreen px-3 py-1 rounded-full text-sm">
                                            {skill}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </section>

                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-900">Your Availability</h3>
                                <button onClick={() => setShowAvailability(true)} className="text-sm text-primaryGreen hover:underline">
                                    {mentorData?.availability?.length === 0 ? "Add" : "Edit"}
                                </button>
                            </div>
                            
                            {mentorData?.availability?.length === 0 ? (
                                <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                    <div className="max-w-sm mx-auto">
                                        <div className="flex justify-center mb-4">
                                            <div className="h-12 w-12 rounded-full bg-primaryGreen/10 flex items-center justify-center">
                                                <svg className="h-6 w-6 text-primaryGreen" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                                                </svg>
                                            </div>
                                        </div>
                                        <h4 className="text-lg font-semibold text-gray-900 mb-2">No Availability Set</h4>
                                        <p className="text-gray-600 text-sm mb-4">
                                            Add your available time slots so mentees can book sessions with you.
                                        </p>
                                        <button 
                                            onClick={() => setShowAvailability(true)}
                                            className="px-4 py-2 bg-primaryGreen text-white rounded-lg hover:bg-opacity-90 text-sm font-medium"
                                        >
                                            Add Your Availability
                                        </button>
                                    </div>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                    {mentorData.availability.map((slot) => (
                                        <AvailabilityCard key={slot.id} slot={slot} />
                                    ))}
                                </div>
                            )}
                        </section>

                    </div>
                </div>
            </main>
            <Footer />
            {showSkills && (
                <EditSkillsModal
                    initialSkills={mentorData?.skills || []}
                    onClose={() => setShowSkills(false)}
                    onSave={async (skills) => {
                        try {
                            // Update the user's mentor profile with new skills
                            await updateProfile({
                                mentorProfile: {
                                    ...user.mentorProfile,
                                    skills: skills
                                }
                            });
                            setShowSkills(false);
                        } catch (error) {
                            console.error('Failed to update skills:', error);
                            // Could show error message to user here
                        }
                    }}
                />
            )}
            {showAvailability && (
                <EditAvailabilityModal
                    initialSlots={mentorData?.availability || []}
                    onClose={() => setShowAvailability(false)}
                    onSave={async (availability) => {
                        try {
                            // Update the user's mentor profile with new availability
                            await updateProfile({
                                mentorProfile: {
                                    ...user.mentorProfile,
                                    availability: availability
                                }
                            });
                            setShowAvailability(false);
                        } catch (error) {
                            console.error('Failed to update availability:', error);
                            // Could show error message to user here
                        }
                    }}
                />
            )}
        </div>
    );
};

export default MentorDashboard;
