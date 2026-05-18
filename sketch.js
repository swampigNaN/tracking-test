// ============================================
// Hand Magic - p5.js + ml5.js Sketch
// ============================================

let handPose;
let video;
let hands = [];
let particles = [];
let trailPoints = [];
let currentEffect = 'sparkle';
let modelReady = false;
let frameCountForFps = 0;
let lastFpsUpdate = 0;
let currentFps = 0;
let isMobile = false;
let showDebug = true; // デバッグ表示（最初はONにして確認しやすくする）

// 指先のキーポイントインデックス
const FINGERTIP_INDICES = [4, 8, 12, 16, 20];
// 手首
const WRIST_INDEX = 0;
// 手のひら中心（近似: 9番 = 中指の付け根）
const PALM_INDEX = 9;

// エフェクトのカラーパレット
const PALETTES = {
  sparkle: [
    [255, 220, 100],   // ゴールド
    [255, 180, 255],   // ピンク
    [180, 220, 255],   // ライトブルー
    [255, 255, 255],   // ホワイト
    [200, 160, 255],   // ラベンダー
  ],
  fire: [
    [255, 80, 20],     // レッドオレンジ
    [255, 160, 10],    // オレンジ
    [255, 220, 50],    // イエロー
    [255, 40, 10],     // ディープレッド
    [255, 120, 0],     // アンバー
  ],
  galaxy: [
    [120, 80, 255],    // パープル
    [60, 140, 255],    // ブルー
    [180, 100, 255],   // ライラック
    [40, 200, 255],    // シアン
    [255, 255, 255],   // ホワイト（星）
  ],
  sakura: [
    [255, 183, 197],   // ライトピンク
    [255, 150, 180],   // ピンク
    [255, 220, 230],   // ペールピンク
    [255, 200, 210],   // ソフトピンク
    [255, 255, 255],   // ホワイト
  ],
  lightning: [
    [100, 180, 255],   // エレクトリックブルー
    [200, 220, 255],   // ライトニングホワイト
    [140, 100, 255],   // パープル
    [255, 255, 255],   // ホワイト
    [80, 200, 255],    // シアン
  ],
};

// ============================================
// p5.js ライフサイクル
// ============================================

function preload() {
  // ml5 handPoseモデルをプリロード（カメラより先に読み込んでおく）
  handPose = ml5.handPose({ flipped: true });
}

function setup() {
  // モバイル判定
  isMobile = detectMobile();

  const cnv = createCanvas(windowWidth, windowHeight);
  cnv.parent(document.body);

  // 描画設定
  colorMode(RGB, 255);
  textFont('Outfit');

  // エフェクトボタンのイベントリスナー
  setupEffectButtons();

  // iOS Safari: スクロール・バウンス防止
  preventMobileScroll();

  // ===================================================
  // iOS Safari対応: ユーザー操作（タップ）後にカメラ起動
  // iOS Safariはユーザー操作なしにgetUserMediaを呼べない
  // ===================================================
  const btnStart = document.getElementById('btn-start');
  const btnRetry = document.getElementById('btn-retry');

  btnStart.addEventListener('click', startCamera);
  btnRetry.addEventListener('click', startCamera);
}

// カメラ起動関数（ユーザー操作後に呼ぶ）
async function startCamera() {
  // スタート画面 → ローディング画面に切り替え
  document.getElementById('start-screen').style.display = 'none';
  document.getElementById('error-screen').style.display = 'none';
  document.getElementById('loading-screen').style.display = 'block';

  try {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("ブラウザがカメラをブロックしているか、安全な接続(HTTPS)ではありません。");
    }

    // getUserMedia直接呼び出し（p5.jsのcreateCaptureより確実）
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: 'user',       // フロントカメラ
        width:  { ideal: 1280 },  // HD解像度（MediaPipe推奨）
        height: { ideal: 720 },
        frameRate: { ideal: 30 }
      },
      audio: false
    });

    // ネイティブvideoElementを作成（iOS必須属性を確実に付ける）
    const videoEl = document.createElement('video');
    videoEl.srcObject = stream;
    videoEl.setAttribute('autoplay', '');
    videoEl.setAttribute('playsinline', '');        // iOS Safari必須
    videoEl.setAttribute('webkit-playsinline', ''); // 古いiOS向け
    videoEl.setAttribute('muted', '');
    videoEl.muted = true;
    videoEl.style.display = 'none';
    document.body.appendChild(videoEl);

    // 動画が再生可能になるまで待つ
    await new Promise((resolve, reject) => {
      videoEl.oncanplay = resolve;
      videoEl.onerror = reject;
      videoEl.play().catch(reject);
    });

    // p5.jsのvideoオブジェクトとしてラップ
    video = createElementFromVideo(videoEl);

    // ml5 handPoseに渡して検出開始
    handPose.detectStart(videoEl, gotHands);

    // ローディング画面はgotHands()で消える
  } catch (err) {
    // エラー処理
    console.error('Camera error:', err);
    showCameraError(err);
  }
}

