import { SuperBandClient } from "./baji.js?v=48";
import { initLanguage, setLanguage, getCurrentLang, t } from "./i18n.js?v=48";

// DOM 元素引用
const $ = (id) => document.getElementById(id);
const $logBox = $("logBox");
const $connStatus = $("connStatus");
const $connStatusText = $("connStatusText");
const $btnConnect = $("btnConnect");
const $btnQuickReconnect = $("btnQuickReconnect");
const $btnDisconnect = $("btnDisconnect");
const $btnRefreshInfo = $("btnRefreshInfo");
const $btnFindMe = $("btnFindMe");
const $lastDeviceBox = $("lastDeviceBox");
const $lastDeviceNameText = $("lastDeviceNameText");
const $btnForgetDevice = $("btnForgetDevice");
const $chkAutoReconnect = $("chkAutoReconnect");
const $chkAllDevices = $("chkAllDevices");
const $detailsScanFilter = $("detailsScanFilter");
const $btnLangZh = $("btnLangZh");
const $btnLangEn = $("btnLangEn");

// 設備資訊
const $infoName = $("infoName");
const $infoResolution = $("infoResolution");
const $infoProfile = $("infoProfile");
const $infoVersion = $("infoVersion");
const $infoStorageText = $("infoStorageText");
const $btnRefreshSpace = $("btnRefreshSpace");
const $selectedImageSize = $("selectedImageSize");
const $deviceRemainingSpace = $("deviceRemainingSpace");
const $storageFill = $("storageFill");

// 裁切器相關
const $cropCanvas = $("cropCanvas");
const cropCtx = $cropCanvas.getContext("2d");
const $dropArea = $("dropArea");
const $dropTip = $("dropTip");
const $fileImageInput = $("fileImageInput");
const $btnSelectFile = $("btnSelectFile");
const $selCropShape = $("selCropShape");
const $selResolution = $("selResolution");
const $selFormat = $("selFormat");
const $btnZoomOut = $("btnZoomOut");
const $zoomRange = $("zoomRange");
const $btnZoomIn = $("btnZoomIn");
const $zoomVal = $("zoomVal");
const $btnRotateLeft = $("btnRotateLeft");
const $btnRotateRight = $("btnRotateRight");
const $btnResetCrop = $("btnResetCrop");
const $txtPhotoName = $("txtPhotoName");
const $previewDimensions = $("previewDimensions");
const $previewFileSize = $("previewFileSize");
const $btnUploadCropped = $("btnUploadCropped");

// GIF / 影片
const $fileMediaInput = $("fileMediaInput");
const $btnSelectMedia = $("btnSelectMedia");
const $txtMediaName = $("txtMediaName");
const $selMediaType = $("selMediaType");
const $btnUploadMedia = $("btnUploadMedia");
const $mediaPreviewContainer = $("mediaPreviewContainer");
const $mediaDetails = $("mediaDetails");
const $mediaDropArea = $("mediaDropArea");

// 多圖輪播製作 AVI
const $btnPrevSlide = $("btnPrevSlide");
const $slideCounterLabel = $("slideCounterLabel");
const $btnNextSlide = $("btnNextSlide");
const $btnToggleSlidePreview = $("btnToggleSlidePreview");
const $slideshowDropArea = $("slideshowDropArea");
const $slideshowCanvas = $("slideshowCanvas");
const slideshowCtx = $slideshowCanvas ? $slideshowCanvas.getContext("2d") : null;
const $slideshowDropTip = $("slideshowDropTip");
const $btnSlideZoomOut = $("btnSlideZoomOut");
const $slideshowZoomRange = $("slideshowZoomRange");
const $btnSlideZoomIn = $("btnSlideZoomIn");
const $slideshowZoomVal = $("slideshowZoomVal");
const $btnSlideRotateLeft = $("btnSlideRotateLeft");
const $btnSlideRotateRight = $("btnSlideRotateRight");
const $btnResetSlideCrop = $("btnResetSlideCrop");
const $fileSlideshowInput = $("fileSlideshowInput");
const $btnAddSlides = $("btnAddSlides");
const $btnClearSlides = $("btnClearSlides");
const $selSlideshowShape = $("selSlideshowShape");
const $selSlideshowRes = $("selSlideshowRes");
const $selSlideInterval = $("selSlideInterval");
const $slideshowCountDuration = $("slideshowCountDuration");
const $slideshowEstimatedSize = $("slideshowEstimatedSize");
const $slideshowRemainingSpace = $("slideshowRemainingSpace");
const $txtSlideshowName = $("txtSlideshowName");
const $btnExportSlideshowAvi = $("btnExportSlideshowAvi");
const $btnUploadSlideshow = $("btnUploadSlideshow");
const $slideshowThumbList = $("slideshowThumbList");

// 進度條與非阻塞提示橫幅
const $progressWrap = $("progressWrap");
const $progressFill = $("progressFill");
const $progressStatusText = $("progressStatusText");
const $progressBytesText = $("progressBytesText");
const $btnClearLog = $("btnClearLog");
const $uploadNotice = $("uploadNotice");
const $uploadNoticeTitle = $("uploadNoticeTitle");
const $uploadNoticeBody = $("uploadNoticeBody");
const $btnCloseNotice = $("btnCloseNotice");

let lastConnState = { connected: false, deviceName: "", profileName: "", profileKey: null };
let lastDeviceInfo = null;
let lastNoticeState = null;

function hideNotice() {
  lastNoticeState = null;
  if (!$uploadNotice) return;
  $uploadNotice.className = "notice-banner";
}

function renderNotice(state) {
  if (!state || !$uploadNotice || !$uploadNoticeTitle || !$uploadNoticeBody) return;
  $uploadNotice.className = `notice-banner visible ${state.kind}`;
  $uploadNoticeTitle.textContent = state.titleKey
    ? t(state.titleKey, state.titleParams || {})
    : (state.rawTitle || "");
  $uploadNoticeBody.textContent = state.bodyKey
    ? t(state.bodyKey, state.bodyParams || {})
    : (state.rawBody || "");
}

function showNotice(kind, opts = {}) {
  lastNoticeState = { kind, ...opts };
  renderNotice(lastNoticeState);
}

if ($btnCloseNotice) {
  $btnCloseNotice.addEventListener("click", hideNotice);
}

// 日誌輸出
function log(msg) {
  const now = new Date();
  const timeStr = now.toTimeString().split(" ")[0];
  $logBox.textContent += `[${timeStr}] ${msg}\n`;
  $logBox.scrollTop = $logBox.scrollHeight;
}

// 捕獲未處理的全域 JavaScript 錯誤並印在日誌面板
window.addEventListener("error", (e) => {
  log(t("logScriptError", {
    msg: e.message,
    file: e.filename?.split("/").pop() || "",
    line: e.lineno || 0,
  }));
});
window.addEventListener("unhandledrejection", (e) => {
  log(t("logUnhandledRejection", { reason: e.reason?.message || e.reason }));
});

$btnClearLog.addEventListener("click", () => {
  $logBox.textContent = "";
});

// 初始化 SuperBand BLE 客戶端
const client = new SuperBandClient(log);
client.onDisconnected = () => {
  log(t("logBleDisconnected"));
  updateUIConnectionState(false);
};

// 記錄本次連線觀測到之可用 Flash 基準上限與目前剩餘空間
let observedTotalFlashKb = 0;
let lastFreeStorageKb = null;

function getBadgeMaxDimension() {
  return client.protocolKind === "zrun_e05" ? 512 : 359;
}

// ==========================================
// 1. 藍牙連線與設備管理
// ==========================================
function updateUIConnectionState(connected, info = null) {
  if (connected) {
    lastConnState = {
      connected: true,
      deviceName: info?.deviceName || "SuperBand",
      profileName: info?.profileName || "",
      profileKey: info?.profileKey || null,
    };
    $connStatus.classList.add("connected");
    $connStatusText.textContent = t("statusConnected", { name: lastConnState.deviceName });
    $btnConnect.disabled = true;
    $btnDisconnect.disabled = false;
    $btnRefreshInfo.disabled = false;
    $btnFindMe.disabled = client.protocolKind === "zrun_e05";
    $btnUploadCropped.disabled = false;
    $btnUploadMedia.disabled = false;
    if ($btnUploadSlideshow) $btnUploadSlideshow.disabled = false;
    if ($btnRefreshSpace) $btnRefreshSpace.disabled = false;
    if ($btnQuickReconnect) $btnQuickReconnect.style.display = "none";
  } else {
    lastConnState = { connected: false, deviceName: "", profileName: "", profileKey: null };
    lastDeviceInfo = null;
    $connStatus.classList.remove("connected");
    $connStatusText.textContent = t("statusDisconnected");
    $btnConnect.disabled = false;
    $btnDisconnect.disabled = true;
    $btnRefreshInfo.disabled = true;
    $btnFindMe.disabled = true;
    $btnUploadCropped.disabled = true;
    $btnUploadMedia.disabled = true;
    if ($btnUploadSlideshow) $btnUploadSlideshow.disabled = true;
    if ($btnRefreshSpace) $btnRefreshSpace.disabled = true;

    observedTotalFlashKb = 0;
    lastFreeStorageKb = null;
    $infoName.textContent = "-";
    $infoResolution.textContent = "-";
    $infoProfile.textContent = "-";
    $infoVersion.textContent = "-";
    $infoStorageText.textContent = "-";
    if ($deviceRemainingSpace) $deviceRemainingSpace.textContent = "-";
    if ($slideshowRemainingSpace) $slideshowRemainingSpace.textContent = "-";
    $storageFill.style.width = "0%";
    if (typeof renderMediaDetails === "function") renderMediaDetails();
    if (typeof updateSlideshowEstimate === "function") updateSlideshowEstimate();
    updateLastDeviceUI();
  }
}

// ==========================================
// 上次連線裝置紀錄與快速重新連線
// ==========================================
function saveLastConnectedDevice(device, res = null) {
  if (!device) return;
  try {
    const id = device.id || "";
    const name = device.name || (res && res.deviceName) || "Badge";
    if (id) {
      localStorage.setItem("jetbadge_last_device_id", id);
      localStorage.setItem("jetbadge_last_device_name", name);
    }
  } catch (e) {}
  updateLastDeviceUI();
}

function getLastSavedDeviceInfo() {
  try {
    const id = localStorage.getItem("jetbadge_last_device_id");
    const name = localStorage.getItem("jetbadge_last_device_name");
    if (id) return { id, name: name || "Badge" };
  } catch (e) {}
  return null;
}

function updateLastDeviceUI() {
  const last = getLastSavedDeviceInfo();
  if (last && last.id) {
    if ($lastDeviceBox) $lastDeviceBox.style.display = "flex";
    if ($lastDeviceNameText) $lastDeviceNameText.textContent = last.name;
    if ($btnQuickReconnect) {
      if (!client.isConnected) {
        $btnQuickReconnect.style.display = "inline-flex";
        $btnQuickReconnect.textContent = `⚡ ${t("btnQuickReconnect")} (${last.name})`;
      } else {
        $btnQuickReconnect.style.display = "none";
      }
    }
  } else {
    if ($lastDeviceBox) $lastDeviceBox.style.display = "none";
    if ($btnQuickReconnect) $btnQuickReconnect.style.display = "none";
  }
}

// 自動重連勾選狀態持久化（預設勾選）
if ($chkAutoReconnect) {
  try {
    const savedAuto = localStorage.getItem("jetbadge_auto_reconnect");
    $chkAutoReconnect.checked = savedAuto !== "0";
  } catch (e) {
    $chkAutoReconnect.checked = true;
  }

  $chkAutoReconnect.addEventListener("change", () => {
    try {
      localStorage.setItem("jetbadge_auto_reconnect", $chkAutoReconnect.checked ? "1" : "0");
    } catch (e) {}
  });
}

// 清除上次連線裝置記憶
if ($btnForgetDevice) {
  $btnForgetDevice.addEventListener("click", async () => {
    const last = getLastSavedDeviceInfo();
    try {
      if (last && last.id && typeof client.getPermittedDevices === "function") {
        const permitted = await client.getPermittedDevices();
        const target = permitted.find(d => d.id === last.id);
        if (target && typeof target.forget === "function") {
          await target.forget();
        }
      }
      localStorage.removeItem("jetbadge_last_device_id");
      localStorage.removeItem("jetbadge_last_device_name");
    } catch (e) {}
    updateLastDeviceUI();
    log(t("logDeviceForgotten"));
  });
}

