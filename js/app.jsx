/* global React, ReactDOM */
const { useState, useEffect, useRef, useMemo } = React;

// ─── Tweakable defaults ────────────────────────────────────
const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "logoNav": 96,
  "logoHero": 96,
  "logoFooter": 56,
  "heroHeadlineSize": 100,
  "showTacticalChrome": true,
  "showTicker": false
} /*EDITMODE-END*/;

// ─── Tweaks context ────────────────────────────────────────
const TweaksContext = React.createContext({ t: TWEAK_DEFAULTS, setTweak: () => {} });
const useTweakValues = () => React.useContext(TweaksContext).t;

// ─── Primitives ────────────────────────────────────────────
function useReveal() {
  const ref = useRef(null);
  useEffect(() => {
    const el = ref.current;if (!el) return;
    const io = new IntersectionObserver((entries) => {
      entries.forEach((e) => {if (e.isIntersecting) el.classList.add("in");});
    }, { threshold: 0.12 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return ref;
}

function Reveal({ children, delay = 0, as: As = "div", style, className = "" }) {
  const ref = useReveal();
  return (
    <As ref={ref} className={`reveal ${className}`} style={{ ...style, transitionDelay: `${delay}ms` }}>
      {children}
    </As>);

}

// Cinematic per-word text reveal. Wraps every text token in a span
// with a staggered transition-delay; the parent `.reveal.in` (or `.cine.in`)
// flips visibility and the words bloom in with a blur fade.
function CineSplit({ children, stagger = 55, baseDelay = 0 }) {
  const counter = { idx: 0 };
  function walk(node, key) {
    if (typeof node === "string") {
      return node.split(/(\s+)/).map((tok, i) => {
        if (/^\s*$/.test(tok)) return tok;
        const d = baseDelay + counter.idx * stagger;
        counter.idx++;
        return (
          <span key={`w-${key}-${i}`} className="cine-word" style={{ transitionDelay: `${d}ms`, fontSize: "60px" }}>
            {tok}
          </span>);

      });
    }
    if (Array.isArray(node)) return node.map((c, i) => walk(c, `${key}-${i}`));
    if (React.isValidElement(node)) {
      const kids = walk(node.props.children, `${key}-c`);
      return React.cloneElement(node, { key: `n-${key}` }, kids);
    }
    return node;
  }
  return <>{walk(children, "0")}</>;
}

function Mark({ height = 28, color = "var(--ink-0)", invert = false }) {
  const src = typeof window !== "undefined" && window.__resources && window.__resources.aalilaaMark || "assets/aalilaa-mark.png";
  const filter = invert ? "brightness(1)" : "brightness(0)";
  return (
    <img src={src} alt="AALILAA"
    style={{ ...{
        height, display: "block",
        filter,
        opacity: color === "var(--ink-0)" ? 1 : 0.55,
        transition: "height 0.25s cubic-bezier(.2,.7,0,1), filter 0.4s ease", objectFit: "contain", width: "100px"
      }, height: "78px" }} />);

}

// ─── Nav ───────────────────────────────────────────────────
function TopNav() {
  const tw = useTweakValues();
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const items = [
  ["PLATFORM", "sec-platform"],
  ["DEMO", "sec-demo"],
  ["INDIA", "sec-india"],
  ["TEAM", "sec-team"]];


  return (
    <nav style={{
      position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
      display: "grid", gridTemplateColumns: "1fr auto 1fr",
      alignItems: "center", padding: "20px 36px",
      background: scrolled ? "rgba(255,255,255,0.94)" : "rgba(255,255,255,0)",
      backdropFilter: scrolled ? "blur(8px)" : "none",
      WebkitBackdropFilter: scrolled ? "blur(8px)" : "none",
      borderBottom: scrolled ? "1px solid var(--line)" : "1px solid transparent",
      transition: "background 0.4s ease, border-color 0.4s ease", fontFamily: "Geist"
    }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <a href="#top" style={{ textDecoration: "none", display: "flex", alignItems: "center" }}>
          <Mark height={tw.logoNav} invert={!scrolled} />
        </a>
      </div>
      <div style={{ display: "flex", justifyContent: "center", gap: 36 }}>
        {items.map(([s, href]) =>
        <a key={href} href={`#${href}`}
        style={{
          fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.24em",
          textTransform: "uppercase", textDecoration: "none", whiteSpace: "nowrap",
          color: scrolled ? "var(--ink-2)" : "rgba(255,255,255,0.7)",
          transition: "color 0.25s ease"
        }}
        onMouseEnter={(e) => e.currentTarget.style.color = scrolled ? "var(--ink-0)" : "#ffffff"}
        onMouseLeave={(e) => e.currentTarget.style.color = scrolled ? "var(--ink-2)" : "rgba(255,255,255,0.7)"}>
            {s}
          </a>
        )}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <span className="live-dot" style={{ color: scrolled ? "var(--ink-2)" : "rgba(255,255,255,0.7)" }}>Sovereign · India</span>
      </div>
    </nav>);

}

// ─── 1. Hero — cinematic dark with 3D wireframe globe ─────
function Hero() {
  const tw = useTweakValues();
  const Globe = window.WireframeGlobe;
  return (
    <section id="sec-hero" data-screen-label="01 Hero" className="hero-dark" style={{
      minHeight: "100vh", position: "relative", overflow: "hidden",
      padding: "180px 48px 160px",
      display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center",
      borderTop: "none",
      background: "#000"
    }}>
      {/* 3D mesh globe */}
      {Globe && <Globe />}

      {/* Subtle vignette + scanline + grid for cinematic depth */}
      <div style={{
        position: "absolute", inset: 0,
        background: "radial-gradient(ellipse 80% 70% at 50% 50%, transparent 30%, rgba(0,0,0,0.55) 75%, rgba(0,0,0,0.85) 100%)",
        pointerEvents: "none"
      }} />
      {tw.showTacticalChrome && <div className="hero-grid"></div>}
      {tw.showTacticalChrome && <div className="scan-vert-dark" style={{ animationDelay: "1.2s" }}></div>}

      {tw.showTacticalChrome && <span className="section-tag-dark tl">// 01 — Mission</span>}
      {tw.showTacticalChrome && <span className="section-tag-dark tr">N 28° 36′ · E 077° 12′</span>}
      {tw.showTacticalChrome && <span className="section-tag-dark bl">AAL-OS / v 11.4</span>}
      {tw.showTacticalChrome && <span className="section-tag-dark br">Node · Bengaluru-7</span>}

      <div className="container-narrow" style={{ position: "relative", textAlign: "center", zIndex: 3 }}>
        <Reveal delay={120}>
          <div style={{
            display: "inline-flex", alignItems: "center", gap: 12,
            fontFamily: "var(--mono)", fontSize: 11, letterSpacing: "0.32em",
            textTransform: "uppercase", color: "rgba(255,255,255,0.6)"
          }}>
            <span style={{ width: 28, height: 1, background: "rgba(255,255,255,0.35)" }}></span>
            Sovereign AI · Command &amp; Control
            <span style={{ width: 28, height: 1, background: "rgba(255,255,255,0.35)" }}></span>
          </div>
        </Reveal>

        <Reveal delay={220}>
          <h1 style={{ ...{
              margin: "40px auto 0",
              fontFamily: "Geist, var(--display)",
              fontWeight: 500,
              fontSize: `clamp(40px, ${tw.heroHeadlineSize / 100 * 6.4}vw, ${Math.round(tw.heroHeadlineSize / 100 * 96)}px)`,
              lineHeight: 1.04,
              letterSpacing: "-0.028em",
              color: "#ffffff",
              maxWidth: "20ch",
              textShadow: "0 0 60px rgba(95,200,255,0.18)"
            }, fontSize: "80px" }}>
            <CineSplit>The command and control layer for <span style={{ color: "rgba(255,255,255,0.45)" }}>India's defence ecosystem.</span></CineSplit>
          </h1>
        </Reveal>

        <Reveal delay={360}>
          <p style={{
            margin: "44px auto 0",
            color: "rgba(255,255,255,0.65)",
            fontSize: 18, lineHeight: 1.55, maxWidth: "52ch",
            letterSpacing: "-0.005em"
          }}>
            A sovereign AI platform that fuses intelligence, military, civilian,
            cyber, and satellite signals into one operational picture.
          </p>
        </Reveal>

        <Reveal delay={520}>
          <div style={{ marginTop: 80, display: "flex", justifyContent: "center", alignItems: "center", gap: 14, color: "rgba(255,255,255,0.45)" }}>
            <span style={{ width: 1, height: 36, background: "rgba(255,255,255,0.3)" }} />
            <span className="mono" style={{ color: "rgba(255,255,255,0.5)", letterSpacing: "0.32em" }}>SCROLL</span>
          </div>
        </Reveal>
      </div>

      {/* Bottom ticker — off by default, tweakable */}
      {tw.showTicker &&
      <div style={{
        position: "absolute", left: 0, right: 0, bottom: 0,
        borderTop: "1px solid rgba(255,255,255,0.08)",
        padding: "12px 0", overflow: "hidden", zIndex: 4,
        maskImage: "linear-gradient(90deg, transparent, #000 8%, #000 92%, transparent)"
      }}>
          <div className="ticker">
            {[...Array(2)].map((_, k) =>
          <React.Fragment key={k}>
                {[
            "TACTI-RADAR · ONLINE",
            "SOFT-OPS · ENGAGED",
            "STRATEGOS · REASONING",
            "ENTITY-GRAPH · 3.4M NODES",
            "ALLIED FEEDS · 11 NATIONS",
            "ORBITAL ASSETS · 84 NOMINAL",
            "DOCTRINE LIBRARY · v 11.4",
            "DECISION CYCLES · 1.4s MEDIAN"].
            map((s, i) =>
            <span key={`${k}-${i}`} className="mono" style={{
              color: "rgba(255,255,255,0.55)", fontSize: 10, letterSpacing: "0.28em"
            }}>
                    ◦ {s}
                  </span>
            )}
              </React.Fragment>
          )}
          </div>
        </div>
      }
    </section>);

}

// Slow animated radar/reticle behind the hero
function HeroBackdrop() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf;const start = performance.now();
    const loop = (now) => {setT((now - start) / 1000);raf = requestAnimationFrame(loop);};
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <svg viewBox="-400 -400 800 800" width="100%" height="100%" style={{
      position: "absolute", inset: 0, opacity: 0.45, pointerEvents: "none",
      maxHeight: "100%"
    }}>
      <defs>
        <radialGradient id="hbRingFill" cx="0.5" cy="0.5" r="0.5">
          <stop offset="0%" stopColor="rgba(10,10,10,0.0)" />
          <stop offset="100%" stopColor="rgba(10,10,10,0.04)" />
        </radialGradient>
      </defs>
      <g stroke="rgba(10,10,10,0.10)" fill="none" strokeWidth="0.6">
        <circle r="380" strokeDasharray="2 6" />
        <circle r="320" />
        <circle r="260" strokeDasharray="2 8" />
        <circle r="200" />
        <circle r="140" strokeDasharray="2 6" />
        <circle r="80" />
        <circle r="380" fill="url(#hbRingFill)" />
      </g>
      <g stroke="rgba(10,10,10,0.08)">
        {[...Array(36)].map((_, i) => {
          const a = i / 36 * Math.PI * 2;
          const inner = i % 9 === 0 ? 80 : i % 3 === 0 ? 320 : 360;
          const outer = 380;
          return <line key={i}
          x1={Math.cos(a) * inner} y1={Math.sin(a) * inner}
          x2={Math.cos(a) * outer} y2={Math.sin(a) * outer} />;
        })}
      </g>
      <g transform={`rotate(${t * 18 % 360})`}
      stroke="rgba(10,10,10,0.3)" strokeWidth="0.9" fill="none">
        <path d="M -380 0 A 380 380 0 0 1 -270 -268" strokeDasharray="2 6" />
      </g>
      <g transform={`rotate(${-t * 12 % 360})`}
      stroke="rgba(10,10,10,0.18)" strokeWidth="0.7" fill="none">
        <path d="M 320 0 A 320 320 0 0 1 226 226" />
      </g>
      <g style={{ fontFamily: "Geist Mono", fontSize: 10, letterSpacing: "0.32em" }} fill="rgba(10,10,10,0.3)">
        <text x="0" y="-388" textAnchor="middle">N</text>
        <text x="0" y="396" textAnchor="middle">S</text>
        <text x="394" y="3" textAnchor="middle">E</text>
        <text x="-392" y="3" textAnchor="middle">W</text>
      </g>
      {[
      { a: -1.0, r: 240 },
      { a: -0.4, r: 300 },
      { a: 0.6, r: 200 },
      { a: 1.2, r: 280 },
      { a: 2.4, r: 160 }].
      map((p, i) => {
        const x = Math.cos(p.a) * p.r;
        const y = Math.sin(p.a) * p.r;
        const phase = (t * 1.1 + i * 0.5) % 3;
        const ring = 6 + Math.max(0, 1 - phase / 3) * 24;
        const op = Math.max(0, 1 - phase / 3) * 0.5;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={ring} fill="none" stroke="rgba(10,10,10,0.45)" opacity={op} />
            <circle cx={x} cy={y} r="2" fill="rgba(10,10,10,0.6)" />
          </g>);

      })}
    </svg>);

}

// ─── 2. Problem ───────────────────────────────────────────
function Problem() {
  return (
    <section className="section" data-screen-label="02 Problem" style={{ padding: "220px 48px", position: "relative", overflow: "hidden", textAlign: "center" }}>
      <span className="section-tag tl">// 02 — The Problem</span>
      <span className="section-tag tr">Synthesis Doctrine</span>
      <div className="container-narrow" style={{ textAlign: "center", position: "relative" }}>
        <Reveal>
          <div className="eyebrow centered both" style={{ fontSize: "12px" }}>The Problem</div>
        </Reveal>
        <Reveal delay={120}>
          <p style={{


            lineHeight: 1.28,

            color: "var(--ink-0)",
            maxWidth: "28ch",
            padding: "3px", margin: "40px 15px 0px", textAlign: "center", letterSpacing: "-1.1px", fontFamily: "system-ui", fontSize: "50px", fontWeight: "500"
          }}>
            <CineSplit>Modern defence does not fail at collection. <span style={{ color: "var(--ink-2)" }}>It fails at synthesis. AALILAA makes that failure structurally impossible.</span></CineSplit>
          </p>
        </Reveal>
      </div>
    </section>);

}

// ─── 3. Manifesto ─────────────────────────────────────────
function Manifesto() {
  return (
    <section className="section" data-screen-label="03 Manifesto" style={{ padding: "240px 0", borderColor: "rgb(0, 0, 0)", overflow: "hidden" }}>
      <div className="tactical-grid fine"></div>
      <span className="section-tag tl">// 03 — Manifesto</span>
      <span className="section-tag tr">Total Integration</span>

      <div className="container" style={{ textAlign: "left", position: "relative" }}>
        <Reveal>
          <h2 style={{
            margin: "0 auto",
            fontWeight: 800,
            color: "var(--ink-0)",
            fontSize: "clamp(72px, 9.4vw, 168px)",
            letterSpacing: "0.005em",
            lineHeight: 0.94,
            fontFamily: "'Bebas Neue', Anton, var(--display)",
            textAlign: "center",
            textTransform: "uppercase",
            whiteSpace: "nowrap",
            width: "100%",
            padding: "0 24px"
          }}>
            <CineSplit stagger={70}>WE CAN SEE WHAT GOD CAN'T EVEN SEE</CineSplit>
          </h2>
        </Reveal>

        <Reveal delay={220}>
          <div style={{
            margin: "72px auto 0",
            maxWidth: "60ch",
            color: "var(--ink-2)",
            fontFamily: "var(--mono)",
            fontSize: 13,
            lineHeight: 1.85,
            letterSpacing: "0.06em",
            textAlign: "center"
          }}>
            Every signal source — intelligence, military, civilian, cyber, satellite — fused into one
            operational picture, with AI surfacing the connections no human team could reach at the
            same speed or depth.
          </div>
        </Reveal>
      </div>
    </section>);

}

// ─── 4. Platform — 3 rows ─────────────────────────────────
function Platform() {
  const rows = [
  {
    id: "TACTI-RADAR",
    kicker: "Kinetic situational awareness",
    desc: "Every sensor on a single live map — air, sea, land, and space. Hostile and friendly tracks reasoned continuously against doctrine.",
    visual: <TactiRadarMock />
  },
  {
    id: "SOFT-OPS",
    kicker: "Autonomous cyber operations",
    desc: "Reconnaissance, defence, and counter-operations executed at machine speed and correlated with kinetic events in real time.",
    visual: <SoftOpsMock />
  },
  {
    id: "STRATEGOS",
    kicker: "AI strategic reasoning",
    desc: "Deep pattern recognition over OSINT, SIGINT, HUMINT, and MASINT. Hypotheses ranked, weighted, and turned into named courses of action.",
    visual: <StrategosMock />
  }];


  return (
    <section id="sec-platform" className="section" data-screen-label="04 Platform">
      <div className="container-wide" style={{ fontFamily: "system-ui", fontWeight: "600" }}>
        <div style={{ textAlign: "center" }}>
          <Reveal>
            <div className="eyebrow centered both">The Platform</div>
          </Reveal>
          <Reveal delay={120}>
            <h2 style={{
              margin: "44px auto 0",

              fontWeight: 600,
              lineHeight: 1.05,
              letterSpacing: "-0.028em",
              color: "var(--ink-0)",
              maxWidth: "none", fontSize: "clamp(40px, 5.6vw, 88px)",
              whiteSpace: "nowrap", fontFamily: "\"JetBrains Mono\""
            }}>
              <CineSplit>Three systems. <span style={{ color: "var(--ink-2)" }}>One reasoning core</span></CineSplit>
            </h2>
          </Reveal>
        </div>

        <div style={{ marginTop: 140, borderTop: "1px solid var(--line)" }}>
          {rows.map((r, i) => <Reveal key={r.id} delay={i * 80}>
              <div style={{
              display: "grid",
              gridTemplateColumns: "1fr 560px",
              gap: 80,
              alignItems: "center",
              padding: "72px 0",
              borderBottom: "1px solid var(--line)"
            }}>
                <div>
                  <div style={{ display: "flex", gap: 14, alignItems: "baseline" }}>
                    <span className="mono" style={{ color: "var(--ink-3)" }}>0{i + 1} / 03</span>
                    <span className="mono" style={{ color: "var(--ink-0)", fontSize: 12 }}>{r.id}</span>
                  </div>
                  <div style={{
                  marginTop: 18,
                  fontFamily: "var(--display)", fontWeight: 400,
                  fontSize: "clamp(28px, 3vw, 38px)", lineHeight: 1.1,
                  letterSpacing: "-0.022em", color: "var(--ink-0)"
                }}>
                    {r.kicker}
                  </div>
                  <p style={{
                  margin: "20px 0 0", color: "var(--ink-2)",
                  fontSize: 16, lineHeight: 1.55, maxWidth: "44ch"
                }}>
                    {r.desc}
                  </p>
                </div>
                <div className="dark-panel" style={{ height: 320 }}>
                  {r.visual}
                </div>
              </div>
            </Reveal>
          )}
        </div>
      </div>
    </section>);

}

// ─── 5. Demo — YouTube embed ──────────────────────────────
function Demo() {
  const videoId = "hGW1aHz5F5Y";
  return (
    <section id="sec-demo" className="section" data-screen-label="05 Demo" style={{ padding: "200px 48px" }}>
      <div className="container-wide">
        <div style={{ textAlign: "center" }}>
          <Reveal>
            <div className="eyebrow centered both">Live Demo</div>
          </Reveal>
          <Reveal delay={120}>
            <h2 style={{
              margin: "44px auto 0",
              fontWeight: 400,

              lineHeight: 1.02, letterSpacing: "-0.028em",
              color: "var(--ink-0)", maxWidth: "22ch", fontSize: "55px", fontFamily: "\"Fira Sans\""
            }}>
               <CineSplit><span style={{ color: "var(--ink-2)", fontSize: "45px", fontFamily: "Geist" }}>Multi-domain threat, resolved in seconds.</span></CineSplit>
            </h2>
          </Reveal>
        </div>

        <Reveal delay={220}>
          <div className="dark-panel" style={{
            position: "relative", paddingTop: "56.25%", marginTop: 80
          }}>
            <iframe
              src={`https://www.youtube.com/embed/${videoId}?rel=0&modestbranding=1`}
              title="AALILAA Live Demo · Dubai AOR"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share; fullscreen"
              referrerPolicy="strict-origin-when-cross-origin"
              allowFullScreen
              loading="lazy"
              style={{
                position: "absolute", inset: 0,
                width: "100%", height: "100%", border: 0
              }} />
            
            {/* Corner labels */}
            <div style={{
              position: "absolute", top: 16, left: 18, pointerEvents: "none", zIndex: 2,
              fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.22em",
              color: "rgba(255,255,255,0.6)", textTransform: "uppercase",
              textShadow: "0 1px 4px rgba(0,0,0,0.8)"
            }}>
              ● Live Demo · Dubai AOR
            </div>
            <div style={{
              position: "absolute", top: 16, right: 18, pointerEvents: "none", zIndex: 2,
              fontFamily: "var(--mono)", fontSize: 9, letterSpacing: "0.22em",
              color: "rgba(255,255,255,0.6)", textTransform: "uppercase",
              textShadow: "0 1px 4px rgba(0,0,0,0.8)"
            }}>
              AAL-OS · D-AOR / 07
            </div>
          </div>
        </Reveal>

        <Reveal delay={320}>
          <div style={{
            marginTop: 24, display: "flex", justifyContent: "space-between", alignItems: "center",
            color: "var(--ink-3)"
          }}>
            <span className="mono">youtu.be/{videoId}</span>
            <a href={`https://youtu.be/${videoId}`} target="_blank" rel="noopener noreferrer"
            className="mono"
            style={{ color: "var(--ink-2)", textDecoration: "none" }}
            onMouseEnter={(e) => e.currentTarget.style.color = "var(--ink-0)"}
            onMouseLeave={(e) => e.currentTarget.style.color = "var(--ink-2)"}>
              If the player doesn't load · open on YouTube ↗
            </a>
          </div>
        </Reveal>
      </div>
    </section>);

}

// ─── 6. Built for India ───────────────────────────────────
function ForIndia() {
  return (
    <section id="sec-india" className="section" data-screen-label="06 India" style={{ padding: "220px 48px", position: "relative", overflow: "hidden" }}>
      <span className="section-tag tl">// 06 — Built for India</span>
      <span className="section-tag tr">Sovereign · Accountable</span>
      <div className="container-narrow" style={{ textAlign: "center", position: "relative" }}>
        <Reveal>
          <div className="eyebrow centered both">Built for India</div>
        </Reveal>
        <Reveal delay={120}>
          <p style={{
            margin: "60px auto 0",

            lineHeight: 1.28,
            letterSpacing: "-0.022em",
            color: "var(--ink-0)",
            maxWidth: "28ch",
            fontWeight: "600", fontSize: "78px"
          }}>
            <CineSplit>Built on Indian soil. <span style={{ color: "var(--ink-2)", fontSize: "70px" }}>Operated under Indian authority. Accountable to Indian doctrine.</span></CineSplit>
          </p>
        </Reveal>
      </div>
    </section>);

}

// ─── 7. Team ──────────────────────────────────────────────
function Team() {
  const team = [
  ["Prashanth Irudayaraj", "CEO"],
  ["Parth Paliwal", "COO"],
  ["Dhruv Jain", "CTO"],
  ["Yashaswa Varshney", "Head of AI Research"],
  ["Arun kumar", "Head of System Architecture"]];


  return (
    <section id="sec-team" className="section" data-screen-label="07 Team">
      <div className="container-narrow" style={{ textAlign: "center" }}>
        <Reveal>
          <div className="eyebrow centered both">Team</div>
        </Reveal>
        <Reveal delay={220}>
          <div style={{ marginTop: 100, borderTop: "1px solid var(--line)" }}>
            {team.map(([name, role], i) =>
            <div key={name} style={{
              display: "grid",
              gridTemplateColumns: "60px 1fr 1fr",
              gap: 32,
              alignItems: "baseline",
              padding: "30px 0",
              borderBottom: "1px solid var(--line)",
              textAlign: "left"
            }}>
                <span className="mono" style={{ color: "var(--ink-3)" }}>0{i + 1}</span>
                <span style={{
                fontFamily: "var(--display)", fontSize: 28, fontWeight: 400,
                letterSpacing: "-0.02em", color: "var(--ink-0)"
              }}>
                  {name}
                </span>
                <span className="mono" style={{ color: "var(--ink-2)" }}>
                  {role}
                </span>
              </div>
            )}
          </div>
        </Reveal>
      </div>
    </section>);

}

// ─── 8. Footer ────────────────────────────────────────────
function Footer() {
  const tw = useTweakValues();
  return (
    <footer style={{
      padding: "80px 48px 60px",
      borderTop: "1px solid var(--line)",
      position: "relative"
    }}>
      <div className="container-wide" style={{
        display: "grid",
        gridTemplateColumns: "1fr auto 1fr",
        alignItems: "center",
        gap: 24
      }}>
        <div style={{ display: "flex", alignItems: "center" }}>
          <Mark height={tw.logoFooter} />
        </div>
        <div className="mono" style={{ color: "var(--ink-2)", textAlign: "center" }}>AALILAA · MUMBAI

        </div>
        <div className="mono" style={{ color: "var(--ink-3)", textAlign: "right" }}>
          © 2026 AALILAA Systems
        </div>
      </div>
    </footer>);

}

// ─── Dark mock "screenshots" ──────────────────────────────
function TactiRadarMock() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf;const start = performance.now();
    const loop = (now) => {setT((now - start) / 1000);raf = requestAnimationFrame(loop);};
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const sweepA = t * 1.2 % (Math.PI * 2);

  return (
    <svg viewBox="0 0 600 320" width="100%" height="100%" style={{ display: "block" }}>
      <defs>
        <radialGradient id="trBg" cx="0.5" cy="0.5" r="0.55">
          <stop offset="0%" stopColor="rgba(95,227,255,0.10)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        <linearGradient id="trSweep" x1="0" x2="1">
          <stop offset="0%" stopColor="rgba(95,227,255,0)" />
          <stop offset="100%" stopColor="rgba(95,227,255,0.35)" />
        </linearGradient>
      </defs>
      <g stroke="rgba(255,255,255,0.04)" strokeWidth="0.5">
        {[...Array(12)].map((_, i) => <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="320" />)}
        {[...Array(6)].map((_, i) => <line key={`h${i}`} x1="0" y1={i * 50} x2="600" y2={i * 50} />)}
      </g>
      <circle cx="300" cy="160" r="130" fill="url(#trBg)" stroke="rgba(255,255,255,0.18)" />
      <g stroke="rgba(255,255,255,0.10)" fill="none">
        <circle cx="300" cy="160" r="92" />
        <circle cx="300" cy="160" r="50" />
        <line x1="170" y1="160" x2="430" y2="160" />
        <line x1="300" y1="30" x2="300" y2="290" />
      </g>
      <g transform={`translate(300 160) rotate(${sweepA * 180 / Math.PI})`}>
        <path d="M 0 0 L 130 0 A 130 130 0 0 0 65 -113 Z" fill="url(#trSweep)" />
        <line x1="0" y1="0" x2="130" y2="0" stroke="rgba(95,227,255,0.7)" />
      </g>
      {[
      [340, 130, "#5fe3ff", 0],
      [260, 190, "#5fe3ff", 1.1],
      [380, 210, "#5fe3ff", 2.3],
      [310, 90, "#ff5a4a", 0.7],
      [220, 120, "#ffb84a", 1.8]].
      map(([x, y, c, ph], i) => {
        const phase = (t * 0.9 + ph) % 3;
        const op = Math.max(0, 1 - phase / 3) * 0.5;
        const r = 6 + Math.max(0, 1 - phase / 3) * 20;
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={r} fill="none" stroke={c} opacity={op} />
            <circle cx={x} cy={y} r="2.5" fill={c} />
          </g>);

      })}
      <g fill="rgba(255,255,255,0.4)" style={{ fontFamily: "Geist Mono", fontSize: 9, letterSpacing: "0.2em" }}>
        <text x="20" y="24">TACTI-RADAR · LIVE</text>
        <text x="580" y="24" textAnchor="end" fill="#5fe3ff">● 18 / 24 TRACKS</text>
        <text x="20" y="306">SECTOR.E-031 · 26.7°N · 053.4°E</text>
        <text x="580" y="306" textAnchor="end">RANGE 220 NM</text>
      </g>
    </svg>);

}

function SoftOpsMock() {
  const [count, setCount] = useState(7);
  useEffect(() => {
    const id = setInterval(() => setCount((c) => 7 + (c + 1) % 3), 1400);
    return () => clearInterval(id);
  }, []);
  const lines = [
  ["03:41:08", "RECON", "scan 18.4.221/24 → 184 hosts", "#ff5a4a"],
  ["03:41:11", "BREACH", "spear-phish landed @ scada.local", "#ff5a4a"],
  ["03:41:14", "LATERAL", "kerberoast → svc_acct → dc01", "#ff5a4a"],
  ["03:41:18", "DEFEND", "honeypot \u201CSubstation-7\u201D engaged", "#5fe3ff"],
  ["03:41:22", "ISOLATE", "VLAN 47 quarantined · 4,212 endpoints", "#5fe3ff"],
  ["03:41:25", "DECEIVE", "false PLC twin online", "#5fe3ff"],
  ["03:41:29", "RESTORE", "grid-east failover · 0 outage", "#5fe3ff"],
  ["03:41:32", "PATCH", "CVE-2025-39811 → 8,420 nodes hot", "#5fe3ff"],
  ["03:41:36", "CORRELATE", "spike T-34s before missile launch", "#ffb84a"]];

  return (
    <svg viewBox="0 0 600 320" width="100%" height="100%" style={{ display: "block" }}>
      <g stroke="rgba(255,255,255,0.04)" strokeWidth="0.5">
        {[...Array(12)].map((_, i) => <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="320" />)}
      </g>
      <g fill="rgba(255,255,255,0.4)" style={{ fontFamily: "Geist Mono", fontSize: 9, letterSpacing: "0.2em" }}>
        <text x="20" y="24">SOFT-OPS · SOC.LIVE</text>
        <text x="580" y="24" textAnchor="end" fill="#5fe3ff">● ENGAGED</text>
      </g>
      <g style={{ fontFamily: "Geist Mono", fontSize: 11, letterSpacing: "0.04em" }}>
        {lines.slice(0, count).map(([ts, k, msg, c], i) =>
        <g key={i} transform={`translate(20 ${64 + i * 26})`} opacity={1 - i * 0.04}>
            <text x="0" y="0" fill="rgba(255,255,255,0.35)">{ts}</text>
            <text x="78" y="0" fill={c}>{k}</text>
            <text x="156" y="0" fill="rgba(255,255,255,0.78)">{msg}</text>
          </g>
        )}
        <text x="20" y="306" fill="rgba(255,255,255,0.35)">$ <tspan fill="#5fe3ff">█</tspan></text>
      </g>
    </svg>);

}

function StrategosMock() {
  const [t, setT] = useState(0);
  useEffect(() => {
    let raf;const start = performance.now();
    const loop = (now) => {setT((now - start) / 1000);raf = requestAnimationFrame(loop);};
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, []);
  const nodes = [
  { id: "VESSEL.K7", x: 340, y: 150, c: "#5fe3ff" },
  { id: "PORT.BANDAR", x: 460, y: 90, c: "rgba(255,255,255,0.8)" },
  { id: "UNIT.ZAFAR", x: 240, y: 92, c: "#ff5a4a" },
  { id: "DEPOT.J", x: 170, y: 190, c: "rgba(255,255,255,0.8)" },
  { id: "APT.GROUP.K", x: 80, y: 110, c: "#ff5a4a" },
  { id: "OBJ.RAVEN", x: 320, y: 240, c: "#ffb84a" },
  { id: "CMD.NODE", x: 320, y: 58, c: "#a6b3bf" },
  { id: "HYPOTHESIS.A", x: 320, y: 108, c: "#a6b3bf" },
  { id: "CSG-7", x: 510, y: 220, c: "#5fe3ff" },
  { id: "ORBIT.A12", x: 510, y: 58, c: "#5fe3ff" }];

  const edges = [
  ["VESSEL.K7", "PORT.BANDAR"], ["UNIT.ZAFAR", "VESSEL.K7"],
  ["UNIT.ZAFAR", "DEPOT.J"], ["APT.GROUP.K", "DEPOT.J"],
  ["VESSEL.K7", "OBJ.RAVEN"], ["OBJ.RAVEN", "CSG-7"],
  ["CMD.NODE", "HYPOTHESIS.A"], ["HYPOTHESIS.A", "OBJ.RAVEN"],
  ["ORBIT.A12", "VESSEL.K7"], ["CMD.NODE", "CSG-7"]];

  const map = {};nodes.forEach((n) => map[n.id] = n);

  return (
    <svg viewBox="0 0 600 320" width="100%" height="100%" style={{ display: "block" }}>
      <g stroke="rgba(255,255,255,0.04)" strokeWidth="0.5">
        {[...Array(12)].map((_, i) => <line key={`v${i}`} x1={i * 50} y1="0" x2={i * 50} y2="320" />)}
      </g>
      <g fill="rgba(255,255,255,0.4)" style={{ fontFamily: "Geist Mono", fontSize: 9, letterSpacing: "0.2em" }}>
        <text x="20" y="24">STRATEGOS · ENTITY.GRAPH</text>
        <text x="580" y="24" textAnchor="end" fill="#5fe3ff">● 3.4M NODES</text>
      </g>
      <g strokeWidth="0.6">
        {edges.map(([a, b], i) => {
          const A = map[a],B = map[b];
          const hot = i % 4 === 0;
          return <line key={i} x1={A.x} y1={A.y} x2={B.x} y2={B.y}
          stroke={hot ? "#5fe3ff" : "rgba(255,255,255,0.16)"}
          strokeDasharray={hot ? "2 3" : "0"} />;
        })}
      </g>
      <g>
        {nodes.map((n, i) => {
          const phase = (t * 1.1 + i * 0.4) % 4;
          const r = 6 + Math.max(0, 1 - phase / 4) * 8;
          const op = Math.max(0, 1 - phase / 4) * 0.5;
          return (
            <g key={n.id}>
              <circle cx={n.x} cy={n.y} r={r} fill="none" stroke={n.c} opacity={op} />
              <rect x={n.x - 4} y={n.y - 4} width="8" height="8" fill="#0a0c0e" stroke={n.c} />
              <circle cx={n.x} cy={n.y} r="1.6" fill={n.c} />
              <text x={n.x + 10} y={n.y + 3} fill="rgba(255,255,255,0.5)"
              style={{ fontFamily: "Geist Mono", fontSize: 8, letterSpacing: "0.16em" }}>
                {n.id}
              </text>
            </g>);

        })}
      </g>
      <text x="20" y="306" fill="rgba(255,255,255,0.45)" style={{ fontFamily: "Geist Mono", fontSize: 9, letterSpacing: "0.2em" }}>
        HYPOTHESIS-A · P=0.78 · DOCTRINE · BLOCKADE-PRE
      </text>
    </svg>);

}

// ─── App ──────────────────────────────────────────────────
function App() {
  const [tweaks, setTweak] = window.useTweaks ? window.useTweaks(TWEAK_DEFAULTS) : [TWEAK_DEFAULTS, () => {}];
  return (
    <TweaksContext.Provider value={{ t: tweaks, setTweak }}>
      <TopNav />
      <Hero />
      <Problem />
      <Manifesto />
      <Platform />
      <Demo />
      <ForIndia />
      <Team />
      <Footer />
      <AalilaaTweaks t={tweaks} setTweak={setTweak} />
    </TweaksContext.Provider>);

}

function AalilaaTweaks({ t, setTweak }) {
  const TP = window.TweaksPanel,TS = window.TweakSection,TK = window.TweakSlider,TT = window.TweakToggle;
  if (!TP) return null;
  return (
    <TP title="Tweaks">
      <TS title="Logo">
        <TK label="Nav logo size" value={t.logoNav} min={24} max={160} step={2} suffix="px" onChange={(v) => setTweak("logoNav", v)} />
        <TK label="Hero logo size" value={t.logoHero} min={40} max={240} step={2} suffix="px" onChange={(v) => setTweak("logoHero", v)} />
        <TK label="Footer logo size" value={t.logoFooter} min={24} max={120} step={2} suffix="px" onChange={(v) => setTweak("logoFooter", v)} />
      </TS>
      <TS title="Hero">
        <TK label="Headline scale" value={t.heroHeadlineSize} min={60} max={140} step={5} suffix="%" onChange={(v) => setTweak("heroHeadlineSize", v)} />
        <TT label="Tactical chrome (grid, corner tags, radar)" value={t.showTacticalChrome} onChange={(v) => setTweak("showTacticalChrome", v)} />
        <TT label="Bottom signal ticker" value={t.showTicker} onChange={(v) => setTweak("showTicker", v)} />
      </TS>
    </TP>);

}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);