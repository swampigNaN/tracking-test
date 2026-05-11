<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Hand Magic</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { background: #000; overflow: hidden; }
  #loading {
    position: fixed; top: 50%; left: 50%;
    transform: translate(-50%, -50%);
    color: #fff; font-size: 18px;
    font-family: sans-serif; text-align: center;
    z-index: 100; pointer-events: none;
  }
  .dot { display: inline-block; animation: blink 1.2s infinite; }
  .dot:nth-child(2) { animation-delay: 0.4s; }
  .dot:nth-child(3) { animation-delay: 0.8s; }
  @keyframes blink { 0%,80%,100%{opacity:0} 40%{opacity:1} }
</style>
</head>
<body>
<div id="loading">
  手を検出中<span class="dot">●</span><span class="dot">●</span><span class="dot">●</span>
</div>
<script src="https://cdnjs.cloudflare.com/ajax/libs/p5.js/1.9.0/p5.min.js"></script>
<script src="https://unpkg.com/ml5@1/dist/ml5.min.js"></script>
<script>
let handPose;
let video;
let hands = [];
let particles = [];
let rings = [];
let bolts = [];
let auras = [];
let frameCount2 = 0;
let isVideoStarted = false;
 
// 指先インデックス: 親指4, 人差し指8, 中指12, 薬指16, 小指20
const FINGERTIPS = [4, 8, 12, 16, 20];
const PALM_CENTER = 9; // 中指MCP（手のひら中心に近い）
 
function preload() {
  handPose = ml5.handPose({ maxHands: 2 });
}
 
function setup() {
  createCanvas(windowWidth, windowHeight);
  colorMode(RGB, 255, 255, 255, 255);
 
  const constraints = {
    video: { facingMode: "user", width: 640, height: 480 }
  };
 
  video = createCapture(constraints, function(stream) {
    isVideoStarted = true;
  });
  video.size(640, 480);
  video.hide();
 
  handPose.detectStart(video, (results) => {
    hands = results;
    if (results.length > 0) {
      document.getElementById('loading').style.display = 'none';
    }
  });
}
 
// 座標変換（ミラー対応）
function mx(x) { return map(x, 640, 0, 0, width); }
function my(y) { return map(y, 0, 480, 0, height); }
 
