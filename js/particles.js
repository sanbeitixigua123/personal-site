/* ==========================================================================
   悬浮粒子场 —— 原生 Canvas 2D 实现
   --------------------------------------------------------------------------
   思路移植自 ReactBits 的 DotField 组件（Canvas 2D，无依赖），
   在其基础上补了一层「静止时也缓慢漂浮」的位移，
   否则点阵只有鼠标靠近才动，不符合「悬浮」的观感。

   本站是零依赖原生站点，不引入 React / Three.js，所以是重写而非引入。
   参数按本站视觉调过，不是 ReactBits 的默认值。
   ========================================================================== */

(function () {
  'use strict';

  var canvas = document.getElementById('dotField');
  if (!canvas) return;

  var ctx = canvas.getContext('2d', { alpha: true });
  if (!ctx) return;

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  /* 省流模式：Canvas 是逐帧重绘的，对流量/电量敏感的用户应该直接跳过。
     判定为「仅画一帧静止点阵」，和 prefers-reduced-motion 走同一条路径。 */
  var reduceData = window.matchMedia('(prefers-reduced-data: reduce)').matches;
  var stillOnly = reduceMotion || reduceData;

  /* ------------------------------------------------------------- 参数 */
  var CFG = {
    dotRadius: 1.5,
    spacing: 21,          // 点阵间距（CSS px）
    maxDots: 2800,        // 点数上限，防止 4K 屏把帧率拖垮
    cursorRadius: 260,    // 鼠标影响半径
    bulgeStrength: 68,    // 推开的最大距离
    glowRadius: 210,      // 跟随光晕半径
    idleFloat: 3.2,       // 静止漂浮幅度：太小会退化成死板点阵
    floatSpeed: 0.5,
    sizeSpread: 0.85,     // 每点尺寸随机范围（0.7~1.55 倍），破掉整齐划一
    pulse: 0.14           // 每点呼吸幅度
  };

  /* 颜色从 CSS 变量读，这样深浅色切换时能跟着变 */
  var colors = { from: 'rgba(52,211,174,0.42)', to: 'rgba(124,231,206,0.16)', glow: 'rgba(52,211,174,0.20)' };

  function readColors() {
    var cs = getComputedStyle(root);
    var f = cs.getPropertyValue('--particle-from').trim();
    var t = cs.getPropertyValue('--particle-to').trim();
    var g = cs.getPropertyValue('--particle-glow').trim();
    if (f) colors.from = f;
    if (t) colors.to = t;
    if (g) colors.glow = g;
  }

  /* --------------------------------------------------------------- 状态 */
  var dots = [];
  var W = 0, H = 0;
  var dpr = 1;

  var mouse = { x: -9999, y: -9999, prevX: -9999, prevY: -9999, speed: 0 };
  var engagement = 0;      // 0~1，鼠标移动越快越大，光晕靠它淡入
  var glowOpacity = 0;

  var rafId = null;
  var frame = 0;
  var running = false;

  /* --------------------------------------------------------------- 构建 */
  function buildDots() {
    /* 间距自适应：屏越大点越多，但不超过上限 */
    var spacing = CFG.spacing;
    var est = Math.ceil(W / spacing) * Math.ceil(H / spacing);
    if (est > CFG.maxDots) {
      spacing = Math.sqrt((W * H) / CFG.maxDots);
    }

    var cols = Math.max(1, Math.floor(W / spacing));
    var rows = Math.max(1, Math.floor(H / spacing));
    var padX = (W - cols * spacing) / 2;
    var padY = (H - rows * spacing) / 2;

    dots = new Array(rows * cols);
    var i = 0;
    for (var r = 0; r < rows; r++) {
      for (var c = 0; c < cols; c++) {
        var ax = padX + c * spacing + spacing / 2;
        var ay = padY + r * spacing + spacing / 2;
        /* 用坐标做个稳定哈希，保证每次重建每点的尺寸/相位一致，不会闪 */
        var h = ((r * 73856093) ^ (c * 19349663)) >>> 0;
        dots[i++] = {
          ax: ax, ay: ay,          // 锚点（网格位置）
          sx: ax, sy: ay,          // 当前位置（被推开后会弹回）
          phase: (h % 628) / 100,                                // 漂浮相位
          pulse: ((h >>> 7) % 628) / 100,                        // 呼吸相位
          size: 0.7 + ((h >>> 3) % 100) / 100 * CFG.sizeSpread   // 0.7 ~ 1.55
          // 注意用无符号右移：h 是 32 位无符号，用 >> 会变负数，
          // 再被 % 保留符号，size 就成了负值，arc() 直接抛异常
        };
      }
    }
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    dpr = Math.min(window.devicePixelRatio || 1, 2);

    canvas.width = Math.round(W * dpr);
    canvas.height = Math.round(H * dpr);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    buildDots();
    if (stillOnly) drawStatic();
  }

  /* --------------------------------------------------------------- 绘制 */
  function drawField() {
    ctx.clearRect(0, 0, W, H);

    /* 跟随鼠标的柔光，先画在点下面，避免把点糊掉 */
    if (glowOpacity > 0.01 && mouse.x > -9000) {
      var r = CFG.glowRadius;
      var g = ctx.createRadialGradient(mouse.x, mouse.y, 0, mouse.x, mouse.y, r);
      g.addColorStop(0, colors.glow);
      g.addColorStop(1, 'transparent');
      ctx.fillStyle = g;
      /* 只填光晕的包围盒，别整屏填，省一大截 */
      ctx.fillRect(mouse.x - r, mouse.y - r, r * 2, r * 2);
    }

    /* 点的颜色做一次横跨屏幕的渐变，比纯色更有层次 */
    var grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, colors.from);
    grad.addColorStop(1, colors.to);
    ctx.fillStyle = grad;

    var t = frame * 0.02;
    var cr = CFG.cursorRadius;
    var crSq = cr * cr;
    var rad = CFG.dotRadius;
    var eng = engagement;
    var mx = mouse.x, my = mouse.y;

    ctx.beginPath();

    for (var i = 0, len = dots.length; i < len; i++) {
      var d = dots[i];

      /* 鼠标推开：越靠近推得越远，推力随鼠标速度衰减 */
      if (eng > 0.01 && mx > -9000) {
        var dx = mx - d.ax;
        var dy = my - d.ay;
        var distSq = dx * dx + dy * dy;

        if (distSq < crSq) {
          var dist = Math.sqrt(distSq) || 0.001;
          var f = 1 - dist / cr;
          var push = f * f * CFG.bulgeStrength * eng;
          var ang = Math.atan2(dy, dx);
          d.sx += (d.ax - Math.cos(ang) * push - d.sx) * 0.15;
          d.sy += (d.ay - Math.sin(ang) * push - d.sy) * 0.15;
        } else {
          d.sx += (d.ax - d.sx) * 0.1;
          d.sy += (d.ay - d.sy) * 0.1;
        }
      } else {
        d.sx += (d.ax - d.sx) * 0.1;
        d.sy += (d.ay - d.sy) * 0.1;
      }

      /* 静止漂浮：每点相位不同，看起来像悬浮而不是整体波浪 */
      var fx = Math.sin(t * CFG.floatSpeed + d.phase) * CFG.idleFloat;
      var fy = Math.cos(t * CFG.floatSpeed * 0.8 + d.phase * 1.7) * CFG.idleFloat;

      var px = d.sx + fx;
      var py = d.sy + fy;

      /* 每点自己的呼吸，让整片场看起来是活的 */
      var rr = rad * d.size * (1 + Math.sin(t * 0.8 + d.pulse) * CFG.pulse);

      ctx.moveTo(px + rr, py);
      ctx.arc(px, py, rr, 0, 6.283185307179586);
    }

    ctx.fill();
  }

  function drawStatic() {
    /* 降级动效时只画一帧静止的点阵 */
    ctx.clearRect(0, 0, W, H);
    var grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, colors.from);
    grad.addColorStop(1, colors.to);
    ctx.fillStyle = grad;
    ctx.beginPath();
    for (var i = 0, len = dots.length; i < len; i++) {
      var d = dots[i];
      ctx.moveTo(d.ax + CFG.dotRadius, d.ay);
      ctx.arc(d.ax, d.ay, CFG.dotRadius, 0, 6.283185307179586);
    }
    ctx.fill();
  }

  /* --------------------------------------------------------------- 循环 */
  function tick() {
    frame++;

    /* 鼠标速度做指数平滑，避免抖动 */
    var dx = mouse.prevX - mouse.x;
    var dy = mouse.prevY - mouse.y;
    var dist = Math.sqrt(dx * dx + dy * dy);
    mouse.speed += (dist - mouse.speed) * 0.5;
    if (mouse.speed < 0.001) mouse.speed = 0;
    mouse.prevX = mouse.x;
    mouse.prevY = mouse.y;

    var target = Math.min(mouse.speed / 5, 1);
    engagement += (target - engagement) * 0.06;
    if (engagement < 0.001) engagement = 0;

    glowOpacity += (engagement - glowOpacity) * 0.08;

    drawField();
    rafId = window.requestAnimationFrame(tick);
  }

  function start() {
    if (running || stillOnly) return;
    running = true;
    rafId = window.requestAnimationFrame(tick);
  }

  function stop() {
    running = false;
    if (rafId) window.cancelAnimationFrame(rafId);
    rafId = null;
  }

  /* --------------------------------------------------------------- 事件 */
  var resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(resize, 140);
  }, { passive: true });

  if (canHover) {
    window.addEventListener('pointermove', function (e) {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
    }, { passive: true });

    document.addEventListener('pointerleave', function () {
      mouse.x = -9999;
      mouse.y = -9999;
    });
  }

  /* 切到后台就停，别白烧电 */
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) stop();
    else start();
  });

  /* 深浅色切换时重读颜色 */
  new MutationObserver(readColors).observe(root, {
    attributes: true,
    attributeFilter: ['data-theme']
  });

  /* --------------------------------------------------------------- 启动 */
  readColors();
  resize();
  start();
})();