// 執行連線至特定設備並初始化狀態
async function performDeviceConnection(target) {
  const res = await client.connectDevice(target);
  saveLastConnectedDevice(target, res);
  updateUIConnectionState(true, res);
  if ($infoProfile) {
    $infoProfile.textContent = res.profileKey ? t(res.profileKey) : res.profileName;
  }
  if ($selFormat) {
    $selFormat.value = res.protocolKind === "zrun_e05" ? "jpeg" : "avi";
  }
  await refreshDeviceInfo();
  log(t("logConnectedSuccess", { name: target.name || res.deviceName }));
  return res;
}

// 傳輸前檢查連線狀態，若徽章待機或暫時斷線則自動無縫重新連線
async function ensureConnectionActive(statusMessage = t("progressAutoReconnecting")) {
  if (client.isConnected) return true;
  let target = client.device;
  const last = getLastSavedDeviceInfo();
  if (!target && typeof client.getPermittedDevices === "function") {
    try {
      const permitted = await client.getPermittedDevices();
      if (permitted && permitted.length > 0) {
        if (last && last.id) {
          target = permitted.find(d => d.id === last.id) || permitted.find(d => d.name === last.name) || permitted[0];
        } else {
          target = permitted[0];
        }
      }
    } catch (_) {}
  }
  if (!target) {
    updateUIConnectionState(false);
    return false;
  }

  showProgress(true, statusMessage);
  log(t("logAutoReconnectingForUpload"));
  try {
    await performDeviceConnection(target);
    log(t("logAutoReconnectSuccess"));
    return true;
  } catch (err) {
    log(t("logAutoReconnectFailed", { msg: err.message }));
    updateUIConnectionState(false);
    return false;
  } finally {
    showProgress(false);
  }
}

// 快速重新連線按鈕
if ($btnQuickReconnect) {
  $btnQuickReconnect.addEventListener("click", async () => {
    const last = getLastSavedDeviceInfo();
    if (!last || !last.id) return;
    try {
      const permitted = await client.getPermittedDevices();
      const target = permitted.find(d => d.id === last.id) || permitted.find(d => d.name === last.name) || permitted[0];
      if (!target) {
        log(t("errNoPermittedDeviceFound"));
        return;
      }
      log(t("logQuickConnecting", { name: target.name || last.name }));
      await performDeviceConnection(target);
    } catch (err) {
      log(t("logConnectFailed", { msg: err.message }));
      updateUIConnectionState(false);
    }
  });
}

// 搜尋過濾偏好持久化（預設未勾選，僅搜尋支援設備）
if ($chkAllDevices) {
  try {
    const savedScanAll = localStorage.getItem("jetbadge_scan_all");
    if (savedScanAll === "1") {
      $chkAllDevices.checked = true;
      if ($detailsScanFilter) $detailsScanFilter.open = true;
    } else {
      $chkAllDevices.checked = false;
    }
  } catch (e) {}

  $chkAllDevices.addEventListener("change", () => {
    try {
      localStorage.setItem("jetbadge_scan_all", $chkAllDevices.checked ? "1" : "0");
    } catch (e) {}
  });
}

$btnConnect.addEventListener("click", async () => {
  const acceptAll = !!($chkAllDevices && $chkAllDevices.checked);
  try {
    const res = await client.connect(acceptAll);
    saveLastConnectedDevice(client.device, res);
    updateUIConnectionState(true, res);
    $infoProfile.textContent = res.profileKey ? t(res.profileKey) : res.profileName;
    if ($selFormat) {
      $selFormat.value = res.protocolKind === "zrun_e05" ? "jpeg" : "avi";
    }

    // 自動讀取設備資訊與剩餘空間
    await refreshDeviceInfo();
    log(t("logConnectedSuccess", { name: client.device.name || res.deviceName }));
  } catch (err) {
    log(t("logConnectFailed", { msg: err.message }));
    if (!acceptAll && (err.name === "NotFoundError" || /cancelled|user cancelled/i.test(err.message))) {
      log(t("logConnectFilterHint"));
    }
    updateUIConnectionState(false);
  }
});

$btnDisconnect.addEventListener("click", async () => {
  try {
    await client.disconnect();
    log(t("logManualDisconnect"));
  } catch (err) {
    log(t("logDisconnectError", { msg: err.message }));
  } finally {
    updateUIConnectionState(false);
  }
});

// ==========================================
// 2. 取得設備尺寸與系統資訊
// ==========================================
function updateStorageDisplay(freeKb) {
  if (freeKb != null && freeKb >= 0) {
    lastFreeStorageKb = freeKb;
    const text = freeKb >= 1024
      ? `${freeKb.toFixed(2)} KB (${(freeKb / 1024).toFixed(2)} MB)`
      : `${freeKb.toFixed(2)} KB`;
    $infoStorageText.textContent = text;
    if ($deviceRemainingSpace) $deviceRemainingSpace.textContent = text;
    if ($slideshowRemainingSpace) $slideshowRemainingSpace.textContent = text;
    if (observedTotalFlashKb <= 0 || freeKb > observedTotalFlashKb) {
      observedTotalFlashKb = freeKb <= 512 ? 512 : Math.ceil(freeKb / 512) * 512;
    }
    const usedKb = Math.max(0, observedTotalFlashKb - freeKb);
    const pct = observedTotalFlashKb > 0 ? Math.min(100, Math.max(0, Math.round((usedKb / observedTotalFlashKb) * 100))) : 0;
    $storageFill.style.width = `${pct}%`;
  } else {
    lastFreeStorageKb = null;
    $infoStorageText.textContent = "-";
    if ($deviceRemainingSpace) $deviceRemainingSpace.textContent = "-";
    if ($slideshowRemainingSpace) $slideshowRemainingSpace.textContent = "-";
    $storageFill.style.width = "0%";
  }
  if (typeof renderMediaDetails === "function") renderMediaDetails();
  if (typeof updateSlideshowEstimate === "function") updateSlideshowEstimate();
}

async function refreshStorageSpace() {
  if (!client.isConnected) return;
  try {
    if ($btnRefreshSpace) $btnRefreshSpace.disabled = true;
    const freeKb = await client.getRemainingSpace();
    updateStorageDisplay(freeKb);
  } catch (err) {
    log(t("logReadSpaceFailed", { msg: err.message }));
  } finally {
    if ($btnRefreshSpace) $btnRefreshSpace.disabled = !client.isConnected;
  }
}

if ($btnRefreshSpace) {
  $btnRefreshSpace.addEventListener("click", refreshStorageSpace);
}

async function refreshDeviceInfo() {
  try {
    const info = await client.getDeviceInfo();
    lastDeviceInfo = info;
    $infoName.textContent = info.deviceName;
    $infoResolution.textContent = info.detectedResolution;
    $infoVersion.textContent = t("versionFormat", {
      fw: info.deviceVersion || "v1.0",
      proto: info.protocolVersion || "v1",
    });

    updateStorageDisplay(info.freeStorageKb);

    // 若從設備偵測到解析度，同步套用到裁切設定與多圖輪播設定
    if (info.detectedResolution.includes("240 x 240")) {
      $selResolution.value = "240x240";
      if ($selSlideshowRes) $selSlideshowRes.value = "240x240";
    } else if (info.detectedResolution.includes("368 x 368")) {
      $selResolution.value = "368x368";
      if ($selSlideshowRes) $selSlideshowRes.value = "368x368";
    } else if (info.detectedResolution.includes("360 x 360")) {
      $selResolution.value = "360x360";
      if ($selSlideshowRes) {
        $selSlideshowRes.value = client.protocolKind === "zrun_e05" ? "360x360" : "359x359";
      }
    } else if (info.detectedResolution.includes("240 x 280")) {
      $selResolution.value = "240x280";
      if ($selSlideshowRes) $selSlideshowRes.value = "240x280";
    } else if (info.detectedResolution.includes("128 x 128")) {
      $selResolution.value = "128x128";
      if ($selSlideshowRes) $selSlideshowRes.value = "128x128";
    }
    updateCropTargetResolution();
    if (typeof updateSlideshowTargetResolution === "function") updateSlideshowTargetResolution();
  } catch (err) {
    log(t("logReadInfoFailed", { msg: err.message }));
  }
}

$btnRefreshInfo.addEventListener("click", refreshDeviceInfo);
$btnFindMe.addEventListener("click", async () => {
  try {
    await client.findMe();
  } catch (err) {
    log(t("logFindMeFailed", { msg: err.message }));
  }
});

// ==========================================
// 3. 相片裁切工具 (共用幾何運算與單圖 Canvas Cropper)
// ==========================================
function parseResolutionValue(val) {
  const parts = String(val || "240x240").split("x");
  const w = parseInt(parts[0], 10);
  const h = parseInt(parts[1], 10);
  return {
    targetW: Number.isFinite(w) && w > 0 ? w : 240,
    targetH: Number.isFinite(h) && h > 0 ? h : 240,
  };
}

function computeInitialCropState(img, targetW, targetH) {
  const baseScale = Math.max(targetW / img.naturalWidth, targetH / img.naturalHeight);
  const scale = baseScale;
  return {
    x: (targetW - img.naturalWidth * scale) / 2,
    y: (targetH - img.naturalHeight * scale) / 2,
    userZoom: 1.0,
    baseScale,
    scale,
    rotation: 0, // 0, 90, 180, 270
  };
}

function applyZoomFactorToCrop(crop, zoomFactor, canvasW, canvasH) {
  const oldScale = crop.scale || 1;
  const clamped = Math.max(0.4, Math.min(4.0, Number(zoomFactor) || 1.0));
  const roundedZoom = Math.round(clamped * 100) / 100; // 固定以 1% (0.01) 為步進單位
  crop.userZoom = roundedZoom;
  crop.scale = crop.baseScale * crop.userZoom;

  // 以畫布中心為基準進行等比縮放
  const cx = canvasW / 2;
  const cy = canvasH / 2;
  crop.x = cx - (cx - crop.x) * (crop.scale / oldScale);
  crop.y = cy - (cy - crop.y) * (crop.scale / oldScale);
  return roundedZoom;
}

function renderImageWithCrop(ctx, width, height, img, crop, shape, { previewOverlay = false } = {}) {
  if (previewOverlay) {
    ctx.clearRect(0, 0, width, height);
  } else {
    // 實心純黑底色，避免 JPEG/MJPEG 編碼產生雜色邊框
    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);
  }

  if (img && crop) {
    ctx.save();
    if (!previewOverlay && shape === "circle") {
      ctx.beginPath();
      ctx.arc(width / 2, height / 2, Math.min(width, height) / 2, 0, Math.PI * 2);
      ctx.clip();
    }
    const cx = crop.x + (img.naturalWidth * crop.scale) / 2;
    const cy = crop.y + (img.naturalHeight * crop.scale) / 2;
    ctx.translate(cx, cy);
    ctx.rotate((crop.rotation * Math.PI) / 180);
    ctx.drawImage(
      img,
      (-img.naturalWidth * crop.scale) / 2,
      (-img.naturalHeight * crop.scale) / 2,
      img.naturalWidth * crop.scale,
      img.naturalHeight * crop.scale
    );
    ctx.restore();
  } else if (previewOverlay) {
    ctx.fillStyle = "#090d16";
    ctx.fillRect(0, 0, width, height);
  }

  if (previewOverlay && shape === "circle") {
    ctx.save();
    ctx.fillStyle = "rgba(0, 0, 0, 0.65)";
    ctx.beginPath();
    ctx.rect(0, 0, width, height);
    const radius = Math.min(width, height) / 2;
    ctx.arc(width / 2, height / 2, radius, 0, Math.PI * 2, true);
    ctx.fill("evenodd");

    ctx.strokeStyle = "rgba(6, 182, 212, 0.6)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(width / 2, height / 2, radius - 1, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
}

function exportCropToCanvas(img, crop, shape, targetW, targetH) {
  const outCanvas = document.createElement("canvas");
  outCanvas.width = targetW;
  outCanvas.height = targetH;
  const ctx = outCanvas.getContext("2d");
  renderImageWithCrop(ctx, targetW, targetH, img, crop, shape, { previewOverlay: false });
  return outCanvas;
}

function loadImageFileElement(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => resolve({ img, objectUrl });
    img.onerror = () => {
      try { URL.revokeObjectURL(objectUrl); } catch (_) {}
      reject(new Error(t("logImageParseError")));
    };
    img.src = objectUrl;
  });
}

