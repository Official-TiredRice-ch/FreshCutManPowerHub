import { useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

export default function OAuthHandler() {
  const { setUser, setProfile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const handleOAuthUser = async () => {
      // 1. Get current session
      const { data: { session } } = await supabase.auth.getSession();
      console.log("Session:", session);
      const user = session?.user;
      console.log("User:", user);
      if (!user) return;

      setUser(user);

      // 2. Check if employee exists
      let { data: profile, error: profileError } = await supabase
        .from("employees")
        .select("*")
        .eq("id", user.id)
        .single();
      if (profileError) console.error("Profile Fetch Error:", profileError);

      // 3. If not, create both profiles & employees (same as register)
      if (!profile) {
        const full_name = user.user_metadata?.full_name || "No Name";
        console.log("Full Name:", full_name);

        const { error: profileInsertError } = await supabase.from("profiles").upsert({
          id: user.id,
          full_name,
          role: "employee",
        });
        if (profileInsertError) console.error("Profiles Upsert Error:", profileInsertError);

        const { error: employeeInsertError } = await supabase.from("employees").upsert({
          id: user.id,
          full_name,
          email: user.email,
          role: "employee",
          department: null,
          contact_number: null,
          salary: 0.0,
          status: "Active",
        });
        if (employeeInsertError) console.error("Employees Upsert Error:", employeeInsertError);

        profile = { id: user.id, full_name, role: "employee" };
      }

      setProfile(profile);

      // 4. Navigate based on role
      console.log("Navigating to:", profile.role === "admin" ? "/dashboard" : "/employee-dashboard");
      if (profile.role === "admin") navigate("/dashboard");
      else navigate("/employee-dashboard");
    };

    handleOAuthUser();
  }, [setUser, setProfile, navigate]);

  return <div>Loading...</div>;
}
