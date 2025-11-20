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

  let timerInterval: ReturnType<typeof setInterval>;

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
        };
        connectionManager.broadcast({ type: "GAME_STATE", payload: newState });
        return newState;
      });
      // Start Timer
      // startTimer(); // Need to implement timer logic
    },

    nextQuestion: () => {
      update((state) => {
        if (!state.quiz) return state;
        const nextIndex = state.currentQuestionIndex + 1;
        if (nextIndex >= state.quiz.questions.length) {
          const finishedState = {
            ...state,
            status: "finished" as GameStatus,
            currentQuestion: null,
          };
          connectionManager.broadcast({
            type: "GAME_STATE",
            payload: finishedState,
          });
          return finishedState;
        }
        const nextQuestion = state.quiz.questions[nextIndex];
        const newState = {
          ...state,
          currentQuestionIndex: nextIndex,
          currentQuestion: nextQuestion,
          timeRemaining: nextQuestion.timeLimit,
        };
        connectionManager.broadcast({ type: "GAME_STATE", payload: newState });
        return newState;
      });
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
}

export const gameStore = createGameStore();
