'use client';

import { useState, useEffect } from 'react';
import { 
  ArrowRight, Play, CheckCircle2, ShieldCheck, Cpu, Database, 
  ChevronDown, Globe, LayoutDashboard, ShoppingBag, ChefHat, 
  ReceiptText, BarChart3, Users, Calendar, Settings, Sparkles, 
  Layers, Package, Check, Smartphone, Truck, MessageSquare, Info
} from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const [activeTab, setActiveTab] = useState('pos');
  const [lang, setLang] = useState('EN');
  
  // Pricing Calculator State
  const [country, setCountry] = useState('JO');
  const [businessType, setBusinessType] = useState('bakery');
  const [branches, setBranches] = useState(1);
  const [users, setUsers] = useState(3);
  const [calculatedPrice, setCalculatedPrice] = useState(19);
  const [selectedPlan, setSelectedPlan] = useState('Starter');

  // Free Trial State
  const [trialSubdomain, setTrialSubdomain] = useState('');
  const [trialCompanyName, setTrialCompanyName] = useState('');
  const [trialSuccessMsg, setTrialSuccessMsg] = useState('');

  // Calculate SaaS price dynamically
  useEffect(() => {
    let basePrice = 19;
    let plan = 'Starter';

    if (branches > 25 || users > 100) {
      plan = 'Enterprise';
      setCalculatedPrice('Custom');
      setSelectedPlan(plan);
      return;
    }

    if (branches > 5 || users > 20) {
      plan = 'Business';
      basePrice = 199;
    } else if (branches > 1 || users > 5) {
      plan = 'Growth';
      basePrice = 59;
    }

    // Multiply or adjust by country currency rate
    let multiplier = 1;
    if (country === 'SA') multiplier = 5.29; // conversion JOD -> SAR
    if (country === 'AE') multiplier = 5.18; // conversion JOD -> AED

    if (typeof basePrice === 'number') {
      const finalPrice = Math.round(basePrice * multiplier);
      setCalculatedPrice(finalPrice);
    }
    
    setSelectedPlan(plan);
  }, [country, branches, users]);

  const handleCreateTrial = (e) => {
    e.preventDefault();
    if (!trialCompanyName) return;
    const sub = trialCompanyName.toLowerCase().replace(/[^a-z0-9]/g, '') || 'demo';
    setTrialSubdomain(`${sub}.cyshop.ai`);
    setTrialSuccessMsg(`🎉 Tenant provisioned successfully! Administrator account created.`);
  };

  return (
    <div className="min-h-screen bg-white text-brand-dark selection:bg-brand-orange/20 selection:text-brand-orange">
      
      {/* 1. Header / Navigation */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-10">
            {/* CyberCom Logo */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-brand-dark to-brand-orange flex items-center justify-center text-white font-extrabold text-lg shadow-md shadow-brand-orange/10 group-hover:scale-105 transition-transform">
                C
              </div>
              <div className="flex flex-col">
                <span className="font-lato font-extrabold text-xl tracking-tight text-brand-dark">CYBERCOM</span>
                <span className="text-[10px] uppercase tracking-widest text-brand-orange font-bold -mt-1">PLATFORM</span>
              </div>
            </Link>

            {/* Navigation Menu */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-gray-600">
              <div className="relative group cursor-pointer flex items-center gap-1 hover:text-brand-orange transition-colors">
                Products <ChevronDown className="w-4 h-4" />
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 z-50">
                  <Link href="/products" className="block px-4 py-2 hover:bg-gray-50 rounded-lg text-brand-dark">CYShop POS & Retail</Link>
                  <Link href="/products" className="block px-4 py-2 hover:bg-gray-50 rounded-lg text-brand-dark">CYShop Inventory</Link>
                  <Link href="/products" className="block px-4 py-2 hover:bg-gray-50 rounded-lg text-brand-dark">CYShop Manufacturing</Link>
                  <Link href="/products" className="block px-4 py-2 hover:bg-gray-50 rounded-lg text-brand-dark">CYShop Accounting</Link>
                </div>
              </div>
              <div className="relative group cursor-pointer flex items-center gap-1 hover:text-brand-orange transition-colors">
                Industries <ChevronDown className="w-4 h-4" />
                <div className="absolute top-full left-0 mt-2 w-56 bg-white border border-gray-100 rounded-xl shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-2 z-50">
                  <Link href="/industries" className="block px-4 py-2 hover:bg-gray-50 rounded-lg text-brand-dark">Bakeries & Sweets</Link>
                  <Link href="/industries" className="block px-4 py-2 hover:bg-gray-50 rounded-lg text-brand-dark">Restaurants & Fast Food</Link>
                  <Link href="/industries" className="block px-4 py-2 hover:bg-gray-50 rounded-lg text-brand-dark">Distribution & Retail</Link>
                </div>
              </div>
              <Link href="/pricing" className="hover:text-brand-orange transition-colors">Pricing</Link>
              <Link href="/app" className="text-brand-blue hover:text-brand-orange transition-colors font-bold flex items-center gap-1">
                <LayoutDashboard className="w-4 h-4" /> ERP Demo
              </Link>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            {/* Language Dropdown */}
            <div className="relative group cursor-pointer text-sm font-semibold text-gray-600 hover:text-brand-orange transition-colors flex items-center gap-1">
              <Globe className="w-4 h-4" /> {lang}
              <div className="absolute top-full right-0 mt-2 bg-white border border-gray-100 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all p-1 z-50">
                <button onClick={() => setLang('EN')} className="block w-full text-left px-4 py-1.5 hover:bg-gray-50 rounded text-xs font-semibold">EN (English)</button>
                <button onClick={() => setLang('AR')} className="block w-full text-left px-4 py-1.5 hover:bg-gray-50 rounded text-xs font-semibold">AR (العربية)</button>
              </div>
            </div>

            <Link href="/app" className="px-5 py-2.5 rounded-lg text-sm font-bold text-gray-700 hover:bg-gray-50 border border-gray-200 transition-colors">
              Sign In
            </Link>

            <Link href="#trial" className="px-5 py-2.5 rounded-lg text-sm font-bold bg-brand-orange text-white hover:bg-brand-orange/90 shadow-md shadow-brand-orange/10 hover:shadow-brand-orange/20 transition-all">
              Request Demo
            </Link>
          </div>
        </div>
      </header>

      {/* 2. Hero Section */}
      <section className="relative pt-12 pb-24 overflow-hidden bg-gradient-to-b from-gray-50 to-white">
        {/* Abstract Background Glows */}
        <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-brand-orange/5 blur-3xl" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-brand-blue/5 blur-3xl" />

        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Copy */}
          <div className="lg:col-span-5 flex flex-col gap-6 text-center lg:text-left">
            <span className="self-center lg:self-start px-3 py-1 rounded-full text-xs font-bold bg-brand-orange/10 text-brand-orange tracking-wide uppercase">
              All-In-One Business Platform
            </span>
            <h1 className="font-lato font-black text-4xl sm:text-5xl lg:text-6xl tracking-tight text-brand-dark leading-tight">
              Run Your Entire Business With <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-orange to-brand-blue">CYShop</span>
            </h1>
            <p className="text-lg text-gray-600 leading-relaxed font-medium">
              The modern ERP built for Retail, Restaurants, Bakeries, Manufacturing and Distribution. Intelligent automation scoped for growth.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 mt-2">
              <Link href="#trial" className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-brand-orange text-white hover:bg-brand-orange/90 shadow-lg shadow-brand-orange/15 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                Start Free Trial <ArrowRight className="w-4 h-4" />
              </Link>
              <Link href="/app" className="w-full sm:w-auto px-8 py-4 rounded-xl text-base font-bold bg-brand-dark text-white hover:bg-brand-dark/95 border border-brand-dark/20 hover:scale-[1.02] transition-all flex items-center justify-center gap-2">
                Explore ERP Live <Play className="w-4 h-4 fill-white" />
              </Link>
            </div>

            {/* Micro badges */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-gray-100 text-left text-xs font-bold text-gray-500">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-500" /> Cloud Native (99.9% Uptime)
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-brand-orange" /> Secure & Isolated
              </div>
              <div className="flex items-center gap-2">
                <Cpu className="w-4 h-4 text-brand-blue" /> AI Forecasting Ready
              </div>
              <div className="flex items-center gap-2">
                <Database className="w-4 h-4 text-brand-dark" /> ZATCA & JoFotara Ready
              </div>
            </div>
          </div>

          {/* Right Column: Interactive Dashboard Mockup Preview */}
          <div className="lg:col-span-7 relative group">
            <div className="absolute inset-0 bg-gradient-to-tr from-brand-orange/10 to-brand-blue/10 rounded-2xl blur-2xl group-hover:scale-105 transition-all duration-500" />
            
            {/* Mockup Frame */}
            <div className="relative bg-brand-dark rounded-2xl shadow-2xl border border-gray-800 overflow-hidden transition-transform duration-300 hover:scale-[1.01] hover:shadow-brand-orange/10">
              {/* Header bar */}
              <div className="h-12 border-b border-gray-800 px-4 flex items-center justify-between bg-brand-dark/95">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500" />
                  <div className="w-3 h-3 rounded-full bg-green-500" />
                  <span className="text-[11px] text-gray-500 font-mono ml-4">admin.cyshop.ai/dashboard</span>
                </div>
                <div className="h-6 w-32 bg-gray-800 rounded-md" />
              </div>

              {/* Inside Layout */}
              <div className="flex h-[420px] text-xs">
                {/* Sidebar */}
                <div className="w-44 bg-[#222] border-r border-gray-800 p-3 flex flex-col gap-2">
                  <div className="flex items-center gap-2 px-2 py-1.5 bg-brand-orange/10 text-brand-orange font-bold rounded-lg mb-2">
                    <LayoutDashboard className="w-3.5 h-3.5" /> Dashboard
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors">
                    <ShoppingBag className="w-3.5 h-3.5" /> Sales POS
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors">
                    <Package className="w-3.5 h-3.5" /> Inventory
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors">
                    <ChefHat className="w-3.5 h-3.5" /> Manufacturing
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors">
                    <ReceiptText className="w-3.5 h-3.5" /> Accounting
                  </div>
                  <div className="flex items-center gap-2 px-2 py-1.5 text-gray-400 hover:bg-gray-800 rounded-lg transition-colors">
                    <Users className="w-3.5 h-3.5" /> HR & Payroll
                  </div>
                </div>

                {/* Main Content Area */}
                <div className="flex-1 bg-gray-50 p-5 flex flex-col gap-4 overflow-y-auto">
                  <div className="flex items-center justify-between border-b border-gray-200 pb-3">
                    <div>
                      <h3 className="font-bold text-brand-dark text-sm">Good morning, Admin 👋</h3>
                      <span className="text-[10px] text-gray-500">Here is your business health overview.</span>
                    </div>
                    <span className="px-2 py-1 rounded bg-brand-orange/10 text-brand-orange font-bold text-[10px]">Jordan Pack</span>
                  </div>

                  {/* KPI Grid */}
                  <div className="grid grid-cols-4 gap-3">
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-1">
                      <span className="text-[9px] text-gray-500 uppercase font-bold">Total Sales</span>
                      <span className="text-sm font-extrabold text-brand-dark">1,250,000 JOD</span>
                      <span className="text-[9px] text-green-500 font-bold">+12.5% vs last month</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-1">
                      <span className="text-[9px] text-gray-500 uppercase font-bold">Orders</span>
                      <span className="text-sm font-extrabold text-brand-dark">3,567</span>
                      <span className="text-[9px] text-green-500 font-bold">+8.2% vs last month</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-1">
                      <span className="text-[9px] text-gray-500 uppercase font-bold">Net Profit</span>
                      <span className="text-sm font-extrabold text-brand-dark">320,000 JOD</span>
                      <span className="text-[9px] text-green-500 font-bold">+15.2% vs last month</span>
                    </div>
                    <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-1">
                      <span className="text-[9px] text-gray-500 uppercase font-bold">Stock Value</span>
                      <span className="text-sm font-extrabold text-brand-dark">980,000 JOD</span>
                      <span className="text-[9px] text-brand-orange font-bold">+2.4% vs last week</span>
                    </div>
                  </div>

                  {/* Live graphs mockup */}
                  <div className="grid grid-cols-12 gap-3">
                    <div className="col-span-8 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                      <span className="font-bold text-xs text-brand-dark block mb-2">Sales Forecast & Trends (JOD)</span>
                      <div className="h-32 w-full flex items-end justify-between gap-1.5 pt-2">
                        <div className="w-full bg-brand-orange/20 rounded-t h-12" />
                        <div className="w-full bg-brand-orange/40 rounded-t h-16" />
                        <div className="w-full bg-brand-orange/60 rounded-t h-24" />
                        <div className="w-full bg-brand-orange/80 rounded-t h-20" />
                        <div className="w-full bg-brand-orange rounded-t h-28" />
                        <div className="w-full bg-brand-blue rounded-t h-32 relative group">
                          <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-brand-dark text-white text-[8px] p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">AI Forecast</span>
                        </div>
                      </div>
                    </div>
                    <div className="col-span-4 bg-white p-3 rounded-lg border border-gray-200 shadow-sm flex flex-col gap-2">
                      <span className="font-bold text-xs text-brand-dark">Best Sellers</span>
                      <div className="flex flex-col gap-1.5">
                        <div className="flex justify-between text-[10px]">
                          <span>Pistachio Cake</span>
                          <span className="font-bold">120,000 JOD</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span>Baklava Mix</span>
                          <span className="font-bold">98,000 JOD</span>
                        </div>
                        <div className="flex justify-between text-[10px]">
                          <span>Maamoul Dates</span>
                          <span className="font-bold">76,000 JOD</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Trust Section: Customer Logos */}
      <section className="py-12 border-y border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <span className="text-xs uppercase font-extrabold tracking-widest text-gray-400 block mb-6">
            TRUSTED BY LEADING REGIONAL ENTERPRISES
          </span>
          <div className="flex flex-wrap items-center justify-center gap-12 md:gap-16 opacity-75 grayscale hover:grayscale-0 transition-all duration-300">
            <span className="font-lato font-black text-2xl tracking-tighter text-gray-500">anabtawi <span className="text-brand-orange text-xs block -mt-2 font-bold tracking-normal uppercase">sweets</span></span>
            <span className="font-lato font-bold text-2xl tracking-tight text-gray-500">HABIBI <span className="text-xs block -mt-2 font-light">SWEETS</span></span>
            <span className="font-serif italic font-bold text-2xl text-gray-500">zaatar w zeit</span>
            <span className="font-mono font-extrabold text-2xl text-gray-500">shawarmer</span>
            <span className="font-sans font-bold text-2xl text-gray-500">alBaraka <span className="text-xs font-normal">Bakery</span></span>
            <span className="font-lato font-black text-2xl text-gray-500">BAYAN <span className="text-brand-blue text-xs block -mt-2 font-bold tracking-normal uppercase">sweets</span></span>
          </div>
        </div>
      </section>

      {/* 4. Product Modules Section */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="text-center flex flex-col gap-4 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-orange">Powerful Modules</span>
          <h2 className="font-lato font-black text-3xl sm:text-4xl text-brand-dark">Everything you need, in one platform</h2>
          <p className="text-gray-500 max-w-xl mx-auto">No modular fragmentation. CYShop integrates all workflows out-of-the-box so you can coordinate operations in unified sync.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {/* Module Cards */}
          {[
            { icon: <ShoppingBag className="w-6 h-6 text-brand-orange" />, title: 'POS & Retail Checkout', desc: 'Lightning-fast retail POS systems. Supports offline transactions, dynamic promotions, and barcode scans.' },
            { icon: <Package className="w-6 h-6 text-brand-blue" />, title: 'Inventory Management', desc: 'Real-time multi-branch stock tracking, batch allocations, expiry date logs, and automatic reorder warnings.' },
            { icon: <ChefHat className="w-6 h-6 text-purple-500" />, title: 'Manufacturing & Recipes', desc: 'Sweets and bakery BOM models, yield calculations, recipe consumption, actual batch costing, and waste logs.' },
            { icon: <ReceiptText className="w-6 h-6 text-green-500" />, title: 'Accounting & Ledger', desc: 'Double-entry ledger reconciliation, trial balances, and automated tax reporting compliant with local laws.' },
            { icon: <Users className="w-6 h-6 text-indigo-500" />, title: 'HR & Payroll Withholding', desc: 'Geofenced shift management, leave approvals, WPS SIF generator, and localized SSC/GOSI payroll withholdings.' },
            { icon: <BarChart3 className="w-6 h-6 text-brand-dark" />, title: 'BI Reports & CYAI Analytics', desc: 'Futuristic dashboards, predictive demand forecasting, pricing recommender engines, and executive reporting.' }
          ].map((mod, idx) => (
            <div key={idx} className="bg-white border border-gray-100 rounded-2xl p-8 hover:border-gray-200 hover:shadow-xl hover:shadow-gray-100/50 transition-all duration-300 flex flex-col gap-4 group">
              <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center group-hover:scale-110 transition-transform">
                {mod.icon}
              </div>
              <h3 className="font-lato font-bold text-lg text-brand-dark">{mod.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{mod.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* 5. Why CYShop Section: Competitor comparison & local features */}
      <section className="py-24 bg-brand-dark text-white overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-brand-orange/5 blur-3xl" />
        
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left Copy */}
            <div className="lg:col-span-5 flex flex-col gap-6">
              <span className="text-xs font-bold uppercase tracking-widest text-brand-orange">Why Choose CYShop</span>
              <h2 className="font-lato font-black text-3xl sm:text-4xl leading-tight">Built specifically for GCC businesses</h2>
              <p className="text-gray-400 text-sm leading-relaxed">
                Global ERP systems fail when localized. CYShop comes pre-certified with ZATCA Phase 2, JoFotara reporting formats, local wages protection files, and multi-currency billing out of the box.
              </p>
              
              <div className="flex flex-col gap-3 mt-4">
                {[
                  'ZATCA Phase 2 compliant cryptographic signed e-invoices',
                  'JoFotara WSDL/SOAP invoice reporting ready',
                  'WPS compliance file (SIF) generation for UAE/Saudi Arabia',
                  'Localized GOSI / SSC payroll contributions calculators',
                  'Bilingual Arabic-First UI layout structure',
                  'AI demand prediction algorithms tuned for regional business spikes'
                ].map((item, idx) => (
                  <div key={idx} className="flex items-center gap-3 text-xs font-bold text-gray-300">
                    <CheckCircle2 className="w-4.5 h-4.5 text-brand-orange flex-shrink-0" /> {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Right Comparison Grid */}
            <div className="lg:col-span-7 bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-md">
              <h3 className="font-lato font-bold text-lg mb-6 text-center">Standard ERP comparison</h3>
              <div className="grid grid-cols-3 border-b border-white/10 pb-4 text-xs font-bold text-gray-400">
                <span>Features</span>
                <span className="text-center text-brand-orange">CYShop ERP</span>
                <span className="text-center">Legacy ERP</span>
              </div>

              {[
                { name: 'Local Tax Integrations (ZATCA/JoFotara)', cy: true, legacy: false },
                { name: 'BOM & Sweets Recipe Actual Costing', cy: true, legacy: false },
                { name: 'Arabic Native / RTL Mirroring UI', cy: true, legacy: 'Optional/Paid Add-on' },
                { name: 'Offline Retail POS Operations', cy: true, legacy: 'Requires third-party sync' },
                { name: 'Predictive Demand Alerts (AI)', cy: true, legacy: false },
                { name: 'Multi-Tenant Database Isolation', cy: true, legacy: 'Separate deployment cost' }
              ].map((row, idx) => (
                <div key={idx} className="grid grid-cols-3 border-b border-white/5 py-4 text-xs font-medium items-center">
                  <span className="text-gray-300">{row.name}</span>
                  <span className="text-center flex justify-center text-brand-orange">
                    {row.cy === true ? <Check className="w-4 h-4" /> : row.cy}
                  </span>
                  <span className="text-center text-gray-500">
                    {row.legacy === false ? '❌' : row.legacy}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 6. AI Section (CYAI) */}
      <section className="py-24 max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* Left Column: Interactive AI dashboard mockup */}
          <div className="lg:col-span-7 relative">
            <div className="absolute inset-0 bg-purple-500/5 rounded-2xl blur-3xl" />
            <div className="border border-purple-100 rounded-2xl bg-white p-6 shadow-xl relative">
              <div className="flex items-center justify-between border-b border-gray-100 pb-4 mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <span className="font-lato font-bold text-sm text-brand-dark">CYAI Demand Prediction Engine</span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-purple-50 text-purple-600 font-extrabold text-[10px]">Active</span>
              </div>

              {/* Alert message */}
              <div className="bg-purple-50 border border-purple-100 rounded-xl p-4 mb-6 flex items-start gap-3">
                <Info className="w-5 h-5 text-purple-600 flex-shrink-0 mt-0.5" />
                <div className="flex flex-col gap-1 text-xs">
                  <span className="font-bold text-purple-900">Weekly Forecast Alert</span>
                  <p className="text-purple-700">
                    Expected **Pistachio Cake** demand spike (+22%) next Thursday due to local holidays. Raw material orders (Pistachios, Flour) should be increased by **45kg** to avoid stockouts.
                  </p>
                </div>
              </div>

              {/* Predictive chart mockup */}
              <div className="flex flex-col gap-2">
                <span className="text-xs font-semibold text-gray-500">Predicted Sales Volume vs Production Orders</span>
                <div className="h-40 w-full flex items-end justify-between gap-1 pt-6 border-b border-gray-100">
                  <div className="w-full bg-gray-100 rounded-t h-16" />
                  <div className="w-full bg-gray-100 rounded-t h-20" />
                  <div className="w-full bg-gray-100 rounded-t h-24" />
                  <div className="w-full bg-purple-400 rounded-t h-28 relative">
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-purple-900 text-white text-[8px] p-1 rounded font-bold">120k</span>
                  </div>
                  <div className="w-full bg-purple-500 rounded-t h-36 relative">
                    <span className="absolute bottom-full left-1/2 -translate-x-1/2 bg-purple-900 text-white text-[8px] p-1 rounded font-bold">Forecast</span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-[10px] text-gray-400 pt-1">
                  <span>Mon</span>
                  <span>Tue</span>
                  <span>Wed</span>
                  <span>Thu (Peak)</span>
                  <span>Fri</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Copy */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <span className="text-xs font-bold uppercase tracking-widest text-purple-600">Futuristic Dashboard Insights</span>
            <h2 className="font-lato font-black text-3xl sm:text-4xl text-brand-dark">CYAI: Predict, optimize, and scale automatically</h2>
            <p className="text-gray-500 text-sm leading-relaxed">
              Don't just record transactions. CYAI forecasts raw materials needs, predicts production yields, warns of shelf-life expiries, and alerts managers about stock shortfalls before they impact retail sales.
            </p>

            <div className="flex flex-col gap-4 mt-2">
              {[
                { title: 'Time-Series Demand Forecasting', desc: 'Predicts item checkouts based on historical trends, weather, and regional holiday calendars.' },
                { title: 'Ingredient Loss & Waste Reductions', desc: 'Calculates factory yield efficiencies and identifies recipe waste discrepancies automatically.' },
                { title: 'Automated Restocking Triggers', desc: 'Monitors minimum reorder thresholds and pushes replenishment recommendations to procurement.' }
              ].map((feat, idx) => (
                <div key={idx} className="flex gap-4">
                  <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600 font-bold text-sm flex-shrink-0">
                    {idx + 1}
                  </div>
                  <div className="flex flex-col gap-1">
                    <h4 className="font-bold text-xs text-brand-dark uppercase tracking-wider">{feat.title}</h4>
                    <p className="text-gray-500 text-xs leading-relaxed">{feat.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 7. Pricing Calculator Section */}
      <section id="pricing" className="py-24 bg-gray-50/50 border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center flex flex-col gap-4 mb-16">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-orange">SaaS Pricing Calculator</span>
            <h2 className="font-lato font-black text-3xl sm:text-4xl text-brand-dark">Calculate your subscription costs live</h2>
            <p className="text-gray-500 max-w-xl mx-auto">Select your region, business parameters, and user count to get instant SaaS pricing.</p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            {/* Left Inputs */}
            <div className="lg:col-span-7 bg-white border border-gray-150 rounded-2xl p-8 shadow-sm flex flex-col gap-6">
              <div className="grid grid-cols-2 gap-6">
                {/* Country */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Select Country</label>
                  <select 
                    value={country} 
                    onChange={e => setCountry(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm font-semibold outline-none focus:border-brand-orange"
                  >
                    <option value="JO">Jordan (JOD)</option>
                    <option value="SA">Saudi Arabia (SAR)</option>
                    <option value="AE">UAE (AED)</option>
                  </select>
                </div>

                {/* Business Type */}
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Business Type</label>
                  <select 
                    value={businessType} 
                    onChange={e => setBusinessType(e.target.value)}
                    className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm font-semibold outline-none focus:border-brand-orange"
                  >
                    <option value="bakery">Bakery & Sweets</option>
                    <option value="restaurant">Restaurant & Food</option>
                    <option value="retail">Retail Store</option>
                    <option value="distribution">Distribution / Warehouse</option>
                  </select>
                </div>
              </div>

              {/* Slider for Branches */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                  <span className="uppercase tracking-wider">Number of Branches</span>
                  <span className="text-brand-orange text-sm font-extrabold">{branches} Branch(es)</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="30" 
                  value={branches} 
                  onChange={e => setBranches(Number(e.target.value))}
                  className="w-full accent-brand-orange"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                  <span>1 Store</span>
                  <span>10 Stores</span>
                  <span>20 Stores</span>
                  <span>30+ (Enterprise)</span>
                </div>
              </div>

              {/* Slider for Users */}
              <div className="flex flex-col gap-3">
                <div className="flex justify-between items-center text-xs font-bold text-gray-500">
                  <span className="uppercase tracking-wider">Number of Users</span>
                  <span className="text-brand-orange text-sm font-extrabold">{users} User(s)</span>
                </div>
                <input 
                  type="range" 
                  min="1" 
                  max="120" 
                  value={users} 
                  onChange={e => setUsers(Number(e.target.value))}
                  className="w-full accent-brand-orange"
                />
                <div className="flex justify-between text-[10px] text-gray-400 font-bold">
                  <span>1 User</span>
                  <span>40 Users</span>
                  <span>80 Users</span>
                  <span>120+ (Enterprise)</span>
                </div>
              </div>
            </div>

            {/* Right Invoice Box */}
            <div className="lg:col-span-5 bg-brand-dark text-white rounded-2xl p-8 flex flex-col gap-6 shadow-xl relative overflow-hidden">
              <div className="absolute top-[-10%] right-[-10%] w-40 h-40 rounded-full bg-brand-orange/10 blur-xl" />
              
              <div className="flex flex-col gap-2">
                <span className="text-[10px] uppercase tracking-widest text-brand-orange font-bold">Recommended Subscription Plan</span>
                <h3 className="font-lato font-black text-2xl">CYShop {selectedPlan}</h3>
              </div>

              <div className="border-y border-white/10 py-6 flex flex-col gap-4">
                <div className="flex justify-between text-xs text-gray-300">
                  <span>Target Branches Scale</span>
                  <span className="font-bold">{branches} Branch(es)</span>
                </div>
                <div className="flex justify-between text-xs text-gray-300">
                  <span>Active Registered Users</span>
                  <span className="font-bold">{users} User(s)</span>
                </div>
                <div className="flex justify-between text-xs text-gray-300">
                  <span>Base Localized Pack</span>
                  <span className="font-bold">{country === 'JO' ? 'Jordanian SSC' : country === 'SA' ? 'Saudi GOSI' : 'UAE WPS'}</span>
                </div>
              </div>

              <div className="flex items-baseline gap-2">
                <span className="text-4xl font-extrabold text-brand-orange">
                  {typeof calculatedPrice === 'number' ? calculatedPrice.toLocaleString() : calculatedPrice}
                </span>
                <span className="text-xs text-gray-400 font-bold uppercase">
                  {typeof calculatedPrice === 'number' ? `${country === 'JO' ? 'JOD' : country === 'SA' ? 'SAR' : 'AED'} / month` : ''}
                </span>
              </div>

              <Link href="#trial" className="w-full py-4 bg-brand-orange hover:bg-brand-orange/90 rounded-xl text-center font-bold text-sm shadow-lg shadow-brand-orange/20 transition-all">
                Provision this Setup Now
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. Free Trial Section (company.cyshop.ai generation) */}
      <section id="trial" className="py-24 max-w-7xl mx-auto px-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 rounded-full bg-brand-blue/5 blur-3xl" />
        
        <div className="max-w-2xl mx-auto bg-white border border-gray-150 rounded-2xl p-8 md:p-12 shadow-xl relative">
          <div className="text-center flex flex-col gap-4 mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-orange">Self-Service Provisioning</span>
            <h2 className="font-lato font-black text-2xl sm:text-3xl text-brand-dark">Launch your free trial instantly</h2>
            <p className="text-gray-500 text-sm leading-relaxed">No sales calls. Input your details to provision a complete, localized CYShop ERP sandbox.</p>
          </div>

          <form onSubmit={handleCreateTrial} className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Company Name</label>
              <input 
                type="text" 
                required 
                placeholder="e.g. Anabtawi Bakery"
                value={trialCompanyName}
                onChange={e => setTrialCompanyName(e.target.value)}
                className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm font-semibold outline-none focus:border-brand-orange"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Default Region</label>
                <select className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm font-semibold outline-none focus:border-brand-orange">
                  <option value="JO">Jordan</option>
                  <option value="SA">Saudi Arabia</option>
                  <option value="AE">UAE</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Primary Scale</label>
                <select className="w-full bg-white border border-gray-200 rounded-lg p-3 text-sm font-semibold outline-none focus:border-brand-orange">
                  <option value="starter">Starter (1 Branch)</option>
                  <option value="growth">Growth (1-5 Branches)</option>
                  <option value="business">Business (5-25 Branches)</option>
                </select>
              </div>
            </div>

            <button type="submit" className="w-full py-4 rounded-xl font-bold bg-brand-dark text-white hover:bg-brand-dark/95 transition-all">
              Initialize ERP Tenant Sandbox
            </button>
          </form>

          {trialSuccessMsg && (
            <div className="mt-8 p-4 bg-green-50 border border-green-200 rounded-xl flex flex-col gap-2 text-xs">
              <span className="font-bold text-green-900 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-green-600" /> {trialSuccessMsg}
              </span>
              <div className="flex items-center gap-2 mt-2">
                <span className="text-gray-500">Your URL:</span>
                <span className="font-mono font-bold text-brand-orange bg-white border border-gray-150 px-2 py-0.5 rounded">
                  {trialSubdomain}
                </span>
              </div>
              <Link href="/app" className="mt-2 text-center text-xs font-bold text-brand-dark hover:underline">
                🚀 Proceed to Tenant login page
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* 9. Footer */}
      <footer className="bg-brand-dark text-gray-400 py-16 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-8 mb-12">
          {/* Brand */}
          <div className="col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-brand-dark to-brand-orange flex items-center justify-center text-white font-extrabold text-sm">
                C
              </div>
              <span className="font-lato font-bold text-lg text-white tracking-tight">CYBERCOM</span>
            </Link>
            <p className="text-xs text-gray-500 leading-relaxed">
              CyberCom Platform LLC. Revolution Through Technology. Developers of CYShop, the leading commerce operating system for regional businesses.
            </p>
          </div>

          {/* Links */}
          {[
            { title: 'Products', links: ['POS & Retail', 'Inventory Systems', 'Manufacturing', 'Accounting'] },
            { title: 'Industries', links: ['Sweets & Bakery', 'Restaurants', 'Fast Food', 'SME Retail'] },
            { title: 'Academy', links: ['SaaS Certifications', 'Partner Portal', 'Support Hub', 'FAQs'] },
            { title: 'Company', links: ['About Us', 'Contact', 'Terms & Privacy', 'CyberCom Web'] }
          ].map((col, idx) => (
            <div key={idx} className="flex flex-col gap-3 text-xs">
              <h4 className="font-bold text-white uppercase tracking-wider mb-1">{col.title}</h4>
              {col.links.map((link, lIdx) => (
                <Link key={lIdx} href="#" className="hover:text-white transition-colors">{link}</Link>
              ))}
            </div>
          ))}
        </div>

        <div className="max-w-7xl mx-auto px-6 border-t border-white/5 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-[10px] text-gray-600 font-bold">
          <span>© 2026 CyberCom Platform. All rights reserved.</span>
          <div className="flex gap-4">
            <Link href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-gray-400 transition-colors">Compliance Map</Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
