import { Expand, Scissors, ShieldCheck, Wind } from 'lucide-react';
import { LIME, features } from './Data';
import { Frame, Heading } from './Ui';
import { useReveal } from './Usereveal';

const icons = { stretch: Expand, wind: Wind, shield: ShieldCheck, scissors: Scissors };

export default function Features() {
  const ref = useReveal<HTMLElement>(0.12);

  return (
    <section ref={ref} className="relative mx-auto max-w-[1280px] px-6 py-16 md:py-24">
      <div data-reveal className="mb-12">
        <Heading kicker="Performance engineering" outline="Built for" solid="zero compromise" />
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((f, i) => {
          const Icon = icons[f.icon as keyof typeof icons];
          return (
            <Frame key={f.title} data-reveal glow size={24} innerClassName="flex flex-col p-6">
              <span
                aria-hidden="true"
                className="font-display pointer-events-none absolute right-4 top-2 select-none text-6xl font-black italic leading-none text-transparent"
                style={{ WebkitTextStroke: '1px rgba(255,255,255,0.1)' }}
              >
                {String(i + 1).padStart(2, '0')}
              </span>

              <div
                className="mb-10 grid h-11 w-11 -skew-x-12 place-items-center text-black"
                style={{ background: LIME }}
              >
                <Icon className="h-5 w-5 skew-x-12" />
              </div>

              <h3 className="font-display text-xl font-black italic uppercase leading-tight text-white">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-white/60">{f.text}</p>

              <div className="mt-auto flex items-center justify-between border-t border-white/10 pt-4 text-[10px] font-bold uppercase tracking-wider">
                <span className="text-white/50">{f.stat}</span>
                <span style={{ color: LIME }}>{f.value}</span>
              </div>
            </Frame>
          );
        })}
      </div>
    </section>
  );
}