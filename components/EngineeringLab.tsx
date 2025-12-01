
import React, { useState, useRef, useEffect } from 'react';
import { analyzeSketch } from '../services/geminiService';
import { ChatMessage, Project } from '../types';
import { Send, Upload, Loader2, Image as ImageIcon, X } from 'lucide-react';

interface EngineeringLabProps {
    project: Project;
    messages: ChatMessage[];
    onUpdateMessages: (msgs: ChatMessage[]) => void;
}

const EngineeringLab: React.FC<EngineeringLabProps> = ({ project, messages, onUpdateMessages }) => {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImages, setAttachedImages] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Seed welcome message if empty
  useEffect(() => {
      if (messages.length === 0) {
          const welcomeMsg: ChatMessage = {
              id: 'init',
              role: 'model',
              text: `Engineering Lab initialized for **${project.title}**.\nContext loaded: _"${project.description}"_\n\nReady for schematic analysis and calculation verification.`,
              timestamp: Date.now()
          };
          onUpdateMessages([welcomeMsg]);
      }
  }, [project.id]);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImages(prev => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setAttachedImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleSend = async () => {
    if (!input.trim() && attachedImages.length === 0) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      timestamp: Date.now(),
      images: [...attachedImages]
    };

    const newHistory = [...messages, userMsg];
    onUpdateMessages(newHistory);
    
    setInput('');
    setAttachedImages([]);
    setIsLoading(true);

    try {
      const history = newHistory
        .filter(m => m.id !== 'init')
        .map(m => ({
          role: m.role === 'user' ? 'user' : 'model',
          parts: [
              { text: m.text },
              ...(m.images || []).map(img => ({ 
                  inlineData: { mimeType: 'image/jpeg', data: img.split(',')[1] } 
              }))
          ]
        }));

      const contextString = `Project Title: ${project.title}. Project Description: ${project.description}. Project Status: ${project.status}`;
      const responseText = await analyzeSketch(history, userMsg.text, userMsg.images, contextString);

      const modelMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: responseText || "Analysis complete.",
        timestamp: Date.now()
      };
      onUpdateMessages([...newHistory, modelMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        text: "Error accessing technical database. Check connection.",
        timestamp: Date.now()
      };
      onUpdateMessages([...newHistory, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-50">
      
      {/* Main Chat Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[90%] rounded-lg p-3 shadow-sm text-xs ${
              msg.role === 'user' 
                ? 'bg-zinc-800 text-white rounded-tr-none' 
                : 'bg-white text-zinc-800 rounded-tl-none border border-zinc-200'
            }`}>
              
              {/* Render Images if any */}
              {msg.images && msg.images.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-2">
                      {msg.images.map((img, i) => (
                          <img key={i} src={img} alt="Sketch" className="max-w-[150px] rounded border border-zinc-500/30 bg-white" />
                      ))}
                  </div>
              )}

              <div className="whitespace-pre-wrap leading-relaxed font-mono markdown-body">
                  {msg.text}
              </div>
              
            </div>
          </div>
        ))}
        {isLoading && (
            <div className="flex justify-start">
                <div className="bg-white border border-zinc-200 rounded-lg rounded-tl-none p-3 flex items-center gap-2 shadow-sm">
                    <Loader2 className="animate-spin text-zinc-500" size={14} />
                    <span className="text-xs text-zinc-600 font-mono">Processing...</span>
                </div>
            </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 border-t border-zinc-200 bg-white">
        
        {/* Image Preview */}
        {attachedImages.length > 0 && (
            <div className="flex gap-2 mb-2 overflow-x-auto pb-2">
                {attachedImages.map((img, idx) => (
                    <div key={idx} className="relative group flex-shrink-0">
                        <img src={img} className="h-12 w-12 object-cover rounded border border-zinc-300" />
                        <button 
                            onClick={() => removeImage(idx)}
                            className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                            <X size={10} />
                        </button>
                    </div>
                ))}
            </div>
        )}

        <div className="flex gap-2">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleImageUpload} 
            />
            <button
                onClick={() => fileInputRef.current?.click()}
                className="p-2 text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 rounded-md transition-colors border border-transparent hover:border-zinc-200"
            >
                <Upload size={18} />
            </button>
            <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Query database..."
                className="flex-1 bg-zinc-50 border border-zinc-200 rounded-md px-3 py-1.5 font-mono text-xs focus:outline-none focus:ring-1 focus:ring-zinc-400"
            />
            <button
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && attachedImages.length === 0)}
                className="p-2 bg-zinc-900 text-white rounded-md hover:bg-zinc-800 transition-colors disabled:opacity-50"
            >
                <Send size={16} />
            </button>
        </div>
      </div>
    </div>
  );
};

export default EngineeringLab;
