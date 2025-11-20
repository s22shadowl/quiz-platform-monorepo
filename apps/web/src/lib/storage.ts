import type { Quiz, GameHistory } from "./types";

const STORAGE_KEY_QUIZZES = "quiz_platform_quizzes";
const STORAGE_KEY_HISTORY = "quiz_platform_history";

// Helper to safely parse JSON
function safeParse<T>(key: string, fallback: T): T {
  if (typeof localStorage === "undefined") return fallback;
  const stored = localStorage.getItem(key);
  if (!stored) return fallback;
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error(`Failed to parse ${key}`, e);
    return fallback;
  }
}

export const storage = {
  // Quiz Operations
  getQuizzes: (): Quiz[] => {
    return safeParse<Quiz[]>(STORAGE_KEY_QUIZZES, []);
  },

  saveQuiz: (quiz: Quiz): void => {
    const quizzes = storage.getQuizzes();
    const index = quizzes.findIndex((q) => q.id === quiz.id);
    if (index >= 0) {
      quizzes[index] = quiz;
    } else {
      quizzes.push(quiz);
    }
    localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify(quizzes));
  },

  deleteQuiz: (id: string): void => {
    const quizzes = storage.getQuizzes().filter((q) => q.id !== id);
    localStorage.setItem(STORAGE_KEY_QUIZZES, JSON.stringify(quizzes));
  },

  getQuiz: (id: string): Quiz | undefined => {
    return storage.getQuizzes().find((q) => q.id === id);
  },

  // History Operations
  getHistory: (): GameHistory[] => {
    return safeParse<GameHistory[]>(STORAGE_KEY_HISTORY, []);
  },

  saveHistory: (history: GameHistory): void => {
    const histories = storage.getHistory();
    histories.push(history);
    localStorage.setItem(STORAGE_KEY_HISTORY, JSON.stringify(histories));
  },
};
