import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  Send,
  Paperclip,
  X,
  Trash2,
  Sparkles,
  BookOpen,
  FileText,
  Image as ImageIcon,
  AlertCircle,
  Loader2,
  HelpCircle,
  ArrowRight
} from "lucide-react";
import FormattedMessage from "./components/FormattedMessage";

// Definizione dei tipi
interface AttachedFile {
  name: string;
  data: string; // Base64
  type: string; // Mime type
  size?: number;
}

interface Message {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  level: "biennio" | "triennio" | "maturita";
  files?: AttachedFile[];
}

const LEVEL_CONFIGS = {
  biennio: {
    id: "biennio" as const,
    label: "Biennio",
    icon: "🟢",
    classes: "border-[#22c55e] bg-[#22c55e]/10 text-slate-850 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]",
    hoverClasses: "hover:bg-slate-50 hover:border-slate-300",
    badgeClasses: "bg-[#22c55e]/15 text-[#1b9a46] border-[#22c55e]/30 font-bold",
    borderColor: "border-[#22c55e]",
    focusRing: "focus-within:ring-[#22c55e]/20",
    bgColor: "bg-[#22c55e]",
    btnColor: "bg-[#22c55e] hover:bg-[#1ea34d]",
    bubbleClasses: "border-l-4 border-[#22c55e]",
    shortDesc: "Primo approccio al concetto",
    targetAge: "14-16 anni",
    description: "Linguaggio accessibile, analogie quotidiane, zero tecnicismi non spiegati, frasi brevi. Focus sul \"cosa è\" e \"perché esiste\"."
  },
  triennio: {
    id: "triennio" as const,
    label: "Triennio",
    icon: "🟡",
    classes: "border-[#f59e0b] bg-[#f59e0b]/10 text-slate-850 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]",
    hoverClasses: "hover:bg-slate-50 hover:border-slate-300",
    badgeClasses: "bg-[#f59e0b]/15 text-[#b45309] border-[#f59e0b]/30 font-bold",
    borderColor: "border-[#f59e0b]",
    focusRing: "focus-within:ring-[#f59e0b]/20",
    bgColor: "bg-[#f59e0b]",
    btnColor: "bg-[#f59e0b] hover:bg-[#d97706]",
    bubbleClasses: "border-l-4 border-[#f59e0b]",
    shortDesc: "Ha già le basi della materia",
    targetAge: "16-18 anni",
    description: "Terminologia disciplinare corretta, connessione con concetti già studiati, esempi contestualizzati e strutturati."
  },
  maturita: {
    id: "maturita" as const,
    label: "Maturità",
    icon: "🔴",
    classes: "border-[#ef4444] bg-[#ef4444]/10 text-slate-850 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)]",
    hoverClasses: "hover:bg-slate-50 hover:border-slate-300",
    badgeClasses: "bg-[#ef4444]/15 text-[#dc2626] border-[#ef4444]/30 font-bold",
    borderColor: "border-[#ef4444]",
    focusRing: "focus-within:ring-[#ef4444]/20",
    bgColor: "bg-[#ef4444]",
    btnColor: "bg-[#ef4444] hover:bg-[#dc2626]",
    bubbleClasses: "border-l-4 border-[#ef4444]",
    shortDesc: "Verso l'esame di stato",
    targetAge: "Quinto anno",
    description: "Terminologia specialistica, riferimenti ad autori e teorie, sfumature critiche, casi particolari e collegamenti interdisciplinari."
  }
};

const SUGGESTIONS = [
  {
    title: "Il principio di Archimede",
    subject: "Fisica",
    level: "biennio" as const,
    prompt: "Spiegami il principio di Archimede e per quale motivo una nave enorme di ferro riesce a galleggiare sull'acqua."
  },
  {
    title: "La struttura dell'atomo",
    subject: "Chimica",
    level: "triennio" as const,
    prompt: "Spiegami la struttura dell'atomo descrivendo la differenza tra il modello evoluto (Rutherford/Bohr) e la visione a orbitali."
  },
  {
    title: "Iperinflazione nella Repubblica di Weimar",
    subject: "Storia",
    level: "maturita" as const,
    prompt: "Commenta le cause economiche, sociali e politiche che hanno scatenato l'iperinflazione degli anni venti in Germania e le ripercussioni successive."
  }
];

