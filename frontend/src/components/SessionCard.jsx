import React from "react";

const SessionCard = ({ session }) => {
    const getStatusColor = (status) => {
        switch (status.toLowerCase()) {
            case 'confirmed':
                return 'bg-green-100 text-green-800';
            case 'pending':
                return 'bg-yellow-100 text-yellow-800';
            case 'cancelled':
                return 'bg-red-100 text-red-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <p className="text-sm text-gray-500">Mentor</p>
                    <p className="font-medium text-gray-900">{session.mentor_name}</p>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full ${getStatusColor(session.status)}`}>
                    {session.status}
                </span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm mb-4">
                <p><span className="text-gray-500">Skill:</span> <span className="text-gray-900">{session.skill}</span></p>
                <p><span className="text-gray-500">Date:</span> <span className="text-gray-900">{session.date}</span></p>
                <p><span className="text-gray-500">Time:</span> <span className="text-gray-900">{session.time}</span></p>
            </div>
            
            <div className="flex gap-2">
                <button className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-primaryGreen text-white hover:bg-darkGreen text-sm">
                    Join Session
                </button>
                <button className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 text-sm">
                    Reschedule
                </button>
                <button className="inline-flex items-center justify-center px-3 py-1.5 rounded-md border border-red-300 text-red-700 hover:bg-red-50 text-sm">
                    Cancel
                </button>
            </div>
        </div>
    );
};

export default SessionCard;
