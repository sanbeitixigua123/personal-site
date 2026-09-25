# 个人网站

深色优先的 Bento 便当格个人主页。纯静态、零依赖、零构建步骤，
可以直接托管在 GitHub Pages 上。

## 目录结构

```
个人网站/
├── index.html              页面结构与全部文案
├── css/style.css           设计系统：令牌 + 布局 + 组件 + 动效
├── js/main.js              全部交互逻辑
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

## 改成你自己的内容

所有需要替换的地方都在 `index.html` 里，按顺序改这几处：

1. **`<head>`** — `<title>`、`<meta name="description">`、`og:*` 里的 URL 和封面图
2. **首屏 `.cell--intro`** — 状态徽章、`<h1>` 名字、三个职位轮播文案、简介、按钮链接
3. **`.cell--avatar`** — 目前是芯片占位图。把照片放进 `assets/images/avatar.png`，
   然后把里面的 `<svg>` 整段换成 `<img src="assets/images/avatar.png" alt="头像">`
4. **`#about`** — 三段自我介绍、三条「现在关注 / 可以合作 / 工作方式」
5. **统计数字** — 三处 `data-count="5|3|20"`，改数字即可，滚动时会自动缓动
6. **`#skills`** — 六张技能卡的文字和标签
7. **`#projects`** — 项目名称、描述、技术标签、详情链接。
   重点项目是 `.cell--featured`，另外两个是普通 `.cell`
8. **`#contact`** — 邮箱（`mailto:`、`data-copy`、显示文本三处要一起改）、
   微信号（`data-copy="你的微信号"`）、GitHub 链接
9. **`js/main.js`** — 快捷面板里 GitHub 地址和邮箱命令，搜索 `sanbeitixigua123` 和 `you@example.com`

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

1. 推到 GitHub 仓库
2. 仓库 Settings → Pages → Source 选 `Deploy from a branch`
3. 分支选 `main`，目录选 `/ (root)`，保存
4. 等一两分钟，访问 `https://<用户名>.github.io/<仓库名>/`

如果仓库名就叫 `<用户名>.github.io`，访问地址会直接是
`https://<用户名>.github.io/`，没有子路径，最干净。

## 待办

- [ ] 替换所有占位文案（名字、邮箱、微信号、项目）
- [ ] 放一张头像到 `assets/images/avatar.png` 并替换占位图
- [ ] 做一张 `assets/images/og-cover.png`（建议 1200×630）用于分享预览
- [ ] 补充项目详情页，或改成从 JSON 渲染
- [ ] 视需要加「工作经历时间线」区块
