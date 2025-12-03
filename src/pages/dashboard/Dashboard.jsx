import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ResponsiveContainer,
  LineChart,
  Line,
} from "recharts";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import AttendanceTrendsChart from "./AttendanceTrendsChart";
import {
  FiUsers,
  FiTrendingUp,
  FiActivity,
  FiCalendar,
  FiArrowUp,
  FiArrowDown,
} from "react-icons/fi";
import "../../styles/dashboard.css";

export default function Dashboard() {
  const [data, setData] = useState([]);
  const [totalEmployees, setTotalEmployees] = useState(0);
  const [activeEmployees, setActiveEmployees] = useState(0);
  const [pendingEmployees, setPendingEmployees] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        let { data: employees } = await supabase.from("employees").select("role, status");
        if (employees) {
          setTotalEmployees(employees.length);
          setActiveEmployees(employees.filter((e) => e.status === "Active").length);
          setPendingEmployees(employees.filter((e) => e.status === "pending").length);

          const grouped = employees.reduce((acc, emp) => {
            acc[emp.role] = (acc[emp.role] || 0) + 1;
            return acc;
          }, {});
          setData(
            Object.keys(grouped).map((role) => ({ role, count: grouped[role] }))
          );
        }
      } catch (error) {
        console.error("Error fetching employees:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmployees();
  }, []);

  const statCards = [
    {
      title: "Total Employees",
      value: totalEmployees,
      icon: FiUsers,
      color: "#0ea5e9",
      bgGradient: "linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)",
      change: "+12%",
      trend: "up",
    },
    {
      title: "Active Employees",
      value: activeEmployees,
      icon: FiActivity,
      color: "#10b981",
      bgGradient: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
      change: "+5%",
      trend: "up",
    },
    {
      title: "Pending Approval",
      value: pendingEmployees,
      icon: FiCalendar,
      color: "#f59e0b",
      bgGradient: "linear-gradient(135deg, #f59e0b 0%, #d97706 100%)",
      change: "-3%",
      trend: "down",
    },
    {
      title: "Growth Rate",
      value: "24%",
      icon: FiTrendingUp,
      color: "#8b5cf6",
      bgGradient: "linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)",
      change: "+8%",
      trend: "up",
    },
  ];

  return (
    <div className="dashboard">
      {/* Hero Header */}
      <div className="dashboard-hero">
        <div className="hero-content">
          <h1 className="dashboard-title">Dashboard Overview</h1>
          <p className="dashboard-subtitle">
            Welcome back! Here's what's happening with your workforce today.
          </p>
        </div>
        <div className="hero-decoration">
          <div className="floating-shape shape-1"></div>
          <div className="floating-shape shape-2"></div>
          <div className="floating-shape shape-3"></div>
        </div>
      </div>

      {/* Stat Cards Grid */}
      <div className="stats-grid">
        {statCards.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div
              key={stat.title}
              className="stat-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="stat-card-header">
                <div
                  className="stat-icon-wrapper"
                  style={{ background: stat.bgGradient }}
                >
                  <Icon size={24} color="white" />
                </div>
                <div className="stat-trend">
                  {stat.trend === "up" ? (
                    <FiArrowUp size={16} color="#10b981" />
                  ) : (
                    <FiArrowDown size={16} color="#ef4444" />
                  )}
                  <span className={stat.trend === "up" ? "trend-up" : "trend-down"}>
                    {stat.change}
                  </span>
                </div>
              </div>
              <div className="stat-card-body">
                <h3 className="stat-value">{stat.value}</h3>
                <p className="stat-label">{stat.title}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Grid */}
      <div className="dashboard-grid">
        {/* Employees by Role Chart */}
        <div className="dashboard-card chart-card">
          <div className="card-header">
            <div className="card-header-content">
              <FiUsers size={20} className="card-icon" />
              <h2 className="card-title">Employees by Role</h2>
            </div>
          </div>
          <div className="chart-wrapper">
            {loading ? (
              <div className="chart-loading">Loading chart data...</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="role"
                    stroke="#6b7280"
                    style={{ fontSize: "12px" }}
                  />
                  <YAxis stroke="#6b7280" style={{ fontSize: "12px" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f2937",
                      border: "none",
                      borderRadius: "8px",
                      color: "#fff",
                    }}
                  />
                  <Bar
                    dataKey="count"
                    fill="url(#colorGradient)"
                    radius={[8, 8, 0, 0]}
                  />
                  <defs>
                    <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#0ea5e9" stopOpacity={1} />
                      <stop offset="100%" stopColor="#0284c7" stopOpacity={1} />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Attendance Trends Chart */}
        <AttendanceTrendsChart />

        {/* Total Employees Card */}
        <div className="dashboard-card metric-card">
          <div className="metric-card-content">
            <div className="metric-icon-wrapper">
              <FiUsers size={32} color="#0ea5e9" />
            </div>
            <h2 className="card-title">Total Workforce</h2>
            <p className="metric-value">{totalEmployees}</p>
            <p className="metric-description">Active team members</p>
          </div>
        </div>
      </div>
    </div>
  );
}
