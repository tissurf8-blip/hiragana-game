/* ================================================
   ひらがなゲーム！ - ゲームロジック
   「あ はどれ？」→ ひらがなが動く！
   レベル選択：かんたん / ふつう / むずかしい
   ================================================ */

// ============================================================
// ひらがなプール（全文字）
// ============================================================
const HIRAGANA_POOL_ALL = [
  "あ","い","う","え","お",
  "か","き","く","け","こ",
  "さ","し","す","せ","そ",
  "た","ち","つ","て","と",
  "な","に","ぬ","ね","の",
  "は","ひ","ふ","へ","ほ",
  "ま","み","む","め","も",
  "や","ゆ","よ",
  "ら","り","る","れ","ろ",
  "わ","を","ん"
];

// ============================================================
// レベル設定
// ============================================================
const LEVEL_CONFIG = {
  easy: {
    label:   'かんたん',
    pool:    ['あ','い','う','え','お'],
    choices: 3
  },
  normal: {
    label:   'ふつう',
    pool:    [
      'あ','い','う','え','お',
      'か','き','く','け','こ',
      'さ','し','す','せ','そ'
    ],
    choices: 4
  },
  hard: {
    label:   'むずかしい',
    pool:    HIRAGANA_POOL_ALL,
    choices: 5
  }
};

let currentLevel = 'easy'; // 現在のレベル

// ============================================================
// 書くモード ── 筆順データ
// ============================================================
// ── 文字ごとの画数データ（画数カウントのみ）
const WRITE_STROKE_DATA = {
  'あ': 3, 'い': 2, 'う': 2, 'え': 3, 'お': 3,
  'か': 3, 'き': 4, 'く': 1, 'け': 3, 'こ': 2,
  'さ': 3, 'し': 1, 'す': 2, 'せ': 3, 'そ': 2,
  'た': 3, 'ち': 2, 'つ': 1, 'て': 2, 'と': 2,
  'な': 4, 'に': 3, 'ぬ': 2, 'ね': 3, 'の': 1,
};

// ============================================================
// 書くモード データ
// ============================================================
const WRITE_CHARS = [
  'あ','い','う','え','お',
  'か','き','く','け','こ',
  'さ','し','す','せ','そ',
  'た','ち','つ','て','と',
  'な','に','ぬ','ね','の',
];

// 文字ごとの描画色（パステル・明るい色）
const WRITE_STROKE_COLORS = [
  '#FF91B8', // ピンク
  '#74C7F6', // 水色
  '#FFCC44', // 黄色
  '#C4A8FF', // 紫
  '#5CC8A0', // 緑
];

const WRITE_PRAISE_MSGS = [
  'じょうず！', 'できた！', 'いいね！', 'すごい！', 'さいこう！', 'ばっちり！',
];
const WRITE_PRAISE_SPEECHES = [
  'すごく じょうずに かけたね！',
  'とっても きれいに かけたよ！',
  'やったね！ ばっちり！',
  'じょうず！ まるで せんせいみたい！',
  'わあ！ かわいく かけたね！',
];
const WRITE_SPEECHES = [
  'ゆびで なぞってみよう！',
  'おおきく かいてね！',
  'ゆっくりで いいよ！',
  'すきな いろで かいてね！',
  'がんばって！',
];

// 書くモードの状態
let writeIndex        = 0;
let writeIsDrawing    = false;
let writeLastX        = 0;
let writeLastY        = 0;
let writeDrawCtx      = null;
let writeHasDraw      = false;
let writePraiseShown  = false;
let writePraiseTimer  = null;
let writeDpr          = 1;
let writeCurrentColor = '#FF91B8';

// 書くモード ── 筆順状態
let writeCurrentChar   = 'あ';  // 今練習中の文字
let currentStrokeIdx   = 0;     // 今何画目か（0始まり）
let traceProgress      = 0;     // (互換性維持)
let guideAnimId        = null;  // ガイドアニメーションのrAF ID
let writeCanvasW       = 0;     // キャンバスの表示幅(px)
let writeCanvasH       = 0;     // キャンバスの表示高(px)
// ── 書き順番号の拡大アニメーション用
let strokeNumScale = 1.0;  // 現在の番号スケール（書き順ごとに大きくなる）
let strokeNumAnim  = false; // 拡大アニメーション中フラグ
let strokeNumAnimStart = 0; // アニメーション開始タイムスタンプ

// ============================================================
// キャラクター セリフ集
// ============================================================
const SPEECH_QUESTION = [
  "さがして タップ！",
  "どれかな？みつけてね！",
  "うごいてる よ！",
  "できるよ！おしえて！",
  "みつかるかな？",
];
const SPEECH_CORRECT = [
  "やったー！すごいね！⭐",
  "せいかい！きらきら～！✨",
  "よくできました！えらい！🌟",
  "ばっちり！さすがだね！💫",
  "わあ！おほしさまゲット！⭐",
  "さいこう！かがやいてるよ！🌟",
];
const SPEECH_WRONG = [
  "おしい！つぎはできるよ！🌙",
  "だいじょうぶ！いっしょにがんばろう！",
  "ドンマイ！もう一回いこう！☁️",
  "もうすこし！おうえんしてるよ！",
  "まちがえても へいきだよ！💕",
];
const SPEECH_FEVER = [
  "きらきらタイム！すごすぎる！⭐⭐",
  "3れんぞく！おほしさま たくさん！🌟",
  "とまらないね！かがやきMAX！✨⭐",
  "さいこう！おそらが きらきら！🌟💫",
];

