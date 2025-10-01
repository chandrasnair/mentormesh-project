import React from "react";

const MentorCard = ({ mentor, onRequestSession }) => {
    return (
        <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h4 className="font-semibold text-gray-900">{mentor.name}</h4>
                    <div className="flex items-center gap-1 mt-1">
                        <span className="text-yellow-400">★</span>
                        <span className="text-sm text-gray-600">{mentor.rating}</span>
                        <span className="text-xs text-gray-500">({mentor.sessions_completed} sessions)</span>
                    </div>
                </div>
            </div>
            
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
                <p className="text-sm text-gray-500">Availability:</p>
                <p className="text-sm text-gray-900">{mentor.availability}</p>
            </div>
            
            <button 
                onClick={onRequestSession}
                className="w-full inline-flex items-center justify-center px-3 py-2 rounded-md bg-primaryGreen text-white hover:bg-darkGreen text-sm font-medium transition-colors"
            >
                Request Session
            </button>
        </div>
    );
};

export default MentorCard;
