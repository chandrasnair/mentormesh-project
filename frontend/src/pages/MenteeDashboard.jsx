import React, { useState, useEffect } from "react";
import MentorCard from "../components/MentorCard";
import SessionCard from "../components/SessionCard";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import RequestSessionModal from "../components/RequestSessionModal";

const MenteeDashboard = () => {
    const [menteeData, setMenteeData] = useState(null);
    const [showRequestModal, setShowRequestModal] = useState(false);
    const [selectedMentor, setSelectedMentor] = useState(null);

    useEffect(() => {
        const mockData = {
            name: "Alice Johnson",
            interests: ["Machine Learning", "Data Science", "Python Programming"],
            upcomingSessions: [
                {
                    session_id: "sess001",
                    mentor_name: "Dr. Sarah Wilson",
                    skill: "Machine Learning",
                    date: "2025-01-15",
                    time: "10:00 - 11:00",
                    status: "Confirmed"
                },
                {
                    session_id: "sess002", 
                    mentor_name: "John Smith",
                    skill: "Data Structures",
                    date: "2025-01-18",
                    time: "14:00 - 15:00",
                    status: "Pending"
                }
            ],
            availableMentors: [
                {
                    mentor_id: "mentor001",
                    name: "Dr. Sarah Wilson",
                    skills: ["Machine Learning", "Deep Learning", "AI"],
                    rating: 4.9,
                    sessions_completed: 156,
                    availability: "Mon-Fri 9AM-5PM"
                },
                {
                    mentor_id: "mentor002",
                    name: "John Smith",
                    skills: ["Data Structures", "Algorithms", "Python"],
                    rating: 4.8,
                    sessions_completed: 89,
                    availability: "Tue-Thu 2PM-6PM"
                },
                {
                    mentor_id: "mentor003",
                    name: "Emily Chen",
                    skills: ["Web Development", "React", "JavaScript"],
                    rating: 4.7,
                    sessions_completed: 124,
                    availability: "Mon-Wed-Fri 10AM-4PM"
                }
            ]
        };
        setMenteeData(mockData);
    }, []);

    const handleRequestSession = (mentor) => {
        setSelectedMentor(mentor);
        setShowRequestModal(true);
    };

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
                                {menteeData?.upcomingSessions.map((session) => (
                                    <SessionCard key={session.session_id} session={session} />
                                ))}
                            </div>
                        </section>

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
                    onRequest={(sessionData) => {
                        // Handle session request
                        console.log("Session requested:", sessionData);
                        setShowRequestModal(false);
                        setSelectedMentor(null);
                    }}
                />
            )}
        </div>
    );
};

export default MenteeDashboard;