let currentImg = null;
let cropState = {
  x: 0,
  y: 0,
  userZoom: 1.0,
  baseScale: 1.0,
  scale: 1.0,
  rotation: 0, // 0, 90, 180, 270
  targetW: 240,
  targetH: 240,
  isDragging: false,
  dragStartX: 0,
  dragStartY: 0,
};

function updateCropTargetResolution() {
  const { targetW, targetH } = parseResolutionValue($selResolution.value);
  cropState.targetW = targetW;
  cropState.targetH = targetH;
  $cropCanvas.width = cropState.targetW;
  $cropCanvas.height = cropState.targetH;
  $previewDimensions.textContent = `${cropState.targetW} x ${cropState.targetH} px`;

  if (currentImg) {
    cropState.baseScale = Math.max(cropState.targetW / currentImg.naturalWidth, cropState.targetH / currentImg.naturalHeight);
    cropState.scale = cropState.baseScale * cropState.userZoom;
  }

  renderCrop();
  updateEstimatedFileSize();
}

$selResolution.addEventListener("change", updateCropTargetResolution);
$selCropShape.addEventListener("change", renderCrop);
if ($selFormat) $selFormat.addEventListener("change", updateEstimatedFileSize);

function initImageToCrop(img) {
  currentImg = img;
  $dropTip.style.display = "none";
  const initial = computeInitialCropState(img, cropState.targetW, cropState.targetH);
  cropState.rotation = initial.rotation;
  cropState.baseScale = initial.baseScale;
  cropState.userZoom = initial.userZoom;
  cropState.scale = initial.scale;
  cropState.x = initial.x;
  cropState.y = initial.y;

  $zoomRange.min = "0.4";
  $zoomRange.max = "4.0";
  $zoomRange.step = "0.01";
  $zoomRange.value = "1.0";
  $zoomVal.textContent = "100%";

  renderCrop();
  updateEstimatedFileSize();

  if (client.isConnected) {
    $btnUploadCropped.disabled = false;
  }
}

function renderCrop() {
  renderImageWithCrop(cropCtx, $cropCanvas.width, $cropCanvas.height, currentImg, cropState, $selCropShape.value, {
    previewOverlay: true,
  });
}

// 全域防止拖曳導致瀏覽器直接開啟新分頁
window.addEventListener("dragover", (e) => e.preventDefault());
window.addEventListener("drop", (e) => e.preventDefault());

// 檔案載入
$btnSelectFile.addEventListener("click", () => $fileImageInput.click());

$fileImageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) loadFileIntoCropper(file);
});

let currentObjectUrl = null;

function loadFileIntoCropper(file) {
  if (!file) return;
  log(t("logLoadingImage", { name: file.name, sizeKb: (file.size / 1024).toFixed(1) }));
  try {
    if (currentObjectUrl) {
      try { URL.revokeObjectURL(currentObjectUrl); } catch (_) {}
    }
    currentObjectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      try {
        if ($txtPhotoName) {
          $txtPhotoName.value = file.name.replace(/\.[^/.]+$/, "");
        }
        initImageToCrop(img);
        log(t("logImageLoaded", { name: file.name, w: img.naturalWidth, h: img.naturalHeight }));
      } catch (err) {
        log(t("logImageInitError", { msg: err.message }));
        console.error(err);
      }
    };
    img.onerror = () => {
      log(t("logImageParseError"));
      showNotice("error", { titleKey: "noticeImageParseTitle", bodyKey: "noticeImageParseBody" });
    };
    img.src = currentObjectUrl;
  } catch (err) {
    log(t("logLoadImageFailed", { msg: err.message }));
  }
}

// 拖曳上傳加強處理
['dragenter', 'dragover'].forEach((eventName) => {
  $dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
    $dropArea.style.borderColor = "var(--accent)";
    $dropArea.style.background = "rgba(6, 182, 212, 0.08)";
  });
});

['dragleave', 'dragend'].forEach((eventName) => {
  $dropArea.addEventListener(eventName, (e) => {
    e.preventDefault();
    e.stopPropagation();
    $dropArea.style.borderColor = "var(--card-border)";
    $dropArea.style.background = "#090d16";
  });
});

$dropArea.addEventListener("drop", (e) => {
  e.preventDefault();
  e.stopPropagation();
  $dropArea.style.borderColor = "var(--card-border)";
  $dropArea.style.background = "#090d16";

  const droppedFiles = [];
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    droppedFiles.push(...e.dataTransfer.files);
  } else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
    for (const item of e.dataTransfer.items) {
      if (item.kind === 'file') {
        const f = item.getAsFile();
        if (f) droppedFiles.push(f);
      }
    }
  }

  if (droppedFiles.length > 1) {
    switchTab("tab-slideshow");
    log(t("logDropSwitchedToSlideshowTab", { count: droppedFiles.length }));
    addSlidesFromFiles(droppedFiles);
    return;
  }

  const file = droppedFiles[0] || null;
  if (file) {
    const lower = file.name.toLowerCase();
    const isMediaExt = lower.endsWith(".avi") || lower.endsWith(".gif") || lower.endsWith(".mp4") || lower.endsWith(".webm") ||
      file.type.includes("gif") || file.type.includes("video");
    if (isMediaExt) {
      switchTab("tab-video");
      log(t("logDropSwitchedToVideoTab", { name: file.name }));
      selectMediaFile(file);
    } else {
      loadFileIntoCropper(file);
    }
  } else {
    log(t("logInvalidDropFile"));
  }
});

// 當畫布為空時，點擊拖曳區域也直接觸發檔案選取視窗
$dropArea.addEventListener("click", () => {
  if (!currentImg) {
    $fileImageInput.click();
  }
});

// 畫布滑鼠拖曳移動圖片 (Pan)
$dropArea.addEventListener("mousedown", (e) => {
  if (!currentImg) return;
  cropState.isDragging = true;
  cropState.dragStartX = e.clientX - cropState.x;
  cropState.dragStartY = e.clientY - cropState.y;
});
window.addEventListener("mousemove", (e) => {
  if (!cropState.isDragging || !currentImg) return;
  cropState.x = e.clientX - cropState.dragStartX;
  cropState.y = e.clientY - cropState.dragStartY;
  renderCrop();
});
window.addEventListener("mouseup", () => {
  if (cropState.isDragging) {
    cropState.isDragging = false;
    updateEstimatedFileSize();
  }
});

// 畫布滑鼠滾輪縮放 (以 1% 為單位微調)
$dropArea.addEventListener("wheel", (e) => {
  if (!currentImg) return;
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.01 : -0.01;
  setZoom(cropState.userZoom + delta);
}, { passive: false });

$zoomRange.addEventListener("input", (e) => {
  setZoom(parseFloat(e.target.value));
});

if ($btnZoomOut) {
  $btnZoomOut.addEventListener("click", () => {
    if (currentImg) setZoom(cropState.userZoom - 0.01);
  });
}
if ($btnZoomIn) {
  $btnZoomIn.addEventListener("click", () => {
    if (currentImg) setZoom(cropState.userZoom + 0.01);
  });
}

function setZoom(zoomFactor) {
  if (!currentImg) return;
  const roundedZoom = applyZoomFactorToCrop(cropState, zoomFactor, $cropCanvas.width, $cropCanvas.height);
  $zoomRange.value = String(roundedZoom);
  $zoomVal.textContent = `${Math.round(roundedZoom * 100)}%`;
  renderCrop();
  updateEstimatedFileSize();
}

$btnRotateLeft.addEventListener("click", () => {
  cropState.rotation = (cropState.rotation - 90 + 360) % 360;
  renderCrop();
  updateEstimatedFileSize();
});
$btnRotateRight.addEventListener("click", () => {
  cropState.rotation = (cropState.rotation + 90) % 360;
  renderCrop();
  updateEstimatedFileSize();
});
$btnResetCrop.addEventListener("click", () => {
  if (currentImg) initImageToCrop(currentImg);
});

let estimateTimer = null;
let estimateGeneration = 0;

function updateEstimatedFileSize() {
  if (!currentImg) {
    if ($selectedImageSize) $selectedImageSize.textContent = "-";
    if ($previewFileSize) $previewFileSize.textContent = "-";
    return;
  }
  const format = $selFormat ? $selFormat.value : "avi";
  if (format === "rgb565") {
    const bytes = cropState.targetW * cropState.targetH * 2;
    const kbStr = `${(bytes / 1024).toFixed(2)} KB`;
    if ($selectedImageSize) $selectedImageSize.textContent = kbStr;
    if ($previewFileSize) $previewFileSize.textContent = t("sizeRgb565Note", { kb: kbStr });
    return;
  }

  const gen = ++estimateGeneration;
  if (estimateTimer) clearTimeout(estimateTimer);
  estimateTimer = setTimeout(async () => {
    try {
      const outCanvas = getCroppedCanvas();
      const singleMaxBytes = client.protocolKind === "zrun_e05" ? 128 * 1024 : 96 * 1024;
      const encoded = format === "jpeg"
        ? await client.canvasToBadgeJpeg(outCanvas, { quality: 0.90, maxBytes: singleMaxBytes })
        : await client.canvasToBadgeAvi(outCanvas, { quality: 0.90, maxBytes: singleMaxBytes, fps: 5 });
      if (gen !== estimateGeneration || !currentImg) return;
      const kbStr = `${(encoded.length / 1024).toFixed(2)} KB`;
      const chunks = Math.ceil((encoded.length + 4) / 200);
      if ($selectedImageSize) $selectedImageSize.textContent = t("sizeChunks", { kb: kbStr, chunks });
      if ($previewFileSize) $previewFileSize.textContent = `${kbStr} (${format === "avi" ? "MJPEG AVI" : "Baseline JPEG"})`;
    } catch {
      if (gen === estimateGeneration && $selectedImageSize) {
        $selectedImageSize.textContent = t("sizeEstimateFailed");
      }
    }
  }, 120);
}

if ($selFormat) {
  $selFormat.addEventListener("change", updateEstimatedFileSize);
}

function getCroppedCanvas() {
  return exportCropToCanvas(currentImg, cropState, $selCropShape.value, cropState.targetW, cropState.targetH);
}

// 執行相片上傳
$btnUploadCropped.addEventListener("click", async () => {
  hideNotice();
  if (!client.isConnected) {
    const reconnected = await ensureConnectionActive();
    if (!reconnected) {
      showNotice("warn", { titleKey: "noticeNotConnectedTitle", bodyKey: "noticeNotConnectedBodyPhoto" });
      return;
    }
  }
  if (!currentImg) {
    showNotice("warn", { titleKey: "noticeNoPhotoTitle", bodyKey: "noticeNoPhotoBody" });
    return;
  }

  try {
    $btnUploadCropped.disabled = true;
    const format = $selFormat ? $selFormat.value : "avi";
    const isZrun = client.protocolKind === "zrun_e05";
    if (isZrun && format === "rgb565") {
      throw new Error(t("errRgb565UnsupportedZrun"));
    }
    const slot = 0;
    const outCanvas = getCroppedCanvas();
    const singleMaxBytes = isZrun ? 128 * 1024 : 96 * 1024;

    let bytes;
    let isAvi = 1;
    if (format === "avi") {
      showProgress(true, t("progressEncodingAvi"));
      bytes = await client.canvasToBadgeAvi(outCanvas, { quality: 0.90, maxBytes: singleMaxBytes, fps: 5 });
      isAvi = 1;
      log(t("logPrepareAvi", {
        w: outCanvas.width,
        h: outCanvas.height,
        bytes: bytes.length,
        totalBytes: bytes.length + (isZrun ? 0 : 4),
      }));
    } else if (format === "jpeg") {
      showProgress(true, t("progressEncodingJpeg"));
      bytes = await client.canvasToBadgeJpeg(outCanvas, { quality: 0.90, maxBytes: singleMaxBytes });
      isAvi = 0;
      log(t(isZrun ? "logPrepareZrunJpeg" : "logPrepareJpeg", { bytes: bytes.length }));
    } else {
      showProgress(true, t("progressEncodingRgb565"));
      bytes = client.canvasToRgb565(outCanvas);
      isAvi = 0;
      log(t("logPrepareRgb565", {
        w: outCanvas.width,
        h: outCanvas.height,
        bytes: bytes.length,
      }));
    }

    if (isZrun) {
      log(t("logZrunPhotoUploadStart", { ext: isAvi ? "avi" : "jpg" }));
    } else {
      log(t("logPhotoUploadStart", {
        slot,
        ext: isAvi ? ".avi" : "",
        isAvi,
      }));
    }
    await client.uploadDialImage(bytes, (sent, total, pct) => {
      updateProgress(sent, total, pct, t("progressUploadingPhoto", { pct }));
    }, { slot, isAvi, custom: 0, dialId: client.activeDialId, fontPos: 0 });

    showProgress(false);
    log(t("logPhotoUploadSuccess"));
    await refreshStorageSpace();
    showNotice("success", { titleKey: "noticePhotoSuccessTitle", bodyKey: "noticePhotoSuccessBody" });
  } catch (err) {
    log(t("logPhotoUploadFailed", { msg: err.message }));
    showNotice("error", { titleKey: "noticePhotoFailedTitle", rawBody: err.message });
  } finally {
    $btnUploadCropped.disabled = false;
    showProgress(false);
  }
});

