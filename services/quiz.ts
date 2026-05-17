import api from './api';

// Mirrors frontend QuizService from apiServices.js exactly
export const QuizService = {
  // Fetch all topics
  getTopics: () => api.get('/api/topics').then((r) => r.data),

  // Fetch subtopics for a topic
  getSubtopics: (topicId: number) =>
    api.get(`/api/subtopics/${topicId}`).then((r) => r.data),

  // Add a new topic
  addTopic: (name: string) =>
    api.post('/api/topics', { name }).then((r) => r.data),

  // Add a new subtopic under a topic
  addSubtopic: (topicId: number, name: string) =>
    api.post('/api/subtopics', { topicId, name }).then((r) => r.data),

  // Generate MCQ questions via AI
  generateMCQ: (data: {
    topic: string;
    subTopic: string;
    numberOfQuestions: number;
    difficulty: string;
    previousQuestions: string[];
  }) =>
    api
      .post('/api/generate-mcq-direct', data, { timeout: 90000 })
      .then((r) => r.data),

  // Save a completed quiz attempt
  saveQuizAttempt: (data: object) =>
    api.post('/api/save-quiz-attempt', data).then((r) => r.data),

  // Get quiz history for a user
  getQuizAttempts: (userId: string) =>
    api.get(`/api/quiz-attempts/${userId}`).then((r) => r.data),

  // Delete a quiz attempt
  deleteQuizAttempt: (attemptId: string) =>
    api.delete(`/api/quiz-attempts/${attemptId}`).then((r) => r.data),
};

// Analytics Service
export const AnalyticsService = {
  getUserAnalytics: () => api.get('/api/user/analytics').then(res => res.data),
  getQuizAttempts: (userId: string) =>
    api.get(`/api/quiz-attempts/${userId}`).then((r) => r.data),
  deleteQuizAttempt: (attemptId: string) =>
    api.delete(`/api/quiz-attempts/${attemptId}`).then((r) => r.data),
};

// PDF / AI Service
export const AIService = {
  processPDF: (formData: FormData) =>
    api.post('/api/process-pdf', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      timeout: 60000,
    }).then((r) => r.data as { questions: PDFQuestion[] }),
};

export type PDFQuestion = {
  question: string;
  options: string[];
  correctAnswer: string;
  explanation?: string;
};