function draw() {
  frameCount2++;
 
  // カメラ映像をミラー描画
  push();
  translate(width, 0);
  scale(-1, 1);
  let va = video.width / video.height;
  let wa = width / height;
  let x, y, w, h;
  if (wa > va) {
    w = width; h = width / va;
    x = 0; y = (height - h) / 2;
  } else {
    w = height * va; h = height;
    x = (width - w) / 2; y = 0;
  }
  image(video, x, y, w, h);
  pop();
 
  // 残像エフェクト（少し暗め）
  background(0, 0, 0, 100);
 
  if (hands.length > 0) {
    for (let hand of hands) {
      let kp = hand.keypoints;
 
      // ── 手のひら中心座標 ──
      let palmX = mx(kp[PALM_CENTER].x);
      let palmY = my(kp[PALM_CENTER].y);
 
      // ── 1. 手が見えたら毎フレーム: オーラ放出 ──
      auras.push(new Aura(palmX, palmY));
 
      // ── 2. 一定間隔でショックウェーブリング ──
      if (frameCount2 % 12 === 0) {
        rings.push(new Ring(palmX, palmY, random(200, 400)));
      }
 
      // ── 3. 全指先からパーティクル放出 ──
      for (let idx of FINGERTIPS) {
        let fx = mx(kp[idx].x);
        let fy = my(kp[idx].y);
        for (let i = 0; i < 3; i++) {
          particles.push(new Particle(fx, fy, false, null));
        }
      }
 
      // ── 4. 指先間にエネルギー稲妻 ──
      if (frameCount2 % 6 === 0) {
        let tips = FINGERTIPS.map(i => ({ x: mx(kp[i].x), y: my(kp[i].y) }));
        // 隣接する指先をランダムに選んでボルト
        let a = tips[floor(random(tips.length))];
        let b = tips[floor(random(tips.length))];
        if (a !== b) bolts.push(new Bolt(a.x, a.y, b.x, b.y));
      }
 
      // ── 5. 手のひらに巨大輝体（グロウ球） ──
      drawPalmOrb(palmX, palmY);
 
      // ── 6. 指先のグロウ ──
      for (let idx of FINGERTIPS) {
        let fx = mx(kp[idx].x);
        let fy = my(kp[idx].y);
        drawFingerGlow(fx, fy);
      }
 
      // ── 7. ピンチで爆発（既存）──
      let indexTip = kp[8];
      let thumbTip = kp[4];
      let d = dist(mx(indexTip.x), my(indexTip.y), mx(thumbTip.x), my(thumbTip.y));
      if (d < 35) {
        createFirework(mx(indexTip.x), my(indexTip.y));
        // ピンチ時は超大リング追加
        if (frameCount2 % 3 === 0) {
          rings.push(new Ring(mx(indexTip.x), my(indexTip.y), random(400, 700)));
        }
      }
    }
  }
 
  // ── オーラ更新 ──
  for (let i = auras.length - 1; i >= 0; i--) {
    auras[i].update();
    auras[i].show();
    if (auras[i].finished()) auras.splice(i, 1);
  }
 
  // ── リング更新 ──
  for (let i = rings.length - 1; i >= 0; i--) {
    rings[i].update();
    rings[i].show();
    if (rings[i].finished()) rings.splice(i, 1);
  }
 
  // ── 稲妻更新 ──
  for (let i = bolts.length - 1; i >= 0; i--) {
    bolts[i].show();
    bolts.splice(i, 1);
  }
 
  // ── パーティクル更新 ──
  for (let i = particles.length - 1; i >= 0; i--) {
    particles[i].update();
    particles[i].show();
    if (particles[i].finished()) particles.splice(i, 1);
  }
 
  // パーティクル上限（パフォーマンス対策）
  if (particles.length > 800) particles.splice(0, particles.length - 800);
  if (rings.length > 30) rings.splice(0, rings.length - 30);
  if (auras.length > 60) auras.splice(0, auras.length - 60);
}
 
// 手のひらのグロウ球
function drawPalmOrb(x, y) {
  let t = frameCount2 * 0.05;
  let baseR = 60 + sin(t) * 20;
  noFill();
  for (let r = baseR; r > 0; r -= 8) {
    let a = map(r, 0, baseR, 160, 0);
    let hue = (frameCount2 * 3 + r * 2) % 360;
    stroke(hslToRgb(hue, 100, 70, a));
    strokeWeight(3);
    ellipse(x, y, r * 2);
  }
  // 中心輝点
  noStroke();
  fill(255, 255, 255, 180);
  ellipse(x, y, 16);
}
 
// 指先グロウ
function drawFingerGlow(x, y) {
  noStroke();
  for (let r = 30; r > 0; r -= 6) {
    let a = map(r, 0, 30, 80, 0);
    fill(180, 220, 255, a);
    ellipse(x, y, r * 2);
  }
  fill(255, 255, 255, 220);
  ellipse(x, y, 8);
}
 
// ピンチ爆発
function createFirework(x, y) {
  let col = color(random(100, 255), random(100, 255), 255);
  for (let i = 0; i < 30; i++) {
    particles.push(new Particle(x, y, true, col));
  }
}
 
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
}
 
function mousePressed() {
  if (video) video.play();
}
 
// HSL→RGBヘルパー
function hslToRgb(h, s, l, a) {
  h /= 360; s /= 100; l /= 100;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1/3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1/3);
  }
  return color(r * 255, g * 255, b * 255, a);
}
function hue2rgb(p, q, t) {
  if (t < 0) t += 1;
  if (t > 1) t -= 1;
  if (t < 1/6) return p + (q - p) * 6 * t;
  if (t < 1/2) return q;
  if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
  return p;
}
 
