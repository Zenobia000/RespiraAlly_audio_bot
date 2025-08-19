import React, { useEffect, useRef, useState } from "react";

export default function EduItemCard({ item, onUpdate, onDelete }) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [draft, setDraft] = useState(item);
  const menuRef = useRef(null);

  useEffect(() => {
    setDraft(item);
  }, [item]);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSave = () => {
    onUpdate({
      category: draft.category ?? "",
      q: draft.q ?? "",
      a: draft.a ?? "",
      keywords: draft.keywords ?? "",
    });
    setIsEditMode(false);
  };

  const handleCancel = () => {
    setDraft(item);
    setIsEditMode(false);
  };

  return (
    <div
      style={{
        border: "1px solid rgba(255,255,255,0.18)",
        borderRadius: 10,
        padding: 10,
        position: "relative",
        background: "rgba(255,255,255,0.03)",
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        boxShadow:
          "inset 0 0 0 1px rgba(255,255,255,0.08), 0 8px 24px rgba(0,0,0,0.15)",
      }}
    >
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <div style={{ position: "relative" }} ref={menuRef}>
          <button className="btn" onClick={() => setIsMenuOpen((v) => !v)}>
            編輯
          </button>
          {isMenuOpen && (
            <div
              style={{
                position: "absolute",
                right: 0,
                marginTop: 6,
                background: "#ffffff",
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                boxShadow: "0 4px 10px rgba(0,0,0,0.08)",
                zIndex: 10,
                minWidth: 120,
              }}
            >
              <button
                className="btn"
                onClick={() => {
                  setIsEditMode(true);
                  setIsMenuOpen(false);
                }}
                style={{ width: "100%", textAlign: "left", borderRadius: 8 }}
              >
                修改
              </button>
              <button
                className="btn"
                onClick={() => {
                  setIsMenuOpen(false);
                  onDelete();
                }}
                style={{
                  width: "100%",
                  textAlign: "left",
                  background: "#e66a6a",
                  borderRadius: 8,
                  marginTop: 4,
                }}
              >
                刪除
              </button>
            </div>
          )}
        </div>
      </div>

      {!isEditMode ? (
        <div
          style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 8 }}
        >
          <div style={{ color: "#6b7280", fontSize: 12 }}>類別</div>
          <div>{item.category || "未分類"}</div>
          <div style={{ color: "#6b7280", fontSize: 12 }}>問題（Q）</div>
          <div>{item.q || "—"}</div>
          <div style={{ color: "#6b7280", fontSize: 12 }}>回答（A）</div>
          <div style={{ whiteSpace: "pre-wrap" }}>{item.a || "—"}</div>
          <div style={{ color: "#6b7280", fontSize: 12 }}>關鍵詞</div>
          <div>{item.keywords || "—"}</div>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "100px 1fr",
            gap: 8,
            marginTop: 6,
          }}
        >
          <div style={{ color: "#6b7280", fontSize: 12 }}>類別</div>
          <input
            value={draft.category || ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, category: e.target.value }))
            }
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          />
          <div style={{ color: "#6b7280", fontSize: 12 }}>問題（Q）</div>
          <input
            value={draft.q || ""}
            onChange={(e) => setDraft((d) => ({ ...d, q: e.target.value }))}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          />
          <div style={{ color: "#6b7280", fontSize: 12 }}>回答（A）</div>
          <textarea
            value={draft.a || ""}
            onChange={(e) => setDraft((d) => ({ ...d, a: e.target.value }))}
            rows={3}
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          />
          <div style={{ color: "#6b7280", fontSize: 12 }}>關鍵詞</div>
          <input
            value={draft.keywords || ""}
            onChange={(e) =>
              setDraft((d) => ({ ...d, keywords: e.target.value }))
            }
            style={{
              width: "100%",
              padding: 8,
              borderRadius: 8,
              border: "1px solid #e5e7eb",
            }}
          />
          <div />
          <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
            <button
              className="btn"
              onClick={handleCancel}
              style={{ background: "#e5e7eb" }}
            >
              取消
            </button>
            <button className="btn" onClick={handleSave}>
              儲存
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
