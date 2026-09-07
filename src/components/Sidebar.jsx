import { useState } from "react";
import { NavLink } from "react-router-dom";
import { supabase } from "../supabaseClient";
import UpgradeModal from "../pages/UpgradeModal";
const icons = {
  overview: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="7" height="9" rx="1" /><rect x="14" y="3" width="7" height="5" rx="1" />
      <rect x="14" y="12" width="7" height="9" rx="1" /><rect x="3" y="16" width="7" height="5" rx="1" />
    </svg>
  ),
  properties: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10.5 12 3l9 7.5" /><path d="M5 9.5V21h14V9.5" /><path d="M9 21v-6h6v6" />
    </svg>
  ),
  leads: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="8" r="4" /><path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
    </svg>
  ),
  viewings: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="5" width="18" height="16" rx="2" /><path d="M3 10h18" /><path d="M8 3v4M16 3v4" />
    </svg>
  ),
  import: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3v12" /><path d="M7 10l5 5 5-5" /><path d="M4 20h16" />
    </svg>
  ),
  settings: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
    </svg>
  ),
};
export default function Sidebar({ profile, org }) {
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  async function handleLogout() {
    await supabase.auth.signOut();
  }
  return (
    <>
      <style>{`
        .mobile-menu-toggle { display: none; }
        .sidebar-backdrop { display: none; }
        @media (max-width: 860px) {
          .mobile-menu-toggle {
            display: flex;
            align-items: center;
            justify-content: center;
            position: fixed;
            top: 14px;
            right: 14px;
            width: 40px;
            height: 40px;
            border-radius: 8px;
            background: var(--ink, #14161a);
            color: #fff;
            border: none;
            z-index: 1001;
            cursor: pointer;
            font-size: 18px;
          }
          .sidebar {
            position: fixed;
            top: 0;
            left: 0;
            height: 100vh;
            transform: translateX(-100%);
            transition: transform 0.25s ease;
            z-index: 1000;
            overflow-y: auto;
          }
          .sidebar.mobile-open { transform: translateX(0); }
          .sidebar-backdrop.visible {
            display: block;
            position: fixed;
            inset: 0;
            background: rgba(0,0,0,0.45);
            z-index: 999;
          }
        }
      `}</style>

      <button
        className="mobile-menu-toggle"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={mobileOpen ? "Close menu" : "Open menu"}
      >
        {mobileOpen ? "✕" : "☰"}
      </button>

      <div className={`sidebar-backdrop${mobileOpen ? " visible" : ""}`} onClick={() => setMobileOpen(false)} />

      <div className={`sidebar${mobileOpen ? " mobile-open" : ""}`}>
      {org?.logo_url ? (
        <img src={org.logo_url} alt={org?.name || "Logo"} style={{ maxHeight: 32, maxWidth: 160, marginBottom: 4, objectFit: "contain" }} />
      ) : (
        <div className="brand">{org?.name || "Property Console"}</div>
      )}
      <div className="brand-sub">Agent Workspace</div>
      <NavLink to="/" end onClick={() => setMobileOpen(false)} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
        {icons.overview} Overview
      </NavLink>
      <NavLink to="/properties" onClick={() => setMobileOpen(false)} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
        {icons.properties} Properties
      </NavLink>
      <NavLink to="/leads" onClick={() => setMobileOpen(false)} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
        {icons.leads} Leads
      </NavLink>
      <NavLink to="/viewings" onClick={() => setMobileOpen(false)} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
        {icons.viewings} Viewings
      </NavLink>
      <NavLink to="/import" onClick={() => setMobileOpen(false)} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
        {icons.import} Import
      </NavLink>
      <NavLink to="/settings" onClick={() => setMobileOpen(false)} className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
        {icons.settings} Settings
      </NavLink>
      <div className="sidebar-footer">
        {profile?.full_name || profile?.email || "Signed in"}
        <button onClick={() => setShowUpgrade(true)} style={{ marginBottom: 8 }}>Upgrade Plan</button>
        <button onClick={handleLogout}>Sign out</button>
      </div>

      {showUpgrade && <UpgradeModal orgName={org?.name} onClose={() => setShowUpgrade(false)} />}
      </div>
    </>
  );
}
