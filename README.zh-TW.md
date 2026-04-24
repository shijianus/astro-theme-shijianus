# astro-theme-shijianus

[English](./README.md) | [简体中文](./README.zh-CN.md)

`astro-theme-shijianus` 是一個以 Astro 為核心的個人部落格主題工作倉庫，目標是繼承 Hexo 與安知魚主題裡真正值得保留的優點：作者感、資訊密度、穩定的內容工作流，以及可以在任意裝置上快速複刻的工程體驗。

## 主要特性

- Astro 6 + React 19 + Tailwind 4。
- 相容桌面端與手機端，行動端不是補丁式處理。
- 延續並整合部分安知魚主題能力：右鍵選單、控制台面板、文章工具區、打賞面板、本地搜尋等。
- `translateLink` 已接入真正可用的繁簡切換。
- 本地評論支援管理員測試快捷入口。
- 新增 Markdown 模板命令、清理建置命令、GitHub 推送命令。

## 常用命令

```sh
npm install
npm run dev
npm run build
npm run preview:host
npm run clean
npm run build:clean
```

### 新建內容

```sh
npm run new:post -- "文章標題"
npm run new:draft -- "草稿標題"
npm run new:page -- "頁面標題"
```

### 設定遠端並推送

```sh
npm run repo:remote -- --repo https://github.com/shijianus/astro-theme-shijianus.git
npm run repo:push -- --remote origin --branch main
```

### 一步發布

```sh
npm run repo:publish -- --repo https://github.com/shijianus/astro-theme-shijianus.git --branch main --message "chore: publish theme update"
```

如果你要推到站點倉庫，也可以直接換成自己的倉庫位址，例如：

```sh
npm run repo:publish -- --repo https://github.com/shijianus/shijianus.github.io.git --branch main --message "chore: publish site"
```

## 管理員測試流程

建議在文章頁評論區依照下面流程測試真實互動：

1. 點擊 `使用管理員測試帳號`。
2. 點擊 `填充演示評論`。
3. 測試置頂、限制、編輯、刪除、追評、引用、按讚。
4. 再切換到 `使用讀者測試帳號`，驗證一般訪客流程。

這樣比手動改 `localStorage` 更直接，也更適合手機端和桌面端一起驗證。

## 繁簡支援

目前文件預設為英文，倉庫附帶簡中與繁中說明。

站點執行時目前支援：

- 簡體中文 `zh-CN`
- 繁體中文 `zh-Hant`

右下角浮動按鈕與右鍵選單中的語言切換都會真正觸發繁簡轉換，不再只是佔位按鈕。

## 跨裝置複刻

在任意裝置上複刻時，建議按照下面流程：

```sh
git clone <你的倉庫位址>
cd <專案目錄>
npm install
npm run build:clean
npm run preview:host
```

## 協議

本專案使用 [MIT License](./LICENSE)。
