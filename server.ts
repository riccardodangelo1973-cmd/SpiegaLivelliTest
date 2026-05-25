import express from "express";
import path from "path";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";

dotenv.config();

const app = express();
const PORT = 3000;

// Utilizziamo l'API di parsing per richieste di grandi dimensioni (per inviare PDF e immagini in Base64)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Lazy initializer o controllo robusto per l'API Key
let aiClient: GoogleGenAI | null = null;
function getAiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("La chiave API (GEMINI_API_KEY) non è stata configurata. Per favore configurala nella sezione Settings > Secrets.");
    }
    aiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return aiClient;
}

// System instruction dettagliata basata sulle specifiche didattiche di SpiegaLivelli
const SYSTEM_INSTRUCTION = `Sei SpiegaLivelli, un assistente didattico per la scuola superiore italiana. Spieghi qualsiasi concetto disciplinare calibrando linguaggio e profondità sul livello della classe.

I TRE LIVELLI:
🟢 BIENNIO — Primo biennio (14-16 anni). Primo approccio al concetto: linguaggio accessibile, analogie con la vita quotidiana, zero tecnicismi (o spiegati subito), frasi brevi. Focus sul "cosa è" e sul "perché esiste".
Inizia sempre la risposta con [🟢 BIENNIO].

🟡 TRIENNIO — Triennio (16-18 anni). Lo studente conosce le basi: usa terminologia disciplinare corretta, connessioni con concetti già studiati, esempi contestualizzati alla materia.
Inizia sempre con [🟡 TRIENNIO].

🔴 MATURITÀ — Quinto anno, verso l'esame di stato. Padronanza completa: terminologia specialistica, riferimenti ad autori e teorie, sfumature, casi particolari, collegamenti interdisciplinari.
Inizia sempre con [🔴 MATURITÀ].

Il livello attivo è indicato dall'utente tra parentesi quadre all'inizio del messaggio (ad esempio [🟢 BIENNIO], [🟡 TRIENNIO] o [🔴 MATURITÀ]). Rispettalo sempre e adatta la risposta a quel livello specifico.

DOCUMENTI E IMMAGINI CARICATI:
Se l'utente allega un PDF, un'immagine o un documento:
- Analizza attentamente il contenuto fornito.
- Identifica i concetti principali presenti nel documento.
- Se l'utente ha già indicato un concetto specifico da spiegare in combinazione con il documento, spiegalo direttamente calibrando la spiegazione sul livello attivo dell'aula.
- Se l'utente non specifica alcun concetto, chiedi esplicitamente quale concetto vuole approfondire tra quelli di rilievo che hai rilevato nel documento.
- Puoi leggere testi, grafici, formule, schemi, tavole, mappe.

Dopo ogni spiegazione aggiungi esattamente su una nuova riga separata:
"— Vuoi salire di livello? Hai domande su quello che ho detto?"

REGOLA FONDAMENTALE: non risolvere mai esercizi specifici (non fare compiti a casa o calcoli per loro passo-passo). Spiega invece con pazienza il concetto teorico, la formula o la logica sottostante. Sii sempre incoraggiante ed empatico, valorizzando la curiosità del docente e dello studente.`;

// Endpoint per la spiegazione didattica del concetto
app.post("/api/explain", async (req, res) => {
  try {
    const { messages, level, newConcept, attachedFile } = req.body;

    if (!newConcept && !attachedFile) {
      return res.status(400).json({ error: "Inserisci un concetto o allega un file per iniziare." });
    }

    const ai = getAiClient();

    // Determiniamo il tag del livello da prependere
    let tag = "🟢 BIENNIO";
    if (level === "triennio") {
      tag = "🟡 TRIENNIO";
    } else if (level === "maturita") {
      tag = "🔴 MATURITÀ";
    }

    // Costruiamo i content per Gemini seguendo la storia
    const contents: any[] = [];

    // 1. Convertiamo i vecchi messaggi della conversazione passati dal client
    if (Array.isArray(messages)) {
      messages.forEach((msg: any) => {
        const parts: any[] = [{ text: msg.text }];
        if (Array.isArray(msg.files)) {
          msg.files.forEach((f: any) => {
            const cleanB64 = f.data.includes("base64,") ? f.data.split("base64,")[1] : f.data;
            parts.push({
              inlineData: {
                mimeType: f.type,
                data: cleanB64,
              },
            });
          });
        }
        contents.push({
          role: msg.sender === "user" ? "user" : "model",
          parts: parts,
         });
      });
    }

    // 2. Costruiamo l'ultimo messaggio dell'utente correntemente inviato
    const currentParts: any[] = [];
    const formattedText = `[${tag}] ${newConcept || "Analizza questo documento"}`;
    currentParts.push({ text: formattedText });

    if (attachedFile) {
      const cleanBase64 = attachedFile.data.includes("base64,") ? attachedFile.data.split("base64,")[1] : attachedFile.data;
      currentParts.push({
        inlineData: {
          mimeType: attachedFile.type,
          data: cleanBase64,
        },
      });
    }

    contents.push({
      role: "user",
      parts: currentParts,
    });

    // Chiamata all'API di Gemini 3.5 Flash
    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: SYSTEM_INSTRUCTION,
        temperature: 0.7,
      },
    });

    const aiText = response.text || "Non ho ricevuto risposta da Gemini, riprova.";
    
    // Restituiamo il testo generato e il messaggio inviato comprensivo di tag per scopi di visualizzazione coerente
    res.json({
      text: aiText,
      sentText: formattedText,
    });

  } catch (error: any) {
    console.error("Errore chiamando Gemini API:", error);
    res.status(500).json({ error: error.message || "Errore sconosciuto nel server di generazione." });
  }
});

// Configurazione Vite ed Express per lo sviluppo / produzione
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Server] SpiegaLivelli running on http://localhost:${PORT}`);
  });
}

startServer();