// ==========================================
// 5. GIF 動態圖 / MP4 影片 / AVI 動畫上傳
// ==========================================
let currentMediaFile = null;
let currentMediaPreviewUrl = null;
let aviPreviewTimer = null;
let mediaPreviewGen = 0;
let lastMediaState = {
  selected: false,
  name: "",
  sizeBytes: 0,
  sizeMb: "",
  type: "",
  isAvi: false,
  aviInfo: null,
  previewIdx: 1,
};

function getBadgeMediaLimits() {
  const maxDim = getBadgeMaxDimension();
  const isZrun = client.protocolKind === "zrun_e05";
  const targetW = Math.min(client.screenWidth || cropState.targetW || 240, maxDim);
  const targetH = Math.min(client.screenHeight || cropState.targetH || 240, maxDim);
  const capBytes = isZrun ? 2000 * 1024 : 350 * 1024;
  const fallbackBytes = isZrun ? 1536 * 1024 : 220 * 1024;
  const maxAviBytes = lastFreeStorageKb != null && lastFreeStorageKb > 16
    ? Math.max(16 * 1024, Math.min(capBytes, Math.floor((lastFreeStorageKb - 8) * 1024)))
    : fallbackBytes;
  return { targetW, targetH, maxAviBytes };
}

function stopMediaPreview() {
  mediaPreviewGen++;
  if (aviPreviewTimer) {
    clearInterval(aviPreviewTimer);
    aviPreviewTimer = null;
  }
  if (currentMediaPreviewUrl) {
    try { URL.revokeObjectURL(currentMediaPreviewUrl); } catch (_) {}
    currentMediaPreviewUrl = null;
  }
}

async function decodeJpegBytesToDrawable(jpegBytes) {
  const blob = new Blob([jpegBytes], { type: "image/jpeg" });
  if (typeof createImageBitmap === "function") {
    const bitmap = await createImageBitmap(blob);
    return {
      source: bitmap,
      width: bitmap.width,
      height: bitmap.height,
      close: () => bitmap.close(),
    };
  }
  const url = URL.createObjectURL(blob);
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error(t("errVideoDecodeFailed")));
    el.src = url;
  });
  return {
    source: img,
    width: img.naturalWidth,
    height: img.naturalHeight,
    close: () => URL.revokeObjectURL(url),
  };
}

function formatAviPreviewBadgeText(aviInfo, idx) {
  const secVal = aviInfo.usPerFrame / 1000000;
  const secStr = secVal >= 1 ? secVal.toFixed(1) : secVal.toFixed(2);
  return t("mediaAviPreviewBadge", {
    idx,
    total: aviInfo.frames.length,
    sec: secStr,
  });
}

function renderMediaDetails() {
  if (!$mediaDetails || !lastMediaState.selected) return;
  if (lastMediaState.aviInfo) {
    const info = lastMediaState.aviInfo;
    const maxDim = getBadgeMaxDimension();
    const { targetW, targetH, maxAviBytes } = getBadgeMediaLimits();
    const needsResize = info.width > targetW || info.height > targetH || info.width > maxDim || info.height > maxDim;
    const needsShrink = lastMediaState.sizeBytes > maxAviBytes;
    const fpsNum = info.fps >= 1
      ? info.fps.toFixed(1).replace(/\.0$/, "")
      : info.fps.toFixed(2).replace(/0$/, "");
    const secVal = info.usPerFrame / 1000000;
    const secStr = secVal >= 1 ? secVal.toFixed(1) : secVal.toFixed(2);
    const fpsStr = t("mediaAviFpsSec", { fps: fpsNum, sec: secStr });
    const autoNote = (needsResize || needsShrink)
      ? t("mediaAviAutoOptimizeNote", {
          bw: targetW,
          bh: targetH,
          budgetKb: Math.round(maxAviBytes / 1024),
        })
      : "";
    $mediaDetails.textContent = t("mediaAviDetailsFmt", {
      name: lastMediaState.name,
      sizeKb: (lastMediaState.sizeBytes / 1024).toFixed(2),
      codec: info.codec,
      w: info.width,
      h: info.height,
      frames: info.frames.length,
      fpsStr,
      autoNote,
    });
    const badgeEl = document.getElementById("aviPreviewBadge");
    if (badgeEl) {
      badgeEl.textContent = formatAviPreviewBadgeText(info, lastMediaState.previewIdx || 1);
    }
    return;
  }

  $mediaDetails.textContent = t("mediaDetailsFmt", {
    name: lastMediaState.name,
    sizeMb: lastMediaState.sizeMb,
    type: lastMediaState.type,
  });
}

async function startAviCanvasPreview(parsed, gen) {
  $mediaPreviewContainer.innerHTML = "";
  const canvas = document.createElement("canvas");
  const maxBox = 200;
  const srcW = parsed.width || 240;
  const srcH = parsed.height || 240;
  const scale = Math.min(maxBox / srcW, maxBox / srcH, 1);
  canvas.width = Math.max(1, Math.round(srcW * scale));
  canvas.height = Math.max(1, Math.round(srcH * scale));
  canvas.style.borderRadius = "8px";
  canvas.style.border = "1px solid var(--card-border)";
  canvas.style.background = "#000000";

  const badge = document.createElement("span");
  badge.id = "aviPreviewBadge";
  badge.style.color = "#38bdf8";
  badge.style.fontSize = "12px";

  $mediaPreviewContainer.appendChild(canvas);
  $mediaPreviewContainer.appendChild(badge);

  const ctx = canvas.getContext("2d");
  let frameIdx = 0;

  const drawFrame = async (idx) => {
    if (gen !== mediaPreviewGen) return;
    lastMediaState.previewIdx = idx + 1;
    badge.textContent = formatAviPreviewBadgeText(parsed, idx + 1);
    let drawable = null;
    try {
      drawable = await decodeJpegBytesToDrawable(parsed.frames[idx]);
      if (gen !== mediaPreviewGen) return;
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(drawable.source, 0, 0, canvas.width, canvas.height);
    } catch (_) {
      // 忽略單幀預覽解碼失敗，交由上傳階段處理
    } finally {
      if (drawable) drawable.close();
    }
  };

  await drawFrame(0);
  if (gen !== mediaPreviewGen || parsed.frames.length <= 1) return;

  // 若為慢速輪播 (如 0.1 fps = 10s/格)，預覽以 1.5s 節奏循環展示全部影格，實際上傳保留原 FPS
  const realMs = Math.round(parsed.usPerFrame / 1000);
  const previewMs = realMs > 2000 ? 1500 : Math.max(100, realMs);
  aviPreviewTimer = setInterval(() => {
    if (gen !== mediaPreviewGen) return;
    frameIdx = (frameIdx + 1) % parsed.frames.length;
    drawFrame(frameIdx);
  }, previewMs);
}

async function selectMediaFile(file) {
  if (!file) return;
  stopMediaPreview();
  const gen = mediaPreviewGen;

  currentMediaFile = file;
  $txtMediaName.value = file.name.replace(/\.[^/.]+$/, "");

  const lower = file.name.toLowerCase();
  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
  const typeLabel = file.type || "application/octet-stream";
  let isAvi = false;
  let aviInfo = null;

  const isAviNameOrMime = lower.endsWith(".avi") || typeLabel.includes("avi") || typeLabel.includes("msvideo");
  if (file.type.includes("gif") || lower.endsWith(".gif")) {
    $selMediaType.value = "ANIMATION";
    $mediaPreviewContainer.innerHTML = "";
    currentMediaPreviewUrl = URL.createObjectURL(file);
    const img = document.createElement("img");
    img.src = currentMediaPreviewUrl;
    img.className = "preview-thumbnail";
    img.style.width = "180px";
    img.style.height = "180px";
    img.style.objectFit = "contain";
    $mediaPreviewContainer.appendChild(img);
  } else if (!isAviNameOrMime && (file.type.includes("video") || lower.endsWith(".mp4") || lower.endsWith(".webm"))) {
    $selMediaType.value = "VIDEO";
    $mediaPreviewContainer.innerHTML = "";
    currentMediaPreviewUrl = URL.createObjectURL(file);
    const vid = document.createElement("video");
    vid.src = currentMediaPreviewUrl;
    vid.autoplay = true;
    vid.loop = true;
    vid.muted = true;
    vid.style.maxWidth = "220px";
    vid.style.maxHeight = "200px";
    vid.style.borderRadius = "8px";
    $mediaPreviewContainer.appendChild(vid);
  } else {
    $selMediaType.value = "VIDEO";
    isAvi = true;
    try {
      const buf = new Uint8Array(await file.arrayBuffer());
      if (gen !== mediaPreviewGen) return;
      const parsed = SuperBandClient.parseMjpegAvi(buf);
      if (parsed.isMjpeg && parsed.frames.length > 0) {
        aviInfo = parsed;
      }
    } catch (_) {
      aviInfo = null;
    }
  }

  lastMediaState = {
    selected: true,
    name: file.name,
    sizeBytes: file.size,
    sizeMb,
    type: typeLabel,
    isAvi,
    aviInfo,
    previewIdx: 1,
  };

  if (aviInfo) {
    await startAviCanvasPreview(aviInfo, gen);
  } else if (isAvi) {
    $mediaPreviewContainer.innerHTML = "";
    const span = document.createElement("span");
    span.style.color = "#38bdf8";
    span.style.fontSize = "13px";
    span.textContent = t("mediaPreviewAvi", { name: file.name });
    $mediaPreviewContainer.appendChild(span);
  }

  renderMediaDetails();
}

$btnSelectMedia.addEventListener("click", () => $fileMediaInput.click());

$fileMediaInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) selectMediaFile(file);
});

if ($mediaDropArea) {
  ['dragenter', 'dragover'].forEach((eventName) => {
    $mediaDropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      $mediaDropArea.style.borderColor = "var(--accent)";
      $mediaDropArea.style.background = "rgba(6, 182, 212, 0.08)";
    });
  });

  ['dragleave', 'dragend'].forEach((eventName) => {
    $mediaDropArea.addEventListener(eventName, (e) => {
      e.preventDefault();
      e.stopPropagation();
      $mediaDropArea.style.borderColor = "var(--card-border)";
      $mediaDropArea.style.background = "#090d16";
    });
  });

  $mediaDropArea.addEventListener("drop", (e) => {
    e.preventDefault();
    e.stopPropagation();
    $mediaDropArea.style.borderColor = "var(--card-border)";
    $mediaDropArea.style.background = "#090d16";
    let file = null;
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      file = e.dataTransfer.files[0];
    } else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      const item = e.dataTransfer.items[0];
      if (item.kind === "file") file = item.getAsFile();
    }
    if (file) selectMediaFile(file);
  });

  $mediaDropArea.addEventListener("click", () => {
    if (!currentMediaFile) $fileMediaInput.click();
  });
}

function drawSourceCoverToBadgeCanvas(source, srcW, srcH, targetW, targetH) {
  const canvas = document.createElement("canvas");
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext("2d");
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, targetW, targetH);

  const scale = Math.max(targetW / srcW, targetH / srcH);
  const dw = srcW * scale;
  const dh = srcH * scale;
  const dx = (targetW - dw) / 2;
  const dy = (targetH - dh) / 2;
  ctx.drawImage(source, dx, dy, dw, dh);
  return canvas;
}

