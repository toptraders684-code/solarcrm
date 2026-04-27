import { useState } from 'react';
import { ChevronDown, ChevronUp, Phone, Mail, MessageCircle, FileText, Sun, Zap, Shield, CreditCard } from 'lucide-react';
import { PageWrapper } from '@/components/shared/PageWrapper';

const FAQS = [
  {
    q: 'How do I add a new solar lead?',
    a: 'Go to Leads → click "Add Lead" on the top right. Fill in the customer name, mobile number, DISCOM, and lead source. You can also bulk import leads using the "Bulk Import" button with a CSV or Excel file.',
  },
  {
    q: 'How do I convert a lead into a project?',
    a: 'Open the lead detail page, then click "Convert to Project" button. This creates a new project (applicant record) with all the customer details carried over and sets the lead status to Converted.',
  },
  {
    q: 'What are the 11 project stages?',
    a: 'Stage 1: Document Collection → Stage 2: Site Survey → Stage 3: Technical Design → Stage 4: Portal Application → Stage 5: MRT → Stage 6: JE Inspection → Stage 7: DISCOM Approval → Stage 8: Material Procurement → Stage 9: Installation → Stage 10: Commissioning → Stage 11: Subsidy Claim.',
  },
  {
    q: 'How do I advance a project to the next stage?',
    a: 'Go to the project detail page → DISCOM tab. The stage action panel at the top shows what is required. Fill in any mandatory fields (e.g. MRT date, inspection result), then click the "Advance Stage" button.',
  },
  {
    q: 'How do I record a payment from a customer?',
    a: 'Open the project → Finance tab → click "Add Transaction". Select type "Customer Receipt", enter the amount, payment method, and date. Transactions pending approval will show as "Pending Approval" until a Finance Manager approves them.',
  },
  {
    q: 'How does the subsidy claim process work?',
    a: 'Once installation is commissioned (Stage 10), the project moves to Stage 11: Subsidy Claim. Go to the Checklist tab and complete all items in the Subsidy Claim phase, including confirming that the subsidy amount has been credited to the customer bank account (mandatory).',
  },
  {
    q: 'How do I reassign a lead to a different staff member?',
    a: 'On the Leads list, hover over the staff name in the "Assigned" column — a pencil icon appears. Click it to open the reassign dialog and select a new staff member.',
  },
  {
    q: 'What file formats are accepted for bulk lead import?',
    a: 'CSV (.csv), Excel (.xlsx), and older Excel (.xls) formats are accepted. Download the template first from Leads → Bulk Import → Step 1 to ensure your columns match.',
  },
  {
    q: 'How do I upload KYC documents for a project?',
    a: 'Go to the project detail page → Documents tab. Click "Upload Document", select the document type (Aadhaar, PAN, electricity bill, etc.), and choose your file. Supported formats: PDF, JPG, PNG up to 2MB.',
  },
  {
    q: 'Who can approve financial transactions?',
    a: 'Only users with the Finance Manager or Admin role can approve transactions. Operations Staff can add transactions but they go into "Pending Approval" status until reviewed.',
  },
];

