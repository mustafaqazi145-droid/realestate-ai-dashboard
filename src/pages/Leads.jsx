import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { showToast } from "../toast";

const STATUS_OPTIONS = ["new", "contacted", "qualified", "viewing_scheduled", "negotiation", "won", "lost"];

export default function Leads() {
  const [leads, setLeads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(new Set());

  async function loadLeads() {
    setLoading(true);
    const { data, error } = await supabase
      .from("leads")
      .select("*")
      .order("lead_score", { ascending: false })
      .order("created_at", { ascending: false });
    if (!error) setLeads(data);
    setSelected(new Set());
    setLoading(false);
  }

  useEffect(() => {
    loadLeads();
  }, []);

  async function updateStatus(id, status) {
    await supabase.from("leads").update({ lead_status: status, last_contact_at: new Date().toISOString() }).eq("id", id);
    showToast(`Status updated to "${status.replace("_", " ")}"`);
    loadLeads();
  }

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === leads.length ? new Set() : new Set(leads.map((l) => l.id))));
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} lead(s)? This can't be undone.`)) return;
    const { error } = await supabase.from("leads").delete().in("id", Array.from(selected));
    if (error) {
      showToast(`Couldn't delete selected leads: ${error.message}`, "error");
      return;
    }
    showToast(`${selected.size} lead(s) deleted`);
    loadLeads();
  }

  async function deleteOne(id) {
    if (!confirm("Delete this lead? This can't be undone.")) return;
    const { error } = await supabase.from("leads").delete().eq("id", id);
    if (error) {
      showToast(`Couldn't delete: ${error.message}`, "error");
      return;
    }
    showToast("Lead deleted");
    loadLeads();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Pipeline</div>
          <h1>Leads</h1>
        </div>
        {selected.size > 0 && (
          <button className="btn btn-danger" onClick={deleteSelected}>
            Delete {selected.size} selected
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ color: "var(--slate)" }}>Loading…</div>
      ) : leads.length === 0 ? (
        <div className="empty-state">
          <h3>No leads yet</h3>
          <p>Leads captured by the AI chat will appear here automatically.</p>
        </div>
      ) : (
        <div className="table-scroll">
        <table>
          <thead>
            <tr>
              <th style={{ width: 32 }}>
                <input type="checkbox" checked={selected.size === leads.length && leads.length > 0} onChange={toggleAll} />
              </th>
              <th>Name / Contact</th>
              <th>Budget</th>
              <th>Location</th>
              <th>Timeline</th>
              <th>Score</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {leads.map((l) => (
              <tr key={l.id}>
                <td>
                  <input type="checkbox" checked={selected.has(l.id)} onChange={() => toggleOne(l.id)} />
                </td>
                <td>
                  <div style={{ fontWeight: 600 }}>{l.name || "—"}</div>
                  <div style={{ color: "var(--slate)", fontSize: 12 }}>{l.phone || l.email || "—"}</div>
                </td>
                <td>
                  {l.budget_min || l.budget_max
                    ? `${(l.budget_min || 0).toLocaleString()} – ${(l.budget_max || 0).toLocaleString()}`
                    : "—"}
                </td>
                <td>{l.preferred_location || "—"}</td>
                <td>{l.timeline || "—"}</td>
                <td className="mono">{l.lead_score}</td>
                <td>
                  <select value={l.lead_status} onChange={(e) => updateStatus(l.id, e.target.value)}>
                    {STATUS_OPTIONS.map((s) => (
                      <option key={s} value={s}>{s.replace("_", " ")}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <button className="btn-ghost" style={{ border: "none", color: "var(--rust)", cursor: "pointer", background: "none", fontSize: 12 }} onClick={() => deleteOne(l.id)}>
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      )}
    </div>
  );
}
