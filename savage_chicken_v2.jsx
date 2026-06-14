import { useState, useEffect, useRef, useCallback } from "react";

const API = "https://api.anthropic.com/v1/messages";

// ─── AUDIO ENGINE ──────────────────────────────────────────────
let audioCtx = null;
function getCtx() {
  if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  return audioCtx;
}
function beep(freq=440,dur=0.1,type="square",vol=0.12,delay=0){
  try{const c=getCtx(),o=c.createOscillator(),g=c.createGain();
  o.connect(g);g.connect(c.destination);o.frequency.value=freq;o.type=type;
  g.gain.setValueAtTime(vol,c.currentTime+delay);
  g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+delay+dur);
  o.start(c.currentTime+delay);o.stop(c.currentTime+delay+dur+0.01);}catch(e){}
}
function jingle(notes){notes.forEach(([f,d,du,t="square",v=0.12])=>beep(f,du,t,v,d/1000));}
function playChicken(){jingle([[200,0,0.15,"sawtooth"],[180,160,0.25,"sawtooth"],[160,420,0.35,"sawtooth",0.18]]);}
function playPizza(){jingle([[523,0,0.08],[659,80,0.08],[784,160,0.08],[1047,240,0.12],[784,360,0.08],[523,440,0.1]]);}
function playCrash(){jingle([[800,0,0.05],[600,60,0.05],[400,120,0.05],[200,180,0.2],[100,400,0.4,"sawtooth",0.2]]);}
function playWin(){jingle([[523,0,0.1],[659,100,0.1],[784,200,0.1],[1047,300,0.2,"sine"],[1319,500,0.3,"sine"]]);}
function playAlarm(){for(let i=0;i<6;i++){beep(880,0.08,"square",0.15,i*0.15);beep(440,0.08,"square",0.1,i*0.15+0.08);}}

// ─── CONSTANTS ────────────────────────────────────────────────
const TABS=[
  {id:"chicken",icon:"🐔",label:"Translator"},
  {id:"pizza",icon:"🍕",label:"Pizza"},
  {id:"roue",icon:"🎰",label:"Destin"},
  {id:"bouton",icon:"🔴",label:"Inutile"},
  {id:"crash",icon:"💥",label:"Crash"},
  {id:"meme",icon:"🎭",label:"Mème"},
  {id:"battle",icon:"⚔️",label:"Battle"},
  {id:"music",icon:"🎵",label:"Musique"},
  {id:"scores",icon:"🏆",label:"Scores"},
];
const TAB_COLORS={chicken:"#FFD600",pizza:"#FF3B30",roue:"#A855F7",bouton:"#EF4444",crash:"#F97316",meme:"#06B6D4",battle:"#10B981",music:"#EC4899",scores:"#FFD600"};
const PIZZA_MSGS=["JOJO PIZZA EST LÀ","T'AS PAS COMMANDÉ ? TANT PIS","LIVRAISON SAUVAGE","PIZZA ATTACK !!!","TU PEUX PAS REFUSER","400°C SUR TA TRONCHE","ENCORE UNE PIZZA LOL","SAVAGE PIZZA ON"];
const INSULTES=["T'es un vrai sandwich à la mayo froide","Ton pseudo c'est un crime contre l'humanité","Même le savage chicken te respecte pas","T'as le QI d'une pizza surgelée","Jojo Pizza pleure en te voyant","Statistiquement tu es une erreur","Même les poulets font mieux que toi"];
const CRASH_MSGS=["FATAL ERROR: Trop de pizzas dans le buffer","SEGFAULT: Le poulet a débordé","KERNEL PANIC: Savage chicken non géré","NULL_PTR: La pizza a disparu","OUT_OF_MEMORY: Cerveau de Jojo plein"];
const ROUE_OPTS=[
  {label:"Cri de poulet",emoji:"🐔",color:"#FFD600"},
  {label:"Pizza forcée",emoji:"🍕",color:"#FF3B30"},
  {label:"Insulte IA",emoji:"💀",color:"#A855F7"},
  {label:"Rien... ou si ?",emoji:"👁️",color:"#06B6D4"},
  {label:"Double chaos",emoji:"⚡",color:"#F59E0B"},
  {label:"Faux crash",emoji:"💥",color:"#EF4444"},
  {label:"Message honte",emoji:"😭",color:"#EC4899"},
  {label:"Poulet sauvage",emoji:"🔥",color:"#FF6B35"},
];
const BATTLE_DEFIS=[
  "Traduis 'Je mange une pizza' en 5 langues en 30 secondes","Imite le cri du poulet sauvage à voix haute","Dis 'Jojo Pizza' 10 fois sans te tromper","Invente un slogan pour le Savage Chicken","Fais le son d'une pizza qui tombe","Dis le nom de 5 pizzas sans répéter","Chante le thème du poulet sauvage","Imite une pizza en train de cuire",
];

// ─── PARTICLE SYSTEM ──────────────────────────────────────────
function Particles({active=true}){
  const canvasRef=useRef(null);
  const particles=useRef([]);
  const raf=useRef(null);
  useEffect(()=>{
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");
    const resize=()=>{canvas.width=canvas.offsetWidth;canvas.height=canvas.offsetHeight;};
    resize();window.addEventListener("resize",resize);
    const colors=["#FFD600","#FF3B30","#A855F7","#06B6D4","#10B981","#EC4899","#F97316"];
    for(let i=0;i<40;i++){
      particles.current.push({x:Math.random()*canvas.width,y:Math.random()*canvas.height,vx:(Math.random()-0.5)*0.6,vy:(Math.random()-0.5)*0.6,size:Math.random()*3+1,color:colors[Math.floor(Math.random()*colors.length)],alpha:Math.random()*0.4+0.1});
    }
    function draw(){
      ctx.clearRect(0,0,canvas.width,canvas.height);
      if(!active){raf.current=requestAnimationFrame(draw);return;}
      particles.current.forEach(p=>{
        p.x+=p.vx;p.y+=p.vy;
        if(p.x<0)p.x=canvas.width;if(p.x>canvas.width)p.x=0;
        if(p.y<0)p.y=canvas.height;if(p.y>canvas.height)p.y=0;
        ctx.beginPath();ctx.arc(p.x,p.y,p.size,0,Math.PI*2);
        ctx.fillStyle=p.color+Math.floor(p.alpha*255).toString(16).padStart(2,"0");
        ctx.fill();
      });
      raf.current=requestAnimationFrame(draw);
    }
    draw();
    return()=>{cancelAnimationFrame(raf.current);window.removeEventListener("resize",resize);};
  },[active]);
  return <canvas ref={canvasRef} style={{position:"fixed",inset:0,width:"100%",height:"100%",pointerEvents:"none",zIndex:0}}/>;
}

