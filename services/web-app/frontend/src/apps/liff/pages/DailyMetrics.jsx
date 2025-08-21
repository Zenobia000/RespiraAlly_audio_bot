import { useState } from "react";
import { useNavigate } from "react-router-dom";

const DailyMetrics = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    water: 0,
    medication: false,
    exercise: 0,
    cigarettes: 0,
    mood: 3,
    symptoms: {
      cough: false,
      phlegm: false,
      wheezing: false,
      chestTightness: false,
      shortnessOfBreath: false,
    },
  });

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSymptomChange = (symptom) => {
    setFormData((prev) => ({
      ...prev,
      symptoms: {
        ...prev.symptoms,
        [symptom]: !prev.symptoms[symptom],
      },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // TODO: 整合 API 提交
      console.log("提交每日健康數據:", formData);

      // 顯示成功訊息
      const messageDiv = document.createElement("div");
      messageDiv.className = "success-message";
      messageDiv.textContent = "健康數據已記錄！";
      messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        background: #52c41a;
        color: white;
        border-radius: 8px;
        z-index: 1000;
        animation: slideDown 0.3s ease;
      `;
      document.body.appendChild(messageDiv);
      setTimeout(() => messageDiv.remove(), 3000);

      // 延遲後返回首頁
      setTimeout(() => {
        navigate("/liff");
      }, 1000);
    } catch (error) {
      console.error("Submit error:", error);
      // 顯示錯誤訊息
      const messageDiv = document.createElement("div");
      messageDiv.className = "error-message";
      messageDiv.textContent = "提交失敗，請重試";
      messageDiv.style.cssText = `
        position: fixed;
        top: 20px;
        left: 50%;
        transform: translateX(-50%);
        padding: 12px 24px;
        background: #ff4d4f;
        color: white;
        border-radius: 8px;
        z-index: 1000;
        animation: slideDown 0.3s ease;
      `;
      document.body.appendChild(messageDiv);
      setTimeout(() => messageDiv.remove(), 3000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="daily-metrics-page">
      <style jsx>{`
        @keyframes slideDown {
          from {
            opacity: 0;
            transform: translate(-50%, -20px);
          }
          to {
            opacity: 1;
            transform: translate(-50%, 0);
          }
        }

        .daily-metrics-page {
          min-height: 100vh;
          background: linear-gradient(135deg, #e9f2ff 0%, #f8f8f8 100%);
          padding: 20px;
        }

        .container {
          max-width: 600px;
          margin: 0 auto;
        }

        .header {
          text-align: center;
          margin-bottom: 32px;
        }

        .title {
          font-size: 28px;
          font-weight: 700;
          color: #2c3e50;
          margin: 0 0 8px 0;
        }

        .subtitle {
          font-size: 14px;
          color: #6b7280;
          margin: 0;
        }

        .form-card {
          background: white;
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
          margin-bottom: 20px;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #2c3e50;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .section-icon {
          font-size: 20px;
        }

        .form-group {
          margin-bottom: 20px;
        }

        .form-label {
          display: block;
          font-size: 14px;
          font-weight: 500;
          color: #4b5563;
          margin-bottom: 8px;
        }

        .input-group {
          display: flex;
          align-items: center;
          gap: 12px;
        }

        .number-input {
          width: 100px;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          font-size: 16px;
          text-align: center;
        }

        .number-input:focus {
          outline: none;
          border-color: #7cc6ff;
          box-shadow: 0 0 0 3px rgba(124, 198, 255, 0.1);
        }

        .unit {
          color: #6b7280;
          font-size: 14px;
        }

        .toggle-switch {
          position: relative;
          width: 48px;
          height: 24px;
          background: #e5e7eb;
          border-radius: 12px;
          cursor: pointer;
          transition: background 200ms;
        }

        .toggle-switch.active {
          background: #52c41a;
        }

        .toggle-switch::after {
          content: "";
          position: absolute;
          top: 2px;
          left: 2px;
          width: 20px;
          height: 20px;
          background: white;
          border-radius: 50%;
          transition: transform 200ms;
        }

        .toggle-switch.active::after {
          transform: translateX(24px);
        }

        .mood-selector {
          display: flex;
          gap: 12px;
        }

        .mood-option {
          width: 48px;
          height: 48px;
          border: 2px solid transparent;
          border-radius: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          cursor: pointer;
          transition: all 200ms;
        }

        .mood-option:hover {
          transform: scale(1.1);
        }

        .mood-option.selected {
          border-color: #7cc6ff;
          background: #e9f2ff;
        }

        .symptoms-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .symptom-item {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 12px;
          border: 1px solid #e5e7eb;
          border-radius: 8px;
          cursor: pointer;
          transition: all 200ms;
        }

        .symptom-item:hover {
          background: #f9fafb;
        }

        .symptom-item.active {
          background: #fee2e2;
          border-color: #fecaca;
        }

        .checkbox {
          width: 18px;
          height: 18px;
          border: 2px solid #d1d5db;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 200ms;
        }

        .symptom-item.active .checkbox {
          background: #ef4444;
          border-color: #ef4444;
        }

        .symptom-item.active .checkbox::after {
          content: "✓";
          color: white;
          font-size: 12px;
        }

        .symptom-label {
          font-size: 14px;
          color: #4b5563;
        }

        .button-group {
          display: flex;
          gap: 12px;
          margin-top: 32px;
        }

        .btn {
          flex: 1;
          padding: 14px;
          border: none;
          border-radius: 12px;
          font-size: 16px;
          font-weight: 600;
          cursor: pointer;
          transition: all 200ms;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
        }

        .btn-primary {
          background: linear-gradient(135deg, #7cc6ff, #5cb8ff);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(124, 198, 255, 0.3);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: white;
          color: #6b7280;
          border: 1px solid #e5e7eb;
        }

        .btn-secondary:hover {
          background: #f9fafb;
        }

        @media (max-width: 480px) {
          .symptoms-grid {
            grid-template-columns: 1fr;
          }

          .mood-selector {
            justify-content: space-between;
          }
        }
      `}</style>

      <div className="container">
        {/* 頁面標題 */}
        <div className="header">
          <h1 className="title">每日健康記錄</h1>
          <p className="subtitle">記錄您今天的健康狀況</p>
        </div>

        <form onSubmit={handleSubmit}>
          {/* 基本指標 */}
          <div className="form-card">
            <h2 className="section-title">
              <span className="section-icon">💧</span>
              基本健康指標
            </h2>

            <div className="form-group">
              <label className="form-label">飲水量</label>
              <div className="input-group">
                <input
                  type="number"
                  className="number-input"
                  value={formData.water}
                  onChange={(e) =>
                    handleInputChange("water", parseInt(e.target.value) || 0)
                  }
                  min="0"
                  max="5000"
                />
                <span className="unit">毫升</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">運動時間</label>
              <div className="input-group">
                <input
                  type="number"
                  className="number-input"
                  value={formData.exercise}
                  onChange={(e) =>
                    handleInputChange("exercise", parseInt(e.target.value) || 0)
                  }
                  min="0"
                  max="300"
                />
                <span className="unit">分鐘</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">吸菸量</label>
              <div className="input-group">
                <input
                  type="number"
                  className="number-input"
                  value={formData.cigarettes}
                  onChange={(e) =>
                    handleInputChange(
                      "cigarettes",
                      parseInt(e.target.value) || 0
                    )
                  }
                  min="0"
                  max="100"
                />
                <span className="unit">支</span>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">今日已服藥</label>
              <div
                className={`toggle-switch ${
                  formData.medication ? "active" : ""
                }`}
                onClick={() =>
                  handleInputChange("medication", !formData.medication)
                }
              />
            </div>
          </div>

          {/* 心情狀態 */}
          <div className="form-card">
            <h2 className="section-title">
              <span className="section-icon">😊</span>
              今日心情
            </h2>
            <div className="mood-selector">
              {[
                { value: 1, emoji: "😔" },
                { value: 2, emoji: "😐" },
                { value: 3, emoji: "🙂" },
                { value: 4, emoji: "😊" },
                { value: 5, emoji: "😄" },
              ].map((mood) => (
                <div
                  key={mood.value}
                  className={`mood-option ${
                    formData.mood === mood.value ? "selected" : ""
                  }`}
                  onClick={() => handleInputChange("mood", mood.value)}
                >
                  {mood.emoji}
                </div>
              ))}
            </div>
          </div>

          {/* 症狀記錄 */}
          <div className="form-card">
            <h2 className="section-title">
              <span className="section-icon">🩺</span>
              症狀記錄
            </h2>
            <div className="symptoms-grid">
              {[
                { key: "cough", label: "咳嗽" },
                { key: "phlegm", label: "痰液" },
                { key: "wheezing", label: "喘鳴" },
                { key: "chestTightness", label: "胸悶" },
                { key: "shortnessOfBreath", label: "呼吸困難" },
              ].map((symptom) => (
                <div
                  key={symptom.key}
                  className={`symptom-item ${
                    formData.symptoms[symptom.key] ? "active" : ""
                  }`}
                  onClick={() => handleSymptomChange(symptom.key)}
                >
                  <div className="checkbox" />
                  <span className="symptom-label">{symptom.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 按鈕區 */}
          <div className="button-group">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => navigate("/liff")}
            >
              取消
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={loading}
            >
              <span>💾</span>
              {loading ? "提交中..." : "儲存記錄"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DailyMetrics;