// ============================================================
// サウンドエンジン（Web Audio API）
// bgm.mp3 をフォルダに置くと BGM として使用
// ============================================================

let _actx    = null;   // AudioContext
let isMuted  = false;  // ミュート状態
let bgmTimer = null;   // BGM タイマー
let bgmStep  = 0;      // BGM ビートカウント
let useMp3Bgm = false; // mp3 BGM 使用フラグ

function getCtx() {
  if (!_actx) _actx = new (window.AudioContext || window.webkitAudioContext)();
  return _actx;
}

function tone(freq, dur, type = 'sine', vol = 0.28, delay = 0) {
  if (isMuted) return;
  const ctx = getCtx();
  const osc = ctx.createOscillator();
  const g   = ctx.createGain();
  osc.connect(g); g.connect(ctx.destination);
  osc.type = type;
  osc.frequency.value = freq;
  const t = ctx.currentTime + delay;
  g.gain.setValueAtTime(vol, t);
  g.gain.exponentialRampToValueAtTime(0.001, t + dur);
  osc.start(t); osc.stop(t + dur + 0.01);
}

function noiseShot(dur, vol = 0.18, hpFreq = 0) {
  if (isMuted) return;
  const ctx = getCtx();
  const len = Math.floor(ctx.sampleRate * dur);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d   = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  const src = ctx.createBufferSource();
  src.buffer = buf;
  const g = ctx.createGain();
  g.gain.setValueAtTime(vol, ctx.currentTime);
  g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + dur);
  if (hpFreq > 0) {
    const f = ctx.createBiquadFilter();
    f.type = 'highpass'; f.frequency.value = hpFreq;
    src.connect(f); f.connect(g);
  } else { src.connect(g); }
  g.connect(ctx.destination);
  src.start(); src.stop(ctx.currentTime + dur);
}

// ── 効果音 ──
function seClick()   { tone(900, 0.05, 'sine', 0.12); }
function seStart()   {
  [392, 523, 659, 784].forEach((f, i) => tone(f, 0.15, 'sine', 0.35, i * 0.12));
}
function seCorrect() {
  tone(523, 0.1,  'sine', 0.3,  0);
  tone(659, 0.1,  'sine', 0.3,  0.1);
  tone(784, 0.22, 'sine', 0.35, 0.2);
}
function seWrong() {
  tone(280, 0.14, 'sawtooth', 0.18, 0);
  tone(220, 0.28, 'sawtooth', 0.16, 0.14);
}
function seFever() {
  [523,587,659,784,880,1047].forEach((f,i) =>
    tone(f, 0.12, 'sine', 0.3, i * 0.055));
}
function seCombo() {
  tone(660, 0.08, 'sine', 0.2, 0);
  tone(880, 0.12, 'sine', 0.25, 0.09);
}
function seResultGood() {
  [523,659,784,1047,1319].forEach((f,i) =>
    tone(f, 0.18, 'sine', 0.38, i * 0.1));
}
function seResultOk() {
  [440,523,659].forEach((f,i) => tone(f, 0.15, 'sine', 0.28, i * 0.12));
}

// ── BGM（かわいいオルゴール風ループ）──
const BGM_INTERVAL = 260;
const BGM_MELODY = [
  523, 659, 784, 659,
  523, 659, 784,   0,
  659, 784, 880, 784,
  659, 523, 523,   0
];
const BGM_BASS = [
  262,   0, 330,   0,
  262,   0, 330,   0,
  330,   0, 392,   0,
  330,   0, 262,   0
];
const BGM_BELL = [1047, 0, 0, 0, 880, 0, 0, 0, 1047, 0, 0, 0, 880, 0, 0, 0];

function bgmTick() {
  if (isMuted || useMp3Bgm) return;
  const s = bgmStep % 16;
  if (s % 4 === 0) noiseShot(0.03, 0.05, 10000);
  if (BGM_BASS[s])   tone(BGM_BASS[s],   0.22, 'sine',     0.07);
  if (BGM_MELODY[s]) tone(BGM_MELODY[s], 0.20, 'triangle', 0.11);
  if (BGM_BELL[s])   tone(BGM_BELL[s],   0.10, 'sine',     0.06);
  bgmStep++;
}

function startBGM() {
  stopBGM();
  bgmStep = 0;
  const audio = $('bgmAudio');
  if (audio) {
    audio.volume = 0.5;
    const p = audio.play();
    if (p !== undefined) {
      p.then(() => { useMp3Bgm = true; })
       .catch(() => {
         useMp3Bgm = false;
         if (!isMuted) bgmTimer = setInterval(bgmTick, BGM_INTERVAL);
       });
    }
    return;
  }
  if (!isMuted) bgmTimer = setInterval(bgmTick, BGM_INTERVAL);
}

function stopBGM() {
  if (bgmTimer) { clearInterval(bgmTimer); bgmTimer = null; }
  const audio = $('bgmAudio');
  if (audio && !audio.paused) { audio.pause(); audio.currentTime = 0; }
  useMp3Bgm = false;
}

function toggleMute() {
  isMuted = !isMuted;
  const btn = $('muteBtn');
  btn.textContent = isMuted ? '🔇' : '🔊';
  btn.classList.toggle('muted', isMuted);
  const audio = $('bgmAudio');
  if (isMuted) {
    stopBGM();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
  } else {
    if ($('gameScreen').classList.contains('active')) startBGM();
    if (audio && useMp3Bgm) audio.play().catch(() => {});
  }
}

// ============================================================
// 音声読み上げ（Web Speech API）
// ============================================================
let _jaVoice = null;

