'use client';

import React, { useEffect, useState } from 'react';
import { AUTH_PAGE_TEMPLATES } from '@/lib/cms/design/authTemplates';
import { Lock, Check, Shield } from 'lucide-react';

export default function AuthTemplatesDesignPage() {
  const [activeLogin, setActiveLogin] = useState('auth-login-split-luxury');
  const [savedMessage, setSavedMessage] = useState(false);

  useEffect(() => {
    fetch('/api/cms/design')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && data.config?.authTemplates?.loginKey) {
          setActiveLogin(data.config.authTemplates.loginKey);
        }
      })
      .catch(console.error);
  }, []);

  const handleSelect = async (key: string) => {
    setActiveLogin(key);
    try {
      const res = await fetch('/api/cms/design', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          authTemplates: { loginKey: key },
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSavedMessage(true);
        setTimeout(() => setSavedMessage(false), 3000);
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center gap-2.5">
            <Lock className="w-5 h-5 text-amber-400" />
            Auth Page Presentation Templates
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Choose presentation layouts for Login, Forgot Password, Six-Box OTP, and Invitation Acceptance.
          </p>
        </div>

        {savedMessage && (
          <div className="px-3 py-1.5 rounded-lg bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-xs font-semibold flex items-center gap-1.5 animate-fade-in">
            <Check className="w-4 h-4" />
            Auth template saved
          </div>
        )}
      </div>

      <div className="p-3.5 rounded-lg bg-slate-900/60 border border-slate-800 flex items-center gap-3 text-xs text-slate-400">
        <Shield className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong>Security Invariant</strong>: CMS templates govern layout, photography, and typography only.
          Authentication logic, bcrypt password hashing, CSRF tokens, and session cookies are strictly controlled by server security handlers.
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {AUTH_PAGE_TEMPLATES.map((authTpl) => {
          const isSelected = activeLogin === authTpl.key;
          return (
            <div
              key={authTpl.key}
              onClick={() => handleSelect(authTpl.key)}
              className={`cursor-pointer rounded-xl p-5 border transition-all flex flex-col justify-between ${
                isSelected
                  ? 'bg-slate-900/90 border-amber-500 shadow-lg shadow-amber-500/10 ring-1 ring-amber-500/50'
                  : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold text-slate-200">{authTpl.name}</span>
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-400 border border-slate-700">
                    {authTpl.type}
                  </span>
                </div>
                <p className="text-xs text-slate-400 mb-4">{authTpl.description}</p>

                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1 font-mono text-slate-400">
                  <div className="flex justify-between">
                    <span>Layout:</span> <span className="text-slate-200">{authTpl.layout}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Brand Logo:</span> <span className="text-slate-200">{authTpl.showBrandLogo ? 'Yes' : 'No'}</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-end">
                <button
                  className={`px-3 py-1 rounded text-xs font-semibold ${
                    isSelected ? 'bg-amber-400 text-slate-950' : 'bg-slate-800 text-slate-300'
                  }`}
                >
                  {isSelected ? 'Active Template' : 'Use Template'}
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
