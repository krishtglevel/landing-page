import Image from 'next/image';
import FloatingButtons from './FloatingButtons';

const detailLinks = [
  "Standard Do's & Don'ts",
  'Refund Policy',
  'Privacy Policy',
  'Terms & Conditions',
  'User Consent',
  'Registered Research Analyst',
  'Disclaimer & Disclosure',
  'AD Disclaimer',
  'Investor Charter',
  'Press Release',
  'Escalation Matrix',
  'Grievance Redressal Process',
];

const addressBlocks = [
  {
    title: '1. Correspondence Address',
    body: 'B Wing, Rupa Solitaire, MBP, Sector 2, Ghansoli, Navi Mumbai.',
  },
  {
    title: '2. Registered Address',
    body: 'Sector 8, Airoli, Navi Mumbai.',
  },
  {
    title: '3. SEBI Registered Address',
    body: 'Plot no. C4-A, G Block, BKC, Bandra(East), Mumbai- 400051, Maharashtra',
  },
];

const contactInfo = [
  'Type of Registration - Proprietorship',
  "License Holder's Name – Mr. Tushar Ghone",
  'SEBI Registration No: INH000008491',
  'Validity Of Registration - Perpetual',
  'Email: tushar009@yahoo.com',
  'Contact: +8108912941',
  'Mon - Sat: 9.00 AM - 6.00 PM',
  'Ghansoli, Navi Mumbai- 400709',
];

const CheckIcon = () => (
  <span className="flex-shrink-0 text-[15px] leading-5 text-white" aria-hidden="true">
    &#10004;
  </span>
);

const SectionHeading = ({ children }: { children: React.ReactNode }) => (
  <h3 className="mb-4 text-lg font-bold text-white">{children}</h3>
);

