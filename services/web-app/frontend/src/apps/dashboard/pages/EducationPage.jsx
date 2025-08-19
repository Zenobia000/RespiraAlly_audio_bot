import { useState, useEffect } from "react";
import Papa from "papaparse";
import { EDU_CATEGORIES } from "../../../shared/config";
import EduSearchBar from "../components/EduSearchBar";
import EduCategoryFilter from "../components/EduCategoryFilter";
import EduItemCard from "../components/EduItemCard";
import LoadingSpinner from "../../../shared/components/LoadingSpinner";

const EducationPage = () => {
  const [eduData, setEduData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editingItem, setEditingItem] = useState(null);

  // 載入 CSV 資料
  useEffect(() => {
    loadEducationData();
  }, []);

  const loadEducationData = async () => {
    try {
      // 先檢查 localStorage
      const cachedData = localStorage.getItem("edu_data");
      if (cachedData) {
        const parsed = JSON.parse(cachedData);
        setEduData(parsed);
        setFilteredData(parsed);
        setIsLoading(false);
        return;
      }

      // 載入 CSV
      const response = await fetch("/copd-qa.csv");
      const text = await response.text();

      Papa.parse(text, {
        header: true,
        complete: (results) => {
          const data = results.data
            .map((item, index) => ({
              id: `edu_${index}`,
              category: item["類別"] || item.category,
              question: item["問題"] || item.question,
              answer: item["回答"] || item.answer,
            }))
            .filter((item) => item.question && item.answer);

          setEduData(data);
          setFilteredData(data);
          localStorage.setItem("edu_data", JSON.stringify(data));
          setIsLoading(false);
        },
      });
    } catch (error) {
      console.error("載入衛教資料失敗:", error);
      setIsLoading(false);
    }
  };

  // 篩選資料
  useEffect(() => {
    let filtered = [...eduData];

    // 類別篩選
    if (selectedCategory) {
      filtered = filtered.filter((item) => item.category === selectedCategory);
    }

    // 關鍵字搜尋
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (item) =>
          item.question.toLowerCase().includes(term) ||
          item.answer.toLowerCase().includes(term)
      );
    }

    setFilteredData(filtered);
  }, [searchTerm, selectedCategory, eduData]);

  // 新增項目
  const handleAdd = () => {
    const newItem = {
      id: `edu_new_${Date.now()}`,
      category: EDU_CATEGORIES[0],
      question: "",
      answer: "",
      isNew: true,
    };
    setEditingItem(newItem);
  };

  // 儲存項目
  const handleSave = (item) => {
    let updatedData;
    if (item.isNew) {
      delete item.isNew;
      updatedData = [...eduData, item];
    } else {
      updatedData = eduData.map((d) => (d.id === item.id ? item : d));
    }
    setEduData(updatedData);
    localStorage.setItem("edu_data", JSON.stringify(updatedData));
    setEditingItem(null);
  };

  // 刪除項目
  const handleDelete = (id) => {
    if (window.confirm("確定要刪除這個問答嗎？")) {
      const updatedData = eduData.filter((item) => item.id !== id);
      setEduData(updatedData);
      localStorage.setItem("edu_data", JSON.stringify(updatedData));
    }
  };

  // 匯出 CSV
  const handleExport = () => {
    const csv = Papa.unparse(
      eduData.map(({ id, ...rest }) => rest),
      {
        header: true,
      }
    );
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `copd_qa_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  // 重新匯入
  const handleImport = (event) => {
    const file = event.target.files[0];
    if (file) {
      Papa.parse(file, {
        header: true,
        complete: (results) => {
          const data = results.data
            .map((item, index) => ({
              id: `edu_${index}`,
              category: item["類別"] || item.category,
              question: item["問題"] || item.question,
              answer: item["回答"] || item.answer,
            }))
            .filter((item) => item.question && item.answer);

          setEduData(data);
          localStorage.setItem("edu_data", JSON.stringify(data));
          alert("匯入成功！");
        },
      });
    }
  };

  if (isLoading) {
    return <LoadingSpinner fullScreen message="載入衛教資源..." />;
  }

  return (
    <div className="education-page">
      {/* 頁面標題 */}
      <div className="page-header">
        <div className="header-left">
          <h2 className="page-title">衛教資源管理</h2>
          <p className="page-subtitle">共 {eduData.length} 筆問答資料</p>
        </div>
        <div className="header-actions">
          <button className="btn btn-secondary" onClick={handleExport}>
            <span>📥</span> 匯出 CSV
          </button>
          <label className="btn btn-secondary">
            <span>📤</span> 匯入 CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              style={{ display: "none" }}
            />
          </label>
          <button className="btn btn-primary" onClick={handleAdd}>
            <span>➕</span> 新增問答
          </button>
        </div>
      </div>

      {/* 搜尋與篩選 */}
      <div className="filter-section">
        <EduSearchBar value={searchTerm} onChange={setSearchTerm} />
        <EduCategoryFilter
          categories={EDU_CATEGORIES}
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />
      </div>

      {/* 問答卡片列表 */}
      <div className="edu-grid">
        {editingItem && (
          <EduItemCard
            item={editingItem}
            isEditing={true}
            onSave={handleSave}
            onCancel={() => setEditingItem(null)}
            onDelete={() => handleDelete(editingItem.id)}
          />
        )}
        {filteredData.map((item) => (
          <EduItemCard
            key={item.id}
            item={item}
            isEditing={editingItem?.id === item.id}
            onEdit={() => setEditingItem(item)}
            onSave={handleSave}
            onCancel={() => setEditingItem(null)}
            onDelete={() => handleDelete(item.id)}
          />
        ))}
      </div>

      {filteredData.length === 0 && !editingItem && (
        <div className="empty-state">
          <span className="empty-icon">📚</span>
          <h3>沒有找到相關問答</h3>
          <p>請調整搜尋條件或新增問答</p>
        </div>
      )}

      <style jsx>{`
        .education-page {
          padding: 0;
        }

        .page-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 24px;
        }

        .header-left {
          display: flex;
          align-items: baseline;
          gap: 16px;
        }

        .page-title {
          font-size: 24px;
          font-weight: 600;
          color: var(--text);
          margin: 0;
        }

        .page-subtitle {
          font-size: 14px;
          color: var(--muted);
        }

        .header-actions {
          display: flex;
          gap: 12px;
        }

        .filter-section {
          margin-bottom: 24px;
        }

        .edu-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(360px, 1fr));
          gap: 20px;
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: var(--muted);
        }

        .empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 16px;
          opacity: 0.3;
        }

        .empty-state h3 {
          font-size: 18px;
          font-weight: 500;
          margin-bottom: 8px;
        }

        .empty-state p {
          font-size: 14px;
        }

        @media (max-width: 768px) {
          .page-header {
            flex-direction: column;
            align-items: flex-start;
            gap: 16px;
          }

          .header-actions {
            flex-wrap: wrap;
          }

          .edu-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
};

export default EducationPage;
