import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MentorCard from "../components/MentorCard";

const testimonials = [
  {
    id: "t1",
    text:
      "Found an amazing mentor for machine learning. My confidence skyrocketed!",
    author: "Aisha, Mentee",
  },
  {
    id: "t2",
    text:
      "Clear guidance and actionable feedback helped me crack my interview.",
    author: "Rahul, Mentee",
  },
  {
    id: "t3",
    text:
      "As a mentor, the platform makes it easy to manage sessions and impact lives.",
    author: "Grace, Mentor",
  },
];

// Mock mentors data (would come from API later)
const allMentors = [
  {
    mentor_id: "m1",
    name: "Dr. Sarah Wilson",
    skills: ["Machine Learning", "Deep Learning", "AI"],
    rating: 4.9,
    sessions_completed: 156,
    availability: "Mon-Fri 9AM-5PM",
  },
  {
    mentor_id: "m2",
    name: "John Smith",
    skills: ["Data Structures", "Algorithms", "Python"],
    rating: 4.8,
    sessions_completed: 89,
    availability: "Tue-Thu 2PM-6PM",
  },
  {
    mentor_id: "m3",
    name: "Emily Chen",
    skills: ["Web Development", "React", "JavaScript"],
    rating: 4.7,
    sessions_completed: 124,
    availability: "Mon-Wed-Fri 10AM-4PM",
  },
  {
    mentor_id: "m4",
    name: "David Kim",
    skills: ["System Design", "Backend", "Node.js"],
    rating: 4.95,
    sessions_completed: 210,
    availability: "Flexible",
  },
];

const Home = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [search, setSearch] = useState("");

  // Auto-advance testimonials every 3 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  // Featured mentors: top by rating
  const featuredMentors = useMemo(() => {
    return [...allMentors]
      .sort((a, b) => b.rating - a.rating)
      .slice(0, 3);
  }, []);

  const submitSearch = (e) => {
    e?.preventDefault();
    const q = search.trim();
    if (!q) return;
    navigate(`/search?q=${encodeURIComponent(q)}`);
  };

  return (
    <div className="min-h-screen grid grid-rows-[auto_1fr_auto] bg-gray-50">
      <Navbar />

      {/* Hero with feedback carousel and search */}
      <section className="px-4 sm:px-6 pt-6">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-6 items-center">
          <div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-primaryGreen">
              Grow faster with the right mentor
            </h1>
            <p className="mt-3 text-gray-700">
              Get personalized guidance from industry experts. Learn practical skills
              and achieve your goals.
            </p>

            {/* Search moved to Navbar - keeping hero clean */}

            <div className="mt-6 relative h-28">
              {testimonials.map((t, index) => (
                <div
                  key={t.id}
                  className={`absolute inset-0 transition-opacity duration-500 ${
                    index === activeIndex ? "opacity-100" : "opacity-0"
                  }`}
                >
                  <div className="h-full rounded-xl bg-white ring-1 ring-gray-200 shadow flex items-center p-4">
                    <p className="text-gray-800">
                      <span className="italic">“{t.text}”</span>
                      <span className="block mt-1 text-sm text-gray-500">— {t.author}</span>
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="relative h-56 sm:h-72 md:h-80 rounded-2xl overflow-hidden ring-1 ring-gray-200">
            <img
              src="https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1600&auto=format&fit=crop"
              alt="mentorship"
              className="absolute inset-0 w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-primaryGreen/20" />
          </div>
        </div>
      </section>

      {/* Featured mentors */}
      <main className="px-4 sm:px-6 pb-10 mt-10">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-gray-900">Featured mentors</h2>
            <button
              onClick={() => navigate("/search?q=top%20rated")}
              className="text-sm text-primaryGreen hover:underline"
            >
              See all
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredMentors.map((m) => (
              <MentorCard
                key={m.mentor_id}
                mentor={m}
                onRequestSession={() => navigate(`/search?q=${encodeURIComponent(m.skills[0])}`)}
              />
            ))}
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Home;


