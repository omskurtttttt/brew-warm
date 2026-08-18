export default function Loading() {
  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        width: "100vw",
        backgroundColor: "var(--color-bg)",
        alignItems: "center",
        justifyContent: "center",
        flexDirection: "column",
        gap: "1rem",
      }}
    >
      <div
        style={{
          width: "48px",
          height: "48px",
          borderRadius: "50%",
          border: "3px solid rgba(193, 104, 47, 0.2)",
          borderTopColor: "var(--color-accent)",
          animation: "spin 0.8s linear infinite",
        }}
      />
      <p
        style={{
          fontFamily: "var(--font-display)",
          fontSize: "1.1rem",
          color: "var(--color-ink)",
          letterSpacing: "0.02em",
        }}
      >
        brewing map...
      </p>
      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
