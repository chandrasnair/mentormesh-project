import React, { useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MentorCard from "../components/MentorCard";
import { mentorsAPI } from '../services/api';
import RequestSessionModal from '../components/RequestSessionModal';

// Simple query parser
const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

const SearchResults = () => {
  const q = useQuery().get("q") || "";
  const navigate = useNavigate();
  const [query, setQuery] = useState(q);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showRequestModal, setShowRequestModal] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState(null);

  useEffect(() => {
    setQuery(q);
    const fetchResults = async () => {
      if (!q) {
        setResults([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      setError('');
      try {
        const response = await mentorsAPI.search(q);
        if (response.success) {
          const formattedMentors = response.data.mentors.map(mentor => ({
            mentor_id: mentor._id,
            name: mentor.fullName,
            ...mentor.mentorProfile, // This correctly spreads skills, bio, etc.
          }));
          setResults(formattedMentors);
        } else {
          setError('Failed to fetch search results.');
        }
      } catch (err) {
        setError('An error occurred while searching.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchResults();
  }, [q]);

  const submitSearch = (e) => {
    e.preventDefault();
    const value = query.trim();
    if (!value) return;
    navigate(`/search?q=${encodeURIComponent(value)}`);
  };

  const handleRequestSession = (mentor) => {
    setSelectedMentor(mentor);
    setShowRequestModal(true);
  };

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto] bg-gray-50">
      <Navbar />
      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Search results for “{q}”</h1>
          {loading ? (
            <div className="text-center py-10">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-600">Searching for mentors...</p>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 ring-1 ring-red-200 p-6 text-red-700">{error}</div>
          ) : results.length === 0 ? (
            <div className="rounded-xl bg-white ring-1 ring-gray-200 p-6 text-center text-gray-600">
              <h3 className="text-lg font-semibold text-gray-800">No mentors found</h3>
              <p className="mt-2">Try another skill or keyword (e.g., React, Python, Leadership).</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((m) => (
                <MentorCard key={m.mentor_id} mentor={m} onRequestSession={() => handleRequestSession(m)} />
              ))}
            </div>
          )}
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
        />
      )}
    </div>
  );
};

export default SearchResults;
