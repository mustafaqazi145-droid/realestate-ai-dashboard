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
  const [orgActive, setOrgActive] = useState(null); // null = not checked yet
  const [loading, setLoading] = useState(true);
  const [provisioning, setProvisioning] = useState(false);
  const [provisionError, setProvisionError] = useState("");

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
    fetchOrProvisionProfile();
  }, [session]);

  function fetchOrProvisionProfile() {
    setProvisionError("");
    supabase
      .from("profiles")
      .select("*")
      .eq("id", session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (error) {
          console.error("Profile fetch failed:", error.message);
          setProvisionError(error.message);
          return;
        }
        if (data) {
          setProfile(data);
          return;
        }
        // No profile row yet (first login for this user) — self-provision
        // an organization + profile via the server-side RPC.
        setProvisioning(true);
        supabase
          .rpc("self_provision_org")
          .then(({ data: newProfile, error: rpcError }) => {
            setProvisioning(false);
            if (rpcError) {
              console.error("self_provision_org failed:", rpcError.message);
              setProvisionError(rpcError.message);
              return;
            }
            setProfile(newProfile);
          });
      });
  }

  function loadOrg(orgId) {
    supabase
      .from("organizations")
      .select("name, logo_url")
      .eq("id", orgId)
      .single()
      .then(({ data }) => setOrg(data));

    // Authoritative, server-side check — same function that gates the
    // customer-facing widget/leads, now also gating the dashboard itself.
    supabase
      .rpc("org_is_active", { p_org_id: orgId })
      .then(({ data, error }) => {
        if (error) {
          console.error("org_is_active check failed:", error.message);
          setOrgActive(true); // fail open on a check error, don't lock someone out by accident
          return;
        }
        setOrgActive(data);
      });
  }

  useEffect(() => {
    if (profile?.org_id) loadOrg(profile.org_id);
  }, [profile]);

  // Re-check org_is_active in the background — if a super admin blocks this
  // org while the dashboard is already open, lock it out without requiring
  // a manual refresh.
  useEffect(() => {
    if (!profile?.org_id) return;
    const interval = setInterval(() => {
      supabase
        .rpc("org_is_active", { p_org_id: profile.org_id })
        .then(({ data, error }) => {
          if (error) return; // fail open on a transient check error
          setOrgActive(data);
        });
    }, 30000);
    return () => clearInterval(interval);
  }, [profile]);

  if (loading) return null;

  if (!session) return <Login />;

  if (!profile) {
    if (provisionError) {
      return (
        <div className="login-screen">
          <div className="login-card">
            <div className="brand">Setup failed</div>
            <p style={{ fontSize: 13, color: "var(--slate)", marginBottom: 16 }}>
              We couldn't finish setting up your account: {provisionError}
            </p>
            <button
              className="btn btn-brass"
              style={{ width: "100%" }}
              onClick={fetchOrProvisionProfile}
            >
              Try again
            </button>
          </div>
        </div>
      );
    }
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="brand">
            {provisioning ? "Setting up your account…" : "Loading…"}
          </div>
        </div>
      </div>
    );
  }

  // Wait for the active-status check before showing anything dashboard-related
  if (orgActive === null) return null;

  if (orgActive === false) {
    return (
      <div className="login-screen">
        <div className="login-card">
          <div className="brand">Trial Ended</div>
          <p style={{ fontSize: 13, color: "var(--slate)", marginBottom: 16 }}>
            Your access to this dashboard has ended, or your account has been paused.
            To continue using your property assistant, please contact your account manager.
          </p>
          <button
            className="btn btn-ghost"
            style={{ width: "100%" }}
            onClick={async () => {
              await supabase.auth.signOut();
              window.location.reload();
            }}
          >
            Sign out
          </button>
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