// ネイティブvideoElementをp5.jsのimage()で使えるようにする
function createElementFromVideo(videoEl) {
  // p5.jsのcreateElementラッパーを使う
  const p5video = createVideo('');
  p5video.elt.replaceWith(videoEl);
  p5video.elt = videoEl;
  p5video.width  = videoEl.videoWidth  || 1280;
  p5video.height = videoEl.videoHeight || 720;
  return p5video;
}

// エラー表示
function showCameraError(err) {
  document.getElementById('loading-screen').style.display = 'none';
  document.getElementById('error-screen').style.display = 'block';

  const msgEl = document.getElementById('error-message');
  if (err.name === 'NotAllowedError') {
    msgEl.textContent = 'カメラの使用が拒否されました。\nSafari設定からカメラを許可してください。';
  } else if (err.name === 'NotFoundError') {
    msgEl.textContent = 'カメラが見つかりません。';
  } else if (err.name === 'NotReadableError') {
    msgEl.textContent = 'カメラが他のアプリで使用中です。';
  } else {
    msgEl.textContent = `エラー: ${err.message}`;
  }
}

function draw() {
  // 半透明の黒で残像効果
  background(10, 10, 15, 40);

  // カメラの準備が完了していない場合は処理をスキップ（エラー回避）
  if (!video) return;

  // ==========================================
  // カメラ映像のアスペクト比を保ちながら全画面表示
  // ==========================================
  const aspectRatio = (video.width > 0 ? video.width : 640) / (video.height > 0 ? video.height : 480);
  let vw = width;
  let vh = width / aspectRatio;
  if (vh < height) {
    vh = height;
    vw = height * aspectRatio;
  }
  const vx = (width - vw) / 2;
  const vy = (height - vh) / 2;

  // 映像を左右ミラー反転して描画（自撮り鏡の自然な見え方）
  push();
  tint(255, 60);
  translate(width, 0);
  scale(-1, 1);
  // ミラー反転後の座標系でのx位置を計算
  image(video, width - vx - vw, vy, vw, vh);
  pop();

  // ==========================================
  // handPoseはflipped:trueで座標が既にミラー済み
  // → 映像と同じ座標系（左=左、右=右）で使える
  // ==========================================
  const scaleX = vw / (video.width > 0 ? video.width : 640);
  const scaleY = vh / (video.height > 0 ? video.height : 480);
  const offsetX = vx;
  const offsetY = vy;

  // 検出された手からパーティクルを生成
  for (let i = 0; i < hands.length; i++) {
    const hand = hands[i];
    const keypoints = hand.keypoints;

    // 指先からエフェクトを発生
    for (let fi = 0; fi < FINGERTIP_INDICES.length; fi++) {
      const idx = FINGERTIP_INDICES[fi];
      const kp = keypoints[idx];
      const sx = kp.x * scaleX + offsetX;
      const sy = kp.y * scaleY + offsetY;

      // エフェクトごとにパーティクルを生成
      spawnParticles(sx, sy, fi);
    }

    // 手のひらにもエフェクト
    const palm = keypoints[PALM_INDEX];
    const palmX = palm.x * scaleX + offsetX;
    const palmY = palm.y * scaleY + offsetY;
    spawnPalmEffect(palmX, palmY);

    // 雷光エフェクトの場合、指先間に電撃を描画
    if (currentEffect === 'lightning') {
      drawLightning(keypoints, scaleX, scaleY, offsetX, offsetY);
    }

    // 手の輪郭グロー
    drawHandGlow(keypoints, scaleX, scaleY, offsetX, offsetY);

    // デバッグ用のキーポイント描画（認識確認用）
    if (showDebug) {
      drawDebugKeypoints(keypoints, scaleX, scaleY, offsetX, offsetY);
    }
  }

  // パーティクルの更新と描画
  updateAndDrawParticles();

  // FPS計算
  updateFps();

  // ステータス更新
  updateStatus();
}

