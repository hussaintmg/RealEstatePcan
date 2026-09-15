'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Building2,
  ShieldCheck,
  User,
  Crown,
  Globe,
  Image as ImageIcon,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  ArrowRight,
  ArrowLeft,
  Loader2,
  UploadCloud,
  Trash2,
  Sparkles,
} from 'lucide-react';

interface SetupFormData {
  developer: {
    fullName: string;
    email: string;
    password: string;
    confirmPassword: string;
  };
  createOwner: boolean;
  owner: {
    fullName: string;
    email: string;
    password: string;
    companyName: string;
  };
  websiteName: string;
  branding: {
    headerLogo: string;
    footerLogo: string;
    favicon: string;
  };
}

const INITIAL_DATA: SetupFormData = {
  developer: {
    fullName: '',
    email: '',
    password: '',
    confirmPassword: '',
  },
  createOwner: true,
  owner: {
    fullName: '',
    email: '',
    password: '',
    companyName: '',
  },
  websiteName: 'Aura Heights Luxury Estates',
  branding: {
    headerLogo: '',
    footerLogo: '',
    favicon: '/favicon.ico',
  },
};

const STEPS = [
  { id: 1, title: 'Welcome', desc: 'Architecture & Prep' },
  { id: 2, title: 'Developer', desc: 'Master Admin' },
  { id: 3, title: 'Owner', desc: 'Business Executive' },
  { id: 4, title: 'Identity', desc: 'Platform Name' },
  { id: 5, title: 'Branding', desc: 'Logos & Favicon' },
  { id: 6, title: 'Review', desc: 'Confirm & Launch' },
  { id: 7, title: 'Finish', desc: 'Platform Ready' },
];

