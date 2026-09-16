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
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      <div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Cohort Student Groups
        </h1>
        <p className="text-sm text-slate-500">
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
              className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs hover:border-slate-300 transition-all space-y-4"
            >
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{group.name}</h3>
                  <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-2">
                    <span>Code: <strong className="text-slate-600 font-mono">{group.code}</strong></span>
                    <span>•</span>
                    <span>Created: {createdAt}</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-slate-100 text-slate-700">
                  {group.members.length} / {group.maxMembers} Students
                </span>
              </div>

              <div className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                  Member Roster:
                </div>
                <div className="divide-y divide-slate-100">
                  {group.members.map((m) => (
                    <div
                      key={m.id}
                      className="py-2.5 flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold ${
                            m.role === 'LEADER'
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-slate-100 text-slate-700'
                          }`}
                        >
                          {m.role === 'LEADER' ? (
                            <Crown className="w-3.5 h-3.5" />
                          ) : (
                            m.user.name.charAt(0)
                          )}
                        </div>
                        <div>
                          <div className="font-bold text-slate-900">{m.user.name}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {m.user.email} {m.user.studentId && `• ${m.user.studentId}`}
                          </div>
                        </div>
                      </div>
                      <Badge status={m.role} size="xs" />
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