function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}

// ============================================
// 手の検出コールバック
// ============================================

function gotHands(results) {
  hands = results;

  // モデル準備完了を示す
  if (!modelReady) {
    modelReady = true;
    const overlay = document.getElementById('loading-overlay');
    if (overlay) overlay.classList.add('hidden');
  }
}

// ============================================
// パーティクルシステム
// ============================================

class Particle {
  constructor(x, y, options = {}) {
    this.x = x;
    this.y = y;
    this.vx = options.vx || random(-2, 2);
    this.vy = options.vy || random(-3, -0.5);
    this.life = options.life || random(40, 80);
    this.maxLife = this.life;
    this.size = options.size || random(3, 8);
    this.color = options.color || [255, 255, 255];
    this.type = options.type || 'circle';
    this.rotation = random(TWO_PI);
    this.rotSpeed = random(-0.1, 0.1);
    this.gravity = options.gravity !== undefined ? options.gravity : 0.02;
    this.friction = options.friction || 0.99;
    this.glow = options.glow || false;
    this.trail = options.trail || false;
    this.prevX = x;
    this.prevY = y;
  }

  update() {
    this.prevX = this.x;
    this.prevY = this.y;
    this.vx *= this.friction;
    this.vy *= this.friction;
    this.vy += this.gravity;
    this.x += this.vx;
    this.y += this.vy;
    this.life--;
    this.rotation += this.rotSpeed;
  }

  draw() {
    const alpha = map(this.life, 0, this.maxLife, 0, 255);
    const sz = map(this.life, 0, this.maxLife, 0, this.size);

    push();
    translate(this.x, this.y);
    rotate(this.rotation);
    noStroke();

    // グロー効果
    if (this.glow) {
      const glowSize = sz * 3;
      const glowAlpha = alpha * 0.15;
      fill(this.color[0], this.color[1], this.color[2], glowAlpha);
      ellipse(0, 0, glowSize, glowSize);
    }

    fill(this.color[0], this.color[1], this.color[2], alpha);

    switch (this.type) {
      case 'circle':
        ellipse(0, 0, sz, sz);
        break;
      case 'star':
        drawStar(0, 0, sz * 0.4, sz, 5);
        break;
      case 'petal':
        drawPetal(0, 0, sz);
        break;
      case 'spark':
        strokeWeight(1.5);
        stroke(this.color[0], this.color[1], this.color[2], alpha);
        line(-sz * 0.5, 0, sz * 0.5, 0);
        line(0, -sz * 0.5, 0, sz * 0.5);
        noStroke();
        ellipse(0, 0, sz * 0.3, sz * 0.3);
        break;
      case 'ember':
        ellipse(0, 0, sz, sz * 1.4);
        break;
      default:
        ellipse(0, 0, sz, sz);
    }

    // トレイル描画
    if (this.trail) {
      stroke(this.color[0], this.color[1], this.color[2], alpha * 0.3);
      strokeWeight(sz * 0.3);
      line(0, 0, this.prevX - this.x, this.prevY - this.y);
      noStroke();
    }

    pop();
  }

  isDead() {
    return this.life <= 0;
  }
}

// ============================================
// エフェクト生成関数
// ============================================

function spawnParticles(x, y, fingerIndex) {
  const palette = PALETTES[currentEffect];
  const col = random(palette);

  switch (currentEffect) {
    case 'sparkle':
      spawnSparkle(x, y, col, fingerIndex);
      break;
    case 'fire':
      spawnFire(x, y, col);
      break;
    case 'galaxy':
      spawnGalaxy(x, y, col, fingerIndex);
      break;
    case 'sakura':
      spawnSakura(x, y, col);
      break;
    case 'lightning':
      spawnLightningParticle(x, y, col);
      break;
  }
}

