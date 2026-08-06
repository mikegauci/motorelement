"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/Button";
import {
  CONTACT_TOPICS,
  isContactTopic,
  type ContactTopic,
} from "@/lib/email/sendContactMessage";

const TOPIC_LABELS: Record<ContactTopic, string> = {
  order: "Order",
  customizer: "Customizer",
  product: "Product",
  partnership: "Partnership",
  wholesale: "Wholesale",
  other: "Other",
};

const inputClass =
  "w-full bg-carbon border border-border rounded-none p-3 text-white font-body text-sm placeholder:text-muted focus:outline-none focus:border-ignition transition-colors";

const labelClass =
  "block font-sub font-bold uppercase tracking-widest text-label text-muted mb-2";

export function ContactForm() {
  const searchParams = useSearchParams();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [topic, setTopic] = useState<ContactTopic>("order");
  const [orderNumber, setOrderNumber] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const raw = searchParams.get("topic");
    if (raw && isContactTopic(raw)) {
      setTopic(raw);
    }
  }, [searchParams]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          topic,
          message,
          orderNumber: topic === "order" ? orderNumber : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(data.error || "Could not send your message.");
        setLoading(false);
        return;
      }
      setSent(true);
      setName("");
      setEmail("");
      setOrderNumber("");
      setMessage("");
    } catch {
      setError("Could not send your message. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <div
        id="contact-form"
        className="border border-border bg-obsidian p-8 animate-contact-fade"
      >
        <p className="font-mono text-ignition uppercase text-xs tracking-widest">
          Message sent
        </p>
        <h3 className="mt-3 font-heading text-3xl text-white">
          WE&apos;LL BE IN TOUCH
        </h3>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          Thanks for reaching out. Our team typically replies within 1–2
          business days.
        </p>
        <Button
          type="button"
          variant="secondary"
          size="md"
          className="mt-8"
          onClick={() => setSent(false)}
        >
          SEND ANOTHER
        </Button>
      </div>
    );
  }

  return (
    <form
      id="contact-form"
      onSubmit={handleSubmit}
      className="border border-border bg-obsidian p-6 md:p-8 space-y-5"
    >
      <div>
        <p className={labelClass}>Topic</p>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {CONTACT_TOPICS.map((value) => {
            const active = topic === value;
            return (
              <button
                key={value}
                type="button"
                onClick={() => setTopic(value)}
                className={`
                  border px-3 py-2.5 font-sub text-xs font-bold uppercase tracking-widest
                  transition-all duration-200
                  ${
                    active
                      ? "border-ignition bg-ignition/10 text-white scale-[1.02]"
                      : "border-border bg-carbon text-muted hover:border-white/30 hover:text-white"
                  }
                `}
              >
                {TOPIC_LABELS[value]}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label htmlFor="contact-name" className={labelClass}>
          Name
        </label>
        <input
          id="contact-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          maxLength={120}
          autoComplete="name"
          className={inputClass}
        />
      </div>

      <div>
        <label htmlFor="contact-email" className={labelClass}>
          Email
        </label>
        <input
          id="contact-email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          maxLength={254}
          autoComplete="email"
          placeholder="you@example.com"
          className={inputClass}
        />
      </div>

      {topic === "order" && (
        <div className="animate-contact-fade">
          <label htmlFor="contact-order" className={labelClass}>
            Order number
          </label>
          <input
            id="contact-order"
            type="text"
            value={orderNumber}
            onChange={(e) => setOrderNumber(e.target.value)}
            maxLength={64}
            placeholder="Optional — helps us find your order faster"
            className={inputClass}
          />
        </div>
      )}

      <div>
        <label htmlFor="contact-message" className={labelClass}>
          Message
        </label>
        <textarea
          id="contact-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          required
          maxLength={5000}
          rows={6}
          placeholder="How can we help?"
          className={`${inputClass} resize-y min-h-[140px]`}
        />
      </div>

      {error && <p className="text-redline font-body text-sm">{error}</p>}

      <Button
        type="submit"
        variant="primary"
        size="lg"
        disabled={loading}
        className="w-full"
      >
        {loading ? "SENDING..." : "SEND MESSAGE"}
      </Button>
    </form>
  );
}
