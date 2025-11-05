/**
 * Parses JSON from Gemini's response text, handling cases where the response might be wrapped in markdown code blocks
 * @param responseText The raw response text from Gemini
 * @returns Parsed JSON object or null if parsing fails
 */
export function parseGeminiJson(responseText: string): any {
  // Regex to find and extract the content within ```json and ```
  const match = responseText.match(/```json\s*([\s\S]*?)\s*```/);
  const jsonString = match ? match[1] : responseText.trim();

  // Remove any remaining backticks or common unwanted prefixes/suffixes
  const cleanedJsonString = jsonString
    .replace(/^```(json)?\s*/, "") // Remove leading ```json or ```
    .replace(/\s*```$/, "")      // Remove trailing ```
    .trim();

  try {
    return JSON.parse(cleanedJsonString);
  } catch (error) {
    console.error("Failed to parse JSON after cleaning:", error);
    // Handle cases where the response is still not valid JSON
    return null;
  }
}
