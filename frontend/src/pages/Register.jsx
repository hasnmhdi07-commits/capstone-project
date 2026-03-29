import React, { useState, useContext, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../services/api";
import { AuthContext } from "../context/AuthContext";
import { gsap } from "../utils/animations";

const Register = () => {
  const [form, setForm] = useState({ name: "", email: "", password: "", role: "user" });
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const iconRef = useRef(null);

  // ── Entrance animation ──────────────────────────────────────────────────
  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
      tl.fromTo(iconRef.current,
        { opacity: 0, scale: 0.5, rotate: 20 },
        { opacity: 1, scale: 1, rotate: 0, duration: 0.6, ease: "back.out(2)" }
      )
      .fromTo(".register-heading",
        { opacity: 0, y: 20 },
        { opacity: 1, y: 0, duration: 0.5 },
        "-=0.3"
      )
      .fromTo(cardRef.current,
        { opacity: 0, y: 55, scale: 0.97 },
        { opacity: 1, y: 0, scale: 1, duration: 0.65, ease: "back.out(1.3)" },
        "-=0.3"
      )
      .fromTo(".form-field",
        { opacity: 0, x: -20 },
        { opacity: 1, x: 0, stagger: 0.09, duration: 0.4 },
        "-=0.2"
      );
    });
    return () => ctx.revert();
  }, []);

  const shakeCard = () => {
    gsap.fromTo(cardRef.current,
      { x: -10 },
      { x: 0, duration: 0.4, ease: "elastic.out(1, 0.3)" }
    );
  };

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data } = await api.post("/auth/register", form);
      gsap.to(cardRef.current, {
        scale: 0.97, duration: 0.15,
        onComplete: () => { login(data); navigate("/"); },
      });
    } catch (error) {
      shakeCard();
      alert(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-600 via-blue-600 to-teal-500 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div
            ref={iconRef}
            className="inline-flex items-center justify-center w-16 h-16 bg-white rounded-full mb-4 shadow-lg"
          >
            <span className="text-3xl">🏠</span>
          </div>
          <h1 className="register-heading text-4xl font-bold text-white mb-2">Join Us Today</h1>
          <p className="register-heading text-indigo-100">Create an account to start exploring homes</p>
        </div>

        {/* Form Card */}
        <div ref={cardRef} className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div className="form-field">
              <label className="block text-gray-700 font-semibold mb-2">Full Name</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-indigo-400">👤</span>
                <input
                  type="text" name="name" placeholder="John Doe"
                  value={form.name} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label className="block text-gray-700 font-semibold mb-2">Email</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-indigo-400">✉️</span>
                <input
                  type="email" name="email" placeholder="your@email.com"
                  value={form.email} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label className="block text-gray-700 font-semibold mb-2">Password</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-indigo-400">🔒</span>
                <input
                  type="password" name="password" placeholder="••••••••"
                  value={form.password} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition"
                  required
                />
              </div>
            </div>

            <div className="form-field">
              <label className="block text-gray-700 font-semibold mb-2">I am a...</label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-indigo-400">⚙️</span>
                <select
                  name="role" value={form.role} onChange={handleChange}
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-xl focus:border-indigo-500 focus:outline-none transition appearance-none"
                >
                  <option value="user">Tenant (Looking for a home)</option>
                  <option value="owner">Property Owner</option>
                </select>
              </div>
            </div>

            <SubmitButton loading={loading} label="Create Account" loadingLabel="Creating account..." />
          </form>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-3 bg-white text-gray-500">Already have an account?</span>
            </div>
          </div>

          <Link
            to="/login"
            className="w-full block text-center bg-gray-100 text-indigo-600 font-semibold py-3 rounded-xl hover:bg-indigo-50 transition"
          >
            Sign In
          </Link>
        </div>

        <p className="text-center text-indigo-100 text-sm">
          By registering, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

function SubmitButton({ loading, label, loadingLabel }) {
  const btnRef = useRef(null);
  const handleDown = () => gsap.to(btnRef.current, { scale: 0.96, duration: 0.1 });
  const handleUp = () => gsap.to(btnRef.current, { scale: 1, duration: 0.2, ease: "back.out(2)" });

  return (
    <button
      ref={btnRef}
      type="submit"
      disabled={loading}
      onMouseDown={handleDown}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      className="w-full bg-gradient-to-r from-indigo-600 to-blue-600 text-white font-bold py-3 rounded-xl hover:shadow-lg transition mt-2 disabled:opacity-60"
    >
      {loading ? loadingLabel : label}
    </button>
  );
}

export default Register;
