import { useState } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import "../../styles/Register.css";

export default function Register() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: "",
    password: "",
    full_name: "",
    contact_number: "",
  });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ strength: "", className: "" });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    
    // Check password strength
    if (name === "password") {
      const strength = checkPasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const checkPasswordStrength = (password) => {
    if (password.length === 0) return { strength: "", className: "" };
    if (password.length < 6) return { strength: "Weak", className: "strength-weak" };
    if (password.length < 10) return { strength: "Medium", className: "strength-medium" };
    return { strength: "Strong", className: "strength-strong" };
  };

  const showToast = (message, color) => {
    const toast = document.createElement("div");
    toast.textContent = message;
    toast.style.cssText = `
      position: fixed;
      top: 24px;
      left: 50%;
      transform: translateX(-50%);
      background: ${color};
      color: white;
      padding: 16px 32px;
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2);
      z-index: 10000;
      font-size: 15px;
      font-weight: 500;
      animation: slideInUp 0.3s ease-out;
    `;
    document.body.appendChild(toast);
    setTimeout(() => {
      toast.style.animation = "slideInUp 0.3s ease-out reverse";
      setTimeout(() => toast.remove(), 300);
    }, 2700);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 1. Create user in Supabase Auth
      const { data, error: authError } = await supabase.auth.signUp({
        email: formData.email,
        password: formData.password,
        options: {
          data: {
            full_name: formData.full_name,
            role: "employee",
          },
        },
      });

      if (authError) {
        if (authError.message.includes("already registered")) {
          throw new Error("This email is already registered. Please login instead.");
        }
        throw authError;
      }

      const user = data.user;
      if (!user) throw new Error("User creation failed. Please try again.");

      // Check if user already exists (email confirmation pending)
      if (data.user && !data.session) {
        showToast("✅ Registration successful! Please check your email to verify your account.", "#0ea5e9");
        setTimeout(() => navigate("/login"), 2000);
        return;
      }

      // Wait for the auth user to be committed to the database
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // 2. Use upsert for profiles table
      const { error: profileError } = await supabase.from("profiles").upsert(
        {
          id: user.id,
          full_name: formData.full_name,
          role: "employee",
        },
        {
          onConflict: "id",
          ignoreDuplicates: false,
        }
      );

      if (profileError) {
        console.warn("Profile upsert warning:", profileError.message);
      }

      // 3. Use upsert for employees table
      const { error: empError } = await supabase.from("employees").upsert(
        {
          id: user.id,
          full_name: formData.full_name,
          email: formData.email,
          role: "Worker",
          department: null,
          contact_number: formData.contact_number || null,
          salary: 0.0,
          status: "Active",
        },
        {
          onConflict: "id",
          ignoreDuplicates: false,
        }
      );

      if (empError) {
        if (empError.message.includes("employees_email_key")) {
          throw new Error("This email is already registered. Please login instead.");
        }
        throw new Error(`Employee registration failed: ${empError.message}`);
      }

      showToast("✅ Registration successful! Please check your email to verify your account.", "#0ea5e9");
      setTimeout(() => navigate("/login"), 2000);
    } catch (err) {
      console.error("Registration Error:", err);
      setError(err.message);
      showToast(err.message, "#ef4444");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      {/* Animated Background with Orbital System */}
      <div id="background-gradient" className="gradient-bg">
        <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="xMidYMid slice">
          {/* Central Hub System */}
          <g transform="translate(50, 50)">
            {/* Ripple rings */}
            <circle className="ripple-ring" cx="0" cy="0" r="8" fill="none" stroke="#ffffff" strokeWidth="0.3" />
            <circle className="ripple-ring-2" cx="0" cy="0" r="8" fill="none" stroke="#ffffff" strokeWidth="0.3" />
            <circle className="ripple-ring-3" cx="0" cy="0" r="8" fill="none" stroke="#ffffff" strokeWidth="0.3" />

            {/* Center hub */}
            <circle className="center-hub" cx="0" cy="0" r="5" fill="#ffffff" />
            <text x="0" y="1.5" textAnchor="middle" fill="#0ea5e9" fontSize="4" fontWeight="bold">
              HUB
            </text>

            {/* Orbiting people - Orbit 1 (medium) */}
            <g className="orbit-person-1">
              <circle cx="0" cy="0" r="2.5" fill="#ffffff" opacity="0.95" />
              <rect x="-1.2" y="2.8" width="2.4" height="4" rx="1.2" fill="#ffffff" opacity="0.95" />
            </g>

            <g className="orbit-person-4">
              <circle cx="0" cy="0" r="2.5" fill="#ffffff" opacity="0.95" />
              <rect x="-1.2" y="2.8" width="2.4" height="4" rx="1.2" fill="#ffffff" opacity="0.95" />
            </g>

            {/* Orbiting people - Orbit 2 (fast/close) */}
            <g className="orbit-person-2">
              <circle cx="0" cy="0" r="2.2" fill="#ffffff" opacity="0.9" />
              <rect x="-1.1" y="2.5" width="2.2" height="3.5" rx="1.1" fill="#ffffff" opacity="0.9" />
            </g>

            <g className="orbit-person-5">
              <circle cx="0" cy="0" r="2.2" fill="#ffffff" opacity="0.9" />
              <rect x="-1.1" y="2.5" width="2.2" height="3.5" rx="1.1" fill="#ffffff" opacity="0.9" />
            </g>

            {/* Orbiting people - Orbit 3 (slow/far) */}
            <g className="orbit-person-3">
              <circle cx="0" cy="0" r="2.8" fill="#ffffff" opacity="0.85" />
              <rect x="-1.4" y="3.2" width="2.8" height="4.5" rx="1.4" fill="#ffffff" opacity="0.85" />
            </g>

            <g className="orbit-person-6">
              <circle cx="0" cy="0" r="2.8" fill="#ffffff" opacity="0.85" />
              <rect x="-1.4" y="3.2" width="2.8" height="4.5" rx="1.4" fill="#ffffff" opacity="0.85" />
            </g>
          </g>

          {/* Decorative corner elements */}
          <circle cx="10" cy="10" r="1.5" fill="#ffffff" opacity="0.3" />
          <circle cx="90" cy="10" r="1.5" fill="#ffffff" opacity="0.3" />
          <circle cx="10" cy="90" r="1.5" fill="#ffffff" opacity="0.3" />
          <circle cx="90" cy="90" r="1.5" fill="#ffffff" opacity="0.3" />
        </svg>
      </div>

      {/* Register Form Card */}
      <div id="form-card" className="register-form">
        {/* Logo/Icon */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full mb-4 register-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" stroke="white" strokeWidth="2" opacity="0.3" />
              <circle cx="24" cy="12" r="4" fill="white" />
              <circle cx="36" cy="24" r="4" fill="white" />
              <circle cx="24" cy="36" r="4" fill="white" />
              <circle cx="12" cy="24" r="4" fill="white" />
              <circle cx="24" cy="24" r="5" fill="white" />
            </svg>
          </div>
          <h1 id="register-title" className="font-bold mb-2">
            Join Manpower Hub
          </h1>
          <p id="register-subtitle" className="opacity-70">
            Create your account and connect with opportunities
          </p>
        </div>

        {/* Register Form */}
        <form id="register-form" className="space-y-5" onSubmit={handleRegister}>
          <div>
            <label id="fullname-label" htmlFor="fullname" className="block font-medium mb-2">
              Full Name
            </label>
            <input
              type="text"
              id="fullname"
              name="full_name"
              value={formData.full_name}
              onChange={handleChange}
              className="input-field w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-0"
              placeholder="John Doe"
              required
            />
          </div>

          <div>
            <label id="email-label" htmlFor="email" className="block font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="input-field w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-0"
              placeholder="you@company.com"
              required
            />
          </div>

          <div>
            <label id="password-label" htmlFor="password" className="block font-medium mb-2">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="input-field w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-0"
              placeholder="••••••••"
              required
            />
            <div className="mt-2">
              <div className="h-1 bg-gray-200 rounded">
                <div id="strength-bar" className={`password-strength ${passwordStrength.className}`}></div>
              </div>
              <p id="strength-text" className="text-xs mt-1 opacity-70">
                {passwordStrength.strength ? `Password strength: ${passwordStrength.strength}` : ""}
              </p>
            </div>
          </div>

          <div>
            <label id="contact-label" htmlFor="contact" className="block font-medium mb-2">
              Contact Number
            </label>
            <input
              type="tel"
              id="contact"
              name="contact_number"
              value={formData.contact_number}
              onChange={handleChange}
              className="input-field w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-0"
              placeholder="+1 (555) 123-4567"
              required
            />
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            id="register-button"
            className="btn-register w-full py-4 rounded-lg font-semibold shadow-lg"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>
        </form>

        {/* Navigation Links */}
        <div className="text-center mt-6 space-y-2">
          <a
            id="login-text"
            href="#"
            className="link-hover text-sm font-medium block"
            onClick={(e) => {
              e.preventDefault();
              navigate("/login");
            }}
          >
            Click here to go back to login
          </a>
          <a
            href="#"
            className="link-hover text-sm font-medium block"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            Back to landing page
          </a>
        </div>
      </div>
    </div>
  );
}
