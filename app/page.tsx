"use client";
import { useState, useEffect, useRef, useCallback } from "react";

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

export default function TempMail() {
  const [username, setUsername] = useState("");
  const [emails, setEmails] = useState<Email[]>([]);
  const [selected, setSelected] = useState<Email | null>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null);
  const [newCount, setNewCount] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const prevCountRef = useRef(0);

  const fullEmail = `${username}@${DOMAIN}`;

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
    // Nếu object lấy từ list /inbox chưa có nội dung, load lại từ endpoint /message
    if (!e.body) {
      try {
        const res = await fetch(
          `${API}/message?email=${encodeURIComponent(fullEmail)}&id=${e.id}`,
        );
        if (res.ok) {
          const data = await res.json();
          setSelected(data);
          // Update vào list để nhớ lần sau click
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
    intervalRef.current = setInterval(() => fetchInbox(true), 5000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [username]);

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
    if (!raw) return "(không có nội dung)";
    return raw;
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0a0a0f",
        color: "#e8e8f0",
        fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
      }}
    >
      {/* Google Font */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Space+Grotesk:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #111; }
        ::-webkit-scrollbar-thumb { background: #333; border-radius: 2px; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.4; } }
        @keyframes slideIn { from { opacity:0; transform:translateY(-8px); } to { opacity:1; transform:translateY(0); } }
        @keyframes fadeIn { from { opacity:0; } to { opacity:1; } }
        .email-row:hover { background: #16161f !important; cursor: pointer; }
        .btn:hover { opacity: 0.85; transform: translateY(-1px); }
        .btn { transition: all 0.15s ease; cursor: pointer; }
      `}</style>

      {/* Header */}
      <div
        style={{
          borderBottom: "1px solid #1e1e2e",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          gap: 12,
          background: "#0d0d14",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 8,
            background: "linear-gradient(135deg, #7c3aed, #2563eb)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 16,
          }}
        >
          ✉
        </div>
        <span
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontWeight: 700,
            fontSize: 18,
            letterSpacing: "-0.5px",
          }}
        >
          TempMail<span style={{ color: "#7c3aed" }}>.art</span>
        </span>
        <span
          style={{
            marginLeft: "auto",
            fontSize: 11,
            color: "#444",
            fontFamily: "monospace",
          }}
        >
          {lastRefresh
            ? `synced ${timeAgo(lastRefresh.toISOString())}`
            : "waiting..."}
        </span>
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: loading ? "#facc15" : "#22c55e",
            animation: loading ? "pulse 1s infinite" : "none",
          }}
        />
      </div>

      <div style={{ maxWidth: 1100, margin: "0 auto", padding: "32px 24px" }}>
        {/* Email bar */}
        <div
          style={{
            background: "#0d0d14",
            border: "1px solid #1e1e2e",
            borderRadius: 12,
            padding: "20px 24px",
            marginBottom: 24,
            animation: "fadeIn 0.3s ease",
          }}
        >
          <div
            style={{
              fontSize: 11,
              color: "#555",
              marginBottom: 10,
              letterSpacing: 2,
              textTransform: "uppercase",
            }}
          >
            Your temporary inbox
          </div>
          <div
            style={{
              display: "flex",
              gap: 10,
              alignItems: "center",
              flexWrap: "wrap",
            }}
          >
            <div
              style={{
                display: "flex",
                flex: 1,
                minWidth: 280,
                background: "#111119",
                border: "1px solid #2a2a3e",
                borderRadius: 8,
                overflow: "hidden",
              }}
            >
              <input
                value={username}
                onChange={(e) => {
                  setUsername(e.target.value.toLowerCase().replace(/\s/g, ""));
                  setEmails([]);
                  prevCountRef.current = 0;
                }}
                style={{
                  flex: 1,
                  padding: "10px 14px",
                  background: "transparent",
                  border: "none",
                  outline: "none",
                  color: "#e8e8f0",
                  fontSize: 15,
                  fontFamily: "'IBM Plex Mono', monospace",
                }}
                placeholder="username"
              />
              <span
                style={{
                  padding: "10px 14px",
                  color: "#555",
                  fontSize: 14,
                  borderLeft: "1px solid #2a2a3e",
                  display: "flex",
                  alignItems: "center",
                }}
              >
                @{DOMAIN}
              </span>
            </div>
            <button
              className="btn"
              onClick={copy}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: "none",
                background: copied ? "#166534" : "#1e1e2e",
                color: copied ? "#4ade80" : "#a0a0b8",
                fontSize: 13,
              }}
            >
              {copied ? "✓ Copied" : "Copy"}
            </button>
            <button
              className="btn"
              onClick={generate}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: "none",
                background: "#1e1e2e",
                color: "#a0a0b8",
                fontSize: 13,
              }}
            >
              ⟳ New
            </button>
            <button
              className="btn"
              onClick={() => fetchInbox()}
              style={{
                padding: "10px 18px",
                borderRadius: 8,
                border: "none",
                background: "#1d2a1d",
                color: "#4ade80",
                fontSize: 13,
              }}
            >
              Refresh
            </button>
          </div>
        </div>

        {/* New mail notification */}
        {newCount > 0 && (
          <div
            style={{
              background: "#1a1a2e",
              border: "1px solid #7c3aed",
              borderRadius: 8,
              padding: "10px 16px",
              marginBottom: 16,
              fontSize: 13,
              color: "#a78bfa",
              animation: "slideIn 0.3s ease",
            }}
          >
            ✨ {newCount} new email{newCount > 1 ? "s" : ""} arrived!
          </div>
        )}

        {/* Main content */}
        {emails.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "80px 24px",
              border: "1px dashed #1e1e2e",
              borderRadius: 12,
              animation: "fadeIn 0.5s ease",
            }}
          >
            <div style={{ fontSize: 48, marginBottom: 16 }}>📭</div>
            <div style={{ color: "#444", fontSize: 14, lineHeight: 1.8 }}>
              Inbox is empty
              <br />
              <span style={{ fontSize: 12, color: "#333" }}>
                Auto-refreshing every 5 seconds...
              </span>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 16, alignItems: "flex-start" }}>
            {/* Email list */}
            <div style={{ width: 320, flexShrink: 0 }}>
              {emails.map((e, i) => (
                <div
                  key={e.id}
                  className="email-row"
                  onClick={() => handleSelect(e)}
                  style={{
                    padding: "14px 16px",
                    marginBottom: 6,
                    borderRadius: 8,
                    border: "1px solid",
                    borderColor: selected?.id === e.id ? "#7c3aed" : "#1a1a2a",
                    background: selected?.id === e.id ? "#13101f" : "#0d0d14",
                    animation: `slideIn 0.2s ease ${i * 0.05}s both`,
                    transition: "border-color 0.15s",
                  }}
                >
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 500,
                      color: "#e8e8f0",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                      marginBottom: 4,
                    }}
                  >
                    {e.subject || "(no subject)"}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "#555",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {e.from}
                  </div>
                  <div style={{ fontSize: 11, color: "#3a3a5a", marginTop: 4 }}>
                    {timeAgo(e.date)}
                  </div>
                </div>
              ))}
            </div>

            {/* Email detail */}
            <div
              style={{
                flex: 1,
                background: "#0d0d14",
                border: "1px solid #1a1a2a",
                borderRadius: 12,
                padding: 24,
                minHeight: 320,
                animation: "fadeIn 0.2s ease",
              }}
            >
              {selected ? (
                <>
                  <div
                    style={{
                      borderBottom: "1px solid #1a1a2a",
                      paddingBottom: 16,
                      marginBottom: 20,
                    }}
                  >
                    <h2
                      style={{
                        fontSize: 16,
                        fontWeight: 600,
                        color: "#e8e8f0",
                        fontFamily: "'Space Grotesk', sans-serif",
                        marginBottom: 10,
                      }}
                    >
                      {selected.subject || "(no subject)"}
                    </h2>
                    <div
                      style={{ fontSize: 12, color: "#555", lineHeight: 1.8 }}
                    >
                      <span style={{ color: "#3a3a5a" }}>FROM </span>
                      <span style={{ color: "#7c7c9a" }}>{selected.from}</span>
                      <br />
                      <span style={{ color: "#3a3a5a" }}>TIME </span>
                      <span style={{ color: "#7c7c9a" }}>
                        {new Date(selected.date).toLocaleString("vi-VN")}
                      </span>
                    </div>
                  </div>
                  <pre
                    style={{
                      whiteSpace: "pre-wrap",
                      wordBreak: "break-word",
                      fontSize: 13,
                      lineHeight: 1.8,
                      color: "#b0b0c8",
                      fontFamily: "'IBM Plex Mono', monospace",
                    }}
                  >
                    {parseBody(selected.body)}
                  </pre>
                </>
              ) : (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    height: 200,
                    color: "#2a2a3e",
                    fontSize: 13,
                  }}
                >
                  ← Select an email to read
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
