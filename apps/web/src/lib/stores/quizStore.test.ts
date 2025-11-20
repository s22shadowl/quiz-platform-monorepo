import { describe, it, expect, beforeEach, vi } from "vitest";
import { get } from "svelte/store";
import { quizStore } from "./quizStore";
import { storage } from "../storage";
import type { Quiz } from "../types";

// Mock storage
vi.mock("../storage", () => ({
  storage: {
    getQuizzes: vi.fn(() => []),
    saveQuiz: vi.fn(),
    deleteQuiz: vi.fn(),
  },
}));

describe("quizStore", () => {
  const mockQuiz: Quiz = {
    id: "test-id",
    title: "Test Quiz",
    description: "Test Description",
    questions: [],
    createdAt: 123,
    updatedAt: 123,
  };

  beforeEach(() => {
    vi.resetAllMocks();
    vi.mocked(storage.getQuizzes).mockReturnValue([]);
    quizStore.load(); // Reset store to empty state based on mock
  });

  it("should load quizzes from storage", () => {
    const quizzes = [mockQuiz];
    vi.mocked(storage.getQuizzes).mockReturnValue(quizzes);

    quizStore.load();

    expect(get(quizStore)).toEqual(quizzes);
    expect(storage.getQuizzes).toHaveBeenCalled();
  });

  it("should add a new quiz", () => {
    quizStore.add(mockQuiz);

    const storeValue = get(quizStore);
    expect(storeValue).toHaveLength(1);
    expect(storeValue[0]).toEqual(mockQuiz);
    expect(storage.saveQuiz).toHaveBeenCalledWith(mockQuiz);
  });

  it("should update an existing quiz", () => {
    quizStore.add(mockQuiz);

    const updatedQuiz = { ...mockQuiz, title: "Updated Title" };
    quizStore.updateQuiz(updatedQuiz);

    const storeValue = get(quizStore);
    expect(storeValue[0].title).toBe("Updated Title");
    expect(storage.saveQuiz).toHaveBeenCalledWith(updatedQuiz);
  });

  it("should remove a quiz", () => {
    quizStore.add(mockQuiz);
    quizStore.remove(mockQuiz.id);

    expect(get(quizStore)).toHaveLength(0);
    expect(storage.deleteQuiz).toHaveBeenCalledWith(mockQuiz.id);
  });
});