const PREFERRED_JA_VOICES = [
  'Flo',
  'Sandy',
  'Shelley',
  'Reed',
  'Kyoko',
  'Google 日本語',
  'Microsoft Nanami',
];

function pickBestJaVoice() {
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  const jaVoices = voices.filter(v => /^ja/i.test(v.lang));
  if (!jaVoices.length) return null;
  for (const name of PREFERRED_JA_VOICES) {
    const hit = jaVoices.find(v => v.name.startsWith(name));
    if (hit) return hit;
  }
  const enhanced = jaVoices.find(v => v.localService && /enhanced|premium|neural/i.test(v.name));
  if (enhanced) return enhanced;
  const local = jaVoices.find(v => v.localService);
  if (local) return local;
  return jaVoices[0];
}

if (window.speechSynthesis) {
  window.speechSynthesis.addEventListener('voiceschanged', () => {
    _jaVoice = null;
  });
}

function speakText(text) {
  if (isMuted) return;
  if (!window.speechSynthesis) return;
  window.speechSynthesis.cancel();
  const utt  = new SpeechSynthesisUtterance(text);
  utt.lang   = 'ja-JP';
  utt.rate   = 0.88;
  utt.pitch  = 1.0;
  utt.volume = 1.0;
  if (!_jaVoice) _jaVoice = pickBestJaVoice();
  if (_jaVoice)  utt.voice = _jaVoice;
  window.speechSynthesis.speak(utt);
}

// ============================================================
// ゲーム状態
// ============================================================
let gameQuestions = [];
let currentIndex  = 0;
let score         = 0;
let combo         = 0;
let starPoints    = 0;
let isFever       = false;
let isLocked      = false;

// ============================================================
// DOM 取得ショートカット
// ============================================================
const $ = id => document.getElementById(id);

// ============================================================
// ユーティリティ
// ============================================================
function rand(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}
function shuffle(arr) {
  return [...arr].sort(() => Math.random() - 0.5);
}

// ============================================================
// 画面切り替え
// ============================================================
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  $(id).classList.add('active');
}

// ============================================================
// 背景デコレーション生成
// ============================================================
function buildBgDeco() {
  const wrap = $('bgDeco');
  wrap.innerHTML = '';
  const icons = ['⭐','✨','💫','🌟','☁️','💕','🌙','💛','🌈'];
  for (let i = 0; i < 18; i++) {
    const el = document.createElement('span');
    el.className = 'deco-item';
    el.textContent = rand(icons);
    el.style.cssText = `
      left: ${Math.random() * 100}%;
      top:  ${Math.random() * 100}%;
      font-size: ${Math.random() * 18 + 12}px;
      animation-delay: ${Math.random() * 4}s;
      animation-duration: ${Math.random() * 3 + 3}s;
    `;
    wrap.appendChild(el);
  }
}

// ============================================================
// 問題セット生成（10問）
// ============================================================
function buildQuestions() {
  const cfg  = LEVEL_CONFIG[currentLevel];
  const pool = shuffle(cfg.pool);
  const result = [];
  // プールが10問に満たない場合は繰り返し使う
  while (result.length < 10) {
    for (const h of pool) {
      if (result.length >= 10) break;
      if (result[result.length - 1] !== h) result.push(h);
    }
  }
  return result.slice(0, 10);
}

// ============================================================
// 選択肢を生成（正解1つ＋ランダムに埋める）
// ============================================================
function buildChoices(answer) {
  const cfg     = LEVEL_CONFIG[currentLevel];
  const count   = cfg.choices;  // 3, 4, or 5
  const pool    = cfg.pool;
  const wrongs  = shuffle(pool.filter(h => h !== answer)).slice(0, count - 1);
  return shuffle([answer, ...wrongs]);
}

// ============================================================
// ゾーン計算（選択肢の数に応じて初期配置ゾーンを返す）
// ============================================================
function getZones(count, W, H) {
  const hw = W / 2, hh = H / 2;
  const th = H / 3, tw = W / 3;

  if (count === 3) {
    // 左上 / 右上 / 下中央
    return [
      { zx: 0,       zy: 0,       zw: hw,     zh: hh },
      { zx: hw,      zy: 0,       zw: hw,     zh: hh },
      { zx: tw,      zy: hh,      zw: tw,     zh: hh },
    ];
  }
  if (count === 4) {
    // 4分割（左上 / 右上 / 左下 / 右下）
    return [
      { zx: 0,  zy: 0,  zw: hw, zh: hh },
      { zx: hw, zy: 0,  zw: hw, zh: hh },
      { zx: 0,  zy: hh, zw: hw, zh: hh },
      { zx: hw, zy: hh, zw: hw, zh: hh },
    ];
  }
  // count === 5: 2列 + 1中央 + 2列
  return [
    { zx: 0,       zy: 0,       zw: hw, zh: th },   // 左上
    { zx: hw,      zy: 0,       zw: hw, zh: th },   // 右上
    { zx: tw,      zy: th,      zw: tw, zh: th },   // 中央
    { zx: 0,       zy: th * 2,  zw: hw, zh: th },   // 左下
    { zx: hw,      zy: th * 2,  zw: hw, zh: th },   // 右下
  ];
}

// ============================================================
// 浮遊アニメーション システム
// ============================================================
let floatChars = [];
let rafId      = null;

const CHAR_COLORS = ['pink', 'blue', 'yellow', 'green', 'purple'];

