import React from "react";

export default function PatientProfileCard({ profile }) {
  if (!profile) return null;

  const name = profile.name ?? "—";
  const userId = profile.userId ?? profile.id ?? "—";
  const risk = profile.riskGroup ?? profile.risk ?? "—";
  const sex = profile.sex ?? "—";
  const age =
    typeof profile.age === "number" ? `${profile.age} 歲` : profile.age ?? "—";
  const heightCm = profile.height ?? profile.heightCm; // could be number or string
  const weightKg = profile.weight ?? profile.weightKg; // could be number or string
  const smokingYears =
    profile.smokingYears ?? profile.smokeYears ?? profile.smoking_age ?? null;

  const heightNumber =
    heightCm !== undefined && heightCm !== null ? Number(heightCm) : undefined;
  const weightNumber =
    weightKg !== undefined && weightKg !== null ? Number(weightKg) : undefined;
  const heightM = heightNumber ? heightNumber / 100 : undefined;
  const bmi =
    weightNumber && heightM ? weightNumber / (heightM * heightM) : undefined;
  const bmiText = Number.isFinite(bmi) ? `${bmi.toFixed(1)} kg/m²` : "—";

  const { badgeBg, badgeColor } = getRiskStyles(risk);

  const infoItems = [
    { label: "性別", value: sex },
    { label: "年齡", value: age },
    { label: "身高", value: heightNumber ? `${heightNumber} cm` : "—" },
    { label: "體重", value: weightNumber ? `${weightNumber} kg` : "—" },
    {
      label: "菸齡",
      value: smokingYears || smokingYears === 0 ? `${smokingYears} 年` : "—",
    },
    { label: "BMI", value: bmiText },
  ];

  return (
    <div className="card">
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <div>
          <div style={{ color: "var(--muted)", fontSize: 12, marginBottom: 6 }}>
            基本資料
          </div>
          <div style={{ fontWeight: 700, fontSize: 16 }}>
            {name}{" "}
            <span style={{ fontSize: 12, color: "var(--muted)" }}>
              #{userId}
            </span>
          </div>
        </div>
        <span
          className="badge"
          style={{
            background: badgeBg,
            color: badgeColor,
            fontWeight: 700,
          }}
        >
          {formatRiskLabel(risk)}
        </span>
      </div>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(2, minmax(140px, 1fr))",
          gap: 10,
          fontSize: 14,
        }}
      >
        {infoItems.map((item) => (
          <div key={item.label} style={{ display: "flex", gap: 8 }}>
            <div style={{ color: "var(--muted)", minWidth: 48 }}>
              {item.label}
            </div>
            <div style={{ fontWeight: 600 }}>{item.value}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getRiskStyles(risk) {
  if (!risk) {
    return { badgeBg: "#EEF6FF", badgeColor: "#2563eb" };
  }
  const key = String(risk).toLowerCase();
  if (key.includes("高") || key.includes("high")) {
    return { badgeBg: "#FDE8E8", badgeColor: "#B91C1C" };
  }
  if (
    key.includes("中") ||
    key.includes("medium") ||
    key.includes("moderate")
  ) {
    return { badgeBg: "#FEF3C7", badgeColor: "#92400E" };
  }
  if (key.includes("低") || key.includes("low")) {
    return { badgeBg: "#E6F7EE", badgeColor: "#047857" };
  }
  return { badgeBg: "#EEF6FF", badgeColor: "#2563eb" };
}

function formatRiskLabel(risk) {
  if (!risk) return "—";
  const key = String(risk).toLowerCase();
  if (key.includes("high") || key.includes("高")) return "高風險";
  if (key.includes("medium") || key.includes("moderate") || key.includes("中"))
    return "中風險";
  if (key.includes("low") || key.includes("低")) return "低風險";
  return String(risk);
}
