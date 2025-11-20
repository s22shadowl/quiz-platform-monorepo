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
          // Auto-end game or wait for host? Let's wait for host to explicitly end,
          // OR just show "End of Quiz" state.
          // For now, let's transition to finished state directly via endGame logic to save history.
          // But we can't call endGame() from here easily because it's inside update().
          // Let's just return state and let the Host click "Finish" or handle it differently.
          // Actually, let's just set it to finished here for now, but saving history might be tricky inside update if we want to reuse logic.
          // Let's duplicate the history saving logic here or refactor.
          // Refactoring to use a shared helper or just saving here.

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
}

export const gameStore = createGameStore();