class FloatChar {
  constructor(el, areaW, areaH, startZone) {
    this.el    = el;
    this.areaW = areaW;
    this.areaH = areaH;
    this.size  = el.offsetWidth || 72;

    const { zx, zy, zw, zh } = startZone;
    this.x = zx + Math.random() * Math.max(0, zw - this.size);
    this.y = zy + Math.random() * Math.max(0, zh - this.size);

    const speed = 0.65 + Math.random() * 0.75;
    const angle = Math.random() * Math.PI * 2;
    this.vx = Math.cos(angle) * speed;
    this.vy = Math.sin(angle) * speed;

    this.rot    = 0;
    this.rotDir = Math.random() > 0.5 ? 1 : -1;
    this.rotMax = 9;

    this._apply();
  }

  update() {
    this.x += this.vx;
    this.y += this.vy;

    if (this.x <= 0)                      { this.x = 0;                      this.vx =  Math.abs(this.vx); }
    if (this.x >= this.areaW - this.size) { this.x = this.areaW - this.size; this.vx = -Math.abs(this.vx); }
    if (this.y <= 0)                      { this.y = 0;                      this.vy =  Math.abs(this.vy); }
    if (this.y >= this.areaH - this.size) { this.y = this.areaH - this.size; this.vy = -Math.abs(this.vy); }

    this.rot += this.rotDir * 0.22;
    if (Math.abs(this.rot) >= this.rotMax) this.rotDir *= -1;

    this._apply();
  }

  _apply() {
    this.el.style.left      = `${this.x}px`;
    this.el.style.top       = `${this.y}px`;
    this.el.style.transform = `rotate(${this.rot}deg)`;
  }
}

function stopFloating() {
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  floatChars = [];
}

function startFloating() {
  stopFloating();
  const area = $('floatArea');
  const W = area.clientWidth;
  const H = area.clientHeight;
  if (W < 10 || H < 10) return;

  const btns  = area.querySelectorAll('.float-char');
  const count = btns.length;
  const zones = getZones(count, W, H);

  btns.forEach((btn, i) => {
    floatChars.push(new FloatChar(btn, W, H, zones[i]));
  });

  function loop() {
    floatChars.forEach(fc => fc.update());
    rafId = requestAnimationFrame(loop);
  }
  rafId = requestAnimationFrame(loop);
}

// ============================================================
// レベルバッジ更新
// ============================================================
function updateLevelBadges() {
  const label = LEVEL_CONFIG[currentLevel].label;
  $('levelBadge').textContent       = label;
  $('resultLevelBadge').textContent = label;
}

// ============================================================
// ゲーム開始
// ============================================================
function startGame() {
  stopFloating();
  updateLevelBadges();

  gameQuestions = buildQuestions();
  currentIndex  = 0;
  score         = 0;
  combo         = 0;
  starPoints    = 0;
  isFever       = false;
  isLocked      = false;

  document.body.classList.remove('fever-mode');
  stopBGM();
  showIntro();
}

// ============================================================
// イントロ演出（いくよー！ 3 2 1 スタート！）
// ============================================================
function showIntro() {
  showScreen('introScreen');
  const steps  = ['いくよー！', '３！', '２！', '１！', 'スタート！'];
  const speaks = ['いくよー！', 'さん！', 'に！', 'いち！', 'スタート！'];
  let i = 0;

  function next() {
    const el = $('introText');
    el.textContent = steps[i];
    el.className = 'intro-text anim-pop';
    void el.offsetWidth;
    speakText(speaks[i]);
    i++;
    if (i < steps.length) {
      setTimeout(next, 700);
    } else {
      setTimeout(() => {
        showScreen('gameScreen');
        startBGM();
        showQuestion();
      }, 750);
    }
  }
  next();
}

// ============================================================
// 問題を表示
// ============================================================
function showQuestion() {
  if (currentIndex >= gameQuestions.length) {
    showResult();
    return;
  }

  stopFloating();
  isLocked = false;

  const answer  = gameQuestions[currentIndex];
  const choices = buildChoices(answer);

  $('questionNum').textContent = `${currentIndex + 1}/10`;
  $('starPoints').textContent  = starPoints;

  $('feverBadge').style.display = isFever ? 'block' : 'none';
  const fa = $('floatArea');
  isFever ? fa.classList.add('fever') : fa.classList.remove('fever');
  document.body.classList.toggle('fever-mode', isFever);

  $('targetChar').textContent = answer;

  // float-area をクリアして選択肢ボタンを生成
  fa.innerHTML = '';
  choices.forEach((ch, i) => {
    const btn = document.createElement('button');
    btn.className    = `float-char float-char--${CHAR_COLORS[i % CHAR_COLORS.length]}`;
    btn.textContent  = ch;
    btn.dataset.value = ch;
    btn.onclick      = () => handleAnswer(ch, answer);
    fa.appendChild(btn);
  });

  updateGameChar('thinking', rand(SPEECH_QUESTION));
  $('comboPop').style.display = 'none';

  setTimeout(() => speakText(`${answer}、はどれかな？`), 350);
  setTimeout(startFloating, 60);
}

