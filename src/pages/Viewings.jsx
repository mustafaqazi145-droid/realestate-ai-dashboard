import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const STATUS_OPTIONS = ["pending", "confirmed", "completed", "cancelled"];

export default function Viewings() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  async function load() {
    setLoading(true);
    const { data, error } = await supabase
      .from("viewing_requests")
      .select("*, leads(name, phone, lead_score, timeline, budget_max), properties(title, property_code, area, city)")
      .order("requested_time", { ascending: true });
    if (!error) setRows(data);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  async function updateStatus(id, status) {
    await supabase.from("viewing_requests").update({ status }).eq("id", id);
    load();
  }

  function scoreLabel(score) {
    if (score >= 55) return { text: "Hot", color: "var(--ledger)" };
    if (score >= 30) return { text: "Warm", color: "var(--amber)" };
    return { text: "Low intent", color: "var(--slate)" };
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Schedule</div>
          <h1>Viewing Requests</h1>
        </div>
      </div>

      {loading ? (
        <div style={{ color: "var(--slate)" }}>Loading…</div>
      ) : rows.length === 0 ? (
        <div className="empty-state">
          <h3>No viewing requests yet</h3>
          <p>When a customer picks a time slot in the chat widget, it will show up here.</p>
        </div>
      ) : (
        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Property</th>
                <th>Lead</th>
                <th>Signal</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => {
                const s = scoreLabel(r.leads?.lead_score ?? 0);
                return (
                  <tr key={r.id}>
                    <td className="mono">
                      {r.requested_time ? new Date(r.requested_time).toLocaleString() : "—"}
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.properties?.title || "—"}</div>
                      <div style={{ color: "var(--slate)", fontSize: 12 }} className="mono">
                        {r.properties?.property_code}
                      </div>
                    </td>
                    <td>
                      <div style={{ fontWeight: 600 }}>{r.leads?.name || "—"}</div>
                      <div style={{ color: "var(--slate)", fontSize: 12 }}>{r.leads?.phone || "—"}</div>
                    </td>
                    <td>
                      <span style={{ color: s.color, fontWeight: 600, fontSize: 12 }}>{s.text}</span>
                      <div style={{ fontSize: 11, color: "var(--slate)" }}>{r.leads?.timeline || "no timeline given"}</div>
                    </td>
                    <td>
                      <select value={r.status} onChange={(e) => updateStatus(r.id, e.target.value)}>
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{s}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
