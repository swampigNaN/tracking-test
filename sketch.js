let handPose;
let video;
let hands = [];
let particles = [];
let isVideoStarted = false;

function preload() {
    // AIモデルのロード
    handPose = ml5.handPose();
}

function setup() {
    createCanvas(windowWidth, windowHeight);
    
    // スマホのインカメラを優先的に起動する設定
    const constraints = {
        video: {
            facingMode: "user",
            width: 640,
            height: 480
        }
    };
    
    video = createCapture(constraints, function(stream) {
        isVideoStarted = true;
    });
    video.size(640, 480);
    video.hide();
    
    // 手の検知開始
    handPose.detectStart(video, (results) => {
        hands = results;
        document.getElementById('loading').style.display = 'none';
    });
}

function draw() {
    // 鏡合わせの描画処理
    push();
    translate(width, 0);
    scale(-1, 1);
    
    let videoAspect = video.width / video.height;
    let windowAspect = width / height;
    let x, y, w, h;
    if (windowAspect > videoAspect) {
        w = width;
        h = width / videoAspect;
        x = 0;
        y = (height - h) / 2;
    } else {
        w = height * videoAspect;
        h = height;
        x = (width - w) / 2;
        y = 0;
    }
    image(video, x, y, w, h);
    pop();

    // 画面を少し暗くして残像を作る
    background(0, 0, 0, 120);

    if (hands.length > 0) {
        for (let hand of hands) {
            // 人差し指(index_finger_tip)と親指(thumb_tip)の座標
            let indexTip = hand.keypoints[8];
            let thumbTip = hand.keypoints[4];

            // 1. 人差し指から常に粉を出す
            for (let i = 0; i < 2; i++) {
                particles.push(new Particle(indexTip.x, indexTip.y, false));
            }

            // 2. 指をくっつけると爆発
            let d = dist(indexTip.x, indexTip.y, thumbTip.x, thumbTip.y);
            if (d < 35) { // 35ピクセル以内なら「接触」と判定
                createFirework(indexTip.x, indexTip.y);
            }
        }
    }

    // パーティクルの更新と表示
    for (let i = particles.length - 1; i >= 0; i--) {
        particles[i].update();
        particles[i].show();
        if (particles[i].finished()) {
            particles.splice(i, 1);
        }
    }
}

// 指をくっつけたときのエフェクト
function createFirework(x, y) {
    let col = color(random(100, 255), random(100, 255), random(255));
    for (let i = 0; i < 20; i++) {
        particles.push(new Particle(x, y, true, col));
    }
}

function windowResized() {
    resizeCanvas(windowWidth, windowHeight);
}

// iPhone対策：画面タップでビデオを確実に再生
function mousePressed() {
    if (video) {
        video.play();
    }
}

// 物理演算クラス
class Particle {
    constructor(x, y, isExplosion, col) {
        // カメラの座標(640x480)を画面サイズに変換
        this.x = map(x, 640, 0, 0, width);
        this.y = map(y, 0, 480, 0, height);
        
        if (isExplosion) {
            this.vx = random(-8, 8);
            this.vy = random(-8, 8);
            this.color = col;
        } else {
            this.vx = random(-1, 1);
            this.vy = random(-1, 1);
            this.color = color(255, 215, 0); // 金色
        }
        this.gravity = 0.15;
        this.alpha = 255;
    }

    finished() {
        return this.alpha < 0;
    }

    update() {
        this.x += this.vx;
        this.y += this.vy;
        this.vy += this.gravity;
        this.alpha -= 7;
    }

    show() {
        noStroke();
        fill(red(this.color), green(this.color), blue(this.color), this.alpha);
        ellipse(this.x, this.y, 8);
    }
}
