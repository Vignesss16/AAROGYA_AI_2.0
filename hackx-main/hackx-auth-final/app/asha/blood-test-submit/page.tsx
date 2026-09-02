"use client";
import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";

const C = { primary: "#7D3C98", primaryDark: "#5B2C6F", green: "#1E8449", red: "#C0392B", bg: "#F0F4F8", card: "#FFFFFF", text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC" };

const TEST_TYPES = [
  { id: "Hemoglobin (Hb%)", unit: "g/dL", ref: "12-16 g/dL" },
  { id: "Blood Sugar (Fasting)", unit: "mg/dL", ref: "70-100 mg/dL" },
  { id: "Blood Sugar (Random)", unit: "mg/dL", ref: "70-140 mg/dL" },
  { id: "Malaria Rapid", unit: "Result", ref: "Negative" },
  { id: "Dengue NS1", unit: "Result", ref: "Negative" },
  { id: "Dengue IgM", unit: "Result", ref: "Negative" },
  { id: "Typhoid (Widal)", unit: "Titer", ref: "< 1:80" },
  { id: "HIV Rapid", unit: "Result", ref: "Negative" },
  { id: "Urine Routine", unit: "Result", ref: "Normal" },
  { id: "Complete Blood Count (CBC)", unit: "Various", ref: "See report" },
  { id: "Liver Function", unit: "Various", ref: "See report" },
  { id: "Kidney Function", unit: "Various", ref: "See report" },
  { id: "Other", unit: "", ref: "" },
];

export default function ASHABloodTestPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [lang, setLang] = useState("hi");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [isCritical, setIsCritical] = useState(false);

  const [form, setForm] = useState({
    patientPhone: "",
    patientName: "",
    testType: "Hemoglobin (Hb%)",
    result: "",
    numericValue: "",
    unit: "g/dL",
    notes: "",
    labName: "",
    testDate: new Date().toISOString().split("T")[0],
    imageDataUrl: "",
    assignedDoctorId: "",
  });

  const T = (hi: string, en: string) => lang === "hi" ? hi : en;
  const ashaPhone = session?.user?.phone || "";
  const ashaName = session?.user?.name || "";

  const [doctors, setDoctors] = useState<any[]>([]);

  useEffect(() => {
    setLang(localStorage.getItem("lang") || "hi");
    if (status === "unauthenticated" || session?.user?.role !== "ashaworker") router.replace("/asha/login");
    
    // Fetch doctors for assignment
    fetch("/api/admin/doctors")
      .then(res => res.json())
      .then(data => setDoctors(data.doctors || []))
      .catch(console.error);
  }, [status]);

  const handleTestTypeChange = (testType: string) => {
    const test = TEST_TYPES.find(t => t.id === testType);
    setForm(prev => ({ ...prev, testType, unit: test?.unit || "", result: "" }));
    setIsCritical(false);
  };

  const checkCritical = (testType: string, value: number) => {
    const thresholds: Record<string, { low: number; high: number }> = {
      "Hemoglobin (Hb%)": { low: 7, high: 18 },
      "Blood Sugar (Fasting)": { low: 50, high: 200 },
      "Blood Sugar (Random)": { low: 50, high: 300 },
    };
    const t = thresholds[testType];
    if (!t) return false;
    return value < t.low || value > t.high;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const numericValue = form.numericValue ? parseFloat(form.numericValue) : null;
      const critical = numericValue ? checkCritical(form.testType, numericValue) : false;
      setIsCritical(critical);

      const res = await fetch("/api/blood-tests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          numericValue,
          submittedBy: ashaPhone,
          submittedByName: ashaName,
          testDate: new Date(form.testDate),
        }),
      });

      const data = await res.json();
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => { setSuccess(false); router.push("/asha/dashboard"); }, 2000);
      } else {
        alert("Error: " + data.error);
      }
    } catch (err) {
      alert("Failed to submit blood test");
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading") return <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>⏳</div>;
  if (!session) return null;

  return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", padding: "10px 14px", gap: 10, background: C.card, borderBottom: `1px solid ${C.border}` }}>
          <button onClick={() => router.push("/asha/dashboard")} style={{ width: 36, height: 36, borderRadius: 10, background: C.bg, border: "none", fontSize: 18, cursor: "pointer" }}>←</button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 700 }}>{T("ब्लड टेस्ट जमा करें", "Submit Blood Test")}</div>
            <div style={{ fontSize: 11, color: C.muted }}>Blood Test Result Entry</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} style={{ flex: 1, overflowY: "auto", padding: 16 }}>
          {success && (
            <div style={{ background: "#E8F8EF", border: "1px solid #27AE60", borderRadius: 12, padding: 16, marginBottom: 16, textAlign: "center" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: C.green }}>
                {isCritical ? "⚠️ Test submitted - CRITICAL value detected!" : "Blood test submitted successfully!"}
              </div>
              <div style={{ fontSize: 12, color: C.muted, marginTop: 4 }}>Redirecting to dashboard...</div>
            </div>
          )}

          {[
            { label: "Patient Phone *", key: "patientPhone", type: "tel", placeholder: "9876501001" },
            { label: "Patient Name *", key: "patientName", type: "text", placeholder: "Ramkali Devi" },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 4 }}>{T(f.label, f.label)}</label>
              <input required type={f.type} placeholder={f.placeholder} value={(form as any)[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `2px solid ${C.border}`, fontSize: 14 }} />
            </div>
          ))}

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 4 }}>Test Type *</label>
            <select value={form.testType} onChange={e => handleTestTypeChange(e.target.value)}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `2px solid ${C.border}`, fontSize: 14, background: "white" }}>
              {TEST_TYPES.map(t => <option key={t.id} value={t.id}>{t.id}</option>)}
            </select>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 4 }}>Assign to Doctor (Optional)</label>
            <select value={form.assignedDoctorId} onChange={e => setForm(prev => ({ ...prev, assignedDoctorId: e.target.value }))}
              style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `2px solid ${C.border}`, fontSize: 14, background: "white" }}>
              <option value="">-- No specific doctor --</option>
              {doctors.map(d => <option key={d._id} value={d._id}>Dr. {d.name} ({d.hospital})</option>)}
            </select>
            <div style={{ fontSize: 10, color: C.muted, marginTop: 4 }}>If selected, this doctor will immediately see the report.</div>
          </div>

          {/* Dynamic Result Input */}
          <div style={{ marginBottom: 14 }}>
            {["Malaria Rapid", "Dengue NS1", "Dengue IgM", "HIV Rapid", "Urine Routine"].includes(form.testType) ? (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 4 }}>Test Result (Qualitative) *</label>
                <select required value={form.result} onChange={e => setForm(prev => ({ ...prev, result: e.target.value, numericValue: "" }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `2px solid ${C.border}`, fontSize: 14, background: "white" }}>
                  <option value="">-- Select Result --</option>
                  <option value="Positive">Positive (Abnormal)</option>
                  <option value="Negative">Negative (Normal)</option>
                  <option value="Equivocal">Equivocal / Inconclusive</option>
                  <option value="Normal">Normal</option>
                  <option value="Abnormal">Abnormal</option>
                </select>
              </div>
            ) : form.testType === "Typhoid (Widal)" || form.testType === "Complete Blood Count (CBC)" || form.testType === "Liver Function" || form.testType === "Kidney Function" || form.testType === "Other" ? (
              <div>
                <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 4 }}>Test Result Details *</label>
                <input required type="text" placeholder="e.g. 1:80 or see attached report" value={form.result}
                  onChange={e => setForm(prev => ({ ...prev, result: e.target.value }))}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `2px solid ${C.border}`, fontSize: 14 }} />
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: 10 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 4 }}>Numeric Value *</label>
                  <input required type="number" step="0.1" placeholder="e.g. 12.5" value={form.numericValue}
                    onChange={e => setForm(prev => ({ ...prev, numericValue: e.target.value, result: e.target.value ? `${e.target.value} ${form.unit}` : "" }))}
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `2px solid ${C.border}`, fontSize: 14 }} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 4 }}>Unit</label>
                  <input type="text" value={form.unit} readOnly
                    style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `2px solid ${C.border}`, fontSize: 14, background: "#f5f5f5" }} />
                </div>
              </div>
            )}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, marginBottom: 14 }}>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 4 }}>Test Date</label>
              <input type="date" value={form.testDate}
                onChange={e => setForm(prev => ({ ...prev, testDate: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `2px solid ${C.border}`, fontSize: 14 }} />
            </div>
            <div>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 4 }}>Attach Lab Slip / Proof (Optional)</label>
              <input type="file" accept="image/*" capture="environment" 
                onChange={e => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => setForm(prev => ({ ...prev, imageDataUrl: reader.result as string }));
                    reader.readAsDataURL(file);
                  }
                }}
                style={{ width: "100%", padding: "7px", borderRadius: 10, border: `2px solid ${C.border}`, fontSize: 12 }} />
            </div>
          </div>

          {[
            { label: "Lab Name", key: "labName", placeholder: "City Diagnostic Lab" },
            { label: "Notes", key: "notes", placeholder: "Additional observations..." },
          ].map(f => (
            <div key={f.key} style={{ marginBottom: 14 }}>
              <label style={{ fontSize: 12, fontWeight: 600, color: C.text, display: "block", marginBottom: 4 }}>{T(f.label, f.label)}</label>
              <input type="text" placeholder={f.placeholder} value={(form as any)[f.key]}
                onChange={e => setForm(prev => ({ ...prev, [f.key]: e.target.value }))}
                style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `2px solid ${C.border}`, fontSize: 14 }} />
            </div>
          ))}

          <button type="submit" disabled={loading}
            style={{ width: "100%", padding: 14, borderRadius: 14, border: "none", cursor: loading ? "wait" : "pointer", fontWeight: 700, fontSize: 15, background: loading ? "#ccc" : `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "white", marginTop: 8 }}>
            {loading ? "⏳ Submitting..." : isCritical ? "⚠️ Submit (CRITICAL)" : "✅ Submit Blood Test Result"}
          </button>
        </form>
      </div>
    </div>
  );
}