// ─── GLITCH TEXT ──────────────────────────────────────────────
function GlitchText({text,color="#FFD600",size=28}){
  const [glitch,setGlitch]=useState(false);
  useEffect(()=>{
    const id=setInterval(()=>{setGlitch(true);setTimeout(()=>setGlitch(false),150);},3000+Math.random()*4000);
    return()=>clearInterval(id);
  },[]);
  return(
    <span style={{position:"relative",display:"inline-block",fontFamily:"'Bangers',cursive",fontSize:size,letterSpacing:2,color,
      textShadow:glitch?`3px 0 #FF3B30,-3px 0 #06B6D4,0 0 8px ${color}`:`0 0 12px ${color}44`,
      transition:"text-shadow 0.1s"}}>
      {text}
    </span>
  );
}

// ─── CHAOS BAR ────────────────────────────────────────────────
function ChaosBar({level}){
  const color=level<40?"#FFD600":level<70?"#F97316":"#FF3B30";
  const pulse=level>80;
  return(
    <div style={{marginBottom:16}}>
      <div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}>
        <span style={{fontSize:10,letterSpacing:3,textTransform:"uppercase",color:"#444",fontFamily:"'Bangers',cursive"}}>Niveau de chaos</span>
        <span style={{fontSize:12,fontFamily:"'Bangers',cursive",color,animation:pulse?"pulse 0.5s infinite alternate":""}}>{level}%{level>90?" 🔥 MAXIMUM":""}</span>
      </div>
      <div style={{height:6,background:"#1a1a1a",borderRadius:3,overflow:"hidden",border:`1px solid ${color}22`}}>
        <div style={{height:"100%",width:`${level}%`,background:`linear-gradient(90deg,${color}88,${color})`,borderRadius:3,transition:"width 0.5s cubic-bezier(0.34,1.56,0.64,1)",boxShadow:`0 0 8px ${color}66`}}/>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────
export default function App(){
  const [tab,setTab]=useState("chicken");
  const [chaos,setChaos]=useState(12);
  const [crimes,setCrimes]=useState(0);
  const [musicOn,setMusicOn]=useState(false);
  const [pizzas,setPizzas]=useState([]);
  const musicRef=useRef(null);

  const addChaos=useCallback((n=10)=>{setChaos(p=>Math.min(100,p+n));setCrimes(p=>p+1);},[]);
  const addPizza=useCallback(()=>{
    const count=Math.floor(Math.random()*4)+1;
    const newOnes=Array.from({length:count},(_,i)=>({id:Date.now()+i,x:`${8+Math.random()*78}%`,y:`${15+Math.random()*55}%`,emoji:Math.random()>0.15?"🍕":["🫕","🌮","🥐","🍔"][Math.floor(Math.random()*4)],size:44+Math.floor(Math.random()*52)}));
    setPizzas(p=>[...p,...newOnes]);playPizza();addChaos(15);
  },[addChaos]);

  // Ambient music loop
  useEffect(()=>{
    if(!musicOn)return;
    let running=true;
    const notes=[262,294,330,349,392,440,494,523];
    let i=0;
    function next(){
      if(!running)return;
      const n=notes[Math.floor(Math.random()*notes.length)]*(Math.random()>0.3?1:2);
      beep(n,0.15,"sine",0.06);
      setTimeout(next,200+Math.random()*400);
    }
    next();
    return()=>{running=false;};
  },[musicOn]);

  const accentColor=TAB_COLORS[tab]||"#FFD600";

  return(
    <div style={{fontFamily:"'Inter',sans-serif",background:"#080808",minHeight:"100vh",color:"#E8E8E8",position:"relative"}}>
      <link href="https://fonts.googleapis.com/css2?family=Bangers&family=Inter:wght@400;500&display=swap" rel="stylesheet"/>
      <style>{`
        @keyframes pulse{from{opacity:1}to{opacity:0.4}}
        @keyframes shake{0%,100%{transform:translate(0)}20%{transform:translate(-6px,2px)}40%{transform:translate(6px,-2px)}60%{transform:translate(-4px,4px)}80%{transform:translate(4px,-4px)}}
        @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-8px)}}
        @keyframes spin360{from{transform:rotate(0deg)}to{transform:rotate(360deg)}}
        @keyframes flicker{0%,100%{opacity:1}50%{opacity:0.7}75%{opacity:0.9}}
        @keyframes slide-in{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
        @keyframes glow{from{box-shadow:0 0 4px ${accentColor}44}to{box-shadow:0 0 16px ${accentColor}88}}
        ::-webkit-scrollbar{width:4px;background:#111}::-webkit-scrollbar-thumb{background:#333;border-radius:2px}
        textarea,input{color-scheme:dark}
      `}</style>
      <Particles active={chaos>20}/>

      {/* HEADER */}
      <div style={{position:"relative",zIndex:10,padding:"20px 16px 0",borderBottom:"1px solid #151515",background:"#08080888",backdropFilter:"blur(8px)"}}>
        <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:12}}>
          <div>
            <div style={{fontSize:10,letterSpacing:4,color:accentColor,textTransform:"uppercase",fontFamily:"'Bangers',cursive",marginBottom:2,transition:"color 0.3s"}}>THE OFFICIAL APP OF</div>
            <div style={{lineHeight:1.05}}>
              <GlitchText text="JOJO PIZZA" color="#FF3B30" size={32}/>
              <span style={{fontFamily:"'Bangers',cursive",fontSize:32,color:"#444",margin:"0 8px"}}>&</span>
              <GlitchText text="SAVAGE CHICKEN" color="#FFD600" size={32}/>
            </div>
          </div>
          <div style={{display:"flex",flexDirection:"column",alignItems:"flex-end",gap:6}}>
            <div style={{textAlign:"right"}}>
              <div style={{fontSize:9,color:"#444",letterSpacing:2,fontFamily:"'Bangers',cursive"}}>CRIMES</div>
              <div style={{fontSize:28,fontFamily:"'Bangers',cursive",color:chaos>70?"#FF3B30":"#FFD600",lineHeight:1,textShadow:`0 0 8px ${chaos>70?"#FF3B30":"#FFD600"}44`}}>{crimes}</div>
            </div>
            <button onClick={()=>setMusicOn(m=>!m)} style={{padding:"4px 10px",border:`1px solid ${musicOn?"#EC4899":"#222"}`,borderRadius:4,background:musicOn?"#EC4899":"transparent",color:musicOn?"#fff":"#555",fontSize:10,fontFamily:"'Bangers',cursive",cursor:"pointer",letterSpacing:1,transition:"all 0.2s"}}>
              {musicOn?"🎵 ON":"🎵 OFF"}
            </button>
          </div>
        </div>
        <ChaosBar level={chaos}/>
        {/* TABS */}
        <div style={{display:"flex",gap:4,overflowX:"auto",paddingBottom:12,scrollbarWidth:"none"}}>
          {TABS.map(t=>{
            const active=tab===t.id;
            const c=TAB_COLORS[t.id];
            return(
              <button key={t.id} onClick={()=>{setTab(t.id);beep(440,0.05);}} style={{
                padding:"6px 10px",borderRadius:6,border:`1px solid ${active?c:"#1c1c1c"}`,
                background:active?c+"18":"transparent",color:active?c:"#555",
                fontFamily:"'Bangers',cursive",fontSize:13,letterSpacing:1,
                cursor:"pointer",whiteSpace:"nowrap",transition:"all 0.15s",
                boxShadow:active?`0 0 8px ${c}33`:"none",
              }}>
                {t.icon} {t.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* CONTENT */}
      <div style={{position:"relative",zIndex:5,padding:"20px 16px 40px",animation:"slide-in 0.25s ease"}}>
        {tab==="chicken"&&<ChickenTab addChaos={addChaos} accent={accentColor}/>}
        {tab==="pizza"&&<PizzaTab addPizza={addPizza} pizzas={pizzas} setPizzas={setPizzas} accent={accentColor}/>}
        {tab==="roue"&&<RoueTab addChaos={addChaos} addPizza={addPizza} accent={accentColor}/>}
        {tab==="bouton"&&<BoutonTab addChaos={addChaos} accent={accentColor}/>}
        {tab==="crash"&&<CrashTab addChaos={addChaos} accent={accentColor}/>}
        {tab==="meme"&&<MemeTab addChaos={addChaos} accent={accentColor}/>}
        {tab==="battle"&&<BattleTab addChaos={addChaos} accent={accentColor}/>}
        {tab==="music"&&<MusicTab addChaos={addChaos} musicOn={musicOn} setMusicOn={setMusicOn} accent={accentColor}/>}
        {tab==="scores"&&<ScoresTab addChaos={addChaos} crimes={crimes} chaos={chaos} accent={accentColor}/>}
      </div>
    </div>
  );
}

// ─── CHICKEN TRANSLATOR ───────────────────────────────────────
function ChickenTab({addChaos,accent}){
  const [input,setInput]=useState("");
  const [output,setOutput]=useState("");
  const [loading,setLoading]=useState(false);
  const [mode,setMode]=useState("wtf");// wtf | poetic | angry | corporate
  const MODES=[{id:"wtf",label:"🔥 WTF"},  {id:"poetic",label:"🌹 Poétique"},{id:"angry",label:"😡 Furax"},{id:"corporate",label:"💼 Corporate"}];
  const PROMPTS={
    wtf:`Tu es le Savage Chicken. Traduis en langage poulet WTF : mélange BK BK BKAAAAK, caps random, fautes volontaires, 🐔 partout, ton dramatique absurde. 3-4 phrases. Texte : `,
    poetic:`Tu es le Savage Chicken poète. Traduis ce texte en poème poulet dramatique et absurde avec des rimes approximatives sur les pizzas et les poulets. 4 vers. Texte : `,
    angry:`Tu es le Savage Chicken ULTRA FURIEUX. Traduis ce texte comme si tu étais un poulet en colère qui hurle tout en MAJUSCULES, avec des !!! partout et des références à Jojo Pizza. 2-3 phrases. Texte : `,
    corporate:`Tu es le Savage Chicken en réunion d'entreprise. Traduis ce texte en jargon corporate absurde mélangé avec des références à des pizzas et poulets. Style sérieux mais WTF. 2-3 phrases. Texte : `,
  };

  async function translate(){
    if(!input.trim()||loading)return;
    setLoading(true);setOutput("");addChaos(8);playChicken();
    try{
      const res=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:1000,messages:[{role:"user",content:PROMPTS[mode]+`"${input}"`}]})});
      const data=await res.json();
      setOutput(data.content?.find(b=>b.type==="text")?.text||"BKAAAAK erreur fatale");
      beep(880,0.1,"sine");
    }catch{setOutput("BKAAAAK !!! Poulet crashed.");}
    setLoading(false);
  }

  async function insult(){
    setLoading(true);addChaos(12);playAlarm();
    try{
      const res=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:300,messages:[{role:"user",content:"Génère une insulte absurde, marrante et inoffensive style poulet sauvage en 1 phrase bien WTF. Implique des pizzas ou des poulets."}]})});
      const data=await res.json();
      setOutput(data.content?.find(b=>b.type==="text")?.text||INSULTES[Math.floor(Math.random()*INSULTES.length)]);
      setInput("(insulte générée)");
    }catch{setOutput(INSULTES[Math.floor(Math.random()*INSULTES.length)]);}
    setLoading(false);
  }

  return(
    <div>
      <STitle color={accent}>🐔 Savage Chicken Translator</STitle>
      <p style={{fontSize:12,color:"#444",marginBottom:14}}>Transforme n'importe quoi en chaos poulet.</p>
      {/* Mode selector */}
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        {MODES.map(m=>(
          <button key={m.id} onClick={()=>setMode(m.id)} style={{padding:"5px 12px",borderRadius:5,border:`1px solid ${mode===m.id?accent:"#222"}`,background:mode===m.id?accent+"22":"transparent",color:mode===m.id?accent:"#555",fontFamily:"'Bangers',cursive",fontSize:13,cursor:"pointer",letterSpacing:1,transition:"all 0.15s"}}>
            {m.label}
          </button>
        ))}
      </div>
      <textarea value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),translate())}
        placeholder="Tape ici... Le poulet s'occupe du reste."
        style={{width:"100%",padding:"12px",background:"#111",border:`1px solid #222`,borderRadius:8,color:"#E8E8E8",fontFamily:"'Inter',sans-serif",fontSize:14,resize:"none",height:80,outline:"none",marginBottom:10,boxSizing:"border-box",transition:"border-color 0.2s"}}
        onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor="#222"}
      />
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <Btn onClick={translate} disabled={loading} color={accent}>{loading?"Le poulet pense...":"🐔 Traduire"}</Btn>
        <Btn onClick={insult} disabled={loading} color="#EF4444">⚡ Insulte random</Btn>
      </div>
      {output&&(
        <div style={{padding:"14px",background:"#111",border:`1px solid ${accent}44`,borderRadius:8,fontSize:14,lineHeight:1.7,color:"#E8E8E8",whiteSpace:"pre-wrap",boxShadow:`0 0 12px ${accent}11`,animation:"slide-in 0.2s ease"}}>
          <div style={{fontSize:9,color:accent,letterSpacing:2,fontFamily:"'Bangers',cursive",marginBottom:8}}>TRADUCTION POULET :</div>
          {output}
        </div>
      )}
    </div>
  );
}