async function encodeMediaFileToMjpegAvi(file, targetW, targetH, maxAviBytes = 220 * 1024) {
  const maxDim = getBadgeMaxDimension();
  const zrunHdrReserve = client.protocolKind === "zrun_e05" ? 5900 : 640;
  const safeW = Math.min(targetW, maxDim);
  const safeH = Math.min(targetH, maxDim);
  const rawBuf = new Uint8Array(await file.arrayBuffer());
  const isRiffAvi = rawBuf.length >= 12 &&
    rawBuf[0] === 0x52 && rawBuf[1] === 0x49 && rawBuf[2] === 0x46 && rawBuf[3] === 0x46 &&
    rawBuf[8] === 0x41 && rawBuf[9] === 0x56 && rawBuf[10] === 0x49 && rawBuf[11] === 0x20;

  let nonMjpegAviCodec = "";
  if (isRiffAvi) {
    const parsed = SuperBandClient.parseMjpegAvi(rawBuf);
    const fpsLabel = parsed.fps >= 1
      ? parsed.fps.toFixed(1).replace(/\.0$/, "")
      : parsed.fps.toFixed(2).replace(/0$/, "");
    log(t("logAviParsed", {
      w: parsed.width,
      h: parsed.height,
      codec: parsed.codec,
      frames: parsed.frames.length,
      fps: fpsLabel,
      kb: (rawBuf.length / 1024).toFixed(1),
    }));

    if (parsed.isMjpeg && parsed.frames.length > 0) {
      const timing = (parsed.scale > 0 && parsed.rate > 0)
        ? { scale: parsed.scale, rate: parsed.rate, fps: parsed.fps }
        : parsed.fps;

      // 路徑 1：尺寸 <= 徽章上限且 <= maxDim，先嘗試無損清理重封裝（移除多餘中繼資料，並視協定封裝 AVI）
      const dimsOk = parsed.width > 0 && parsed.height > 0 &&
        parsed.width <= safeW && parsed.height <= safeH &&
        parsed.width <= maxDim && parsed.height <= maxDim;
      if (dimsOk) {
        try {
          const cleanFrames = parsed.frames.map((f) => SuperBandClient.sanitizeBadgeJpeg(f, { maxDimension: maxDim }));
          const remuxed = client.buildProtocolAvi(cleanFrames, parsed.width, parsed.height, timing);
          if (remuxed.length <= maxAviBytes) {
            log(t("logAviRemuxLossless", { bytes: remuxed.length }));
            return { bytes: remuxed, width: parsed.width, height: parsed.height };
          }
        } catch (_) {
          // 單幀含不相容抽樣或參數時改走瀏覽器解碼重編碼流程
        }
      }

      // 路徑 2：將 MJPG 影格解碼縮放至徽章螢幕解析度並自適應壓縮，保留輪播節奏
      const maxAviFrames = 24;
      let selectedFrames = parsed.frames;
      let outTiming = timing;
      if (parsed.frames.length > maxAviFrames) {
        selectedFrames = [];
        for (let i = 0; i < maxAviFrames; i++) {
          const idx = Math.min(parsed.frames.length - 1, Math.floor((i * parsed.frames.length) / maxAviFrames));
          selectedFrames.push(parsed.frames[idx]);
        }
        outTiming = parsed.fps * (maxAviFrames / parsed.frames.length);
      }

      log(t("logAviOptimizing", {
        srcW: parsed.width || safeW,
        srcH: parsed.height || safeH,
        dstW: safeW,
        dstH: safeH,
        frames: selectedFrames.length,
        budgetKb: Math.round(maxAviBytes / 1024),
      }));

      const canvases = [];
      for (const frameBytes of selectedFrames) {
        let drawable = null;
        try {
          drawable = await decodeJpegBytesToDrawable(frameBytes);
          canvases.push(drawSourceCoverToBadgeCanvas(
            drawable.source,
            drawable.width || safeW,
            drawable.height || safeH,
            safeW,
            safeH
          ));
        } finally {
          if (drawable) drawable.close();
        }
      }

      let lastAvi = null;
      for (const q of [0.85, 0.76, 0.65, 0.52, 0.40, 0.30]) {
        const perFrameBudget = Math.max(2048, Math.floor((maxAviBytes - zrunHdrReserve) / canvases.length));
        const jpegs = [];
        for (const c of canvases) {
          jpegs.push(await client.canvasToBadgeJpeg(c, { quality: q, maxBytes: perFrameBudget, maxDimension: maxDim }));
        }
        lastAvi = client.buildProtocolAvi(jpegs, safeW, safeH, outTiming);
        if (lastAvi.length <= maxAviBytes) {
          log(t("logAviOptimizedDone", {
            bytes: lastAvi.length,
            kb: (lastAvi.length / 1024).toFixed(1),
            q,
          }));
          return { bytes: lastAvi, width: safeW, height: safeH };
        }
      }
      throw new Error(t("errAviTooLargeAfterCompress", {
        kb: (lastAvi.length / 1024).toFixed(1),
        budgetKb: Math.round(maxAviBytes / 1024),
      }));
    }

    nonMjpegAviCodec = parsed.codec || "UNKNOWN";
  }

  const fps = 5;
  const maxFrames = 18;
  const lower = file.name.toLowerCase();
  const isGif = file.type.includes("gif") || lower.endsWith(".gif");
  const canvases = [];

  if (isGif && typeof ImageDecoder !== "undefined") {
    const decoder = new ImageDecoder({ data: rawBuf, type: file.type || "image/gif" });
    await decoder.tracks.ready;
    const total = Math.max(1, decoder.tracks.selectedTrack?.frameCount || 1);
    const count = Math.min(maxFrames, total);
    for (let i = 0; i < count; i++) {
      const idx = Math.min(total - 1, Math.floor((i * total) / count));
      const { image } = await decoder.decode({ frameIndex: idx });
      try {
        canvases.push(drawSourceCoverToBadgeCanvas(image, image.displayWidth || safeW, image.displayHeight || safeH, safeW, safeH));
      } finally {
        image.close();
      }
    }
    decoder.close();
  } else if (isGif) {
    const imgUrl = URL.createObjectURL(file);
    try {
      const img = await new Promise((resolve, reject) => {
        const el = new Image();
        el.onload = () => resolve(el);
        el.onerror = () => reject(new Error(t("errGifLoadFailed")));
        el.src = imgUrl;
      });
      canvases.push(drawSourceCoverToBadgeCanvas(img, img.naturalWidth || safeW, img.naturalHeight || safeH, safeW, safeH));
    } finally {
      URL.revokeObjectURL(imgUrl);
    }
  } else {
    const videoUrl = URL.createObjectURL(file);
    const video = document.createElement("video");
    video.muted = true;
    video.playsInline = true;
    video.preload = "auto";
    video.src = videoUrl;
    try {
      await new Promise((resolve, reject) => {
        video.onloadeddata = resolve;
        video.onerror = () => reject(new Error(
          nonMjpegAviCodec
            ? t("errAviCodecUnsupported", { codec: nonMjpegAviCodec })
            : t("errVideoDecodeFailed")
        ));
      });
      const duration = Math.max(0.2, Math.min(4.0, video.duration || 2.0));
      const count = Math.min(maxFrames, Math.max(2, Math.round(duration * fps)));
      for (let i = 0; i < count; i++) {
        const seekTime = Math.min(duration - 0.02, (i / count) * duration);
        await new Promise((resolve) => {
          video.onseeked = resolve;
          video.currentTime = Math.max(0, seekTime);
        });
        canvases.push(drawSourceCoverToBadgeCanvas(video, video.videoWidth || safeW, video.videoHeight || safeH, safeW, safeH));
      }
    } finally {
      URL.revokeObjectURL(videoUrl);
    }
  }

  for (const q of [0.78, 0.65, 0.50, 0.38]) {
    const perFrameBudget = Math.max(3072, Math.floor((maxAviBytes - zrunHdrReserve) / canvases.length));
    const jpegs = [];
    for (const c of canvases) {
      jpegs.push(await client.canvasToBadgeJpeg(c, { quality: q, maxBytes: perFrameBudget, maxDimension: maxDim }));
    }
    const avi = client.buildProtocolAvi(jpegs, safeW, safeH, fps);
    if (avi.length <= maxAviBytes || q === 0.38) {
      return { bytes: avi, width: safeW, height: safeH };
    }
  }
  throw new Error(t("errMediaSizeExceeded"));
}

$btnUploadMedia.addEventListener("click", async () => {
  hideNotice();
  if (!client.isConnected) {
    const reconnected = await ensureConnectionActive();
    if (!reconnected) {
      showNotice("warn", { titleKey: "noticeNotConnectedTitle", bodyKey: "noticeNotConnectedBodyMedia" });
      return;
    }
  }
  if (!currentMediaFile) {
    showNotice("warn", { titleKey: "noticeNoMediaTitle", bodyKey: "noticeNoMediaBody" });
    return;
  }

  try {
    $btnUploadMedia.disabled = true;
    showProgress(true, t("progressTranscodingMedia"));
    const { targetW, targetH, maxAviBytes } = getBadgeMediaLimits();
    const encoded = await encodeMediaFileToMjpegAvi(currentMediaFile, targetW, targetH, maxAviBytes);
    const bytes = encoded.bytes;
    const outW = encoded.width || targetW;
    const outH = encoded.height || targetH;
    const fileName = $txtMediaName.value.trim() || currentMediaFile.name;
    const typeStr = $selMediaType.value;
    const slot = 0;

    log(t("logMediaUploadStart", {
      type: typeStr,
      name: fileName,
      w: outW,
      h: outH,
      bytes: bytes.length,
      slot,
    }));
    await client.uploadDialImage(bytes, (sent, total, pct) => {
      updateProgress(sent, total, pct, t("progressUploadingMedia", { name: fileName, pct }));
    }, { slot, isAvi: 1, custom: 0, dialId: client.activeDialId, fontPos: 0 });

    showProgress(false);
    log(t("logMediaUploadSuccess", { type: typeStr }));
    await refreshStorageSpace();
    showNotice("success", {
      titleKey: "noticeMediaSuccessTitle",
      bodyKey: "noticeMediaSuccessBody",
      bodyParams: { type: typeStr, name: fileName },
    });
  } catch (err) {
    log(t("logMediaUploadFailed", { msg: err.message }));
    showNotice("error", { titleKey: "noticeMediaFailedTitle", rawBody: err.message });
  } finally {
    $btnUploadMedia.disabled = false;
    showProgress(false);
  }
});

// ==========================================
// 5B. 多圖輪播製作 AVI 與逐張調整 (JPG/PNG → MJPEG AVI)
// ==========================================
let slides = [];
let nextSlideId = 1;
let activeSlideIdx = -1;
let slideshowTargetW = 240;
let slideshowTargetH = 240;
let slideDragging = false;
let slideDragStartX = 0;
let slideDragStartY = 0;
let slidePreviewTimer = null;
let slidePreviewIdx = 0;
let slideThumbTimer = null;
let slideEstimateTimer = null;
let slideEstimateGen = 0;
let dragSlideIndex = null;

function clearSlideCardDragClasses() {
  if (!$slideshowThumbList) return;
  $slideshowThumbList.querySelectorAll(".slide-card").forEach((el) => {
    el.classList.remove("dragging", "drag-over-before", "drag-over-after");
  });
}

function getSlideIntervalSeconds() {
  const v = $selSlideInterval ? parseFloat($selSlideInterval.value) : 1;
  return Number.isFinite(v) && v >= 0.1 && v <= 10 ? v : 1;
}

function getActiveSlide() {
  return activeSlideIdx >= 0 && activeSlideIdx < slides.length ? slides[activeSlideIdx] : null;
}

function renderSlideThumbDataUrl(slide) {
  const shape = $selSlideshowShape ? $selSlideshowShape.value : "circle";
  const cropped = exportCropToCanvas(slide.img, slide.crop, shape, slideshowTargetW, slideshowTargetH);
  const thumbCanvas = document.createElement("canvas");
  thumbCanvas.width = 72;
  thumbCanvas.height = 72;
  const ctx = thumbCanvas.getContext("2d");
  ctx.drawImage(cropped, 0, 0, 72, 72);
  return thumbCanvas.toDataURL("image/png");
}

function scheduleActiveSlideThumbRefresh() {
  const slide = getActiveSlide();
  if (!slide) return;
  if (slideThumbTimer) clearTimeout(slideThumbTimer);
  slideThumbTimer = setTimeout(() => {
    slide.thumbUrl = renderSlideThumbDataUrl(slide);
    const thumbEl = document.querySelector(`.slide-card[data-slide-id="${slide.id}"] .slide-card-thumb`);
    if (thumbEl) thumbEl.src = slide.thumbUrl;
  }, 80);
}

