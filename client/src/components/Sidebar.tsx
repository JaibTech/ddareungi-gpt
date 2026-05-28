import type { ChatRoom } from "../types/chat";

interface Props {
  chats: ChatRoom[];
  currentChatId: string;
  onSelect: (id: string) => void;
  onNewChat: () => void;
}

export default function Sidebar({
  chats,
  currentChatId,
  onSelect,
  onNewChat,
}: Props) {
  return (
    <div className="w-64 bg-gray-950 border-r border-gray-800 flex flex-col">
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="
            w-full
            bg-blue-500
            text-white
            py-3
            rounded-xl
          "
        >
          + 새 채팅
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelect(chat.id)}
            className={`
              w-full
              text-left
              p-3
              rounded-xl
              mb-2
              text-white
              transition
              ${
                currentChatId === chat.id
                  ? "bg-gray-800"
                  : "hover:bg-gray-900"
              }
            `}
          >
            {chat.title}
          </button>
        ))}
      </div>
    </div>
  );
}