// ============================================================
// 回答処理
// ============================================================
function handleAnswer(selected, correct) {
  if (isLocked) return;
  isLocked = true;
  stopFloating();

  const btns = $('floatArea').querySelectorAll('.float-char');
  btns.forEach(btn => {
    btn.disabled = true;
    if (btn.dataset.value === correct)    btn.classList.add('correct');
    else if (btn.dataset.value === selected) btn.classList.add('wrong');
  });

  if (selected === correct) {
    score++;
    combo++;
    starPoints += isFever ? 2 : 1;
    if (combo >= 3) isFever = true;

    $('starPoints').textContent = starPoints;
    const correctState = isFever ? 'fever' : 'happy';
    updateGameChar(correctState, isFever ? rand(SPEECH_FEVER) : rand(SPEECH_CORRECT));
    jumpChar('gameCharImg');

    if (combo >= 2) {
      const label = combo >= 3 ? `⭐ ${combo}れんぞく！きらきら！` : `${combo}れんぞく！⭐`;
      $('comboText').textContent = label;
      $('comboPop').style.display = 'block';
    }
    seCorrect();
    if (isFever) seFever();
    if (combo >= 2 && combo < 3) seCombo();
    setTimeout(() => showFeedback(true), 500);

  } else {
    combo   = 0;
    isFever = false;
    $('feverBadge').style.display = 'none';
    $('floatArea').classList.remove('fever');
    document.body.classList.remove('fever-mode');

    seWrong();
    updateGameChar('encouraging', rand(SPEECH_WRONG));
    encourageChar('gameCharImg');
    setTimeout(() => showFeedback(false), 500);
  }
}

// ============================================================
// フィードバック表示
// ============================================================
function showFeedback(isCorrect) {
  showScreen('feedbackScreen');

  if (isCorrect) {
    $('fbIcon').textContent = isFever ? '🌟' : '⭐';
    $('fbText').textContent = isFever ? 'きらきら！' : 'せいかい！';
    $('fbText').className   = 'fb-text correct';
    setCharImg('fbCharImg', isFever ? 'fever' : 'happy');
    $('fbSpeech').textContent = isFever ? rand(SPEECH_FEVER) : rand(SPEECH_CORRECT);
    spawnParticles();
    jumpChar('fbCharImg');
    setTimeout(() => speakText(isFever ? 'きらきら！すごい！' : 'せいかい！'), 100);
  } else {
    $('fbIcon').textContent = '❌';
    $('fbText').textContent = 'おしい！';
    $('fbText').className   = 'fb-text wrong';
    setCharImg('fbCharImg', 'encouraging');
    $('fbSpeech').textContent = rand(SPEECH_WRONG);
    encourageChar('fbCharImg');
    $('particles').innerHTML = '';
    setTimeout(() => speakText('おしい！だいじょうぶ！'), 100);
  }

  const delay = isCorrect ? 1600 : 2100;
  setTimeout(() => {
    currentIndex++;
    showScreen('gameScreen');
    showQuestion();
  }, delay);
}

// ============================================================
// パーティクル（正解時）
// ============================================================
function spawnParticles() {
  const wrap = $('particles');
  wrap.innerHTML = '';
  const icons = ['⭐','✨','💫','🌟','💕','🌙','💛','🎀'];
  for (let i = 0; i < 12; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    el.textContent = rand(icons);
    el.style.cssText = `
      left: ${Math.random() * 90 + 5}%;
      top:  ${Math.random() * 60 + 20}%;
      animation-delay: ${Math.random() * 0.4}s;
      animation-duration: ${Math.random() * 0.6 + 0.9}s;
      font-size: ${Math.random() * 16 + 18}px;
    `;
    wrap.appendChild(el);
  }
}

// ============================================================
// キャラクター画像（状態別）
// ============================================================
const CHAR_IMAGES = {
  normal:      'char_normal.jpg',
  thinking:    'char_thinking.jpg',
  happy:       'char_happy.jpg',
  fever:       'char_fever.jpg',
  encouraging: 'char_thinking.jpg',
};

function setCharImg(imgId, state) {
  const img = $(imgId);
  if (!img) return;
  const src = CHAR_IMAGES[state] || CHAR_IMAGES.normal;
  if (img.src !== src) img.src = src;
  img.classList.remove('state-happy', 'state-fever', 'state-encouraging');
  if (state === 'happy')       img.classList.add('state-happy');
  if (state === 'fever')       img.classList.add('state-fever');
  if (state === 'encouraging') img.classList.add('state-encouraging');
}

function jumpChar(imgId) {
  const el = $(imgId);
  if (!el) return;
  el.classList.remove('jump', 'encourage');
  void el.offsetWidth;
  el.classList.add('jump');
  setTimeout(() => el.classList.remove('jump'), 560);
}

function encourageChar(imgId) {
  const el = $(imgId);
  if (!el) return;
  el.classList.remove('jump', 'encourage');
  void el.offsetWidth;
  el.classList.add('encourage');
  setTimeout(() => el.classList.remove('encourage'), 620);
}

function updateGameChar(state, speech) {
  setCharImg('gameCharImg', state);
  $('gameSpeech').textContent = speech;
}

// ============================================================
// 結果画面
// ============================================================
function showResult() {
  stopBGM();
  showScreen('resultScreen');

  $('finalScore').textContent = score;
  $('finalStars').textContent = starPoints;
  updateLevelBadges();

  let header, charState, speech, msg;

  if (score === 10) {
    header    = '🌟 ぜんもん せいかい！ 🌟';
    charState = 'fever';
    speech    = '10もん ぜんぶ せいかい！かがやいてるよ！またあそぼう！';
    msg       = '⭐ かんぺき！さいこうだよ！ ⭐';
    seResultGood();
  } else if (score >= 8) {
    header    = '✨ いっぱい あつめたね！ ✨';
    charState = 'happy';
    speech    = 'すごい！いっぱい できたね！またちょうせんしてね！';
    msg       = '🌟 よくできました！またあそぼう！ 🌟';
    seResultGood();
  } else if (score >= 5) {
    header    = '⭐ よくがんばったね！ ⭐';
    charState = 'happy';
    speech    = 'がんばったね！もっとできるよ！またあそぼう！';
    msg       = '💫 もっかいやったら もっとできるよ！';
    seResultOk();
  } else {
    header    = '☁️ いっしょに がんばろう！ ☁️';
    charState = 'encouraging';
    speech    = 'だいじょうぶ！いっしょに れんしゅうしよう！またあそぼう！';
    msg       = '🌙 またあそんで うまくなろう！';
    seResultOk();
  }

  $('resultHeader').textContent = header;
  setCharImg('resultCharImg', charState);
  $('resultSpeech').textContent = speech;
  $('resultMsg').textContent    = msg;

  $('resultStars').textContent = '⭐'.repeat(Math.min(starPoints, 15));

  spawnParticles();
  jumpChar('resultCharImg');
  setTimeout(() => speakText(speech), 400);
}

