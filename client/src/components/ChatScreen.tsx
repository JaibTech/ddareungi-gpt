import { useEffect, useRef, useState } from "react";

import { streamMessage } from "../api/openai";

import type {
  ChatRoom,
  Message,
} from "../types/chat";

import MessageBubble from "./MessageBubble";
import ChatInput from "./ChatInput";
import Sidebar from "./Sidebar";

export default function ChatScreen() {
  const [chats, setChats] = useState<ChatRoom[]>(() => {
    const saved = localStorage.getItem("chat_rooms");

    return saved
      ? JSON.parse(saved)
      : [
          {
            id: crypto.randomUUID(),
            title: "새 채팅",
            messages: [],
          },
        ];
  });

  const [currentChatId, setCurrentChatId] =
    useState(chats[0].id);

  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement | null>(null);

  const currentChat = chats.find(
    (chat) => chat.id === currentChatId
  );

  useEffect(() => {
    localStorage.setItem(
      "chat_rooms",
      JSON.stringify(chats)
    );
  }, [chats]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "smooth",
    });
  }, [currentChat?.messages]);

  const updateMessages = (messages: Message[]) => {
    setChats((prev) =>
      prev.map((chat) =>
        chat.id === currentChatId
          ? {
              ...chat,
              messages,
            }
          : chat
      )
    );
  };

  const handleSend = async (text: string) => {
    if (!currentChat) return;

    const userMessage: Message = {
      role: "user",
      content: text,
    };

    const updatedMessages = [
      ...currentChat.messages,
      userMessage,
    ];

    updateMessages(updatedMessages);

    if (
      currentChat.title === "새 채팅"
    ) {
      setChats((prev) =>
        prev.map((chat) =>
          chat.id === currentChatId
            ? {
                ...chat,
                title: text.slice(0, 20),
              }
            : chat
        )
      );
    }

    setLoading(true);

    let botText = "";

    const botMessage: Message = {
      role: "assistant",
      content: "",
    };

    updateMessages([
      ...updatedMessages,
      botMessage,
    ]);

    try {
      await streamMessage(
        text,
        (chunk) => {
          botText += chunk;

          const latestMessages = [
            ...updatedMessages,
            {
              role: "assistant",
              content: botText,
            },
          ];

          updateMessages(latestMessages);
        }
      );
    } catch (error) {
      console.error(error);
    }

    setLoading(false);
  };

  const createNewChat = () => {
    const newChat: ChatRoom = {
      id: crypto.randomUUID(),
      title: "새 채팅",
      messages: [],
    };

    setChats((prev) => [newChat, ...prev]);

    setCurrentChatId(newChat.id);
  };

  return (
    <div className="h-screen flex bg-gray-900">
      <Sidebar
        chats={chats}
        currentChatId={currentChatId}
        onSelect={setCurrentChatId}
        onNewChat={createNewChat}
      />

      <div className="flex-1 flex flex-col">
        <div className="flex-1 overflow-y-auto p-5">
          {currentChat?.messages.map(
            (msg, idx) => (
              <MessageBubble
                key={idx}
                message={msg}
              />
            )
          )}

          {loading && (
            <div className="text-gray-400 text-sm">
              GPT가 입력중...
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <ChatInput onSend={handleSend} />
      </div>
    </div>
  );
}