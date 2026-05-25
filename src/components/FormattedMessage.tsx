import React from "react";

interface FormattedMessageProps {
  text: string;
}

export default function FormattedMessage({ text }: FormattedMessageProps) {
  if (!text) return null;

  // Spezziamo la stringa alla riga finale che suggerisce di cambiare livello
  // p.es. "— Vuoi salire di livello? Hai domande su quello che ho detto?"
  const footerPattern = "— Vuoi salire di livello? Hai domande su quello che ho detto?";
  let bodyText = text;
  let hasFooter = false;

  if (text.includes(footerPattern)) {
    bodyText = text.replace(footerPattern, "").trim();
    hasFooter = true;
  } else if (text.includes("Vuoi salire di livello?")) {
    // Gestiamo varianti minori o spaziature
    const index = text.lastIndexOf("—");
    if (index !== -1 && text.substring(index).includes("livello")) {
      bodyText = text.substring(0, index).trim();
      hasFooter = true;
    }
  }

  // Funzione per formattare una singola linea (grassetti, corsivi, badge dei livelli)
  const formatLineText = (line: string): React.ReactNode[] => {
    let elements: React.ReactNode[] = [];
    let currentText = line;

    // Rileviamo ed estraiamo i badge dei livelli se presenti all'inizio (es. [🟢 BIENNIO])
    const levelBadgeRegex = /^\[(🟢 BIENNIO|🟡 TRIENNIO|🔴 MATURITÀ)\]/;
    const badgeMatch = currentText.match(levelBadgeRegex);
    if (badgeMatch) {
      const matchText = badgeMatch[1];
      let badgeClass = "";
      if (matchText.includes("BIENNIO")) {
        badgeClass = "bg-emerald-50 text-emerald-800 border bg-emerald-100/50 border-emerald-300";
      } else if (matchText.includes("TRIENNIO")) {
        badgeClass = "bg-amber-50 text-amber-800 border bg-amber-100/50 border-amber-300";
      } else {
        badgeClass = "bg-rose-50 text-rose-800 border bg-rose-100/50 border-rose-300";
      }

      elements.push(
        <span key="badge" className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider mr-2 ${badgeClass}`}>
          {matchText}
        </span>
      );
      currentText = currentText.replace(levelBadgeRegex, "").trim();
    }

    // Parsiamo il grassetto **testo** e corsivo *testo*
    // Un parser robusto basato su split
    const parts = currentText.split(/(\*\*.*?\*\*|\*.*?\*)/g);
    parts.forEach((part, index) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        elements.push(
          <strong key={`bold-${index}`} className="font-bold text-slate-900">
            {part.slice(2, -2)}
          </strong>
        );
      } else if (part.startsWith("*") && part.endsWith("*")) {
        elements.push(
          <em key={`italic-${index}`} className="italic text-slate-800">
            {part.slice(1, -1)}
          </em>
        );
      } else {
        elements.push(part);
      }
    });

    return elements;
  };

  // Convertiamo le linee in blocchi HTML
  const lines = bodyText.split("\n");
  const blocks: React.ReactNode[] = [];
  let currentList: { type: "bullet" | "ordered"; items: React.ReactNode[] } | null = null;

  const pushCurrentList = (key: string | number) => {
    if (currentList) {
      if (currentList.type === "bullet") {
        blocks.push(
          <ul key={`list-${key}`} className="list-disc list-outside pl-6 mb-4 space-y-1.5 text-slate-700">
            {currentList.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        );
      } else {
        blocks.push(
          <ol key={`list-${key}`} className="list-decimal list-outside pl-6 mb-4 space-y-1.5 text-slate-700">
            {currentList.items.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        );
      }
      currentList = null;
    }
  };

  lines.forEach((line, index) => {
    const trimmedLine = line.trim();

    // Righe vuote
    if (!trimmedLine) {
      pushCurrentList(index);
      return;
    }

    // Intestazioni (es. ### Titolo o ## Titolo o # Titolo)
    if (trimmedLine.startsWith("#")) {
      pushCurrentList(index);
      const level = trimmedLine.match(/^#+/)?.[0].length || 1;
      const titleText = trimmedLine.replace(/^#+\s*/, "");
      const formattedTitle = formatLineText(titleText);

      if (level === 1) {
        blocks.push(
          <h1 key={index} className="text-xl sm:text-2xl font-bold text-slate-900 mt-5 mb-3 tracking-tight">
            {formattedTitle}
          </h1>
        );
      } else if (level === 2) {
        blocks.push(
          <h2 key={index} className="text-lg sm:text-xl font-semibold text-slate-900 mt-4 mb-2 tracking-tight">
            {formattedTitle}
          </h2>
        );
      } else {
        blocks.push(
          <h3 key={index} className="text-base sm:text-lg font-semibold text-slate-800 mt-3 mb-2">
            {formattedTitle}
          </h3>
        );
      }
      return;
    }

    // Liste non ordinate (- o * o •)
    const bulletMatch = trimmedLine.match(/^[-*•]\s+(.*)/);
    if (bulletMatch) {
      const itemContent = formatLineText(bulletMatch[1]);
      if (currentList && currentList.type === "bullet") {
        currentList.items.push(itemContent);
      } else {
        pushCurrentList(index);
        currentList = { type: "bullet", items: [itemContent] };
      }
      return;
    }

    // Liste ordinate (1. o 2. ecc)
    const orderedMatch = trimmedLine.match(/^(\d+)\.\s+(.*)/);
    if (orderedMatch) {
      const itemContent = formatLineText(orderedMatch[2]);
      if (currentList && currentList.type === "ordered") {
        currentList.items.push(itemContent);
      } else {
        pushCurrentList(index);
        currentList = { type: "ordered", items: [itemContent] };
      }
      return;
    }

    // Se arriviamo qui ed eravamo in una lista, la chiudiamo
    pushCurrentList(index);

    // Paragrafi normali o citazioni
    if (trimmedLine.startsWith(">")) {
      const textBlock = trimmedLine.replace(/^>\s*/, "");
      blocks.push(
        <blockquote key={index} className="border-l-4 border-slate-300 pl-4 py-1 italic bg-slate-50 text-slate-600 rounded-r mb-3 text-sm">
          {formatLineText(textBlock)}
        </blockquote>
      );
    } else {
      blocks.push(
        <p key={index} className="leading-relaxed text-slate-700 mb-3 text-sm sm:text-base">
          {formatLineText(line)}
        </p>
      );
    }
  });

  // Ultima spinta nel caso in cui la lista fosse ancora aperta alla fine
  pushCurrentList("last");

  return (
    <div className="space-y-1">
      {blocks}

      {hasFooter && (
        <div className="mt-6 pt-4 border-t border-slate-100 bg-slate-50/70 p-4 rounded-xl border border-slate-200/50">
          <div className="flex items-start gap-2.5">
            <span className="text-lg">💡</span>
            <div className="flex-1">
              <p className="text-xs sm:text-sm font-medium text-slate-700 italic">
                {footerPattern}
              </p>
              <p className="text-[11px] text-slate-400 mt-1">
                Usa i pulsanti in alto per testare la spiegazione a un livello diverso o fai domande di approfondimento qui sotto.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
