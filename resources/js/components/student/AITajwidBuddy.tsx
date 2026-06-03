import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { 
  Send, Bot, User, Sparkles, X, MessageSquare, Info, Zap, 
  Book, ShieldCheck, Heart, Mic, Paperclip, Volume2, History, RotateCcw
} from 'lucide-react';

interface Message {
  id: string;
  text: string;
  sender: 'bot' | 'user';
  timestamp: Date;
}

export function AITajwidBuddy() {
  const authUser = JSON.parse(sessionStorage.getItem('authUser') || '{}');
  const studentId = authUser.linked_id;

  const [messages, setMessages] = useState<Message[]>([
    { 
      id: '1', 
      text: `Assalamualaikum ${authUser.name?.split(' ')[0] || 'Pelajar'}! Saya Ustaz AI, asisten pintar TMS anda. Saya boleh membantu menyemak rekod hafazan, jadual kelas, atau menjawab kemusykilan agama. Apa yang boleh saya bantu?`, 
      sender: 'bot', 
      timestamp: new Date() 
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isTyping]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    const currentInput = input;
    setInput('');
    setIsTyping(true);

    try {
      // Connect to system backend for dynamic responses
      const res = await axios.post('/api/chatbot/handle', {
        query: currentInput,
        student_id: studentId
      });

      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: res.data.response,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } catch (err) {
      console.error('Chatbot error', err);
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        text: "Maaf, sistem sedang sibuk. Sila cuba sebentar lagi.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMsg]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="flex h-[700px] bg-slate-100 rounded-[40px] overflow-hidden border border-slate-200 shadow-2xl relative">
      
      {/* Sidebar - History (Mock) */}
      <div className="w-64 bg-slate-50 border-r border-slate-200 hidden lg:flex flex-col p-6">
         <div className="flex items-center gap-2 mb-8 text-[#1A4D50]">
            <History className="w-5 h-5" />
            <h4 className="font-black text-xs uppercase tracking-widest">Sejarah</h4>
         </div>
         <div className="flex-1 space-y-3">
             <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-[11px] font-bold text-slate-500 cursor-pointer hover:bg-[#1A4D50] hover:text-white transition-all">
                Semakan Hafazan Terakhir
             </div>
             <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-[11px] font-bold text-slate-500 cursor-pointer hover:bg-[#1A4D50] hover:text-white transition-all">
                Hukum Ikhfa Syafawi
             </div>
             <div className="p-3 bg-white rounded-2xl border border-slate-100 shadow-sm text-[11px] font-bold text-slate-500 cursor-pointer hover:bg-[#1A4D50] hover:text-white transition-all">
                Jadual Tasmi' Abu Bakar
             </div>
         </div>
         <button className="flex items-center gap-2 justify-center py-3 text-slate-400 text-[10px] font-bold hover:text-slate-600">
            <RotateCcw className="w-3 h-3" /> PADAM SEJARAH
         </button>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="bg-[#1A4D50] p-6 text-white flex items-center justify-between shadow-lg z-10">
          <div className="flex items-center gap-4">
            <div className="bg-white/20 p-2 rounded-2xl backdrop-blur-md">
              <Bot className="w-7 h-7 text-teal-100" />
            </div>
            <div>
              <h3 className="font-black text-lg tracking-tight uppercase">Ustaz AI Assistant</h3>
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-[10px] font-black text-teal-200 uppercase tracking-widest">Bersepadu dengan Pangkalan Data TMS</span>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
               <Volume2 className="w-4 h-4" />
            </button>
            <button className="p-2 bg-white/10 rounded-xl hover:bg-white/20 transition-all">
               <Info className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Messages Area - Clean Background */}
        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-8 space-y-8 scroll-smooth bg-white"
        >
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[85%] flex gap-4 ${m.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                 <div className={`w-9 h-9 rounded-2xl flex items-center justify-center shrink-0 shadow-sm ${m.sender === 'user' ? 'bg-indigo-600' : 'bg-[#1A4D50]'}`}>
                    {m.sender === 'user' ? <User className="w-4 h-4 text-white" /> : <Sparkles className="w-4 h-4 text-teal-200" />}
                 </div>
                 <div className={`p-5 rounded-[28px] shadow-sm relative ${
                   m.sender === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-slate-50 text-slate-700 border border-slate-100 rounded-tl-none font-medium'
                 }`}>
                    <p className="text-sm md:text-base leading-relaxed">{m.text}</p>
                    <span className={`text-[9px] mt-3 block opacity-30 font-black ${m.sender === 'user' ? 'text-right' : 'text-left'}`}>
                      {m.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                 </div>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div className="flex justify-start">
              <div className="bg-slate-50 p-4 rounded-2xl rounded-tl-none border border-slate-100 flex gap-1.5 shadow-sm">
                 <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce"></div>
                 <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce delay-75"></div>
                 <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce delay-150"></div>
              </div>
            </div>
          )}
        </div>

        {/* Actions Area */}
        <div className="px-8 py-3 bg-white border-t border-slate-50 flex gap-2 overflow-x-auto no-scrollbar">
           {['Semak Hafazan Saya', 'Jadual Kelas', 'Hukum Ikhfa', 'Motivasi Hari Ini'].map((hint, i) => (
             <button 
               key={i} 
               onClick={() => setInput(hint)}
               className="whitespace-nowrap px-4 py-2 bg-slate-50 border border-slate-100 rounded-full text-[10px] font-black text-slate-500 hover:bg-[#1A4D50] hover:text-white transition-all uppercase tracking-tighter"
             >
               {hint}
             </button>
           ))}
        </div>

        {/* Input Area */}
        <div className="p-6 bg-white border-t border-slate-100 flex items-center gap-4">
          <div className="flex gap-2">
             <button title="Input Suara" className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-teal-50 hover:text-teal-600 transition-all border border-slate-100">
                <Mic className="w-5 h-5" />
             </button>
             <button title="Muat Naik Fail" className="p-3 bg-slate-50 text-slate-400 rounded-2xl hover:bg-indigo-50 hover:text-indigo-600 transition-all border border-slate-100">
                <Paperclip className="w-5 h-5" />
             </button>
          </div>
          
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="Tanya Ustaz AI tentang hafazan, jadual, atau tajwid..."
            className="flex-1 bg-slate-50 border-none rounded-[24px] px-6 py-4 focus:ring-2 focus:ring-[#1A4D50]/10 transition-all text-sm font-bold placeholder:text-slate-300"
          />
          
          <button 
            onClick={handleSend}
            className="p-4 bg-[#1A4D50] text-white rounded-3xl hover:bg-slate-800 transition-all shadow-xl shadow-teal-900/20 active:scale-95"
          >
            <Send className="w-6 h-6" />
          </button>
        </div>
      </div>
    </div>
  );
}
