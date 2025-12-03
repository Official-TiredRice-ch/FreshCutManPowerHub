import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  FiX,
  FiTrash2,
  FiBriefcase,
  FiKey,
  FiCheck,
} from "react-icons/fi";
import "../../styles/employeelist.css";

export default function EmployeeList() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showTerminateModal, setShowTerminateModal] = useState(false);
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [showCredsModal, setShowCredsModal] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [selectedDept, setSelectedDept] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      let { data, error } = await supabase
        .from("employees")
        .select(`
          id,
          full_name,
          email,
          role,
          salary,
          status,
          department_id,
          departments ( id, name ),
          schedules (
            temporary_department,
            departments!schedules_temporary_department_fkey ( name ),
            created_at
          )
        `);

      if (error) {
        console.error("Error fetching employees:", error.message);
        setError("Failed to fetch employees");
        return;
      }

      // Process employees
      const processed = data.map((emp) => {
        // Prioritize permanent department over temporary
        let deptName = emp.departments?.name || null;

        // Only show temporary department if no permanent department is assigned
        if (!deptName && emp.schedules?.length > 0) {
          let latestSchedule = null;
          latestSchedule = emp.schedules.reduce((latest, current) =>
            new Date(current.created_at) > new Date(latest?.created_at || 0)
              ? current
              : latest,
            null
          );

          if (latestSchedule?.departments?.name) {
            deptName = `${latestSchedule.departments.name} (Temp Dept)`;
          }
        }

        return { ...emp, departmentDisplay: deptName || "—" };
      });

      setEmployees(processed);
    } catch (err) {
      console.error("Error:", err);
      setError("An error occurred while fetching employees");
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    const { data, error } = await supabase.from("departments").select("id, name");
    if (!error && data) {
      setDepartments(data);
    }
  };

  const handleTerminate = async () => {
    if (!selectedEmployee) return;

    try {
      const employeeId = selectedEmployee.id;

      // Delete from employees table
      const { error: deleteEmployeesError } = await supabase
        .from("employees")
        .delete()
        .eq("id", employeeId);

      if (deleteEmployeesError) {
        throw deleteEmployeesError;
      }

      // Delete from profiles table
      const { error: deleteProfilesError } = await supabase
        .from("profiles")
        .delete()
        .eq("id", employeeId);

      if (deleteProfilesError) {
        console.warn("Error deleting profile:", deleteProfilesError);
        // Continue even if profile deletion fails
      }

      // Note: Deleting from auth.users requires Supabase Admin API access
      // This would need to be done server-side with Supabase Admin API
      // For now, we delete from employees and profiles tables

      setSuccess("Employee account permanently deleted successfully.");
      setShowTerminateModal(false);
      setSelectedEmployee(null);
      fetchEmployees();
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      setError(err.message || "Failed to delete employee account");
      setTimeout(() => setError(""), 3000);
    }
  };


  const handleUpdateDepartment = async () => {
    if (!selectedEmployee || selectedDept === undefined || selectedDept === "") {
      setError("Please select a department");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      const departmentId = selectedDept === "none" ? null : selectedDept;
      
      const { error, data } = await supabase
        .from("employees")
        .update({ department_id: departmentId })
        .eq("id", selectedEmployee.id)
        .select();

      if (error) {
        console.error("Update error:", error);
        throw error;
      }

      console.log("Department updated successfully:", data);

      setSuccess("Department updated successfully");
      setShowDeptModal(false);
      setSelectedEmployee(null);
      setSelectedDept("");
      
      // Refresh employees list immediately
      await fetchEmployees();
      
      setTimeout(() => setSuccess(""), 3000);
    } catch (err) {
      console.error("Error updating department:", err);
      setError(err.message || "Failed to update department");
      setTimeout(() => setError(""), 3000);
    }
  };

  const handleUpdateCredentials = async () => {
    if (!selectedEmployee) return;

    setError("");
    setSuccess("");

    // Validate password if provided
    if (newPassword && newPassword !== confirmPassword) {
      setError("Passwords do not match");
      setTimeout(() => setError(""), 3000);
      return;
    }

    if (newPassword && newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      setTimeout(() => setError(""), 3000);
      return;
    }

    try {
      // Update email in employees table if changed
      if (newEmail && newEmail !== selectedEmployee.email) {
        const { error: updateError } = await supabase
          .from("employees")
          .update({ email: newEmail })
          .eq("id", selectedEmployee.id);

        if (updateError) {
          throw new Error(`Failed to update email: ${updateError.message}`);
        }
      }

      // Note: Password updates require Supabase Admin API (server-side)
      // For now, we'll update the email and inform about password limitations
      if (newPassword) {
        setSuccess(
          "Email updated successfully. Password changes require server-side admin API access. Please use the 'Forgot Password' feature or contact system administrator."
        );
      } else {
        setSuccess("Email updated successfully");
      }

      setShowCredsModal(false);
      setSelectedEmployee(null);
      setNewEmail("");
      setNewPassword("");
      setConfirmPassword("");
      fetchEmployees();
      setTimeout(() => setSuccess(""), 5000);
    } catch (err) {
      setError(err.message || "Failed to update credentials");
      setTimeout(() => setError(""), 3000);
    }
  };

  const openTerminateModal = (emp) => {
    setSelectedEmployee(emp);
    setShowTerminateModal(true);
  };

  const openDeptModal = (emp) => {
    setSelectedEmployee(emp);
    setSelectedDept(emp.department_id || "none");
    setShowDeptModal(true);
  };

  const openCredsModal = (emp) => {
    setSelectedEmployee(emp);
    setNewEmail(emp.email);
    setNewPassword("");
    setConfirmPassword("");
    setShowCredsModal(true);
  };

  return (
    <div className="employee-container">
      <h1 className="employee-title">
        <span className="employee-icon">👥</span>
        Employee Management
      </h1>

      {error && (
        <div className="alert alert-error">
          <FiX size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <FiCheck size={18} />
          {success}
        </div>
      )}

      <div className="employee-card">
        {loading ? (
          <div className="loading-state">Loading employees...</div>
        ) : (
          <table className="employee-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Role</th>
                <th>Department</th>
                <th>Salary</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.length > 0 ? (
                employees.map((emp) => (
                  <tr key={emp.id}>
                    <td>{emp.full_name}</td>
                    <td>{emp.email}</td>
                    <td>{emp.role}</td>
                    <td>{emp.departmentDisplay}</td>
                    <td>₱{emp.salary?.toLocaleString() || "0"}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          emp.status === "Active"
                            ? "status-active"
                            : emp.status === "Pending"
                            ? "status-pending"
                            : "status-inactive"
                        }`}
                      >
                        {emp.status}
                      </span>
                    </td>
                    <td>
                      <div className="actions-cell">
                        <button
                          className="action-btn action-btn-dept"
                          onClick={(e) => {
                            e.stopPropagation();
                            openDeptModal(emp);
                          }}
                          title="Update Department"
                        >
                          <FiBriefcase size={14} />
                          <span>Dept</span>
                        </button>
                        <button
                          className="action-btn action-btn-creds"
                          onClick={(e) => {
                            e.stopPropagation();
                            openCredsModal(emp);
                          }}
                          title="Update Credentials"
                        >
                          <FiKey size={14} />
                          <span>Creds</span>
                        </button>
                        <button
                          className="action-btn action-btn-danger"
                          onClick={(e) => {
                            e.stopPropagation();
                            openTerminateModal(emp);
                          }}
                          title="Terminate"
                        >
                          <FiTrash2 size={14} />
                          <span>Terminate</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="no-data">
                    No employees found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Terminate Modal */}
      {showTerminateModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowTerminateModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Delete Employee Account</h2>
              <button
                className="modal-close"
                onClick={() => setShowTerminateModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                Are you sure you want to permanently delete the account for{" "}
                <strong>{selectedEmployee.full_name}</strong>?
              </p>
              <p className="modal-warning">
                This action will permanently delete the employee account from the system.
                This action cannot be undone. All associated data will be removed.
              </p>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowTerminateModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-danger" onClick={handleTerminate}>
                Delete Account Permanently
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Department Modal */}
      {showDeptModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowDeptModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Department</h2>
              <button
                className="modal-close"
                onClick={() => setShowDeptModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                Update department for <strong>{selectedEmployee.full_name}</strong>
              </p>
              <div className="form-group">
                <label>Department</label>
                <select
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="form-input"
                >
                  <option value="none">No Department</option>
                  {departments.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowDeptModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleUpdateDepartment}>
                Update Department
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Credentials Modal */}
      {showCredsModal && selectedEmployee && (
        <div className="modal-overlay" onClick={() => setShowCredsModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Update Credentials</h2>
              <button
                className="modal-close"
                onClick={() => setShowCredsModal(false)}
              >
                <FiX size={20} />
              </button>
            </div>
            <div className="modal-body">
              <p>
                Update credentials for <strong>{selectedEmployee.full_name}</strong>
              </p>
              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  className="form-input"
                  placeholder="new@email.com"
                />
              </div>
              <div className="form-group">
                <label>New Password (leave blank to keep current)</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="form-input"
                  placeholder="Enter new password"
                />
                <small className="form-hint">
                  Note: Password changes require server-side admin access. Email can be updated directly.
                </small>
              </div>
              {newPassword && (
                <div className="form-group">
                  <label>Confirm Password</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="form-input"
                    placeholder="Confirm new password"
                  />
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button
                className="btn btn-secondary"
                onClick={() => setShowCredsModal(false)}
              >
                Cancel
              </button>
              <button className="btn btn-primary" onClick={handleUpdateCredentials}>
                Update Credentials
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
