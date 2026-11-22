import { baseApi } from '../shared/api/base-api';
export function useApiHealth() {
  const health = baseApi.useHealthQuery();
  if (health.isLoading) return 'Checking service…';
  return health.currentData ? 'API is online' : 'API is unavailable';
}
