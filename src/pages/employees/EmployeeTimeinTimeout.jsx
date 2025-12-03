import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";

export default function EmployeeTimeinTimeout() {
  const { user, profile } = useAuth();
  const [hasTimedIn, setHasTimedIn] = useState(false);
  const [statusMsg, setStatusMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    checkIfTimedIn();
  }, []);

  async function checkIfTimedIn() {
    const today = new Date().toISOString().split("T")[0];

    const { data } = await supabase
      .from("attendance")
      .select("*")
      .eq("employee_id", user.id)
      .eq("date", today)
      .maybeSingle();

    if (data?.time_in) setHasTimedIn(true);
  }

  async function handleTimeIn() {
    setLoading(true);

    const now = new Date();
    const today = now.toISOString().split("T")[0];
    const t = now.toLocaleTimeString("en-US", { hour12: false });

    const { error } = await supabase.from("attendance").insert({
      employee_id: user.id,
      date: today,
      time_in: t,
    });

    if (!error) {
      setHasTimedIn(true);
      setStatusMsg("Time-in successful ✔");
    }

    setLoading(false);
  }

  async function handleTimeOut() {
    setLoading(true);

    const now = new Date();
    const t = now.toLocaleTimeString("en-US", { hour12: false });
    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase
      .from("attendance")
      .update({ time_out: t })
      .eq("employee_id", user.id)
      .eq("date", today);

    if (!error) {
      setStatusMsg("Time-out successful ✔");
    }

    setLoading(false);
  }

  return (
    <div
      style={{
        minHeight: "50vh",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "linear-gradient(135deg, #35b1e6ff, #203a43, #2c5364)",
        padding: 20,
        borderRadius: 50,
      }}
    >
      <div
        style={{
          width: "380px",
          padding: "35px 30px",
          borderRadius: "20px",
          backdropFilter: "blur(12px)",
          background: "rgba(255,255,255,0.1)",
          border: "1px solid rgba(255,255,255,0.2)",
          boxShadow: "0 8px 30px rgba(0,0,0,0.3)",
          textAlign: "center",
          color: "white",
        }}
      >
        <h2 style={{ fontWeight: 600, marginBottom: 5, fontSize: "26px" }}>
          Hello, {profile?.full_name}
        </h2>
        <p style={{ opacity: 0.7, marginBottom: 25 }}>
          Your attendance tracker
        </p>

        {/* TIME DISPLAY */}
        <div
          style={{
            fontSize: "48px",
            fontWeight: "700",
            marginBottom: 25,
            textShadow: "0 0 15px rgba(255,255,255,0.4)",
          }}
        >
          {time.toLocaleTimeString()}
        </div>

        {/* BUTTON */}
        <button
          onClick={hasTimedIn ? handleTimeOut : handleTimeIn}
          disabled={loading}
          style={{
            width: "100%",
            padding: "15px",
            fontSize: "20px",
            borderRadius: "14px",
            border: "none",
            cursor: "pointer",
            fontWeight: "600",
            background: hasTimedIn
              ? "linear-gradient(135deg, #ff512f, #dd2476)"
              : "linear-gradient(135deg, #56ab2f, #a8e063)",
            color: "#fff",
            boxShadow: "0 6px 20px rgba(0,0,0,0.25)",
            transition: "0.2s",
          }}
        >
          {loading ? "Please wait..." : hasTimedIn ? "Time Out" : "Time In"}
        </button>

        {/* STATUS MESSAGE */}
        {statusMsg && (
          <p
            style={{
              marginTop: 20,
              fontSize: "18px",
              color: "#a8ffc6",
              textShadow: "0 0 10px rgba(0,255,100,0.4)",
            }}
          >
            {statusMsg}
          </p>
        )}
      </div>
    </div>
  );
}
