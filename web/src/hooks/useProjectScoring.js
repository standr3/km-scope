import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getScoringConfigApi,
  upsertScoringConfigApi,
  getPerformanceSessionsApi,
  createPerformanceSessionApi,
  getSessionScoresApi,
  recalculateSessionApi
} from '../api/project';



// ─── Config scoring ───────────────────────────────────────────────────────────
export function useScoringConfig(projectId) {
  return useQuery({
    queryKey: ['scoring-config', projectId],
    queryFn: () => getScoringConfigApi(projectId),
    enabled: !!projectId,
  });
}

export function useUpsertScoringConfig(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => upsertScoringConfigApi(projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['scoring-config', projectId] });
    },
  });
}

// ─── Sesiuni ──────────────────────────────────────────────────────────────────
export function usePerformanceSessions(projectId) {
  return useQuery({
    queryKey: ['performance-sessions', projectId],
    queryFn: () => getPerformanceSessionsApi(projectId),
    enabled: !!projectId,
  });
}

export function useCreatePerformanceSession(projectId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload) => createPerformanceSessionApi(projectId, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['performance-sessions', projectId] });
    },
  });
}

// ─── Scoruri dintr-o sesiune ──────────────────────────────────────────────────
export function useSessionScores(projectId, sessionId) {
  return useQuery({
    queryKey: ['session-scores', projectId, sessionId],
    queryFn: () => getSessionScoresApi(projectId, sessionId),
    enabled: !!projectId && !!sessionId,
  });
}
export function useRecalculateSession(projectId, sessionId) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => recalculateSessionApi(projectId, sessionId),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['session-scores', projectId, sessionId] });
    },
  });
}