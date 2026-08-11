import { useState, useEffect } from "react";
import { supabase } from "../supabaseClient";

const PROPERTY_TYPES = ["house", "apartment", "farmhouse", "plot", "land", "commercial", "other"];
const NO_BED_BATH_TYPES = ["plot", "land", "commercial"];
const SIZE_UNITS = ["marla", "kanal", "sqft", "sqm", "acre"];
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB per image
const MAX_IMAGES = 12;

const emptyForm = {
  property_code: "",
  title: "",
  description: "",
  city: "",
  area: "",
  property_type: "house",
  purpose: "sale",
  price: "",
  currency: "PKR",
  bedrooms: "",
  bathrooms: "",
  size: "",
  size_unit: "marla",
  status: "available",
  features: "",
  is_featured: false,
  is_premium: false,
  images: [],
};

function formatPrice(value) {
  const digits = String(value).replace(/[^0-9]/g, "");
  if (!digits) return "";
  return Number(digits).toLocaleString();
}

export default function PropertyFormModal({ orgId, existing, onClose, onSaved }) {
  const [form, setForm] = useState(
    existing
      ? { ...existing, features: (existing.features || []).join(", "), price: existing.price ?? "" }
      : emptyForm
  );
  const [priceDisplay, setPriceDisplay] = useState(existing?.price ? formatPrice(existing.price) : "");
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Suggest a starting property code for brand-new listings (editable, not forced)
  useEffect(() => {
    if (!existing) {
      supabase
        .from("properties")
        .select("id", { count: "exact", head: true })
        .eq("org_id", orgId)
        .then(({ count }) => {
          if (count != null) update("property_code", `LISTING-${String(count + 1).padStart(3, "0")}`);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handlePriceChange(e) {
    const digits = e.target.value.replace(/[^0-9]/g, "");
    setPriceDisplay(formatPrice(digits));
    update("price", digits);
  }

  async function handleImageUpload(e) {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;
    setError("");

    const currentCount = (form.images || []).length;
    if (currentCount >= MAX_IMAGES) {
      setError(`This property already has the maximum of ${MAX_IMAGES} images.`);
      e.target.value = "";
      return;
    }

    // --- Security: validate every file before uploading anything ---
    const accepted = [];
    const rejected = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        rejected.push(`${file.name} — not an image file`);
        continue;
      }
      if (file.size > MAX_IMAGE_SIZE) {
        rejected.push(`${file.name} — too large (max 5MB)`);
        continue;
      }
      if (accepted.length + currentCount >= MAX_IMAGES) {
        rejected.push(`${file.name} — skipped, ${MAX_IMAGES}-image limit reached`);
        continue;
      }
      accepted.push(file);
    }

    if (rejected.length > 0) {
      setError(`Skipped: ${rejected.join("; ")}`);
    }
    if (accepted.length === 0) {
      e.target.value = "";
      return;
    }

    setUploading(true);
    const uploadedUrls = [...(form.images || [])];

    for (const file of accepted) {
      const path = `${orgId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("property-images").upload(path, file);
      if (uploadError) {
        setError((prev) => (prev ? `${prev}; ` : "") + `Upload failed for ${file.name}: ${uploadError.message}`);
        continue;
      }
      const { data } = supabase.storage.from("property-images").getPublicUrl(path);
      uploadedUrls.push(data.publicUrl);
    }

    update("images", uploadedUrls);
    setUploading(false);
    e.target.value = "";
  }

  function removeImage(url) {
    update("images", form.images.filter((i) => i !== url));
  }

  const hideBedBath = NO_BED_BATH_TYPES.includes(form.property_type);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError("");

    const payload = {
      org_id: orgId,
      property_code: form.property_code,
      title: form.title,
      description: form.description || null,
      city: form.city || null,
      area: form.area || null,
      property_type: form.property_type,
      purpose: form.purpose,
      price: form.price === "" ? null : Number(form.price),
      currency: form.currency,
      bedrooms: hideBedBath || form.bedrooms === "" ? null : Number(form.bedrooms),
      bathrooms: hideBedBath || form.bathrooms === "" ? null : Number(form.bathrooms),
      size: form.size === "" ? null : Number(form.size),
      size_unit: form.size_unit,
      status: form.status,
      features: form.features
        ? form.features.split(",").map((f) => f.trim()).filter(Boolean)
        : [],
      is_featured: form.is_featured,
      is_premium: form.is_premium,
      images: form.images || [],
    };

    let result;
    if (existing?.id) {
      result = await supabase.from("properties").update(payload).eq("id", existing.id);
    } else {
      result = await supabase.from("properties").insert(payload);
    }

    setSaving(false);
    if (result.error) {
      setError(result.error.message);
      return;
    }
    onSaved();
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <h2>{existing ? "Edit property" : "Add property"}</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-grid">
            <div>
              <label>Property code <span style={{ color: "var(--rust)" }}>*</span></label>
              <input value={form.property_code} onChange={(e) => update("property_code", e.target.value)} required />
              <div style={{ fontSize: 11, color: "var(--slate)", marginTop: 4 }}>
                Suggested — feel free to edit (e.g. DHA-045)
              </div>
            </div>
            <div>
              <label>Status</label>
              <select value={form.status} onChange={(e) => update("status", e.target.value)}>
                <option value="available">Available</option>
                <option value="reserved">Reserved</option>
                <option value="under_offer">Under offer</option>
                <option value="sold">Sold</option>
                <option value="rented">Rented</option>
                <option value="unavailable">Unavailable</option>
              </select>
            </div>

            <div className="span-2">
              <label>Title <span style={{ color: "var(--rust)" }}>*</span></label>
              <input value={form.title} onChange={(e) => update("title", e.target.value)} required />
            </div>

            <div className="span-2">
              <label>Description</label>
              <textarea value={form.description} onChange={(e) => update("description", e.target.value)} />
            </div>

            <div>
              <label>City</label>
              <input value={form.city} onChange={(e) => update("city", e.target.value)} />
            </div>
            <div>
              <label>Area / Sector</label>
              <input value={form.area} onChange={(e) => update("area", e.target.value)} />
            </div>

            <div>
              <label>Property type <span style={{ color: "var(--rust)" }}>*</span></label>
              <select value={form.property_type} onChange={(e) => update("property_type", e.target.value)}>
                {PROPERTY_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
            <div>
              <label>Purpose</label>
              <select value={form.purpose} onChange={(e) => update("purpose", e.target.value)}>
                <option value="sale">Sale</option>
                <option value="rent">Rent</option>
              </select>
            </div>

            <div>
              <label>Price <span style={{ color: "var(--rust)" }}>*</span></label>
              <input type="text" inputMode="numeric" value={priceDisplay} onChange={handlePriceChange} required placeholder="e.g. 45,000,000" />
            </div>
            <div>
              <label>Currency</label>
              <input value={form.currency} onChange={(e) => update("currency", e.target.value)} />
            </div>

            {!hideBedBath && (
              <>
                <div>
                  <label>Bedrooms</label>
                  <input type="number" value={form.bedrooms} onChange={(e) => update("bedrooms", e.target.value)} />
                </div>
                <div>
                  <label>Bathrooms</label>
                  <input type="number" value={form.bathrooms} onChange={(e) => update("bathrooms", e.target.value)} />
                </div>
              </>
            )}

            <div>
              <label>Size</label>
              <input type="number" value={form.size} onChange={(e) => update("size", e.target.value)} />
            </div>
            <div>
              <label>Size unit</label>
              <select value={form.size_unit} onChange={(e) => update("size_unit", e.target.value)}>
                {SIZE_UNITS.map((u) => (
                  <option key={u} value={u}>{u.charAt(0).toUpperCase() + u.slice(1)}</option>
                ))}
              </select>
            </div>

            <div className="span-2">
              <label>Features (comma separated)</label>
              <input value={form.features} onChange={(e) => update("features", e.target.value)} placeholder="garden, parking, servant quarter" />
            </div>

            <div className="span-2">
              <label>Images (max {MAX_IMAGES}, 5MB each)</label>
              <input type="file" accept="image/*" multiple onChange={handleImageUpload} />
              {uploading && <div style={{ fontSize: 12, color: "var(--slate)", marginTop: 6 }}>Uploading…</div>}
              {form.images?.length > 0 && (
                <div style={{ display: "flex", gap: 8, marginTop: 10, flexWrap: "wrap" }}>
                  {form.images.map((url) => (
                    <div key={url} style={{ position: "relative" }}>
                      <img src={url} alt="" style={{ width: 64, height: 64, objectFit: "cover", borderRadius: 6 }} />
                      <button
                        type="button"
                        onClick={() => removeImage(url)}
                        style={{
                          position: "absolute", top: -6, right: -6, background: "var(--rust)", color: "#fff",
                          border: "none", borderRadius: "50%", width: 18, height: 18, fontSize: 11, cursor: "pointer",
                        }}
                      >
                        ×
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="checkbox-row">
              <input type="checkbox" checked={form.is_featured} onChange={(e) => update("is_featured", e.target.checked)} id="featured" />
              <label htmlFor="featured" style={{ margin: 0 }}>Featured</label>
            </div>
            <div className="checkbox-row">
              <input type="checkbox" checked={form.is_premium} onChange={(e) => update("is_premium", e.target.checked)} id="premium" />
              <label htmlFor="premium" style={{ margin: 0 }}>Premium</label>
            </div>
          </div>

          {error && <div className="error-text">{error}</div>}

          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-brass" disabled={saving || uploading}>
              {saving ? "Saving…" : "Save property"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
