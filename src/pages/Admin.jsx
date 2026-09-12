import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { useAuth } from "@/lib/AuthContext";

const ROLES = ["user", "admin", "owner"];

export default function Admin() {
  const { role: myRole, user } = useAuth();
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);

  useEffect(() => {
    supabase
      .from("profiles")
      .select("id, email, role, created_at")
      .order("created_at", { ascending: false })
      .then(({ data }) => setProfiles(data || []))
      .finally(() => setLoading(false));
  }, []);

  const handleRoleChange = async (id, newRole) => {
    setSavingId(id);
    const { data, error } = await supabase
      .from("profiles")
      .update({ role: newRole })
      .eq("id", id)
      .select()
      .single();
    if (!error) {
      setProfiles((prev) => prev.map((p) => (p.id === id ? data : p)));
    }
    setSavingId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Admin</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Manage user roles and access.
        </p>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 divide-y divide-border/50">
        {profiles.map((p) => (
          <div key={p.id} className="flex items-center justify-between gap-4 p-4">
            <div className="min-w-0">
              <p className="text-sm font-medium truncate">{p.email || p.id}</p>
              <p className="text-xs text-muted-foreground capitalize">{p.role}</p>
            </div>
            {myRole === "owner" && p.id !== user?.id ? (
              <select
                value={p.role}
                disabled={savingId === p.id}
                onChange={(e) => handleRoleChange(p.id, e.target.value)}
                className="text-sm bg-secondary/50 border border-border/50 rounded-lg px-2 py-1.5"
              >
                {ROLES.map((r) => (
                  <option key={r} value={r}>
                    {r.charAt(0).toUpperCase() + r.slice(1)}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-muted-foreground italic px-2">
                {myRole === "owner" ? "You" : "Owner only"}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