// ============================================================
// 書くモード ── ガイドアニメーション用ヘルパー
// ============================================================

// 画数を返す
function getStrokeCount(char) {
  return WRITE_STROKE_DATA[char] || 1;
}

// ============================================================
// 書くモード ── ガイドアニメーション
// ============================================================
function startGuideAnim() {
  stopGuideAnim();
  function loop(ts) {
    drawWriteGuide(ts);
    guideAnimId = requestAnimationFrame(loop);
  }
  guideAnimId = requestAnimationFrame(loop);
}

function stopGuideAnim() {
  if (guideAnimId) { cancelAnimationFrame(guideAnimId); guideAnimId = null; }
}

function drawWriteGuide(timestamp) {
  const guideCanvas = $('writeGuideCanvas');
  if (!guideCanvas) return;
  const ctx = guideCanvas.getContext('2d');
  const dpr = writeDpr;
  const W   = writeCanvasW;
  const H   = writeCanvasH;
  if (!W || !H) return;

  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, W, H);

  // ── 薄いガイド文字（背景） ──
  const fontSize = Math.min(W, H) * 0.72;
  ctx.font         = `900 ${fontSize}px 'Hiragino Maru Gothic ProN','Hiragino Sans','Noto Sans JP',sans-serif`;
  ctx.fillStyle    = 'rgba(180, 155, 215, 0.13)';
  ctx.textAlign    = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(writeCurrentChar, W / 2, H / 2);

  // ── 残り画数のミニドット（右上付近に小さく表示）──
  const totalStrokes = getStrokeCount(writeCurrentChar);
  if (currentStrokeIdx >= totalStrokes) return;
  const strokeNum = currentStrokeIdx + 1;
  const dotR = Math.max(5, Math.min(W, H) * 0.022);
  const dotStartX = W * 0.72;
  const dotY      = H * 0.08;
  for (let i = 0; i < totalStrokes; i++) {
    const dx = dotStartX + i * (dotR * 2.6);
    ctx.beginPath();
    ctx.arc(dx, dotY, dotR, 0, Math.PI * 2);
    ctx.fillStyle = i < strokeNum
      ? 'rgba(255,180,30,0.90)'   // 完了済み：金色
      : 'rgba(200,185,230,0.45)'; // 未来：薄い紫
    ctx.fill();
  }
}

// ============================================================
// 書くモード ── 初期化・文字切り替え
// ============================================================

function startWriteMode() {
  writeIndex = 0;
  showScreen('writeScreen');
  showWriteChar();
}

function showWriteChar() {
  const char  = WRITE_CHARS[writeIndex % WRITE_CHARS.length];
  writeCurrentColor = WRITE_STROKE_COLORS[writeIndex % WRITE_STROKE_COLORS.length];

  const strokeCount = WRITE_STROKE_DATA[char] || 0;

  if (strokeCount > 0) {
    $('writeLabel').textContent = `「${char}」を かこう！（${strokeCount}かく）`;
  } else {
    $('writeLabel').textContent = `「${char}」を かこう！`;
  }
  $('writeProgress').textContent = `${writeIndex + 1} / ${WRITE_CHARS.length}`;

  setCharImg('writeCharImg', 'thinking');
  $('writeSpeech').textContent = rand(WRITE_SPEECHES);

  // ほめ演出を隠す
  $('writePraiseOverlay').style.display = 'none';
  writePraiseShown = false;
  writeHasDraw     = false;
  writeIsDrawing   = false;
  currentStrokeIdx = 0;
  traceProgress    = 0;

  clearTimeout(writePraiseTimer);
  stopGuideAnim();

  // キャンバスを(再)初期化
  // DOMが更新されてから実行
  requestAnimationFrame(() => initWriteCanvas(char));
}

// ============================================================
// 書くモード ── キャンバス初期化
// ============================================================
function initWriteCanvas(char) {
  writeCurrentChar = char;
  currentStrokeIdx = 0;
  traceProgress    = 0;

  const wrap        = $('writeCanvasWrap');
  const guideCanvas = $('writeGuideCanvas');
  const drawCanvas  = $('writeDrawCanvas');

  const W   = wrap.clientWidth;
  const H   = wrap.clientHeight;
  const dpr = window.devicePixelRatio || 1;
  writeDpr  = dpr;

  writeCanvasW = W;
  writeCanvasH = H;

  // キャンバスサイズ設定
  [guideCanvas, drawCanvas].forEach(c => {
    c.width  = Math.round(W * dpr);
    c.height = Math.round(H * dpr);
    c.style.width  = W + 'px';
    c.style.height = H + 'px';
  });

  // 描画コンテキスト設定
  const dctx = drawCanvas.getContext('2d');
  dctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  dctx.clearRect(0, 0, W, H);
  dctx.lineCap     = 'round';
  dctx.lineJoin    = 'round';
  dctx.lineWidth   = Math.max(22, Math.min(W, H) * 0.065);
  dctx.strokeStyle = writeCurrentColor;
  dctx.fillStyle   = writeCurrentColor;
  dctx.shadowBlur  = 10;
  dctx.shadowColor = writeCurrentColor + 'AA';
  dctx.globalAlpha = 0.90;
  writeDrawCtx = dctx;

  // イベント設定
  setupWriteEvents(drawCanvas);

  // ガイドアニメーション開始
  startGuideAnim();
}

