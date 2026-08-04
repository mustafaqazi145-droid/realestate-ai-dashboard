import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Overview({ profile }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    async function load() {
      const [{ data: properties }, { data: leads }, { data: viewings }] = await Promise.all([
        supabase.from("properties").select("status"),
        supabase.from("leads").select("lead_score"),
        supabase.from("viewing_requests").select("status"),
      ]);

      setStats({
        totalProperties: properties?.length ?? 0,
        availableProperties: properties?.filter((p) => p.status === "available").length ?? 0,
        totalLeads: leads?.length ?? 0,
        hotLeads: leads?.filter((l) => (l.lead_score ?? 0) >= 55).length ?? 0,
        pendingViewings: viewings?.filter((v) => v.status === "pending").length ?? 0,
      });
    }
    load();
  }, []);

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Welcome back</div>
          <h1>Overview</h1>
        </div>
      </div>

      {!stats ? (
        <div style={{ color: "var(--slate)" }}>Loading…</div>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <div className="stat-value">{stats.totalProperties}</div>
              <div className="stat-label">Total properties</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.availableProperties}</div>
              <div className="stat-label">Currently available</div>
            </div>
            <div className="stat-card">
              <div className="stat-value">{stats.totalLeads}</div>
              <div className="stat-label">Total leads</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: "var(--ledger)" }}>{stats.hotLeads}</div>
              <div className="stat-label">Hot leads</div>
            </div>
            <div className="stat-card">
              <div className="stat-value" style={{ color: "var(--brass)" }}>{stats.pendingViewings}</div>
              <div className="stat-label">Pending viewings</div>
            </div>
          </div>

          <div className="eyebrow" style={{ marginBottom: 14 }}>Quick actions</div>
          <div className="quick-links">
            <Link to="/properties" className="quick-link-card">
              <div className="ql-title">Manage inventory</div>
              <div className="ql-desc">Add, edit, or remove property listings</div>
            </Link>
            <Link to="/leads" className="quick-link-card">
              <div className="ql-title">Review leads</div>
              <div className="ql-desc">See who's serious and follow up</div>
            </Link>
            <Link to="/viewings" className="quick-link-card">
              <div className="ql-title">Upcoming viewings</div>
              <div className="ql-desc">Confirm scheduled meetings</div>
            </Link>
            <Link to="/import" className="quick-link-card">
              <div className="ql-title">Bulk import</div>
              <div className="ql-desc">Bring in listings from a CSV or Google Sheet</div>
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
