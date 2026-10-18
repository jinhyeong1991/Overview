/* Original pixel-art sprites. No copyrighted characters or tiles. */
(function () {
  const OUT = [32, 22, 48, 255];

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

  const CX = 48;
  const FEET = 86;

  function drawHero(ctx, female, pose) {
    const bob = pose.bob || 0;
    const leg = pose.leg || 0;
    const lean = pose.lean || 0;
    const hairS = pose.hair || 0;
    const skin = "#ffd2b4";
    const skinS = "#f0b090";
    const hair = female ? "#ee5aa2" : "#3a78e0";
    const hairD = female ? "#c43278" : "#2456b0";
    const hairL = female ? "#ffc0e0" : "#c7e6ff";
    const cloth = female ? "#fff7fb" : "#e23d4c";
    const clothD = female ? "#f3c6e2" : "#b42336";
    const clothL = female ? "#ffffff" : "#ff8d9a";
    const accent = female ? "#7c5cff" : "#ffd56a";
    const pants = female ? "#7c5cff" : "#2c3e86";
    const pantsD = female ? "#5a3ed0" : "#1c2a5e";
    const boot = female ? "#fff" : "#5a3b32";
    const bootD = female ? "#ff8ab8" : "#3a241e";
    const hip = FEET - 12;
    const bodyTop = FEET - 24 + bob;
    const headY = FEET - 40 + bob;

    if (female) {
      rect(ctx, CX - 8 + hairS, headY + 8, 5, 22, hairD);
      rect(ctx, CX + 4 - hairS, headY + 10, 5, 20, hair);
      rect(ctx, CX - 8, headY + 8, 2, 18, hairL);
    } else {
      rect(ctx, CX - 10, bodyTop + 4, 4, 8, "#e23d4c");
    }

    if (!pose.jump) {
      const backSwing = pose.fall ? -2 : -leg;
      rect(ctx, CX - 7 + backSwing, hip, 5, pose.fall ? 10 : 9, pantsD);
      rect(ctx, CX - 8 + backSwing, hip + 8, 7, 3, bootD);
    }

    rect(ctx, CX - 8 + lean, bodyTop + 2, 4, 8, clothD);

    rect(ctx, CX - 9 + lean, bodyTop, 18, 12, cloth);
    rect(ctx, CX - 9 + lean, bodyTop, 18, 3, clothL);
    rect(ctx, CX - 9 + lean, bodyTop + 8, 18, 4, clothD);
    if (female) {
      rect(ctx, CX - 3 + lean, bodyTop + 3, 6, 8, accent);
      rect(ctx, CX - 12 + lean, hip - 1, 24, 6, "#ff8ab8");
      rect(ctx, CX - 13 + lean, hip + 3, 26, 3, "#e8649c");
      px(ctx, CX + lean, bodyTop + 5, "#ffd56a");
    } else {
      rect(ctx, CX - 6 + lean, bodyTop + 2, 12, 3, accent);
      rect(ctx, CX - 1 + lean, bodyTop + 5, 2, 2, "#fff3c0");
      rect(ctx, CX + 4 + lean, bodyTop + 5, 2, 2, "#fff3c0");
      rect(ctx, CX - 9 + lean, bodyTop + 10, 18, 3, "#f0c14a");
      px(ctx, CX + lean, bodyTop + 11, "#fff6d0");
    }

    if (pose.jump) {
      rect(ctx, CX - 8, hip - 1, 5, 7, pantsD);
      rect(ctx, CX + 3, hip - 1, 5, 7, pants);
      rect(ctx, CX - 9, hip + 5, 7, 3, boot);
      rect(ctx, CX + 2, hip + 5, 7, 3, boot);
    } else {
      const front = pose.fall ? 2 : leg;
      rect(ctx, CX + 2 + front, hip, 5, 9, pants);
      rect(ctx, CX + 1 + front, hip + 8, 7, 3, boot);
      rect(ctx, CX + 1 + front, hip + 8, 7, 1, bootD);
    }

    fillEllipse(ctx, CX + lean, headY + 8, 11, 10, skin);
    rect(ctx, CX - 3 + lean, headY + 16, 6, 3, skinS);

    if (pose.blink || pose.hurt) {
      rect(ctx, CX - 8 + lean, headY + 8, 5, 1, "#241830");
      rect(ctx, CX + 3 + lean, headY + 8, 5, 1, "#241830");
      if (pose.hurt) {
        px(ctx, CX - 8 + lean, headY + 7, "#241830");
        px(ctx, CX - 4 + lean, headY + 9, "#241830");
        px(ctx, CX + 3 + lean, headY + 7, "#241830");
        px(ctx, CX + 7 + lean, headY + 9, "#241830");
      }
    } else {
      rect(ctx, CX - 8 + lean, headY + 6, 5, 5, "#fff");
      rect(ctx, CX + 3 + lean, headY + 6, 5, 5, "#fff");
      rect(ctx, CX - 6 + lean, headY + 7, 2, 3, "#241830");
      rect(ctx, CX + 5 + lean, headY + 7, 2, 3, "#241830");
      px(ctx, CX - 7 + lean, headY + 6, "#fff");
      px(ctx, CX + 4 + lean, headY + 6, "#fff");
      if (female) {
        rect(ctx, CX - 8 + lean, headY + 5, 5, 1, "#241830");
        rect(ctx, CX + 3 + lean, headY + 5, 5, 1, "#241830");
      }
    }
    px(ctx, CX - 9 + lean, headY + 12, "#ff8aa8");
    px(ctx, CX - 8 + lean, headY + 13, "#ff8aa8");
    px(ctx, CX + 8 + lean, headY + 12, "#ff8aa8");
    px(ctx, CX + 9 + lean, headY + 13, "#ff8aa8");
    if (!pose.hurt) {
      px(ctx, CX - 2 + lean, headY + 14, "#d07070");
      px(ctx, CX - 1 + lean, headY + 15, "#d07070");
      px(ctx, CX + lean, headY + 15, "#d07070");
      px(ctx, CX + 1 + lean, headY + 14, "#d07070");
    } else {
      rect(ctx, CX - 2 + lean, headY + 14, 4, 2, "#d07070");
    }

    if (female) {
      rect(ctx, CX - 12 + lean, headY + 1 + hairS, 24, 6, hair);
      rect(ctx, CX - 8 + lean, headY - 1, 16, 3, hairL);
      rect(ctx, CX - 12 + lean, headY + 5, 4, 3, hairD);
      rect(ctx, CX + 8 + lean, headY + 5, 4, 3, hair);
      rect(ctx, CX - 4 + lean, headY - 3, 8, 4, "#fff7fb");
      rect(ctx, CX - 7 + lean, headY - 2, 3, 3, "#ee5aa2");
      rect(ctx, CX + 4 + lean, headY - 2, 3, 3, "#ee5aa2");
      px(ctx, CX + lean, headY - 2, "#ffd56a");
      rect(ctx, CX - 14 + lean, headY + 5, 4, 14, hair);
      rect(ctx, CX + 10 + lean, headY + 6, 4, 12, hairD);
    } else {
      rect(ctx, CX - 12 + lean, headY, 24, 6, hair);
      rect(ctx, CX - 8 + lean, headY - 2, 8, 3, hairL);
      rect(ctx, CX - 14 + lean, headY - 2, 4, 6, hairD);
      rect(ctx, CX - 6 + lean, headY - 6, 4, 6, hair);
      rect(ctx, CX + 2 + lean, headY - 5, 5, 5, hairL);
      rect(ctx, CX + 10 + lean, headY - 3, 4, 6, hair);
      rect(ctx, CX - 12 + lean, headY + 5, 4, 3, hairD);
      rect(ctx, CX + 8 + lean, headY + 5, 4, 3, hair);
      px(ctx, CX - 2 + lean, headY, "#eaf6ff");
    }

    const armY = bodyTop + 3 + (pose.cast ? -3 : (pose.arm || 0));
    rect(ctx, CX + 8 + lean, armY, 5, pose.cast ? 6 : 8, cloth);
    px(ctx, CX + 10 + lean, armY + (pose.cast ? 6 : 8), skin);

    const ang = pose.sword == null ? 1.05 : pose.sword;
    const hx = CX + 12 + lean;
    const hy = armY + 6;
    blade(ctx, hx, hy, ang, female ? 18 : 16, female);
  }

  function heroPoses() {
    const idle = [0, 1, 2, 3].map((i) => ({ bob: i === 1 || i === 2 ? 1 : 0, blink: i === 3, sword: 1.08 }));
    const walk = [0, 1, 2, 3, 4, 5].map((i) => ({
      bob: i % 2 === 0 ? 1 : 0,
      leg: [0, 2, 3, 0, -2, -3][i],
      arm: [0, -1, -2, 0, 1, 2][i],
      hair: [0, 1, 0, -1, 0, 1][i],
      sword: 1.02,
    }));
    return {
      idle,
      walk,
      jump: [{ jump: true, sword: 0.45, arm: -2 }],
      fall: [{ fall: true, sword: 1.25, arm: 2 }],
      attack: [-2.35, -1.55, -0.45, 0.45, 1.05].map((a) => ({ sword: a, attack: true, leg: 1 })),
      hurt: [{ hurt: true, blink: true, sword: 1.35, lean: -2 }],
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

  function drawSlime(ctx, frame) {
    const squ = [0, 1, 0, -1][frame % 4];
    const cy = 20 + (squ > 0 ? 2 : 0);
    fillEllipse(ctx, 24, cy, 12 + squ, 9 - Math.max(0, squ), "#3aaa44");
    fillEllipse(ctx, 24, cy - 1, 10 + squ, 7 - Math.max(0, squ), "#67d85a");
    fillEllipse(ctx, 19, cy - 4, 4, 2, "#e9ffc8");
    eyes(ctx, 16, cy - 2, 10, false);
    px(ctx, 22, cy + 3, "#241830");
    px(ctx, 23, cy + 4, "#241830");
    px(ctx, 24, cy + 4, "#241830");
    px(ctx, 25, cy + 3, "#241830");
    px(ctx, 15, cy + 2, "#ff8aa8");
    px(ctx, 31, cy + 2, "#ff8aa8");
  }

  function drawMushroom(ctx, frame) {
    const bob = frame % 2;
    fillEllipse(ctx, 20, 16 + bob, 14, 9, "#b42336");
    fillEllipse(ctx, 20, 15 + bob, 12, 7, "#e23d4c");
    fillEllipse(ctx, 12, 13 + bob, 3, 2, "#fff6e4");
    fillEllipse(ctx, 20, 11 + bob, 2, 2, "#fff6e4");
    fillEllipse(ctx, 27, 14 + bob, 3, 2, "#fff6e4");
    rect(ctx, 15, 20 + bob, 10, 12, "#ffe0b8");
    rect(ctx, 16, 22 + bob, 8, 8, "#f6c89a");
    eyes(ctx, 15, 22 + bob, 7, true);
    rect(ctx, 8, 24 + bob, 6, 3, "#e0b080");
    rect(ctx, 26, 24 + bob, 6, 3, "#e0b080");
    rect(ctx, 14, 31 + bob, 4, 4, "#c9843a");
    rect(ctx, 22, 31 + bob, 4, 4, "#c9843a");
  }

  function drawWolf(ctx, frame) {
    const leg = [0, 2, 0, -2][frame % 4];
    fillEllipse(ctx, 10, 18, 6, 4, "#6d84a8");
    fillEllipse(ctx, 22, 24, 12, 8, "#8aa4c8");
    fillEllipse(ctx, 22, 26, 8, 5, "#e8eef8");
    fillEllipse(ctx, 30, 16, 8, 7, "#8aa4c8");
    fillEllipse(ctx, 36, 18, 5, 4, "#d5deee");
    rect(ctx, 24, 8, 4, 6, "#6d84a8");
    rect(ctx, 32, 8, 4, 6, "#6d84a8");
    px(ctx, 25, 9, "#ff8aa8");
    px(ctx, 33, 9, "#ff8aa8");
    eyes(ctx, 28, 14, 6, true);
    px(ctx, 38, 18, "#241830");
    rect(ctx, 14 + leg, 30, 4, 6, "#6d84a8");
    rect(ctx, 24 - leg, 30, 4, 6, "#5d7494");
    rect(ctx, 13 + leg, 35, 6, 2, "#3a241e");
    rect(ctx, 23 - leg, 35, 6, 2, "#3a241e");
  }

  function drawBat(ctx, frame) {
    const flap = [8, 4, 8, 12][frame % 4];
    fillEllipse(ctx, 8, 16, 10, flap, "#5a3ca8");
    fillEllipse(ctx, 40, 16, 10, flap, "#5a3ca8");
    fillEllipse(ctx, 10, 16, 6, Math.max(3, flap - 3), "#c9b6ff");
    fillEllipse(ctx, 38, 16, 6, Math.max(3, flap - 3), "#c9b6ff");
    fillEllipse(ctx, 24, 16, 8, 7, "#7a5cc8");
    rect(ctx, 16, 8, 3, 6, "#5a3ca8");
    rect(ctx, 29, 8, 3, 6, "#5a3ca8");
    eyes(ctx, 19, 14, 7, true);
    px(ctx, 22, 20, "#fff");
    px(ctx, 26, 20, "#fff");
  }

  function drawGolem(ctx, frame) {
    const arm = [0, 1, 0, -1][frame % 4];
    fillEllipse(ctx, 28, 28, 14, 12, "#5c5868");
    fillEllipse(ctx, 28, 26, 12, 10, "#8d8a9a");
    rect(ctx, 16, 16, 24, 10, "#7e7b8c");
    rect(ctx, 20, 8, 16, 12, "#8d8a9a");
    rect(ctx, 24, 2, 8, 8, "#7ee0ff");
    rect(ctx, 26, 4, 4, 4, "#e8fbff");
    eyes(ctx, 22, 12, 8, true);
    rect(ctx, 8, 18 + arm, 8, 12, "#6c697a");
    rect(ctx, 40, 18 - arm, 8, 12, "#6c697a");
    rect(ctx, 18, 36, 6, 8, "#5c5868");
    rect(ctx, 30, 36, 6, 8, "#5c5868");
    px(ctx, 18, 22, "#6db85a");
    px(ctx, 34, 30, "#6db85a");
    px(ctx, 26, 24, "#6db85a");
  }

  function drawImp(ctx, frame) {
    const bob = frame % 2;
    fillEllipse(ctx, 16, 24 + bob, 8, 10, "#e25822");
    fillEllipse(ctx, 16, 18 + bob, 7, 8, "#ff7a3a");
    fillEllipse(ctx, 16, 12 + bob, 5, 6, "#ffd05a");
    fillEllipse(ctx, 14, 10 + bob, 2, 2, "#fff6d0");
    rect(ctx, 10, 8 + bob, 3, 6, "#5a2a6a");
    rect(ctx, 19, 8 + bob, 3, 6, "#5a2a6a");
    eyes(ctx, 11, 16 + bob, 6, true);
    px(ctx, 15, 22 + bob, "#fff");
  }

  function drawBoss(ctx, mode, frame) {
    const bob = frame % 2;
    fillEllipse(ctx, 40, 70, 18, 8, "#1a1028");
    rect(ctx, 18, 28, 44, 40, "#241838");
    fillEllipse(ctx, 40, 36 + bob, 16, 14, "#3a2a6a");
    rect(ctx, 28, 18 + bob, 24, 20, "#3a2a6a");
    rect(ctx, 30, 8 + bob, 20, 16, "#2a1c4e");
    rect(ctx, 22, 4 + bob, 6, 14, "#ffd56a");
    rect(ctx, 52, 4 + bob, 6, 14, "#ffd56a");
    rect(ctx, 34, 14 + bob, 6, 4, "#ff3a4a");
    rect(ctx, 46, 14 + bob, 6, 4, "#ff3a4a");
    px(ctx, 35, 15 + bob, "#fff");
    px(ctx, 47, 15 + bob, "#fff");
    rect(ctx, 36, 22 + bob, 8, 3, "#1a1028");
    rect(ctx, 12, 32 + bob, 12, 10, "#ffc857");
    rect(ctx, 56, 32 + bob, 12, 10, "#ffc857");
    rect(ctx, 24, 64, 10, 16, "#2a1c4e");
    rect(ctx, 46, 64, 10, 16, "#2a1c4e");
    rect(ctx, 22, 78, 14, 4, "#111");
    rect(ctx, 44, 78, 14, 4, "#111");
    rect(ctx, 34, 40, 12, 16, "#ffc857");
    rect(ctx, 38, 44, 4, 8, "#fff1b0");
    const ang = mode === "slam" ? -1.5 : mode === "attack" ? 0.3 + frame * 0.4 : 0.8;
    const hx = mode === "slam" ? 40 : 62;
    const hy = mode === "slam" ? 20 : 40;
    blade(ctx, hx, hy + bob, ang, 26, false);
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