function stopSlideshowPreview() {
  if (slidePreviewTimer) {
    clearInterval(slidePreviewTimer);
    slidePreviewTimer = null;
  }
  if ($btnToggleSlidePreview) {
    $btnToggleSlidePreview.textContent = t("btnPreviewSlideshowPlay");
  }
  if ($slideshowCanvas && slideshowCtx) {
    renderSlideshowCanvas();
  }
  updateSlideshowControlsState();
}

function startSlideshowPreview() {
  if (slides.length === 0) return;
  if (slidePreviewTimer) {
    clearInterval(slidePreviewTimer);
    slidePreviewTimer = null;
  }
  slidePreviewIdx = activeSlideIdx >= 0 ? activeSlideIdx : 0;
  const stepPreview = () => {
    if (slides.length === 0) {
      stopSlideshowPreview();
      return;
    }
    const idx = slidePreviewIdx % slides.length;
    renderSlideshowCanvas(idx);
    if ($slideCounterLabel) {
      $slideCounterLabel.textContent = t("slideCounterFmt", {
        idx: idx + 1,
        total: slides.length,
        name: slides[idx].fileName,
      });
    }
    slidePreviewIdx = (idx + 1) % slides.length;
  };
  stepPreview();
  const intervalMs = Math.max(100, Math.round(getSlideIntervalSeconds() * 1000));
  slidePreviewTimer = setInterval(stepPreview, intervalMs);
  if ($btnToggleSlidePreview) {
    $btnToggleSlidePreview.textContent = t("btnPreviewSlideshowStop");
  }
}

function renderSlideshowCanvas(previewIdx = null) {
  if (!$slideshowCanvas || !slideshowCtx) return;
  const idx = previewIdx !== null ? previewIdx : activeSlideIdx;
  const slide = idx >= 0 && idx < slides.length ? slides[idx] : null;
  const shape = $selSlideshowShape ? $selSlideshowShape.value : "circle";
  renderImageWithCrop(
    slideshowCtx,
    $slideshowCanvas.width,
    $slideshowCanvas.height,
    slide ? slide.img : null,
    slide ? slide.crop : null,
    shape,
    { previewOverlay: true }
  );
}

function updateSlideshowControlsState() {
  const count = slides.length;
  const cur = getActiveSlide();
  if ($slideshowDropTip) $slideshowDropTip.style.display = cur ? "none" : "block";
  if ($btnPrevSlide) $btnPrevSlide.disabled = count <= 1 || activeSlideIdx <= 0;
  if ($btnNextSlide) $btnNextSlide.disabled = count <= 1 || activeSlideIdx >= count - 1;
  if ($btnToggleSlidePreview) {
    $btnToggleSlidePreview.disabled = count === 0;
    $btnToggleSlidePreview.textContent = slidePreviewTimer ? t("btnPreviewSlideshowStop") : t("btnPreviewSlideshowPlay");
  }
  if ($btnClearSlides) $btnClearSlides.disabled = count === 0;
  if ($btnExportSlideshowAvi) $btnExportSlideshowAvi.disabled = count === 0;

  if ($slideCounterLabel && !slidePreviewTimer) {
    $slideCounterLabel.textContent = cur
      ? t("slideCounterFmt", { idx: activeSlideIdx + 1, total: count, name: cur.fileName })
      : t("slideCounterEmpty");
  }

  if ($slideshowZoomRange && $slideshowZoomVal) {
    const z = cur ? cur.crop.userZoom : 1.0;
    $slideshowZoomRange.value = String(z);
    $slideshowZoomVal.textContent = `${Math.round(z * 100)}%`;
  }

  const intervalSec = getSlideIntervalSeconds();
  if ($slideshowCountDuration) {
    if (count === 0) {
      $slideshowCountDuration.textContent = t("slideshowCountDurationEmpty");
    } else {
      const totalSecNum = count * intervalSec;
      const totalSec = Number.isInteger(totalSecNum) ? String(totalSecNum) : totalSecNum.toFixed(1);
      $slideshowCountDuration.textContent = t("slideshowCountDurationVal", {
        count,
        totalSec,
        intervalSec,
      });
    }
  }
}

function renderSlideshowFilmstrip() {
  if (!$slideshowThumbList) return;
  $slideshowThumbList.innerHTML = "";
  if (slides.length === 0) {
    const empty = document.createElement("span");
    empty.style.color = "var(--text-muted)";
    empty.style.fontSize = "13px";
    empty.style.margin = "auto";
    empty.setAttribute("data-i18n", "slideshowFilmstripEmpty");
    empty.textContent = t("slideshowFilmstripEmpty");
    $slideshowThumbList.appendChild(empty);
    return;
  }

  slides.forEach((slide, idx) => {
    const card = document.createElement("div");
    card.className = `slide-card${idx === activeSlideIdx ? " active" : ""}`;
    card.setAttribute("data-slide-id", String(slide.id));
    card.setAttribute("data-slide-idx", String(idx));
    card.draggable = true;
    card.title = slide.fileName;

    const badge = document.createElement("span");
    badge.className = "slide-card-index";
    badge.textContent = `#${idx + 1}`;

    const imgEl = document.createElement("img");
    imgEl.className = "slide-card-thumb";
    imgEl.src = slide.thumbUrl;
    imgEl.alt = slide.fileName;
    imgEl.draggable = false;

    const nameEl = document.createElement("div");
    nameEl.className = "slide-card-name";
    nameEl.textContent = slide.fileName;

    const actions = document.createElement("div");
    actions.className = "slide-card-actions";

    const btnLeft = document.createElement("button");
    btnLeft.type = "button";
    btnLeft.className = "btn-mini";
    btnLeft.textContent = "◀";
    btnLeft.title = t("btnSlideMoveLeftTitle");
    btnLeft.disabled = idx === 0;
    btnLeft.addEventListener("click", (e) => {
      e.stopPropagation();
      moveSlide(idx, -1);
    });

    const btnRight = document.createElement("button");
    btnRight.type = "button";
    btnRight.className = "btn-mini";
    btnRight.textContent = "▶";
    btnRight.title = t("btnSlideMoveRightTitle");
    btnRight.disabled = idx === slides.length - 1;
    btnRight.addEventListener("click", (e) => {
      e.stopPropagation();
      moveSlide(idx, 1);
    });

    const btnDel = document.createElement("button");
    btnDel.type = "button";
    btnDel.className = "btn-mini danger";
    btnDel.textContent = "✕";
    btnDel.title = t("btnSlideRemoveTitle");
    btnDel.addEventListener("click", (e) => {
      e.stopPropagation();
      removeSlideAt(idx);
    });

    actions.appendChild(btnLeft);
    actions.appendChild(btnRight);
    actions.appendChild(btnDel);

    card.appendChild(badge);
    card.appendChild(imgEl);
    card.appendChild(nameEl);
    card.appendChild(actions);

    card.addEventListener("dragstart", (e) => {
      if (slidePreviewTimer) stopSlideshowPreview();
      dragSlideIndex = idx;
      card.classList.add("dragging");
      if (e.dataTransfer) {
        e.dataTransfer.effectAllowed = "move";
        e.dataTransfer.setData("application/x-jetbadge-slide", String(idx));
        e.dataTransfer.setData("text/plain", String(idx));
      }
    });

    card.addEventListener("dragover", (e) => {
      if (dragSlideIndex === null) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "move";
      if (dragSlideIndex === idx) {
        clearSlideCardDragClasses();
        card.classList.add("dragging");
        return;
      }
      const rect = typeof card.getBoundingClientRect === "function" ? card.getBoundingClientRect() : null;
      const after = rect ? (e.clientX - rect.left) > (rect.width / 2) : false;
      $slideshowThumbList.querySelectorAll(".slide-card").forEach((el) => {
        if (el !== card) el.classList.remove("drag-over-before", "drag-over-after");
      });
      card.classList.toggle("drag-over-before", !after);
      card.classList.toggle("drag-over-after", after);
    });

    card.addEventListener("dragleave", () => {
      card.classList.remove("drag-over-before", "drag-over-after");
    });

    card.addEventListener("drop", (e) => {
      if (dragSlideIndex === null) return;
      e.preventDefault();
      e.stopPropagation();
      const rect = typeof card.getBoundingClientRect === "function" ? card.getBoundingClientRect() : null;
      const after = rect ? (e.clientX - rect.left) > (rect.width / 2) : false;
      const fromIdx = dragSlideIndex;
      dragSlideIndex = null;
      clearSlideCardDragClasses();
      reorderSlide(fromIdx, after ? idx + 1 : idx);
    });

    card.addEventListener("dragend", () => {
      dragSlideIndex = null;
      clearSlideCardDragClasses();
    });

    card.addEventListener("click", () => selectSlide(idx));
    $slideshowThumbList.appendChild(card);
  });
}

function reorderSlide(fromIdx, insertBeforeIdx) {
  if (fromIdx < 0 || fromIdx >= slides.length) return;
  let targetIdx = fromIdx < insertBeforeIdx ? insertBeforeIdx - 1 : insertBeforeIdx;
  targetIdx = Math.max(0, Math.min(slides.length - 1, targetIdx));
  if (targetIdx === fromIdx) return;

  if (slidePreviewTimer) stopSlideshowPreview();
  const activeId = getActiveSlide()?.id ?? null;
  const [moved] = slides.splice(fromIdx, 1);
  slides.splice(targetIdx, 0, moved);
  if (activeId !== null) {
    activeSlideIdx = slides.findIndex((s) => s.id === activeId);
  }
  renderSlideshowCanvas();
  renderSlideshowFilmstrip();
  updateSlideshowControlsState();
  updateSlideshowEstimate();
}

function selectSlide(idx) {
  if (idx < 0 || idx >= slides.length) return;
  if (slidePreviewTimer) stopSlideshowPreview();
  activeSlideIdx = idx;
  renderSlideshowCanvas();
  updateSlideshowControlsState();
  renderSlideshowFilmstrip();
  const activeCard = $slideshowThumbList?.querySelector(".slide-card.active");
  if (activeCard && typeof activeCard.scrollIntoView === "function") {
    activeCard.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }
}

function moveSlide(idx, delta) {
  const target = idx + delta;
  if (target < 0 || target >= slides.length) return;
  reorderSlide(idx, delta > 0 ? target + 1 : target);
}

function removeSlideAt(idx) {
  if (idx < 0 || idx >= slides.length) return;
  if (slidePreviewTimer) stopSlideshowPreview();
  const [removed] = slides.splice(idx, 1);
  if (removed?.objectUrl) {
    try { URL.revokeObjectURL(removed.objectUrl); } catch (_) {}
  }
  if (slides.length === 0) {
    activeSlideIdx = -1;
  } else if (activeSlideIdx >= slides.length) {
    activeSlideIdx = slides.length - 1;
  } else if (idx < activeSlideIdx) {
    activeSlideIdx--;
  }
  renderSlideshowCanvas();
  renderSlideshowFilmstrip();
  updateSlideshowControlsState();
  updateSlideshowEstimate();
}

function clearAllSlides() {
  stopSlideshowPreview();
  for (const s of slides) {
    if (s.objectUrl) {
      try { URL.revokeObjectURL(s.objectUrl); } catch (_) {}
    }
  }
  slides = [];
  activeSlideIdx = -1;
  renderSlideshowCanvas();
  renderSlideshowFilmstrip();
  updateSlideshowControlsState();
  updateSlideshowEstimate();
}

async function addSlidesFromFiles(fileList) {
  const files = Array.from(fileList || []).filter((f) =>
    f && (f.type.startsWith("image/") || /\.(jpe?g|png|webp|bmp)$/i.test(f.name)) &&
    !f.type.includes("gif") && !f.name.toLowerCase().endsWith(".gif")
  );
  if (files.length === 0) {
    log(t("logInvalidDropFile"));
    return;
  }

  stopSlideshowPreview();
  const firstNewIdx = slides.length;
  let added = 0;

  for (const file of files) {
    try {
      const { img, objectUrl } = await loadImageFileElement(file);
      const crop = computeInitialCropState(img, slideshowTargetW, slideshowTargetH);
      const slide = {
        id: nextSlideId++,
        fileName: file.name,
        objectUrl,
        img,
        crop,
        thumbUrl: "",
      };
      slide.thumbUrl = renderSlideThumbDataUrl(slide);
      slides.push(slide);
      added++;
    } catch (err) {
      log(t("logLoadImageFailed", { msg: `${file.name}: ${err.message}` }));
    }
  }

  if (added > 0) {
    activeSlideIdx = firstNewIdx;
    renderSlideshowCanvas();
    renderSlideshowFilmstrip();
    updateSlideshowControlsState();
    updateSlideshowEstimate();
    log(t("logSlidesAdded", { added, total: slides.length }));
  }
}

