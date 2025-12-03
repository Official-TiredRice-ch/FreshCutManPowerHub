import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { supabase } from "../lib/supabase";

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  // Fetch profile helper
const fetchProfile = useCallback(async (userId, userMeta) => {
  const { data, error } = await supabase
    .from("employees")
    .select("*")
    .eq("id", userId)
    .single();

  if (error && error.code !== "PGRST116") {
    console.error("Error fetching profile:", error.message);
    return null;
  }

  if (!data) {
    // Employee not found — create one
    const full_name = userMeta?.full_name || userMeta?.name || "No Name";
    const email = userMeta?.email || "unknown@example.com";

    const { error: insertError } = await supabase.from("employees").upsert({
      id: userId,
      full_name,
      email,
      role: "employee",
      department: null,
      contact_number: null,
      salary: 0.0,
      status: "Active",
    });

    if (insertError) {
      console.error("Error inserting new employee:", insertError.message);
      return null;
    }

    // Re-fetch the newly inserted profile
    const { data: newProfile } = await supabase
      .from("employees")
      .select("*")
      .eq("id", userId)
      .single();

    return newProfile;
  }

  return data;
}, []);


  // Initialize session
  useEffect(() => {
    const initSession = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (error) console.error("Error getting session:", error.message);

      const currentUser = data?.session?.user ?? null;
      setUser(currentUser);

      if (currentUser) {
        const profileData = await fetchProfile(currentUser.id);
        setProfile(profileData);
      }

      setLoading(false);
    };

    initSession();

    const { data: listener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        const currentUser = session?.user ?? null;
        setUser(currentUser);

        if (currentUser) {
          const profileData = await fetchProfile(currentUser.id);
          setProfile(profileData);
        } else {
          setProfile(null);
        }
      }
    );

    return () => {
      listener?.subscription?.unsubscribe();
    };
  }, [fetchProfile]);

  // Clear auth state function
  const clearAuth = useCallback(() => {
    setUser(null);
    setProfile(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser, profile, setProfile, loading, clearAuth }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
