# COACH AI 🏋️

智能健身管理 PWA App — 支援多人帳號、離線使用、可安裝到 iOS/Android 桌面。

## 功能
- 首頁 Dashboard（今日完成度、AI 教練建議）
- 營養記錄（拍照辨識食物）
- 體組成追蹤（掃描體脂計截圖）
- 健身房訓練（PPL 課表）
- 居家訓練（40分鐘 HIIT + 超慢跑）
- 水分記錄（杯子動畫 + 推播提醒）
- 睡眠記錄（趨勢分析）
- 個人設定（多帳號管理）

## 部署到 Vercel

### 方法一：GitHub 自動部署
1. 把這個資料夾推到 GitHub repo
2. 到 [vercel.com](https://vercel.com) 匯入 repo
3. Vercel 自動偵測 Vite，點 Deploy 即可

### 方法二：本機 build 後部署
```bash
npm install
npm run build
npx vercel --prod
```

## 手機安裝步驟

### iOS（Safari）
1. 用 Safari 開啟 App 網址
2. 點下方「分享」按鈕
3. 選「加入主畫面」
4. 點「新增」完成

### Android（Chrome）
1. 用 Chrome 開啟 App 網址
2. 點右上角三點選單
3. 選「安裝應用程式」或「加入主畫面」

## AI 功能設定
在「個人設定」頁面輸入 Anthropic API Key（`sk-ant-...`）即可啟用：
- 拍照辨識食物熱量
- 掃描體脂計數據
- AI 教練每日建議
- 體組成趨勢分析
- 睡眠恢復建議
