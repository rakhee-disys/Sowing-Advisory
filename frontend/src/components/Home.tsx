import { useNavigate } from 'react-router-dom';
import { Mic, MessageSquare } from 'lucide-react';

export const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="relative min-h-screen pt-16">
      {/* Background Video (Corrected Size - Full Fit) */}
      <div className="absolute inset-0 z-0 overflow-hidden">
        <video
          autoPlay
          loop
          muted
          playsInline
          className="absolute w-full h-full object-cover"
        >
          <source
            src="/videos/sowing.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 pt-20">
        <div className="max-w-3xl mx-auto text-center text-white">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Welcome to Sowing Advisory AI Assistant
          </h1>
          <p className="text-lg md:text-xl mb-12 text-gray-200">
            Your intelligent companion for agricultural insights and farming expertise.
            Get instant answers to your questions through voice or text chat.
          </p>

          {/* Chat Buttons */}
          <div className="flex flex-col md:flex-row gap-6 justify-center">
            <button
              onClick={() => navigate('/voice-chat')}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-green-500 hover:bg-green-600 rounded-lg transition-colors text-lg font-medium group"
            >
              <Mic className="w-6 h-6 group-hover:animate-pulse" />
              Start Voice Chat
            </button>
            <button
              onClick={() => navigate('/text-chat')}
              className="flex items-center justify-center gap-3 px-8 py-4 bg-white hover:bg-gray-100 text-gray-900 rounded-lg transition-colors text-lg font-medium group"
            >
              <MessageSquare className="w-6 h-6 group-hover:animate-pulse" />
              Start Text Chat
            </button>
          </div>

          {/* Features Section */}
          <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              {
                title: 'Expert Guidance',
                description: 'Get professional farming advice tailored to your needs',
              },
              {
                title: '24/7 Availability',
                description: 'Access assistance anytime, anywhere with our AI system',
              },
              {
                title: 'Easy Interaction',
                description: 'Choose between voice and text chat for your convenience',
              },
            ].map((feature, index) => (
              <div key={index} className="bg-white/10 backdrop-blur-sm rounded-lg p-6">
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
