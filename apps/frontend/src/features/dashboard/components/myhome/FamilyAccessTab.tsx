import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Users,
  UserCheck,
  UserPlus,
  Trash2,
  Edit2,
  Shield,
  Lock,
  Mail,
  Phone,
  Heart,
  AlertCircle,
  X,
  CheckCircle2,
  Clock,
} from 'lucide-react';
import { clientService, FamilyMember, ClientHomeDetails } from '../../../../services/client.service';
import { useAuthStore } from '../../../../store/authStore';

interface FamilyAccessTabProps {
  details?: ClientHomeDetails | null;
}

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
  const [formError, setFormError] = useState<string | null>(null);

  // Fetch family members via API
  const { data: familyMembers = [], isLoading } = useQuery({
    queryKey: ['familyMembers'],
    queryFn: () => clientService.getFamilyMembers(),
  });

  // Verify whether logged-in user is Primary Buyer
  const primaryEmail = details?.primaryBuyerEmail?.toLowerCase();
  const userEmail = user?.email?.toLowerCase();
  const isPrimaryBuyer = user?.role === 'admin' || user?.role === 'buyer' || (!!primaryEmail && primaryEmail === userEmail);

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

  const openAddModal = () => {
    if (familyMembers.length >= 5) {
      alert('Maximum limit of 5 family members reached for this property.');
      return;
    }
    setEditingMember(null);
    setFormName('');
    setFormRelation('Spouse');
    setFormEmail('');
    setFormPhone('');
    setFormError(null);
    setIsModalOpen(true);
  };

  const openEditModal = (member: FamilyMember) => {
    setEditingMember(member);
    setFormName(member.name);
    setFormRelation(member.relation || 'Spouse');
    setFormEmail(member.email || '');
    setFormPhone(member.phone || '');
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingMember(null);
    setFormError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) {
      setFormError('Name is required.');
      return;
    }
    if (!formRelation.trim()) {
      setFormError('Relationship is required.');
      return;
    }

    const payload: FamilyMember = {
      name: formName.trim(),
      relation: formRelation.trim(),
      email: formEmail.trim() || undefined,
      phone: formPhone.trim() || undefined,
    };

    if (editingMember && editingMember.id) {
      updateMutation.mutate({ id: editingMember.id, member: payload });
    } else {
      addMutation.mutate(payload);
    }
  };

  const handleRemove = (id?: string) => {
    if (!id) return;
    if (window.confirm('Are you sure you want to remove this family member access?')) {
      removeMutation.mutate(id);
    }
  };

  const primaryName = details?.primaryBuyer || user?.name || 'Primary Homeowner';
  const primaryMail = details?.primaryBuyerEmail || user?.email || 'primary.buyer@goodearth.org.in';
  const coOwnerName = details?.coOwner && details.coOwner !== 'None Specified' ? details.coOwner : null;

  return (
    <div className="space-y-6 text-left">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white dark:bg-brand-900 p-5 rounded-2xl border border-brand-200/80 dark:border-brand-800 shadow-sm">
        <div>
          <h2 className="font-serif text-xl font-bold text-brand-900 dark:text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-amber-500" />
            Family Access & Permissions
          </h2>
          <p className="text-xs text-brand-500 dark:text-brand-400 mt-0.5">
            Manage authorized household members associated with this GoodEarth residence.
          </p>
        </div>

        {/* Add Family Member Button (Primary Buyer Only) */}
        {isPrimaryBuyer && (
          <button
            type="button"
            onClick={openAddModal}
            disabled={familyMembers.length >= 5}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-all disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
          >
            <UserPlus className="h-4 w-4" />
            Add Family Member ({familyMembers.length}/5)
          </button>
        )}
      </div>

      {/* Permission Info Note if Non-Primary */}
      {!isPrimaryBuyer && (
        <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-3 text-amber-700 dark:text-amber-300 text-xs">
          <Lock className="h-4 w-4 shrink-0 text-amber-500" />
          <span>
            <strong>Read-Only Access:</strong> Secondary family members cannot add, edit, or remove household access permissions. Contact the Primary Homeowner for access updates.
          </span>
        </div>
      )}

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* 1. Primary Buyer Card */}
        <div className="relative rounded-2xl border-2 border-amber-500/50 bg-gradient-to-b from-brand-900 to-brand-950 p-6 text-white shadow-lg space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500 text-brand-950 uppercase tracking-wider">
                <Shield className="h-3 w-3" />
                Primary Buyer
              </span>
              <span className="text-[10px] font-semibold text-amber-300/80 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3 text-emerald-400" />
                Active Account
              </span>
            </div>

            <div>
              <h3 className="font-serif text-lg font-bold text-white">{primaryName}</h3>
              <p className="text-xs text-brand-200 flex items-center gap-1.5 mt-1">
                <Mail className="h-3.5 w-3.5 text-amber-400" />
                {primaryMail}
              </p>
            </div>
          </div>

          <div className="pt-3 border-t border-brand-800 text-[11px] text-amber-300/90 font-medium flex items-center justify-between">
            <span>Primary Ownership Holder</span>
            <span className="text-amber-400 font-bold">Cannot be deleted</span>
          </div>
        </div>

        {/* 2. Co-Owner Card (If present) */}
        {coOwnerName && (
          <div className="relative rounded-2xl border border-brand-200/80 bg-white dark:bg-brand-900 dark:border-brand-800 p-6 shadow-sm space-y-4 flex flex-col justify-between">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-brand-100/80 text-brand-700 dark:bg-brand-800 dark:text-brand-300 uppercase tracking-wider">
                  <UserCheck className="h-3 w-3 text-amber-500" />
                  Co-Owner
                </span>
                <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Verified Holder
                </span>
              </div>

              <div>
                <h3 className="font-serif text-lg font-bold text-brand-900 dark:text-white">{coOwnerName}</h3>
                <p className="text-xs text-brand-500 dark:text-brand-400 flex items-center gap-1.5 mt-1">
                  <Mail className="h-3.5 w-3.5 text-brand-400" />
                  Registered Co-applicant
                </p>
              </div>
            </div>

            <div className="pt-3 border-t border-brand-100 dark:border-brand-850 text-[11px] text-brand-500 font-medium flex items-center justify-between">
              <span>Co-Applicant Property Access</span>
              <span className="text-emerald-600 font-semibold">Active Access</span>
            </div>
          </div>
        )}

        {/* 3. Family Member Cards */}
        {isLoading ? (
          <div className="h-44 rounded-2xl bg-brand-100/50 dark:bg-brand-900/40 animate-pulse border border-brand-200/50 dark:border-brand-850" />
        ) : (
          familyMembers.map((member) => (
            <div
              key={member.id}
              className="relative rounded-2xl border border-brand-200/80 bg-white dark:bg-brand-900 dark:border-brand-800 p-6 shadow-sm hover:shadow-md transition-all duration-300 space-y-4 flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-600 dark:text-amber-400 uppercase tracking-wider">
                    <Heart className="h-3 w-3" />
                    {member.relation || 'Family Member'}
                  </span>

                  {/* Actions for Primary Buyer */}
                  {isPrimaryBuyer && (
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => openEditModal(member)}
                        className="p-1.5 rounded-lg text-brand-400 hover:text-brand-900 dark:hover:text-white hover:bg-brand-100/60 dark:hover:bg-brand-800 transition-colors"
                        title="Edit Member"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleRemove(member.id)}
                        className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                        title="Remove Access"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="font-serif text-lg font-bold text-brand-900 dark:text-white">{member.name}</h3>
                  {member.email && (
                    <p className="text-xs text-brand-500 dark:text-brand-400 flex items-center gap-1.5 mt-1">
                      <Mail className="h-3.5 w-3.5 text-brand-400" />
                      {member.email}
                    </p>
                  )}
                  {member.phone && (
                    <p className="text-xs text-brand-500 dark:text-brand-400 flex items-center gap-1.5 mt-0.5">
                      <Phone className="h-3.5 w-3.5 text-brand-400" />
                      {member.phone}
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-brand-100 dark:border-brand-850 text-[11px] text-brand-400 flex items-center justify-between">
                <span className="flex items-center gap-1 text-emerald-600 font-semibold">
                  <CheckCircle2 className="h-3 w-3" />
                  Active Status
                </span>
                <span className="flex items-center gap-1 text-brand-400">
                  <Clock className="h-3 w-3" />
                  Verified
                </span>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Add / Edit Family Member Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl bg-white dark:bg-brand-900 p-6 sm:p-8 shadow-2xl border border-brand-200 dark:border-brand-800 text-left space-y-5 animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between border-b border-brand-100 dark:border-brand-850 pb-4">
              <h3 className="font-serif text-xl font-bold text-brand-900 dark:text-white">
                {editingMember ? 'Edit Family Member' : 'Add Family Member'}
              </h3>
              <button
                onClick={closeModal}
                className="p-1.5 rounded-xl text-brand-400 hover:bg-brand-100/50 dark:hover:bg-brand-850 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3.5 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900/50 text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="e.g. Ananya Sharma"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 dark:border-brand-700 bg-white dark:bg-brand-950 text-xs text-brand-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">
                  Relationship *
                </label>
                <select
                  value={formRelation}
                  onChange={(e) => setFormRelation(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 dark:border-brand-700 bg-white dark:bg-brand-950 text-xs text-brand-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                >
                  <option value="Spouse">Spouse</option>
                  <option value="Child">Son / Daughter</option>
                  <option value="Parent">Father / Mother</option>
                  <option value="Sibling">Brother / Sister</option>
                  <option value="Other">Other Family Member</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  value={formEmail}
                  onChange={(e) => setFormEmail(e.target.value)}
                  placeholder="ananya@example.com"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 dark:border-brand-700 bg-white dark:bg-brand-950 text-xs text-brand-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-brand-700 dark:text-brand-300 mb-1">
                  Phone Number (Optional)
                </label>
                <input
                  type="tel"
                  value={formPhone}
                  onChange={(e) => setFormPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className="w-full px-3.5 py-2.5 rounded-xl border border-brand-200 dark:border-brand-700 bg-white dark:bg-brand-950 text-xs text-brand-900 dark:text-white focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-100 dark:border-brand-850">
                <button
                  type="button"
                  onClick={closeModal}
                  className="px-4 py-2.5 rounded-xl text-xs font-bold text-brand-600 hover:bg-brand-100/50 dark:text-brand-300 dark:hover:bg-brand-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addMutation.isPending || updateMutation.isPending}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold bg-amber-500 hover:bg-amber-600 text-white shadow-md transition-colors disabled:opacity-50"
                >
                  {addMutation.isPending || updateMutation.isPending
                    ? 'Saving...'
                    : editingMember
                    ? 'Update Member'
                    : 'Add Member'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
