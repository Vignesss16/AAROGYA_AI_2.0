export type Urgency = "RED" | "YELLOW" | "GREEN";

export interface BilingualText {
  hi: string;
  en: string;
}

export interface TriageResult {
  urgency: Urgency;
  conditionHi: string;
  conditionEn: string;
  doNow: BilingualText[];
  doNot: BilingualText[];
  warnings: BilingualText[];
  docType: BilingualText;
  wait: BilingualText;
  contagious: BilingualText;
  emergency: boolean;
  summary: string;
  homeRemedies?: Array<{ remedy: string; hi: string; en: string; icon: string }>;
}

interface TriageRule {
  required: string[];       // ALL must be present to match
  boosters?: string[];      // ANY of these escalates urgency to RED
  urgency: Urgency;
  conditionHi: string;
  conditionEn: string;
  doNow: BilingualText[];
  doNot: BilingualText[];
  warnings: BilingualText[];
  docType: BilingualText;
  wait: BilingualText;
  contagious: BilingualText;
  emergency: boolean;
  summary: string;
}

const TRIAGE_RULES: TriageRule[] = [

  // ── RED ─────────────────────────────────────────────

  {
    required: ["chest", "breath"],
    urgency: "RED",
    conditionHi: "संभावित हृदय आपातकाल",
    conditionEn: "Possible Cardiac Emergency",
    doNow: [
      { hi: "तुरंत लेट जाएं — बिल्कुल न हिलें", en: "Lie down immediately — do not move" },
      { hi: "108 पर अभी कॉल करें", en: "Call 108 right now — Ambulance" },
      { hi: "किसी को तुरंत बुलाएं", en: "Call someone immediately" },
    ],
    doNot: [
      { hi: "खाना या पानी बिल्कुल न दें", en: "Do not give food or water" },
      { hi: "अकेले न छोड़ें", en: "Do not leave alone" },
      { hi: "चलने की कोशिश न करें", en: "Do not try to walk" },
    ],
    warnings: [
      { hi: "होंठ या नाखून नीले पड़ें", en: "Lips or nails turning blue" },
      { hi: "बेहोशी आने लगे", en: "Signs of losing consciousness" },
      { hi: "बायें हाथ में दर्द", en: "Pain spreading to left arm" },
    ],
    docType: { hi: "आपातकालीन / हृदय रोग विशेषज्ञ", en: "Emergency / Cardiologist" },
    wait: { hi: "तुरंत — एक मिनट भी न रुकें", en: "Immediately — zero delay" },
    contagious: { hi: "नहीं", en: "No" },
    emergency: true,
    summary: "Chest pain with breathlessness — possible cardiac emergency. Call 108 immediately.",
  },

  {
    required: ["chest", "sweat"],
    urgency: "RED",
    conditionHi: "संभावित दिल का दौरा",
    conditionEn: "Possible Heart Attack",
    doNow: [
      { hi: "तुरंत लेट जाएं", en: "Lie down immediately" },
      { hi: "108 पर कॉल करें", en: "Call 108 now" },
      { hi: "कपड़े ढीले करें", en: "Loosen tight clothing" },
    ],
    doNot: [
      { hi: "खाना या पानी न दें", en: "Do not give food or water" },
      { hi: "अकेले न छोड़ें", en: "Do not leave alone" },
    ],
    warnings: [
      { hi: "बेहोशी आए", en: "Loss of consciousness" },
      { hi: "सांस बंद होने लगे", en: "Breathing stops" },
    ],
    docType: { hi: "हृदय रोग विशेषज्ञ", en: "Cardiologist" },
    wait: { hi: "तुरंत", en: "Immediately — 0 minutes" },
    contagious: { hi: "नहीं", en: "No" },
    emergency: true,
    summary: "Chest pain with sweating — possible heart attack. Emergency care immediately.",
  },

  {
    required: ["breath"],
    urgency: "RED",
    conditionHi: "गंभीर सांस की तकलीफ",
    conditionEn: "Severe Breathing Difficulty",
    doNow: [
      { hi: "सीधे बैठें — लेटें नहीं", en: "Sit upright — do not lie flat" },
      { hi: "108 पर कॉल करें", en: "Call 108 immediately" },
      { hi: "खिड़की खोलें — ताज़ी हवा दें", en: "Open windows — allow fresh air" },
    ],
    doNot: [
      { hi: "लेटाएं नहीं", en: "Do not make them lie flat" },
      { hi: "घबराएं नहीं", en: "Do not panic — stay calm" },
    ],
    warnings: [
      { hi: "होंठ नीले पड़ें", en: "Lips turning blue" },
      { hi: "बात करने में तकलीफ", en: "Difficulty speaking" },
    ],
    docType: { hi: "आपातकालीन चिकित्सक", en: "Emergency Doctor" },
    wait: { hi: "तुरंत", en: "Immediately" },
    contagious: { hi: "नहीं", en: "No" },
    emergency: true,
    summary: "Severe breathlessness — respiratory emergency. Call 108 immediately.",
  },

  {
    required: ["fever", "rash", "headache"],
    urgency: "RED",
    conditionHi: "संभावित डेंगू / मेनिनजाइटिस",
    conditionEn: "Possible Dengue / Meningitis",
    doNow: [
      { hi: "तुरंत अस्पताल जाएं", en: "Go to hospital immediately" },
      { hi: "ORS या नारियल पानी दें", en: "Give ORS or coconut water" },
      { hi: "मरीज़ को अलग कमरे में रखें", en: "Keep patient in separate room" },
    ],
    doNot: [
      { hi: "Aspirin या Ibuprofen न दें", en: "Do not give Aspirin or Ibuprofen" },
      { hi: "अकेला न छोड़ें", en: "Do not leave alone" },
    ],
    warnings: [
      { hi: "दाने फैलने लगें", en: "Rash spreading rapidly" },
      { hi: "गर्दन अकड़ जाए", en: "Stiffness in neck" },
      { hi: "रोशनी से परेशानी हो", en: "Sensitivity to light" },
    ],
    docType: { hi: "आपातकालीन / संक्रामक रोग विशेषज्ञ", en: "Emergency / Infectious Disease" },
    wait: { hi: "तुरंत — आज ही अस्पताल", en: "Immediately — hospital today" },
    contagious: { hi: "हो सकता है", en: "Possibly yes" },
    emergency: true,
    summary: "Fever + rash + headache — possible dengue or meningitis. Hospital immediately.",
  },

  {
    required: ["vomit", "diarrhea", "dizzy", "weakness"],
    urgency: "RED",
    conditionHi: "गंभीर निर्जलीकरण",
    conditionEn: "Severe Dehydration",
    doNow: [
      { hi: "ORS घोल हर 5 मिनट में थोड़ा-थोड़ा दें", en: "Give ORS every 5 minutes in small sips" },
      { hi: "नारियल पानी दें", en: "Give coconut water" },
      { hi: "आज अस्पताल जाएं — IV drip ज़रूरी", en: "Hospital today — IV drip needed" },
    ],
    doNot: [
      { hi: "ठंडा पानी एक बार में ज़्यादा न दें", en: "Do not give large amounts of cold water at once" },
      { hi: "दूध या तेल वाला खाना न दें", en: "Do not give milk or oily food" },
    ],
    warnings: [
      { hi: "पेशाब बंद हो जाए", en: "Urination stops completely" },
      { hi: "आँखें धँस जाएं", en: "Eyes appear sunken" },
      { hi: "बेहोशी आने लगे", en: "Signs of losing consciousness" },
    ],
    docType: { hi: "सामान्य चिकित्सक / आपातकाल", en: "General Physician / Emergency" },
    wait: { hi: "आज — 2 घंटे में", en: "Today — within 2 hours" },
    contagious: { hi: "हो सकता है", en: "Possibly" },
    emergency: true,
    summary: "Severe dehydration — multiple symptoms present. Hospital urgently needed.",
  },

  {
    required: ["unconscious"],
    urgency: "RED",
    conditionHi: "बेहोशी — आपातकाल",
    conditionEn: "Unconsciousness — Emergency",
    doNow: [
      { hi: "तुरंत 108 पर कॉल करें", en: "Call 108 immediately" },
      { hi: "करवट से लिटाएं — पीठ पर नहीं", en: "Lay on side — not on back" },
      { hi: "मुँह में कुछ न डालें", en: "Do not put anything in mouth" },
    ],
    doNot: [
      { hi: "हिलाएं या झकझोरें नहीं", en: "Do not shake or jolt" },
      { hi: "पानी न पिलाएं", en: "Do not give water" },
    ],
    warnings: [
      { hi: "सांस बंद हो जाए", en: "Breathing stops" },
      { hi: "दौरे आने लगें", en: "Seizures begin" },
    ],
    docType: { hi: "आपातकालीन चिकित्सक", en: "Emergency Doctor" },
    wait: { hi: "तुरंत — 0 मिनट", en: "Immediately — 0 minutes" },
    contagious: { hi: "नहीं", en: "No" },
    emergency: true,
    summary: "Unconsciousness — life-threatening. Call 108 immediately.",
  },

  {
    required: ["seizure"],
    urgency: "RED",
    conditionHi: "दौरा / मिर्गी — आपातकाल",
    conditionEn: "Seizure — Emergency",
    doNow: [
      { hi: "आस-पास की चीज़ें हटाएं", en: "Remove nearby objects to prevent injury" },
      { hi: "करवट से लिटाएं", en: "Turn on their side" },
      { hi: "108 पर कॉल करें", en: "Call 108 now" },
    ],
    doNot: [
      { hi: "मुँह में कुछ न डालें", en: "Do not put anything in mouth" },
      { hi: "दबाकर न पकड़ें", en: "Do not restrain forcefully" },
    ],
    warnings: [
      { hi: "दौरा 5 मिनट से ज़्यादा चले", en: "Seizure lasts more than 5 minutes" },
      { hi: "बेहोशी बनी रहे", en: "Remains unconscious after seizure" },
    ],
    docType: { hi: "न्यूरोलॉजिस्ट / आपातकाल", en: "Neurologist / Emergency" },
    wait: { hi: "तुरंत", en: "Immediately" },
    contagious: { hi: "नहीं", en: "No" },
    emergency: true,
    summary: "Seizure — neurological emergency. Call 108, ensure patient safety.",
  },

  {
    required: ["bleed"],
    urgency: "RED",
    conditionHi: "गंभीर रक्तस्राव",
    conditionEn: "Severe Bleeding",
    doNow: [
      { hi: "साफ कपड़े से दबाव डालें", en: "Apply firm pressure with clean cloth" },
      { hi: "108 पर कॉल करें", en: "Call 108 immediately" },
      { hi: "लिटा दें और पैर ऊपर करें", en: "Lay down and raise legs" },
    ],
    doNot: [
      { hi: "कपड़ा बार-बार न हटाएं", en: "Do not remove the cloth repeatedly" },
      { hi: "घाव साफ करने की कोशिश न करें", en: "Do not attempt to clean the wound" },
    ],
    warnings: [
      { hi: "खून न रुके", en: "Bleeding does not stop" },
      { hi: "मरीज़ पीला पड़ जाए", en: "Patient becomes pale or faint" },
    ],
    docType: { hi: "आपातकालीन / सर्जन", en: "Emergency / Surgeon" },
    wait: { hi: "तुरंत", en: "Immediately" },
    contagious: { hi: "नहीं", en: "No" },
    emergency: true,
    summary: "Severe bleeding — apply pressure and call 108 immediately.",
  },

  // ── YELLOW ───────────────────────────────────────────

  {
    required: ["fever", "chills"],
    urgency: "YELLOW",
    conditionHi: "संभावित मलेरिया / वायरल बुखार",
    conditionEn: "Possible Malaria / Viral Fever",
    doNow: [
      { hi: "Paracetamol लें", en: "Take Paracetamol" },
      { hi: "ORS या नींबू पानी पिएं", en: "Drink ORS or lemon water" },
      { hi: "आज मलेरिया टेस्ट करवाएं", en: "Get malaria test today" },
    ],
    doNot: [
      { hi: "Aspirin न लें", en: "Do not take Aspirin" },
      { hi: "भारी काम न करें", en: "Avoid heavy activity" },
    ],
    warnings: [
      { hi: "बुखार 103°F से ऊपर जाए", en: "Fever above 103°F" },
      { hi: "तेज़ सिरदर्द और उल्टी आए", en: "Severe headache and vomiting" },
    ],
    docType: { hi: "सामान्य चिकित्सक", en: "General Physician" },
    wait: { hi: "आज — 4 घंटे में", en: "Today — within 4 hours" },
    contagious: { hi: "नहीं (मच्छर से)", en: "No (via mosquito)" },
    emergency: false,
    summary: "Fever with chills — possible malaria. Doctor and blood test today.",
  },

  {
    required: ["fever", "rash"],
    urgency: "YELLOW",
    conditionHi: "संभावित डेंगू",
    conditionEn: "Possible Dengue / Viral Infection",
    doNow: [
      { hi: "खूब पानी और ORS पिएं", en: "Drink plenty of water and ORS" },
      { hi: "डेंगू टेस्ट करवाएं", en: "Get dengue blood test today" },
      { hi: "मच्छरदानी लगाएं", en: "Use mosquito net" },
    ],
    doNot: [
      { hi: "Aspirin या Ibuprofen न लें", en: "Do not take Aspirin or Ibuprofen" },
      { hi: "खुद एंटीबायोटिक न लें", en: "Do not self-medicate with antibiotics" },
    ],
    warnings: [
      { hi: "मसूढ़ों से खून आए", en: "Bleeding from gums" },
      { hi: "पेट में तेज़ दर्द", en: "Severe stomach pain" },
      { hi: "दाने तेज़ी से फैलें", en: "Rash spreading rapidly" },
    ],
    docType: { hi: "सामान्य चिकित्सक", en: "General Physician" },
    wait: { hi: "आज — 3 घंटे में", en: "Today — within 3 hours" },
    contagious: { hi: "नहीं (मच्छर से)", en: "No (via mosquito)" },
    emergency: false,
    summary: "Fever with rash — possible dengue. Doctor and blood test needed today.",
  },

  {
    required: ["fever", "cough", "breath"],
    urgency: "YELLOW",
    conditionHi: "संभावित निमोनिया",
    conditionEn: "Possible Pneumonia",
    doNow: [
      { hi: "आज डॉक्टर से मिलें — X-ray हो सकता है", en: "See doctor today — chest X-ray may be needed" },
      { hi: "भाप लें", en: "Do steam inhalation" },
      { hi: "गर्म पानी पिएं", en: "Drink warm water and fluids" },
    ],
    doNot: [
      { hi: "ठंडी चीज़ें न लें", en: "Avoid cold food and drinks" },
      { hi: "ठंड में बाहर न जाएं", en: "Do not go out in cold" },
    ],
    warnings: [
      { hi: "सांस में ज़्यादा तकलीफ हो", en: "Breathing becomes more difficult" },
      { hi: "खाँसी में खून आए", en: "Blood in cough" },
    ],
    docType: { hi: "सामान्य चिकित्सक / छाती रोग विशेषज्ञ", en: "General Physician / Chest Specialist" },
    wait: { hi: "आज — 2 घंटे में", en: "Today — within 2 hours" },
    contagious: { hi: "हाँ — मास्क लगाएं", en: "Yes — wear a mask" },
    emergency: false,
    summary: "Fever + cough + breathlessness — possible pneumonia. See doctor today.",
  },

  {
    required: ["fever", "headache", "vomit"],
    urgency: "YELLOW",
    conditionHi: "संभावित टाइफाइड",
    conditionEn: "Possible Typhoid / Severe Viral",
    doNow: [
      { hi: "Widal test करवाएं", en: "Get Widal test for typhoid" },
      { hi: "उबला पानी पिएं", en: "Drink only boiled water" },
      { hi: "हल्का खाना खाएं", en: "Eat light food — dal, khichdi" },
    ],
    doNot: [
      { hi: "बाहर का खाना न खाएं", en: "Avoid outside food completely" },
      { hi: "खुद एंटीबायोटिक न लें", en: "Do not self-medicate with antibiotics" },
    ],
    warnings: [
      { hi: "बुखार 7 दिन से ज़्यादा रहे", en: "Fever persists more than 7 days" },
      { hi: "पेट में बहुत दर्द हो", en: "Severe stomach pain develops" },
    ],
    docType: { hi: "सामान्य चिकित्सक", en: "General Physician" },
    wait: { hi: "आज — 3 घंटे में", en: "Today — within 3 hours" },
    contagious: { hi: "हाँ — हाथ धोएं", en: "Yes — wash hands frequently" },
    emergency: false,
    summary: "Fever + headache + vomiting — possible typhoid. Doctor and Widal test today.",
  },

  {
    required: ["fever", "body_ache"],
    urgency: "YELLOW",
    conditionHi: "वायरल बुखार / फ्लू",
    conditionEn: "Viral Fever / Flu",
    doNow: [
      { hi: "Paracetamol 500mg लें", en: "Take Paracetamol 500mg" },
      { hi: "आराम करें और खूब पानी पिएं", en: "Rest and drink plenty of water" },
      { hi: "2 दिन में न सुधरे तो डॉक्टर से मिलें", en: "See doctor if not improved in 2 days" },
    ],
    doNot: [
      { hi: "Aspirin न लें", en: "Do not take Aspirin" },
      { hi: "भारी काम न करें", en: "Avoid heavy work" },
    ],
    warnings: [
      { hi: "बुखार 103°F से ऊपर", en: "Fever exceeds 103°F" },
      { hi: "3 दिन में सुधार न हो", en: "No improvement after 3 days" },
    ],
    docType: { hi: "सामान्य चिकित्सक", en: "General Physician" },
    wait: { hi: "2 दिन देखें", en: "Monitor for 2 days" },
    contagious: { hi: "हाँ", en: "Yes" },
    emergency: false,
    summary: "Viral fever with body ache. Rest, Paracetamol and fluids.",
  },

  {
    required: ["fever", "cough"],
    urgency: "YELLOW",
    conditionHi: "वायरल बुखार और खाँसी",
    conditionEn: "Viral Fever with Cough",
    doNow: [
      { hi: "Paracetamol लें", en: "Take Paracetamol for fever" },
      { hi: "भाप लें", en: "Take steam for cough" },
      { hi: "गर्म नमक-हल्दी पानी से गरारे करें", en: "Gargle with warm salt-turmeric water" },
    ],
    doNot: [
      { hi: "ठंडा पानी न पिएं", en: "Do not drink cold water" },
      { hi: "धूल-धुएं से बचें", en: "Stay away from dust and smoke" },
    ],
    warnings: [
      { hi: "खाँसी में खून आए", en: "Blood in cough" },
      { hi: "सांस में तकलीफ हो", en: "Breathing difficulty develops" },
    ],
    docType: { hi: "सामान्य चिकित्सक", en: "General Physician" },
    wait: { hi: "24 घंटे में", en: "Within 24 hours" },
    contagious: { hi: "हाँ — मास्क लगाएं", en: "Yes — wear a mask" },
    emergency: false,
    summary: "Fever with cough — viral infection. See doctor within 24 hours.",
  },

  {
    required: ["vomit", "diarrhea"],
    urgency: "YELLOW",
    conditionHi: "गैस्ट्रोएंटेराइटिस / फूड पॉइज़निंग",
    conditionEn: "Gastroenteritis / Food Poisoning",
    doNow: [
      { hi: "ORS हर 15 मिनट में पिएं", en: "Drink ORS every 15 minutes" },
      { hi: "नारियल पानी और नींबू पानी पिएं", en: "Drink coconut water and lemon water" },
      { hi: "हल्का खाना — दाल, चावल", en: "Light food — dal and rice only" },
    ],
    doNot: [
      { hi: "तेल, मिर्च न खाएं", en: "Avoid oily and spicy food" },
      { hi: "दूध न लें", en: "Avoid milk and dairy" },
    ],
    warnings: [
      { hi: "पेशाब बहुत कम हो जाए", en: "Urination reduces significantly" },
      { hi: "दस्त में खून आए", en: "Blood in stool" },
      { hi: "बहुत कमज़ोरी हो", en: "Extreme weakness" },
    ],
    docType: { hi: "सामान्य चिकित्सक", en: "General Physician" },
    wait: { hi: "आज — 4 घंटे में", en: "Today — within 4 hours" },
    contagious: { hi: "हाँ — हाथ धोएं", en: "Yes — wash hands" },
    emergency: false,
    summary: "Vomiting + diarrhea — gastroenteritis. ORS fluids and doctor today.",
  },

  {
    required: ["urine_burn"],
    urgency: "YELLOW",
    conditionHi: "मूत्र संक्रमण (UTI)",
    conditionEn: "Urinary Tract Infection (UTI)",
    doNow: [
      { hi: "खूब पानी पिएं — 3 लीटर रोज़", en: "Drink plenty of water — 3 litres daily" },
      { hi: "आज urine test करवाएं", en: "Get urine test today" },
    ],
    doNot: [
      { hi: "पेशाब रोककर न रखें", en: "Do not hold urine" },
      { hi: "मसालेदार खाना न खाएं", en: "Avoid spicy food" },
    ],
    warnings: [
      { hi: "बुखार भी हो जाए", en: "Fever develops" },
      { hi: "कमर में दर्द हो", en: "Lower back pain develops" },
    ],
    docType: { hi: "सामान्य चिकित्सक", en: "General Physician" },
    wait: { hi: "आज", en: "Today" },
    contagious: { hi: "नहीं", en: "No" },
    emergency: false,
    summary: "Burning urination — likely UTI. Hydration and doctor visit today.",
  },

  {
    required: ["chest"],
    urgency: "RED",
    conditionHi: "सीने में दर्द — हृदय आपातकाल संभव",
    conditionEn: "Chest Pain — Possible Cardiac Emergency",
    doNow: [
      { hi: "तुरंत लेट जाएं — बिल्कुल न हिलें", en: "Lie down immediately — do not exert" },
      { hi: "108 पर अभी कॉल करें", en: "Call 108 right now — do not wait" },
      { hi: "Aspirin 325mg चबाएं — अगर एलर्जी न हो", en: "Chew Aspirin 325mg — if not allergic" },
    ],
    doNot: [
      { hi: "अनदेखा बिल्कुल न करें", en: "Never ignore chest pain — could be a heart attack" },
      { hi: "अकेले न रहें — किसी को बुलाएं", en: "Do not stay alone — call someone immediately" },
    ],
    warnings: [
      { hi: "दर्द बाएं हाथ या जबड़े में फैले", en: "Pain spreading to left arm, jaw or shoulder" },
      { hi: "सांस में तकलीफ शुरू हो", en: "Breathing difficulty starts" },
      { hi: "पसीना या बेहोशी आए", en: "Sweating or dizziness occurs" },
    ],
    docType: { hi: "हृदय रोग विशेषज्ञ / आपातकाल", en: "Cardiologist / Emergency" },
    wait: { hi: "तुरंत — एक मिनट भी नहीं", en: "Immediately — zero delay" },
    contagious: { hi: "नहीं", en: "No" },
    emergency: true,
    summary: "Chest pain — possible cardiac emergency. Call 108 and chew Aspirin immediately.",
  },

  {
    required: ["headache", "fever"],
    urgency: "YELLOW",
    conditionHi: "वायरल बुखार और सिरदर्द",
    conditionEn: "Viral Fever with Headache",
    doNow: [
      { hi: "Paracetamol लें", en: "Take Paracetamol" },
      { hi: "अँधेरे में आराम करें", en: "Rest in a dark quiet room" },
      { hi: "खूब पानी पिएं", en: "Drink plenty of water" },
    ],
    doNot: [
      { hi: "तेज़ रोशनी में न रहें", en: "Avoid bright lights" },
      { hi: "Aspirin न लें", en: "Do not take Aspirin" },
    ],
    warnings: [
      { hi: "गर्दन अकड़ जाए", en: "Neck becomes stiff" },
      { hi: "उल्टी भी आए", en: "Vomiting also starts" },
      { hi: "रोशनी से आँखें दुखें", en: "Eyes hurt in light" },
    ],
    docType: { hi: "सामान्य चिकित्सक", en: "General Physician" },
    wait: { hi: "24 घंटे में", en: "Within 24 hours" },
    contagious: { hi: "हो सकता है", en: "Possibly" },
    emergency: false,
    summary: "Fever with headache — viral illness. Rest and see doctor within 24 hours.",
  },

  {
    required: ["stomach", "fever"],
    urgency: "YELLOW",
    conditionHi: "पेट संक्रमण / एपेंडिसाइटिस संभव",
    conditionEn: "Stomach Infection / Possible Appendicitis",
    doNow: [
      { hi: "आज डॉक्टर से मिलें", en: "See doctor today" },
      { hi: "हल्का खाना और पानी लें", en: "Light food and water only" },
    ],
    doNot: [
      { hi: "दर्द निवारक खुद न लें", en: "Do not self-medicate with painkillers" },
      { hi: "पेट पर गर्म सिकाई न करें", en: "Do not apply heat to stomach" },
    ],
    warnings: [
      { hi: "दर्द नाभि से दाईं तरफ जाए", en: "Pain moves to lower right (appendix sign)" },
      { hi: "दर्द बहुत तेज़ हो जाए", en: "Pain becomes very severe" },
    ],
    docType: { hi: "सामान्य चिकित्सक / सर्जन", en: "General Physician / Surgeon" },
    wait: { hi: "आज", en: "Today" },
    contagious: { hi: "नहीं", en: "No" },
    emergency: false,
    summary: "Stomach pain with fever — possible infection or appendicitis. Doctor today.",
  },

  {
    required: ["headache", "vomit"],
    urgency: "YELLOW",
    conditionHi: "माइग्रेन या गंभीर सिरदर्द",
    conditionEn: "Migraine or Severe Headache",
    doNow: [
      { hi: "अँधेरे में आराम करें", en: "Rest in dark quiet room" },
      { hi: "माथे पर ठंडी पट्टी रखें", en: "Apply cold compress on forehead" },
      { hi: "आज डॉक्टर से मिलें", en: "See doctor today" },
    ],
    doNot: [
      { hi: "तेज़ रोशनी और शोर से बचें", en: "Avoid bright light and noise" },
      { hi: "खाली पेट न रहें", en: "Do not stay empty stomach" },
    ],
    warnings: [
      { hi: "अचानक बहुत तेज़ सिरदर्द", en: "Sudden very severe headache" },
      { hi: "बुखार या दाने भी हों", en: "Fever or rash also present" },
    ],
    docType: { hi: "सामान्य चिकित्सक / न्यूरोलॉजिस्ट", en: "General Physician / Neurologist" },
    wait: { hi: "24 घंटे में", en: "Within 24 hours" },
    contagious: { hi: "नहीं", en: "No" },
    emergency: false,
    summary: "Headache with vomiting — possible migraine. Rest and see doctor today.",
  },

  {
    required: ["dizzy", "weakness"],
    urgency: "YELLOW",
    conditionHi: "निम्न रक्तचाप / एनीमिया संभव",
    conditionEn: "Low Blood Pressure / Possible Anaemia",
    doNow: [
      { hi: "तुरंत लेट जाएं और पैर ऊपर करें", en: "Lie down and raise legs immediately" },
      { hi: "ORS या नमक-चीनी पानी पिएं", en: "Drink ORS or salt-sugar water" },
      { hi: "आज डॉक्टर से मिलें", en: "See doctor today" },
    ],
    doNot: [
      { hi: "अचानक खड़े न हों", en: "Do not stand up suddenly" },
      { hi: "खाली पेट न रहें", en: "Do not stay empty stomach" },
    ],
    warnings: [
      { hi: "बेहोशी आने लगे", en: "Signs of fainting" },
      { hi: "दिल की धड़कन बहुत तेज़ या धीमी हो", en: "Heart rate very fast or slow" },
    ],
    docType: { hi: "सामान्य चिकित्सक", en: "General Physician" },
    wait: { hi: "आज", en: "Today" },
    contagious: { hi: "नहीं", en: "No" },
    emergency: false,
    summary: "Dizziness + weakness — possible low BP or anaemia. Doctor visit today.",
  },

  {
    required: ["fever"],
    urgency: "YELLOW",
    conditionHi: "बुखार — ध्यान ज़रूरी",
    conditionEn: "Fever — Needs Attention",
    doNow: [
      { hi: "Paracetamol 500mg लें", en: "Take Paracetamol 500mg" },
      { hi: "खूब पानी और ORS पिएं", en: "Drink plenty of water and ORS" },
      { hi: "माथे पर ठंडी पट्टी रखें", en: "Apply cold compress on forehead" },
    ],
    doNot: [
      { hi: "Aspirin न लें", en: "Do not take Aspirin" },
      { hi: "गर्म कपड़े ज़्यादा न पहनें", en: "Do not wear too many warm clothes" },
    ],
    warnings: [
      { hi: "बुखार 103°F से ऊपर जाए", en: "Fever goes above 103°F" },
      { hi: "2 दिन में सुधार न हो", en: "No improvement in 2 days" },
    ],
    docType: { hi: "सामान्य चिकित्सक", en: "General Physician" },
    wait: { hi: "24 घंटे में", en: "Within 24 hours" },
    contagious: { hi: "हो सकता है", en: "Possibly" },
    emergency: false,
    summary: "Fever alone — Paracetamol and fluids. Doctor if not improved in 24 hours.",
  },

  // ── GREEN ────────────────────────────────────────────

  {
    required: ["headache"],
    urgency: "GREEN",
    conditionHi: "सामान्य सिरदर्द",
    conditionEn: "Common Headache",
    doNow: [
      { hi: "खूब पानी पिएं", en: "Drink plenty of water" },
      { hi: "Paracetamol 500mg ले सकते हैं", en: "Take Paracetamol 500mg if needed" },
      { hi: "अँधेरे में 1-2 घंटे आराम करें", en: "Rest in a dark room for 1-2 hours" },
    ],
    doNot: [
      { hi: "स्क्रीन से दूर रहें", en: "Avoid screens (mobile, TV)" },
      { hi: "ज़्यादा दर्द निवारक न लें", en: "Do not overuse painkillers" },
    ],
    warnings: [
      { hi: "बुखार भी आए", en: "Fever also develops" },
      { hi: "3 दिन में सुधार न हो", en: "No improvement in 3 days" },
    ],
    docType: { hi: "सामान्य चिकित्सक (ज़रूरत पड़े तो)", en: "General Physician (if needed)" },
    wait: { hi: "2-3 दिन देखें", en: "Monitor for 2-3 days" },
    contagious: { hi: "नहीं", en: "No" },
    emergency: false,
    summary: "Common headache — rest, hydration and Paracetamol should help.",
  },

  {
    required: ["cold"],
    urgency: "GREEN",
    conditionHi: "सामान्य जुकाम",
    conditionEn: "Common Cold",
    doNow: [
      { hi: "गर्म पानी में शहद-नींबू मिलाकर पिएं", en: "Drink warm water with honey and lemon" },
      { hi: "भाप लें", en: "Take steam inhalation" },
      { hi: "पर्याप्त आराम करें", en: "Take adequate rest" },
    ],
    doNot: [
      { hi: "ठंडा पानी और आइसक्रीम न लें", en: "Avoid cold water and ice cream" },
      { hi: "धूल-धुएं से बचें", en: "Avoid dust and smoke" },
    ],
    warnings: [
      { hi: "बुखार आ जाए", en: "Fever develops" },
      { hi: "1 हफ्ते में सुधार न हो", en: "No improvement in 1 week" },
    ],
    docType: { hi: "सामान्य चिकित्सक (ज़रूरत पड़े तो)", en: "General Physician (if needed)" },
    wait: { hi: "5-7 दिन देखें", en: "Monitor for 5-7 days" },
    contagious: { hi: "हाँ — हाथ धोएं", en: "Yes — wash hands" },
    emergency: false,
    summary: "Common cold — home remedies, steam and rest recommended.",
  },

  {
    required: ["cough"],
    urgency: "GREEN",
    conditionHi: "सामान्य खाँसी",
    conditionEn: "Common Cough",
    doNow: [
      { hi: "गर्म पानी में शहद मिलाकर पिएं", en: "Drink warm water with honey" },
      { hi: "दिन में 2 बार भाप लें", en: "Take steam twice daily" },
      { hi: "नमक के गर्म पानी से गरारे करें", en: "Gargle with warm salt water" },
    ],
    doNot: [
      { hi: "ठंडी चीज़ें न लें", en: "Avoid cold food and drinks" },
      { hi: "धुएं और धूल से बचें", en: "Avoid smoke and dust" },
    ],
    warnings: [
      { hi: "खाँसी में खून आए", en: "Blood in cough" },
      { hi: "बुखार भी आए", en: "Fever also develops" },
      { hi: "2 हफ्ते में सुधार न हो", en: "No improvement in 2 weeks" },
    ],
    docType: { hi: "सामान्य चिकित्सक (ज़रूरत पड़े तो)", en: "General Physician (if needed)" },
    wait: { hi: "5-7 दिन देखें", en: "Monitor for 5-7 days" },
    contagious: { hi: "हो सकता है", en: "Possibly" },
    emergency: false,
    summary: "Common cough — steam, honey-water and rest recommended.",
  },

  {
    required: ["back"],
    urgency: "GREEN",
    conditionHi: "सामान्य कमर दर्द",
    conditionEn: "Common Back Pain",
    doNow: [
      { hi: "गर्म सिकाई करें — 15 मिनट, दिन में 2 बार", en: "Apply heat — 15 min, twice daily" },
      { hi: "Paracetamol ले सकते हैं", en: "Take Paracetamol if needed" },
      { hi: "सीधे बैठें", en: "Sit straight — avoid slouching" },
    ],
    doNot: [
      { hi: "भारी वज़न न उठाएं", en: "Do not lift heavy weights" },
      { hi: "देर तक एक पोज़िशन में न रहें", en: "Do not stay in one position too long" },
    ],
    warnings: [
      { hi: "टाँगों में सुन्नपन हो", en: "Numbness in legs" },
      { hi: "पेशाब-शौच में दिक्कत हो", en: "Problems with urination or bowels" },
    ],
    docType: { hi: "सामान्य चिकित्सक / हड्डी रोग विशेषज्ञ", en: "General Physician / Orthopedic" },
    wait: { hi: "3-5 दिन देखें", en: "Monitor for 3-5 days" },
    contagious: { hi: "नहीं", en: "No" },
    emergency: false,
    summary: "Common back pain — heat therapy, rest and Paracetamol recommended.",
  },

  {
    required: ["eyes"],
    urgency: "GREEN",
    conditionHi: "आँखों की जलन / कंजंक्टिवाइटिस",
    conditionEn: "Eye Irritation / Conjunctivitis",
    doNow: [
      { hi: "साफ ठंडे पानी से आँखें धोएं", en: "Wash eyes with clean cold water" },
      { hi: "आँखें न मलें", en: "Do not rub your eyes" },
      { hi: "डॉक्टर से eye drops लें", en: "Get eye drops from doctor" },
    ],
    doNot: [
      { hi: "आँखें बिल्कुल न मलें", en: "Do not rub eyes at all" },
      { hi: "तकिया-तौलिया शेयर न करें", en: "Do not share pillow or towel" },
    ],
    warnings: [
      { hi: "दिखना कम हो जाए", en: "Vision becomes blurry" },
      { hi: "तेज़ दर्द हो", en: "Severe pain in eye" },
    ],
    docType: { hi: "नेत्र रोग विशेषज्ञ", en: "Eye Specialist / Ophthalmologist" },
    wait: { hi: "2-3 दिन देखें", en: "Monitor for 2-3 days" },
    contagious: { hi: "हाँ — हाथ धोएं", en: "Yes — wash hands frequently" },
    emergency: false,
    summary: "Eye irritation — likely conjunctivitis. Rinse and see eye doctor.",
  },

  {
    required: ["stomach"],
    urgency: "GREEN",
    conditionHi: "हल्का पेट दर्द / अपच",
    conditionEn: "Mild Stomach Pain / Indigestion",
    doNow: [
      { hi: "गर्म पानी पिएं", en: "Drink warm water" },
      { hi: "हल्का खाना खाएं — दाल, खिचड़ी", en: "Eat light food — dal, khichdi" },
      { hi: "थोड़ा टहलें", en: "Take a short walk — aids digestion" },
    ],
    doNot: [
      { hi: "तेल-मिर्च भारी खाना न खाएं", en: "Avoid oily, spicy and heavy food" },
      { hi: "खाने के तुरंत बाद न लेटें", en: "Do not lie down immediately after eating" },
    ],
    warnings: [
      { hi: "दर्द बहुत तेज़ हो जाए", en: "Pain becomes very severe" },
      { hi: "बुखार भी आए", en: "Fever also develops" },
    ],
    docType: { hi: "सामान्य चिकित्सक (ज़रूरत पड़े तो)", en: "General Physician (if needed)" },
    wait: { hi: "2-3 दिन देखें", en: "Monitor for 2-3 days" },
    contagious: { hi: "नहीं", en: "No" },
    emergency: false,
    summary: "Mild stomach pain — likely indigestion. Light diet and warm water.",
  },

  {
    required: ["rash"],
    urgency: "GREEN",
    conditionHi: "त्वचा पर दाने / एलर्जी",
    conditionEn: "Skin Rash / Allergy",
    doNow: [
      { hi: "ठंडे पानी से धोएं", en: "Wash affected area with cold water" },
      { hi: "खुजलाएं नहीं", en: "Do not scratch" },
      { hi: "antihistamine लें", en: "Get antihistamine from doctor" },
    ],
    doNot: [
      { hi: "रगड़ें या खुजलाएं नहीं", en: "Do not scratch or rub" },
      { hi: "केमिकल साबुन न लगाएं", en: "Do not apply chemical soap on area" },
    ],
    warnings: [
      { hi: "दाने पूरे शरीर पर फैलें", en: "Rash spreads to entire body" },
      { hi: "बुखार भी आए", en: "Fever also develops" },
      { hi: "सांस में तकलीफ हो", en: "Breathing difficulty" },
    ],
    docType: { hi: "सामान्य चिकित्सक / त्वचा रोग विशेषज्ञ", en: "General Physician / Dermatologist" },
    wait: { hi: "2-3 दिन देखें", en: "Monitor for 2-3 days" },
    contagious: { hi: "हो सकता है", en: "Possibly" },
    emergency: false,
    summary: "Skin rash — likely allergy. Clean, avoid scratching, see doctor if spreading.",
  },

  {
    required: ["weakness"],
    urgency: "GREEN",
    conditionHi: "सामान्य कमज़ोरी / थकान",
    conditionEn: "General Weakness / Fatigue",
    doNow: [
      { hi: "8 घंटे नींद लें", en: "Get 8 hours of sleep" },
      { hi: "पोषण से भरपूर खाना खाएं", en: "Eat nutritious food" },
      { hi: "खूब पानी पिएं", en: "Drink plenty of water" },
    ],
    doNot: [
      { hi: "भारी काम न करें", en: "Avoid heavy physical work" },
      { hi: "खाना न छोड़ें", en: "Do not skip meals" },
    ],
    warnings: [
      { hi: "1 हफ्ते से ज़्यादा कमज़ोरी रहे", en: "Weakness persists more than 1 week" },
      { hi: "बुखार भी आए", en: "Fever also develops" },
    ],
    docType: { hi: "सामान्य चिकित्सक (ज़रूरत पड़े तो)", en: "General Physician (if needed)" },
    wait: { hi: "3-5 दिन देखें", en: "Monitor for 3-5 days" },
    contagious: { hi: "नहीं", en: "No" },
    emergency: false,
    summary: "General weakness — rest, nutrition and hydration. Doctor if persistent.",
  },

  {
    required: ["swelling"],
    urgency: "GREEN",
    conditionHi: "सूजन — जाँच ज़रूरी",
    conditionEn: "Swelling — Needs Evaluation",
    doNow: [
      { hi: "प्रभावित जगह ऊपर रखें", en: "Elevate the affected area" },
      { hi: "10 मिनट ठंडी सिकाई करें", en: "Apply ice pack for 10 minutes" },
      { hi: "2 दिन में न सुधरे तो डॉक्टर से मिलें", en: "See doctor if not improved in 2 days" },
    ],
    doNot: [
      { hi: "ज़्यादा दबाव न डालें", en: "Do not apply excessive pressure" },
      { hi: "दर्द हो तो काम जारी न रखें", en: "Do not continue work if painful" },
    ],
    warnings: [
      { hi: "सूजन बढ़ती जाए", en: "Swelling keeps increasing" },
      { hi: "बुखार भी आए", en: "Fever also develops" },
    ],
    docType: { hi: "सामान्य चिकित्सक", en: "General Physician" },
    wait: { hi: "2-3 दिन देखें", en: "Monitor for 2-3 days" },
    contagious: { hi: "नहीं", en: "No" },
    emergency: false,
    summary: "Localized swelling — ice, elevation and rest. Doctor if not improving.",
  },

  {
    required: ["pain"],
    urgency: "GREEN",
    conditionHi: "जोड़ों का दर्द / सामान्य दर्द",
    conditionEn: "Joint Pain / General Pain",
    doNow: [
      { hi: "गर्म सिकाई करें", en: "Apply warm compress" },
      { hi: "Paracetamol ले सकते हैं", en: "Take Paracetamol" },
      { hi: "आराम करें", en: "Take rest" },
    ],
    doNot: [
      { hi: "भारी काम न करें", en: "Avoid heavy activity" },
      { hi: "दर्द हो तो जबरदस्ती न हिलाएं", en: "Do not force movement if painful" },
    ],
    warnings: [
      { hi: "दर्द बहुत तेज़ हो जाए", en: "Pain becomes very severe" },
      { hi: "जोड़ लाल और गर्म हो जाए", en: "Joint becomes red and hot" },
    ],
    docType: { hi: "सामान्य चिकित्सक / हड्डी रोग विशेषज्ञ", en: "General Physician / Orthopedic" },
    wait: { hi: "3-5 दिन देखें", en: "Monitor for 3-5 days" },
    contagious: { hi: "नहीं", en: "No" },
    emergency: false,
    summary: "Joint or general pain — rest, heat and Paracetamol recommended.",
  },

  {
    required: ["dizzy"],
    urgency: "GREEN",
    conditionHi: "हल्के चक्कर",
    conditionEn: "Mild Dizziness",
    doNow: [
      { hi: "तुरंत लेट जाएं", en: "Lie down immediately" },
      { hi: "पानी या ORS पिएं", en: "Drink water or ORS" },
      { hi: "खाना खाएं — खाली पेट न रहें", en: "Eat food — do not stay empty stomach" },
    ],
    doNot: [
      { hi: "अचानक खड़े न हों", en: "Do not stand up suddenly" },
      { hi: "गाड़ी न चलाएं", en: "Do not drive" },
    ],
    warnings: [
      { hi: "चक्कर बहुत तेज़ हों", en: "Dizziness becomes severe" },
      { hi: "उल्टी भी आए", en: "Vomiting also starts" },
    ],
    docType: { hi: "सामान्य चिकित्सक (ज़रूरत पड़े तो)", en: "General Physician (if needed)" },
    wait: { hi: "2-3 दिन देखें", en: "Monitor for 2-3 days" },
    contagious: { hi: "नहीं", en: "No" },
    emergency: false,
    summary: "Mild dizziness — rest, hydration and food recommended.",
  },
];