function spawnSparkle(x, y, col, fingerIndex) {
  if (frameCount % 2 !== 0) return;
  const angle = random(TWO_PI);
  const speed = random(1, 4);
  particles.push(new Particle(x + random(-5, 5), y + random(-5, 5), {
    vx: cos(angle) * speed,
    vy: sin(angle) * speed,
    life: random(30, 60),
    size: random(3, 10),
    color: col,
    type: random() > 0.5 ? 'star' : 'circle',
    gravity: -0.03,
    glow: true,
    friction: 0.97,
  }));
}

function spawnFire(x, y, col) {
  for (let i = 0; i < 2; i++) {
    particles.push(new Particle(x + random(-8, 8), y + random(-3, 3), {
      vx: random(-1.5, 1.5),
      vy: random(-5, -1.5),
      life: random(20, 50),
      size: random(4, 14),
      color: col,
      type: 'ember',
      gravity: -0.08,
      glow: true,
      friction: 0.96,
    }));
  }
}

function spawnGalaxy(x, y, col, fingerIndex) {
  if (frameCount % 2 !== 0) return;
  const angle = (frameCount * 0.05) + (fingerIndex * TWO_PI / 5);
  const orbitRadius = random(5, 25);
  const ox = cos(angle) * orbitRadius;
  const oy = sin(angle) * orbitRadius;
  particles.push(new Particle(x + ox, y + oy, {
    vx: cos(angle + HALF_PI) * random(0.5, 2),
    vy: sin(angle + HALF_PI) * random(0.5, 2),
    life: random(40, 80),
    size: random() > 0.9 ? random(5, 10) : random(1.5, 5),
    color: col,
    type: random() > 0.8 ? 'star' : 'circle',
    gravity: 0,
    glow: true,
    friction: 0.985,
    trail: true,
  }));
}

function spawnSakura(x, y, col) {
  if (frameCount % 4 !== 0) return;
  particles.push(new Particle(x + random(-15, 15), y + random(-10, 10), {
    vx: random(-1, 1),
    vy: random(0.5, 2),
    life: random(60, 120),
    size: random(6, 14),
    color: col,
    type: 'petal',
    gravity: 0.01,
    glow: false,
    friction: 0.995,
  }));
}

function spawnLightningParticle(x, y, col) {
  if (frameCount % 3 !== 0) return;
  particles.push(new Particle(x + random(-3, 3), y + random(-3, 3), {
    vx: random(-3, 3),
    vy: random(-3, 3),
    life: random(8, 20),
    size: random(2, 6),
    color: col,
    type: 'spark',
    gravity: 0,
    glow: true,
    friction: 0.92,
  }));
}

function spawnPalmEffect(x, y) {
  const palette = PALETTES[currentEffect];
  const col = random(palette);

  if (currentEffect === 'sparkle' || currentEffect === 'galaxy') {
    // 手のひらにオーラリング
    if (frameCount % 6 === 0) {
      const angle = random(TWO_PI);
      const radius = random(15, 35);
      particles.push(new Particle(x + cos(angle) * radius, y + sin(angle) * radius, {
        vx: cos(angle) * 0.3,
        vy: sin(angle) * 0.3,
        life: random(20, 40),
        size: random(2, 5),
        color: col,
        type: 'circle',
        gravity: 0,
        glow: true,
        friction: 0.98,
      }));
    }
  }

  if (currentEffect === 'fire') {
    // 手のひらに大きな炎
    if (frameCount % 3 === 0) {
      particles.push(new Particle(x + random(-12, 12), y + random(-5, 5), {
        vx: random(-0.8, 0.8),
        vy: random(-4, -1),
        life: random(15, 35),
        size: random(8, 20),
        color: col,
        type: 'ember',
        gravity: -0.1,
        glow: true,
        friction: 0.95,
      }));
    }
  }
}

// ============================================
// 雷光エフェクト - 指先間に電撃
// ============================================

