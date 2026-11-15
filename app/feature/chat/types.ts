import type { ResponseBenchmark } from "../inference/benchmark";

export type Role = "user" | "assistant" | "system";
export type MessageStatus = "complete" | "streaming" | "error" | "cancelled";

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  createdAt: number;
  status: MessageStatus;
  benchmark?: ResponseBenchmark;
};

export type Conversation = {
  id: string;
  title: string;
  messages: ChatMessage[];
  createdAt: number;
  updatedAt: number;
};
