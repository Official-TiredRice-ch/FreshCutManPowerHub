import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { FiClock, FiCheckCircle, FiXCircle, FiAlertCircle, FiUsers } from "react-icons/fi";
import "../../styles/attendancemanage.css";

export default function AttendanceManagement() {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState("");
  const [employees, setEmployees] = useState([]);
  const [attendanceRecords, setAttendanceRecords] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const TIME_IN_DEADLINE = "08:00:00"; // 8:00 AM
  const TIME_IN_LATE_THRESHOLD = "08:30:00"; // 8:30 AM (after this is late)
  const TIME_OUT_STANDARD = "17:00:00"; // 5:00 PM

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    if (selectedDept) {
      fetchEmployeesByDepartment();
    } else {
      setEmployees([]);
      setAttendanceRecords({});
    }
  }, [selectedDept]);

  useEffect(() => {
    if (employees.length > 0) {
      fetchTodayAttendance();
    }
  }, [employees]);

  const fetchDepartments = async () => {
    try {
      const { data, error } = await supabase
        .from("departments")
        .select("id, name")
        .order("name");

      if (error) throw error;
      setDepartments(data || []);
    } catch (err) {
      setError("Failed to fetch departments");
      console.error(err);
    }
  };

  const fetchEmployeesByDepartment = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("employees")
        .select("id, full_name, email, status")
        .eq("status", "Active");

      // If "all" is selected, don't filter by department
      if (selectedDept !== "all") {
        query = query.eq("department_id", selectedDept);
      }

      const { data, error } = await query.order("full_name");

      if (error) throw error;
      setEmployees(data || []);
    } catch (err) {
      setError("Failed to fetch employees");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    if (employees.length === 0) return;

    try {
      const today = new Date().toISOString().split("T")[0];
      const employeeIds = employees.map((emp) => emp.id);

      const { data, error } = await supabase
        .from("attendance")
        .select("employee_id, check_in, check_out, status")
        .eq("date", today)
        .in("employee_id", employeeIds);

      if (error) throw error;

      // Create a map of employee_id to attendance record
      const recordsMap = {};
      if (data) {
        data.forEach((record) => {
          recordsMap[record.employee_id] = record;
        });
      }
      setAttendanceRecords(recordsMap);
    } catch (err) {
      console.error("Error fetching attendance:", err);
    }
  };

  useEffect(() => {
    if (employees.length > 0) {
      fetchTodayAttendance();
    }
  }, [employees]);

  const getCurrentTime = () => {
    const now = new Date();
    const hours = String(now.getHours()).padStart(2, "0");
    const minutes = String(now.getMinutes()).padStart(2, "0");
    const seconds = String(now.getSeconds()).padStart(2, "0");
    return `${hours}:${minutes}:${seconds}`;
  };

  const isLate = (timeIn) => {
    if (!timeIn) return false;
    return timeIn > TIME_IN_LATE_THRESHOLD;
  };

  const determineStatus = (timeIn) => {
    if (!timeIn) return "Absent";
    if (isLate(timeIn)) return "Late";
    return "Present";
  };

  async function registerBiometric(employeeId) {
  // 1) Fetch challenge from Supabase Edge Function
  const res = await fetch("https://hunsymrayonkonkyzvot.supabase.co/functions/v1/webauthn-register-challenge", {
    method: "POST"
  });

  const { challenge } = await res.json();

  const challengeBytes = Uint8Array.from(atob(challenge), c => c.charCodeAt(0));
  const userIdBytes = new TextEncoder().encode(employeeId);

  const publicKey = {
    challenge: challengeBytes,
    rp: { name: "Attendance System" },
    user: {
      id: userIdBytes,
      name: `employee-${employeeId}`,
      displayName: `Employee ${employeeId}`,
    },
    pubKeyCredParams: [{ type: "public-key", alg: -7 }],
    authenticatorSelection: {
      authenticatorAttachment: "platform",
      userVerification: "required",
    },
    attestation: "none", // Added: avoids Android errors
  };

  // 2) Create the biometric credential (Android fingerprint prompt appears)
  const credential = await navigator.credentials.create({ publicKey });

  // Convert rawId to Base64
  const credentialId = btoa(
    String.fromCharCode(...new Uint8Array(credential.rawId))
  );

  // Extract attestationObject for parsing later
  const attestationObject = new Uint8Array(
    credential.response.attestationObject
  );

  const attestationBase64 = btoa(
    String.fromCharCode(...attestationObject)
  );

  // Extract clientDataJSON but not strictly required
  const clientDataJSON = new Uint8Array(
    credential.response.clientDataJSON
  );

  const clientDataBase64 = btoa(
    String.fromCharCode(...clientDataJSON)
  );

  // 3) Store required data in Supabase
  const { error } = await supabase.from("biometric_credentials").insert({
    employee_id: employeeId,
    credential_id: credentialId,
    attestation_object: attestationBase64,
    client_data_json: clientDataBase64,
  });

  if (error) {
    console.error(error);
    alert("Error: " + error.message);
  } else {
    alert("Biometric registered!");
  }
}


