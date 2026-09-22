import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useToast } from '../../context/ToastContext';
import { Badge } from '../../components/Badge';
import { Users, Mail, Hash, Crown, Calendar, Shield } from 'lucide-react';

export const GroupOverview = () => {
  const toast = useToast();
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGroups = async () => {
      setLoading(true);
      try {
        const data = await api.getAllGroups();
        setGroups(data || []);
      } catch (err) {
        toast.error('Failed to load cohort groups');
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="w-full px-4 sm:px-6 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
          Cohort Student Groups
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400">
          All self-formed student teams, assigned leaders, and active member rosters
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {groups.map((group) => {
          const createdAt = new Date(group.createdAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          });

          return (
            <div
              key={group.id}
              className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs hover:border-slate-300 dark:hover:border-slate-700 transition-all space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">{group.name}</h3>
                  <div className="text-xs text-slate-400 dark:text-slate-500 mt-0.5 flex items-center gap-2">
                    <span>Code: <strong className="text-slate-600 dark:text-slate-300 font-mono">{group.code}</strong></span>
                    <span>•</span>
                    <span>Created: {createdAt}</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200/60 dark:border-slate-700/60">
                  {group.members.length} / {group.maxMembers} Students
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">
                  Member Roster:
                </div>
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {group.members.map((m) => (
                    <div
                      key={m.id}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                            m.role === 'LEADER'
                              ? 'bg-amber-100 dark:bg-amber-950/80 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-800/60'
                              : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {m.role === 'LEADER' ? (
                            <Crown className="w-3.5 h-3.5" />
                          ) : (
                            m.user.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900 dark:text-white">{m.user.name}</div>
                          <div className="text-[11px] text-slate-400 dark:text-slate-500 font-mono">
                            {m.user.email} {m.user.studentId && `• ${m.user.studentId}`}
                          </div>
                        </div>
                      </div>
                      <Badge variant={m.role === 'LEADER' ? 'warning' : 'default'}>
                        {m.role === 'LEADER' ? '👑 Leader' : 'Member'}
                      </Badge>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