function drawLightning(keypoints, scaleX, scaleY, offsetX, offsetY) {
  const palette = PALETTES.lightning;

  // 指先同士を電撃で接続
  for (let i = 0; i < FINGERTIP_INDICES.length; i++) {
    for (let j = i + 1; j < FINGERTIP_INDICES.length; j++) {
      if (random() > 0.7) continue; // ランダムに間引く

      const kp1 = keypoints[FINGERTIP_INDICES[i]];
      const kp2 = keypoints[FINGERTIP_INDICES[j]];
      const x1 = kp1.x * scaleX + offsetX;
      const y1 = kp1.y * scaleY + offsetY;
      const x2 = kp2.x * scaleX + offsetX;
      const y2 = kp2.y * scaleY + offsetY;

      const col = random(palette);
      drawLightningBolt(x1, y1, x2, y2, col, 3);
    }
  }
}

function drawLightningBolt(x1, y1, x2, y2, col, depth) {
  if (depth <= 0) {
    stroke(col[0], col[1], col[2], 200);
    strokeWeight(1);
    line(x1, y1, x2, y2);
    return;
  }

  const midX = (x1 + x2) / 2 + random(-20, 20);
  const midY = (y1 + y2) / 2 + random(-20, 20);

  // メインの電撃
  push();
  stroke(col[0], col[1], col[2], 180);
  strokeWeight(depth * 0.8);
  noFill();
  line(x1, y1, midX, midY);
  line(midX, midY, x2, y2);

  // グロー
  stroke(col[0], col[1], col[2], 40);
  strokeWeight(depth * 3);
  line(x1, y1, midX, midY);
  line(midX, midY, x2, y2);
  pop();

  // 分岐
  if (random() > 0.6 && depth > 1) {
    const branchX = midX + random(-30, 30);
    const branchY = midY + random(-30, 30);
    drawLightningBolt(midX, midY, branchX, branchY, col, depth - 1);
  }
}

// ============================================
// 手のグロー描画
// ============================================

function drawHandGlow(keypoints, scaleX, scaleY, offsetX, offsetY) {
  const palette = PALETTES[currentEffect];
  const baseAlpha = 30 + sin(frameCount * 0.05) * 15;

  // 指先にグローポイント
  for (let fi = 0; fi < FINGERTIP_INDICES.length; fi++) {
    const idx = FINGERTIP_INDICES[fi];
    const kp = keypoints[idx];
    const sx = kp.x * scaleX + offsetX;
    const sy = kp.y * scaleY + offsetY;

    const col = palette[fi % palette.length];
    const pulseSize = 20 + sin(frameCount * 0.08 + fi) * 8;

    push();
    noStroke();
    // 外側グロー
    fill(col[0], col[1], col[2], baseAlpha * 0.3);
    ellipse(sx, sy, pulseSize * 2.5, pulseSize * 2.5);
    // 内側グロー
    fill(col[0], col[1], col[2], baseAlpha * 0.6);
    ellipse(sx, sy, pulseSize * 1.2, pulseSize * 1.2);
    // コアポイント
    fill(col[0], col[1], col[2], baseAlpha * 1.5);
    ellipse(sx, sy, 6, 6);
    pop();
  }

  // 手のスケルトンラインをうっすら描画
  const connections = [
    [0, 1], [1, 2], [2, 3], [3, 4],       // 親指
    [0, 5], [5, 6], [6, 7], [7, 8],       // 人差し指
    [0, 9], [9, 10], [10, 11], [11, 12],  // 中指
    [0, 13], [13, 14], [14, 15], [15, 16], // 薬指
    [0, 17], [17, 18], [18, 19], [19, 20], // 小指
    [5, 9], [9, 13], [13, 17],             // 手のひら横断
  ];

  push();
  strokeWeight(1.5);
  for (const [a, b] of connections) {
    const kpA = keypoints[a];
    const kpB = keypoints[b];
    const ax = kpA.x * scaleX + offsetX;
    const ay = kpA.y * scaleY + offsetY;
    const bx = kpB.x * scaleX + offsetX;
    const by = kpB.y * scaleY + offsetY;

    const col = palette[0];
    stroke(col[0], col[1], col[2], baseAlpha * 0.8);
    line(ax, ay, bx, by);
  }
  pop();
}

// ============================================
// デバッグ用キーポイント描画（認識確認用）
// ============================================

