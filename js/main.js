/* ==========================================================================
   个人网站 — 交互脚本
   零依赖原生 JS。所有动效都遵守 prefers-reduced-motion。
   ========================================================================== */

(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var canHover = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  var $  = function (sel, ctx) { return (ctx || document).querySelector(sel); };
  var $$ = function (sel, ctx) {
    return Array.prototype.slice.call((ctx || document).querySelectorAll(sel));
  };

  /* ------------------------------------------------------------ 提示条 */

  var toastEl = $('#toast');
  var toastTimer = null;

  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () {
      toastEl.classList.remove('is-visible');
    }, 2200);
  }

  /* -------------------------------------------------------- 深浅色主题 */

  var themeToggle = $('.theme-toggle');
  var themeAnimTimer = null;

  function currentTheme() {
    return root.getAttribute('data-theme') === 'light' ? 'light' : 'dark';
  }

  function applyTheme(theme, animate) {
    /* 只在用户主动切换时挂过渡类：首屏/跟随系统切换不加，否则会闪一下 */
    if (animate && !reduceMotion) {
      root.classList.add('theme-anim');
      clearTimeout(themeAnimTimer);
      themeAnimTimer = setTimeout(function () {
        root.classList.remove('theme-anim');
      }, 480);
    }

    root.setAttribute('data-theme', theme);
    try { localStorage.setItem('theme', theme); } catch (e) {}
    if (themeToggle) themeToggle.setAttribute('aria-pressed', String(theme === 'light'));
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'light' ? '#F5F6F8' : '#0A0B0D');
  }

  if (themeToggle) {
    themeToggle.addEventListener('click', function () {
      applyTheme(currentTheme() === 'light' ? 'dark' : 'light', true);
    });
  }

  applyTheme(currentTheme());

  window.matchMedia('(prefers-color-scheme: light)').addEventListener('change', function (e) {
    var saved = null;
    try { saved = localStorage.getItem('theme'); } catch (err) {}
    if (!saved) applyTheme(e.matches ? 'light' : 'dark');
  });

  /* ---------------------------------------------------------- 移动端导航 */

  var navToggle = $('.nav-toggle');
  var nav = $('#site-nav');

  function closeNav() {
    if (!nav || !navToggle) return;
    nav.classList.remove('is-open');
    navToggle.setAttribute('aria-expanded', 'false');
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      var open = nav.classList.toggle('is-open');
      navToggle.setAttribute('aria-expanded', String(open));
      navToggle.setAttribute('aria-label', open ? '收起导航菜单' : '展开导航菜单');
    });

    nav.addEventListener('click', function (e) {
      if (e.target.tagName === 'A') closeNav();
    });

    document.addEventListener('click', function (e) {
      if (!nav.classList.contains('is-open')) return;
      if (nav.contains(e.target) || navToggle.contains(e.target)) return;
      closeNav();
    });
  }

  /* ------------------------------------------------- 滚动进度 / 顶栏状态 */

  var header = $('#siteHeader');
  var progress = $('#scrollProgress');
  var toTop = $('#toTop');
  var scrollQueued = false;

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    var docH = document.documentElement.scrollHeight - window.innerHeight;
    var ratio = docH > 0 ? Math.min(y / docH, 1) : 0;

    if (header) header.classList.toggle('is-stuck', y > 8);
    if (progress) progress.style.transform = 'scaleX(' + ratio.toFixed(4) + ')';
    if (toTop) toTop.classList.toggle('is-visible', y > 600);

    scrollQueued = false;
  }

  window.addEventListener('scroll', function () {
    if (scrollQueued) return;
    scrollQueued = true;
    window.requestAnimationFrame(onScroll);
  }, { passive: true });

  onScroll();

  if (toTop) {
    toTop.addEventListener('click', function () {
      window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' });
    });
  }

  /* ------------------------------------------------------------ 导航高亮 */

  var navLinks = $$('#site-nav a');
  var sections = navLinks
    .map(function (a) { return document.querySelector(a.getAttribute('href')); })
    .filter(Boolean);

  if (sections.length && 'IntersectionObserver' in window) {
    var navObserver = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        navLinks.forEach(function (a) {
          a.classList.toggle('is-active', a.getAttribute('href') === '#' + entry.target.id);
        });
      });
    }, { rootMargin: '-45% 0px -50% 0px', threshold: 0 });

    sections.forEach(function (s) { navObserver.observe(s); });
  }

  /* -------------------------------------------------------- 滚动进场动画 */

  var revealTargets = $$('[data-reveal]');

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealTargets.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var revealObserver = new IntersectionObserver(function (entries, observer) {
      /* 同一批进入视口的元素按顺序错开，形成阶梯感 */
      var batch = entries.filter(function (e) { return e.isIntersecting; });
      batch.forEach(function (entry, i) {
        var el = entry.target;
        setTimeout(function () { el.classList.add('is-visible'); }, i * 70);
        observer.unobserve(el);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });

    revealTargets.forEach(function (el) { revealObserver.observe(el); });
  }

  /* ------------------------------------------------------ 卡片聚光跟随 */

  if (canHover && !reduceMotion) {
    $$('.cell').forEach(function (cell) {
      var queued = false;
      var px = 0, py = 0;

      cell.addEventListener('pointermove', function (e) {
        var rect = cell.getBoundingClientRect();
        px = e.clientX - rect.left;
        py = e.clientY - rect.top;
        if (queued) return;
        queued = true;
        window.requestAnimationFrame(function () {
          cell.style.setProperty('--mx', px.toFixed(1) + 'px');
          cell.style.setProperty('--my', py.toFixed(1) + 'px');
          queued = false;
        });
      });

      cell.addEventListener('pointerleave', function () {
        cell.style.removeProperty('--mx');
        cell.style.removeProperty('--my');
      });
    });
  }

  /* ---------------------------------------------------------- 环境光跟随 */

  var ambientGlow = $('.ambient__glow');

  if (ambientGlow && canHover && !reduceMotion) {
    var glowQueued = false;
    var gx = window.innerWidth / 2;
    var gy = window.innerHeight * 0.14;

    function paintGlow() {
      ambientGlow.style.setProperty('--ax', gx.toFixed(0) + 'px');
      ambientGlow.style.setProperty('--ay', gy.toFixed(0) + 'px');
      glowQueued = false;
    }

    window.addEventListener('pointermove', function (e) {
      gx = e.clientX;
      gy = e.clientY;
      if (glowQueued) return;
      glowQueued = true;
      window.requestAnimationFrame(paintGlow);
    }, { passive: true });

    paintGlow();
  }

  /* ------------------------------------------------------------ 数字滚动 */

  var counters = $$('[data-count]');

  function runCounter(el) {
    var target = parseFloat(el.getAttribute('data-count')) || 0;
    var duration = 1200;
    var start = null;

    function step(ts) {
      if (start === null) start = ts;
      var p = Math.min((ts - start) / duration, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = String(Math.round(target * eased));
      if (p < 1) window.requestAnimationFrame(step);
    }

    window.requestAnimationFrame(step);
  }

  if (counters.length) {
    if (reduceMotion || !('IntersectionObserver' in window)) {
      counters.forEach(function (el) { el.textContent = el.getAttribute('data-count'); });
    } else {
      var countObserver = new IntersectionObserver(function (entries, observer) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting) return;
          runCounter(entry.target);
          observer.unobserve(entry.target);
        });
      }, { threshold: 0.5 });

      counters.forEach(function (el) { countObserver.observe(el); });
    }
  }

  /* -------------------------------------------------------- 角色文字轮播 */

  var rotator = $('#roleRotator');

  if (rotator) {
    var roles = $$('.role-rotator__item', rotator);
    var roleIndex = 0;

    if (roles.length > 1 && !reduceMotion) {
      setInterval(function () {
        var outgoing = roles[roleIndex];
        outgoing.classList.remove('is-current');
        outgoing.classList.add('is-leaving');
        /* 等退场动画跑完再摘掉，避免它回落到进场初始位置造成重影 */
        setTimeout(function () { outgoing.classList.remove('is-leaving'); }, 520);

        roleIndex = (roleIndex + 1) % roles.length;
        roles[roleIndex].classList.add('is-current');
      }, 2600);
    }
  }

  /* ------------------------------------------------------------ 实时时钟 */

  var clockEl = $('#clock');

  if (clockEl) {
    var timeEl = $('.clock__time', clockEl);
    var zoneEl = $('.clock__zone', clockEl);
    var offsetMin = -new Date().getTimezoneOffset();
    var sign = offsetMin >= 0 ? '+' : '-';
    var absMin = Math.abs(offsetMin);
    var zoneLabel = 'UTC' + sign + Math.floor(absMin / 60) +
                    (absMin % 60 ? ':' + String(absMin % 60).padStart(2, '0') : '');

    if (zoneEl) zoneEl.textContent = zoneLabel;

    var pad = function (n) { return String(n).padStart(2, '0'); };

    function tick() {
      var d = new Date();
      if (timeEl) {
        timeEl.textContent = pad(d.getHours()) + ':' + pad(d.getMinutes()) + ':' + pad(d.getSeconds());
      }
    }

    tick();
    setInterval(tick, 1000);
  }

  /* -------------------------------------------------- 跑马灯无缝循环补位 */

  var marquee = $('[data-marquee]');

  if (marquee) {
    var track = $('.marquee__track', marquee);
    if (track) {
      /* 复制一份内容，配合 translate(-50%) 实现无缝衔接 */
      track.innerHTML += track.innerHTML;
    }
  }

  /* -------------------------------------------------------------- 复制 */

  function copyText(text) {
    if (navigator.clipboard && window.isSecureContext) {
      return navigator.clipboard.writeText(text);
    }
    return new Promise(function (resolve, reject) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      try {
        document.execCommand('copy');
        resolve();
      } catch (err) {
        reject(err);
      }
      document.body.removeChild(ta);
    });
  }

  $$('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var value = btn.getAttribute('data-copy');
      copyText(value).then(function () {
        toast('已复制：' + value);
      }).catch(function () {
        toast('复制失败，请手动选中复制');
      });
    });
  });

  /* --------------------------------------------------------- 快捷面板 */

  var palette = $('#palette');
  var paletteInput = $('#paletteInput');
  var paletteList = $('#paletteList');
  var palettePanel = palette ? $('.palette__panel', palette) : null;
  var paletteOpener = null;   /* 记住是谁打开的面板，关闭时把焦点还回去 */

  var ICONS = {
    jump:   '<path d="M5 12h13M13 6l6 6-6 6"/>',
    theme:  '<circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.2M12 19.3v2.2M4.2 4.2l1.6 1.6M18.2 18.2l1.6 1.6M2.5 12h2.2M19.3 12h2.2"/>',
    copy:   '<rect x="9" y="9" width="11" height="11" rx="2"/><path d="M5 15V6a2 2 0 0 1 2-2h9"/>',
    github: '<path d="M9 19c-4 1.5-4-2.5-6-3m12 5v-3.5c0-1 .1-1.4-.5-2 2.8-.3 5.5-1.4 5.5-6a4.6 4.6 0 0 0-1.3-3.2 4.2 4.2 0 0 0-.1-3.2s-1.1-.3-3.5 1.3a12 12 0 0 0-6.2 0C6.5 2.6 5.4 2.9 5.4 2.9a4.2 4.2 0 0 0-.1 3.2A4.6 4.6 0 0 0 4 9.3c0 4.6 2.7 5.7 5.5 6-.6.6-.6 1.2-.5 2V21"/>',
    mail:   '<rect x="3" y="5" width="18" height="14" rx="2.5"/><path d="M3.5 7l8.5 6 8.5-6"/>',
    top:    '<path d="M12 19V5M6 11l6-6 6 6"/>'
  };

  function svgIcon(name) {
    return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" ' +
           'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICONS[name] || ICONS.jump) + '</svg>';
  }

  var commands = [
    { label: '回到首页',   hint: '跳转', icon: 'jump',   run: function () { goTo('#home'); } },
    { label: '关于我',     hint: '跳转', icon: 'jump',   run: function () { goTo('#about'); } },
    { label: '技能栈',     hint: '跳转', icon: 'jump',   run: function () { goTo('#skills'); } },
    { label: '项目',       hint: '跳转', icon: 'jump',   run: function () { goTo('#projects'); } },
    { label: '联系方式',   hint: '跳转', icon: 'jump',   run: function () { goTo('#contact'); } },
    { label: '切换深浅色主题', hint: '外观', icon: 'theme',
      run: function () { applyTheme(currentTheme() === 'light' ? 'dark' : 'light', true); } },
    { label: '复制邮箱地址', hint: '复制', icon: 'copy',
      run: function () {
        var mail = $('.copy-mail');
        var value = mail ? mail.getAttribute('data-copy') : '';
        if (!value) return;
        copyText(value).then(function () { toast('已复制：' + value); });
      } },
    { label: '打开 GitHub', hint: '外链', icon: 'github',
      run: function () { window.open('https://github.com/sanbeitixigua123', '_blank', 'noopener'); } },
    { label: '发送邮件',   hint: '外链', icon: 'mail',
      run: function () {
        var mail = $('#mailBtn');
        if (mail) window.location.href = mail.getAttribute('href');
      } },
    { label: '回到页面顶部', hint: '滚动', icon: 'top',
      run: function () { window.scrollTo({ top: 0, behavior: reduceMotion ? 'auto' : 'smooth' }); } }
  ];

  var filtered = commands.slice();
  var cursor = 0;

  function goTo(hash) {
    var target = document.querySelector(hash);
    if (!target) return;
    var top = target.getBoundingClientRect().top + window.scrollY - 76;
    window.scrollTo({ top: top, behavior: reduceMotion ? 'auto' : 'smooth' });
  }

  function renderPalette() {
    if (!paletteList) return;
    if (!filtered.length) {
      paletteList.innerHTML = '<li class="palette__empty">没有匹配的命令</li>';
      return;
    }
    paletteList.innerHTML = filtered.map(function (cmd, i) {
      return '<li role="option" aria-selected="' + (i === cursor) + '">' +
             '<button type="button" class="palette__item" data-index="' + i + '" aria-selected="' + (i === cursor) + '">' +
             svgIcon(cmd.icon) + '<span>' + cmd.label + '</span><em>' + cmd.hint + '</em>' +
             '</button></li>';
    }).join('');
  }

  function moveCursor(delta) {
    if (!filtered.length) return;
    cursor = (cursor + delta + filtered.length) % filtered.length;
    renderPalette();
    var active = paletteList && paletteList.querySelector('[data-index="' + cursor + '"]');
    if (active) active.scrollIntoView({ block: 'nearest' });
  }

  function runCommand(index) {
    var cmd = filtered[index];
    closePalette();
    if (cmd) setTimeout(cmd.run, 60);
  }

  /* 面板声明了 aria-modal="true"，就得兑现模态行为：Tab 只在面板内循环。
     没有这个，键盘用户 Tab 几下就跑到面板背后的页面上去了。 */
  var FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]), ' +
                  'select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

  function trapTab(e) {
    if (e.key !== 'Tab' || !palettePanel) return;
    var items = $$(FOCUSABLE, palettePanel).filter(function (el) {
      return el.offsetParent !== null || el === document.activeElement;
    });
    if (!items.length) return;

    var first = items[0];
    var last = items[items.length - 1];
    var active = document.activeElement;

    /* 焦点已经在面板外（比如用鼠标点了背景），强行拉回第一个 */
    if (!palettePanel.contains(active)) {
      e.preventDefault();
      first.focus();
      return;
    }
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }

  function openPalette() {
    if (!palette) return;
    paletteOpener = document.activeElement;
    palette.hidden = false;
    cursor = 0;
    filtered = commands.slice();
    if (paletteInput) {
      paletteInput.value = '';
      paletteInput.focus();
    }
    renderPalette();
    document.addEventListener('keydown', trapTab, true);
  }

  function closePalette() {
    if (!palette || palette.hidden) return;
    palette.hidden = true;
    document.removeEventListener('keydown', trapTab, true);
    /* 焦点归位，否则焦点会留在已隐藏的节点上，键盘用户直接迷失 */
    if (paletteOpener && document.contains(paletteOpener)) {
      paletteOpener.focus();
    }
    paletteOpener = null;
  }

  if (palette) {
    $$('.cmd-open').forEach(function (btn) {
      btn.addEventListener('click', openPalette);
    });

    $$('[data-palette-close]').forEach(function (el) {
      el.addEventListener('click', closePalette);
    });

    if (paletteInput) {
      paletteInput.addEventListener('input', function () {
        var q = paletteInput.value.trim().toLowerCase();
        filtered = commands.filter(function (cmd) {
          return !q || cmd.label.toLowerCase().indexOf(q) > -1 || cmd.hint.toLowerCase().indexOf(q) > -1;
        });
        cursor = 0;
        renderPalette();
      });
    }

    if (paletteList) {
      paletteList.addEventListener('click', function (e) {
        var item = e.target.closest('[data-index]');
        if (item) runCommand(Number(item.getAttribute('data-index')));
      });
    }

    document.addEventListener('keydown', function (e) {
      var isOpen = !palette.hidden;

      /* Ctrl / Cmd + K 开关面板 */
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        isOpen ? closePalette() : openPalette();
        return;
      }

      if (!isOpen) {
        if (e.key === 'Escape') closeNav();
        return;
      }

      if (e.key === 'Escape')     { e.preventDefault(); closePalette(); }
      else if (e.key === 'ArrowDown') { e.preventDefault(); moveCursor(1); }
      else if (e.key === 'ArrowUp')   { e.preventDefault(); moveCursor(-1); }
      else if (e.key === 'Enter')     { e.preventDefault(); runCommand(cursor); }
    });
  }

  /* ---------------------------------------------------------------- 年份 */

  var yearEl = $('#year');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());
})();
