import { baseApi } from '../../shared/api/base-api';
import type { Account, MemberInput, InvitationResult } from './types';
const root = '/api/v1/team';
export const teamApi = baseApi.injectEndpoints({
  endpoints: (build) => ({
    team: build.query<{ items: Account[]; total: number }, number>({
      query: (offset) => ({ path: `${root}?offset=${offset}`, timeoutMs: 20000 }),
      providesTags: ['Team'],
    }),
    invite: build.mutation<InvitationResult, MemberInput & { email: string }>({
      query: (body) => ({ path: root, method: 'POST', body, timeoutMs: 20000 }),
      invalidatesTags: (_data, error) => (error ? [] : ['Team']),
    }),
    changeMember: build.mutation<
      Account,
      { id: string; body: MemberInput & { expectedVersion: number } }
    >({
      query: ({ id, body }) => ({ path: `${root}/${id}`, method: 'PATCH', body, timeoutMs: 20000 }),
      invalidatesTags: (_data, error) => (error ? [] : ['Team', 'Session']),
    }),
    removeMember: build.mutation<unknown, Account>({
      query: (account) => ({
        path: `${root}/${account.id}`,
        method: 'DELETE',
        body: { expectedVersion: account.team_version },
        timeoutMs: 20000,
      }),
      invalidatesTags: (_data, error) => (error ? [] : ['Team']),
    }),
    reinvite: build.mutation<InvitationResult, Account>({
      query: (account) => ({
        path: `${root}/${account.id}/reinvite`,
        method: 'POST',
        body: { expectedVersion: account.team_version },
        timeoutMs: 20000,
      }),
      invalidatesTags: (_data, error) => (error ? [] : ['Team']),
    }),
  }),
});
export const {
  useTeamQuery,
  useInviteMutation,
  useChangeMemberMutation,
  useRemoveMemberMutation,
  useReinviteMutation,
} = teamApi;
