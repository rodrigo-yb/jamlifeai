import { useState } from "react";
import { Outfit } from "next/font/google";
import ReactMarkdown from "react-markdown";
import { useRef, useEffect } from "react";


const outfit = Outfit({ weight: "600", subsets: ["latin"] });
const quickMessages = [
  "I feel overwhelmed. What can I do?",
  "I don't know what I need, but I need something.",
  "How can you help me?",
];


export default function Home() {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string; timestamp: string }[]>([]);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.style.height = "auto"; // reset
      el.style.height = Math.min(el.scrollHeight, 96) + "px"; // 96px ≈ 4 líneas
    }
  }, [input]);
  const handleSend = async (customInput?: string) => {
    const userMessage = customInput ?? input;
    if (!userMessage.trim()) return;

    const newMessage = {
      role: "user",
      content: userMessage,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    const updatedMessages = [...messages, newMessage];
    setMessages(updatedMessages);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: updatedMessages, threadId }),
      });

      const data = await res.json();
      setIsLoading(false);

      if (data.error) {
        setMessages([
          ...updatedMessages,
          {
            role: "assistant",
            content: `❌ ${data.error}`,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
      } else {
        setMessages([
          ...updatedMessages,
          {
            ...data.reply,
            timestamp: new Date().toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            }),
          },
        ]);
        setThreadId(data.threadId);
      }
    } catch {
      setIsLoading(false);
      setMessages([
        ...updatedMessages,
        {
          role: "assistant",
          content: "❌ Failed to contact the assistant.",
          timestamp: new Date().toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          }),
        },
      ]);
    }
  };




  return (
    <div
      className={outfit.className}
      style={{
        minHeight: "100vh",
        padding: "2rem",
        background: "linear-gradient(135deg, #E3FEE8 0%, #F8DAFE 100%)",
        color: "#234F72",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
      }}
    >
      <h1
        style={{
          position: "sticky",
          top: 0,
          background: "transparent",
          backdropFilter: "blur(6px)",
          padding: "1rem 0",
          width: "100%",
          textAlign: "center",
          fontWeight: 600,
          fontSize: "2rem",
          zIndex: 10,
        }}
      >Jamlife</h1>

      <div
        style={{
          maxHeight: "calc(100vh - 200px)",
          width: "100%",
          maxWidth: "600px",
          overflowY: "auto",
          padding: "1rem",
          marginBottom: "1rem",
        }}
      >
        {messages.map((msg, idx) => (
          <div
            key={idx}
            style={{
              display: "flex",
              justifyContent: msg.role === "user" ? "flex-end" : "flex-start",
              margin: "0.5rem 0",
            }}
          >
            <div
              style={{
                background: msg.role === "user" ? "#D0EFFF" : "#FFF5E3",
                padding: "0.75rem 1rem",
                borderRadius: "20px",
                maxWidth: "70%",
                wordWrap: "break-word",
                fontSize: "1rem",
                lineHeight: "1.5",
                position: "relative",
              }}
            >
              {msg.role === "assistant" ? (
                <ReactMarkdown
                  components={{
                    strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                    p: ({ children }) => <p style={{ margin: "0.5rem 0" }}>{children}</p>,
                    blockquote: ({ children }) => (
                      <blockquote
                        style={{
                          margin: "0.75rem 0",
                          paddingLeft: "1rem",
                          borderLeft: "4px solid #ccc",
                          color: "#555",
                          fontStyle: "italic",
                        }}
                      >
                        {children}
                      </blockquote>
                    ),
                    li: ({ children }) => <li style={{ marginLeft: "1.2rem" }}>{children}</li>,
                  }}
                >
                  {msg.content}
                </ReactMarkdown>
              ) : (
                <span style={{ whiteSpace: "pre-wrap" }}>{msg.content}</span>
              )}
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "#555",
                  marginTop: "0.25rem",
                  textAlign: "right",
                }}
              >
                {msg.timestamp}
              </div>
            </div>
          </div>
        ))}


        {isLoading && (
          <div style={{ marginTop: "1rem", fontStyle: "italic", color: "#234F72" }}>
            JamlifeAi is typing...
          </div>
        )}

      </div>

      <div
        style={{
          position: "fixed",
          bottom: 0,
          left: 0,
          right: 0,
          background: "transparent",
          padding: "1rem",
          display: "flex",
          justifyContent: "center",
        }}
      >
        <div
          style={{
            width: "100%",
            maxWidth: "600px",
            display: "flex",
            flexDirection: "column",
            gap: "0.5rem",
          }}
        >
          {/* SUGERENCIAS AQUÍ */}
          {messages.length === 0 && (
            <div className="fade-in-up" style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", justifyContent: "center" }}>
              {quickMessages.map((msg, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSend(msg)}
                  style={{
                    padding: "0.6rem 1.2rem",
                    borderRadius: "20px",
                    border: "1px solid #e0e0e0",
                    background: "rgba(255, 255, 255, 0.3)",
                    color: "#234F72",
                    fontSize: "0.9rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    backdropFilter: "blur(6px)",
                    boxShadow: "0 2px 6px rgba(0,0,0,0.1)",
                    transition: "all 0.2s ease",
                  }}
                >
                  {msg}
                </button>
              ))}
            </div>
          )}

          {/* INPUT Y BOTÓN */}
          <div
            style={{
              background: "#ffffff",
              borderRadius: "9999px",
              padding: "0.5rem 0.5rem 0.5rem 1.5rem",
              display: "flex",
              alignItems: "center",
              boxShadow: "0 2px 10px rgba(0, 0, 0, 0.1)",
            }}
          >
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Type your message..."
              rows={1}
              style={{
                flexGrow: 1,
                padding: "0.5rem",
                marginBottom: "0rem",
                display: "flex",
                flexDirection: "column",
                border: "none",
                outline: "none",
                fontSize: "1rem",
                fontFamily: "Outfit, sans-serif",
                fontWeight: 500,
                color: "#234F72",
                background: "transparent",
                resize: "none",
                maxHeight: "4rem", // limite de 4 líneas aprox
                overflowY: "auto",
                lineHeight: "1.5",
                justifyContent: "flex-end", // 👈 empuja contenido al fondo cuando vacío
              }}
            />


            <button
              onClick={() => handleSend()}
              style={{
                background: "#234F72",
                color: "white",
                border: "none",
                borderRadius: "50%",
                width: "42px",
                height: "42px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",

                cursor: "pointer",
                fontSize: "1rem",
                marginLeft: "0.5rem",
              }}
              title="Send"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="20"
                height="20"
                fill="white"
                viewBox="0 0 24 24"
              >
                <path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2 .01 7z" />
              </svg>
            </button>
          </div>
        </div>
      </div>
      <style jsx global>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      
        .fade-in-up {
          animation: fadeInUp 0.6s ease;
        }
      `}</style>
    </div>

  );

}


