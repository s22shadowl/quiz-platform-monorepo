export type QuestionType = "choice" | "text" | "quick_answer";

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  options: string[];
  correctAnswer?: string;
  mediaUrl?: string;
  timeLimit: number;
  points: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  questions: Question[];
  createdAt: number;
  updatedAt: number;
}

export interface Player {
  id: string;
  nickname: string;
  score: number;
  streak: number;
  rank?: number;
}

export interface GameHistory {
  id: string;
  quizTitle: string;
  playedAt: number;
  players: Player[];
}