// ─── PIZZA MODE ───────────────────────────────────────────────
function PizzaParticle({x,y,emoji,size,onDone}){
  const [top,setTop]=useState("-80px");
  useEffect(()=>{const t=setTimeout(()=>setTop(y),30);const t2=setTimeout(onDone,3000);return()=>{clearTimeout(t);clearTimeout(t2);};},[]);
  return <div style={{position:"absolute",left:x,top,fontSize:size,transition:"top 0.9s cubic-bezier(0.22,1,0.36,1)",pointerEvents:"none",userSelect:"none",filter:"drop-shadow(0 0 6px #FF3B3066)"}}>{emoji}</div>;
}
function PizzaTab({addPizza,pizzas,setPizzas,accent}){
  const [msg,setMsg]=useState("");const [presses,setPresses]=useState(0);const [rage,setRage]=useState(false);
  function hit(){addPizza();setPresses(p=>p+1);setMsg(PIZZA_MSGS[Math.floor(Math.random()*PIZZA_MSGS.length)]);setRage(true);setTimeout(()=>setRage(false),300);}
  return(
    <div>
      <STitle color={accent}>🍕 Jojo Pizza Mode</STitle>
      <p style={{fontSize:12,color:"#444",marginBottom:14}}>Clique jusqu'à l'indigestion totale.</p>
      <button onClick={hit} style={{
        width:"100%",padding:"18px",background:"#FF3B30",border:"none",borderRadius:10,
        color:"#fff",fontFamily:"'Bangers',cursive",fontWeight:400,fontSize:22,cursor:"pointer",letterSpacing:2,marginBottom:12,
        animation:rage?"shake 0.3s":"none",textShadow:"0 0 12px #FF3B3066",
        boxShadow:"0 4px 24px #FF3B3044",transition:"transform 0.1s",
      }} onMouseDown={e=>e.currentTarget.style.transform="scale(0.96)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
        🍕 PIZZA ATTACK
      </button>
      <div style={{position:"relative",width:"100%",height:240,background:"#0e0e0e",borderRadius:10,overflow:"hidden",border:`1px solid #FF3B3022`,marginBottom:12,boxShadow:`inset 0 0 30px #FF3B3011`}}>
        {pizzas.length===0&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#222",fontSize:12,fontFamily:"'Bangers',cursive",letterSpacing:2}}>EN ATTENTE DE LIVRAISON...</div>}
        {pizzas.map(p=><PizzaParticle key={p.id} x={p.x} y={p.y} emoji={p.emoji} size={p.size} onDone={()=>setPizzas(prev=>prev.filter(x=>x.id!==p.id))}/>)}
        {msg&&<div style={{position:"absolute",bottom:10,left:0,right:0,textAlign:"center",fontFamily:"'Bangers',cursive",fontSize:15,color:"#FF3B30",letterSpacing:2,textShadow:"0 0 8px #FF3B30"}}>{msg}</div>}
      </div>
      <div style={{display:"flex",gap:8}}>
        <Stat label="Pizzas" value={presses*2+pizzas.length} color="#FF3B30"/>
        <Stat label="Presses" value={presses} color="#FFD600"/>
        <Stat label="Indigestion" value={presses>8?"OUI 🤢":"BIENTÔT"} color="#A855F7"/>
      </div>
    </div>
  );
}

// ─── ROUE DU DESTIN ───────────────────────────────────────────
function RoueTab({addChaos,addPizza,accent}){
  const [spinning,setSpinning]=useState(false);const [angle,setAngle]=useState(0);const [result,setResult]=useState(null);const [resultText,setResultText]=useState("");const canvasRef=useRef(null);
  const segCount=ROUE_OPTS.length;const segAngle=(2*Math.PI)/segCount;

  function drawWheel(rot){
    const canvas=canvasRef.current;if(!canvas)return;
    const ctx=canvas.getContext("2d");const cx=canvas.width/2,cy=canvas.height/2,r=cx-6;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // Outer glow ring
    ctx.beginPath();ctx.arc(cx,cy,r+4,0,Math.PI*2);ctx.strokeStyle=accent+"44";ctx.lineWidth=2;ctx.stroke();
    ROUE_OPTS.forEach((opt,i)=>{
      const start=rot+i*segAngle-Math.PI/2,end=start+segAngle;
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,start,end);ctx.closePath();
      ctx.fillStyle=opt.color+"18";ctx.strokeStyle=opt.color+"66";ctx.lineWidth=1;ctx.fill();ctx.stroke();
      const mid=start+segAngle/2;
      ctx.save();ctx.translate(cx+Math.cos(mid)*r*0.62,cy+Math.sin(mid)*r*0.62);ctx.rotate(mid+Math.PI/2);
      ctx.font="bold 10px 'Bangers',cursive";ctx.fillStyle=opt.color;ctx.textAlign="center";
      ctx.fillText(opt.emoji+" "+opt.label,0,0);ctx.restore();
    });
    ctx.beginPath();ctx.arc(cx,cy,12,0,Math.PI*2);ctx.fillStyle="#080808";ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.fill();ctx.stroke();
    // pointer
    ctx.beginPath();ctx.moveTo(cx+r+8,cy);ctx.lineTo(cx+r-8,cy-6);ctx.lineTo(cx+r-8,cy+6);ctx.closePath();ctx.fillStyle=accent;ctx.fill();
  }

  useEffect(()=>drawWheel(angle),[angle,accent]);

  async function spin(){
    if(spinning)return;setSpinning(true);setResult(null);setResultText("");addChaos(20);
    jingle([[200,0,0.08],[300,100,0.08],[400,200,0.08],[600,300,0.12]]);
    const totalRot=Math.PI*2*(8+Math.random()*6),duration=3800,start=performance.now(),startAngle=angle;
    function animate(now){
      const elapsed=now-start,progress=Math.min(elapsed/duration,1),ease=1-Math.pow(1-progress,4),cur=startAngle+totalRot*ease;
      setAngle(cur);drawWheel(cur);
      if(progress<1){requestAnimationFrame(animate);return;}
      const norm=((cur%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
      const pointer=(Math.PI*2-norm+Math.PI*2)%(Math.PI*2);
      const idx=Math.floor(pointer/segAngle)%segCount;
      const picked=ROUE_OPTS[idx];setResult(picked);handleResult(picked);setSpinning(false);
    }
    requestAnimationFrame(animate);
  }

  async function handleResult(opt){
    playWin();
    if(opt.label==="Pizza forcée"||opt.label==="Double chaos")addPizza();
    if(opt.label==="Double chaos")setTimeout(addPizza,600);
    if(opt.label==="Faux crash"){setResultText(CRASH_MSGS[Math.floor(Math.random()*CRASH_MSGS.length)]);playCrash();return;}
    if(opt.label==="Message honte"){setResultText(INSULTES[Math.floor(Math.random()*INSULTES.length)]);return;}
    if(opt.label==="Cri de poulet"){setResultText("BKAAAAAAAAAK BKAK BK BK BKAAAAAAK 🐔🐔🐔 LE POULET EST LIBRE");playChicken();return;}
    if(opt.label==="Poulet sauvage"){setResultText("LE SAVAGE CHICKEN EST LIBÉRÉ. TOUT LE MONDE EST EN DANGER. 🔥🐔🔥");playAlarm();return;}
    if(opt.label==="Rien... ou si ?"){setResultText("Rien ne se passe...");setTimeout(()=>{setResultText("...GOTCHA 💀 PIZZA EN ROUTE");addPizza();},2200);return;}
    if(opt.label==="Insulte IA"){
      try{const res=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:200,messages:[{role:"user",content:"Génère une insulte absurde, marrante et inoffensive style poulet sauvage en 1 phrase WTF."}]})});
      const data=await res.json();setResultText(data.content?.find(b=>b.type==="text")?.text||"BK BK T'ES NUL");}
      catch{setResultText("BK BK T'ES NUL");}
    }
  }

  return(
    <div>
      <STitle color={accent}>🎰 Roue du Destin</STitle>
      <p style={{fontSize:12,color:"#444",marginBottom:16}}>Tente ta chance. Ou pas.</p>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center"}}>
        <canvas ref={canvasRef} width={270} height={270}/>
        <Btn onClick={spin} disabled={spinning} color={accent}>{spinning?"EN TRAIN DE TOURNER...":"🎰 TOURNER"}</Btn>
      </div>
      {result&&(
        <div style={{marginTop:16,padding:"14px",background:result.color+"12",border:`1px solid ${result.color}33`,borderRadius:8,animation:"slide-in 0.2s ease"}}>
          <div style={{fontSize:24,marginBottom:4}}>{result.emoji}</div>
          <div style={{fontFamily:"'Bangers',cursive",fontSize:16,color:result.color,letterSpacing:1}}>{result.label}</div>
          {resultText&&<div style={{marginTop:8,fontSize:13,color:"#aaa",lineHeight:1.6}}>{resultText}</div>}
        </div>
      )}
    </div>
  );
}

