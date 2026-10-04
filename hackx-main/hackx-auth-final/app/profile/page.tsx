"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth, PatientUser } from "@/lib/useAuth";

const C = {
  primary: "#1B6CA8",
  primaryDark: "#0F4C7A",
  bg: "#F0F4F8",
  card: "#FFFFFF",
  text: "#1A2332",
  muted: "#6B7C93",
  border: "#DDE3EC",
};

export default function ProfilePage() {
  const router = useRouter();
  const { user: authUser, loading } = useAuth();
  
  const [profile, setProfile] = useState<PatientUser>({
    _id: "patient",
    name: "Patient",
    phone: "",
    age: 28,
    gender: "other",
    village: "Local Area",
    conditions: [],
    bloodGroup: "—",
    role: "patient",
  });

  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    age: 28,
    gender: "other",
    village: "",
    bloodGroup: "—",
    phone: "",
    conditions: "",
  });

  const [abhaInput, setAbhaInput] = useState("");
  const [showOtp, setShowOtp] = useState(false);
  const [otp, setOtp] = useState("");
  const [linking, setLinking] = useState(false);

  const lang = typeof window !== "undefined" ? localStorage.getItem("lang") || "hi" : "hi";
  const t = (hi: string, en: string) => (lang === "hi" ? hi : en);

  // Initialize profile from authUser or localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      if (localStorage.getItem("user_is_logged_out") === "true") {
        router.replace("/login");
        return;
      }
      const stored = localStorage.getItem("cachedPatientUser") || localStorage.getItem("aarogya_user") || localStorage.getItem("patient");
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.name) {
            setProfile(parsed);
            return;
          }
        } catch {}
      } else if (!authUser && !loading) {
        router.replace("/login");
        return;
      }
    }
    if (authUser) {
      setProfile(authUser);
    }
  }, [authUser, loading, router]);

  const handleStartEdit = () => {
    setEditForm({
      name: profile.name || "Patient",
      age: profile.age || 28,
      gender: profile.gender || "other",
      village: profile.village || "Local Area",
      bloodGroup: profile.bloodGroup || "—",
      phone: profile.phone || "",
      conditions: Array.isArray(profile.conditions) ? profile.conditions.join(", ") : (profile.conditions || ""),
    });
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    const updatedUser: PatientUser = {
      ...profile,
      name: editForm.name.trim() || profile.name,
      age: Number(editForm.age) || profile.age,
      gender: editForm.gender,
      village: editForm.village.trim() || profile.village,
      bloodGroup: editForm.bloodGroup,
      phone: editForm.phone.trim() || profile.phone,
      conditions: editForm.conditions.split(",").map(c => c.trim()).filter(Boolean),
    };

    setProfile(updatedUser);
    setIsEditing(false);

    if (typeof window !== "undefined") {
      localStorage.setItem("cachedPatientUser", JSON.stringify(updatedUser));
      localStorage.setItem("aarogya_user", JSON.stringify(updatedUser));
      localStorage.setItem("patient", JSON.stringify(updatedUser));
      localStorage.setItem("last_login_phone", updatedUser.phone);
    }

    try {
      const token = localStorage.getItem("patient_token");
      if (token && navigator.onLine) {
        await fetch("/api/auth/user", {
          method: "PUT",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
          body: JSON.stringify(updatedUser),
        });
      }
    } catch {}
  };

  const handleLinkAbha = async () => {
    if (!abhaInput) return alert("Please enter ABHA ID");
    setShowOtp(true);
  };

  const handleVerifyOtp = async () => {
    if (otp.length < 4) return alert("Invalid OTP");
    setLinking(true);
    try {
      const updatedUser = { ...profile, abhaAddress: abhaInput, abhaLinked: true };
      setProfile(updatedUser);
      if (typeof window !== "undefined") {
        localStorage.setItem("cachedPatientUser", JSON.stringify(updatedUser));
      }
      alert(t("आभा आईडी लिंक हो गई है!", "ABHA ID linked successfully!"));
    } catch {
      alert("Error linking ABHA ID");
    }
    setLinking(false);
    setShowOtp(false);
  };

  const conditions = Array.isArray(profile.conditions) 
    ? profile.conditions 
    : (profile.conditions ? (profile.conditions as any).split(",") : []);

  const initials = profile.name
    ? profile.name.split(" ").map(w => w[0]).join("").toUpperCase().slice(0, 2)
    : "RK";

  return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        
        {/* Header */}
        <div style={{ background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, padding: "14px 16px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => router.back()} style={{ width: 36, height: 36, borderRadius: 10, background: "rgba(255,255,255,.15)", border: "none", color: "white", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>←</button>
            <div style={{ fontSize: 16, fontWeight: 700, color: "white" }}>{t("मेरी प्रोफाइल", "My Profile")}</div>
          </div>
          <button
            onClick={handleStartEdit}
            style={{
              background: "rgba(255,255,255,.18)",
              backdropFilter: "blur(8px)",
              border: "1px solid rgba(255,255,255,.3)",
              color: "white",
              padding: "6px 12px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 700,
              cursor: "pointer",
            }}
          >
            {t("बदलें", "Edit")}
          </button>
        </div>

        {/* Profile Avatar Area */}
        <div style={{ background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, padding: "20px 20px 28px", textAlign: "center", borderBottomLeftRadius: 24, borderBottomRightRadius: 24, boxShadow: "0 4px 16px rgba(0,0,0,0.12)" }}>
          <div style={{ width: 76, height: 76, borderRadius: 38, background: "rgba(255,255,255,.2)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 26, fontWeight: 800, color: "white", margin: "0 auto", border: "3px solid rgba(255,255,255,.4)", backdropFilter: "blur(4px)" }}>
            {initials}
          </div>
          <h2 style={{ fontSize: 22, fontWeight: 800, color: "white", margin: "12px 0 4px", letterSpacing: -0.2 }}>{profile.name}</h2>
          <div style={{ fontSize: 14, color: "rgba(255,255,255,.8)" }}>+91 {profile.phone}</div>
        </div>

        <div style={{ flex: 1, padding: "20px 16px", overflowY: "auto" }}>
          
          <div style={{ background: C.card, borderRadius: 16, border: `1px solid ${C.border}`, overflow: "hidden", boxShadow: "0 2px 10px rgba(0,0,0,0.04)" }}>
            
            {/* Age */}
            <DetailRow
              svgIcon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={C.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
              }
              label={t("उम्र", "Age")}
              value={`${profile.age || "32"} ${t("वर्ष", "years")}`}
            />
            <Divider />
            
            {/* Gender */}
            <DetailRow
              svgIcon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#6C3483" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              }
              label={t("लिंग", "Gender")}
              value={profile.gender ? profile.gender.charAt(0).toUpperCase() + profile.gender.slice(1) : "Male"}
            />
            <Divider />
            
            {/* Blood Group */}
            <DetailRow
              svgIcon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#C0392B" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>
              }
              label={t("ब्लड ग्रुप", "Blood Group")}
              value={profile.bloodGroup || "B+"}
            />
            <Divider />
            
            {/* Village */}
            <DetailRow
              svgIcon={
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E8449" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>
              }
              label={t("गाँव / स्थान", "Village / Location")}
              value={profile.village || "Rampur"}
            />
            <Divider />
            
            {/* Medical Conditions */}
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "#FEF5E7", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#D35400" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 4 }}>{t("बीमारियाँ (Medical Conditions)", "Medical Conditions")}</div>
                {conditions.length > 0 ? (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {conditions.map((c: string, i: number) => (
                      <span key={i} style={{ background: "#FDEBD0", color: "#D35400", padding: "3px 10px", borderRadius: 10, fontSize: 12, fontWeight: 700 }}>
                        {c.trim()}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{t("कोई नहीं", "None")}</div>
                )}
              </div>
            </div>
            <Divider />
            
            {/* ABHA ID */}
            <div style={{ padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: 12 }}>
              <div style={{ width: 34, height: 34, borderRadius: 10, background: "#E8F8EF", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1E8449" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 12, color: C.muted, fontWeight: 600, marginBottom: 4 }}>ABHA ID (Ayushman Bharat)</div>
                {profile.abhaLinked ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 6, background: "#E8F8EF", padding: "6px 10px", borderRadius: 8, border: `1px solid #A9DFBF` }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#1E8449" }}>✓ {profile.abhaAddress}</span>
                  </div>
                ) : (
                  <div>
                    <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
                      <input 
                        value={abhaInput} 
                        onChange={e => setAbhaInput(e.target.value)} 
                        placeholder="e.g. ramesh@abdm" 
                        style={{ flex: 1, padding: "8px 12px", borderRadius: 8, border: `1px solid ${C.border}`, outline: "none", fontSize: 13 }}
                      />
                      <button 
                        onClick={handleLinkAbha}
                        style={{ background: C.primary, color: "white", padding: "8px 14px", borderRadius: 8, border: "none", fontWeight: 700, cursor: "pointer", fontSize: 13 }}
                      >
                        {t("लिंक करें", "Link")}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
          </div>
        </div>
      </div>

      {/* EDIT PROFILE MODAL */}
      {isEditing && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100, padding: 16 }}>
          <div style={{ background: C.card, width: "100%", maxWidth: 360, padding: 22, borderRadius: 18, maxHeight: "90vh", overflowY: "auto" }}>
            <h3 style={{ margin: "0 0 16px", fontSize: 18, fontWeight: 800, color: C.text }}>{t("प्रोफ़ाइल संपादित करें", "Edit Profile")}</h3>
            
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>{t("पूरा नाम", "Full Name")}</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.border}`, outline: "none", fontSize: 14 }}
                />
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>{t("उम्र", "Age")}</label>
                  <input
                    type="number"
                    value={editForm.age}
                    onChange={e => setEditForm({ ...editForm, age: Number(e.target.value) })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.border}`, outline: "none", fontSize: 14 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>{t("लिंग", "Gender")}</label>
                  <select
                    value={editForm.gender}
                    onChange={e => setEditForm({ ...editForm, gender: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.border}`, outline: "none", fontSize: 14, background: C.card }}
                  >
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "flex", gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>{t("गाँव / शहर", "Village / City")}</label>
                  <input
                    type="text"
                    value={editForm.village}
                    onChange={e => setEditForm({ ...editForm, village: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.border}`, outline: "none", fontSize: 14 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>{t("ब्लड ग्रुप", "Blood Group")}</label>
                  <select
                    value={editForm.bloodGroup}
                    onChange={e => setEditForm({ ...editForm, bloodGroup: e.target.value })}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.border}`, outline: "none", fontSize: 14, background: C.card }}
                  >
                    <option value="A+">A+</option>
                    <option value="A-">A-</option>
                    <option value="B+">B+</option>
                    <option value="B-">B-</option>
                    <option value="O+">O+</option>
                    <option value="O-">O-</option>
                    <option value="AB+">AB+</option>
                    <option value="AB-">AB-</option>
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.muted, display: "block", marginBottom: 4 }}>{t("चिकित्सा स्थितियां", "Medical Conditions")}</label>
                <input
                  type="text"
                  placeholder="e.g. Hypertension, Diabetes"
                  value={editForm.conditions}
                  onChange={e => setEditForm({ ...editForm, conditions: e.target.value })}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1.5px solid ${C.border}`, outline: "none", fontSize: 14 }}
                />
              </div>

              <div style={{ display: "flex", gap: 10, marginTop: 14 }}>
                <button
                  type="button"
                  onClick={() => setIsEditing(false)}
                  style={{ flex: 1, padding: "12px", borderRadius: 10, border: `1px solid ${C.border}`, background: C.bg, fontWeight: 700, cursor: "pointer", color: C.text }}
                >
                  {t("रद्द करें", "Cancel")}
                </button>
                <button
                  type="button"
                  onClick={handleSaveEdit}
                  style={{ flex: 1, padding: "12px", borderRadius: 10, border: "none", background: C.primary, color: "white", fontWeight: 700, cursor: "pointer" }}
                >
                  {t("सहेजें", "Save Changes")}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* OTP MODAL */}
      {showOtp && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 100 }}>
          <div style={{ background: C.card, width: 320, padding: 24, borderRadius: 16 }}>
            <h3 style={{ margin: "0 0 8px", fontSize: 18, fontWeight: 800 }}>Verify ABHA ID</h3>
            <p style={{ margin: "0 0 16px", fontSize: 13, color: C.muted }}>Enter the 6-digit OTP sent to the mobile number registered with ABHA.</p>
            <input 
              value={otp} 
              onChange={e => setOtp(e.target.value)} 
              placeholder="123456" 
              maxLength={6}
              style={{ width: "100%", padding: "12px", borderRadius: 8, border: `1px solid ${C.border}`, outline: "none", fontSize: 20, textAlign: "center", letterSpacing: 4, marginBottom: 16 }}
            />
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => setShowOtp(false)} style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: C.bg, fontWeight: 700, cursor: "pointer" }}>Cancel</button>
              <button onClick={handleVerifyOtp} disabled={linking} style={{ flex: 1, padding: 12, borderRadius: 8, border: "none", background: C.primary, color: "white", fontWeight: 700, cursor: "pointer" }}>
                {linking ? "..." : "Verify OTP"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ svgIcon, label, value }: { svgIcon: React.ReactNode, label: string, value: string }) {
  return (
    <div style={{ padding: "14px 16px", display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 34, height: 34, borderRadius: 10, background: "#F0F4F8", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
        {svgIcon}
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 12, color: "#6B7C93", fontWeight: 600 }}>{label}</div>
        <div style={{ fontSize: 15, fontWeight: 700, color: "#1A2332", marginTop: 2 }}>{value}</div>
      </div>
    </div>
  );
}

function Divider() {
  return <div style={{ height: 1, background: "#DDE3EC", margin: "0 16px" }} />;
}