function updateSlideshowTargetResolution() {
  if (!$slideshowCanvas || !$selSlideshowRes) return;
  const maxDim = getBadgeMaxDimension();
  const { targetW, targetH } = parseResolutionValue($selSlideshowRes.value);
  slideshowTargetW = Math.min(targetW, maxDim);
  slideshowTargetH = Math.min(targetH, maxDim);
  $slideshowCanvas.width = slideshowTargetW;
  $slideshowCanvas.height = slideshowTargetH;

  for (const slide of slides) {
    const oldScale = slide.crop.scale || 1;
    slide.crop.baseScale = Math.max(slideshowTargetW / slide.img.naturalWidth, slideshowTargetH / slide.img.naturalHeight);
    slide.crop.scale = slide.crop.baseScale * slide.crop.userZoom;
    const ratio = slide.crop.scale / oldScale;
    const cx = slideshowTargetW / 2;
    const cy = slideshowTargetH / 2;
    slide.crop.x = cx - (cx - slide.crop.x) * ratio;
    slide.crop.y = cy - (cy - slide.crop.y) * ratio;
    slide.thumbUrl = renderSlideThumbDataUrl(slide);
  }

  renderSlideshowCanvas();
  renderSlideshowFilmstrip();
  updateSlideshowControlsState();
  updateSlideshowEstimate();
}

function getSlideshowBadgeTargetSize() {
  const maxDim = getBadgeMaxDimension();
  const capW = client.isConnected && client.screenWidth
    ? Math.min(client.screenWidth, slideshowTargetW)
    : slideshowTargetW;
  const capH = client.isConnected && client.screenHeight
    ? Math.min(client.screenHeight, slideshowTargetH)
    : slideshowTargetH;
  return {
    safeW: Math.min(capW || 240, maxDim),
    safeH: Math.min(capH || 240, maxDim),
  };
}

function updateSlideshowEstimate() {
  if (!$slideshowEstimatedSize) return;
  if (slides.length === 0) {
    $slideshowEstimatedSize.textContent = "-";
    $slideshowEstimatedSize.style.color = "#38bdf8";
    return;
  }

  const gen = ++slideEstimateGen;
  if (slideEstimateTimer) clearTimeout(slideEstimateTimer);
  slideEstimateTimer = setTimeout(async () => {
    try {
      const res = await buildSlideshowAviPayload(Infinity, {
        silent: true,
        isCancelled: () => gen !== slideEstimateGen,
      });
      if (!res || gen !== slideEstimateGen) return;

      const kbStr = `${(res.bytes.length / 1024).toFixed(2)} KB`;
      const chunks = Math.ceil((res.bytes.length + 4) / 200);
      const { maxAviBytes } = getBadgeMediaLimits();
      if (client.isConnected && lastFreeStorageKb != null && res.bytes.length > maxAviBytes) {
        $slideshowEstimatedSize.style.color = "#fbbf24";
        $slideshowEstimatedSize.textContent = t("slideshowExceedsBudgetWarn", {
          kb: kbStr,
          chunks,
          budgetKb: Math.round(maxAviBytes / 1024),
        });
      } else {
        $slideshowEstimatedSize.style.color = "#38bdf8";
        $slideshowEstimatedSize.textContent = t("sizeChunks", { kb: kbStr, chunks });
      }
    } catch {
      if (gen === slideEstimateGen && $slideshowEstimatedSize) {
        $slideshowEstimatedSize.style.color = "#38bdf8";
        $slideshowEstimatedSize.textContent = t("sizeEstimateFailed");
      }
    }
  }, 180);
}

async function buildSlideshowAviPayload(maxBytes = Infinity, options = {}) {
  const hasFiniteBudget = Number.isFinite(maxBytes) && maxBytes > 0;
  const budget = hasFiniteBudget ? maxBytes : Infinity;
  const { silent = false, isCancelled = null } = options;
  const { safeW, safeH } = getSlideshowBadgeTargetSize();
  const shape = $selSlideshowShape ? $selSlideshowShape.value : "circle";
  const timing = SuperBandClient.intervalSecToAviTiming(getSlideIntervalSeconds());

  const maxDim = getBadgeMaxDimension();
  const canvases = slides.map((s) => exportCropToCanvas(s.img, s.crop, shape, safeW, safeH));
  const aviOverhead = (client.protocolKind === "zrun_e05" ? 5900 : 240) + canvases.length * 26;
  const perFrameBudget = hasFiniteBudget
    ? Math.max(1536, Math.floor((budget - aviOverhead) / canvases.length))
    : 96 * 1024;
  const qualities = hasFiniteBudget ? [0.88, 0.78, 0.68, 0.56, 0.44, 0.32, 0.25] : [0.88];
  let lastAvi = null;
  for (const q of qualities) {
    if (isCancelled && isCancelled()) return null;
    const jpegs = [];
    for (const c of canvases) {
      if (isCancelled && isCancelled()) return null;
      jpegs.push(await client.canvasToBadgeJpeg(c, { quality: q, maxBytes: perFrameBudget, maxDimension: maxDim }));
    }
    if (isCancelled && isCancelled()) return null;
    lastAvi = client.buildProtocolAvi(jpegs, safeW, safeH, timing);
    if (!hasFiniteBudget || lastAvi.length <= budget) {
      if (!silent) {
        log(t("logSlideshowBuilt", {
          count: slides.length,
          intervalSec: timing.intervalSec,
          w: safeW,
          h: safeH,
          kb: (lastAvi.length / 1024).toFixed(2),
          q,
        }));
      }
      return {
        bytes: lastAvi,
        width: safeW,
        height: safeH,
        timing,
        quality: q,
      };
    }
  }

  throw new Error(t("errAviTooLargeAfterCompress", {
    kb: (lastAvi.length / 1024).toFixed(1),
    budgetKb: Math.round(budget / 1024),
  }));
}

function setActiveSlideZoom(zoomFactor) {
  const cur = getActiveSlide();
  if (!cur || !$slideshowCanvas) return;
  if (slidePreviewTimer) stopSlideshowPreview();
  const roundedZoom = applyZoomFactorToCrop(cur.crop, zoomFactor, $slideshowCanvas.width, $slideshowCanvas.height);
  if ($slideshowZoomRange) $slideshowZoomRange.value = String(roundedZoom);
  if ($slideshowZoomVal) $slideshowZoomVal.textContent = `${Math.round(roundedZoom * 100)}%`;
  renderSlideshowCanvas();
  scheduleActiveSlideThumbRefresh();
  updateSlideshowEstimate();
}

// 綁定多圖輪播交互事件
if ($btnAddSlides && $fileSlideshowInput) {
  $btnAddSlides.addEventListener("click", () => $fileSlideshowInput.click());
  $fileSlideshowInput.addEventListener("change", (e) => {
    if (e.target.files && e.target.files.length > 0) {
      addSlidesFromFiles(e.target.files);
      e.target.value = "";
    }
  });
}

if ($btnClearSlides) {
  $btnClearSlides.addEventListener("click", clearAllSlides);
}
if ($btnPrevSlide) {
  $btnPrevSlide.addEventListener("click", () => selectSlide(activeSlideIdx - 1));
}
if ($btnNextSlide) {
  $btnNextSlide.addEventListener("click", () => selectSlide(activeSlideIdx + 1));
}
if ($btnToggleSlidePreview) {
  $btnToggleSlidePreview.addEventListener("click", () => {
    if (slidePreviewTimer) stopSlideshowPreview();
    else startSlideshowPreview();
  });
}

if ($selSlideshowRes) {
  $selSlideshowRes.addEventListener("change", updateSlideshowTargetResolution);
}
if ($selSlideshowShape) {
  $selSlideshowShape.addEventListener("change", () => {
    for (const s of slides) s.thumbUrl = renderSlideThumbDataUrl(s);
    renderSlideshowCanvas();
    renderSlideshowFilmstrip();
    updateSlideshowEstimate();
  });
}
if ($selSlideInterval) {
  $selSlideInterval.addEventListener("change", () => {
    updateSlideshowControlsState();
    updateSlideshowEstimate();
    if (slidePreviewTimer) startSlideshowPreview();
  });
}

if ($slideshowThumbList) {
  $slideshowThumbList.addEventListener("dragover", (e) => {
    if (dragSlideIndex !== null || (e.dataTransfer?.files && e.dataTransfer.files.length > 0) ||
        e.dataTransfer?.types?.includes?.("Files")) {
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = dragSlideIndex !== null ? "move" : "copy";
    }
  });

  $slideshowThumbList.addEventListener("drop", (e) => {
    if (dragSlideIndex !== null) {
      e.preventDefault();
      e.stopPropagation();
      const fromIdx = dragSlideIndex;
      dragSlideIndex = null;
      clearSlideCardDragClasses();
      reorderSlide(fromIdx, slides.length);
      return;
    }
    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      e.preventDefault();
      e.stopPropagation();
      addSlidesFromFiles(e.dataTransfer.files);
    }
  });
}

if ($slideshowDropArea) {
  ['dragenter', 'dragover'].forEach((eventName) => {
    $slideshowDropArea.addEventListener(eventName, (e) => {
      if (dragSlideIndex !== null) return;
      e.preventDefault();
      e.stopPropagation();
      if (e.dataTransfer) e.dataTransfer.dropEffect = "copy";
      $slideshowDropArea.style.borderColor = "var(--accent)";
      $slideshowDropArea.style.background = "rgba(6, 182, 212, 0.08)";
    });
  });

  ['dragleave', 'dragend'].forEach((eventName) => {
    $slideshowDropArea.addEventListener(eventName, (e) => {
      if (dragSlideIndex !== null) return;
      e.preventDefault();
      e.stopPropagation();
      $slideshowDropArea.style.borderColor = "var(--card-border)";
      $slideshowDropArea.style.background = "#090d16";
    });
  });

  $slideshowDropArea.addEventListener("drop", (e) => {
    if (dragSlideIndex !== null) return;
    e.preventDefault();
    e.stopPropagation();
    $slideshowDropArea.style.borderColor = "var(--card-border)";
    $slideshowDropArea.style.background = "#090d16";

    const dropped = [];
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      dropped.push(...e.dataTransfer.files);
    } else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      for (const item of e.dataTransfer.items) {
        if (item.kind === "file") {
          const f = item.getAsFile();
          if (f) dropped.push(f);
        }
      }
    }
    if (dropped.length > 0) addSlidesFromFiles(dropped);
  });

  $slideshowDropArea.addEventListener("click", () => {
    if (slides.length === 0 && $fileSlideshowInput) {
      $fileSlideshowInput.click();
    }
  });

  $slideshowDropArea.addEventListener("mousedown", (e) => {
    const cur = getActiveSlide();
    if (!cur) return;
    if (slidePreviewTimer) stopSlideshowPreview();
    slideDragging = true;
    slideDragStartX = e.clientX - cur.crop.x;
    slideDragStartY = e.clientY - cur.crop.y;
  });

  $slideshowDropArea.addEventListener("wheel", (e) => {
    const cur = getActiveSlide();
    if (!cur) return;
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.01 : -0.01;
    setActiveSlideZoom(cur.crop.userZoom + delta);
  }, { passive: false });
}

window.addEventListener("mousemove", (e) => {
  if (!slideDragging) return;
  const cur = getActiveSlide();
  if (!cur) {
    slideDragging = false;
    return;
  }
  cur.crop.x = e.clientX - slideDragStartX;
  cur.crop.y = e.clientY - slideDragStartY;
  renderSlideshowCanvas();
});

window.addEventListener("mouseup", () => {
  if (!slideDragging) return;
  slideDragging = false;
  const cur = getActiveSlide();
  if (cur) {
    cur.thumbUrl = renderSlideThumbDataUrl(cur);
    const thumbEl = document.querySelector(`.slide-card[data-slide-id="${cur.id}"] .slide-card-thumb`);
    if (thumbEl) thumbEl.src = cur.thumbUrl;
    updateSlideshowEstimate();
  }
});

