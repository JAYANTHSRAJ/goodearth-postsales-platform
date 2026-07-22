import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  User as UserIcon,
  Mail,
  ShieldCheck,
  Building2,
  Lock,
  BellRing,
  MapPin,
  CheckCircle2,
  Sparkles,
  KeyRound,
  Smartphone,
  PlusCircle,
  Trash2,
  Save,
  Check,
  AlertCircle,
} from 'lucide-react';
import { Card } from '../../../components/ui/Card';
import { clientService, FamilyMember } from '../../../services/client.service';
import { useAuthStore } from '../../../store/authStore';
import { useUnitStore } from '../../../store/unitStore';

export const ClientProfilePage: React.FC = () => {
  const { user } = useAuthStore();
  const { activeUnit } = useUnitStore();
  const queryClient = useQueryClient();

  const [activeTab, setActiveTab] = useState<'overview' | 'personal' | 'address' | 'preferences' | 'security' | 'family'>('overview');

  // Co-applicant add state
  const [showAddMember, setShowAddMember] = useState(false);
  const [memberName, setMemberName] = useState('');
  const [memberRelation, setMemberRelation] = useState('Spouse');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPhone, setMemberPhone] = useState('');

  // Preference states
  const [emailAlerts, setEmailAlerts] = useState(true);
  const [smsAlerts, setSmsAlerts] = useState(true);
  const [whatsappAlerts, setWhatsappAlerts] = useState(true);
  const [prefSaveSuccess, setPrefSaveSuccess] = useState(false);

  // Security password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Profile Form state
  const [personalForm, setPersonalForm] = useState({
    fullName: user?.name || '',
    phone: '+91 98765 43210',
    altEmail: 'arjun.alternate@example.com',
    dob: '1988-06-15',
    gender: 'Male',
    nationality: 'Indian',
    panNumber: 'ABCDE1234F',
    address: 'No. 45, GoodEarth Malhar Estate, Kengeri',
    city: 'Bengaluru',
    state: 'Karnataka',
    country: 'India',
    postalCode: '560060',
  });

  // Queries
  const { data: family = [] } = useQuery({
    queryKey: ['clientFamily'],
    queryFn: () => clientService.getFamilyMembers(),
    enabled: !!user,
  });

  const { data: home } = useQuery({
    queryKey: ['clientHome'],
    queryFn: () => clientService.getHomeDetails(),
    enabled: !!user,
  });

  const addMemberMutation = useMutation({
    mutationFn: (member: FamilyMember) => clientService.addFamilyMember(member),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['clientFamily'] });
      setShowAddMember(false);
      setMemberName('');
      setMemberEmail('');
      setMemberPhone('');
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
    if (!memberName.trim()) return;
    addMemberMutation.mutate({
      name: memberName,
      relation: memberRelation,
      email: memberEmail.trim() || undefined,
      phone: memberPhone.trim() || undefined,
    });
  };

  const handleSavePreferences = () => {
    setPrefSaveSuccess(true);
    setTimeout(() => setPrefSaveSuccess(false), 3000);
  };

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');
    setPasswordSuccess(false);

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters long');
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match');
      return;
    }

    setPasswordSuccess(true);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setTimeout(() => setPasswordSuccess(false), 4000);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 pb-12 text-left">
      {/* Premium Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-brand-950 via-brand-900 to-brand-850 p-8 text-white shadow-2xl dark:border dark:border-brand-800/50">
        <div className="absolute -right-12 -top-12 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
        <div className="absolute right-32 bottom-0 h-40 w-40 rounded-full bg-amber-500/10 blur-2xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="relative">
              <div className="h-24 w-24 rounded-2xl bg-gradient-to-tr from-brand-700 to-brand-500 text-white flex items-center justify-center font-serif text-3xl font-bold shadow-xl border-2 border-white/20">
                {user?.name ? user.name.charAt(0).toUpperCase() : 'G'}
              </div>
              <div className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-emerald-500 border-2 border-brand-950 flex items-center justify-center" title="Verified Owner">
                <Check className="h-3.5 w-3.5 text-white stroke-[3]" />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="font-serif text-2xl md:text-3xl font-semibold tracking-tight">
                  {user?.name || 'Homeowner Client'}
                </h1>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-emerald-300 backdrop-blur-md border border-white/10">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Verified Account
                </span>
              </div>
              <p className="text-sm font-medium text-brand-200 flex items-center gap-2">
                <Mail className="h-4 w-4 text-brand-400" />
                {user?.email || 'client@goodearth.com'}
              </p>
              <p className="text-xs text-brand-300/80 font-mono">
                Customer Reference ID: GE-HO-2026-88042
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 self-start md:self-center">
            <div className="rounded-2xl bg-white/10 backdrop-blur-md px-4 py-3 border border-white/10 text-right">
              <span className="block text-[10px] uppercase font-semibold text-brand-300 tracking-wider">Active Residence</span>
              <span className="text-sm font-medium text-white flex items-center gap-1.5">
                <Building2 className="h-4 w-4 text-emerald-400" />
                {activeUnit ? activeUnit.unitName : (home?.project || 'GoodEarth Malhar')}
              </span>
            </div>
          </div>
        </div>

        {/* Tab Navigation Pill Bar */}
        <div className="mt-8 flex items-center gap-2 overflow-x-auto border-t border-white/10 pt-4 no-scrollbar text-xs">
          {[
            { id: 'overview', label: 'Overview', icon: Sparkles },
            { id: 'personal', label: 'Personal Information', icon: UserIcon },
            { id: 'address', label: 'Address & Contact', icon: MapPin },
            { id: 'preferences', label: 'Communication', icon: BellRing },
            { id: 'security', label: 'Security & Password', icon: Lock },
            { id: 'family', label: 'Co-Applicants & Family', icon: UserIcon },
          ].map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 rounded-xl px-4 py-2 font-medium transition-all duration-200 whitespace-nowrap ${
                  isActive
                    ? 'bg-white text-brand-950 shadow-md font-semibold'
                    : 'text-brand-200 hover:bg-white/10 hover:text-white'
                }`}
              >
                <Icon className={`h-4 w-4 ${isActive ? 'text-brand-900' : 'text-brand-300'}`} />
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Contents */}
      {activeTab === 'overview' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-2 space-y-6">
            <Card title="Homeowner Account Summary" subtitle="Primary identity and registration status">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-2">
                <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-850 space-y-1">
                  <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Account Type</span>
                  <p className="text-sm font-semibold text-brand-900 dark:text-white">Primary Registrant</p>
                </div>
                <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-850 space-y-1">
                  <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Verification Level</span>
                  <p className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="h-4 w-4" /> Level 3 Verified
                  </p>
                </div>
                <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-850 space-y-1">
                  <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider">PAN Reference</span>
                  <p className="text-sm font-mono font-medium text-brand-900 dark:text-white uppercase">ABCDE1234F</p>
                </div>
                <div className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/40 border border-brand-100 dark:border-brand-850 space-y-1">
                  <span className="text-xs font-semibold text-brand-500 uppercase tracking-wider">Date Registered</span>
                  <p className="text-sm font-semibold text-brand-900 dark:text-white">January 15, 2026</p>
                </div>
              </div>
            </Card>

            <Card title="Active Residence Details" subtitle="Unit ownership details linked to this portal account">
              <div className="p-5 rounded-2xl bg-gradient-to-br from-brand-900 to-brand-950 text-white space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-serif text-lg font-bold">{activeUnit ? activeUnit.unitName : (home?.project || 'GoodEarth Malhar Resonance')}</h4>
                    <p className="text-xs text-brand-300 mt-0.5">Villa #12 | Kengeri, Bengaluru</p>
                  </div>
                  <span className="rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 px-3 py-1 text-xs font-medium">
                    Active Ownership
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs border-t border-white/10 pt-3 text-brand-200">
                  <div>
                    <span className="block text-[10px] uppercase text-brand-400">Handover Target</span>
                    <span className="font-medium text-white">Q4 2026</span>
                  </div>
                  <div>
                    <span className="block text-[10px] uppercase text-brand-400">CRM Ref</span>
                    <span className="font-mono text-white">deal_zoho_201</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Account Security Summary" subtitle="Protection & Session status">
              <div className="space-y-4 pt-2 text-xs">
                <div className="flex items-center justify-between p-3 rounded-xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-850">
                  <div className="flex items-center gap-3">
                    <Lock className="h-4 w-4 text-emerald-600" />
                    <div>
                      <span className="font-semibold text-brand-900 dark:text-white block">Password Protection</span>
                      <span className="text-brand-400 text-[10px]">Updated 12 days ago</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">Strong</span>
                </div>

                <div className="flex items-center justify-between p-3 rounded-xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-100 dark:border-brand-850">
                  <div className="flex items-center gap-3">
                    <Smartphone className="h-4 w-4 text-brand-600" />
                    <div>
                      <span className="font-semibold text-brand-900 dark:text-white block">Session Token</span>
                      <span className="text-brand-400 text-[10px]">Stateless JWT Active</span>
                    </div>
                  </div>
                  <span className="text-[10px] font-semibold text-brand-700 bg-brand-100 dark:bg-brand-850 px-2 py-0.5 rounded-md">Encrypted</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      )}

      {activeTab === 'personal' && (
        <Card title="Personal Information" subtitle="Primary registrant identity parameters">
          <form className="space-y-6 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                  Full Name (As per PAN)
                </label>
                <input
                  type="text"
                  value={personalForm.fullName}
                  onChange={(e) => setPersonalForm({ ...personalForm, fullName: e.target.value })}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                  Date of Birth
                </label>
                <input
                  type="date"
                  value={personalForm.dob}
                  onChange={(e) => setPersonalForm({ ...personalForm, dob: e.target.value })}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                  Gender
                </label>
                <select
                  value={personalForm.gender}
                  onChange={(e) => setPersonalForm({ ...personalForm, gender: e.target.value })}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                >
                  <option>Male</option>
                  <option>Female</option>
                  <option>Other</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                  Nationality
                </label>
                <input
                  type="text"
                  value={personalForm.nationality}
                  onChange={(e) => setPersonalForm({ ...personalForm, nationality: e.target.value })}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                  PAN Number
                </label>
                <input
                  type="text"
                  value={personalForm.panNumber}
                  onChange={(e) => setPersonalForm({ ...personalForm, panNumber: e.target.value.toUpperCase() })}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm font-mono uppercase outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-brand-100 dark:border-brand-850">
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl bg-brand-900 hover:bg-brand-950 text-white px-5 py-2.5 text-xs font-semibold transition-all shadow-md"
              >
                <Save className="h-4 w-4" /> Save Personal Information
              </button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'address' && (
        <Card title="Address & Communication Coordinates" subtitle="Verified postal address for title deeds and legal correspondence">
          <form className="space-y-6 pt-2">
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                  Street Address
                </label>
                <input
                  type="text"
                  value={personalForm.address}
                  onChange={(e) => setPersonalForm({ ...personalForm, address: e.target.value })}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                    City
                  </label>
                  <input
                    type="text"
                    value={personalForm.city}
                    onChange={(e) => setPersonalForm({ ...personalForm, city: e.target.value })}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                    State
                  </label>
                  <input
                    type="text"
                    value={personalForm.state}
                    onChange={(e) => setPersonalForm({ ...personalForm, state: e.target.value })}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                    Country
                  </label>
                  <input
                    type="text"
                    value={personalForm.country}
                    onChange={(e) => setPersonalForm({ ...personalForm, country: e.target.value })}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                    Postal Code
                  </label>
                  <input
                    type="text"
                    value={personalForm.postalCode}
                    onChange={(e) => setPersonalForm({ ...personalForm, postalCode: e.target.value })}
                    className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-brand-100 dark:border-brand-850">
              <button
                type="button"
                className="flex items-center gap-2 rounded-xl bg-brand-900 hover:bg-brand-950 text-white px-5 py-2.5 text-xs font-semibold transition-all shadow-md"
              >
                <Save className="h-4 w-4" /> Save Address Coordinates
              </button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'preferences' && (
        <Card title="Communication & Alert Channels" subtitle="Manage notifications for milestones, payments, and design plans">
          <div className="space-y-6 pt-2">
            {prefSaveSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Preferences saved successfully.
              </div>
            )}

            <div className="space-y-4 divide-y divide-brand-100 dark:divide-brand-850">
              <div className="flex items-center justify-between pt-4 first:pt-0">
                <div>
                  <h4 className="text-sm font-semibold text-brand-900 dark:text-white">Email Notifications</h4>
                  <p className="text-xs text-brand-500 dark:text-brand-400">Receive milestone updates, invoice notices, and design sign-off requests via email.</p>
                </div>
                <input
                  type="checkbox"
                  checked={emailAlerts}
                  onChange={(e) => setEmailAlerts(e.target.checked)}
                  className="h-5 w-5 rounded-md border-brand-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <h4 className="text-sm font-semibold text-brand-900 dark:text-white">SMS Notifications</h4>
                  <p className="text-xs text-brand-500 dark:text-brand-400">Get instant SMS alerts for critical payment deadlines and site visit schedules.</p>
                </div>
                <input
                  type="checkbox"
                  checked={smsAlerts}
                  onChange={(e) => setSmsAlerts(e.target.checked)}
                  className="h-5 w-5 rounded-md border-brand-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </div>

              <div className="flex items-center justify-between pt-4">
                <div>
                  <h4 className="text-sm font-semibold text-brand-900 dark:text-white">WhatsApp Updates</h4>
                  <p className="text-xs text-brand-500 dark:text-brand-400">Direct WhatsApp progress updates, construction media photos, and document previews.</p>
                </div>
                <input
                  type="checkbox"
                  checked={whatsappAlerts}
                  onChange={(e) => setWhatsappAlerts(e.target.checked)}
                  className="h-5 w-5 rounded-md border-brand-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-brand-100 dark:border-brand-850">
              <button
                type="button"
                onClick={handleSavePreferences}
                className="flex items-center gap-2 rounded-xl bg-brand-900 hover:bg-brand-950 text-white px-5 py-2.5 text-xs font-semibold transition-all shadow-md"
              >
                <Save className="h-4 w-4" /> Save Communication Preferences
              </button>
            </div>
          </div>
        </Card>
      )}

      {activeTab === 'security' && (
        <Card title="Security & Authentication" subtitle="Update account password and manage credentials">
          <form onSubmit={handlePasswordChange} className="space-y-6 pt-2">
            {passwordError && (
              <div className="p-4 rounded-2xl bg-red-50 border border-red-200 text-red-800 text-xs font-medium flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-600" /> {passwordError}
              </div>
            )}
            {passwordSuccess && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" /> Password updated successfully.
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1.5">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full rounded-xl border border-brand-200 bg-brand-50/30 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-600 dark:border-brand-850 dark:bg-brand-950/20 dark:text-white"
                  required
                />
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-brand-100 dark:border-brand-850">
              <button
                type="submit"
                className="flex items-center gap-2 rounded-xl bg-brand-900 hover:bg-brand-950 text-white px-5 py-2.5 text-xs font-semibold transition-all shadow-md"
              >
                <KeyRound className="h-4 w-4" /> Update Account Password
              </button>
            </div>
          </form>
        </Card>
      )}

      {activeTab === 'family' && (
        <Card title="Co-Applicants & Family Access Permissions" subtitle="Manage registered family members for co-ownership permissions">
          <div className="space-y-6 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-brand-700 dark:text-brand-300">Registered Co-Applicants</span>
              {!showAddMember && (
                <button
                  onClick={() => setShowAddMember(true)}
                  className="flex items-center gap-1.5 text-xs font-semibold text-brand-700 dark:text-brand-200 hover:text-brand-900"
                >
                  <PlusCircle className="h-4 w-4" /> Add Co-Applicant
                </button>
              )}
            </div>

            {showAddMember && (
              <form onSubmit={handleAddMember} className="p-4 rounded-2xl bg-brand-50/50 dark:bg-brand-950/30 border border-brand-200 dark:border-brand-850 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Full Name</label>
                    <input
                      type="text"
                      value={memberName}
                      onChange={(e) => setMemberName(e.target.value)}
                      placeholder="e.g. Priyal Sharma"
                      className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-brand-800 dark:bg-brand-950 dark:text-white"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Relation</label>
                    <select
                      value={memberRelation}
                      onChange={(e) => setMemberRelation(e.target.value)}
                      className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-brand-800 dark:bg-brand-950 dark:text-white"
                    >
                      <option>Spouse</option>
                      <option>Son</option>
                      <option>Daughter</option>
                      <option>Father</option>
                      <option>Mother</option>
                      <option>Co-Applicant</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Email Address</label>
                    <input
                      type="email"
                      value={memberEmail}
                      onChange={(e) => setMemberEmail(e.target.value)}
                      placeholder="email@example.com"
                      className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-brand-800 dark:bg-brand-950 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-brand-700 dark:text-brand-300 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      value={memberPhone}
                      onChange={(e) => setMemberPhone(e.target.value)}
                      placeholder="+91 98765 00000"
                      className="w-full rounded-xl border border-brand-200 bg-white px-3 py-2 text-xs outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-brand-800 dark:bg-brand-950 dark:text-white"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowAddMember(false)}
                    className="px-3 py-1.5 text-xs text-brand-500 hover:text-brand-700 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 text-xs font-semibold bg-brand-900 text-white rounded-xl hover:bg-brand-950 shadow"
                  >
                    Register Co-Applicant
                  </button>
                </div>
              </form>
            )}

            <div className="space-y-3">
              {family.length === 0 ? (
                <div className="p-6 text-center rounded-2xl bg-brand-50/30 dark:bg-brand-950/20 border border-dashed border-brand-200 dark:border-brand-850">
                  <p className="text-xs text-brand-450">No co-applicants registered yet. Click 'Add Co-Applicant' to grant family access.</p>
                </div>
              ) : (
                family.map((item: any) => (
                  <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-brand-100 dark:border-brand-850 bg-white dark:bg-brand-950/40 shadow-sm">
                    <div>
                      <h5 className="text-xs font-semibold text-brand-900 dark:text-white">{item.name}</h5>
                      <span className="text-[10px] font-medium text-brand-500">{item.relation}</span>
                    </div>
                    <button
                      onClick={() => deleteMemberMutation.mutate(item.id)}
                      className="p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ClientProfilePage;
