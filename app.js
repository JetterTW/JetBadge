import { SuperBandClient } from "./baji.js?v=35";
import { initLanguage, setLanguage, getCurrentLang, t } from "./i18n.js?v=35";

// DOM 元素引用
const $ = (id) => document.getElementById(id);
const $logBox = $("logBox");
const $connStatus = $("connStatus");
const $connStatusText = $("connStatusText");
const $btnConnect = $("btnConnect");
const $btnDisconnect = $("btnDisconnect");
const $btnRefreshInfo = $("btnRefreshInfo");
const $btnFindMe = $("btnFindMe");
const $chkAllDevices = $("chkAllDevices");
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
const $zoomRange = $("zoomRange");
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
    $btnFindMe.disabled = false;
    $btnUploadCropped.disabled = false;
    $btnUploadMedia.disabled = false;
    if ($btnRefreshSpace) $btnRefreshSpace.disabled = false;
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
    if ($btnRefreshSpace) $btnRefreshSpace.disabled = true;

    observedTotalFlashKb = 0;
    lastFreeStorageKb = null;
    $infoName.textContent = "-";
    $infoResolution.textContent = "-";
    $infoProfile.textContent = "-";
    $infoVersion.textContent = "-";
    $infoStorageText.textContent = "-";
    if ($deviceRemainingSpace) $deviceRemainingSpace.textContent = "-";
    $storageFill.style.width = "0%";
    if (typeof renderMediaDetails === "function") renderMediaDetails();
  }
}

$btnConnect.addEventListener("click", async () => {
  try {
    const acceptAll = $chkAllDevices.checked;
    const res = await client.connect(acceptAll);
    updateUIConnectionState(true, res);
    $infoProfile.textContent = res.profileKey ? t(res.profileKey) : res.profileName;

    // 自動讀取設備資訊與剩餘空間
    await refreshDeviceInfo();
  } catch (err) {
    log(t("logConnectFailed", { msg: err.message }));
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
    $storageFill.style.width = "0%";
  }
  if (typeof renderMediaDetails === "function") renderMediaDetails();
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

    // 若從設備偵測到解析度，同步套用到裁切設定
    if (info.detectedResolution.includes("240 x 240")) {
      $selResolution.value = "240x240";
    } else if (info.detectedResolution.includes("360 x 360")) {
      $selResolution.value = "360x360";
    } else if (info.detectedResolution.includes("240 x 280")) {
      $selResolution.value = "240x280";
    }
    updateCropTargetResolution();
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
// 3. 相片裁切工具 (JPG/PNG Canvas Cropper)
// ==========================================
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
  const val = $selResolution.value;
  if (val === "240x240") {
    cropState.targetW = 240;
    cropState.targetH = 240;
  } else if (val === "360x360") {
    cropState.targetW = 360;
    cropState.targetH = 360;
  } else if (val === "240x280") {
    cropState.targetW = 240;
    cropState.targetH = 280;
  } else if (val === "128x128") {
    cropState.targetW = 128;
    cropState.targetH = 128;
  }
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
  cropState.rotation = 0;

  // 計算自適應初始縮放比例，使圖片剛好填滿裁切框 (基於原生解析度，完全不受高像素檔案影響)
  cropState.baseScale = Math.max(cropState.targetW / img.naturalWidth, cropState.targetH / img.naturalHeight);
  cropState.userZoom = 1.0;
  cropState.scale = cropState.baseScale * cropState.userZoom;

  $zoomRange.min = "0.4";
  $zoomRange.max = "4.0";
  $zoomRange.step = "0.05";
  $zoomRange.value = "1.0";
  $zoomVal.textContent = "100%";

  cropState.x = (cropState.targetW - img.naturalWidth * cropState.scale) / 2;
  cropState.y = (cropState.targetH - img.naturalHeight * cropState.scale) / 2;

  renderCrop();
  updateEstimatedFileSize();

  if (client.isConnected) {
    $btnUploadCropped.disabled = false;
  }
}

function renderCrop() {
  cropCtx.clearRect(0, 0, $cropCanvas.width, $cropCanvas.height);

  if (currentImg) {
    cropCtx.save();
    // 移動至畫布中心以處理旋轉
    const cx = cropState.x + (currentImg.naturalWidth * cropState.scale) / 2;
    const cy = cropState.y + (currentImg.naturalHeight * cropState.scale) / 2;
    cropCtx.translate(cx, cy);
    cropCtx.rotate((cropState.rotation * Math.PI) / 180);
    cropCtx.drawImage(
      currentImg,
      (-currentImg.naturalWidth * cropState.scale) / 2,
      (-currentImg.naturalHeight * cropState.scale) / 2,
      currentImg.naturalWidth * cropState.scale,
      currentImg.naturalHeight * cropState.scale
    );
    cropCtx.restore();
  } else {
    // 空狀態時繪製暗色背景
    cropCtx.fillStyle = "#090d16";
    cropCtx.fillRect(0, 0, $cropCanvas.width, $cropCanvas.height);
  }

  // 繪製裁切遮罩（圓形徽章外圍半透明黑罩）
  const shape = $selCropShape.value;
  if (shape === "circle") {
    cropCtx.save();
    cropCtx.fillStyle = "rgba(0, 0, 0, 0.65)";
    cropCtx.beginPath();
    cropCtx.rect(0, 0, $cropCanvas.width, $cropCanvas.height);
    const radius = Math.min($cropCanvas.width, $cropCanvas.height) / 2;
    cropCtx.arc($cropCanvas.width / 2, $cropCanvas.height / 2, radius, 0, Math.PI * 2, true);
    cropCtx.fill("evenodd");

    // 圓形邊界輔助線
    cropCtx.strokeStyle = "rgba(6, 182, 212, 0.6)";
    cropCtx.lineWidth = 1.5;
    cropCtx.beginPath();
    cropCtx.arc($cropCanvas.width / 2, $cropCanvas.height / 2, radius - 1, 0, Math.PI * 2);
    cropCtx.stroke();
    cropCtx.restore();
  }
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

  let file = null;
  if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
    file = e.dataTransfer.files[0];
  } else if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
    const item = e.dataTransfer.items[0];
    if (item.kind === 'file') file = item.getAsFile();
  }

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

