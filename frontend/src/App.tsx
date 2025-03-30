// src/App.tsx

import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { Header } from "./components/Header";
import { Home } from "./components/Home";
import { VoiceChat } from "./pages/VoiceChat";
import { TextChat } from "./pages/TextChat";
import { About } from "./pages/About";
import { Contact } from "./pages/Contact";

const App: React.FC = () => {
  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/voice-chat" element={<VoiceChat />} />
          <Route path="/text-chat" element={<TextChat />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
        </Routes>
      </div>
    </Router>
  );
};

export default App;
