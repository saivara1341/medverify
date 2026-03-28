import React, { useState, useRef, useEffect } from 'react';
import { MessageCircle, Send, X, Paperclip, Mic, Square } from 'lucide-react';

export const WhatsAppSimulator = ({ language = 'English' }: { language?: string }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<{text: string, isBot: boolean, image?: string, audio?: string}[]>([
    { text: "Type 'hi' to start the MedHAI WhatsApp bot!", isBot: true }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(scrollToBottom, [messages]);

  const sendMessage = async (text: string, image?: string, audio?: string) => {
    if (!text.trim() && !image && !audio) return;
    
    setMessages(prev => [...prev, { text, isBot: false, image, audio }]);
    setInput('');
    setIsLoading(true);

    try {
      const payload: any = { From: 'simulator', Body: text, Language: language };
      if (image) payload.MediaUrl0 = image;
      if (audio) {
          payload.MediaUrl0 = audio;
          payload.MediaContentType0 = 'audio/webm';
      }

      const response = await fetch('/api/whatsapp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      if (!response.ok) {
        const errText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errText}`);
      }
      
      const data = await response.json();
      setMessages(prev => [...prev, { text: data.reply, isBot: true }]);
    } catch (error: any) {
      console.error(error);
      setMessages(prev => [...prev, { text: `Error: ${error.message || "Failed to connect to server."}`, isBot: true }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        sendMessage('📸 Image uploaded', reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.onloadend = () => {
          sendMessage('🎤 Voice message', undefined, reader.result as string);
        };
        reader.readAsDataURL(audioBlob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      alert("Could not access microphone.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 bg-[#25D366] hover:bg-[#128C7E] text-white p-4 rounded-full shadow-2xl z-50 flex items-center gap-2 transition-transform hover:scale-105"
      >
        <MessageCircle className="w-6 h-6" />
        <span className="font-bold hidden md:inline">Try WhatsApp Bot</span>
      </button>

      {isOpen && (
        <div className="fixed bottom-24 right-6 w-[350px] h-[550px] bg-[#efeae2] rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden border border-slate-200">
          <div className="bg-[#00a884] text-white p-4 flex justify-between items-center shadow-md z-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <MessageCircle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-bold">MedHAI Bot</h3>
                <p className="text-xs text-white/80">Online</p>
              </div>
            </div>
            <button onClick={() => setIsOpen(false)} className="text-white/80 hover:text-white">
              <X className="w-6 h-6" />
            </button>
          </div>

          <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[url('https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png')]">
            {messages.map((msg, i) => (
              <div key={i} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                <div className={`max-w-[85%] rounded-lg p-3 shadow-sm ${msg.isBot ? 'bg-white rounded-tl-none' : 'bg-[#d9fdd3] rounded-tr-none'}`}>
                  {msg.image && <img src={msg.image} alt="upload" className="w-full rounded mb-2" />}
                  {msg.audio && <audio src={msg.audio} controls className="w-full max-w-[200px] mb-2 h-8" />}
                  <p className="text-sm whitespace-pre-wrap text-[#111b21]">{msg.text}</p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white rounded-lg rounded-tl-none p-3 shadow-sm text-sm text-slate-500 flex items-center gap-2">
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                  <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="bg-[#f0f2f5] p-3 flex items-center gap-2">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef}
              onChange={handleImageUpload}
            />
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="p-2 text-[#54656f] hover:bg-slate-200 rounded-full transition-colors"
            >
              <Paperclip className="w-5 h-5" />
            </button>
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage(input)}
              placeholder={isRecording ? "Recording..." : "Type a message"}
              disabled={isRecording}
              className={`flex-1 py-2 px-4 rounded-full border-none focus:ring-0 outline-none text-sm bg-white text-slate-900 placeholder-slate-500 ${isRecording ? 'opacity-50' : ''}`}
            />
            {input.trim() ? (
                <button 
                  onClick={() => sendMessage(input)}
                  className="p-2 rounded-full bg-[#00a884] text-white"
                >
                  <Send className="w-5 h-5 ml-0.5" />
                </button>
            ) : (
                <button 
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`p-2 rounded-full text-white transition-colors ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-[#00a884]'}`}
                >
                  {isRecording ? <Square className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                </button>
            )}
          </div>
        </div>
      )}
    </>
  );
};
