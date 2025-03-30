// src/pages/TextChat.tsx

import { useEffect, useRef, useState } from 'react';
import { Send, Trash2 } from 'lucide-react';

interface Message {
  text: string;
  isUser: boolean;
}

export const TextChat = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);

  const exampleQuestions = [
    'When is the best time to sow wheat?',
    'What crops are suitable for the current season?',
    'How much water is required for rice sowing?',
    'Which fertilizers should I use for maize?',
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  };

  const handleSendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMessage: Message = { text, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    setTimeout(() => {
      const aiResponse: Message = {
        text: 'I understand your question. Let me help you with that.',
        isUser: false,
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 2000);
  };

  return (
    <div
      className="relative min-h-screen flex justify-center items-center overflow-hidden"
      style={{
        backgroundImage: 'url("/assets/bg-image.jpg")',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      }}
    >
      {/* Chat Container */}
      <div className="relative z-10 max-w-4xl w-full bg-white bg-opacity-80 rounded-lg shadow-lg flex">

        {/* Left - Instructions */}
        <div className="p-6 w-1/4 border-r">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Example Questions:</h3>
          <div className="space-y-3">
            {exampleQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => handleSendMessage(question)}
                className="text-sm bg-gray-200 hover:bg-gray-300 rounded-lg px-4 py-2 w-full text-left"
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Middle - Chat Section */}
        <div className="flex-1 flex flex-col">

          {/* Header */}
          <div className="p-4 border-b flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Text Chat</h2>
            <button
              onClick={() => setMessages([])}
              className="p-2 text-gray-600 hover:text-red-500"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* Chat Messages */}
          <div
            className="flex-1 overflow-y-auto p-4 space-y-4"
            ref={chatRef}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex w-full ${
                  message.isUser ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`p-3 rounded-lg max-w-[70%] ${
                    message.isUser
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {message.text}
                </div>
              </div>
            ))}
          </div>

          {/* Input Area */}
          <div className="p-4 border-t bg-white bg-opacity-90">
            <div className="flex items-center gap-4">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) =>
                  e.key === 'Enter' && handleSendMessage(inputText)
                }
                placeholder="Type your message..."
                className="flex-1 bg-gray-100 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button
                onClick={() => handleSendMessage(inputText)}
                className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600"
              >
                <Send className="w-6 h-6" />
              </button>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
