export interface AuthUser {
  token: string;
  userId: number;
  email: string;
  name: string;
}

export interface Course {
  id: number;
  name: string;
  examDate: string | null;
  description: string | null;
  lastScore?: number | null;
  lastTotal?: number | null;
}

export interface Topic {
  id: number;
  courseId: number;
  title: string;
  content: string | null;
}

export type NoteType = 'TEXT' | 'DRAWING';

export interface Note {
  id: number;
  courseId: number;
  topicId: number | null;
  type: NoteType;
  textContent: string | null;
  imageData: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface QuizQuestionView {
  id: number;
  questionText: string;
  options: string[];
}

export interface GeneratedQuiz {
  quizId: number;
  questions: QuizQuestionView[];
}

export interface QuestionResult {
  id: number;
  questionText: string;
  options: string[];
  correctAnswer: string;
  userAnswer: string | null;
  correct: boolean;
}

export interface QuizResult {
  quizId: number;
  score: number;
  totalQuestions: number;
  questions: QuestionResult[];
}

export interface QuizAttemptSummary {
  id: number;
  score: number | null;
  totalQuestions: number;
  createdAt: string;
}

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  createdAt: string;
}

export interface MindMapNode {
  label: string;
  catchphrase?: string;
  color?: string;
  children?: MindMapNode[];
}

export interface MindMap {
  id: number;
  courseId: number;
  topicId: number | null;
  title: string;
  nodes: { title?: string; root: MindMapNode };
  createdAt: string;
}
