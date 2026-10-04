/**
 * Devanagari (Hindi) to Latin (English) Transliteration Utility
 * Enables bilingual search: "विग्नेश" matches "Vignesh", "अंजू" matches "Anju", etc.
 */

const DEVANAGARI_TO_LATIN_MAP: Record<string, string> = {
  // Independent Vowels
  "अ": "a", "आ": "a", "इ": "i", "ई": "i", "उ": "u", "ऊ": "u", "ऋ": "ri",
  "ए": "e", "ऐ": "ai", "ओ": "o", "औ": "au", "अं": "an", "अः": "ah",
  
  // Consonants
  "क": "k", "ख": "kh", "ग": "g", "घ": "gh", "ङ": "ng",
  "च": "ch", "छ": "chh", "ज": "j", "झ": "jh", "ञ": "ny",
  "ट": "t", "ठ": "th", "ड": "d", "ढ": "dh", "ण": "n",
  "त": "t", "थ": "th", "द": "d", "ध": "dh", "न": "n",
  "प": "p", "फ": "f", "ब": "b", "भ": "bh", "म": "m",
  "य": "y", "र": "r", "ल": "l", "व": "v", "श": "sh", "ष": "sh", "स": "s", "ह": "h",
  "ड़": "d", "ढ़": "dh", "फ़": "f", "ज़": "z", "ख़": "kh", "ग़": "g", "क़": "q",

  // Conjuncts
  "क्ष": "ksh", "त्र": "tr", "ज्ञ": "gy", "श्र": "shr",

  // Matras (Vowel signs)
  "ा": "a", "ि": "i", "ी": "i", "ु": "u", "ू": "u", "ृ": "ri",
  "े": "e", "ै": "ai", "ो": "o", "ौ": "au", "ं": "n", "ँ": "n", "ः": "h",
  "्": "", // Virama (halant)
};

export function transliterateDevanagariToLatin(text: string): string {
  if (!text) return "";
  
  let result = "";
  const chars = Array.from(text);

  for (let i = 0; i < chars.length; i++) {
    const ch = chars[i];
    const nextCh = chars[i + 1];

    if (DEVANAGARI_TO_LATIN_MAP[ch] !== undefined) {
      result += DEVANAGARI_TO_LATIN_MAP[ch];
      // If current char is a consonant and next char is not a vowel sign or virama, add implicit 'a'
      const isConsonant = /[\u0915-\u0939\u0958-\u095F]/.test(ch);
      const isNextMatraOrHalant = nextCh && /[\u093E-\u094D\u0962\u0963]/.test(nextCh);
      if (isConsonant && !isNextMatraOrHalant && nextCh && /[\u0915-\u0939]/.test(nextCh)) {
        result += "a";
      }
    } else {
      result += ch;
    }
  }

  return result
    .toLowerCase()
    .replace(/sh/g, "sh")
    .replace(/ee/g, "i")
    .replace(/oo/g, "u")
    .replace(/aa/g, "a");
}

export function isDevanagari(text: string): boolean {
  return /[\u0900-\u097F]/.test(text);
}

/**
 * Fuzzy bilingual match that checks:
 * 1. Direct substring match (case insensitive)
 * 2. Transliterated match ("विग्नेश" <-> "vignesh")
 * 3. Normalized sound-alike match
 */
export function matchesBilingualQuery(target: string, query: string): boolean {
  if (!query || !query.trim()) return true;
  if (!target) return false;

  const cleanTarget = target.trim().toLowerCase();
  const cleanQuery = query.trim().toLowerCase();

  // 1. Direct match
  if (cleanTarget.includes(cleanQuery)) return true;

  // 2. If query is Devanagari, transliterate query to Latin and check
  if (isDevanagari(cleanQuery)) {
    const latinQuery = transliterateDevanagariToLatin(cleanQuery);
    // e.g. "विग्नेश" -> "vignesh" or "vignes"
    if (latinQuery && cleanTarget.includes(latinQuery)) return true;
    
    // Also check prefix / sub-word match for short queries
    const queryStem = latinQuery.replace(/h|a|i|e|u/g, "");
    const targetStem = cleanTarget.replace(/h|a|i|e|u/g, "");
    if (queryStem.length >= 3 && targetStem.includes(queryStem)) return true;
  }

  // 3. If target is Devanagari and query is Latin
  if (isDevanagari(cleanTarget)) {
    const latinTarget = transliterateDevanagariToLatin(cleanTarget);
    if (latinTarget && latinTarget.includes(cleanQuery)) return true;
  }

  return false;
}
