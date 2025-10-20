import React, { useState } from 'react';

const EditAvailabilityModal = ({ initialSlots, onClose, onSave }) => {
    const [slots, setSlots] = useState(initialSlots || []);
    const [loading, setLoading] = useState(false);

    const handleAddSlot = () => {
        // CRITICAL FIX: Initialize new slots with today's date to prevent invalid data submission.
        const today = new Date().toISOString().split('T')[0];
        setSlots([...slots, { date: today, startTime: '09:00', endTime: '10:00' }]);
    };

    const handleRemoveSlot = (index) => {
        const newSlots = slots.filter((_, i) => i !== index);
        setSlots(newSlots);
    };

    const handleSlotChange = (index, field, value) => {
        const newSlots = [...slots];
        newSlots[index][field] = value;
        setSlots(newSlots);
    };

    const handleSave = async () => {
        setLoading(true);
        try {
            // Filter out any slots that might have been added but not fully configured
            const validSlots = slots.filter(slot => slot.date && slot.startTime && slot.endTime);
            await onSave(validSlots);
            onClose(); // Close the modal on successful save
        } catch (error) {
            console.error("Failed to save availability:", error);
            // Optionally show an error message to the user
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] flex flex-col">
                <div className="p-6 border-b">
                    <div className="flex items-center justify-between">
                        <h2 className="text-xl font-semibold text-gray-900">Edit Your Availability</h2>
                        <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                <div className="p-6 overflow-y-auto space-y-4">
                    {slots.length === 0 ? (
                        <p className="text-center text-gray-500">No availability slots. Add one to get started.</p>
                    ) : (
                        slots.map((slot, index) => (
                            <div key={index} className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-center">
                                <input
                                    type="date"
                                    value={slot.date ? new Date(slot.date).toISOString().split('T')[0] : ''}
                                    onChange={(e) => handleSlotChange(index, 'date', e.target.value)}
                                    className="col-span-1 sm:col-span-2 w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                                <input
                                    type="time"
                                    value={slot.startTime}
                                    onChange={(e) => handleSlotChange(index, 'startTime', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                                <input
                                    type="time"
                                    value={slot.endTime}
                                    onChange={(e) => handleSlotChange(index, 'endTime', e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                />
                                <button
                                    onClick={() => handleRemoveSlot(index)}
                                    className="sm:col-start-4 sm:row-start-1 text-red-500 hover:text-red-700 justify-self-end"
                                >
                                    Remove
                                </button>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 border-t mt-auto">
                    <button
                        onClick={handleAddSlot}
                        className="w-full mb-4 px-4 py-2 border border-dashed border-primaryGreen text-primaryGreen rounded-md hover:bg-lightGreen/20"
                    >
                        + Add New Slot
                    </button>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={handleSave}
                            disabled={loading}
                            className="flex-1 px-4 py-2 bg-primaryGreen text-white rounded-md hover:bg-darkGreen disabled:opacity-50"
                        >
                            {loading ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditAvailabilityModal;