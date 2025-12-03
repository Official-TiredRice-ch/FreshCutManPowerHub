import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { FiClock } from "react-icons/fi";

const COLORS = ["#10B981", "#EF4444", "#F59E0B", "#3B82F6"];
// Green = Present, Red = Absent, Yellow = Late, Blue = On Leave

export default function AttendanceTrendsChart() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // get all attendance records for the last 30 days
        let { data: rows, error } = await supabase
          .from("attendance")
          .select("status, date")
          .gte(
            "date",
            new Date(new Date().setDate(new Date().getDate() - 30))
              .toISOString()
              .split("T")[0]
          );

        if (error) {
          console.error("Error fetching attendance:", error.message);
          return;
        }

        if (rows) {
          // group records by status
          const grouped = rows.reduce((acc, row) => {
            const existing = acc.find((item) => item.name === row.status);
            if (existing) {
              existing.value += 1;
            } else {
              acc.push({ name: row.status, value: 1 });
            }
            return acc;
          }, []);

          setData(grouped);
        }
      } catch (error) {
        console.error("Error fetching attendance:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="dashboard-card chart-card">
      <div className="card-header">
        <div className="card-header-content">
          <FiClock size={20} className="card-icon" />
          <h2 className="card-title">Attendance Trends</h2>
        </div>
        <span className="card-subtitle">Last 30 Days</span>
      </div>
      <div className="chart-wrapper">
        {loading ? (
          <div className="chart-loading">Loading attendance data...</div>
        ) : data.length === 0 ? (
          <div className="chart-loading">No attendance data available</div>
        ) : (
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1f2937",
                  border: "none",
                  borderRadius: "8px",
                  color: "#fff",
                }}
              />
              <Legend
                wrapperStyle={{ fontSize: "12px", paddingTop: "20px" }}
              />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
