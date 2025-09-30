import React from "react";

const SessionRequestCard = ({ request }) => {
    return (
        <div className="border rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
                <div>
                    <p className="text-sm text-gray-500">Mentee</p>
                    <p className="font-medium text-gray-900">{request.mentee_name}</p>
                </div>
                <span className="text-xs px-2 py-0.5 rounded-full bg-lightGreen text-primaryGreen">{request.status}</span>
            </div>
            <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">
                <p><span className="text-gray-500">Skill:</span> <span className="text-gray-900">{request.skill}</span></p>
                <p><span className="text-gray-500">Slot:</span> <span className="text-gray-900">{request.requested_slot}</span></p>
            </div>
            <div className="mt-4 flex gap-2">
                <button className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-primaryGreen text-white hover:bg-darkGreen text-sm">Accept</button>
                <button className="inline-flex items-center justify-center px-3 py-1.5 rounded-md bg-red-500 text-white hover:bg-red-600 text-sm">Reject</button>
            </div>
        </div>
    );
};

export default SessionRequestCard;
