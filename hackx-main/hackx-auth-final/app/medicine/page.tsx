// "use client";
// import { useRouter } from "next/navigation";
// import { useState } from "react";

// const C = { primary: "#1B6CA8", primaryDark: "#0F4C7A", green: "#1E8449", red: "#C0392B", bg: "#F0F4F8", card: "#FFFFFF", text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC" };

// const MED_DB: Record<string, Array<{ name: string; village: string; dist: string; phone: string; qty: number; inStock: boolean }>> = {
//   Paracetamol: [
//     { name: "Nabha Medical Store", village: "Nabha", dist: "1.2", phone: "9876500001", qty: 200, inStock: true },
//     { name: "Punjab Pharmacy", village: "Kesri", dist: "3.4", phone: "9876500002", qty: 100, inStock: true },
//     { name: "Sharma Medical", village: "Barnala Road", dist: "5.8", phone: "9876500003", qty: 150, inStock: true },
//   ],
//   Metformin: [
//     { name: "Nabha Medical Store", village: "Nabha", dist: "1.2", phone: "9876500001", qty: 50, inStock: true },
//     { name: "Punjab Pharmacy", village: "Kesri", dist: "3.4", phone: "9876500002", qty: 0, inStock: false },
//     { name: "Sharma Medical", village: "Barnala Road", dist: "5.8", phone: "9876500003", qty: 80, inStock: true },
//   ],
//   ORS: [
//     { name: "Nabha Medical Store", village: "Nabha", dist: "1.2", phone: "9876500001", qty: 500, inStock: true },
//     { name: "Punjab Pharmacy", village: "Kesri", dist: "3.4", phone: "9876500002", qty: 300, inStock: true },
//     { name: "Sharma Medical", village: "Barnala Road", dist: "5.8", phone: "9876500003", qty: 0, inStock: false },
//   ],
//   Amoxicillin: [
//     { name: "Nabha Medical Store", village: "Nabha", dist: "1.2", phone: "9876500001", qty: 0, inStock: false },
//     { name: "Punjab Pharmacy", village: "Kesri", dist: "3.4", phone: "9876500002", qty: 80, inStock: true },
//     { name: "Sharma Medical", village: "Barnala Road", dist: "5.8", phone: "9876500003", qty: 60, inStock: true },
//   ],
// };

// export default function MedicinePage() {
//   const router = useRouter();
//   const lang = typeof window !== "undefined" ? localStorage.getItem("lang") || "hi" : "hi";
//   const t = (hi: string, en: string) => lang === "hi" ? hi : en;
//   const [active, setActive] = useState("Paracetamol");
//   const [search, setSearch] = useState("Paracetamol");

//   const results = MED_DB[active] || [];

