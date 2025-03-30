// src/components/Chatbot.tsx

import React, { useState } from "react";
import { RefreshCw, Minimize2 } from "lucide-react";

const Chatbot: React.FC = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState([
    "Hi there! 👋 We have a 10% promo code for new customers. Want one?",
  ]);

  const toggleMinimize = () => setIsMinimized((prev) => !prev);

  const sendMessage = (msg: string) => {
    setMessages((prev) => [...prev, msg]);
  };

  return (
    <div className="w-96 bg-white shadow-lg rounded-lg overflow-hidden">
      {/* Header */}
      <div className="flex justify-between items-center p-4 bg-purple-600 text-white">
        <span className="font-bold">Sendbird Bot</span>
        <div className="flex gap-2">
          <button onClick={() => setMessages([])} aria-label="Refresh Chat">
            <RefreshCw size={18} />
          </button>
          <button onClick={toggleMinimize} aria-label="Minimize Chat">
            <Minimize2 size={18} />
          </button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Chat Messages */}
          <div className="p-4 h-80 overflow-y-auto">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`mb-4 p-3 rounded-lg ${
                  index % 2 === 0
                    ? "bg-gray-200 text-gray-800"
                    : "bg-purple-500 text-white self-end"
                }`}
              >
                {msg}
              </div>
            ))}
          </div>

          {/* Quick Replies */}
          <div className="p-4 flex flex-wrap gap-2 border-t">
            <button
              onClick={() => sendMessage("Yes, sure!")}
              className="px-4 py-2 rounded-full border border-purple-600 text-purple-600 hover:bg-purple-100"
            >
              Yes, sure!
            </button>
            <button
              onClick={() => sendMessage("No, thanks!")}
              className="px-4 py-2 rounded-full border border-purple-600 text-purple-600 hover:bg-purple-100"
            >
              No, thanks!
            </button>
            <button
              onClick={() => sendMessage("What are your most popular products?")}
              className="px-4 py-2 rounded-full border border-purple-600 text-purple-600 hover:bg-purple-100"
            >
              What are your most popular products?
            </button>
          </div>

          {/* Message Input */}
          <div className="p-4 flex items-center border-t">
            <input
              type="text"
              placeholder="Enter message"
              className="flex-1 p-2 border rounded-lg focus:outline-none"
              onKeyDown={(e) =>
                e.key === "Enter" && sendMessage((e.target as HTMLInputElement).value)
              }
            />
            <button
              onClick={() =>
                sendMessage((document.querySelector("input") as HTMLInputElement).value)
              }
              className="ml-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              ➤
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default Chatbot;
