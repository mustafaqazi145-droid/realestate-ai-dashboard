import { useEffect, useState } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { supabase } from "./supabaseClient";
import Login from "./pages/Login";
import Overview from "./pages/Overview";
import Dashboard from "./pages/Dashboard";
import Leads from "./pages/Leads";
import Viewings from "./pages/Viewings";
import Import from "./pages/Import";
import Settings from "./pages/Settings";
import Sidebar from "./components/Sidebar";

export default function App() {
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [org, setOrg] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setProfile(null);
      return;
    }
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .single()
      .then(({ data, error }) => {
        if (error) {
          console.error("No profile row found for this user yet:", error.message);
        }
        setProfile(data);
      });
  }, [session]);

  function loadOrg(orgId) {
    supabase
      .from("organizations")
      .select("name, logo_url")
      .eq("id", orgId)
      .single()
      .then(({ data }) => setOrg(data));
  }

  useEffect(() => {
    if (profile?.org_id) loadOrg(profile.org_id);
  }, [profile]);

  if (loading) return null;

  if (!session) return <Login />;

  if (!profile) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="brand">Almost there</div>
          <p style={{ fontSize: 13, color: "var(--slate)" }}>
            You're signed in, but no organization profile is linked to this account yet.
            Run the profile-linking SQL from <code>0003_storage_and_admin.sql</code> with your
            user ID, then refresh this page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <div className="app-shell">
        <Sidebar profile={profile} org={org} />
        <div className="main">
          <Routes>
            <Route path="/" element={<Overview profile={profile} />} />
            <Route path="/properties" element={<Dashboard profile={profile} />} />
            <Route path="/leads" element={<Leads profile={profile} />} />
            <Route path="/viewings" element={<Viewings profile={profile} />} />
            <Route path="/import" element={<Import profile={profile} />} />
            <Route path="/settings" element={<Settings profile={profile} org={org} onSaved={() => loadOrg(profile.org_id)} />} />
          </Routes>
        </div>
      </div>
    </BrowserRouter>
  );
}