if ($slideshowZoomRange) {
  $slideshowZoomRange.addEventListener("input", (e) => {
    setActiveSlideZoom(parseFloat(e.target.value));
  });
}
if ($btnSlideZoomOut) {
  $btnSlideZoomOut.addEventListener("click", () => {
    const cur = getActiveSlide();
    if (cur) setActiveSlideZoom(cur.crop.userZoom - 0.01);
  });
}
if ($btnSlideZoomIn) {
  $btnSlideZoomIn.addEventListener("click", () => {
    const cur = getActiveSlide();
    if (cur) setActiveSlideZoom(cur.crop.userZoom + 0.01);
  });
}
if ($btnSlideRotateLeft) {
  $btnSlideRotateLeft.addEventListener("click", () => {
    const cur = getActiveSlide();
    if (!cur) return;
    if (slidePreviewTimer) stopSlideshowPreview();
    cur.crop.rotation = (cur.crop.rotation - 90 + 360) % 360;
    renderSlideshowCanvas();
    cur.thumbUrl = renderSlideThumbDataUrl(cur);
    renderSlideshowFilmstrip();
    updateSlideshowEstimate();
  });
}
if ($btnSlideRotateRight) {
  $btnSlideRotateRight.addEventListener("click", () => {
    const cur = getActiveSlide();
    if (!cur) return;
    if (slidePreviewTimer) stopSlideshowPreview();
    cur.crop.rotation = (cur.crop.rotation + 90) % 360;
    renderSlideshowCanvas();
    cur.thumbUrl = renderSlideThumbDataUrl(cur);
    renderSlideshowFilmstrip();
    updateSlideshowEstimate();
  });
}
if ($btnResetSlideCrop) {
  $btnResetSlideCrop.addEventListener("click", () => {
    const cur = getActiveSlide();
    if (!cur) return;
    if (slidePreviewTimer) stopSlideshowPreview();
    cur.crop = computeInitialCropState(cur.img, slideshowTargetW, slideshowTargetH);
    renderSlideshowCanvas();
    cur.thumbUrl = renderSlideThumbDataUrl(cur);
    renderSlideshowFilmstrip();
    updateSlideshowControlsState();
    updateSlideshowEstimate();
  });
}

if ($btnExportSlideshowAvi) {
  $btnExportSlideshowAvi.addEventListener("click", async () => {
    hideNotice();
    if (slides.length === 0) {
      showNotice("warn", { titleKey: "noticeNoSlidesTitle", bodyKey: "noticeNoSlidesBody" });
      return;
    }

    try {
      $btnExportSlideshowAvi.disabled = true;
      showProgress(true, t("progressEncodingSlideshow", { count: slides.length }));
      const { bytes, timing } = await buildSlideshowAviPayload(Infinity);

      const rawName = ($txtSlideshowName?.value || "slideshow_01").trim() || "slideshow_01";
      const fileName = rawName.toLowerCase().endsWith(".avi") ? rawName : `${rawName}.avi`;
      const blob = new Blob([bytes], { type: "video/x-msvideo" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => {
        try { URL.revokeObjectURL(url); } catch (_) {}
      }, 5000);

      const kb = (bytes.length / 1024).toFixed(2);
      log(t("logSlideshowExported", { filename: fileName, kb }));
      showNotice("success", {
        titleKey: "noticeSlideshowExportSuccessTitle",
        bodyKey: "noticeSlideshowExportSuccessBody",
        bodyParams: {
          filename: fileName,
          count: slides.length,
          intervalSec: timing.intervalSec,
          kb,
        },
      });
    } catch (err) {
      log(t("logSlideshowUploadFailed", { msg: err.message }));
      showNotice("error", { titleKey: "noticeSlideshowFailedTitle", rawBody: err.message });
    } finally {
      $btnExportSlideshowAvi.disabled = slides.length === 0;
      showProgress(false);
    }
  });
}

if ($btnUploadSlideshow) {
  $btnUploadSlideshow.addEventListener("click", async () => {
    hideNotice();
    if (!client.isConnected) {
      const reconnected = await ensureConnectionActive();
      if (!reconnected) {
        showNotice("warn", { titleKey: "noticeNotConnectedTitle", bodyKey: "noticeNotConnectedBodySlideshow" });
        return;
      }
    }
    if (slides.length === 0) {
      showNotice("warn", { titleKey: "noticeNoSlidesTitle", bodyKey: "noticeNoSlidesBody" });
      return;
    }

    try {
      $btnUploadSlideshow.disabled = true;
      showProgress(true, t("progressEncodingSlideshow", { count: slides.length }));
      const { maxAviBytes } = getBadgeMediaLimits();
      const { bytes, width, height, timing } = await buildSlideshowAviPayload(maxAviBytes);

      const fileName = ($txtSlideshowName?.value || "slideshow_01").trim() || "slideshow_01";
      const slot = 0;

      log(t("logSlideshowUploadStart", {
        name: fileName,
        count: slides.length,
        intervalSec: timing.intervalSec,
        w: width,
        h: height,
        bytes: bytes.length,
        slot,
      }));
      await client.uploadDialImage(bytes, (sent, total, pct) => {
        updateProgress(sent, total, pct, t("progressUploadingSlideshow", { pct }));
      }, { slot, isAvi: 1, custom: 0, dialId: client.activeDialId, fontPos: 0 });

      showProgress(false);
      log(t("logSlideshowUploadSuccess"));
      await refreshStorageSpace();
      showNotice("success", {
        titleKey: "noticeSlideshowUploadSuccessTitle",
        bodyKey: "noticeSlideshowUploadSuccessBody",
        bodyParams: {
          name: fileName,
          count: slides.length,
          intervalSec: timing.intervalSec,
        },
      });
    } catch (err) {
      log(t("logSlideshowUploadFailed", { msg: err.message }));
      showNotice("error", { titleKey: "noticeSlideshowFailedTitle", rawBody: err.message });
    } finally {
      $btnUploadSlideshow.disabled = !client.isConnected;
      showProgress(false);
    }
  });
}

// ==========================================
// 6. 進度條輔助函式與頁籤切換
// ==========================================
function showProgress(show, statusText = "") {
  $progressWrap.style.display = show ? "block" : "none";
  if (statusText) $progressStatusText.textContent = statusText;
  if (!show) {
    $progressFill.style.width = "0%";
    $progressBytesText.textContent = "0 / 0 KB (0%)";
  }
}

function updateProgress(sent, total, pct, statusText) {
  $progressWrap.style.display = "block";
  $progressFill.style.width = `${pct}%`;
  $progressStatusText.textContent = statusText;
  const sentKb = (sent / 1024).toFixed(1);
  const totalKb = (total / 1024).toFixed(1);
  $progressBytesText.textContent = `${sentKb} / ${totalKb} KB (${pct}%)`;
}

// 頁籤切換
function switchTab(targetId) {
  if (targetId !== "tab-slideshow" && typeof stopSlideshowPreview === "function" && slidePreviewTimer) {
    stopSlideshowPreview();
  }
  document.querySelectorAll(".tab-btn").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-tab") === targetId);
  });
  document.querySelectorAll(".tab-pane").forEach((p) => {
    p.classList.toggle("active", p.id === targetId);
  });
  if (targetId === "tab-slideshow") {
    if ($btnUploadSlideshow) $btnUploadSlideshow.disabled = !client.isConnected;
    if (typeof updateSlideshowEstimate === "function") updateSlideshowEstimate();
  }
}

document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    switchTab(btn.getAttribute("data-tab"));
  });
});

// ==========================================
// 7. 雙語偵測與即時切換 (zh-TW / en)
// ==========================================
function applyLanguage() {
  const lang = getCurrentLang();
  document.documentElement.lang = lang === "en" ? "en" : "zh-TW";
  document.title = t("pageTitle");

  if ($btnLangZh) {
    const isZh = lang === "zh";
    $btnLangZh.classList.toggle("active", isZh);
    $btnLangZh.setAttribute("aria-pressed", String(isZh));
  }
  if ($btnLangEn) {
    const isEn = lang === "en";
    $btnLangEn.classList.toggle("active", isEn);
    $btnLangEn.setAttribute("aria-pressed", String(isEn));
  }

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.getAttribute("data-i18n");
    if (key) el.textContent = t(key);
  });
  document.querySelectorAll("[data-i18n-title]").forEach((el) => {
    const key = el.getAttribute("data-i18n-title");
    if (key) el.setAttribute("title", t(key));
  });
  document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
    const key = el.getAttribute("data-i18n-placeholder");
    if (key) el.setAttribute("placeholder", t(key));
  });

  if (lastConnState.connected) {
    $connStatusText.textContent = t("statusConnected", { name: lastConnState.deviceName || "SuperBand" });
    if (lastConnState.profileKey) {
      $infoProfile.textContent = t(lastConnState.profileKey);
    } else if (lastConnState.profileName) {
      $infoProfile.textContent = lastConnState.profileName;
    }
  } else {
    $connStatusText.textContent = t("statusDisconnected");
  }

  if (lastDeviceInfo) {
    $infoVersion.textContent = t("versionFormat", {
      fw: lastDeviceInfo.deviceVersion || "v1.0",
      proto: lastDeviceInfo.protocolVersion || "v1",
    });
  }

  if (lastNoticeState) {
    renderNotice(lastNoticeState);
  }

  if (lastMediaState.selected) {
    if (lastMediaState.isAvi && !lastMediaState.aviInfo && $mediaPreviewContainer) {
      $mediaPreviewContainer.innerHTML = "";
      const span = document.createElement("span");
      span.style.color = "#38bdf8";
      span.style.fontSize = "13px";
      span.textContent = t("mediaPreviewAvi", { name: lastMediaState.name });
      $mediaPreviewContainer.appendChild(span);
    }
    renderMediaDetails();
  }

  if (currentImg) {
    updateEstimatedFileSize();
  }

  if ($selSlideInterval) {
    Array.from($selSlideInterval.options).forEach((opt) => {
      opt.textContent = t("slideIntervalOptFmt", { sec: opt.value });
    });
  }
  if (typeof renderSlideshowFilmstrip === "function") renderSlideshowFilmstrip();
  if (typeof updateSlideshowControlsState === "function") updateSlideshowControlsState();
  if (typeof updateSlideshowEstimate === "function") updateSlideshowEstimate();
  updateLastDeviceUI();
}

function handleLangChange(nextLang) {
  if (getCurrentLang() === nextLang) return;
  setLanguage(nextLang, true);
  applyLanguage();
  log(t("langSwitched"));
}

if ($btnLangZh) $btnLangZh.addEventListener("click", () => handleLangChange("zh"));
if ($btnLangEn) $btnLangEn.addEventListener("click", () => handleLangChange("en"));

// 啟動時自動偵測語言、套用介面並初始化畫布
const startupLang = initLanguage();
applyLanguage();
if (startupLang.source === "query") {
  log(t("langStatusQuery"));
} else if (startupLang.source === "saved") {
  log(t("langStatusSaved"));
} else {
  log(t("langStatusAuto", { browserLang: startupLang.browserLocale || "unknown" }));
}

updateCropTargetResolution();
if (typeof updateSlideshowTargetResolution === "function") updateSlideshowTargetResolution();
updateLastDeviceUI();

// 啟動時若有記憶上次裝置且開啟自動連線，嘗試靜默重新連線
async function attemptAutoReconnect() {
  const last = getLastSavedDeviceInfo();
  if (!last || !last.id) return;

  const autoEnabled = !$chkAutoReconnect || $chkAutoReconnect.checked;
  if (!autoEnabled) return;

  if (typeof client.getPermittedDevices !== "function") return;

  try {
    const permitted = await client.getPermittedDevices();
    if (!permitted || permitted.length === 0) return;

    const target = permitted.find(d => d.id === last.id) || permitted.find(d => d.name === last.name);
    if (!target) return;

    log(t("logAutoConnecting", { name: target.name || last.name }));
    const res = await client.connectDevice(target);
    saveLastConnectedDevice(target, res);
    updateUIConnectionState(true, res);
    $infoProfile.textContent = res.profileKey ? t(res.profileKey) : res.profileName;
    if ($selFormat) {
      $selFormat.value = res.protocolKind === "zrun_e05" ? "jpeg" : "avi";
    }
    log(t("logAutoConnectSuccess", { name: target.name || last.name }));
    await refreshDeviceInfo();
  } catch (err) {
    log(t("logAutoConnectFailed", { name: last.name }));
    updateUIConnectionState(false);
  }
}

attemptAutoReconnect();
