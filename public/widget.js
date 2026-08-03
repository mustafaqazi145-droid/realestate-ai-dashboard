/* ============================================================
   AI Property Assistant — Embeddable Chat Widget
   Phase 4 (search) + Phase 5 (lead capture)

   Usage on any client website:
   <script
     src="widget.js"
     data-org-id="11111111-1111-1111-1111-111111111111"
     data-supabase-url="https://wduuigczfxotwuotafvl.supabase.co"
     data-supabase-anon-key="YOUR_ANON_KEY"
     data-function-url="https://wduuigczfxotwuotafvl.supabase.co/functions/v1/property-search"
     data-agent-name="Sarah"
   ></script>

   Zero dependencies. Injects its own styles + a floating bubble.
   ============================================================ */

(function () {
  const scriptTag = document.currentScript;
  const CONFIG = {
    orgId: scriptTag.getAttribute("data-org-id"),
    supabaseUrl: scriptTag.getAttribute("data-supabase-url"),
    supabaseAnonKey: scriptTag.getAttribute("data-supabase-anon-key"),
    functionUrl: scriptTag.getAttribute("data-function-url"),
    agentName: scriptTag.getAttribute("data-agent-name") || "Property Assistant",
    accent: scriptTag.getAttribute("data-accent") || "#b8863b",
  };

  if (!CONFIG.orgId || !CONFIG.functionUrl) {
    console.error("[AI Widget] Missing required data-org-id or data-function-url on the script tag.");
    return;
  }

  // ---- session id (persists per browser tab session) ----
  let sessionId = sessionStorage.getItem("ai_widget_session_id");
  if (!sessionId) {
    sessionId = "sess_" + Math.random().toString(36).slice(2) + Date.now();
    sessionStorage.setItem("ai_widget_session_id", sessionId);
  }

  let lastMatchedProperty = null; // for lead capture context
  let messageCount = 0;
  let leadCaptured = false;

  // ---------------- styles ----------------
  const style = document.createElement("style");
  style.textContent = `
    .aiw-bubble {
      position: fixed; bottom: 24px; right: 24px; width: 58px; height: 58px;
      border-radius: 50%; background: ${CONFIG.accent}; color: #fff; border: none;
      box-shadow: 0 8px 24px rgba(0,0,0,0.2); cursor: pointer; z-index: 999999;
      display: flex; align-items: center; justify-content: center; font-size: 24px;
    }
    .aiw-panel {
      position: fixed; bottom: 92px; right: 24px; width: 360px; max-width: calc(100vw - 32px);
      height: 520px; max-height: calc(100vh - 140px); background: #fff; border-radius: 14px;
      box-shadow: 0 12px 40px rgba(0,0,0,0.25); display: none; flex-direction: column;
      overflow: hidden; z-index: 999999; font-family: -apple-system, "Inter", sans-serif;
    }
    .aiw-panel.open { display: flex; }
    .aiw-header {
      background: #14161a; color: #fff; padding: 16px 18px; display: flex;
      align-items: center; justify-content: space-between;
    }
    .aiw-header-title { font-size: 14px; font-weight: 600; }
    .aiw-header-sub { font-size: 11px; color: #9c9a92; margin-top: 2px; }
    .aiw-close { background: none; border: none; color: #cfcdc4; font-size: 18px; cursor: pointer; }
    .aiw-messages { flex: 1; overflow-y: auto; padding: 16px; background: #f7f7f5; }
    .aiw-msg { margin-bottom: 12px; max-width: 88%; font-size: 13px; line-height: 1.45; white-space: pre-wrap; }
    .aiw-msg.user { margin-left: auto; background: ${CONFIG.accent}; color: #fff; padding: 9px 12px; border-radius: 12px 12px 2px 12px; }
    .aiw-msg.assistant { background: #fff; border: 1px solid #e5e4de; padding: 9px 12px; border-radius: 12px 12px 12px 2px; }
    .aiw-prop-card {
      background: #fff; border: 1px solid #e5e4de; border-radius: 10px; padding: 12px;
      margin: 8px 0; font-size: 12px;
    }
    .aiw-prop-card .code { font-family: monospace; color: #6b7280; font-size: 10px; }
    .aiw-prop-card .title { font-weight: 600; margin: 3px 0 6px; font-size: 13px; }
    .aiw-prop-card .price { font-family: monospace; font-weight: 600; }
    .aiw-prop-card .status { float: right; font-size: 10px; text-transform: uppercase; color: #2f6f4f; }
    .aiw-prop-card button {
      margin-top: 8px; width: 100%; padding: 7px; font-size: 12px; border-radius: 6px;
      border: 1px solid ${CONFIG.accent}; background: transparent; color: ${CONFIG.accent}; cursor: pointer;
    }
    .aiw-prop-photo { width: 100%; height: 120px; object-fit: cover; border-radius: 8px; margin-bottom: 8px; }
    .aiw-specs { font-size: 11px; color: #6b7280; margin: 4px 0; }
    .aiw-desc { font-size: 12px; color: #444; margin: 6px 0; line-height: 1.4; }
    .aiw-features { display: flex; flex-wrap: wrap; gap: 5px; margin: 6px 0; }
    .aiw-tag {
      font-size: 10px; background: #f0efe9; color: #555; padding: 3px 7px; border-radius: 10px;
      text-transform: capitalize;
    }
    .aiw-input-row { display: flex; padding: 12px; border-top: 1px solid #e5e4de; background: #fff; gap: 8px; }
    .aiw-input-row input { flex: 1; border: 1px solid #e5e4de; border-radius: 20px; padding: 9px 14px; font-size: 13px; }
    .aiw-input-row button {
      background: ${CONFIG.accent}; color: #fff; border: none; border-radius: 20px; padding: 0 16px; cursor: pointer; font-size: 13px;
    }
    .aiw-typing { font-size: 12px; color: #9c9a92; padding: 4px 0; }
    .aiw-lead-form { background: #fff; border: 1px solid #e5e4de; border-radius: 10px; padding: 14px; margin: 8px 0; }
    .aiw-lead-form input { width: 100%; margin-bottom: 8px; padding: 8px 10px; border: 1px solid #e5e4de; border-radius: 6px; font-size: 12px; box-sizing: border-box; }
    .aiw-lead-form button { width: 100%; background: ${CONFIG.accent}; color: #fff; border: none; padding: 9px; border-radius: 6px; cursor: pointer; font-size: 13px; }
    .aiw-lead-form .aiw-label { font-size: 11px; color: #6b7280; margin-bottom: 10px; }
    .aiw-mini-label { display: block; font-size: 10px; color: #6b7280; margin: 8px 0 4px; }
  `;
  document.head.appendChild(style);

  // ---------------- DOM structure ----------------
  const bubble = document.createElement("button");
  bubble.className = "aiw-bubble";
  bubble.innerHTML = "&#128172;"; // speech bubble emoji
  document.body.appendChild(bubble);

  const panel = document.createElement("div");
  panel.className = "aiw-panel";
  panel.innerHTML = `
    <div class="aiw-header">
      <div>
        <div class="aiw-header-title">${CONFIG.agentName}</div>
        <div class="aiw-header-sub">Usually replies instantly</div>
      </div>
      <button class="aiw-close">&times;</button>
    </div>
    <div class="aiw-messages" id="aiw-messages"></div>
    <div class="aiw-input-row">
      <input id="aiw-input" type="text" placeholder="Ask about a property..." />
      <button id="aiw-send">Send</button>
    </div>
  `;
  document.body.appendChild(panel);

  const messagesEl = panel.querySelector("#aiw-messages");
  const inputEl = panel.querySelector("#aiw-input");
  const sendBtn = panel.querySelector("#aiw-send");

  bubble.addEventListener("click", () => {
    panel.classList.toggle("open");
    if (panel.classList.contains("open") && messagesEl.children.length === 0) {
      addAssistantMessage(
        "Hi! I can help you find verified properties, compare options, or schedule a viewing. What are you looking for today?"
      );
    }
  });
  panel.querySelector(".aiw-close").addEventListener("click", () => panel.classList.remove("open"));

  function scrollToBottom() {
    messagesEl.scrollTop = messagesEl.scrollHeight;
  }

  function addUserMessage(text) {
    const div = document.createElement("div");
    div.className = "aiw-msg user";
    div.textContent = text;
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function cleanText(text) {
    return text.replace(/\*\*/g, "").replace(/[*#]/g, "").trim();
  }

  function addAssistantMessage(text) {
    const div = document.createElement("div");
    div.className = "aiw-msg assistant";
    div.textContent = cleanText(text);
    messagesEl.appendChild(div);
    scrollToBottom();
  }

  function addPropertyCards(properties) {
    properties.forEach((p) => {
      const card = document.createElement("div");
      card.className = "aiw-prop-card";

      const specs = [];
      if (p.bedrooms) specs.push(`${p.bedrooms} bed`);
      if (p.bathrooms) specs.push(`${p.bathrooms} bath`);
      if (p.size) specs.push(`${p.size} ${p.size_unit || ""}`.trim());
      const specsLine = specs.length ? `<div class="aiw-specs">${specs.join(" &middot; ")}</div>` : "";

      const featuresLine =
        p.features && p.features.length
          ? `<div class="aiw-features">${p.features
              .map((f) => `<span class="aiw-tag">${f}</span>`)
              .join("")}</div>`
          : "";

      const descLine = p.description
        ? `<div class="aiw-desc">${p.description}</div>`
        : "";

      const photo = p.images && p.images.length
        ? `<img class="aiw-prop-photo" src="${p.images[0]}" alt="${p.title}" />`
        : "";

      card.innerHTML = `
        ${photo}
        <span class="status">${p.status}</span>
        <div class="code">${p.property_code}</div>
        <div class="title">${p.title}</div>
        <div>${[p.area, p.city].filter(Boolean).join(", ")}</div>
        ${specsLine}
        ${descLine}
        ${featuresLine}
        <div class="price">${p.currency} ${Number(p.price).toLocaleString()}</div>
        <button data-id="${p.id}" data-code="${p.property_code}">Request a viewing</button>
      `;
      card.querySelector("button").addEventListener("click", () => {
        lastMatchedProperty = p;
        showLeadForm();
      });
      messagesEl.appendChild(card);
    });
    scrollToBottom();
  }

  let lastLeadInfo = null; // remembers name/phone within this session for convenience

  function showLeadForm() {
    const form = document.createElement("div");
    form.className = "aiw-lead-form";
    const knownName = lastLeadInfo?.name || "";
    const knownPhone = lastLeadInfo?.phone || "";
    form.innerHTML = `
      <div class="aiw-label">${
        lastLeadInfo
          ? "Confirm your details for this property:"
          : "Share your details and a consultant will reach out:"
      }</div>
      <input type="text" placeholder="Your name" id="aiw-lead-name" value="${knownName}" />
      <input type="text" placeholder="Phone number" id="aiw-lead-phone" value="${knownPhone}" />
      <label class="aiw-mini-label">How soon are you looking to move forward?</label>
      <select id="aiw-lead-timeline">
        <option value="">Select one</option>
        <option value="Ready within 30 days">Ready within 30 days</option>
        <option value="1-6 months">1–6 months</option>
        <option value="Just exploring for now">Just exploring for now</option>
      </select>
      <label class="aiw-mini-label">Want to schedule a viewing? (optional)</label>
      <input type="datetime-local" id="aiw-lead-viewing-time" />
      <button id="aiw-lead-submit">Request contact</button>
    `;
    form.querySelector("#aiw-lead-submit").addEventListener("click", async () => {
      const name = form.querySelector("#aiw-lead-name").value.trim();
      const phone = form.querySelector("#aiw-lead-phone").value.trim();
      const timeline = form.querySelector("#aiw-lead-timeline").value;
      const viewingTime = form.querySelector("#aiw-lead-viewing-time").value;
      if (!phone) {
        alert("Please add a phone number so we can reach you.");
        return;
      }
      const leadId = await submitLead({ name, phone, timeline });
      if (leadId && viewingTime && lastMatchedProperty) {
        await requestViewing(leadId, lastMatchedProperty.id, viewingTime);
      }
      lastLeadInfo = { name, phone };
      leadCaptured = true;
      form.remove();
      addAssistantMessage(
        viewingTime
          ? "Got it — your viewing request has been sent, and a consultant will confirm the time with you shortly."
          : "Got it — a consultant will contact you about this property shortly. Anything else I can help with?"
      );
    });
    messagesEl.appendChild(form);
    scrollToBottom();
  }

  async function submitLead({ name, phone, timeline }) {
    try {
      const res = await fetch(`${CONFIG.supabaseUrl}/rest/v1/rpc/public_submit_lead`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: CONFIG.supabaseAnonKey,
          Authorization: `Bearer ${CONFIG.supabaseAnonKey}`,
        },
        body: JSON.stringify({
          p_org_id: CONFIG.orgId,
          p_name: name || null,
          p_phone: phone,
          p_timeline: timeline || null,
          p_property_interested_id: lastMatchedProperty ? lastMatchedProperty.id : null,
          p_conversation_summary: `Interested in ${lastMatchedProperty ? lastMatchedProperty.property_code : "a property"}, contacted via website chat.`,
        }),
      });
      const leadId = await res.json();
      return typeof leadId === "string" ? leadId : null;
    } catch (e) {
      console.error("[AI Widget] Lead submission failed", e);
      return null;
    }
  }

  async function requestViewing(leadId, propertyId, viewingTimeLocal) {
    try {
      const isoTime = new Date(viewingTimeLocal).toISOString();
      await fetch(`${CONFIG.supabaseUrl}/rest/v1/rpc/public_request_viewing`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: CONFIG.supabaseAnonKey,
          Authorization: `Bearer ${CONFIG.supabaseAnonKey}`,
        },
        body: JSON.stringify({
          p_org_id: CONFIG.orgId,
          p_lead_id: leadId,
          p_property_id: propertyId,
          p_requested_time: isoTime,
        }),
      });
    } catch (e) {
      console.error("[AI Widget] Viewing request failed", e);
    }
  }

  async function sendMessage() {
    const text = inputEl.value.trim();
    if (!text) return;
    inputEl.value = "";
    addUserMessage(text);
    messageCount++;

    const typing = document.createElement("div");
    typing.className = "aiw-typing";
    typing.textContent = `${CONFIG.agentName} is typing...`;
    messagesEl.appendChild(typing);
    scrollToBottom();

    try {
      const res = await fetch(CONFIG.functionUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orgId: CONFIG.orgId, sessionId, message: text }),
      });
      const data = await res.json();
      typing.remove();

      if (data.error) {
        addAssistantMessage("Sorry, something went wrong on our end. Please try again in a moment.");
        console.error("[AI Widget] backend error:", data);
        return;
      }

      addAssistantMessage(data.reply || "Could you tell me a bit more about what you're looking for?");
      if (data.properties && data.properties.length > 0) {
        addPropertyCards(data.properties);
        lastMatchedProperty = data.properties[0];
      }

      // Prompt for lead capture after some genuine back-and-forth, not immediately
      if (messageCount === 3 && !leadCaptured) {
        showLeadForm();
      }
    } catch (e) {
      typing.remove();
      addAssistantMessage("Sorry, I'm having trouble connecting right now. Please try again shortly.");
      console.error("[AI Widget] network error:", e);
    }
  }

  sendBtn.addEventListener("click", sendMessage);
  inputEl.addEventListener("keydown", (e) => {
    if (e.key === "Enter") sendMessage();
  });
})();
