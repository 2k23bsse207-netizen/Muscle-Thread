
import { useState, type FormEvent } from 'react'
import { LIME } from '../theme'

const FOOTER_GROUPS = [
  {
    title: 'PRODUCTS',
    links: [
      'Men’s Training',
      'Women’s Kinetic',
      'New Releases',
      'Volt Performance',
    ],
    hrefs: ['#men', '#women', '#new-arrivals', '#accessories'],
  },
  {
    title: 'ATHLETE CARE',
    links: [
      'Order Tracking',
      'Returns Portal',
      'Size Advisory',
      'Contact HQ',
    ],
    hrefs: ['#tracking', '#returns', '#size-guide', '#contact'],
  },
  {
    title: 'SYSTEM',
    links: [
      'Athlete Collective',
      'Engineering Specs',
      'Privacy Policy',
      'Terms of Utility',
    ],
    hrefs: ['#community', '#about', '#privacy', '#terms'],
  },
]

export default function Footer() {
  const [email, setEmail] = useState('')
  const [subscribed, setSubscribed] = useState(false)

  const handleSubscribe = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!email.trim()) return

    setSubscribed(true)
    setEmail('')
  }

  return (
    <footer
      className="w-full"
      style={{ backgroundColor: '#F7F5EF', color: '#25261F' }}
    >
      <div className="mx-auto max-w-[1600px] px-6 pb-7 pt-14 sm:px-10 lg:px-[58px] lg:pt-[76px]">

        {/* Main footer layout */}
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-[1.8fr_0.85fr_0.85fr_0.9fr] lg:gap-10">

          {/* Brand and newsletter */}
          <div className="max-w-[620px]">
            {/* Logo */}
            <a
              href="/"
              className="inline-flex items-center gap-2"
              aria-label="MOVE Lab home"
            >
              <span className="font-display text-[32px] font-black italic leading-none tracking-[-0.08em]">
                MOVE
              </span>
              <span
                className="rounded-[2px] px-[7px] py-[4px] text-[11px] font-black tracking-[0.12em]"
                style={{ backgroundColor: LIME, color: '#25261F' }}
              >
                LAB
              </span>
            </a>

            {/* Brand description */}
            <p className="mt-7 max-w-[475px] text-[15px] leading-[1.65] tracking-[0.005em] text-[#555747] sm:text-[16px]">
              MOVE is more than a brand. It’s a commitment to become better,
              stronger, and bolder. Built for high-velocity athletes demanding
              precision technical performance.
            </p>

            {/* Newsletter */}
            <div className="mt-8 max-w-[620px]">
              <h3 className="mb-2 text-[12px] font-bold uppercase tracking-[0.09em]">
                Priority Dispatch List
              </h3>

              <form
                onSubmit={handleSubscribe}
                className="flex h-[47px] w-full overflow-hidden rounded-[5px]"
                style={{ backgroundColor: '#E8E6DE' }}
              >
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="ENTER YOUR EMAIL"
                  aria-label="Your email address"
                  className="min-w-0 flex-1 bg-transparent px-5 text-[12px] font-bold tracking-[0.12em] text-[#35372D] outline-none placeholder:text-[#555747]"
                />

                <button
                  type="submit"
                  aria-label="Subscribe"
                  className="flex w-[68px] shrink-0 items-center justify-center transition-opacity hover:opacity-80"
                  style={{ backgroundColor: LIME }}
                >
                  <svg
                    width="21"
                    height="21"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#25261F"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M5 12h14M12 5l7 7-7 7" />
                  </svg>
                </button>
              </form>

              {subscribed && (
                <p className="mt-2 text-xs font-medium text-[#555747]">
                  You're on the list. Welcome to MOVE.
                </p>
              )}
            </div>
          </div>

          {/* Navigation columns */}
          {FOOTER_GROUPS.map((group) => (
            <div key={group.title}>
              <h3 className="mb-7 text-[13px] font-extrabold tracking-[0.12em]">
                {group.title}
              </h3>

              <ul className="space-y-[17px]">
                {group.links.map((link, index) => (
                  <li key={link}>
                    <a
                      href={group.hrefs[index]}
                      className="group inline-flex items-center gap-2 text-[15px] text-[#555747] transition-colors duration-200 hover:text-[#25261F]"
                    >
                      {group.title === 'PRODUCTS' && (
                        <span className="text-[11px] font-bold tracking-[0.1em] text-[#898A78]">
                          0{index + 1}
                        </span>
                      )}
                      <span className="border-b border-transparent transition-colors group-hover:border-current">
                        {link}
                      </span>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom information bar */}
        <div className="mt-[76px] flex flex-col gap-5 border-t border-[#292B25]/15 pt-6 lg:flex-row lg:items-center lg:justify-between">

          <div className="flex flex-wrap items-center gap-x-5 gap-y-3 text-[10px] font-bold uppercase tracking-[0.16em] text-[#555747] sm:text-[11px]">
            <span>© {new Date().getFullYear()} MOVE Athletic Co. All rights reserved.</span>
            <span className="hidden sm:inline">•</span>
            <span>Engineered for velocity</span>
          </div>

          <div className="flex flex-wrap items-center gap-x-7 gap-y-3 text-[10px] font-bold uppercase tracking-[0.15em] text-[#555747] sm:text-[11px]">
            <span className="inline-flex items-center gap-2">
              <span
                className="h-[9px] w-[9px] rounded-full"
                style={{ backgroundColor: LIME }}
              />
              System operational
            </span>

            <span>Region: Global (USD)</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
