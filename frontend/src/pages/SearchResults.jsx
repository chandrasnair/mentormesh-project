import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MentorCard from "../components/MentorCard";

// Simple query parser
const useQuery = () => {
  const { search } = useLocation();
  return useMemo(() => new URLSearchParams(search), [search]);
};

// Mock mentors (replace with API later)
const mentors = [
  { mentor_id: "m1", name: "Dr. Sarah Wilson", skills: ["Machine Learning", "Deep Learning", "AI"], rating: 4.9, sessions_completed: 156, availability: "Mon-Fri 9AM-5PM" },
  { mentor_id: "m2", name: "John Smith", skills: ["Data Structures", "Algorithms", "Python"], rating: 4.8, sessions_completed: 89, availability: "Tue-Thu 2PM-6PM" },
  { mentor_id: "m3", name: "Emily Chen", skills: ["Web Development", "React", "JavaScript"], rating: 4.7, sessions_completed: 124, availability: "Mon-Wed-Fri 10AM-4PM" },
  { mentor_id: "m4", name: "David Kim", skills: ["System Design", "Backend", "Node.js"], rating: 4.95, sessions_completed: 210, availability: "Flexible" },
];

const SearchResults = () => {
  const q = useQuery().get("q") || "";
  const navigate = useNavigate();
  const [query, setQuery] = useState(q);

  useEffect(() => {
    setQuery(q);
  }, [q]);

  const results = useMemo(() => {
    const term = (q || "").toLowerCase();
    if (!term) return [];
    if (term === "top rated") {
      return [...mentors].sort((a, b) => b.rating - a.rating);
    }
    return mentors.filter((m) =>
      m.name.toLowerCase().includes(term) ||
      m.skills.some((s) => s.toLowerCase().includes(term))
    );
  }, [q]);

  const submitSearch = (e) => {
    e.preventDefault();
    const value = query.trim();
    if (!value) return;
    navigate(`/search?q=${encodeURIComponent(value)}`);
  };

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto] bg-gray-50">
      <Navbar />
      <main className="px-4 sm:px-6 py-8">
        <div className="max-w-6xl mx-auto">
          <form onSubmit={submitSearch} className="mb-6 flex gap-2">
            <input
              type="text"
              placeholder="Search mentors by skill or name"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 px-4 py-3 rounded-lg border ring-1 ring-gray-200 focus:outline-none focus:ring-primaryGreen"
            />
            <button type="submit" className="px-5 py-3 rounded-lg bg-primaryGreen text-white hover:bg-darkGreen">Search</button>
          </form>

          <h1 className="text-xl font-bold text-gray-900 mb-4">Search results for “{q}”</h1>
          {results.length === 0 ? (
            <div className="rounded-xl bg-white ring-1 ring-gray-200 p-6 text-gray-600">No mentors found. Try another skill (e.g., React, Python, ML).</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {results.map((m) => (
                <MentorCard key={m.mentor_id} mentor={m} onRequestSession={() => navigate(`/search?q=${encodeURIComponent(m.skills[0])}`)} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default SearchResults;


