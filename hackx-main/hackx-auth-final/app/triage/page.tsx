"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { TriageResult } from "@/lib/triage";
import { fallbackTriage } from "@/lib/triage";

const SYMPTOMS_MAP: Record<string, { emoji: string; hi: string; en: string }> = {
  fever: { emoji: "🌡️", hi: "बुखार", en: "Fever" }, chest: { emoji: "💔", hi: "सीने में दर्द", en: "Chest Pain" },
  breath: { emoji: "😮‍💨", hi: "सांस में तकलीफ", en: "Breathless" }, cough: { emoji: "😮", hi: "खांसी", en: "Cough" },
  cold: { emoji: "🤧", hi: "जुकाम", en: "Cold" }, headache: { emoji: "🤕", hi: "सिरदर्द", en: "Headache" },
  vomit: { emoji: "🤢", hi: "उल्टी", en: "Vomiting" }, diarrhea: { emoji: "💧", hi: "दस्त", en: "Diarrhea" },
  rash: { emoji: "🔴", hi: "दाने", en: "Skin Rash" }, pain: { emoji: "🦴", hi: "जोड़ों में दर्द", en: "Joint Pain" },
  weakness: { emoji: "😴", hi: "कमज़ोरी", en: "Weakness" }, stomach: { emoji: "😣", hi: "पेट में दर्द", en: "Stomach Pain" },
  eyes: { emoji: "👁️", hi: "आँखों में जलन", en: "Eye Pain" }, back: { emoji: "🔙", hi: "कमर दर्द", en: "Back Pain" },
  dizzy: { emoji: "💫", hi: "चक्कर", en: "Dizziness" }, swelling: { emoji: "🦵", hi: "सूजन", en: "Swelling" },
  chills: { emoji: "🥶", hi: "ठंड लगना", en: "Chills" }, body_ache: { emoji: "🤸", hi: "शरीर दर्द", en: "Body Ache" },
  sweat: { emoji: "💦", hi: "पसीना", en: "Sweating" }, urine_burn: { emoji: "🔥", hi: "पेशाब में जलन", en: "Burning Urination" },
  nausea: { emoji: "😰", hi: "जी मिचलाना", en: "Nausea" }, unconscious: { emoji: "😵", hi: "बेहोशी", en: "Unconscious" },
  seizure: { emoji: "⚡", hi: "दौरे", en: "Seizures" }, bleed: { emoji: "🩸", hi: "रक्तस्राव", en: "Bleeding" },
};

