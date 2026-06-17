import { useState, useEffect, useRef, useCallback } from "react";

const API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

// ─── AUDIO ENGINE ──────────────────────────────────────────────
let audioCtx = null;
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function beep(freq = 440, dur = 0.1, type = "square", vol = 0.12, delay = 0) {
  try {
    const c = getCtx(), o = c.createOscillator(), g = c.createGain();
    o.connect(g); g.connect(c.destination); o.frequency.value = freq; o.type = type;
    g.gain.setValueAtTime(vol, c.currentTime + delay);
    g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + dur);
    o.start(c.currentTime + delay); o.stop(c.currentTime + delay + dur + 0.01);
  } catch (e) {}
}
function jingle(notes) { notes.forEach(([f, d, du, t = "square", v = 0.12]) => beep(f, du, t, v, d / 1000)); }
function playChicken() { jingle([[200, 0, 0.15, "sawtooth"], [180, 160, 0.25, "sawtooth"], [160, 420, 0.35, "sawtooth", 0.18]]); }
function playPizza() { jingle([[523, 0, 0.08], [659, 80, 0.08], [784, 160, 0.08], [1047, 240, 0.12], [784, 360, 0.08], [523, 440, 0.1]]); }
function playCrash() { jingle([[800, 0, 0.05], [600, 60, 0.05], [400, 120, 0.05], [200, 180, 0.2], [100, 400, 0.4, "sawtooth", 0.2]]); }
function playWin() { jingle([[523, 0, 0.1], [659, 100, 0.1], [784, 200, 0.1], [1047, 300, 0.2, "sine"], [1319, 500, 0.3, "sine"]]); }
function playAlarm() { for (let i = 0; i < 6; i++) { beep(880, 0.08, "square", 0.15, i * 0.15); beep(440, 0.08, "square", 0.1, i * 0.15 + 0.08); } }

// ─── CONSTANTS ────────────────────────────────────────────────
const TAB_COLORS = {
  chicken: "#FFD600", pizza: "#FF3B30", roue: "#A855F7", bouton: "#EF4444",
  battle: "#10B981", crash: "#F97316", meme: "#06B6D4", music: "#EC4899", scores: "#FFD600"
};
const TAB_META = {
  chicken: { title: "🐔 Traducteur Savage Chicken", desc: "Transforme n'importe quoi en chaos poulet" },
  pizza: { title: "🍕 Pizza Attack", desc: "Clique jusqu'à l'indigestion totale" },
  roue: { title: "🎰 Roue du Destin", desc: "Tourne. Subis les conséquences." },
  bouton: { title: "🔴 Le Bouton Inutile", desc: "Ne pas appuyer. Non vraiment." },
  battle: { title: "⚔️ Battle Mode", desc: "Relève un défi en 30 secondes" },
  crash: { title: "💥 Générateur de Crash", desc: "Génère un rapport de crash absurde" },
  meme: { title: "🎭 Générateur de Mèmes", desc: "Mèmes personnalisés et dévastateurs" },
  music: { title: "🎵 Clavier Chaos", desc: "Compose la bande-son du Savage Chicken" },
  scores: { title: "🏆 Hall of Chaos", desc: "Qui a commis le plus de crimes ?" },
};
const PIZZA_MSGS = ["JOJO PIZZA EST LÀ", "T'AS PAS COMMANDÉ ? TANT PIS", "LIVRAISON SAUVAGE", "PIZZA ATTACK !!!", "TU PEUX PAS REFUSER", "400°C SUR TA TRONCHE", "ENCORE UNE PIZZA LOL", "SAVAGE PIZZA ON", "LE FROMAGE DÉBORDE", "PAS DE REMBOURSEMENT"];
const INSULTES = ["T'es un vrai sandwich à la mayo froide", "Ton pseudo c'est un crime contre l'humanité", "Même le savage chicken te respecte pas", "T'as le QI d'une pizza surgelée", "Jojo Pizza pleure en te voyant", "Statistiquement tu es une erreur", "Ta tête ressemble à une pizza d'hier matin", "Le savage chicken refuse de te traduire tellement t'es bête"];
const CRASH_MSGS = ["FATAL ERROR: Trop de pizzas dans le buffer", "SEGFAULT: Le poulet a débordé", "KERNEL PANIC: Savage chicken non géré", "NULL_PTR: La pizza a disparu", "OUT_OF_MEMORY: Cerveau de Jojo plein"];
const REACTIONS = ["Bravo. Rien ne s'est passé.", "Tu recommences vraiment ?", "Le bouton ne sert à rien. Tu le sais.", "Appuie encore. Je t'en supplie.", "C'est la {n}ème fois. Tu vas bien ?", "STOP. ...Non continue.", "Quelque part, un poulet t'observe.", "Ce clic va changer ta vie. Non.", "Tu aurais pu lire un livre.", "Et de {n}. Ça fait quoi ?", "Le bouton t'aime.", "Jojo Pizza désapprouve.", "BK BK BK.", "Le savage chicken te juge.", "Tu es incontrôlable.", "{n} fois. C'est presque impressionnant.", "Je vais le dire à Jojo Pizza.", "Le bouton vibre de honte.", "{n} crimes commis. Aucun regret.", "Il faut arrêter. Mais genre... vraiment."];
const DEFIS = ["Traduis 'Je mange une pizza' en 5 langues en 30 secondes", "Imite le cri du poulet sauvage à voix haute", "Dis 'Jojo Pizza' 10 fois sans te tromper", "Invente un slogan pour le Savage Chicken", "Fais le son d'une pizza qui tombe", "Dis le nom de 5 pizzas sans répéter", "Chante le thème du poulet sauvage", "Imite une pizza en train de cuire", "Dis 'BKAAAAK' 5 fois sans rire", "Invente le nom d'une pizza absurde en 5 secondes"];
const ROUE_OPTS = [
  { label: "Cri de poulet", emoji: "🐔", color: "#FFD600" },
  { label: "Pizza forcée", emoji: "🍕", color: "#FF3B30" },
  { label: "Insulte IA", emoji: "💀", color: "#A855F7" },
  { label: "Rien... ou si ?", emoji: "👁️", color: "#06B6D4" },
  { label: "Double chaos", emoji: "⚡", color: "#F59E0B" },
  { label: "Faux crash", emoji: "💥", color: "#EF4444" },
  { label: "Message honte", emoji: "😭", color: "#EC4899" },
  { label: "Poulet sauvage", emoji: "🔥", color: "#FF6B35" },
];
const PROMPTS = {
  wtf: "Tu es le Savage Chicken. Traduis en langage poulet WTF : mélange BK BK BKAAAAK, caps random, fautes volontaires, 🐔 partout, ton dramatique absurde. 3-4 phrases. Texte : ",
  poetic: "Tu es le Savage Chicken poète. Traduis en poème poulet dramatique avec des rimes approximatives sur les pizzas et poulets. 4 vers. Texte : ",
  angry: "Tu es le Savage Chicken ULTRA FURIEUX. Traduis en MAJUSCULES avec !!! partout et des références à Jojo Pizza. 2-3 phrases. Texte : ",
  corporate: "Tu es le Savage Chicken en réunion. Traduis en jargon corporate absurde mélangé de pizzas et poulets. Style sérieux mais WTF. 2-3 phrases. Texte : ",
  shakespeare: "Tu es le Savage Chicken à l'époque de Shakespeare. Traduis en vieux français dramatique avec des 'ô poulet!' et des références poétiques aux pizzas. 4-5 lignes en vers. Texte : ",
};
const NOTES = ["DO", "RÉ", "MI", "FA", "SOL", "LA", "SI"];
const FREQS = [261.63, 293.66, 329.63, 349.23, 392, 440, 493.88];
const KEY_COLORS = ["#FF3B30", "#FF6B35", "#FFD600", "#10B981", "#06B6D4", "#A855F7", "#EC4899"];
const MEME_STYLE_LABELS = { wtf: "Ultra WTF", tragic: "Tragique", corp: "Corporate", legend: "Légendaire", brutal: "Brutal" };

