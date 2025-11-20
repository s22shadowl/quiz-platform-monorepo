export type QuestionType = "choice" | "text" | "quick_answer";
export type MediaType = "image" | "video" | "none";

export interface Option {
  text: string;
  is_correct: boolean;
}

export interface Question {
  id: string;
  type: QuestionType;
  content: string;
  media_type: MediaType;
  media_url?: string;
  options: Option[];
  time_limit: number;
}

export interface Quiz {
  id: string;
  title: string;
  description: string;
  created_at: number;
  updated_at: number;
  questions: Question[];
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
  quiz_title: string;
  played_at: number;
  players: Player[];
}
