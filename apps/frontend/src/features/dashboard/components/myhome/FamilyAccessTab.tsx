import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserPlus,
  Trash2,
  Edit2,
  Shield,
  Lock,
  Mail,
  Phone,
  AlertCircle,
  X,
  CheckCircle2,
  Send,
  Crown,
  Check,
  Key,
} from 'lucide-react';
import { clientService, FamilyMember, ClientHomeDetails } from '../../../../services/client.service';
import { useAuthStore } from '../../../../store/authStore';
import { Card } from '../../../../components/ui/Card';

interface FamilyAccessTabProps {
  details?: ClientHomeDetails | null;
}

const AVAILABLE_PERMISSIONS = [
  { id: 'VIEW_MY_HOME', label: 'View My Home Dashboard' },
  { id: 'VIEW_FLOOR_PLANS', label: 'View Architectural Floor Plans' },
  { id: 'DOWNLOAD_FLOOR_PLANS', label: 'Download Floor Plans' },
  { id: 'VIEW_DOCUMENTS', label: 'View Legal & Sale Documents' },
  { id: 'DOWNLOAD_DOCUMENTS', label: 'Download Documents' },
  { id: 'VIEW_CONSTRUCTION_UPDATES', label: 'View Construction Progress' },
  { id: 'VIEW_PAYMENTS', label: 'View Financial Invoices & Receipts' },
  { id: 'CONTACT_SUPPORT', label: 'Contact Support & RM' },
];