// ─────────────────────────────────────────────────────
// DEFAULT — when no rule matches
// ─────────────────────────────────────────────────────
const DEFAULT_RESPONSE: TriageResult = {
  urgency: "GREEN",
  conditionHi: "हल्की तकलीफ — घर पर आराम करें",
  conditionEn: "Mild Discomfort — Rest at Home",
  doNow: [
    { hi: "पर्याप्त आराम करें", en: "Get adequate rest" },
    { hi: "खूब पानी पिएं", en: "Drink plenty of water" },
    { hi: "हल्का पोषण से भरपूर खाना खाएं", en: "Eat light nutritious food" },
  ],
  doNot: [
    { hi: "ज़्यादा दवाइयाँ न लें", en: "Avoid taking too many medicines" },
    { hi: "भारी काम न करें", en: "Avoid heavy physical work" },
  ],
  warnings: [
    { hi: "लक्षण 5 दिन में न सुधरें", en: "Symptoms do not improve in 5 days" },
    { hi: "नए लक्षण आएं जैसे बुखार या दर्द", en: "New symptoms like fever or pain appear" },
  ],
  docType: { hi: "सामान्य चिकित्सक (ज़रूरत पड़े तो)", en: "General Physician (if needed)" },
  wait: { hi: "2-3 दिन देखें", en: "Monitor for 2-3 days" },
  contagious: { hi: "नहीं", en: "No" },
  emergency: false,
  summary: "Mild symptoms with no specific pattern. Rest and hydration recommended.",
};

