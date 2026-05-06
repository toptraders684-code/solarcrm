import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  ArrowRight, CheckCircle2, Users, FileText, CreditCard,
  Truck, BarChart2, ClipboardList, Zap, Shield, Clock,
  MapPin, Building2, TrendingUp, Award,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';

const FEATURES = [
  {
    icon: FileText,
    title: 'Lead Capture & Tracking',
    desc: 'Capture walk-in, referral, and online leads. Assign to field staff, schedule follow-ups, and track conversion.',
    iconStyle: { background: 'rgba(59,130,246,0.12)', color: '#3b82f6' },
  },
  {
    icon: ClipboardList,
    title: '9-Stage Project Lifecycle',
    desc: 'From Survey to Netmeter, manage every stage — DISCOM submission, JE inspection, installation, and subsidy.',
    iconStyle: { background: 'rgba(139,92,246,0.12)', color: '#8b5cf6' },
  },
  {
    icon: FileText,
    title: 'DISCOM Documentation',
    desc: 'Auto-generate DISCOM-specific documents. Upload KYC, technical drawings, and track approval status.',
    iconStyle: { background: 'rgba(245,158,11,0.12)', color: '#f59e0b' },
  },
  {
    icon: CreditCard,
    title: 'Finance & Subsidy',
    desc: 'Record customer receipts, vendor payments, and subsidy disbursals. Approval workflow with full audit trail.',
    iconStyle: { background: 'rgba(0,109,55,0.12)', color: '#006d37' },
  },
  {
    icon: Truck,
    title: 'Vendor & Partner Network',
    desc: 'Manage Channel, Installation, Transport, Insurance, and Netmeter partners with empanelment tracking.',
    iconStyle: { background: 'rgba(249,115,22,0.12)', color: '#f97316' },
  },
  {
    icon: BarChart2,
    title: 'Reports & Analytics',
    desc: 'Project profitability, subsidy tracker, ageing reports, and district-wise performance dashboards.',
    iconStyle: { background: 'rgba(239,68,68,0.12)', color: '#ef4444' },
  },
];

const STEPS = [
  { num: '01', title: 'Capture Lead', desc: 'Walk-in, referral, or camp — every inquiry is logged with source, location, and assigned staff.' },
  { num: '02', title: 'Convert to Project', desc: 'After site survey, convert the lead to a project. All documents and timeline start here.' },
  { num: '03', title: 'Track Every Stage', desc: 'Move through 9 stages — DISCOM submission to netmeter installation — with checklists at each step.' },
  { num: '04', title: 'Close & Report', desc: 'Record subsidy, generate reports, and analyse project profitability by district and DISCOM.' },
];

const STATS = [
  { value: '500+', label: 'Projects Managed', icon: Building2 },
  { value: '4', label: 'DISCOMs Supported', icon: Zap },
  { value: '₹5Cr+', label: 'Subsidy Processed', icon: TrendingUp },
  { value: '30+', label: 'Districts Covered', icon: MapPin },
];

const DISCOMS = ['TPCODL', 'TPNODL', 'TPSODL', 'TPWODL'];