// ── HOME REMEDIES (GREEN only) ─────────────────────────────────────────────
const HOME_REMEDIES_FOR_SYMPTOMS = (symptomIds: string[]): Array<{ remedy: string; hi: string; en: string; icon: string }> => {
  const has = (id: string) => symptomIds.includes(id);

  if (has("fever") && has("chills")) return [
    { remedy: "tulsi_ginger", icon: "🌿", hi: "तुलसी-अदरक की चाय पिएं", en: "Drink tulsi-ginger tea" },
    { remedy: "cold_compress", icon: "🧊", hi: "माथे पर ठंडी पट्टी रखें", en: "Apply cold compress on forehead" },
    { remedy: "rest", icon: "🛏️", hi: "पूरा आराम करें और पानी खूब पिएं", en: "Rest completely and drink plenty of water" },
    { remedy: "light_food", icon: "🍚", hi: "हल्का खाना खाएं — दलिया, खिचड़ी", en: "Eat light food — porridge, khichdi" },
  ];
  if (has("fever")) return [
    { remedy: "tulsi_ginger", icon: "🌿", hi: "तुलसी और अदरक की चाय दिन में 2–3 बार पिएं", en: "Drink tulsi & ginger tea 2–3 times a day" },
    { remedy: "cold_compress", icon: "🧊", hi: "माथे और बगल में ठंडी पट्टी रखें", en: "Apply cold compress on forehead and armpits" },
    { remedy: "hydration", icon: "💧", hi: "नारियल पानी, ORS या छाछ पिएं", en: "Drink coconut water, ORS or buttermilk" },
    { remedy: "rest", icon: "🛏️", hi: "पूरा आराम करें, बाहर न जाएं", en: "Rest fully, avoid going outside" },
  ];
  if (has("cough") && has("cold")) return [
    { remedy: "honey_ginger", icon: "🍯", hi: "शहद + अदरक का रस मिलाकर चाटें", en: "Mix honey + ginger juice and lick slowly" },
    { remedy: "steam", icon: "♨️", hi: "दिन में 2 बार भाप लें — तुलसी या अजवाइन डालें", en: "Steam inhalation twice daily — add tulsi or ajwain" },
    { remedy: "turmeric_milk", icon: "🥛", hi: "रात को हल्दी वाला दूध पिएं", en: "Drink turmeric milk (golden milk) at night" },
    { remedy: "saltwater_gargle", icon: "🌊", hi: "नमक के गुनगुने पानी से गरारे करें", en: "Gargle with warm salt water" },
  ];
  if (has("cough")) return [
    { remedy: "honey_ginger", icon: "🍯", hi: "1 चम्मच शहद + अदरक का रस — दिन में 3 बार", en: "1 spoon honey + ginger juice — 3 times a day" },
    { remedy: "steam", icon: "♨️", hi: "भाप लें — तुलसी डालें गर्म पानी में", en: "Take steam with tulsi leaves in hot water" },
    { remedy: "turmeric_milk", icon: "🥛", hi: "सोने से पहले हल्दी वाला दूध पिएं", en: "Drink turmeric milk before sleeping" },
  ];
  if (has("cold")) return [
    { remedy: "steam", icon: "♨️", hi: "अजवाइन डालकर भाप लें — दिन में 2 बार", en: "Steam with ajwain (carom seeds) — twice daily" },
    { remedy: "tulsi_tea", icon: "🌿", hi: "तुलसी-काली मिर्च की चाय पिएं", en: "Drink tulsi & black pepper tea" },
    { remedy: "saltwater_gargle", icon: "🌊", hi: "नमक के गर्म पानी से गरारे करें", en: "Gargle with warm salt water" },
    { remedy: "ginger_honey", icon: "🍯", hi: "अदरक + शहद + नींबू का काढ़ा बनाएं", en: "Make kadha with ginger, honey & lemon" },
  ];
  if (has("headache")) return [
    { remedy: "peppermint_oil", icon: "🫧", hi: "पुदीने का तेल माथे पर लगाएं और मालिश करें", en: "Apply peppermint oil on forehead and massage" },
    { remedy: "cold_compress", icon: "🧊", hi: "माथे पर ठंडी पट्टी रखें", en: "Place cold compress on forehead" },
    { remedy: "hydration", icon: "💧", hi: "2 गिलास पानी पिएं — अक्सर पानी की कमी से सिरदर्द होता है", en: "Drink 2 glasses of water — dehydration is a common cause" },
    { remedy: "dark_rest", icon: "🛏️", hi: "अंधेरे कमरे में लेटकर आराम करें", en: "Rest in a dark quiet room" },
  ];
  if (has("stomach") && has("nausea")) return [
    { remedy: "ginger_tea", icon: "🫚", hi: "अदरक की चाय धीरे-धीरे पिएं", en: "Sip ginger tea slowly" },
    { remedy: "ajwain", icon: "🌾", hi: "1 चुटकी अजवाइन + काला नमक चबाएं", en: "Chew a pinch of ajwain with black salt" },
    { remedy: "light_food", icon: "🍌", hi: "केला, चावल, टोस्ट — हल्का ही खाएं", en: "Eat BRAT foods: banana, rice, toast" },
    { remedy: "rest", icon: "🛏️", hi: "लेटें, बाईं करवट सोने से राहत मिलती है", en: "Rest, lying on left side helps nausea" },
  ];
  if (has("stomach")) return [
    { remedy: "ajwain", icon: "🌾", hi: "अजवाइन + काला नमक गर्म पानी के साथ लें", en: "Take ajwain + black salt with warm water" },
    { remedy: "jeera_water", icon: "🌿", hi: "जीरे का पानी पिएं — 1 चम्मच जीरा उबालें", en: "Drink cumin water — boil 1 spoon jeera in water" },
    { remedy: "hing", icon: "🟡", hi: "हींग को नाभि के आसपास लगाएं गैस के लिए", en: "Apply hing (asafoetida) around navel for gas relief" },
    { remedy: "light_food", icon: "🍚", hi: "खिचड़ी या दलिया खाएं — मसालेदार भोजन न करें", en: "Eat khichdi or porridge — avoid spicy food" },
  ];
  if (has("nausea")) return [
    { remedy: "ginger", icon: "🫚", hi: "छोटा अदरक का टुकड़ा चबाएं या अदरक की चाय पिएं", en: "Chew small piece of ginger or drink ginger tea" },
    { remedy: "lemon_water", icon: "🍋", hi: "नींबू पानी धीरे-धीरे पिएं", en: "Slowly sip lemon water" },
    { remedy: "fresh_air", icon: "🌬️", hi: "ताज़ी हवा लें, खिड़की खोलें", en: "Get fresh air, open windows" },
  ];
  if (has("vomit") || has("diarrhea")) return [
    { remedy: "ors", icon: "💧", hi: "घर का ORS: 1L पानी + 6 चम्मच चीनी + आधा चम्मच नमक", en: "Home ORS: 1L water + 6 spoons sugar + half spoon salt" },
    { remedy: "coconut_water", icon: "🥥", hi: "नारियल पानी पिएं — इलेक्ट्रोलाइट्स भरता है", en: "Drink coconut water — replenishes electrolytes" },
    { remedy: "light_food", icon: "🍌", hi: "केला और उबले चावल खाएं", en: "Eat banana and boiled rice only" },
    { remedy: "rest", icon: "🛏️", hi: "पूरा आराम करें", en: "Rest completely" },
  ];
  if (has("back")) return [
    { remedy: "hot_compress", icon: "🔥", hi: "गर्म सिकाई करें — गर्म तौलिया या हीटिंग पैड", en: "Apply hot compress — warm towel or heating pad" },
    { remedy: "mustard_oil", icon: "🫙", hi: "सरसों के तेल से धीमे हाथ से मालिश करें", en: "Massage gently with warm mustard oil" },
    { remedy: "rest", icon: "🛏️", hi: "भारी सामान न उठाएं, आराम करें", en: "Avoid heavy lifting, rest" },
    { remedy: "stretching", icon: "🧘", hi: "धीमे योग या खिंचाव के व्यायाम करें", en: "Do gentle yoga or stretching exercises" },
  ];
  if (has("pain")) return [
    { remedy: "turmeric_milk", icon: "🥛", hi: "हल्दी वाला दूध पिएं — प्राकृतिक दर्द निवारक", en: "Drink turmeric milk — natural pain reliever" },
    { remedy: "hot_compress", icon: "🔥", hi: "जोड़ों पर गर्म सिकाई करें", en: "Apply warm compress on joints" },
    { remedy: "massage_oil", icon: "🫙", hi: "तिल या नारियल तेल से जोड़ों की मालिश करें", en: "Massage joints with sesame or coconut oil" },
    { remedy: "rest", icon: "🛏️", hi: "जोड़ पर दबाव न डालें, आराम दें", en: "Rest the joint — avoid pressure on it" },
  ];
  if (has("eyes")) return [
    { remedy: "rose_water", icon: "🌹", hi: "शुद्ध गुलाब जल आँखों में डालें — राहत मिलेगी", en: "Put pure rose water in eyes for relief" },
    { remedy: "cold_compress", icon: "🧊", hi: "बंद आँखों पर ठंडी पट्टी रखें", en: "Apply cold compress on closed eyes" },
    { remedy: "no_rubbing", icon: "🚫", hi: "आँखें रगड़ें नहीं — संक्रमण बढ़ सकता है", en: "Do NOT rub eyes — can worsen infection" },
    { remedy: "clean_water", icon: "💧", hi: "साफ पानी से आँखें धोएं दिन में 3 बार", en: "Wash eyes with clean water 3 times a day" },
  ];
  if (has("rash")) return [
    { remedy: "neem", icon: "🌿", hi: "नीम के पत्तों को पानी में उबालकर उससे नहाएं", en: "Bathe with water boiled with neem leaves" },
    { remedy: "coconut_oil", icon: "🫙", hi: "नारियल तेल लगाएं — खुजली और जलन कम होगी", en: "Apply coconut oil — reduces itching and burning" },
    { remedy: "aloe_vera", icon: "🪴", hi: "एलोवेरा जेल दाने पर लगाएं", en: "Apply fresh aloe vera gel on rash" },
    { remedy: "no_scratch", icon: "🚫", hi: "खुजलाएं नहीं — संक्रमण बढ़ेगा", en: "Do NOT scratch — can cause infection" },
  ];
  if (has("weakness")) return [
    { remedy: "dates", icon: "🫘", hi: "खजूर और गुड़ खाएं — आयरन और ऊर्जा मिलेगी", en: "Eat dates and jaggery — iron and energy boost" },
    { remedy: "banana_milk", icon: "🍌", hi: "केला और दूध लें — तुरंत शक्ति देता है", en: "Have banana and milk — instant energy" },
    { remedy: "rest", icon: "🛏️", hi: "पर्याप्त नींद लें — 8 घंटे ज़रूरी हैं", en: "Get adequate sleep — 8 hours is essential" },
    { remedy: "iron_food", icon: "🥬", hi: "पालक, चुकंदर, मूंगफली खाएं", en: "Eat spinach, beetroot, peanuts" },
  ];
  if (has("dizzy")) return [
    { remedy: "sit_down", icon: "🪑", hi: "तुरंत बैठ जाएं या लेट जाएं — गिरने से बचें", en: "Sit or lie down immediately — prevent falling" },
    { remedy: "water", icon: "💧", hi: "धीरे-धीरे पानी पिएं", en: "Slowly drink water" },
    { remedy: "deep_breath", icon: "🌬️", hi: "धीमी-गहरी सांसें लें", en: "Take slow deep breaths" },
    { remedy: "ginger_tea", icon: "🫚", hi: "अदरक की चाय पिएं — चक्कर में राहत देती है", en: "Drink ginger tea — helps with dizziness" },
  ];
  if (has("swelling")) return [
    { remedy: "cold_compress", icon: "🧊", hi: "सूजन पर ठंडी पट्टी रखें — 15-20 मिनट", en: "Apply cold compress on swelling — 15–20 mins" },
    { remedy: "elevation", icon: "⬆️", hi: "सूजे हुए अंग को ऊपर उठाकर रखें", en: "Elevate the swollen limb" },
    { remedy: "turmeric_paste", icon: "🟡", hi: "हल्दी + पानी का लेप लगाएं", en: "Apply turmeric paste on the area" },
    { remedy: "reduce_salt", icon: "🧂", hi: "नमक कम खाएं — पानी की सूजन घटेगी", en: "Reduce salt intake — helps reduce water retention" },
  ];
  if (has("urine_burn")) return [
    { remedy: "water", icon: "💧", hi: "दिन में कम से कम 3 लीटर पानी पिएं", en: "Drink at least 3 litres of water daily" },
    { remedy: "coconut_water", icon: "🥥", hi: "नारियल पानी पिएं — मूत्र नली को साफ करता है", en: "Drink coconut water — flushes urinary tract" },
    { remedy: "no_spicy", icon: "🚫", hi: "मसालेदार और तले खाने से परहेज़ करें", en: "Avoid spicy and fried foods" },
    { remedy: "cranberry", icon: "🫐", hi: "आंवले का रस या क्रैनबेरी जूस पिएं", en: "Drink amla juice or cranberry juice" },
  ];
  if (has("body_ache") || has("chills")) return [
    { remedy: "ginger_tulsi_tea", icon: "🌿", hi: "अदरक + तुलसी + काली मिर्च का काढ़ा पिएं", en: "Drink kadha: ginger + tulsi + black pepper" },
    { remedy: "warm_bath", icon: "🛁", hi: "गर्म पानी से नहाएं — शरीर दर्द कम होगा", en: "Take a warm water bath — relieves body ache" },
    { remedy: "turmeric_milk", icon: "🥛", hi: "रात को हल्दी का दूध पिएं", en: "Drink turmeric milk at night" },
    { remedy: "rest", icon: "🛏️", hi: "गर्म कपड़े पहनें और आराम करें", en: "Wear warm clothes and rest" },
  ];
  if (has("sweat")) return [
    { remedy: "hydration", icon: "💧", hi: "ORS या नमक-चीनी का पानी पिएं", en: "Drink ORS or sugar-salt water" },
    { remedy: "cool_env", icon: "🌬️", hi: "ठंडी जगह रहें — पंखा चलाएं", en: "Stay in a cool place — use a fan" },
    { remedy: "light_clothes", icon: "👕", hi: "हल्के सूती कपड़े पहनें", en: "Wear light cotton clothes" },
  ];
  // Default green fallback
  return [
    { remedy: "rest", icon: "🛏️", hi: "पूरा आराम करें", en: "Take complete rest" },
    { remedy: "hydration", icon: "💧", hi: "खूब पानी और तरल पदार्थ पिएं", en: "Drink plenty of water and fluids" },
    { remedy: "light_food", icon: "🍚", hi: "हल्का और सादा खाना खाएं", en: "Eat light and simple food" },
    { remedy: "monitor", icon: "👀", hi: "लक्षण 2-3 दिनों में न सुधरें तो डॉक्टर को दिखाएं", en: "See a doctor if symptoms don't improve in 2–3 days" },
  ];
};