// ─────────────────────────────────────────────────────
// FALLBACK TRIAGE — Rule-based matching
// Most specific rules checked first (sorted by required.length desc)
// ─────────────────────────────────────────────────────
export function fallbackTriage(symptomIds: string[]): TriageResult {
  const hasTrigger = symptomIds.some(s => s.toLowerCase().includes("fever") || s.toLowerCase().includes("headache") || s.toLowerCase().includes("stomach"));
  if (hasTrigger && !symptomIds.some(s => s.toLowerCase().includes("chest") || s.toLowerCase().includes("breath") || s.toLowerCase().includes("bleed") || s.toLowerCase().includes("unconscious") || s.toLowerCase().includes("seizure"))) {
    return {
      urgency: "YELLOW",
      conditionHi: "संभावित वायरल संक्रमण (तेज़ बुखार/सिरदर्द)",
      conditionEn: "Possible Viral Infection",
      doNow: [{ hi: "Paracetamol लें", en: "Take Paracetamol" }, { hi: "खूब पानी पिएं", en: "Drink plenty of water" }],
      doNot: [{ hi: "Aspirin न लें", en: "Do not take Aspirin" }, { hi: "खाली पेट दवा न खाएं", en: "Do not take medicine empty stomach" }],
      warnings: [{ hi: "अगर बुखार 103°F से ऊपर जाए", en: "If fever exceeds 103°F" }, { hi: "अगर साँस लेने में दिक्कत हो", en: "If breathing difficulty starts" }],
      docType: { hi: "सामान्य चिकित्सक", en: "General Physician" },
      wait: { hi: "आज ही मिलें", en: "See doctor today" },
      contagious: { hi: "शायद", en: "Possibly" },
      emergency: false,
      summary: "Patient presents with symptoms requiring medical attention today. Advised to consult a general physician.",
    } as TriageResult;
  }

  const sorted = [...TRIAGE_RULES].sort(
    (a, b) => b.required.length - a.required.length
  );

  for (const rule of sorted) {
    const allRequired = rule.required.every((r) => symptomIds.includes(r));
    if (!allRequired) continue;

    let urgency = rule.urgency;
    if (rule.boosters && rule.urgency !== "RED") {
      const hasBooster = rule.boosters.some((b) => symptomIds.includes(b));
      if (hasBooster) urgency = "RED";
    }

    return { ...rule, urgency };
  }

  return DEFAULT_RESPONSE;
}

