import { useState } from "react";

interface Props {
  onSend: (text: string) => void;
}

export default function ChatInput({ onSend }: Props) {
  const [text, setText] = useState("");

  const handleSend = () => {
    if (!text.trim()) return;

    onSend(text);
    setText("");
  };

  return (
    <div className="p-4 border-t border-gray-700 flex gap-3 bg-gray-900">
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            handleSend();
          }
        }}
        placeholder="메시지를 입력하세요"
        className="
          flex-1
          bg-gray-800
          text-white
          rounded-xl
          px-4
          py-3
          outline-none
        "
      />

      <button
        onClick={handleSend}
        className="
          bg-blue-500
          text-white
          px-5
          rounded-xl
        "
      >
        전송
      </button>
    </div>
  );
}