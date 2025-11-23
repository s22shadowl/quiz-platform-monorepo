import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";
import { get } from "svelte/store";
import { gameStore } from "../stores/gameStore";
import { connectionManager } from "../connection";
import type { Quiz } from "$lib/types";

// Mock connectionManager
vi.mock("../connection", () => ({
  connectionManager: {
    broadcast: vi.fn(),
  },
}));

// Mock storage
vi.mock("../storage", () => ({
  storage: {
    saveHistory: vi.fn(),
  },
}));

describe("gameStore", () => {
  const mockQuiz: Quiz = {
    id: "quiz-1",
    title: "Test Quiz",
    description: "",
    questions: [
      {
        id: "q1",
        text: "Q1",
        type: "choice",
        options: ["A", "B"],
        correctAnswer: "A",
        timeLimit: 10,
        points: 100,
      },
      {
        id: "q2",
        text: "Q2",
        type: "choice",
        options: ["C", "D"],
        correctAnswer: "C",
        timeLimit: 20,
        points: 100,
      },
    ],
    createdAt: 0,
    updatedAt: 0,
  };

  beforeEach(() => {
    gameStore.reset();
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should initialize game", () => {
    gameStore.initGame(mockQuiz);
    const state = get(gameStore);
    expect(state.quiz).toEqual(mockQuiz);
    expect(state.status).toBe("lobby");
  });

  it("should start game and set initial state", () => {
    gameStore.initGame(mockQuiz);
    gameStore.startGame();

    const state = get(gameStore);
    expect(state.status).toBe("playing");
    expect(state.currentQuestionIndex).toBe(0);
    expect(state.timeRemaining).toBe(10);
    expect(connectionManager.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "GAME_STATE",
        payload: expect.objectContaining({ status: "playing" }),
      }),
    );
  });

  it("should countdown timer", () => {
    gameStore.initGame(mockQuiz);
    gameStore.startGame();

    vi.advanceTimersByTime(1000);
    expect(get(gameStore).timeRemaining).toBe(9);

    vi.advanceTimersByTime(2000);
    expect(get(gameStore).timeRemaining).toBe(7);
  });

  it("should pause and resume timer", () => {
    gameStore.initGame(mockQuiz);
    gameStore.startGame();

    // Pause
    gameStore.togglePause();
    expect(get(gameStore).isPaused).toBe(true);

    vi.advanceTimersByTime(2000);
    expect(get(gameStore).timeRemaining).toBe(10); // Should not change

    // Resume
    gameStore.togglePause();
    expect(get(gameStore).isPaused).toBe(false);

    vi.advanceTimersByTime(1000);
    expect(get(gameStore).timeRemaining).toBe(9); // Should resume counting
  });

  it("should move to next question", () => {
    gameStore.initGame(mockQuiz);
    gameStore.startGame();
    gameStore.nextQuestion();

    const state = get(gameStore);
    expect(state.currentQuestionIndex).toBe(1);
    expect(state.currentQuestion?.id).toBe("q2");
    expect(state.timeRemaining).toBe(20);
  });

  it("should end game after last question", () => {
    gameStore.initGame(mockQuiz);
    gameStore.startGame();
    gameStore.nextQuestion(); // q2
    gameStore.nextQuestion(); // Finish

    const state = get(gameStore);
    expect(state.status).toBe("finished");
  });
});
