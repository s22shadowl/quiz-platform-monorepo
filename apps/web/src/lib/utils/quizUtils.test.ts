import { describe, it, expect } from "vitest";
import { validateAndParseQuiz, generateQuizExportData } from "./quizUtils";
import type { Quiz } from "$lib/types";

describe("quizUtils", () => {
  const mockQuiz: Quiz = {
    id: "test-id",
    title: "Test Quiz",
    description: "Description",
    questions: [
      {
        id: "q1",
        text: "Question 1",
        type: "choice",
        options: ["A", "B"],
        correctAnswer: "A",
        timeLimit: 10,
        points: 100,
      },
    ],
    createdAt: 1234567890,
    updatedAt: 1234567890,
  };

  describe("generateQuizExportData", () => {
    it("should generate correct data URI", () => {
      const dataUri = generateQuizExportData(mockQuiz);
      expect(dataUri).toContain("data:text/json;charset=utf-8,");
      expect(dataUri).toContain(
        encodeURIComponent(JSON.stringify(mockQuiz, null, 2)),
      );
    });
  });

  describe("validateAndParseQuiz", () => {
    it("should parse valid quiz JSON and regenerate ID", () => {
      const jsonString = JSON.stringify(mockQuiz);
      const parsed = validateAndParseQuiz(jsonString);

      expect(parsed.title).toBe(mockQuiz.title);
      expect(parsed.questions).toHaveLength(1);
      expect(parsed.id).not.toBe(mockQuiz.id); // Should be new ID
      expect(parsed.id).toBeDefined();
    });

    it("should throw error for invalid JSON", () => {
      expect(() => validateAndParseQuiz("invalid-json")).toThrow();
    });

    it("should throw error for missing required fields", () => {
      const invalidQuiz = { ...mockQuiz, title: undefined };
      expect(() => validateAndParseQuiz(JSON.stringify(invalidQuiz))).toThrow();
    });
  });
});
