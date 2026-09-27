# 个人网站

深色优先的 Bento 便当格个人主页。纯静态、零依赖、零构建步骤，
可以直接托管在 GitHub Pages 上。

## 目录结构

```
个人网站/
├── index.html              页面结构与全部文案
├── css/style.css           设计系统：令牌 + 布局 + 组件 + 动效
├── js/main.js              界面交互逻辑
├── js/particles.js         悬浮粒子场（Canvas 2D，独立成文件）
├── assets/
│   ├── favicon.svg         站点图标
│   ├── images/             头像、项目截图、OG 封面图
│   └── fonts/              自托管字体（可选，目前走 CDN + 系统字体回退）
└── .workbuddy-ai/          WorkBuddy 工作空间数据，不入版本库
```

## 本地预览

```bash
# Python
python -m http.server 8000

# Node
npx serve .
```

然后访问 http://localhost:8000

## 设计说明

**风格**：深色优先的 Bento 便当格。卡片按 6 列网格拼贴，
用不等宽的分栏制造节奏感，而不是均分的三列卡片。

**配色**：单一强调色（青绿 `#34D3AE`），其余全部交给中性灰阶。
深浅两套主题的变量都在 `css/style.css` 的 `:root` 和 `[data-theme="light"]` 里。

**字体**：正文优先用系统字体（PingFang SC / 微软雅黑），
拉丁字母和数字用 Geist Variable（走 jsDelivr CDN，非阻塞加载，
加载失败自动回退系统字体，不影响首屏）。

## 交互清单

| 交互 | 说明 |
|---|---|
| 滚动进场 | 元素进入视口时淡入上移，同批元素按 70ms 阶梯错开 |
| 悬浮粒子场 | 全屏点阵缓慢漂浮，鼠标靠近时被推开，带跟随光晕 |
| 卡片聚光 | 鼠标位置写入 `--mx` / `--my`，驱动柔光和描边高亮跟随 |
| 环境光 | 页面背景的大面积柔光跟随鼠标移动 |
| 角色轮播 | 首屏职位文字每 2.6 秒切换一次 |
| 数字滚动 | 关于区的统计数字进入视口后缓动到目标值 |
| 实时时钟 | 显示访客本地时间和时区 |
| 技术栈跑马灯 | 无限横向滚动，悬停暂停 |
| 快捷面板 | `Ctrl / Cmd + K` 唤起，支持搜索、方向键选择、回车执行 |
| 主题切换 | 深浅色切换，选择记忆在 localStorage，未手动选过时跟随系统 |
| 导航高亮 | 滚动时自动高亮当前区块 |
| 滚动进度 | 顶栏底部细线指示阅读进度 |
| 复制反馈 | 点击复制邮箱 / 微信号，右下角弹出提示条 |

## 悬浮粒子场

`js/particles.js` 是一个 Canvas 2D 的点阵粒子场，**零依赖**。

