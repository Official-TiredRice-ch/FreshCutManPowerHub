import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import {
  FiMenu,
  FiLogOut,
  FiLayout,
  FiUsers,
  FiClock,
  FiCalendar,
  FiBriefcase,
  FiUser,
  FiCheckSquare,
} from "react-icons/fi";
import "../styles/DashboardLayout.css";

export default function DashboardLayout({ children }) {
  const { user, profile, setUser, setProfile } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        return;
      }
      
      // Clear user and profile state
      setUser(null);
      setProfile(null);
      
      // Navigate to login page
      navigate("/login", { replace: true });
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  const adminNavItems = [
    { path: "/dashboard", label: "Dashboard", icon: FiLayout },
    { path: "/employees", label: "Employees", icon: FiUsers },
    { path: "/pending-employees", label: "Pending", icon: FiClock },
    { path: "/attendance", label: "Attendance", icon: FiCheckSquare },
    { path: "/schedules", label: "Schedules", icon: FiCalendar },
    { path: "/departments", label: "Departments", icon: FiBriefcase },
  ];

  const employeeNavItems = [
  { path: "/employee-dashboard",label: "My Dashboard",icon: FiLayout,},
 //  { path: "/employee-profile",label: "My Profile",icon: FiUser,},
  { path: "/employee-timeInTimeOut",label: "Time In / Time Out",icon: FiClock,}
  ];


  const isActive = (path) => location.pathname === path;

  return (
    <div className={`dashboard-layout ${isCollapsed ? "collapsed" : ""}`}>
      {/* Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <div className="brand-icon">
              <FiLayout size={24} />
            </div>
            {!isCollapsed && <h1 className="sidebar-title">Manpower Hub</h1>}
          </div>
          <button
            className="toggle-btn"
            onClick={() => setIsCollapsed(!isCollapsed)}
            aria-label="Toggle sidebar"
          >
            <FiMenu size={22} />
          </button>
        </div>

        {/* User Profile Section */}
        {!isCollapsed && (
          <div className="sidebar-profile">
            <div className="profile-avatar">
              <FiUser size={20} />
            </div>
            <div className="profile-info">
              <p className="profile-name">{profile?.full_name || "User"}</p>
              <p className="profile-email">{user?.email || "guest@example.com"}</p>
            </div>
          </div>
        )}

        <nav className="sidebar-nav">
          {profile?.role === "admin" ? (
            <>
              {adminNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`sidebar-link ${isActive(item.path) ? "active" : ""}`}
                  >
                    <Icon size={20} className="sidebar-icon" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </>
          ) : (
            <>
              {employeeNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`sidebar-link ${isActive(item.path) ? "active" : ""}`}
                  >
                    <Icon size={20} className="sidebar-icon" />
                    {!isCollapsed && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <button onClick={handleLogout} className="logout-btn">
          <FiLogOut size={18} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </aside>

      {/* Main Content */}
      <main className="main-content">
        <div className="welcome-box">
          <h2 className="welcome-text">
            Welcome back, <span className="welcome-name">{profile?.full_name || "Guest"}</span>!
          </h2>
          <p className="welcome-subtitle">Here's your dashboard overview</p>
        </div>
        {children}
      </main>
    </div>
  );
}