export default function Footer() {
  return (
    <footer className="w-full bg-black text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6">
        <div className="grid grid-cols-1 gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand */}
          <div className="lg:col-span-3 sm:col-span-2 flex flex-col items-center sm:items-start text-center sm:text-left">
            <Image
              src="/img.png"
              alt="TG Levels"
              width={160}
              height={48}
              className="h-auto w-40"
            />
            <p className="mt-3 text-sm leading-6 text-gray-300">
              TG levels is managed by SEBI registered Research Analyst based in
              Mumbai, TG levels is incorporated by individuals having experience
              in the Indian stock market, at TG levels the only objective is to
              give our subscribers quality advice for intraday and positional
              trading.
            </p>
            <div className="mt-5 flex flex-row flex-nowrap items-center justify-center sm:justify-start gap-3 w-full">
              <a
                href="https://apps.apple.com/us/app/tg-levels-stock-market-mentor/id6754587128"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Download on the App Store"
                className="inline-flex items-center justify-start gap-1.5 w-[135px] h-[40px] rounded-[6px] bg-white border border-black text-black px-2.5 hover:bg-zinc-50 transition-colors flex-shrink-0"
              >
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-5.5 w-5.5 text-black flex-shrink-0" aria-hidden="true">
                  <path d="M16.365 1.43c0 1.14-.42 2.2-1.12 2.98-.84.95-2.21 1.68-3.34 1.59-.14-1.12.42-2.3 1.07-3.03.74-.84 2.07-1.47 3.21-1.54.02.01.18.01.18 0zM20.6 17.07c-.55 1.27-.81 1.84-1.52 2.97-.99 1.57-2.38 3.52-4.1 3.54-1.53.01-1.92-.99-4-.98-2.08.01-2.51 1-4.04.99-1.72-.02-3.04-1.78-4.03-3.35-2.77-4.39-3.06-9.54-1.35-12.28.96-1.57 2.48-2.49 3.91-2.49 1.46 0 2.38 1 3.59 1 1.17 0 1.88-1 3.57-1 1.28 0 2.63.7 3.6 1.9-3.16 1.73-2.65 6.24.37 7.69z" />
                </svg>
                <span className="flex flex-col text-left leading-none">
                  <span className="text-[8px] font-medium text-black tracking-tight mb-[2px]">Download on the</span>
                  <span className="text-[13px] font-bold text-black tracking-tight">App Store</span>
                </span>
              </a>
              <a
                href="https://play.google.com/store/apps/details?id=com.tglevels.user&hl=en_IN"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Get it on Google Play"
                className="inline-flex items-center justify-start gap-2 w-[138px] h-[40px] rounded-[10px] bg-white border border-black text-black px-2.5 hover:bg-zinc-50 transition-colors flex-shrink-0"
              >
                <svg viewBox="0 0 24 24" className="h-5.5 w-5.5 flex-shrink-0" aria-hidden="true">
                  <path fill="#00d2ff" d="M3.6 2.2C3.3 2.5 3.1 3 3.1 3.6v16.8c0 .6.2 1.1.5 1.4l.1.1L13 12.6v-.2L3.6 2.2z" />
                  <path fill="#00f076" d="M16.3 15.9l-3.3-3.3v-.2l3.3-3.3.1.1 3.9 2.2c1.1.6 1.1 1.6 0 2.3l-3.9 2.2-.1z" />
                  <path fill="#fc4f4f" d="M16.4 15.8L13 12.4 3.6 21.8c.4.4 1 .4 1.7.1l11.1-6.1z" />
                  <path fill="#ffce00" d="M16.4 9L5.3 2.9c-.7-.4-1.3-.3-1.7.1L13 12.4 16.4 9z" />
                </svg>
                <span className="flex flex-col text-left leading-none">
                  <span className="text-[7.5px] uppercase font-bold text-black tracking-wider mb-[2.5px]">GET IT ON</span>
                  <span className="text-[13px] font-bold text-black tracking-tight">Google Play</span>
                </span>
              </a>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2">
            <SectionHeading>Details</SectionHeading>
            <ul className="space-y-2 text-sm">
              {detailLinks.map((link) => (
                <li key={link}>
                  <a href="#" className="flex items-center gap-2 text-white transition hover:text-green-400">
                    <CheckIcon />
                    <span>{link}</span>
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Our Packages */}
          <div className="lg:col-span-2">
            <SectionHeading>Our Packages</SectionHeading>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="#" className="flex items-center gap-2 text-white transition hover:text-green-400">
                  <CheckIcon />
                  <span>Our Plans</span>
                </a>
              </li>
            </ul>
          </div>

          {/* Address */}
          <div className="lg:col-span-2">
            <SectionHeading>Address</SectionHeading>
            <div className="space-y-3 text-sm">
              {addressBlocks.map((block) => (
                <div key={block.title}>
                  <p className="font-bold text-white">{block.title}</p>
                  <p className="mt-1 leading-6 text-gray-300">{block.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Contact Us */}
          <div className="lg:col-span-3">
            <SectionHeading>Contact Us</SectionHeading>
            <ul className="space-y-1.5 text-sm leading-6 text-gray-300">
              {contactInfo.map((info) => (
                <li key={info} className="whitespace-nowrap">{info}</li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Risk Disclosures */}
      <div className="w-full bg-white text-gray-700">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
          <h3 className="mb-5 text-xl font-bold text-black">Risk Disclosures!</h3>
          <ol className="list-decimal space-y-3 pl-6 text-[13px] leading-6 text-gray-600 marker:text-gray-500">
            <li>
              &ldquo;Registration granted by SEBI, Enlistment as RA with Exchange
              and certification from NISM in no way guarantee performance of the
              intermediary or provide any assurance of returns to investors.&rdquo;
            </li>
            <li>
              Investments in the market are subject to market risk. Please read
              all related documents carefully before investing
            </li>
          </ol>
        </div>
      </div>

      {/* Copyright */}
      <div className="w-full bg-black border-t border-zinc-800">
        <div className="mx-auto max-w-7xl px-4 py-6 text-center text-sm leading-relaxed text-white sm:px-6">
          <p>Copyright &copy;{new Date().getFullYear()} by TGLevel. All Rights Reserved.</p>
        </div>
      </div>

      <FloatingButtons />
    </footer>
  );
}
