import type { Quiz } from "../types";
import { v4 as uuidv4 } from "uuid";

export function validateAndParseQuiz(jsonString: string): Quiz {
  try {
    const json = JSON.parse(jsonString);
    if (!json.title || !Array.isArray(json.questions)) {
      throw new Error("Invalid quiz format: Missing title or questions");
    }
    // Generate new IDs to avoid conflicts
    return {
      ...json,
      id: uuidv4(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
  } catch {
    throw new Error("Failed to parse quiz JSON");
  }
}

export function generateQuizExportData(quiz: Quiz): string {
  return (
    "data:text/json;charset=utf-8," +
    encodeURIComponent(JSON.stringify(quiz, null, 2))
  );
}
