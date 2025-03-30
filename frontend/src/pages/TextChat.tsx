import { useEffect, useRef, useState } from "react";
import { Send, Trash2, ArrowDown, Info, Volume2, VolumeX } from "lucide-react";
import axios from "axios";

// Defining the structure of a chat message
interface Message {
  text: string;
  isUser: boolean;
}

// Defining the structure of the chat response from the backend
interface ChatResponse {
  reply: string;
}

// Defining the structure of the TTS API response
interface TTSResponse {
  audio_url: string;
}

export const TextChat = () => {
  // State variables for managing chat messages, input text, and UI states
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isTTSProcessing, setIsTTSProcessing] = useState(false);
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Reference to the chat container for scrolling
  const chatRef = useRef<HTMLDivElement>(null);

  // Example questions for quick access
  const exampleQuestions = [
    "I am a paddy farmer in Thanjavur, and I want to sow Samba rice this year. I know Samba takes a longer time to mature than other rice varieties. What is the best sowing time, and what variety should I choose for my region? Also, should I use transplanting or direct seeding?",
    "I am from Salem, and I want to cultivate Maize (Corn) for animal feed and market sale. What is the right time to sow, and how should I manage soil nutrients for better growth?",
  ];

  // Automatically scroll to the bottom when messages are updated
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Scroll to the bottom of the chat
  const scrollToBottom = () => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
      setShowScrollArrow(false); // Hide the scroll-to-bottom arrow
    }
  };

  // Handle scroll event to show or hide the scroll-to-bottom arrow
  const handleScroll = () => {
    if (chatRef.current) {
      const isAtBottom =
        chatRef.current.scrollHeight - chatRef.current.scrollTop ===
        chatRef.current.clientHeight;
      setShowScrollArrow(!isAtBottom); // Show the arrow if not at the bottom
    }
  };

  // Handle sending a message
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    // Add the user's message to the chat
    const userMessage: Message = { text, isUser: true };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsThinking(true);

    try {
      // Send the user's message to the backend
      const response = await axios.post<ChatResponse>("http://127.0.0.1:8000/chat/", {
        message: text,
      });

      // Format the response for display and TTS
      const formattedResponse = formatResponseForDisplay(response.data.reply); // For display
      const plainResponse = formatResponseForTTS(response.data.reply); // For TTS

      // Add the assistant's response to the chat
      const botMessage: Message = { text: formattedResponse, isUser: false };
      setMessages((prev) => [...prev, botMessage]);

      setIsThinking(false); // Remove "Thinking..." after response is generated

      // Send the plain response to TTS if enabled
      if (isTTSEnabled) {
        setIsTTSProcessing(true);
        const ttsResponse = await axios.post<TTSResponse>("http://127.0.0.1:8000/tts/text-to-speech/", {
          message: plainResponse,
        });
        playAudio(ttsResponse.data.audio_url); // Play the generated audio
        setIsTTSProcessing(false);
      }
    } catch (error) {
      console.error("Error fetching response:", error);
      setMessages((prev) => [...prev, { text: "⚠️ Error: Unable to get response.", isUser: false }]);
    }
  };

  // Play audio from a given URL
  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch((error) => {
      console.error("Error playing audio:", error);
      setMessages((prev) => [...prev, { text: "⚠️ Error: Unable to play audio.", isUser: false }]);
    });
  };

  // Format the response for display in the chat
  const formatResponseForDisplay = (response: string): string => {
    return response
      .replace(/### (.*?)\n/g, '<h3 class="text-lg font-semibold mt-4">$1</h3>') // Format headings
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') // Format bold text
      .replace(/- (.*?)\n/g, '<li className="ml-4 list-disc">$1</li>') // Format list items
      .replace(/\n/g, '<br />'); // Replace newlines with line breaks
  };

  // Format the response for TTS (plain text)
  const formatResponseForTTS = (response: string): string => {
    return response
      .replace(/### (.*?)\n/g, "$1") // Remove headings
      .replace(/\*\*(.*?)\*\*/g, "$1") // Remove bold formatting
      .replace(/- (.*?)\n/g, "$1") // Remove list formatting
      .replace(/\n/g, " ") // Replace newlines with spaces
      .trim(); // Trim extra spaces
  };

  // Toggle the TTS feature
  const toggleTTS = () => {
    setIsTTSEnabled((prev) => !prev);
  };

  return (
    <div className="relative min-h-screen flex justify-center items-center overflow-hidden">
      {/* Background Video */}
      <video autoPlay muted loop className="fixed inset-0 w-full h-full object-cover z-0">
        <source src="/assets/t1.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Chatbox Container */}
      <div className="relative z-10 max-w-4xl w-full h-[80vh] bg-white bg-opacity-80 rounded-lg shadow-lg flex flex-col">
        {/* Header Section - Fixed at top */}
        <div className="p-4 border-b flex justify-between items-center bg-white bg-opacity-90">
          <div
            className="cursor-pointer relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info className="w-6 h-6 text-gray-500 hover:text-gray-700" />
            {showTooltip && (
              <div className="absolute left-0 mt-2 w-64 bg-white text-gray-800 rounded-lg shadow-lg z-50 text-sm p-4">
                <h3 className="font-semibold mb-2">ℹ️ How to Use Text Chat:</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Type your query in the input box and press Enter or click Send.</li>
                  <li>Click the <Trash2 className="inline w-4 h-4" /> icon to clear the chat.</li>
                  <li>Click the <Volume2 className="inline w-4 h-4" /> icon to enable TTS (Text-to-Speech).</li>
                  <li>Click the <VolumeX className="inline w-4 h-4" /> icon to disable TTS.</li>
                  <li>Use ⬇️ to scroll to the latest message.</li>
                </ul>
              </div>
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Text Chat</h2>
          <div className="flex items-center gap-4">
            <button onClick={toggleTTS} className="p-2 text-gray-600 hover:text-green-500">
              {isTTSEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
            <button onClick={() => setMessages([])} className="p-2 text-gray-600 hover:text-red-500">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Main Content Area - Scrollable */}
        <div className="flex flex-1 overflow-hidden">
          {/* Example Questions Section */}
          <div className="p-6 w-1/4 border-r overflow-y-auto">
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

          {/* Chat Messages Section */}
          <div className="flex-1 flex flex-col relative">
            <div 
              className="flex-1 overflow-y-auto p-4 space-y-4" 
              ref={chatRef} 
              onScroll={handleScroll}
            >
              {messages.map((message, index) => (
                <div key={index} className={`flex w-full ${message.isUser ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`p-3 rounded-lg max-w-[70%] ${message.isUser ? "bg-green-500 text-white" : "bg-gray-100 text-gray-800"}`}
                    style={{ wordBreak: "break-word", whiteSpace: "pre-line" }}
                    dangerouslySetInnerHTML={!message.isUser ? { __html: message.text } : undefined}
                  >
                    {message.isUser ? message.text : null}
                  </div>
                </div>
              ))}
              {isThinking && (
                <div className="flex items-center justify-start w-full p-4 gap-3">
                  <img src="public/assets/dexlogo.jpeg" alt="Logo" className="w-8 h-8 rounded-full" />
                  <span className="text-gray-500 animate-pulse">Thinking...</span>
                </div>
              )}
            </div>
            {isTTSProcessing && (
              <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 pointer-events-none">
                <div className="text-white text-lg">🔊 Generating audio...</div>
              </div>
            )}
          </div>
        </div>

        {/* Input Section - Fixed at bottom */}
        <div className="p-4 border-t bg-white bg-opacity-90 flex items-center gap-4">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputText)}
            placeholder="Type your message..."
            className="flex-1 bg-gray-100 rounded-lg p-4 focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={scrollToBottom}
            className="p-3 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600"
          >
            <ArrowDown className="w-6 h-6" />
          </button>
          <button
            onClick={() => handleSendMessage(inputText)}
            className="p-4 bg-green-500 text-white rounded-full hover:bg-green-600"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};