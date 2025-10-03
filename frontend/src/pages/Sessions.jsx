import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import { sessionsAPI, utils } from "../services/api";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const Sessions = () => {
  const { user, activeRole } = useAuth();
  const navigate = useNavigate();
  const [sessionData, setSessionData] = useState({
    upcomingSessions: [],
    pendingRequests: []
  });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null); // Track which action is loading

  // Fetch session data on component mount based on active role
  useEffect(() => {
    const fetchSessionData = async () => {
      if (!user || !activeRole) {
        setLoading(false);
        return;
      }

      const token = utils.getToken();
      if (!token) {
        navigate("/login");
        return;
      }

      try {
        if (activeRole === "mentor") {
          // For mentors: get session requests and scheduled sessions
          const [requestsResponse, sessionsResponse] = await Promise.all([
            sessionsAPI.getMentorRequests(token),
            sessionsAPI.getMentorSessions(token)
          ]);

          if (requestsResponse.success && sessionsResponse.success) {
            // Transform pending requests data for mentor view
            const pendingRequests = requestsResponse.data.requests
              .filter(req => req.status === 'pending')
              .map(req => ({
                id: req._id,
                menteeName: req.menteeId.fullName,
                skill: req.skill,
                requestedDate: new Date(req.requestedDate).toLocaleDateString(),
                requestedTime: req.requestedTime,
                message: req.message,
                menteeEmail: req.menteeId.email
              }));

            // Transform upcoming sessions data
            const upcomingSessions = sessionsResponse.data.sessions.map(session => ({
              id: session._id,
              menteeName: session.menteeId.fullName,
              skill: session.skill,
              date: new Date(session.scheduledDate).toLocaleDateString(),
              time: session.scheduledTime,
              status: session.status,
              meetingLink: session.meetingLink,
              menteeEmail: session.menteeId.email
            }));

            setSessionData({
              upcomingSessions,
              pendingRequests
            });
          }
        } else if (activeRole === "mentee") {
          // For mentees: get their requested sessions and confirmed sessions
          const [requestsResponse, sessionsResponse] = await Promise.all([
            sessionsAPI.getMenteeRequests(token),
            sessionsAPI.getMenteeSessions(token)
          ]);

          if (requestsResponse.success && sessionsResponse.success) {
            // Transform requests data for mentee view (all their requests)
            const myRequests = requestsResponse.data.requests.map(req => ({
              id: req._id,
              mentorName: req.mentorId.fullName, // Show mentor name instead of mentee name
              skill: req.skill,
              requestedDate: new Date(req.requestedDate).toLocaleDateString(),
              requestedTime: req.requestedTime,
              status: req.status, // Include status for mentees to see if accepted/declined
              message: req.message,
              meetingLink: req.meetingLink,
              mentorEmail: req.mentorId.email
            }));

            // Add confirmed sessions to the list
            const confirmedSessions = sessionsResponse.data.sessions.map(session => ({
              id: session._id,
              mentorName: session.mentorId.fullName,
              skill: session.skill,
              requestedDate: new Date(session.scheduledDate).toLocaleDateString(),
              requestedTime: session.scheduledTime,
              status: 'scheduled',
              message: session.message || '',
              meetingLink: session.meetingLink,
              mentorEmail: session.mentorId.email
            }));

            // Combine and deduplicate (in case some appear in both lists)
            const allSessions = [...myRequests, ...confirmedSessions];
            const uniqueSessions = allSessions.filter((session, index, self) =>
              index === self.findIndex(s => s.id === session.id)
            );

            setSessionData({
              upcomingSessions: uniqueSessions.filter(s => s.status === 'scheduled'),
              pendingRequests: uniqueSessions.filter(s => s.status === 'pending')
            });
          }
        }
      } catch (error) {
        console.error("Error fetching session data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchSessionData();
  }, [user, activeRole, navigate]);



  // Handle session actions with real API calls
  const handleAcceptRequest = async (requestId) => {
    const token = utils.getToken();
    if (!token) return;

    setActionLoading(requestId);
    try {
      const response = await sessionsAPI.acceptRequest(token, requestId);
      if (response.success) {
        // Refresh data after accepting
        const [requestsResponse, sessionsResponse] = await Promise.all([
          sessionsAPI.getMentorRequests(token),
          sessionsAPI.getMentorSessions(token)
        ]);

        if (requestsResponse.success && sessionsResponse.success) {
          const pendingRequests = requestsResponse.data.requests
            .filter(req => req.status === 'pending')
            .map(req => ({
              id: req._id,
              menteeName: req.menteeId.fullName,
              skill: req.skill,
              requestedDate: new Date(req.requestedDate).toLocaleDateString(),
              requestedTime: req.requestedTime,
              message: req.message,
              menteeEmail: req.menteeId.email
            }));

          const upcomingSessions = sessionsResponse.data.sessions.map(session => ({
            id: session._id,
            menteeName: session.menteeId.fullName,
            skill: session.skill,
            date: new Date(session.scheduledDate).toLocaleDateString(),
            time: session.scheduledTime,
            status: session.status,
            meetingLink: session.meetingLink,
            menteeEmail: session.menteeId.email
          }));

          setSessionData({ upcomingSessions, pendingRequests });
        }
      }
    } catch (error) {
      console.error("Error accepting request:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeclineRequest = async (requestId) => {
    const token = utils.getToken();
    if (!token) return;

    setActionLoading(requestId);
    try {
      const response = await sessionsAPI.declineRequest(token, requestId);
      if (response.success) {
        // Update local state to remove the declined request
        setSessionData(prev => ({
          ...prev,
          pendingRequests: prev.pendingRequests.filter(r => r.id !== requestId)
        }));
      }
    } catch (error) {
      console.error("Error declining request:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelSession = async (sessionId) => {
    if (!window.confirm("Are you sure you want to cancel this session?")) return;

    const token = utils.getToken();
    if (!token) return;

    setActionLoading(sessionId);
    try {
      const response = await sessionsAPI.cancelSession(token, sessionId);
      if (response.success) {
        // Update local state to remove the cancelled session
        setSessionData(prev => ({
          ...prev,
          upcomingSessions: prev.upcomingSessions.filter(s => s.id !== sessionId)
        }));
      }
    } catch (error) {
      console.error("Error canceling session:", error);
    } finally {
      setActionLoading(null);
    }
  };

  const handlePostponeSession = async (sessionId) => {
    // For now, show alert about reschedule functionality
    alert("Reschedule functionality would open a modal to select new date/time");

    // When implemented, this would:
    // 1. Open a modal with date/time picker
    // 2. Call sessionsAPI.rescheduleSession(token, sessionId, newDate, newTime)
    // 3. Update local state with new date/time
  };

  const openJitsiMeeting = (meetingLink) => {
    window.open(meetingLink, "_blank");
  };

  if (!user || loading) {
    return (
      <div className="min-h-screen grid grid-rows-[auto_1fr_auto] bg-gray-50">
        <Navbar />
        <main className="flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading session data...</p>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto] bg-gray-50">
      <Navbar />

      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">
              {activeRole === "mentor" ? "Session Management" : "My Sessions"}
            </h1>
            <p className="text-gray-600 mt-2">
              {activeRole === "mentor"
                ? "Manage your mentoring sessions and requests"
                : "View your mentoring session requests and confirmed sessions"
              }
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Upcoming Sessions */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeRole === "mentor" ? "Upcoming Sessions" : "Confirmed Sessions"}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {sessionData.upcomingSessions.length} {
                    activeRole === "mentor" ? "confirmed sessions" : "scheduled sessions"
                  }
                </p>
              </div>

              <div className="p-6">
                {sessionData.upcomingSessions.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No upcoming sessions scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessionData.upcomingSessions.map((session) => {
                      const displayName = activeRole === "mentor" ? session.menteeName : session.mentorName;
                      return (
                        <div key={session.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">{displayName}</h3>
                              <p className="text-sm text-gray-600">{session.skill}</p>
                            </div>
                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                              {session.status}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                            <span>📅 {session.requestedDate || session.date}</span>
                            <span>🕐 {session.requestedTime || session.time}</span>
                          </div>

                          <div className="flex flex-wrap gap-2">
                            <button
                              onClick={() => openJitsiMeeting(session.meetingLink)}
                              className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
                            >
                              Join Meeting
                            </button>
                            {activeRole === "mentor" && (
                              <>
                                <button
                                  onClick={() => handlePostponeSession(session.id)}
                                  disabled={actionLoading === session.id}
                                  className="px-3 py-1.5 bg-yellow-600 text-white text-sm rounded-md hover:bg-yellow-700 disabled:opacity-50"
                                >
                                  {actionLoading === session.id ? 'Loading...' : 'Postpone'}
                                </button>
                                <button
                                  onClick={() => handleCancelSession(session.id)}
                                  disabled={actionLoading === session.id}
                                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded-md hover:bg-red-700 disabled:opacity-50"
                                >
                                  {actionLoading === session.id ? 'Canceling...' : 'Cancel'}
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Pending Requests */}
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="p-6 border-b">
                <h2 className="text-xl font-semibold text-gray-900">
                  {activeRole === "mentor" ? "Session Requests" : "Pending Requests"}
                </h2>
                <p className="text-sm text-gray-600 mt-1">
                  {sessionData.pendingRequests.length} {
                    activeRole === "mentor" ? "pending requests" : "pending requests"
                  }
                </p>
              </div>

              <div className="p-6">
                {sessionData.pendingRequests.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <p>No pending session requests</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {sessionData.pendingRequests.map((request) => {
                      const displayName = activeRole === "mentor" ? request.menteeName : request.mentorName;
                      const statusColor = request.status === 'declined' ? 'red' : 'orange';

                      return (
                        <div key={request.id} className="border rounded-lg p-4 hover:bg-gray-50">
                          <div className="flex justify-between items-start mb-3">
                            <div>
                              <h3 className="font-semibold text-gray-900">{displayName}</h3>
                              <p className="text-sm text-gray-600">{request.skill}</p>
                            </div>
                            <span className={`px-2 py-1 bg-${statusColor}-100 text-${statusColor}-800 text-xs rounded-full`}>
                              {request.status === 'declined' ? 'Declined' : 'Pending'}
                            </span>
                          </div>

                          <div className="flex items-center gap-4 text-sm text-gray-600 mb-3">
                            <span>📅 {request.requestedDate}</span>
                            <span>🕐 {request.requestedTime}</span>
                          </div>

                          {request.message && (
                            <div className="bg-gray-50 rounded-md p-3 mb-4">
                              <p className="text-sm text-gray-700">{request.message}</p>
                            </div>
                          )}

                          {activeRole === "mentor" && request.status === 'pending' && (
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleAcceptRequest(request.id)}
                                disabled={actionLoading === request.id}
                                className="flex-1 px-3 py-2 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
                              >
                                {actionLoading === request.id ? 'Accepting...' : 'Accept'}
                              </button>
                              <button
                                onClick={() => handleDeclineRequest(request.id)}
                                disabled={actionLoading === request.id}
                                className="flex-1 px-3 py-2 bg-gray-600 text-white text-sm rounded-md hover:bg-gray-700 disabled:opacity-50"
                              >
                                {actionLoading === request.id ? 'Declining...' : 'Decline'}
                              </button>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Sessions;
