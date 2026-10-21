/* Original pixel-art sprites. No copyrighted characters or tiles. */
(function () {
  const OUT = [92, 48, 62, 255];

  function bake(w, h, draw, ax, ay) {
    const c = document.createElement("canvas");
    c.width = w;
    c.height = h;
    const g = c.getContext("2d", { willReadFrequently: true });
    g.imageSmoothingEnabled = false;
    draw(g);
    outline(g, w, h);
    const cropped = crop(c, ax, ay, 1);
    cropped.flash = silhouette(cropped.img, "#ffffff");
    return cropped;
  }

  function outline(g, w, h) {
    const img = g.getImageData(0, 0, w, h);
    const d = img.data;
    const src = new Uint8ClampedArray(d);
    const on = (x, y) => x >= 0 && y >= 0 && x < w && y < h && src[(y * w + x) * 4 + 3] > 128;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const i = (y * w + x) * 4;
        if (src[i + 3] > 128) continue;
        if (on(x - 1, y) || on(x + 1, y) || on(x, y - 1) || on(x, y + 1)) {
          d[i] = OUT[0]; d[i + 1] = OUT[1]; d[i + 2] = OUT[2]; d[i + 3] = OUT[3];
        }
      }
    }
    g.putImageData(img, 0, 0);
  }

  function crop(canvas, ax, ay, pad) {
    const g = canvas.getContext("2d");
    const w = canvas.width;
    const h = canvas.height;
    const data = g.getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = -1, maxY = -1;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 10) {
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (maxX < 0) return { img: canvas, ax, ay };
    minX = Math.max(0, minX - pad);
    minY = Math.max(0, minY - pad);
    maxX = Math.min(w - 1, maxX + pad);
    maxY = Math.min(h - 1, maxY + pad);
    const cw = maxX - minX + 1;
    const ch = maxY - minY + 1;
    const c = document.createElement("canvas");
    c.width = cw;
    c.height = ch;
    c.getContext("2d").drawImage(canvas, minX, minY, cw, ch, 0, 0, cw, ch);
    return { img: c, ax: ax - minX, ay: ay - minY };
  }

  function silhouette(img, color) {
    const c = document.createElement("canvas");
    c.width = img.width;
    c.height = img.height;
    const g = c.getContext("2d");
    g.drawImage(img, 0, 0);
    g.globalCompositeOperation = "source-in";
    g.fillStyle = color;
    g.fillRect(0, 0, c.width, c.height);
    return c;
  }

  function fillEllipse(ctx, cx, cy, rx, ry, color) {
    if (rx <= 0 || ry <= 0) return;
    ctx.fillStyle = color;
    const rxi = Math.max(1, Math.round(rx));
    const ryi = Math.max(1, Math.round(ry));
    cx = Math.round(cx);
    cy = Math.round(cy);
    for (let y = -ryi; y <= ryi; y++) {
      const yy = y / ryi;
      const v = 1 - yy * yy;
      if (v <= 0) continue;
      const hw = Math.max(1, Math.round(rxi * Math.sqrt(v)));
      ctx.fillRect(cx - hw, cy + y, hw * 2, 1);
    }
  }

  function rect(ctx, x, y, w, h, color) {
    ctx.fillStyle = color;
    ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h));
  }

  function px(ctx, x, y, color) {
    ctx.fillStyle = color;
    ctx.fillRect(x | 0, y | 0, 1, 1);
  }

  function blade(ctx, x, y, angle, len, female) {
    for (let i = 0; i < len; i++) {
      const px0 = Math.round(x + Math.cos(angle) * i);
      const py0 = Math.round(y + Math.sin(angle) * i);
      let col = "#f7fbff";
      if (i < 3) col = "#c17a32";
      else if (i === 3) col = "#ffc857";
      else if (i % 3 === 0) col = "#c5d0e4";
      if (female && i > 3) col = i % 2 ? "#fff" : "#d7ecff";
      ctx.fillStyle = col;
      ctx.fillRect(px0, py0, 1, 1);
      if (i > 3) {
        ctx.fillStyle = i < 4 ? "#ffc857" : "#ffffff";
        ctx.fillRect(px0 + Math.round(-Math.sin(angle)), py0 + Math.round(Math.cos(angle)), 1, 1);
      }
    }
  }

  const CX = 14;
  const FEET = 26;

  function drawHero(ctx, female, pose) {
    const bob = pose.bob || 0;
    const leg = pose.leg || 0;
    const lean = pose.lean || 0;
    const hairS = pose.hair || 0;
    const skin = "#ffd8c2";
    const skinS = "#f0b090";
    const hair = female ? "#ff6eb4" : "#4c8cff";
    const hairD = female ? "#e23d8a" : "#2a5ed0";
    const hairL = female ? "#ffd0ea" : "#d7f0ff";
    const cloth = female ? "#fff7fb" : "#ff5a6a";
    const clothD = female ? "#ffc0e0" : "#d42840";
    const clothL = female ? "#ffffff" : "#ffb0b8";
    const accent = female ? "#8b7bff" : "#ffe08a";
    const pants = female ? "#8b7bff" : "#3a4ea8";
    const pantsD = female ? "#6a58e0" : "#243278";
    const boot = female ? "#fff" : "#6a4030";
    const bootD = female ? "#ff8ab8" : "#3a241e";
    const hip = FEET - 6;
    const bodyTop = FEET - 13 + bob;
    const headY = FEET - 22 + bob;

    if (female) {
      rect(ctx, CX - 6 + hairS, headY + 6, 2, 8, hairD);
      rect(ctx, CX + 4 - hairS, headY + 6, 2, 8, hair);
    }

    if (!pose.jump) {
      const back = pose.fall ? -1 : -Math.sign(leg);
      rect(ctx, CX - 4 + back, hip, 3, 5, pantsD);
      rect(ctx, CX - 4 + back, hip + 4, 3, 2, bootD);
    }

    rect(ctx, CX - 4 + lean, bodyTop, 8, 7, cloth);
    rect(ctx, CX - 4 + lean, bodyTop, 8, 2, clothL);
    rect(ctx, CX - 4 + lean, bodyTop + 5, 8, 2, clothD);
    if (female) {
      rect(ctx, CX - 2 + lean, bodyTop + 2, 4, 4, accent);
      rect(ctx, CX - 5 + lean, hip - 1, 10, 3, "#ff8ab8");
    } else {
      rect(ctx, CX - 3 + lean, bodyTop + 1, 6, 2, accent);
      px(ctx, CX + lean, bodyTop + 4, "#fff6d0");
    }

    if (pose.jump) {
      rect(ctx, CX - 4, hip - 1, 3, 4, pantsD);
      rect(ctx, CX + 1, hip - 1, 3, 4, pants);
      rect(ctx, CX - 4, hip + 2, 3, 2, boot);
      rect(ctx, CX + 1, hip + 2, 3, 2, boot);
    } else {
      const front = pose.fall ? 1 : Math.sign(leg);
      rect(ctx, CX + 1 + front, hip, 3, 5, pants);
      rect(ctx, CX + 1 + front, hip + 4, 3, 2, boot);
    }

    fillEllipse(ctx, CX + lean, headY + 5, 6, 6, skin);
    px(ctx, CX + lean, headY + 10, skinS);

    if (pose.blink || pose.hurt) {
      rect(ctx, CX - 4 + lean, headY + 5, 3, 1, "#3a2430");
      rect(ctx, CX + 1 + lean, headY + 5, 3, 1, "#3a2430");
    } else {
      rect(ctx, CX - 4 + lean, headY + 3, 3, 3, "#fff");
      rect(ctx, CX + 1 + lean, headY + 3, 3, 3, "#fff");
      rect(ctx, CX - 3 + lean, headY + 4, 2, 2, "#2a2438");
      rect(ctx, CX + 2 + lean, headY + 4, 2, 2, "#2a2438");
      px(ctx, CX - 4 + lean, headY + 3, "#fff");
      px(ctx, CX + 1 + lean, headY + 3, "#fff");
      if (female) {
        px(ctx, CX - 4 + lean, headY + 2, "#3a2430");
        px(ctx, CX + 3 + lean, headY + 2, "#3a2430");
      }
    }
    px(ctx, CX - 5 + lean, headY + 7, "#ff9ab8");
    px(ctx, CX + 4 + lean, headY + 7, "#ff9ab8");
    if (!pose.hurt) {
      px(ctx, CX - 1 + lean, headY + 8, "#e07080");
      px(ctx, CX + lean, headY + 8, "#e07080");
    }

    if (female) {
      rect(ctx, CX - 6 + lean, headY + hairS, 12, 4, hair);
      rect(ctx, CX - 4 + lean, headY - 1, 8, 2, hairL);
      rect(ctx, CX - 2 + lean, headY - 3, 4, 3, "#fff");
      px(ctx, CX + lean, headY - 2, accent);
      rect(ctx, CX - 7 + lean, headY + 3, 2, 6, hair);
      rect(ctx, CX + 5 + lean, headY + 3, 2, 6, hairD);
    } else {
      rect(ctx, CX - 6 + lean, headY - 1, 12, 4, hair);
      rect(ctx, CX - 3 + lean, headY - 4, 3, 4, hair);
      rect(ctx, CX + 1 + lean, headY - 3, 3, 3, hairL);
      rect(ctx, CX - 7 + lean, headY + 1, 2, 3, hairD);
      rect(ctx, CX + 5 + lean, headY + 1, 2, 3, hair);
      px(ctx, CX - 1 + lean, headY, "#eaf6ff");
    }

    const armY = bodyTop + 1 + (pose.cast ? -2 : Math.round((pose.arm || 0) / 2));
    rect(ctx, CX + 3 + lean, armY, 3, pose.cast ? 3 : 4, cloth);
    px(ctx, CX + 4 + lean, armY + (pose.cast ? 3 : 4), skin);

    const ang = pose.sword == null ? 1.05 : pose.sword;
    blade(ctx, CX + 6 + lean, armY + 3, ang, 8, female);
  }

  function heroPoses() {
    const idle = [0, 1, 2, 3].map((i) => ({ bob: i === 1 || i === 2 ? 1 : 0, blink: i === 3, sword: 0.15 }));
    const walk = [0, 1, 2, 3, 4, 5].map((i) => ({
      bob: i % 2 === 0 ? 1 : 0,
      leg: [0, 1, 2, 0, -1, -2][i],
      arm: [0, -1, 0, 0, 1, 0][i],
      hair: [0, 1, 0, -1, 0, 1][i],
      sword: 0.15,
    }));
    return {
      idle,
      walk,
      jump: [{ jump: true, sword: 0.2, arm: -1 }],
      fall: [{ fall: true, sword: 0.35, arm: 1 }],
      attack: [-2.2, -1.2, -0.2, 0.6, 1.1].map((a) => ({ sword: a, attack: true, leg: 1 })),
      hurt: [{ hurt: true, blink: true, sword: 0.6, lean: -1 }],
      cast: [0, 1, 2].map((i) => ({ cast: true, sword: -1.45, hair: i - 1 })),
      dash: [0, 1, 2, 3].map((i) => ({ lean: 3, leg: [3, -2, 3, -2][i], sword: 0.2, dash: true })),
    };
  }

  function eyes(ctx, x, y, gap, angry) {
    rect(ctx, x, y, 4, 4, "#fff");
    rect(ctx, x + gap, y, 4, 4, "#fff");
    rect(ctx, x + 2, y + 1, 2, 2, "#241830");
    rect(ctx, x + gap + 2, y + 1, 2, 2, "#241830");
    px(ctx, x, y, "#fff");
    px(ctx, x + gap, y, "#fff");
    if (angry) {
      rect(ctx, x, y - 1, 4, 1, "#241830");
      rect(ctx, x + gap, y - 1, 4, 1, "#241830");
    }
  }

  function peep(ctx, x, y, gap) {
    rect(ctx, x, y, 2, 2, "#fff");
    rect(ctx, x + gap, y, 2, 2, "#fff");
    px(ctx, x + 1, y + 1, "#2a2438");
    px(ctx, x + gap + 1, y + 1, "#2a2438");
  }

  function drawSlime(ctx, frame) {
    const squ = [0, 1, 0, -1][frame % 4];
    const cy = 12 + (squ > 0 ? 1 : 0);
    fillEllipse(ctx, 12, cy, 8 + squ, 6, "#3ecf6e");
    fillEllipse(ctx, 12, cy - 1, 6, 4, "#b6ff8a");
    fillEllipse(ctx, 9, cy - 3, 2, 1, "#f4ffe4");
    peep(ctx, 8, cy - 2, 5);
    px(ctx, 11, cy + 2, "#2a2438");
    px(ctx, 12, cy + 2, "#2a2438");
    px(ctx, 8, cy + 1, "#ff9ec4");
    px(ctx, 16, cy + 1, "#ff9ec4");
  }

  function drawMushroom(ctx, frame) {
    const bob = frame % 2;
    fillEllipse(ctx, 12, 9 + bob, 9, 6, "#ff8fb0");
    fillEllipse(ctx, 12, 8 + bob, 7, 4, "#ffd0e0");
    fillEllipse(ctx, 7, 7 + bob, 2, 1, "#fff6e4");
    fillEllipse(ctx, 16, 8 + bob, 2, 1, "#fff6e4");
    rect(ctx, 9, 12 + bob, 6, 7, "#ffe6c4");
    peep(ctx, 9, 13 + bob, 4);
    px(ctx, 11, 16 + bob, "#e09070");
    rect(ctx, 8, 18 + bob, 3, 2, "#e0a060");
    rect(ctx, 13, 18 + bob, 3, 2, "#e0a060");
  }

  function drawWolf(ctx, frame) {
    const leg = [0, 1, 0, -1][frame % 4];
    fillEllipse(ctx, 6, 12, 4, 3, "#8eb0d8");
    fillEllipse(ctx, 14, 14, 8, 5, "#b7d4f5");
    fillEllipse(ctx, 14, 15, 5, 3, "#fff");
    fillEllipse(ctx, 20, 10, 5, 4, "#9ec0e8");
    rect(ctx, 16, 5, 2, 4, "#7aa0d0");
    rect(ctx, 21, 5, 2, 4, "#7aa0d0");
    peep(ctx, 18, 9, 3);
    px(ctx, 24, 11, "#2a2438");
    rect(ctx, 8 + leg, 17, 3, 4, "#7aa0d0");
    rect(ctx, 16 - leg, 17, 3, 4, "#6888b4");
  }

  function drawBat(ctx, frame) {
    const flap = [4, 2, 4, 6][frame % 4];
    fillEllipse(ctx, 5, 10, 6, flap, "#b9a0ff");
    fillEllipse(ctx, 21, 10, 6, flap, "#b9a0ff");
    fillEllipse(ctx, 13, 10, 5, 4, "#7d62e0");
    rect(ctx, 9, 6, 2, 3, "#5a42b0");
    rect(ctx, 15, 6, 2, 3, "#5a42b0");
    peep(ctx, 10, 9, 4);
  }

  function drawGolem(ctx, frame) {
    const arm = [0, 1, 0, -1][frame % 4];
    fillEllipse(ctx, 12, 16, 8, 6, "#8d8aa0");
    rect(ctx, 8, 6, 8, 8, "#c8c4d8");
    rect(ctx, 10, 2, 4, 5, "#7ee8ff");
    peep(ctx, 9, 8, 4);
    rect(ctx, 3, 10 + arm, 4, 6, "#6e6a80");
    rect(ctx, 17, 10 - arm, 4, 6, "#6e6a80");
    rect(ctx, 8, 20, 3, 4, "#5c5868");
    rect(ctx, 13, 20, 3, 4, "#5c5868");
    px(ctx, 7, 14, "#8ee07a");
  }

  function drawImp(ctx, frame) {
    const bob = frame % 2;
    fillEllipse(ctx, 8, 14 + bob, 5, 6, "#ff7a4a");
    fillEllipse(ctx, 8, 8 + bob, 4, 4, "#ffd36a");
    rect(ctx, 5, 5 + bob, 2, 3, "#7a4ad0");
    rect(ctx, 10, 5 + bob, 2, 3, "#7a4ad0");
    peep(ctx, 6, 12 + bob, 3);
    px(ctx, 8, 15 + bob, "#fff");
  }

  function drawBoss(ctx, mode, frame) {
    const bob = frame % 2;
    rect(ctx, 10, 16, 20, 18, "#3a2460");
    fillEllipse(ctx, 20, 18 + bob, 9, 8, "#6a4ad0");
    rect(ctx, 14, 8 + bob, 12, 10, "#2a1848");
    rect(ctx, 12, 4 + bob, 3, 8, "#ffe08a");
    rect(ctx, 25, 4 + bob, 3, 8, "#ffe08a");
    rect(ctx, 16, 12 + bob, 3, 2, "#ff5a6a");
    rect(ctx, 22, 12 + bob, 3, 2, "#ff5a6a");
    px(ctx, 17, 12 + bob, "#fff");
    px(ctx, 23, 12 + bob, "#fff");
    rect(ctx, 4, 18 + bob, 6, 5, "#ffc857");
    rect(ctx, 30, 18 + bob, 6, 5, "#ffc857");
    rect(ctx, 14, 32, 4, 6, "#241838");
    rect(ctx, 22, 32, 4, 6, "#241838");
    rect(ctx, 16, 22, 8, 8, "#ffe08a");
    const ang = mode === "slam" ? -1.4 : mode === "attack" ? 0.2 + frame * 0.35 : 0.7;
    blade(ctx, mode === "slam" ? 20 : 30, (mode === "slam" ? 12 : 20) + bob, ang, 12, false);
  }

  function drawTree(ctx, v) {
    const greens = ["#2f8a3c", "#257233", "#46a84c"];
    rect(ctx, 16, 30, 8, 18, "#6b4428");
    rect(ctx, 18, 30, 3, 18, "#8a5a34");
    fillEllipse(ctx, 20, 26, 14, 12, greens[v % 3]);
    fillEllipse(ctx, 14, 20, 9, 8, "#6ed06a");
    fillEllipse(ctx, 24, 16, 8, 7, "#b6f5a4");
    fillEllipse(ctx, 16, 14, 3, 2, "#eaffd4");
  }

  function drawBush(ctx, v) {
    fillEllipse(ctx, 14, 16, 12, 8, v ? "#2f7a34" : "#3d9a40");
    fillEllipse(ctx, 10, 14, 6, 5, "#8ee07a");
  }

  function drawFlower(ctx, color) {
    rect(ctx, 6, 8, 2, 8, "#3d9a40");
    fillEllipse(ctx, 7, 6, 3, 3, color);
    px(ctx, 7, 6, "#fff3b0");
  }

  function drawCrystal(ctx, v) {
    const c = v ? "#c9a0ff" : "#7ee0ff";
    rect(ctx, 8, 4, 6, 16, c);
    rect(ctx, 6, 8, 10, 8, v ? "#e6d0ff" : "#e8fbff");
    rect(ctx, 10, 2, 2, 4, "#fff");
  }

  function drawRock(ctx, v) {
    fillEllipse(ctx, 12, 12, 10, 7, v ? "#5c5868" : "#7a7688");
    px(ctx, 8, 10, "#c8c4d4");
  }

  function drawCandle(ctx) {
    rect(ctx, 6, 10, 6, 10, "#f0e2c0");
    rect(ctx, 8, 4, 2, 6, "#ffd05a");
    px(ctx, 8, 3, "#fff6d0");
  }

  function drawChest(ctx, open) {
    rect(ctx, 4, 10, 24, 14, "#8a5a32");
    rect(ctx, 4, 10, 24, 4, "#c48a52");
    rect(ctx, 14, 14, 4, 4, "#ffc857");
    if (open) {
      rect(ctx, 4, 4, 24, 8, "#e0b070");
      rect(ctx, 8, 12, 16, 6, "#fff1a8");
    }
  }

  function drawShop(ctx) {
    rect(ctx, 6, 20, 28, 14, "#8a5a32");
    rect(ctx, 4, 16, 32, 5, "#e23d4c");
    rect(ctx, 8, 16, 4, 5, "#fff");
    rect(ctx, 16, 16, 4, 5, "#fff");
    rect(ctx, 24, 16, 4, 5, "#fff");
    rect(ctx, 12, 24, 4, 8, "#5a3b32");
    fillEllipse(ctx, 24, 26, 3, 4, "#e23d4c");
  }

  function drawCoin(ctx, frame) {
    const rx = [6, 4, 2, 4][frame % 4];
    fillEllipse(ctx, 8, 8, rx, 6, "#e09a20");
    fillEllipse(ctx, 8, 8, Math.max(1, rx - 2), 4, "#ffe08a");
  }

  function drawPotion(ctx, color) {
    rect(ctx, 6, 2, 4, 3, "#d8d2c8");
    rect(ctx, 5, 5, 6, 10, color);
    rect(ctx, 6, 7, 2, 4, "#fff");
  }

  function drawCloud(ctx) {
    fillEllipse(ctx, 20, 14, 14, 8, "#fff");
    fillEllipse(ctx, 32, 16, 10, 7, "#fff");
    fillEllipse(ctx, 10, 16, 8, 6, "#fff");
  }

  const Art = {
    catalog: [],
    heroes: {},
    monsters: {},
    props: {},
    drops: {},
    init() {
      const poses = heroPoses();
      ["male", "female"].forEach((gender) => {
        this.heroes[gender] = {};
        Object.keys(poses).forEach((state) => {
          this.heroes[gender][state] = poses[state].map((pose) => bake(96, 104, (g) => drawHero(g, gender === "female", pose), CX, FEET));
          this.catalog.push({ label: gender + " " + state, frames: this.heroes[gender][state] });
        });
      });
      const pack = (name, list) => {
        this.monsters[name] = list;
        this.catalog.push({ label: name, frames: list.idle || list.attack || list });
      };
      this.monsters.slime = { idle: [0, 1, 2, 3].map((f) => bake(48, 40, (g) => drawSlime(g, f), 24, 32)) };
      this.monsters.mushroom = { idle: [0, 1, 2, 3].map((f) => bake(44, 44, (g) => drawMushroom(g, f), 20, 36)) };
      this.monsters.wolf = { idle: [0, 1, 2, 3].map((f) => bake(52, 44, (g) => drawWolf(g, f), 26, 38)) };
      this.monsters.bat = { idle: [0, 1, 2, 3].map((f) => bake(52, 36, (g) => drawBat(g, f), 26, 28)) };
      this.monsters.golem = { idle: [0, 1, 2, 3].map((f) => bake(60, 52, (g) => drawGolem(g, f), 28, 46)) };
      this.monsters.imp = { idle: [0, 1, 2, 3].map((f) => bake(36, 40, (g) => drawImp(g, f), 16, 34)) };
      this.monsters.boss = {
        idle: [0, 1].map((f) => bake(100, 100, (g) => drawBoss(g, "idle", f), 50, 86)),
        attack: [0, 1].map((f) => bake(110, 100, (g) => drawBoss(g, "attack", f), 50, 86)),
        slam: [0, 1].map((f) => bake(110, 110, (g) => drawBoss(g, "slam", f), 55, 96)),
      };
      ["slime", "mushroom", "wolf", "bat", "golem", "imp", "boss"].forEach((n) => {
        this.catalog.push({ label: n, frames: this.monsters[n].idle });
      });
      this.props.tree = [0, 1, 2].map((v) => bake(44, 52, (g) => drawTree(g, v), 20, 48));
      this.props.bush = [0, 1].map((v) => bake(32, 28, (g) => drawBush(g, v), 14, 24));
      this.props.flower = ["#ff8ab8", "#ffd56a", "#8ad4ff"].map((c) => bake(16, 20, (g) => drawFlower(g, c), 7, 16));
      this.props.crystal = [0, 1].map((v) => bake(24, 28, (g) => drawCrystal(g, v), 12, 24));
      this.props.rock = [0, 1].map((v) => bake(28, 22, (g) => drawRock(g, v), 12, 18));
      this.props.candle = [bake(16, 24, (g) => drawCandle(g), 8, 20)];
      this.props.shop = [bake(42, 40, (g) => drawShop(g), 20, 34)];
      this.props.chest = [bake(32, 28, (g) => drawChest(g, false), 16, 24), bake(32, 32, (g) => drawChest(g, true), 16, 28)];
      this.props.cloud = [bake(48, 28, (g) => drawCloud(g), 24, 20)];
      this.drops.coin = [0, 1, 2, 3].map((f) => bake(16, 16, (g) => drawCoin(g, f), 8, 14));
      this.drops.hp = [bake(16, 18, (g) => drawPotion(g, "#e23d4c"), 8, 16)];
      this.drops.mp = [bake(16, 18, (g) => drawPotion(g, "#3aa0e8"), 8, 16)];
    },
    getHero(gender, state, frame) {
      const set = (this.heroes[gender] && this.heroes[gender][state]) || this.heroes[gender].idle;
      return set[Math.abs(frame | 0) % set.length];
    },
    getMonster(type, frame, mode) {
      const group = this.monsters[type] || this.monsters.slime;
      const set = group[mode] || group.idle;
      return set[Math.abs(frame | 0) % set.length];
    },
    getProp(name, i) {
      const set = this.props[name];
      return set[Math.abs(i | 0) % set.length];
    },
    getDrop(type, frame) {
      const set = this.drops[type] || this.drops.coin;
      return set[Math.abs(frame | 0) % set.length];
    },
  };

  window.LuminaArt = Art;
})();