// ─── API CALL ─────────────────────────────────────────────────
async function callAI(prompt, max = 600) {
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, max_tokens: max, messages: [{ role: "user", content: prompt }] }),
  });
  const d = await r.json();
  return d.content?.find(b => b.type === "text")?.text || "";
}

// ─── PARTICLES ────────────────────────────────────────────────
function Particles({ chaos }) {
  const canvasRef = useRef(null);
  const pts = useRef([]);
  useEffect(() => {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d");
    const colors = ["#FFD600", "#FF3B30", "#A855F7", "#06B6D4", "#10B981", "#EC4899", "#F97316"];
    const resize = () => { cv.width = window.innerWidth; cv.height = window.innerHeight; };
    resize(); window.addEventListener("resize", resize);
    for (let i = 0; i < 50; i++) {
      pts.current.push({ x: Math.random() * cv.width, y: Math.random() * cv.height, vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5, r: Math.random() * 2.5 + 0.5, color: colors[Math.floor(Math.random() * colors.length)], a: Math.random() * 0.35 + 0.05 });
    }
    let raf;
    function draw() {
      ctx.clearRect(0, 0, cv.width, cv.height);
      if (chaos > 15) {
        pts.current.forEach(p => {
          p.x += p.vx * (chaos / 60); p.y += p.vy * (chaos / 60);
          if (p.x < 0) p.x = cv.width; if (p.x > cv.width) p.x = 0;
          if (p.y < 0) p.y = cv.height; if (p.y > cv.height) p.y = 0;
          ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
          ctx.fillStyle = p.color + Math.floor(p.a * 255).toString(16).padStart(2, "0");
          ctx.fill();
        });
      }
      raf = requestAnimationFrame(draw);
    }
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, [chaos]);
  return <canvas ref={canvasRef} style={{ position: "fixed", inset: 0, width: "100%", height: "100%", pointerEvents: "none", zIndex: 0 }} />;
}

// ─── CHAOS BAR ────────────────────────────────────────────────
function ChaosBar({ level }) {
  const color = level < 40 ? "#FFD600" : level < 70 ? "#F97316" : "#FF3B30";
  return (
    <div style={{ padding: "12px 16px", borderBottom: "1px solid #222" }}>
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
        <span style={{ fontSize: 10, letterSpacing: 3, textTransform: "uppercase", color: "#555", fontFamily: "'Bangers',cursive" }}>Niveau de chaos</span>
        <span style={{ fontSize: 11, fontFamily: "'Bangers',cursive", color }}>{level}%{level > 90 ? " 🔥" : ""}</span>
      </div>
      <div style={{ height: 5, background: "#1a1a1a", borderRadius: 3, overflow: "hidden" }}>
        <div style={{ height: "100%", width: `${level}%`, background: color, borderRadius: 3, transition: "width .5s cubic-bezier(.34,1.56,.64,1)" }} />
      </div>
    </div>
  );
}

// ─── SHARED COMPONENTS ────────────────────────────────────────
function Btn({ children, onClick, disabled, color = "#FFD600", full = false, size = "md" }) {
  const pad = size === "lg" ? "12px 28px" : size === "sm" ? "6px 12px" : "9px 18px";
  const fs = size === "lg" ? 18 : size === "sm" ? 12 : 14;
  return (
    <button onClick={onClick} disabled={disabled} style={{ display: "inline-flex", alignItems: "center", gap: 6, padding: pad, borderRadius: 8, border: `1px solid ${color}`, background: color + "18", color, fontFamily: "'Bangers',cursive", fontSize: fs, cursor: disabled ? "not-allowed" : "pointer", opacity: disabled ? 0.35 : 1, transition: "all .15s", letterSpacing: 1, width: full ? "100%" : "auto", justifyContent: "center" }}>
      {children}
    </button>
  );
}

function StatCard({ label, value, color }) {
  return (
    <div style={{ flex: 1, padding: "14px", background: "#181818", border: "1px solid #2a2a2a", borderRadius: 10, textAlign: "center" }}>
      <div style={{ fontFamily: "'Bangers',cursive", fontSize: 24, letterSpacing: 1, lineHeight: 1, marginBottom: 4, color }}>{value}</div>
      <div style={{ fontSize: 9, color: "#555", letterSpacing: 2, textTransform: "uppercase" }}>{label}</div>
    </div>
  );
}

function SectionTitle({ children, color = "#FFD600" }) {
  return <h2 style={{ fontFamily: "'Bangers',cursive", fontSize: 32, letterSpacing: 2, margin: "0 0 4px", color }}>{children}</h2>;
}

function SectionDesc({ children }) {
  return <p style={{ fontSize: 13, color: "#888", marginBottom: 28, lineHeight: 1.6 }}>{children}</p>;
}

function Card({ children, style }) {
  return <div style={{ background: "#111", border: "1px solid #222", borderRadius: 12, padding: 20, ...style }}>{children}</div>;
}

function CardTitle({ children }) {
  return <div style={{ fontSize: 10, color: "#555", letterSpacing: 2, textTransform: "uppercase", marginBottom: 12, fontFamily: "'Bangers',cursive" }}>{children}</div>;
}

function Inp({ value, onChange, onKeyDown, placeholder, rows, style }) {
  const [focused, setFocused] = useState(false);
  const accent = "#FFD600";
  if (rows) {
    return <textarea value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder} rows={rows} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ width: "100%", padding: "10px 14px", background: "#181818", border: `1px solid ${focused ? accent : "#222"}`, borderRadius: 8, color: "#e8e8e8", fontFamily: "'Inter',sans-serif", fontSize: 14, outline: "none", resize: "none", lineHeight: 1.6, transition: "border-color .2s", ...style }} />;
  }
  return <input value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} style={{ width: "100%", padding: "10px 14px", background: "#181818", border: `1px solid ${focused ? accent : "#222"}`, borderRadius: 8, color: "#e8e8e8", fontFamily: "'Inter',sans-serif", fontSize: 14, outline: "none", transition: "border-color .2s", ...style }} />;
}

function ModePills({ modes, active, onSelect, accent = "#FFD600" }) {
  return (
    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 16 }}>
      {modes.map(m => (
        <button key={m.id} onClick={() => onSelect(m.id)} style={{ padding: "6px 14px", borderRadius: 20, border: `1px solid ${active === m.id ? accent : "#222"}`, background: active === m.id ? accent + "18" : "transparent", color: active === m.id ? accent : "#555", fontFamily: "'Bangers',cursive", fontSize: 13, cursor: "pointer", letterSpacing: 1, transition: "all .15s" }}>
          {m.label}
        </button>
      ))}
    </div>
  );
}

