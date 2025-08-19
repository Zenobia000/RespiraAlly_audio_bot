import React from "react";
import { Routes, Route } from "react-router-dom";
import PatientDetail from "./PatientDetail";

export default function CasesPage() {
  return (
    <div style={{ padding: 12 }}>
      <div className="card" aria-label="個案詳情">
        <Routes>
          <Route
            index
            element={
              <div style={{ color: "var(--muted)" }}>
                請使用右側「選擇病患」搜尋並點選，將自動載入個案詳情
              </div>
            }
          />
          <Route path=":id" element={<PatientDetail />} />
        </Routes>
      </div>
    </div>
  );
}
