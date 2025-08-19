import React, { useEffect, useMemo, useState } from "react";
import EduSearchBar from "../components/EduSearchBar";
import EduCategoryFilter from "../components/EduCategoryFilter";
import EduItemCard from "../components/EduItemCard";

// 舊→新類別映射
const CATEGORY_MAP_OLD_TO_NEW = {
  生活品質與運動: "生活照護與復健",
  生活衛教: "生活照護與復健",
  生活照護: "生活照護與復健",
  生活指導: "生活照護與復健",
  日常生活指導: "生活照護與復健",
  呼吸技巧: "生活照護與復健",
  個人照護: "生活照護與復健",
  肺部復原運動: "生活照護與復健",
  服務對象: "生活照護與復健",
  肺復原內容: "生活照護與復健",
  運動準備: "生活照護與復健",
  運動注意事項: "生活照護與復健",
  服務內容: "生活照護與復健",
  痰液處理: "生活照護與復健",
  照護要點: "生活照護與復健",
  病識感提升: "疾病認識與病因",
  疾病說明: "疾病認識與病因",
  疾病理解: "疾病認識與病因",
  疾病定義: "疾病認識與病因",
  疾病認識: "疾病認識與病因",
  疾病原因: "疾病認識與病因",
  病因與危險因子: "疾病認識與病因",
  危險因子: "疾病認識與病因",
  預後: "疾病認識與病因",
  COPD進展與治療: "疾病認識與病因",
  症狀辨識: "症狀與評估",
  症狀與診斷: "症狀與評估",
  臨床警訊: "症狀與評估",
  就醫警訊: "症狀與評估",
  臨床表現: "症狀與評估",
  無症狀期: "症狀與評估",
  病史: "症狀與評估",
  診斷方式: "診斷與檢查",
  診斷: "診斷與檢查",
  肺功能: "診斷與檢查",
  X光影像: "診斷與檢查",
  血液特徵: "診斷與檢查",
  氧氣評估: "診斷與檢查",
  呼吸系統生理與病理: "診斷與檢查",
  呼吸衰竭與低血氧症評估: "診斷與檢查",
  治療原則: "藥物與吸入治療",
  臨床處置: "藥物與吸入治療",
  治療方式: "藥物與吸入治療",
  藥物治療: "藥物與吸入治療",
  藥物衛教: "藥物與吸入治療",
  吸入劑使用: "藥物與吸入治療",
  吸入藥物使用: "藥物與吸入治療",
  吸藥輔助器: "藥物與吸入治療",
  吸入器選擇: "藥物與吸入治療",
  吸入器選擇與操作: "藥物與吸入治療",
  專業人員教育: "藥物與吸入治療",
  病人教育流程: "藥物與吸入治療",
  用藥追蹤與成效: "藥物與吸入治療",
  衛教支援: "藥物與吸入治療",
  "pMDI（壓力定量吸入器）": "藥物與吸入治療",
  "pMDI + Spacer（吸藥輔助器）": "藥物與吸入治療",
  "Respimat 吸入器": "藥物與吸入治療",
  "Turbuhaler 吸入器": "藥物與吸入治療",
  "Breezhaler 吸入器": "藥物與吸入治療",
  急性惡化: "急性惡化與就醫",
  疫苗: "疫苗與預防",
  疫苗建議與接種: "疫苗與預防",
  疫苗種類與差異: "疫苗與預防",
  疫苗成效與研究依據: "疫苗與預防",
  臨床建議與案例: "疫苗與預防",
  流感疫苗: "疫苗與預防",
  肺炎鏈球菌疫苗: "疫苗與預防",
  疫苗接種: "疫苗與預防",
  氧氣治療: "氧氣治療與設備",
  "長期氧療（LTOT）": "氧氣治療與設備",
  供氧設備種類: "氧氣治療與設備",
  氧氣吸入裝置: "氧氣治療與設備",
  氧療副作用: "氧氣治療與設備",
  使用注意事項: "氧氣治療與設備",
  居家氧氣治療: "氧氣治療與設備",
  氧氣供應設備: "氧氣治療與設備",
  氧氣治療目的: "氧氣治療與設備",
  呼吸器使用: "呼吸器照護",
  居家呼吸照護: "呼吸器照護",
  呼吸器警報處理: "呼吸器照護",
  非侵襲性呼吸器: "呼吸器照護",
  侵襲性呼吸器: "呼吸器照護",
  居家照護規劃: "呼吸器照護",
  旅行建議: "旅行與飛航",
  旅行安全: "旅行與飛航",
  飛航安全: "旅行與飛航",
  飛航評估: "旅行與飛航",
  飛航氧氣需求: "旅行與飛航",
  陸地旅行: "旅行與飛航",
  飛航禁忌症: "旅行與飛航",
  飛航高風險族群: "旅行與飛航",
  長期照護與社會資源: "社會資源與補助",
  社會資源: "社會資源與補助",
  呼吸器補助申請: "社會資源與補助",
  醫療輔具申請: "社會資源與補助",
  電費補助: "社會資源與補助",
  殘障證明申請: "社會資源與補助",
  觀念澄清: "觀念澄清",
  運動益處與迷思: "觀念澄清",
};

function normalizeCategory(cat) {
  const key = String(cat || "").trim();
  if (!key) return "未分類";
  return CATEGORY_MAP_OLD_TO_NEW[key] || key;
}