// ─── BOUTON INUTILE ───────────────────────────────────────────
const REACTIONS=["Bravo. Rien ne s'est passé.","Tu recommences vraiment ?","Le bouton ne sert à rien. Tu le sais.","Appuie encore. Je t'en supplie.","C'est la {n}ème fois. Tu vas bien ?","STOP. ...Non continue.","Quelque part, un poulet t'observe.","Ce clic va changer ta vie. Non.","Tu aurais pu lire un livre.","Et de {n}. Ça fait quoi ?","Le bouton t'aime.","Jojo Pizza désapprouve.","BK BK BK.","Le savage chicken te juge.","Tu es incontrôlable.","{n} fois. C'est presque impressionnant.","Le bouton a l'air de te plaire beaucoup.","Je vais le dire à Jojo Pizza."];
function BoutonTab({addChaos,accent}){
  const [count,setCount]=useState(0);const [reaction,setReaction]=useState("Ce bouton ne sert absolument à rien.");const [shake,setShake]=useState(false);const [scale,setScale]=useState(1);
  function press(){
    const n=count+1;setCount(n);addChaos(3);beep(80+n*3,0.1,"sawtooth");
    const msg=REACTIONS[Math.floor(Math.random()*REACTIONS.length)].replace("{n}",n);
    setReaction(msg);setShake(true);setScale(s=>Math.min(s+0.04,1.8));
    setTimeout(()=>setShake(false),400);
  }
  const sz=100*scale;
  return(
    <div style={{textAlign:"center"}}>
      <STitle color={accent}>🔴 Le Bouton Inutile</STitle>
      <p style={{fontSize:12,color:"#444",marginBottom:28}}>Ne pas appuyer.</p>
      <div style={{display:"flex",justifyContent:"center",marginBottom:28}}>
        <button onClick={press} style={{
          width:sz,height:sz,borderRadius:"50%",
          border:`2px solid #EF4444`,background:"#EF444415",color:"#EF4444",
          fontFamily:"'Bangers',cursive",fontSize:Math.max(11,14-count*0.1),cursor:"pointer",
          animation:shake?"shake 0.4s":"none",letterSpacing:1,
          boxShadow:`0 0 ${8+count*2}px #EF444433`,transition:"width 0.4s,height 0.4s,box-shadow 0.3s",
        }}>NE PAS<br/>APPUYER</button>
      </div>
      <div style={{padding:"12px 14px",background:"#111",borderRadius:8,fontSize:13,color:"#888",marginBottom:16,minHeight:44,border:"1px solid #1c1c1c",lineHeight:1.6,transition:"all 0.2s"}}>{reaction}</div>
      <div style={{display:"flex",gap:8,justifyContent:"center"}}>
        <Stat label="Pressions" value={count} color="#EF4444"/>
        <Stat label="Utilité" value="0%" color="#333"/>
        <Stat label="Taille" value={`${Math.round(scale*100)}%`} color="#A855F7"/>
      </div>
    </div>
  );
}

