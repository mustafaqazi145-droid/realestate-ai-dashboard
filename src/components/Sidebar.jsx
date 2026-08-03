import { NavLink } from "react-router-dom";
import { supabase } from "../supabaseClient";

export default function Sidebar({ profile }) {
  async function handleLogout() {
    await supabase.auth.signOut();
  }

  return (
    <div className="sidebar">
      <div className="brand">Property Console</div>
      <div className="brand-sub">Agent Workspace</div>

      <NavLink to="/" end className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
        Properties
      </NavLink>
      <NavLink to="/leads" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
        Leads
      </NavLink>
      <NavLink to="/viewings" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
        Viewings
      </NavLink>
      <NavLink to="/import" className={({ isActive }) => "nav-link" + (isActive ? " active" : "")}>
        Import
      </NavLink>

      <div className="sidebar-footer">
        {profile?.full_name || profile?.email || "Signed in"}
        <button onClick={handleLogout}>Sign out</button>
      </div>
    </div>
  );
}
