import { useState, useEffect, useRef, useCallback } from "react";

const API = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-6";

// ─── AUDIO ────────────────────────────────────────────────────
let audioCtx = null;
function getCtx(){if(!audioCtx)audioCtx=new(window.AudioContext||window.webkitAudioContext)();return audioCtx;}
function beep(freq=440,dur=0.1,type="square",vol=0.12,delay=0){try{const c=getCtx(),o=c.createOscillator(),g=c.createGain();o.connect(g);g.connect(c.destination);o.frequency.value=freq;o.type=type;g.gain.setValueAtTime(vol,c.currentTime+delay);g.gain.exponentialRampToValueAtTime(0.001,c.currentTime+delay+dur);o.start(c.currentTime+delay);o.stop(c.currentTime+delay+dur+0.01);}catch(e){}}
function jingle(n){n.forEach(([f,d,du,t="square",v=0.12])=>beep(f,du,t,v,d/1000));}
function sndChicken(){jingle([[200,0,0.15,"sawtooth"],[180,160,0.25,"sawtooth"],[160,420,0.35,"sawtooth",0.18]]);}
function sndPizza(){jingle([[523,0,0.08],[659,80,0.08],[784,160,0.08],[1047,240,0.12]]);}
function sndCrash(){jingle([[800,0,0.05],[400,120,0.05],[100,400,0.4,"sawtooth",0.2]]);}
function sndWin(){jingle([[523,0,0.1],[659,100,0.1],[1047,300,0.2,"sine"],[1319,500,0.3,"sine"]]);}
function sndAlarm(){for(let i=0;i<6;i++){beep(880,0.08,"square",0.15,i*0.15);beep(440,0.08,"square",0.1,i*0.15+0.08);}}
function sndExplosion(){jingle([[150,0,0.3,"sawtooth",0.3],[80,100,0.5,"sawtooth",0.25],[20,600,1.2,"sawtooth",0.15]]);}
function sndCombo(m){const f=[262,330,392,523,659,784,1047];for(let i=0;i<Math.min(m,f.length);i++)beep(f[i],0.15,"sine",0.15,i*0.06);}
function sndMeltdown(){for(let i=0;i<20;i++)beep(50+Math.random()*800,0.2,"sawtooth",0.08,i*0.05);}
function sndOracle(){jingle([[220,0,0.3,"sine",0.1],[369,400,0.5,"sine",0.15],[440,700,0.8,"sine",0.12]]);}
function sndBomb(){for(let i=0;i<5;i++)beep(440+i*40,0.08,"square",0.08,i*0.12);}
function sndCasino(){jingle([[523,0,0.06],[659,80,0.06],[784,160,0.06],[523,240,0.06],[659,320,0.06],[1047,400,0.15,"sine"]]);}
function sndRoast(){jingle([[200,0,0.1,"sawtooth"],[150,120,0.15,"sawtooth"],[100,280,0.3,"sawtooth",0.2]]);}
function sndClick(){beep(440+Math.random()*200,0.05,"sine",0.08);}
function sndFart(){jingle([[80,0,0.15,"sawtooth",0.25],[60,100,0.2,"sawtooth",0.2],[40,250,0.3,"sawtooth",0.15]]);}
function sndSiren(){for(let i=0;i<10;i++){beep(800,0.1,"sawtooth",0.1,i*0.12);beep(600,0.1,"sawtooth",0.1,i*0.12+0.06);}}
function sndLaser(){jingle([[1200,0,0.05,"square",0.12],[900,60,0.05,"square",0.1],[600,120,0.05,"square",0.08],[300,180,0.08,"square",0.06]]);}
function sndBoing(){jingle([[800,0,0.08,"sine",0.2],[600,50,0.12,"sine",0.15],[400,150,0.2,"sine",0.1]]);}
function sndDrum(){beep(60,0.15,"sawtooth",0.3);beep(80,0.1,"sawtooth",0.2,0.02);}
function sndGlory(){for(let i=0;i<8;i++)beep(262*Math.pow(2,i/8),0.08,"sine",0.1,i*0.08);}

async function callAI(prompt,max=400){const r=await fetch(API,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({model:MODEL,max_tokens:max,messages:[{role:"user",content:prompt}]})});const d=await r.json();return d.content?.find(b=>b.type==="text")?.text||"";}

// ─── CONSTANTS ────────────────────────────────────────────────
const TCOL={chicken:"#FFE600",pizza:"#FF2D55",roue:"#BF5AF2",bouton:"#FF453A",music:"#FF375F",oracle:"#06B6D4",bombe:"#EF4444",scores:"#FFE600",clicker:"#FF9F0A",casino:"#30D158",roast:"#FF2D55",soundboard:"#F472B6",resist:"#A78BFA",chaos:"#FFE600",escape:"#FF453A",punch:"#FF2D55",whack:"#30D158",simon:"#BF5AF2",heat:"#FF6B35",roulette:"#EF4444",deathwheel:"#FF453A",screensaver:"#06B6D4",hacker:"#30D158",newspaper:"#A78BFA"};
const TMETA={chicken:{title:"🐔 Traducteur Poulet",desc:"Texte entré → chaos total garanti"},pizza:{title:"🍕 Pizza Attack",desc:"Combo multiplicateur. Clique vite."},roue:{title:"🎰 Roue du Destin",desc:"Tourne. Subis."},bouton:{title:"🔴 Bouton Inutile",desc:"Il s'échappe à 10 clics."},music:{title:"🎵 Clavier Chaos",desc:"Compose la bande-son du Savage Chicken"},oracle:{title:"🔮 Oracle Poulet",desc:"Pose une question. Reçois une vérité."},bombe:{title:"💣 Bombe Pizza",desc:"Arme. Désamorce. Ou explose."},scores:{title:"🏆 Hall of Chaos",desc:"Les criminels du Savage Chicken"},clicker:{title:"🐔 Poulet Clicker",desc:"Clique pour faire évoluer ton poulet"},casino:{title:"🎰 Casino Poulet",desc:"Machine à sous. Gains absurdes."},roast:{title:"💀 Roast-O-Matic",desc:"Reçois une insulte. Souffre."},soundboard:{title:"🔊 Soundboard WTF",desc:"32 sons de merde. Fais du bruit."},resist:{title:"🌡️ Testeur de Résistance",desc:"Maintiens. Jusqu'où tu vas ?"},chaos:{title:"🎆 MODE CHAOS TOTAL",desc:"Lance tout. Regarde l'apocalypse."},escape:{title:"🏃 Escape The Poulet",desc:"Fuis. Il accélère."},punch:{title:"🥊 Punch-O-Mètre",desc:"Tape le clavier. Vide ta rage."},whack:{title:"🎯 Whack-A-Poulet",desc:"20 secondes de réflexes."},simon:{title:"🌀 Simon Says Poulet",desc:"Répète. Mémorise. Échoue."},heat:{title:"🔥 Barre de Chaleur",desc:"Pimente. Ne dépasse pas 100%."},roulette:{title:"🎰 Roulette Russe Pizza",desc:"6 pizzas. Une est piégée."},deathwheel:{title:"🎪 Roue de la Mort",desc:"Version extrême de la roue."},screensaver:{title:"🕹️ Écran de Veille Poulet",desc:"Façon DVD logo. Touche le coin."},hacker:{title:"📟 Hacker Terminal",desc:"Pirate Jojo Pizza. 100% faux."},newspaper:{title:"📰 Faux Journal",desc:"Ta une de journal absurde."}};

const ROUE_OPTS=[{label:"Cri de poulet",emoji:"🐔",color:"#FFE600"},{label:"Pizza forcée",emoji:"🍕",color:"#FF2D55"},{label:"Insulte",emoji:"💀",color:"#BF5AF2"},{label:"Rien... ou si ?",emoji:"👁️",color:"#64D2FF"},{label:"Double chaos",emoji:"⚡",color:"#FF9F0A"},{label:"EXPLOSION",emoji:"💥",color:"#FF453A"},{label:"Honte totale",emoji:"😭",color:"#FF375F"},{label:"Poulet sauvage",emoji:"🔥",color:"#FF6B35"}];
const INSULTES_LOCAL=["T'es aussi utile qu'une pizza sans fromage","Jojo Pizza te déteste et il déteste tout le monde","Ton QI c'est la température d'une pizza froide","T'as la personnalité d'un poulet mort","Même le savage chicken refuse de te regarder","Tu serais pas né, personne aurait rien perdu","T'es la honte de la famille pizza","Le bouton inutile est plus utile que toi","Ta vie c'est une livraison annulée","Statistiquement t'aurais dû rester chez toi","T'es moins bien que la croûte de pizza que j'ai jetée","Le poulet te regarde et se demande ce qu'il a fait de mal"];
const ROAST_NIVEAUX=["Doux","Moyen","Épicé","INCENDIE","APOCALYPSE POULET"];
const CLICKER_EVOLS=[{name:"Poussin",emoji:"🐣",req:0,color:"#FFE600"},{name:"Poulet",emoji:"🐔",req:50,color:"#FF9F0A"},{name:"Savage Chicken",emoji:"🔥",req:200,color:"#FF2D55"},{name:"Mega Poulet",emoji:"💀",req:1000,color:"#BF5AF2"},{name:"GOD POULET",emoji:"👑",req:5000,color:"#FFE600"}];
const CASINO_EMOJIS=["🐔","🍕","💥","⚡","🔥","💀","👑","🎰"];
const CASINO_GAINS=[{match:3,emoji:"👑",mult:100,msg:"JACKPOT DIVIN"},{match:3,emoji:"🐔",mult:50,msg:"POULET SACRÉ"},{match:3,emoji:"🍕",mult:20,msg:"PIZZA JACKPOT"},{match:3,emoji:"💀",mult:10,msg:"MORT GAGNANTE"},{match:2,emoji:"any",mult:2,msg:"PETIT GAIN"},{match:0,emoji:"any",mult:0,msg:"PERDU COMME UN POULET"}];

const PROMPTS_CHICKEN={wtf:"Tu es le Savage Chicken. Traduis ce texte en langage poulet WTF TOTAL : caps aléatoires, fautes volontaires, BK BK BKAAAAK partout, 3-4 phrases maximales de chaos absurde. Texte: ",angry:"Tu es le Savage Chicken ENRAGÉ. TOUT EN MAJUSCULES, !!! partout, insultes à Jojo Pizza, 2-3 phrases. Texte: ",shakespeare:"Tu es le Savage Chicken shakespearien. Vieux français dramatique, 'Ô poulet!', vers épiques sur les pizzas. Texte: "};
const ORACLE_FALLBACKS=["LE POULET A PARLÉ. La réponse est OUI mais tu vas le regretter.","BKAAAAK. Non. Absolument non. Jamais.","Le Savage Chicken voit ton futur : c'est désastreux.","La boule révèle que ta question est nulle. Mais OUI quand même.","Jojo Pizza dit OUI. Le poulet dit NON. Tu choisis.","L'Oracle a crashé. Ce qui signifie probablement OUI.","BK BK BK. Les astres sont des pizzas. La réponse est dedans."];

// ─── INTRO ANIMÉE ─────────────────────────────────────────────
function IntroOverlay({onDone}){
  const [phase,setPhase]=useState(0);
  const [glitch,setGlitch]=useState("SAVAGE CHICKEN");
  const gc="█▓▒░▄▀■□●★☆◆";
  useEffect(()=>{
    sndAlarm();
    const t1=setInterval(()=>setGlitch(Array.from("SAVAGE CHICKEN").map(c=>Math.random()>0.5?gc[Math.floor(Math.random()*gc.length)]:c).join("")),60);
    const t2=setTimeout(()=>{setPhase(1);sndGlory();},800);
    const t3=setTimeout(()=>setPhase(2),1600);
    const t4=setTimeout(()=>{setPhase(3);sndExplosion();},2200);
    const t5=setTimeout(()=>onDone(),3000);
    return()=>{clearInterval(t1);clearTimeout(t2);clearTimeout(t3);clearTimeout(t4);clearTimeout(t5);};
  },[]);
  return(
    <div style={{position:"fixed",inset:0,zIndex:999999,background:"#000",display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",overflow:"hidden"}}>
      {[...Array(30)].map((_,i)=>(
        <div key={i} style={{position:"absolute",left:`${Math.random()*100}%`,top:`${Math.random()*100}%`,fontSize:`${20+Math.random()*40}px`,opacity:0.3,animation:`float${i%3} ${2+Math.random()*3}s infinite`,pointerEvents:"none"}}>
          {["🐔","🍕","💥","⚡","🔥"][i%5]}
        </div>
      ))}
      <div style={{fontFamily:"'Bangers',cursive",fontSize:phase>=1?100:0,color:"#FFE600",letterSpacing:8,textShadow:"0 0 60px #FFE600, 0 0 120px #FFE60088",transition:"font-size 0.4s cubic-bezier(.34,1.56,.64,1)",animation:phase===0?"shake 0.1s infinite":"none",lineHeight:1,textAlign:"center"}}>
        {phase===0?glitch:"SAVAGE"}
      </div>
      <div style={{fontFamily:"'Bangers',cursive",fontSize:phase>=2?72:0,color:"#FF2D55",letterSpacing:6,textShadow:"0 0 40px #FF2D55",transition:"font-size 0.3s cubic-bezier(.34,1.56,.64,1)",lineHeight:1}}>
        CHICKEN
      </div>
      <div style={{fontFamily:"'Bangers',cursive",fontSize:phase>=3?28:0,color:"#ffffff88",letterSpacing:4,marginTop:20,transition:"font-size 0.2s ease"}}>
        🐔 CHAOS APP v4.0 🐔
      </div>
      <div style={{position:"absolute",inset:0,background:"radial-gradient(ellipse at center, transparent 40%, #000 100%)",pointerEvents:"none"}}/>
    </div>
  );
}

// ─── CURSOR TRAIL ─────────────────────────────────────────────
function CursorTrail(){
  useEffect(()=>{
    const emojis=["🐔","🍕","⚡","🔥","💥","💀","👑","🎰","💣"];
    let last=0;
    const mv=(e)=>{
      const now=Date.now();if(now-last<60)return;last=now;
      const el=document.createElement("div");
      el.textContent=emojis[Math.floor(Math.random()*emojis.length)];
      el.style.cssText=`position:fixed;left:${e.clientX-12}px;top:${e.clientY-12}px;font-size:${14+Math.random()*12}px;pointer-events:none;z-index:9999;transition:all 0.5s ease;opacity:1;transform:scale(1) rotate(0deg)`;
      document.body.appendChild(el);
      setTimeout(()=>{el.style.opacity="0";el.style.transform=`scale(2.5) translateY(-${20+Math.random()*30}px) rotate(${(Math.random()-0.5)*60}deg)`;},30);
      setTimeout(()=>el.remove(),600);
    };
    window.addEventListener("mousemove",mv);
    return()=>window.removeEventListener("mousemove",mv);
  },[]);
  return null;
}

// ─── RAIN POULETS ─────────────────────────────────────────────
function PouletRain({chaos}){
  const containerRef=useRef(null);
  useEffect(()=>{
    if(chaos<20)return;
    const interval=Math.max(300,2000-chaos*18);
    const iv=setInterval(()=>{
      const el=document.createElement("div");
      const emojis=["🐔","🍕","💥","⚡","🔥","💀"];
      el.textContent=emojis[Math.floor(Math.random()*emojis.length)];
      const size=20+Math.random()*30;
      const left=Math.random()*100;
      const duration=1500+Math.random()*2000;
      el.style.cssText=`position:fixed;left:${left}vw;top:-60px;font-size:${size}px;pointer-events:none;z-index:1;transition:top ${duration}ms linear,opacity 0.5s;opacity:0.6;transform:rotate(${Math.random()*360}deg)`;
      document.body.appendChild(el);
      setTimeout(()=>el.style.top=`110vh`,50);
      setTimeout(()=>el.remove(),duration+200);
    },interval);
    return()=>clearInterval(iv);
  },[chaos]);
  return null;
}

// ─── COMBO DISPLAY ────────────────────────────────────────────
function ComboDisplay({combo,show}){
  if(!show||combo<2)return null;
  const colors=["#FFE600","#FF9F0A","#FF2D55","#BF5AF2","#FF453A","#30D158"];
  const col=colors[Math.min(combo-2,colors.length-1)];
  return(
    <div style={{position:"fixed",top:"50%",left:"50%",transform:"translate(-50%,-50%)",fontFamily:"'Bangers',cursive",fontSize:Math.min(80+combo*8,200),color:col,textShadow:`0 0 40px ${col}, 0 0 80px ${col}88`,zIndex:9998,pointerEvents:"none",animation:"comboAnim 0.5s ease forwards",letterSpacing:4,whiteSpace:"nowrap"}}>
      x{combo} COMBO!
    </div>
  );
}

// ─── MELTDOWN ─────────────────────────────────────────────────
function MeltdownOverlay({active,onReset}){
  const [gt,setGt]=useState("MELTDOWN");
  useEffect(()=>{
    if(!active)return;
    const gc="█▓▒░▄▀■□●○◆◇★☆💀🐔🍕";
    const iv=setInterval(()=>setGt(Array.from("MELTDOWN").map(c=>Math.random()>0.5?gc[Math.floor(Math.random()*gc.length)]:c).join("")),60);
    return()=>clearInterval(iv);
  },[active]);
  if(!active)return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:99999,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",background:"#000000f0",backdropFilter:"blur(4px)",animation:"meltdownFlash 0.2s infinite"}}>
      {[...Array(20)].map((_,i)=><div key={i} style={{position:"absolute",left:`${Math.random()*100}%`,top:`${Math.random()*100}%`,fontSize:`${30+Math.random()*60}px`,animation:`float${i%3} ${1+Math.random()*2}s infinite`,opacity:0.4}}>{"🐔🍕💥⚡🔥💀"[i%6]}</div>)}
      <div style={{fontFamily:"'Bangers',cursive",fontSize:100,color:"#FF2D55",letterSpacing:8,textShadow:"0 0 60px #FF2D55",animation:"shake 0.08s infinite",lineHeight:1,position:"relative",zIndex:2}}>{gt}</div>
      <div style={{fontFamily:"'Bangers',cursive",fontSize:22,color:"#FFE600",letterSpacing:4,marginTop:16,textShadow:"0 0 20px #FFE600",position:"relative",zIndex:2}}>LE CHAOS A ATTEINT SON APOGÉE</div>
      <button onClick={onReset} style={{marginTop:40,padding:"14px 40px",background:"linear-gradient(135deg,#FF2D55,#FF9F0A)",border:"none",borderRadius:8,color:"#fff",fontFamily:"'Bangers',cursive",fontSize:24,cursor:"pointer",letterSpacing:3,boxShadow:"0 0 40px #FF2D5588",position:"relative",zIndex:2}}>🐔 RESET LE CHAOS</button>
    </div>
  );
}

// ─── PARTICLES ────────────────────────────────────────────────
function Particles({chaos,rageMode}){
  const cvRef=useRef(null);
  useEffect(()=>{
    const cv=cvRef.current;if(!cv)return;
    const ctx=cv.getContext("2d");
    const colors=["#FFE600","#FF2D55","#BF5AF2","#64D2FF","#30D158","#FF375F","#FF9F0A","#EF4444"];
    const resize=()=>{cv.width=window.innerWidth;cv.height=window.innerHeight;};
    resize();window.addEventListener("resize",resize);
    const pts=Array.from({length:120},()=>({x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,vx:(Math.random()-0.5)*2,vy:(Math.random()-0.5)*2,r:Math.random()*3+0.5,color:colors[Math.floor(Math.random()*colors.length)],a:Math.random()*0.6+0.1,w:Math.random()*Math.PI*2}));
    let raf;
    function draw(){
      ctx.clearRect(0,0,cv.width,cv.height);
      const speed=(chaos/50)*(rageMode?4:1);
      pts.forEach(p=>{
        p.w+=0.025;p.x+=p.vx*speed+Math.sin(p.w)*0.5;p.y+=p.vy*speed+Math.cos(p.w)*0.4;
        if(p.x<0)p.x=cv.width;if(p.x>cv.width)p.x=0;if(p.y<0)p.y=cv.height;if(p.y>cv.height)p.y=0;
        const alpha=Math.min(255,Math.floor(p.a*(chaos/80)*(rageMode?2.5:1)*255));
        if(alpha<5)return;
        ctx.beginPath();ctx.arc(p.x,p.y,p.r*(1+speed*0.3),0,Math.PI*2);
        ctx.fillStyle=p.color+alpha.toString(16).padStart(2,"0");ctx.fill();
        if(chaos>50&&Math.random()>0.96){ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(p.x+p.vx*25,p.y+p.vy*25);ctx.strokeStyle=p.color+"55";ctx.lineWidth=0.8;ctx.stroke();}
      });
      raf=requestAnimationFrame(draw);
    }
    draw();
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);};
  },[chaos,rageMode]);
  return<canvas ref={cvRef} style={{position:"fixed",inset:0,pointerEvents:"none",zIndex:0}}/>;
}