// ─── FAUX CRASH ───────────────────────────────────────────────
function CrashTab({addChaos,accent}){
  const [crashed,setCrashed]=useState(false);const [crashMsg,setCrashMsg]=useState("");const [log,setLog]=useState([]);const [aiMsg,setAiMsg]=useState("");const [typing,setTyping]=useState(false);
  async function doCrash(){
    addChaos(25);playCrash();setCrashMsg(CRASH_MSGS[Math.floor(Math.random()*CRASH_MSGS.length)]);setCrashed(true);setLog([]);setAiMsg("");
    const lines=["> Initialisation système poulet...","Connecting to pizza.server.bk...","WARNING: savage_chicken.exe responding erratically","ERROR: PIZZA_OVERFLOW in module jojo_brain.dll","Stack trace: BK_NULL → PIZZA_OVERFLOW → JOJO_EXCEPTION","> Attempting recovery...","RECOVERY FAILED: le poulet refuse","Generating crash report..."];
    for(let i=0;i<lines.length;i++){await new Promise(r=>setTimeout(r,300+Math.random()*250));setLog(l=>[...l,lines[i]]);}
    setTyping(true);
    try{const res=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:350,messages:[{role:"user",content:"Tu es un rapport de crash système ultra dramatique et absurde. Génère un faux rapport (6 lignes max) avec des noms de fonctions inventés, des codes d'erreur hexadécimaux, et une cause impliquant Jojo Pizza et le Savage Chicken. Style log système mais complètement WTF."}]})});
    const data=await res.json();setAiMsg(data.content?.find(b=>b.type==="text")?.text||"SAVAGE_CHICKEN_EXCEPTION at 0x4A4F4A4F");}
    catch{setAiMsg("BKAAAAK_FATAL at 0x4A4F4A4F");}
    setTyping(false);
  }
  function reset(){setCrashed(false);setLog([]);setAiMsg("");beep(440,0.15,"sine");}
  if(crashed)return(
    <div>
      <div style={{padding:"14px",background:"#FF3B3010",border:"1px solid #FF3B3044",borderRadius:8,marginBottom:12}}>
        <div style={{fontFamily:"'Bangers',cursive",color:"#FF3B30",fontSize:16,letterSpacing:1,marginBottom:4}}>💥 CRASH FATAL</div>
        <div style={{fontSize:12,color:"#FF3B3088"}}>{crashMsg}</div>
      </div>
      <div style={{background:"#050505",border:"1px solid #1c1c1c",borderRadius:8,padding:"12px",fontFamily:"monospace",fontSize:11,color:"#22c55e",marginBottom:12,minHeight:160}}>
        {log.map((l,i)=><div key={i} style={{marginBottom:2,animation:"slide-in 0.2s ease"}}>{l}</div>)}
        {typing&&<div style={{color:"#555",animation:"pulse 0.8s infinite"}}>_ analyse IA en cours...</div>}
        {aiMsg&&<div style={{marginTop:10,color:"#FFD600",whiteSpace:"pre-wrap",borderTop:"1px solid #1c1c1c",paddingTop:10}}>{aiMsg}</div>}
      </div>
      <Btn onClick={reset} color={accent}>↩ REDÉMARRER</Btn>
    </div>
  );
  return(
    <div>
      <STitle color={accent}>💥 Faux Crash</STitle>
      <p style={{fontSize:12,color:"#444",marginBottom:20}}>Génère un rapport de crash IA absurde. Envoie ça à ton pote.</p>
      <div style={{padding:"24px",background:"#111",borderRadius:10,border:"1px solid #1c1c1c",textAlign:"center",marginBottom:20}}>
        <div style={{fontSize:40,marginBottom:10,animation:"bounce 2s infinite"}}>💻</div>
        <div style={{fontFamily:"'Bangers',cursive",fontSize:16,letterSpacing:1,marginBottom:4}}>Tout va bien... pour l'instant.</div>
        <div style={{fontSize:12,color:"#444"}}>Appuie pour tout faire exploser.</div>
      </div>
      <Btn onClick={doCrash} color="#F97316">💥 PROVOQUER LE CRASH</Btn>
    </div>
  );
}