const GRAD: Record<string, string> = {
  RED: "linear-gradient(160deg,#922B21,#C0392B)",
  YELLOW: "linear-gradient(160deg,#B7770D,#E67E22)",
  GREEN: "linear-gradient(160deg,#1A6B3A,#27AE60)",
};
const C = { primary: "#1B6CA8", primaryDark: "#0F4C7A", green: "#1E8449", greenLight: "#27AE60", red: "#C0392B", yellow: "#F39C12", bg: "#F0F4F8", card: "#FFFFFF", text: "#1A2332", muted: "#6B7C93", border: "#DDE3EC" };

export default function TriagePage() {
  const router = useRouter();
  const [lang, setLang] = useState<"hi" | "en">("hi");
  const t = (hi: string, en: string) => lang === "hi" ? hi : en;

  const [result, setResult] = useState<TriageResult | null>(null);
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [homeRemedies, setHomeRemedies] = useState<Array<{ remedy: string; hi: string; en: string; icon: string }>>([]);
  const [loading, setLoading] = useState(true);
  const [detailData, setDetailData] = useState<{ duration?: string; diseases?: string[]; otherDisease?: string; fileNames?: string[] } | null>(null);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

  useEffect(() => {
    const storedLang = localStorage.getItem("lang");
    if (storedLang === "en") setLang("en");
    const saved = localStorage.getItem("triageResult");
    const triageMode = localStorage.getItem("triageMode");
    const syms = JSON.parse(localStorage.getItem("selectedSymptoms") || "[]");
    const detail = localStorage.getItem("symptomDetailData");
    if (detail) setDetailData(JSON.parse(detail));
    setSelectedSymptoms(syms);

    if (triageMode === "offline") {
      setIsOfflineMode(true);
      localStorage.removeItem("triageMode");
    }

    const autoDispatchRed = (res: any, syms: any, detailStr: string | null) => {
      if (res.urgency === "RED" && !localStorage.getItem("redAutoDispatched_" + Date.now().toString().slice(0, 6))) {
        fetch("/api/consultations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            patientName: "Jeeva", // Defaulting for demo
            patientPhone: "8591292159", 
            doctorId: "D1",
            doctorName: "Dr. Ravi Patel",
            hospital: "Nabha Civil Hospital",
            slot: "Immediate",
            urgency: "RED",
            queueNo: 0,
            triageResult: res,
            symptoms: syms,
            patientContext: detailStr ? JSON.parse(detailStr) : null,
            status: "pending",
          })
        }).then(() => localStorage.setItem("redAutoDispatched_" + Date.now().toString().slice(0, 6), "true")).catch(console.error);
      }
    };

    if (saved) {
      const parsedResult = JSON.parse(saved);
      setResult(parsedResult);
      autoDispatchRed(parsedResult, syms, detail);
      if (parsedResult.urgency === "GREEN") {
        if (parsedResult.homeRemedies && parsedResult.homeRemedies.length > 0) {
          setHomeRemedies(parsedResult.homeRemedies);
        } else {
          setHomeRemedies(HOME_REMEDIES_FOR_SYMPTOMS(syms));
        }
      }
    } else {
      const fallback = fallbackTriage(syms);
      setResult(fallback);
      setIsOfflineMode(true);
      autoDispatchRed(fallback, syms, detail);
      if (fallback.urgency === "GREEN") {
        setHomeRemedies(HOME_REMEDIES_FOR_SYMPTOMS(syms));
      }
    }
    setLoading(false);
  }, []);

  if (loading || !result) {
    return (
      <div style={{ background: "linear-gradient(160deg,#0F4C7A,#1B6CA8)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 20 }}>
        <div style={{ fontSize: 60 }}>🤖</div>
        <div style={{ width: 48, height: 48, border: "4px solid rgba(255,255,255,.3)", borderTop: "4px solid white", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <div style={{ color: "white", fontSize: 18, fontWeight: 800 }}>{t("AI जाँच रहा है...", "AI is analyzing...")}</div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const urgColor = { RED: C.red, YELLOW: C.yellow, GREEN: C.green }[result.urgency];

  // ── RED URGENCY PANEL ─────────────────────────────────────────────────────
  const RedUrgencyPanel = () => (
    <div style={{ background: C.card, borderRadius: 16, padding: 16, marginTop: 12, border: `2px solid ${C.red}` }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: C.red, textTransform: "uppercase", letterSpacing: .8, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        🚨 {t("आपातकाल — तुरंत कार्रवाई करें", "EMERGENCY — Act Immediately")}
      </div>
      <div style={{ background: "linear-gradient(135deg,#FDEDEC,#FADBD8)", borderRadius: 12, padding: 16, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📞</div>
        <div style={{ fontSize: 20, fontWeight: 900, color: C.red, marginBottom: 4 }}>108 पर अभी कॉल करें</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: "#922B21", marginBottom: 12 }}>Call 108 — National Emergency Ambulance</div>
        <a href="tel:108" style={{ display: "block", background: "linear-gradient(135deg,#E74C3C,#922B21)", color: "white", padding: "14px 24px", borderRadius: 14, fontSize: 18, fontWeight: 900, textDecoration: "none", animation: "epulse 1.5s infinite" }}>
          📞 {t("108 कॉल करें", "Call 108 Now")}
        </a>
      </div>
      <div style={{ marginTop: 12, padding: "10px 12px", background: "#FEF0F0", borderRadius: 10, fontSize: 12, color: "#922B21", fontWeight: 600, lineHeight: 1.6 }}>
        ⚠️ {t("यह स्थिति गंभीर है। खुद दवाई न लें। एम्बुलेंस का इंतज़ार करें और मरीज़ को शांत रखें।", "This is a serious emergency. Do NOT self-medicate. Wait for the ambulance and keep the patient calm.")}
      </div>
    </div>
  );

  // ── YELLOW URGENCY PANEL ──────────────────────────────────────────────────
  const YellowUrgencyPanel = () => (
    <div style={{ background: C.card, borderRadius: 16, padding: 16, marginTop: 12, border: `2px solid ${C.yellow}` }}>
      <div style={{ fontSize: 13, fontWeight: 800, color: "#B7770D", textTransform: "uppercase", letterSpacing: .8, marginBottom: 12, display: "flex", alignItems: "center", gap: 6 }}>
        👨‍⚕️ {t("डॉक्टर से मिलें", "Consult a Doctor")}
      </div>
      <div style={{ background: "linear-gradient(135deg,#FEF9E7,#FDEBD0)", borderRadius: 12, padding: 16, textAlign: "center" }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🏥</div>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#B7770D", marginBottom: 4 }}>
          {t("आज ही डॉक्टर से मिलें", "See a Doctor Today")}
        </div>
        <div style={{ fontSize: 13, color: "#7D6608", marginBottom: 14, lineHeight: 1.5 }}>
          {t(
            "आपके लक्षण घर पर ठीक नहीं होंगे। जल्द से जल्द नज़दीकी स्वास्थ्य केंद्र या क्लिनिक पर जाएं।",
            "Your symptoms need medical attention. Please visit your nearest clinic or health center as soon as possible."
          )}
        </div>
        <button onClick={() => router.push("/confirm")} style={{ background: "linear-gradient(135deg,#E67E22,#B7770D)", color: "white", padding: "13px 28px", borderRadius: 14, fontSize: 15, fontWeight: 800, border: "none", cursor: "pointer", width: "100%" }}>
          📅 {t("डॉक्टर अपॉइंटमेंट बुक करें", "Book Doctor Appointment")}
        </button>
      </div>
      <div style={{ marginTop: 12, padding: "10px 12px", background: "#FEF9E7", borderRadius: 10, fontSize: 12, color: "#7D6608", fontWeight: 600, lineHeight: 1.6 }}>
        ℹ️ {t("कोई भी दवाई खुद से न लें। डॉक्टर की जाँच के बाद ही सही इलाज संभव है।", "Do not take any medicines on your own. Proper treatment is only possible after a doctor's examination.")}
      </div>
    </div>
  );

  // ── GREEN HOME REMEDIES PANEL ─────────────────────────────────────────────
  const GreenRemediesPanel = () => (
    <div style={{ background: C.card, borderRadius: 16, padding: 14, marginTop: 12, border: `2px solid #27AE60` }}>
      <div style={{ fontSize: 12, fontWeight: 800, color: C.green, textTransform: "uppercase", letterSpacing: .8, marginBottom: 10 }}>
        🌿 {t("घरेलू उपचार", "Home Remedies")}
      </div>
      <div style={{ fontSize: 12, color: C.muted, marginBottom: 12, lineHeight: 1.5 }}>
        {t("आपके लक्षण हल्के हैं। नीचे दिए घरेलू उपाय आज़माएं — ये सुरक्षित और असरदार हैं।", "Your symptoms are mild. Try these safe and effective home remedies.")}
      </div>
      {homeRemedies.map((remedy, i) => (
        <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 12, padding: "12px 0", borderBottom: i < homeRemedies.length - 1 ? `1px solid ${C.border}` : "none" }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: "#E8F8EF", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 20, flexShrink: 0 }}>{remedy.icon}</div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>{lang === "hi" ? remedy.hi : remedy.en}</div>
            <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{lang === "hi" ? remedy.en : remedy.hi}</div>
          </div>
        </div>
      ))}
      <div style={{ background: "#F0FBF4", borderRadius: 8, padding: "8px 10px", marginTop: 10, fontSize: 11, color: "#1E8449", fontWeight: 600, lineHeight: 1.5 }}>
        ✅ {t("2–3 दिनों में आराम न मिले तो डॉक्टर से मिलें।", "If no improvement in 2–3 days, consult a doctor.")}
      </div>
    </div>
  );

  return (
    <div style={{ background: "#0d1520", minHeight: "100vh", display: "flex", justifyContent: "center" }}>
      <div style={{ width: 390, background: C.bg, minHeight: "100vh", display: "flex", flexDirection: "column" }}>
        {/* Hero */}
        <div style={{ padding: "44px 16px 22px", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", background: GRAD[result.urgency] }}>
          {isOfflineMode && (
            <div style={{ background: "rgba(0,0,0,.3)", borderRadius: 8, padding: "4px 12px", fontSize: 11, fontWeight: 700, color: "rgba(255,255,255,.9)", marginBottom: 8, display: "inline-flex", alignItems: "center", gap: 4 }}>
              ⚡ {t("ऑफलाइन विश्लेषण", "Offline Analysis")}
            </div>
          )}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "10px 20px", borderRadius: 30, fontSize: 17, fontWeight: 800, color: "white", background: "rgba(255,255,255,.2)", border: "2px solid rgba(255,255,255,.4)", marginBottom: 10 }}>
            {result.urgency === "RED" ? "🔴" : result.urgency === "YELLOW" ? "🟡" : "🟢"} {result.urgency}
          </div>
          <div style={{ fontSize: 22, fontWeight: 800, color: "white" }}>{lang === "hi" ? result.conditionHi : result.conditionEn}</div>
          <div style={{ fontSize: 13, color: "rgba(255,255,255,.7)", marginTop: 4 }}>{lang === "hi" ? result.conditionEn : result.conditionHi}</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 10, justifyContent: "center" }}>
            {selectedSymptoms.map(id => {
              const s = SYMPTOMS_MAP[id];
              if (!s) return null;
              return <span key={id} style={{ background: "rgba(255,255,255,.15)", borderRadius: 8, padding: "4px 10px", fontSize: 11, color: "rgba(255,255,255,.85)" }}>{s.emoji} {lang === "hi" ? s.hi : s.en}</span>;
            })}
          </div>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "0 16px 150px" }}>

          {/* Patient context */}
          {detailData && (
            <div style={{ background: C.card, borderRadius: 16, padding: 14, marginTop: 12, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: .8, marginBottom: 10 }}>🩺 {t("रोगी की जानकारी", "Patient Context")}</div>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {detailData.duration && (
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "#EBF4FD", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>⏱️</div>
                    <div>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{t("कितने दिनों से", "Duration")}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                        {{ "1day": lang === "hi" ? "1 दिन" : "1 Day", "2-3days": lang === "hi" ? "2–3 दिन" : "2–3 Days", "4-7days": lang === "hi" ? "4–7 दिन" : "4–7 Days", "1-2weeks": lang === "hi" ? "1–2 हफ्ते" : "1–2 Weeks", "2weeks+": lang === "hi" ? "2+ हफ्ते" : "2+ Weeks" }[detailData.duration] || detailData.duration}
                      </div>
                    </div>
                  </div>
                )}
                {detailData.diseases && detailData.diseases.filter(d => d !== "none").length > 0 && (
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <div style={{ width: 30, height: 30, borderRadius: 8, background: "#FDEDED", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 16, flexShrink: 0 }}>🏥</div>
                    <div>
                      <div style={{ fontSize: 11, color: C.muted, fontWeight: 600 }}>{t("पुरानी बीमारियाँ", "Known Conditions")}</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                        {detailData.diseases.filter(d => d !== "none").map((d, i) => (
                          <span key={i} style={{ background: "#FDEDED", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#C0392B", fontWeight: 600 }}>{d}</span>
                        ))}
                        {detailData.otherDisease && (
                          <span style={{ background: "#FDEDED", borderRadius: 6, padding: "3px 8px", fontSize: 11, color: "#C0392B", fontWeight: 600 }}>{detailData.otherDisease}</span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── URGENCY-SPECIFIC SECTION ── */}
          {result.urgency === "RED" && <RedUrgencyPanel />}
          {result.urgency === "YELLOW" && <YellowUrgencyPanel />}
          {result.urgency === "GREEN" && <GreenRemediesPanel />}

          {/* Do Now / Do Not / Warnings */}
          {[
            { title: t("✅ अभी यह करें", "✅ Do This Now"), items: result.doNow, cross: false, numBg: C.bg, numColor: C.primary },
            { title: t("🚫 यह बिलकुल न करें", "🚫 Do NOT Do This"), items: result.doNot, cross: true, numBg: "#FDEDED", numColor: C.red },
            { title: t("⚠️ इन पर ध्यान दें", "⚠️ Watch For These"), items: result.warnings, cross: false, numBg: "#FEF9E7", numColor: "#B7770D" },
          ].map((section, si) => (
            <div key={si} style={{ background: C.card, borderRadius: 16, padding: 14, marginTop: 12, border: `1px solid ${C.border}` }}>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: .8, marginBottom: 10 }}>{section.title}</div>
              {section.items.map((item, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8, padding: "8px 0", borderBottom: i < section.items.length - 1 ? `1px solid ${C.border}` : "none" }}>
                  <div style={{ width: 22, height: 22, borderRadius: "50%", background: section.numBg, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 11, fontWeight: 800, color: section.numColor, flexShrink: 0, marginTop: 1 }}>
                    {section.cross ? "✗" : i + 1}
                  </div>
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{lang === "hi" ? item.hi : item.en}</div>
                    <div style={{ fontSize: 11, color: C.muted, marginTop: 2 }}>{lang === "hi" ? item.en : item.hi}</div>
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Info cards */}
          <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
            {[
              { label: t("डॉक्टर", "Doctor"), val: lang === "hi" ? result.docType.hi : result.docType.en },
              { label: t("प्रतीक्षा", "Wait"), val: lang === "hi" ? result.wait.hi : result.wait.en, red: result.urgency === "RED" },
              { label: t("संक्रामक?", "Contagious?"), val: lang === "hi" ? result.contagious.hi : result.contagious.en },
            ].map((info, i) => (
              <div key={i} style={{ flex: 1, background: C.card, borderRadius: 12, padding: 12, border: `1px solid ${C.border}` }}>
                <div style={{ fontSize: 10, color: C.muted, fontWeight: 600, textTransform: "uppercase" }}>{info.label}</div>
                <div style={{ fontSize: 12, fontWeight: 700, color: info.red ? C.red : C.text, marginTop: 4 }}>{info.val}</div>
              </div>
            ))}
          </div>

          {result.summary && (
            <div style={{ background: C.card, borderRadius: 16, padding: 14, marginTop: 12, border: `1px solid ${C.border}`, borderLeft: `4px solid ${C.primary}` }}>
              <div style={{ fontSize: 10, fontWeight: 800, color: C.muted, textTransform: "uppercase", letterSpacing: .8, marginBottom: 6 }}>🤖 AI Clinical Summary</div>
              <div style={{ fontSize: 13, color: C.text, lineHeight: 1.6, fontStyle: "italic" }}>{result.summary}</div>
            </div>
          )}
        </div>

        {/* Bottom actions — context-aware per urgency */}
        <div style={{ position: "fixed", bottom: 0, width: 390, background: C.card, borderTop: `2px solid ${C.border}`, padding: "10px 16px", display: "flex", flexDirection: "column", gap: 7, zIndex: 50 }}>
          {result.urgency === "RED" && (
            <a href="tel:108" style={{ background: "linear-gradient(135deg,#E74C3C,#922B21)", color: "white", padding: 14, borderRadius: 14, fontSize: 16, fontWeight: 900, display: "flex", alignItems: "center", justifyContent: "center", gap: 8, width: "100%", textDecoration: "none", animation: "epulse 1.5s infinite" }}>
              📞 {t("108 पर कॉल करें — आपातकाल", "Call 108 — Emergency Now")}
            </a>
          )}
          {result.urgency === "YELLOW" && (
            <button onClick={() => router.push("/confirm")} style={{ background: "linear-gradient(135deg,#E67E22,#B7770D)", color: "white", padding: 14, borderRadius: 14, fontSize: 15, fontWeight: 800, border: "none", cursor: "pointer", width: "100%" }}>
              📅 {t("डॉक्टर अपॉइंटमेंट बुक करें", "Book Doctor Appointment")}
            </button>
          )}
          {result.urgency === "GREEN" && (
            <div style={{ display: "flex", gap: 8 }}>
              <button onClick={() => router.push("/symptoms")} style={{ flex: 1, padding: 13, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: `linear-gradient(135deg,${C.green},#1A6B3A)`, color: "white" }}>
                🔄 {t("दोबारा जाँचें", "Check Again")}
              </button>
              <button onClick={() => router.push("/confirm")} style={{ flex: 1, padding: 13, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: `linear-gradient(135deg,${C.primary},${C.primaryDark})`, color: "white" }}>
                👨‍⚕️ {t("डॉक्टर से मिलें", "See Doctor")}
              </button>
            </div>
          )}
          <button onClick={() => router.push("/report")} style={{ width: "100%", padding: 12, borderRadius: 14, border: "none", cursor: "pointer", fontWeight: 700, fontSize: 13, background: `linear-gradient(135deg,#8E44AD,#6C3483)`, color: "white" }}>
            📄 {t("रिपोर्ट देखें / डाउनलोड करें", "View / Download Report")}
          </button>
        </div>
        <style>{`@keyframes epulse{0%,100%{box-shadow:0 4px 16px rgba(231,76,60,.5)}50%{box-shadow:0 4px 32px rgba(231,76,60,.9)}}`}</style>
      </div>
    </div>
  );
}
