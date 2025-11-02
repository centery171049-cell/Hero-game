// 1️⃣ ใส่ Firebase Config ของคุณ

const firebaseConfig = {

  apiKey: "AIzaSyC4a9DrCeSN_HQFIHXWJhnzN4Jn376CdIc",

  authDomain: "hero-4ebbe.firebaseapp.com",

  databaseURL: "https://hero-4ebbe-default-rtdb.asia-southeast1.firebasedatabase.app",

  projectId: "hero-4ebbe",

  storageBucket: "hero-4ebbe.firebasestorage.app",

  messagingSenderId: "868857385644",

  appId: "1:868857385644:web:d5366bee7f5d7b11e60509",

  measurementId: "G-2DE96HJN7Z"

};

firebase.initializeApp(firebaseConfig);

const db = firebase.database();

// 2️⃣ ชื่อผู้เล่น

let playerName = "";

while(!playerName){

  playerName = prompt("กรุณากรอกชื่อผู้เล่น:","ผู้กล้า");

  if(!playerName) alert("ต้องกรอกชื่อก่อนเริ่มเกม!");

}

// 3️⃣ สถานะเกม

const state={gold:60,hp:100,maxhp:100,bossStage:1,bossHP:0,bossMax:0,buffs:{sword:0},inFight:false,log:[],timeStart:0};

// 4️⃣ อ้างอิง HTML

const goldEl=document.getElementById('gold'),

      hpHeroBar=document.getElementById('hpHeroBar'),

      hpHeroText=document.getElementById('hpHeroText'),

      hpBossBar=document.getElementById('hpBossBar'),

      hpBossText=document.getElementById('hpBossText'),

      buffsEl=document.getElementById('buffs'),

      bossStageEl=document.getElementById('bossStage'),

      logEl=document.getElementById('log'),

      qPanel=document.getElementById('questionPanel'),

      qText=document.getElementById('qText'),

      qChoices=document.getElementById('qChoices'),

      c=document.getElementById('c'),

      ctx=c.getContext('2d'),

      leaderboardEl=document.getElementById('leaderboard');

// 5️⃣ คำถามบัญชีเพิ่ม

const questions=[

  {q:'งบดุลประกอบด้วย?',choices:['สินทรัพย์/หนี้สิน','รายได้/ค่าใช้จ่าย','กระแสเงินสด'],a:0,diff:'easy'},

  {q:'ค่าเสื่อมสะท้อน?',choices:['การสูญเสียเงินสด','กระจายต้นทุน','รายได้'],a:1,diff:'medium'},

  {q:'บัญชีทุนแสดง?',choices:['สิทธิของเจ้าของ','หนี้ภายนอก','สินค้า'],a:0,diff:'hard'},

  {q:'รายการค่าใช้จ่ายใดไม่ใช่ค่าใช้จ่ายในการดำเนินงาน?',choices:['ค่าโฆษณา','ค่าดอกเบี้ยเงินกู้','เงินเดือนพนักงาน'],a:1,diff:'easy'},

  {q:'ต้นทุนคงที่คืออะไร?',choices:['ต้นทุนที่ไม่เปลี่ยนตามปริมาณ','ต้นทุนต่อหน่วย','ต้นทุนผันแปร'],a:0,diff:'medium'},

  {q:'งบกำไรขาดทุนแสดง?',choices:['รายได้-ค่าใช้จ่าย','สินทรัพย์','หนี้สิน'],a:0,diff:'easy'},

  {q:'บัญชีลูกหนี้คือ?',choices:['เงินที่ลูกหนี้ยังไม่ได้จ่าย','สินทรัพย์ถาวร','ค่าใช้จ่าย'],a:0,diff:'medium'},

  {q:'รายการใดเป็นค่าใช้จ่ายผันแปร?',choices:['ค่าแรงรายชั่วโมง','ค่าเช่าคงที่','ค่าเครื่องจักร'],a:0,diff:'hard'}

];

// 6️⃣ ฟังก์ชัน gold ตามความยาก

function goldByDiff(d){if(d==='easy')return 20;if(d==='medium')return 40;return 60;}

// 7️⃣ ฟังก์ชัน log

function addLog(t){state.log.unshift(t);if(state.log.length>50)state.log.pop();renderLog();}

function renderLog(){logEl.innerHTML=state.log.map(s=>'<div>'+s+'</div>').join('');}

// 8️⃣ อัปเดต UI

function save(){

  goldEl.textContent=state.gold;

  hpHeroBar.style.width=(state.hp/state.maxhp*100)+'%';

  hpHeroText.textContent=state.hp+' / '+state.maxhp;

  hpBossBar.style.width=(state.bossMax?state.bossHP/state.bossMax*100:0)+'%';

  hpBossText.textContent=state.bossHP+' / '+state.bossMax;

  buffsEl.textContent=state.buffs.sword?'ดาบชาร์จ':'ไม่มี';

  bossStageEl.textContent=state.bossStage;

  renderLog();

}

// 9️⃣ วาดตัวละคร

