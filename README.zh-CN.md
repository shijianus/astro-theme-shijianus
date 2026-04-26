# astro-theme-shijianus

[English](./README.md) | [繁體中文](./README.zh-TW.md)

`astro-theme-shijianus` 是一个以 Astro 为核心的个人博客主题工作仓库，目标是继承 Hexo 与安知鱼主题里真正值得保留的优点：作者感、信息密度、稳定的内容工作流，以及可以在任意设备上快速复刻的工程体验。

## 主要特性

- Astro 6 + React 19 + Tailwind 4。
- 兼容桌面端与手机端，移动端不是补丁式处理。
- 延续并整合部分安知鱼主题能力：右键菜单、控制台面板、文章工具区、打赏面板、本地搜索等。
- `translateLink` 已接入真实的繁简切换。
- 本地评论支持管理员测试快捷入口。
- 新增 Markdown 模板命令、清理构建命令、GitHub 推送命令。

## 常用命令

```sh
npm install
npm start
npm run dev
npm run build
npm run preview:host
npm run clean
npm run build:clean
```

### 新建内容

```sh
npm run new:post -- "文章标题"
npm run new:draft -- "草稿标题"
npm run new:page -- "页面标题"
```

### 设置远端并推送

```sh
npm run repo:remote -- --repo https://github.com/shijianus/astro-theme-shijianus.git
npm run repo:push -- --remote origin --branch main
```

### 一步发布

```sh
npm run repo:publish -- --repo https://github.com/shijianus/astro-theme-shijianus.git --branch main --message "chore: publish theme update"
```

如果你要推到站点仓库，也可以直接换成自己的仓库地址，例如：

```sh
npm run repo:publish -- --repo https://github.com/shijianus/shijianus.github.io.git --branch main --message "chore: publish site"
```

## 管理员测试流程

推荐在文章页评论区按下面流程测试真实交互：

1. 点击 `使用管理员测试账号`。
2. 点击 `填充演示评论`。
3. 测试置顶、限制、编辑、删除、追评、引用、点赞。
4. 再切换到 `使用读者测试账号`，验证普通访客流程。

这样比手动改 `localStorage` 更直接，也更适合手机端和桌面端一起验。

## 繁简支持

当前文档默认英文，仓库附带简中与繁中说明。

站点运行时目前支持：

- 简体中文 `zh-CN`
- 繁体中文 `zh-Hant`

右下角悬浮按钮和右键菜单里的语言切换都会真正触发繁简转换，不再只是占位按钮。

## 跨设备复刻

在任意设备上复刻时，建议按下面流程：

```sh
git clone <你的仓库地址>
cd <项目目录>
npm install
npm run build:clean
npm run preview:host
```

## 协议

本项目使用 [MIT License](./LICENSE)。
