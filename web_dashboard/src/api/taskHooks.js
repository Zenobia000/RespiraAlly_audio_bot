import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as t from "./tasks";

export function useTasks(params) {
  return useQuery({
    queryKey: ["tasks", params],
    queryFn: () => t.getTasks(params),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: t.createTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, patch }) => t.updateTask(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: t.deleteTask,
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}
