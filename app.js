import React, { useState, useRef, useEffect } from 'react';
import ReactDOM from 'react-dom';

const e = React.createElement;

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

function MinutesFormatter() {
  const [memo, setMemo] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [apiKey, setApiKey] = useState(localStorage.getItem("anthropic_api_key") || "");
  const resultRef = useRef(null);

  useEffect(() => {
    localStorage.setItem("anthropic_api_key", apiKey);
  }, [apiKey]);

  const handleFormat = async () => {
    if (!memo.trim()) return;
    if (!apiKey.trim()) {
      setError("APIキーを入力してください。");
      return;
    }
    
    setLoading(true);
    setError("");
    setResult("");

    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { 
            "Content-Type": "application/json",
            "x-api-key": apiKey,
            "anthropic-version": "2023-06-01",
            "anthropic-dangerous-direct-browser-access": "true"
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20240620",
          max_tokens: 2000,
          system: SYSTEM_PROMPT,
          messages: [{ role: "user", content: memo }],
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || "リクエストに失敗しました。");
      }

      const data = await response.json();
      const text = data.content?.map((b) => b.text || "").join("") || "";
      setResult(text);
      setTimeout(() => resultRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      setError(e.message || "エラーが発生しました。もう一度お試しください。");
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

  return e('div', { className: 'wrapper' },
    e('header', null,
      e('div', { className: 'header-icon' }, '📋'),
      e('div', { className: 'header-title-container' },
        e('h1', null, '議事録メーカー'),
        e('p', null, '走り書きメモ → 整った議事録')
      )
    ),
    e('main', null,
      e('section', { style: { border: "1px dashed #c9a84c" } },
        e('div', { className: 'api-key-container' },
          e('span', { style: { fontSize: "12px", color: "#666" } }, 'Anthropic API Key:'),
          e('input', {
            id: 'api-key-input',
            type: 'password',
            value: apiKey,
            onChange: (e) => setApiKey(e.target.value),
            placeholder: 'sk-ant-...'
          })
        )
      ),
      e('section', null,
        e('div', { className: 'section-header' },
          e('span', { className: 'section-header-title' }, '📝 メモを貼り付ける'),
          e('button', { className: 'btn-outline', onClick: () => setMemo(exampleMemo) }, 'サンプルを見る')
        ),
        e('textarea', {
          value: memo,
          onChange: (e) => setMemo(e.target.value),
          placeholder: '会議中に書いたメモ、走り書き、箇条書き…\nどんな形式でもOKです。そのまま貼り付けてください。'
        }),
        e('div', { className: 'section-footer' },
          e('span', { className: 'char-count' }, memo.length > 0 ? `${memo.length}文字` : '文字数: 0'),
          e('div', { className: 'btn-group' },
            (memo || result) && e('button', { className: 'btn-clear', onClick: handleClear }, 'クリア'),
            e('button', {
              className: 'btn-primary',
              onClick: handleFormat,
              disabled: !memo.trim() || loading
            }, loading ? '整形中…' : '✨ 議事録に整形する')
          )
        )
      ),
      loading && e('div', { className: 'loading-container' },
        e('div', { style: { fontSize: "32px", marginBottom: "12px" } }, '⏳'),
        e('p', { style: { margin: 0, fontSize: "15px" } }, 'AIが議事録を整形しています…')
      ),
      error && e('div', { className: 'error-container' }, `⚠️ ${error}`),
      result && e('section', { ref: resultRef, className: 'fade-in' },
        e('div', { className: 'section-header' },
          e('span', { className: 'section-header-title' }, '✅ 整形された議事録'),
          e('button', {
            className: 'btn-copy',
            onClick: handleCopy,
            style: { background: copied ? "#27ae60" : "#c9a84c" }
          }, copied ? '✓ コピーしました' : '📋 コピー')
        ),
        e('div', { className: 'result-content' }, result)
      ),
      e('p', { className: 'footer-tip' }, 'メモは断片的でも大丈夫です。AIが内容を整理して自然な議事録に変換します。')
    )
  );
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(e(MinutesFormatter));