// ============================================================
// 書くモード ── タッチ/マウスイベント
// ============================================================
function setupWriteEvents(canvas) {
  // 既存のイベントを削除してから再設定
  canvas.removeEventListener('mousedown',   onWriteStart);
  canvas.removeEventListener('mousemove',   onWriteMove);
  canvas.removeEventListener('mouseup',     onWriteEnd);
  canvas.removeEventListener('mouseleave',  onWriteEnd);
  canvas.removeEventListener('touchstart',  onWriteStart);
  canvas.removeEventListener('touchmove',   onWriteMove);
  canvas.removeEventListener('touchend',    onWriteEnd);
  canvas.removeEventListener('touchcancel', onWriteEnd);

  canvas.addEventListener('mousedown',   onWriteStart);
  canvas.addEventListener('mousemove',   onWriteMove);
  canvas.addEventListener('mouseup',     onWriteEnd);
  canvas.addEventListener('mouseleave',  onWriteEnd);
  canvas.addEventListener('touchstart',  onWriteStart, { passive: false });
  canvas.addEventListener('touchmove',   onWriteMove,  { passive: false });
  canvas.addEventListener('touchend',    onWriteEnd);
  canvas.addEventListener('touchcancel', onWriteEnd);
}

function getWriteXY(e) {
  const canvas = $('writeDrawCanvas');
  const rect   = canvas.getBoundingClientRect();
  if (e.touches && e.touches.length > 0) {
    return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
  }
  return { x: e.clientX - rect.left, y: e.clientY - rect.top };
}

function processWriteTrace(cx, cy) {
  if (!writeDrawCtx) return;
  // どこに描いても常にインクが出る（子どもにストレスフリー）
  if (!writeIsDrawing) {
    writeDrawCtx.beginPath();
    writeDrawCtx.arc(cx, cy, writeDrawCtx.lineWidth / 2, 0, Math.PI * 2);
    writeDrawCtx.fill();
  } else {
    writeDrawCtx.beginPath();
    writeDrawCtx.moveTo(writeLastX, writeLastY);
    writeDrawCtx.lineTo(cx, cy);
    writeDrawCtx.stroke();
  }
  writeHasDraw = true;
  writeLastX = cx;
  writeLastY = cy;
}

function onWriteStart(e) {
  e.preventDefault();
  writeIsDrawing = true;
  const { x, y } = getWriteXY(e);
  writeLastX = x;
  writeLastY = y;
  processWriteTrace(x, y);
}

function onWriteMove(e) {
  if (!writeIsDrawing) return;
  e.preventDefault();
  const { x, y } = getWriteXY(e);
  processWriteTrace(x, y);
  writeLastX = x;
  writeLastY = y;
}

function onWriteEnd(e) {
  if (!writeIsDrawing) return;
  writeIsDrawing = false;
}

// ============================================================
// 書くモード ── 次の画へ進む
// ============================================================
function advanceToNextStroke(timestamp) {
  const totalStrokes = getStrokeCount(writeCurrentChar);
  currentStrokeIdx++;
  traceProgress = 0;

  // 書き順番号の拡大アニメーションを起動
  strokeNumAnim      = true;
  strokeNumAnimStart = timestamp || performance.now();

  if (currentStrokeIdx >= totalStrokes) {
    // ── 全画完了！ ──
    setTimeout(() => showWritePraise(), 400);
  } else {
    // ── 次の画へ ──
    const nextPhrases = ['つぎ！', 'いいね！', 'すごい！', 'つづけて！', 'やるね！'];
    const msg = rand(nextPhrases);
    $('writeSpeech').textContent = msg;
    speakText(msg);
    setCharImg('writeCharImg', 'happy');
    // 少し経ったらthinkingに戻す
    setTimeout(() => {
      if ($('writePraiseOverlay').style.display === 'none') {
        setCharImg('writeCharImg', 'thinking');
        $('writeSpeech').textContent = rand(WRITE_SPEECHES);
      }
    }, 1200);
    // 1画完了の軽いSE
    seCombo();
  }
}

// ============================================================
// 書くモード ── インクだけ消す（画番号は維持）
// ============================================================
function clearWriteInkOnly() {
  const canvas = $('writeDrawCanvas');
  const dpr    = writeDpr;
  const W      = writeCanvasW || canvas.clientWidth;
  const H      = writeCanvasH || canvas.clientHeight;
  if (writeDrawCtx) {
    writeDrawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    writeDrawCtx.clearRect(0, 0, W, H);
  }
  writeHasDraw = false;
}

// ============================================================
// 書くモード ── けす（クリア）
// ============================================================
function clearWriteCanvas() {
  const canvas = $('writeDrawCanvas');
  const dpr    = writeDpr;
  const W      = writeCanvasW || canvas.clientWidth;
  const H      = writeCanvasH || canvas.clientHeight;
  if (writeDrawCtx) {
    writeDrawCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
    writeDrawCtx.clearRect(0, 0, W, H);
  }
  writeHasDraw     = false;
  currentStrokeIdx = 0;
  traceProgress    = 0;
  clearTimeout(writePraiseTimer);
}