// ── ショックウェーブリング ──
class Ring {
  constructor(x, y, maxR) {
    this.x = x; this.y = y;
    this.r = 20;
    this.maxR = maxR;
    this.speed = random(6, 14);
    this.alpha = 220;
    this.hue = random(360);
    this.weight = random(2, 5);
  }
  update() {
    this.r += this.speed;
    this.alpha -= 220 / (this.maxR / this.speed);
  }
  show() {
    let c = hslToRgb(this.hue, 100, 70, this.alpha);
    stroke(c);
    strokeWeight(this.weight);
    noFill();
    ellipse(this.x, this.y, this.r * 2);
    // 二重リング
    strokeWeight(this.weight * 0.5);
    let c2 = hslToRgb((this.hue + 30) % 360, 100, 90, this.alpha * 0.5);
    stroke(c2);
    ellipse(this.x, this.y, this.r * 2 - 15);
  }
  finished() { return this.r > this.maxR || this.alpha < 0; }
}
 
// ── オーラ（手のひら周囲を漂う粒子） ──
class Aura {
  constructor(x, y) {
    let angle = random(TWO_PI);
    let d = random(40, 120);
    this.x = x + cos(angle) * d;
    this.y = y + sin(angle) * d;
    this.vx = random(-0.5, 0.5);
    this.vy = random(-2, -0.5);
    this.alpha = random(150, 220);
    this.size = random(4, 12);
    this.hue = random(180, 280); // 青〜紫
  }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.alpha -= 5;
    this.size *= 0.97;
  }
  show() {
    noStroke();
    let c = hslToRgb(this.hue, 100, 75, this.alpha);
    fill(c);
    ellipse(this.x, this.y, this.size);
  }
  finished() { return this.alpha < 0; }
}
 
// ── 稲妻ボルト ──
class Bolt {
  constructor(x1, y1, x2, y2) {
    this.points = this.generateBolt(x1, y1, x2, y2);
    this.hue = random(180, 260);
    this.alpha = 255;
  }
  generateBolt(x1, y1, x2, y2) {
    let pts = [{ x: x1, y: y1 }];
    let steps = floor(random(4, 8));
    for (let i = 1; i < steps; i++) {
      let t = i / steps;
      let bx = lerp(x1, x2, t) + random(-40, 40);
      let by = lerp(y1, y2, t) + random(-40, 40);
      pts.push({ x: bx, y: by });
    }
    pts.push({ x: x2, y: y2 });
    return pts;
  }
  show() {
    let c = hslToRgb(this.hue, 100, 85, this.alpha);
    stroke(c);
    strokeWeight(2);
    noFill();
    beginShape();
    for (let p of this.points) vertex(p.x, p.y);
    endShape();
    // グロウ
    strokeWeight(6);
    let c2 = hslToRgb(this.hue, 100, 95, this.alpha * 0.3);
    stroke(c2);
    beginShape();
    for (let p of this.points) vertex(p.x, p.y);
    endShape();
  }
}
 
// ── パーティクル ──
class Particle {
  constructor(x, y, isExplosion, col) {
    this.x = x;
    this.y = y;
    if (isExplosion) {
      let angle = random(TWO_PI);
      let spd = random(3, 12);
      this.vx = cos(angle) * spd;
      this.vy = sin(angle) * spd;
      this.color = col;
      this.size = random(6, 14);
      this.decay = random(4, 8);
    } else {
      this.vx = random(-1.2, 1.2);
      this.vy = random(-2, 0);
      this.color = color(random(180, 255), random(180, 255), 255);
      this.size = random(3, 8);
      this.decay = random(4, 7);
    }
    this.gravity = 0.12;
    this.alpha = 255;
  }
  finished() { return this.alpha < 0; }
  update() {
    this.x += this.vx;
    this.y += this.vy;
    this.vy += this.gravity;
    this.alpha -= this.decay;
    this.size *= 0.98;
  }
  show() {
    noStroke();
    fill(red(this.color), green(this.color), blue(this.color), this.alpha);
    ellipse(this.x, this.y, this.size);
    // グロウ
    fill(red(this.color), green(this.color), blue(this.color), this.alpha * 0.3);
    ellipse(this.x, this.y, this.size * 2.5);
  }
}
</script>
</body>
</html>
 
