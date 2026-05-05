import { useQuery } from '@tanstack/react-query';
import { api } from '../services/api';
import { useAppSelector } from '../store';
import type { UserMe } from '../types';

export function useMe() {
  const tokens = useAppSelector((s) => s.auth.tokens);

  return useQuery({
    queryKey: ['users', 'me'],
    queryFn: async (): Promise<UserMe> => {
      const res = await api.get<UserMe>('/users/me/');
      return res.data;
    },
    enabled: !!tokens,
  });
}
