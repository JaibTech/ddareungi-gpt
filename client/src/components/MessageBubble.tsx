import type { Message } from "../types/chat";

interface Props {
  message: Message;
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div
      className={`flex mb-4 ${
        isUser ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`
          px-4 py-3 rounded-2xl max-w-[75%]
          ${
            isUser
              ? "bg-blue-500 text-white"
              : "bg-gray-700 text-white"
          }
        `}
      >
        {message.content}
      </div>
    </div>
  );
}