import { writable } from "svelte/store";
import type { Quiz, Question, Player } from "../types";
import { connectionManager } from "../connection";

export type GameStatus = "lobby" | "playing" | "finished";

export interface GameState {
  status: GameStatus;
  quiz: Quiz | null;
  currentQuestionIndex: number;
  currentQuestion: Question | null;
  players: Player[];
  timeRemaining: number;
  isPaused: boolean;
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
        if (state.players.find((p) => p.id === id)) return state;
        const newPlayer: Player = { id, nickname, score: 0, streak: 0 };
        const newState = { ...state, players: [...state.players, newPlayer] };
        // Broadcast updated player list
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
        };
        connectionManager.broadcast({ type: "GAME_STATE", payload: newState });
        return newState;
      });
      startTimer();
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
        if (state.status !== "playing" || !state.currentQuestion) return state;

        const isCorrect = option === state.currentQuestion.correctAnswer;
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

        // Sort players by score descending
        updatedPlayers.sort((a, b) => b.score - a.score);

        const newState = { ...state, players: updatedPlayers };
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
          // Time's up!
          // Optionally auto-advance or just stay at 0
          // For now, stay at 0
          return state;
        }

        const newState = { ...state, timeRemaining: state.timeRemaining - 1 };
        // Broadcast every second might be too much traffic, but for local P2P it's okay-ish.
        // Optimization: Broadcast only every 5s or critical moments?
        // For accurate countdown on client, we need frequent updates or client-side interpolation.
        // Let's broadcast every second for now.
        connectionManager.broadcast({ type: "GAME_STATE", payload: newState });
        return newState;
      });
    }, 1000);
  }
}

export const gameStore = createGameStore();
