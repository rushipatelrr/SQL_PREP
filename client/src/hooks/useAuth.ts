import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { fetchMe, logout } from '@/api/auth';
import { queryKeys } from '@/api/queryKeys';

/** null means "not signed in" — a normal, expected state, not an error. */
export function useMe() {
  return useQuery({
    queryKey: queryKeys.me,
    queryFn: fetchMe,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: logout,
    onSuccess: () => {
      // Logout only ever ends the session — clearing the cache here is a client-side
      // concern (don't show stale data for whoever signs in next on this device); it has
      // no bearing on the server, which never deletes progress on logout.
      queryClient.clear();
    },
  });
}
