import { useEffect, useRef, useState, useCallback } from 'react'

// ─── Hooks ────────────────────────────────────────────────────────────────────

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLElement>(null)
  const [inView, setInView] = useState(false)
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setInView(true); obs.disconnect() } },
      { threshold }
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [threshold])
  return [ref, inView] as const
}

function useReveal() {
  useEffect(() => {
    const els = document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target) }
      }),
      { threshold: 0.08 }
    )
    els.forEach(el => obs.observe(el))
    return () => obs.disconnect()
  }, [])
}

function useScrollSpy(ids: string[]) {
  const [active, setActive] = useState('')
  useEffect(() => {
    const obs = new IntersectionObserver(
      entries => entries.forEach(e => { if (e.isIntersecting) setActive(e.target.id) }),
      { rootMargin: '-40% 0px -55% 0px' }
    )
    ids.forEach(id => { const el = document.getElementById(id); if (el) obs.observe(el) })
    return () => obs.disconnect()
  }, [ids])
  return active
}

// ─── Counter ──────────────────────────────────────────────────────────────────

function Counter({ end, suffix = '', duration = 1600 }: { end: number; suffix?: string; duration?: number }) {
  const [count, setCount] = useState(0)
  const [ref, inView] = useInView(0.3)
  useEffect(() => {
    if (!inView) return
    let frame = 0
    const total = Math.round(duration / 16)
    const t = setInterval(() => {
      frame++
      setCount(Math.round((1 - Math.pow(1 - frame / total, 3)) * end))
      if (frame >= total) clearInterval(t)
    }, 16)
    return () => clearInterval(t)
  }, [inView, end, duration])
  return <span ref={ref as React.RefObject<HTMLSpanElement>}>{count}{suffix}</span>
}

// ─── Typewriter ───────────────────────────────────────────────────────────────

function Typewriter({ phrases }: { phrases: string[] }) {
  const [displayed, setDisplayed] = useState('')
  const [pi, setPi] = useState(0)
  const [ci, setCi] = useState(0)
  const [del, setDel] = useState(false)
  useEffect(() => {
    const cur = phrases[pi]
    let delay = del ? 38 : 75
    if (!del && ci === cur.length) delay = 2200
    if (del && ci === 0) delay = 350
    const t = setTimeout(() => {
      if (!del && ci < cur.length) { setDisplayed(cur.slice(0, ci + 1)); setCi(c => c + 1) }
      else if (!del && ci === cur.length) setDel(true)
      else if (del && ci > 0) { setDisplayed(cur.slice(0, ci - 1)); setCi(c => c - 1) }
      else { setDel(false); setPi(i => (i + 1) % phrases.length) }
    }, delay)
    return () => clearTimeout(t)
  }, [ci, del, pi, phrases])
  return <span className="cursor">{displayed}</span>
}

// ─── Nav ──────────────────────────────────────────────────────────────────────

const NAV_IDS = ['about', 'skills', 'achievements', 'experience', 'contact']

