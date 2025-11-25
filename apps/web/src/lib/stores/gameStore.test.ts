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
    expect(state.answeredPlayerIds).toEqual([]);
  });

  it("should start game and set initial state", () => {
    gameStore.initGame(mockQuiz);
    gameStore.startGame();

    const state = get(gameStore);
    expect(state.status).toBe("playing");
    expect(state.currentQuestionIndex).toBe(0);
    expect(state.timeRemaining).toBe(10);
    expect(state.answeredPlayerIds).toEqual([]);
    expect(connectionManager.broadcast).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "GAME_STATE",
        payload: expect.objectContaining({ status: "playing" }),
      }),
    );
  });

  it("should countdown timer but stop at 0 without auto-advance", () => {
    gameStore.initGame(mockQuiz);
    gameStore.startGame();

    // Advance to 0
    vi.advanceTimersByTime(10000);
    expect(get(gameStore).timeRemaining).toBe(0);

    // Advance more - should stay at 0
    vi.advanceTimersByTime(2000);
    expect(get(gameStore).timeRemaining).toBe(0);
    expect(get(gameStore).currentQuestionIndex).toBe(0); // Should not advance
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

  it("should move to next question and reset answered state", () => {
    gameStore.initGame(mockQuiz);
    gameStore.addPlayer("p1", "Player 1");
    gameStore.startGame();

    // Answer first question
    gameStore.handleAnswer("p1", "A");
    expect(get(gameStore).answeredPlayerIds).toContain("p1");

    gameStore.nextQuestion();

    const state = get(gameStore);
    expect(state.currentQuestionIndex).toBe(1);
    expect(state.currentQuestion?.id).toBe("q2");
    expect(state.timeRemaining).toBe(20);
    expect(state.answeredPlayerIds).toEqual([]); // Should be reset
  });

  it("should handle answering logic correctly", () => {
    gameStore.initGame(mockQuiz);
    gameStore.addPlayer("p1", "Player 1");
    gameStore.startGame();

    // Correct answer
    gameStore.handleAnswer("p1", "A");
    let player = get(gameStore).players.find((p) => p.id === "p1");
    expect(player?.score).toBe(100);
    expect(player?.streak).toBe(1);
    expect(get(gameStore).answeredPlayerIds).toContain("p1");

    // Duplicate answer (should be ignored)
    gameStore.handleAnswer("p1", "B");
    player = get(gameStore).players.find((p) => p.id === "p1");
    expect(player?.score).toBe(100); // Score shouldn't change
    expect(player?.streak).toBe(1);

    // Next question
    gameStore.nextQuestion();

    // Wrong answer
    gameStore.handleAnswer("p1", "D"); // Correct is C
    player = get(gameStore).players.find((p) => p.id === "p1");
    expect(player?.score).toBe(100); // No points
    expect(player?.streak).toBe(0); // Streak reset
  });

  it("should ignore answers when time is up or paused", () => {
    gameStore.initGame(mockQuiz);
    gameStore.addPlayer("p1", "Player 1");
    gameStore.startGame();

    // Pause
    gameStore.togglePause();
    gameStore.handleAnswer("p1", "A");
    expect(get(gameStore).answeredPlayerIds).not.toContain("p1");

    // Resume
    gameStore.togglePause();

    // Time up
    vi.advanceTimersByTime(10000); // 0s remaining
    gameStore.handleAnswer("p1", "A");
    expect(get(gameStore).answeredPlayerIds).not.toContain("p1");
  });

  it("should end game after last question", () => {
    gameStore.initGame(mockQuiz);
    gameStore.startGame();
    gameStore.nextQuestion(); // q2
    gameStore.nextQuestion(); // Finish

    const state = get(gameStore);
    expect(state.status).toBe("finished");
  });

  it("should mark player as offline", () => {
    gameStore.initGame(mockQuiz);
    gameStore.addPlayer("p1", "Player 1");

    gameStore.setPlayerOffline("p1");

    const player = get(gameStore).players.find((p) => p.id === "p1");
    expect(player?.isOnline).toBe(false);
    expect(connectionManager.broadcast).toHaveBeenCalled();
  });

  it("should handle player reconnection (restore online status)", () => {
    gameStore.initGame(mockQuiz);
    gameStore.addPlayer("p1", "Player 1");

    // Simulate offline
    gameStore.setPlayerOffline("p1");
    expect(get(gameStore).players.find((p) => p.id === "p1")?.isOnline).toBe(
      false,
    );

    // Simulate reconnect (addPlayer with same ID)
    gameStore.addPlayer("p1", "Player 1");

    const player = get(gameStore).players.find((p) => p.id === "p1");
    expect(player?.isOnline).toBe(true);
    expect(player?.score).toBe(0); // Should preserve score (0 in this case)
    expect(get(gameStore).players.length).toBe(1); // Should not duplicate player
  });

  describe("Phase 9: Advanced Question Types & Grading", () => {
    const advancedQuiz: Quiz = {
      id: "adv-quiz",
      title: "Advanced Quiz",
      description: "",
      createdAt: 0,
      updatedAt: 0,
      questions: [
        {
          id: "q_mc",
          text: "Multiple Choice",
          type: "multiple_choice",
          options: ["A", "B", "C", "D"],
          correctAnswers: ["A", "C"],
          timeLimit: 20,
          points: 100,
        },
        {
          id: "q_text",
          text: "Short Answer",
          type: "text",
          options: [],
          timeLimit: 20,
          points: 100,
        },
      ],
    };

    it("should score multiple choice questions correctly (strict match)", () => {
      gameStore.initGame(advancedQuiz);
      gameStore.addPlayer("p1", "Player 1");
      gameStore.startGame();

      // Partial match (should be 0)
      gameStore.handleAnswer("p1", JSON.stringify(["A"]));
      expect(get(gameStore).players[0].score).toBe(0);

      // Wrong match (should be 0)
      gameStore.nextQuestion(); // Reset for retry simulation (actually next question is text, but let's re-init for simplicity or just hack state)
      // Re-init for clean state
      gameStore.initGame(advancedQuiz);
      gameStore.addPlayer("p1", "Player 1");
      gameStore.startGame();

      gameStore.handleAnswer("p1", JSON.stringify(["A", "B"]));
      expect(get(gameStore).players[0].score).toBe(0);

      // Exact match (should be 100)
      gameStore.initGame(advancedQuiz);
      gameStore.addPlayer("p1", "Player 1");
      gameStore.startGame();

      gameStore.handleAnswer("p1", JSON.stringify(["A", "C"]));
      expect(get(gameStore).players[0].score).toBe(100);

      // Exact match different order (should be 100)
      gameStore.initGame(advancedQuiz);
      gameStore.addPlayer("p1", "Player 1");
      gameStore.startGame();

      gameStore.handleAnswer("p1", JSON.stringify(["C", "A"]));
      expect(get(gameStore).players[0].score).toBe(100);
    });

    it("should handle short answer questions (no auto score)", () => {
      gameStore.initGame(advancedQuiz);
      gameStore.addPlayer("p1", "Player 1");
      gameStore.startGame();
      gameStore.nextQuestion(); // Move to text question

      expect(get(gameStore).currentQuestion?.type).toBe("text");

      gameStore.handleAnswer("p1", "My Answer");

      const state = get(gameStore);
      expect(state.currentAnswers["p1"]).toBe("My Answer");
      expect(state.players[0].score).toBe(0); // No auto score
      expect(state.answeredPlayerIds).toContain("p1");
    });

    it("should support manual grading for short answer", () => {
      gameStore.initGame(advancedQuiz);
      gameStore.addPlayer("p1", "Player 1");
      gameStore.startGame();
      gameStore.nextQuestion(); // Move to text question

      gameStore.handleAnswer("p1", "My Answer");

      // Go to review
      gameStore.goToReview();
      expect(get(gameStore).status).toBe("review");

      // Grade correct
      gameStore.gradeAnswer("p1", true);

      let state = get(gameStore);
      expect(state.players[0].score).toBe(100);
      expect(state.gradedPlayerIds).toContain("p1");

      // Try to grade again (should be ignored)
      gameStore.gradeAnswer("p1", false);
      state = get(gameStore);
      expect(state.players[0].score).toBe(100); // Score unchanged
    });

    it("should reset grading state on next question", () => {
      gameStore.initGame(advancedQuiz);
      gameStore.addPlayer("p1", "Player 1");
      gameStore.startGame();
      gameStore.nextQuestion(); // Text question

      gameStore.handleAnswer("p1", "Ans");
      gameStore.goToReview();
      gameStore.gradeAnswer("p1", true);

      expect(get(gameStore).gradedPlayerIds).toContain("p1");

      // Next question (end game in this case, but logic holds)
      gameStore.nextQuestion();
      expect(get(gameStore).gradedPlayerIds).toEqual([]);
      expect(get(gameStore).currentAnswers).toEqual({});
    });
  });
});
