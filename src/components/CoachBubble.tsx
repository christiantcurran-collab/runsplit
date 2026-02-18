"use client";

import { useState, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const STARTER_PROMPTS = [
  "What's my workout today?",
  "Am I on track for my goal?",
  "Move a workout this week",
];

export default function CoachBubble() {
  // ALL hooks must come before any conditional returns
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [planUpdated, setPlanUpdated] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      // small delay so the overlay has rendered before we scroll/focus
      const t = setTimeout(() => {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(t);
    }
  }, [messages, open]);

  // Lock body scroll when overlay is open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  // Don't show bubble on the standalone coach page (conditional render, not early return)
  if (pathname === "/plan/coach") return null;

  async function sendMessage(text?: string) {
    const content = (text ?? input).trim();
    if (!content || loading) return;

    const userMsg: Message = { role: "user", content };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setLoading(true);
    setPlanUpdated(false);

    try {
      const res = await fetch("/api/coach/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      const data = await res.json() as { reply?: string; error?: string; planUpdated?: boolean };
      if (data.error) throw new Error(data.error);
      setMessages((prev) => [...prev, { role: "assistant", content: data.reply ?? "" }]);
      if (data.planUpdated) setPlanUpdated(true);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `Something went wrong. ${err instanceof Error ? err.message : "Please try again."}` },
      ]);
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      void sendMessage();
    }
  }

  return (
    <>
      {/* Full-screen overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col bg-white">
          {/* Header */}
          <div className="bg-brand-black text-white px-4 py-3 flex items-center justify-between flex-shrink-0 safe-top">
            <div className="flex items-center gap-3">
              <div className="relative w-9 h-9 rounded-full overflow-hidden flex-shrink-0 border-2 border-brand-orange">
                <Image
                  src="/images/coach-eva.jpg"
                  alt="Coach Eva"
                  fill
                  className="object-cover object-top"
                  sizes="36px"
                />
              </div>
              <div>
                <div className="font-heading font-bold text-sm leading-none">Coach Eva</div>
                <div className="flex items-center gap-1 mt-0.5">
                  <div className="w-1.5 h-1.5 bg-green-400 rounded-full" />
                  <span className="text-[11px] text-gray-400">Online</span>
                </div>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-gray-400 hover:text-white"
              aria-label="Close coach"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Plan updated banner */}
          {planUpdated && (
            <div className="bg-green-50 border-b border-green-200 px-4 py-2 flex items-center justify-between flex-shrink-0">
              <span className="text-green-700 text-sm font-medium">Plan updated</span>
              <Link
                href="/plan"
                className="text-green-600 text-sm underline"
                onClick={() => setOpen(false)}
              >
                View dashboard →
              </Link>
            </div>
          )}

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
            {messages.length === 0 && (
              <div className="flex flex-col items-center justify-center h-full text-center pb-8">
                <div className="relative w-20 h-20 rounded-full overflow-hidden border-4 border-brand-orange mb-4 flex-shrink-0">
                  <Image
                    src="/images/coach-eva.jpg"
                    alt="Coach Eva"
                    fill
                    className="object-cover object-top"
                    sizes="80px"
                  />
                </div>
                <h2 className="font-heading font-bold text-xl mb-1">Hey, I&apos;m Coach Eva</h2>
                <p className="text-gray-500 text-sm mb-6 max-w-xs">
                  Your personal AI running coach. Ask me anything about your training or make changes to your plan.
                </p>
                <div className="w-full space-y-2 max-w-xs">
                  {STARTER_PROMPTS.map((p) => (
                    <button
                      key={p}
                      onClick={() => void sendMessage(p)}
                      className="block w-full text-left text-sm bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 hover:border-brand-orange hover:bg-brand-orange/5 transition-colors text-gray-700"
                    >
                      {p}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start items-end"}`}>
                {msg.role === "assistant" && (
                  <div className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-brand-orange/50">
                    <Image src="/images/coach-eva.jpg" alt="Eva" fill className="object-cover object-top" sizes="28px" />
                  </div>
                )}
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${
                    msg.role === "user"
                      ? "bg-brand-orange text-white rounded-tr-sm"
                      : "bg-gray-100 text-gray-800 rounded-bl-sm"
                  }`}
                >
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="flex gap-2 justify-start items-end">
                <div className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border border-brand-orange/50">
                  <Image src="/images/coach-eva.jpg" alt="Eva" fill className="object-cover object-top" sizes="28px" />
                </div>
                <div className="bg-gray-100 rounded-2xl rounded-bl-sm px-4 py-3">
                  <div className="flex gap-1 items-center">
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <div className="border-t border-gray-200 bg-white px-4 py-3 flex gap-2 items-center flex-shrink-0 safe-bottom">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Message Coach Eva..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:border-brand-orange focus:bg-white transition-colors"
            />
            <button
              onClick={() => void sendMessage()}
              disabled={!input.trim() || loading}
              className="bg-brand-orange hover:bg-brand-orange-hover disabled:opacity-40 text-white rounded-xl p-2.5 transition-colors flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Floating bubble button (only visible when overlay is closed) */}
      {!open && (
        <button
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-full shadow-xl flex items-center justify-center transition-all hover:scale-105 active:scale-95 overflow-hidden border-2 border-brand-orange"
          aria-label="Chat with Coach Eva"
        >
          <Image
            src="/images/coach-eva.jpg"
            alt="Coach Eva"
            fill
            className="object-cover object-top"
            sizes="64px"
          />
        </button>
      )}
    </>
  );
}