// 畫布滑鼠滾輪縮放 (Zoom)
$dropArea.addEventListener("wheel", (e) => {
  if (!currentImg) return;
  e.preventDefault();
  const delta = e.deltaY < 0 ? 0.05 : -0.05;
  const newZoom = Math.max(0.4, Math.min(4.0, cropState.userZoom + delta));
  setZoom(newZoom);
}, { passive: false });

$zoomRange.addEventListener("input", (e) => {
  setZoom(parseFloat(e.target.value));
});

function setZoom(zoomFactor) {
  if (!currentImg) return;
  const oldScale = cropState.scale;
  cropState.userZoom = zoomFactor;
  cropState.scale = cropState.baseScale * cropState.userZoom;
  $zoomRange.value = zoomFactor;
  $zoomVal.textContent = `${Math.round(zoomFactor * 100)}%`;

  // 以畫布中心為基準進行等比縮放
  const cx = $cropCanvas.width / 2;
  const cy = $cropCanvas.height / 2;
  cropState.x = cx - (cx - cropState.x) * (cropState.scale / oldScale);
  cropState.y = cy - (cy - cropState.y) * (cropState.scale / oldScale);
  renderCrop();
}

$btnRotateLeft.addEventListener("click", () => {
  cropState.rotation = (cropState.rotation - 90 + 360) % 360;
  renderCrop();
});
$btnRotateRight.addEventListener("click", () => {
  cropState.rotation = (cropState.rotation + 90) % 360;
  renderCrop();
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
      const encoded = format === "jpeg"
        ? await client.canvasToBadgeJpeg(outCanvas, { quality: 0.90, maxBytes: 96 * 1024 })
        : await client.canvasToBadgeAvi(outCanvas, { quality: 0.90, maxBytes: 96 * 1024, fps: 5 });
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
  const outCanvas = document.createElement("canvas");
  outCanvas.width = cropState.targetW;
  outCanvas.height = cropState.targetH;
  const ctx = outCanvas.getContext("2d");

  // 實心純黑底色，避免 JPEG/MJPEG 編碼產生雜色邊框
  ctx.fillStyle = "#000000";
  ctx.fillRect(0, 0, outCanvas.width, outCanvas.height);

  // 若為圓形遮罩，將圓外裁切為黑色
  if ($selCropShape.value === "circle") {
    ctx.beginPath();
    ctx.arc(outCanvas.width / 2, outCanvas.height / 2, Math.min(outCanvas.width, outCanvas.height) / 2, 0, Math.PI * 2);
    ctx.clip();
  }

  const cx = cropState.x + (currentImg.naturalWidth * cropState.scale) / 2;
  const cy = cropState.y + (currentImg.naturalHeight * cropState.scale) / 2;
  ctx.translate(cx, cy);
  ctx.rotate((cropState.rotation * Math.PI) / 180);
  ctx.drawImage(
    currentImg,
    (-currentImg.naturalWidth * cropState.scale) / 2,
    (-currentImg.naturalHeight * cropState.scale) / 2,
    currentImg.naturalWidth * cropState.scale,
    currentImg.naturalHeight * cropState.scale
  );
  return outCanvas;
}

// 執行相片上傳
$btnUploadCropped.addEventListener("click", async () => {
  hideNotice();
  if (!client.isConnected) {
    showNotice("warn", { titleKey: "noticeNotConnectedTitle", bodyKey: "noticeNotConnectedBodyPhoto" });
    return;
  }
  if (!currentImg) {
    showNotice("warn", { titleKey: "noticeNoPhotoTitle", bodyKey: "noticeNoPhotoBody" });
    return;
  }

  try {
    $btnUploadCropped.disabled = true;
    const format = $selFormat ? $selFormat.value : "avi";
    const slot = 0;
    const outCanvas = getCroppedCanvas();

    let bytes;
    let isAvi = 1;
    if (format === "avi") {
      showProgress(true, t("progressEncodingAvi"));
      bytes = await client.canvasToBadgeAvi(outCanvas, { quality: 0.90, maxBytes: 96 * 1024, fps: 5 });
      isAvi = 1;
      log(t("logPrepareAvi", {
        w: outCanvas.width,
        h: outCanvas.height,
        bytes: bytes.length,
        totalBytes: bytes.length + 4,
      }));
    } else if (format === "jpeg") {
      showProgress(true, t("progressEncodingJpeg"));
      bytes = await client.canvasToBadgeJpeg(outCanvas, { quality: 0.90, maxBytes: 96 * 1024 });
      isAvi = 0;
      log(t("logPrepareJpeg", { bytes: bytes.length }));
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

    log(t("logPhotoUploadStart", {
      slot,
      ext: isAvi ? ".avi" : "",
      isAvi,
    }));
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
  const targetW = Math.min(client.screenWidth || cropState.targetW || 240, 359);
  const targetH = Math.min(client.screenHeight || cropState.targetH || 240, 359);
  const maxAviBytes = lastFreeStorageKb != null && lastFreeStorageKb > 16
    ? Math.max(16 * 1024, Math.min(350 * 1024, Math.floor((lastFreeStorageKb - 8) * 1024)))
    : 220 * 1024;
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
    const { targetW, targetH, maxAviBytes } = getBadgeMediaLimits();
    const needsResize = info.width > targetW || info.height > targetH || info.width > 359 || info.height > 359;
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
  const safeW = Math.min(targetW, 359);
  const safeH = Math.min(targetH, 359);
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

      // 路徑 1：尺寸 <= 徽章上限且 <= 359×359，先嘗試無損清理重封裝（移除 JUNK/vprp/APP2/COM）
      const dimsOk = parsed.width > 0 && parsed.height > 0 &&
        parsed.width <= safeW && parsed.height <= safeH &&
        parsed.width <= 359 && parsed.height <= 359;
      if (dimsOk) {
        try {
          const cleanFrames = parsed.frames.map((f) => SuperBandClient.sanitizeBadgeJpeg(f));
          const remuxed = SuperBandClient.buildMjpegAvi(cleanFrames, parsed.width, parsed.height, timing);
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
        const perFrameBudget = Math.max(2048, Math.floor((maxAviBytes - 640) / canvases.length));
        const jpegs = [];
        for (const c of canvases) {
          jpegs.push(await client.canvasToBadgeJpeg(c, { quality: q, maxBytes: perFrameBudget }));
        }
        lastAvi = SuperBandClient.buildMjpegAvi(jpegs, safeW, safeH, outTiming);
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
    const perFrameBudget = Math.max(3072, Math.floor((maxAviBytes - 512) / canvases.length));
    const jpegs = [];
    for (const c of canvases) {
      jpegs.push(await client.canvasToBadgeJpeg(c, { quality: q, maxBytes: perFrameBudget }));
    }
    const avi = SuperBandClient.buildMjpegAvi(jpegs, safeW, safeH, fps);
    if (avi.length <= maxAviBytes || q === 0.38) {
      return { bytes: avi, width: safeW, height: safeH };
    }
  }
  throw new Error(t("errMediaSizeExceeded"));
}

$btnUploadMedia.addEventListener("click", async () => {
  hideNotice();
  if (!client.isConnected) {
    showNotice("warn", { titleKey: "noticeNotConnectedTitle", bodyKey: "noticeNotConnectedBodyMedia" });
    return;
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
  document.querySelectorAll(".tab-btn").forEach((b) => {
    b.classList.toggle("active", b.getAttribute("data-tab") === targetId);
  });
  document.querySelectorAll(".tab-pane").forEach((p) => {
    p.classList.toggle("active", p.id === targetId);
  });
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