// ─── CHICKEN TAB ──────────────────────────────────────────────
function ChickenTab({ addChaos }) {
  const [input, setInput] = useState("");
  const [output, setOutput] = useState("En attente d'une commande... BK ?");
  const [outputColor, setOutputColor] = useState("#888");
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState("wtf");
  const [history, setHistory] = useState([]);
  const accent = "#FFD600";
  const MODES = [{ id: "wtf", label: "🔥 WTF" }, { id: "poetic", label: "🌹 Poétique" }, { id: "angry", label: "😡 Furax" }, { id: "corporate", label: "💼 Corporate" }, { id: "shakespeare", label: "📜 Shakespeare" }];

  async function translate() {
    if (!input.trim() || loading) return;
    setLoading(true); addChaos(8); playChicken();
    try {
      const res = await callAI(PROMPTS[mode] + `"${input}"`);
      setOutput(res); setOutputColor("#e8e8e8");
      setHistory(h => [{ mode, text: res.slice(0, 60) + "..." }, ...h].slice(0, 5));
      beep(880, 0.1, "sine");
    } catch { setOutput("BKAAAAK !!! Poulet crashed."); setOutputColor("#FF3B30"); }
    setLoading(false);
  }

  async function insult() {
    setLoading(true); addChaos(12); playAlarm();
    try {
      const res = await callAI("Génère une insulte absurde, marrante et inoffensive style poulet sauvage en 1 phrase bien WTF. Implique des pizzas ou des poulets.", 300);
      setOutput(res); setOutputColor("#FF3B30");
    } catch { setOutput(INSULTES[Math.floor(Math.random() * INSULTES.length)]); setOutputColor("#FF3B30"); }
    setLoading(false);
  }

  return (
    <div>
      <SectionTitle color={accent}>🐔 Savage Chicken Translator</SectionTitle>
      <SectionDesc>Tape un texte, choisis un mode, et laisse le poulet s'occuper du reste.</SectionDesc>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        <div>
          <CardTitle>Mode de traduction</CardTitle>
          <ModePills modes={MODES} active={mode} onSelect={setMode} accent={accent} />
          <Inp value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && !e.shiftKey && (e.preventDefault(), translate())} placeholder="Tape ici... Le poulet s'occupe du reste." rows={5} style={{ marginBottom: 12 }} />
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={translate} disabled={loading} color={accent} full>{loading ? "Le poulet pense..." : "🐔 Traduire"}</Btn>
            <Btn onClick={insult} disabled={loading} color="#EF4444">⚡ Insulte</Btn>
          </div>
        </div>
        <div>
          <CardTitle>Traduction poulet</CardTitle>
          <div style={{ minHeight: 180, padding: 16, background: "#181818", border: "1px solid #2a2a2a", borderRadius: 10, fontSize: 14, lineHeight: 1.7, color: outputColor, whiteSpace: "pre-wrap" }}>{output}</div>
          {history.length > 0 && (
            <div style={{ marginTop: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              <CardTitle>Historique</CardTitle>
              {history.map((h, i) => (
                <div key={i} style={{ padding: "8px 12px", background: "#181818", border: "1px solid #222", borderRadius: 6, fontSize: 11, color: "#555" }}>
                  <span style={{ color: accent, fontFamily: "'Bangers',cursive", letterSpacing: 1, marginRight: 6 }}>{h.mode.toUpperCase()}</span>{h.text}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── PIZZA TAB ────────────────────────────────────────────────
function PizzaParticle({ x, y, emoji, size, onDone }) {
  const [top, setTop] = useState("-60px");
  useEffect(() => {
    const t1 = setTimeout(() => setTop(y), 30);
    const t2 = setTimeout(onDone, 3000);
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);
  return <div style={{ position: "absolute", left: x, top, fontSize: size, transition: "top .9s cubic-bezier(.22,1,.36,1)", pointerEvents: "none", userSelect: "none" }}>{emoji}</div>;
}

function PizzaTab({ addChaos }) {
  const [pizzas, setPizzas] = useState([]);
  const [presses, setPresses] = useState(0);
  const [totalPizzas, setTotalPizzas] = useState(0);
  const [msg, setMsg] = useState("");
  const [log, setLog] = useState([]);
  const [rage, setRage] = useState(false);
  const emojis = ["🍕", "🍕", "🍕", "🍕", "🫕", "🌮", "🥐", "🍔"];

  function hit() {
    const count = Math.floor(Math.random() * 4) + 2;
    const newOnes = Array.from({ length: count }, (_, i) => ({ id: Date.now() + i, x: `${8 + Math.random() * 80}%`, y: `${15 + Math.random() * 55}%`, emoji: emojis[Math.floor(Math.random() * emojis.length)], size: 40 + Math.floor(Math.random() * 40) }));
    setPizzas(p => [...p, ...newOnes]);
    setPresses(p => p + 1);
    setTotalPizzas(p => p + count);
    addChaos(12); playPizza();
    const m = PIZZA_MSGS[Math.floor(Math.random() * PIZZA_MSGS.length)];
    setMsg(m); setRage(true); setTimeout(() => setRage(false), 300);
    setLog(l => [m, ...l].slice(0, 20));
  }

  return (
    <div>
      <SectionTitle color="#FF3B30">🍕 Pizza Attack</SectionTitle>
      <SectionDesc>Clique jusqu'à l'indigestion totale. Jojo Pizza approve.</SectionDesc>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        <div>
          <button onClick={hit} style={{ width: "100%", padding: "20px", background: "#FF3B30", border: "none", borderRadius: 10, color: "#fff", fontFamily: "'Bangers',cursive", fontSize: 24, cursor: "pointer", letterSpacing: 2, marginBottom: 16, animation: rage ? "shake .3s" : "none", boxShadow: "0 4px 24px #FF3B3044" }}
            onMouseDown={e => e.currentTarget.style.transform = "scale(0.96)"} onMouseUp={e => e.currentTarget.style.transform = "scale(1)"}>
            🍕 PIZZA ATTACK
          </button>
          <div style={{ position: "relative", width: "100%", height: 280, background: "#0e0e0e", borderRadius: 12, overflow: "hidden", border: "1px solid #FF3B3022" }}>
            {pizzas.length === 0 && <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#333", fontSize: 11, fontFamily: "'Bangers',cursive", letterSpacing: 2 }}>EN ATTENTE DE LIVRAISON...</div>}
            {pizzas.map(p => <PizzaParticle key={p.id} x={p.x} y={p.y} emoji={p.emoji} size={p.size} onDone={() => setPizzas(prev => prev.filter(x => x.id !== p.id))} />)}
            {msg && <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center", fontFamily: "'Bangers',cursive", fontSize: 15, color: "#FF3B30", letterSpacing: 2 }}>{msg}</div>}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <CardTitle>Stats de livraison</CardTitle>
            <div style={{ display: "flex", gap: 10 }}>
              <StatCard label="Pizzas" value={totalPizzas} color="#FF3B30" />
              <StatCard label="Presses" value={presses} color="#FFD600" />
              <StatCard label="Indigestion" value={presses > 8 ? "OUI 🤢" : "BIENTÔT"} color="#A855F7" />
            </div>
          </Card>
          <Card>
            <CardTitle>Messages Jojo Pizza</CardTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 200, overflowY: "auto" }}>
              {log.map((m, i) => <div key={i} style={{ fontSize: 11, color: "#FF3B30", padding: "4px 0", borderBottom: "1px solid #1a1a1a", fontFamily: "'Bangers',cursive", letterSpacing: 1 }}>{m}</div>)}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── ROUE TAB ─────────────────────────────────────────────────
function RoueTab({ addChaos, addPizza }) {
  const [spinning, setSpinning] = useState(false);
  const [angle, setAngle] = useState(0);
  const [result, setResult] = useState(null);
  const [resultText, setResultText] = useState("");
  const [history, setHistory] = useState([]);
  const canvasRef = useRef(null);
  const SEG = ROUE_OPTS.length, SEG_A = (2 * Math.PI) / SEG;
  const accent = "#A855F7";

  function drawWheel(rot) {
    const cv = canvasRef.current; if (!cv) return;
    const ctx = cv.getContext("2d"), cx = cv.width / 2, cy = cv.height / 2, r = cx - 8;
    ctx.clearRect(0, 0, cv.width, cv.height);
    ctx.beginPath(); ctx.arc(cx, cy, r + 4, 0, Math.PI * 2); ctx.strokeStyle = accent + "44"; ctx.lineWidth = 2; ctx.stroke();
    ROUE_OPTS.forEach((opt, i) => {
      const start = rot + i * SEG_A - Math.PI / 2, end = start + SEG_A;
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, r, start, end); ctx.closePath();
      ctx.fillStyle = opt.color + "18"; ctx.strokeStyle = opt.color + "55"; ctx.lineWidth = 1; ctx.fill(); ctx.stroke();
      const mid = start + SEG_A / 2;
      ctx.save(); ctx.translate(cx + Math.cos(mid) * r * 0.6, cy + Math.sin(mid) * r * 0.6); ctx.rotate(mid + Math.PI / 2);
      ctx.font = "bold 10px 'Bangers',cursive"; ctx.fillStyle = opt.color; ctx.textAlign = "center";
      ctx.fillText(opt.emoji + " " + opt.label, 0, 0); ctx.restore();
    });
    ctx.beginPath(); ctx.arc(cx, cy, 14, 0, Math.PI * 2); ctx.fillStyle = "#080808"; ctx.strokeStyle = accent; ctx.lineWidth = 2; ctx.fill(); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx + r + 8, cy); ctx.lineTo(cx + r - 10, cy - 6); ctx.lineTo(cx + r - 10, cy + 6); ctx.closePath(); ctx.fillStyle = accent; ctx.fill();
  }

  useEffect(() => { drawWheel(angle); }, [angle]);

  async function spin() {
    if (spinning) return;
    setSpinning(true); setResult(null); setResultText(""); addChaos(20);
    jingle([[200, 0, 0.08], [300, 100, 0.08], [400, 200, 0.08], [600, 300, 0.12]]);
    const totalRot = Math.PI * 2 * (8 + Math.random() * 6), dur = 3800, start = performance.now(), startA = angle;
    function animate(now) {
      const el = now - start, prog = Math.min(el / dur, 1), ease = 1 - Math.pow(1 - prog, 4), cur = startA + totalRot * ease;
      setAngle(cur); drawWheel(cur);
      if (prog < 1) { requestAnimationFrame(animate); return; }
      const norm = ((cur % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      const ptr = (Math.PI * 2 - norm + Math.PI * 2) % (Math.PI * 2);
      const idx = Math.floor(ptr / SEG_A) % SEG;
      const picked = ROUE_OPTS[idx];
      setResult(picked); handleResult(picked); setSpinning(false);
    }
    requestAnimationFrame(animate);
  }

  async function handleResult(opt) {
    playWin();
    setHistory(h => [opt, ...h].slice(0, 10));
    if (opt.label === "Pizza forcée" || opt.label === "Double chaos") addPizza();
    if (opt.label === "Double chaos") { setTimeout(addPizza, 600); addChaos(10); setResultText("DOUBLE PIZZA DOUBLE CHAOS ⚡"); return; }
    if (opt.label === "Faux crash") { setResultText(CRASH_MSGS[Math.floor(Math.random() * CRASH_MSGS.length)]); playCrash(); return; }
    if (opt.label === "Message honte") { setResultText(INSULTES[Math.floor(Math.random() * INSULTES.length)]); return; }
    if (opt.label === "Cri de poulet") { setResultText("BKAAAAAAAAAK BKAK BK BK BKAAAAAAK 🐔🐔🐔 LE POULET EST LIBRE"); playChicken(); return; }
    if (opt.label === "Poulet sauvage") { setResultText("LE SAVAGE CHICKEN EST LIBÉRÉ. TOUT LE MONDE EST EN DANGER. 🔥🐔🔥"); playAlarm(); return; }
    if (opt.label === "Rien... ou si ?") { setResultText("Rien ne se passe..."); setTimeout(() => { setResultText("...GOTCHA 💀 PIZZA EN ROUTE"); addPizza(); }, 2200); return; }
    if (opt.label === "Insulte IA") {
      try { const res = await callAI("Génère une insulte absurde, marrante et inoffensive style poulet sauvage en 1 phrase WTF.", 200); setResultText(res); }
      catch { setResultText("BK BK T'ES NUL"); }
    }
  }

  return (
    <div>
      <SectionTitle color={accent}>🎰 Roue du Destin</SectionTitle>
      <SectionDesc>Tourne. Subis les conséquences. C'est ton karma.</SectionDesc>
      <div style={{ display: "flex", gap: 32, alignItems: "flex-start" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <canvas ref={canvasRef} width={300} height={300} />
          <Btn onClick={spin} disabled={spinning} color={accent} size="lg">{spinning ? "EN ROTATION..." : "🎰 TOURNER"}</Btn>
        </div>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 12 }}>
          <Card>
            <CardTitle>Résultat</CardTitle>
            {result ? (
              <div style={{ textAlign: "center", padding: 8 }}>
                <div style={{ fontSize: 36, marginBottom: 8 }}>{result.emoji}</div>
                <div style={{ fontFamily: "'Bangers',cursive", fontSize: 18, color: result.color, letterSpacing: 1, marginBottom: 8 }}>{result.label}</div>
                {resultText && <div style={{ fontSize: 13, color: "#aaa", lineHeight: 1.6 }}>{resultText}</div>}
              </div>
            ) : <div style={{ minHeight: 80, display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontSize: 11, fontFamily: "'Bangers',cursive", letterSpacing: 2 }}>PAS ENCORE TOURNÉ...</div>}
          </Card>
          <Card>
            <CardTitle>Historique des destins</CardTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 6, maxHeight: 220, overflowY: "auto" }}>
              {history.map((h, i) => (
                <div key={i} style={{ padding: "6px 10px", background: "#181818", border: "1px solid #2a2a2a", borderRadius: 6, fontSize: 11, display: "flex", alignItems: "center", gap: 6 }}>
                  <span>{h.emoji}</span>
                  <span style={{ fontFamily: "'Bangers',cursive", color: h.color, letterSpacing: 1 }}>{h.label}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── BOUTON TAB ───────────────────────────────────────────────
function BoutonTab({ addChaos }) {
  const [count, setCount] = useState(0);
  const [reaction, setReaction] = useState("Ce bouton ne sert absolument à rien.");
  const [scale, setScale] = useState(1);
  const [shake, setShake] = useState(false);
  const [log, setLog] = useState([]);
  const accent = "#EF4444";

  function press() {
    const n = count + 1; setCount(n); addChaos(3); beep(80 + n * 3, 0.1, "sawtooth");
    setScale(s => Math.min(s + 0.04, 2.2));
    setShake(true); setTimeout(() => setShake(false), 400);
    const msg = REACTIONS[Math.floor(Math.random() * REACTIONS.length)].replace("{n}", n);
    setReaction(msg);
    setLog(l => ["#" + n + " — " + msg, ...l].slice(0, 25));
  }

  const sz = Math.round(140 * scale);
  return (
    <div>
      <SectionTitle color={accent}>🔴 Le Bouton Inutile</SectionTitle>
      <SectionDesc>Ne pas appuyer. Non vraiment.</SectionDesc>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        <div>
          <div style={{ display: "flex", justifyContent: "center", margin: "32px 0" }}>
            <button onClick={press} style={{ width: sz, height: sz, borderRadius: "50%", border: `2px solid ${accent}`, background: accent + "12", color: accent, fontFamily: "'Bangers',cursive", fontSize: Math.max(12, 15 - count * 0.1), cursor: "pointer", letterSpacing: 1, transition: "width .3s, height .3s", animation: shake ? "shake .4s" : "none", boxShadow: `0 0 ${8 + count * 2}px ${accent}33` }}>
              NE PAS<br />APPUYER
            </button>
          </div>
          <div style={{ display: "flex", gap: 10 }}>
            <StatCard label="Pressions" value={count} color={accent} />
            <StatCard label="Utilité" value="0%" color="#333" />
            <StatCard label="Taille" value={Math.round(scale * 100) + "%"} color="#A855F7" />
          </div>
        </div>
        <div>
          <CardTitle>Réaction du bouton</CardTitle>
          <div style={{ padding: "14px 18px", background: "#181818", borderRadius: 10, fontSize: 13, color: "#888", lineHeight: 1.6, minHeight: 48, border: "1px solid #2a2a2a", marginBottom: 12 }}>{reaction}</div>
          <CardTitle>Journal des crimes</CardTitle>
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 280, overflowY: "auto" }}>
            {log.map((m, i) => <div key={i} style={{ fontSize: 11, color: "#555", padding: "4px 0", borderBottom: "1px solid #1a1a1a" }}>{m}</div>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── CRASH TAB ────────────────────────────────────────────────
function CrashTab({ addChaos }) {
  const [crashed, setCrashed] = useState(false);
  const [crashMsg, setCrashMsg] = useState("");
  const [log, setLog] = useState([{ text: "_ système en attente", color: "#555" }]);
  const [typing, setTyping] = useState(false);
  const logRef = useRef(null);
  const accent = "#F97316";

  async function doCrash() {
    addChaos(25); playCrash();
    const msg = CRASH_MSGS[Math.floor(Math.random() * CRASH_MSGS.length)];
    setCrashMsg(msg); setCrashed(true); setLog([]); setTyping(false);
    const lines = [
      { text: "> Initialisation système poulet...", color: "#22c55e" },
      { text: "Connecting to pizza.server.bk...", color: "#22c55e" },
      { text: "WARNING: savage_chicken.exe erratique", color: "#F97316" },
      { text: "ERROR: PIZZA_OVERFLOW in jojo_brain.dll", color: "#FF3B30" },
      { text: "Stack trace: BK_NULL → PIZZA_OVERFLOW → JOJO_EXCEPTION", color: "#FF3B30" },
      { text: "> Attempting recovery...", color: "#22c55e" },
      { text: "RECOVERY FAILED: le poulet refuse", color: "#FF3B30" },
      { text: "Generating crash report...", color: "#22c55e" },
    ];
    for (const line of lines) {
      await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
      setLog(l => [...l, line]);
      if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }
    setTyping(true);
    try {
      const ai = await callAI("Tu es un rapport de crash système ultra dramatique et absurde. Génère un faux rapport (6 lignes max) avec des noms de fonctions inventés, des codes d'erreur hexadécimaux, et une cause impliquant Jojo Pizza et le Savage Chicken. Style log système mais WTF.", 400);
      setLog(l => [...l, { text: ai, color: "#FFD600", ai: true }]);
    } catch { setLog(l => [...l, { text: "BKAAAAK_FATAL at 0x4A4F4A4F", color: "#FFD600" }]); }
    setTyping(false);
    setTimeout(() => { if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight; }, 100);
  }

  function reset() {
    setCrashed(false); setLog([{ text: "_ système en attente", color: "#555" }]); setCrashMsg(""); beep(440, 0.15, "sine");
  }

  return (
    <div>
      <SectionTitle color={accent}>💥 Générateur de Crash</SectionTitle>
      <SectionDesc>Génère un rapport de crash IA absurde. Parfait pour troller tes potes.</SectionDesc>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        <div>
          {!crashed ? (
            <div style={{ padding: 28, background: "#111", borderRadius: 12, border: "1px solid #222", textAlign: "center", marginBottom: 16 }}>
              <div style={{ fontSize: 48, marginBottom: 12, animation: "bounce 2s infinite" }}>💻</div>
              <div style={{ fontFamily: "'Bangers',cursive", fontSize: 18, letterSpacing: 1, marginBottom: 6 }}>Tout va bien... pour l'instant.</div>
              <div style={{ fontSize: 12, color: "#555" }}>Appuie pour tout faire exploser.</div>
            </div>
          ) : (
            <div style={{ padding: 14, background: "#FF3B3010", border: "1px solid #FF3B3044", borderRadius: 10, marginBottom: 16 }}>
              <div style={{ fontFamily: "'Bangers',cursive", color: "#FF3B30", fontSize: 18, letterSpacing: 1, marginBottom: 4 }}>💥 CRASH FATAL</div>
              <div style={{ fontSize: 12, color: "#FF3B3088" }}>{crashMsg}</div>
            </div>
          )}
          <div style={{ display: "flex", gap: 8 }}>
            {!crashed && <Btn onClick={doCrash} color={accent}>💥 PROVOQUER LE CRASH</Btn>}
            {crashed && <Btn onClick={reset} color="#555">↩ Réinitialiser</Btn>}
          </div>
        </div>
        <div>
          <CardTitle>Terminal de crash</CardTitle>
          <div ref={logRef} style={{ background: "#050505", border: "1px solid #222", borderRadius: 10, padding: 16, fontFamily: "'Consolas',monospace", fontSize: 11, minHeight: 200, maxHeight: 340, overflowY: "auto" }}>
            {log.map((l, i) => (
              <div key={i} style={{ marginBottom: 3, color: l.color, whiteSpace: l.ai ? "pre-wrap" : "normal", lineHeight: l.ai ? 1.6 : 1.4, borderTop: l.ai ? "1px solid #222" : "none", paddingTop: l.ai ? 10 : 0, marginTop: l.ai ? 10 : 0 }}>{l.text}</div>
            ))}
            {typing && <div style={{ color: "#555", animation: "pulse .8s infinite" }}>_ analyse IA en cours...</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── MEME TAB ─────────────────────────────────────────────────
function MemeTab({ addChaos }) {
  const [pseudo, setPseudo] = useState("");
  const [meme, setMeme] = useState(null);
  const [loading, setLoading] = useState(false);
  const [memeMode, setMemeMode] = useState("wtf");
  const accent = "#06B6D4";
  const MODES = [{ id: "wtf", label: "🔥 Ultra WTF" }, { id: "tragic", label: "😭 Tragique" }, { id: "corp", label: "💼 Corporate" }, { id: "legend", label: "👑 Légendaire" }, { id: "brutal", label: "💀 Brutal" }];

  async function generate() {
    if (!pseudo.trim() || loading) return;
    setLoading(true); setMeme(null); addChaos(15); playWin();
    try {
      const prompt = `Génère un mème textuel style ${MEME_STYLE_LABELS[memeMode]} pour le pseudo "${pseudo}". Format JSON strict : {"titre":"...","texte_haut":"...","texte_bas":"...","emoji_central":"...","couleur":"#hexcode","verdict":"..."}. Absurde, drôle, WTF avec Jojo Pizza et Savage Chicken. Réponds UNIQUEMENT avec le JSON, rien d'autre.`;
      const res = await callAI(prompt, 400);
      const clean = res.replace(/```json|```/g, "").trim();
      setMeme(JSON.parse(clean));
    } catch { setMeme({ titre: "ERREUR DU POULET", texte_haut: "BK BK BK", texte_bas: "LE SAVAGE CHICKEN A PLANTÉ", emoji_central: "🐔", couleur: "#FFD600", verdict: "Désastreux" }); }
    setLoading(false);
  }

  return (
    <div>
      <SectionTitle color={accent}>🎭 Générateur de Mèmes</SectionTitle>
      <SectionDesc>Entre un pseudo, génère un mème personnalisé et dévastateur.</SectionDesc>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        <div>
          <CardTitle>Pseudo cible</CardTitle>
          <Inp value={pseudo} onChange={e => setPseudo(e.target.value)} onKeyDown={e => e.key === "Enter" && generate()} placeholder="Ex: jojo_pizza ou savage_chicken" style={{ marginBottom: 12 }} />
          <CardTitle>Style de mème</CardTitle>
          <ModePills modes={MODES} active={memeMode} onSelect={setMemeMode} accent={accent} />
          <Btn onClick={generate} disabled={loading} color={accent} full>{loading ? "Génération en cours..." : "🎭 Générer le mème"}</Btn>
        </div>
        <div>
          <CardTitle>Résultat</CardTitle>
          {meme ? (
            <div style={{ borderRadius: 12, overflow: "hidden", border: `2px solid ${meme.couleur}` }}>
              <div style={{ background: meme.couleur + "22", padding: "10px 16px" }}>
                <span style={{ fontFamily: "'Bangers',cursive", fontSize: 13, color: meme.couleur, letterSpacing: 2 }}>{meme.titre}</span>
              </div>
              <div style={{ padding: 24, textAlign: "center", background: "#181818" }}>
                <div style={{ fontFamily: "'Bangers',cursive", fontSize: 16, color: "#aaa", letterSpacing: 1, marginBottom: 12, textTransform: "uppercase" }}>{meme.texte_haut}</div>
                <div style={{ fontSize: 64, marginBottom: 12, animation: "bounce 1.5s infinite" }}>{meme.emoji_central}</div>
                <div style={{ fontFamily: "'Bangers',cursive", fontSize: 16, color: meme.couleur, letterSpacing: 1, marginBottom: 16, textTransform: "uppercase" }}>{meme.texte_bas}</div>
                <div style={{ display: "inline-block", padding: "4px 16px", background: meme.couleur + "22", border: `1px solid ${meme.couleur}44`, borderRadius: 4, fontFamily: "'Bangers',cursive", fontSize: 12, color: meme.couleur, letterSpacing: 2 }}>VERDICT : {meme.verdict}</div>
              </div>
            </div>
          ) : <div style={{ minHeight: 200, display: "flex", alignItems: "center", justifyContent: "center", color: "#444", fontSize: 11, fontFamily: "'Bangers',cursive", letterSpacing: 2 }}>EN ATTENTE D'UN PSEUDO...</div>}
        </div>
      </div>
    </div>
  );
}

// ─── BATTLE TAB ───────────────────────────────────────────────
function BattleTab({ addChaos }) {
  const [defi, setDefi] = useState(null);
  const [timer, setTimer] = useState(30);
  const [running, setRunning] = useState(false);
  const [score, setScore] = useState(0);
  const [losses, setLosses] = useState(0);
  const [streak, setStreak] = useState(0);
  const [result, setResult] = useState(null);
  const [battleLog, setBattleLog] = useState([]);
  const [loadingAi, setLoadingAi] = useState(false);
  const intervalRef = useRef(null);
  const accent = "#10B981";

  function startBattle(d) {
    setDefi(d); setTimer(30); setRunning(true); setResult(null);
    addChaos(10); playAlarm();
    clearInterval(intervalRef.current);
    intervalRef.current = setInterval(() => {
      setTimer(t => {
        if (t <= 5) beep(880, 0.05, "square", 0.1);
        if (t <= 1) { clearInterval(intervalRef.current); endBattle(false, d); return 0; }
        return t - 1;
      });
    }, 1000);
  }

  function endBattle(win, d) {
    setRunning(false);
    if (win) { setScore(s => s + 1); setStreak(s => s + 1); addChaos(20); playWin(); }
    else { setLosses(l => l + 1); setStreak(0); playCrash(); }
    setResult(win);
    setBattleLog(l => [{ win, text: (d || defi || "").slice(0, 50) + "..." }, ...l].slice(0, 15));
    setTimeout(() => { setDefi(null); setRunning(false); setResult(null); }, 2500);
  }

  function win() { clearInterval(intervalRef.current); endBattle(true, defi); }
  function cancel() { clearInterval(intervalRef.current); setDefi(null); setRunning(false); setResult(null); }

  async function aiDefi() {
    setLoadingAi(true);
    try {
      const d = await callAI("Génère UN défi fun et absurde lié à Jojo Pizza ou le Savage Chicken, réalisable en 30 secondes. 1 phrase courte, direct, sans intro.", 150);
      startBattle(d || DEFIS[Math.floor(Math.random() * DEFIS.length)]);
    } catch { startBattle(DEFIS[Math.floor(Math.random() * DEFIS.length)]); }
    setLoadingAi(false);
  }

  const timerColor = timer > 15 ? accent : timer > 5 ? "#FFD600" : "#FF3B30";

  return (
    <div>
      <SectionTitle color={accent}>⚔️ Battle Mode</SectionTitle>
      <SectionDesc>Relève un défi en 30 secondes. Échoue = le poulet gagne.</SectionDesc>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        <div>
          {!defi && !result && (
            <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
              <Btn onClick={() => startBattle(DEFIS[Math.floor(Math.random() * DEFIS.length)])} color={accent}>🎲 Défi aléatoire</Btn>
              <Btn onClick={aiDefi} disabled={loadingAi} color="#06B6D4">{loadingAi ? "IA pense..." : "🤖 Défi IA"}</Btn>
            </div>
          )}
          {defi && (
            <div>
              <div style={{ padding: 20, background: "#181818", border: `1px solid ${running ? accent : "#333"}`, borderRadius: 10, marginBottom: 16 }}>
                <div style={{ fontSize: 10, color: "#555", fontFamily: "'Bangers',cursive", letterSpacing: 2, marginBottom: 8 }}>DÉFI EN COURS</div>
                <div style={{ fontFamily: "'Bangers',cursive", fontSize: 17, letterSpacing: 1, lineHeight: 1.5 }}>{defi}</div>
              </div>
              {running && (
                <div style={{ textAlign: "center", marginBottom: 16 }}>
                  <div style={{ fontFamily: "'Bangers',cursive", fontSize: 88, color: timerColor, lineHeight: 1, transition: "color .3s", animation: timer <= 5 ? "pulse .5s infinite" : "none" }}>{timer}</div>
                  <div style={{ fontSize: 10, color: "#555", letterSpacing: 2 }}>SECONDES</div>
                </div>
              )}
              <div style={{ display: "flex", gap: 8 }}>
                {running && <Btn onClick={win} color={accent}>✅ J'ai réussi !</Btn>}
                <Btn onClick={cancel} color="#555">↩ Abandonner</Btn>
              </div>
            </div>
          )}
          {result !== null && (
            <div style={{ padding: 16, borderRadius: 10, background: result ? "#10B98118" : "#FF3B3018", border: `1px solid ${result ? "#10B98144" : "#FF3B3044"}`, fontFamily: "'Bangers',cursive", fontSize: 16, color: result ? accent : "#FF3B30", letterSpacing: 1, textAlign: "center", marginTop: 12 }}>
              {result ? "VICTOIRE 🏆 +1 point Savage !" : "TEMPS ÉCOULÉ 💀 Le poulet gagne."}
            </div>
          )}
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <Card>
            <CardTitle>Score de battle</CardTitle>
            <div style={{ display: "flex", gap: 10 }}>
              <StatCard label="Victoires" value={score} color={accent} />
              <StatCard label="Défaites" value={losses} color="#FF3B30" />
              <StatCard label="Streak" value={streak} color="#FFD600" />
            </div>
          </Card>
          <Card>
            <CardTitle>Historique battles</CardTitle>
            <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 250, overflowY: "auto" }}>
              {battleLog.map((b, i) => (
                <div key={i} style={{ padding: "6px 8px", background: "#181818", borderRadius: 6, border: "1px solid #222", display: "flex", gap: 8, fontSize: 11 }}>
                  <span style={{ color: b.win ? accent : "#FF3B30" }}>{b.win ? "✅" : "💀"}</span>
                  <span style={{ color: "#666", flex: 1 }}>{b.text}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── MUSIC TAB ────────────────────────────────────────────────
function MusicTab({ addChaos, musicOn, setMusicOn }) {
  const [octave, setOctave] = useState(4);
  const [waveType, setWaveType] = useState("square");
  const [playing, setPlaying] = useState([]);
  const [seq, setSeq] = useState([]);
  const [seqPlaying, setSeqPlaying] = useState(false);
  const accent = "#EC4899";
  const WAVES = ["square", "sine", "sawtooth", "triangle"];
  const WAVE_MODES = WAVES.map(w => ({ id: w, label: w }));

  function playNote(i) {
    const freq = FREQS[i] * Math.pow(2, octave - 4);
    beep(freq, 0.4, waveType, 0.15);
    setPlaying(p => [...p, i]);
    setTimeout(() => setPlaying(p => p.filter(x => x !== i)), 400);
    addChaos(1);
    setSeq(s => [...s, i].slice(-32));
  }

  function playSeq() {
    if (seq.length === 0 || seqPlaying) return;
    setSeqPlaying(true);
    let idx = 0;
    const interval = setInterval(() => {
      if (idx >= seq.length) { clearInterval(interval); setSeqPlaying(false); return; }
      const freq = FREQS[seq[idx]] * Math.pow(2, octave - 4);
      beep(freq, 0.35, waveType, 0.12);
      setPlaying(p => [...p, seq[idx]]);
      const noteIdx = seq[idx];
      setTimeout(() => setPlaying(p => p.filter(x => x !== noteIdx)), 350);
      idx++;
    }, 350);
    addChaos(5);
  }

  return (
    <div>
      <SectionTitle color={accent}>🎵 Clavier Chaos</SectionTitle>
      <SectionDesc>Compose la bande-son officielle du Savage Chicken.</SectionDesc>
      <Card style={{ marginBottom: 16 }}>
        <CardTitle>Clavier — Do à Si</CardTitle>
        <div style={{ display: "flex", gap: 6, marginBottom: 20 }}>
          {NOTES.map((n, i) => (
            <button key={i} onClick={() => playNote(i)} style={{ flex: 1, padding: "36px 0", borderRadius: 8, border: `1px solid ${KEY_COLORS[i]}`, background: playing.includes(i) ? KEY_COLORS[i] + "44" : "transparent", color: KEY_COLORS[i], fontFamily: "'Bangers',cursive", fontSize: 14, cursor: "pointer", transition: "all .1s", letterSpacing: 1, transform: playing.includes(i) ? "translateY(-5px)" : "none" }}>
              {n}
            </button>
          ))}
        </div>
        <div style={{ display: "flex", gap: 16, alignItems: "center", flexWrap: "wrap" }}>
          <span style={{ fontSize: 11, color: "#555", fontFamily: "'Bangers',cursive", letterSpacing: 1 }}>OCTAVE</span>
          <input type="range" min={2} max={6} value={octave} onChange={e => setOctave(+e.target.value)} style={{ flex: 1, maxWidth: 200, accentColor: accent }} />
          <span style={{ fontFamily: "'Bangers',cursive", color: accent, fontSize: 14 }}>{octave}</span>
          <span style={{ fontSize: 11, color: "#555", fontFamily: "'Bangers',cursive", letterSpacing: 1 }}>WAVE</span>
          <ModePills modes={WAVE_MODES} active={waveType} onSelect={setWaveType} accent={accent} />
        </div>
      </Card>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}>
        <Card>
          <CardTitle>Séquenceur</CardTitle>
          <div style={{ fontFamily: "'Consolas',monospace", fontSize: 12, color: "#555", minHeight: 40, marginBottom: 10, wordBreak: "break-all" }}>
            {seq.map(i => NOTES[i]).join(" ") || "Joue des notes pour les enregistrer..."}
          </div>
          <div style={{ display: "flex", gap: 8 }}>
            <Btn onClick={playSeq} disabled={seqPlaying || seq.length === 0} color={accent} size="sm">▶ Jouer</Btn>
            <Btn onClick={() => setSeq([])} color="#555" size="sm">✕ Effacer</Btn>
          </div>
        </Card>
        <Card>
          <CardTitle>Musique ambiante</CardTitle>
          <p style={{ fontSize: 12, color: "#888", marginBottom: 12 }}>Active un générateur de musique chaos aléatoire.</p>
          <Btn onClick={() => setMusicOn(m => !m)} color={musicOn ? accent : "#555"} full>
            {musicOn ? "🎵 Arrêter la musique" : "🎵 Activer le chaos musical"}
          </Btn>
        </Card>
      </div>
    </div>
  );
}

// ─── SCORES TAB ───────────────────────────────────────────────
function ScoresTab({ chaos, crimes }) {
  const [name, setName] = useState("");
  const [scores, setScores] = useState([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const accent = "#FFD600";
  const medals = ["🥇", "🥈", "🥉"];

  useEffect(() => { loadScores(); }, []);

  async function loadScores() {
    setLoading(true);
    try {
      const keys = await window.storage.list("leaderboard:");
      const entries = await Promise.all((keys.keys || []).map(async k => {
        try { const r = await window.storage.get(k, true); return r ? JSON.parse(r.value) : null; } catch { return null; }
      }));
      setScores(entries.filter(Boolean).sort((a, b) => b.crimes - a.crimes).slice(0, 10));
    } catch { setScores([]); }
    setLoading(false);
  }

  async function saveScore() {
    if (!name.trim()) return;
    playWin();
    const entry = { name: name.trim(), crimes, chaos, date: new Date().toLocaleDateString("fr") };
    try { await window.storage.set(`leaderboard:${name.trim().toLowerCase().replace(/\s/g, "-")}`, JSON.stringify(entry), true); } catch (e) {}
    setSaved(true); loadScores();
  }

  return (
    <div>
      <SectionTitle color={accent}>🏆 Hall of Chaos</SectionTitle>
      <SectionDesc>Qui a commis le plus de crimes ? Sauvegarde ton score et défie le monde.</SectionDesc>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 24, alignItems: "start" }}>
        <div>
          <Card style={{ marginBottom: 16 }}>
            <CardTitle>Ton score actuel</CardTitle>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <StatCard label="Crimes" value={crimes} color={accent} />
              <StatCard label="Chaos" value={chaos + "%"} color="#FF3B30" />
            </div>
            {!saved ? (
              <div style={{ display: "flex", gap: 8 }}>
                <Inp value={name} onChange={e => setName(e.target.value)} onKeyDown={e => e.key === "Enter" && saveScore()} placeholder="Ton pseudo..." style={{ flex: 1 }} />
                <Btn onClick={saveScore} color={accent}>💾 Sauver</Btn>
              </div>
            ) : (
              <div style={{ fontSize: 12, color: "#10B981", fontFamily: "'Bangers',cursive", letterSpacing: 1 }}>✅ Score sauvegardé !</div>
            )}
          </Card>
        </div>
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
            <CardTitle>Classement mondial</CardTitle>
            <button onClick={loadScores} style={{ fontSize: 11, color: "#444", background: "none", border: "none", cursor: "pointer", fontFamily: "'Bangers',cursive", letterSpacing: 1 }}>↻ RAFRAÎCHIR</button>
          </div>
          {loading ? (
            <div style={{ textAlign: "center", padding: 24, color: "#444", fontSize: 12, fontFamily: "'Bangers',cursive", letterSpacing: 2 }}>CHARGEMENT...</div>
          ) : scores.length === 0 ? (
            <div style={{ textAlign: "center", padding: 24, color: "#333", fontSize: 12, fontFamily: "'Bangers',cursive", letterSpacing: 1 }}>PAS ENCORE DE SCORES. SOIS LE PREMIER.</div>
          ) : scores.map((s, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 16px", background: "#111", borderRadius: 8, marginBottom: 6, border: `1px solid ${i === 0 ? "#FFD60033" : "#222"}` }}>
              <span style={{ fontSize: 20, width: 28 }}>{medals[i] || `${i + 1}.`}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontFamily: "'Bangers',cursive", fontSize: 15, letterSpacing: 1, color: i === 0 ? accent : "#e8e8e8" }}>{s.name}</div>
                <div style={{ fontSize: 10, color: "#555" }}>{s.date}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Bangers',cursive", fontSize: 17, color: accent }}>{s.crimes} crimes</div>
                <div style={{ fontSize: 10, color: "#555" }}>{s.chaos}% chaos</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState("chicken");
  const [chaos, setChaos] = useState(12);
  const [crimes, setCrimes] = useState(0);
  const [musicOn, setMusicOn] = useState(false);
  const [pizzas, setPizzas] = useState([]);
  const ambientRef = useRef(null);

  const addChaos = useCallback((n = 10) => {
    setChaos(p => Math.min(100, p + n));
    setCrimes(p => p + 1);
  }, []);

  const addPizza = useCallback(() => {
    setPizzas(p => [...p, { id: Date.now() }]);
    playPizza(); addChaos(15);
  }, [addChaos]);

  // Ambient music
  useEffect(() => {
    if (!musicOn) { if (ambientRef.current) ambientRef.current(); return; }
    let running = true;
    ambientRef.current = () => { running = false; };
    const notes = [262, 294, 330, 349, 392, 440, 494, 523];
    function next() {
      if (!running) return;
      beep(notes[Math.floor(Math.random() * notes.length)] * (Math.random() > 0.3 ? 1 : 2), 0.12, "sine", 0.05);
      setTimeout(next, 200 + Math.random() * 500);
    }
    next();
    return () => { running = false; };
  }, [musicOn]);

  const accentColor = TAB_COLORS[tab] || "#FFD600";
  const chaosColor = chaos < 40 ? "#FFD600" : chaos < 70 ? "#F97316" : "#FF3B30";

  const TABS = [
    { section: "Principal", items: [{ id: "chicken", icon: "🐔", label: "Traducteur" }, { id: "pizza", icon: "🍕", label: "Pizza Attack" }] },
    { section: "Mini-jeux", items: [{ id: "roue", icon: "🎰", label: "Roue du Destin" }, { id: "bouton", icon: "🔴", label: "Bouton Inutile" }, { id: "battle", icon: "⚔️", label: "Battle Mode" }] },
    { section: "Création", items: [{ id: "crash", icon: "💥", label: "Faux Crash" }, { id: "meme", icon: "🎭", label: "Générateur Mème" }, { id: "music", icon: "🎵", label: "Clavier Chaos" }] },
    { section: "Social", items: [{ id: "scores", icon: "🏆", label: "Hall of Chaos" }] },
  ];

  const css = `
    @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Inter:wght@400;500;600&display=swap');
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: #0a0a0a; color: #e8e8e8; font-family: 'Inter', sans-serif; overflow: hidden; }
    @keyframes pulse { from { opacity: 1 } to { opacity: .4 } }
    @keyframes shake { 0%,100%{transform:translate(0)} 20%{transform:translate(-5px,2px)} 40%{transform:translate(5px,-2px)} 60%{transform:translate(-3px,3px)} 80%{transform:translate(3px,-3px)} }
    @keyframes bounce { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-6px)} }
    @keyframes fadein { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:translateY(0)} }
    ::-webkit-scrollbar { width: 4px } ::-webkit-scrollbar-thumb { background: #222; border-radius: 2px }
    textarea, input { color-scheme: dark }
  `;

  return (
    <div style={{ display: "flex", height: "100vh", width: "100vw", overflow: "hidden" }}>
      <style>{css}</style>
      <Particles chaos={chaos} />

      {/* SIDEBAR */}
      <div style={{ width: 220, minWidth: 220, background: "#111", borderRight: "1px solid #222", display: "flex", flexDirection: "column", position: "relative", zIndex: 10 }}>
        {/* Header */}
        <div style={{ padding: "20px 16px 12px", borderBottom: "1px solid #222" }}>
          <div style={{ fontFamily: "'Bangers',cursive", fontSize: 20, letterSpacing: 2, lineHeight: 1.1 }}>
            <span style={{ color: "#FF3B30" }}>JOJO</span><span style={{ color: "#444" }}> & </span><span style={{ color: "#FFD600" }}>SAVAGE</span>
          </div>
          <div style={{ fontSize: 10, color: "#444", letterSpacing: 3, textTransform: "uppercase", marginTop: 2 }}>Chaos App v3.0</div>
        </div>
        {/* Stats */}
        <div style={{ display: "flex", gap: 8, padding: "12px 16px", borderBottom: "1px solid #222" }}>
          {[{ val: crimes, lbl: "Crimes" }, { val: chaos + "%", lbl: "Chaos" }].map(s => (
            <div key={s.lbl} style={{ flex: 1, background: "#181818", border: "1px solid #2a2a2a", borderRadius: 8, padding: 8, textAlign: "center" }}>
              <div style={{ fontFamily: "'Bangers',cursive", fontSize: 22, lineHeight: 1, color: chaosColor }}>{s.val}</div>
              <div style={{ fontSize: 9, color: "#444", letterSpacing: 2, textTransform: "uppercase", marginTop: 2 }}>{s.lbl}</div>
            </div>
          ))}
        </div>
        {/* Chaos bar */}
        <ChaosBar level={chaos} />
        {/* Nav */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }}>
          {TABS.map(group => (
            <div key={group.section}>
              <div style={{ padding: "8px 16px 4px", fontSize: 9, color: "#444", letterSpacing: 3, textTransform: "uppercase" }}>{group.section}</div>
              {group.items.map(t => {
                const active = tab === t.id;
                const color = TAB_COLORS[t.id];
                return (
                  <div key={t.id} onClick={() => { setTab(t.id); beep(440, 0.04); }} style={{ display: "flex", alignItems: "center", gap: 10, padding: "10px 16px", cursor: "pointer", transition: "all .15s", fontSize: 13, color: active ? color : "#555", background: active ? "#181818" : "transparent", borderLeft: `2px solid ${active ? color : "transparent"}` }}
                    onMouseEnter={e => { if (!active) { e.currentTarget.style.background = "#181818"; e.currentTarget.style.color = "#e8e8e8"; } }}
                    onMouseLeave={e => { if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.color = "#555"; } }}>
                    <span style={{ fontSize: 16, width: 20, textAlign: "center" }}>{t.icon}</span>
                    {t.label}
                  </div>
                );
              })}
            </div>
          ))}
        </div>
        {/* Music toggle */}
        <div style={{ padding: "12px 16px", borderTop: "1px solid #222" }}>
          <button onClick={() => setMusicOn(m => !m)} style={{ width: "100%", padding: 8, background: musicOn ? "#EC489910" : "#181818", border: `1px solid ${musicOn ? "#EC4899" : "#2a2a2a"}`, borderRadius: 8, color: musicOn ? "#EC4899" : "#555", fontFamily: "'Bangers',cursive", fontSize: 13, cursor: "pointer", letterSpacing: 1, transition: "all .2s" }}>
            {musicOn ? "🎵 Musique ON" : "🎵 Musique OFF"}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", minWidth: 0, position: "relative", zIndex: 5 }}>
        {/* Topbar */}
        <div style={{ padding: "16px 28px", borderBottom: "1px solid #222", background: "#11111188", backdropFilter: "blur(8px)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div>
            <div style={{ fontFamily: "'Bangers',cursive", fontSize: 28, letterSpacing: 2, color: accentColor, transition: "color .3s" }}>{TAB_META[tab].title}</div>
            <div style={{ fontSize: 12, color: "#555", marginTop: 2 }}>{TAB_META[tab].desc}</div>
          </div>
          <div style={{ padding: "6px 14px", background: "#181818", border: "1px solid #222", borderRadius: 8, fontFamily: "'Bangers',cursive", fontSize: 13, letterSpacing: 1, color: chaosColor }}>
            CHAOS {chaos}%
          </div>
        </div>
        {/* Content */}
        <div style={{ flex: 1, overflowY: "auto", padding: "32px 36px" }}>
          {tab === "chicken" && <ChickenTab addChaos={addChaos} />}
          {tab === "pizza" && <PizzaTab addChaos={addChaos} />}
          {tab === "roue" && <RoueTab addChaos={addChaos} addPizza={addPizza} />}
          {tab === "bouton" && <BoutonTab addChaos={addChaos} />}
          {tab === "battle" && <BattleTab addChaos={addChaos} />}
          {tab === "crash" && <CrashTab addChaos={addChaos} />}
          {tab === "meme" && <MemeTab addChaos={addChaos} />}
          {tab === "music" && <MusicTab addChaos={addChaos} musicOn={musicOn} setMusicOn={setMusicOn} />}
          {tab === "scores" && <ScoresTab chaos={chaos} crimes={crimes} />}
        </div>
      </div>
    </div>
  );
}