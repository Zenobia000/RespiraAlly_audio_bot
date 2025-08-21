// 環境配置
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api/v1'
export const LIFF_ID = import.meta.env.VITE_LIFF_ID || ''
export const ENABLE_MOCK = import.meta.env.VITE_ENABLE_MOCK === 'true'
export const ENV = import.meta.env.VITE_ENV || 'development'

// 功能旗標
export const FLAGS = {
  OVERVIEW_READY: false, // 總覽 API 是否就緒
  PATIENT_KPIS_READY: false, // 個案 KPI API 是否就緒
  AI_ALERTS_READY: false, // AI 即時通報是否就緒
  ENABLE_TASK_DRAG: true, // 是否啟用任務拖曳
  ENABLE_EDU_EDIT: true, // 是否啟用衛教資源編輯
}

// API 端點配置
export const API_ENDPOINTS = {
  // 認證
  LOGIN: '/auth/login',
  LINE_LOGIN: '/auth/line/login',
  LINE_REGISTER: '/auth/line/register',
  LOGOUT: '/auth/logout',
  
  // 病患
  THERAPIST_PATIENTS: '/therapist/patients',
  PATIENT_PROFILE: (id) => `/patients/${id}/profile`,
  PATIENT_DAILY_METRICS: (id) => `/patients/${id}/daily_metrics`,
  PATIENT_CAT: (id) => `/patients/${id}/questionnaires/cat`,
  PATIENT_MMRC: (id) => `/patients/${id}/questionnaires/mmrc`,
  
  // 任務
  TASKS: '/tasks',
  TASK_DETAIL: (id) => `/tasks/${id}`,
  
  // 總覽 (尚未實作)
  OVERVIEW_KPIS: '/overview/kpis',
  OVERVIEW_TRENDS: '/overview/trends',
  OVERVIEW_ADHERENCE: '/overview/adherence',
  PATIENT_KPIS: (id) => `/patient/${id}/kpis`,
  
  // 通報
  ALERTS_LIVE: '/alerts/live',
  
  // 語音
  VOICE_TRANSCRIBE: '/voice/transcribe',
  VOICE_SYNTHESIZE: '/voice/synthesize',
  
  // 上傳
  AUDIO_REQUEST_URL: '/uploads/audio/request-url',
}

// 主題配置
export const THEME = {
  colors: {
    bgTop: '#E9F2FF',
    primary: '#7CC6FF',
    purple: '#CBA6FF',
    mint: '#B8F2E6',
    danger: '#E66A6A',
    text: '#2C3E50',
    muted: '#6B7280',
    card: '#FFFFFF',
    success: '#52C41A',
    warning: '#FAAD14',
  },
  shadows: {
    default: '0 8px 24px rgba(0, 0, 0, 0.06)',
    hover: '0 12px 32px rgba(0, 0, 0, 0.08)',
    card: '0 4px 16px rgba(0, 0, 0, 0.04)',
  },
  borderRadius: {
    small: '8px',
    medium: '12px',
    large: '16px',
    round: '9999px',
  },
  transitions: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
  }
}

// 圖表配色
export const CHART_COLORS = {
  cat: '#7CC6FF',
  mmrc: '#CBA6FF',
  water: '#5CDBD3',
  medication: '#FF9F7F',
  exercise: '#95DE64',
  cigarettes: '#FF7875',
  highRisk: '#E66A6A',
  lowAdherence: '#CBA6FF',
}

// 任務類型配置
export const TASK_TYPES = {
  EDUCATION: { label: '衛教', color: '#7CC6FF' },
  TRACKING: { label: '追蹤', color: '#CBA6FF' },
  ASSESSMENT: { label: '評估', color: '#B8F2E6' },
  APPOINTMENT: { label: '回診', color: '#FFD666' },
}

// 任務狀態配置
export const TASK_STATUS = {
  TODO: { label: '待辦', color: '#D9D9D9' },
  IN_PROGRESS: { label: '進行中', color: '#7CC6FF' },
  COMPLETED: { label: '已完成', color: '#52C41A' },
  CANCELLED: { label: '已取消', color: '#FF4D4F' },
}

// 衛教資源類別
export const EDU_CATEGORIES = [
  '疾病認識與病因',
  '症狀與評估',
  '診斷與檢查',
  '藥物與吸入治療',
  '急性惡化與就醫',
  '疫苗與預防',
  '氧氣治療與設備',
  '呼吸器照護',
  '生活照護與復健',
  '旅行與飛航',
  '社會資源與補助',
  '觀念澄清',
]

// 風險等級
export const RISK_LEVELS = {
  HIGH: { label: '高風險', color: '#E66A6A', threshold: { cat: 20, mmrc: 2 } },
  MEDIUM: { label: '中風險', color: '#FAAD14', threshold: { cat: 10, mmrc: 1 } },
  LOW: { label: '低風險', color: '#52C41A', threshold: { cat: 0, mmrc: 0 } },
}

// 依從性閾值
export const ADHERENCE_THRESHOLDS = {
  GOOD: { label: '良好', color: '#52C41A', min: 0.8 },
  FAIR: { label: '尚可', color: '#FAAD14', min: 0.6 },
  POOR: { label: '不佳', color: '#E66A6A', min: 0 },
}
