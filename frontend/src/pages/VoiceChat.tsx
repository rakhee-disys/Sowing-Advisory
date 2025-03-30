import { useEffect, useRef, useState } from "react";
import { Trash2, Info, Volume2, VolumeX, Mic, ChevronDown } from "lucide-react";
import axios from "axios";

// Defining the structure of a chat message
interface Message {
  text: string;
  isUser: boolean;
}

// Defining the structure of the STT API response
interface STTResponse {
  text: string;
}

// Defining the structure of the GPT API response
interface GPTResponse {
  reply: string;
}

// Defining the structure of the TTS API response
interface TTSResponse {
  audio_url: string;
}

export const VoiceChat = () => {
  // Setting up state variables for managing chat messages, UI states, and recording
  const [messages, setMessages] = useState<Message[]>([]);
  const [showScrollArrow, setShowScrollArrow] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isTTSProcessing, setIsTTSProcessing] = useState(false);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState<number | null>(null);
  const [isTTSEnabled, setIsTTSEnabled] = useState(false);
  const [showTooltip, setShowTooltip] = useState(false);

  // Creating references for the chat container, audio element, and media recorder
  const chatRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);

  // Automatically scrolling to the bottom of the chat when messages are updated
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Managing the countdown timer for recording
  useEffect(() => {
    if (recordingTimeLeft !== null && recordingTimeLeft > 0) {
      const timer = setTimeout(() => setRecordingTimeLeft((prev) => (prev !== null ? prev - 1 : null)), 1000);
      return () => clearTimeout(timer);
    } else if (recordingTimeLeft === 0 && mediaRecorderRef.current) {
      mediaRecorderRef.current.stop(); // Stopping the recording when time runs out
    }
  }, [recordingTimeLeft]);

  // Scrolling to the bottom of the chat
  const scrollToBottom = () => {
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
      setShowScrollArrow(false); // Hiding the scroll-to-bottom arrow
    }
  };

  // Handling the scroll event to show or hide the scroll-to-bottom arrow
  const handleScroll = () => {
    if (chatRef.current) {
      const isAtBottom =
        chatRef.current.scrollHeight - chatRef.current.scrollTop ===
        chatRef.current.clientHeight;
      setShowScrollArrow(!isAtBottom);
    }
  };

  // Handling the microphone click to start or stop recording
  const handleMicClick = () => {
    if (isListening) {
      setRecordingTimeLeft(0); // Stopping the recording immediately
    } else {
      handleVoiceInput(); // Starting the recording
    }
  };

  // Handling the voice input by recording audio and sending it to the STT API
  const handleVoiceInput = async () => {
    if (isListening || isProcessing) return;

    setIsListening(true);
    setRecordingTimeLeft(10); // Setting the recording time limit to 10 seconds

    const formData = new FormData();
    try {
      const audioBlob = await recordAudio(); // Recording audio
      formData.append("audio", audioBlob, "voice_input.wav");

      setIsProcessing(true);
      setIsListening(false);

      // Sending the audio to the STT API
      const response = await axios.post<STTResponse>("http://127.0.0.1:8000/stt/speech-to-text/", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Adding the transcribed text to the chat
      const userMessage: Message = { text: response.data.text, isUser: true };
      setMessages((prev) => [...prev, userMessage]);

      setIsProcessing(false);
      await handleSendMessage(response.data.text); // Sending the transcribed text to GPT
    } catch (error) {
      handleError(error, "STT");
    } finally {
      setIsListening(false);
      setRecordingTimeLeft(null);
      setIsProcessing(false);
    }
  };

  // Recording audio using the MediaRecorder API
  const recordAudio = async (): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          const mediaRecorder = new MediaRecorder(stream);
          mediaRecorderRef.current = mediaRecorder;
          const audioChunks: BlobPart[] = [];

          mediaRecorder.ondataavailable = (event) => {
            audioChunks.push(event.data);
          };

          mediaRecorder.onstop = () => {
            const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
            resolve(audioBlob);
          };

          mediaRecorder.start();

          // Automatically stopping the recording after 10 seconds
          setTimeout(() => {
            if (mediaRecorder.state !== "inactive") {
              mediaRecorder.stop();
            }
          }, 10000);
        })
        .catch((error) => {
          console.error("Error accessing microphone:", error);
          reject(error);
        });
    });
  };

  // Sending the user's message to GPT and handling the response
  const handleSendMessage = async (text: string) => {
    if (!text.trim()) return;

    setIsThinking(true);

    try {
      const response = await axios.post<GPTResponse>("http://127.0.0.1:8000/chat/", { message: text });

      // Formatting the response for display and TTS
      const formattedResponse = formatResponseForDisplay(response.data.reply);
      const plainResponse = formatResponseForTTS(response.data.reply);

      // Adding the formatted response to the chat
      const botMessage: Message = { text: formattedResponse, isUser: false };
      setMessages((prev) => [...prev, botMessage]);

      setIsThinking(false);

      // Sending the plain response to TTS if enabled
      if (isTTSEnabled) {
        setIsTTSProcessing(true);
        await handleTTS(plainResponse);
        setIsTTSProcessing(false);
      }
    } catch (error) {
      handleError(error, "GPT");
    } finally {
      setIsThinking(false);
    }
  };

  // Sending the plain text response to the TTS API
  const handleTTS = async (text: string) => {
    try {
      setIsTTSProcessing(true);
      const ttsResponse = await axios.post<TTSResponse>("http://127.0.0.1:8000/tts/text-to-speech/", { message: text });

      if (!ttsResponse.data.audio_url) {
        throw new Error("Invalid audio URL received from TTS API.");
      }

      playAudio(ttsResponse.data.audio_url); // Playing the generated audio
    } catch (error) {
      handleError(error, "TTS");
    } finally {
      setIsTTSProcessing(false);
    }
  };

  // Playing the audio from the TTS API
  const playAudio = (url: string) => {
    if (!url) {
      console.error("Invalid audio URL");
      setMessages((prev) => [...prev, { text: "⚠️ Error: Invalid audio URL.", isUser: false }]);
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = url;
      audioRef.current
        .play()
        .catch((error) => {
          console.error("Error playing audio:", error);
          setMessages((prev) => [...prev, { text: "⚠️ Error: Unable to play audio.", isUser: false }]);
        });
    } else {
      const audio = new Audio(url);
      audioRef.current = audio;
      audio
        .play()
        .catch((error) => {
          console.error("Error playing audio:", error);
          setMessages((prev) => [...prev, { text: "⚠️ Error: Unable to play audio.", isUser: false }]);
        });
    }
  };

  // Handling errors and displaying them in the chat
  const handleError = (error: unknown, source: string) => {
    if (error instanceof axios.AxiosError) {
      console.error(`${source} API Error Response:`, error.response?.data);
    } else {
      console.error(`Unknown error with ${source}:`, error);
    }
    setMessages((prev) => [...prev, { text: `⚠️ Error: Unable to process ${source.toLowerCase()} request.`, isUser: false }]);
  };

  // Formatting the response for display in the chat
  const formatResponseForDisplay = (response: string): string => {
    return response
      .replace(/### (.*?)\n/g, '<h3 class="text-lg font-semibold mt-4">$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/- (.*?)\n/g, '<li className="ml-4 list-disc">$1</li>')
      .replace(/\n/g, '<br />');
  };

  // Formatting the response for TTS (plain text)
  const formatResponseForTTS = (response: string): string => {
    return response
      .replace(/### (.*?)\n/g, '$1')
      .replace(/\*\*(.*?)\*\*/g, '$1')
      .replace(/- (.*?)\n/g, '$1')
      .replace(/\n/g, ' ')
      .trim();
  };

  // Toggling the TTS feature
  const toggleTTS = () => {
    setIsTTSEnabled((prev) => {
      if (prev && audioRef.current) {
        audioRef.current.pause();
      }
      return !prev;
    });
  };

  // Handling the Enter key to stop recording early
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === "Enter" && isListening) {
      setRecordingTimeLeft(0); // Stopping the recording immediately
    }
  };

  return (
    <div className="relative min-h-screen flex justify-center items-center overflow-hidden" onKeyDown={handleKeyDown}>
      {/* Background Video */}
      <video autoPlay muted loop className="fixed inset-0 w-full h-full object-cover z-0">
        <source src="/assets/t1.mp4" type="video/mp4" />
        Your browser does not support the video tag.
      </video>

      {/* Chatbox Container */}
      <div className="relative z-10 max-w-4xl w-full bg-white bg-opacity-80 rounded-lg shadow-lg flex flex-col h-[600px]">
        {/* Top Bar */}
        <div className="sticky top-0 z-50 bg-white bg-opacity-90 p-4 border-b flex justify-between items-center">
          <div
            className="cursor-pointer relative"
            onMouseEnter={() => setShowTooltip(true)}
            onMouseLeave={() => setShowTooltip(false)}
          >
            <Info className="w-6 h-6 text-gray-500 hover:text-gray-700" />
            {showTooltip && (
              <div className="absolute left-0 mt-2 w-64 bg-white text-gray-800 rounded-lg shadow-lg z-50 text-sm p-4">
                <h3 className="font-semibold mb-2">Voice Chat Instructions</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>🎤 Tap the mic to start recording your voice.</li>
                  <li>⏳ Press Enter to stop recording early.</li>
                  <li>🔊 Enable TTS to hear audio replies.</li>
                  <li>🗑️ Use the trash icon to clear the chat.</li>
                  <li>⬇️ Use the arrow to scroll to the latest message.</li>
                </ul>
              </div>
            )}
          </div>
          <h2 className="text-xl font-semibold text-gray-800">Voice Chat</h2>
          <div className="flex items-center gap-4">
            <button onClick={toggleTTS} className="p-2 text-gray-600 hover:text-green-500">
              {isTTSEnabled ? <Volume2 className="w-6 h-6" /> : <VolumeX className="w-6 h-6" />}
            </button>
            <button onClick={() => setMessages([])} className="p-2 text-gray-600 hover:text-red-500">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Section */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={chatRef} onScroll={handleScroll}>
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
          {isProcessing && (
            <div className="flex items-center justify-start w-full p-4 gap-3">
              <img src="public/assets/dexlogo.jpeg" alt="Logo" className="w-8 h-8 rounded-full" />
              <span className="text-gray-500 animate-pulse">Processing...</span>
            </div>
          )}
          {isThinking && (
            <div className="flex items-center justify-start w-full p-4 gap-3">
              <img src="public/assets/dexlogo.jpeg" alt="Logo" className="w-8 h-8 rounded-full" />
              <span className="text-gray-500 animate-pulse">Thinking...</span>
            </div>
          )}
          {isTTSProcessing && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
              <div className="text-white text-lg">🔊 Generating audio...</div>
            </div>
          )}
        </div>

        {/* Mic Bar */}
        <div className="sticky bottom-0 z-50 p-4 border-t bg-white bg-opacity-90 flex items-center justify-between">
          <button
            onClick={handleMicClick}
            className={`p-4 rounded-full transition-colors ${
              isListening ? "bg-red-500 text-white" : "bg-gray-100 hover:bg-gray-200"
            }`}
          >
            <Mic className="w-6 h-6" />
          </button>
          {isListening && <span className="text-red-500 font-semibold">Recording...</span>}
          <button
            onClick={scrollToBottom}
            className="p-3 bg-green-500 text-white rounded-full shadow-lg hover:bg-green-600"
          >
            <ChevronDown className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
};