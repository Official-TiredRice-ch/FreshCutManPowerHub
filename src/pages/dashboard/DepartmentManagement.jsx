// pages/dashboard/DepartmentManagement.jsx
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import "../../styles/departmentmanage.css";

export default function DepartmentManagement() {
  const [departments, setDepartments] = useState([]);
  const [newDept, setNewDept] = useState("");
  const [newRate, setNewRate] = useState("");

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    const { data, error } = await supabase.from("departments").select("*");
    if (!error) setDepartments(data);
    else console.error("Error fetching departments:", error);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newDept.trim()) return alert("Enter department name");

    const { error } = await supabase
      .from("departments")
      .insert([
        {
          name: newDept.trim(),
          salary_rate: newRate ? parseFloat(newRate) : 0.0,
        },
      ]);

    if (!error) {
      setNewDept("");
      setNewRate("");
      fetchDepartments();
    } else {
      console.error("Error adding department:", error);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this department?")) return;
    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (!error) fetchDepartments();
    else console.error("Error deleting department:", error);
  };

  const handleUpdateRate = async (id, salaryRate) => {
    const { error } = await supabase
      .from("departments")
      .update({ salary_rate: parseFloat(salaryRate) })
      .eq("id", id);

    if (!error) fetchDepartments();
    else console.error("Error updating salary rate:", error);
  };

  return (
    <div className="dept-container">
      <h1 className="dept-title">🏢 Department Management</h1>

      {/* Add Department Form */}
      <form onSubmit={handleAdd} className="dept-form">
        <input
          type="text"
          value={newDept}
          onChange={(e) => setNewDept(e.target.value)}
          placeholder="Enter Department Name"
          className="dept-input"
        />
        <input
          type="number"
          step="0.01"
          value={newRate}
          onChange={(e) => setNewRate(e.target.value)}
          placeholder="Salary Rate"
          className="dept-input"
        />
        <button type="submit" className="btn btn-primary">
          Add
        </button>
      </form>

      {/* Department List */}
      <table className="dept-table">
        <thead>
          <tr>
            <th>Department</th>
            <th>Salary Rate</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {departments.length > 0 ? (
            departments.map((d) => (
              <tr key={d.id}>
                <td>{d.name}</td>
                <td>
                <div className="peso-input">
                    <span className="peso-sign">₱</span>
                    <input
                    type="number"
                    step="0.01"
                    defaultValue={d.salary_rate}
                    onBlur={(e) => handleUpdateRate(d.id, e.target.value)}
                    className="dept-input"
                    />
                </div>
                </td>
                <td>
                  <button
                    onClick={() => handleDelete(d.id)}
                    className="btn btn-delete"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="3" className="no-data">
                No departments found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
