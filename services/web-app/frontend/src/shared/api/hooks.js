import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { API_ENDPOINTS, FLAGS, ENABLE_MOCK } from "../config";
import {
  mockPatients,
  mockKpis,
  mockTrends,
  mockAdherence,
} from "../utils/mock";

// ==================== 病患相關 ====================

// 取得治療師的病患列表
export const usePatients = (params = {}) => {
  return useQuery({
    queryKey: ["patients", params],
    queryFn: async () => {
      if (ENABLE_MOCK) return Promise.resolve(mockPatients);

      // 過濾掉 undefined 和空字符串的參數
      const filteredParams = Object.fromEntries(
        Object.entries(params).filter(
          ([, value]) => value !== undefined && value !== null && value !== ""
        )
      );

      const queryString = new URLSearchParams(filteredParams).toString();
      const response = await apiClient.get(
        `${API_ENDPOINTS.THERAPIST_PATIENTS}?${queryString}`
      );

      // 提取 API 回傳的 data 欄位，確保回傳陣列格式
      return response?.data || [];
    },
    staleTime: 5 * 60 * 1000,
  });
};

// 取得病患檔案
export const usePatientProfile = (id) => {
  return useQuery({
    queryKey: ["patient-profile", id],
    queryFn: async () => {
      const response = await apiClient.get(API_ENDPOINTS.PATIENT_PROFILE(id));
      return response?.data || {};
    },
    enabled: !!id,
  });
};

// 取得病患每日健康指標
export const usePatientMetrics = (id, params = {}) => {
  return useQuery({
    queryKey: ["patient-metrics", id, params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(
        `${API_ENDPOINTS.PATIENT_DAILY_METRICS(id)}?${queryString}`
      );
      return response?.data || [];
    },
    enabled: !!id,
  });
};

// 取得 CAT 歷史記錄
export const useCatHistory = (id, params = {}) => {
  return useQuery({
    queryKey: ["cat", id, params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(
        `${API_ENDPOINTS.PATIENT_CAT(id)}?${queryString}`
      );
      return response?.data || [];
    },
    enabled: !!id,
  });
};

// 取得 mMRC 歷史記錄
export const useMmrcHistory = (id, params = {}) => {
  return useQuery({
    queryKey: ["mmrc", id, params],
    queryFn: async () => {
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(
        `${API_ENDPOINTS.PATIENT_MMRC(id)}?${queryString}`
      );
      return response?.data || [];
    },
    enabled: !!id,
  });
};

// ==================== 總覽相關（缺項，使用 Mock） ====================

// 總覽 KPI
export const useOverviewKpis = (params = {}) => {
  return useQuery({
    queryKey: ["overview-kpis", params],
    queryFn: async () => {
      if (!FLAGS.OVERVIEW_READY || ENABLE_MOCK) {
        return Promise.resolve(mockKpis);
      }
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(
        `${API_ENDPOINTS.OVERVIEW_KPIS}?${queryString}`
      );
      return response?.data || {};
    },
  });
};

// 總覽趨勢
export const useOverviewTrends = (params = {}) => {
  return useQuery({
    queryKey: ["overview-trends", params],
    queryFn: async () => {
      if (!FLAGS.OVERVIEW_READY || ENABLE_MOCK) {
        return Promise.resolve(mockTrends);
      }
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(
        `${API_ENDPOINTS.OVERVIEW_TRENDS}?${queryString}`
      );
      return response?.data || {};
    },
  });
};

// 總覽依從性
export const useOverviewAdherence = (params = {}) => {
  return useQuery({
    queryKey: ["overview-adherence", params],
    queryFn: async () => {
      if (!FLAGS.OVERVIEW_READY || ENABLE_MOCK) {
        return Promise.resolve(mockAdherence);
      }
      const queryString = new URLSearchParams(params).toString();
      const response = await apiClient.get(
        `${API_ENDPOINTS.OVERVIEW_ADHERENCE}?${queryString}`
      );
      return response?.data || {};
    },
  });
};

