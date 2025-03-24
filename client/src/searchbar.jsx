import { useState } from "react";
import { Send } from "lucide-react";
import axios from "axios";

export default function ChatInput(changeStyles) {
  const [text, setText] = useState("");

  const sendMessage = async () => {
    if (!text.trim()) return; // Prevent sending empty messages
    console.log(changeStyles)
    try {
      const response = await axios.post("http://localhost:3000/send-text", { text, changeStyles });
      console.log(response.data);
      setText(""); // Clear the input field after sending
    } catch (error) {
      console.error("Error sending text:", error);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-4">
      <div className="flex items-center bg-white border border-gray-300 rounded-2xl p-3 shadow-md focus-within:ring-2 focus-within:ring-blue-500">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-grow outline-none bg-transparent text-gray-900 text-base px-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()} // Allow sending with Enter
        />
        <button
          onClick={sendMessage}
          className="p-2 text-blue-500 hover:text-blue-600 transition"
        >
          <Send size={20} />
        </button>
      </div>
    </div>
  );
}
