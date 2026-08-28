import fs from 'fs';
import path from 'path';
import Papa from 'papaparse';

// Interface for CSV rows
export interface DiseaseRow {
  Name: string;
  Symptoms: string;
  Treatments: string;
  Disease_Code: string;
  Contagious: string;
  Chronic: string;
}

/**
 * STEP 1: Search the dataset for matching symptoms.
 * Returns the top 3 best matching diseases.
 */
export async function retrieveRAGContext(patientSymptoms: string[]): Promise<DiseaseRow[]> {
  try {
    const csvPath = path.join(process.cwd(), 'data', 'Diseases_Symptoms.csv');
    const fileContent = fs.readFileSync(csvPath, 'utf8');

    const parsed = Papa.parse<DiseaseRow>(fileContent, {
      header: true,
      skipEmptyLines: true,
    });

    const rows = parsed.data;
    
    const normalizedSymptoms = patientSymptoms
      .filter(s => s && s.trim().length > 0)
      .map(s => {
        const enPart = s.split('(')[0].trim();
        return enPart.toLowerCase();
      });

    const scoredRows = rows.map(row => {
      const rowSymptomsStr = (row.Symptoms || "").toLowerCase();
      let matches = 0;
      for (const sym of normalizedSymptoms) {
        if (rowSymptomsStr.includes(sym)) {
          matches++;
        }
      }
      // Calculate a slight penalty for diseases with lots of symptoms to favor simpler common diseases
      // if symptoms matched are equal.
      const penalty = rowSymptomsStr.length * 0.0001; 
      return { row, score: matches > 0 ? matches - penalty : 0 };
    });

    scoredRows.sort((a, b) => b.score - a.score);

    // Return up to top 3 matches that have a score > 0
    return scoredRows.filter(sr => sr.score > 0).slice(0, 3).map(sr => sr.row);

  } catch (error) {
    console.error("Error retrieving RAG Context:", error);
    return [];
  }
}

/**
 * STEP 2: Make a real web search to verify the LLM's initial decision.
 * We use the public Wikipedia Search API as a robust, key-free web search for the hackathon.
 */
export async function verifyWithWebSearch(query: string): Promise<string> {
  try {
    const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json`;
    
    const response = await fetch(url);
    const data = await response.json();
    
    if (data && data.query && data.query.search && data.query.search.length > 0) {
      // Get the top 2 search results' snippets
      const topResults = data.query.search.slice(0, 2);
      const combinedSnippets = topResults.map((r: any) => r.snippet.replace(/(<([^>]+)>)/gi, "")).join(" | ");
      return combinedSnippets;
    }
    
    return "No external web results found.";
  } catch (error) {
    console.error("Error performing Web Search:", error);
    return "Web search failed or timed out.";
  }
}
