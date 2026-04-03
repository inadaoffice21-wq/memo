import { useState, useRef } from "react";

const SYSTEM_PROMPT = `あなたは議事録作成の専門家です。
ユーザーから渡されたバラバラなメモや走り書きを、以下のフォーマットの整った議事録に変換してください。

# 議事録

**日時：** （メモから読み取れる場合は記載。不明な場合は「―」）
**参加者：** （メモから読み取れる場合は記載。不明な場合は「―」）
**場所：** （メモから読み取れる場合は記載。不明な場合は「―」）

---

## 議題
（議題を簡潔に記載）

## 協議内容
（メモの内容を整理して箇条書きで記載）

## 決定事項
（決まったことを箇条書きで記載。なければ「特になし」）

## 次回アクション / TODO
（誰が・何を・いつまでにを記載。なければ「特になし」）

## 次回予定
（次回の日程など。不明な場合は「―」）

---
メモが断片的でも、内容を推測して自然な日本語で整形してください。`;

export default function MinutesFormatter() {
  const [memo, setMemo] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const resultRef = useRef(null);

  const handleFormat = async () => {
    if (!memo.trim()) return;
    setLoading(true);
    setError("");
    setResult("");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: memo }],
        }),
      });

      const data = await response.json();
      const text = data.content?.map((b) => b.text || "").join("") || "";
      setResult(text);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      setError("エラーが発生しました。もう一度お試しください。");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(result);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setMemo("");
    setResult("");
    setError("");
  };

  const exampleMemo = `4/3 佐藤・田中・鈴木参加
予算の件→来月まで保留
新しいシステム導入について鈴木さんが調べてくる
田中さんはクライアントAに連絡必要、今週中
次回5/1 14時から`;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#f5f0e8",
      fontFamily: "'Georgia', 'Times New Roman', serif",
      padding: "0",
    }}>
      {/* Header */}
      <header style={{
        background: "#1a1a2e",
        padding: "28px 40px",
        display: "flex",
        alignItems: "center",
        gap: "16px",
        borderBottom: "3px solid #c9a84c",
      }}>
        <div style={{
          width: 44, height: 44,
          background: "#c9a84c",
          borderRadius: "4px",
          display: "flex", alignItems: "center", justifyContent: "center",
          fontSize: 22,
        }}>📋</div>
        <div>
          <h1 style={{
            color: "#f5f0e8",
            fontSize: "22px",
            fontWeight: "bold",
            margin: 0,
            letterSpacing: "0.05em",
          }}>議事録メーカー</h1>
          <p style={{ color: "#c9a84c", fontSize: "13px", margin: 0, letterSpacing: "0.08em" }}>
            走り書きメモ → 整った議事録
          </p>
        </div>
      </header>

      <main style={{ maxWidth: 860, margin: "0 auto", padding: "40px 24px" }}>
        {/* Input Section */}
        <section style={{
          background: "#fff",
          borderRadius: "8px",
          border: "1px solid #d4c9b0",
          overflow: "hidden",
          boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          marginBottom: 28,
        }}>
          <div style={{
            background: "#1a1a2e",
            padding: "14px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}>
            <span style={{ color: "#f5f0e8", fontSize: "14px", fontWeight: "bold", letterSpacing: "0.05em" }}>
              📝 メモを貼り付ける
            </span>
            <button
              onClick={() => setMemo(exampleMemo)}
              style={{
                background: "transparent",
                border: "1px solid #c9a84c",
                color: "#c9a84c",
                padding: "5px 14px",
                borderRadius: "4px",
                fontSize: "12px",
                cursor: "pointer",
                letterSpacing: "0.05em",
              }}
            >
              サンプルを見る
            </button>
          </div>

          <textarea
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder={"会議中に書いたメモ、走り書き、箇条書き…\nどんな形式でもOKです。そのまま貼り付けてください。"}
            style={{
              width: "100%",
              minHeight: 200,
              padding: "20px",
              border: "none",
              outline: "none",
              fontSize: "15px",
              fontFamily: "'Hiragino Sans', 'Meiryo', sans-serif",
              lineHeight: 1.8,
              color: "#2c2c2c",
              resize: "vertical",
              boxSizing: "border-box",
              background: "#fffef9",
            }}
          />

          <div style={{
            padding: "14px 20px",
            borderTop: "1px solid #e8e0d0",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#faf7f2",
          }}>
            <span style={{ color: "#999", fontSize: "13px" }}>
              {memo.length > 0 ? `${memo.length}文字` : "文字数: 0"}
            </span>
            <div style={{ display: "flex", gap: 10 }}>
              {(memo || result) && (
                <button
                  onClick={handleClear}
                  style={{
                    background: "transparent",
                    border: "1px solid #ccc",
                    color: "#888",
                    padding: "9px 20px",
                    borderRadius: "4px",
                    fontSize: "14px",
                    cursor: "pointer",
                  }}
                >
                  クリア
                </button>
              )}
              <button
                onClick={handleFormat}
                disabled={!memo.trim() || loading}
                style={{
                  background: memo.trim() && !loading ? "#1a1a2e" : "#ccc",
                  color: "#fff",
                  border: "none",
                  padding: "9px 28px",
                  borderRadius: "4px",
                  fontSize: "14px",
                  fontWeight: "bold",
                  cursor: memo.trim() && !loading ? "pointer" : "not-allowed",
                  letterSpacing: "0.05em",
                  transition: "background 0.2s",
                }}
              >
                {loading ? "整形中…" : "✨ 議事録に整形する"}
              </button>
            </div>
          </div>
        </section>

        {/* Loading */}
        {loading && (
          <div style={{
            background: "#fff",
            border: "1px solid #d4c9b0",
            borderRadius: "8px",
            padding: "40px",
            textAlign: "center",
            color: "#888",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
          }}>
            <div style={{ fontSize: 32, marginBottom: 12 }}>⏳</div>
            <p style={{ margin: 0, fontSize: "15px" }}>AIが議事録を整形しています…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={{
            background: "#fff5f5",
            border: "1px solid #ffcccc",
            borderRadius: "8px",
            padding: "16px 20px",
            color: "#c0392b",
            fontSize: "14px",
          }}>
            ⚠️ {error}
          </div>
        )}

        {/* Result */}
        {result && (
          <section ref={resultRef} style={{
            background: "#fff",
            borderRadius: "8px",
            border: "1px solid #d4c9b0",
            overflow: "hidden",
            boxShadow: "0 2px 12px rgba(0,0,0,0.06)",
            animation: "fadeIn 0.4s ease",
          }}>
            <style>{`@keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }`}</style>
            <div style={{
              background: "#1a1a2e",
              padding: "14px 20px",
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}>
              <span style={{ color: "#f5f0e8", fontSize: "14px", fontWeight: "bold", letterSpacing: "0.05em" }}>
                ✅ 整形された議事録
              </span>
              <button
                onClick={handleCopy}
                style={{
                  background: copied ? "#27ae60" : "#c9a84c",
                  border: "none",
                  color: "#fff",
                  padding: "6px 18px",
                  borderRadius: "4px",
                  fontSize: "13px",
                  cursor: "pointer",
                  fontWeight: "bold",
                  transition: "background 0.2s",
                }}
              >
                {copied ? "✓ コピーしました" : "📋 コピー"}
              </button>
            </div>

            <div style={{
              padding: "28px 32px",
              fontSize: "15px",
              lineHeight: 2,
              color: "#2c2c2c",
              fontFamily: "'Hiragino Sans', 'Meiryo', sans-serif",
              whiteSpace: "pre-wrap",
              background: "#fffef9",
            }}>
              {result}
            </div>
          </section>
        )}

        {/* Footer tip */}
        <p style={{
          textAlign: "center",
          color: "#aaa",
          fontSize: "12px",
          marginTop: 36,
          letterSpacing: "0.05em",
        }}>
          メモは断片的でも大丈夫です。AIが内容を整理して自然な議事録に変換します。
        </p>
      </main>
    </div>
  );
}