// ─── SHARED UI ────────────────────────────────────────────────
function Btn({children,onClick,disabled,color="#FFE600",full=false,size="md",pulse=false}){
  const [hov,setHov]=useState(false);
  const pad=size==="lg"?"16px 36px":size==="sm"?"6px 14px":size==="xl"?"24px 48px":"10px 22px";
  const fs=size==="xl"?28:size==="lg"?20:size==="sm"?13:15;
  return(
    <button onClick={onClick} disabled={disabled} onMouseEnter={()=>setHov(true)} onMouseLeave={()=>setHov(false)}
      style={{display:"inline-flex",alignItems:"center",gap:8,padding:pad,borderRadius:8,border:`2px solid ${color}`,background:hov&&!disabled?color:color+"22",color:hov&&!disabled?"#000":color,fontFamily:"'Bangers',cursive",fontSize:fs,cursor:disabled?"not-allowed":"pointer",opacity:disabled?0.3:1,transition:"all .1s",letterSpacing:1.5,width:full?"100%":"auto",justifyContent:"center",transform:hov&&!disabled?"translateY(-3px) scale(1.04)":"none",boxShadow:hov&&!disabled?`0 10px 32px ${color}77`:`0 0 ${pulse?20:0}px ${color}55`,textTransform:"uppercase",animation:pulse?"btnPulse 1s infinite":"none"}}>
      {children}
    </button>
  );
}
function Card({children,style,color}){return<div style={{background:"#ffffff08",border:`1px solid ${color?color+"44":"#ffffff18"}`,borderRadius:14,padding:20,backdropFilter:"blur(8px)",boxShadow:color?`0 0 24px ${color}18`:"none",...style}}>{children}</div>;}
function CardTitle({children,color="#ffffff55"}){return<div style={{fontSize:10,color,letterSpacing:3,textTransform:"uppercase",marginBottom:12,fontFamily:"'Bangers',cursive"}}>{children}</div>;}
function Inp({value,onChange,onKeyDown,placeholder,rows,style}){
  const [f,setF]=useState(false);
  return rows
    ?<textarea value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder} rows={rows} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={{width:"100%",padding:"12px 16px",background:"#ffffff0d",border:`2px solid ${f?"#FFE600":"#ffffff22"}`,borderRadius:10,color:"#fff",fontFamily:"'Inter',sans-serif",fontSize:14,outline:"none",resize:"none",lineHeight:1.6,transition:"border-color .2s",...style}}/>
    :<input value={value} onChange={onChange} onKeyDown={onKeyDown} placeholder={placeholder} onFocus={()=>setF(true)} onBlur={()=>setF(false)} style={{width:"100%",padding:"12px 16px",background:"#ffffff0d",border:`2px solid ${f?"#FFE600":"#ffffff22"}`,borderRadius:10,color:"#fff",fontFamily:"'Inter',sans-serif",fontSize:14,outline:"none",transition:"border-color .2s",...style}}/>;
}
function StatCard({label,value,color}){return<div style={{flex:1,padding:"14px 10px",background:"#ffffff08",border:`1px solid ${color}44`,borderRadius:10,textAlign:"center"}}><div style={{fontFamily:"'Bangers',cursive",fontSize:26,lineHeight:1,marginBottom:4,color,textShadow:`0 0 10px ${color}66`}}>{value}</div><div style={{fontSize:9,color:color+"88",letterSpacing:3,textTransform:"uppercase"}}>{label}</div></div>;}
function STitle({children,color="#FFE600",shake=false}){return<h2 style={{fontFamily:"'Bangers',cursive",fontSize:40,letterSpacing:3,margin:"0 0 4px",color,textTransform:"uppercase",textShadow:`0 0 20px ${color}88, 3px 3px 0 ${color}22`,lineHeight:1,animation:shake?"shake 0.15s infinite":"none"}}>{children}</h2>;}
function SDesc({children}){return<p style={{fontSize:13,color:"#ffffff77",marginBottom:24,lineHeight:1.6}}>{children}</p>;}
function ChaosBar({level}){
  const color=level<40?"#FFE600":level<70?"#FF9F0A":"#FF2D55";
  return<div style={{padding:"10px 16px",borderBottom:"1px solid #ffffff12"}}><div style={{display:"flex",justifyContent:"space-between",marginBottom:5}}><span style={{fontSize:9,letterSpacing:3,color:"#ffffff33",fontFamily:"'Bangers',cursive"}}>CHAOS</span><span style={{fontSize:11,fontFamily:"'Bangers',cursive",color}}>{level}%{level>90?" 🔥":""}</span></div><div style={{height:6,background:"#ffffff12",borderRadius:3,overflow:"hidden"}}><div style={{height:"100%",width:`${level}%`,background:`linear-gradient(90deg,${color},${color}bb)`,transition:"width .4s cubic-bezier(.34,1.56,.64,1)",boxShadow:`0 0 10px ${color}88`,animation:level>90?"chaosBarPulse 0.3s infinite alternate":"none",borderRadius:3}}/></div></div>;
}

// ─── CHICKEN TRADUCTEUR ───────────────────────────────────────
function ChickenTab({addChaos}){
  const [input,setInput]=useState("");
  const [output,setOutput]=useState("");
  const [mode,setMode]=useState("wtf");
  const [loading,setLoading]=useState(false);
  const [streaming,setStreaming]=useState(false);
  const accent="#FFE600";
  const MODES=[{id:"wtf",label:"🔥 WTF"},{id:"angry",label:"😡 Furax"},{id:"shakespeare",label:"📜 Shakespoulet"}];
  async function translate(){
    if(!input.trim()||loading)return;
    setLoading(true);setStreaming(true);setOutput("");addChaos(10);sndChicken();
    try{
      const res=await callAI(PROMPTS_CHICKEN[mode]+`"${input}"`);
      for(let i=0;i<=res.length;i++){await new Promise(r=>setTimeout(r,14));setOutput(res.slice(0,i));}
    }catch{setOutput("BKAAAAK !!! Le poulet a planté. BK BK BK.");}
    setLoading(false);setStreaming(false);
  }
  return(
    <div>
      <STitle color={accent}>🐔 Traducteur Savage Chicken</STitle>
      <SDesc>Entre du texte. Reçois du chaos. Simple.</SDesc>
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        {MODES.map(m=><button key={m.id} onClick={()=>setMode(m.id)} style={{padding:"8px 20px",borderRadius:20,border:`2px solid ${mode===m.id?accent:"#ffffff22"}`,background:mode===m.id?accent+"22":"transparent",color:mode===m.id?accent:"#ffffff44",fontFamily:"'Bangers',cursive",fontSize:14,cursor:"pointer",letterSpacing:1.5,transition:"all .15s"}}>{m.label}</button>)}
      </div>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div>
          <Inp value={input} onChange={e=>setInput(e.target.value)} onKeyDown={e=>e.key==="Enter"&&!e.shiftKey&&(e.preventDefault(),translate())} placeholder="Tape ici... Enter pour traduire" rows={6} style={{marginBottom:12}}/>
          <Btn onClick={translate} disabled={loading} color={accent} full size="lg">{loading?"🐔 Le poulet cogite...":"🐔 TRADUIRE"}</Btn>
        </div>
        <div style={{minHeight:160,padding:16,background:"#ffffff0a",border:`2px solid ${streaming?"#FFE60066":"#ffffff12"}`,borderRadius:12,fontSize:14,lineHeight:1.8,color:streaming?"#FFE600":"#fff",whiteSpace:"pre-wrap",boxShadow:streaming?"0 0 20px #FFE60033":"none",transition:"all .3s",position:"relative"}}>
          {streaming&&<span style={{position:"absolute",top:8,right:12,fontSize:10,color:"#FFE600",fontFamily:"'Bangers',cursive",letterSpacing:2,animation:"pulse 0.5s infinite"}}>EN COURS ▌</span>}
          {output||<span style={{color:"#ffffff22",fontFamily:"'Bangers',cursive",letterSpacing:2}}>EN ATTENTE DU POULET...</span>}
        </div>
      </div>
    </div>
  );
}

