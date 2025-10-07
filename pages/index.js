export default function Home() {
  return (
    <main
      style={{
        alignItems: "center",
        display: "flex",
        justifyContent: "center",
        minHeight: "100vh",
        fontFamily: "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, \"Segoe UI\", sans-serif",
        background:
          "linear-gradient(135deg, rgba(255,255,255,1) 0%, rgba(230,243,255,1) 100%)",
      }}
    >
      <section
        style={{
          backgroundColor: "rgba(255, 255, 255, 0.9)",
          borderRadius: "1.5rem",
          boxShadow: "0 20px 45px -20px rgba(15, 23, 42, 0.35)",
          padding: "3rem 4rem",
          textAlign: "center",
          maxWidth: "32rem",
        }}
      >
        <p
          style={{
            color: "#2563eb",
            fontSize: "0.875rem",
            fontWeight: 600,
            letterSpacing: "0.1em",
            textTransform: "uppercase",
            marginBottom: "1rem",
          }}
        >
          White Glove
        </p>
        <h1
          style={{
            fontSize: "2.5rem",
            fontWeight: 700,
            color: "#0f172a",
            marginBottom: "1rem",
            lineHeight: 1.1,
          }}
        >
          AI-Powered Event Planning
        </h1>
        <p
          style={{
            fontSize: "1.125rem",
            color: "#334155",
            lineHeight: 1.6,
            marginBottom: "2rem",
          }}
        >
          Welcome to White Glove, your intelligent concierge for creating unforgettable experiences. The adventure starts here.
        </p>
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            gap: "0.5rem",
            padding: "0.75rem 1.5rem",
            borderRadius: "999px",
            color: "#fff",
            fontWeight: 600,
            background: "linear-gradient(135deg, #2563eb 0%, #9333ea 100%)",
          }}
        >
          Say hello to effortless events
        </span>
      </section>
    </main>
  );
}
