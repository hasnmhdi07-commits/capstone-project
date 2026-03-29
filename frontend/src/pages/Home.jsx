import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import api from "../services/api";
import HouseCard from "../components/HouseCard";
import FilterBar from "../components/FilterBar";
import {
  gsap,
  ScrollTrigger,
  animateCards,
  animateCountUp,
  killScrollTriggers,
} from "../utils/animations";

const Home = () => {
  const [houses, setHouses] = useState([]);

  // Refs for targeted animations
  const heroRef = useRef(null);
  const statsRef = useRef(null);
  const whyRef = useRef(null);
  const ctaRef = useRef(null);

  const fetchHouses = async (filters = {}) => {
    try {
      const query = new URLSearchParams(filters).toString();
      const { data } = await api.get(`/houses?${query}`);
      setHouses(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchHouses();
  }, []);

  // ── Hero animation on mount ───────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });

      tl.fromTo(".hero-badge",
        { opacity: 0, scale: 0.7 },
        { opacity: 1, scale: 1, duration: 0.5 }
      )
      .fromTo(".hero-title",
        { opacity: 0, y: 50, skewY: 2 },
        { opacity: 1, y: 0, skewY: 0, duration: 0.75 },
        "-=0.2"
      )
      .fromTo(".hero-sub",
        { opacity: 0, y: 25 },
        { opacity: 1, y: 0, duration: 0.6 },
        "-=0.4"
      )
      .fromTo(".hero-btns > *",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, stagger: 0.12, duration: 0.5 },
        "-=0.3"
      )
      .fromTo(".hero-image-card",
        { opacity: 0, x: 60, rotate: 3 },
        { opacity: 1, x: 0, rotate: 0, duration: 0.8, ease: "back.out(1.2)" },
        "-=0.6"
      );
    }, heroRef);

    return () => ctx.revert();
  }, []);

  // ── Stats count-up on scroll ──────────────────────────────────────────────
  useEffect(() => {
    if (!houses.length) return;
    const ctx = gsap.context(() => {
      animateCountUp("[data-count]");

      // stat cards slide in
      gsap.fromTo(".stat-card",
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, stagger: 0.1, duration: 0.55, ease: "power3.out",
          scrollTrigger: { trigger: statsRef.current, start: "top 85%" },
        }
      );
    }, statsRef);

    return () => ctx.revert();
  }, [houses.length]);

  // ── Featured cards stagger on scroll ─────────────────────────────────────
  useEffect(() => {
    if (!houses.length) return;
    const ctx = gsap.context(() => {
      // Small delay so cards are rendered first
      const timer = setTimeout(() => {
        animateCards(".house-card-item", true);
      }, 80);
      return () => clearTimeout(timer);
    });
    return () => ctx.revert();
  }, [houses]);

  // ── Why section slide-ins on scroll ──────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".why-card",
        { opacity: 0, y: 40 },
        {
          opacity: 1, y: 0, stagger: 0.15, duration: 0.6, ease: "power3.out",
          scrollTrigger: { trigger: whyRef.current, start: "top 82%" },
        }
      );
    }, whyRef);
    return () => ctx.revert();
  }, []);

  // ── CTA section ───────────────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(".cta-content > *",
        { opacity: 0, y: 30 },
        {
          opacity: 1, y: 0, stagger: 0.14, duration: 0.6, ease: "power3.out",
          scrollTrigger: { trigger: ctaRef.current, start: "top 85%" },
        }
      );
    }, ctaRef);
    return () => ctx.revert();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">

      {/* ── HERO ──────────────────────────────────────────────────────────── */}
      <div ref={heroRef} className="bg-gradient-to-br from-indigo-600 via-blue-700 to-teal-600 text-white py-16 md:py-24 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div>
              <span className="hero-badge inline-block bg-white/20 text-white text-sm font-semibold px-4 py-1.5 rounded-full mb-5 backdrop-blur-sm border border-white/30">
                🏡 #1 Rental Platform
              </span>
              <h1 className="hero-title text-4xl md:text-5xl font-extrabold mb-5 leading-tight">
                Find Your<br />
                <span className="text-yellow-300">Dream Home</span><br />
                Today
              </h1>
              <p className="hero-sub text-lg text-indigo-100 mb-8 max-w-md">
                Discover thousands of beautiful properties. From cozy apartments to spacious houses, we have something for everyone.
              </p>
              <div className="hero-btns flex flex-col sm:flex-row gap-4">
                <Link
                  to="/houses"
                  className="bg-white text-indigo-600 px-8 py-3 rounded-xl font-bold hover:shadow-xl hover:-translate-y-0.5 transition-all text-center"
                >
                  Browse Properties
                </Link>
                <Link
                  to="/register"
                  className="text-white border-2 border-white/60 px-8 py-3 rounded-xl font-bold hover:bg-white/15 transition text-center backdrop-blur-sm"
                >
                  List Your Property
                </Link>
              </div>
            </div>

            {/* Decorative floating card — adds visual depth to hero */}
            <div className="hero-image-card hidden md:block relative">
              <div className="bg-white/15 backdrop-blur-md rounded-3xl p-6 border border-white/20 shadow-2xl">
                <div className="bg-white/20 rounded-2xl h-40 mb-4 flex items-center justify-center">
                  <span className="text-6xl">🏠</span>
                </div>
                <h3 className="text-white font-bold text-lg mb-1">Premium Listings</h3>
                <p className="text-indigo-200 text-sm mb-3">Verified properties across Dhaka</p>
                <div className="flex gap-2">
                  {["WiFi", "Parking", "Security"].map((tag) => (
                    <span key={tag} className="bg-white/20 text-white text-xs px-2.5 py-1 rounded-full">{tag}</span>
                  ))}
                </div>
                {/* Floating badge */}
                <div className="absolute -top-4 -right-4 bg-yellow-400 text-yellow-900 font-bold text-sm px-3 py-2 rounded-2xl shadow-lg rotate-6">
                  ⭐ Top Rated
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── STATS ─────────────────────────────────────────────────────────── */}
      <div ref={statsRef} className="bg-white py-12 border-b border-gray-100">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              { count: houses.length, suffix: "+", label: "Available Properties", color: "text-indigo-600" },
              { count: 10000, suffix: "+", label: "Happy Customers", color: "text-blue-600" },
              { count: 24, suffix: "/7", label: "Customer Support", color: "text-teal-600" },
              { count: 100, suffix: "%", label: "Secure & Verified", color: "text-purple-600" },
            ].map(({ count, suffix, label, color }) => (
              <div key={label} className="stat-card text-center p-4 rounded-2xl hover:bg-gray-50 transition">
                <div className={`text-3xl md:text-4xl font-extrabold ${color} flex justify-center items-baseline gap-0.5`}>
                  <span data-count={count}>0</span>
                  <span className="text-2xl">{suffix}</span>
                </div>
                <p className="text-gray-500 mt-2 text-sm font-medium">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── SEARCH ────────────────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-8 text-center">Search Properties</h2>
          <div className="bg-white p-6 rounded-2xl shadow-lg">
            <FilterBar onFilter={fetchHouses} />
          </div>
        </div>
      </div>

      {/* ── FEATURED LISTINGS ─────────────────────────────────────────────── */}
      <div className="container mx-auto px-4 pb-16">
        <div className="mb-10">
          <h2 className="text-3xl font-bold mb-2">Featured Properties</h2>
          <p className="text-gray-500">Latest and most popular listings</p>
        </div>

        {houses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {houses.slice(0, 6).map((house) => (
              <div key={house._id} className="house-card-item">
                <HouseCard house={house} />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            <p className="text-4xl mb-3">🏘️</p>
            <p className="text-lg">Loading properties...</p>
          </div>
        )}

        {houses.length > 6 && (
          <div className="text-center mt-12">
            <Link
              to="/houses"
              className="inline-block bg-gradient-to-r from-indigo-600 to-blue-600 text-white px-10 py-3.5 rounded-xl font-bold hover:shadow-lg hover:-translate-y-0.5 transition-all"
            >
              View All Properties →
            </Link>
          </div>
        )}
      </div>

      {/* ── WHY CHOOSE US ─────────────────────────────────────────────────── */}
      <div ref={whyRef} className="bg-gradient-to-r from-indigo-50 to-blue-50 py-20">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold mb-12 text-center">Why Choose House Rental?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { icon: "🏠", title: "Wide Selection", desc: "Thousands of properties in prime locations across the city." },
              { icon: "🔒", title: "Secure & Verified", desc: "All listings are verified. Your safety and privacy are our priority." },
              { icon: "💬", title: "Expert Support", desc: "Our team is available 24/7 to help you find your perfect home." },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="why-card bg-white p-8 rounded-2xl shadow-sm hover:shadow-md transition-shadow cursor-default"
              >
                <div className="text-4xl mb-4">{icon}</div>
                <h3 className="text-xl font-bold mb-3">{title}</h3>
                <p className="text-gray-600 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── CTA ───────────────────────────────────────────────────────────── */}
      <div ref={ctaRef} className="bg-gradient-to-br from-indigo-600 via-blue-600 to-teal-500 text-white py-20">
        <div className="container mx-auto px-4 text-center cta-content">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Ready to Find Your Home?</h2>
          <p className="text-indigo-100 mb-8 max-w-xl mx-auto text-lg">
            Start your journey today and discover properties that match your lifestyle and budget.
          </p>
          <Link
            to="/houses"
            className="inline-block bg-white text-indigo-600 px-10 py-4 rounded-xl font-bold hover:shadow-xl hover:-translate-y-0.5 transition-all"
          >
            Explore All Properties →
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Home;
