import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AttendanceList() {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const fetchLogs = async () => {
      let { data, error } = await supabase
        .from("attendance")
        .select("id, date, check_in, check_out, status, employees(full_name)")
        .order("date", { ascending: false });
      if (!error) setLogs(data);
    };
    fetchLogs();
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Attendance Logs</h1>
      <table className="min-w-full border">
        <thead className="bg-gray-200">
          <tr>
            <th className="p-2 border">Employee</th>
            <th className="p-2 border">Date</th>
            <th className="p-2 border">Check In</th>
            <th className="p-2 border">Check Out</th>
            <th className="p-2 border">Status</th>
          </tr>
        </thead>
        <tbody>
          {logs.map((log) => (
            <tr key={log.id}>
              <td className="p-2 border">{log.employees.full_name}</td>
              <td className="p-2 border">{log.date}</td>
              <td className="p-2 border">{log.check_in || "-"}</td>
              <td className="p-2 border">{log.check_out || "-"}</td>
              <td className="p-2 border">{log.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
