import { Routes, Route, Navigate } from "react-router-dom";
import LandingSection from "./components/LandingSection";
import Login from "./pages/auth/Login";
import Register from "./pages/auth/Register";
import Dashboard from "./pages/dashboard/Dashboard";
import EmployeeList from "./pages/employees/EmployeeList";
import PendingEmployees from "./pages/employees/PendingEmployees";


import DepartmentManagement from "./pages/dashboard/DepartmentManagement";
import AttendanceManagement from "./pages/dashboard/AttendanceManagement";

import EmployeeDashboard from "./pages/employees/EmployeeDashboard";
import EmployeeTimein from "./pages/employees/EmployeeTimeinTimeout";


import ScheduleManagement from "./pages/dashboard/ScheduleManagement";
import DashboardLayout from "./layouts/DashboardLayout";
import { useAuth } from "./context/AuthContext";

function App() {
  const { user, profile, loading } = useAuth();

  const loadingElement = (
    <div className="flex items-center justify-center h-screen text-white">
      Loading...
    </div>
  );

  const getHomeRoute = () => {
    if (!user) return "/login";
    if (profile?.role === "admin" || profile?.role === "manager") return "/dashboard";
    return "/employee-dashboard";
  };

  const loginElement = () => {
    if (loading) {
      return <Login />;
    }
    if (user && profile) {
      return <Navigate to={getHomeRoute()} replace />;
    }
    return <Login />;
  };

  const redirectElement = () => {
    if (loading) {
      return loadingElement;
    }
    return <Navigate to={getHomeRoute()} replace />;
  };

  const landingElement = () => {
    if (user && profile) return <Navigate to={getHomeRoute()} replace />;
    return <LandingSection />;
  };

  return (
    <Routes>
      <Route path="/" element={landingElement()} />
      <Route path="/app" element={redirectElement()} />

      {/* Public routes */}
      <Route path="/login" element={loginElement()} />
      <Route path="/register" element={<Register />} />

      {/* Admin/HR routes */}
      <Route path="/dashboard" element={<DashboardLayout><Dashboard /></DashboardLayout>} />
      <Route path="/employees" element={<DashboardLayout><EmployeeList /></DashboardLayout>} />
      <Route path="/pending-employees" element={<DashboardLayout><PendingEmployees /></DashboardLayout>} />
      <Route path="/schedules" element={<DashboardLayout><ScheduleManagement /></DashboardLayout>} />
      <Route path="/departments" element={<DashboardLayout><DepartmentManagement /></DashboardLayout>} />
      <Route path="/attendance" element={<DashboardLayout><AttendanceManagement /></DashboardLayout>} />


      {/* Employee routes */}
      <Route path="/employee-dashboard" element={<DashboardLayout><EmployeeDashboard /></DashboardLayout>} />
      <Route path="/employee-timeInTimeOut" element={<DashboardLayout><EmployeeTimein /></DashboardLayout>} />
     
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
