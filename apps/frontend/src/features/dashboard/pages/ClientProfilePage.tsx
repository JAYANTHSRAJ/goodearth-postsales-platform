import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Mail,
  Phone,
  Shield,
  Users,
  PlusCircle,
  Trash2,
  Lock,
  Eye,
  Building,
  ChevronRight,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { EmptyState } from '../../../components/ui/EmptyState';
import { clientService, FamilyMember } from '../../../services/client.service';
import { useAuthStore } from '../../../store/authStore';

export const ClientProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [relation, setRelation] = useState('Spouse');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  // Preference states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(false);

  // Queries
  const { data: family = [], isLoading: isFamilyLoading } = useQuery({
    queryKey: ['clientFamily'],
    queryFn: () => clientService.getFamilyMembers(),
  });

  const { data: home } = useQuery({
    queryKey: ['clientHome'],
    queryFn: () => clientService.getHomeDetails(),
  });

  const addMemberMutation = useMutation({
    mutationFn: (member: FamilyMember) => clientService.addFamilyMember(member),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientFamily'] });
      setShowAddForm(false);
      setName('');
      setEmail('');
      setPhone('');
    },
  });

  const deleteMemberMutation = useMutation({
    mutationFn: (id: string) => clientService.removeFamilyMember(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientFamily'] });
    },
  });

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    addMemberMutation.mutate({
      name,
      relation,
      email: email.trim() || undefined,
      phone: phone.trim() || undefined,
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="text-left">
        <h1 className="font-serif text-3xl font-semibold text-brand-900 dark:text-white">
          Profile Settings
        </h1>
        <p className="text-sm font-medium text-brand-500 dark:text-brand-400 mt-1">
          Review your post-sales homeowner details, verify accounts reference, and register co-applicant family permissions
        </p>
      </div>

      {/* Main split UI */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 text-left">
        {/* Left Side: Owner details */}
        <div className="space-y-6">
          <Card title="Primary Homeowner" subtitle="Verified CRM registered contact details">
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-brand-700 text-white flex items-center justify-center font-bold text-lg">
                  {user?.name ? user.name.charAt(0) : 'H'}
                </div>
                <div>
                  <h4 className="text-sm font-semibold text-brand-900 dark:text-white">
                    {user?.name || 'Homeowner Client'}
                  </h4>
                  <p className="text-xs text-brand-400">Primary Registrant</p>
                </div>
              </div>

              <div className="space-y-3 border-t border-brand-100 dark:border-brand-850 pt-4 text-xs">
                <div className="flex items-center gap-3">
                  <Mail className="h-4 w-4 text-brand-400 shrink-0" />
                  <span className="text-brand-700 dark:text-brand-200">{user?.email || '—'}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-brand-400 shrink-0" />
                  <span className="text-brand-700 dark:text-brand-200 uppercase font-mono tracking-wide text-[10px]">
                    PAN: ABCDE1234F
                  </span>
                </div>
                <div className="border-t border-brand-100 dark:border-brand-850 pt-3">
                  <span className="text-[10px] uppercase font-semibold text-brand-400 block tracking-wider">Permanent Address</span>
                  <p className="text-brand-800 dark:text-brand-200 leading-relaxed mt-1 font-medium text-[11px]">
                    No. 45, GoodEarth Malhar Estate, Kengeri, Bengaluru, Karnataka - 560060
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Properties Owned list */}
          <Card title="Residence Portfolio" subtitle="Registered properties under ownership">
            <div className="space-y-3 pt-2 text-xs">
              <div className="p-3 rounded-xl border border-brand-100 bg-brand-50/20 dark:border-brand-850 flex items-start gap-3">
                <Building className="h-5 w-5 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-semibold text-brand-900 dark:text-white">{home?.project || 'GoodEarth Malhar'}</h5>
                  <p className="text-[10px] text-brand-450 mt-0.5">Villa Ref: {home?.villa || 'Villa 12'} | Plot {home?.plot || '34'}</p>
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Right Side: Family co-applicants list & preferences */}
        <div className="lg:col-span-2 space-y-6">
          <Card
            title="Co-Applicants & Family Access"
            subtitle="Grant portal permissions to other family members"
          >
            {showAddForm ? (
              <form onSubmit={handleAddMember} className="space-y-4 pt-2 border-t border-brand-100 dark:border-brand-850">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Priyal Sharma"
                      className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-800 dark:bg-brand-950/20 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
                      Relation
                    </label>
                    <select
                      value={relation}
                      onChange={(e) => setRelation(e.target.value)}
                      className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-800 dark:bg-brand-950/20 dark:text-white"
                    >
                      <option>Spouse</option>
                      <option>Son</option>
                      <option>Daughter</option>
                      <option>Father</option>
                      <option>Mother</option>
                      <option>Co-Applicant</option>
                    </select>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-800 dark:bg-brand-950/20 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">
                      Phone Number
                    </label>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 XXXXX XXXXX"
                      className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-500/25 focus:border-brand-600 dark:border-brand-800 dark:bg-brand-950/20 dark:text-white"
                    />
                  </div>
                </div>
                <div className="flex gap-2 justify-end">
                  <button
                    type="submit"
                    className="rounded-xl bg-brand-700 hover:bg-brand-800 text-white px-4 py-2 text-xs font-semibold transition-colors"
                  >
                    Register co-applicant
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowAddForm(false)}
                    className="rounded-xl bg-brand-100 hover:bg-brand-200 dark:bg-brand-800 text-brand-800 dark:text-white px-3 py-2 text-xs font-semibold transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="flex justify-between items-center border-b border-brand-100 dark:border-brand-850 pb-3">
                  <span className="text-xs text-brand-400">Registered Access Permissions</span>
                  <button
                    onClick={() => setShowAddForm(true)}
                    className="inline-flex items-center gap-1 text-xs font-semibold text-brand-700 dark:text-brand-400 hover:text-brand-950"
                  >
                    <PlusCircle className="h-4.5 w-4.5" />
                    Add Family Member
                  </button>
                </div>

                {isFamilyLoading ? (
                  <span className="text-xs text-brand-500 font-sans">Loading details...</span>
                ) : family.length > 0 ? (
                  <div className="divide-y divide-brand-100 dark:divide-brand-850">
                    {family.map((member: FamilyMember) => (
                      <div key={member.id} className="py-3 flex items-center justify-between">
                        <div className="min-w-0">
                          <h4 className="text-xs font-semibold text-brand-850 dark:text-white flex items-center gap-2">
                            <span>{member.name}</span>
                            <span className="rounded-full bg-brand-50 text-brand-700 text-[9px] py-0.5 px-2 font-medium dark:bg-brand-800 dark:text-brand-300">
                              {member.relation}
                            </span>
                          </h4>
                          <div className="flex items-center gap-4 text-[10px] text-brand-450 mt-1">
                            {member.email && (
                              <span className="flex items-center gap-1">
                                <Mail className="h-3 w-3" />
                                {member.email}
                              </span>
                            )}
                            {member.phone && (
                              <span className="flex items-center gap-1">
                                <Phone className="h-3 w-3" />
                                {member.phone}
                              </span>
                            )}
                          </div>
                        </div>

                        {member.id && (
                          <button
                            onClick={() => deleteMemberMutation.mutate(member.id!)}
                            className="text-brand-400 hover:text-red-600 transition-colors p-1"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No family members listed"
                    description="Adding a family member allows them co-applicant view access."
                    icon={Users}
                  />
                )}
              </div>
            )}
          </Card>

          {/* Preferences & Security settings */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <Card title="Alert Channels" subtitle="Manage communication dispatcher preferences">
              <div className="space-y-4 pt-2 text-xs font-semibold text-brand-700 dark:text-brand-300">
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={emailAlerts} onChange={(e) => setEmailAlerts(e.target.checked)} className="rounded accent-brand-700" />
                  <span>Email updates on milestone events</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={smsAlerts} onChange={(e) => setSmsAlerts(e.target.checked)} className="rounded accent-brand-700" />
                  <span>SMS alerts on outstanding payments</span>
                </label>
                <label className="flex items-center gap-2.5 cursor-pointer">
                  <input type="checkbox" checked={whatsappAlerts} onChange={(e) => setWhatsappAlerts(e.target.checked)} className="rounded accent-brand-700" />
                  <span>WhatsApp instant support updates</span>
                </label>
              </div>
            </Card>

            <Card title="Security Preferences" subtitle="Configure password and pin credentials">
              <div className="space-y-4 pt-2 text-xs font-semibold text-brand-700 dark:text-brand-300">
                <button className="w-full flex items-center justify-between p-2 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-850 dark:hover:bg-brand-800 transition-colors">
                  <span className="flex items-center gap-2">
                    <Lock className="h-4 w-4 text-brand-400" />
                    Reset Portal Password
                  </span>
                  <ChevronRight className="h-4 w-4 text-brand-400" />
                </button>
                <button className="w-full flex items-center justify-between p-2 rounded-xl bg-brand-50 hover:bg-brand-100 dark:bg-brand-850 dark:hover:bg-brand-800 transition-colors">
                  <span className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-brand-400" />
                    Review Login History
                  </span>
                  <ChevronRight className="h-4 w-4 text-brand-400" />
                </button>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientProfilePage;