export const FamilyAccessTab: React.FC<FamilyAccessTabProps> = ({ details }) => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<FamilyMember | null>(null);

  // Form state
  const [formName, setFormName] = useState('');
  const [formRelation, setFormRelation] = useState('Spouse');
  const [formEmail, setFormEmail] = useState('');
  const [formPhone, setFormPhone] = useState('');
  const [formRole, setFormRole] = useState('FAMILY_MEMBER');
  const [formNotes, setFormNotes] = useState('');
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>(
    AVAILABLE_PERMISSIONS.map((p) => p.id)
  );
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch family members via API
  const { data: familyMembers = [], isLoading } = useQuery({
    queryKey: ['familyMembers'],
    queryFn: () => clientService.getFamilyMembers(),
  });

  // Primary Buyer checks
  const primaryName = details?.primaryBuyer || user?.name || 'Primary Buyer';
  const primaryEmail = details?.primaryBuyerEmail || user?.email || 'buyer@goodearth.com';
  const isPrimaryBuyer = user?.role === 'admin' || user?.role === 'buyer';

  // Add Family Member Mutation
  const addMutation = useMutation({
    mutationFn: (newMember: FamilyMember) => clientService.addFamilyMember(newMember),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err?.message || 'Failed to add family member.');
    },
  });

  // Edit Family Member Mutation
  const updateMutation = useMutation({
    mutationFn: ({ id, member }: { id: string; member: FamilyMember }) =>
      clientService.updateFamilyMember(id, member),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
      closeModal();
    },
    onError: (err: any) => {
      setFormError(err?.message || 'Failed to update family member.');
    },
  });

  // Remove Family Member Mutation
  const removeMutation = useMutation({
    mutationFn: (id: string) => clientService.removeFamilyMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
    },
    onError: (err: any) => {
      alert(err?.message || 'Failed to remove family member.');
    },
  });

  // Send Invitation Mutation
  const inviteMutation = useMutation({
    mutationFn: (id: string) => clientService.sendInvitation(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['familyMembers'] });
      alert('Invitation successfully sent!');
    },
    onError: (err: any) => {
      alert(err?.message || 'Failed to send invitation.');
    },
  });

  const openAddModal = () => {
    if (familyMembers.length >= 5) {
      alert('Maximum limit of 5 family members reached for this property unit.');
      return;
    }
    setEditingMember(null);
    setFormName('');
    setFormRelation('Spouse');
    setFormEmail('');
    setFormPhone('');
    setFormRole('FAMILY_MEMBER');
    setFormNotes('');
    setSelectedPermissions(AVAILABLE_PERMISSIONS.map((p) => p.id));
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (member: FamilyMember) => {
    setEditingMember(member);
    setFormName(member.name);
    setFormRelation(member.relation);
    setFormEmail(member.email || '');
    setFormPhone(member.phone || '');
    setFormRole(member.role || 'FAMILY_MEMBER');
    setFormNotes(member.notes || '');
    setSelectedPermissions(member.permissions || AVAILABLE_PERMISSIONS.map((p) => p.id));
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setFormError(null);
  };

  const togglePermission = (id: string) => {
    setSelectedPermissions((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!formName.trim()) {
      setFormError('Member name is required.');
      return;
    }

    const payload: FamilyMember = {
      name: formName.trim(),
      relation: formRelation,
      email: formEmail.trim() || undefined,
      phone: formPhone.trim() || undefined,
      role: formRole,
      notes: formNotes.trim() || undefined,
      permissions: selectedPermissions,
    };

    if (editingMember?.id) {
      updateMutation.mutate({ id: editingMember.id, member: payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  const formatRoleLabel = (role?: string) => {
    switch (role) {
      case 'PRIMARY_BUYER':
        return 'Primary Owner';
      case 'CO_OWNER':
        return 'Co-Owner';
      case 'TENANT':
        return 'Tenant';
      case 'GUEST':
        return 'Guest Access';
      case 'CARETAKER':
        return 'Caretaker';
      default:
        return 'Family Member';
    }
  };

  return (
    <div className="space-y-6 text-left">
      {/* 1. Header & Add Button */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-brand-900 p-5 rounded-2xl border border-brand-200/80 dark:border-brand-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-amber-500" />
            <h2 className="font-serif text-xl font-bold text-brand-900 dark:text-white">
              Family & Access Management
            </h2>
          </div>
          <p className="text-xs text-brand-500 dark:text-brand-400">
            Manage co-owners, family member access, and granular module permissions for Unit {details?.villa || details?.unitNumber || 'Motif-16'}.
          </p>
        </div>

        {isPrimaryBuyer && (
          <button
            onClick={openAddModal}
            disabled={familyMembers.length >= 5}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-md shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            <span>Add Family Member ({familyMembers.length}/5)</span>
          </button>
        )}
      </div>

      {/* 2. Top Primary Buyer Card */}
      <Card className="border-amber-500/30 bg-gradient-to-r from-amber-500/10 via-white to-amber-500/5 dark:from-amber-500/10 dark:via-brand-900 dark:to-brand-950 p-6 rounded-3xl relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-amber-500 text-white flex items-center justify-center text-xl font-serif font-bold shadow-md relative">
              {primaryName.charAt(0)}
              <span className="absolute -top-1 -right-1 h-5 w-5 bg-amber-400 text-brand-950 rounded-full flex items-center justify-center shadow-sm">
                <Crown className="h-3 w-3 fill-brand-950" />
              </span>
            </div>

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-700 dark:text-amber-300 uppercase tracking-wider flex items-center gap-1">
                  <Crown className="h-3 w-3" />
                  Primary Property Owner
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                  Full Control
                </span>
              </div>
              <h3 className="font-serif text-lg font-bold text-brand-900 dark:text-white">
                {primaryName}
              </h3>
              <div className="flex items-center gap-4 text-xs text-brand-500 dark:text-brand-400">
                <span className="flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5 text-brand-400" />
                  {primaryEmail}
                </span>
                <span className="flex items-center gap-1">
                  <Key className="h-3.5 w-3.5 text-brand-400" />
                  Root Administrator Account
                </span>
              </div>
            </div>
          </div>

          <div className="text-right text-xs text-brand-500 dark:text-brand-400 bg-white/60 dark:bg-brand-850/60 p-3 rounded-2xl border border-brand-200/50 dark:border-brand-800">
            <p className="font-semibold text-brand-900 dark:text-white">Access Permissions</p>
            <p className="text-[11px] text-amber-600 dark:text-amber-400">Unrestricted Owner Privileges</p>
          </div>
        </div>
      </Card>

      {/* 3. Family Members Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="font-serif text-sm font-bold text-brand-900 dark:text-white flex items-center gap-2">
            <Users className="h-4 w-4 text-amber-500" />
            Secondary Family Accounts & Co-Owners ({familyMembers.length})
          </h3>
          {!isPrimaryBuyer && (
            <span className="text-xs text-brand-400 flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" />
              Read-Only Access
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="h-40 rounded-3xl bg-brand-100/50 dark:bg-brand-900 animate-pulse border border-brand-200/50 dark:border-brand-850" />
        ) : familyMembers.length === 0 ? (
          /* Empty State */
          <Card>
            <div className="p-10 text-center space-y-4 bg-brand-50/30 dark:bg-brand-950/20 rounded-3xl border border-brand-200/60 dark:border-brand-850">
              <div className="h-16 w-16 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-600 dark:text-amber-400 mx-auto">
                <Users className="h-8 w-8" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif text-lg font-bold text-brand-900 dark:text-white">
                  No family members have been added yet.
                </h4>
                <p className="text-xs text-brand-500 dark:text-brand-400 max-w-md mx-auto">
                  Grant property access to co-owners, family members, or caretakers by clicking 'Add Family Member' above.
                </p>
              </div>
            </div>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {familyMembers.map((member) => (
              <Card
                key={member.id}
                className="p-5 rounded-3xl border border-brand-200/80 dark:border-brand-800 bg-white dark:bg-brand-900 space-y-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-brand-100 dark:bg-brand-800 text-brand-700 dark:text-brand-200 flex items-center justify-center text-base font-bold font-serif">
                      {member.name.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-serif text-base font-bold text-brand-900 dark:text-white">
                          {member.name}
                        </h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-brand-100 dark:bg-brand-800 text-brand-600 dark:text-brand-300">
                          {member.relation}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-brand-400 pt-0.5">
                        <span className="font-medium text-amber-600 dark:text-amber-400">
                          {formatRoleLabel(member.role)}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1 text-emerald-500">
                          <CheckCircle2 className="h-3 w-3" />
                          {member.status || 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions for Primary Buyer */}
                  {isPrimaryBuyer && member.id && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => inviteMutation.mutate(member.id!)}
                        title="Resend Access Invitation Email"
                        className="p-2 rounded-xl text-brand-500 hover:text-amber-500 hover:bg-amber-500/10 transition-colors"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openEditModal(member)}
                        title="Edit Permissions & Details"
                        className="p-2 rounded-xl text-brand-500 hover:text-brand-900 dark:hover:text-white hover:bg-brand-100 dark:hover:bg-brand-800 transition-colors"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Are you sure you want to revoke access for ${member.name}?`)) {
                            removeMutation.mutate(member.id!);
                          }
                        }}
                        title="Remove Access"
                        className="p-2 rounded-xl text-brand-400 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </div>

                {/* Member Contact details */}
                <div className="grid grid-cols-2 gap-2 text-xs text-brand-500 dark:text-brand-400 pt-1 border-t border-brand-100 dark:border-brand-850">
                  <div className="flex items-center gap-1.5 truncate">
                    <Mail className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                    <span className="truncate">{member.email || 'No email provided'}</span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate">
                    <Phone className="h-3.5 w-3.5 text-brand-400 shrink-0" />
                    <span className="truncate">{member.phone || 'No phone provided'}</span>
                  </div>
                </div>

                {/* Permissions Summary Badges */}
                <div className="space-y-1.5 pt-2">
                  <p className="text-[11px] font-semibold text-brand-400">Granted Portal Permissions:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {member.permissions && member.permissions.length > 0 ? (
                      member.permissions.map((perm) => {
                        const info = AVAILABLE_PERMISSIONS.find((p) => p.id === perm);
                        return (
                          <span
                            key={perm}
                            className="px-2 py-0.5 rounded-md text-[10px] font-semibold bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20"
                          >
                            {info ? info.label : perm}
                          </span>
                        );
                      })
                    ) : (
                      <span className="text-[10px] text-brand-400">Full Standard Access</span>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* 4. Add/Edit Member Dialog Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-brand-900 w-full max-w-xl rounded-3xl shadow-2xl border border-brand-200 dark:border-brand-800 overflow-hidden text-left">
            {/* Modal Header */}
            <div className="flex items-center justify-between p-5 border-b border-brand-100 dark:border-brand-800 bg-brand-50/50 dark:bg-brand-950/50">
              <div className="flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-amber-500" />
                <h3 className="font-serif text-lg font-bold text-brand-900 dark:text-white">
                  {editingMember ? 'Edit Family Member Access' : 'Add Family Member & Grant Permissions'}
                </h3>
              </div>
              <button
                onClick={closeModal}
                className="p-1 rounded-xl text-brand-400 hover:text-brand-900 dark:hover:text-white transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-600 dark:text-red-400 text-xs flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-700 dark:text-brand-300">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="e.g. Ananya Sharma"
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-200 dark:border-brand-800 bg-white dark:bg-brand-850 text-xs text-brand-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Relationship */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-700 dark:text-brand-300">
                    Relationship *
                  </label>
                  <select
                    value={formRelation}
                    onChange={(e) => setFormRelation(e.target.value)}
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-200 dark:border-brand-800 bg-white dark:bg-brand-850 text-xs text-brand-900 dark:text-white focus:outline-none focus:border-amber-500"
                  >
                    <option value="Spouse">Spouse</option>
                    <option value="Son/Daughter">Son / Daughter</option>
                    <option value="Father/Mother">Father / Mother</option>
                    <option value="Sibling">Sibling</option>
                    <option value="Co-Owner">Co-Owner</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Email Address */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-700 dark:text-brand-300">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="ananya@example.com"
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-200 dark:border-brand-800 bg-white dark:bg-brand-850 text-xs text-brand-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>

                {/* Phone Number */}
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-700 dark:text-brand-300">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={formPhone}
                    onChange={(e) => setFormPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2 rounded-xl border border-brand-200 dark:border-brand-800 bg-white dark:bg-brand-850 text-xs text-brand-900 dark:text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Role Selector */}
              <div className="space-y-1">
                <label className="text-xs font-bold text-brand-700 dark:text-brand-300">
                  Access Role
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-brand-200 dark:border-brand-800 bg-white dark:bg-brand-850 text-xs text-brand-900 dark:text-white focus:outline-none focus:border-amber-500"
                >
                  <option value="FAMILY_MEMBER">Family Member (Standard)</option>
                  <option value="CO_OWNER">Co-Owner (Joint Holder)</option>
                  <option value="TENANT">Tenant Access</option>
                  <option value="GUEST">Guest Access</option>
                  <option value="CARETAKER">Site Caretaker</option>
                </select>
              </div>

              {/* Permissions Checklist */}
              <div className="space-y-2 pt-2">
                <label className="text-xs font-bold text-brand-700 dark:text-brand-300">
                  Configurable Module Permissions
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-2 bg-brand-50/50 dark:bg-brand-850/50 rounded-2xl border border-brand-100 dark:border-brand-800">
                  {AVAILABLE_PERMISSIONS.map((perm) => {
                    const isChecked = selectedPermissions.includes(perm.id);
                    return (
                      <label
                        key={perm.id}
                        onClick={() => togglePermission(perm.id)}
                        className={`flex items-center gap-2 p-2 rounded-xl border text-xs cursor-pointer select-none transition-colors ${
                          isChecked
                            ? 'bg-amber-500/10 border-amber-500/40 text-brand-900 dark:text-white font-semibold'
                            : 'border-brand-200 dark:border-brand-800 text-brand-500 dark:text-brand-400 hover:bg-white dark:hover:bg-brand-800'
                        }`}
                      >
                        <div
                          className={`h-4 w-4 rounded-md flex items-center justify-center border transition-colors ${
                            isChecked
                              ? 'bg-amber-500 border-amber-500 text-white'
                              : 'border-brand-300 dark:border-brand-700 bg-white dark:bg-brand-800'
                          }`}
                        >
                          {isChecked && <Check className="h-3 w-3 stroke-[3]" />}
                        </div>
                        <span>{perm.label}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-100 dark:border-brand-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl border border-brand-200 dark:border-brand-800 text-xs font-bold text-brand-600 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold transition-all shadow-md"
                >
                  {addMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingMember
                    ? 'Save Changes'
                    : 'Add & Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