const QUICK_LINKS = [
  { icon: Sun, label: 'PM Surya Ghar Portal', desc: 'National portal for subsidy applications', url: 'https://pmsuryaghar.gov.in' },
  { icon: Zap, label: 'TPCODL Portal', desc: 'TP Central Odisha Distribution Ltd', url: 'https://tpcodl.com' },
  { icon: Zap, label: 'TPNODL Portal', desc: 'TP Northern Odisha Distribution Ltd', url: 'https://tpnodl.in' },
  { icon: Zap, label: 'TPSODL Portal', desc: 'TP Southern Odisha Distribution Ltd', url: 'https://tpsodl.in' },
  { icon: Zap, label: 'TPWODL Portal', desc: 'TP Western Odisha Distribution Ltd', url: 'https://tpwodl.in' },
  { icon: Shield, label: 'MNRE Guidelines', desc: 'Ministry of New & Renewable Energy', url: 'https://mnre.gov.in' },
  { icon: CreditCard, label: 'SBI Solar Loan', desc: 'SBI Green Home Loan for rooftop solar', url: 'https://sbi.co.in' },
  { icon: FileText, label: 'CEIG Standards', desc: 'Central Electricity Inspectorate Guidelines', url: '#' },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-surface-container-low rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-surface-container-low/40 transition-colors"
      >
        <span className="text-sm font-semibold text-on-surface pr-4">{q}</span>
        {open ? <ChevronUp size={16} className="text-primary flex-shrink-0" /> : <ChevronDown size={16} className="text-on-surface-variant/50 flex-shrink-0" />}
      </button>
      {open && (
        <div className="px-5 pb-4 text-sm text-on-surface-variant leading-relaxed border-t border-surface-container-low">
          <p className="pt-3">{a}</p>
        </div>
      )}
    </div>
  );
}

export default function SupportPage() {
  return (
    <PageWrapper title="Support" subtitle="Help, FAQs, and quick links for Suryam Solar CRM">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* FAQ — left 2/3 */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50 mb-4">Frequently Asked Questions</h2>
          {FAQS.map((faq, i) => <FaqItem key={i} q={faq.q} a={faq.a} />)}
        </div>

        {/* Right column */}
        <div className="space-y-5">

          {/* Contact */}
          <div className="bg-surface-container-lowest rounded-xl p-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50 mb-4">Contact Support</h2>
            <div className="space-y-3">
              <a href="tel:+916370000000" className="flex items-center gap-3 text-sm text-on-surface-variant hover:text-primary transition-colors">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Phone size={15} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-on-surface">+91 63700 00000</p>
                  <p className="text-xs text-on-surface-variant/60">Mon–Sat, 9 AM – 6 PM</p>
                </div>
              </a>
              <a href="mailto:support@suryamsolar.in" className="flex items-center gap-3 text-sm text-on-surface-variant hover:text-primary transition-colors">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Mail size={15} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-on-surface">support@suryamsolar.in</p>
                  <p className="text-xs text-on-surface-variant/60">Response within 24 hours</p>
                </div>
              </a>
              <a href="https://wa.me/916370000000" target="_blank" rel="noreferrer" className="flex items-center gap-3 text-sm text-on-surface-variant hover:text-primary transition-colors">
                <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                  <MessageCircle size={15} className="text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-on-surface">WhatsApp Support</p>
                  <p className="text-xs text-on-surface-variant/60">Quick queries & screenshots</p>
                </div>
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div className="bg-surface-container-lowest rounded-xl p-5">
            <h2 className="text-xs font-black uppercase tracking-widest text-on-surface-variant/50 mb-4">Quick Links</h2>
            <div className="space-y-2">
              {QUICK_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.url}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-surface-container-low transition-colors group"
                >
                  <div className="w-7 h-7 bg-secondary-container rounded-lg flex items-center justify-center flex-shrink-0">
                    <link.icon size={13} className="text-on-secondary-fixed-variant" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-on-surface group-hover:text-primary transition-colors truncate">{link.label}</p>
                    <p className="text-[10px] text-on-surface-variant/60 truncate">{link.desc}</p>
                  </div>
                </a>
              ))}
            </div>
          </div>

          {/* App version */}
          <div className="bg-surface-container-lowest rounded-xl p-4 text-center">
            <div className="w-10 h-10 signature-gradient rounded-xl flex items-center justify-center mx-auto mb-2 shadow-sm">
              <Sun size={20} className="text-white" />
            </div>
            <p className="text-sm font-black text-primary">Suryam Solar CRM</p>
            <p className="text-xs text-on-surface-variant/60 mt-0.5">Version 1.0.0 · Build 2026</p>
          </div>
        </div>
      </div>
    </PageWrapper>
  );
}