function Nav() {
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)
  const active = useScrollSpy(NAV_IDS)
  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 32)
    window.addEventListener('scroll', fn)
    return () => window.removeEventListener('scroll', fn)
  }, [])
  const go = useCallback((id: string) => {
    setOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }, [])

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 100,
      height: 56,
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0 clamp(1.5rem, 4vw, 3rem)',
      background: scrolled ? 'rgba(245,242,236,0.92)' : 'transparent',
      backdropFilter: scrolled ? 'blur(16px)' : 'none',
      borderBottom: scrolled ? '1px solid var(--border)' : '1px solid transparent',
      transition: 'background 0.3s, border-color 0.3s',
    }}>
      <button onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
        style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.1rem', color: 'var(--foreground)', background: 'none', border: 'none', cursor: 'pointer', letterSpacing: '-0.01em' }}>
        Eric Ozoemenam<span style={{ color: 'var(--primary)', marginLeft: 1 }}>.</span>
      </button>

      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }} className="hidden sm:flex">
        {NAV_IDS.map(id => (
          <button key={id} onClick={() => go(id)} className={`nav-link ${active === id ? 'active' : ''}`}>{id}</button>
        ))}
        <button onClick={() => go('contact')} className="btn-primary" style={{ padding: '8px 18px' }}>connect</button>
      </div>

      <button className="sm:hidden" onClick={() => setOpen(o => !o)}
        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: 5, padding: 4 }}>
        {[0, 1, 2].map(i => (
          <span key={i} style={{
            display: 'block', width: 22, height: 1.5, background: 'var(--foreground)', transition: 'all 0.25s',
            transform: open ? (i === 0 ? 'translateY(6.5px) rotate(45deg)' : i === 2 ? 'translateY(-6.5px) rotate(-45deg)' : 'none') : 'none',
            opacity: open && i === 1 ? 0 : 1,
          }} />
        ))}
      </button>
      {open && (
        <div style={{
          position: 'absolute', top: 56, left: 0, right: 0,
          background: 'rgba(245,242,236,0.98)', backdropFilter: 'blur(20px)',
          borderBottom: '1px solid var(--border)', padding: '1.5rem clamp(1.5rem,4vw,3rem)',
          display: 'flex', flexDirection: 'column', gap: '1.25rem',
        }}>
          {NAV_IDS.map(id => (
            <button key={id} onClick={() => go(id)} className={`nav-link ${active === id ? 'active' : ''}`} style={{ textAlign: 'left' }}>{id}</button>
          ))}
        </div>
      )}
    </nav>
  )
}

// ─── Marquee ─────────────────────────────────────────────────────────────────

const MARQUEE_ITEMS = [
  'Client Acquisition', '·', 'Lead Generation', '·', 'Strategic Partnerships', '·',
  'Project Planning', '·', 'Stakeholder Management', '·', 'Business Growth', '·',
  'Customer Retention', '·', 'Sales Negotiation', '·', 'Quality Assurance', '·',
  'Project Execution', '·', 'Team Coordination', '·', 'Risk Management', '·',
]

function Marquee() {
  return (
    <div style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', overflow: 'hidden', padding: '10px 0', background: 'var(--secondary)' }}>
      <div className="marquee-track">
        {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
          <span key={i} style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: '0.68rem', letterSpacing: '0.1em',
            color: item === '·' ? 'var(--muted-foreground)' : 'var(--foreground)',
            padding: '0 1rem', whiteSpace: 'nowrap',
          }}>{item}</span>
        ))}
      </div>
    </div>
  )
}

// ─── Hero ─────────────────────────────────────────────────────────────────────

