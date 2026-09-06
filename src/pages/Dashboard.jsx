import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import StatusBadge from "../components/StatusBadge";
import PropertyFormModal from "../components/PropertyFormModal";
import ImageSlider from "../components/ImageSlider";
import { showToast } from "../toast";
import UpgradeModal from "./UpgradeModal";

export default function Dashboard({ profile, orgFeatures, orgName }) {
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [showUpgrade, setShowUpgrade] = useState(false);

  async function loadProperties() {
    setLoading(true);
    const { data, error } = await supabase
      .from("properties")
      .select("*")
      .order("created_at", { ascending: false });
    if (!error) setProperties(data);
    setSelected(new Set());
    setLoading(false);
  }

  useEffect(() => {
    loadProperties();
  }, []);

  async function handleDelete(id) {
    if (!confirm("Delete this property? This can't be undone.")) return;
    const { error } = await supabase.from("properties").delete().eq("id", id);
    if (error) {
      showToast(`Couldn't delete: ${error.message}`, "error");
      return;
    }
    showToast("Property deleted");
    loadProperties();
  }

  function toggleOne(id) {
    setSelected((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleAll() {
    setSelected((prev) => (prev.size === properties.length ? new Set() : new Set(properties.map((p) => p.id))));
  }

  async function deleteSelected() {
    if (selected.size === 0) return;
    if (!confirm(`Delete ${selected.size} propert${selected.size === 1 ? "y" : "ies"}? This can't be undone.`)) return;
    const { error } = await supabase.from("properties").delete().in("id", Array.from(selected));
    if (error) {
      showToast(`Couldn't delete selected properties: ${error.message}`, "error");
      return;
    }
    showToast(`${selected.size} propert${selected.size === 1 ? "y" : "ies"} deleted`);
    loadProperties();
  }

  // Plan limit — computed from the live count on this page, so it's
  // always accurate even the moment a property gets added or deleted.
  const maxProperties = orgFeatures?.max_properties ?? null;
  const atLimit = maxProperties != null && properties.length >= maxProperties;

  function openAdd() {
    if (atLimit) {
      setShowUpgrade(true);
      return;
    }
    setEditing(null);
    setModalOpen(true);
  }

  function openEdit(p) {
    setEditing(p);
    setModalOpen(true);
  }

  function handleSaved() {
    setModalOpen(false);
    showToast(editing ? "Property updated" : "Property added");
    loadProperties();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Inventory</div>
          <h1>Properties</h1>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          {selected.size > 0 && (
            <button className="btn btn-danger" onClick={deleteSelected}>
              Delete {selected.size} selected
            </button>
          )}
          <button
            className="btn btn-brass"
            onClick={openAdd}
            style={atLimit ? { opacity: 0.6, cursor: "pointer" } : undefined}
            title={atLimit ? `You've reached your plan's limit of ${maxProperties} properties` : undefined}
          >
            {atLimit ? `Limit reached (${maxProperties})` : "+ Add property"}
          </button>
        </div>
      </div>

      {atLimit && (
        <div
          style={{
            background: "var(--stone)",
            border: "1px dashed var(--line)",
            borderRadius: 8,
            padding: "12px 16px",
            marginBottom: 18,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            fontSize: 13,
          }}
        >
          <span>
            You've reached your plan's limit of <strong>{maxProperties} properties</strong>. Upgrade to add more.
          </span>
          <button className="btn btn-brass" onClick={() => setShowUpgrade(true)}>
            Upgrade Plan
          </button>
        </div>
      )}

      {loading ? (
        <div style={{ color: "var(--slate)" }}>Loading…</div>
      ) : properties.length === 0 ? (
        <div className="empty-state">
          <h3>No properties yet</h3>
          <p>Add your first listing to start testing AI search against real data.</p>
        </div>
      ) : (
        <>
          <div style={{ marginBottom: 12, fontSize: 13, display: "flex", alignItems: "center", gap: 8 }}>
            <input
              type="checkbox"
              checked={selected.size === properties.length && properties.length > 0}
              onChange={toggleAll}
            />
            <span style={{ color: "var(--slate)" }}>Select all</span>
          </div>
          <div className="property-grid">
            {properties.map((p) => (
              <div className="property-card" key={p.id}>
                <div className="thumb" style={{ position: "relative" }}>
                  <input
                    type="checkbox"
                    checked={selected.has(p.id)}
                    onChange={() => toggleOne(p.id)}
                    style={{ position: "absolute", top: 8, left: 8, width: 16, height: 16, zIndex: 2 }}
                  />
                  {p.images?.[0] ? <ImageSlider images={p.images} alt={p.title} /> : "No photo"}
                </div>
                <div className="body">
                  <div className="code">{p.property_code}</div>
                  <h3>{p.title}</h3>
                  <div className="location">{[p.area, p.city].filter(Boolean).join(", ")}</div>
                  <div className="meta-row">
                    <span>{p.bedrooms ?? "–"} bd</span>
                    <span>{p.bathrooms ?? "–"} ba</span>
                    <span>{p.size ?? "–"} {p.size_unit}</span>
                  </div>
                  <div style={{ marginBottom: 10 }}>
                    <StatusBadge status={p.status} />
                  </div>
                  <div className="spec-line">
                    <span className="currency">{p.currency}</span>
                    <span className="price">{Number(p.price).toLocaleString()}</span>
                  </div>
                  <div className="card-actions">
                    <button className="btn btn-ghost" onClick={() => openEdit(p)}>Edit</button>
                    <button className="btn btn-danger" onClick={() => handleDelete(p.id)}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </>
      )}

      {modalOpen && (
        <PropertyFormModal
          orgId={profile.org_id}
          existing={editing}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      )}

      {showUpgrade && <UpgradeModal orgName={orgName} onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}
