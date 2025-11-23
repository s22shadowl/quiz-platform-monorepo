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
  answeredPlayerIds: string[]; // Track who answered current question
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
          answeredPlayerIds: [],
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
          answeredPlayerIds: [],
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

        // Check if player has already answered this question
        // We need to track this. Since we don't have a separate "answers" map in GameState yet,
        // we can infer it if we want, OR better, add a `lastAnsweredQuestionId` to Player.
        // For now, let's add a simple check: if the player's score/streak updated for this question?
        // Actually, the best way is to track `answeredPlayers` set in the state for the current question.
        // Let's modify GameState to include `answeredPlayerIds`.

        // WAIT: Modifying GameState interface requires updating initial state and types.
        // Let's check if we can do it with existing structures.
        // If we don't track it, we can't prevent double answering on the server side easily without adding state.
        // Let's add `answeredPlayerIds` to GameState.

        if (state.answeredPlayerIds.includes(playerId)) {
          return state;
        }

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

        const newState = {
          ...state,
          players: updatedPlayers,
          answeredPlayerIds: [...state.answeredPlayerIds, playerId],
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
