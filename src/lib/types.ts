export type ChatMessage = {
  role: 'user' | 'character';
  content: string;
};

export type Character = {
  id: string;
  name: string;
  photoDataUri: string;
  profile: string;
  chatHistory: ChatMessage[];
};