// ============================================================
// 書くモード ── ほめ演出
// ============================================================
function showWritePraise() {
  if (writePraiseShown) return;
  writePraiseShown = true;

  const msg    = rand(WRITE_PRAISE_MSGS);
  const speech = rand(WRITE_PRAISE_SPEECHES);

  $('writePraiseIcon').textContent  = '🌟';
  $('writePraiseText').textContent  = msg;
  $('writePraiseSpeech').textContent = speech;
  setCharImg('writePraiseCharImg', 'happy');

  // パーティクル
  const wrap = $('writePraiseParticles');
  wrap.innerHTML = '';
  const icons = ['⭐','✨','💫','🌟','💕','💛','🎀'];
  for (let i = 0; i < 10; i++) {
    const el = document.createElement('div');
    el.className = 'particle';
    el.textContent = rand(icons);
    el.style.cssText = `
      left: ${Math.random()*90+5}%;
      top:  ${Math.random()*60+20}%;
      animation-delay: ${Math.random()*0.4}s;
      animation-duration: ${Math.random()*0.6+0.9}s;
      font-size: ${Math.random()*14+16}px;
    `;
    wrap.appendChild(el);
  }

  $('writePraiseOverlay').style.display = 'flex';
  setCharImg('writeCharImg', 'happy');
  speakText(msg);
  seCorrect();
}

// ============================================================
// 書くモード ── つぎへ
// ============================================================
function goNextWriteChar() {
  writeIndex++;
  if (writeIndex >= WRITE_CHARS.length) {
    writeIndex = 0; // 最初に戻る（ループ）
  }
  showWriteChar();
}

// ============================================================
// イベントリスナー
// ============================================================

// ── モード選択（タイトル画面） ──
$('btnModeSearch').addEventListener('click', () => {
  seClick();
  showScreen('levelScreen');
});
$('btnModeWrite').addEventListener('click', () => {
  seClick();
  startWriteMode();
});

// ── 書くモード ──
$('writeBackBtn').addEventListener('click', () => {
  seClick();
  stopGuideAnim();
  clearTimeout(writePraiseTimer);
  showScreen('titleScreen');
});
$('writeClearBtn').addEventListener('click', () => {
  seClick();
  clearWriteCanvas();
  $('writePraiseOverlay').style.display = 'none';
  writePraiseShown = false;
});
$('writeRetryBtn').addEventListener('click', () => {
  seClick();
  clearTimeout(writePraiseTimer);
  $('writePraiseOverlay').style.display = 'none';
  writePraiseShown = false;
  writeHasDraw = false;
  currentStrokeIdx = 0;
  traceProgress = 0;
  stopGuideAnim();
  showWriteChar();
});
$('writeDoneBtn').addEventListener('click', () => {
  seClick();
  if (writeHasDraw) {
    // 1画書いた → 次の画へ進む（全画完了なら褒め演出）
    clearWriteInkOnly();
    advanceToNextStroke(performance.now());
  } else {
    speakText('まず かいてみよう！');
    $('writeSpeech').textContent = 'まず かいてみよう！';
  }
});
$('writeNextBtn').addEventListener('click', () => {
  seClick();
  clearTimeout(writePraiseTimer);
  goNextWriteChar();
});
$('writePraiseNextBtn').addEventListener('click', () => {
  seClick();
  goNextWriteChar();
});

// ── 既存のレベル選択ボタン ──
$('btnEasy').addEventListener('click', () => {
  seStart();
  currentLevel = 'easy';
  startGame();
});
$('btnNormal').addEventListener('click', () => {
  seStart();
  currentLevel = 'normal';
  startGame();
});
$('btnHard').addEventListener('click', () => {
  seStart();
  currentLevel = 'hard';
  startGame();
});

// ── 結果画面 ──
$('replayBtn').addEventListener('click', () => {
  seStart();
  startGame();
});
$('levelSelectBtn').addEventListener('click', () => {
  seClick();
  stopBGM();
  showScreen('levelScreen');
});

// ── レベル選択 → タイトルへ ──
$('levelBackBtn').addEventListener('click', () => {
  seClick();
  showScreen('titleScreen');
});

// ── ゲーム中 → 終了確認ポップアップを表示 ──
$('gameBackBtn').addEventListener('click', () => {
  seClick();
  showQuitOverlay();
});

// 終了確認：つづける
$('quitContinueBtn').addEventListener('click', () => {
  seClick();
  hideQuitOverlay();
});

// 終了確認：おわる → 結果画面へ
$('quitEndBtn').addEventListener('click', () => {
  seClick();
  hideQuitOverlay();
  stopFloating();
  stopBGM();
  if (window.speechSynthesis) window.speechSynthesis.cancel();
  showResult();
});

// ── ミュート ──
$('muteBtn').addEventListener('click', toggleMute);

// ============================================================
// 終了確認ポップアップ制御
// ============================================================
function showQuitOverlay() {
  // 現在の正解数を表示
  $('quitCurrentScore').textContent = score;
  // 浮遊アニメーションを一時停止（背景は維持）
  if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
  $('quitOverlay').style.display = 'flex';
}

function hideQuitOverlay() {
  $('quitOverlay').style.display = 'none';
  // 浮遊アニメーションを再開
  if (floatChars.length > 0) {
    function loop() {
      floatChars.forEach(fc => fc.update());
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
  }
}

// ============================================================
// 初期化
// ============================================================
buildBgDeco();
