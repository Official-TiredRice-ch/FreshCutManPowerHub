// pages/dashboard/ScheduleManagement.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "../../styles/schedulemanage.css";

export default function ScheduleManagement() {
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [newSchedule, setNewSchedule] = useState({
    employee_id: "",
    date: "",
    shift: "",
    status: "Scheduled", // default
    temporary_department: "",
  });

  const [editing, setEditing] = useState(null);

  useEffect(() => {
    fetchEmployees();
    fetchDepartments();
    fetchSchedules();
  }, []);

  // ✅ Helper: map shift to times
  const getShiftTimes = (shift) => {
    switch (shift) {
      case "Morning":
        return { start: "08:00:00", end: "12:00:00" };
      case "Afternoon":
        return { start: "13:00:00", end: "17:00:00" };
      case "Evening":
        return { start: "18:00:00", end: "22:00:00" };
      default:
        return { start: null, end: null };
    }
  };

  // ✅ Fetch employees + department
  const fetchEmployees = async () => {
    const { data, error } = await supabase
      .from("employees")
      .select("id, full_name, role, department_id, departments(name)")
      .eq("role", "employee");

    if (!error) setEmployees(data);
    else console.error("Error fetching employees:", error);
  };

  // ✅ Fetch all departments (for floating assignment)
  const fetchDepartments = async () => {
    const { data, error } = await supabase.from("departments").select("id, name");
    if (!error) setDepartments(data);
    else console.error("Error fetching departments:", error);
  };

  // ✅ Fetch schedules + employee + permanent dept + temporary dept
  const fetchSchedules = async () => {
    const { data, error } = await supabase
      .from("schedules")
      .select(`
        id,
        employee_id,
        shift_date,
        shift_start,
        shift_end,
        shift,
        status,
        temporary_department,
        employees (
          full_name,
          department_id,
          departments(name)
        ),
        departments!schedules_temporary_department_fkey(name)
      `)
      .order("shift_date", { ascending: true });

    if (!error) setSchedules(data);
    else console.error("Error fetching schedules:", error);
  };

  const handleAddSchedule = async (e) => {
    e.preventDefault();
    if (!newSchedule.employee_id || !newSchedule.date || !newSchedule.shift) {
      alert("Please fill all fields");
      return;
    }

    const emp = employees.find((e) => e.id === newSchedule.employee_id);

    // 🚨 Prevent scheduling if no department AND no temporary assignment
    if (!emp?.department_id && !newSchedule.temporary_department) {
      alert("This employee does not belong to any department! Please assign a temporary one.");
      return;
    }

    const { start, end } = getShiftTimes(newSchedule.shift);

    const { error } = await supabase.from("schedules").insert([
      {
        employee_id: newSchedule.employee_id,
        shift_date: newSchedule.date,
        shift: newSchedule.shift,
        shift_start: start,
        shift_end: end,
        status: newSchedule.status,
        temporary_department:
          newSchedule.status === "Cancelled"
            ? null
            : emp?.department_id
            ? null
            : newSchedule.temporary_department,
      },
    ]);


    if (!error) {
      setNewSchedule({
        employee_id: "",
        date: "",
        shift: "",
        status: "Scheduled",
        temporary_department: "",
      });
      fetchSchedules();
    } else {
      console.error("Error adding schedule:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this schedule?")) return;
    const { error } = await supabase.from("schedules").delete().eq("id", id);
    if (!error) fetchSchedules();
    else console.error("Error deleting schedule:", error);
  };

  const startEdit = (schedule) => {
    setEditing(schedule.id);
    setNewSchedule({
      employee_id: schedule.employee_id,
      date: schedule.shift_date,
      shift: schedule.shift,
      status: schedule.status,
      temporary_department: schedule.temporary_department || "",
    });
  };

  const handleUpdateSchedule = async (e) => {
    e.preventDefault();
    if (!newSchedule.employee_id || !newSchedule.date || !newSchedule.shift) {
      alert("Please fill all fields");
      return;
    }

    const emp = employees.find((e) => e.id === newSchedule.employee_id);

    if (!emp?.department_id && !newSchedule.temporary_department) {
      alert("This employee does not belong to any department! Please assign a temporary one.");
      return;
    }

    const { start, end } = getShiftTimes(newSchedule.shift);

    const { error } = await supabase
  .from("schedules")
  .update({
    employee_id: newSchedule.employee_id,
    shift_date: newSchedule.date,
    shift: newSchedule.shift,
    shift_start: start,
    shift_end: end,
    status: newSchedule.status,
    temporary_department:
      newSchedule.status === "Cancelled"
        ? null
        : emp?.department_id
        ? null
        : newSchedule.temporary_department,
  })
  .eq("id", editing);


    if (!error) {
      setEditing(null);
      setNewSchedule({
        employee_id: "",
        date: "",
        shift: "",
        status: "Scheduled",
        temporary_department: "",
      });
      fetchSchedules();
    } else {
      console.error("Error updating schedule:", error);
    }
  };

  return (
    <div className="schedule-container">
      <h1 className="schedule-title">📅 Schedule Management</h1>

      {/* Add / Edit Form */}
      <form
        onSubmit={editing ? handleUpdateSchedule : handleAddSchedule}
        className="schedule-form"
      >
        <select
        value={newSchedule.employee_id}
        onChange={(e) =>
          setNewSchedule({ ...newSchedule, employee_id: e.target.value })
        }
        required
      >
        <option value="">Select Employee</option>
        {employees.map((emp) => {
          let deptLabel = "(No Dept)";

          // Default to permanent dept
          if (emp.departments?.name) {
            deptLabel = `(${emp.departments.name})`;
          }

          // 👇 If you're editing/assigning AND you chose a temp dept → override display
          if (
            newSchedule.employee_id === emp.id &&
            newSchedule.temporary_department
          ) {
            const tempDept = departments.find(
              (d) => d.id === newSchedule.temporary_department
            );
            if (tempDept) {
              deptLabel = `(${tempDept.name} - TEMP)`;
            }
          }

          return (
            <option key={emp.id} value={emp.id}>
              {emp.full_name} {deptLabel}
            </option>
          );
        })}
      </select>





        {/* ✅ If employee has no department, show floating dept assign */}
        {newSchedule.employee_id &&
          !employees.find((e) => e.id === newSchedule.employee_id)
            ?.department_id && (
            <div>
              <p className="text-red-500">
                This employee does not belong to any department!
              </p>
              <label>Assign Temporary Department:</label>
              <select
                value={newSchedule.temporary_department}
                onChange={(e) =>
                  setNewSchedule({
                    ...newSchedule,
                    temporary_department: e.target.value,
                  })
                }
              >
                <option value="">-- Select Department --</option>
                {departments.map((dept) => (
                  <option key={dept.id} value={dept.id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>
          )}

        <input
          type="date"
          value={newSchedule.date}
          onChange={(e) =>
            setNewSchedule({ ...newSchedule, date: e.target.value })
          }
          required
        />

        <select
          value={newSchedule.shift}
          onChange={(e) =>
            setNewSchedule({ ...newSchedule, shift: e.target.value })
          }
          required
        >
          <option value="">Select Shift</option>
          <option value="Morning">Morning (8AM - 12PM)</option>
          <option value="Afternoon">Afternoon (1PM - 5PM)</option>
          <option value="Evening">Evening (6PM - 10PM)</option>
        </select>

        {/* Status Selector */}
        <select
          value={newSchedule.status}
          onChange={(e) =>
            setNewSchedule({ ...newSchedule, status: e.target.value })
          }
          required
        >
          <option value="Scheduled">Scheduled</option>
          <option value="Ongoing">Ongoing</option>
          <option value="Completed">Completed</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        <button type="submit" className="btn btn-primary">
          {editing ? "Update" : "Assign"}
        </button>

        {editing && (
          <button
            type="button"
            onClick={() => {
              setEditing(null);
              setNewSchedule({
                employee_id: "",
                date: "",
                shift: "",
                status: "Scheduled",
                temporary_department: "",
              });
            }}
            className="btn btn-cancel"
          >
            Cancel
          </button>
        )}
      </form>

      {/* Schedule Table */}
      <h2 className="schedule-title" style={{ fontSize: "18px" }}>
        All Schedules
      </h2>
      <table className="schedule-table">
        <thead>
          <tr>
            <th>Employee</th>
            <th>Department</th>
            <th>Date</th>
            <th>Shift</th>
            <th>Time</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {schedules.map((s) => (
            <tr key={s.id}>
              <td>{s.employees.full_name}</td>
              <td>
                {s.employees.departments?.name ||
                  s.departments?.name || // 👈 show temp dept name
                  "—"}
              </td>
              <td>{s.shift_date}</td>
              <td>{s.shift}</td>
              <td>
                {s.shift_start} - {s.shift_end}
              </td>
              <td>{s.status}</td>
              <td>
                <button onClick={() => startEdit(s)} className="btn btn-edit">
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(s.id)}
                  className="btn btn-delete"
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
          {schedules.length === 0 && (
            <tr>
              <td colSpan="7" style={{ textAlign: "center", padding: "12px" }}>
                No schedules found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
