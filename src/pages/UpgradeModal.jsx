import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

// Your WhatsApp number — the "Message to upgrade" buttons all land here.
const OWNER_WHATSAPP = "923340159006";

const PLAN_LABELS = { starter: "Starter", pro: "Professional", enterprise: "Enterprise" };

const PLAN_FEATURES = {
  starter: [
    "Up to 15 properties",
    "AI chat search",
    "Leads dashboard",
    "No WhatsApp direct-reach for buyers",
    "No compare feature",
    "No custom branding",
  ],
  pro: [
    "Up to 25 properties",
    "AI chat search",
    "Leads dashboard",
    "WhatsApp direct-reach for buyers",
    "Compare feature",
    "Custom branding (your logo & name)",
  ],
  enterprise: [
    "Unlimited properties",
    "AI chat search",
    "Leads dashboard",
    "WhatsApp direct-reach for buyers",
    "Compare feature",
    "Custom branding (your logo & name)",
  ],
};

export default function UpgradeModal({ orgName, onClose }) {
  const [pricing, setPricing] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("plan_pricing")
      .select("*")
      .then(({ data, error }) => {
        setLoading(false);
        if (error || !data) return;
        const map = {};
        data.forEach((row) => {
          map[row.plan] = row;
        });
        setPricing(map);
      });
  }, []);

  function whatsappLink(planKey) {
    const p = pricing?.[planKey];
    const priceText = p
      ? `Rs ${Number(p.monthly_price).toLocaleString()}/month + Rs ${Number(p.setup_fee).toLocaleString()} one-time setup fee`
      : "";
    const message = `Hi, I'd like to upgrade "${orgName || "my account"}" to the ${PLAN_LABELS[planKey]} plan. ${priceText}`;
    return `https://wa.me/${OWNER_WHATSAPP}?text=${encodeURIComponent(message)}`;
  }

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
        padding: 16,
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "var(--paper)",
          borderRadius: 12,
          padding: 28,
          maxWidth: 780,
          width: "100%",
          maxHeight: "85vh",
          overflow: "auto",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h2 style={{ margin: 0 }}>Upgrade your plan</h2>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", lineHeight: 1 }}
            aria-label="Close"
          >
            ×
          </button>
        </div>

        {loading ? (
          <div style={{ fontSize: 13, color: "var(--slate)" }}>Loading plans…</div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 16 }}>
            {["starter", "pro", "enterprise"].map((planKey) => {
              const p = pricing?.[planKey];
              return (
                <div
                  key={planKey}
                  style={{
                    border: "1px solid var(--line)",
                    borderRadius: 10,
                    padding: 18,
                    display: "flex",
                    flexDirection: "column",
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 6 }}>{PLAN_LABELS[planKey]}</div>

                  {p ? (
                    <>
                      <div style={{ fontSize: 22, fontWeight: 700 }}>
                        Rs {Number(p.monthly_price).toLocaleString()}
                        <span style={{ fontSize: 12, fontWeight: 400, color: "var(--slate)" }}>/month</span>
                      </div>
                      <div style={{ fontSize: 12, color: "var(--slate)", marginBottom: 14 }}>
                        + Rs {Number(p.setup_fee).toLocaleString()} one-time setup fee
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: "var(--slate)", marginBottom: 14 }}>Contact us for pricing</div>
                  )}

                  <ul style={{ fontSize: 12, color: "var(--ink)", paddingLeft: 18, marginBottom: 18, flexGrow: 1 }}>
                    {PLAN_FEATURES[planKey].map((f) => (
                      <li key={f} style={{ marginBottom: 4 }}>
                        {f}
                      </li>
                    ))}
                  </ul>

                  <button className="btn btn-brass" style={{ width: "100%" }} onClick={() => window.open(whatsappLink(planKey), "_blank")}>
                    Message to upgrade
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
