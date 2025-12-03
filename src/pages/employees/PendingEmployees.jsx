import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function PendingEmployees() {
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPending();
  }, []);

  const fetchPending = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("employees")
      .select("id, profile_id, contact_number, status, profiles(full_name, email)")
      .eq("status", "pending");

    if (error) console.error(error);
    else setPending(data);

    setLoading(false);
  };

  const handleApprove = async (id, profile_id) => {
    const position = prompt("Enter position:");
    const department = prompt("Enter department:");

    if (!position || !department) {
      alert("Position and Department are required!");
      return;
    }

    const { error } = await supabase
      .from("employees")
      .update({ status: "active", position, department })
      .eq("id", id);

    if (error) {
      console.error(error);
      alert("Error approving employee.");
    } else {
      alert("Employee approved!");
      fetchPending();
    }
  };

  const handleReject = async (id, profile_id) => {
    if (!window.confirm("Are you sure you want to reject this employee?")) return;

    // delete from employees
    await supabase.from("employees").delete().eq("id", id);

    // optionally also delete profile (depends on your policy)
    await supabase.from("profiles").delete().eq("id", profile_id);

    alert("Employee rejected.");
    fetchPending();
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="bg-white p-6 rounded-xl shadow-md">
      <h1 className="text-xl font-bold mb-4">Pending Employees</h1>

      {pending.length === 0 ? (
        <p>No pending employees 🎉</p>
      ) : (
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-gray-100 text-left">
              <th className="p-2 border">Name</th>
              <th className="p-2 border">Email</th>
              <th className="p-2 border">Contact</th>
              <th className="p-2 border">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pending.map((emp) => (
              <tr key={emp.id} className="border-b">
                <td className="p-2 border">{emp.profiles.full_name}</td>
                <td className="p-2 border">{emp.profiles.email}</td>
                <td className="p-2 border">{emp.contact_number || "N/A"}</td>
                <td className="p-2 border space-x-2">
                  <button
                    onClick={() => handleApprove(emp.id, emp.profile_id)}
                    className="bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleReject(emp.id, emp.profile_id)}
                    className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                  >
                    Reject
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
