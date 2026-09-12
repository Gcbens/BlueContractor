import React, { useState, useEffect } from "react";
import { supabase } from "@/api/supabaseClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Save, Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { CustomerIcon } from "@/components/dashboard/DashboardMetricIcon";

export default function SettingsPage() {
  const { toast } = useToast();
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({
    company_name: "",
    company_phone: "",
    default_hourly_rate: 50,
    default_tax_rate: 8,
    default_markup: 25,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setUser(u);
      const meta = u?.user_metadata || {};
      setProfile((p) => ({
        ...p,
        company_name: meta.company_name || "",
        company_phone: meta.company_phone || "",
        default_hourly_rate: meta.default_hourly_rate || 50,
        default_tax_rate: meta.default_tax_rate || 8,
        default_markup: meta.default_markup || 25,
      }));
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await supabase.auth.updateUser({ data: profile });
    toast({ title: "Settings saved" });
    setSaving(false);
  };

  return (
    <div className="p-6 md:p-8 max-w-2xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Your profile and default estimate settings
        </p>
      </div>

      {/* Profile */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-5">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
            <CustomerIcon className="w-6 h-6" strokeWidth={3} />
          </div>
          <div>
            <p className="text-base font-semibold">{user?.user_metadata?.full_name || "—"}</p>
            <p className="text-sm text-muted-foreground">{user?.email || "—"}</p>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Company Name</Label>
            <Input
              value={profile.company_name}
              onChange={(e) => setProfile((p) => ({ ...p, company_name: e.target.value }))}
              className="bg-secondary/50 border-border/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Company Phone</Label>
            <Input
              value={profile.company_phone}
              onChange={(e) => setProfile((p) => ({ ...p, company_phone: e.target.value }))}
              className="bg-secondary/50 border-border/50"
            />
          </div>
        </div>
      </div>

      {/* Defaults */}
      <div className="rounded-xl border border-border/50 bg-card/50 p-6 space-y-5">
        <h2 className="text-base font-semibold">Default Estimate Settings</h2>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Hourly Rate ($)</Label>
            <Input
              type="number"
              value={profile.default_hourly_rate}
              onChange={(e) => setProfile((p) => ({ ...p, default_hourly_rate: Number(e.target.value) }))}
              className="bg-secondary/50 border-border/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Tax Rate (%)</Label>
            <Input
              type="number"
              value={profile.default_tax_rate}
              onChange={(e) => setProfile((p) => ({ ...p, default_tax_rate: Number(e.target.value) }))}
              className="bg-secondary/50 border-border/50"
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">Material Markup (%)</Label>
            <Input
              type="number"
              value={profile.default_markup}
              onChange={(e) => setProfile((p) => ({ ...p, default_markup: Number(e.target.value) }))}
              className="bg-secondary/50 border-border/50"
            />
          </div>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-1.5">
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Settings
        </Button>
      </div>
    </div>
  );
}