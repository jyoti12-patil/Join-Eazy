import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { Modal } from '../../components/Modal';
import { Badge } from '../../components/Badge';
import {
  Users,
  UserPlus,
  Crown,
  Trash2,
  PlusCircle,
  Hash,
  Mail,
  Shield,
  Search,
  CheckCircle,
  AlertCircle,
  Share2,
} from 'lucide-react';

export const GroupManager = () => {
  const { user } = useAuth();
  const toast = useToast();

  const [groupData, setGroupData] = useState(null);
  const [allGroups, setAllGroups] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modals state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [addMemberModalOpen, setAddMemberModalOpen] = useState(false);

  // Form states
  const [newGroupName, setNewGroupName] = useState('');
  const [newGroupMax, setNewGroupMax] = useState(5);
  const [memberIdentifier, setMemberIdentifier] = useState('');
  const [availableStudents, setAvailableStudents] = useState([]);
  const [submitting, setSubmitting] = useState(false);

  const fetchGroupData = async () => {
    setLoading(true);
    try {
      const [myGroupRes, allGroupsRes, studentsRes] = await Promise.all([
        api.getMyGroup(user.id),
        api.getAllGroups(),
        api.searchStudents(''),
      ]);

      setGroupData(myGroupRes);
      setAllGroups(allGroupsRes || []);
      setAvailableStudents(studentsRes || []);
    } catch (err) {
      toast.error('Failed to load group details');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchGroupData();
    }
  }, [user]);

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    if (!newGroupName.trim()) {
      toast.error('Please provide a group name');
      return;
    }

    setSubmitting(true);
    try {
      const created = await api.createGroup(user.id, {
        name: newGroupName.trim(),
        maxMembers: Number(newGroupMax),
      });

      toast.success(`Group "${created.name}" created successfully!`);
      setCreateModalOpen(false);
      setNewGroupName('');
      fetchGroupData();
    } catch (err) {
      toast.error(err.message || 'Failed to create group');
    } finally {
      setSubmitting(false);
    }
  };

  const handleAddMember = async (specificIdentifier) => {
    const ident = specificIdentifier || memberIdentifier;
    if (!ident.trim()) {
      toast.error('Please enter a student email or student ID');
      return;
    }

    setSubmitting(true);
    try {
      await api.addMember(groupData.group.id, ident.trim(), user.id);
      toast.success('Member successfully added to group!');
      setMemberIdentifier('');
      setAddMemberModalOpen(false);
      fetchGroupData();
    } catch (err) {
      toast.error(err.message || 'Failed to add member');
    } finally {
      setSubmitting(false);
    }
  };

  const handleRemoveMember = async (targetUserId, memberName) => {
    if (!window.confirm(`Are you sure you want to remove ${memberName} from the group?`)) {
      return;
    }

    try {
      await api.removeMember(groupData.group.id, targetUserId, user.id);
      toast.success(`${memberName} has been removed.`);
      fetchGroupData();
    } catch (err) {
      toast.error(err.message || 'Failed to remove member');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  const group = groupData?.group;
  const isLeader = groupData?.role === 'LEADER';

  return (
    <div className="w-full px-4 sm:px-6 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
            Group Management
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Form groups, collaborate with peers, and track assignment readiness
          </p>
        </div>

        {!group && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md hover:shadow-glow transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Group</span>
          </button>
        )}
      </div>

      {/* Main Group View */}
      {group ? (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Group Info & Member List */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 shadow-xs p-6 sm:p-8 transition-colors">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-xl font-black text-slate-900 dark:text-white">
                      {group.name}
                    </h2>
                    <Badge status="ACTIVE" text="Active Group" size="xs" />
                  </div>
                  <div className="flex items-center gap-4 mt-2 text-xs text-slate-500 dark:text-slate-400">
                    <span className="flex items-center gap-1">
                      <Hash className="w-3.5 h-3.5 text-slate-400 dark:text-slate-500" />
                      Code: <strong className="text-slate-700 dark:text-slate-200">{group.code}</strong>
                    </span>
                    <span>•</span>
                    <span>
                      Capacity: <strong className="text-slate-700 dark:text-slate-200">{group.members.length} / {group.maxMembers}</strong>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    disabled={group.members.length >= group.maxMembers}
                    onClick={() => setAddMemberModalOpen(true)}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-50 dark:bg-brand-950/60 hover:bg-brand-100 dark:hover:bg-brand-900/60 text-brand-700 dark:text-brand-300 border border-brand-200/60 dark:border-brand-800/60 text-xs font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    <UserPlus className="w-4 h-4" />
                    <span>Invite / Add Member</span>
                  </button>
                </div>
              </div>

              {/* Members List */}
              <div className="mt-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                    Group Members ({group.members.length})
                  </h3>
                  {group.members.length >= group.maxMembers && (
                    <span className="text-[11px] font-semibold text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded border border-amber-200/50 dark:border-amber-800/50">
                      Group Full (Limit Reached)
                    </span>
                  )}
                </div>

                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {group.members.map((m) => {
                    const isCurrentMemberSelf = m.userId === user.id;
                    const isMemberLeader = m.role === 'LEADER';

                    return (
                      <div
                        key={m.id}
                        className="py-3.5 flex items-center justify-between group hover:bg-slate-50/80 dark:hover:bg-slate-800/50 px-3 rounded-xl transition-colors"
                      >
                        <div className="flex items-center gap-3.5">
                          <div
                            className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold shadow-xs ${
                              isMemberLeader
                                ? 'bg-gradient-to-tr from-amber-500 to-amber-600 text-white'
                                : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                            }`}
                          >
                            {isMemberLeader ? <Crown className="w-5 h-5" /> : m.user.name.charAt(0)}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-bold text-slate-900 dark:text-white">
                                {m.user.name}
                              </span>
                              {isCurrentMemberSelf && (
                                <span className="text-[10px] font-bold bg-brand-100 dark:bg-brand-950/80 text-brand-700 dark:text-brand-300 px-1.5 py-0.2 rounded border border-brand-200/50 dark:border-brand-800/50">
                                  You
                                </span>
                              )}
                              <Badge status={m.role} size="xs" />
                            </div>
                            <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                              <span className="flex items-center gap-1">
                                <Mail className="w-3 h-3 text-slate-400 dark:text-slate-500" />
                                {m.user.email}
                              </span>
                              {m.user.studentId && (
                                <>
                                  <span>•</span>
                                  <span className="font-mono">{m.user.studentId}</span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Member Actions */}
                        <div>
                          {(isLeader && !isCurrentMemberSelf) || isCurrentMemberSelf ? (
                            <button
                              onClick={() => handleRemoveMember(m.userId, m.user.name)}
                              className="p-2 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 rounded-xl transition-colors text-xs font-semibold flex items-center gap-1 cursor-pointer"
                              title={isCurrentMemberSelf ? 'Leave group' : 'Remove member'}
                            >
                              <Trash2 className="w-4 h-4" />
                              <span className="hidden sm:inline">
                                {isCurrentMemberSelf ? 'Leave' : 'Remove'}
                              </span>
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Right Col: Group Status & Invite Guide */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-3xl p-6 shadow-xl relative overflow-hidden">
              <div className="relative z-10 space-y-4">
                <div className="flex items-center gap-2 text-brand-300 text-xs font-bold uppercase tracking-wider">
                  <Shield className="w-4 h-4" />
                  <span>Group Policies</span>
                </div>
                <h3 className="text-lg font-bold">Collaborative Rules</h3>
                <ul className="text-xs text-slate-300 space-y-2.5">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Any member can trigger or confirm an assignment submission.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Students can only be in 1 active group at a time.</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                    <span>Group capacity limit is strictly enforced (max {group.maxMembers}).</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-3 transition-colors">
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Invite Instructions
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                Add your classmates by entering their university email (e.g.{' '}
                <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-brand-600 dark:text-brand-400">
                  maria@joineazy.edu
                </code>
                ) or their unique Student ID (e.g.{' '}
                <code className="bg-slate-100 dark:bg-slate-800 px-1 py-0.5 rounded text-brand-600 dark:text-brand-400">
                  STU-1002
                </code>
                ).
              </p>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State: Student has not joined or created a group yet */
        <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-10 text-center shadow-xs max-w-2xl mx-auto space-y-6 transition-colors">
          <div className="w-16 h-16 bg-brand-50 dark:bg-brand-950/70 text-brand-600 dark:text-brand-400 rounded-3xl flex items-center justify-center mx-auto shadow-inner">
            <Users className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900 dark:text-white">
              You Don't Have a Group Yet
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
              At JoinEazy, assignments are completed and tracked in student groups. Form a group now or ask a leader to invite you via your email (<span className="font-mono text-brand-600 dark:text-brand-400">{user?.email}</span>).
            </p>
          </div>

          <div className="pt-2 flex justify-center">
            <button
              onClick={() => setCreateModalOpen(true)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-sm shadow-md hover:shadow-glow transition-all cursor-pointer"
            >
              <PlusCircle className="w-5 h-5" />
              <span>Create a New Group</span>
            </button>
          </div>

          {/* List existing groups for reference */}
          {allGroups.length > 0 && (
            <div className="pt-6 border-t border-slate-100 dark:border-slate-800 text-left">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-3">
                Existing Student Groups in Your Cohort ({allGroups.length})
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {allGroups.map((g) => (
                  <div
                    key={g.id}
                    className="p-3.5 rounded-2xl border border-slate-200/70 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-950/40 flex items-center justify-between"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-900 dark:text-white">{g.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400">
                        {g.members.length} / {g.maxMembers} members
                      </div>
                    </div>
                    <span className="text-[10px] font-semibold bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 px-2 py-0.5 rounded text-slate-600 dark:text-slate-400">
                      Leader: {g.members.find((m) => m.role === 'LEADER')?.user.name || 'Student'}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* CREATE GROUP MODAL */}
      <Modal
        isOpen={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        title="Create a New Group"
        subtitle="You will automatically become the group leader"
      >
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Group Name
            </label>
            <input
              type="text"
              required
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              placeholder="e.g. Quantum Coders, Apex Architects..."
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Max Members (2 - 10)
            </label>
            <input
              type="number"
              min={2}
              max={10}
              value={newGroupMax}
              onChange={(e) => setNewGroupMax(e.target.value)}
              className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            />
            <p className="text-[11px] text-slate-400 dark:text-slate-500 mt-1">
              Standard assignment group size is 5 students.
            </p>
          </div>

          <div className="pt-4 flex justify-end gap-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setCreateModalOpen(false)}
              className="px-4 py-2 text-sm font-semibold text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-sm font-bold rounded-xl shadow-md transition-all cursor-pointer"
            >
              {submitting ? 'Creating...' : 'Create Group'}
            </button>
          </div>
        </form>
      </Modal>

      {/* ADD MEMBER MODAL */}
      <Modal
        isOpen={addMemberModalOpen}
        onClose={() => setAddMemberModalOpen(false)}
        title="Add Group Member"
        subtitle={`Adding to ${group?.name} (${group?.members.length} / ${group?.maxMembers})`}
      >
        <div className="space-y-5">
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 dark:text-slate-300 mb-1.5">
              Enter Student Email or Student ID
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={memberIdentifier}
                onChange={(e) => setMemberIdentifier(e.target.value)}
                placeholder="e.g. emily@joineazy.edu or STU-1006"
                className="flex-1 px-3.5 py-2.5 text-sm rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 placeholder:text-slate-400 dark:placeholder:text-slate-500"
              />
              <button
                type="button"
                disabled={submitting || !memberIdentifier.trim()}
                onClick={() => handleAddMember()}
                className="px-4 py-2.5 bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl shadow-xs transition-all cursor-pointer"
              >
                {submitting ? 'Adding...' : 'Add'}
              </button>
            </div>
          </div>

          {/* Suggestions List of Unassigned Students */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500 mb-2">
              Quick Select Available Students
            </div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
              {availableStudents
                .filter(
                  (stu) =>
                    !group?.members.some((m) => m.userId === stu.id) &&
                    stu.id !== user.id
                )
                .map((stu) => (
                  <div
                    key={stu.id}
                    className="p-2.5 rounded-xl border border-slate-100 dark:border-slate-800 hover:border-brand-200 dark:hover:border-brand-800 bg-slate-50/60 dark:bg-slate-950/40 hover:bg-brand-50/50 dark:hover:bg-brand-950/40 flex items-center justify-between transition-colors"
                  >
                    <div>
                      <div className="text-xs font-bold text-slate-800 dark:text-slate-200">{stu.name}</div>
                      <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                        {stu.email} {stu.studentId && `• ${stu.studentId}`}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAddMember(stu.email)}
                      className="px-2.5 py-1 bg-white dark:bg-slate-800 hover:bg-brand-600 dark:hover:bg-brand-600 text-slate-700 dark:text-slate-200 hover:text-white dark:hover:text-white border border-slate-200 dark:border-slate-700 hover:border-transparent text-xs font-bold rounded-lg transition-all shadow-2xs cursor-pointer"
                    >
                      Invite
                    </button>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