//   return (
//     <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
//       <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
//         <div style={{ background: "#FDEDED", padding: "6px 16px", fontSize: 12, fontWeight: 700, color: C.red, display: "flex", alignItems: "center", gap: 6 }}>
//           <div style={{ width: 8, height: 8, borderRadius: "50%", background: C.red }} />
//           {t("ऑफलाइन — फार्मेसी डेटा डिवाइस से", "Offline — Pharmacy data from device")}
//         </div>
//         <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, background: C.card, borderBottom: `1px solid ${C.border}` }}>
//           <button onClick={() => router.push("/home")} style={{ width: 36, height: 36, borderRadius: 10, background: C.bg, border: "none", fontSize: 18, cursor: "pointer" }}>←</button>
//           <div>
//             <div style={{ fontSize: 15, fontWeight: 700 }}>{t("दवाई खोजें", "Find Medicine")}</div>
//             <div style={{ fontSize: 11, color: C.muted }}>Find Medicine Nearby</div>
//           </div>
//         </div>
//         {/* Search */}
//         <div style={{ padding: "10px 16px", background: C.card, borderBottom: `1px solid ${C.border}` }}>
//           <div style={{ display: "flex", alignItems: "center", border: `2px solid ${C.border}`, borderRadius: 14, overflow: "hidden", background: C.bg }}>
//             <span style={{ padding: "12px 14px", fontSize: 18 }}>🔍</span>
//             <input style={{ flex: 1, border: "none", outline: "none", fontSize: 16, padding: "12px 0", background: "transparent", fontFamily: "inherit" }}
//               placeholder={t("दवाई का नाम लिखें...", "Type medicine name...")} value={search}
//               onChange={e => { setSearch(e.target.value); const k = Object.keys(MED_DB).find(k => k.toLowerCase().includes(e.target.value.toLowerCase())); if (k) setActive(k); }} />
//           </div>
//           <div style={{ display: "flex", gap: 8, marginTop: 10, overflowX: "auto", paddingBottom: 4 }}>
//             {Object.keys(MED_DB).map(med => (
//               <button key={med} onClick={() => { setActive(med); setSearch(med); }}
//                 style={{ padding: "8px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 13, fontWeight: 700, flexShrink: 0, background: active === med ? C.primary : C.bg, color: active === med ? "white" : C.text, transition: "all .2s" }}>
//                 💊 {med}
//               </button>
//             ))}
//           </div>
//         </div>
//         {/* Fake map */}
//         <div style={{ height: 130, position: "relative", background: "#E8F0E0", flexShrink: 0, overflow: "hidden" }}>
//           <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(150,170,130,.3) 1px,transparent 1px),linear-gradient(90deg,rgba(150,170,130,.3) 1px,transparent 1px)", backgroundSize: "30px 30px" }} />
//           <div style={{ position: "absolute", top: "40%", left: 0, right: 0, height: 6, background: "#D4C5A0" }} />
//           <div style={{ position: "absolute", top: "70%", left: 0, right: 0, height: 4, background: "#D4C5A0" }} />
//           <div style={{ position: "absolute", left: "30%", top: 0, bottom: 0, width: 5, background: "#D4C5A0" }} />
//           {[["32%","42%"],["62%","30%"],["20%","66%"]].map(([l, tp], i) => (
//             <div key={i} style={{ position: "absolute", left: l, top: tp, fontSize: 20 }}>📍</div>
//           ))}
//           <div style={{ position: "absolute", bottom: 6, right: 8, fontSize: 11, color: C.muted, background: "rgba(255,255,255,.8)", padding: "3px 8px", borderRadius: 8, fontWeight: 600 }}>🗺️ Nabha District</div>
//         </div>
//         {/* Results */}
//         <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 16px" }}>
//           <div style={{ fontSize: 13, fontWeight: 700, margin: "10px 0 6px" }}>
//             {active} — {results.filter(p => p.inStock).length} {t("दुकानों में उपलब्ध", "pharmacies available")}
//           </div>
//           {results.map((p, i) => (
//             <div key={i} style={{ background: C.card, borderRadius: 16, padding: 16, marginBottom: 10, border: `1px solid ${C.border}`, opacity: p.inStock ? 1 : .65 }}>
//               <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
//                 <div style={{ width: 40, height: 40, borderRadius: 10, background: p.inStock ? "#E8F8EF" : "#FDEDED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20 }}>💊</div>
//                 <div style={{ flex: 1 }}>
//                   <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name}</div>
//                   <div style={{ fontSize: 12, color: C.muted, marginTop: 2 }}>
//                     {p.village} · {p.dist} km · <span style={{ color: p.inStock ? C.green : C.red, fontWeight: 700 }}>{p.inStock ? `✓ ${t("उपलब्ध", "In Stock")} (${p.qty})` : `✗ ${t("उपलब्ध नहीं", "Out of Stock")}`}</span>
//                   </div>
//                 </div>
//               </div>
//               {p.inStock && (
//                 <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
//                   <button style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, fontSize: 12, fontWeight: 700, cursor: "pointer" }}>📞 {p.phone}</button>
//                   <button style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: "none", background: "#25D366", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer" }}>💬 WhatsApp</button>
//                 </div>
//               )}
//             </div>
//           ))}
//         </div>
//       </div>
//     </div>
//   );
// }




