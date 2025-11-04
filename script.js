// Advanced script with lightning+symbols effects and robust init for mobile
window.addEventListener('DOMContentLoaded', () => {

  // ================= Player Setup =================
  let playerName = "";
  while (!playerName) {
    playerName = prompt("กรุณากรอกชื่อผู้เล่น:", "นักบัญชีผู้กล้า");
    if (!playerName) alert("ต้องกรอกชื่อก่อนเริ่มเกม!");
  }

  // ================= Game State =================
  const state = {
    gold: 60, hp: 100, maxhp: 100,
    bossStage: 1, bossHP: 0, bossMax: 0,
    buffs: { sword: 0 }, inFight: false,
    log: [], timeStart: 0,
    usedQuestions: new Set()
  };

  // ================= DOM =================
  const goldEl = document.getElementById('gold'),
    hpHeroBar = document.getElementById('hpHeroBar'),
    hpHeroText = document.getElementById('hpHeroText'),
    hpBossBar = document.getElementById('hpBossBar'),
    hpBossText = document.getElementById('hpBossText'),
    buffsEl = document.getElementById('buffs'),
    bossStageEl = document.getElementById('bossStage'),
    logEl = document.getElementById('log'),
    qPanel = document.getElementById('questionPanel'),
    qText = document.getElementById('qText'),
    qChoices = document.getElementById('qChoices'),
    leaderboardEl = document.getElementById('leaderboard'),
    canvas = document.getElementById('c'),
    ctx = canvas.getContext('2d');

  // High-DPI scaling for canvas (mobile)
  function resizeCanvas() {
    const ratio = window.devicePixelRatio || 1;
    const cssWidth = canvas.clientWidth;
    const cssHeight = Math.round(cssWidth * 180 / 320); // keep aspect
    canvas.style.height = cssHeight + 'px';
    canvas.width = Math.round(cssWidth * ratio);
    canvas.height = Math.round(cssHeight * ratio);
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  window.addEventListener('resize', resizeCanvas);
  resizeCanvas();

  // ================= Firebase =================
  const firebaseConfig = {
    apiKey: "AIzaSyC4a9DrCeSN_HQFIHXWJhnzN4Jn376CdIc",
    authDomain: "hero-4ebbe.firebaseapp.com",
    databaseURL: "https://hero-4ebbe-default-rtdb.asia-southeast1.firebasedatabase.app",
    projectId: "hero-4ebbe",
    storageBucket: "hero-4ebbe.firebasestorage.app",
    messagingSenderId: "868857385644",
    appId: "1:868857385644:web:d5366bee7f5d7b11e60509"
  };
  firebase.initializeApp(firebaseConfig);
  const dbRef = firebase.database().ref('leaderboard');

  // ================= Utility =================
  function save() {
    goldEl.textContent = state.gold;
    hpHeroBar.style.width = (state.hp / state.maxhp * 100) + '%';
    hpHeroText.textContent = `${state.hp}/${state.maxhp}`;
    hpBossBar.style.width = (state.bossMax ? (state.bossHP / state.bossMax * 100) : 0) + '%';
    hpBossText.textContent = `${state.bossHP}/${state.bossMax}`;
    buffsEl.textContent = state.buffs.sword ? 'ดาบชาร์จ' : 'ไม่มี';
    bossStageEl.textContent = state.bossStage;
    const hpPercent = state.hp / state.maxhp;
    hpHeroBar.style.background = hpPercent > 0.6 ? '#22c55e' : hpPercent > 0.3 ? '#facc15' : '#ef4444';
    logEl.innerHTML = state.log.map(s => `<div>${s}</div>`).join('');
  }

  function addLog(t) {
    state.log.unshift(t);
    if (state.log.length > 50) state.log.pop();
    save();
  }

  // ================= Questions (30) =================
  const questions = [
    ['งบดุลประกอบด้วยอะไรบ้าง?', ['สินทรัพย์ หนี้สิน ทุน', 'รายได้ ค่าใช้จ่าย', 'กระแสเงินสด'], 0],
    ['รายได้เกิดจากอะไร?', ['การขายสินค้าหรือบริการ', 'การซื้อสินค้า', 'การจ่ายค่าแรง'], 0],
    ['ต้นทุนขายคำนวณอย่างไร?', ['สินค้าต้นงวด + ซื้อระหว่างงวด - สินค้าปลายงวด', 'รายได้ - ค่าใช้จ่าย', 'สินทรัพย์ - หนี้สิน'], 0],
    ['ค่าเสื่อมราคาคืออะไร?', ['การกระจายมูลค่าทรัพย์สินตามเวลา', 'ค่าใช้จ่ายเงินสด', 'รายได้เพิ่มเติม'], 0],
    ['บัญชีคู่หมายถึง?', ['เดบิต=เครดิต', 'สินทรัพย์=รายได้', 'ทุน=หนี้สิน'], 0],
    ['สมุดรายวันใช้เพื่อ?', ['บันทึกรายการตามลำดับเวลา', 'สรุปยอดรายเดือน', 'บันทึกงบการเงิน'], 0],
    ['งบกำไรขาดทุนใช้เพื่อ?', ['แสดงผลการดำเนินงานของกิจการ', 'แสดงสินทรัพย์ทั้งหมด', 'คำนวณทุน'], 0],
    ['กระแสเงินสดจากการดำเนินงานคือ?', ['เงินสดจากการขายและจ่ายทั่วไป', 'การลงทุน', 'การกู้ยืม'], 0],
    ['ทุนเจ้าของเปลี่ยนแปลงเมื่อ?', ['เจ้าของถอนทุน', 'ขายสินค้า', 'ซื้อเครื่องใช้สำนักงาน'], 0],
    ['ค่าใช้จ่ายล่วงหน้าจัดเป็น?', ['สินทรัพย์หมุนเวียน', 'หนี้สินหมุนเวียน', 'ทุน'], 0],
    ['เงินเดือนค้างจ่ายจัดเป็น?', ['หนี้สินหมุนเวียน', 'สินทรัพย์', 'ทุน'], 0],
    ['ต้นทุนทางตรงคือ?', ['วัตถุดิบ ค่าแรงตรง', 'ค่าไฟ', 'ค่าโฆษณา'], 0],
    ['งบกระแสเงินสดแบ่งเป็นกี่กิจกรรม?', ['3', '2', '4'], 0],
    ['การตัดจำหน่ายสินทรัพย์ไม่มีตัวตนคือ?', ['ค่าเสื่อมราคาของสินทรัพย์ไม่มีตัวตน', 'การลงทุนใหม่', 'รายได้'], 0],
    ['รายได้ค้างรับจัดเป็น?', ['สินทรัพย์หมุนเวียน', 'หนี้สินหมุนเวียน', 'ค่าใช้จ่าย'], 0],
    ['เจ้าหนี้การค้าคือ?', ['ผู้ที่เรายังไม่ได้ชำระค่าสินค้า', 'ลูกค้าที่ค้างจ่าย', 'พนักงาน'], 0],
    ['งบกำไรขาดทุนมีส่วนประกอบใด?', ['รายได้ ค่าใช้จ่าย กำไร', 'สินทรัพย์ หนี้สิน ทุน', 'ทุน รายได้'], 0],
    ['งบแสดงฐานะการเงินคือ?', ['งบดุล', 'งบกำไรขาดทุน', 'งบกระแสเงินสด'], 0],
    ['ภาษีมูลค่าเพิ่มคิดเท่าไร?', ['7%', '10%', '5%'], 0],
    ['รายได้อื่นๆ เช่น?', ['ดอกเบี้ยรับ', 'ค่าใช้จ่ายทั่วไป', 'สินค้าคงเหลือ'], 0],
    ['งบกระทบยอดธนาคารใช้เพื่อ?', ['ตรวจสอบยอดเงินฝากกับบัญชีจริง', 'คำนวณภาษี', 'บันทึกค่าเสื่อม'], 0],
    ['สมุดรายวันซื้อใช้เมื่อ?', ['ซื้อสินค้าเชื่อ', 'ขายสินค้าเชื่อ', 'จ่ายเงินเดือน'], 0],
    ['บัญชีสินค้าคงเหลืออยู่ในงบใด?', ['งบดุล', 'งบกำไรขาดทุน', 'งบทุนเจ้าของ'], 0],
    ['ค่าใช้จ่ายในการขายคือ?', ['ค่าโฆษณา', 'ดอกเบี้ยเงินกู้', 'ค่าเสื่อมเครื่องจักร'], 0],
    ['ต้นทุนทางอ้อมคือ?', ['ค่าใช้จ่ายที่ไม่เกี่ยวกับการผลิตโดยตรง', 'ค่าแรงตรง', 'ค่าวัตถุดิบ'], 0],
    ['งบแสดงทุนเปลี่ยนแปลงคือ?', ['งบแสดงการเปลี่ยนแปลงทุนเจ้าของ', 'งบกระแสเงินสด', 'งบกำไรขาดทุน'], 0],
    ['สินทรัพย์ถาวรคือตัวใด?', ['อาคาร เครื่องจักร', 'เงินสด', 'ลูกหนี้'], 0],
    ['รายได้จากการลงทุนจัดเป็น?', ['รายได้อื่น', 'รายได้หลัก', 'ทุน'], 0],
    ['เงินทดรองจ่ายคือ?', ['เงินที่ออกไปก่อนและจะเบิกคืน', 'รายได้ค้างรับ', 'หนี้สิน'], 0],
    ['ค่าใช้จ่ายคงที่คือ?', ['ค่าเช่าที่จ่ายเท่ากันทุกเดือน', 'ค่าไฟ', 'ค่าน้ำ'], 0]
  ];

  function getNewQuestion() {
    let idx;
    if (state.usedQuestions.size >= questions.length) state.usedQuestions.clear();
    do {
      idx = Math.floor(Math.random() * questions.length);
    } while (state.usedQuestions.has(idx) && state.usedQuestions.size < questions.length);
    state.usedQuestions.add(idx);
    const [q, choices, a] = questions[idx];
    return { q, choices, a };
  }

  // ================= Effects =================
  let effects = [];

  function drawScene() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    // background
    ctx.fillStyle = '#001524';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // update and draw effects
    for (let i = 0; i < effects.length; i++) {
      const e = effects[i];
      e.t += 1;
      e.alpha -= 0.04;
      if (e.type === 'light') drawLightning(e);
      if (e.type === 'symbol') drawSymbol(e);
      if (e.type === 'fire') drawFire(e);
    }
    effects = effects.filter(e => e.alpha > 0.02);

    // hero
    ctx.save();
    ctx.translate(80, 120);
    ctx.fillStyle = '#38bdf8';
    ctx.beginPath();
    ctx.arc(0, 15, 18, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fef3c7';
    ctx.beginPath();
    ctx.arc(0, -10, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#10b981';
    ctx.fillRect(12, -5, 8, 12);
    ctx.restore();

    // boss
    if (state.inFight || state.bossHP > 0) {
      ctx.save();
      ctx.translate(canvas.width / (window.devicePixelRatio || 1) - 80, 90);
      ctx.fillStyle = '#7f1d1d';
      ctx.fillRect(-25, -25, 50, 60);
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.arc(-10, -10, 4, 0, Math.PI * 2);
      ctx.arc(10, -10, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f00';
      ctx.fillRect(-12, 5, 24, 4);
      ctx.restore();
    }
  }

  function drawLightning(e) {
    ctx.save();
    ctx.strokeStyle = `rgba(100,200,255,${e.alpha})`;
    ctx.lineWidth = 2 + Math.sin(e.t * 0.2) * 1.5;
    ctx.shadowBlur = 12;
    ctx.shadowColor = '#60a5fa';
    ctx.beginPath();
    const startX = 100, startY = 100;
    ctx.moveTo(startX, startY);
    const seg = 6;
    for (let i = 1; i <= seg; i++) {
      const x = startX + (i / seg) * (canvas.width / (window.devicePixelRatio || 1) - 200) + (Math.random() - 0.5) * 20;
      const y = startY + Math.sin(e.t * 0.2 + i) * 10 + (Math.random() - 0.5) * 20;
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawSymbol(e) {
    ctx.save();
    ctx.font = `${18 * (e.scale || 1)}px sans-serif`;
    ctx.fillStyle = `rgba(250,250,200,${e.alpha})`;
    ctx.shadowBlur = 8;
    ctx.shadowColor = '#60a5fa';
    ctx.fillText(e.char, e.x, e.y - e.t * 1.4);
    ctx.restore();
  }

  function drawFire(e) {
    ctx.save();
    ctx.fillStyle = `rgba(255,120,60,${e.alpha})`;
    ctx.shadowBlur = 12;
    ctx.shadowColor = 'orange';
    ctx.beginPath();
    ctx.arc(e.x, e.y - e.t * 1.6, 12 * e.scale, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function spawnHeroAttack() {
    // multiple lightning + symbols
    for (let i = 0; i < 5; i++) {
      effects.push({ type: 'light', alpha: 1, t: 0 });
      const sym = ['฿', '+', '-', '='][Math.floor(Math.random() * 4)];
      effects.push({ type: 'symbol', alpha: 1, t: 0, x: 110 + Math.random() * 20, y: 100 + Math.random() * 20, char: sym, scale: 1.0 });
    }
  }

  function spawnBossAttack() {
    for (let i = 0; i < 6; i++) {
      effects.push({ type: 'fire', alpha: 1, t: 0, x: canvas.width / (window.devicePixelRatio || 1) - 100 + Math.random() * 30, y: 90 + Math.random() * 20, scale: 1.0 + Math.random() * 0.5 });
    }
  }

  function animateAttack(type) {
    if (type === 'hero') spawnHeroAttack();
    else spawnBossAttack();
  }

  // ================= Game Logic =================
  let currentQuestion = null;

  function newBoss() {
    state.inFight = true;
    state.bossMax = 250 + (state.bossStage * 120);
    state.bossHP = state.bossMax;
    addLog(`🧿 บอสด่าน ${state.bossStage} ปรากฏแล้ว!`);
    state.timeStart = Date.now();
    save();
    drawScene();
    setTimeout(showQuestion, 300);
  }

  function showQuestion() {
    currentQuestion = getNewQuestion();
    qPanel.style.display = 'block';
    qText.textContent = currentQuestion.q;
    qChoices.innerHTML = currentQuestion.choices.map((c, i) =>
      `<div style="margin:6px 0;"><label><input type=radio name=ans value=${i}> ${c}</label></div>`).join('');
  }

  function answerSelected() {
    const sel = [...document.getElementsByName('ans')].find(r => r.checked);
    if (!sel) { alert("เลือกคำตอบก่อน!"); return; }
    const idx = Number(sel.value);
    qPanel.style.display = 'none';
    if (idx === currentQuestion.a) {
      const dmg = state.buffs.sword ? 35 : 15;
      state.bossHP = Math.max(0, state.bossHP - dmg);
      state.gold += 35;
      addLog(`⚡ ตอบถูก! โจมตี -${dmg}`);
      state.buffs.sword = 0;
      animateAttack('hero');
      if (state.bossHP <= 0) return victory();
    } else {
      state.hp = Math.max(0, state.hp - 25);
      addLog("🔥 ตอบผิด! -25 HP");
      animateAttack('boss');
      if (state.hp <= 0) return gameOver();
    }
    save();
    setTimeout(showQuestion, 900);
  }

  // ================= Buttons & Events =================
  document.getElementById('startFight').addEventListener('click', () => {
    if (!state.inFight) newBoss();
  });
  document.getElementById('endFight').addEventListener('click', () => {
    if (state.inFight) {
      addLog('ยอมแพ้ 😭');
      state.inFight = false;
      save();
    }
  });
  document.getElementById('answerBtn').addEventListener('click', answerSelected);
  document.getElementById('skipBtn').addEventListener('click', () => {
    qPanel.style.display = 'none';
    state.hp = Math.max(0, state.hp - 20);
    addLog("ข้ามคำถาม! -20 HP");
    animateAttack('boss');
    if (state.hp <= 0) return gameOver();
    save();
    setTimeout(showQuestion, 700);
  });

  document.querySelectorAll('[data-item]').forEach(b => b.addEventListener('click', () => {
    const it = b.dataset.item;
    if (it === 'potion') {
      if (state.gold < 30) return addLog('ทองไม่พอ!');
      state.gold -= 30;
      state.hp = Math.min(state.maxhp, state.hp + 50);
      addLog('💊 ใช้ยา +50 HP');
    }
    if (it === 'sword') {
      if (state.gold < 80) return addLog('ทองไม่พอ!');
      state.gold -= 80;
      state.buffs.sword = 1;
      addLog('🗡️ ซื้อดาบเวท + โจมตีแรงครั้งถัดไป');
    }
    save();
  }));

  // ================= Victory / GameOver =================
  function victory() {
    addLog('🎉 ชนะบอส! 🎉');
    document.getElementById('victory').style.display = 'flex';
    state.inFight = false;
    const elapsed = Math.round((Date.now() - state.timeStart) / 1000);
    try { dbRef.push({ name: playerName, time: elapsed, gold: state.gold }); } catch (e) {}
    fetchLeaderboard();
    state.bossStage++;
    setTimeout(() => { document.getElementById('victory').style.display = 'none'; }, 1500);
    save();
  }

  function gameOver() {
    alert('💀 Game Over!');
    Object.assign(state, { gold: 60, hp: 100, bossStage: 1, bossHP: 0 });
    state.inFight = false;
    save();
  }

  // ================= Leaderboard =================
  function fetchLeaderboard() {
    dbRef.orderByChild('time').limitToFirst(10).once('value', s => {
      const d = s.val();
      if (!d) return leaderboardEl.innerHTML = '-';
      const arr = Object.values(d).sort((a, b) => a.time - b.time);
      leaderboardEl.innerHTML = arr.map((p, i) => `${i + 1}. ${p.name} - ${p.time}s`).join('<br>');
    });
  }

  // ================= Loop =================
  function loop() {
    updateEffects();
    drawScene();
    requestAnimationFrame(loop);
  }

  function updateEffects() {
    // decay and move symbol effects
    for (const e of effects) {
      e.t = (e.t || 0) + 1;
      e.alpha = Math.max(0, (e.alpha || 1) - 0.03);
      if (e.type === 'symbol') {
        e.x += 3; e.y -= 0.8;
        e.scale = (e.scale || 1) * 0.995;
      }
    }
    effects = effects.filter(e => e.alpha > 0.02);
  }

  // helper for animateAttack exposed earlier
  function animateAttack(t) { animateAttack; }

  // init
  save();
  loop();
  fetchLeaderboard();

  // expose for console debugging (optional)
  window._heroState = state;

}); // DOMContentLoaded end