async function verifyBiometric(employeeId) {
  // 1) Request a challenge from Edge Function
  const res = await fetch(
    "https://hunsymrayonkonkyzvot.supabase.co/functions/v1/webauthn-auth-challenge",
    { method: "POST", body: JSON.stringify({ employeeId }) }
  );

  const { challenge, credentialId } = await res.json();

  const challengeBytes = Uint8Array.from(atob(challenge), c => c.charCodeAt(0));
  const credentialIdBytes = Uint8Array.from(atob(credentialId), c => c.charCodeAt(0));

  // 2) Request fingerprint authentication
  const assertion = await navigator.credentials.get({
    publicKey: {
      challenge: challengeBytes,
      allowCredentials: [
        {
          id: credentialIdBytes,
          type: "public-key",
        },
      ],
      userVerification: "required",
    }
  });

  // 3) Prepare data to send back for verification
  const authData = new Uint8Array(assertion.response.authenticatorData);
  const clientDataJSON = new Uint8Array(assertion.response.clientDataJSON);
  const signature = new Uint8Array(assertion.response.signature);
  const rawId = new Uint8Array(assertion.rawId);

  const payload = {
    employee_id: employeeId,
    credential_id: btoa(String.fromCharCode(...rawId)),
    authenticator_data: btoa(String.fromCharCode(...authData)),
    client_data_json: btoa(String.fromCharCode(...clientDataJSON)),
    signature: btoa(String.fromCharCode(...signature)),
  };

  // 4) Send for server verification
  const verifyRes = await fetch(
    "https://hunsymrayonkonkyzvot.supabase.co/functions/v1/webauthn-verify",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const result = await verifyRes.json();

  if (result.success) {
    return true; // authentication passed!
  }

  alert("Biometric verification failed");
  return false;
}



  const handleTimeIn = async (employeeId, employeeName) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const currentTime = getCurrentTime();
      const status = determineStatus(currentTime);

      // Check if attendance record already exists for today
      const { data: existing } = await supabase
        .from("attendance")
        .select("id, check_in")
        .eq("employee_id", employeeId)
        .eq("date", today)
        .single();

      if (existing && existing.check_in) {
        setError(`${employeeName} has already timed in today.`);
        setTimeout(() => setError(""), 3000);
        return;
      }

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from("attendance")
          .update({
            check_in: currentTime,
            status: status,
          })
          .eq("id", existing.id);

        if (error) throw error;
      } else {
        // Create new record
        const { error } = await supabase.from("attendance").insert({
          employee_id: employeeId,
          date: today,
          check_in: currentTime,
          status: status,
        });

        if (error) throw error;
      }

      setSuccess(`${employeeName} timed in successfully at ${currentTime}`);
      setTimeout(() => setSuccess(""), 3000);
      fetchTodayAttendance();
    } catch (err) {
      setError(`Failed to record time in: ${err.message}`);
      setTimeout(() => setError(""), 3000);
      console.error(err);
    }
  };

  const handleTimeOut = async (employeeId, employeeName) => {
    try {
      const today = new Date().toISOString().split("T")[0];
      const currentTime = getCurrentTime();

      // Check if attendance record exists and has time in
      const { data: existing } = await supabase
        .from("attendance")
        .select("id, check_in, check_out")
        .eq("employee_id", employeeId)
        .eq("date", today)
        .single();

      if (!existing) {
        setError(`${employeeName} must time in first before timing out.`);
        setTimeout(() => setError(""), 3000);
        return;
      }

      if (existing.check_out) {
        setError(`${employeeName} has already timed out today.`);
        setTimeout(() => setError(""), 3000);
        return;
      }

      // Update with time out
      const { error } = await supabase
        .from("attendance")
        .update({
          check_out: currentTime,
        })
        .eq("id", existing.id);

      if (error) throw error;

      setSuccess(`${employeeName} timed out successfully at ${currentTime}`);
      setTimeout(() => setSuccess(""), 3000);
      fetchTodayAttendance();
    } catch (err) {
      setError(`Failed to record time out: ${err.message}`);
      setTimeout(() => setError(""), 3000);
      console.error(err);
    }
  };

  const getAttendanceStatus = (employeeId) => {
    const record = attendanceRecords[employeeId];
    if (!record) return { status: "Not Timed In", checkIn: null, checkOut: null, isLate: false };

    return {
      status: record.status || "Present",
      checkIn: record.check_in || null,
      checkOut: record.check_out || null,
      isLate: isLate(record.check_in),
    };
  };

  return (
    <div className="attendance-management">
      <div className="attendance-header">
        <div className="header-content">
          <div className="header-icon">
            <FiClock size={28} />
          </div>
          <div>
            <h1 className="attendance-title">Attendance Management</h1>
            <p className="attendance-subtitle">
              Record employee time in and time out by department
            </p>
          </div>
        </div>
        <div className="time-info">
          <div className="time-rule">
            <span className="time-label">Time In Deadline:</span>
            <span className="time-value">8:00 AM</span>
          </div>
          <div className="time-rule">
            <span className="time-label">Late After:</span>
            <span className="time-value late">8:30 AM</span>
          </div>
          <div className="time-rule">
            <span className="time-label">Time Out:</span>
            <span className="time-value">5:00 PM</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="alert alert-error">
          <FiXCircle size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="alert alert-success">
          <FiCheckCircle size={18} />
          {success}
        </div>
      )}

      <div className="attendance-filters">
        <div className="filter-group">
          <label htmlFor="department-select">Select Department</label>
          <select
            id="department-select"
            value={selectedDept}
            onChange={(e) => setSelectedDept(e.target.value)}
            className="department-select"
          >
            <option value="">-- Select Department --</option>
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-state">Loading employees...</div>
      ) : selectedDept && employees.length > 0 ? (
        <div className="attendance-table-container">
          <div className="table-header">
            <h2>
              Employees - {new Date().toLocaleDateString()}
              {selectedDept === "all" ? " (All Departments)" : ""}
            </h2>
            <span className="employee-count">{employees.length} employee(s)</span>
          </div>
          <table className="attendance-table">
            <thead>
              <tr>
                <th>Employee Name</th>
                <th>Email</th>
                <th>Status</th>
                <th>Time In</th>
                <th>Time Out</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => {
                const attendance = getAttendanceStatus(employee.id);
                return (
                  <tr key={employee.id}>
                    <td className="employee-name">{employee.full_name}</td>
                    <td className="employee-email">{employee.email}</td>
                    <td>
                      <span
                        className={`status-badge ${
                          attendance.status === "Present"
                            ? "status-present"
                            : attendance.status === "Late"
                            ? "status-late"
                            : attendance.status === "Absent"
                            ? "status-absent"
                            : "status-pending"
                        }`}
                      >
                        {attendance.isLate && attendance.checkIn && (
                          <FiAlertCircle size={14} className="late-icon" />
                        )}
                        {attendance.status}
                      </span>
                    </td>
                    <td className="time-cell">
                      {attendance.checkIn ? (
                        <span className={attendance.isLate ? "time-late" : "time-normal"}>
                          {attendance.checkIn}
                        </span>
                      ) : (
                        <span className="time-missing">—</span>
                      )}
                    </td>
                    <td className="time-cell">
                      {attendance.checkOut ? (
                        <span className="time-normal">{attendance.checkOut}</span>
                      ) : (
                        <span className="time-missing">—</span>
                      )}
                    </td>
                    <td className="actions-cell">
                      <div className="action-buttons">
                        {!attendance.checkIn ? (
                          <button
                            className="btn-time-in"
                           onClick={async () => {
                            const ok = await verifyBiometric(employee.id);
                            if (!ok) return; 
                            handleTimeIn(employee.id, employee.full_name);}}
                          >
                            <FiClock size={16} />
                            Time In
                          </button>
                        ) : !attendance.checkOut ? (
                          <button
                            className="btn-time-out"
                            onClick={async () => {
                            const ok = await verifyBiometric(employee.id);
                            if (!ok) return;
                            handleTimeOut(employee.id, employee.full_name);}}
                          >
                            <FiCheckCircle size={16} />
                            Time Out
                          </button>
                        ) : (
                          <span className="completed-badge">
                            <FiCheckCircle size={16} />
                            Completed
                          </span>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : selectedDept === "all" ? (
        <div className="empty-state">
          <FiUsers size={48} />
          <p>No active employees found.</p>
        </div>
      ) : selectedDept ? (
        <div className="empty-state">
          <FiUsers size={48} />
          <p>No active employees found in this department.</p>
        </div>
      ) : (
        <div className="empty-state">
          <FiClock size={48} />
          <p>Please select a department to view employees.</p>
        </div>
      )}
    </div>
  );
}

