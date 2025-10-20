import React from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const MentorCard = ({ mentor, onRequestSession }) => {
    const navigate = useNavigate();
    const { user } = useAuth();

    const handleRequestSession = () => {
        // Check if user is logged in
        if (!user) {
            navigate('/login');
            return;
        }

        // If user is mentee, open request modal
        if (user.roles.includes('mentee')) {
            if (onRequestSession) {
                onRequestSession(mentor);
            } else {
                // Fallback - navigate to dashboard
                navigate('/dashboard');
            }
            return;
        }

        // If user is mentor, show message or navigate home
        // For now, just navigate home (could show a modal in future)
        navigate('/');

        // Call the original onRequestSession if provided as backup
        if (onRequestSession) {
            onRequestSession(mentor);
        }
    };
    return (
        <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h4 className="font-semibold text-gray-900">{mentor.name}</h4>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm text-gray-600">4.8</span> {/* Mock rating for now */}
                        <span className="text-xs text-gray-500">({mentor.sessions_completed || 'New'} sessions)</span>
                    </div>
                </div>
            </div>

            {mentor.expertise && (
                <div className="mb-2">
                    <p className="text-sm text-gray-700 font-medium">{mentor.expertise}</p>
                </div>
            )}

            <div className="mb-3">
                <p className="text-sm text-gray-500 mb-2">Skills:</p>
                <div className="flex gap-1 flex-wrap">
                    {mentor.skills.map((skill, index) => (
                        <span key={index} className="bg-lightGreen/60 text-primaryGreen px-2 py-0.5 rounded text-xs">
                            {skill}
                        </span>
                    ))}
                </div>
            </div>

            <div className="mb-4">
                <p className="text-sm text-gray-500">Experience:</p>
                <p className="text-sm text-gray-900">{mentor.experience || 0} years</p>
            </div>

            {mentor.bio && (
                <div className="mb-4">
                    <p className="text-sm text-gray-700 text-ellipsis overflow-hidden" style={{display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'}}>
                        {mentor.bio}
                    </p>
                </div>
            )}

            <button
                onClick={handleRequestSession}
                className="w-full inline-flex items-center justify-center px-3 py-2 rounded-md bg-primaryGreen text-white hover:bg-darkGreen text-sm font-medium transition-colors"
            >
                Request Session
            </button>
        </div>
    );
};

export default MentorCard;