function drawDebugKeypoints(keypoints, scaleX, scaleY, offsetX, offsetY) {
  push();
  // 認識されているすべてのポイント（21箇所）に明確な緑色の点を打つ
  for (let i = 0; i < keypoints.length; i++) {
    const kp = keypoints[i];
    const sx = kp.x * scaleX + offsetX;
    const sy = kp.y * scaleY + offsetY;
    
    fill(0, 255, 0); // 鮮やかな緑
    stroke(255);     // 白枠
    strokeWeight(1.5);
    ellipse(sx, sy, 10, 10); // 分かりやすい大きさ
    
    // 番号も小さく表示
    fill(255);
    noStroke();
    textSize(12);
    textAlign(CENTER, BOTTOM);
    text(i, sx, sy - 8);
  }
  pop();
}

// ============================================
// パーティクル更新 & 描画
// ============================================

function updateAndDrawParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].draw();
    if (particles[i].isDead()) {
      particles.splice(i, 1);
    }
  }

  // パーティクル上限（モバイルでは軽量化）
  const maxParticles = isMobile ? 400 : 800;
  if (particles.length > maxParticles) {
    particles.splice(0, particles.length - maxParticles);
  }
}

// ============================================
// ヘルパー描画関数
// ============================================

function drawStar(x, y, innerRadius, outerRadius, points) {
  const angleStep = TWO_PI / points;
  const halfStep = angleStep / 2;
  beginShape();
  for (let i = 0; i < points; i++) {
    const angle = -HALF_PI + i * angleStep;
    vertex(x + cos(angle) * outerRadius, y + sin(angle) * outerRadius);
    vertex(x + cos(angle + halfStep) * innerRadius, y + sin(angle + halfStep) * innerRadius);
  }
  endShape(CLOSE);
}

function drawPetal(x, y, size) {
  push();
  beginShape();
  for (let angle = 0; angle < TWO_PI; angle += 0.1) {
    const r = size * (0.5 + 0.5 * sin(angle * 2.5));
    vertex(cos(angle) * r, sin(angle) * r);
  }
  endShape(CLOSE);
  pop();
}

// ============================================
// UI
// ============================================

function setupEffectButtons() {
  const buttons = document.querySelectorAll('.effect-btn:not(.debug-btn)');
  buttons.forEach(btn => {
    btn.addEventListener('click', () => {
      // 全ボタンのactiveを外す
      buttons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentEffect = btn.dataset.effect;

      // エフェクト変更時にパーティクルをクリア
      particles = [];
    });
  });

  const debugBtn = document.getElementById('btn-debug');
  if (debugBtn) {
    if (showDebug) debugBtn.classList.add('active');
    debugBtn.addEventListener('click', () => {
      showDebug = !showDebug;
      if (showDebug) {
        debugBtn.classList.add('active');
      } else {
        debugBtn.classList.remove('active');
      }
    });
  }
}

function updateFps() {
  frameCountForFps++;
  const now = millis();
  if (now - lastFpsUpdate > 500) {
    currentFps = Math.round(frameCountForFps / ((now - lastFpsUpdate) / 1000));
    frameCountForFps = 0;
    lastFpsUpdate = now;
  }

  const fpsEl = document.getElementById('fps-counter');
  if (fpsEl) {
    fpsEl.textContent = `FPS: ${currentFps}`;
  }
}

function updateStatus() {
  const statusEl = document.getElementById('hand-status');
  if (!statusEl) return;

  if (hands.length > 0) {
    statusEl.textContent = `🖐️ ${hands.length}つの手を検出中`;
    statusEl.classList.add('detected');
  } else {
    statusEl.textContent = '🖐️ カメラに手をかざしてください';
    statusEl.classList.remove('detected');
  }
}

// ============================================
// モバイル対応ユーティリティ
// ============================================

function detectMobile() {
  return /Android|iPhone|iPad|iPod|webOS|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
    || ('ontouchstart' in window)
    || (navigator.maxTouchPoints > 0);
}

function preventMobileScroll() {
  // キャンバス上のタッチスクロール・ズームを防止
  document.body.addEventListener('touchmove', function(e) {
    // ボタンエリア内のタッチは許可
    if (e.target.closest('#controls-panel')) return;
    e.preventDefault();
  }, { passive: false });

  // ダブルタップズーム防止
  let lastTouchEnd = 0;
  document.body.addEventListener('touchend', function(e) {
    const now = Date.now();
    if (now - lastTouchEnd <= 300) {
      e.preventDefault();
    }
    lastTouchEnd = now;
  }, { passive: false });
}
