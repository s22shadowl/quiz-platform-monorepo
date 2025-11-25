# 開發者文件 (Development Documentation)

## 1. 相依性管理與已知問題 (Dependency Management & Known Issues)

### 1.1 Svelte 4 與 Vite 6 的相容性衝突
*   **問題描述**: 
    *   專案目前使用 **Svelte 4** (`^4.2.7`)。
    *   `npm audit` 回報 `vite` 5.x 存在中度弱點，建議升級至 `vite` 6.x。
    *   然而，`@sveltejs/vite-plugin-svelte` 的最新版 (6.x) 支援 Vite 6，但強制要求 **Svelte 5**。
    *   `@sveltejs/vite-plugin-svelte` 的舊版 (3.x) 支援 Svelte 4，但僅支援 Vite 5。
*   **決策**: 
    *   **維持 Svelte 4 架構**：升級至 Svelte 5 屬於重大改版，目前不進行。
    *   **鎖定版本**：
        *   `vite`: `^5.4.0` (Svelte 4 生態系支援的最高版本)。
        *   `vitest`: `^2.1.0`。
        *   `@sveltejs/vite-plugin-svelte`: `^3.1.0`。
*   **影響**: 
    *   `npm audit` 可能會持續回報與 Vite 5 相關的潛在弱點。
    *   在 Svelte 5 遷移計畫啟動前，需接受此狀態。

### 1.2 測試覆蓋率 (Test Coverage)
*   **工具**: `@vitest/coverage-v8`
*   **執行**: `npm run coverage`
*   **現狀**: 
    *   核心邏輯 (Stores, Utils) 覆蓋率 > 90%。
    *   UI 元件 (Svelte Components) 目前未納入測試 (0%)。
*   **未來規劃**: 預計於 Phase 10 引入 UI 自動化測試。

## 2. 分支管理規範 (Branch Management)
*   **Feature Branch**: `feature/phase-X-description` (功能開發)
*   **Chore Branch**: `chore/description` (工具設定、雜項)
*   **Main Branch**: 隨時保持可部署狀態 (Deployable)。