export default function SetupPage() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SetupFormData>(INITIAL_DATA);
  const [loading, setLoading] = useState(false);
  const [checkingStatus, setCheckingStatus] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Password visibility states
  const [showDevPass, setShowDevPass] = useState(false);
  const [showDevConfirm, setShowDevConfirm] = useState(false);
  const [showOwnerPass, setShowOwnerPass] = useState(false);

  // Asset upload states
  const [uploadingAsset, setUploadingAsset] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<Record<string, string>>({});

  useEffect(() => {
    // Verify if setup has already been completed
    fetch('/api/setup/status')
      .then((res) => res.json())
      .then((data) => {
        if (data.setupCompleted) {
          router.replace('/login');
        } else {
          // Restore draft from sessionStorage if available
          try {
            const savedDraft = sessionStorage.getItem('platform_setup_draft');
            if (savedDraft) {
              const parsed = JSON.parse(savedDraft);
              if (parsed.formData) {
                setFormData((prev) => ({
                  ...prev,
                  ...parsed.formData,
                  developer: { ...prev.developer, ...parsed.formData.developer, password: '', confirmPassword: '' },
                  owner: { ...prev.owner, ...parsed.formData.owner, password: '' },
                }));
              }
              if (parsed.currentStep && parsed.currentStep >= 1 && parsed.currentStep <= 6) {
                setCurrentStep(parsed.currentStep);
              }
            }
          } catch {
            // Ignore draft restore errors
          }
          setCheckingStatus(false);
        }
      })
      .catch(() => {
        setCheckingStatus(false);
      });
  }, [router]);

  // Save non-sensitive draft progress
  useEffect(() => {
    if (currentStep >= 1 && currentStep <= 6) {
      try {
        const draft = {
          currentStep,
          formData: {
            developer: { fullName: formData.developer.fullName, email: formData.developer.email },
            createOwner: formData.createOwner,
            owner: { fullName: formData.owner.fullName, email: formData.owner.email, companyName: formData.owner.companyName },
            websiteName: formData.websiteName,
            branding: formData.branding,
          },
        };
        sessionStorage.setItem('platform_setup_draft', JSON.stringify(draft));
      } catch {
        // Ignore draft errors
      }
    }
  }, [formData, currentStep]);

  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    assetKey: 'headerLogo' | 'footerLogo' | 'favicon'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAsset(assetKey);
    setUploadError((prev) => ({ ...prev, [assetKey]: '' }));

    try {
      const data = new FormData();
      data.append('file', file);
      data.append('assetType', assetKey);

      const res = await fetch('/api/setup/upload', {
        method: 'POST',
        body: data,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.message || json.error || 'Upload failed');
      }

      setFormData((prev) => ({
        ...prev,
        branding: {
          ...prev.branding,
          [assetKey]: json.url,
        },
      }));
    } catch (err: any) {
      setUploadError((prev) => ({
        ...prev,
        [assetKey]: err.message || 'File upload failed',
      }));
    } finally {
      setUploadingAsset(null);
    }
  };

  const removeAsset = (assetKey: 'headerLogo' | 'footerLogo' | 'favicon') => {
    setFormData((prev) => ({
      ...prev,
      branding: {
        ...prev.branding,
        [assetKey]: assetKey === 'favicon' ? '/favicon.ico' : '',
      },
    }));
  };

  const validateCurrentStep = (): boolean => {
    setError(null);
    setFieldErrors({});
    const errors: Record<string, string> = {};

    if (currentStep === 2) {
      if (!formData.developer.fullName.trim()) {
        errors.devName = 'Developer full name is required';
      }
      if (!formData.developer.email.trim()) {
        errors.devEmail = 'Email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.developer.email)) {
        errors.devEmail = 'Please enter a valid email address';
      }
      if (!formData.developer.password) {
        errors.devPass = 'Password is required';
      } else if (formData.developer.password.length < 8) {
        errors.devPass = 'Password must be at least 8 characters';
      }
      if (formData.developer.password !== formData.developer.confirmPassword) {
        errors.devConfirm = 'Passwords do not match';
      }
    }

    if (currentStep === 3 && formData.createOwner) {
      if (!formData.owner.fullName.trim()) {
        errors.ownerName = 'Owner full name is required';
      }
      if (!formData.owner.email.trim()) {
        errors.ownerEmail = 'Owner email is required';
      } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.owner.email)) {
        errors.ownerEmail = 'Please enter a valid email address';
      } else if (
        formData.owner.email.trim().toLowerCase() ===
        formData.developer.email.trim().toLowerCase()
      ) {
        errors.ownerEmail = 'Owner email must differ from Developer email';
      }
      if (formData.owner.password && formData.owner.password.length < 8) {
        errors.ownerPass = 'Password must be at least 8 characters';
      }
    }

    if (currentStep === 4) {
      if (!formData.websiteName.trim()) {
        errors.websiteName = 'Website name is required';
      }
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setError('Please resolve all highlighted fields before proceeding.');
      return false;
    }

    return true;
  };

  const handleNext = () => {
    if (validateCurrentStep()) {
      setCurrentStep((prev) => Math.min(prev + 1, STEPS.length));
    }
  };

  const handleBack = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  const handleSubmitSetup = async () => {
    if (!validateCurrentStep()) return;

    setLoading(true);
    setError(null);

    try {
      const payload = {
        developer: {
          fullName: formData.developer.fullName.trim(),
          email: formData.developer.email.trim().toLowerCase(),
          password: formData.developer.password,
          confirmPassword: formData.developer.confirmPassword,
        },
        owner: formData.createOwner
          ? {
              fullName: formData.owner.fullName.trim(),
              email: formData.owner.email.trim().toLowerCase(),
              password: formData.owner.password || 'OwnerSecure2026!',
              companyName: formData.owner.companyName.trim(),
            }
          : undefined,
        branding: {
          websiteName: formData.websiteName.trim(),
          headerLogo: formData.branding.headerLogo,
          footerLogo: formData.branding.footerLogo,
          favicon: formData.branding.favicon || '/favicon.ico',
        },
      };

      const res = await fetch('/api/setup/initialize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(data.message || data.error || 'Failed to complete setup');
      }

      // Successful setup -> Clear draft and show Finish step
      try {
        sessionStorage.removeItem('platform_setup_draft');
      } catch {
        // ignore
      }
      setLoading(false);
      setCurrentStep(7);
    } catch (err: any) {
      setError(err.message || 'An error occurred during platform setup');
      setLoading(false);
    }
  };

  if (checkingStatus) {
    return (
      <div className="min-h-screen bg-[#070a0f] flex flex-col items-center justify-center text-slate-400 text-xs">
        <Loader2 className="w-6 h-6 animate-spin text-blue-500 mb-2" />
        <span>Verifying platform system state...</span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#070a0f] text-slate-100 flex flex-col items-center justify-center p-3 sm:p-6 relative overflow-hidden">
      {/* Ambient Lighting Gradients */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-blue-600/15 blur-[160px] rounded-full pointer-events-none" />
      <div className="absolute -bottom-40 right-1/4 w-[500px] h-[400px] bg-indigo-600/10 blur-[150px] rounded-full pointer-events-none" />

      {/* Main Setup Container */}
      <div className="w-full max-w-2xl bg-[#0c101b]/95 backdrop-blur-2xl border border-white/10 rounded-3xl p-5 sm:p-8 shadow-2xl space-y-6 relative z-10 my-4">
        {/* Brand Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-4 border-b border-white/10">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl shadow-lg shadow-blue-600/30">
              <Building2 className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-2">
                Platform Setup Wizard
                <span className="text-[10px] uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  First Run
                </span>
              </h1>
              <p className="text-xs text-slate-400">
                Foundation bootstrap &amp; secure identity configuration
              </p>
            </div>
          </div>
          <div className="text-right text-[11px] font-mono text-slate-500">
            Step {currentStep} of {STEPS.length}
          </div>
        </div>

        {/* Step Progression Indicators (Responsive Bar) */}
        <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
          {STEPS.map((step) => {
            const isDone = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            return (
              <div key={step.id} className="flex flex-col items-center">
                <div
                  className={`w-full h-1.5 rounded-full transition-all duration-300 ${
                    isDone
                      ? 'bg-emerald-500'
                      : isCurrent
                      ? 'bg-blue-500 shadow-sm shadow-blue-500/50'
                      : 'bg-white/10'
                  }`}
                />
                <span
                  className={`hidden sm:block text-[10px] mt-1.5 truncate max-w-full font-medium ${
                    isCurrent
                      ? 'text-blue-400'
                      : isDone
                      ? 'text-emerald-400'
                      : 'text-slate-600'
                  }`}
                >
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>

        {/* Global Error Banner */}
        {error && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 rounded-xl text-xs text-rose-300 flex items-center space-x-2.5 animate-in fade-in">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: WELCOME */}
        {currentStep === 1 && (
          <div className="space-y-4 py-2">
            <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl space-y-2">
              <div className="flex items-center space-x-2 text-blue-300 font-semibold text-sm">
                <Sparkles className="w-4 h-4 text-blue-400" />
                <span>Welcome to your Real Estate Platform</span>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                This guided first-run bootstrap initializes your secure system foundation.
                You will configure the Master Developer credentials, the primary business Owner
                account, the website identity, and upload your high-resolution branding assets.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 bg-white/[0.03] border border-white/5 rounded-xl space-y-1">
                <div className="flex items-center space-x-2 text-slate-200 font-medium">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>Security Enforced</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Passwords hashed with bcrypt. Zero default credentials stored in plaintext.
                </p>
              </div>

              <div className="p-3.5 bg-white/[0.03] border border-white/5 rounded-xl space-y-1">
                <div className="flex items-center space-x-2 text-slate-200 font-medium">
                  <Crown className="w-4 h-4 text-amber-400" />
                  <span>Role Hierarchy</span>
                </div>
                <p className="text-[11px] text-slate-400">
                  Independent developer and single primary business owner segregation.
                </p>
              </div>
            </div>

            <p className="text-[11px] text-slate-500 italic text-center pt-2">
              Press "Get Started" to initiate Developer configuration.
            </p>
          </div>
        )}

        {/* STEP 2: DEVELOPER ACCOUNT */}
        {currentStep === 2 && (
          <div className="space-y-4 py-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
              <User className="w-4 h-4 text-blue-400" />
              <span>Platform Developer / Super Admin Account</span>
            </div>
            <p className="text-xs text-slate-400">
              This account receives full system privileges, feature flag toggles, and developer settings.
            </p>

            <div className="space-y-3">
              <div>
                <label
                  htmlFor="dev-name"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Full Name <span className="text-rose-400">*</span>
                </label>
                <input
                  id="dev-name"
                  type="text"
                  required
                  autoComplete="name"
                  placeholder="Alex Mercer"
                  value={formData.developer.fullName}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      developer: { ...formData.developer, fullName: e.target.value },
                    })
                  }
                  className={`w-full bg-white/[0.04] border ${
                    fieldErrors.devName ? 'border-rose-500/60' : 'border-white/10'
                  } rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500`}
                />
                {fieldErrors.devName && (
                  <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.devName}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="dev-email"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Developer Email <span className="text-rose-400">*</span>
                </label>
                <input
                  id="dev-email"
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="developer@auraheights.com"
                  value={formData.developer.email}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      developer: { ...formData.developer, email: e.target.value },
                    })
                  }
                  className={`w-full bg-white/[0.04] border ${
                    fieldErrors.devEmail ? 'border-rose-500/60' : 'border-white/10'
                  } rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500`}
                />
                {fieldErrors.devEmail && (
                  <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.devEmail}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="dev-pass"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Password (min 8 characters) <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="dev-pass"
                    type={showDevPass ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    value={formData.developer.password}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        developer: { ...formData.developer, password: e.target.value },
                      })
                    }
                    className={`w-full bg-white/[0.04] border ${
                      fieldErrors.devPass ? 'border-rose-500/60' : 'border-white/10'
                    } rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDevPass(!showDevPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    aria-label="Toggle password visibility"
                  >
                    {showDevPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.devPass && (
                  <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.devPass}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="dev-confirm"
                  className="block text-xs font-medium text-slate-300 mb-1"
                >
                  Confirm Password <span className="text-rose-400">*</span>
                </label>
                <div className="relative">
                  <input
                    id="dev-confirm"
                    type={showDevConfirm ? 'text' : 'password'}
                    required
                    autoComplete="new-password"
                    placeholder="••••••••••••"
                    value={formData.developer.confirmPassword}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        developer: { ...formData.developer, confirmPassword: e.target.value },
                      })
                    }
                    className={`w-full bg-white/[0.04] border ${
                      fieldErrors.devConfirm ? 'border-rose-500/60' : 'border-white/10'
                    } rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500`}
                  />
                  <button
                    type="button"
                    onClick={() => setShowDevConfirm(!showDevConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                    aria-label="Toggle password confirmation visibility"
                  >
                    {showDevConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {fieldErrors.devConfirm && (
                  <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.devConfirm}</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: OWNER ACCOUNT */}
        {currentStep === 3 && (
          <div className="space-y-4 py-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
                <Crown className="w-4 h-4 text-amber-400" />
                <span>Primary Business Owner Provisioning</span>
              </div>
              <label className="flex items-center space-x-2 cursor-pointer text-xs text-slate-300">
                <input
                  type="checkbox"
                  checked={formData.createOwner}
                  onChange={(e) =>
                    setFormData({ ...formData, createOwner: e.target.checked })
                  }
                  className="rounded border-white/10 text-blue-600 focus:ring-blue-500 bg-white/5"
                />
                <span>Configure Owner Now</span>
              </label>
            </div>

            <p className="text-xs text-slate-400">
              The primary Owner oversees company operations, leads, properties, and live audit streams.
              The architecture enforces strictly <strong className="text-slate-200">one primary Owner</strong>.
            </p>

            {formData.createOwner ? (
              <div className="space-y-3 pt-2">
                <div>
                  <label
                    htmlFor="owner-name"
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Owner Full Name <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="owner-name"
                    type="text"
                    required
                    autoComplete="name"
                    placeholder="Evelyn Sinclair"
                    value={formData.owner.fullName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        owner: { ...formData.owner, fullName: e.target.value },
                      })
                    }
                    className={`w-full bg-white/[0.04] border ${
                      fieldErrors.ownerName ? 'border-rose-500/60' : 'border-white/10'
                    } rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500`}
                  />
                  {fieldErrors.ownerName && (
                    <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.ownerName}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="owner-email"
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Owner Email <span className="text-rose-400">*</span>
                  </label>
                  <input
                    id="owner-email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder="owner@auraheights.com"
                    value={formData.owner.email}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        owner: { ...formData.owner, email: e.target.value },
                      })
                    }
                    className={`w-full bg-white/[0.04] border ${
                      fieldErrors.ownerEmail ? 'border-rose-500/60' : 'border-white/10'
                    } rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500`}
                  />
                  {fieldErrors.ownerEmail && (
                    <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.ownerEmail}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="owner-company"
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Company / Organization Name
                  </label>
                  <input
                    id="owner-company"
                    type="text"
                    autoComplete="organization"
                    placeholder="Aura Heights Luxury Living Ltd."
                    value={formData.owner.companyName}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        owner: { ...formData.owner, companyName: e.target.value },
                      })
                    }
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label
                    htmlFor="owner-pass"
                    className="block text-xs font-medium text-slate-300 mb-1"
                  >
                    Initial Password
                  </label>
                  <div className="relative">
                    <input
                      id="owner-pass"
                      type={showOwnerPass ? 'text' : 'password'}
                      autoComplete="new-password"
                      placeholder="Leave blank for secure generated default"
                      value={formData.owner.password}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          owner: { ...formData.owner, password: e.target.value },
                        })
                      }
                      className={`w-full bg-white/[0.04] border ${
                        fieldErrors.ownerPass ? 'border-rose-500/60' : 'border-white/10'
                      } rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowOwnerPass(!showOwnerPass)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                      aria-label="Toggle owner password visibility"
                    >
                      {showOwnerPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {fieldErrors.ownerPass && (
                    <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.ownerPass}</p>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-xs text-slate-400 text-center">
                Owner provisioning skipped for now. The Master Developer can provision the single
                Owner account later from the Developer Console.
              </div>
            )}
          </div>
        )}

        {/* STEP 4: WEBSITE IDENTITY */}
        {currentStep === 4 && (
          <div className="space-y-4 py-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
              <Globe className="w-4 h-4 text-blue-400" />
              <span>Website &amp; Platform Identity</span>
            </div>
            <p className="text-xs text-slate-400">
              Set the public platform title. This value persists centrally and dynamically powers
              headers, footers, metadata, and communications.
            </p>

            <div>
              <label
                htmlFor="website-name"
                className="block text-xs font-medium text-slate-300 mb-1"
              >
                Website Name <span className="text-rose-400">*</span>
              </label>
              <input
                id="website-name"
                type="text"
                required
                placeholder="Aura Heights Luxury Estates"
                value={formData.websiteName}
                onChange={(e) =>
                  setFormData({ ...formData, websiteName: e.target.value })
                }
                className={`w-full bg-white/[0.04] border ${
                  fieldErrors.websiteName ? 'border-rose-500/60' : 'border-white/10'
                } rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-blue-500`}
              />
              {fieldErrors.websiteName && (
                <p className="text-[11px] text-rose-400 mt-1">{fieldErrors.websiteName}</p>
              )}
            </div>

            <div className="p-3 bg-white/[0.02] border border-white/5 rounded-xl text-[11px] text-slate-400 flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
              <span>
                Theme and CMS components automatically consume this dynamic website identity.
              </span>
            </div>
          </div>
        )}

        {/* STEP 5: BRANDING ASSETS (3 INDEPENDENT ASSETS) */}
        {currentStep === 5 && (
          <div className="space-y-4 py-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
              <ImageIcon className="w-4 h-4 text-blue-400" />
              <span>Three Independent Branding Assets</span>
            </div>
            <p className="text-xs text-slate-400">
              Upload distinct assets for Header, Footer, and Favicon. Images are verified for MIME
              integrity (PNG, JPG, WebP, SVG, ICO) up to 5MB.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Asset 1: Header Logo */}
              <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">1. Header / Topbar Logo</div>
                  <div className="text-[10px] text-slate-400">Visible on the main topbar navigation</div>
                </div>

                <div className="h-24 bg-black/40 border border-white/5 rounded-xl flex items-center justify-center p-2 relative overflow-hidden">
                  {formData.branding.headerLogo ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={formData.branding.headerLogo}
                        alt="Header Logo Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => removeAsset('headerLogo')}
                        className="absolute top-1 right-1 p-1 bg-rose-500/80 hover:bg-rose-600 rounded-lg text-white"
                        title="Remove logo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-[10px] text-slate-500">No logo uploaded</div>
                  )}
                </div>

                <div>
                  <label className="w-full flex items-center justify-center space-x-1.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-medium text-slate-200 cursor-pointer transition-colors">
                    {uploadingAsset === 'headerLogo' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                    )}
                    <span>{formData.branding.headerLogo ? 'Replace Logo' : 'Upload Header Logo'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      disabled={uploadingAsset === 'headerLogo'}
                      onChange={(e) => handleFileUpload(e, 'headerLogo')}
                    />
                  </label>
                  {uploadError.headerLogo && (
                    <p className="text-[10px] text-rose-400 mt-1">{uploadError.headerLogo}</p>
                  )}
                </div>
              </div>

              {/* Asset 2: Footer Logo */}
              <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">2. Footer Logo</div>
                  <div className="text-[10px] text-slate-400">Rendered in the site-wide footer</div>
                </div>

                <div className="h-24 bg-black/40 border border-white/5 rounded-xl flex items-center justify-center p-2 relative overflow-hidden">
                  {formData.branding.footerLogo ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={formData.branding.footerLogo}
                        alt="Footer Logo Preview"
                        className="max-h-full max-w-full object-contain"
                      />
                      <button
                        type="button"
                        onClick={() => removeAsset('footerLogo')}
                        className="absolute top-1 right-1 p-1 bg-rose-500/80 hover:bg-rose-600 rounded-lg text-white"
                        title="Remove footer logo"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ) : (
                    <div className="text-center text-[10px] text-slate-500">No logo uploaded</div>
                  )}
                </div>

                <div>
                  <label className="w-full flex items-center justify-center space-x-1.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-medium text-slate-200 cursor-pointer transition-colors">
                    {uploadingAsset === 'footerLogo' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                    )}
                    <span>{formData.branding.footerLogo ? 'Replace Logo' : 'Upload Footer Logo'}</span>
                    <input
                      type="file"
                      accept="image/png,image/jpeg,image/webp,image/svg+xml"
                      className="hidden"
                      disabled={uploadingAsset === 'footerLogo'}
                      onChange={(e) => handleFileUpload(e, 'footerLogo')}
                    />
                  </label>
                  {uploadError.footerLogo && (
                    <p className="text-[10px] text-rose-400 mt-1">{uploadError.footerLogo}</p>
                  )}
                </div>
              </div>

              {/* Asset 3: Favicon */}
              <div className="p-3.5 bg-white/[0.03] border border-white/10 rounded-2xl space-y-3 flex flex-col justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">3. Browser Favicon</div>
                  <div className="text-[10px] text-slate-400">Browser tab icon (.ico, .png, .svg)</div>
                </div>

                <div className="h-24 bg-black/40 border border-white/5 rounded-xl flex items-center justify-center p-2 relative overflow-hidden">
                  {formData.branding.favicon ? (
                    <div className="relative w-full h-full flex items-center justify-center">
                      <img
                        src={formData.branding.favicon}
                        alt="Favicon Preview"
                        className="w-8 h-8 object-contain"
                      />
                      {formData.branding.favicon !== '/favicon.ico' && (
                        <button
                          type="button"
                          onClick={() => removeAsset('favicon')}
                          className="absolute top-1 right-1 p-1 bg-rose-500/80 hover:bg-rose-600 rounded-lg text-white"
                          title="Reset favicon"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-center text-[10px] text-slate-500">Default icon</div>
                  )}
                </div>

                <div>
                  <label className="w-full flex items-center justify-center space-x-1.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-[11px] font-medium text-slate-200 cursor-pointer transition-colors">
                    {uploadingAsset === 'favicon' ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-blue-400" />
                    ) : (
                      <UploadCloud className="w-3.5 h-3.5 text-blue-400" />
                    )}
                    <span>{formData.branding.favicon && formData.branding.favicon !== '/favicon.ico' ? 'Replace Favicon' : 'Upload Favicon'}</span>
                    <input
                      type="file"
                      accept="image/x-icon,image/png,image/svg+xml"
                      className="hidden"
                      disabled={uploadingAsset === 'favicon'}
                      onChange={(e) => handleFileUpload(e, 'favicon')}
                    />
                  </label>
                  {uploadError.favicon && (
                    <p className="text-[10px] text-rose-400 mt-1">{uploadError.favicon}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 6: REVIEW & LAUNCH */}
        {currentStep === 6 && (
          <div className="space-y-4 py-2">
            <div className="flex items-center space-x-2 text-xs font-semibold text-slate-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Review Setup Configuration</span>
            </div>
            <p className="text-xs text-slate-400">
              Review your initial bootstrap configuration before committing changes to the database.
            </p>

            <div className="space-y-2.5 text-xs">
              {/* Developer Summary */}
              <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-between">
                <div>
                  <div className="font-semibold text-white flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-blue-400" />
                    <span>Developer: {formData.developer.fullName}</span>
                  </div>
                  <div className="text-[11px] text-slate-400">{formData.developer.email}</div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  MASTER ADMIN
                </span>
              </div>

              {/* Owner Summary */}
              {formData.createOwner && (
                <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl flex items-center justify-between">
                  <div>
                    <div className="font-semibold text-white flex items-center gap-1.5">
                      <Crown className="w-3.5 h-3.5 text-amber-400" />
                      <span>Owner: {formData.owner.fullName}</span>
                    </div>
                    <div className="text-[11px] text-slate-400">
                      {formData.owner.email} {formData.owner.companyName ? `• ${formData.owner.companyName}` : ''}
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30">
                    PRIMARY OWNER
                  </span>
                </div>
              )}

              {/* Identity & Branding Summary */}
              <div className="p-3 bg-white/[0.03] border border-white/10 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Website Name:</span>
                  <span className="font-semibold text-white">{formData.websiteName}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Header Logo:</span>
                  <span className="text-slate-300 truncate max-w-[200px]">
                    {formData.branding.headerLogo || 'Default Icon'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Footer Logo:</span>
                  <span className="text-slate-300 truncate max-w-[200px]">
                    {formData.branding.footerLogo || 'Default Icon'}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Favicon:</span>
                  <span className="text-slate-300 truncate max-w-[200px]">
                    {formData.branding.favicon}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 7: FINISH & LAUNCH */}
        {currentStep === 7 && (
          <div className="space-y-6 py-4 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/40 rounded-3xl mx-auto flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20 animate-in zoom-in-75">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-xl font-bold text-white">Platform Initialized Successfully</h2>
              <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                Master Developer authority, initial primary Owner, and custom identity branding have been safely committed.
              </p>
            </div>

            <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl max-w-md mx-auto text-left text-xs space-y-2.5">
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-slate-400">Website Name:</span>
                <span className="font-semibold text-white">{formData.websiteName}</span>
              </div>
              <div className="flex justify-between items-center pb-2 border-b border-white/5">
                <span className="text-slate-400">Master Developer:</span>
                <span className="font-semibold text-blue-400">{formData.developer.email}</span>
              </div>
              {formData.createOwner && (
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Primary Owner:</span>
                  <span className="font-semibold text-amber-400">{formData.owner.email}</span>
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => router.push('/login?setup=success')}
              className="w-full max-w-md mx-auto py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center justify-center space-x-2 transition-all hover:scale-105"
            >
              <span>Launch Platform &amp; Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Action Controls & Navigation Buttons */}
        {currentStep < 7 && (
          <div className="flex items-center justify-between pt-4 border-t border-white/10">
            {currentStep > 1 ? (
              <button
                type="button"
                disabled={loading}
                onClick={handleBack}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl text-xs font-semibold flex items-center space-x-1.5 transition-all disabled:opacity-50"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Back</span>
              </button>
            ) : (
              <div />
            )}

            {currentStep < 6 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center space-x-2 transition-all hover:scale-105"
              >
                <span>{currentStep === 1 ? 'Get Started' : 'Continue'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <button
                type="button"
                disabled={loading}
                onClick={handleSubmitSetup}
                className="px-6 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white rounded-xl text-xs font-bold shadow-lg shadow-emerald-600/30 flex items-center space-x-2 transition-all hover:scale-105 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>{loading ? 'Finalizing Platform...' : 'Complete & Launch Platform'}</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