function parseCSV(text) {
  const source = text && text.charCodeAt(0) === 0xfeff ? text.slice(1) : text;
  const rows = [];
  let currentField = "";
  let currentRow = [];
  let inQuotes = false;
  for (let i = 0; i < source.length; i += 1) {
    const char = source[i];
    if (inQuotes) {
      if (char === '"') {
        if (source[i + 1] === '"') {
          currentField += '"';
          i += 1;
        } else {
          inQuotes = false;
        }
      } else {
        currentField += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        currentRow.push(currentField);
        currentField = "";
      } else if (char === "\n") {
        currentRow.push(currentField);
        rows.push(currentRow);
        currentRow = [];
        currentField = "";
      } else if (char === "\r") {
        // ignore
      } else {
        currentField += char;
      }
    }
  }
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  if (rows.length === 0) return [];
  const header = rows.shift() || [];
  const idx = (k) => header.indexOf(k);
  const iCat = idx("類別");
  const iQ = idx("問題（Q）");
  const iA = idx("回答（A）");
  const iKw = idx("關鍵詞");

  const items = [];
  for (const r of rows) {
    if (!r || r.length === 0) continue;
    const category = normalizeCategory((r[iCat] || "").trim());
    const q = (r[iQ] || "").trim();
    const a = (r[iA] || "").trim();
    const keywords = (r[iKw] || "").trim();
    if (!category && !q && !a && !keywords) continue;
    items.push({ category, q, a, keywords });
  }
  return items;
}

export default function EducationPage() {
  const [items, setItems] = useState(() => {
    try {
      const saved = localStorage.getItem("edu_items");
      if (!saved) return [];
      const parsed = JSON.parse(saved);
      if (!Array.isArray(parsed)) return [];
      return parsed.map((it) => ({
        ...it,
        category: normalizeCategory(it.category),
      }));
    } catch (_) {
      return [];
    }
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [activeCats, setActiveCats] = useState(() => new Set());

  useEffect(() => {
    if (items.length) return; // 已有快取
    setLoading(true);
    fetch("/copd-qa.csv")
      .then((r) => r.text())
      .then((t) => setItems(parseCSV(t)))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    localStorage.setItem("edu_items", JSON.stringify(items));
  }, [items]);

  const categories = useMemo(() => {
    const set = new Set();
    for (const it of items) set.add(it.category || "未分類");
    return Array.from(set);
  }, [items]);

  const matchesQuery = (it, q) => {
    const query = q.trim().toLowerCase();
    if (!query) return true;
    const hay = `${it.category || ""} ${it.q || ""} ${it.a || ""} ${
      it.keywords || ""
    }`.toLowerCase();
    const tokens = query.split(/\s+/).filter(Boolean);
    return tokens.every((t) => hay.includes(t));
  };

  const filteredFlat = useMemo(() => {
    const selectedCategories = Array.from(activeCats);
    const hasCategoryFilter = selectedCategories.length > 0;
    return items.filter((it) => {
      if (!matchesQuery(it, search)) return false;
      if (!hasCategoryFilter) return true;
      const cat = it.category || "未分類";
      return activeCats.has(cat);
    });
  }, [items, activeCats, search]);

  const addItem = () => {
    setItems((arr) => [
      { category: "未分類", q: "", a: "", keywords: "" },
      ...arr,
    ]);
  };

  const updateItemByRef = (target, patch) => {
    setItems((arr) => {
      const idx = arr.indexOf(target);
      if (idx === -1) return arr;
      const next = arr.slice();
      next[idx] = { ...next[idx], ...patch };
      return next;
    });
  };

  const removeItemByRef = (target) => {
    setItems((arr) => {
      const idx = arr.indexOf(target);
      if (idx === -1) return arr;
      const next = arr.slice();
      next.splice(idx, 1);
      return next;
    });
  };

  const toggleCategory = (c) => {
    setActiveCats((prev) => {
      const next = new Set(prev);
      if (next.has(c)) next.delete(c);
      else next.add(c);
      return next;
    });
  };

  const clearFilters = () => setActiveCats(new Set());

  const reloadFromCsv = () => {
    if (!window.confirm("將刪除目前所有卡片內容並從CSV重新匯入，確定繼續？")) {
      return;
    }
    setLoading(true);
    fetch("/copd-qa.csv")
      .then((r) => r.text())
      .then((t) => setItems(parseCSV(t)))
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  };

  if (loading) return <div style={{ padding: 12 }}>載入中…</div>;
  if (error)
    return (
      <div style={{ padding: 12, color: "#b91c1c" }}>讀取失敗：{error}</div>
    );

  return (
    <div
      style={{ display: "flex", flexDirection: "column", gap: 12, padding: 12 }}
    >
      <div style={{ display: "grid", gap: 10 }}>
        <EduSearchBar value={search} onChange={setSearch} />
        <EduCategoryFilter
          categories={categories}
          active={activeCats}
          onToggle={toggleCategory}
          onClear={clearFilters}
        />
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
        <button
          className="btn"
          onClick={reloadFromCsv}
          style={{ background: "#f59e0b" }}
        >
          重新匯入
        </button>
        <button className="btn" onClick={addItem}>
          新增條目
        </button>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        {filteredFlat.map((it, i) => (
          <EduItemCard
            key={i}
            item={it}
            onUpdate={(patch) => updateItemByRef(it, patch)}
            onDelete={() => removeItemByRef(it)}
          />
        ))}
      </div>
    </div>
  );
}
