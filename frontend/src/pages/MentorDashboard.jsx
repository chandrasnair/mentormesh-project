import React, { useState, useEffect } from "react";
import AvailabilityCard from "../components/AvailabilityCard";
import SessionRequestCard from "../components/SessionRequestCard";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import EditSkillsModal from "../components/EditSkillsModal";
import EditAvailabilityModal from "../components/EditAvailabilityModal";

const MentorDashboard = () => {
    const [mentorData, setMentorData] = useState(null);
    const [showSkills, setShowSkills] = useState(false);
    const [showAvailability, setShowAvailability] = useState(false);

    useEffect(() => {
        const mockData = {
            name: "John Doe",
            skills: ["Machine Learning", "Data Structures"],
            availability: [{ id: "slot1", day: "Monday", start: "10:00", end: "12:00" }],
            sessionRequests: [
                {
                    request_id: "req001",
                    mentee_name: "Alice Johnson",
                    skill: "Machine Learning",
                    requested_slot: "2025-10-05 10:00 - 11:00",
                    status: "Pending"
                }
            ]
        };
        setMentorData(mockData);
    }, []);

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
                    <h1 className="text-2xl md:text-3xl font-extrabold text-primaryGreen text-center">Welcome back, {mentorData?.name}</h1>

                    <div className="mt-8 space-y-8">
                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-900">Your Skills</h3>
                                <button onClick={() => setShowSkills(true)} className="text-sm text-primaryGreen hover:underline">Edit</button>
                            </div>
                            <div className="flex gap-2 flex-wrap">
                                {mentorData?.skills.map((skill, index) => (
                                    <span key={index} className="bg-lightGreen text-primaryGreen px-3 py-1 rounded-full text-sm">
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </section>

                        <section>
                            <div className="flex items-center justify-between mb-3">
                                <h3 className="text-lg font-semibold text-gray-900">Your Availability</h3>
                                <button onClick={() => setShowAvailability(true)} className="text-sm text-primaryGreen hover:underline">Edit</button>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                                {mentorData?.availability.map((slot) => (
                                    <AvailabilityCard key={slot.id} slot={slot} />
                                ))}
                            </div>
                        </section>

                        <section>
                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Session Requests</h3>
                            <div className="space-y-4">
                                {mentorData?.sessionRequests.map((request) => (
                                    <SessionRequestCard key={request.request_id} request={request} />
                                ))}
                            </div>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
            {showSkills && (
                <EditSkillsModal
                    initialSkills={mentorData?.skills || []}
                    onClose={() => setShowSkills(false)}
                    onSave={(skills) => {
                        setMentorData((prev) => ({ ...prev, skills }));
                        setShowSkills(false);
                    }}
                />
            )}
            {showAvailability && (
                <EditAvailabilityModal
                    initialSlots={mentorData?.availability || []}
                    onClose={() => setShowAvailability(false)}
                    onSave={(availability) => {
                        setMentorData((prev) => ({ ...prev, availability }));
                        setShowAvailability(false);
                    }}
                />
            )}
        </div>
    );
};

export default MentorDashboard;
