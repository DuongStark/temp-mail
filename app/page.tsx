"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import dynamic from "next/dynamic";

const API = process.env.NEXT_PUBLIC_API;
const DOMAIN = process.env.NEXT_PUBLIC_DOMAIN;

function randomName() {
  const adj = ["quick", "dark", "cool", "fast", "neat", "wild", "bold", "slim"];
  const noun = ["fox", "cat", "owl", "bat", "ant", "bee", "elk", "jay"];
  const num = Math.floor(Math.random() * 999);
  return `${adj[Math.floor(Math.random() * adj.length)]}${noun[Math.floor(Math.random() * noun.length)]}${num}`;
}

interface Email {
  id: string;
  from: string;
  subject: string;
  body: string;
  date: string;
}

function TempMailInner() {
  const [username, setUsername] = useState("");
  const [emails, setEmails] = useState<Email[]>([]);
  const [selected, setSelected] = useState<Email | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [newCount, setNewCount] = useState(0);
  const [mounted, setMounted] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevCountRef = useRef(0);

  const fullEmail = `${username}@${DOMAIN}`;

  useEffect(() => {
    setMounted(true);
  }, []);

  const generate = () => {
    setUsername(randomName());
    setEmails([]);
    setSelected(null);
    setNewCount(0);
    prevCountRef.current = 0;
  };

  useEffect(() => {
    generate();
  }, []);

  const fetchInbox = useCallback(
    async (silent = false) => {
      if (!username) return;
      if (!silent) setLoading(true);
      try {
        const res = await fetch(
          `${API}/inbox?email=${encodeURIComponent(fullEmail)}`,
        );
        const data: Email[] = await res.json();
        setEmails(data);
        setLastRefresh(new Date());
        if (data.length > prevCountRef.current) {
          setNewCount(data.length - prevCountRef.current);
          setTimeout(() => setNewCount(0), 3000);
        }
        prevCountRef.current = data.length;
      } catch {
        // silent fail
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [username, fullEmail],
  );

  const handleSelect = async (e: Email) => {
    setSelected(e);
    if (!e.body) {
      try {
        const res = await fetch(
          `${API}/message?email=${encodeURIComponent(fullEmail)}&id=${e.id}`,
        );
        if (res.ok) {
          const data = await res.json();
          setSelected(data);
          setEmails((prev) =>
            prev.map((item) =>
              item.id === e.id ? { ...item, body: data.body } : item,
            ),
          );
        }
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    if (!username) return;

    fetchInbox();

    const startPolling = () => {
      if (!intervalRef.current) {
        intervalRef.current = setInterval(() => fetchInbox(true), 10000);
      }
    };

    const stopPolling = () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };

    if (document.visibilityState === "visible") {
      startPolling();
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        fetchInbox(true);
        startPolling();
      } else {
        stopPolling();
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [username, fetchInbox]);

  const copy = () => {
    navigator.clipboard.writeText(fullEmail);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const timeAgo = (date: string) => {
    const diff = Date.now() - new Date(date).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  const parseBody = (raw: string) => {
    if (!raw) return "(no content)";
    if (raw.includes("Content-Type: text/plain")) {
      const parts = raw.split(/--[\w\d]+/);
      for (const part of parts) {
        if (part.includes("Content-Type: text/plain")) {
          return part
            .replace(/Content-Type:\s*text\/plain(;\s*)?/i, "")
            .replace(/charset=["']?[\w-]*["']?\s*/i, "")
            .replace(/Content-Transfer-Encoding:\s*[\w-]+\s*/i, "")
            .trim();
        }
      }
    }
    return raw
      .replace(/--[\w\d]+/g, "")
      .replace(/Content-Type:\s*.*?(?=\s|$)/gi, "")
      .replace(/\r\n/g, "\n")
      .replace(/[ \t]+/g, " ")
      .split("\n")
      .map((line) => line.trim())
      .filter((line, i, arr) => !(line === "" && arr[i - 1] === ""))
      .join("\n")
      .trim();
  };

  if (!mounted) return null;

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#050508]">
      {/* Animated gradient mesh background */}
      <div className="fixed inset-0 pointer-events-none">
        <div
          className="absolute w-[600px] h-[600px] rounded-full opacity-20 blur-[120px]"
          style={{
            background: "radial-gradient(circle, #7c3aed 0%, transparent 70%)",
            top: "-10%",
            left: "-5%",
            animation: "meshMove 20s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[500px] h-[500px] rounded-full opacity-15 blur-[100px]"
          style={{
            background: "radial-gradient(circle, #2563eb 0%, transparent 70%)",
            top: "40%",
            right: "-10%",
            animation: "meshMove2 25s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-[400px] h-[400px] rounded-full opacity-10 blur-[80px]"
          style={{
            background: "radial-gradient(circle, #14b8a6 0%, transparent 70%)",
            bottom: "-5%",
            left: "30%",
            animation: "meshMove3 22s ease-in-out infinite",
          }}
        />
      </div>

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="liquid-glass border-b border-white/5 rounded-none">
          <div className="max-w-[1200px] mx-auto px-6 py-4 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-sm"
              style={{
                background: "linear-gradient(135deg, #7c3aed, #2563eb)",
                boxShadow: "0 4px 15px rgba(124, 58, 237, 0.3)",
              }}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="4" width="20" height="16" rx="2"/>
                <path d="M22 7l-10 7L2 7"/>
              </svg>
            </div>
            <span className="text-lg font-semibold tracking-tight text-white/90">
              Temp<span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">Mail</span>
            </span>
            <div className="ml-auto flex items-center gap-3">
              <span className="text-[11px] text-white/25 font-mono">
                {lastRefresh ? `synced ${timeAgo(lastRefresh.toISOString())}` : "connecting..."}
              </span>
              <div
                className="w-2 h-2 rounded-full"
                style={{
                  background: loading ? "#facc15" : "#22c55e",
                  boxShadow: loading ? "0 0 8px #facc15" : "0 0 8px #22c55e",
                  animation: loading ? "breathe 1.5s ease-in-out infinite" : "none",
                }}
              />
            </div>
          </div>
        </header>

        <main className="max-w-[1200px] mx-auto px-6 py-8">
          {/* Email address bar */}
          <div
            className="liquid-glass p-6 mb-6"
            style={{ animation: "slideUp 0.5s cubic-bezier(0.4, 0, 0.2, 1) both" }}
          >
            <div className="text-[11px] text-white/30 uppercase tracking-[3px] mb-4 font-medium">
              Your temporary inbox
            </div>
            <div className="flex gap-3 items-center flex-wrap">
              <div className="flex flex-1 min-w-[280px] liquid-glass-deep rounded-xl overflow-hidden">
                <input
                  value={username}
                  onChange={(e) => {
                    setUsername(e.target.value.toLowerCase().replace(/\s/g, ""));
                    setEmails([]);
                    prevCountRef.current = 0;
                  }}
                  className="flex-1 px-4 py-3 bg-transparent border-none outline-none text-white/90 text-[15px] font-mono placeholder:text-white/20"
                  placeholder="username"
                />
                <span className="px-4 py-3 text-white/30 text-sm border-l border-white/5 flex items-center font-mono">
                  @{DOMAIN}
                </span>
              </div>
              <button
                onClick={copy}
                className="px-5 py-3 rounded-xl text-[13px] font-medium transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95"
                style={{
                  background: copied ? "rgba(34, 197, 94, 0.15)" : "rgba(255, 255, 255, 0.04)",
                  border: `1px solid ${copied ? "rgba(34, 197, 94, 0.3)" : "rgba(255, 255, 255, 0.08)"}`,
                  color: copied ? "#4ade80" : "rgba(255, 255, 255, 0.6)",
                  boxShadow: copied ? "0 0 20px rgba(34, 197, 94, 0.1)" : "none",
                }}
              >
                {copied ? "✓ Copied" : "Copy"}
              </button>
              <button
                onClick={generate}
                className="px-5 py-3 rounded-xl text-[13px] font-medium transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95"
                style={{
                  background: "rgba(255, 255, 255, 0.04)",
                  border: "1px solid rgba(255, 255, 255, 0.08)",
                  color: "rgba(255, 255, 255, 0.6)",
                }}
              >
                ⟳ New
              </button>
              <button
                onClick={() => fetchInbox()}
                className="px-5 py-3 rounded-xl text-[13px] font-medium transition-all duration-300 cursor-pointer hover:scale-105 active:scale-95"
                style={{
                  background: "linear-gradient(135deg, rgba(124, 58, 237, 0.15), rgba(37, 99, 235, 0.15))",
                  border: "1px solid rgba(124, 58, 237, 0.2)",
                  color: "#a78bfa",
                  boxShadow: "0 0 20px rgba(124, 58, 237, 0.05)",
                }}
              >
                Refresh
              </button>
            </div>
          </div>

          {/* New mail notification */}
          {newCount > 0 && (
            <div
              className="liquid-glass mb-4 px-5 py-3 text-[13px] text-purple-300"
              style={{
                animation: "slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1) both",
                borderColor: "rgba(124, 58, 237, 0.3)",
                background: "rgba(124, 58, 237, 0.08)",
              }}
            >
              <span className="inline-block animate-pulse mr-2">●</span>
              {newCount} new email{newCount > 1 ? "s" : ""} arrived
            </div>
          )}

          {/* Main content */}
          {emails.length === 0 ? (
            <div
              className="liquid-glass text-center py-20 px-6"
              style={{ animation: "fadeIn 0.6s ease both 0.2s" }}
            >
              <div
                className="text-5xl mb-5"
                style={{ animation: "float 4s ease-in-out infinite" }}
              >
                ✉
              </div>
              <div className="text-white/25 text-sm leading-relaxed">
                Inbox is empty
                <br />
                <span className="text-white/15 text-xs">
                  Auto-refreshing every 10 seconds...
                </span>
              </div>
            </div>
          ) : (
            <div className="flex gap-4 items-start">
              {/* Email list */}
              <div className="w-[340px] flex-shrink-0 space-y-2">
                {emails.map((e, i) => (
                  <div
                    key={e.id}
                    onClick={() => handleSelect(e)}
                    className="liquid-glass-deep p-4 cursor-pointer transition-all duration-300 hover:translate-x-1"
                    style={{
                      animation: `slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) ${i * 0.08}s both`,
                      borderColor: selected?.id === e.id ? "rgba(124, 58, 237, 0.4)" : undefined,
                      background: selected?.id === e.id ? "rgba(124, 58, 237, 0.08)" : undefined,
                      boxShadow: selected?.id === e.id ? "0 0 30px rgba(124, 58, 237, 0.08), inset 0 1px 0 rgba(255,255,255,0.05)" : undefined,
                    }}
                  >
                    <div className="text-[13px] font-medium text-white/85 truncate mb-1.5">
                      {e.subject || "(no subject)"}
                    </div>
                    <div className="text-[11px] text-white/30 truncate">
                      {e.from}
                    </div>
                    <div className="text-[11px] text-white/15 mt-2">
                      {timeAgo(e.date)}
                    </div>
                  </div>
                ))}
              </div>

              {/* Email detail */}
              <div
                className="flex-1 liquid-glass p-6 min-h-[360px]"
                style={{ animation: "fadeIn 0.4s ease both" }}
              >
                {selected ? (
                  <div style={{ animation: "fadeIn 0.3s ease both" }}>
                    <div className="border-b border-white/5 pb-5 mb-6">
                      <h2 className="text-[17px] font-semibold text-white/90 mb-3">
                        {selected.subject || "(no subject)"}
                      </h2>
                      <div className="text-[12px] text-white/30 space-y-1.5">
                        <div>
                          <span className="text-white/20 uppercase tracking-wider text-[10px]">From </span>
                          <span className="text-white/50">{selected.from}</span>
                        </div>
                        <div>
                          <span className="text-white/20 uppercase tracking-wider text-[10px]">Time </span>
                          <span className="text-white/50">
                            {new Date(selected.date).toLocaleString("vi-VN")}
                          </span>
                        </div>
                      </div>
                    </div>
                    <pre className="whitespace-pre-wrap break-words text-[13px] leading-[1.9] text-white/60 font-mono">
                      {parseBody(selected.body)}
                    </pre>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-[240px] text-white/15 text-sm">
                    Select an email to read
                  </div>
                )}
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}

export default dynamic(() => Promise.resolve(TempMailInner), { ssr: false });