// ─── GÉNÉRATEUR DE MÈME ───────────────────────────────────────
function MemeTab({addChaos,accent}){
  const [pseudo,setPseudo]=useState("");const [meme,setMeme]=useState(null);const [loading,setLoading]=useState(false);
  const STYLES=["🔥 Ultra WTF","😭 Tragique","💼 Corporate","👑 Légendaire","💀 Brutal"];
  const [style,setStyle]=useState(0);

  async function generate(){
    if(!pseudo.trim()||loading)return;
    setLoading(true);setMeme(null);addChaos(15);playWin();
    try{
      const res=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:400,messages:[{role:"user",content:`Génère un mème textuel ${STYLES[style]} pour le pseudo "${pseudo}". Format JSON strict : {"titre":"...","texte_haut":"...","texte_bas":"...","emoji_central":"...","couleur":"#hexcode","verdict":"..."}. Le contenu doit être absurde, drôle et WTF avec des références à Jojo Pizza et le Savage Chicken. Réponds UNIQUEMENT avec le JSON, rien d'autre.`}]})});
      const data=await res.json();
      const text=data.content?.find(b=>b.type==="text")?.text||"{}";
      const clean=text.replace(/```json|```/g,"").trim();
      setMeme(JSON.parse(clean));
    }catch(e){setMeme({titre:"ERREUR DU POULET",texte_haut:"BK BK BK",texte_bas:"LE SAVAGE CHICKEN A PLANTÉ",emoji_central:"🐔",couleur:"#FFD600",verdict:"Désastreux"});}
    setLoading(false);
  }

  return(
    <div>
      <STitle color={accent}>🎭 Générateur de Mème</STitle>
      <p style={{fontSize:12,color:"#444",marginBottom:14}}>Entre le pseudo de ton pote pour lui générer un mème personnalisé.</p>
      <input value={pseudo} onChange={e=>setPseudo(e.target.value)} onKeyDown={e=>e.key==="Enter"&&generate()}
        placeholder="Ex: jojo_pizza ou savage_chicken"
        style={{width:"100%",padding:"10px 12px",background:"#111",border:"1px solid #222",borderRadius:8,color:"#E8E8E8",fontFamily:"'Inter',sans-serif",fontSize:14,outline:"none",marginBottom:10,boxSizing:"border-box"}}
        onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor="#222"}
      />
      <div style={{display:"flex",gap:6,marginBottom:12,flexWrap:"wrap"}}>
        {STYLES.map((s,i)=><button key={i} onClick={()=>setStyle(i)} style={{padding:"5px 10px",borderRadius:5,border:`1px solid ${style===i?accent:"#222"}`,background:style===i?accent+"22":"transparent",color:style===i?accent:"#555",fontFamily:"'Bangers',cursive",fontSize:12,cursor:"pointer",letterSpacing:1}}>{s}</button>)}
      </div>
      <Btn onClick={generate} disabled={loading} color={accent}>{loading?"Génération en cours...":"🎭 Générer le mème"}</Btn>

      {meme&&(
        <div style={{marginTop:16,background:"#111",border:`2px solid ${meme.couleur}`,borderRadius:10,overflow:"hidden",animation:"slide-in 0.3s ease"}}>
          <div style={{background:meme.couleur+"22",padding:"8px 14px",borderBottom:`1px solid ${meme.couleur}33`}}>
            <span style={{fontFamily:"'Bangers',cursive",fontSize:13,color:meme.couleur,letterSpacing:2}}>{meme.titre}</span>
          </div>
          <div style={{padding:"20px",textAlign:"center"}}>
            <div style={{fontFamily:"'Bangers',cursive",fontSize:15,color:"#aaa",letterSpacing:1,marginBottom:12,textTransform:"uppercase"}}>{meme.texte_haut}</div>
            <div style={{fontSize:56,marginBottom:12,animation:"bounce 1.5s infinite"}}>{meme.emoji_central}</div>
            <div style={{fontFamily:"'Bangers',cursive",fontSize:15,color:meme.couleur,letterSpacing:1,marginBottom:16,textTransform:"uppercase"}}>{meme.texte_bas}</div>
            <div style={{display:"inline-block",padding:"4px 14px",background:meme.couleur+"22",border:`1px solid ${meme.couleur}44`,borderRadius:4,fontFamily:"'Bangers',cursive",fontSize:12,color:meme.couleur,letterSpacing:2}}>VERDICT : {meme.verdict}</div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── BATTLE MODE ─────────────────────────────────────────────
function BattleTab({addChaos,accent}){
  const [defi,setDefi]=useState(null);const [timer,setTimer]=useState(0);const [running,setRunning]=useState(false);const [score,setScore]=useState(0);const [result,setResult]=useState("");const [aiDefi,setAiDefi]=useState("");const [loadingAi,setLoadingAi]=useState(false);
  const intervalRef=useRef(null);

  function startDefi(custom=null){
    const d=custom||BATTLE_DEFIS[Math.floor(Math.random()*BATTLE_DEFIS.length)];
    setDefi(d);setTimer(30);setRunning(true);setResult("");
    playAlarm();addChaos(10);
    clearInterval(intervalRef.current);
    intervalRef.current=setInterval(()=>{
      setTimer(t=>{
        if(t<=1){clearInterval(intervalRef.current);setRunning(false);setResult("TEMPS ÉCOULÉ 💀 Le poulet gagne.");playCrash();return 0;}
        if(t<=5)beep(880,0.05,"square",0.1);
        return t-1;
      });
    },1000);
  }

  function win(){clearInterval(intervalRef.current);setRunning(false);setScore(s=>s+1);setResult("VICTOIRE 🏆 +1 point Savage !");playWin();addChaos(20);}

  async function generateAiDefi(){
    setLoadingAi(true);
    try{const res=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:"claude-sonnet-4-20250514",max_tokens:200,messages:[{role:"user",content:"Génère UN défi fun et absurde lié à Jojo Pizza ou le Savage Chicken, réalisable en 30 secondes (ex: imiter un son, dire une phrase, inventer quelque chose). 1 phrase courte, direct, sans intro."}]})});
    const data=await res.json();
    const d=data.content?.find(b=>b.type==="text")?.text||"Crie BK BK BKAAAK le plus fort possible";
    setAiDefi(d);startDefi(d);}
    catch{startDefi();}
    setLoadingAi(false);
  }

  const timerColor=timer>15?"#10B981":timer>5?"#FFD600":"#FF3B30";

  return(
    <div>
      <STitle color={accent}>⚔️ Battle Mode</STitle>
      <p style={{fontSize:12,color:"#444",marginBottom:16}}>Défis à relever en 30 secondes. Perds = poulet gagne.</p>

      {!running&&!defi&&(
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <Btn onClick={()=>startDefi()} color={accent}>🎲 Défi random</Btn>
          <Btn onClick={generateAiDefi} disabled={loadingAi} color="#10B981">{loadingAi?"IA pense...":"🤖 Défi IA"}</Btn>
        </div>
      )}

      {defi&&(
        <div>
          <div style={{padding:"16px",background:"#111",border:`1px solid ${running?accent:"#333"}`,borderRadius:10,marginBottom:12}}>
            <div style={{fontSize:10,color:"#444",fontFamily:"'Bangers',cursive",letterSpacing:2,marginBottom:8}}>DÉFI EN COURS</div>
            <div style={{fontSize:15,lineHeight:1.6,fontFamily:"'Bangers',cursive",letterSpacing:1,color:"#E8E8E8"}}>{defi}</div>
          </div>

          {running&&(
            <div style={{textAlign:"center",marginBottom:12}}>
              <div style={{fontFamily:"'Bangers',cursive",fontSize:64,color:timerColor,animation:timer<=5?"pulse 0.5s infinite":"none",textShadow:`0 0 20px ${timerColor}44`,transition:"color 0.3s"}}>{timer}</div>
              <div style={{fontSize:10,color:"#444",letterSpacing:2}}>SECONDES</div>
            </div>
          )}

          {result&&(
            <div style={{padding:"12px",background:result.includes("VICTOIRE")?"#10B98118":"#FF3B3018",border:`1px solid ${result.includes("VICTOIRE")?"#10B981":"#FF3B30"}44`,borderRadius:8,fontFamily:"'Bangers',cursive",fontSize:14,color:result.includes("VICTOIRE")?"#10B981":"#FF3B30",letterSpacing:1,marginBottom:12,textAlign:"center"}}>
              {result}
            </div>
          )}

          <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
            {running&&<Btn onClick={win} color="#10B981">✅ J'ai réussi !</Btn>}
            <Btn onClick={()=>{clearInterval(intervalRef.current);setDefi(null);setRunning(false);setResult("");}} color="#555">↩ Annuler</Btn>
            {!running&&<Btn onClick={()=>startDefi()} color={accent}>🎲 Autre défi</Btn>}
          </div>
        </div>
      )}

      <div style={{marginTop:20,display:"flex",gap:8}}>
        <Stat label="Score" value={score} color={accent}/>
        <Stat label="Défis" value={defi?1:0} color="#10B981"/>
        <Stat label="Rage" value={score===0?"MAX":"Modérée"} color="#EF4444"/>
      </div>
    </div>
  );
}