//--------------------------------------------------new claude ke bhajje se --------------------------------------------------//

"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import dynamic from "next/dynamic";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";
import { getDB, seedOfflineData } from "@/lib/db-offline";

const C = { primary: "#1B6CA8", primaryDark: "#0F4C7A", green: "#1E8449", red: "#C0392B", bg: "#F0F4F8", card: "#FFFFFF", text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC" };

interface Medicine { name: string; dose: string; note: string; }

// Dynamic import to avoid SSR issues with Leaflet
const OpenStreetMap = dynamic(() => import("@/components/OpenStreetMap"), {
  ssr: false,
  loading: () => (
    <div style={{
      height: 220,
      background: "#E8F0E0",
      borderRadius: 12,
      border: "1px solid #DDE3EC",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      flexDirection: "column",
      gap: 8,
    }}>
      <div style={{ fontSize: 32 }}>🗺️</div>
      <div style={{ fontSize: 12, color: "#6B7C93", fontWeight: 600 }}>Loading map...</div>
    </div>
  ),
});

export default function MedicinePage() {
  const router = useRouter();
  const { isOnline } = useOnlineStatus();
  const [lang, setLang] = useState("hi");
  const [prescribedMeds, setPrescribedMeds] = useState<Medicine[]>([]);
  const [active, setActive] = useState("");
  const [search, setSearch] = useState("");
  const [manualMode, setManualMode] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [apiSuggestions, setApiSuggestions] = useState<string[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  const [pharmacists, setPharmacists] = useState<any[]>([]);
  
  // OpenStreetMap state
  const [userLat, setUserLat] = useState<number | null>(null);
  const [userLng, setUserLng] = useState<number | null>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  const T = (hi: string, en: string) => lang === "hi" ? hi : en;

  const [loadingLocation, setLoadingLocation] = useState(false);
  const [loadingPharmacies, setLoadingPharmacies] = useState(false);

  const handleGetLocation = () => {
    if (!navigator.geolocation) {
      setMapError("Geolocation not supported. Please enter coordinates manually.");
      return;
    }

    setMapError(null);
    setLoadingLocation(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        console.log("✅ Location found:", latitude, longitude);
        setUserLat(latitude);
        setUserLng(longitude);
        setLoadingLocation(false);
      },
      (error) => {
        console.error("❌ Location error:", error);
        setLoadingLocation(false);
        let msg = "Unable to get location.";
        if (error.code === 1) msg += " Enable location permission in browser.";
        else if (error.code === 2) msg += " Location unavailable.";
        else if (error.code === 3) msg += " Timed out - try again.";
        setMapError(msg);
      },
      { enableHighAccuracy: false, timeout: 20000, maximumAge: 300000 }
    );
  };

  useEffect(() => {
    setLang(localStorage.getItem("lang") || "hi");
    const raw = localStorage.getItem("prescribedMedicines");
    if (raw) {
      try {
        const meds: Medicine[] = JSON.parse(raw);
        setPrescribedMeds(meds);
        if (meds.length > 0) { setActive(meds[0].name); setSearch(meds[0].name); }
      } catch { /* ignore */ }
    }

    setHydrated(true);

    // Seed offline data on first visit
    if (typeof window !== "undefined") {
      seedOfflineData().catch(console.error);
    }
  }, []);

  // Load medicines from IndexedDB when offline
  useEffect(() => {
    if (!isOnline && typeof window !== "undefined") {
      setIsOfflineMode(true);
      console.log("📡 Offline mode — loading medicines from IndexedDB");

      getDB().medicines.toArray()
        .then((medicines) => {
          if (medicines.length > 0) {
            // Convert IndexedDB medicines to pharmacist format
            const offlinePharmacists = medicines.flatMap(med => {
              try {
                const pharmacies = JSON.parse(med.pharmacies);
                return pharmacies.map((p: any) => ({
                  id: `offline-${med.id}-${p.name}`,
                  storeName: p.name,
                  name: p.name,
                  village: p.village,
                  distanceKm: p.dist,
                  phone: p.phone,
                  type: "Local Pharmacy",
                  inStock: p.inStock,
                  stock: p.inStock ? [{ medicineName: med.name, qty: p.qty, inStock: true }] : [],
                }));
              } catch {
                return [];
              }
            });

            setPharmacists(offlinePharmacists);
          }
        })
        .catch((err) => console.error("Failed to load offline medicines:", err));
    } else {
      setIsOfflineMode(false);
    }
  }, [isOnline, search]);

  // Fetch real pharmacies ONLY when user location is available
  useEffect(() => {
    if (!userLat || !userLng) return;

    console.log("🔍 Fetching real pharmacies near:", userLat, userLng);
    const startTime = Date.now();
    setLoadingPharmacies(true);

    fetch(`/api/real-pharmacies?lat=${userLat}&lng=${userLng}`)
      .then(r => {
        console.log("API response time:", Date.now() - startTime, "ms");
        return r.json();
      })
      .then(d => {
        console.log("API Response:", d);
        if (d.pharmacies && d.pharmacies.length > 0) {
          setPharmacists(d.pharmacies);
          console.log(`✅ Found ${d.count} REAL medical stores nearby in ${Date.now() - startTime}ms!`);
        } else {
          setPharmacists([]);
          console.log(`⚠️ No pharmacies found. Error: ${d.error || "none"}`);
          if (d.error) {
            setMapError(`No pharmacies found nearby. ${d.error}`);
          }
        }
        setLoadingPharmacies(false);
      })
      .catch((err) => {
        console.error("❌ Error fetching real pharmacies:", err);
        setMapError("Failed to load pharmacies. Check console for details.");
        setLoadingPharmacies(false);
      });
  }, [userLat, userLng]);

  // Refetch real pharmacies when search changes
  useEffect(() => {
    if (!search || !userLat || !userLng) return;
    
    console.log("🔍 Searching real pharmacies for:", search);

    // Fetch real pharmacies near user location
    fetch(`/api/real-pharmacies?lat=${userLat}&lng=${userLng}`)
      .then(r => r.json())
      .then(d => {
        if (d.pharmacies) {
          setPharmacists(d.pharmacies);
          console.log(`✅ Found ${d.pharmacies.length} real stores for "${search}"`);
        }
      })
      .catch((err) => console.error("❌ Search error:", err));
  }, [search, userLat, userLng]);

  // Fetch Autocomplete Suggestions from API
  useEffect(() => {
    if (!search || !manualMode) {
      setApiSuggestions([]);
      return;
    }
    
    const debounce = setTimeout(() => {
      fetch(`/api/medicines/autocomplete?q=${encodeURIComponent(search)}`)
        .then(r => r.json())
        .then(d => {
          if (d.suggestions) {
            // Filter out exact match if it's the only one, or just set them
            setApiSuggestions(d.suggestions.filter((s: string) => s.toLowerCase() !== search.toLowerCase()));
          }
        })
        .catch(err => console.error("Autocomplete API error:", err));
    }, 300); // 300ms debounce

    return () => clearTimeout(debounce);
  }, [search, manualMode]);

  const displayMed = active || search;
  const hasPrescribed = prescribedMeds.length > 0;

  if (!hydrated) return null;

  const pharmacyRows = pharmacists.map((p, idx) => {
    let inStock = false;
    let qty = 0;
    let price = "—";

    if (displayMed) {
      if (p.stock && p.stock.length > 0) {
        // Offline / Database pharmacy with explicit stock array
        const medStock = p.stock.find((s: any) => s.medicineName.toLowerCase().includes(displayMed.toLowerCase()));
        inStock = medStock?.inStock || false;
        qty = medStock?.qty || 0;
        price = medStock?.price || "—";
      } else {
        // Real pharmacy from OpenStreetMap - we don't know the exact stock
        inStock = true;
        qty = -1; // Flag for unknown stock
        price = "—";
      }
    } else {
      inStock = true; // when no med is searched, just show the store
    }

    return {
      id: p.id || p._id || idx,
      name: p.storeName || p.name,
      village: p.village,
      dist: p.distanceKm || "—",
      phone: p.phone,
      lat: p.lat,
      lng: p.lng,
      type: p.type || "Private",
      qty,
      inStock,
      price,
    };
  }).sort((a, b) => (b.inStock ? 1 : 0) - (a.inStock ? 1 : 0));

  const availableCount = pharmacyRows.filter(p => p.inStock).length;

  return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "12px 14px", gap: 10, background: C.card, borderBottom: `1px solid ${C.border}` }}>
          <button onClick={() => router.push("/home")} style={{ width: 36, height: 36, borderRadius: 10, background: C.bg, border: "none", fontSize: 18, cursor: "pointer" }}>←</button>
          <div>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{T("दवाई खोजें", "Find Medicine")}</div>
            <div style={{ fontSize: 11, color: C.muted }}>{isOfflineMode ? T("स्थानीय मेडिकल स्टोर डेटा", "Local pharmacy database") : T("पास की फार्मेसी में उपलब्धता", "Availability at nearby pharmacies")}</div>
          </div>
        </div>
        {/* Prescribed banner */}
        {hasPrescribed && !manualMode && (
          <div style={{ background: "#E8F8EF", padding: "7px 14px", borderBottom: "1px solid #A9DFBF", display: "flex", alignItems: "center", gap: 6 }}>
            <span>✅</span>
            <span style={{ fontSize: 12, fontWeight: 700, color: C.green }}>{T("ट्राइएज से निर्धारित दवाएं", "Showing your prescribed medicines")}</span>
          </div>
        )}
        {/* Search + tabs */}
        <div style={{ padding: "10px 14px", background: C.card, borderBottom: `1px solid ${C.border}` }}>
          {hasPrescribed && (
            <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 8 }}>
              {prescribedMeds.map(med => (
                <button key={med.name} onClick={() => { setActive(med.name); setSearch(med.name); setManualMode(false); }}
                  style={{ padding: "7px 14px", borderRadius: 20, border: "none", cursor: "pointer", fontSize: 12, fontWeight: 700, flexShrink: 0, background: active === med.name && !manualMode ? C.primary : C.bg, color: active === med.name && !manualMode ? "white" : C.text, transition: "all .2s" }}>
                  💊 {med.name.split(" ")[0]}
                </button>
              ))}
              <button onClick={() => { setManualMode(true); setSearch(""); setActive(""); }}
                style={{ padding: "7px 14px", borderRadius: 20, border: `1px dashed ${C.border}`, cursor: "pointer", fontSize: 12, fontWeight: 700, flexShrink: 0, background: manualMode ? "#EBF4FD" : C.bg, color: C.primary }}>
                🔍 {T("अन्य", "Other")}
              </button>
            </div>
          )}
          <div style={{ position: "relative" }}>
            <div style={{ display: "flex", alignItems: "center", border: `2px solid ${manualMode ? C.primary : C.border}`, borderRadius: 12, overflow: "hidden", background: C.bg }}>
              <span style={{ padding: "10px 14px", fontSize: 18 }}>🔍</span>
              <input style={{ flex: 1, border: "none", outline: "none", fontSize: 15, padding: "10px 0", background: "transparent", fontFamily: "inherit" }}
                placeholder={T("दवाई का नाम लिखें...", "Type medicine name...")} value={search}
                onFocus={() => setShowSuggestions(true)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                onChange={e => { setSearch(e.target.value); setActive(e.target.value); setManualMode(true); setShowSuggestions(true); }} />
            </div>
            {showSuggestions && search && manualMode && apiSuggestions.length > 0 && (
              <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, marginTop: 4, zIndex: 100, boxShadow: "0 4px 12px rgba(0,0,0,0.1)", overflow: "hidden" }}>
                {apiSuggestions.map(s => (
                  <div key={s} onClick={() => { setSearch(s); setActive(s); setShowSuggestions(false); setManualMode(true); }}
                    style={{ padding: "12px 16px", borderBottom: `1px solid ${C.border}`, cursor: "pointer", fontSize: 14, fontWeight: 600 }}>
                    {s}
                  </div>
                ))}
              </div>
            )}
          </div>
          {/* Dose hint */}
          {!manualMode && active && (() => {
            const med = prescribedMeds.find(m => m.name === active);
            if (!med) return null;
            return (
              <div style={{ marginTop: 8, background: "#EBF4FD", borderRadius: 10, padding: "8px 12px" }}>
                <div style={{ fontSize: 12, color: C.primary, fontWeight: 700 }}>💊 {T("खुराक:", "Dose:")} {med.dose}</div>
                {med.note && <div style={{ fontSize: 11, color: C.muted, marginTop: 2, fontStyle: "italic" }}>{med.note}</div>}
              </div>
            );
          })()}
        </div>
        {/* Real OpenStreetMap */}
        <div style={{ padding: "12px 14px 8px", background: C.card, position: "relative" }}>
          {mapError && (
            <div style={{
              background: "#FEF9E7",
              border: "1px solid #F4D03F",
              borderRadius: 8,
              padding: "10px 12px",
              marginBottom: 8,
              fontSize: 11,
              color: "#7D6608",
            }}>
              <div style={{ display: "flex", alignItems: "flex-start", gap: 6, marginBottom: 8 }}>
                <span>⚠️</span>
                <span>{mapError}</span>
              </div>
              {/* Manual location input */}
              <div style={{ display: "flex", gap: 6, marginTop: 8 }}>
                <input
                  type="number"
                  placeholder="Latitude (e.g., 19.0760)"
                  onChange={(e) => setUserLat(parseFloat(e.target.value) || null)}
                  step="0.0001"
                  style={{ flex: 1, padding: "6px 8px", border: "1px solid #F4D03F", borderRadius: 6, fontSize: 11 }}
                />
                <input
                  type="number"
                  placeholder="Longitude (e.g., 72.8777)"
                  onChange={(e) => setUserLng(parseFloat(e.target.value) || null)}
                  step="0.0001"
                  style={{ flex: 1, padding: "6px 8px", border: "1px solid #F4D03F", borderRadius: 6, fontSize: 11 }}
                />
              </div>
              <div style={{ fontSize: 10, marginTop: 6, color: "#7D6608" }}>
                💡 Right-click on Google Maps → Click coordinates to copy
              </div>
            </div>
          )}
          
          {/* Location Button */}
          <button
            onClick={handleGetLocation}
            disabled={loadingLocation}
            style={{
              position: "absolute",
              top: 20,
              right: 20,
              zIndex: 1000,
              background: loadingLocation ? "#f0f0f0" : "white",
              border: "2px solid #DDE3EC",
              borderRadius: 8,
              padding: "8px 12px",
              fontSize: 11,
              fontWeight: 700,
              color: loadingLocation ? "#999" : C.primary,
              cursor: loadingLocation ? "wait" : "pointer",
              boxShadow: "0 2px 8px rgba(0,0,0,0.15)",
              display: "flex",
              alignItems: "center",
              gap: 4,
            }}
          >
            {loadingLocation ? "⏳ Getting location..." : userLat ? "📍 Refresh Location" : "📍 Find Me"}
          </button>
          
          <OpenStreetMap
            pharmacies={pharmacists
              .filter(p => p.lat && p.lng)
              .map(p => ({
                id: p.id || p._id,
                name: p.storeName || p.name || "Medical Store",
                village: p.village || "Nearby",
                lat: p.lat,
                lng: p.lng,
                distanceKm: parseFloat(p.distanceKm) || 0,
                type: p.type || "Private",
                inStock: true,
                phone: p.phone || "",
                address: p.address || "",
                opening_hours: p.opening_hours || "",
                website: p.website || "",
              }))}
            userLat={userLat}
            userLng={userLng}
            onLocationFound={(lat, lng) => {
              setUserLat(lat);
              setUserLng(lng);
            }}
            onLocationError={(error) => setMapError(error)}
            height={220}
          />
        </div>
        {/* Results */}
        <div style={{ flex: 1, overflowY: "auto", padding: "4px 16px 80px" }}>
          {displayMed ? (
            <>
              <div style={{ fontSize: 13, fontWeight: 700, margin: "10px 0 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>{displayMed}</span>
                <span style={{ fontSize: 12, color: availableCount > 0 ? C.green : C.red, fontWeight: 700 }}>
                  {availableCount}/{pharmacists.length} {T("उपलब्ध", "available")}
                </span>
              </div>
              {pharmacyRows.map((p, i) => (
                <div key={i} style={{ background: C.card, borderRadius: 16, padding: 14, marginBottom: 10, border: `1px solid ${C.border}`, opacity: p.inStock ? 1 : .6 }}>
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 40, height: 40, borderRadius: 10, background: p.inStock ? "#E8F8EF" : "#FDEDED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>💊</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                          <div style={{ fontSize: 14, fontWeight: 700 }}>{p.name} <span style={{fontSize: 10}}>↗️</span></div>
                          <div style={{ fontSize: 11, color: C.muted, marginTop: 1 }}>📍 {p.village} · {p.dist} km</div>
                        </a>
                        <span style={{ background: p.type === "Govt Free" ? "#E8F8EF" : p.type === "Jan Aushadhi" ? "#EBF4FD" : C.bg, color: p.type === "Govt Free" ? C.green : p.type === "Jan Aushadhi" ? C.primary : C.muted, borderRadius: 8, padding: "3px 8px", fontSize: 10, fontWeight: 700 }}>{p.type}</span>
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: p.qty === -1 ? C.muted : (p.inStock ? C.green : C.red) }}>
                          {p.qty === -1 ? `❓ ${T("कॉल करके पूछें", "Call to check stock")}` : (p.inStock ? `✓ ${T("उपलब्ध", "In Stock")} (${p.qty})` : `✗ ${T("उपलब्ध नहीं", "Out of Stock")}`)}
                        </span>
                        {p.inStock && p.qty !== -1 && <span style={{ fontSize: 13, fontWeight: 800, color: C.primary }}>{p.price}</span>}
                      </div>
                    </div>
                  </div>
                  {p.inStock && (
                    <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                      <a href={`tel:${p.phone}`} style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none", color: C.text, textAlign: "center" }}>📞 {p.phone}</a>
                      <a href={`https://wa.me/91${p.phone}`} target="_blank" rel="noreferrer"
                        style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: "none", background: "#25D366", color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none", textAlign: "center" }}>💬 WhatsApp</a>
                    </div>
                  )}
                </div>
              ))}
            </>
          ) : (
            <>
              {/* Show ALL nearby medical stores by default */}
              <div style={{ fontSize: 13, fontWeight: 700, margin: "10px 0 8px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>🏥 {T("नजदीकी मेडिकल स्टोर्स", "Nearby Medical Stores")}</span>
                <span style={{ fontSize: 12, color: loadingPharmacies ? C.muted : C.green, fontWeight: 600 }}>
                  {loadingPharmacies ? "⏳ Loading..." : `✅ ${pharmacists.length} real stores`}
                </span>
              </div>
              {loadingPharmacies ? (
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.primary }}>Finding real medical stores near you...</div>
                  <div style={{ fontSize: 12, color: C.muted, marginTop: 6 }}>This usually takes 2-5 seconds</div>
                </div>
              ) : pharmacists.length === 0 ? (
                <div style={{ textAlign: "center", padding: "30px 20px", color: C.muted }}>
                  <div style={{ fontSize: 40, marginBottom: 10 }}>📡</div>
                  <div style={{ fontSize: 14, fontWeight: 600 }}>No medical stores found nearby</div>
                  <div style={{ fontSize: 12, marginTop: 4 }}>Try moving to a different location</div>
                </div>
              ) : (
                pharmacists.map((p: any, i: number) => {
                  const dist = p.distanceKm || "—";
                  const hasPhone = p.phone && p.phone !== "N/A";
                  const hasAddress = p.address && p.address !== "Address not available";
                  const hasHours = p.opening_hours && p.opening_hours !== "Check locally";
                
                return (
                  <div key={i} style={{ background: C.card, borderRadius: 16, padding: 14, marginBottom: 10, border: `1px solid ${C.border}` }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                      <div style={{ width: 40, height: 40, borderRadius: 10, background: "#EBF4FD", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>🏥</div>
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                          <a href={`https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}`} target="_blank" rel="noreferrer" style={{ textDecoration: "none", color: "inherit", display: "block" }}>
                            <div style={{ fontSize: 14, fontWeight: 700 }}>{p.storeName || p.name} <span style={{fontSize: 10}}>↗️</span></div>
                            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>📍 {p.village} · {dist} km away</div>
                            {hasAddress && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>🏠 {p.address}</div>}
                            {hasHours && <div style={{ fontSize: 10, color: C.muted, marginTop: 2 }}>🕐 {p.opening_hours}</div>}
                          </a>
                          <span style={{ background: p.type === "Govt Free" ? "#E8F8EF" : p.type === "Jan Aushadhi" ? "#EBF4FD" : C.bg, color: p.type === "Govt Free" ? C.green : p.type === "Jan Aushadhi" ? C.primary : C.muted, borderRadius: 8, padding: "3px 8px", fontSize: 10, fontWeight: 700 }}>{p.type}</span>
                        </div>
                      </div>
                    </div>
                    {hasPhone && (
                      <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
                        <a href={`tel:${p.phone}`} style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none", color: C.text, textAlign: "center" }}>📞 Call</a>
                        {p.website && (
                          <a href={p.website} target="_blank" rel="noreferrer"
                            style={{ flex: 1, padding: "9px 12px", borderRadius: 10, border: "none", background: C.primary, color: "white", fontSize: 12, fontWeight: 700, cursor: "pointer", textDecoration: "none", textAlign: "center" }}>🌐 Website</a>
                        )}
                      </div>
                    )}
                  </div>
                );
              })
              )}
            </>
          )}
        </div>
        {/* Bottom nav */}
        <div style={{ position: "fixed", bottom: 0, width: 390, background: C.card, borderTop: `2px solid ${C.border}`, padding: "10px 16px", display: "flex", gap: 8, zIndex: 50 }}>
          <button onClick={() => router.push("/report")} style={{ flex: 1, padding: 12, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: "linear-gradient(135deg,#7B1FA2,#4A0072)", color: "white" }}>
            📋 {T("रिपोर्ट देखें", "View Report")}
          </button>
          <button onClick={() => router.push("/home")} style={{ flex: 1, padding: 12, borderRadius: 14, border: `1px solid ${C.border}`, cursor: "pointer", fontWeight: 700, fontSize: 13, background: C.bg, color: C.text }}>
            🏠 {T("होम", "Home")}
          </button>
        </div>
      </div>
    </div>
  );
}