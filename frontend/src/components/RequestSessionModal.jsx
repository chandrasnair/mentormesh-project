import React, { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { sessionsAPI, utils } from "../services/api";

const RequestSessionModal = ({ mentor, onClose, onRequest }) => {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        skill: '',
        preferredDate: '',
        preferredTime: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!user) return;

        setLoading(true);
        const token = utils.getToken();
        if (!token) {
            alert("You must be logged in to request a session");
            setLoading(false);
            return;
        }

        try {
            // Convert time format from "09:00-10:00" to "09:00"
            const timeStart = formData.preferredTime.split('-')[0];

            const response = await sessionsAPI.createRequest(token, {
                mentorId: mentor?.mentor_id,
                skill: formData.skill,
                requestedDate: formData.preferredDate,
                requestedTime: timeStart,
                message: formData.message
            });

            if (response.success) {
                alert("Session request sent successfully!");
                onRequest(response.data);
                onClose();
            } else {
                alert("Failed to send session request: " + response.message);
            }
        } catch (error) {
            console.error("Error sending session request:", error);
            alert("Failed to send session request. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        setFormData({
            ...formData,
            [e.target.name]: e.target.value
        });
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-semibold text-gray-900">Request Session</h2>
                        <button 
                            onClick={onClose}
                            className="text-gray-400 hover:text-gray-600"
                        >
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                    
                    {mentor && (
                        <div className="mb-6 p-4 bg-lightGreen/20 rounded-lg">
                            <h3 className="font-medium text-primaryGreen">{mentor.name}</h3>
                            <p className="text-sm text-gray-600 mt-1">Rating: {mentor.rating} ⭐</p>
                        </div>
                    )}
                    
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Skill to Learn
                            </label>
                            <select
                                name="skill"
                                value={formData.skill}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primaryGreen focus:border-transparent"
                            >
                                <option value="">Select a skill</option>
                                {mentor?.skills.map((skill, index) => (
                                    <option key={index} value={skill}>{skill}</option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Preferred Date
                            </label>
                            <input
                                type="date"
                                name="preferredDate"
                                value={formData.preferredDate}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primaryGreen focus:border-transparent"
                            />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Preferred Time
                            </label>
                            <select
                                name="preferredTime"
                                value={formData.preferredTime}
                                onChange={handleChange}
                                required
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primaryGreen focus:border-transparent"
                            >
                                <option value="">Select time</option>
                                <option value="09:00-10:00">9:00 AM - 10:00 AM</option>
                                <option value="10:00-11:00">10:00 AM - 11:00 AM</option>
                                <option value="11:00-12:00">11:00 AM - 12:00 PM</option>
                                <option value="14:00-15:00">2:00 PM - 3:00 PM</option>
                                <option value="15:00-16:00">3:00 PM - 4:00 PM</option>
                                <option value="16:00-17:00">4:00 PM - 5:00 PM</option>
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Message (Optional)
                            </label>
                            <textarea
                                name="message"
                                value={formData.message}
                                onChange={handleChange}
                                rows={3}
                                placeholder="Tell the mentor what you'd like to focus on..."
                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primaryGreen focus:border-transparent"
                            />
                        </div>
                        
                        <div className="flex gap-3 pt-4">
                            <button
                                type="button"
                                onClick={onClose}
                                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex-1 px-4 py-2 bg-primaryGreen text-white rounded-md hover:bg-darkGreen transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {loading ? "Sending..." : "Send Request"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default RequestSessionModal;