// ─── MUSIC TAB ────────────────────────────────────────────────
function MusicTab({addChaos,musicOn,setMusicOn,accent}){
  const [bpm,setBpm]=useState(120);const [octave,setOctave]=useState(4);const [waveType,setWaveType]=useState("square");const [playing,setPlaying]=useState([]);
  const NOTES=["DO","RÉ","MI","FA","SOL","LA","SI"];
  const FREQS_BASE=[261.63,293.66,329.63,349.23,392,440,493.88];
  function playNote(i){
    const mult=Math.pow(2,octave-4);
    const freq=FREQS_BASE[i]*mult;
    beep(freq,0.4,waveType,0.15);
    setPlaying(p=>[...p,i]);
    setTimeout(()=>setPlaying(p=>p.filter(x=>x!==i)),400);
    addChaos(1);
  }
  const COLORS=["#FF3B30","#FF6B35","#FFD600","#10B981","#06B6D4","#A855F7","#EC4899"];
  return(
    <div>
      <STitle color={accent}>🎵 Musique Chaos</STitle>
      <p style={{fontSize:12,color:"#444",marginBottom:16}}>Compose ta propre musique de poulet sauvage.</p>

      <div style={{display:"flex",gap:4,marginBottom:20,justifyContent:"center"}}>
        {NOTES.map((n,i)=>(
          <button key={i} onClick={()=>playNote(i)} style={{
            flex:1,padding:"28px 0",border:`1px solid ${COLORS[i]}`,
            borderRadius:6,background:playing.includes(i)?COLORS[i]+"44":"transparent",
            color:COLORS[i],fontFamily:"'Bangers',cursive",fontSize:13,
            cursor:"pointer",transition:"all 0.1s",letterSpacing:1,
            boxShadow:playing.includes(i)?`0 0 12px ${COLORS[i]}66`:"none",
            transform:playing.includes(i)?"translateY(-4px)":"none",
          }}>{n}</button>
        ))}
      </div>

      <div style={{display:"flex",flexDirection:"column",gap:12,marginBottom:16}}>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:11,color:"#555",width:60,fontFamily:"'Bangers',cursive",letterSpacing:1}}>OCTAVE</span>
          <input type="range" min={2} max={6} value={octave} onChange={e=>setOctave(+e.target.value)} style={{flex:1}}/>
          <span style={{fontSize:12,color:accent,width:16,textAlign:"right",fontFamily:"'Bangers',cursive"}}>{octave}</span>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:11,color:"#555",width:60,fontFamily:"'Bangers',cursive",letterSpacing:1}}>WAVE</span>
          {["square","sine","sawtooth","triangle"].map(w=>(
            <button key={w} onClick={()=>setWaveType(w)} style={{padding:"4px 10px",borderRadius:4,border:`1px solid ${waveType===w?accent:"#222"}`,background:waveType===w?accent+"22":"transparent",color:waveType===w?accent:"#555",fontFamily:"'Bangers',cursive",fontSize:11,cursor:"pointer",letterSpacing:1}}>{w}</button>
          ))}
        </div>
      </div>

      <div style={{padding:"12px",background:"#111",borderRadius:8,border:"1px solid #1c1c1c",textAlign:"center"}}>
        <div style={{fontSize:10,color:"#444",fontFamily:"'Bangers',cursive",letterSpacing:2,marginBottom:8}}>MUSIQUE AMBIANTE</div>
        <button onClick={()=>setMusicOn(m=>!m)} style={{padding:"10px 24px",border:`1px solid ${musicOn?"#EC4899":"#333"}`,borderRadius:8,background:musicOn?"#EC489918":"transparent",color:musicOn?"#EC4899":"#555",fontFamily:"'Bangers',cursive",fontSize:14,cursor:"pointer",letterSpacing:1,transition:"all 0.2s"}}>
          {musicOn?"🎵 STOP LA MUSIQUE":"🎵 ACTIVER LE CHAOS MUSICAL"}
        </button>
      </div>
    </div>
  );
}

