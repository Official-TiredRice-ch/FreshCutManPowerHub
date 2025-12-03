import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { FiUsers, FiMail, FiBriefcase } from "react-icons/fi";
import "../../styles/EmployeeDashboard.css";

export default function EmployeeDashboard() {
  const { user, profile } = useAuth();
  const [schedule, setSchedule] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [selectedSchedule, setSelectedSchedule] = useState(null);
  const [departmentEmployees, setDepartmentEmployees] = useState([]);
  const [departmentName, setDepartmentName] = useState("");
  const [loadingDept, setLoadingDept] = useState(false);

  useEffect(() => {
    if (user) {
      fetchSchedule();
      fetchAttendance();
      fetchDepartmentEmployees();
    }
  }, [user, profile]);

  const fetchSchedule = async () => {
    const { data, error } = await supabase
      .from("schedules")
      .select("id, shift_date, shift, shift_start, shift_end, project, status")
      .eq("employee_id", user.id);

    if (error) console.error("Error fetching schedule:", error.message);
    else setSchedule(data);
  };

  const fetchAttendance = async () => {
    const { data, error } = await supabase
      .from("attendance")
      .select("date, status, check_in, check_out")
      .eq("employee_id", user.id)
      .order("date", { ascending: false });
    if (!error) setAttendance(data);
  };

  const fetchDepartmentEmployees = async () => {
    if (!user || !profile) return;

    setLoadingDept(true);
    try {
      // Get the current employee's department and schedules
      const { data: currentEmployee, error: empError } = await supabase
        .from("employees")
        .select(`
          department_id,
          departments(name),
          schedules(
            temporary_department,
            departments!schedules_temporary_department_fkey(name),
            created_at
          )
        `)
        .eq("id", user.id)
        .single();

      if (empError) {
        console.error("Error fetching employee department:", empError);
        setLoadingDept(false);
        return;
      }

      // Prioritize permanent department over temporary
      let deptId = currentEmployee?.department_id;
      let deptName = currentEmployee?.departments?.name || null;
      let isTemporary = false;

      // Only use temporary department if there's no permanent department
      if (!deptId && currentEmployee?.schedules?.length > 0) {
        const latestSchedule = currentEmployee.schedules.reduce((latest, current) =>
          new Date(current.created_at) > new Date(latest?.created_at || 0)
            ? current
            : latest,
          null
        );

        if (latestSchedule?.temporary_department && latestSchedule?.departments?.name) {
          deptId = latestSchedule.temporary_department;
          deptName = `${latestSchedule.departments.name} (Temp Dept)`;
          isTemporary = true;
        }
      }

      if (!deptId) {
        setLoadingDept(false);
        return; // No department assigned
      }

      setDepartmentName(deptName || "Unknown Department");

      // Fetch all employees in the same department (excluding current user)
      // If temporary, we need to check schedules for employees with the same temp dept
      if (isTemporary) {
        // For temporary departments, find employees with the same temp dept in their latest schedule
        const { data: allEmployees, error: allEmpError } = await supabase
          .from("employees")
          .select(`
            id,
            full_name,
            email,
            role,
            status,
            department_id,
            schedules(
              temporary_department,
              created_at
            )
          `)
          .eq("status", "Active")
          .neq("id", user.id);

        if (allEmpError) {
          console.error("Error fetching employees:", allEmpError);
        } else {
          // Filter employees who have the same temporary department in their latest schedule
          const filteredEmployees = (allEmployees || []).filter((emp) => {
            if (!emp.schedules || emp.schedules.length === 0) return false;
            
            const latestSchedule = emp.schedules.reduce((latest, current) =>
              new Date(current.created_at) > new Date(latest?.created_at || 0)
                ? current
                : latest,
              null
            );

            return latestSchedule?.temporary_department === deptId;
          });

          setDepartmentEmployees(
            filteredEmployees.map((emp) => ({
              id: emp.id,
              full_name: emp.full_name,
              email: emp.email,
              role: emp.role,
              status: emp.status,
            }))
          );
        }
      } else {
        // For permanent departments, use the standard query
        const { data: employees, error: deptError } = await supabase
          .from("employees")
          .select("id, full_name, email, role, status")
          .eq("department_id", deptId)
          .eq("status", "Active")
          .neq("id", user.id)
          .order("full_name");

        if (deptError) {
          console.error("Error fetching department employees:", deptError);
        } else {
          setDepartmentEmployees(employees || []);
        }
      }
    } catch (err) {
      console.error("Error in fetchDepartmentEmployees:", err);
    } finally {
      setLoadingDept(false);
    }
  };

  const handleSignOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Sign out error:", error);
        return;
      }
      // Navigation will be handled by AuthContext and App.jsx routing
    } catch (err) {
      console.error("Sign out error:", err);
    }
  };

  return (
    <div className="employee-dashboard">
      <header className="dashboard-header">
        <h1>Welcome, {profile?.full_name || "Employee"} 👋</h1>
        <button onClick={handleSignOut} className="signout-btn">
          Sign Out
        </button>
      </header>

      {/* Schedule Section */}
      <section className="dashboard-section">
        <h2>My Schedule</h2>
        {schedule.length === 0 ? (
          <p className="empty-text">No schedules assigned yet.</p>
        ) : (
          <ul className="schedule-list">
            {schedule.map((s, idx) => (
              <li
                key={idx}
                className="schedule-item"
                onClick={() => setSelectedSchedule(s)}
              >
                <span className="schedule-date">
                  {new Date(s.shift_date).toLocaleDateString("en-US", {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  })}
                </span>
                <span className="schedule-shift">{s.shift}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Schedule Details Modal */}
        {selectedSchedule && (
          <div className="modal-overlay" onClick={() => setSelectedSchedule(null)}>
            <div
              className="modal-content fancy-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="modal-close"
                onClick={() => setSelectedSchedule(null)}
              >
                ×
              </button>

              <h3 className="modal-title">🗓 Schedule Overview</h3>

              <div className="modal-body modern-details">
                <div className="detail-row">
                  <span className="icon">📅</span>
                  <div>
                    <p className="label">Date</p>
                    <p className="value">
                    {new Date(selectedSchedule.shift_date).toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "short",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </p>
                  </div>
                </div>

                <div className="detail-row">
                  <span className="icon">💼</span>
                  <div>
                    <p className="label">Shift</p>
                    <p className="value">{selectedSchedule.shift}</p>
                  </div>
                </div>

                <div className="detail-row">
                  <span className="icon">🕐</span>
                  <div>
                    <p className="label">Start Time</p>
                    <p className="value">
                      {new Date(`1970-01-01T${selectedSchedule.shift_start}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}
                    </p>
                  </div>
                </div>

                <div className="detail-row">
                  <span className="icon">🕔</span>
                  <div>
                    <p className="label">End Time</p>
                    <p className="value">
                      {new Date(`1970-01-01T${selectedSchedule.shift_end}`).toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true })}
                    </p>
                  </div>
                </div>

                <div className="detail-row">
                  <span className="icon">📂</span>
                  <div>
                    <p className="label">Project</p>
                    <p className="value">{selectedSchedule.project || "N/A"}</p>
                  </div>
                </div>

                <div className="detail-row">
                  <span className="icon">🎯</span>
                  <div>
                    <p className="label">Status</p>
                    <span
                      className={`status-chip ${
                        selectedSchedule.status?.toLowerCase() || "default"
                      }`}
                    >
                      {selectedSchedule.status}
                    </span>
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  className="modal-button"
                  onClick={() => setSelectedSchedule(null)}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}


      </section>

      {/* My Department Section */}
      <section className="dashboard-section">
        <div className="section-header-with-icon">
          <FiBriefcase size={20} className="section-icon" />
          <h2>My Department</h2>
        </div>
        {loadingDept ? (
          <p className="empty-text">Loading department information...</p>
        ) : departmentName ? (
          <div className="department-section">
            <div className="department-header">
              <h3 className="department-name">{departmentName}</h3>
              <span className="department-count">
                {departmentEmployees.length} {departmentEmployees.length === 1 ? "colleague" : "colleagues"}
              </span>
            </div>
            {departmentEmployees.length === 0 ? (
              <p className="empty-text">You're the only active employee in this department.</p>
            ) : (
              <div className="department-employees-grid">
                {departmentEmployees.map((emp) => (
                  <div key={emp.id} className="employee-card">
                    <div className="employee-avatar">
                      <FiUsers size={24} />
                    </div>
                    <div className="employee-info">
                      <h4 className="employee-card-name">{emp.full_name}</h4>
                      <div className="employee-card-details">
                        <div className="employee-detail-item">
                          <FiMail size={14} />
                          <span>{emp.email}</span>
                        </div>
                        <div className="employee-detail-item">
                          <FiBriefcase size={14} />
                          <span>{emp.role || "Employee"}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <p className="empty-text">No department assigned yet.</p>
        )}
      </section>

      {/* Attendance Section */}
      <section className="dashboard-section">
        <h2>My Attendance</h2>
        {attendance.length === 0 ? (
          <p className="empty-text">No attendance records yet.</p>
        ) : (
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Status</th>
                <th>Check-in</th>
                <th>Check-out</th>
              </tr>
            </thead>
            <tbody>
              {attendance.map((a, idx) => (
                <tr key={idx}>
                  <td>{a.date}</td>
                  <td
                    className={`status ${
                      a.status === "Present"
                        ? "present"
                        : a.status === "Absent"
                        ? "absent"
                        : "pending"
                    }`}
                  >
                    {a.status}
                  </td>
                  <td>{a.check_in || "-"}</td>
                  <td>{a.check_out || "-"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <footer className="dashboard-footer">
        Employee Dashboard © {new Date().getFullYear()}
      </footer>
    </div>
  );
}
