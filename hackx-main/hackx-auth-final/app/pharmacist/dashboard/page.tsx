"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useLang } from "@/lib/useLang";

const C = { primary: "#1B6CA8", green: "#1E8449", red: "#C0392B", yellow: "#F39C12", orange: "#E67E22", bg: "#F0F4F8", card: "#FFFFFF", text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC" };

interface StockItem {
  medicineName: string;
  qty: number;
  minRequired: number;
  price: string;
  inStock: boolean;
}

interface Pharmacist {
  _id: string;
  phone: string;
  name: string;
  storeName: string;
  village: string;
  district: string;
  address: string;
  type: string;
  distanceKm: string;
  licenseNumber: string;
  stock: StockItem[];
}

export default function PharmacistDashboard() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const { lang, setLang, mounted } = useLang();
  const [pharmacist, setPharmacist] = useState<Pharmacist | null>(null);
  const [activeTab, setActiveTab] = useState<"stock" | "add" | "store">("stock");
  const [loading, setLoading] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  // Add medicine form
  const [newMed, setNewMed] = useState({ medicineName: "", qty: "", minRequired: "30", price: "", inStock: true });
  const [addError, setAddError] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Debounced search for medicines
  useEffect(() => {
    if (!newMed.medicineName || newMed.medicineName.length < 2) {
      setSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/medicines/autocomplete?q=${encodeURIComponent(newMed.medicineName)}`);
        const data = await res.json();
        setSuggestions(data.suggestions || []);
      } catch (e) {}
    }, 300);
    return () => clearTimeout(timer);
  }, [newMed.medicineName]);

  // Edit stock inline
  const [editingIdx, setEditingIdx] = useState<number | null>(null);
  const [editVal, setEditVal] = useState<Partial<StockItem>>({});

  useEffect(() => {
    if (status === "loading") return;
    if (status === "unauthenticated" || session?.user?.role !== "pharmacist") {
      router.replace("/pharmacist/login");
      return;
    }
    // Fetch pharmacist data using phone from session
    const phone = session.user.phone;
    if (!phone) return;
    fetch(`/api/pharmacist?phone=${phone}`)
      .then(r => r.json())
      .then(data => { if (data.pharmacist) setPharmacist(data.pharmacist); })
      .catch(() => {});
  }, [status, session, router]);

  const T = (hi: string, en: string) => lang === "hi" ? hi : en;
  const showSave = (msg: string) => { setSaveMsg(msg); setTimeout(() => setSaveMsg(""), 3000); };

  // Single clean loading/auth gate — no flickering
  if (!mounted || status === "loading" || !pharmacist) return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", color: "white" }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏪</div>
        <div style={{ fontSize: 14, opacity: 0.6 }}>Loading...</div>
      </div>
    </div>
  );

  const addMedicine = async () => {
    if (!newMed.medicineName || !newMed.qty || !newMed.price) {
      setAddError(T("सभी ज़रूरी फ़ील्ड भरें", "Fill all required fields")); return;
    }
    setAddError(""); setLoading(true);
    const medicine: StockItem = {
      medicineName: newMed.medicineName,
      qty: parseInt(newMed.qty),
      minRequired: parseInt(newMed.minRequired) || 30,
      price: newMed.price,
      inStock: parseInt(newMed.qty) > 0,
    };
    try {
      const res = await fetch("/api/pharmacist/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: pharmacist!.phone, action: "add", medicine }),
      });
      const data = await res.json();
      if (data.error) { setAddError(data.error); setLoading(false); return; }
      setPharmacist(data.pharmacist);
      setNewMed({ medicineName: "", qty: "", minRequired: "30", price: "", inStock: true });
      setSuggestions([]);
      setShowSuggestions(false);
      setActiveTab("stock");
      showSave(T("✅ दवाई जोड़ी गई!", "✅ Medicine added!"));
    } catch { setAddError(T("कुछ गलत हुआ", "Something went wrong")); }
    setLoading(false);
  };

  const updateStock = async (idx: number) => {
    if (!editVal || !pharmacist) return;
    setLoading(true);
    const medicine = { ...pharmacist.stock[idx], ...editVal, inStock: (parseInt(String(editVal.qty ?? pharmacist.stock[idx].qty)) > 0) };
    try {
      const res = await fetch("/api/pharmacist/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: pharmacist.phone, action: "update", medicine }),
      });
      const data = await res.json();
      setPharmacist(data.pharmacist);
      setEditingIdx(null); setEditVal({});
      showSave(T("✅ स्टॉक अपडेट हुआ!", "✅ Stock updated!"));
    } catch {}
    setLoading(false);
  };

  const removeMedicine = async (medicineName: string) => {
    if (!confirm(`Remove ${medicineName}?`)) return;
    setLoading(true);
    try {
      const res = await fetch("/api/pharmacist/stock", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: pharmacist!.phone, action: "remove", medicine: { medicineName } }),
      });
      const data = await res.json();
      setPharmacist(data.pharmacist);
      showSave(T("✅ दवाई हटाई गई!", "✅ Medicine removed!"));
    } catch {}
    setLoading(false);
  };

  const lowStock = pharmacist.stock.filter(s => s.qty < s.minRequired && s.qty > 0).length;
  const outOfStock = pharmacist.stock.filter(s => s.qty === 0).length;
  const inStock = pharmacist.stock.filter(s => s.inStock).length;

  return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {saveMsg && (
          <div style={{ position: "fixed", top: 16, left: "50%", transform: "translateX(-50%)", background: C.green, color: "white", padding: "10px 20px", borderRadius: 12, fontSize: 13, fontWeight: 700, zIndex: 100, boxShadow: "0 4px 16px rgba(0,0,0,.2)" }}>
            {saveMsg}
          </div>
        )}
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${C.orange},#D35400)`, padding: "16px 16px 20px", position: "relative" }}>
          <div style={{ position: "absolute", right: -10, top: -10, fontSize: 80, opacity: .07, pointerEvents: "none" }}>🏪</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: "white", margin: 0 }}>{pharmacist.storeName}</h2>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,.65)", marginTop: 3 }}>{pharmacist.name} · {pharmacist.village} · {pharmacist.type}</p>
            </div>
            <button onClick={async () => {
                localStorage.removeItem("pharmacist");
                try { await signOut({ redirect: false }); } catch {}
                router.push("/pharmacist/login");
              }}
              style={{ background: "rgba(255,255,255,.15)", border: "none", borderRadius: 8, color: "rgba(255,255,255,.8)", fontSize: 11, fontWeight: 700, padding: "5px 10px", cursor: "pointer" }}>
              Logout
            </button>
          </div>
          <div style={{ display: "flex", gap: 8, marginTop: 14 }}>
            {[
              { n: String(pharmacist.stock.length), l: T("कुल दवाएं", "Total"), c: "rgba(255,255,255,.9)" },
              { n: String(inStock), l: T("उपलब्ध", "In Stock"), c: "#A9DFBF" },
              { n: String(lowStock), l: T("कम स्टॉक", "Low Stock"), c: "#FAD7A0" },
              { n: String(outOfStock), l: T("खत्म", "Out"), c: "#F1948A" },
            ].map((s, i) => (
              <div key={i} style={{ flex: 1, background: "rgba(255,255,255,.12)", borderRadius: 10, padding: "8px 6px", textAlign: "center" }}>
                <div style={{ fontSize: 18, fontWeight: 800, color: s.c }}>{s.n}</div>
                <div style={{ fontSize: 9, color: "rgba(255,255,255,.6)", marginTop: 1 }}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", background: C.card, borderBottom: `1px solid ${C.border}` }}>
          {[
            { id: "stock", l: T("स्टॉक", "My Stock") },
            { id: "add", l: T("+ जोड़ें", "+ Add") },
            { id: "store", l: T("दुकान", "Store Info") },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as typeof activeTab)}
              style={{ flex: 1, padding: "12px 8px", border: "none", background: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, color: activeTab === tab.id ? C.orange : C.muted, borderBottom: activeTab === tab.id ? `3px solid ${C.orange}` : "3px solid transparent", transition: "all .2s" }}>
              {tab.l}
            </button>
          ))}
        </div>

        {/* STOCK TAB */}
        {activeTab === "stock" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "10px 16px 80px" }}>
            {pharmacist.stock.length === 0 ? (
              <div style={{ textAlign: "center", padding: "48px 20px", color: C.muted }}>
                <div style={{ fontSize: 48, marginBottom: 16 }}>💊</div>
                <div style={{ fontSize: 16, fontWeight: 700 }}>{T("कोई दवाई नहीं", "No medicines yet")}</div>
                <div style={{ fontSize: 13, marginTop: 8 }}>{T("+ जोड़ें टैब से दवाई जोड़ें", "Add medicines from the + Add tab")}</div>
                <button onClick={() => setActiveTab("add")}
                  style={{ marginTop: 16, padding: "12px 24px", borderRadius: 12, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 14, background: `linear-gradient(135deg,${C.orange},#D35400)`, color: "white" }}>
                  + {T("पहली दवाई जोड़ें", "Add First Medicine")}
                </button>
              </div>
            ) : (
              <>
                {lowStock > 0 && (
                  <div style={{ background: "#FEF9E7", borderRadius: 12, padding: 12, marginBottom: 12, border: "1px solid #F4D03F", display: "flex", gap: 8 }}>
                    <span>⚠️</span>
                    <span style={{ fontSize: 13, color: "#7D6608", fontWeight: 600 }}>{lowStock} {T("दवाई का स्टॉक कम है", "medicines running low")}</span>
                  </div>
                )}
                {pharmacist.stock.map((item, i) => {
                  const isEditing = editingIdx === i;
                  const statusColor = item.qty === 0 ? C.red : item.qty < item.minRequired ? C.yellow : C.green;
                  const statusBg = item.qty === 0 ? "#FDEDED" : item.qty < item.minRequired ? "#FEF9E7" : "#E8F8EF";
                  const statusText = item.qty === 0 ? T("खत्म", "Out") : item.qty < item.minRequired ? T("कम", "Low") : T("OK", "OK");
                  return (
                    <div key={i} style={{ background: C.card, borderRadius: 14, padding: 14, marginBottom: 10, border: `1px solid ${item.qty === 0 ? "#F1948A" : item.qty < item.minRequired ? "#F4D03F" : C.border}` }}>
                      {!isEditing ? (
                        <>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <div>
                              <div style={{ fontSize: 14, fontWeight: 700 }}>{item.medicineName}</div>
                              <div style={{ fontSize: 12, color: C.muted, marginTop: 3 }}>
                                {T("स्टॉक:", "Stock:")} <strong>{item.qty}</strong> · {T("न्यूनतम:", "Min:")} {item.minRequired} · <strong style={{ color: C.orange }}>{item.price}</strong>
                              </div>
                            </div>
                            <span style={{ background: statusBg, color: statusColor, borderRadius: 10, padding: "4px 10px", fontSize: 11, fontWeight: 800 }}>{statusText}</span>
                          </div>
                          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                            <button onClick={() => { setEditingIdx(i); setEditVal({ qty: item.qty, price: item.price, minRequired: item.minRequired }); }}
                              style={{ flex: 1, padding: "8px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, fontSize: 12, fontWeight: 700, cursor: "pointer", color: C.primary }}>
                              ✏️ {T("संपादित करें", "Edit")}
                            </button>
                            <button onClick={() => removeMedicine(item.medicineName)}
                              style={{ padding: "8px 14px", borderRadius: 10, border: "none", background: "#FDEDED", fontSize: 12, fontWeight: 700, cursor: "pointer", color: C.red }}>
                              🗑️
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 10, color: C.orange }}>{item.medicineName}</div>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 10 }}>
                            {[
                              { label: T("स्टॉक qty", "Stock qty"), key: "qty", type: "number" },
                              { label: T("न्यूनतम", "Min required"), key: "minRequired", type: "number" },
                              { label: T("कीमत", "Price"), key: "price", type: "text" },
                            ].map(f => (
                              <div key={f.key}>
                                <label style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{f.label}</label>
                                <input style={{ width: "100%", padding: "8px 10px", border: `2px solid ${C.border}`, borderRadius: 8, fontSize: 14, fontFamily: "inherit", background: C.bg, outline: "none", boxSizing: "border-box", marginTop: 4 }}
                                  type={f.type}
                                  value={String(editVal[f.key as keyof StockItem] ?? "")}
                                  onChange={e => setEditVal({ ...editVal, [f.key]: f.type === "number" ? parseInt(e.target.value) || 0 : e.target.value })} />
                              </div>
                            ))}
                          </div>
                          <div style={{ display: "flex", gap: 8 }}>
                            <button onClick={() => updateStock(i)} disabled={loading}
                              style={{ flex: 1, padding: 10, borderRadius: 10, border: "none", background: `linear-gradient(135deg,${C.orange},#D35400)`, color: "white", fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                              {loading ? "..." : T("✓ सेव करें", "✓ Save")}
                            </button>
                            <button onClick={() => { setEditingIdx(null); setEditVal({}); }}
                              style={{ padding: "10px 14px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, fontWeight: 700, fontSize: 13, cursor: "pointer" }}>
                              {T("रद्द", "Cancel")}
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  );
                })}
              </>
            )}
          </div>
        )}

        {/* ADD MEDICINE TAB */}
        {activeTab === "add" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 40px" }}>
            {addError && <div style={{ background: "#FDEDED", borderRadius: 10, padding: "10px 14px", marginBottom: 14, fontSize: 13, color: C.red, fontWeight: 600 }}>⚠ {addError}</div>}
            <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 8 }}>💊 {T("दवाई का नाम *", "Medicine Name *")}</label>
            <div style={{ position: "relative", marginBottom: 16 }}>
              <input 
                style={{ width: "100%", padding: "13px 16px", border: `2px solid ${C.orange}`, borderRadius: 12, fontSize: 15, fontFamily: "inherit", background: C.card, color: C.text, outline: "none", boxSizing: "border-box" }}
                placeholder={T("दवाई का नाम लिखें (e.g. Paracetamol)", "Type medicine name (e.g. Paracetamol)")}
                value={newMed.medicineName}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onChange={e => setNewMed({ ...newMed, medicineName: e.target.value })} 
              />
              {showSuggestions && suggestions.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, marginTop: 4, zIndex: 10, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", maxHeight: 200, overflowY: "auto" }}>
                  {suggestions.map((s, i) => (
                    <div key={i} 
                      onClick={() => {
                        setNewMed({ ...newMed, medicineName: s });
                        setShowSuggestions(false);
                      }}
                      style={{ padding: "12px 16px", borderBottom: i < suggestions.length - 1 ? `1px solid ${C.border}` : "none", fontSize: 14, cursor: "pointer", color: C.text }}>
                      {s}
                    </div>
                  ))}
                </div>
              )}
            </div>
            {[
              { key: "qty", label: T("📦 मौजूदा स्टॉक (qty) *", "📦 Current Stock (qty) *"), ph: "100", type: "number" },
              { key: "minRequired", label: T("⚠️ न्यूनतम स्टॉक", "⚠️ Minimum Stock Alert"), ph: "30", type: "number" },
              { key: "price", label: T("💰 कीमत *", "💰 Price *"), ph: "₹12/strip", type: "text" },
            ].map(f => (
              <div key={f.key} style={{ marginBottom: 14 }}>
                <label style={{ fontSize: 12, fontWeight: 700, color: C.muted, display: "block", marginBottom: 6 }}>{f.label}</label>
                <input style={{ width: "100%", padding: "13px 16px", border: `2px solid ${C.border}`, borderRadius: 12, fontSize: 15, fontFamily: "inherit", background: C.card, color: C.text, outline: "none", boxSizing: "border-box" }}
                  type={f.type} placeholder={f.ph}
                  value={newMed[f.key as keyof typeof newMed] as string}
                  onChange={e => { setNewMed({ ...newMed, [f.key]: e.target.value }); setAddError(""); }} />
              </div>
            ))}
            <button onClick={addMedicine} disabled={loading}
              style={{ width: "100%", padding: 17, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 16, background: `linear-gradient(135deg,${C.orange},#D35400)`, color: "white", marginTop: 4 }}>
              {loading ? "..." : `+ ${T("दवाई जोड़ें", "Add Medicine")}`}
            </button>
          </div>
        )}

        {/* STORE INFO TAB */}
        {activeTab === "store" && (
          <div style={{ flex: 1, overflowY: "auto", padding: "16px 16px 40px" }}>
            <div style={{ background: C.card, borderRadius: 16, padding: 16, border: `1px solid ${C.border}`, marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: 0.8, marginBottom: 12 }}>🏪 {T("दुकान की जानकारी", "Store Details")}</div>
              {[
                { l: T("दुकान का नाम", "Store Name"), v: pharmacist.storeName },
                { l: T("मालिक", "Owner"), v: pharmacist.name },
                { l: T("फ़ोन", "Phone"), v: pharmacist.phone },
                { l: T("गाँव", "Village"), v: pharmacist.village },
                { l: T("जिला", "District"), v: pharmacist.district },
                { l: T("पता", "Address"), v: pharmacist.address || "—" },
                { l: T("लाइसेंस", "License"), v: pharmacist.licenseNumber || "—" },
                { l: T("दूरी", "Distance"), v: pharmacist.distanceKm ? `${pharmacist.distanceKm} km` : "—" },
                { l: T("प्रकार", "Type"), v: pharmacist.type },
              ].map((row, i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", borderBottom: i < 8 ? `1px solid ${C.border}` : "none" }}>
                  <span style={{ fontSize: 12, color: C.muted }}>{row.l}</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: C.text, textAlign: "right", maxWidth: "60%" }}>{row.v}</span>
                </div>
              ))}
            </div>
            <div style={{ background: "#E8F8EF", borderRadius: 12, padding: 12, border: "1px solid #A9DFBF" }}>
              <div style={{ fontSize: 13, fontWeight: 700, color: C.green }}>✅ {T("आपकी दुकान लाइव है", "Your store is live")}</div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>{T("मरीज़ आपकी दवाइयां खोज सकते हैं", "Patients can now search your medicines")}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