export default function LandingPage() {
  const { user } = useAuthStore();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true });
  }, [user, navigate]);

  return (
    <div className="min-h-screen overflow-x-hidden" style={{ backgroundColor: '#ffffff', color: '#191c1e' }}>

      {/* ── Navbar ─────────────────────────────────────────── */}
      <nav style={{ backgroundColor: 'rgba(255,255,255,0.92)', borderBottom: '1px solid rgba(187,203,187,0.4)' }}
        className="sticky top-0 z-50 w-full backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/images/solar.png" alt="Usolar CRM" className="w-8 h-8 object-contain rounded-lg" />
            <div>
              <p className="text-sm font-black leading-none" style={{ color: '#191c1e' }}>Usolar CRM</p>
              <p className="text-[9px] uppercase tracking-widest" style={{ color: '#aab8ab' }}>Solar EPC Platform</p>
            </div>
          </div>
          <Link
            to="/login"
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 shadow-sm"
            style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}
          >
            Login <ArrowRight size={14} />
          </Link>
        </div>
      </nav>

      {/* ── Hero ───────────────────────────────────────────── */}
      <section className="relative pt-20 pb-16 px-6"
        style={{ background: 'linear-gradient(180deg, rgba(255,152,117,0.08) 0%, #ffffff 80%)' }}>
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(251,191,36,0.14) 0%, transparent 70%)' }} />
        <div className="absolute bottom-0 left-0 w-72 h-72 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(ellipse, rgba(249,115,22,0.07) 0%, transparent 70%)' }} />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-2 gap-14 items-center">
            {/* Text */}
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-6"
                style={{ border: '1px solid rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.08)', color: '#c2440e' }}>
                <Zap size={11} />
                Built for Odisha Solar EPC Companies
              </div>
              <h1 className="text-4xl md:text-5xl font-black leading-tight mb-5" style={{ color: '#191c1e' }}>
                Complete Solar EPC{' '}
                <span style={{ background: 'linear-gradient(90deg, #f97316, #fbbf24)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                  Management
                </span>
                , Simplified
              </h1>
              <p className="text-lg leading-relaxed mb-8 max-w-lg" style={{ color: '#5a6b5b' }}>
                From first lead to final subsidy — manage your entire rooftop solar project lifecycle in one platform. Built for DISCOM workflows across Odisha.
              </p>
              <div className="flex flex-wrap gap-4">
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:opacity-90 hover:scale-[1.02] shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}
                >
                  Get Started <ArrowRight size={15} />
                </Link>
                <a
                  href="#features"
                  className="flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold transition-colors"
                  style={{ color: '#3d4a3e', border: '1px solid rgba(187,203,187,0.6)', background: '#f7f9fb' }}
                >
                  See Features
                </a>
              </div>
              {/* Trust badges */}
              <div className="flex flex-wrap gap-4 mt-8">
                {[
                  { icon: Shield, text: 'DPDP Compliant' },
                  { icon: CheckCircle2, text: 'DISCOM Ready' },
                  { icon: Award, text: 'PM-KUSUM Workflow' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-xs font-semibold" style={{ color: '#5a6b5b' }}>
                    <Icon size={13} style={{ color: '#f97316' }} />
                    {text}
                  </div>
                ))}
              </div>
            </div>

            {/* Hero illustration */}
            <div className="relative">
              <div className="rounded-2xl overflow-hidden shadow-2xl"
                style={{ border: '1px solid rgba(187,203,187,0.4)', background: 'linear-gradient(135deg, #0f172a, #1e3a5f)' }}>
                <img src="/images/solar-hero.svg" alt="Solar rooftop management" className="w-full" />
              </div>
              {/* Floating badges */}
              <div className="absolute -bottom-4 -left-4 rounded-xl px-4 py-3 shadow-lg"
                style={{ background: '#ffffff', border: '1px solid rgba(187,203,187,0.5)' }}>
                <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#aab8ab' }}>Live Generation</p>
                <p className="text-xl font-black" style={{ color: '#22c55e' }}>4.2 kW</p>
              </div>
              <div className="absolute -top-4 -right-4 rounded-xl px-4 py-3 shadow-lg"
                style={{ background: '#ffffff', border: '1px solid rgba(187,203,187,0.5)' }}>
                <p className="text-[10px] uppercase tracking-widest font-bold" style={{ color: '#aab8ab' }}>Stage</p>
                <p className="text-sm font-black" style={{ color: '#191c1e' }}>Netmeter Done</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── DISCOM strip ───────────────────────────────────── */}
      <section className="py-8" style={{ borderTop: '1px solid rgba(187,203,187,0.3)', borderBottom: '1px solid rgba(187,203,187,0.3)', backgroundColor: '#f7f9fb' }}>
        <div className="max-w-4xl mx-auto px-6">
          <div className="flex flex-wrap items-center justify-center gap-8">
            <p className="text-xs uppercase tracking-widest font-bold" style={{ color: '#aab8ab' }}>Supports all Odisha DISCOMs</p>
            {DISCOMS.map((d) => (
              <div key={d} className="flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm"
                style={{ border: '1px solid rgba(187,203,187,0.5)', background: '#ffffff' }}>
                <Zap size={12} style={{ color: '#f59e0b' }} />
                <span className="text-sm font-black tracking-wide" style={{ color: '#3d4a3e' }}>{d}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Stats ──────────────────────────────────────────── */}
      <section className="py-16 px-6" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-6">
          {STATS.map(({ value, label, icon: Icon }) => (
            <div key={label} className="text-center p-6 rounded-2xl shadow-sm hover:shadow-md transition-shadow"
              style={{ border: '1px solid rgba(187,203,187,0.3)', backgroundColor: '#ffffff' }}>
              <div className="w-11 h-11 rounded-xl mx-auto mb-3 flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(251,191,36,0.08))' }}>
                <Icon size={20} style={{ color: '#f97316' }} />
              </div>
              <p className="text-3xl font-black mb-1" style={{ color: '#191c1e' }}>{value}</p>
              <p className="text-xs font-semibold uppercase tracking-widest" style={{ color: '#aab8ab' }}>{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ───────────────────────────────────────── */}
      <section id="features" className="py-16 px-6" style={{ backgroundColor: '#f7f9fb' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#f97316' }}>Everything You Need</p>
            <h2 className="text-3xl md:text-4xl font-black" style={{ color: '#191c1e' }}>Built for the full solar project journey</h2>
            <p className="mt-3 max-w-xl mx-auto" style={{ color: '#5a6b5b' }}>
              Every feature designed around how Odisha solar EPC companies actually work — from DISCOM paperwork to subsidy collection.
            </p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {FEATURES.map(({ icon: Icon, title, desc, iconStyle }) => (
              <div key={title}
                className="p-6 rounded-2xl hover:shadow-md transition-all hover:-translate-y-0.5"
                style={{ border: '1px solid rgba(187,203,187,0.4)', backgroundColor: '#ffffff' }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={iconStyle}>
                  <Icon size={18} />
                </div>
                <h3 className="font-bold mb-2 text-sm" style={{ color: '#191c1e' }}>{title}</h3>
                <p className="text-sm leading-relaxed" style={{ color: '#5a6b5b' }}>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ───────────────────────────────────── */}
      <section className="py-16 px-6" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-12">
            <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#f97316' }}>Workflow</p>
            <h2 className="text-3xl font-black" style={{ color: '#191c1e' }}>How it works</h2>
            <p className="mt-3 max-w-lg mx-auto" style={{ color: '#5a6b5b' }}>
              Four simple steps from first contact to completed solar installation.
            </p>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            {STEPS.map(({ num, title, desc }, i) => (
              <div key={num} className="relative">
                {i < STEPS.length - 1 && (
                  <div className="hidden md:block absolute top-6 left-full w-full h-px z-0"
                    style={{ borderTop: '2px dashed rgba(249,115,22,0.25)' }} />
                )}
                <div className="relative z-10">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4 font-black text-sm"
                    style={{ border: '1px solid rgba(249,115,22,0.3)', background: 'rgba(249,115,22,0.07)' }}>
                    <span className="font-black" style={{ color: '#f97316' }}>{num}</span>
                  </div>
                  <h3 className="font-bold text-sm mb-2" style={{ color: '#191c1e' }}>{title}</h3>
                  <p className="text-xs leading-relaxed" style={{ color: '#5a6b5b' }}>{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Role access strip ──────────────────────────────── */}
      <section className="py-12 px-6" style={{ backgroundColor: '#f7f9fb', borderTop: '1px solid rgba(187,203,187,0.3)', borderBottom: '1px solid rgba(187,203,187,0.3)' }}>
        <div className="max-w-4xl mx-auto">
          <p className="text-center text-xs uppercase tracking-widest font-bold mb-6" style={{ color: '#aab8ab' }}>Role-based access for your entire team</p>
          <div className="flex flex-wrap justify-center gap-3">
            {['Admin', 'Operations Staff', 'Field Technician', 'Finance Manager', 'Vendor'].map((role) => (
              <div key={role} className="flex items-center gap-2 px-4 py-2 rounded-full shadow-sm"
                style={{ border: '1px solid rgba(187,203,187,0.5)', background: '#ffffff' }}>
                <Users size={11} style={{ color: '#f97316' }} />
                <span className="text-xs font-semibold" style={{ color: '#3d4a3e' }}>{role}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────────── */}
      <section className="py-20 px-6" style={{ backgroundColor: '#ffffff' }}>
        <div className="max-w-3xl mx-auto text-center">
          <div className="p-12 rounded-3xl relative overflow-hidden shadow-xl"
            style={{ background: 'linear-gradient(135deg, #f97316, #fbbf24)' }}>
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: 'radial-gradient(circle at 20% 20%, white 1px, transparent 1px), radial-gradient(circle at 80% 80%, white 1px, transparent 1px)', backgroundSize: '30px 30px' }} />
            <div className="relative">
              <img src="/images/solar.png" alt="Usolar CRM" className="w-16 h-16 object-contain mx-auto mb-5" />
              <h2 className="text-3xl font-black text-white mb-3">Ready to go digital?</h2>
              <p className="mb-8 max-w-md mx-auto text-sm leading-relaxed" style={{ color: 'rgba(255,255,255,0.82)' }}>
                Join solar EPC companies across Odisha managing their complete project lifecycle with Usolar CRM.
              </p>
              <Link
                to="/login"
                className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl text-sm font-bold transition-all hover:shadow-lg hover:scale-[1.02]"
                style={{ background: '#ffffff', color: '#c2440e' }}
              >
                Login to your account <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ─────────────────────────────────────────── */}
      <footer className="py-10 px-6" style={{ backgroundColor: '#111714' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <img src="/images/solar.png" alt="Usolar" className="w-7 h-7 object-contain rounded-lg" />
            <span className="text-sm font-black text-white">Usolar CRM</span>
          </div>
          <div className="flex items-center gap-6">
            <span className="text-xs flex items-center gap-1.5" style={{ color: '#7a8f7b' }}>
              <Clock size={11} />
              Solar EPC Management Platform
            </span>
            <span className="text-xs flex items-center gap-1.5" style={{ color: '#7a8f7b' }}>
              <MapPin size={11} />
              Odisha, India
            </span>
          </div>
          <p className="text-xs" style={{ color: '#5a6b5b' }}>&copy; {new Date().getFullYear()} Usolar CRM. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
