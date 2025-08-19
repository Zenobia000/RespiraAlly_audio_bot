import { useQuery } from "@tanstack/react-query";
import { api } from "./client";

export function usePatients(params) {
  return useQuery({
    queryKey: ["patients", params],
    queryFn: () => api(`/v1/therapist/patients?${new URLSearchParams(params)}`),
  });
}

export function usePatientProfile(id) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["patient-profile", id],
    queryFn: () => api(`/v1/patients/${id}/profile`),
  });
}

export function usePatientMetrics(id, params) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["patient-metrics", id, params],
    queryFn: () =>
      api(`/v1/patients/${id}/daily_metrics?${new URLSearchParams(params)}`),
  });
}

export function useCatHistory(id, params) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["cat-history", id, params],
    queryFn: () =>
      api(
        `/v1/patients/${id}/questionnaires/cat?${new URLSearchParams(params)}`
      ),
  });
}

export function useMmrcHistory(id, params) {
  return useQuery({
    enabled: Boolean(id),
    queryKey: ["mmrc-history", id, params],
    queryFn: () =>
      api(
        `/v1/patients/${id}/questionnaires/mmrc?${new URLSearchParams(params)}`
      ),
  });
}

// 待後端就緒前，預設禁用
export function useOverviewKpis(params) {
  return useQuery({
    enabled: false,
    queryKey: ["ov-kpis", params],
    queryFn: () => api(`/overview/kpis?${new URLSearchParams(params)}`),
  });
}

export function useOverviewTrends(params) {
  return useQuery({
    enabled: false,
    queryKey: ["ov-trends", params],
    queryFn: () => api(`/overview/trends?${new URLSearchParams(params)}`),
  });
}

export function useOverviewAdherence(params) {
  return useQuery({
    enabled: false,
    queryKey: ["ov-adh", params],
    queryFn: () => api(`/overview/adherence?${new URLSearchParams(params)}`),
  });
}

export function usePatientKpis(id, params) {
  return useQuery({
    enabled: false,
    queryKey: ["p-kpis", id, params],
    queryFn: () => api(`/patient/${id}/kpis?${new URLSearchParams(params)}`),
  });
}