export default function App() {
  const [level, setLevel] = useState<"biennio" | "triennio" | "maturita">("biennio");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [attachedFile, setAttachedFile] = useState<AttachedFile | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState<string | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Caricamento dei messaggi da localStorage all'avvio
  useEffect(() => {
    try {
      const stored = localStorage.getItem("spiegalivelli_messages");
      if (stored) {
        setMessages(JSON.parse(stored));
      }
      const storedLevel = localStorage.getItem("spiegalivelli_level");
      if (storedLevel && (storedLevel === "biennio" || storedLevel === "triennio" || storedLevel === "maturita")) {
        setLevel(storedLevel);
      }
    } catch (e) {
      console.error("Incapacità di caricare la cronologia", e);
    }
  }, []);

  // Salvataggio dei messaggi al variare della cronologia
  useEffect(() => {
    try {
      localStorage.setItem("spiegalivelli_messages", JSON.stringify(messages));
    } catch (e) {
      console.error("Incapacità di salvare la cronologia", e);
    }
  }, [messages]);

  // Salvataggio del livello al cambio
  useEffect(() => {
    localStorage.setItem("spiegalivelli_level", level);
  }, [level]);

  // Scroll automatico all'ultimo messaggio
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Regola l'altezza della textarea in base al contenuto
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  // Gestione allegati (Img e PDF)
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Controllo dimensione: limite 15MB
    if (file.size > 15 * 1024 * 1024) {
      setErrorText("Il file supera il limite massimo consentito di 15MB.");
      return;
    }

    try {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedFile({
          name: file.name,
          data: reader.result as string,
          type: file.type || "application/octet-stream",
          size: file.size
        });
        setErrorText(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error("Errore nella lettura del file:", err);
      setErrorText("Impossibile leggere il file selezionato. Riprova con un altro documento.");
    }

    // Resetta l'input file per consentire di ridefinire lo stesso file
    if (e.target) {
      e.target.value = "";
    }
  };

  const removeAttachedFile = () => {
    setAttachedFile(null);
  };

  const handleLevelSelect = (newLevel: "biennio" | "triennio" | "maturita") => {
    setLevel(newLevel);
  };

  // Funzione per inviare la query dell'utente
  const handleSend = async (customText?: string) => {
    const textToSend = customText !== undefined ? customText : inputText;
    
    // Possiamo inviare se c'è testo oppure se c'è un file allegato
    if (!textToSend.trim() && !attachedFile) return;

    setErrorText(null);
    setLoading(true);

    const userMsgId = `user-${Date.now()}`;
    const aiMsgId = `ai-${Date.now()}`;

    // Creiamo il messaggio utente locale da visualizzare nella chat
    const userMessage: Message = {
      id: userMsgId,
      sender: "user",
      text: textToSend, // Nel client teniamo il testo pulito per una visualizzazione ordinata
      timestamp: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
      level: level,
      files: attachedFile ? [attachedFile] : undefined
    };

    // Aggiungiamo il messaggio dell'utente alla chat locale
    setMessages((prev) => [...prev, userMessage]);
    
    // Puliamo gli input
    if (customText === undefined) {
      setInputText("");
    }
    const currentAttachedFile = attachedFile;
    setAttachedFile(null);

    try {
      // Prepariamo i messaggi passati per mantenere il contesto delle risposte
      // Escludiamo dati pesanti non strettamente necessari o riduciamo l'array se troppo lungo
      const chatHistory = messages.map(m => ({
        sender: m.sender,
        text: m.sender === "user" ? `[${m.level.toUpperCase()}] ${m.text}` : m.text,
        files: m.files
      }));

      // Chiamata all'endpointExpress `/api/explain`
      const response = await fetch("/api/explain", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          messages: chatHistory,
          level: level,
          newConcept: textToSend,
          attachedFile: currentAttachedFile ? {
            name: currentAttachedFile.name,
            data: currentAttachedFile.data,
            type: currentAttachedFile.type
          } : null
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Errore sconosciuto dal server didattico.");
      }

      const data = await response.json();

      // Creiamo il messaggio dell'AI
      const aiMessage: Message = {
        id: aiMsgId,
        sender: "ai",
        text: data.text,
        timestamp: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
        level: level
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (err: any) {
      console.error("Errore durante l'invio:", err);
      setErrorText(err.message || "Qualcosa è andato storto nel contatto con l'assistente didattico. Riprova.");
      
      // Rimuoviamo l'ultimo messaggio dell'utente se ha fallito subito, oppure lasciamolo e segnaliamo l'errore
      const failedMessage: Message = {
        id: `err-${Date.now()}`,
        sender: "ai",
        text: `⚠️ **Errore di connessione:** ${err.message || "Impossibile calibrare la spiegazione attuale."}\n\nAssicurati che la chiave API sia configurata correttamente nei Settings o riprova fra poco.`,
        timestamp: new Date().toLocaleTimeString("it-IT", { hour: "2-digit", minute: "2-digit" }),
        level: level
      };
      setMessages((prev) => [...prev, failedMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Azzeramento totale della chat
  const handleNewConversation = () => {
    setShowClearConfirm(true);
  };

  const confirmReset = () => {
    setMessages([]);
    setInputText("");
    setAttachedFile(null);
    setErrorText(null);
    setShowClearConfirm(false);
    try {
      localStorage.removeItem("spiegalivelli_messages");
    } catch (e) {
      console.error(e);
    }
  };

  // Invio rapido con un suggerimento di esempio
  const handleSuggestionClick = (sug: typeof SUGGESTIONS[0]) => {
    handleLevelSelect(sug.level);
    handleSend(sug.prompt);
  };

  const activeConfig = LEVEL_CONFIGS[level];

  return (
    <div id="spiegalivelli-app" className="min-h-screen bg-[#f8fafc] flex flex-col font-sans text-[#1e293b] antialiased">
      {/* Header principale - Vibrant Palette Design Style */}
      <header className="bg-[#f8fafc] sticky top-0 z-10 transition-all duration-300 pt-6 pb-2">
        <div className="max-w-4xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-center sm:text-left">
            <h1 className="text-[32px] font-extrabold text-[#1e293b] tracking-[-0.5px] leading-tight flex items-center justify-center sm:justify-start gap-2">
              SpiegaLivelli
            </h1>
            <p className="text-[16px] text-[#64748b] mt-1 font-normal">
              Scegli il livello della classe e scrivi il concetto da spiegare
            </p>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                id="btn-new-conversation"
                onClick={handleNewConversation}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-semibold text-slate-700 hover:text-rose-600 bg-white hover:bg-rose-50 border border-slate-200 hover:border-rose-200 rounded-full shadow-sm transition-all duration-200"
              >
                <Trash2 className="w-4 h-4" />
                <span>Nuova conversazione</span>
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-6 flex flex-col gap-6 overflow-hidden">
        
        {/* SELETTORE LIVELLO — tre pulsanti affiancati */}
        <section id="level-selector-section">
          <div className="grid grid-cols-3 gap-4 mb-6">
            {(Object.keys(LEVEL_CONFIGS) as Array<keyof typeof LEVEL_CONFIGS>).map((lvlKey) => {
              const cfg = LEVEL_CONFIGS[lvlKey];
              const isActive = level === lvlKey;
              
              // Determiniamo il colore del dot in base al livello
              let dotBg = "bg-[#22c55e]";
              if (cfg.id === "triennio") dotBg = "bg-[#f59e0b]";
              if (cfg.id === "maturita") dotBg = "bg-[#ef4444]";

              return (
                <button
                  key={cfg.id}
                  id={`btn-level-${cfg.id}`}
                  onClick={() => handleLevelSelect(cfg.id)}
                  className={`btn-level text-left rounded-2xl p-4 border-2 shadow-[0_4px_6px_-1px_rgba(0,0,0,0.1)] cursor-pointer transition-all duration-300 relative ${
                    isActive
                      ? cfg.classes
                      : "border-transparent bg-white text-[#1e293b] hover:border-slate-200"
                  }`}
                >
                  <span className="level-title font-extrabold text-[16px] sm:text-[18px] text-[#1e293b] flex items-center gap-2 mb-1">
                    <span className={`level-dot w-3 h-3 rounded-full inline-block shrink-0 ${dotBg}`}></span>
                    {cfg.label}
                  </span>
                  <span className="level-desc block text-xs sm:text-[13px] text-[#64748b] leading-snug">
                    {cfg.shortDesc}
                  </span>

                  {/* Età/Target */}
                  <span className={`inline-block text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mt-2.5 ${
                    isActive ? "bg-white/80 text-slate-800" : "bg-slate-100 text-slate-500"
                  }`}>
                    {cfg.targetAge}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Didascalia del livello attivo */}
          <motion.div
            layoutId="level-caption"
            className="bg-white px-4 py-3 rounded-xl border border-slate-200/60 shadow-sm flex items-start gap-2.5 text-xs sm:text-xs text-[#64748b]"
          >
            <span className="text-base mt-0.5">💡</span>
            <div>
              <span className="font-bold text-[#1e293b] uppercase">
                Metodologia {activeConfig.label}:
              </span>{" "}
              {activeConfig.description}
            </div>
          </motion.div>
        </section>

        {/* Zona Chat / Contenuto - Vibrant Palette design */}
        <section className="flex-1 bg-white border border-[#e2e8f0] rounded-[24px] shadow-sm flex flex-col overflow-hidden min-h-[400px]">
          <div className="flex-1 overflow-y-auto p-6 space-y-5">
            <AnimatePresence initial={false}>
              {messages.length === 0 ? (
                /* Schermata iniziale amichevole */
                <motion.div
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto py-10 px-2"
                >
                  <div className="w-16 h-16 rounded-full bg-[#f8fafc] border border-slate-100 flex items-center justify-center text-3xl mb-4 shadow-inner">
                    🎓
                  </div>
                  <h3 className="text-xl font-bold text-[#1e293b] tracking-tight">
                    Crea spiegazioni calibrate all'istante
                  </h3>
                  <p className="text-sm text-[#64748b] mt-2 leading-relaxed">
                    Benvenuto su <b>SpiegaLivelli</b>. Questo strumento aiuta i docenti a strutturare l'esposizione di qualunque materia adattando il tono per studenti di età diverse.
                  </p>

                  <div className="w-full mt-6 text-left border-t border-slate-100 pt-5 space-y-3">
                    <p className="text-xs font-bold text-[#64748b] uppercase tracking-wider flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#f59e0b]" /> Esempi pronti all'uso:
                    </p>
                    
                    <div className="space-y-2">
                      {SUGGESTIONS.map((sug, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSuggestionClick(sug)}
                          className="w-full p-3 text-left border border-slate-200 hover:border-indigo-200 hover:bg-[#f8fafc] rounded-xl text-xs flex items-center justify-between gap-3 group transition-all duration-200"
                        >
                          <div className="min-w-0">
                            <span className="text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded mr-1.5 bg-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-700">
                              {sug.level.toUpperCase()}
                            </span>
                            <span className="font-semibold text-slate-700 group-hover:text-indigo-900">
                              {sug.title}
                            </span>
                          </div>
                          <ArrowRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-indigo-500 shrink-0 group-hover:translate-x-1 transition-all" />
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              ) : (
                /* Elenco messaggi */
                messages.map((msg) => {
                  const isUser = msg.sender === "user";
                  const cfg = LEVEL_CONFIGS[msg.level];

                  // Colore per tag utente
                  let tagColor = "text-[#22c55e]";
                  if (msg.level === "triennio") tagColor = "text-[#f59e0b]";
                  if (msg.level === "maturita") tagColor = "text-[#ef4444]";

                  return (
                    <motion.div
                      key={msg.id}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isUser ? "justify-end" : "justify-start"} w-full`}
                    >
                      <div className={`max-w-[80%] p-[14px_18px] shadow-sm relative text-[15px] leading-[1.5] ${
                        isUser
                          ? "bg-[#1e293b] text-white rounded-[20px] rounded-br-[4px]"
                          : `bg-[#f1f5f9] text-[#1e293b] rounded-[20px] rounded-bl-[4px] ${cfg.bubbleClasses}`
                      }`}>
                        
                        {/* Intestazione del messaggio */}
                        <div className="flex items-center justify-between gap-4 mb-2 pb-1.5 border-b border-slate-200/20">
                          <span className={`text-[10px] sm:text-xs font-bold tracking-wider uppercase ${
                            isUser ? "text-slate-300" : "text-[#64748b]"
                          }`}>
                            {isUser ? "👨‍🏫 Tu (Docente)" : "💡 SpiegaLivelli Assistant"}
                          </span>

                          <div className="flex items-center gap-1.5">
                            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-full uppercase tracking-tight ${
                              isUser 
                                ? "bg-slate-800 text-slate-200 border border-slate-700" 
                                : cfg.badgeClasses
                            }`}>
                              {cfg.icon} {cfg.label}
                            </span>
                            <span className="text-[9px] text-slate-400">
                              {msg.timestamp}
                            </span>
                          </div>
                        </div>

                        {/* Corpo del messaggio */}
                        <div className="break-words">
                          {isUser ? (
                            <p className="whitespace-pre-line text-slate-100">
                              <span className={`tag font-extrabold mr-1.5 ${tagColor}`}>
                                [{cfg.icon} {cfg.label.toUpperCase()}]
                              </span>
                              {msg.text}
                            </p>
                          ) : (
                            <FormattedMessage text={msg.text} />
                          )}
                        </div>

                        {/* Eventuali file mostrati in anteprima sotto il messaggio dell'utente */}
                        {isUser && msg.files && msg.files.length > 0 && (
                          <div className="mt-3 pt-2 border-t border-slate-800 space-y-1.5">
                            {msg.files.map((file, fIdx) => (
                              <div
                                key={fIdx}
                                className="inline-flex items-center gap-2 bg-slate-800 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                              >
                                {file.type.startsWith("image/") ? (
                                  <div className="w-8 h-8 rounded bg-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                                    <img src={file.data} referrerPolicy="no-referrer" alt={file.name} className="w-full h-full object-cover" />
                                  </div>
                                ) : (
                                  <FileText className="w-5 h-5 text-indigo-400 shrink-0" />
                                )}
                                <span className="truncate max-w-[140px] sm:max-w-xs font-medium">
                                  {file.name}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>

            {/* Stato Caricamento */}
            <AnimatePresence>
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="flex justify-start w-full"
                >
                  <div className={`max-w-[85%] rounded-2xl p-4 bg-white border border-slate-200 rounded-tl-none ${activeConfig.bubbleClasses} shadow-sm`}>
                    <div className="flex items-center gap-3">
                      <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">
                          SpiegaLivelli sta elaborando...
                        </p>
                        <p className="text-xs text-slate-400">
                          Sto calibrando la terminologia per il {activeConfig.label} ({activeConfig.targetAge})
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div ref={chatEndRef} />
          </div>

          {/* Area Errori */}
          {errorText && (
            <div className="bg-rose-50 border-t border-rose-100 px-4 py-3 flex items-start gap-2 text-xs sm:text-sm text-rose-800">
              <AlertCircle className="w-4 h-4 mt-0.5 text-rose-600 shrink-0" />
              <div className="flex-1">
                <span className="font-semibold">Errore:</span> {errorText}
              </div>
              <button onClick={() => setErrorText(null)} className="text-rose-400 hover:text-rose-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Sezione File Allegato prima dell'invio */}
          {attachedFile && (
            <div className="bg-slate-50 border-t border-slate-100 px-4 py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 bg-indigo-50 rounded border border-indigo-100 shrink-0">
                  {attachedFile.type.startsWith("image/") ? (
                    <ImageIcon className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <FileText className="w-4 h-4 text-indigo-600" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs sm:text-sm font-semibold text-slate-700 truncate max-w-[200px] sm:max-w-md">
                    {attachedFile.name}
                  </p>
                  <p className="text-[10px] text-slate-400 uppercase font-bold">
                    Allegato pronto all'invio ({(attachedFile.size ? (attachedFile.size / 1024).toFixed(1) : 0)} KB)
                  </p>
                </div>
              </div>
              <button
                onClick={removeAttachedFile}
                className="p-1.5 text-slate-400 hover:text-rose-600 bg-white hover:bg-rose-50 rounded-full border border-slate-100 hover:border-rose-100 transition-all shadow-sm"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* INPUT BAR in fondo, con bordo del livello attivo - Vibrant Palette Design Style */}
          <div className="p-4 bg-slate-50/50 border-t border-slate-100">
            <div
              className={`bg-white border-2 rounded-[20px] transition-all duration-300 shadow-[0_10px_15px_-3px_rgba(0,0,0,0.05)] flex items-center p-3 gap-3 ${activeConfig.borderColor} ${activeConfig.focusRing}`}
            >
              {/* Bottone per allegato file a sinistra - Vibrant Palette Style */}
              <button
                id="btn-attach"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading}
                className={`w-12 h-12 rounded-[14px] bg-[#f8fafc] border-none flex items-center justify-center text-[#64748b] text-[20px] transition-all hover:bg-slate-100 shrink-0 ${
                  loading ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
                }`}
                title="Allega file (PDF o immagini)"
              >
                <Paperclip className="w-[20px] h-[20px]" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept="image/*,.pdf"
                className="hidden"
              />

              {/* Textarea centrale */}
              <div className="flex-1">
                <textarea
                  id="input-concept"
                  ref={textareaRef}
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  onKeyDown={handleKeyPress}
                  disabled={loading}
                  rows={1}
                  placeholder="Che concetto vuoi che ti spieghi?"
                  className="w-full bg-transparent border-none outline-none text-[#1e293b] text-[16px] py-1 placeholder-[#64748b] resize-none min-h-[24px] focus:outline-none focus:ring-0"
                />
              </div>

              {/* Pulsante Invia a destra - Vibrant Palette Style */}
              <button
                id="btn-send"
                onClick={() => handleSend()}
                disabled={loading || (!inputText.trim() && !attachedFile)}
                className={`px-6 h-12 rounded-[14px] font-bold text-sm uppercase tracking-[0.5px] text-white transition-all shrink-0 flex items-center justify-center gap-2 ${
                  loading || (!inputText.trim() && !attachedFile)
                    ? "bg-slate-200 text-slate-400 cursor-not-allowed"
                    : `${activeConfig.btnColor} cursor-pointer`
                }`}
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                    <span>Invia</span>
                    <Send className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
            
            <div className="mt-2.5 flex items-center justify-between px-1">
              <span className="text-[10px] text-slate-400 font-medium">
                Schiaccia <b>Invio</b> per trasmettere, <b>Shift + Invio</b> per andare a capo.
              </span>
              <span className="hidden xs:inline text-[10px] text-slate-400 italic">
                Formulato per la scuola secondaria di secondo grado.
              </span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer minimalista */}
      <footer className="py-4 border-t border-slate-200 bg-white text-center text-xs text-slate-400 mt-6 font-medium">
        <div className="max-w-4xl mx-auto px-4 flex flex-col xs:flex-row items-center justify-between gap-2">
          <span>
            SpiegaLivelli &copy; 2026 — Didattica scolastica avanzata con Gemini 3.5 Flash
          </span>
          <span className="flex items-center gap-1.5 font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 block"></span> PROGETTO ATTIVO
          </span>
        </div>
      </footer>

      {/* Dialog di conferma per azzeramento chat - Vibrant Palette Style */}
      <AnimatePresence>
        {showClearConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowClearConfirm(false)}
              className="absolute inset-0 bg-[#0f172a]/60 backdrop-blur-xs"
            />
            
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 15 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 15 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="relative bg-white border border-[#e2e8f0] rounded-[24px] max-w-sm w-full p-6 shadow-2xl z-10 text-center"
            >
              <div className="w-14 h-14 bg-rose-50 border border-rose-100 text-[#ef4444] rounded-full flex items-center justify-center mx-auto mb-4 text-2xl font-bold">
                ⚠️
              </div>
              <h3 className="text-lg font-extrabold text-[#1e293b] tracking-tight">
                Nuova conversazione?
              </h3>
              <p className="text-sm text-[#64748b] mt-2 mb-6 leading-relaxed">
                Questo svuoterà l'intera chat corrente e tutti gli allegati preparati. Sei sicuro di voler procedere?
              </p>
              
              <div className="flex gap-3 justify-center">
                <button
                  type="button"
                  onClick={() => setShowClearConfirm(false)}
                  className="px-5 py-2.5 rounded-xl border border-slate-200 text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-all duration-150 cursor-pointer flex-1"
                >
                  Annulla
                </button>
                <button
                  type="button"
                  id="confirm-reset-btn"
                  onClick={confirmReset}
                  className="px-5 py-2.5 rounded-xl bg-[#ef4444] hover:bg-[#dc2626] text-white text-sm font-bold tracking-wide transition-all duration-150 cursor-pointer shadow-md shadow-rose-100 flex-1"
                >
                  Sì, azzera
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
