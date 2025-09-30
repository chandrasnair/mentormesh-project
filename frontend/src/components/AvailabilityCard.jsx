import React from "react";

const AvailabilityCard = ({ slot }) => {
    return (
        <div className="bg-lightGreen/60 border border-lightGreen rounded-lg p-4 hover:shadow-md transition-shadow">
            <div className="text-sm text-gray-600 mb-1">Available</div>
            <div className="flex items-center justify-between">
                <p className="font-medium text-primaryGreen">{slot.day}</p>
                <p className="text-primaryGreen">{slot.start} - {slot.end}</p>
            </div>
        </div>
    );
};

export default AvailabilityCard;
