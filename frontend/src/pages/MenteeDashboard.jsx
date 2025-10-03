import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import MentorCard from "../components/MentorCard";
import SessionCard from "../components/SessionCard";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RequestSessionModal from "../components/RequestSessionModal";
import { mentorsAPI, utils, authAPI, sessionsAPI } from "../services/api";

const MenteeDashboard = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [menteeData, setMenteeData] = useState({
        name: "",
        interests: [],
        upcomingSessions: [],
        pendingRequests: [],
        availableMentors: []
    });
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedMentor, setSelectedMentor] = useState(null);
    const [loading, setLoading] = useState(true);

    // Redirect if not authenticated or not a mentee
    useEffect(() => {
        if (!user) {
            navigate("/login");
            return;
        }
        if (!user.roles.includes("mentee")) {
            navigate("/home");
            return;
        }
    }, [user, navigate]);

    useEffect(() => {
        const fetchMenteeData = async () => {
            if (!user) return;

            const token = utils.getToken();
            if (!token) return;

            try {
                // Fetch user profile for interests, sessions, and mentor requests
                const [profileResponse, mentorsResponse, sessionsResponse, requestsResponse] = await Promise.all([
                    authAPI.getProfile(token),
                    mentorsAPI.getFeatured(6), // Get more mentors for the dashboard
                    sessionsAPI.getMenteeSessions(token), // Get mentee's scheduled sessions
                    sessionsAPI.getMenteeRequests(token) // Get mentee's sent requests
                ]);

                if (profileResponse.success) {
                    const userProfile = profileResponse.data.user;
                    setMenteeData(prev => ({
                        ...prev,
                        name: userProfile.fullName,
                        interests: userProfile.menteeProfile?.interests || []
                    }));
                }

                if (mentorsResponse.success) {
                    setMenteeData(prev => ({
                        ...prev,
                        availableMentors: mentorsResponse.data.mentors
                    }));
                }

                if (sessionsResponse.success) {
                    const upcomingSessions = sessionsResponse.data.sessions.map(session => ({
                        session_id: session._id,
                        mentor_name: session.mentorId.fullName,
                        skill: session.skill,
                        date: new Date(session.scheduledDate).toLocaleDateString(),
                        time: session.scheduledTime,
                        status: session.status === 'scheduled' ? "Confirmed" : session.status
                    }));

                    setMenteeData(prev => ({
                        ...prev,
                        upcomingSessions
                    }));
                }

                if (requestsResponse.success) {
                    const pendingRequests = requestsResponse.data.requests.map(request => ({
                        session_id: request._id,
                        mentor_name: request.mentorId.fullName,
                        skill: request.skill,
                        date: new Date(request.requestedDate).toLocaleDateString(),
                        time: request.requestedTime,
                        status: request.status === 'pending' ? 'Pending' : request.status
                    }));

                    setMenteeData(prev => ({
                        ...prev,
                        pendingRequests
                    }));
                }
            } catch (error) {
                console.error("Error fetching mentee data:", error);
                // Set default values on error
                setMenteeData(prev => ({
                    ...prev,
                    name: user.fullName || "Mentee",
                    interests: ["Learning new skills"],
                    upcomingSessions: [],
                    availableMentors: []
                }));
            } finally {
                setLoading(false);
            }
        };

        fetchMenteeData();
    }, [user]);

    const handleRequestSession = (mentor) => {
        setSelectedMentor(mentor);
        setShowRequestModal(true);
    };

    const handleSessionRequestSent = (requestData) => {
        // Refresh the sessions data after a successful request
        const fetchUpdatedSessions = async () => {
            if (!user) return;

            const token = utils.getToken();
            if (!token) return;

            try {
                const sessionsResponse = await sessionsAPI.getMenteeSessions(token);
                if (sessionsResponse.success) {
                    const upcomingSessions = sessionsResponse.data.sessions.map(session => ({
                        session_id: session._id,
                        mentor_name: session.mentorId.fullName,
                        skill: session.skill,
                        date: new Date(session.scheduledDate).toLocaleDateString(),
                        time: session.scheduledTime,
                        status: session.status === 'scheduled' ? "Confirmed" : session.status
                    }));

                    setMenteeData(prev => ({
                        ...prev,
                        upcomingSessions
                    }));
                }
            } catch (error) {
                console.error("Error refreshing sessions after request:", error);
            }
        };

        fetchUpdatedSessions();
    };

    if (loading) {
        return (
            <div className="min-h-screen grid grid-rows-[auto_1fr_auto] bg-gray-50">
                <Navbar />
                <main className="flex items-center justify-center">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading your dashboard...</p>
                    </div>
                </main>
                <Footer />
            </div>
        );
    }

    return (
        <div className="min-h-screen grid grid-rows-[auto_1fr_auto] bg-gray-50">
            <Navbar />
            
            {/* Full-width horizontal banner */}
            <section className="px-4 sm:px-6 pt-4 sm:pt-6">
                <div className="relative h-40 sm:h-48 md:h-64 max-w-5xl mx-auto rounded-2xl overflow-hidden ring-1 ring-gray-200">
                    <img src="https://images.unsplash.com/photo-1522202176988-66273c2fd55f?q=80&w=1800&auto=format&fit=crop" alt="mentee learning" className="absolute inset-0 w-full h-full object-cover" />
                    <div className="absolute inset-0 bg-primaryGreen/30" />
                    <div className="relative h-full px-6 flex items-center">
                        <div className="bg-white/80 backdrop-blur rounded-xl px-3 py-2 sm:px-4 sm:py-3 shadow">
                            <p className="text-primaryGreen text-sm sm:text-base md:text-xl italic font-semibold">
                                Accelerate your learning journey with expert guidance and mentorship.
                            </p>
                        </div>
                    </div>
                </div>
            </section>

            {/* Single-column content below banner */}
            <main className="px-4 sm:px-6 pb-10 -mt-6">
                <div className="w-full max-w-3xl md:max-w-4xl mx-auto bg-white rounded-2xl shadow p-6 md:p-8 ring-1 ring-gray-200">
                    <h1 className="text-2xl md:text-3xl font-extrabold text-primaryGreen text-center">Welcome back, {menteeData?.name}</h1>

                    <div className="mt-8 space-y-8">
                        {/* Learning Interests Section */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Your Learning Interests</h3>
                            <div className="flex gap-2 flex-wrap">
                                {menteeData?.interests.map((interest, index) => (
                                    <span key={index} className="bg-lightGreen text-primaryGreen px-3 py-1 rounded-full text-sm">
                                        {interest}
                                    </span>
                                ))}
                            </div>
                        </section>

                        {/* Upcoming Sessions Section */}
                        <section>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Upcoming Sessions</h3>
                            <div className="space-y-4">
                                {menteeData?.upcomingSessions.length === 0 ? (
                                    <p className="text-gray-600">No upcoming sessions scheduled.</p>
                                ) : (
                                    menteeData?.upcomingSessions.map((session) => (
                                        <SessionCard key={session.session_id} session={session} />
                                    ))
                                )}
                            </div>
                        </section>

                        {/* Pending Requests Section */}
                        {menteeData?.pendingRequests.length > 0 && (
                            <section>
                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Pending Requests</h3>
                                <div className="space-y-4">
                                    {menteeData?.pendingRequests.map((request) => (
                                        <div key={request.session_id} className="border rounded-lg p-4 bg-gray-50">
                                            <div className="flex justify-between items-start mb-3">
                                                <div>
                                                    <h4 className="font-semibold text-gray-900">{request.mentor_name}</h4>
                                                    <p className="text-sm text-gray-600">{request.skill}</p>
                                                </div>
                                                <span className="px-2 py-1 bg-orange-100 text-orange-800 text-xs rounded-full">
                                                    Pending
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-4 text-sm text-gray-600">
                                                <span>📅 {request.date}</span>
                                                <span>🕐 {request.time}</span>
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">Waiting for mentor approval</p>
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {/* Available Mentors Section */}
                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-900">Available Mentors</h3>
                                <button 
                                    onClick={() => setShowRequestModal(true)} 
                                    className="text-sm text-primaryGreen hover:underline"
                                >
                                    Request New Session
                                </button>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {menteeData?.availableMentors.map((mentor) => (
                                    <MentorCard 
                                        key={mentor.mentor_id} 
                                        mentor={mentor} 
                                        onRequestSession={() => handleRequestSession(mentor)}
                                    />
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
            
            <Footer />
            
            {showRequestModal && (
                <RequestSessionModal
                    mentor={selectedMentor}
                    onClose={() => {
                        setShowRequestModal(false);
                        setSelectedMentor(null);
                    }}
                    onRequest={handleSessionRequestSent}
                />
            )}
        </div>
    );
};

export default MenteeDashboard;
