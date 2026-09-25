# 个人网站

个人主页 / 作品集，纯静态站点，零依赖、零构建步骤。

## 目录结构

```
个人网站/
├── index.html          页面结构与内容
├── css/style.css       全部样式，配色变量集中在 :root
├── js/main.js          主题切换、移动端导航、页脚年份
├── assets/
│   ├── images/         图片资源
│   └── fonts/          自托管字体（可选）
└── .workbuddy-ai/      WorkBuddy 工作空间数据，不入版本库
```

## 本地预览

直接双击 `index.html` 即可，或者起一个本地服务器（推荐，避免部分浏览器的
本地文件跨域限制）：

```bash
# Python
python -m http.server 8000

# Node
npx serve .
```

然后访问 http://localhost:8000

## 改成你自己的内容

按顺序改这几处就够了：

1. **index.html**
   - `<title>` 和 `<meta name="description">`
   - 顶栏 `.brand` 里的名字
   - `.hero` 区块的标题、简介、按钮文字
   - `#about`、`#skills`、`#projects`、`#contact` 四个区块的正文
   - 联系方式的邮箱和 GitHub 链接
2. **css/style.css** 的 `:root` — 改 `--accent` 换主题色，
   `[data-theme="dark"]` 里是暗色配色
3. **assets/images/** — 放头像、项目截图等

## 特性

- 响应式布局，移动端有折叠菜单
- 自动跟随系统深浅色，也可手动切换（选择记忆在 localStorage）
- 语义化标签 + 键盘可达（跳转链接、focus 样式、aria 属性）
- 支持 `prefers-reduced-motion`，对动画敏感的用户自动关闭过渡

## 部署

纯静态，随便扔哪都行：

- **GitHub Pages** — 推到仓库后在 Settings → Pages 里选分支
- **Cloudflare Pages / Vercel / Netlify** — 连仓库，构建命令留空，输出目录填 `.`
- **腾讯云 / 阿里云 OSS** — 上传整个目录，开启静态网站托管

## 待办

- [ ] 替换所有占位文字和链接
- [ ] 补充项目详情页（或改成从 JSON 渲染）
- [ ] 加 favicon（`assets/images/favicon.ico`）
- [ ] 加 Open Graph 标签，便于分享时显示预览卡片
- [ ] `git init` 后推到 GitHub