function Hero() {
  return (
    <section style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', paddingTop: 56 }}>
      <div style={{ flex: 1, position: 'relative' }}>

        {/* Large background letter */}
        <div aria-hidden style={{
          position: 'absolute', right: '-2%', top: '50%', transform: 'translateY(-50%)',
          fontFamily: "'Instrument Serif', serif",
          fontSize: 'clamp(280px, 40vw, 480px)',
          fontWeight: 400, color: 'rgba(37,71,244,0.04)',
          lineHeight: 1, userSelect: 'none', pointerEvents: 'none',
        }}>6</div>

        {/* Dot grid */}
        <div aria-hidden style={{
          position: 'absolute', inset: 0, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle, rgba(37,71,244,0.12) 1px, transparent 1px)',
          backgroundSize: '28px 28px',
          maskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 80% 80% at 50% 50%, black 20%, transparent 100%)',
          opacity: 0.5,
        }} />

        <div style={{
          position: 'relative', zIndex: 2,
          maxWidth: 1100, margin: '0 auto', width: '100%',
          padding: 'clamp(4rem, 10vw, 8rem) clamp(1.5rem, 4vw, 3rem)',
          display: 'flex', flexDirection: 'column', justifyContent: 'center',
        }}>

          {/* Status */}
          <div className="reveal" style={{ marginBottom: '2.5rem', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="pulse-ring" style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--primary)', display: 'block', flexShrink: 0 }} />
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.68rem', letterSpacing: '0.14em', color: 'var(--primary)', textTransform: 'uppercase' }}>
              open to opportunities · enugu, nigeria
            </span>
          </div>

          {/* Name */}
          <h1 className="reveal d1" style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 'clamp(3rem, 9vw, 7.5rem)',
            fontWeight: 400, lineHeight: 0.92,
            letterSpacing: '-0.03em', color: 'var(--foreground)',
            marginBottom: '1.25rem',
          }}>
            Ozoemenam<br />
            <span style={{ color: 'var(--primary)', fontStyle: 'italic' }}>Eric</span>
          </h1>

          {/* Typewriter */}
          <div className="reveal d2" style={{
            fontFamily: "'JetBrains Mono', monospace",
            fontSize: 'clamp(0.8rem, 1.5vw, 1rem)',
            color: 'var(--muted-foreground)', marginBottom: '2rem', minHeight: '1.5em',
          }}>
            <Typewriter phrases={[
              'Business Development Professional',
              'Project Coordinator',
              'Client Relationship Specialist',
              'Helping Organizations Grow',
            ]} />
          </div>

          {/* Description / philosophy */}
          <p className="reveal d3" style={{
            fontFamily: "'Instrument Serif', serif",
            fontSize: 'clamp(1rem, 1.5vw, 1.15rem)',
            fontStyle: 'italic',
            lineHeight: 1.75, color: 'var(--muted-foreground)',
            maxWidth: 500, marginBottom: '2.5rem',
          }}>
            "Sustainable business growth is built on trust, exceptional client relationships, and consistently delivering value beyond expectations."
          </p>

          {/* CTAs */}
          <div className="reveal d4" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: '4rem' }}>
            <button className="btn-primary"
              onClick={() => document.getElementById('achievements')?.scrollIntoView({ behavior: 'smooth' })}>
              view my work →
            </button>
            <button className="btn-outline"
              onClick={() => document.getElementById('contact')?.scrollIntoView({ behavior: 'smooth' })}>
              get in touch
            </button>
          </div>

          {/* Stats */}
          <div className="reveal d5" style={{
            display: 'flex', gap: 0,
            borderTop: '1px solid var(--border)', paddingTop: '2rem', width: 'fit-content',
          }}>
            {[
              { n: 6, suf: '+', label: 'yrs experience' },
              { n: 30, suf: '+', label: 'clients acquired' },
              { n: 3, suf: '', label: 'notable institutions' },
            ].map((s, i) => (
              <div key={i} style={{
                paddingRight: '2.5rem', marginRight: '2.5rem',
                borderRight: i < 2 ? '1px solid var(--border)' : 'none',
              }}>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(2rem, 4vw, 2.75rem)', fontWeight: 400, color: 'var(--foreground)', lineHeight: 1, marginBottom: 4 }}>
                  <Counter end={s.n} suffix={s.suf} />
                </div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.12em', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <Marquee />
    </section>
  )
}

// ─── About ────────────────────────────────────────────────────────────────────

function About() {
  return (
    <section id="about" style={{ padding: 'clamp(5rem, 10vw, 9rem) clamp(1.5rem, 4vw, 3rem)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.5rem', marginBottom: '4rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.18em', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>01 / about</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)', minWidth: 40 }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(2.5rem, 6vw, 5rem)', alignItems: 'start' }}>

          {/* Photo */}
          <div className="reveal-left" style={{ position: 'relative' }}>
            <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 2, aspectRatio: '3/4', maxWidth: 380, background: '#ffffff' }}>
              <img
                src="/eric-portrait.jpeg"
                alt="Ozoemenam Eric Chinecherem"
                style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top center', display: 'block', mixBlendMode: 'multiply' }}
              />
              <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '35%', background: 'linear-gradient(to top, rgba(37,71,244,0.6), transparent)' }} />
              <div style={{ position: 'absolute', bottom: '1.25rem', left: '1.25rem' }}>
                <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.1rem', color: 'white', marginBottom: 2 }}>Ozoemenam Eric Chinecherem</div>
                <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.12em', color: 'rgba(255,255,255,0.7)' }}>Business Development · Project Coordination</div>
              </div>
            </div>
            <div style={{
              position: 'absolute', bottom: -14, right: -14,
              width: '55%', height: '55%',
              border: '1px solid rgba(37,71,244,0.2)', borderRadius: 2, zIndex: -1,
            }} />
            <div style={{
              position: 'absolute', top: '1rem', right: '-1.25rem',
              background: 'var(--card)', border: '1px solid var(--border)',
              borderRadius: 2, padding: '7px 13px',
              display: 'flex', alignItems: 'center', gap: 7,
              boxShadow: '0 4px 20px rgba(15,14,23,0.08)',
            }}>
              <span className="pulse-ring" style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--primary)', display: 'block', flexShrink: 0 }} />
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--primary)' }}>open to work</span>
            </div>
          </div>

          {/* Bio */}
          <div className="reveal">
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(2rem, 4vw, 3.2rem)', fontWeight: 400, lineHeight: 1.08, marginBottom: '1.75rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
              Growth is built on<br /><em style={{ color: 'var(--primary)' }}>relationships.</em>
            </h2>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.85, color: 'var(--muted-foreground)', marginBottom: '1.25rem' }}>
              Result-driven Business Development Professional and Project Coordinator with over six years of progressive experience driving business growth, building strategic client relationships, and coordinating successful project delivery.
            </p>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.85, color: 'var(--muted-foreground)', marginBottom: '1.25rem' }}>
              At Paradise Media Limited, I have played a key role in acquiring more than 30 clients, contributing to the generation of millions of naira in business revenue, and managing long-term partnerships with government institutions, charitable organizations, and corporate clients.
            </p>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.85, color: 'var(--muted-foreground)', marginBottom: '2.5rem' }}>
              Known for professionalism, integrity, and a solution-oriented mindset — I help organizations identify growth opportunities, improve operational efficiency, and achieve sustainable business success.
            </p>

            {/* Quick facts */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
              {[
                { label: 'location', value: 'Enugu State, Nigeria' },
                { label: 'degree', value: 'BSc Geography & Met.' },
                { label: 'university', value: 'ESUT, 2018–2022' },
                { label: 'service', value: 'NYSC, 2025–2026' },
              ].map(f => (
                <div key={f.label} style={{ padding: '0.9rem 1.1rem', background: 'var(--card)' }}>
                  <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: 4 }}>{f.label}</div>
                  <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: 'var(--foreground)', fontWeight: 500 }}>{f.value}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Skills ───────────────────────────────────────────────────────────────────