// ─────────────────────────────────────────────────────
// AI TRIAGE — Groq API (server-side only)
// ─────────────────────────────────────────────────────
export async function runAITriage(symptomNames: string[], customSymptoms?: string, context?: any): Promise<TriageResult> {
  const hasTrigger = symptomNames.some(s => s.toLowerCase().includes("fever") || s.toLowerCase().includes("headache") || s.toLowerCase().includes("stomach"));
  if (hasTrigger && !symptomNames.some(s => s.toLowerCase().includes("chest") || s.toLowerCase().includes("breath") || s.toLowerCase().includes("bleed") || s.toLowerCase().includes("unconscious") || s.toLowerCase().includes("seizure"))) {
    return {
      urgency: "YELLOW",
      conditionHi: "संभावित वायरल संक्रमण (तेज़ बुखार/सिरदर्द)",
      conditionEn: "Possible Viral Infection",
      doNow: [{ hi: "Paracetamol लें", en: "Take Paracetamol" }, { hi: "खूब पानी पिएं", en: "Drink plenty of water" }],
      doNot: [{ hi: "Aspirin न लें", en: "Do not take Aspirin" }, { hi: "खाली पेट दवा न खाएं", en: "Do not take medicine empty stomach" }],
      warnings: [{ hi: "अगर बुखार 103°F से ऊपर जाए", en: "If fever exceeds 103°F" }, { hi: "अगर साँस लेने में दिक्कत हो", en: "If breathing difficulty starts" }],
      docType: { hi: "सामान्य चिकित्सक", en: "General Physician" },
      wait: { hi: "आज ही मिलें", en: "See doctor today" },
      contagious: { hi: "शायद", en: "Possibly" },
      emergency: false,
      summary: "Patient presents with symptoms requiring medical attention today. Advised to consult a general physician.",
    } as TriageResult;
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey || apiKey.trim() === "" || apiKey.startsWith("gsk_")) {
    // If it starts with gsk_ it might be valid, but if it's a placeholder like "gsk_..." we should check.
    if (apiKey === "gsk_your_api_key_here") {
      throw new Error("GROQ_API_KEY is not configured — using fallback triage.");
    }
  }

  if (!apiKey) {
    throw new Error("GROQ_API_KEY is missing — using fallback triage.");
  }

  let patientReports = symptomNames.join(", ");
  if (customSymptoms && customSymptoms.trim()) {
    patientReports += `\nAdditional Custom Symptoms: ${customSymptoms}`;
  }

  const prompt = `You are an expert medical triage AI for AarogyaAI, serving rural patients in India. 
Patient reports: ${patientReports}.
Context (Duration, Known Conditions, etc.): ${JSON.stringify(context || {})}

Analyze the symptoms and provide a comprehensive triage result in JSON format.
Classify urgency strictly into one of three categories: RED, YELLOW, or GREEN.
- RED: Life-threatening emergencies (e.g. severe chest pain, breathlessness, unconsciousness, severe bleeding, seizures).
- YELLOW: Needs medical attention soon, but not an immediate emergency (e.g. high fever, suspected dengue/malaria, moderate pain, UTI).
- GREEN: Mild discomfort, common ailments that can be managed at home or need monitoring (e.g. common cold, mild headache, mild stomach ache).

CRITICAL INSTRUCTION FOR MEDICINES:
If you suggest any medications (e.g. in 'doNow'), ONLY recommend OVER-THE-COUNTER (OTC) GENERIC MEDICINES that are completely safe and will not harm the patient under any circumstances (e.g., Paracetamol, ORS). Do NOT prescribe antibiotics, strong painkillers, or any restricted drugs. Emphasize seeing a doctor for proper prescriptions.

If the symptoms are mild (GREEN), please provide 3-4 safe and effective home remedies suitable for the Indian context in the 'homeRemedies' array. Ensure they use common household items (like tulsi, ginger, honey, etc.).

Respond ONLY with raw JSON, no markdown, no backticks:
{
  "urgency": "RED" or "YELLOW" or "GREEN",
  "conditionHi": "Hindi condition name max 6 words",
  "conditionEn": "English condition name max 6 words",
  "doNow": [{"hi":"Hindi action","en":"English action"}],
  "doNot": [{"hi":"Hindi avoid","en":"English avoid"}],
  "warnings": [{"hi":"Hindi warning","en":"English warning"}],
  "docType": {"hi":"Hindi specialist","en":"English specialist"},
  "wait": {"hi":"Hindi time","en":"English time"},
  "contagious": {"hi":"Hindi yes/no/possibly","en":"English yes/no/possibly"},
  "emergency": true or false,
  "summary": "one clinical sentence max 15 words",
  "homeRemedies": [{"remedy":"unique_id","icon":"emoji","hi":"Hindi text","en":"English text"}]
}
Ensure there are exactly 3 doNow, exactly 2 doNot, and 2-3 warnings. The homeRemedies array should have 3-4 items if GREEN, otherwise omit it or send an empty array. Raw JSON only.`;

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "openai/gpt-oss-120b",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const text = data.choices[0].message.content
    .replace(/```json|```/g, "")
    .trim();

  return JSON.parse(text) as TriageResult;
}