// ─── PIZZA ATTACK ─────────────────────────────────────────────
function PizzaParticle({x,y,emoji,size,rot,onDone}){
  const [top,setTop]=useState("-80px");
  const [r,setR]=useState(rot);
  useEffect(()=>{
    const t1=setTimeout(()=>setTop(y),30);
    const t2=setTimeout(onDone,3200);
    let raf,angle=rot;
    const spin=()=>{angle+=6;setR(angle);raf=requestAnimationFrame(spin);};
    spin();
    return()=>{clearTimeout(t1);clearTimeout(t2);cancelAnimationFrame(raf);};
  },[]);
  return<div style={{position:"absolute",left:x,top,fontSize:size,transition:"top 1s cubic-bezier(.22,1,.36,1)",pointerEvents:"none",userSelect:"none",transform:`rotate(${r}deg)`}}>{emoji}</div>;
}
function PizzaTab({addChaos}){
  const [pizzas,setPizzas]=useState([]);
  const [total,setTotal]=useState(0);
  const [presses,setPresses]=useState(0);
  const [combo,setCombo]=useState(0);
  const [showCombo,setShowCombo]=useState(false);
  const [msg,setMsg]=useState("");
  const lastClick=useRef(0);
  const comboRef=useRef(0);
  const MSGS=["JOJO PIZZA EST LÀ 🍕","LIVRAISON SAUVAGE","TU PEUX PAS REFUSER","400°C SUR TA TRONCHE","ENCORE UNE PIZZA LOL","LE FROMAGE DÉBORDE","PAS DE REMBOURSEMENT","SAVAGE PIZZA ON","BKAAAAK PIZZA","10 PIZZAS D'UN COUP"];
  const EMOJIS=["🍕","🍕","🍕","🍕","🫕","🌮","🥐","🍗","🐔","🔥","💥"];
  function hit(){
    const now=Date.now(),delta=now-lastClick.current;lastClick.current=now;
    if(delta<500)comboRef.current++;else comboRef.current=1;
    const c=comboRef.current;setCombo(c);setShowCombo(true);setTimeout(()=>setShowCombo(false),700);
    if(c>=2)sndCombo(c);else sndPizza();
    const count=Math.floor(Math.random()*4)+3+Math.min(c*2,12);
    setPizzas(p=>[...p,...Array.from({length:count},(_,i)=>({id:Date.now()+i,x:`${3+Math.random()*90}%`,y:`${8+Math.random()*72}%`,emoji:EMOJIS[Math.floor(Math.random()*EMOJIS.length)],size:28+Math.floor(Math.random()*48)+c*4,rot:Math.random()*360}))]);
    setPresses(p=>p+1);setTotal(p=>p+count);addChaos(10+c*3);
    setMsg(MSGS[Math.floor(Math.random()*MSGS.length)]);
  }
  const COLORS=["#FF2D55","#FF6B35","#FF9F0A","#FFE600"];
  const bgColor=COLORS[Math.min(Math.floor(combo/3),COLORS.length-1)];
  return(
    <div>
      <STitle color="#FF2D55">🍕 Pizza Attack</STitle>
      <SDesc>Clique vite pour le COMBO. Les pizzas tournent à x{Math.max(1,combo)} vitesse.</SDesc>
      <ComboDisplay combo={combo} show={showCombo}/>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div>
          <button onClick={hit} style={{width:"100%",padding:"28px",background:`linear-gradient(135deg,#FF2D55,#FF6B35,#FF9F0A)`,border:"none",borderRadius:14,color:"#fff",fontFamily:"'Bangers',cursive",fontSize:32,cursor:"pointer",letterSpacing:3,marginBottom:16,boxShadow:`0 8px 40px #FF2D5577`,textTransform:"uppercase",backgroundSize:"200% 200%",animation:"gradientShift 2s infinite"}} onMouseDown={e=>e.currentTarget.style.transform="scale(0.94)"} onMouseUp={e=>e.currentTarget.style.transform="scale(1)"}>
            🍕 PIZZA ATTACK{combo>1?` x${combo}`:""}
          </button>
          <div style={{position:"relative",width:"100%",height:320,background:"#ff2d5506",borderRadius:14,overflow:"hidden",border:`2px solid ${bgColor}44`,boxShadow:`0 0 30px ${bgColor}22`,transition:"all .3s"}}>
            {pizzas.length===0&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",color:"#FF2D5533",fontFamily:"'Bangers',cursive",letterSpacing:3,fontSize:13}}>EN ATTENTE...</div>}
            {pizzas.map(p=><PizzaParticle key={p.id} x={p.x} y={p.y} emoji={p.emoji} size={p.size} rot={p.rot} onDone={()=>setPizzas(prev=>prev.filter(x=>x.id!==p.id))}/>)}
            {msg&&<div style={{position:"absolute",bottom:10,left:0,right:0,textAlign:"center",fontFamily:"'Bangers',cursive",fontSize:15,color:"#FF2D55",letterSpacing:2,textShadow:"0 0 10px #FF2D5588"}}>{msg}</div>}
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card color="#FF2D55">
            <CardTitle>Stats massacre</CardTitle>
            <div style={{display:"flex",gap:10}}><StatCard label="Pizzas" value={total} color="#FF2D55"/><StatCard label="Presses" value={presses} color="#FFE600"/><StatCard label="Combo" value={`x${combo}`} color="#BF5AF2"/></div>
          </Card>
          <Card>
            <CardTitle>Niveau d'indigestion</CardTitle>
            <div style={{height:20,background:"#ffffff0a",borderRadius:10,overflow:"hidden",marginBottom:8}}><div style={{height:"100%",width:`${Math.min(100,total/2)}%`,background:"linear-gradient(90deg,#FF9F0A,#FF2D55)",borderRadius:10,transition:"width .3s",boxShadow:"0 0 10px #FF2D5588"}}/></div>
            <div style={{fontFamily:"'Bangers',cursive",fontSize:14,color:total>100?"#FF453A":total>50?"#FF9F0A":"#30D158",letterSpacing:2}}>{total>150?"🤮 INDIGESTION TOTALE":total>100?"🤢 DANGER CRITIQUE":total>50?"😰 BIENTÔT MORT":"😋 ENCORE FAIM"}</div>
          </Card>
        </div>
      </div>
    </div>
  );
}
// (comboRef correctement scopé dans PizzaTab désormais)

// ─── ROUE DU DESTIN ───────────────────────────────────────────
function RoueTab({addChaos,addPizza}){
  const [spinning,setSpinning]=useState(false);
  const [angle,setAngle]=useState(0);
  const [result,setResult]=useState(null);
  const [resultText,setResultText]=useState("");
  const [history,setHistory]=useState([]);
  const cvRef=useRef(null);
  const SEG=ROUE_OPTS.length,SEG_A=(2*Math.PI)/SEG;
  const accent="#BF5AF2";
  function draw(rot){
    const cv=cvRef.current;if(!cv)return;
    const ctx=cv.getContext("2d"),cx=cv.width/2,cy=cv.height/2,r=cx-8;
    ctx.clearRect(0,0,cv.width,cv.height);
    const glow=ctx.createRadialGradient(cx,cy,r*0.5,cx,cy,r);
    glow.addColorStop(0,accent+"11");glow.addColorStop(1,accent+"33");
    ctx.beginPath();ctx.arc(cx,cy,r+8,0,Math.PI*2);ctx.fillStyle=glow;ctx.fill();
    ctx.beginPath();ctx.arc(cx,cy,r+4,0,Math.PI*2);ctx.strokeStyle=accent+"66";ctx.lineWidth=3;ctx.stroke();
    ROUE_OPTS.forEach((opt,i)=>{
      const s=rot+i*SEG_A-Math.PI/2,e=s+SEG_A;
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,s,e);ctx.closePath();
      ctx.fillStyle=opt.color+"1a";ctx.strokeStyle=opt.color+"aa";ctx.lineWidth=1.5;ctx.fill();ctx.stroke();
      const mid=s+SEG_A/2;
      ctx.save();ctx.translate(cx+Math.cos(mid)*r*0.65,cy+Math.sin(mid)*r*0.65);ctx.rotate(mid+Math.PI/2);
      ctx.font="bold 10px 'Bangers',cursive";ctx.fillStyle=opt.color;ctx.textAlign="center";
      ctx.fillText(opt.emoji+" "+opt.label,0,0);ctx.restore();
    });
    ctx.beginPath();ctx.arc(cx,cy,14,0,Math.PI*2);ctx.fillStyle="#0d0018";ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx+r+12,cy);ctx.lineTo(cx+r-10,cy-6);ctx.lineTo(cx+r-10,cy+6);ctx.closePath();ctx.fillStyle=accent;ctx.fill();
  }
  useEffect(()=>{draw(angle);},[angle]);
  async function spin(){
    if(spinning)return;
    setSpinning(true);setResult(null);setResultText("");addChaos(20);sndAlarm();
    const total=Math.PI*2*(10+Math.random()*8),dur=4200,start=performance.now(),startA=angle;
    function animate(now){
      const el=now-start,prog=Math.min(el/dur,1),ease=1-Math.pow(1-prog,4),cur=startA+total*ease;
      setAngle(cur);draw(cur);
      if(prog<1){requestAnimationFrame(animate);return;}
      const norm=((cur%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
      const idx=Math.floor(((Math.PI*2-norm+Math.PI*2)%(Math.PI*2))/SEG_A)%SEG;
      const picked=ROUE_OPTS[idx];setResult(picked);handleResult(picked);setSpinning(false);
    }
    requestAnimationFrame(animate);
  }
  async function handleResult(opt){
    sndWin();setHistory(h=>[opt,...h].slice(0,12));
    if(opt.label.includes("Pizza")||opt.label==="Double chaos")addPizza();
    if(opt.label==="Double chaos"){setTimeout(addPizza,500);addChaos(15);setResultText("DOUBLE PIZZA DOUBLE CHAOS ⚡⚡");return;}
    if(opt.label==="EXPLOSION"){setResultText("💥 TOUT EXPLOSE. PIZZAS PARTOUT.");sndExplosion();addChaos(30);addPizza();setTimeout(addPizza,300);setTimeout(addPizza,600);return;}
    if(opt.label==="Honte totale"){setResultText("T'es la honte du Savage Chicken. Jojo Pizza te désavoue.");return;}
    if(opt.label==="Cri de poulet"){setResultText("BKAAAAAAAAAK BKAK BK BK BK 🐔🐔🐔 LE POULET EST LIBRE");sndChicken();return;}
    if(opt.label==="Poulet sauvage"){setResultText("🔥 LE SAVAGE CHICKEN EST LIBÉRÉ. PERSONNE N'EST EN SÉCURITÉ. 🔥");sndAlarm();return;}
    if(opt.label==="Rien... ou si ?"){setResultText("Rien ne se passe...");setTimeout(()=>{setResultText("...GOTCHA 💀 PIZZA EN ROUTE");sndExplosion();addPizza();},2500);return;}
    if(opt.label==="Insulte"){setResultText(INSULTES_LOCAL[Math.floor(Math.random()*INSULTES_LOCAL.length)]);sndRoast();}
  }
  return(
    <div>
      <STitle color={accent}>🎰 Roue du Destin</STitle>
      <SDesc>Tourne. Subis les conséquences. C'est mérité.</SDesc>
      <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:28,alignItems:"start"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
          <canvas ref={cvRef} width={320} height={320} style={{filter:`drop-shadow(0 0 20px ${accent}44)`}}/>
          <Btn onClick={spin} disabled={spinning} color={accent} size="lg" full pulse={!spinning}>{spinning?"🌀 EN ROTATION...":"🎰 TOURNER"}</Btn>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:12}}>
          <Card color={accent}>
            <CardTitle>Résultat</CardTitle>
            {result?<div style={{textAlign:"center",padding:"12px 0"}}><div style={{fontSize:52,marginBottom:8,animation:"bounce 0.6s infinite"}}>{result.emoji}</div><div style={{fontFamily:"'Bangers',cursive",fontSize:22,color:result.color,letterSpacing:2,textShadow:`0 0 12px ${result.color}88`,marginBottom:8}}>{result.label}</div>{resultText&&<div style={{fontSize:13,color:"#ffffff99",lineHeight:1.7,padding:"8px 12px",background:"#ffffff08",borderRadius:8}}>{resultText}</div>}</div>:<div style={{minHeight:100,display:"flex",alignItems:"center",justifyContent:"center",color:"#ffffff22",fontFamily:"'Bangers',cursive",letterSpacing:3,fontSize:12}}>PAS ENCORE TOURNÉ...</div>}
          </Card>
          <Card>
            <CardTitle>Historique des destins</CardTitle>
            <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
              {history.map((h,i)=><div key={i} style={{fontSize:20,padding:4,background:h.color+"22",borderRadius:8,border:`1px solid ${h.color}44`}}>{h.emoji}</div>)}
              {history.length===0&&<span style={{fontSize:11,color:"#ffffff22",fontFamily:"'Bangers',cursive",letterSpacing:2}}>VIDE POUR L'INSTANT</span>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── BOUTON INUTILE ───────────────────────────────────────────
function BoutonTab({addChaos}){
  const [count,setCount]=useState(0);
  const [reaction,setReaction]=useState("Ce bouton ne sert absolument à rien.");
  const [scale,setScale]=useState(1);
  const [escaped,setEscaped]=useState(false);
  const [btnPos,setBtnPos]=useState({x:200,y:170});
  const [shaking,setShaking]=useState(false);
  const [log,setLog]=useState([]);
  const containerRef=useRef(null);
  const accent="#FF453A";
  function press(){
    if(escaped)return;
    const n=count+1;setCount(n);addChaos(3);beep(80+n*3,0.1,"sawtooth");
    setScale(s=>Math.min(s+0.05,2.5));
    setShaking(true);setTimeout(()=>setShaking(false),350);
    const msg=REACTIONS[Math.floor(Math.random()*REACTIONS.length)].replace(/\{n\}/g,n);
    setReaction(msg);setLog(l=>["#"+n+" — "+msg,...l].slice(0,30));
    if(n===10){setEscaped(true);addChaos(25);sndAlarm();setReaction("LE BOUTON S'EST BARRÉ. IL TE DÉTESTE.");}
  }
  function flee(e){
    if(!escaped)return;
    const c=containerRef.current;if(!c)return;
    const rect=c.getBoundingClientRect();
    const mx=e.clientX-rect.left,my=e.clientY-rect.top;
    const dx=btnPos.x-mx,dy=btnPos.y-my,dist=Math.sqrt(dx*dx+dy*dy);
    if(dist<180){
      const nx=Math.max(50,Math.min(rect.width-50,btnPos.x+dx*2+(Math.random()-0.5)*100));
      const ny=Math.max(50,Math.min(rect.height-50,btnPos.y+dy*2+(Math.random()-0.5)*100));
      setBtnPos({x:nx,y:ny});sndClick();
    }
  }
  const sz=Math.round(130*scale);
  const REACTIONS=["Bravo. Rien ne s'est passé.","Tu recommences vraiment ?","Le bouton te hait.","Appuie encore. Vas-y.","C'est la {n}ème fois. Tu vas bien ?","STOP. ...Non continue.","Un poulet t'observe.","Ce clic va changer ta vie. Non.","Tu aurais pu faire autre chose.","Et de {n}. Ça fait quoi ?","Jojo Pizza désapprouve.","BK BK BK.","Le savage chicken te juge.","Tu es incontrôlable.","{n} fois. Impressionnant non.","Le bouton vibre de dégoût.","{n} crimes. Zéro regret.","Il faut arrêter. Genre vraiment.","T'as vraiment rien d'autre à faire ?","Le bouton va se barrer si ça continue."];
  return(
    <div>
      <STitle color={accent}>🔴 Le Bouton Inutile</STitle>
      <SDesc>{escaped?"Le bouton s'est échappé. Tu dois l'attraper.":"Ne pas appuyer. À 10 clics il se barre."}</SDesc>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div>
          <div ref={containerRef} onMouseMove={flee} style={{position:"relative",width:"100%",height:380,background:"#FF453A06",borderRadius:14,overflow:"hidden",border:`1px solid #FF453A22`,cursor:escaped?"crosshair":"default"}}>
            <button onClick={press} style={{position:"absolute",left:escaped?btnPos.x:"50%",top:escaped?btnPos.y:"50%",transform:"translate(-50%,-50%)",width:sz,height:sz,borderRadius:"50%",border:`3px solid ${accent}`,background:`radial-gradient(circle,${accent}33,${accent}11)`,color:accent,fontFamily:"'Bangers',cursive",fontSize:Math.max(11,16-count*0.1),cursor:escaped?"not-allowed":"pointer",letterSpacing:1.5,animation:shaking?"shake .35s":"none",boxShadow:`0 0 ${15+count*4}px ${accent}66, inset 0 0 20px ${accent}22`,textTransform:"uppercase",transition:escaped?"none":"width .3s,height .3s"}}>
              {escaped?"😈":"NE PAS\nAPPUYER"}
            </button>
            {escaped&&<div style={{position:"absolute",bottom:10,left:0,right:0,textAlign:"center",fontFamily:"'Bangers',cursive",fontSize:12,color:"#FF453A88",letterSpacing:2}}>ATTRAPE-MOI SI TU PEUX</div>}
          </div>
          <div style={{display:"flex",gap:8,marginTop:10}}><StatCard label="Clics" value={count} color={accent}/><StatCard label="Statut" value={escaped?"FUGITIF":"CAPTIF"} color={escaped?"#30D158":accent}/><StatCard label="Taille" value={Math.round(scale*100)+"%"} color="#BF5AF2"/></div>
        </div>
        <div>
          <div style={{padding:"14px 16px",background:"#ffffff0a",borderRadius:12,fontSize:14,color:"#ffffff88",lineHeight:1.7,marginBottom:14,border:"1px solid #ffffff12",minHeight:50}}>{reaction}</div>
          <div style={{fontFamily:"'Bangers',cursive",fontSize:10,color:"#ffffff33",letterSpacing:3,marginBottom:8}}>JOURNAL DES CRIMES</div>
          <div style={{display:"flex",flexDirection:"column",gap:3,maxHeight:300,overflowY:"auto"}}>{log.map((m,i)=><div key={i} style={{fontSize:11,color:"#ffffff33",padding:"3px 0",borderBottom:"1px solid #ffffff08"}}>{m}</div>)}</div>
        </div>
      </div>
    </div>
  );
}

// ─── POULET CLICKER ───────────────────────────────────────────
function ClickerTab({addChaos}){
  const [clicks,setClicks]=useState(0);
  const [cps,setCps]=useState(0);
  const [burst,setBurst]=useState(false);
  const [evolution,setEvolution]=useState(0);
  const [particles,setParticles]=useState([]);
  const [autoClick,setAutoClick]=useState(false);
  const cpsRef=useRef([]);
  const autoRef=useRef(null);
  const accent="#FF9F0A";

  const currentEvol=CLICKER_EVOLS.reduce((acc,e,i)=>clicks>=e.req?i:acc,0);
  const nextEvol=CLICKER_EVOLS[currentEvol+1];
  const progress=nextEvol?((clicks-CLICKER_EVOLS[currentEvol].req)/(nextEvol.req-CLICKER_EVOLS[currentEvol].req))*100:100;
  const evol=CLICKER_EVOLS[currentEvol];

  useEffect(()=>{
    if(currentEvol!==evolution){
      setEvolution(currentEvol);
      sndGlory();addChaos(20);
      for(let i=0;i<20;i++)setTimeout(()=>{
        setParticles(p=>[...p,{id:Date.now()+Math.random(),x:Math.random()*100,y:Math.random()*100,emoji:evol.emoji}]);
      },i*80);
    }
  },[currentEvol]);

  useEffect(()=>{
    if(!autoClick){clearInterval(autoRef.current);return;}
    autoRef.current=setInterval(()=>doClick(false),600);
    return()=>clearInterval(autoRef.current);
  },[autoClick]);

  function doClick(manual=true){
    const now=Date.now();
    cpsRef.current=[...cpsRef.current.filter(t=>now-t<1000),now];
    setCps(cpsRef.current.length);
    setClicks(c=>c+1);
    if(manual){addChaos(1);setBurst(true);setTimeout(()=>setBurst(false),120);sndClick();}
    setParticles(p=>[...p,{id:Date.now()+Math.random(),x:35+Math.random()*30,y:20+Math.random()*60,emoji:["✨","⚡","💥","🔥"][Math.floor(Math.random()*4)]}]);
    setTimeout(()=>setParticles(p=>p.slice(-30)),100);
  }

  return(
    <div>
      <STitle color={accent}>🐔 Poulet Clicker</STitle>
      <SDesc>Clique pour faire évoluer ton poulet. Il y a 5 stades d'évolution.</SDesc>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
          <div style={{position:"relative",width:260,height:260}}>
            {particles.map(p=>(
              <div key={p.id} style={{position:"absolute",left:`${p.x}%`,top:`${p.y}%`,fontSize:18,animation:"particleUp 0.8s ease forwards",pointerEvents:"none"}}>{p.emoji}</div>
            ))}
            <button onClick={()=>doClick(true)} style={{
              width:"100%",height:"100%",borderRadius:"50%",border:`4px solid ${evol.color}`,
              background:`radial-gradient(circle,${evol.color}33,${evol.color}11)`,
              fontSize:burst?120:100,cursor:"pointer",transition:"font-size .08s",
              boxShadow:`0 0 ${40+clicks*0.02}px ${evol.color}66, 0 0 ${80+clicks*0.04}px ${evol.color}33`,
              display:"flex",alignItems:"center",justifyContent:"center",
              animation:burst?"btnBurst 0.12s ease":"none",
            }}>
              {evol.emoji}
            </button>
          </div>
          <div style={{fontFamily:"'Bangers',cursive",fontSize:22,color:evol.color,letterSpacing:3,textShadow:`0 0 15px ${evol.color}88`}}>{evol.name}</div>
          <div style={{width:"100%"}}>
            <div style={{display:"flex",justifyContent:"space-between",marginBottom:6,fontSize:11,fontFamily:"'Bangers',cursive",letterSpacing:2,color:"#ffffff55"}}>
              <span>{evol.name}</span>
              <span>{nextEvol?`${nextEvol.name} : ${nextEvol.req} clics`:"DIVINITÉ ATTEINTE"}</span>
            </div>
            <div style={{height:10,background:"#ffffff12",borderRadius:5,overflow:"hidden"}}><div style={{height:"100%",width:`${progress}%`,background:`linear-gradient(90deg,${evol.color},${evol.color}bb)`,borderRadius:5,transition:"width .3s",boxShadow:`0 0 8px ${evol.color}88`}}/></div>
          </div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card color={accent}>
            <CardTitle>Stats du poulet</CardTitle>
            <div style={{display:"flex",gap:8}}><StatCard label="Clics" value={clicks} color={accent}/><StatCard label="C/S" value={cps} color="#FF2D55"/><StatCard label="Évolution" value={`${currentEvol+1}/5`} color={evol.color}/></div>
          </Card>
          <Card>
            <CardTitle>Auto-cliqueur</CardTitle>
            <p style={{fontSize:12,color:"#ffffff55",marginBottom:12}}>Active le cliqueur automatique. Le poulet se bat seul.</p>
            <Btn onClick={()=>setAutoClick(a=>!a)} color={autoClick?"#FF453A":accent} full>{autoClick?"⏹ STOPPER L'AUTO":"🤖 AUTO-CLIQUER"}</Btn>
          </Card>
          <Card>
            <CardTitle>Arbre d'évolution</CardTitle>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {CLICKER_EVOLS.map((e,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"8px 12px",borderRadius:8,background:i<=currentEvol?e.color+"22":"#ffffff06",border:`1px solid ${i<=currentEvol?e.color+"55":"#ffffff12"}`,opacity:i>currentEvol+1?0.4:1}}>
                  <span style={{fontSize:22}}>{e.emoji}</span>
                  <div style={{flex:1}}>
                    <div style={{fontFamily:"'Bangers',cursive",fontSize:14,color:i<=currentEvol?e.color:"#ffffff44",letterSpacing:1}}>{e.name}</div>
                    <div style={{fontSize:10,color:"#ffffff33"}}>{e.req} clics</div>
                  </div>
                  {i<=currentEvol&&<span style={{color:"#30D158",fontSize:14}}>✅</span>}
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── CASINO POULET ────────────────────────────────────────────
function CasinoTab({addChaos}){
  const [reels,setReels]=useState([0,0,0]);
  const [spinning,setSpinning]=useState(false);
  const [coins,setCoins]=useState(100);
  const [bet,setBet]=useState(10);
  const [result,setResult]=useState(null);
  const [history,setHistory]=useState([]);
  const [jackpot,setJackpot]=useState(false);
  const accent="#30D158";

  function spin(){
    if(spinning||coins<bet)return;
    setSpinning(true);setResult(null);setJackpot(false);
    setCoins(c=>c-bet);addChaos(8);sndCasino();
    const final=[Math.floor(Math.random()*CASINO_EMOJIS.length),Math.floor(Math.random()*CASINO_EMOJIS.length),Math.floor(Math.random()*CASINO_EMOJIS.length)];
    // Force jackpot 5% du temps
    if(Math.random()<0.05){final[0]=final[1]=final[2]=0;}
    // Force small win 25%
    else if(Math.random()<0.25){final[2]=final[1];}

    let step=0;
    const iv=setInterval(()=>{
      setReels([Math.floor(Math.random()*CASINO_EMOJIS.length),Math.floor(Math.random()*CASINO_EMOJIS.length),Math.floor(Math.random()*CASINO_EMOJIS.length)]);
      step++;
      if(step>18){
        clearInterval(iv);
        setReels(final);
        const r=evalResult(final);
        setResult(r);
        const gain=bet*r.mult;
        setCoins(c=>c+gain);
        setHistory(h=>[{...r,gain,bet},...h].slice(0,12));
        if(r.mult>=50){setJackpot(true);sndGlory();addChaos(40);}
        else if(r.mult>0)sndWin();
        else sndCrash();
        setSpinning(false);
      }
    },80);
  }

  function evalResult(r){
    const e=[CASINO_EMOJIS[r[0]],CASINO_EMOJIS[r[1]],CASINO_EMOJIS[r[2]]];
    if(r[0]===r[1]&&r[1]===r[2]){
      if(r[0]===CASINO_EMOJIS.indexOf("👑"))return{msg:"💀 JACKPOT DIVIN 💀",mult:100,color:"#FFE600"};
      if(r[0]===CASINO_EMOJIS.indexOf("🐔"))return{msg:"POULET SACRÉ",mult:50,color:"#FF9F0A"};
      if(r[0]===CASINO_EMOJIS.indexOf("🍕"))return{msg:"PIZZA JACKPOT",mult:20,color:"#FF2D55"};
      return{msg:"TRIPLE CHAOS",mult:10,color:"#BF5AF2"};
    }
    if(r[0]===r[1]||r[1]===r[2]||r[0]===r[2])return{msg:"DOUBLE → x2",mult:2,color:"#64D2FF"};
    return{msg:"PERDU LOL",mult:0,color:"#FF453A"};
  }

  const reelEmoji=i=>CASINO_EMOJIS[reels[i]]||"🐔";

  return(
    <div>
      <STitle color={accent}>🎰 Casino Poulet</STitle>
      <SDesc>Machine à sous. Tu vas perdre. C'est garanti.</SDesc>
      {jackpot&&<div style={{position:"fixed",inset:0,zIndex:9990,pointerEvents:"none",background:"radial-gradient(ellipse,#FFE60033,transparent 60%)",animation:"jackpotFlash 0.2s infinite"}}/>}
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        <div>
          <div style={{padding:24,background:"linear-gradient(135deg,#1a0a00,#0a1a00)",border:`2px solid ${accent}44`,borderRadius:16,textAlign:"center",marginBottom:16,position:"relative",overflow:"hidden"}}>
            {jackpot&&<div style={{position:"absolute",inset:0,background:"linear-gradient(135deg,#FFE60022,#FF9F0A22)",animation:"jackpotFlash 0.3s infinite"}}/>}
            <div style={{display:"flex",justifyContent:"center",gap:12,marginBottom:20}}>
              {[0,1,2].map(i=>(
                <div key={i} style={{width:90,height:90,background:"#000000aa",border:`2px solid ${spinning?"#FF9F0A":"#ffffff22"}`,borderRadius:12,display:"flex",alignItems:"center",justifyContent:"center",fontSize:48,boxShadow:spinning?`0 0 20px #FF9F0A66`:"none",transition:"all .1s",animation:spinning?"reelSpin 0.1s infinite":"none"}}>
                  {reelEmoji(i)}
                </div>
              ))}
            </div>
            {result&&<div style={{fontFamily:"'Bangers',cursive",fontSize:22,color:result.color,letterSpacing:3,textShadow:`0 0 15px ${result.color}88`,marginBottom:8,animation:"fadein 0.3s ease"}}>{result.msg}</div>}
            {result&&result.mult>0&&<div style={{fontFamily:"'Bangers',cursive",fontSize:16,color:"#30D158",letterSpacing:2}}>+{bet*result.mult} COINS 🤑</div>}
            {result&&result.mult===0&&<div style={{fontFamily:"'Bangers',cursive",fontSize:14,color:"#FF453A",letterSpacing:2}}>-{bet} COINS 💀</div>}
          </div>
          <div style={{display:"flex",gap:8,marginBottom:12,alignItems:"center"}}>
            <span style={{fontFamily:"'Bangers',cursive",color:"#FFE600",fontSize:14,letterSpacing:1,whiteSpace:"nowrap"}}>MISE:</span>
            {[5,10,25,50].map(b=><button key={b} onClick={()=>setBet(b)} style={{flex:1,padding:"8px 0",borderRadius:8,border:`2px solid ${bet===b?"#FFE600":"#ffffff22"}`,background:bet===b?"#FFE60022":"transparent",color:bet===b?"#FFE600":"#ffffff44",fontFamily:"'Bangers',cursive",fontSize:14,cursor:"pointer",letterSpacing:1}}>{b}</button>)}
          </div>
          <Btn onClick={spin} disabled={spinning||coins<bet} color={accent} full size="lg" pulse={!spinning&&coins>=bet}>{spinning?"🎰 EN COURS...":coins<bet?"❌ PAS ASSEZ":"🎰 JOUER"}</Btn>
          <div style={{display:"flex",gap:10,marginTop:12}}><StatCard label="Coins" value={coins} color="#FFE600"/><StatCard label="Mise" value={bet} color={accent}/></div>
        </div>
        <div>
          <Card>
            <CardTitle>Historique des coups</CardTitle>
            <div style={{display:"flex",flexDirection:"column",gap:5,maxHeight:380,overflowY:"auto"}}>
              {history.map((h,i)=>(
                <div key={i} style={{display:"flex",justifyContent:"space-between",padding:"7px 10px",background:h.mult>0?"#30D15810":"#FF453A10",borderRadius:8,border:`1px solid ${h.mult>0?"#30D15833":"#FF453A33"}`,fontSize:11}}>
                  <span style={{fontFamily:"'Bangers',cursive",color:h.color,letterSpacing:1}}>{h.msg}</span>
                  <span style={{fontFamily:"'Bangers',cursive",color:h.mult>0?"#30D158":"#FF453A"}}>{h.mult>0?"+"+h.gain:"-"+h.bet}</span>
                </div>
              ))}
              {history.length===0&&<div style={{color:"#ffffff22",fontSize:11,fontFamily:"'Bangers',cursive",letterSpacing:2}}>AUCUN COUP JOUÉ</div>}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── ROAST-O-MATIC ────────────────────────────────────────────
function RoastTab({addChaos}){
  const [roast,setRoast]=useState(null);
  const [level,setLevel]=useState(0);
  const [loading,setLoading]=useState(false);
  const [total,setTotal]=useState(0);
  const [flash,setFlash]=useState(false);
  const accent="#FF2D55";

  async function getroast(){
    if(loading)return;
    setLoading(true);addChaos(12);sndRoast();setFlash(true);setTimeout(()=>setFlash(false),300);
    const nlevel=Math.min(level+1,4);setLevel(nlevel);setTotal(t=>t+1);
    try{
      const niveauLabel=ROAST_NIVEAUX[nlevel];
      const res=await callAI(`Tu es le Savage Chicken ROAST MASTER niveau "${niveauLabel}". Génère une insulte/roast absurde, drôle et WTF en 1-2 phrases MAXIMUM. Style trash français, gros mots acceptés, mais absurde et pas réellement méchant. Implique Jojo Pizza, des poulets, des pizzas. PAS de racisme ni discrimination. Juste trash et drôle. Réponds UNIQUEMENT l'insulte, rien d'autre.`,200);
      setRoast(res.trim());
    }catch{
      setRoast(INSULTES_LOCAL[Math.floor(Math.random()*INSULTES_LOCAL.length)]);
    }
    setLoading(false);
  }

  const levelColor=["#30D158","#FFE600","#FF9F0A","#FF2D55","#FF2D55"][level];

  return(
    <div>
      <STitle color={accent}>💀 Roast-O-Matic</STitle>
      <SDesc>Appuie. Reçois une insulte. Le niveau monte à chaque clic.</SDesc>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
          <button onClick={getroast} disabled={loading} style={{
            width:220,height:220,borderRadius:"50%",
            border:`5px solid ${accent}`,
            background:flash?accent+"44":`radial-gradient(circle,${accent}22,${accent}0a)`,
            fontSize:80,cursor:loading?"wait":"pointer",
            boxShadow:`0 0 ${30+total*2}px ${accent}66, 0 0 60px ${accent}33`,
            transition:"all .15s",display:"flex",alignItems:"center",justifyContent:"center",
            animation:loading?"btnPulse 0.4s infinite":flash?"shake 0.3s":"none",
            transform:flash?"scale(0.92)":"scale(1)",
          }}>
            {loading?"🐔":"💀"}
          </button>
          <div style={{textAlign:"center"}}>
            <div style={{fontFamily:"'Bangers',cursive",fontSize:18,color:levelColor,letterSpacing:3,marginBottom:6}}>{ROAST_NIVEAUX[level]}</div>
            <div style={{display:"flex",gap:4,justifyContent:"center"}}>
              {ROAST_NIVEAUX.map((_,i)=><div key={i} style={{width:24,height:8,borderRadius:4,background:i<=level?levelColor:"#ffffff12",transition:"all .3s"}}/>)}
            </div>
          </div>
          <div style={{display:"flex",gap:10}}><StatCard label="Roasts" value={total} color={accent}/><StatCard label="Niveau" value={ROAST_NIVEAUX[level]} color={levelColor}/></div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <div style={{minHeight:160,padding:24,background:accent+"0a",border:`2px solid ${accent}${roast?"44":"22"}`,borderRadius:14,display:"flex",alignItems:"center",justifyContent:"center",boxShadow:roast?`0 0 30px ${accent}22`:"none",transition:"all .3s"}}>
            {roast
              ?<div style={{fontFamily:"'Bangers',cursive",fontSize:20,color:"#fff",lineHeight:1.6,letterSpacing:1,textAlign:"center",animation:"fadein 0.3s ease"}}>{roast}</div>
              :<div style={{fontFamily:"'Bangers',cursive",fontSize:14,color:"#ffffff22",letterSpacing:3,textAlign:"center"}}>APPUIE SUR LE BOUTON<br/>POUR RECEVOIR UNE INSULTE</div>
            }
          </div>
          <Card>
            <CardTitle>Avertissement légal du poulet</CardTitle>
            <div style={{fontSize:11,color:"#ffffff44",lineHeight:1.7}}>Le Savage Chicken décline toute responsabilité pour les dommages psychologiques causés. Ces insultes sont générées par une IA dérangée et ne reflètent pas la réalité. Jojo Pizza est innocent.</div>
          </Card>
        </div>
      </div>
    </div>
  );
}

// ─── SOUNDBOARD ───────────────────────────────────────────────
function SoundboardTab({addChaos}){
  const [active,setActive]=useState(null);
  const accent="#F472B6";
  const SOUNDS=[
    {id:"chicken",label:"🐔 CRI POULET",color:"#FFE600",fn:()=>{sndChicken();sndChicken();}},
    {id:"pizza",label:"🍕 PIZZA TIME",color:"#FF2D55",fn:sndPizza},
    {id:"explosion",label:"💥 EXPLOSION",color:"#FF9F0A",fn:sndExplosion},
    {id:"alarm",label:"🚨 ALARME",color:"#FF453A",fn:sndAlarm},
    {id:"win",label:"🏆 VICTOIRE",color:"#30D158",fn:sndWin},
    {id:"crash",label:"💻 CRASH",color:"#64D2FF",fn:sndCrash},
    {id:"fart",label:"💨 PROUT",color:"#A78BFA",fn:sndFart},
    {id:"siren",label:"🚑 SIRÈNE",color:"#EF4444",fn:sndSiren},
    {id:"laser",label:"⚡ LASER",color:"#06B6D4",fn:sndLaser},
    {id:"boing",label:"🎪 BOING",color:"#F472B6",fn:sndBoing},
    {id:"drum",label:"🥁 DRUM",color:"#FF9F0A",fn:sndDrum},
    {id:"glory",label:"👑 GLOIRE",color:"#FFE600",fn:sndGlory},
    {id:"bomb",label:"💣 BOMBE",color:"#FF2D55",fn:sndBomb},
    {id:"roast",label:"💀 ROAST",color:"#FF375F",fn:sndRoast},
    {id:"combo",label:"🔥 COMBO",color:"#FF9F0A",fn:()=>sndCombo(7)},
    {id:"meltdown",label:"☢️ MELTDOWN",color:"#FF453A",fn:sndMeltdown},
    {id:"click",label:"🖱️ CLICK",color:"#ffffff",fn:sndClick},
    {id:"oracle",label:"🔮 ORACLE",color:"#06B6D4",fn:sndOracle},
    {id:"chkn2",label:"🐔🐔 DOUBLE BK",color:"#FFE600",fn:()=>{sndChicken();setTimeout(sndChicken,300);}},
    {id:"fanfare",label:"🎺 FANFARE",color:"#F472B6",fn:()=>{for(let i=0;i<6;i++)beep(262*Math.pow(2,i/4),0.12,"sine",0.15,i*0.1);}},
    {id:"sad",label:"😭 TRISTE",color:"#64D2FF",fn:()=>jingle([[392,0,0.3,"sine",0.1],[349,400,0.3,"sine",0.1],[330,800,0.4,"sine",0.08],[294,1200,0.6,"sine",0.06]])},
    {id:"super",label:"⭐ SUPER",color:"#FFE600",fn:()=>{for(let i=0;i<12;i++)beep(523+i*40,0.1,"sine",0.12,i*0.05);}},
    {id:"danger",label:"☠️ DANGER",color:"#FF453A",fn:()=>{for(let i=0;i<4;i++){beep(200,0.1,"sawtooth",0.2,i*0.15);beep(150,0.1,"sawtooth",0.15,i*0.15+0.08);}}},
    {id:"magic",label:"✨ MAGIE",color:"#BF5AF2",fn:()=>{for(let i=0;i<8;i++)beep(800+Math.random()*400,0.1,"sine",0.08,i*0.06);}},
    {id:"retro",label:"👾 RÉTRO",color:"#30D158",fn:()=>jingle([[659,0,0.08,"square"],[523,90,0.08,"square"],[392,180,0.08,"square"],[523,270,0.08,"square"],[659,360,0.12,"square"]])},
    {id:"war",label:"⚔️ GUERRE",color:"#FF9F0A",fn:()=>{for(let i=0;i<6;i++){beep(60+i*10,0.15,"sawtooth",0.25,i*0.12);}}},
    {id:"tele",label:"📺 TÉLÉ",color:"#ffffff",fn:()=>{beep(15750,0.1,"square",0.08);}},
    {id:"ding",label:"🔔 DING",color:"#FFE600",fn:()=>beep(1047,0.5,"sine",0.2)},
    {id:"pew",label:"🎯 PEW",color:"#64D2FF",fn:()=>jingle([[2000,0,0.02,"square",0.15],[500,30,0.08,"sine",0.1],[100,120,0.15,"sine",0.05]])},
    {id:"honk",label:"🚗 KLAXON",color:"#FF9F0A",fn:()=>{beep(293,0.3,"sawtooth",0.3);beep(370,0.3,"sawtooth",0.25,0.15);}},
    {id:"evil",label:"😈 DIABOLIQUE",color:"#BF5AF2",fn:()=>{for(let i=0;i<10;i++)beep(50+i*15,0.2,"sawtooth",0.15,i*0.08);}},
    {id:"allsnd",label:"🔊 TOUT EN MÊME TEMPS",color:"#FF2D55",fn:()=>{sndChicken();setTimeout(sndExplosion,100);setTimeout(sndAlarm,200);setTimeout(sndGlory,300);addChaos(30);}},
  ];

  function play(s){
    setActive(s.id);setTimeout(()=>setActive(null),400);
    s.fn();addChaos(2);
  }

  return(
    <div>
      <STitle color={accent}>🔊 Soundboard WTF</STitle>
      <SDesc>32 sons de merde. Fais du bruit. Dérange tes voisins.</SDesc>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:8}}>
        {SOUNDS.map(s=>(
          <button key={s.id} onClick={()=>play(s)} style={{
            padding:"14px 8px",borderRadius:10,border:`2px solid ${active===s.id?s.color:s.color+"44"}`,
            background:active===s.id?s.color+"33":s.color+"0a",
            color:active===s.id?s.color:s.color+"bb",
            fontFamily:"'Bangers',cursive",fontSize:11,cursor:"pointer",letterSpacing:1,
            textAlign:"center",transition:"all .1s",
            transform:active===s.id?"scale(0.94)":"scale(1)",
            boxShadow:active===s.id?`0 0 16px ${s.color}66`:"none",
            lineHeight:1.4,
          }}>
            {s.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── TESTEUR DE RÉSISTANCE ────────────────────────────────────
function ResistTab({addChaos}){
  const [holding,setHolding]=useState(false);
  const [time,setTime]=useState(0);
  const [best,setBest]=useState(0);
  const [released,setReleased]=useState(false);
  const [phase,setPhase]=useState(0);
  const intervalRef=useRef(null);
  const startRef=useRef(null);
  const accent="#A78BFA";
  const PHASES=[
    {t:0,label:"COMMENCE À MAINTENIR",color:"#30D158"},
    {t:3,label:"PAS MAL...",color:"#FFE600"},
    {t:7,label:"IMPRESSIONNANT",color:"#FF9F0A"},
    {t:12,label:"⚠️ DANGER CRITIQUE",color:"#FF2D55"},
    {t:20,label:"😱 MONSTRUEUX",color:"#BF5AF2"},
    {t:30,label:"👑 DIEU DU POULET",color:"#FFE600"},
  ];
  const currentPhase=PHASES.reduce((acc,p,i)=>time>=p.t?i:acc,0);
  const pcolor=PHASES[currentPhase].color;

  function start(e){
    e.preventDefault();
    setHolding(true);setReleased(false);setTime(0);startRef.current=Date.now();
    addChaos(5);sndAlarm();
    intervalRef.current=setInterval(()=>{
      const t=(Date.now()-startRef.current)/1000;
      setTime(t);
      setPhase(PHASES.reduce((acc,p,i)=>t>=p.t?i:acc,0));
      beep(200+t*20,0.05,"square",0.05);
      if(t>5)addChaos(1);
    },100);
  }
  function stop(){
    if(!holding)return;
    clearInterval(intervalRef.current);
    const t=(Date.now()-startRef.current)/1000;
    setHolding(false);setReleased(true);
    if(t>best){setBest(t);sndWin();}else sndCrash();
    setTime(t);
  }

  return(
    <div>
      <STitle color={accent}>🌡️ Testeur de Résistance</STitle>
      <SDesc>Maintiens le bouton appuyé. Jusqu'où tu vas ?</SDesc>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
          <div style={{fontFamily:"'Bangers',cursive",fontSize:90,color:pcolor,lineHeight:1,textShadow:`0 0 40px ${pcolor}88`,transition:"color .3s, text-shadow .3s",animation:holding&&time>12?"shake 0.1s infinite":"none"}}>
            {time.toFixed(1)}s
          </div>
          <div style={{fontFamily:"'Bangers',cursive",fontSize:18,color:pcolor,letterSpacing:3,textAlign:"center",animation:holding?"pulse 0.5s infinite":"none"}}>{PHASES[currentPhase].label}</div>
          <div style={{width:"100%",height:16,background:"#ffffff0a",borderRadius:8,overflow:"hidden",border:`1px solid ${pcolor}33`}}>
            <div style={{height:"100%",width:`${Math.min(100,(time/30)*100)}%`,background:`linear-gradient(90deg,#30D158,${pcolor})`,borderRadius:8,transition:"width .1s, background .5s",boxShadow:`0 0 12px ${pcolor}88`}}/>
          </div>
          <button
            onMouseDown={start} onMouseUp={stop} onTouchStart={start} onTouchEnd={stop}
            style={{width:200,height:200,borderRadius:"50%",border:`5px solid ${holding?pcolor:accent}`,background:`radial-gradient(circle,${holding?pcolor:accent}33,${holding?pcolor:accent}0a)`,color:holding?pcolor:accent,fontFamily:"'Bangers',cursive",fontSize:holding?16:18,cursor:"pointer",letterSpacing:2,boxShadow:`0 0 ${holding?60:30}px ${holding?pcolor:accent}66`,transition:"all .2s",textTransform:"uppercase",animation:holding&&time>12?"shake 0.1s infinite":"none",userSelect:"none"}}>
            {holding?"TIENS !!! NE LÂCHE PAS":"MAINTENIR\nAPPUYÉ"}
          </button>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:16}}>
          <Card color={accent}>
            <CardTitle>Records</CardTitle>
            <div style={{display:"flex",gap:10}}><StatCard label="Temps actuel" value={time.toFixed(1)+"s"} color={pcolor}/><StatCard label="Record" value={best.toFixed(1)+"s"} color={accent}/></div>
          </Card>
          <Card>
            <CardTitle>Phases de souffrance</CardTitle>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {PHASES.map((p,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"7px 10px",borderRadius:8,background:i<=currentPhase&&holding?p.color+"22":"#ffffff06",border:`1px solid ${i<=currentPhase&&holding?p.color+"55":"#ffffff12"}`,transition:"all .3s"}}>
                  <div style={{width:8,height:8,borderRadius:"50%",background:i<=currentPhase&&holding?p.color:"#ffffff22"}}/>
                  <span style={{fontFamily:"'Bangers',cursive",fontSize:12,color:i<=currentPhase&&holding?p.color:"#ffffff33",letterSpacing:1}}>{p.label}</span>
                  <span style={{marginLeft:"auto",fontSize:10,color:"#ffffff33"}}>{p.t}s</span>
                </div>
              ))}
            </div>
          </Card>
          {released&&<div style={{padding:16,borderRadius:12,background:time>best?"#30D15818":"#FF453A18",border:`2px solid ${time>best?"#30D15844":"#FF453A44"}`,fontFamily:"'Bangers',cursive",fontSize:16,color:time>best?"#30D158":"#FF453A",letterSpacing:2,textAlign:"center"}}>
            {time>=30?"👑 DIEU DU POULET CONFIRMÉ":time>=20?"😱 MONSTRUEUX":time>=12?"⚠️ DANGEREUX":time>=7?"👍 BIEN":time>=3?"😐 BOF":"😂 NUL"}
          </div>}
        </div>
      </div>
    </div>
  );
}

// ─── ORACLE ───────────────────────────────────────────────────
function OracleTab({addChaos}){
  const [question,setQuestion]=useState("");
  const [answer,setAnswer]=useState(null);
  const [loading,setLoading]=useState(false);
  const [phase,setPhase]=useState(0);
  const cvRef=useRef(null);
  const angRef=useRef(0);
  const accent="#06B6D4";
  useEffect(()=>{
    const cv=cvRef.current;if(!cv)return;
    const ctx=cv.getContext("2d");let raf;
    function draw(){
      const cx=cv.width/2,cy=cv.height/2,r=cx-4;
      ctx.clearRect(0,0,cv.width,cv.height);
      if(phase===1)angRef.current+=0.08;
      const gr=ctx.createRadialGradient(cx,cy,r*0.2,cx,cy,r);
      gr.addColorStop(0,accent+"33");gr.addColorStop(1,accent+"0a");
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.fillStyle=gr;ctx.fill();
      ctx.beginPath();ctx.arc(cx,cy,r,0,Math.PI*2);ctx.strokeStyle=accent+(phase===1?"aa":"44");ctx.lineWidth=2+phase;ctx.stroke();
      if(phase===1){
        for(let i=0;i<6;i++){
          const a=angRef.current+i*Math.PI/3;
          ctx.beginPath();ctx.arc(cx+Math.cos(a)*r*0.5,cy+Math.sin(a)*r*0.5,6,0,Math.PI*2);
          ctx.fillStyle=accent;ctx.fill();
        }
        ctx.font=`${r*0.45}px sans-serif`;ctx.fillStyle="#fff";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("⚡",cx,cy);
      }else if(phase===2){
        ctx.font=`bold 14px 'Bangers',cursive`;ctx.fillStyle=accent;ctx.textAlign="center";ctx.textBaseline="middle";
        const lines=(answer?.short||"???").toUpperCase().match(/.{1,10}/g)||[];
        lines.forEach((l,i)=>ctx.fillText(l,cx,cy+(i-(lines.length-1)/2)*18));
      }else{ctx.font=`${r*0.6}px serif`;ctx.fillStyle=accent+"55";ctx.textAlign="center";ctx.textBaseline="middle";ctx.fillText("🔮",cx,cy);}
      raf=requestAnimationFrame(draw);
    }
    draw();return()=>cancelAnimationFrame(raf);
  },[phase,answer]);

  async function ask(){
    if(!question.trim()||loading)return;
    setLoading(true);setAnswer(null);setPhase(1);addChaos(18);sndOracle();
    try{
      const res=await callAI(`Tu es l'Oracle du Savage Chicken, mystérieux et absurde. Question : "${question}". Réponds en JSON : {"short":"OUI/NON/PEUT-ÊTRE/JAMAIS","long":"réponse oracle 2-3 phrases WTF avec poulets et pizzas","cosmic":1-10,"warning":"avertissement absurde optionnel"}. JSON uniquement.`,400);
      await new Promise(r=>setTimeout(r,1800));
      const data=JSON.parse(res.replace(/```json|```/g,"").trim());
      setAnswer(data);setPhase(2);
    }catch{
      await new Promise(r=>setTimeout(r,1500));
      setAnswer({short:"OUI",long:ORACLE_FALLBACKS[Math.floor(Math.random()*ORACLE_FALLBACKS.length)],cosmic:7,warning:"Ne pose plus de questions aussi stupides."});
      setPhase(2);
    }
    setLoading(false);
  }
  return(
    <div>
      <STitle color={accent}>🔮 Oracle du Savage Chicken</STitle>
      <SDesc>Pose une question. Reçois la vérité. Tu peux pas t'en sortir.</SDesc>
      <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:32,alignItems:"start"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
          <canvas ref={cvRef} width={220} height={220} style={{borderRadius:"50%",boxShadow:`0 0 40px ${accent}44`}}/>
          {phase===0&&<><Inp value={question} onChange={e=>setQuestion(e.target.value)} onKeyDown={e=>e.key==="Enter"&&ask()} placeholder="Ta question..." style={{width:220}}/><Btn onClick={ask} disabled={loading} color={accent} full>🔮 Interroger</Btn></>}
          {phase===2&&<Btn onClick={()=>{setPhase(0);setQuestion("");setAnswer(null);}} color="#ffffff44" full>↩ Nouvelle question</Btn>}
          {phase===1&&<div style={{fontFamily:"'Bangers',cursive",fontSize:13,color:accent,letterSpacing:3,animation:"pulse 0.5s infinite",textAlign:"center"}}>L'ORACLE CONSULTE...</div>}
        </div>
        <div>
          {answer&&phase===2?(
            <div style={{display:"flex",flexDirection:"column",gap:12,animation:"fadein 0.4s ease"}}>
              <div style={{padding:20,background:"#06B6D418",border:"2px solid #06B6D444",borderRadius:14,textAlign:"center"}}>
                <div style={{fontFamily:"'Bangers',cursive",fontSize:56,color:accent,textShadow:"0 0 20px #06B6D488",letterSpacing:4}}>{answer.short}</div>
                <div style={{display:"flex",gap:3,justifyContent:"center",marginTop:8}}>
                  {Array.from({length:10},(_,i)=><div key={i} style={{width:12,height:12,borderRadius:"50%",background:i<answer.cosmic?accent:"#ffffff11"}}/>)}
                </div>
              </div>
              <Card color={accent}><CardTitle>Prophétie</CardTitle><div style={{fontSize:14,color:"#ffffff99",lineHeight:1.7,fontStyle:"italic"}}>{answer.long}</div></Card>
              {answer.warning&&<div style={{padding:"10px 14px",background:"#FF9F0A12",border:"1px solid #FF9F0A44",borderRadius:10,fontSize:12,color:"#FF9F0A",fontFamily:"'Bangers',cursive",letterSpacing:1}}>⚠️ {answer.warning}</div>}
            </div>
          ):<div style={{minHeight:200,display:"flex",alignItems:"center",justifyContent:"center",color:"#ffffff22",fontSize:12,fontFamily:"'Bangers',cursive",letterSpacing:3,textAlign:"center",whiteSpace:"pre-line"}}>{phase===1?"L'ORACLE MÉDITE...\nPATIENTE.":"POSE UNE QUESTION.\nL'ORACLE ATTEND."}</div>}
        </div>
      </div>
    </div>
  );
}

// ─── BOMBE ────────────────────────────────────────────────────
function BombeTab({addChaos,addPizza}){
  const [armed,setArmed]=useState(false);
  const [timer,setTimer]=useState(0);
  const [exploded,setExploded]=useState(false);
  const [defused,setDefused]=useState(false);
  const [code,setCode]=useState("");
  const [secret,setSecret]=useState("");
  const ivRef=useRef(null);
  const accent="#EF4444";
  function arm(){
    const t=5+Math.floor(Math.random()*16);
    const s=String(Math.floor(1000+Math.random()*9000));
    setTimer(t);setSecret(s);setArmed(true);setExploded(false);setDefused(false);setCode("");
    addChaos(10);sndBomb();
    ivRef.current=setInterval(()=>setTimer(t=>{
      beep(t<=3?1000:500,0.04,"square",0.08);
      if(t<=1){clearInterval(ivRef.current);boom();return 0;}
      return t-1;
    }),1000);
  }
  function boom(){setArmed(false);setExploded(true);addChaos(40);sndExplosion();for(let i=0;i<14;i++)setTimeout(addPizza,i*100);}
  function tryCode(){
    if(code===secret){clearInterval(ivRef.current);setArmed(false);setDefused(true);sndGlory();}
    else{sndCrash();addChaos(5);setTimer(t=>Math.max(1,t-3));}
  }
  const tc=timer>10?"#30D158":timer>5?"#FFE600":"#FF453A";
  return(
    <div>
      <STitle color={accent}>💣 Bombe Pizza</STitle>
      <SDesc>Arme la bombe. Trouve le code 4 chiffres. Ou explose.</SDesc>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        <div style={{textAlign:"center"}}>
          {!armed&&!exploded&&!defused&&<div style={{padding:40}}><div style={{fontSize:100,animation:"bounce 1.5s infinite",marginBottom:20}}>💣</div><Btn onClick={arm} color={accent} size="xl">💣 ARMER</Btn></div>}
          {armed&&<div>
            <div style={{fontFamily:"'Bangers',cursive",fontSize:110,color:tc,textShadow:`0 0 50px ${tc}`,animation:timer<=3?"shake 0.08s infinite":"none",lineHeight:1}}>{timer}</div>
            <div style={{fontSize:11,color:tc,fontFamily:"'Bangers',cursive",letterSpacing:4,marginBottom:24}}>SECONDES</div>
            <Inp value={code} onChange={e=>setCode(e.target.value.slice(0,4))} onKeyDown={e=>e.key==="Enter"&&tryCode()} placeholder="Code 4 chiffres..." style={{marginBottom:10}}/>
            <Btn onClick={tryCode} color="#30D158" full size="lg">🔑 DÉSAMORCER</Btn>
            <div style={{marginTop:8,fontSize:10,color:"#ffffff33",fontFamily:"'Bangers',cursive",letterSpacing:1}}>MAUVAIS CODE = −3 SECONDES</div>
          </div>}
          {exploded&&<div><div style={{fontSize:80,animation:"shake 0.2s infinite"}}>💥</div><div style={{fontFamily:"'Bangers',cursive",fontSize:50,color:"#FF453A",textShadow:"0 0 40px #FF453A",letterSpacing:3}}>BOOM</div><div style={{fontSize:13,color:"#ffffff55",margin:"10px 0 20px"}}>Code était : {secret}</div><Btn onClick={()=>{setExploded(false);}} color="#ffffff44" full>↩ Reset</Btn></div>}
          {defused&&<div><div style={{fontSize:80,animation:"bounce 1s infinite"}}>🎉</div><div style={{fontFamily:"'Bangers',cursive",fontSize:36,color:"#30D158",textShadow:"0 0 20px #30D15888",letterSpacing:3}}>DÉSAMORCÉE !</div><div style={{margin:"10px 0 20px",fontSize:13,color:"#ffffff55"}}>T'as sauvé les pizzas.</div><Btn onClick={()=>{setDefused(false);}} color="#30D158" full>↩ Rejouer</Btn></div>}
        </div>
        <Card color={accent}>
          <CardTitle>Règles</CardTitle>
          <div style={{fontSize:13,color:"#ffffff77",lineHeight:2}}>💣 Timer aléatoire 5-20s<br/>🔑 Code secret 4 chiffres à deviner<br/>❌ Mauvais code = −3 secondes<br/>💥 Explosion = pluie de 14 pizzas<br/>🎉 Bon code = tu gagnes<br/><br/></div>
          {armed&&<div style={{padding:12,background:"#30D15812",border:"1px solid #30D15833",borderRadius:10}}>
            <div style={{fontFamily:"'Bangers',cursive",fontSize:11,color:"#30D158",letterSpacing:2,marginBottom:4}}>INDICE DU POULET</div>
            <div style={{fontSize:12,color:"#ffffff77"}}>Le code commence par {secret[0]}... enfin c'est ce que dit le poulet.</div>
          </div>}
        </Card>
      </div>
    </div>
  );
}

// ─── SCORES ───────────────────────────────────────────────────
function ScoresTab({chaos,crimes}){
  const [name,setName]=useState("");
  const [scores,setScores]=useState([]);
  const [saved,setSaved]=useState(false);
  const [loading,setLoading]=useState(true);
  const accent="#FFE600";
  useEffect(()=>{load();},[]);
  async function load(){setLoading(true);try{const k=await window.storage.list("sc:");const e=await Promise.all((k.keys||[]).map(async k=>{try{const r=await window.storage.get(k,true);return r?JSON.parse(r.value):null;}catch{return null;}}));setScores(e.filter(Boolean).sort((a,b)=>b.crimes-a.crimes).slice(0,10));}catch{setScores([]);}setLoading(false);}
  async function save(){if(!name.trim())return;sndWin();try{await window.storage.set(`sc:${name.trim().toLowerCase().replace(/\s/g,"-")}`,JSON.stringify({name:name.trim(),crimes,chaos,date:new Date().toLocaleDateString("fr")}),true);}catch{}setSaved(true);load();}
  return(
    <div>
      <STitle color={accent}>🏆 Hall of Chaos</STitle>
      <SDesc>Les criminels les plus dangereux du Savage Chicken.</SDesc>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24}}>
        <Card color={accent}>
          <CardTitle>Ton score</CardTitle>
          <div style={{display:"flex",gap:10,marginBottom:16}}><StatCard label="Crimes" value={crimes} color={accent}/><StatCard label="Chaos" value={chaos+"%"} color="#FF2D55"/></div>
          {!saved?<div style={{display:"flex",gap:8}}><Inp value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&save()} placeholder="Ton pseudo..." style={{flex:1}}/><Btn onClick={save} color={accent}>💾</Btn></div>:<div style={{fontFamily:"'Bangers',cursive",fontSize:14,color:"#30D158",letterSpacing:2}}>✅ SAUVÉ !</div>}
        </Card>
        <div>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}><CardTitle>Classement</CardTitle><button onClick={load} style={{fontSize:10,color:"#ffffff33",background:"none",border:"none",cursor:"pointer",fontFamily:"'Bangers',cursive",letterSpacing:1}}>↻</button></div>
          {loading?<div style={{textAlign:"center",padding:20,color:"#ffffff33",fontFamily:"'Bangers',cursive",letterSpacing:3}}>CHARGEMENT...</div>:scores.length===0?<div style={{textAlign:"center",padding:20,color:"#ffffff22",fontFamily:"'Bangers',cursify",letterSpacing:2,fontSize:12}}>AUCUN SCORE. SOIS LE PREMIER.</div>:scores.map((s,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 14px",background:i===0?"#FFE60010":"#ffffff08",borderRadius:10,marginBottom:6,border:`1px solid ${i===0?"#FFE60033":"#ffffff12"}`}}>
              <span style={{fontSize:20}}>{["🥇","🥈","🥉"][i]||`${i+1}.`}</span>
              <div style={{flex:1}}><div style={{fontFamily:"'Bangers',cursive",fontSize:15,color:i===0?accent:"#fff"}}>{s.name}</div><div style={{fontSize:9,color:"#ffffff33"}}>{s.date}</div></div>
              <div style={{textAlign:"right"}}><div style={{fontFamily:"'Bangers',cursive",fontSize:16,color:accent}}>{s.crimes}</div><div style={{fontSize:9,color:"#ffffff33"}}>{s.chaos}%</div></div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MODE CHAOS TOTAL ─────────────────────────────────────────
function ChaosTotal({addChaos,addPizza}){
  const [active,setActive]=useState(false);
  const [count,setCount]=useState(0);
  const timersRef=useRef([]);
  const accent="#FFE600";

  function launch(){
    setActive(true);setCount(c=>c+1);addChaos(50);sndMeltdown();
    timersRef.current.forEach(clearTimeout);timersRef.current=[];
    const add=(fn,t)=>{const id=setTimeout(fn,t);timersRef.current.push(id);};
    for(let i=0;i<30;i++)add(()=>{addPizza();sndChicken();},i*180);
    for(let i=0;i<10;i++)add(()=>sndExplosion(),i*300+100);
    add(()=>sndGlory(),500);add(()=>sndAlarm(),1000);add(()=>sndGlory(),2000);
    const colors=["#FF2D55","#FFE600","#BF5AF2","#30D158","#FF9F0A","#64D2FF"];
    for(let i=0;i<60;i++){
      add(()=>{
        const el=document.createElement("div");
        el.textContent=["🐔","🍕","💥","⚡","🔥","💀","🎰","👑"][Math.floor(Math.random()*8)];
        const size=30+Math.random()*60;
        el.style.cssText=`position:fixed;left:${Math.random()*100}vw;top:${Math.random()*100}vh;font-size:${size}px;pointer-events:none;z-index:9995;animation:chaosEmoji ${0.5+Math.random()*1}s ease forwards;`;
        document.body.appendChild(el);setTimeout(()=>el.remove(),2000);
      },i*100);
    }
    for(let i=0;i<20;i++){
      add(()=>{
        const el=document.createElement("div");
        const col=colors[Math.floor(Math.random()*colors.length)];
        el.style.cssText=`position:fixed;left:${Math.random()*100}vw;top:0;width:3px;height:${60+Math.random()*200}px;background:${col};pointer-events:none;z-index:9993;animation:laserDrop ${0.3+Math.random()*0.5}s ease forwards;`;
        document.body.appendChild(el);setTimeout(()=>el.remove(),1000);
      },i*150);
    }
    add(()=>setActive(false),6000);
  }

  return(
    <div>
      <STitle color={accent}>🎆 MODE CHAOS TOTAL</STitle>
      <SDesc>Lance tout en même temps. L'apocalypse. Le vrai chaos.</SDesc>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:32,padding:"40px 0"}}>
        <div style={{position:"relative"}}>
          {active&&[...Array(12)].map((_,i)=>(
            <div key={i} style={{position:"absolute",left:"50%",top:"50%",width:3,height:60+i*10,background:`hsl(${i*30},100%,60%)`,transformOrigin:"50% 0%",transform:`translateX(-50%) rotate(${i*30}deg)`,animation:"laserSpin 0.5s infinite linear",borderRadius:2,opacity:0.8}}/>
          ))}
          <button onClick={launch} disabled={active} style={{
            width:280,height:280,borderRadius:"50%",
            border:`6px solid ${active?"#FF2D55":"#FFE600"}`,
            background:active?"linear-gradient(135deg,#FF2D55,#FF9F0A,#FFE600,#30D158,#06B6D4,#BF5AF2)":"radial-gradient(circle,#FFE60022,#FF2D5511)",
            backgroundSize:"400% 400%",animation:active?"gradientShift 0.3s infinite":"none",
            fontSize:active?60:80,cursor:active?"not-allowed":"pointer",
            boxShadow:active?`0 0 80px #FF2D5599, 0 0 160px #FFE60044`:`0 0 40px #FFE60066`,
            transition:"all .3s",display:"flex",alignItems:"center",justifyContent:"center",
            position:"relative",zIndex:1,
          }}>
            {active?"🌋":"🎆"}
          </button>
        </div>
        <div style={{fontFamily:"'Bangers',cursive",fontSize:28,color:active?"#FF2D55":"#FFE600",letterSpacing:4,textAlign:"center",animation:active?"shake 0.1s infinite":"none",textShadow:active?"0 0 30px #FF2D55":"0 0 15px #FFE60088"}}>
          {active?"☢️ CHAOS EN COURS... ☢️":"APPUIE POUR TOUT PÉTER"}
        </div>
        <div style={{fontFamily:"'Bangers',cursive",fontSize:16,color:"#ffffff44",letterSpacing:3}}>
          {count} FOIS LANCÉ
        </div>
        <div style={{display:"flex",gap:16,flexWrap:"wrap",justifyContent:"center",maxWidth:500}}>
          {["30 pizzas en rafale","10 explosions","Sons chaos complet","Emojis partout","Lasers lumineux","Durée : 6 secondes"].map(f=>(
            <div key={f} style={{padding:"8px 16px",background:"#FFE60011",border:"1px solid #FFE60033",borderRadius:20,fontSize:11,color:"#FFE60088",fontFamily:"'Bangers',cursive",letterSpacing:1}}>{f}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────

// ═══ NOUVELLES CONSTANTES v5 ═══
const ROULETTE_MSGS=["...rien.","SOULAGEMENT.","TU AS ÉVITÉ LA MORT.","ENCORE EN VIE.","LA CHANCE TE SOURIT."];
const HACKER_LINES=["INITIALISATION DU PIRATAGE...","Connexion à pizza.server.bk...","Bypass firewall Jojo Pizza...","ACCÈS REFUSÉ. Nouvelle tentative...","Injection SQL dans poulet_db...","Extraction des recettes secrètes...","Déchiffrement AES-256 du fromage...","Téléchargement: savage_recipes.zip","Brute force mot de passe 'poulet123'...","ACCÈS ACCORDÉ. Bienvenue, hacker.","Récupération des données Jojo Pizza...","Suppression des logs de connexion...","Installation backdoor savage_chicken.exe","Exfiltration en cours: 420.69 MB","TERMINÉ. Le système Jojo Pizza est compromis."];
const NEWSPAPER_HEADLINES=["RÉVÈLE LA VÉRITÉ SUR LES PIZZAS CONGELÉES","DÉCOUVRE UN POULET GÉANT EN PLEIN CENTRE-VILLE","BAT LE RECORD MONDIAL DE CONSOMMATION DE PIZZA","ACCUSÉ D'AVOIR VOLÉ TOUTES LES PIZZAS DE LA VILLE","ÉLU PRÉSIDENT DU SAVAGE CHICKEN PAR ACCIDENT","SURVIT À UNE ATTAQUE DE POULETS SAUVAGES","DEVIENT MILLIARDAIRE GRÂCE À UNE PIZZA MAGIQUE","DISPARAÎT MYSTÉRIEUSEMENT DANS UNE PIZZA GÉANTE"];
const POSSESSED_PHRASES=["BKAAAAAAAAAAAAAAAAAAAAAAAAAAK","JE SUIS LE POULET. JE SUIS PARTOUT.","TES PIZZAS M'APPARTIENNENT MAINTENANT","REGARDE DERRIÈRE TOI","LE POULET NE DORT JAMAIS","TU NE PEUX PAS FERMER CET ONGLET","BKAAAAK BKAAAAK BKAAAAK","JOJO PIZZA EST UN MENSONGE","TOUT EST POULET. TOUT A TOUJOURS ÉTÉ POULET.","JE VOIS TON HISTORIQUE DE NAVIGATION"];
const SIMON_COLORS=[{c:"#FF2D55",f:330,label:"ROUGE"},{c:"#30D158",f:440,label:"VERT"},{c:"#FFE600",f:550,label:"JAUNE"},{c:"#64D2FF",f:660,label:"BLEU"}];

// ═══ LE POULET POSSÉDÉ (mode caché 1%) ═══
function speakPossessed(text){
  try{
    if(!window.speechSynthesis)return;
    const u=new SpeechSynthesisUtterance(text);
    u.lang="fr-FR";u.pitch=0.1;u.rate=0.7;u.volume=0.8;
    window.speechSynthesis.speak(u);
  }catch(e){}
}
function rollPossession(){return Math.random()<0.01;}

function PossessedOverlay({active,onEnd}){
  const [phrase,setPhrase]=useState("");
  const [tick,setTick]=useState(0);
  useEffect(()=>{
    if(!active)return;
    sndMeltdown();sndAlarm();
    const phrase1=POSSESSED_PHRASES[Math.floor(Math.random()*POSSESSED_PHRASES.length)];
    setPhrase(phrase1);
    speakPossessed(phrase1);
    const iv=setInterval(()=>{
      setTick(t=>t+1);
      if(Math.random()>0.6){
        const p=POSSESSED_PHRASES[Math.floor(Math.random()*POSSESSED_PHRASES.length)];
        setPhrase(p);speakPossessed(p);sndChicken();
      }
    },1800);
    const end=setTimeout(()=>{clearInterval(iv);onEnd();window.speechSynthesis?.cancel();},10000);
    return()=>{clearInterval(iv);clearTimeout(end);window.speechSynthesis?.cancel();};
  },[active]);
  if(!active)return null;
  return(
    <div style={{position:"fixed",inset:0,zIndex:9999999,pointerEvents:"none",filter:"invert(1) hue-rotate(180deg) contrast(1.4)",mixBlendMode:"difference",background:"transparent"}}>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
        <div style={{fontFamily:"'Bangers',cursive",fontSize:54,color:"#FF0000",letterSpacing:6,textAlign:"center",animation:"possessedShake 0.06s infinite",textShadow:"0 0 40px #FF0000",lineHeight:1.2,maxWidth:700,padding:20}}>
          {phrase}
        </div>
      </div>
      {[...Array(15)].map((_,i)=>(
        <div key={i} style={{position:"absolute",left:`${Math.random()*100}%`,top:`${Math.random()*100}%`,fontSize:40+Math.random()*60,animation:`possessedFloat ${0.3+Math.random()*0.4}s infinite`,opacity:0.7}}>👹</div>
      ))}
    </div>
  );
}

// Hook utilitaire : à appeler depuis n'importe quel bouton pour tenter la possession
function usePossessionTrigger(setPossessed){
  return useCallback(()=>{
    if(rollPossession()){setPossessed(true);}
  },[setPossessed]);
}

// ═══ ÉCRAN DE VEILLE POULET (DVD bounce) ═══
function ScreensaverTab({addChaos}){
  const cvRef=useRef(null);
  const [running,setRunning]=useState(true);
  const [bounces,setBounces]=useState(0);
  const [hitCorner,setHitCorner]=useState(false);
  const accent="#06B6D4";
  useEffect(()=>{
    if(!running)return;
    const cv=cvRef.current;if(!cv)return;
    const ctx=cv.getContext("2d");
    const resize=()=>{cv.width=cv.offsetWidth;cv.height=cv.offsetHeight;};
    resize();window.addEventListener("resize",resize);
    const colors=["#FF2D55","#FFE600","#30D158","#64D2FF","#BF5AF2","#FF9F0A"];
    const logos=Array.from({length:3},(_,i)=>({
      x:Math.random()*300,y:Math.random()*200,vx:(2+Math.random()*2)*(Math.random()>0.5?1:-1),vy:(2+Math.random()*2)*(Math.random()>0.5?1:-1),
      emoji:["🐔","🍕","💀"][i],color:colors[Math.floor(Math.random()*colors.length)],size:60,
    }));
    let raf,localBounces=0;
    function draw(){
      ctx.clearRect(0,0,cv.width,cv.height);
      logos.forEach(l=>{
        l.x+=l.vx;l.y+=l.vy;
        let cornerHit=false;
        if(l.x<=0||l.x>=cv.width-l.size){l.vx*=-1;l.color=colors[Math.floor(Math.random()*colors.length)];localBounces++;cornerHit=true;}
        if(l.y<=0||l.y>=cv.height-l.size){l.vy*=-1;l.color=colors[Math.floor(Math.random()*colors.length)];localBounces++;cornerHit=true;}
        if(cornerHit){
          sndBoing();
          // Detect perfect corner hit
          if((l.x<=2||l.x>=cv.width-l.size-2)&&(l.y<=2||l.y>=cv.height-l.size-2)){
            setHitCorner(true);sndGlory();addChaos(30);
            setTimeout(()=>setHitCorner(false),1000);
          }
        }
        ctx.font=`${l.size}px sans-serif`;ctx.textAlign="left";ctx.textBaseline="top";
        ctx.shadowColor=l.color;ctx.shadowBlur=20;
        ctx.fillText(l.emoji,l.x,l.y);
        ctx.shadowBlur=0;
      });
      setBounces(localBounces);
      raf=requestAnimationFrame(draw);
    }
    draw();
    return()=>{cancelAnimationFrame(raf);window.removeEventListener("resize",resize);};
  },[running]);
  return(
    <div>
      <STitle color={accent}>🕹️ Écran de Veille Poulet</STitle>
      <SDesc>Façon DVD logo. Touche le coin pile pour un bonus chaos.</SDesc>
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <StatCard label="Rebonds" value={bounces} color={accent}/>
        <StatCard label="Coin parfait" value={hitCorner?"OUI! 🎉":"Non"} color={hitCorner?"#FFE600":"#ffffff33"}/>
      </div>
      <div ref={null} style={{position:"relative",width:"100%",height:480,background:"#00000055",borderRadius:16,overflow:"hidden",border:`2px solid ${hitCorner?"#FFE600":accent+"33"}`,boxShadow:hitCorner?"0 0 60px #FFE60088":`0 0 20px ${accent}22`,transition:"all .3s"}}>
        <canvas ref={cvRef} style={{width:"100%",height:"100%",display:"block"}}/>
        {hitCorner&&<div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",background:"#FFE60022",animation:"jackpotFlash 0.15s infinite"}}><div style={{fontFamily:"'Bangers',cursive",fontSize:40,color:"#FFE600",textShadow:"0 0 30px #FFE600",letterSpacing:3}}>COIN PARFAIT ! +30 CHAOS</div></div>}
      </div>
    </div>
  );
}

// ═══ ROULETTE RUSSE PIZZA ═══
function RouletteTab({addChaos,setPossessed}){
  const [pizzas,setPizzas]=useState(Array(6).fill(null).map((_,i)=>({id:i,revealed:false,trap:false})));
  const [trapIdx,setTrapIdx]=useState(Math.floor(Math.random()*6));
  const [gameOver,setGameOver]=useState(false);
  const [survived,setSurvived]=useState(0);
  const [bestStreak,setBestStreak]=useState(0);
  const [jumpscare,setJumpscare]=useState(false);
  const accent="#EF4444";
  const trigger=usePossessionTrigger(setPossessed);

  function reset(){
    setPizzas(Array(6).fill(null).map((_,i)=>({id:i,revealed:false,trap:false})));
    setTrapIdx(Math.floor(Math.random()*6));
    setGameOver(false);setSurvived(0);
  }

  function click(i){
    if(gameOver||pizzas[i].revealed)return;
    trigger();
    const isTrap=i===trapIdx;
    setPizzas(p=>p.map((pz,idx)=>idx===i?{...pz,revealed:true,trap:isTrap}:pz));
    if(isTrap){
      setJumpscare(true);sndExplosion();sndAlarm();addChaos(35);
      setGameOver(true);
      setTimeout(()=>setJumpscare(false),600);
    }else{
      sndPizza();addChaos(8);
      setSurvived(s=>{const n=s+1;if(n>bestStreak)setBestStreak(n);if(n===5){setGameOver(true);sndGlory();addChaos(20);}return n;});
    }
  }

  return(
    <div>
      <STitle color={accent}>🎰 Roulette Russe Pizza</STitle>
      <SDesc>6 pizzas. Une est piégée. Clique. Prie.</SDesc>
      {jumpscare&&<div style={{position:"fixed",inset:0,zIndex:99998,background:"#FF0000",display:"flex",alignItems:"center",justifyContent:"center",animation:"jumpscareFlash 0.5s"}}>
        <div style={{fontSize:200,animation:"jumpscareScale 0.5s"}}>💀</div>
      </div>}
      <div style={{display:"flex",gap:16,marginBottom:20}}>
        <StatCard label="Survécu" value={survived+"/5"} color="#30D158"/>
        <StatCard label="Meilleur" value={bestStreak} color="#FFE600"/>
        <StatCard label="Statut" value={gameOver?(survived>=5?"VIVANT 🎉":"MORT 💀"):"EN JEU"} color={gameOver?(survived>=5?"#30D158":"#FF453A"):"#FF9F0A"}/>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(6,1fr)",gap:14,marginBottom:20}}>
        {pizzas.map((p,i)=>(
          <button key={p.id} onClick={()=>click(i)} disabled={gameOver||p.revealed} style={{
            aspectRatio:"1",borderRadius:14,border:`3px solid ${p.revealed?(p.trap?"#FF0000":"#30D158"):accent+"44"}`,
            background:p.revealed?(p.trap?"#FF000033":"#30D15833"):"#ffffff08",
            fontSize:48,cursor:gameOver||p.revealed?"default":"pointer",
            transition:"all .2s",animation:p.revealed&&p.trap?"shake 0.3s":"none",
            boxShadow:p.revealed?(p.trap?"0 0 30px #FF0000aa":"0 0 20px #30D15866"):"none",
          }}>
            {p.revealed?(p.trap?"💀":"🍕"):"🍕"}
          </button>
        ))}
      </div>
      {gameOver&&(
        <div style={{textAlign:"center"}}>
          <div style={{fontFamily:"'Bangers',cursive",fontSize:28,color:survived>=5?"#30D158":"#FF453A",letterSpacing:3,marginBottom:16,textShadow:`0 0 20px ${survived>=5?"#30D158":"#FF453A"}88`}}>
            {survived>=5?"🎉 TU AS SURVÉCU AUX 5 PIZZAS !":"💀 TU ES MORT. C'ÉTAIT LA PIZZA PIÉGÉE."}
          </div>
          <Btn onClick={reset} color={accent} size="lg">🔄 REJOUER</Btn>
        </div>
      )}
    </div>
  );
}

// ═══ FAUX TERMINAL HACKER ═══
function HackerTab({addChaos,setPossessed}){
  const [running,setRunning]=useState(false);
  const [lines,setLines]=useState([]);
  const [progress,setProgress]=useState(0);
  const [done,setDone]=useState(false);
  const logRef=useRef(null);
  const accent="#30D158";
  const trigger=usePossessionTrigger(setPossessed);

  async function hack(){
    if(running)return;
    trigger();
    setRunning(true);setLines([]);setProgress(0);setDone(false);addChaos(20);sndLaser();
    for(let i=0;i<HACKER_LINES.length;i++){
      await new Promise(r=>setTimeout(r,150+Math.random()*250));
      setLines(l=>[...l,{text:HACKER_LINES[i],id:i}]);
      setProgress(Math.round(((i+1)/HACKER_LINES.length)*100));
      if(Math.random()>0.7)sndClick();
      if(logRef.current)logRef.current.scrollTop=logRef.current.scrollHeight;
    }
    sndGlory();addChaos(15);
    setDone(true);setRunning(false);
  }

  return(
    <div>
      <STitle color={accent}>📟 Hacker Terminal</STitle>
      <SDesc>Pirate le système Jojo Pizza. 100% faux. 100% satisfaisant.</SDesc>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:20}}>
        <div>
          <div style={{padding:24,background:"#00100008",border:`1px solid ${accent}33`,borderRadius:14,textAlign:"center",marginBottom:16}}>
            <div style={{fontSize:60,marginBottom:10}}>{done?"🔓":"🔒"}</div>
            <div style={{fontFamily:"'Bangers',cursive",fontSize:16,color:accent,letterSpacing:2}}>{done?"SYSTÈME COMPROMIS":running?"PIRATAGE EN COURS...":"SYSTÈME VERROUILLÉ"}</div>
          </div>
          <Btn onClick={hack} disabled={running} color={accent} full size="lg">{running?`💻 ${progress}%`:"📟 LANCER LE PIRATAGE"}</Btn>
          <div style={{marginTop:14,height:14,background:"#ffffff0a",borderRadius:7,overflow:"hidden",border:`1px solid ${accent}33`}}>
            <div style={{height:"100%",width:`${progress}%`,background:`linear-gradient(90deg,${accent},#FFE600)`,transition:"width .2s",boxShadow:`0 0 10px ${accent}88`}}/>
          </div>
        </div>
        <div>
          <div ref={logRef} style={{background:"#000000aa",border:`1px solid ${accent}33`,borderRadius:12,padding:16,fontFamily:"'Consolas',monospace",fontSize:11,minHeight:280,maxHeight:340,overflowY:"auto"}}>
            {lines.length===0&&<div style={{color:"#ffffff22"}}>_ en attente du lancement</div>}
            {lines.map(l=>(
              <div key={l.id} style={{color:accent,marginBottom:5,opacity:0,animation:"fadein 0.2s ease forwards"}}>{l.text}</div>
            ))}
            {running&&<div style={{color:accent,animation:"pulse 0.5s infinite"}}>_</div>}
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══ BARRE DE CHALEUR ═══
function HeatTab({addChaos,addPizza,setPossessed}){
  const [heat,setHeat]=useState(0);
  const [exploded,setExploded]=useState(false);
  const accent="#FF6B35";
  const trigger=usePossessionTrigger(setPossessed);
  function addSpice(amount){
    if(exploded)return;
    trigger();
    setHeat(h=>{
      const n=Math.min(100,h+amount);
      addChaos(Math.floor(amount/2));
      if(n>=80)beep(200+n*5,0.08,"sawtooth",0.1);else sndClick();
      if(n>=100&&!exploded){
        setExploded(true);sndExplosion();addChaos(40);
        for(let i=0;i<10;i++)setTimeout(addPizza,i*100);
        setTimeout(()=>{setExploded(false);setHeat(0);},2500);
      }
      return n;
    });
  }
  const heatColor=heat<30?"#30D158":heat<60?"#FFE600":heat<85?"#FF9F0A":"#FF2D55";
  const heatLabel=heat<20?"FROID":heat<40?"TIÈDE":heat<60?"ÇA CHAUFFE":heat<80?"BRÛLANT":heat<100?"⚠️ DANGER CRITIQUE":"💥 EXPLOSION";
  return(
    <div>
      <STitle color={accent}>🔥 Barre de Chaleur</STitle>
      <SDesc>Ajoute du piment. Ne dépasse pas 100%. Ou explose.</SDesc>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:24,alignItems:"center"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:20}}>
          <div style={{position:"relative",width:90,height:340,background:"#ffffff08",borderRadius:45,border:`3px solid ${heatColor}66`,overflow:"hidden",boxShadow:exploded?`0 0 80px #FF2D55`:`0 0 ${heat}px ${heatColor}44`}}>
            <div style={{position:"absolute",bottom:0,left:0,right:0,height:`${heat}%`,background:`linear-gradient(180deg,${heatColor},${heatColor}cc)`,transition:"height .3s, background .3s",boxShadow:`0 0 30px ${heatColor}`}}/>
            {exploded&&<div style={{position:"absolute",inset:0,background:"#FF2D55",animation:"jackpotFlash 0.1s infinite"}}/>}
            <div style={{position:"absolute",bottom:-15,left:"50%",transform:"translateX(-50%)",width:110,height:110,borderRadius:"50%",background:heatColor,boxShadow:`0 0 40px ${heatColor}`}}/>
          </div>
          <div style={{fontFamily:"'Bangers',cursive",fontSize:32,color:heatColor,textShadow:`0 0 20px ${heatColor}88`}}>{heat}%</div>
          <div style={{fontFamily:"'Bangers',cursive",fontSize:16,color:heatColor,letterSpacing:2,animation:heat>80?"shake 0.15s infinite":"none"}}>{heatLabel}</div>
        </div>
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          <Card color={accent}>
            <CardTitle>Ajouter du piment</CardTitle>
            <div style={{display:"flex",flexDirection:"column",gap:8}}>
              <Btn onClick={()=>addSpice(5)} color="#30D158" full>🌶️ Pincée de piment (+5)</Btn>
              <Btn onClick={()=>addSpice(15)} color="#FFE600" full>🌶️🌶️ Sauce piquante (+15)</Btn>
              <Btn onClick={()=>addSpice(30)} color="#FF9F0A" full>🌶️🌶️🌶️ Piment fantôme (+30)</Btn>
              <Btn onClick={()=>addSpice(50)} color="#FF2D55" full>☢️ EXTRAIT DE CAPSAÏCINE PUR (+50)</Btn>
            </div>
          </Card>
          {exploded&&<div style={{padding:16,background:"#FF2D5522",border:"2px solid #FF2D5566",borderRadius:12,textAlign:"center"}}><div style={{fontFamily:"'Bangers',cursive",fontSize:22,color:"#FF2D55",letterSpacing:3}}>💥 ÇA A EXPLOSÉ</div><div style={{fontSize:12,color:"#ffffff77",marginTop:4}}>Les pizzas ont payé le prix.</div></div>}
        </div>
      </div>
    </div>
  );
}

// ═══ ESCAPE THE POULET ═══
function EscapeTab({addChaos,setPossessed}){
  const [running,setRunning]=useState(false);
  const [pos,setPos]=useState({x:50,y:50});
  const [time,setTime]=useState(0);
  const [best,setBest]=useState(0);
  const [caught,setCaught]=useState(false);
  const [speed,setSpeed]=useState(1.5);
  const containerRef=useRef(null);
  const rafRef=useRef(null);
  const startRef=useRef(null);
  const targetRef=useRef({x:50,y:50});
  const accent="#FF453A";
  const trigger=usePossessionTrigger(setPossessed);

  function start(){
    trigger();
    setRunning(true);setCaught(false);setTime(0);setSpeed(1.5);
    setPos({x:10,y:10});targetRef.current={x:10,y:10};
    startRef.current=Date.now();addChaos(10);sndAlarm();
    loop();
  }
  function loop(){
    rafRef.current=requestAnimationFrame(()=>{
      const t=(Date.now()-startRef.current)/1000;
      setTime(t);
      const curSpeed=1.5+t*0.15;
      setSpeed(curSpeed);
      const c=containerRef.current;
      if(c){
        const rect=c.getBoundingClientRect();
        // chase logic happens on mousemove; here we just check catch distance via state
      }
      loop();
    });
  }
  function onMove(e){
    if(!running||caught)return;
    const c=containerRef.current;if(!c)return;
    const rect=c.getBoundingClientRect();
    const mx=((e.clientX-rect.left)/rect.width)*100;
    const my=((e.clientY-rect.top)/rect.height)*100;
    setPos(p=>{
      const dx=mx-p.x,dy=my-p.y,dist=Math.sqrt(dx*dx+dy*dy);
      if(dist<6){
        // caught!
        setCaught(true);setRunning(false);
        cancelAnimationFrame(rafRef.current);
        sndExplosion();addChaos(15);
        setTime(tt=>{if(tt>best)setBest(tt);return tt;});
        return p;
      }
      const moveAmount=Math.min(speed,dist);
      const angle=Math.atan2(dy,dx);
      return{x:Math.max(3,Math.min(97,p.x+Math.cos(angle)*moveAmount)),y:Math.max(3,Math.min(97,p.y+Math.sin(angle)*moveAmount))};
    });
  }
  useEffect(()=>()=>cancelAnimationFrame(rafRef.current),[]);

  return(
    <div>
      <STitle color={accent}>🏃 Escape The Poulet</STitle>
      <SDesc>Bouge ta souris. Le poulet te poursuit. Plus tu survis, plus il accélère.</SDesc>
      <div style={{display:"flex",gap:10,marginBottom:14}}>
        <StatCard label="Temps" value={time.toFixed(1)+"s"} color={accent}/>
        <StatCard label="Record" value={best.toFixed(1)+"s"} color="#FFE600"/>
        <StatCard label="Vitesse" value={speed.toFixed(1)+"x"} color="#FF9F0A"/>
      </div>
      <div ref={containerRef} onMouseMove={onMove} style={{position:"relative",width:"100%",height:420,background:"#FF453A06",borderRadius:16,overflow:"hidden",border:`2px solid ${accent}33`,cursor:running?"crosshair":"default"}}>
        {!running&&!caught&&(
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:16}}>
            <div style={{fontSize:60}}>🐔</div>
            <Btn onClick={start} color={accent} size="lg">🏃 COMMENCER LA FUITE</Btn>
          </div>
        )}
        {running&&<div style={{position:"absolute",left:`${pos.x}%`,top:`${pos.y}%`,transform:"translate(-50%,-50%)",fontSize:50,transition:"left .05s linear, top .05s linear",filter:"drop-shadow(0 0 10px #FF453A)"}}>🐔</div>}
        {caught&&(
          <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",gap:12,background:"#FF453A11"}}>
            <div style={{fontSize:70,animation:"shake 0.2s infinite"}}>💀</div>
            <div style={{fontFamily:"'Bangers',cursive",fontSize:24,color:accent,letterSpacing:3}}>ATTRAPÉ EN {time.toFixed(1)}s</div>
            <Btn onClick={start} color={accent} size="lg">🔄 REJOUER</Btn>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══ PUNCH-O-MÈTRE (mash keyboard) ═══
function PunchTab({addChaos,setPossessed}){
  const [rage,setRage]=useState(0);
  const [active,setActive]=useState(false);
  const [exploded,setExploded]=useState(false);
  const [timeLeft,setTimeLeft]=useState(8);
  const [best,setBest]=useState(0);
  const ivRef=useRef(null);
  const accent="#FF2D55";
  const trigger=usePossessionTrigger(setPossessed);

  function start(){
    trigger();
    setActive(true);setRage(0);setExploded(false);setTimeLeft(8);addChaos(10);sndAlarm();
    ivRef.current=setInterval(()=>{
      setTimeLeft(t=>{
        if(t<=0.1){clearInterval(ivRef.current);setActive(false);
          setRage(r=>{if(r>best)setBest(r);return r;});
          return 0;}
        return t-0.1;
      });
    },100);
  }
  function mash(){
    if(!active)return;
    setRage(r=>{
      const n=Math.min(100,r+2.5);
      if(n>=100&&!exploded){setExploded(true);sndExplosion();addChaos(40);}
      else sndClick();
      return n;
    });
  }
  useEffect(()=>{
    function onKey(e){if(active)mash();}
    window.addEventListener("keydown",onKey);
    return()=>window.removeEventListener("keydown",onKey);
  },[active]);
  useEffect(()=>()=>clearInterval(ivRef.current),[]);

  const rageColor=rage<30?"#30D158":rage<60?"#FFE600":rage<90?"#FF9F0A":"#FF2D55";

  return(
    <div>
      <STitle color={accent}>🥊 Punch-O-Mètre</STitle>
      <SDesc>Tape n'importe quelle touche le plus vite possible. 8 secondes. Vide ta rage.</SDesc>
      <div style={{display:"flex",gap:10,marginBottom:16}}>
        <StatCard label="Rage" value={Math.round(rage)+"%"} color={rageColor}/>
        <StatCard label="Record" value={Math.round(best)+"%"} color="#FFE600"/>
        <StatCard label="Temps" value={timeLeft.toFixed(1)+"s"} color={accent}/>
      </div>
      <div onClick={mash} style={{position:"relative",width:"100%",height:300,background:exploded?"#FF2D5522":"#ffffff06",borderRadius:16,border:`3px solid ${rageColor}55`,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",cursor:active?"pointer":"default",userSelect:"none",overflow:"hidden",animation:rage>80&&active?"shake 0.08s infinite":"none"}}>
        <div style={{fontSize:80,marginBottom:16}}>{exploded?"💥":rage>70?"😡":rage>30?"😤":"😐"}</div>
        {!active&&!exploded&&<Btn onClick={start} color={accent} size="lg">🥊 COMMENCER</Btn>}
        {active&&<div style={{fontFamily:"'Bangers',cursive",fontSize:18,color:rageColor,letterSpacing:3,animation:"pulse 0.3s infinite"}}>TAPE N'IMPORTE QUELLE TOUCHE !!!</div>}
        {!active&&exploded&&<><div style={{fontFamily:"'Bangers',cursive",fontSize:24,color:"#FF2D55",letterSpacing:3,marginBottom:14}}>RAGE MAXIMALE ATTEINTE</div><Btn onClick={start} color={accent}>🔄 REJOUER</Btn></>}
        {!active&&!exploded&&rage>0&&<div style={{fontFamily:"'Bangers',cursive",fontSize:18,color:rageColor,marginTop:10}}>Score : {Math.round(rage)}%</div>}
        <div style={{position:"absolute",bottom:0,left:0,right:0,height:8,background:"#ffffff0a"}}><div style={{height:"100%",width:`${rage}%`,background:`linear-gradient(90deg,#30D158,${rageColor})`,transition:"width .1s"}}/></div>
      </div>
    </div>
  );
}

// ═══ WHACK-A-POULET ═══
function WhackTab({addChaos,setPossessed}){
  const [grid,setGrid]=useState(Array(9).fill(false));
  const [running,setRunning]=useState(false);
  const [score,setScore]=useState(0);
  const [timeLeft,setTimeLeft]=useState(20);
  const [best,setBest]=useState(0);
  const spawnRef=useRef(null);
  const timerRef=useRef(null);
  const accent="#30D158";
  const trigger=usePossessionTrigger(setPossessed);

  function start(){
    trigger();
    setRunning(true);setScore(0);setTimeLeft(20);setGrid(Array(9).fill(false));addChaos(10);sndAlarm();
    spawn();
    timerRef.current=setInterval(()=>{
      setTimeLeft(t=>{
        if(t<=1){clearInterval(timerRef.current);clearTimeout(spawnRef.current);setRunning(false);setGrid(Array(9).fill(false));
          setScore(s=>{if(s>best)setBest(s);return s;});
          return 0;}
        return t-1;
      });
    },1000);
  }
  function spawn(){
    setGrid(g=>{
      const ng=Array(9).fill(false);
      const idx=Math.floor(Math.random()*9);
      ng[idx]=true;
      return ng;
    });
    spawnRef.current=setTimeout(spawn,500+Math.random()*500);
  }
  function whack(i){
    if(!running||!grid[i])return;
    setScore(s=>s+1);addChaos(2);sndPizza();
    setGrid(g=>g.map((v,idx)=>idx===i?false:v));
  }
  useEffect(()=>()=>{clearInterval(timerRef.current);clearTimeout(spawnRef.current);},[]);

  return(
    <div>
      <STitle color={accent}>🎯 Whack-A-Poulet</STitle>
      <SDesc>20 secondes. Tape les poulets dès qu'ils apparaissent.</SDesc>
      <div style={{display:"flex",gap:10,marginBottom:16}}>
        <StatCard label="Score" value={score} color={accent}/>
        <StatCard label="Record" value={best} color="#FFE600"/>
        <StatCard label="Temps" value={timeLeft+"s"} color="#FF453A"/>
      </div>
      {!running&&<Btn onClick={start} color={accent} size="lg" full>🎯 COMMENCER ({best>0?`record: ${best}`:"20s"})</Btn>}
      {running&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginTop:16}}>
          {grid.map((active,i)=>(
            <button key={i} onClick={()=>whack(i)} style={{
              aspectRatio:"1",borderRadius:16,border:`3px solid ${active?accent:"#ffffff18"}`,
              background:active?accent+"33":"#ffffff06",fontSize:50,cursor:"pointer",
              transition:"all .1s",transform:active?"scale(1.05)":"scale(1)",
              boxShadow:active?`0 0 24px ${accent}77`:"none",
            }}>
              {active?"🐔":""}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══ SIMON SAYS POULET ═══
function SimonTab({addChaos,setPossessed}){
  const [sequence,setSequence]=useState([]);
  const [userInput,setUserInput]=useState([]);
  const [showing,setShowing]=useState(false);
  const [activeIdx,setActiveIdx]=useState(-1);
  const [playing,setPlaying]=useState(false);
  const [gameOver,setGameOver]=useState(false);
  const [best,setBest]=useState(0);
  const accent="#BF5AF2";
  const trigger=usePossessionTrigger(setPossessed);

  function start(){
    trigger();
    const first=[Math.floor(Math.random()*4)];
    setSequence(first);setUserInput([]);setGameOver(false);setPlaying(true);
    addChaos(8);
    playSequence(first);
  }
  async function playSequence(seq){
    setShowing(true);
    await new Promise(r=>setTimeout(r,500));
    for(let i=0;i<seq.length;i++){
      setActiveIdx(seq[i]);
      beep(SIMON_COLORS[seq[i]].f,0.3,"sine",0.2);
      await new Promise(r=>setTimeout(r,Math.max(250,500-seq.length*15)));
      setActiveIdx(-1);
      await new Promise(r=>setTimeout(r,Math.max(100,200-seq.length*10)));
    }
    setShowing(false);
  }
  function press(i){
    if(showing||!playing||gameOver)return;
    beep(SIMON_COLORS[i].f,0.2,"sine",0.15);
    setActiveIdx(i);setTimeout(()=>setActiveIdx(-1),150);
    const newInput=[...userInput,i];
    setUserInput(newInput);
    const idx=newInput.length-1;
    if(sequence[idx]!==i){
      // Wrong!
      sndExplosion();addChaos(20);setGameOver(true);setPlaying(false);
      setBest(b=>Math.max(b,sequence.length-1));
      return;
    }
    if(newInput.length===sequence.length){
      // Correct full sequence, next round
      sndWin();addChaos(5);
      const nextSeq=[...sequence,Math.floor(Math.random()*4)];
      setUserInput([]);
      setTimeout(()=>{setSequence(nextSeq);playSequence(nextSeq);},700);
    }
  }

  return(
    <div>
      <STitle color={accent}>🌀 Simon Says Poulet</STitle>
      <SDesc>Répète la séquence. Ça accélère. Erreur = fin du jeu.</SDesc>
      <div style={{display:"flex",gap:10,marginBottom:16}}>
        <StatCard label="Niveau" value={sequence.length} color={accent}/>
        <StatCard label="Record" value={best} color="#FFE600"/>
        <StatCard label="Statut" value={showing?"REGARDE":playing?"À TOI":gameOver?"PERDU":"PRÊT"} color={showing?"#FF9F0A":playing?"#30D158":"#FF453A"}/>
      </div>
      {!playing&&<Btn onClick={start} color={accent} size="lg" full>🌀 {gameOver?"REJOUER":"COMMENCER"}</Btn>}
      {(playing||gameOver)&&(
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:14,marginTop:16,maxWidth:400}}>
          {SIMON_COLORS.map((c,i)=>(
            <button key={i} onClick={()=>press(i)} disabled={showing} style={{
              aspectRatio:"1",borderRadius:16,border:`3px solid ${c.c}`,
              background:activeIdx===i?c.c:c.c+"22",
              fontFamily:"'Bangers',cursive",fontSize:16,color:activeIdx===i?"#000":c.c,
              cursor:showing?"default":"pointer",transition:"all .1s",
              boxShadow:activeIdx===i?`0 0 40px ${c.c}`:"none",
              transform:activeIdx===i?"scale(0.95)":"scale(1)",
            }}>{c.label}</button>
          ))}
        </div>
      )}
      {gameOver&&<div style={{marginTop:16,fontFamily:"'Bangers',cursive",fontSize:18,color:"#FF453A",letterSpacing:2,textAlign:"center"}}>PERDU AU NIVEAU {sequence.length}</div>}
    </div>
  );
}

// ═══ ROUE DE LA MORT (version extrême de la roue) ═══
const DEATH_OPTS=[
  {label:"FAUX VIRUS",emoji:"☣️",color:"#30D158",msg:"VIRUS_POULET.exe a infecté ton ordinateur. (C'est faux, calme-toi)"},
  {label:"SIRÈNE POLICE",emoji:"🚓",color:"#06B6D4",msg:"LA POLICE DU POULET ARRIVE. Ferme cet onglet. Ou pas."},
  {label:"AUTODESTRUCTION",emoji:"☢️",color:"#FF453A",msg:"AUTODESTRUCTION DANS 3...2...1... (rien ne se passe, évidemment)"},
  {label:"POSSESSION",emoji:"👹",color:"#BF5AF2",msg:"TENTATIVE DE POSSESSION DU POULET..."},
  {label:"JACKPOT CHAOS",emoji:"💎",color:"#FFE600",msg:"+50 CHAOS INSTANTANÉ. Tu l'as mérité ou pas."},
  {label:"RIEN DU TOUT",emoji:"😐",color:"#64D2FF",msg:"Absolument rien. La roue se moque de toi."},
];
function DeathWheelTab({addChaos,addPizza,setPossessed}){
  const [spinning,setSpinning]=useState(false);
  const [angle,setAngle]=useState(0);
  const [result,setResult]=useState(null);
  const cvRef=useRef(null);
  const SEG=DEATH_OPTS.length,SEG_A=(2*Math.PI)/SEG;
  const accent="#FF453A";
  function draw(rot){
    const cv=cvRef.current;if(!cv)return;
    const ctx=cv.getContext("2d"),cx=cv.width/2,cy=cv.height/2,r=cx-8;
    ctx.clearRect(0,0,cv.width,cv.height);
    DEATH_OPTS.forEach((o,i)=>{
      const s=rot+i*SEG_A-Math.PI/2,e=s+SEG_A;
      ctx.beginPath();ctx.moveTo(cx,cy);ctx.arc(cx,cy,r,s,e);ctx.closePath();
      ctx.fillStyle=o.color+"22";ctx.strokeStyle=o.color+"aa";ctx.lineWidth=2;ctx.fill();ctx.stroke();
      const mid=s+SEG_A/2;
      ctx.save();ctx.translate(cx+Math.cos(mid)*r*0.62,cy+Math.sin(mid)*r*0.62);ctx.rotate(mid+Math.PI/2);
      ctx.font="bold 11px 'Bangers',cursive";ctx.fillStyle=o.color;ctx.textAlign="center";
      ctx.fillText(o.emoji+" "+o.label,0,0);ctx.restore();
    });
    ctx.beginPath();ctx.arc(cx,cy,14,0,Math.PI*2);ctx.fillStyle="#1a0000";ctx.strokeStyle=accent;ctx.lineWidth=2;ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(cx+r+12,cy);ctx.lineTo(cx+r-10,cy-7);ctx.lineTo(cx+r-10,cy+7);ctx.closePath();ctx.fillStyle=accent;ctx.fill();
  }
  useEffect(()=>{draw(angle);},[angle]);
  async function spin(){
    if(spinning)return;
    setSpinning(true);setResult(null);addChaos(15);sndSiren();
    const total=Math.PI*2*(14+Math.random()*10),dur=2200,start=performance.now(),sA=angle;
    function anim(now){
      const el=now-start,prog=Math.min(el/dur,1),ease=1-Math.pow(1-prog,5),cur=sA+total*ease;
      setAngle(cur);draw(cur);
      if(prog<1){requestAnimationFrame(anim);return;}
      const norm=((cur%(Math.PI*2))+Math.PI*2)%(Math.PI*2);
      const idx=Math.floor(((Math.PI*2-norm+Math.PI*2)%(Math.PI*2))/SEG_A)%SEG;
      const picked=DEATH_OPTS[idx];setResult(picked);handle(picked);setSpinning(false);
    }
    requestAnimationFrame(anim);
  }
  function handle(o){
    if(o.label==="POSSESSION"){if(Math.random()<0.3)setPossessed(true);}
    if(o.label==="JACKPOT CHAOS"){addChaos(50);addPizza();}
    if(o.label==="AUTODESTRUCTION")sndExplosion();
    if(o.label==="SIRÈNE POLICE")sndSiren();
    sndWin();
  }
  return(
    <div>
      <STitle color={accent}>🎪 Roue de la Mort</STitle>
      <SDesc>Plus rapide. Plus extrême. Résultats plus dangereux.</SDesc>
      <div style={{display:"grid",gridTemplateColumns:"auto 1fr",gap:28,alignItems:"start"}}>
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:16}}>
          <canvas ref={cvRef} width={300} height={300} style={{filter:`drop-shadow(0 0 24px ${accent}55)`}}/>
          <Btn onClick={spin} disabled={spinning} color={accent} size="lg" full pulse={!spinning}>{spinning?"🌀 ROTATION...":"🎪 TOURNER"}</Btn>
        </div>
        <Card color={accent}>
          <CardTitle>Résultat</CardTitle>
          {result?<div style={{textAlign:"center",padding:12}}><div style={{fontSize:54,marginBottom:10}}>{result.emoji}</div><div style={{fontFamily:"'Bangers',cursive",fontSize:22,color:result.color,letterSpacing:2,marginBottom:10,textShadow:`0 0 14px ${result.color}88`}}>{result.label}</div><div style={{fontSize:13,color:"#ffffff99",lineHeight:1.6}}>{result.msg}</div></div>:<div style={{minHeight:120,display:"flex",alignItems:"center",justifyContent:"center",color:"#ffffff22",fontFamily:"'Bangers',cursive",letterSpacing:3,fontSize:12}}>PAS ENCORE TOURNÉ</div>}
        </Card>
      </div>
    </div>
  );
}

// ═══ FAUX TITRE DE JOURNAL ═══
function NewspaperTab({addChaos,setPossessed}){
  const [name,setName]=useState("");
  const [paper,setPaper]=useState(null);
  const [loading,setLoading]=useState(false);
  const accent="#A78BFA";
  const trigger=usePossessionTrigger(setPossessed);
  function generate(){
    if(!name.trim())return;
    trigger();
    setLoading(true);addChaos(10);sndGlory();
    setTimeout(()=>{
      const headline=NEWSPAPER_HEADLINES[Math.floor(Math.random()*NEWSPAPER_HEADLINES.length)];
      setPaper({headline:`${name.toUpperCase()} ${headline}`,date:new Date().toLocaleDateString("fr"),edition:Math.floor(Math.random()*9000+1000)});
      setLoading(false);
    },800);
  }
  return(
    <div>
      <STitle color={accent}>📰 Faux Journal</STitle>
      <SDesc>Génère ta propre une de journal absurde. Aucune IA, 100% local.</SDesc>
      <div style={{display:"flex",gap:8,marginBottom:20,maxWidth:500}}>
        <Inp value={name} onChange={e=>setName(e.target.value)} onKeyDown={e=>e.key==="Enter"&&generate()} placeholder="Ton nom ou pseudo..."/>
        <Btn onClick={generate} disabled={loading} color={accent}>📰 Générer</Btn>
      </div>
      {paper&&(
        <div style={{maxWidth:600,background:"#f5f0e8",borderRadius:4,padding:32,boxShadow:"0 20px 60px #00000088",animation:"fadein 0.4s ease"}}>
          <div style={{borderBottom:"3px solid #1a1a1a",paddingBottom:12,marginBottom:16,display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
            <div style={{fontFamily:"'Bangers',cursive",fontSize:32,color:"#1a1a1a",letterSpacing:1}}>LE SAVAGE TIMES</div>
            <div style={{fontSize:10,color:"#666"}}>Édition n°{paper.edition} — {paper.date}</div>
          </div>
          <div style={{fontFamily:"Georgia,serif",fontSize:26,fontWeight:"bold",color:"#1a1a1a",lineHeight:1.3,marginBottom:14}}>{paper.headline}</div>
          <div style={{fontFamily:"Georgia,serif",fontSize:12,color:"#444",lineHeight:1.7,fontStyle:"italic"}}>Notre journaliste, dépêché en urgence sur les lieux, confirme que la scène était "absolument délirante". Jojo Pizza n'a pas souhaité commenter. Le Savage Chicken non plus, mais lui ne parle jamais de toute façon.</div>
        </div>
      )}
    </div>
  );
}
export default function App(){
  const [showIntro,setShowIntro]=useState(true);
  const [tab,setTab]=useState("chicken");
  const [chaos,setChaos]=useState(12);
  const [crimes,setCrimes]=useState(0);
  const [musicOn,setMusicOn]=useState(false);
  const [rageMode,setRageMode]=useState(false);
  const [meltdown,setMeltdown]=useState(false);
  const [rageTap,setRageTap]=useState(0);
  const [possessed,setPossessed]=useState(false);
  const ambRef=useRef(null);

  const addChaos=useCallback((n=10)=>{
    setChaos(p=>{const next=Math.min(100,p+n);if(next>=100&&p<100)setTimeout(()=>{setMeltdown(true);sndMeltdown();},100);return next;});
    setCrimes(p=>p+1);
  },[]);

  const addPizza=useCallback(()=>{
    sndPizza();addChaos(12);
    if(rollPossession())setPossessed(true);
    const el=document.createElement("div");
    el.textContent="🍕";
    const size=35+Math.random()*45;
    el.style.cssText=`position:fixed;left:${Math.random()*92}vw;top:-80px;font-size:${size}px;pointer-events:none;z-index:9997;transition:top 1.3s cubic-bezier(.22,1,.36,1),opacity 0.5s;transform:rotate(${Math.random()*360}deg)`;
    document.body.appendChild(el);
    setTimeout(()=>el.style.top=`${15+Math.random()*70}vh`,40);
    setTimeout(()=>el.style.opacity="0",2600);
    setTimeout(()=>el.remove(),3200);
  },[addChaos]);

  function resetChaos(){setChaos(0);setMeltdown(false);beep(523,0.3,"sine");}

  function logoClick(){
    setRageTap(t=>{
      const n=t+1;
      if(n>=5){setRageMode(r=>!r);sndAlarm();return 0;}
      beep(200+n*80,0.05,"square");return n;
    });
  }

  useEffect(()=>{
    if(!musicOn){if(ambRef.current)ambRef.current();return;}
    let on=true;ambRef.current=()=>{on=false;};
    const notes=[262,294,330,349,392,440,494,523];
    function next(){if(!on)return;beep(notes[Math.floor(Math.random()*notes.length)]*(Math.random()>0.3?1:2),0.1,"sine",0.04);setTimeout(next,250+Math.random()*500);}
    next();return()=>{on=false;};
  },[musicOn]);

  const accent=TCOL[tab]||"#FFE600";
  const chaosColor=chaos<40?"#FFE600":chaos<70?"#FF9F0A":"#FF2D55";

  const TABS=[
    {section:"Principal",items:[{id:"chicken",icon:"🐔",label:"Traducteur"},{id:"pizza",icon:"🍕",label:"Pizza Attack"}]},
    {section:"Jeux",items:[{id:"roue",icon:"🎰",label:"Roue du Destin"},{id:"bouton",icon:"🔴",label:"Bouton Inutile"},{id:"casino",icon:"🃏",label:"Casino Poulet"},{id:"clicker",icon:"🐣",label:"Poulet Clicker"}]},
    {section:"Mini-jeux",items:[{id:"escape",icon:"🏃",label:"Escape Poulet"},{id:"punch",icon:"🥊",label:"Punch-O-Mètre"},{id:"whack",icon:"🎯",label:"Whack-A-Poulet"},{id:"simon",icon:"🌀",label:"Simon Poulet"}]},
    {section:"WTF",items:[{id:"roast",icon:"💀",label:"Roast-O-Matic"},{id:"soundboard",icon:"🔊",label:"Soundboard"},{id:"resist",icon:"🌡️",label:"Résistance"},{id:"heat",icon:"🔥",label:"Barre de Chaleur"}]},
    {section:"Danger",items:[{id:"oracle",icon:"🔮",label:"Oracle"},{id:"bombe",icon:"💣",label:"Bombe Pizza"},{id:"roulette",icon:"🎰",label:"Roulette Russe"},{id:"deathwheel",icon:"🎪",label:"Roue de la Mort"},{id:"chaos",icon:"🎆",label:"Chaos Total"}]},
    {section:"Délire",items:[{id:"screensaver",icon:"🕹️",label:"Écran de Veille"},{id:"hacker",icon:"📟",label:"Hacker Terminal"},{id:"newspaper",icon:"📰",label:"Faux Journal"}]},
    {section:"Social",items:[{id:"scores",icon:"🏆",label:"Hall of Chaos"}]},
  ];

  const css=`
    @import url('https://fonts.googleapis.com/css2?family=Bangers&family=Inter:wght@400;500;600&display=swap');
    *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
    html,body,#root{width:100%;height:100%;overflow:hidden;}
    body{background:#0d0018;color:#e8e8e8;font-family:'Inter',sans-serif;}
    @keyframes pulse{from{opacity:1}to{opacity:.25}}
    @keyframes shake{0%,100%{transform:translate(0)}20%{transform:translate(-5px,2px)}40%{transform:translate(5px,-2px)}60%{transform:translate(-3px,3px)}80%{transform:translate(3px,-2px)}}
    @keyframes bounce{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}
    @keyframes fadein{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}
    @keyframes comboAnim{0%{transform:translate(-50%,-50%) scale(0.2);opacity:0}60%{transform:translate(-50%,-50%) scale(1.4);opacity:1}100%{transform:translate(-50%,-50%) scale(1.1);opacity:0}}
    @keyframes meltdownFlash{0%,100%{filter:hue-rotate(0deg) saturate(3)}50%{filter:hue-rotate(180deg) saturate(5)}}
    @keyframes ragePulse{0%{opacity:0.2}100%{opacity:0.8}}
    @keyframes chaosBarPulse{from{box-shadow:0 0 8px #FF2D5566}to{box-shadow:0 0 30px #FF2D55ff}}
    @keyframes gradientShift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
    @keyframes float0{0%,100%{transform:translateY(0) rotate(0deg)}50%{transform:translateY(-20px) rotate(10deg)}}
    @keyframes float1{0%,100%{transform:translateY(-10px) rotate(-5deg)}50%{transform:translateY(10px) rotate(5deg)}}
    @keyframes float2{0%,100%{transform:translateY(5px) rotate(3deg)}50%{transform:translateY(-15px) rotate(-8deg)}}
    @keyframes btnPulse{0%,100%{box-shadow:0 0 10px currentColor}50%{box-shadow:0 0 30px currentColor,0 0 60px currentColor}}
    @keyframes btnBurst{0%{transform:scale(1)}50%{transform:scale(0.88)}100%{transform:scale(1)}}
    @keyframes particleUp{0%{opacity:1;transform:translateY(0)}100%{opacity:0;transform:translateY(-60px) scale(0.5)}}
    @keyframes jackpotFlash{0%,100%{opacity:0.5}50%{opacity:1}}
    @keyframes reelSpin{0%{transform:translateY(0)}100%{transform:translateY(-5px)}}
    @keyframes laserDrop{0%{opacity:1;transform:scaleY(0);transform-origin:top}100%{opacity:0;transform:scaleY(1)}}
    @keyframes laserSpin{from{transform:translateX(-50%) rotate(0deg)}to{transform:translateX(-50%) rotate(360deg)}}
    @keyframes chaosEmoji{0%{opacity:1;transform:scale(0.2) rotate(0deg)}50%{opacity:1;transform:scale(1.5) rotate(180deg)}100%{opacity:0;transform:scale(0.5) rotate(360deg)}}
    @keyframes possessedShake{0%,100%{transform:translate(0,0) rotate(0deg)}25%{transform:translate(-10px,5px) rotate(-2deg)}50%{transform:translate(10px,-5px) rotate(2deg)}75%{transform:translate(-6px,-6px) rotate(-1deg)}}
    @keyframes possessedFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-30px) scale(1.3)}}
    @keyframes jumpscareFlash{0%{opacity:0}20%{opacity:1}100%{opacity:0}}
    @keyframes jumpscareScale{0%{transform:scale(0.3)}30%{transform:scale(1.4)}100%{transform:scale(1)}}
    ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-thumb{background:#ffffff22;border-radius:2px}
    textarea,input{color-scheme:dark}input::placeholder,textarea::placeholder{color:#ffffff33}
  `;

  const bgGrad=`radial-gradient(ellipse at 20% 20%,${accent}15 0%,transparent 50%),radial-gradient(ellipse at 80% 80%,${chaosColor}10 0%,transparent 50%),radial-gradient(ellipse at 50% 50%,#2d0a4e 0%,#0d0018 65%)`;

  if(showIntro)return(<><style>{css}</style><IntroOverlay onDone={()=>setShowIntro(false)}/></>);

  return(
    <div style={{display:"flex",height:"100%",width:"100%",overflow:"hidden",background:bgGrad,transition:"background 0.8s",filter:rageMode?"saturate(2.5) contrast(1.15)":"none"}}>
      <style>{css}</style>
      <CursorTrail/>
      <PouletRain chaos={chaos}/>
      <Particles chaos={chaos} rageMode={rageMode}/>
      <MeltdownOverlay active={meltdown} onReset={resetChaos}/>
      <PossessedOverlay active={possessed} onEnd={()=>setPossessed(false)}/>
      {rageMode&&<div style={{position:"fixed",inset:0,zIndex:9990,pointerEvents:"none",background:"linear-gradient(180deg,#FF000009,transparent 50%,#FF000009)",animation:"ragePulse 0.4s infinite"}}/>}

      {/* SIDEBAR */}
      <div style={{width:215,minWidth:215,display:"flex",flexDirection:"column",position:"relative",zIndex:10,background:"#00000066",backdropFilter:"blur(24px)",borderRight:`1px solid ${accent}22`,transition:"border-color .5s",animation:rageMode?"shake 0.07s infinite":"none"}}>
        <div onClick={logoClick} style={{padding:"18px 16px 12px",borderBottom:"1px solid #ffffff12",cursor:"pointer",userSelect:"none"}}>
          <div style={{fontFamily:"'Bangers',cursive",fontSize:20,letterSpacing:3,lineHeight:1.1,textTransform:"uppercase"}}>
            <span style={{color:"#FF2D55",textShadow:"0 0 10px #FF2D5566"}}>JOJO</span>
            <span style={{color:"#ffffff18"}}> & </span>
            <span style={{color:"#FFE600",textShadow:"0 0 10px #FFE60066"}}>SAVAGE</span>
          </div>
          <div style={{fontSize:8,color:"#ffffff22",letterSpacing:4,textTransform:"uppercase",marginTop:2}}>CHAOS APP v4.0 {rageMode&&<span style={{color:"#FF453A"}}>🔥 RAGE</span>}</div>
          {rageTap>0&&<div style={{fontSize:8,color:"#FF453A",letterSpacing:1,marginTop:1}}>{5-rageTap} clics → rage mode</div>}
        </div>

        <div style={{display:"flex",gap:6,padding:"10px 12px",borderBottom:"1px solid #ffffff12"}}>
          {[{v:crimes,l:"Crimes",c:"#FF2D55"},{v:chaos+"%",l:"Chaos",c:chaosColor}].map(s=>(
            <div key={s.l} style={{flex:1,background:"#ffffff08",border:`1px solid ${s.c}33`,borderRadius:10,padding:"8px 6px",textAlign:"center"}}>
              <div style={{fontFamily:"'Bangers',cursive",fontSize:22,lineHeight:1,color:s.c,textShadow:`0 0 10px ${s.c}55`}}>{s.v}</div>
              <div style={{fontSize:8,color:"#ffffff33",letterSpacing:2,textTransform:"uppercase",marginTop:2}}>{s.l}</div>
            </div>
          ))}
        </div>

        <ChaosBar level={chaos}/>

        <div style={{flex:1,overflowY:"auto",padding:"6px 0"}}>
          {TABS.map(g=>(
            <div key={g.section}>
              <div style={{padding:"8px 16px 3px",fontSize:8,color:"#ffffff1a",letterSpacing:3,textTransform:"uppercase"}}>{g.section}</div>
              {g.items.map(t=>{
                const active=tab===t.id,col=TCOL[t.id];
                return(
                  <div key={t.id} onClick={()=>{setTab(t.id);sndClick();addChaos(1);if(rollPossession())setPossessed(true);}}
                    style={{display:"flex",alignItems:"center",gap:9,padding:"10px 16px",cursor:"pointer",transition:"all .12s",fontSize:13,color:active?col:"#ffffff33",background:active?col+"18":"transparent",borderLeft:`3px solid ${active?col:"transparent"}`,textShadow:active?`0 0 8px ${col}88`:"none"}}
                    onMouseEnter={e=>{if(!active){e.currentTarget.style.background="#ffffff0a";e.currentTarget.style.color="#ffffff66";}}}
                    onMouseLeave={e=>{if(!active){e.currentTarget.style.background="transparent";e.currentTarget.style.color="#ffffff33";}}}>
                    <span style={{fontSize:16,width:20,textAlign:"center"}}>{t.icon}</span>
                    <span style={{fontFamily:"'Bangers',cursive",letterSpacing:1}}>{t.label}</span>
                  </div>
                );
              })}
            </div>
          ))}
        </div>

        <div style={{padding:"10px 12px",borderTop:"1px solid #ffffff12"}}>
          <button onClick={()=>setMusicOn(m=>!m)} style={{width:"100%",padding:"8px",background:musicOn?"#FF375F18":"#ffffff08",border:`1px solid ${musicOn?"#FF375F":"#ffffff22"}`,borderRadius:8,color:musicOn?"#FF375F":"#ffffff33",fontFamily:"'Bangers',cursive",fontSize:12,cursor:"pointer",letterSpacing:2,transition:"all .2s",textTransform:"uppercase"}}>
            {musicOn?"🎵 MUSIQUE ON":"🎵 MUSIQUE OFF"}
          </button>
        </div>
      </div>

      {/* MAIN */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden",minWidth:0,position:"relative",zIndex:5}}>
        <div style={{padding:"14px 28px",borderBottom:`1px solid ${accent}22`,background:"#00000044",backdropFilter:"blur(16px)",display:"flex",alignItems:"center",justifyContent:"space-between",transition:"border-color .5s",flexShrink:0}}>
          <div>
            <div style={{fontFamily:"'Bangers',cursive",fontSize:28,letterSpacing:3,color:accent,transition:"all .3s",textShadow:`0 0 20px ${accent}88`}}>{TMETA[tab]?.title||"CHAOS"}</div>
            <div style={{fontSize:11,color:"#ffffff33",marginTop:1}}>{TMETA[tab]?.desc}</div>
          </div>
          <div style={{display:"flex",gap:10,alignItems:"center"}}>
            {rageMode&&<div style={{padding:"5px 12px",background:"#FF453A22",border:"1px solid #FF453A",borderRadius:8,fontFamily:"'Bangers',cursive",fontSize:12,letterSpacing:2,color:"#FF453A",animation:"pulse 0.5s infinite"}}>🔥 RAGE</div>}
            <div style={{padding:"7px 16px",background:chaosColor+"18",border:`1px solid ${chaosColor}44`,borderRadius:8,fontFamily:"'Bangers',cursive",fontSize:14,letterSpacing:2,color:chaosColor,textShadow:`0 0 10px ${chaosColor}77`}}>CHAOS {chaos}%</div>
          </div>
        </div>

        <div style={{flex:1,overflowY:"auto",padding:"28px 36px"}}>
          {tab==="chicken"   &&<ChickenTab    addChaos={addChaos}/>}
          {tab==="pizza"     &&<PizzaTab      addChaos={addChaos}/>}
          {tab==="roue"      &&<RoueTab       addChaos={addChaos} addPizza={addPizza}/>}
          {tab==="bouton"    &&<BoutonTab     addChaos={addChaos}/>}
          {tab==="casino"    &&<CasinoTab     addChaos={addChaos}/>}
          {tab==="clicker"   &&<ClickerTab    addChaos={addChaos}/>}
          {tab==="roast"     &&<RoastTab      addChaos={addChaos}/>}
          {tab==="soundboard"&&<SoundboardTab addChaos={addChaos}/>}
          {tab==="resist"    &&<ResistTab     addChaos={addChaos}/>}
          {tab==="oracle"    &&<OracleTab     addChaos={addChaos}/>}
          {tab==="bombe"     &&<BombeTab      addChaos={addChaos} addPizza={addPizza}/>}
          {tab==="chaos"     &&<ChaosTotal    addChaos={addChaos} addPizza={addPizza}/>}
          {tab==="escape"    &&<EscapeTab     addChaos={addChaos} setPossessed={setPossessed}/>}
          {tab==="punch"     &&<PunchTab      addChaos={addChaos} setPossessed={setPossessed}/>}
          {tab==="whack"     &&<WhackTab      addChaos={addChaos} setPossessed={setPossessed}/>}
          {tab==="simon"     &&<SimonTab      addChaos={addChaos} setPossessed={setPossessed}/>}
          {tab==="heat"      &&<HeatTab       addChaos={addChaos} addPizza={addPizza} setPossessed={setPossessed}/>}
          {tab==="roulette"  &&<RouletteTab   addChaos={addChaos} setPossessed={setPossessed}/>}
          {tab==="deathwheel"&&<DeathWheelTab addChaos={addChaos} addPizza={addPizza} setPossessed={setPossessed}/>}
          {tab==="screensaver"&&<ScreensaverTab addChaos={addChaos}/>}
          {tab==="hacker"    &&<HackerTab     addChaos={addChaos} setPossessed={setPossessed}/>}
          {tab==="newspaper" &&<NewspaperTab  addChaos={addChaos} setPossessed={setPossessed}/>}
          {tab==="scores"    &&<ScoresTab     chaos={chaos} crimes={crimes}/>}
        </div>
      </div>
    </div>
  );
}
