import { useState } from "react";
import { supabase } from "../supabaseClient";
import { showToast } from "../toast";

export default function Settings({ profile, org, onSaved }) {
  const [name, setName] = useState(org?.name || "");
  const [logoUrl, setLogoUrl] = useState(org?.logo_url || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    const path = `${profile.org_id}/logo-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("org-logos").upload(path, file);
    setUploading(false);
    if (error) {
      showToast(`Logo upload failed: ${error.message}`, "error");
      return;
    }
    const { data } = supabase.storage.from("org-logos").getPublicUrl(path);
    setLogoUrl(data.publicUrl);
  }

  async function handleSave() {
    setSaving(true);
    const { error } = await supabase
      .from("organizations")
      .update({ name, logo_url: logoUrl })
      .eq("id", profile.org_id);
    setSaving(false);
    if (error) {
      showToast(`Couldn't save: ${error.message}`, "error");
      return;
    }
    showToast("Branding updated — it now shows everywhere");
    onSaved?.();
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Branding</div>
          <h1>Settings</h1>
        </div>
      </div>

      <div style={{ maxWidth: 480, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, padding: 24 }}>
        <label>Agency / Business name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Demo Realty" style={{ marginBottom: 18 }} />

        <label>Logo</label>
        <div style={{ marginBottom: 8 }}>
          {logoUrl ? (
            <img src={logoUrl} alt="Logo preview" style={{ maxHeight: 60, maxWidth: 220, objectFit: "contain", marginBottom: 10, display: "block" }} />
          ) : (
            <div style={{ fontSize: 12, color: "var(--slate)", marginBottom: 10 }}>No logo uploaded yet</div>
          )}
          <input type="file" accept="image/*" onChange={handleLogoUpload} />
          {uploading && <div style={{ fontSize: 12, color: "var(--slate)", marginTop: 6 }}>Uploading…</div>}
        </div>

        <div style={{ fontSize: 12, color: "var(--slate)", marginBottom: 20 }}>
          This name and logo will show in your admin dashboard sidebar and on your public
          customer-facing page — everywhere your business appears.
        </div>

        <button className="btn btn-brass" onClick={handleSave} disabled={saving || uploading}>
          {saving ? "Saving…" : "Save branding"}
        </button>
      </div>
    </div>
  );
}