function drawScene(heroShake=0,bossShake=0){

  ctx.clearRect(0,0,c.width,c.height);

  ctx.fillStyle='#02101a';ctx.fillRect(0,0,c.width,c.height);

  // Hero

  ctx.save();ctx.translate(120+(Math.random()-0.5)*heroShake,160);

  ctx.fillStyle='#38bdf8';ctx.beginPath();ctx.arc(0,0,25,0,Math.PI*2);ctx.fill();

  ctx.fillStyle='#fff';ctx.beginPath();ctx.arc(0,-28,18,0,Math.PI*2);ctx.fill();

  ctx.fillStyle='#111';ctx.fillRect(-6,-32,4,4);ctx.fillRect(4,-32,4,4);

  ctx.fillStyle=state.buffs.sword?'#f97316':'#000';ctx.fillRect(15,0,20,4);

  ctx.restore();

  // Boss

  ctx.save();ctx.translate(480+(Math.random()-0.5)*bossShake,140);

  ctx.fillStyle='#fb7185';ctx.beginPath();ctx.ellipse(0,0,40,35,0,0,Math.PI*2);ctx.fill();

  ctx.fillStyle='#fff';ctx.beginPath().arc(0,-30,25,0,Math.PI*2);ctx.fill();

  ctx.fillStyle='#111';ctx.fillRect(-10,-36,6,6);ctx.fillRect(4,-36,6,6);

  ctx.fillStyle='#f00';ctx.fillRect(-15,0,10,4);ctx.fillRect(5,0,10,4);

  ctx.restore();

}

// 10️⃣ Animate Attack

function animateAttack(type){

  let t=0;

  const timer=setInterval(()=>{

    t++;

    if(type==='hero') drawScene(12,0);

    if(type==='boss') drawScene(0,12);

    if(t>8){clearInterval(timer);drawScene();}

  },40);

}

// 11️⃣ Boss / Question

let currentQuestion=null;

function newBoss(){

  state.inFight=true;

  state.bossMax=500;

  state.bossHP=state.bossMax;

  addLog('บอสปรากฏแล้ว! ต่อสู้ให้ชนะ!');

  state.timeStart=Date.now();

  save();drawScene();showQuestion();

}

function showQuestion(){

  currentQuestion=questions[Math.floor(Math.random()*questions.length)];

  qPanel.style.display='block';

  qText.textContent='['+currentQuestion.diff+'] '+currentQuestion.q;

  qChoices.innerHTML=currentQuestion.choices.map((c,i)=>`<div><label><input type=radio name=ans value=${i}> ${c}</label></div>`).join('');

}

// 12️⃣ ตอบ / ข้าม

document.getElementById('answerBtn').onclick=()=>{

  const sel=[...document.getElementsByName('ans')].find(r=>r.checked);if(!sel)return alert("เลือกคำตอบก่อน!");

  const idx=Number(sel.value);qPanel.style.display='none';

  if(idx===currentQuestion.a){

    const dmg=state.buffs.sword?25:10;

    state.bossHP=Math.max(0,state.bossHP-dmg);

    state.gold+=goldByDiff(currentQuestion.diff);

    addLog('ตอบถูก! โจมตี -'+dmg);

    state.buffs.sword=0;

    animateAttack('hero');

    if(state.bossHP<=0) return victory();

  }else{

    state.hp=Math.max(0,state.hp-20);

    addLog('ตอบผิด! บอสตี -20');

    animateAttack('boss');

    if(state.hp<=0) return gameOver();

  }

  save();setTimeout(showQuestion,600);

};

document.getElementById('skipBtn').onclick=()=>{

  qPanel.style.display='none';

  state.hp=Math.max(0,state.hp-20);

  addLog('ข้าม! บอสตี -20');

  animateAttack('boss');

  if(state.hp<=0) return gameOver();

  save();setTimeout(showQuestion,600);

};

// 13️⃣ ร้านค้า

document.querySelectorAll('[data-item]').forEach(b=>b.onclick=()=>{

  const it=b.dataset.item;

  if(it==='potion'){if(state.gold<30){addLog('ทองไม่พอ');return;}state.gold-=30;state.hp=Math.min(state.maxhp,state.hp+50);addLog('ใช้ยา +50 HP');}

  if(it==='sword'){if(state.gold<80){addLog('ทองไม่พอ');return;}state.gold-=80;state.buffs.sword=1;addLog('ซื้อดาบหนัก');}

  save();

});

// 14️⃣ Victory / Leaderboard ออนไลน์

function victory(){

  addLog('Victory! 🎆');

  document.getElementById('victory').style.display='flex';

  state.inFight=false;

  const elapsed = Math.round((Date.now() - state.timeStart)/1000);

  

  // บันทึก Firebase

  db.ref("leaderboard").push({name: playerName, time: elapsed}).then(()=>{

    loadLeaderboard();

  });

  setTimeout(()=>{document.getElementById('victory').style.display='none';},2000);

  save();

}

// 15️⃣ โหลด Leaderboard

function loadLeaderboard(){

  db.ref("leaderboard").once("value").then(snapshot=>{

    const data = snapshot.val();

    if(!data){ leaderboardEl.innerHTML = '-'; return; }

    const arr = Object.values(data).sort((a,b)=>a.time-b.time);

    leaderboardEl.innerHTML = arr.map((p,i)=>`${i+1}. ${p.name} - ${p.time}s`).join('<br>');

  });

}

// 16️⃣ Game Over

function gameOver(){

  addLog('Game Over');

  state.inFight=false;

  alert('Game Over! เริ่มใหม่');

  state.hp=100; state.gold=60; state.bossHP=0;

  save();

}

// 17️⃣ ปุ่มเริ่ม/ยอมแพ้

document.getElementById('startFight').onclick=()=>{