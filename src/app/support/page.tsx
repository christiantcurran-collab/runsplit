"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const FAQ_ITEMS = [
  {
    q: "How do I cancel my Pro subscription?",
    a: "Go to Settings → Manage Subscription. You can cancel instantly through the Stripe billing portal. You'll keep Pro access until the end of your billing period.",
  },
  {
    q: "How do I connect Strava?",
    a: "Sign in, go to Settings, and click 'Connect Strava'. You'll be redirected to Strava to authorise the connection.",
  },
  {
    q: "My training plan didn't generate. What happened?",
    a: "Plan generation requires an active Pro subscription. If you're subscribed and still seeing issues, try refreshing the page or signing out and back in.",
  },
  {
    q: "Can I get a refund?",
    a: "We handle refund requests on a case-by-case basis. Use the form below to contact us with your account email and we'll sort it out.",
  },
  {
    q: "How do I change my email or password?",
    a: "You can update your profile details in the Settings page. For password changes, use the 'Forgot password' link on the login page.",
  },
];

export default function SupportPage() {
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState(user?.email || "");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [aiReply, setAiReply] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !message) return;

    setStatus("sending");
    setAiReply(null);

    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, subject, message }),
      });

      const data = await res.json();

      if (res.ok && data.success) {
        setStatus("sent");
        setAiReply(data.reply);
      } else {
        setStatus("error");
      }
    } catch {
      setStatus("error");
    }
  };

  return (
    <div className="min-h-screen bg-bg-page">
      {/* Hero */}
      <div className="bg-bg-dark text-text-on-dark py-14 sm:py-18">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="font-heading font-extrabold text-3xl sm:text-4xl mb-3 tracking-tight">
            How can we help?
          </h1>
          <p className="text-text-dark-sec text-base sm:text-lg max-w-lg mx-auto">
            Check the FAQs below or send us a message — our AI assistant will
            try to help right away.
          </p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick FAQs */}
        <div className="mb-12">
          <h2 className="font-heading font-bold text-xl text-text-primary mb-6">
            Frequently Asked Questions
          </h2>
          <div className="space-y-3">
            {FAQ_ITEMS.map((faq) => (
              <details
                key={faq.q}
                className="group bg-bg-card border border-[#E4E4E8] rounded-xl overflow-hidden"
              >
                <summary className="flex items-center justify-between cursor-pointer px-5 py-4 font-heading font-semibold text-sm text-text-primary hover:text-brand transition-colors list-none">
                  {faq.q}
                  <svg
                    className="w-4 h-4 text-text-muted flex-shrink-0 ml-3 transition-transform group-open:rotate-180"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </summary>
                <div className="px-5 pb-4 text-sm text-text-secondary leading-relaxed">
                  {faq.a}
                </div>
              </details>
            ))}
          </div>
        </div>

        {/* Contact form */}
        <div className="bg-bg-card border border-[#E4E4E8] rounded-2xl p-6 sm:p-8">
          <h2 className="font-heading font-bold text-xl text-text-primary mb-1">
            Send us a message
          </h2>
          <p className="text-sm text-text-secondary mb-6">
            Our AI will respond instantly. A human will follow up if needed.
          </p>

          {status === "sent" && aiReply ? (
            <div className="space-y-6">
              {/* AI Reply */}
              <div className="bg-blue-50 border border-blue-100 rounded-xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-7 h-7 rounded-full bg-brand flex items-center justify-center">
                    <svg
                      className="w-4 h-4 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                      />
                    </svg>
                  </div>
                  <span className="font-heading font-semibold text-sm text-text-primary">
                    RunSplit Support
                  </span>
                </div>
                <div className="text-sm text-text-primary leading-relaxed whitespace-pre-wrap">
                  {aiReply}
                </div>
              </div>

              <div className="bg-green-50 border border-green-100 rounded-xl p-4 flex items-start gap-3">
                <svg
                  className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div>
                  <p className="text-sm font-semibold text-green-800">
                    Message received
                  </p>
                  <p className="text-xs text-green-700 mt-0.5">
                    We&apos;ve also sent this reply to <strong>{email}</strong>.
                    If you need further help, a human will follow up within 24
                    hours.
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  setStatus("idle");
                  setAiReply(null);
                  setSubject("");
                  setMessage("");
                }}
                className="text-sm font-medium text-brand hover:text-brand-hover transition-colors"
              >
                ← Send another message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-text-secondary mb-1.5">
                    Email <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Subject
                </label>
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  placeholder="What's this about?"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-text-secondary mb-1.5">
                  Message <span className="text-red-400">*</span>
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Describe your issue or question…"
                  className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand/20 focus:border-brand transition-colors resize-none"
                />
              </div>

              {status === "error" && (
                <div className="bg-red-50 border border-red-100 rounded-lg p-3 text-sm text-red-700">
                  Something went wrong. Please try again or email us directly at{" "}
                  <a
                    href="mailto:support@runsplit.co"
                    className="font-semibold underline"
                  >
                    support@runsplit.co
                  </a>
                </div>
              )}

              <button
                type="submit"
                disabled={status === "sending" || !email || !message}
                className="bg-brand hover:bg-brand-hover text-white font-heading font-semibold text-sm px-6 py-3 rounded-lg transition-all disabled:opacity-50 flex items-center gap-2"
              >
                {status === "sending" ? (
                  <>
                    <svg
                      className="w-4 h-4 animate-spin"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                      />
                    </svg>
                    Thinking…
                  </>
                ) : (
                  "Send Message"
                )}
              </button>
            </form>
          )}
        </div>

        {/* Direct email fallback */}
        <div className="mt-8 text-center">
          <p className="text-sm text-text-secondary">
            Prefer email?{" "}
            <a
              href="mailto:support@runsplit.co"
              className="font-medium text-brand hover:text-brand-hover transition-colors"
            >
              support@runsplit.co
            </a>
          </p>
        </div>
      </div>
    </div>
  );
}




