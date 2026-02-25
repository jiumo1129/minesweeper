# 扫雷游戏 - 手机安装指南

## 方法一：使用 Expo Go（最简单，无需编译）

这是最快速的方式，**无需安装任何开发工具**，适合 Android 和 iOS。

### 步骤

1. **在手机上安装 Expo Go**
   - Android：[Google Play 搜索 "Expo Go"](https://play.google.com/store/apps/details?id=host.exp.exponent)
   - iOS：[App Store 搜索 "Expo Go"](https://apps.apple.com/app/expo-go/id982107779)

2. **在电脑上安装 Node.js 和 pnpm**
   ```bash
   # 安装 Node.js（推荐 v20+）：https://nodejs.org
   # 安装 pnpm
   npm install -g pnpm
   ```

3. **解压项目代码并安装依赖**
   ```bash
   cd minesweeper
   pnpm install
   ```

4. **启动开发服务器**
   ```bash
   pnpm run dev:metro
   ```

5. **用手机扫描二维码**
   - 终端会显示一个二维码
   - Android：直接用 Expo Go 扫描
   - iOS：用系统相机扫描，然后点击弹出的提示

> 注意：手机和电脑需在同一 Wi-Fi 网络下。

---

## 方法二：构建 APK（Android，需要 EAS 账号）

这种方式可以生成独立的 APK 文件，安装后无需 Expo Go。

### 前提条件

- 注册免费的 [Expo 账号](https://expo.dev/signup)
- 安装 EAS CLI

### 步骤

```bash
# 1. 安装 EAS CLI
npm install -g eas-cli

# 2. 登录 Expo 账号
eas login

# 3. 进入项目目录
cd minesweeper

# 4. 初始化 EAS 配置（首次运行）
eas build:configure

# 5. 构建 APK（免费，在云端构建，约需 10-15 分钟）
eas build --platform android --profile preview
```

构建完成后，EAS 会提供一个下载链接，下载 APK 后直接安装到 Android 手机即可。

> **注意**：安装前需要在手机设置中开启"允许安装未知来源应用"。

---

## 方法三：本地构建 APK（需要 Android SDK）

如果你已安装 Android Studio，可以在本地构建：

```bash
# 在项目目录中
cd minesweeper

# 生成原生 Android 项目
npx expo prebuild --platform android

# 进入 Android 目录构建
cd android
./gradlew assembleRelease

# APK 位置：android/app/build/outputs/apk/release/app-release.apk
```

---

## 游戏操作说明

| 操作 | 说明 |
|------|------|
| 点击格子 | 在**挖掘模式**下翻开格子 |
| 切换插旗模式 | 点击底部"🚩 插旗"按钮 |
| 插旗/取消旗 | 在**插旗模式**下点击格子 |
| 重新开始 | 点击顶部中间的表情按钮 🙂 |
| 切换难度 | 点击"初级 / 中级 / 专家"按钮 |

## 难度说明

| 难度 | 棋盘大小 | 地雷数 |
|------|----------|--------|
| 初级 | 9 × 9    | 10     |
| 中级 | 16 × 16  | 40     |
| 专家 | 16 × 30  | 99     |
