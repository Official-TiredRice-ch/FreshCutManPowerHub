import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import "../../styles/Login.css";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { user: authUser, profile, setUser, setProfile } = useAuth();

  // If a user is already authenticated, redirect to dashboard
  useEffect(() => {
    if (!authUser || !profile) return;
    const destination = profile.role === "admin" ? "/dashboard" : "/employee-dashboard";
    navigate(destination, { replace: true });
  }, [authUser, profile, navigate]);

  // Handle OAuth redirect on page load
  useEffect(() => {
    const handleOAuthRedirect = async () => {
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("OAuth session error:", sessionError.message);
          return;
        }
        const user = session?.user;
        if (user) await handlePostLogin(user);
      } catch (err) {
        console.error("OAuth redirect error:", err);
      }
    };

    handleOAuthRedirect();

    // Listen for auth state changes
    const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
      const user = session?.user;
      if (user) await handlePostLogin(user);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  // Test Supabase connection
  const testConnection = async () => {
    try {
      console.log("Testing Supabase connection...");
      const { data, error } = await supabase.from("profiles").select("count").limit(1);
      console.log("Connection test result:", { data, error });
      return !error;
    } catch (err) {
      console.error("Connection test failed:", err);
      return false;
    }
  };

  // Email/password login
  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Test connection first
      const isConnected = await testConnection();
      if (!isConnected) {
        throw new Error("Cannot connect to Supabase. Please check your internet connection.");
      }

      // Add timeout to catch hanging requests
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Request timeout - Supabase is not responding")), 10000)
      );

      const loginPromise = supabase.auth.signInWithPassword({
        email,
        password,
      });

      const { data, error: loginError } = await Promise.race([loginPromise, timeoutPromise]);

      if (loginError) throw loginError;
      if (!data.user) throw new Error("Login failed: User not found.");
      await handlePostLogin(data.user);
    } catch (err) {
      console.error("Login error:", err);
      setError(err.message);
      showToast(err.message, "#ef4444");
    } finally {
      setLoading(false);
    }
  };

  // OAuth login (Google/Facebook)
  const handleSocialLogin = async (provider) => {
    try {
      setError(null);
      await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: window.location.href,
          queryParams: provider === "google" ? { prompt: "select_account" } : {},
        },
      });
    } catch (err) {
      setError(err.message);
      showToast(err.message, "#ef4444");
    }
  };

  // After login: insert/check user
  const handlePostLogin = async (user) => {
    setUser(user);

    if (!user.email) {
      setError("OAuth login did not return an email. Please use another method.");
      return;
    }

    // Check if employee exists
    let { data: profile, error: profileError } = await supabase
      .from("employees")
      .select("*")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError && profileError.code !== "PGRST116") {
      console.error("Profile fetch error:", profileError.message);
    }

    // If no employee, insert into profiles & employees
    if (!profile) {
      const full_name = user.user_metadata?.full_name || user.user_metadata?.name || "No Name";

      const { error: profilesError } = await supabase.from("profiles").upsert({
        id: user.id,
        full_name,
        role: "employee",
      });
      if (profilesError) console.error("Profiles insert error:", profilesError.message);

      const { error: employeesError } = await supabase.from("employees").upsert({
        id: user.id,
        full_name,
        email: user.email,
        role: "employee",
        department: null,
        contact_number: null,
        salary: 0.0,
        status: "Active",
      });
      if (employeesError) console.error("Employees insert error:", employeesError.message);

      profile = { id: user.id, full_name, role: "employee" };
    }

    setProfile(profile);

    // Redirect based on role
    if (profile.role === "admin") navigate("/dashboard");
    else navigate("/employee-dashboard");
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

  return (
    <div className="login-page">
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

      {/* Login Form Card */}
      <div id="form-card" className="login-form">
        {/* Logo/Icon */}
        <div className="text-center mb-8">
          <div className="inline-block p-4 rounded-full mb-4 login-logo">
            <svg width="48" height="48" viewBox="0 0 48 48" fill="none">
              <circle cx="24" cy="24" r="20" stroke="white" strokeWidth="2" opacity="0.3" />
              <circle cx="24" cy="12" r="4" fill="white" />
              <circle cx="36" cy="24" r="4" fill="white" />
              <circle cx="24" cy="36" r="4" fill="white" />
              <circle cx="12" cy="24" r="4" fill="white" />
              <circle cx="24" cy="24" r="5" fill="white" />
            </svg>
          </div>
          <h1 id="login-title" className="font-bold mb-2">
            Manpower Hub
          </h1>
          <p id="login-subtitle" className="opacity-70">
            Connect to your workforce ecosystem
          </p>
        </div>

        {/* Login Form */}
        <form id="login-form" className="space-y-6" onSubmit={handleLogin}>
          <div>
            <label id="email-label" htmlFor="email" className="block font-medium mb-2">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="input-field w-full px-4 py-3 border-2 rounded-lg focus:outline-none focus:ring-0"
              placeholder="••••••••"
              required
            />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center cursor-pointer">
              <input type="checkbox" className="mr-2 rounded w-4 h-4 cursor-pointer" />
              <span id="remember-text" className="text-sm opacity-70">
                Remember me
              </span>
            </label>
            <a
              id="forgot-password"
              href="#"
              className="link-hover text-sm font-medium"
              onClick={(e) => {
                e.preventDefault();
                showToast("Password reset link sent to your email!", "#0284c7");
              }}
            >
              Forgot Password?
            </a>
          </div>

          {error && (
            <div className="text-red-500 text-sm text-center bg-red-50 p-2 rounded">
              {error}
            </div>
          )}

          <button
            type="submit"
            id="login-button"
            className="btn-login w-full py-4 rounded-lg font-semibold shadow-lg"
            disabled={loading}
          >
            {loading ? "Logging in..." : "Access Dashboard"}
          </button>
        </form>

        {/* Divider */}
        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-4 bg-white opacity-70">or</span>
          </div>
        </div>

        {/* Social Login Buttons */}
        <div className="social-login-container space-y-3">
          <button
            type="button"
            onClick={() => handleSocialLogin("google")}
            className="social-btn google-btn w-full py-3 rounded-lg font-medium shadow-md flex items-center justify-center gap-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          <button
            type="button"
            onClick={() => handleSocialLogin("facebook")}
            className="social-btn facebook-btn w-full py-3 rounded-lg font-medium shadow-md flex items-center justify-center gap-3"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
            </svg>
            Continue with Facebook
          </button>
        </div>

        {/* Navigation Links */}
        <div className="text-center mt-6 space-y-2">
          <a
            id="signup-text"
            href="#"
            className="link-hover text-sm font-medium block"
            onClick={(e) => {
              e.preventDefault();
              navigate("/register");
            }}
          >
            New here? Create an account
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
