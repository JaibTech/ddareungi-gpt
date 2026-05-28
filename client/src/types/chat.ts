export interface Message {
  role: "user" | "assistant";
  content: string;
}

export interface ChatRoom {
  id: string;
  title: string;
  messages: Message[];
}