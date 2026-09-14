'use client';

import React, { useState, useMemo } from 'react';
import { Calculator, DollarSign, Percent, Calendar, PieChart, ShieldCheck } from 'lucide-react';

interface MortgageCalculatorProps {
  propertyPrice?: number;
  className?: string;
}

export const MortgageCalculator: React.FC<MortgageCalculatorProps> = ({
  propertyPrice = 1850000,
  className = '',
}) => {
  const [homePrice, setHomePrice] = useState<number>(propertyPrice);
  const [downPaymentPercent, setDownPaymentPercent] = useState<number>(20);
  const [interestRate, setInterestRate] = useState<number>(6.5);
  const [loanTermYears, setLoanTermYears] = useState<number>(30);

  const downPaymentAmount = useMemo(() => {
    return Math.round((homePrice * downPaymentPercent) / 100);
  }, [homePrice, downPaymentPercent]);

  const loanAmount = useMemo(() => {
    return Math.max(0, homePrice - downPaymentAmount);
  }, [homePrice, downPaymentAmount]);

  const { monthlyPrincipalInterest, propertyTaxMonthly, insuranceMonthly, totalMonthly } = useMemo(() => {
    const monthlyRate = interestRate / 100 / 12;
    const totalPayments = loanTermYears * 12;

    let pi = 0;
    if (monthlyRate > 0 && totalPayments > 0 && loanAmount > 0) {
      pi =
        (loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalPayments))) /
        (Math.pow(1 + monthlyRate, totalPayments) - 1);
    }

    const tax = Math.round((homePrice * 0.012) / 12);
    const insurance = Math.round((homePrice * 0.005) / 12);
    const total = Math.round(pi + tax + insurance);

    return {
      monthlyPrincipalInterest: Math.round(pi),
      propertyTaxMonthly: tax,
      insuranceMonthly: insurance,
      totalMonthly: total,
    };
  }, [homePrice, downPaymentAmount, interestRate, loanTermYears]);

  return (
    <div className={`p-6 bg-[#101522] border border-white/15 rounded-3xl shadow-2xl space-y-6 ${className}`}>
      <div className="flex items-center justify-between border-b border-white/10 pb-4">
        <div className="flex items-center space-x-2.5">
          <div className="p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-emerald-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Financing &amp; Mortgage Estimation</h3>
            <p className="text-[11px] text-slate-400">Calculate estimated monthly payments and amortization breakdown.</p>
          </div>
        </div>

        <span className="px-2.5 py-1 bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-bold rounded-full uppercase tracking-wider">
          Fixed Rate Amortization
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center">
        {/* Left Inputs */}
        <div className="space-y-4 text-xs">
          {/* Home Price */}
          <div>
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span>Home Value</span>
              <span className="font-bold text-white font-mono">${homePrice.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={100000}
              max={10000000}
              step={50000}
              value={homePrice}
              onChange={(e) => setHomePrice(Number(e.target.value))}
              className="w-full accent-blue-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Down Payment */}
          <div>
            <div className="flex items-center justify-between text-slate-300 mb-1">
              <span>Down Payment ({downPaymentPercent}%)</span>
              <span className="font-bold text-emerald-400 font-mono">${downPaymentAmount.toLocaleString()}</span>
            </div>
            <input
              type="range"
              min={5}
              max={50}
              step={5}
              value={downPaymentPercent}
              onChange={(e) => setDownPaymentPercent(Number(e.target.value))}
              className="w-full accent-emerald-500 h-1.5 bg-white/10 rounded-lg cursor-pointer"
            />
          </div>

          {/* Interest Rate & Term */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 text-[11px] mb-1">Interest Rate (%)</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.1"
                  min="1"
                  max="15"
                  value={interestRate}
                  onChange={(e) => setInterestRate(Number(e.target.value))}
                  className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 pr-7 text-white outline-none focus:border-blue-500/50 font-mono text-xs"
                />
                <Percent className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
              </div>
            </div>

            <div>
              <label className="block text-slate-300 text-[11px] mb-1">Loan Term</label>
              <select
                value={loanTermYears}
                onChange={(e) => setLoanTermYears(Number(e.target.value))}
                className="w-full bg-black/40 border border-white/10 rounded-xl p-2.5 text-white outline-none focus:border-blue-500/50 text-xs cursor-pointer"
              >
                <option value={15} className="bg-slate-900">15 Years Fixed</option>
                <option value={20} className="bg-slate-900">20 Years Fixed</option>
                <option value={30} className="bg-slate-900">30 Years Fixed</option>
              </select>
            </div>
          </div>
        </div>

        {/* Right Output Card */}
        <div className="p-5 bg-gradient-to-br from-blue-950/40 via-indigo-950/30 to-black/60 border border-blue-500/20 rounded-2xl space-y-4">
          <div>
            <span className="text-[11px] text-slate-400 uppercase tracking-widest font-semibold block">
              Estimated Monthly Payment
            </span>
            <div className="text-3xl font-black text-white tracking-tight mt-1 flex items-baseline space-x-1">
              <span className="text-emerald-400">${totalMonthly.toLocaleString()}</span>
              <span className="text-xs text-slate-400 font-normal">/ month</span>
            </div>
          </div>

          {/* Progress Stack Bar */}
          <div className="h-2 rounded-full overflow-hidden flex bg-white/10">
            <div
              style={{ width: `${(monthlyPrincipalInterest / totalMonthly) * 100}%` }}
              className="bg-blue-500 h-full"
              title="Principal & Interest"
            />
            <div
              style={{ width: `${(propertyTaxMonthly / totalMonthly) * 100}%` }}
              className="bg-emerald-500 h-full"
              title="Property Tax"
            />
            <div
              style={{ width: `${(insuranceMonthly / totalMonthly) * 100}%` }}
              className="bg-amber-500 h-full"
              title="Home Insurance"
            />
          </div>

          {/* Breakdown Items */}
          <div className="space-y-1.5 text-xs">
            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                <span>Principal &amp; Interest</span>
              </div>
              <span className="font-mono text-white font-semibold">
                ${monthlyPrincipalInterest.toLocaleString()}
              </span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                <span>Property Tax (Est. 1.2%)</span>
              </div>
              <span className="font-mono text-white font-semibold">${propertyTaxMonthly.toLocaleString()}</span>
            </div>

            <div className="flex items-center justify-between text-slate-300">
              <div className="flex items-center space-x-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                <span>Homeowner Insurance</span>
              </div>
              <span className="font-mono text-white font-semibold">${insuranceMonthly.toLocaleString()}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