思路移植自 [ReactBits](https://reactbits.dev) 的 DotField 组件，但本站是原生
HTML/CSS/JS 站点，不引入 React，所以是**用原生 JS 重写**而不是引入。
另外原版的点阵是静止的（只有鼠标靠近才动），这里补了一层「静止时也缓慢漂浮」
的位移，才符合「悬浮粒子」的观感。

它跟 ReactBits 原版的三处差异：

1. 加了逐点独立的漂浮相位与呼吸节奏，不会退化成死板点阵
2. 每点尺寸在 0.7~1.55 倍之间随机（用坐标哈希，重建后保持一致不会闪）
3. 点数按视口面积自适应，上限 2400，4K 屏也不会拖帧

想调效果改 `js/particles.js` 顶部的 `CFG`：

```js
var CFG = {
  dotRadius: 1.5,       // 点的半径
  spacing: 21,          // 点阵间距，越小越密
  cursorRadius: 260,    // 鼠标影响半径
  bulgeStrength: 68,    // 被推开的最大距离
  idleFloat: 3.2,       // 静止漂浮幅度（调小会退回点阵观感）
  ...
};
```

配色走 CSS 变量，深浅色各一套，改 `css/style.css` 里的
`--particle-from` / `--particle-to` / `--particle-glow` 即可。

**行为约定**：页面切到后台会暂停渲染；`prefers-reduced-motion` 下只画一帧
静止点阵；触屏设备不做鼠标交互，只保留漂浮。

## 改成你自己的内容

所有需要替换的地方都在 `index.html` 里，按顺序改这几处：

1. **`<head>`** — `<title>`、`<meta name="description">`、`og:*` 里的 URL 和封面图
2. **首屏 `.cell--intro`** — 头像、`<h1>` 名字、三个职位轮播文案、简介、按钮链接。
   头像和名字在同一个 `.intro__head` 里并排，头像尺寸由 `css/style.css` 的
   `.avatar { width: clamp(62px, 6.4vw, 92px) }` 控制
3. **头像** — `assets/images/avatar.png`，512×512 透明底。
   换成自己的照片时保持正方形即可，会自动裁切填充。
   想用白底原图就把 `index.html` 里的 `avatar.png` 改成 `avatar.jpg`
4. **首屏右侧 `.cell--clock`** — 本地时间、状态徽章、底部说明。
   中间的信号波形是纯装饰（`.clock__trace`），不想要直接删掉那个 `div`
5. **`#about`** — 三段自我介绍、三条「现在关注 / 可以合作 / 工作方式」
6. **统计数字** — 三处 `data-count="5|3|20"`，改数字即可，滚动时会自动缓动
7. **`#skills`** — 六张技能卡的文字和标签
8. **`#projects`** — 项目名称、描述、技术标签、详情链接。
   重点项目是 `.cell--featured`，另外两个是普通 `.cell`
9. **`#contact`** — 邮箱（`mailto:`、`data-copy`、显示文本三处要一起改）、
   微信号（`data-copy` 与显示文本）、GitHub 链接
10. **`js/main.js`** — 快捷面板里的 GitHub 地址，搜索 `sanbeitixigua123`

> 注意：`index.html` 里如果出现 `data-page-node-id` 属性，那是编辑器留下的痕迹。
> 提交前跑一下 `python .workbuddy-ai/strip-nodes.py` 清掉。

## 主题色怎么换

改 `css/style.css` 里的这几个变量就够了：

```css
:root {
  --accent:      #34D3AE;   /* 强调色 */
  --accent-2:    #7CE7CE;   /* 悬停态 */
  --accent-ink:  #052B22;   /* 强调色上的文字 */
  --accent-soft: rgba(52, 211, 174, 0.12);  /* 淡色底 */
  --glow:        rgba(52, 211, 174, 0.10);  /* 聚光 */
}
```

浅色主题在 `[data-theme="light"]` 里对应改一遍。

## 无障碍

- 语义化标签、跳转链接、`aria-*` 属性、可见的键盘焦点轮廓
- 全部动效尊重 `prefers-reduced-motion`
- 触屏设备自动关闭聚光和鼠标跟随（只保留悬停反馈）
- 深浅色同时通过 `<meta name="color-scheme">` 告知浏览器

## 部署到 GitHub Pages

仓库：`sanbeitixigua123/personal-site`
上线地址：`https://sanbeitixigua123.github.io/personal-site/`

首次部署需要在仓库里开一次 Pages：

1. 仓库 Settings → Pages
2. Source 选 `Deploy from a branch`
3. 分支选 `main`，目录选 `/ (root)`，保存
4. 等一两分钟访问上面的地址

之后每次 `git push` 到 `main`，站点会自动重新发布。

## 待办

- [x] 替换占位文案（名字、邮箱、微信号）
- [x] 接入头像 `assets/images/avatar.jpg`
- [x] 生成分享封面 `assets/images/og-cover.png`（1200×630）
- [ ] **替换三个项目的名称与描述** —— 目前仍是占位内容
- [ ] **核对统计数字** —— 开发年限 5 年 / 主控平台 3 套 / 完成项目 20 个
- [ ] **核对首屏状态徽章** —— 目前写的是「开放技术交流与项目合作」
- [ ] 补充项目详情页，或改成从 JSON 渲染
- [ ] 视需要加「工作经历时间线」区块