const COMPETENCY_GROUPS = [
  {
    title: 'Business Development',
    color: '#2547F4',
    skills: ['Client Acquisition', 'Lead Generation', 'Strategic Partnerships', 'Business Growth', 'Customer Retention', 'Sales Negotiation'],
  },
  {
    title: 'Project Coordination',
    color: '#E8572A',
    skills: ['Project Planning', 'Team Coordination', 'Stakeholder Management', 'Quality Assurance', 'Project Execution', 'Risk Awareness'],
  },
  {
    title: 'Digital & Technical',
    color: '#059669',
    skills: ['Microsoft Excel', 'Google Workspace', 'Microsoft Office Suite', 'Canva', 'Smartsheet', 'CorelDraw'],
  },
]

function Skills() {
  return (
    <section id="skills" style={{ background: 'var(--secondary)', padding: 'clamp(5rem, 10vw, 9rem) clamp(1.5rem, 4vw, 3rem)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.5rem', marginBottom: '4rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.18em', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>02 / core competencies</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)', minWidth: 40 }} />
        </div>

        <h2 className="reveal" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(1.8rem, 3vw, 2.6rem)', fontWeight: 400, marginBottom: '3rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
          What I bring to the table
        </h2>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1.5rem' }}>
          {COMPETENCY_GROUPS.map((group, gi) => (
            <div key={group.title} className="reveal card-lift" style={{ transitionDelay: `${gi * 100}ms` }}>
              <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden', height: '100%' }}>
                {/* Header strip */}
                <div style={{ background: group.color, padding: '1rem 1.25rem' }}>
                  <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.2rem', fontWeight: 400, color: 'white' }}>{group.title}</h3>
                </div>
                {/* Skills list */}
                <div style={{ padding: '1.25rem' }}>
                  {group.skills.map(skill => (
                    <div key={skill} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: group.color, flexShrink: 0, opacity: 0.6 }} />
                      <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: 'var(--foreground)' }}>{skill}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Career highlights strip */}
        <div className="reveal" style={{ marginTop: '3rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          {[
            { label: 'new clients acquired', value: '30+' },
            { label: 'one-time → repeat clients', value: 'consistent track record' },
            { label: 'government & NGO relationships', value: 'active & ongoing' },
            { label: 'revenue contribution', value: 'millions of ₦' },
          ].map(h => (
            <div key={h.label} style={{ background: 'var(--card)', padding: '1.25rem 1.5rem' }}>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.3rem', color: 'var(--primary)', marginBottom: 4 }}>{h.value}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>{h.label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Achievements / Notable Work ──────────────────────────────────────────────

const ACHIEVEMENTS = [
  {
    index: '01',
    tag: 'Government',
    title: 'Office of the First Lady of Enugu State',
    description: 'Personally secured and continue to manage Paradise Media Limited\'s relationship with the Office of the First Lady of Enugu State — coordinating branding and printing projects from planning through to full execution.',
    highlights: ['Government partnership', 'Long-term relationship', 'Branding & printing'],
    color: '#2547F4',
    image: 'https://images.unsplash.com/photo-1497366216548-37526070297c?w=700&h=460&fit=crop&auto=format',
  },
  {
    index: '02',
    tag: 'NGO / Charitable',
    title: 'Golden Heart Foundation',
    description: 'Built and maintained a strong long-term business relationship with Golden Heart Foundation — delivering consistent value and converting the organization into a loyal repeat client through exceptional service delivery.',
    highlights: ['NGO partnership', 'Repeat client', 'Relationship management'],
    color: '#E8572A',
    image: 'https://images.unsplash.com/photo-1559027615-cd4628902d4a?w=700&h=460&fit=crop&auto=format',
  },
  {
    index: '03',
    tag: 'International Organization',
    title: 'World Health Organization (WHO) Enugu',
    description: 'Supported Paradise Media\'s strategic partnership with the World Health Organization (WHO) Enugu State — managing the relationship and coordinating project deliverables to the highest quality standards.',
    highlights: ['WHO partnership', 'International scope', 'Quality delivery'],
    color: '#059669',
    image: 'https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?w=700&h=460&fit=crop&auto=format',
  },
]

function AchievementCard({ a, i }: { a: typeof ACHIEVEMENTS[0]; i: number }) {
  const [hov, setHov] = useState(false)
  return (
    <div className="reveal card-lift" style={{ transitionDelay: `${i * 100}ms` }}
      onMouseEnter={() => setHov(true)} onMouseLeave={() => setHov(false)}>
      <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
        <div style={{ position: 'relative', overflow: 'hidden', height: 200 }}>
          <img src={a.image} alt={a.title}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block', transition: 'transform 0.6s cubic-bezier(0.16,1,0.3,1)', transform: hov ? 'scale(1.04)' : 'scale(1)' }} />
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to top, rgba(255,255,255,0.9) 0%, transparent 60%)' }} />
          <div style={{ position: 'absolute', top: '1rem', right: '1rem' }}>
            <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.12em', color: 'white', background: a.color, padding: '3px 9px', borderRadius: 1 }}>{a.tag}</span>
          </div>
          <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', fontFamily: "'Instrument Serif', serif", fontSize: '2.5rem', fontWeight: 400, color: 'rgba(15,14,23,0.1)', lineHeight: 1 }}>{a.index}</div>
        </div>
        <div style={{ padding: '1.5rem' }}>
          <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.25rem', fontWeight: 400, color: 'var(--foreground)', marginBottom: '0.75rem', letterSpacing: '-0.01em' }}>{a.title}</h3>
          <p style={{ fontSize: '0.875rem', lineHeight: 1.75, color: 'var(--muted-foreground)', marginBottom: '1.25rem' }}>{a.description}</p>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {a.highlights.map(h => (
              <span key={h} style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.06em', padding: '3px 9px', background: `${a.color}10`, border: `1px solid ${a.color}25`, borderRadius: 1, color: a.color }}>{h}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function Achievements() {
  return (
    <section id="achievements" style={{ padding: 'clamp(5rem, 10vw, 9rem) clamp(1.5rem, 4vw, 3rem)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.5rem', marginBottom: '4rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.18em', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>03 / notable work</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)', minWidth: 40 }} />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
          <h2 className="reveal" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 400, color: 'var(--foreground)', lineHeight: 1.05, letterSpacing: '-0.02em' }}>
            Clients that trust<br /><em>my work</em>
          </h2>
          <p className="reveal" style={{ fontSize: '0.9rem', color: 'var(--muted-foreground)', maxWidth: 320, lineHeight: 1.75 }}>
            A selection of notable institutional partnerships built and managed at Paradise Media Limited.
          </p>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
          {ACHIEVEMENTS.map((a, i) => <AchievementCard key={a.title} a={a} i={i} />)}
        </div>
      </div>
    </section>
  )
}

// ─── Experience ───────────────────────────────────────────────────────────────

const BIZ_DEV_DUTIES = [
  'Identify, pursue, and convert new business opportunities into long-term clients',
  'Prepare quotations, proposals, and business presentations tailored to client requirements',
  'Build and maintain long-term relationships with government agencies, NGOs, and corporate clients',
  'Generate new business through referrals, networking, and relationship management',
  'Negotiate pricing and project scope while maintaining profitability and customer satisfaction',
  'Conduct regular client follow-ups, resulting in repeat business and long-term partnerships',
]

const COORD_DUTIES = [
  'Successfully coordinate branding and printing projects from planning through execution',
  'Supervise office personnel and project-site teams to ensure timely delivery and quality',
  'Manage stakeholder expectations and maintain clear communication across all project phases',
  'Apply risk awareness and quality assurance processes at every stage of delivery',
]

function Experience() {
  const [tab, setTab] = useState<'biz' | 'coord'>('biz')
  return (
    <section id="experience" style={{ background: 'var(--secondary)', padding: 'clamp(5rem, 10vw, 9rem) clamp(1.5rem, 4vw, 3rem)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.5rem', marginBottom: '4rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.18em', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>04 / experience</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)', minWidth: 40 }} />
        </div>

        <h2 className="reveal" style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(2rem, 4vw, 3rem)', fontWeight: 400, marginBottom: '3rem', color: 'var(--foreground)', letterSpacing: '-0.02em' }}>
          Where I've worked
        </h2>

        <div className="reveal" style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          {/* Company header */}
          <div style={{ padding: '1.75rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-start' }}>
            <div>
              <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.5rem', fontWeight: 400, color: 'var(--foreground)', marginBottom: 4 }}>Paradise Media Limited</h3>
              <p style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.875rem', color: 'var(--primary)', fontWeight: 500 }}>Business Development Professional & Project Coordinator</p>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.72rem', letterSpacing: '0.1em', color: 'var(--muted-foreground)', marginBottom: 4 }}>2019 – Present</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.08em', color: 'var(--muted-foreground)' }}>Enugu State, Nigeria</div>
            </div>
          </div>

          {/* Tab switcher */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border)' }}>
            {([['biz', 'Business Development'], ['coord', 'Project Coordination']] as const).map(([key, label]) => (
              <button key={key} onClick={() => setTab(key)}
                style={{
                  fontFamily: "'JetBrains Mono', monospace",
                  fontSize: '0.68rem', letterSpacing: '0.1em',
                  padding: '0.85rem 1.5rem',
                  border: 'none', background: 'none', cursor: 'pointer',
                  color: tab === key ? 'var(--primary)' : 'var(--muted-foreground)',
                  borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent',
                  marginBottom: -1,
                  transition: 'color 0.2s',
                  textTransform: 'uppercase',
                }}>
                {label}
              </button>
            ))}
          </div>

          {/* Duties */}
          <div style={{ padding: '1.75rem 2rem' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
              {(tab === 'biz' ? BIZ_DEV_DUTIES : COORD_DUTIES).map((d, i) => (
                <div key={i} style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--primary)', marginTop: 7, flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.9rem', lineHeight: 1.7, color: 'var(--muted-foreground)' }}>{d}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Education */}
        <div className="reveal" style={{ marginTop: '2rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1px', background: 'var(--border)', border: '1px solid var(--border)', borderRadius: 2, overflow: 'hidden' }}>
          {[
            { label: 'degree', title: 'BSc Geography & Meteorology', sub: 'Enugu State University of Science & Technology', period: '2018 – 2022' },
            { label: 'service', title: 'National Youth Service Corps', sub: 'NYSC', period: '2025 – 2026' },
          ].map(e => (
            <div key={e.label} style={{ background: 'var(--card)', padding: '1.25rem 1.5rem' }}>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.14em', color: 'var(--muted-foreground)', textTransform: 'uppercase', marginBottom: 8 }}>{e.label}</div>
              <div style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.1rem', color: 'var(--foreground)', marginBottom: 4 }}>{e.title}</div>
              <div style={{ fontFamily: "'Inter', sans-serif", fontSize: '0.8rem', color: 'var(--muted-foreground)', marginBottom: 4 }}>{e.sub}</div>
              <div style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.08em', color: 'var(--primary)' }}>{e.period}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

// ─── Contact ──────────────────────────────────────────────────────────────────

function Contact() {
  const [form, setForm] = useState({ name: '', email: '', message: '' })
  const [sent, setSent] = useState(false)
  const submit = (e: React.FormEvent) => {
    e.preventDefault()
    setSent(true)
    setForm({ name: '', email: '', message: '' })
    setTimeout(() => setSent(false), 4000)
  }

  return (
    <section id="contact" style={{ padding: 'clamp(5rem, 10vw, 9rem) clamp(1.5rem, 4vw, 3rem)' }}>
      <div style={{ maxWidth: 1100, margin: '0 auto' }}>

        <div style={{ display: 'flex', alignItems: 'baseline', gap: '1.5rem', marginBottom: '4rem', flexWrap: 'wrap' }}>
          <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.65rem', letterSpacing: '0.18em', color: 'var(--muted-foreground)', textTransform: 'uppercase' }}>05 / contact</span>
          <div style={{ flex: 1, height: '1px', background: 'var(--border)', minWidth: 40 }} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 'clamp(3rem, 6vw, 6rem)' }}>

          <div className="reveal">
            <h2 style={{ fontFamily: "'Instrument Serif', serif", fontSize: 'clamp(2rem, 5vw, 3.5rem)', fontWeight: 400, lineHeight: 1.05, letterSpacing: '-0.02em', marginBottom: '1.5rem', color: 'var(--foreground)' }}>
              Let's build<br /><em style={{ color: 'var(--primary)' }}>something great.</em>
            </h2>
            <p style={{ fontSize: '0.95rem', lineHeight: 1.8, color: 'var(--muted-foreground)', marginBottom: '2.5rem' }}>
              I'm open to new business development opportunities, project coordination roles, and strategic partnerships. If you're looking for someone who gets results — I'd love to connect.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {[
                { l: 'email', v: 'ericozoemenam@gmail.com' },
                { l: 'phone', v: '09079292899' },
                { l: 'alt phone', v: '07077045057' },
                { l: 'location', v: 'New Haven, Enugu State, NG' },
              ].map(link => (
                <div key={link.l} style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.14em', color: 'var(--muted-foreground)', textTransform: 'uppercase', width: 68, flexShrink: 0 }}>{link.l}</span>
                  <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
                  <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.7rem', color: 'var(--primary)' }}>{link.v}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="reveal d2">
            {sent ? (
              <div style={{ minHeight: 360, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', border: '1px solid rgba(37,71,244,0.2)', borderRadius: 2, background: 'rgba(37,71,244,0.03)', textAlign: 'center', padding: '2rem' }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '1.2rem' }}>✓</div>
                <h3 style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1.5rem', color: 'var(--foreground)' }}>Message sent!</h3>
                <p style={{ fontSize: '0.875rem', color: 'var(--muted-foreground)' }}>Eric will get back to you shortly.</p>
              </div>
            ) : (
              <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {[
                  { key: 'name', label: 'name', type: 'text', placeholder: 'Your full name' },
                  { key: 'email', label: 'email', type: 'email', placeholder: 'your@email.com' },
                ].map(f => (
                  <div key={f.key}>
                    <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.14em', color: 'var(--muted-foreground)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>{f.label}</label>
                    <input type={f.type} required value={form[f.key as 'name' | 'email']}
                      onChange={e => setForm(p => ({ ...p, [f.key]: e.target.value }))}
                      placeholder={f.placeholder} className="form-input"
                      style={{ width: '100%', padding: '10px 14px' }} />
                  </div>
                ))}
                <div>
                  <label style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.6rem', letterSpacing: '0.14em', color: 'var(--muted-foreground)', display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>message</label>
                  <textarea required value={form.message} onChange={e => setForm(p => ({ ...p, message: e.target.value }))}
                    placeholder="Tell me about your project or opportunity..." rows={5}
                    className="form-input"
                    style={{ width: '100%', padding: '10px 14px', resize: 'vertical', minHeight: 120 }} />
                </div>
                <button type="submit" className="btn-primary" style={{ alignSelf: 'flex-start' }}>
                  send message →
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  )
}

// ─── Footer ───────────────────────────────────────────────────────────────────

function Footer() {
  return (
    <footer style={{ borderTop: '1px solid var(--border)', padding: '1.75rem clamp(1.5rem,4vw,3rem)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
      <span style={{ fontFamily: "'Instrument Serif', serif", fontSize: '1rem', color: 'var(--muted-foreground)', letterSpacing: '-0.01em' }}>
        Ozoemenam Eric Chinecherem<span style={{ color: 'var(--primary)' }}>.</span>
      </span>
      <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '0.62rem', letterSpacing: '0.1em', color: 'var(--muted-foreground)' }}>
        © 2026 · Enugu, Nigeria
      </span>
    </footer>
  )
}

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  useReveal()
  return (
    <div style={{ minHeight: '100vh', background: 'var(--background)' }}>
      <Nav />
      <main>
        <Hero />
        <About />
        <Skills />
        <Achievements />
        <Experience />
        <Contact />
      </main>
      <Footer />
    </div>
  )
}
