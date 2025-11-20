import { writable } from "svelte/store";
import type { Quiz } from "../types";
import { storage } from "../storage";

function createQuizStore() {
  const { subscribe, set, update } = writable<Quiz[]>([]);

  return {
    subscribe,
    load: () => {
      const quizzes = storage.getQuizzes();
      set(quizzes);
    },
    add: (quiz: Quiz) => {
      update((quizzes) => {
        const newQuizzes = [...quizzes, quiz];
        storage.saveQuiz(quiz);
        return newQuizzes;
      });
    },
    updateQuiz: (quiz: Quiz) => {
      update((quizzes) => {
        const index = quizzes.findIndex((q) => q.id === quiz.id);
        if (index !== -1) {
          const newQuizzes = [...quizzes];
          newQuizzes[index] = quiz;
          storage.saveQuiz(quiz);
          return newQuizzes;
        }
        return quizzes;
      });
    },
    remove: (id: string) => {
      update((quizzes) => {
        const newQuizzes = quizzes.filter((q) => q.id !== id);
        storage.deleteQuiz(id);
        return newQuizzes;
      });
    },
  };
}

export const quizStore = createQuizStore();
