import { writable } from "svelte/store";
import type { Quiz, Question, Player } from "../types";
import { connectionManager } from "../connection";

export type GameStatus = "lobby" | "playing" | "review" | "finished";

export interface GameState {
  status: GameStatus;
  quiz: Quiz | null;
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  players: Player[];
  timeRemaining: number;
  isPaused: boolean;
  answeredPlayerIds: string[]; // Track who answered current question
  currentAnswers: Record<string, string>; // playerId -> answer
  gradedPlayerIds: string[];
}

function createGameStore() {
  const initialState: GameState = {
    status: "lobby",
    quiz: null,
    currentQuestionIndex: -1,
    currentQuestion: null,
    players: [],
    timeRemaining: 0,
    isPaused: false,
    answeredPlayerIds: [],
    currentAnswers: {},
    gradedPlayerIds: [],
  };

  const { subscribe, set, update } = writable<GameState>(initialState);

  let timerInterval: ReturnType<typeof setInterval> | undefined;

  return {
    subscribe,

    // Host Actions
    initGame: (quiz: Quiz) => {
      update((state) => ({
        ...state,
        quiz,
        status: "lobby",
        players: [],
        currentQuestionIndex: -1,
        currentQuestion: null,
      }));
    },

    addPlayer: (id: string, nickname: string) => {
      update((state) => {
        const existingPlayer = state.players.find((p) => p.id === id);
        if (existingPlayer) {
          // Player reconnected
          const updatedPlayers = state.players.map((p) =>
            p.id === id ? { ...p, isOnline: true } : p,
          );
          const newState = { ...state, players: updatedPlayers };
          connectionManager.broadcast({
            type: "GAME_STATE",
            payload: newState,
          });
          return newState;
        }

        const newPlayer: Player = {
          id,
          nickname,
          score: 0,
          streak: 0,
          isOnline: true,
        };
        const newState = { ...state, players: [...state.players, newPlayer] };
        // Broadcast updated player list
        connectionManager.broadcast({ type: "GAME_STATE", payload: newState });
        return newState;
      });
    },

    setPlayerOffline: (id: string) => {
      update((state) => {
        const updatedPlayers = state.players.map((p) =>
          p.id === id ? { ...p, isOnline: false } : p,
        );
        const newState = { ...state, players: updatedPlayers };
        connectionManager.broadcast({ type: "GAME_STATE", payload: newState });
        return newState;
      });
    },

    startGame: () => {
      update((state) => {
        if (!state.quiz) return state;
        const newState = {
          ...state,
          status: "playing" as GameStatus,
          currentQuestionIndex: 0,
          currentQuestion: state.quiz.questions[0],
          timeRemaining: state.quiz.questions[0].timeLimit,
          isPaused: false,
          answeredPlayerIds: [],
          currentAnswers: {},
          gradedPlayerIds: [],
        };
        connectionManager.broadcast({ type: "GAME_STATE", payload: newState });
        return newState;
      });
      startTimer();
    },

    goToReview: () => {
      update((state) => {
        if (state.status !== "playing") return state;

        const newState = {
          ...state,
          status: "review" as GameStatus,
          isPaused: false, // Ensure timer is stopped/paused effectively
        };
        connectionManager.broadcast({ type: "GAME_STATE", payload: newState });
        return newState;
      });
      clearInterval(timerInterval);
    },

    nextQuestion: () => {
      update((state) => {
        if (!state.quiz) return state;
        const nextIndex = state.currentQuestionIndex + 1;
        if (nextIndex >= state.quiz.questions.length) {
          import("../storage").then(({ storage }) => {
            storage.saveHistory({
              id: crypto.randomUUID(),
              quizTitle: state.quiz!.title,
              playedAt: Date.now(),
              players: state.players,
            });
          });

          const finishedState = {
            ...state,
            status: "finished" as GameStatus,
            currentQuestion: null,
            isPaused: false,
            answeredPlayerIds: [],
            currentAnswers: {},
            gradedPlayerIds: [],
          };
          connectionManager.broadcast({
            type: "GAME_STATE",
            payload: finishedState,
          });
          clearInterval(timerInterval);
          return finishedState;
        }
        const nextQuestion = state.quiz.questions[nextIndex];
        const newState = {
          ...state,
          currentQuestionIndex: nextIndex,
          currentQuestion: nextQuestion,
          timeRemaining: nextQuestion.timeLimit,
          isPaused: false,
          answeredPlayerIds: [],
          currentAnswers: {},
          gradedPlayerIds: [],
        };
        connectionManager.broadcast({ type: "GAME_STATE", payload: newState });
        return newState;
      });
      startTimer();
    },

    togglePause: () => {
      update((state) => {
        const newState = { ...state, isPaused: !state.isPaused };
        connectionManager.broadcast({ type: "GAME_STATE", payload: newState });
        return newState;
      });
    },

    handleAnswer: (playerId: string, option: string) => {
      update((state) => {
        if (
          state.status !== "playing" ||
          !state.currentQuestion ||
          state.isPaused ||
          state.timeRemaining <= 0
        ) {
          return state;
        }

        if (state.answeredPlayerIds.includes(playerId)) {
          return state;
        }

        // Store the answer
        const newAnswers = { ...state.currentAnswers, [playerId]: option };

        // Calculate score
        let updatedPlayers = state.players;
        let isCorrect = false;

        if (state.currentQuestion.type === "text") {
          // Manual grading, no auto score
        } else if (state.currentQuestion.type === "multiple_choice") {
          try {
            const selectedOptions = JSON.parse(option) as string[];
            const correctOptions = state.currentQuestion.correctAnswers || [];

            // Check if arrays have same elements (ignoring order)
            if (selectedOptions.length === correctOptions.length) {
              const sortedSelected = [...selectedOptions].sort();
              const sortedCorrect = [...correctOptions].sort();
              isCorrect = sortedSelected.every(
                (val, index) => val === sortedCorrect[index],
              );
            }
          } catch (e) {
            console.error("Failed to parse multiple choice answer", e);
            isCorrect = false;
          }
        } else {
          // Single choice
          isCorrect = option === state.currentQuestion.correctAnswer;
        }

        if (state.currentQuestion.type !== "text") {
          const points = isCorrect ? state.currentQuestion.points : 0;

          updatedPlayers = state.players.map((p) => {
            if (p.id === playerId) {
              return {
                ...p,
                score: p.score + points,
                streak: isCorrect ? p.streak + 1 : 0,
              };
            }
            return p;
          });
          // Sort players by score descending
          updatedPlayers.sort((a, b) => b.score - a.score);
        }

        const newState = {
          ...state,
          players: updatedPlayers,
          answeredPlayerIds: [...state.answeredPlayerIds, playerId],
          currentAnswers: newAnswers,
        };
        connectionManager.broadcast({ type: "GAME_STATE", payload: newState });
        return newState;
      });
    },

    gradeAnswer: (playerId: string, isCorrect: boolean) => {
      update((state) => {
        if (!state.currentQuestion || state.gradedPlayerIds.includes(playerId))
          return state;

        const points = isCorrect ? state.currentQuestion.points : 0;
        const updatedPlayers = state.players.map((p) => {
          if (p.id === playerId) {
            return {
              ...p,
              score: p.score + points,
              streak: isCorrect ? p.streak + 1 : 0,
            };
          }
          return p;
        });
        updatedPlayers.sort((a, b) => b.score - a.score);

        const newState = {
          ...state,
          players: updatedPlayers,
          gradedPlayerIds: [...state.gradedPlayerIds, playerId],
        };
        connectionManager.broadcast({ type: "GAME_STATE", payload: newState });
        return newState;
      });
    },

    endGame: () => {
      update((state) => {
        if (!state.quiz) return state;

        // Save History
        import("../storage").then(({ storage }) => {
          storage.saveHistory({
            id: crypto.randomUUID(),
            quizTitle: state.quiz!.title,
            playedAt: Date.now(),
            players: state.players,
          });
        });

        const finishedState = {
          ...state,
          status: "finished" as GameStatus,
          currentQuestion: null,
          isPaused: false,
          answeredPlayerIds: [],
        };
        connectionManager.broadcast({
          type: "GAME_STATE",
          payload: finishedState,
        });
        return finishedState;
      });
      clearInterval(timerInterval);
    },

    // Client Actions (Sync State)
    syncState: (newState: GameState) => {
      set(newState);
    },

    reset: () => {
      set(initialState);
      clearInterval(timerInterval);
    },
  };

  function startTimer() {
    clearInterval(timerInterval);
    timerInterval = setInterval(() => {
      update((state) => {
        if (state.status !== "playing" || state.isPaused) return state;

        if (state.timeRemaining <= 0) {
          // Time's up! Stop counting but stay in 'playing' state.
          // Do NOT auto-advance.
          return state;
        }

        const newState = { ...state, timeRemaining: state.timeRemaining - 1 };
        connectionManager.broadcast({ type: "GAME_STATE", payload: newState });
        return newState;
      });
    }, 1000);
  }
}

export const gameStore = createGameStore();
