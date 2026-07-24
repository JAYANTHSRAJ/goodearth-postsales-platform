import React, { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { User, ShieldCheck, Users, Briefcase, Calendar, Save, CheckCircle2, Sparkles, ArrowRight } from 'lucide-react';
import kycService from '../services/kyc.service';
import { useUnitStore } from '../../../store/unitStore';
import KycDatePicker from '../components/common/KycDatePicker';
import { OCCUPATIONS } from '../components/forms/KycApplicantFormSection';

export const ApplicantInfoPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { activeUnit } = useUnitStore();

  const targetDealName =
    searchParams.get('dealName') ||
    activeUnit?.zohoDealName ||
    activeUnit?.projectName ||
    searchParams.get('bookingId') ||
    activeUnit?.unitName ||
    'motif16-280726';
  const targetDealId = activeUnit?.zohoDealId || undefined;

  const [form, setForm] = useState({
    bookingId: targetDealName,
    zohoDealName: targetDealName,
    zohoDealId: targetDealId,
    // Personal Information
    applicantTitle: 'Mr.',
    applicantFirstName: '',
    applicantLastName: '',
    applicantGender: 'Male',
    applicantDob: '',
    applicantAge: '',
    applicantPhone: '',
    applicantEmail: '',
    // Identity
    applicantPan: '',
    applicantAadhar: '',
    // Family Particulars
    relationship: 'S/O',
    applicantFatherSalutation: 'Mr.',
    applicantFatherFirstName: '',
    applicantFatherLastName: '',
    // Professional Details
    applicantOccupation: 'Engineer',
    customOccupation: '',
    // Application
    applicationDate: new Date().toISOString().split('T')[0],
    consideringHomeLoan: 'No',
    // Co-Applicant Entry
    hasCoApplicant: 'No',
  });

  const [saving, setSaving] = useState<boolean>(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      bookingId: targetDealName,
      zohoDealName: targetDealName,
      zohoDealId: targetDealId,
    }));
  }, [targetDealName, targetDealId]);

  const handleChange = (field: string, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isSpouse = form.relationship === 'W/O' || form.relationship === 'W/o';
  const isPredefinedOcc = OCCUPATIONS.filter((o) => o !== 'Other').includes(form.applicantOccupation);
  const selectedOccDropdown = isPredefinedOcc ? form.applicantOccupation : (form.applicantOccupation ? 'Other' : '');

  const handleOccupationDropdownChange = (selectedVal: string) => {
    if (selectedVal === 'Other') {
      handleChange('applicantOccupation', 'Other');
    } else {
      handleChange('applicantOccupation', selectedVal);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation check for Occupation when 'Other' is selected
    if (selectedOccDropdown === 'Other' && !form.customOccupation.trim() && form.applicantOccupation === 'Other') {
      setErrorMsg('Please specify your occupation.');
      return;
    }

    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    const submitPayload: any = {
      ...form,
      soDoWoA: form.relationship,
      applicantOccupation: selectedOccDropdown === 'Other' ? form.customOccupation.trim() || 'Other' : form.applicantOccupation,
    };

    try {
      await kycService.submitApplicantInfo(submitPayload);
      setSuccessMsg(`Successfully updated Zoho CRM Deal for booking reference '${form.bookingId}'!`);
    } catch (err: any) {
      setErrorMsg(err?.message || 'Failed to update applicant information in Zoho CRM');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">
      {/* Hero Header */}
      <div className="bg-gradient-to-br from-slate-900 via-slate-800 to-brand-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-800 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/20 text-brand-300 border border-brand-500/30 text-xs font-semibold">
          <Sparkles className="w-3.5 h-3.5" /> GoodEarth Buyer Portal
        </div>
        <h1 className="text-3xl font-bold font-serif tracking-tight text-white">Primary Applicant Information</h1>
        <p className="text-sm text-slate-300 max-w-2xl">
          Please provide your applicant details below. All fields will be synchronized directly to your official property booking in Zoho CRM.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-2xl bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800 flex items-center gap-3 text-sm font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-800 text-sm font-semibold">
          {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* 1. Personal Information */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-9 h-9 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Personal Information</h2>
              <p className="text-xs text-slate-500">Applicant identity, title & contact details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Applicant Title</label>
              <select
                value={form.applicantTitle}
                onChange={(e) => handleChange('applicantTitle', e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value="Mr.">Mr.</option>
                <option value="Mrs.">Mrs.</option>
                <option value="Ms.">Ms.</option>
                <option value="Dr.">Dr.</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">First Name *</label>
              <input
                type="text"
                required
                placeholder="First Name"
                value={form.applicantFirstName}
                onChange={(e) => handleChange('applicantFirstName', e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Last Name *</label>
              <input
                type="text"
                required
                placeholder="Last Name"
                value={form.applicantLastName}
                onChange={(e) => handleChange('applicantLastName', e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Applicant Gender</label>
              <select
                value={form.applicantGender}
                onChange={(e) => handleChange('applicantGender', e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <KycDatePicker
              label="Applicant DOB"
              value={form.applicantDob}
              onChange={(val) => handleChange('applicantDob', val)}
              helperText="Format: dd-MM-yyyy"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Applicant Age</label>
              <input
                type="number"
                placeholder="Age"
                value={form.applicantAge}
                onChange={(e) => handleChange('applicantAge', e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Applicant Phone Number *</label>
              <input
                type="tel"
                required
                placeholder="+91 9876543210"
                value={form.applicantPhone}
                onChange={(e) => handleChange('applicantPhone', e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Applicant Email *</label>
              <input
                type="email"
                required
                placeholder="email@example.com"
                value={form.applicantEmail}
                onChange={(e) => handleChange('applicantEmail', e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        {/* 2. Identity Verification */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-9 h-9 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Identity Verification</h2>
              <p className="text-xs text-slate-500">Government tax & identity numbers</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Applicant PAN *</label>
              <input
                type="text"
                required
                placeholder="ABCDE1234F"
                maxLength={10}
                value={form.applicantPan}
                onChange={(e) => handleChange('applicantPan', e.target.value.toUpperCase())}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm uppercase"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Applicant Aadhar *</label>
              <input
                type="text"
                required
                placeholder="123400009876"
                maxLength={12}
                value={form.applicantAadhar}
                onChange={(e) => handleChange('applicantAadhar', e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        {/* 3. Family Particulars */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-9 h-9 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Family Particulars</h2>
              <p className="text-xs text-slate-500">Father / Spouse relationship & details</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Relationship</label>
              <select
                value={form.relationship}
                onChange={(e) => handleChange('relationship', e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value="S/O">S/O</option>
                <option value="D/O">D/O</option>
                <option value="W/O">W/O</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isSpouse ? "Applicant Spouse First Name" : "Applicant Father's First Name"}
              </label>
              <input
                type="text"
                placeholder="First Name"
                value={form.applicantFatherFirstName}
                onChange={(e) => handleChange('applicantFatherFirstName', e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isSpouse ? "Applicant Spouse Last Name" : "Applicant Father's Last Name"}
              </label>
              <input
                type="text"
                placeholder="Last Name"
                value={form.applicantFatherLastName}
                onChange={(e) => handleChange('applicantFatherLastName', e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              />
            </div>
          </div>
        </div>

        {/* 4. Professional Details */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-9 h-9 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Professional Details</h2>
              <p className="text-xs text-slate-500">Applicant occupation classification</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Applicant Occupation</label>
              <select
                value={selectedOccDropdown || '-Select-'}
                onChange={(e) => handleOccupationDropdownChange(e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value="-Select-">-Select-</option>
                {OCCUPATIONS.map((occ) => (
                  <option key={occ} value={occ}>
                    {occ}
                  </option>
                ))}
              </select>
            </div>

            {selectedOccDropdown === 'Other' && (
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  Occupation <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Specify Occupation"
                  value={form.customOccupation}
                  onChange={(e) => handleChange('customOccupation', e.target.value)}
                  className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                />
              </div>
            )}
          </div>
        </div>

        {/* 5. Application & Home Loan */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-9 h-9 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold">
              <Calendar className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Application Particulars</h2>
              <p className="text-xs text-slate-500">Date & home loan consideration</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <KycDatePicker
              label="Application Date"
              value={form.applicationDate}
              onChange={(val) => handleChange('applicationDate', val)}
              helperText="Format: dd-MM-yyyy"
            />

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Are you considering a home loan?</label>
              <select
                value={form.consideringHomeLoan}
                onChange={(e) => handleChange('consideringHomeLoan', e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>
          </div>
        </div>

        {/* 6. Co-Applicant Entry */}
        <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
            <div className="w-9 h-9 rounded-2xl bg-brand-500/10 text-brand-600 flex items-center justify-center font-bold">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Co-Applicant Entry</h2>
              <p className="text-xs text-slate-500">Indicate whether a co-applicant or joint owner will be included</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-end">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">Do you have a Co-Applicant?</label>
              <select
                value={form.hasCoApplicant}
                onChange={(e) => handleChange('hasCoApplicant', e.target.value)}
                className="w-full h-10 px-3.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
              >
                <option value="No">No</option>
                <option value="Yes">Yes</option>
              </select>
            </div>

            {form.hasCoApplicant === 'Yes' && (
              <div>
                <button
                  type="button"
                  onClick={() => navigate(`/client/kyc/applicants?bookingId=${form.bookingId}`)}
                  className="w-full h-10 px-4 bg-brand-50 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300 border border-brand-200 dark:border-brand-800 rounded-xl font-semibold text-xs flex items-center justify-center gap-2 hover:bg-brand-100 transition-all"
                >
                  <span>Continue to Dedicated Co-Applicant Section</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Submit Action Bar */}
        <div className="flex justify-end pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-8 py-3.5 bg-brand-600 hover:bg-brand-700 text-white rounded-2xl font-bold text-sm shadow-lg shadow-brand-500/25 flex items-center gap-2 transition-all disabled:opacity-50"
          >
            <Save className="w-4 h-4" />
            {saving ? 'Saving to Zoho CRM...' : 'Save Applicant Information'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ApplicantInfoPage;
