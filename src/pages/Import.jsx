import { useState } from "react";
import Papa from "papaparse";
import { supabase } from "../supabaseClient";

const TEMPLATE_HEADERS = [
  "property_code", "title", "description", "city", "area", "property_type",
  "purpose", "price", "currency", "bedrooms", "bathrooms", "size", "size_unit",
  "status", "features", "is_featured", "is_premium", "images",
];

function downloadTemplate() {
  const sample = [
    TEMPLATE_HEADERS.join(","),
    "DHA-010,10 Marla House,Beautiful family home,Lahore,DHA Phase 6,house,sale,45000000,PKR,5,6,10,marla,available,\"garden;parking\",true,false,",
  ].join("\n");
  const blob = new Blob([sample], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "property-import-template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

function toBool(v) {
  if (v === undefined || v === null) return false;
  const s = String(v).trim().toLowerCase();
  return s === "true" || s === "yes" || s === "1";
}

function normalizeRow(raw, orgId) {
  return {
    org_id: orgId,
    property_code: (raw.property_code || "").trim(),
    title: (raw.title || "").trim(),
    description: raw.description || null,
    city: raw.city || null,
    area: raw.area || null,
    property_type: raw.property_type || null,
    purpose: (raw.purpose || "sale").trim().toLowerCase(),
    price: raw.price ? Number(raw.price) : null,
    currency: raw.currency || "PKR",
    bedrooms: raw.bedrooms ? Number(raw.bedrooms) : null,
    bathrooms: raw.bathrooms ? Number(raw.bathrooms) : null,
    size: raw.size ? Number(raw.size) : null,
    size_unit: raw.size_unit || null,
    status: (raw.status || "available").trim().toLowerCase(),
    features: raw.features
      ? raw.features.split(";").map((f) => f.trim()).filter(Boolean)
      : [],
    is_featured: toBool(raw.is_featured),
    is_premium: toBool(raw.is_premium),
    images: raw.images
      ? raw.images.split(";").map((f) => f.trim()).filter(Boolean)
      : [],
  };
}

export default function Import({ profile }) {
  const [rows, setRows] = useState([]);
  const [errors, setErrors] = useState([]);
  const [sheetUrl, setSheetUrl] = useState("");
  const [status, setStatus] = useState("");
  const [importing, setImporting] = useState(false);

  function parseCsvText(text) {
    const result = Papa.parse(text, { header: true, skipEmptyLines: true });
    const problems = [];
    const parsed = result.data
      .map((raw, i) => {
        if (!raw.property_code || !raw.title || !raw.price) {
          problems.push(`Row ${i + 2}: missing property_code, title, or price — skipped.`);
          return null;
        }
        return normalizeRow(raw, profile.org_id);
      })
      .filter(Boolean);
    setRows(parsed);
    setErrors(problems);
    setStatus(`Parsed ${parsed.length} valid rows${problems.length ? `, ${problems.length} skipped` : ""}.`);
  }

  function handleFile(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => parseCsvText(evt.target.result);
    reader.readAsText(file);
  }

  async function handleFetchSheet() {
    if (!sheetUrl) return;
    setStatus("Fetching sheet…");
    try {
      const res = await fetch(sheetUrl);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const text = await res.text();
      parseCsvText(text);
    } catch (e) {
      setStatus(
        `Couldn't fetch that URL directly (${e.message}). This can happen due to browser CORS ` +
        `restrictions on Google's side — if it fails, download the sheet as CSV (File → Download → ` +
        `.csv) and use the file upload option instead, which always works.`
      );
    }
  }

  async function handleImport() {
    if (rows.length === 0) return;
    setImporting(true);
    const { error, count } = await supabase
      .from("properties")
      .upsert(rows, { onConflict: "org_id,property_code", count: "exact" });
    setImporting(false);
    if (error) {
      setStatus(`Import failed: ${error.message}`);
      return;
    }
    setStatus(`Imported/updated ${rows.length} properties successfully.`);
    setRows([]);
  }

  return (
    <div>
      <div className="page-header">
        <div>
          <div className="eyebrow">Bulk Import</div>
          <h1>Import from Google Sheet / CSV</h1>
        </div>
        <button className="btn btn-ghost" onClick={downloadTemplate}>Download template</button>
      </div>

      <div className="empty-state" style={{ textAlign: "left", marginBottom: 24 }}>
        <h3 style={{ marginBottom: 10 }}>How this works</h3>
        <p style={{ marginBottom: 8 }}>
          1. Download the template above, or set up your Google Sheet with these exact column headers:
        </p>
        <p className="mono" style={{ fontSize: 11, marginBottom: 8, color: "var(--slate)" }}>
          {TEMPLATE_HEADERS.join(", ")}
        </p>
        <p style={{ marginBottom: 8 }}>
          2. In Google Sheets: <strong>File → Share → Publish to web</strong>, choose this sheet,
          format <strong>CSV</strong>, publish — copy that link. Or simpler: <strong>File → Download → .csv</strong>.
        </p>
        <p>
          3. Paste the published link below, or upload the downloaded .csv file directly (more reliable).
        </p>
      </div>

      <div style={{ display: "flex", gap: 10, marginBottom: 16, alignItems: "center" }}>
        <input
          type="text"
          placeholder="Published Google Sheet CSV link (optional)"
          value={sheetUrl}
          onChange={(e) => setSheetUrl(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className="btn btn-ghost" onClick={handleFetchSheet}>Fetch</button>
      </div>

      <div style={{ marginBottom: 20 }}>
        <label>Or upload a CSV file directly</label>
        <input type="file" accept=".csv,text/csv" onChange={handleFile} />
      </div>

      {status && <div style={{ fontSize: 13, marginBottom: 12, color: "var(--slate)" }}>{status}</div>}

      {errors.length > 0 && (
        <div style={{ fontSize: 12, color: "var(--rust)", marginBottom: 12 }}>
          {errors.map((e, i) => <div key={i}>{e}</div>)}
        </div>
      )}

      {rows.length > 0 && (
        <>
          <table style={{ marginBottom: 16 }}>
            <thead>
              <tr>
                <th>Code</th><th>Title</th><th>City/Area</th><th>Price</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.slice(0, 8).map((r, i) => (
                <tr key={i}>
                  <td className="mono">{r.property_code}</td>
                  <td>{r.title}</td>
                  <td>{[r.area, r.city].filter(Boolean).join(", ")}</td>
                  <td className="mono">{r.currency} {r.price?.toLocaleString()}</td>
                  <td>{r.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {rows.length > 8 && <div style={{ fontSize: 12, color: "var(--slate)", marginBottom: 16 }}>...and {rows.length - 8} more rows</div>}
          <button className="btn btn-brass" onClick={handleImport} disabled={importing}>
            {importing ? "Importing…" : `Import ${rows.length} properties`}
          </button>
        </>
      )}
    </div>
  );
}