// ─── LEADERBOARD ─────────────────────────────────────────────
function ScoresTab({addChaos,crimes,chaos,accent}){
  const [name,setName]=useState("");const [scores,setScores]=useState([]);const [saved,setSaved]=useState(false);const [loading,setLoading]=useState(true);

  useEffect(()=>{loadScores();},[]);

  async function loadScores(){
    setLoading(true);
    try{
      const keys=await window.storage.list("leaderboard:");
      const entries=await Promise.all((keys.keys||[]).map(async k=>{
        try{const r=await window.storage.get(k,true);return r?JSON.parse(r.value):null;}catch{return null;}
      }));
      const valid=entries.filter(Boolean).sort((a,b)=>b.crimes-a.crimes).slice(0,10);
      setScores(valid);
    }catch{setScores([]);}
    setLoading(false);
  }

  async function saveScore(){
    if(!name.trim())return;
    addChaos(5);playWin();
    const entry={name:name.trim(),crimes,chaos,date:new Date().toLocaleDateString("fr")};
    try{await window.storage.set(`leaderboard:${name.trim().toLowerCase().replace(/\s/g,"-")}`,JSON.stringify(entry),true);}catch(e){}
    setSaved(true);await loadScores();
  }

  const medals=["🥇","🥈","🥉"];

  return(
    <div>
      <STitle color={accent}>🏆 Hall of Chaos</STitle>
      <p style={{fontSize:12,color:"#444",marginBottom:16}}>Qui a commis le plus de crimes ?</p>

      <div style={{padding:"14px",background:"#111",borderRadius:10,border:`1px solid ${accent}22`,marginBottom:16}}>
        <div style={{fontSize:10,color:"#444",fontFamily:"'Bangers',cursive",letterSpacing:2,marginBottom:8}}>TON SCORE ACTUEL</div>
        <div style={{display:"flex",gap:8,marginBottom:12}}>
          <Stat label="Crimes" value={crimes} color={accent}/>
          <Stat label="Chaos" value={`${chaos}%`} color="#FF3B30"/>
        </div>
        {!saved?(
          <div style={{display:"flex",gap:8}}>
            <input value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&saveScore()}
              placeholder="Ton pseudo..."
              style={{flex:1,padding:"8px 12px",background:"#0a0a0a",border:"1px solid #222",borderRadius:6,color:"#E8E8E8",fontFamily:"'Inter',sans-serif",fontSize:13,outline:"none"}}
              onFocus={e=>e.target.style.borderColor=accent} onBlur={e=>e.target.style.borderColor="#222"}
            />
            <Btn onClick={saveScore} color={accent}>💾 Sauver</Btn>
          </div>
        ):(
          <div style={{fontSize:12,color:"#10B981",fontFamily:"'Bangers',cursive",letterSpacing:1}}>✅ SCORE SAUVEGARDÉ !</div>
        )}
      </div>

      <div style={{fontSize:10,color:"#444",fontFamily:"'Bangers',cursive",letterSpacing:2,marginBottom:10}}>CLASSEMENT MONDIAL</div>
      {loading?<div style={{textAlign:"center",padding:20,color:"#333",fontSize:12}}>Chargement...</div>:
        scores.length===0?<div style={{textAlign:"center",padding:20,color:"#333",fontSize:12,fontFamily:"'Bangers',cursive",letterSpacing:1}}>PAS ENCORE DE SCORES. SOIS LE PREMIER.</div>:
        scores.map((s,i)=>(
          <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 12px",background:"#111",borderRadius:8,marginBottom:6,border:`1px solid ${i===0?"#FFD60033":"#1c1c1c"}`,transition:"all 0.2s"}}>
            <span style={{fontSize:18,width:24}}>{medals[i]||`${i+1}.`}</span>
            <div style={{flex:1}}>
              <div style={{fontFamily:"'Bangers',cursive",fontSize:14,letterSpacing:1,color:i===0?"#FFD600":"#E8E8E8"}}>{s.name}</div>
              <div style={{fontSize:10,color:"#444"}}>{s.date}</div>
            </div>
            <div style={{textAlign:"right"}}>
              <div style={{fontFamily:"'Bangers',cursive",fontSize:16,color:accent}}>{s.crimes} crimes</div>
              <div style={{fontSize:10,color:"#444"}}>{s.chaos}% chaos</div>
            </div>
          </div>
        ))
      }
      <div style={{marginTop:12,textAlign:"center"}}>
        <button onClick={loadScores} style={{fontSize:11,color:"#444",background:"none",border:"none",cursor:"pointer",fontFamily:"'Bangers',cursive",letterSpacing:1}}>↻ RAFRAÎCHIR</button>
      </div>
    </div>
  );
}

// ─── UTILS ────────────────────────────────────────────────────
function STitle({children,color="#FFD600"}){return <h2 style={{fontFamily:"'Bangers',cursive",fontSize:22,margin:"0 0 4px",letterSpacing:2,color,textShadow:`0 0 12px ${color}33`}}>{children}</h2>;}
function Btn({children,onClick,disabled,color="#FFD600"}){return <button onClick={onClick} disabled={disabled} style={{padding:"9px 18px",border:`1px solid ${color}`,borderRadius:7,background:color+"18",color,fontFamily:"'Bangers',cursive",fontSize:14,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.4:1,transition:"all 0.15s",letterSpacing:1,boxShadow:`0 0 8px ${color}22`}}>{children}</button>;}
function Stat({label,value,color}){return <div style={{flex:1,padding:"10px",background:"#111",borderRadius:8,border:"1px solid #1c1c1c",textAlign:"center"}}><div style={{fontSize:9,color:"#444",fontFamily:"'Bangers',cursive",textTransform:"uppercase",letterSpacing:1.5,marginBottom:3}}>{label}</div><div style={{fontSize:18,fontFamily:"'Bangers',cursive",color,letterSpacing:1}}>{value}</div></div>;}
