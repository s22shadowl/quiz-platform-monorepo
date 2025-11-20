import { describe, it, expect, beforeEach, vi } from "vitest";
import { get } from "svelte/store";
import { gameStore } from "./gameStore";
import { connectionManager } from "../connection";
import type { Quiz } from "../types";

// Mock dependencies
vi.mock("../connection", () => ({
  connectionManager: {
    broadcast: vi.fn(),
  },
}));

vi.mock("../storage", () => ({
  storage: {
    saveHistory: vi.fn(),
  },
}));

describe("gameStore", () => {
  const mockQuiz: Quiz = {
    id: "test-quiz",
    title: "Test Quiz",
    description: "Desc",
    createdAt: 0,
    updatedAt: 0,
    questions: [
      {
        id: "q1",
        text: "Question 1",
        options: ["A", "B", "C", "D"],
        correctAnswer: "A",
        points: 10,
        timeLimit: 10,
        type: "multiple-choice",
      },
      {
        id: "q2",
        text: "Question 2",
        options: ["A", "B", "C", "D"],
        correctAnswer: "B",
        points: 20,
        timeLimit: 10,
        type: "multiple-choice",
      },
    ],
  };

  beforeEach(() => {
    vi.resetAllMocks();
    gameStore.reset();
  });

  it("should initialize game with quiz", () => {
    gameStore.initGame(mockQuiz);
    const state = get(gameStore);
    expect(state.quiz).toEqual(mockQuiz);
    expect(state.status).toBe("lobby");
  });

  it("should add players", () => {
    gameStore.initGame(mockQuiz);
    gameStore.addPlayer("p1", "Player 1");

    const state = get(gameStore);
    expect(state.players).toHaveLength(1);
    expect(state.players[0]).toEqual({
      id: "p1",
      nickname: "Player 1",
      score: 0,
      streak: 0,
    });
    expect(connectionManager.broadcast).toHaveBeenCalledWith({
      type: "GAME_STATE",
      payload: expect.any(Object),
    });
  });

  it("should start game", () => {
    gameStore.initGame(mockQuiz);
    gameStore.addPlayer("p1", "Player 1");
    gameStore.startGame();

    const state = get(gameStore);
    expect(state.status).toBe("playing");
    expect(state.currentQuestionIndex).toBe(0);
    expect(state.currentQuestion).toEqual(mockQuiz.questions[0]);
    expect(connectionManager.broadcast).toHaveBeenCalled();
  });

  it("should handle correct answer", () => {
    gameStore.initGame(mockQuiz);
    gameStore.addPlayer("p1", "Player 1");
    gameStore.startGame();

    gameStore.handleAnswer("p1", "A"); // Correct answer for q1

    const state = get(gameStore);
    expect(state.players[0].score).toBe(10);
    expect(state.players[0].streak).toBe(1);
  });

  it("should handle incorrect answer", () => {
    gameStore.initGame(mockQuiz);
    gameStore.addPlayer("p1", "Player 1");
    gameStore.startGame();

    gameStore.handleAnswer("p1", "B"); // Incorrect answer for q1

    const state = get(gameStore);
    expect(state.players[0].score).toBe(0);
    expect(state.players[0].streak).toBe(0);
  });

  it("should move to next question", () => {
    gameStore.initGame(mockQuiz);
    gameStore.startGame();

    gameStore.nextQuestion();

    const state = get(gameStore);
    expect(state.currentQuestionIndex).toBe(1);
    expect(state.currentQuestion).toEqual(mockQuiz.questions[1]);
  });

  it("should end game after last question", async () => {
    gameStore.initGame(mockQuiz);
    gameStore.startGame();
    gameStore.nextQuestion(); // Move to q2 (last question)

    // Mock dynamic import for storage
    // Note: The store uses dynamic import which is hard to mock synchronously in Vitest without more setup.
    // However, we mocked the module at the top level.
    // The issue is that the store uses `import('../storage').then(...)`.
    // We need to ensure that promise resolves.
    // For this test, we might just check the state transition.

    gameStore.nextQuestion(); // Should trigger end game

    const state = get(gameStore);
    expect(state.status).toBe("finished");
    expect(state.currentQuestion).toBeNull();
  });
});
