import { useState } from "react";
import { supabase } from "../supabaseClient";
import { showToast } from "../toast";
import UpgradeModal from "./UpgradeModal";

const MAX_LOGO_SIZE = 2 * 1024 * 1024; // 2MB — logos should always be small

export default function Settings({ profile, org, orgFeatures, onSaved }) {
  const [name, setName] = useState(org?.name || "");
  const [logoUrl, setLogoUrl] = useState(org?.logo_url || "");
  const [contactName, setContactName] = useState(org?.contact_name || "");
  const [contactPhone, setContactPhone] = useState(org?.contact_phone || "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  // Fail open while orgFeatures hasn't loaded yet, so the fields don't
  // flash "locked" before we actually know the plan.
  const brandingLocked = orgFeatures ? orgFeatures.custom_branding === false : false;

  async function handleLogoUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // --- Security: validate before uploading ---
    if (!file.type.startsWith("image/")) {
      showToast("Please choose an image file for the logo.", "error");
      e.target.value = "";
      return;
    }
    if (file.size > MAX_LOGO_SIZE) {
      showToast(`Logo is too large (${(file.size / 1024 / 1024).toFixed(1)}MB). Max is 2MB.`, "error");
      e.target.value = "";
      return;
    }

    setUploading(true);
    const path = `${profile.org_id}/logo-${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("org-logos").upload(path, file);
    setUploading(false);
    e.target.value = "";
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
      .update({ name, logo_url: logoUrl || null, contact_name: contactName || null, contact_phone: contactPhone || null })
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
        <button className="btn btn-brass" onClick={() => setShowUpgrade(true)}>
          Upgrade Plan
        </button>
      </div>

      {showUpgrade && <UpgradeModal orgName={org?.name} onClose={() => setShowUpgrade(false)} />}

      <div style={{ maxWidth: 480, background: "var(--paper)", border: "1px solid var(--line)", borderRadius: 10, padding: 24 }}>
        {brandingLocked ? (
          <div
            style={{
              background: "var(--stone)",
              border: "1px dashed var(--line)",
              borderRadius: 8,
              padding: 20,
              marginBottom: 20,
              textAlign: "center",
            }}
          >
            <div style={{ fontWeight: 600, marginBottom: 6 }}>Custom branding is an Enterprise feature</div>
            <div style={{ fontSize: 12, color: "var(--slate)", marginBottom: 14 }}>
              Add your own business name and logo to your public page by upgrading your plan.
              Right now your customers see a default, unbranded page.
            </div>
            <button
              type="button"
              className="btn btn-brass"
              onClick={() => setShowUpgrade(true)}
            >
              Upgrade to Enterprise
            </button>
          </div>
        ) : (
          <>
            <label>Agency / Business name</label>
            <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Demo Realty" style={{ marginBottom: 18 }} />

            <label>Logo (max 2MB)</label>
            <div style={{ marginBottom: 8 }}>
              {logoUrl ? (
                <>
                  <img src={logoUrl} alt="Logo preview" style={{ maxHeight: 60, maxWidth: 220, objectFit: "contain", marginBottom: 10, display: "block" }} />
                  <button
                    type="button"
                    className="btn-ghost"
                    style={{ border: "none", color: "var(--rust)", cursor: "pointer", background: "none", fontSize: 12, padding: 0, marginBottom: 10 }}
                    onClick={() => setLogoUrl("")}
                  >
                    Remove logo
                  </button>
                </>
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
          </>
        )}

        <label>Owner / Agent name (shown on property cards)</label>
        <input value={contactName} onChange={(e) => setContactName(e.target.value)} placeholder="e.g. Sweets or Agents" style={{ marginBottom: 18 }} />

        <label>WhatsApp number</label>
        <input value={contactPhone} onChange={(e) => setContactPhone(e.target.value)} placeholder="e.g. 03001234567" style={{ marginBottom: 8 }} />
        <div style={{ fontSize: 12, color: "var(--slate)", marginBottom: 20 }}>
          Buyers will see this name and number on every listing, so they can save it before
          messaging — and the WhatsApp button will message this number directly.
        </div>

        <button className="btn btn-brass" onClick={handleSave} disabled={saving || uploading}>
          {saving ? "Saving…" : "Save branding"}
        </button>
      </div>
    </div>
  );
}
