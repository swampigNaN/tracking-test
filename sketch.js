let handPose;
let video;
let hands = [];
let particles = []; // 火花の粒
let fireworks = []; // 打ち上げ花火

function preload() {
    // 手の検知モデルをロード
    handPose = ml5.handPose();
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    video = createCapture(VIDEO);
    video.size(640, 480);
    video.hide();
    
    // 手の検知を開始
    handPose.detectStart(video, (results) => {
        hands = results;
        document.getElementById('loading').style.display = 'none';
    });
}

function draw() {
    // 映像を背景に描画（左右反転）
    push();
    translate(width, 0);
    scale(-1, 1);
    // 画面いっぱいに広がるようにアスペクト比を調整して描画
    let videoAspect = video.width / video.height;
    let windowAspect = width / height;
    if (windowAspect > videoAspect) {
        image(video, 0, 0, width, width / videoAspect);
    } else {
        image(video, -(height * videoAspect - width) / 2, 0, height * videoAspect, height);
    }
    pop();

    // 画面全体を少し暗くしてエフェクトを際立たせる（残像エフェクト）
    background(0, 0, 0, 100);

    // 手が見つかった時の処理
    if (hands.length > 0) {
        for (let hand of hands) {
            let indexTip = hand.keypoints[8]; // 人差し指の先
            let thumbTip = hand.keypoints[4]; // 親指の先

            // 1. 人差し指の先に「魔法の粉」を出す
            for (let i = 0; i < 3; i++) {
                particles.push(new Particle(indexTip.x, indexTip.y, false));
            }

            // 2. 「指パッチン」または「指をくっつける」動作で花火爆発
            let d = dist(indexTip.x, indexTip.y, thumbTip.x, thumbTip.y);
            if (d < 30) { // 指がくっついたら
                createFirework(indexTip.x, indexTip.y);
            }
        }
    }

    // 火花の更新と描画
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].show();
        if (particles[i].finished()) {
            particles.splice(i, 1);
        }
    }
}

// ウィンドウサイズが変わった時の調整
function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// 花火を発生させる関数
function createFirework(x, y) {
    let col = color(random(255), random(255), random(255));
    for (let i = 0; i < 50; i++) {
        particles.push(new Particle(x, y, true, col));
    }
}

// 火花の粒のクラス
class Particle {
    constructor(x, y, isExplosion, col) {
        // カメラ座標(640x480)から画面座標へ変換（反転考慮）
        this.x = map(x, 640, 0, 0, width);
        this.y = map(y, 0, 480, 0, height);
        
        if (isExplosion) {
            this.vx = random(-10, 10);
            this.vy = random(-10, 10);
            this.color = col;
            this.alpha = 255;
        } else {
            this.vx = random(-2, 2);
            this.vy = random(-2, 2);
            this.color = color(255, 200, 0); // 基本は金色
            this.alpha = 200;
        }
        this.gravity = 0.15;
    }

    finished() {
        return this.alpha < 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.alpha -= 5;
    }

    show() {
        noStroke();
        fill(red(this.color), green(this.color), blue(this.color), this.alpha);
        ellipse(this.x, this.y, 8);
    }
}
