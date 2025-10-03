import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import MentorCard from "../components/MentorCard";
import { mentorsAPI, testimonialsAPI } from "../services/api";

const Home = () => {
  const navigate = useNavigate();
  const [activeIndex, setActiveIndex] = useState(0);
  const [search, setSearch] = useState("");
  const [testimonials, setTestimonials] = useState([]);
  const [featuredMentors, setFeaturedMentors] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch testimonials and featured mentors on component mount
  useEffect(() => {
    const fetchHomeData = async () => {
      try {
        const [testimonialsResponse, mentorsResponse] = await Promise.all([
          testimonialsAPI.getAll(),
          mentorsAPI.getFeatured()
        ]);

        if (testimonialsResponse.success) {
          setTestimonials(testimonialsResponse.data.testimonials);
        }

        if (mentorsResponse.success) {
          setFeaturedMentors(mentorsResponse.data.mentors);
        }
      } catch (error) {
        console.error("Error fetching home data:", error);
        // Fallback to empty arrays if API fails
        setTestimonials([]);
        setFeaturedMentors([]);
      } finally {
        setLoading(false);
      }
    };

    fetchHomeData();
  }, []);

  // Auto-advance testimonials every 3 seconds
  useEffect(() => {
    if (testimonials.length === 0) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % testimonials.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [testimonials.length]);

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
              {loading ? (
                <div className="h-full rounded-xl bg-white ring-1 ring-gray-200 shadow flex items-center justify-center p-4">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primaryGreen"></div>
                </div>
              ) : testimonials.length > 0 ? (
                testimonials.map((t, index) => (
                  <div
                    key={t.id}
                    className={`absolute inset-0 transition-opacity duration-500 ${
                      index === activeIndex ? "opacity-100" : "opacity-0"
                    }`}
                  >
                    <div className="h-full rounded-xl bg-white ring-1 ring-gray-200 shadow flex items-center p-4">
                      <p className="text-gray-800">
                        <span className="italic">"{t.text}"</span>
                        <span className="block mt-1 text-sm text-gray-500">— {t.author}</span>
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="h-full rounded-xl bg-white ring-1 ring-gray-200 shadow flex items-center p-4">
                  <p className="text-gray-800 italic">
                    "Success stories coming soon - join our community and share your experience!"
                  </p>
                </div>
              )}
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
