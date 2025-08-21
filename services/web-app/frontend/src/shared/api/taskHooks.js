import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { API_ENDPOINTS, ENABLE_MOCK } from "../config";
import { mockTasks } from "../utils/mockTasks";

// 取得任務列表
export const useTasks = (params = {}) => {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: () => {
      if (ENABLE_MOCK) return Promise.resolve(mockTasks);
      const queryString = new URLSearchParams(params).toString();
      return apiClient.get(`${API_ENDPOINTS.TASKS}?${queryString}`);
    },
    staleTime: 5 * 60 * 1000,
  });
};

// 建立任務
export const useCreateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data) => {
      if (ENABLE_MOCK) {
        const newTask = {
          id: `task_${Date.now()}`,
          ...data,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        mockTasks.push(newTask);
        return Promise.resolve(newTask);
      }
      return apiClient.post(API_ENDPOINTS.TASKS, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

// 更新任務
export const useUpdateTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, patch }) => {
      if (ENABLE_MOCK) {
        const index = mockTasks.findIndex((t) => t.id === id);
        if (index !== -1) {
          mockTasks[index] = { ...mockTasks[index], ...patch };
          return Promise.resolve(mockTasks[index]);
        }
        return Promise.reject(new Error("Task not found"));
      }
      return apiClient.put(API_ENDPOINTS.TASK_DETAIL(id), patch);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};

// 刪除任務
export const useDeleteTask = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id) => {
      if (ENABLE_MOCK) {
        const index = mockTasks.findIndex((t) => t.id === id);
        if (index !== -1) {
          mockTasks.splice(index, 1);
          return Promise.resolve();
        }
        return Promise.reject(new Error("Task not found"));
      }
      return apiClient.delete(API_ENDPOINTS.TASK_DETAIL(id));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
};
