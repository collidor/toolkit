import React, { useState, useMemo } from "react";
import Prism from "prismjs";
import "prismjs/components/prism-typescript";

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  actionLabel?: string;
  onAction?: () => void;
  outputLog?: string | null;
  anchorId?: string;
}

export const CodeBlock: React.FC<CodeBlockProps> = ({
  code,
  language = "typescript",
  title = "TypeScript",
  actionLabel,
  onAction,
  outputLog,
  anchorId,
}) => {
  const [copied, setCopied] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isRunning, setIsRunning] = useState(false);

  const highlightedHtml = useMemo(() => {
    try {
      const grammar = Prism.languages[language] || Prism.languages.typescript;
      return Prism.highlight(code.trim(), grammar, language);
    } catch {
      return code.trim();
    }
  }, [code, language]);

  const handleCopy = () => {
    navigator.clipboard.writeText(code.trim());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleCopyLink = () => {
    if (!anchorId) return;
    const url = new URL(window.location.href);
    url.hash = anchorId;
    navigator.clipboard.writeText(url.toString());
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2000);
  };

  const handleRun = async () => {
    if (!onAction) return;
    setIsRunning(true);
    try {
      await onAction();
    } finally {
      setTimeout(() => setIsRunning(false), 300);
    }
  };

  return (
    <div id={anchorId} className="code-block-container rounded-xl border border-slate-800 bg-[#0d1117] text-slate-100 overflow-hidden shadow-xl mb-4 transition-colors scroll-mt-24">
      {/* Code Block Toolbar */}
      <div className="code-block-toolbar flex items-center justify-between px-4 py-2.5 border-b border-slate-800 bg-[#161b22] select-none transition-colors flex-wrap gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <span className="w-3 h-3 rounded-full bg-rose-500/90 inline-block shrink-0"></span>
          <span className="w-3 h-3 rounded-full bg-amber-500/90 inline-block shrink-0"></span>
          <span className="w-3 h-3 rounded-full bg-emerald-500/90 inline-block shrink-0"></span>
          <span className="code-block-title text-xs font-mono font-semibold text-slate-200 ml-2 truncate">{title}</span>
          <span className="code-block-lang text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800/90 text-slate-300 font-bold border border-slate-700/60 shrink-0">
            {language}
          </span>
          {anchorId && (
            <button
              onClick={handleCopyLink}
              title="Copy direct permalink"
              className="text-slate-400 hover:text-white px-1.5 py-0.5 rounded text-[10px] hover:bg-slate-800 transition font-mono shrink-0 flex items-center gap-1"
            >
              <span>{copiedLink ? "✓ Copied" : "#"}</span>
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {actionLabel && onAction && (
            <button
              onClick={handleRun}
              disabled={isRunning}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white text-[11px] font-bold shadow-md shadow-rose-950/40 transition flex items-center gap-1.5 active:scale-95 cursor-pointer"
            >
              <span>{isRunning ? "⏳" : "⚡"}</span>
              <span>{actionLabel}</span>
            </button>
          )}

          <button
            onClick={handleCopy}
            className="code-block-copy-btn px-3 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-[11px] font-semibold transition active:scale-95 flex items-center gap-1.5 cursor-pointer"
          >
            {copied ? (
              <>
                <span className="text-emerald-400 font-bold">✓</span>
                <span className="text-emerald-400 font-bold">Copied!</span>
              </>
            ) : (
              <span>Copy Code</span>
            )}
          </button>
        </div>
      </div>

      {/* Highlighted Code Container */}
      <div className="code-block-code-area p-4 overflow-x-auto text-xs font-mono leading-relaxed bg-[#0d1117] text-slate-100 transition-colors">
        <pre className={`language-${language} m-0 p-0 bg-transparent text-inherit font-mono`}>
          <code
            className={`language-${language} text-inherit font-mono`}
            dangerouslySetInnerHTML={{ __html: highlightedHtml }}
          />
        </pre>
      </div>

      {/* Interactive Execution Output Drawer */}
      {outputLog && (
        <div className="code-block-output border-t border-emerald-500/40 bg-[#042114] px-4 py-2.5 flex items-start gap-2 text-xs font-mono text-emerald-300 transition-colors">
          <span className="code-block-output-label text-emerald-400 font-black shrink-0 uppercase tracking-wider text-[11px]">Output:</span>
          <span className="code-block-output-text text-emerald-200 break-all font-semibold">{outputLog}</span>
        </div>
      )}
    </div>
  );
};
