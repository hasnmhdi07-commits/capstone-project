import React, { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { gsap, ScrollTrigger } from "../utils/animations";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const navRef = useRef(null);
  const logoRef = useRef(null);

  // ── Animate navbar in on mount ──────────────────────────────────────────
  useEffect(() => {
    gsap.fromTo(
      navRef.current,
      { opacity: 0, y: -20 },
      { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }
    );
  }, []);

  // ── Scroll shadow effect ────────────────────────────────────────────────
  useEffect(() => {
    const nav = navRef.current;
    if (!nav) return;

    const trigger = ScrollTrigger.create({
      start: "top -50",
      onEnter: () =>
        gsap.to(nav, {
          boxShadow: "0 4px 28px rgba(79,70,229,0.12)",
          duration: 0.35,
        }),
      onLeaveBack: () =>
        gsap.to(nav, {
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
          duration: 0.35,
        }),
    });

    return () => trigger.kill();
  }, []);

  // ── Logo bounce on click ────────────────────────────────────────────────
  const handleLogoClick = () => {
    gsap.fromTo(
      logoRef.current,
      { scale: 0.85, rotate: -8 },
      { scale: 1, rotate: 0, duration: 0.45, ease: "back.out(2)" }
    );
  };

  const handleLogout = () => {
    logout();
    setMenuOpen(false);
    navigate("/");
  };

  const isActive = (path) =>
    location.pathname === path
      ? "text-indigo-600 font-semibold"
      : "text-gray-700 hover:text-indigo-600";

  // ── Mobile menu slide animation ─────────────────────────────────────────
  useEffect(() => {
    if (menuOpen) {
      gsap.fromTo(
        ".mobile-menu",
        { opacity: 0, y: -10 },
        { opacity: 1, y: 0, duration: 0.3, ease: "power2.out" }
      );
    }
  }, [menuOpen]);

  return (
    <nav
      ref={navRef}
      className="bg-white sticky top-0 z-40 border-b border-gray-100"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.06)" }}
    >
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        {/* Logo */}
        <Link
          to="/"
          onClick={handleLogoClick}
          className="flex items-center gap-2 text-xl font-bold text-indigo-600"
        >
          <span ref={logoRef} className="text-2xl inline-block">🏠</span>
          <span>HouseRental</span>
        </Link>

        {/* Desktop Nav Links */}
        <div className="hidden md:flex items-center gap-6">
          {[
            { to: "/", label: "Home" },
            { to: "/houses", label: "Browse" },
            ...(user?.role === "owner"
              ? [
                  { to: "/owner/dashboard", label: "My Listings" },
                  { to: "/owner/messages", label: "Messages" },
                ]
              : []),
            ...(user?.role === "admin"
              ? [{ to: "/admin/dashboard", label: "Admin Panel" }]
              : []),
          ].map(({ to, label }) => (
            <NavLink key={to} to={to} label={label} isActive={isActive(to)} />
          ))}
        </div>

        {/* Desktop Auth */}
        <div className="hidden md:flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-sm">
                  {user.name?.[0]?.toUpperCase()}
                </div>
                <div className="flex flex-col">
                  <span className="text-sm font-semibold text-gray-800 leading-tight">{user.name}</span>
                  <span className="text-xs text-gray-500 capitalize leading-tight">{user.role}</span>
                </div>
              </div>
              <AnimatedButton
                onClick={handleLogout}
                className="bg-red-100 text-red-600 px-4 py-1.5 rounded-lg text-sm font-semibold hover:bg-red-200 transition"
              >
                Logout
              </AnimatedButton>
            </div>
          ) : (
            <>
              <Link to="/login" className="text-indigo-600 font-semibold hover:underline transition">
                Login
              </Link>
              <AnimatedButton
                as={Link}
                to="/register"
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition"
              >
                Register
              </AnimatedButton>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Toggle menu"
        >
          <div className="w-6 flex flex-col gap-1.5">
            <span className={`block h-0.5 bg-gray-700 transition-transform origin-center ${menuOpen ? "rotate-45 translate-y-2" : ""}`} />
            <span className={`block h-0.5 bg-gray-700 transition-opacity ${menuOpen ? "opacity-0" : ""}`} />
            <span className={`block h-0.5 bg-gray-700 transition-transform origin-center ${menuOpen ? "-rotate-45 -translate-y-2" : ""}`} />
          </div>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="mobile-menu md:hidden border-t border-gray-100 bg-white px-4 py-4 flex flex-col gap-3">
          <Link to="/" onClick={() => setMenuOpen(false)} className={`py-2 ${isActive("/")}`}>Home</Link>
          <Link to="/houses" onClick={() => setMenuOpen(false)} className={`py-2 ${isActive("/houses")}`}>Browse Properties</Link>

          {user?.role === "owner" && (
            <>
              <Link to="/owner/dashboard" onClick={() => setMenuOpen(false)} className={`py-2 ${isActive("/owner/dashboard")}`}>My Listings</Link>
              <Link to="/owner/messages" onClick={() => setMenuOpen(false)} className={`py-2 ${isActive("/owner/messages")}`}>Messages</Link>
            </>
          )}
          {user?.role === "admin" && (
            <Link to="/admin/dashboard" onClick={() => setMenuOpen(false)} className={`py-2 ${isActive("/admin/dashboard")}`}>Admin Panel</Link>
          )}

          <div className="border-t border-gray-100 pt-3 mt-1">
            {user ? (
              <div className="flex flex-col gap-2">
                <p className="text-sm text-gray-600">
                  Signed in as <strong>{user.name}</strong> ({user.role})
                </p>
                <button
                  onClick={handleLogout}
                  className="w-full bg-red-100 text-red-600 py-2 rounded-lg font-semibold hover:bg-red-200 transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <Link to="/login" onClick={() => setMenuOpen(false)} className="text-center bg-gray-100 text-indigo-600 py-2 rounded-lg font-semibold">Login</Link>
                <Link to="/register" onClick={() => setMenuOpen(false)} className="text-center bg-indigo-600 text-white py-2 rounded-lg font-semibold">Register</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

// ── Animated nav link – scales slightly on hover via GSAP ─────────────────────
function NavLink({ to, label, isActive }) {
  const ref = useRef(null);
  return (
    <Link
      ref={ref}
      to={to}
      className={`transition ${isActive}`}
      onMouseEnter={() => gsap.to(ref.current, { y: -2, duration: 0.2, ease: "power2.out" })}
      onMouseLeave={() => gsap.to(ref.current, { y: 0, duration: 0.25, ease: "power2.inOut" })}
    >
      {label}
    </Link>
  );
}

// ── Animated button — press scale ─────────────────────────────────────────────
function AnimatedButton({ children, onClick, className, as: Tag = "button", ...rest }) {
  const ref = useRef(null);
  const handleDown = () => gsap.to(ref.current, { scale: 0.93, duration: 0.12 });
  const handleUp = () => gsap.to(ref.current, { scale: 1, duration: 0.2, ease: "back.out(2)" });

  return (
    <Tag
      ref={ref}
      onClick={onClick}
      onMouseDown={handleDown}
      onMouseUp={handleUp}
      onMouseLeave={handleUp}
      className={className}
      {...rest}
    >
      {children}
    </Tag>
  );
}

export default Navbar;