// 個案 KPI
export const usePatientKpis = (id, params = {}) => {
  return useQuery({
    queryKey: ["patient-kpis", id, params],
    queryFn: async () => {
      if (!FLAGS.PATIENT_KPIS_READY || ENABLE_MOCK) {
        // 從其他 API 計算 KPI
        const [catResponse, mmrcResponse, metricsResponse] = await Promise.all([
          apiClient.get(API_ENDPOINTS.PATIENT_CAT(id)),
          apiClient.get(API_ENDPOINTS.PATIENT_MMRC(id)),
          apiClient.get(API_ENDPOINTS.PATIENT_DAILY_METRICS(id)),
        ]);

        // 提取資料
        const catData = catResponse?.data || [];
        const mmrcData = mmrcResponse?.data || [];
        const metricsData = metricsResponse?.data || [];

        // 計算 KPI
        const latestCat = catData?.[0]?.score || 0;
        const latestMmrc = mmrcData?.[0]?.score || 0;

        // 計算 7 天依從性
        const last7Days = metricsData?.slice(0, 7) || [];
        const adherence7d =
          last7Days.length > 0
            ? last7Days.filter((d) => d.medication_taken).length /
              last7Days.length
            : 0;

        return {
          cat_latest: latestCat,
          mmrc_latest: latestMmrc,
          adherence_7d: adherence7d,
          report_rate_7d: last7Days.length / 7,
          completion_7d: 0.75, // Mock
          last_report_days: last7Days.length > 0 ? 0 : 999,
        };
      }

      const queryString = new URLSearchParams(params).toString();
      return apiClient.get(`${API_ENDPOINTS.PATIENT_KPIS(id)}?${queryString}`);
    },
    enabled: !!id,
  });
};

// ==================== 問卷相關 ====================

// 提交 CAT 問卷
export const useSubmitCat = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, data }) =>
      apiClient.post(API_ENDPOINTS.PATIENT_CAT(patientId), data),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: ["cat", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patient-kpis", patientId] });
    },
  });
};

// 提交 mMRC 問卷
export const useSubmitMmrc = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, data }) =>
      apiClient.post(API_ENDPOINTS.PATIENT_MMRC(patientId), data),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({ queryKey: ["mmrc", patientId] });
      queryClient.invalidateQueries({ queryKey: ["patient-kpis", patientId] });
    },
  });
};

// ==================== 每日健康記錄 ====================

// 新增每日健康記錄
export const useCreateDailyMetric = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, data }) =>
      apiClient.post(API_ENDPOINTS.PATIENT_DAILY_METRICS(patientId), data),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({
        queryKey: ["patient-metrics", patientId],
      });
      queryClient.invalidateQueries({ queryKey: ["patient-kpis", patientId] });
    },
  });
};

// 更新每日健康記錄
export const useUpdateDailyMetric = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ patientId, metricId, data }) =>
      apiClient.put(
        `${API_ENDPOINTS.PATIENT_DAILY_METRICS(patientId)}/${metricId}`,
        data
      ),
    onSuccess: (_, { patientId }) => {
      queryClient.invalidateQueries({
        queryKey: ["patient-metrics", patientId],
      });
      queryClient.invalidateQueries({ queryKey: ["patient-kpis", patientId] });
    },
  });
};

// ==================== 通報相關 ====================

// 即時通報（SSE 或輪詢）
export const useAlerts = (since) => {
  return useQuery({
    queryKey: ["alerts", since],
    queryFn: async () => {
      if (!FLAGS.AI_ALERTS_READY || ENABLE_MOCK) {
        // Mock 通報
        return Promise.resolve([
          {
            id: "a1",
            ts: new Date().toISOString(),
            level: "warning",
            message: "病患王小明近7日用藥遵從率下降 >20%",
          },
          {
            id: "a2",
            ts: new Date().toISOString(),
            level: "info",
            message: "病患李大華 CAT 分數改善顯著",
          },
        ]);
      }
      const response = await apiClient.get(
        `${API_ENDPOINTS.ALERTS_LIVE}?since=${since || ""}`
      );
      return response?.data || [];
    },
    refetchInterval: FLAGS.AI_ALERTS_READY ? 30000 : false, // 30 秒輪詢
  });
};
