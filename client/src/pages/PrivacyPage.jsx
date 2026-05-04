import { Link } from 'react-router-dom';

export default function PrivacyPage() {
  const updated = '4 May 2025';
  return (
    <div className="mx-auto max-w-2xl px-4 py-10 space-y-8 fade-in-up">
      <div>
        <Link to="/" className="text-sm font-semibold text-brand-600 hover:underline">← Back to ITS Diner</Link>
        <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-slate-900">Privacy Policy</h1>
        <p className="mt-1 text-sm text-slate-400">Last updated: {updated}</p>
      </div>

      {[
        {
          title: '1. Who we are',
          body: 'ITS Diner ("we", "us") operates this food ordering application. We are the data controller for personal data processed through this service. For any privacy queries contact us directly via the diner.'
        },
        {
          title: '2. What data we collect',
          body: (
            <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Account data</strong> — name, email address, hashed password, role.</li>
              <li><strong>Order data</strong> — items ordered, total, payment type, timestamps, order reference.</li>
              <li><strong>Guest email</strong> — only collected if you voluntarily enter it at checkout to receive a confirmation. Not used for marketing.</li>
              <li><strong>Loyalty data</strong> — stamp count per registered customer.</li>
              <li><strong>Credit/tab data</strong> — balance and credit limit for customers with an approved tab.</li>
            </ul>
          )
        },
        {
          title: '3. Legal basis for processing',
          body: (
            <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Contract (Art 6(1)(b))</strong> — processing your name, email, and order data to fulfil your order.</li>
              <li><strong>Legitimate interest (Art 6(1)(f))</strong> — order history for business record-keeping and loyalty stamp tracking.</li>
              <li><strong>Consent (Art 6(1)(a))</strong> — guest email collected only with your voluntary input for the purpose of sending a single order confirmation.</li>
            </ul>
          )
        },
        {
          title: '4. How we use your data',
          body: (
            <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-600">
              <li>To process and confirm your order.</li>
              <li>To manage your account, credit tab, and loyalty stamps.</li>
              <li>To send order status notifications (if you have an account).</li>
              <li>We do <strong>not</strong> sell your data, use it for advertising, or share it with third parties except as required by law.</li>
            </ul>
          )
        },
        {
          title: '5. Data retention',
          body: 'Account data is retained until you request deletion. Order records are retained for up to 24 months for business accounting purposes, after which personal identifiers are removed. Guest email addresses are not retained beyond sending the order confirmation.'
        },
        {
          title: '6. Your rights (GDPR)',
          body: (
            <ul className="mt-2 list-disc pl-5 space-y-1 text-slate-600">
              <li><strong>Right of access</strong> — download a copy of all your data from the Account page.</li>
              <li><strong>Right to rectification</strong> — contact us to correct inaccurate data.</li>
              <li><strong>Right to erasure</strong> — delete your account and associated personal data from the Account page at any time.</li>
              <li><strong>Right to restriction</strong> — contact us to restrict processing.</li>
              <li><strong>Right to portability</strong> — your data export is provided in machine-readable JSON format.</li>
              <li><strong>Right to object</strong> — contact us to object to any processing based on legitimate interest.</li>
              <li><strong>Right to lodge a complaint</strong> — you may complain to the UK Information Commissioner's Office (ICO) at <a href="https://ico.org.uk" className="underline text-brand-600" target="_blank" rel="noreferrer">ico.org.uk</a>.</li>
            </ul>
          )
        },
        {
          title: '7. Security',
          body: 'Passwords are stored as cryptographic hashes and never in plain text. Data is held on the operator\'s server and is not transmitted to third-party analytics or advertising platforms.'
        },
        {
          title: '8. Changes to this policy',
          body: 'We may update this policy from time to time. The date at the top of this page will reflect any changes. Continued use of the service after changes constitutes acceptance.'
        },
      ].map(({ title, body }) => (
        <section key={title} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm space-y-1">
          <h2 className="font-extrabold text-slate-900">{title}</h2>
          {typeof body === 'string' ? <p className="text-sm text-slate-600">{body}</p> : body}
        </section>
      ))}

      <p className="text-xs text-slate-400 text-center pb-6">© ITS Diner. All rights reserved.</p>
    </div>
  );
}
