import { SuperBandClient } from "./baji.js?v=33";

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

function hideNotice() {
  if (!$uploadNotice) return;
  $uploadNotice.className = "notice-banner";
}

function showNotice(kind, title, detail = "") {
  if (!$uploadNotice || !$uploadNoticeTitle || !$uploadNoticeBody) return;
  $uploadNotice.className = `notice-banner visible ${kind}`;
  $uploadNoticeTitle.textContent = title;
  $uploadNoticeBody.textContent = detail;
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
  log(`⚠️ 腳本執行錯誤: ${e.message} (${e.filename?.split("/").pop()}:${e.lineno})`);
});
window.addEventListener("unhandledrejection", (e) => {
  log(`⚠️ 非同步未捕捉錯誤: ${e.reason?.message || e.reason}`);
});

$btnClearLog.addEventListener("click", () => {
  $logBox.textContent = "";
});

// 初始化 SuperBand BLE 客戶端
const client = new SuperBandClient(log);
client.onDisconnected = () => {
  log("藍牙設備已離線，UI 狀態已重設為未連線");
  updateUIConnectionState(false);
};

// 記錄本次連線觀測到之可用 Flash 基準上限，以便正確繪製剩餘空間進度條
let observedTotalFlashKb = 0;

// ==========================================
// 1. 藍牙連線與設備管理
// ==========================================
function updateUIConnectionState(connected, info = null) {
  if (connected) {
    $connStatus.classList.add("connected");
    $connStatusText.textContent = `已連線: ${info?.deviceName || "SuperBand"}`;
    $btnConnect.disabled = true;
    $btnDisconnect.disabled = false;
    $btnRefreshInfo.disabled = false;
    $btnFindMe.disabled = false;
    $btnUploadCropped.disabled = false;
    $btnUploadMedia.disabled = false;
    if ($btnRefreshSpace) $btnRefreshSpace.disabled = false;
  } else {
    $connStatus.classList.remove("connected");
    $connStatusText.textContent = "未連線";
    $btnConnect.disabled = false;
    $btnDisconnect.disabled = true;
    $btnRefreshInfo.disabled = true;
    $btnFindMe.disabled = true;
    $btnUploadCropped.disabled = true;
    $btnUploadMedia.disabled = true;
    if ($btnRefreshSpace) $btnRefreshSpace.disabled = true;

    observedTotalFlashKb = 0;
    $infoName.textContent = "-";
    $infoResolution.textContent = "-";
    $infoProfile.textContent = "-";
    $infoVersion.textContent = "-";
    $infoStorageText.textContent = "-";
    if ($deviceRemainingSpace) $deviceRemainingSpace.textContent = "-";
    $storageFill.style.width = "0%";
  }
}

$btnConnect.addEventListener("click", async () => {
  try {
    const acceptAll = $chkAllDevices.checked;
    const res = await client.connect(acceptAll);
    updateUIConnectionState(true, res);
    $infoProfile.textContent = res.profileName;

    // 自動讀取設備資訊與剩餘空間
    await refreshDeviceInfo();
  } catch (err) {
    log(`連線失敗: ${err.message}`);
    updateUIConnectionState(false);
  }
});

$btnDisconnect.addEventListener("click", async () => {
  try {
    await client.disconnect();
    log("已手動斷開連線");
  } catch (err) {
    log(`中斷連線異常: ${err.message}`);
  } finally {
    updateUIConnectionState(false);
  }
});

// ==========================================
// 2. 取得設備尺寸與系統資訊
// ==========================================
function updateStorageDisplay(freeKb) {
  if (freeKb != null && freeKb >= 0) {
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
    $infoStorageText.textContent = "-";
    if ($deviceRemainingSpace) $deviceRemainingSpace.textContent = "-";
    $storageFill.style.width = "0%";
  }
}

async function refreshStorageSpace() {
  if (!client.isConnected) return;
  try {
    if ($btnRefreshSpace) $btnRefreshSpace.disabled = true;
    const freeKb = await client.getRemainingSpace();
    updateStorageDisplay(freeKb);
  } catch (err) {
    log(`讀取剩餘空間失敗: ${err.message}`);
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
    $infoName.textContent = info.deviceName;
    $infoResolution.textContent = info.detectedResolution;
    $infoVersion.textContent = `韌體 ${info.deviceVersion || "v1.0"} / 協定 ${info.protocolVersion || "v1"}`;

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
    log(`讀取設備資訊失敗: ${err.message}`);
  }
}

$btnRefreshInfo.addEventListener("click", refreshDeviceInfo);
$btnFindMe.addEventListener("click", async () => {
  try {
    await client.findMe();
  } catch (err) {
    log(`尋找/喚醒徽章失敗: ${err.message}`);
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
  log(`📸 正在載入圖片檔案: ${file.name} (${(file.size / 1024).toFixed(1)} KB)...`);
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
        log(`✅ 圖片 ${file.name} 載入成功 (${img.naturalWidth} x ${img.naturalHeight})！可在上方滑鼠拖曳/縮放調整構圖。`);
      } catch (err) {
        log(`❌ 圖片初始化異常: ${err.message}`);
        console.error(err);
      }
    };
    img.onerror = () => {
      log(`❌ 圖片解析失敗，請確認檔案格式是否受瀏覽器支援。`);
      showNotice("error", "圖片解析失敗", "請選擇有效的 JPG、PNG 或 WebP 圖檔！");
    };
    img.src = currentObjectUrl;
  } catch (err) {
    log(`❌ 載入圖片失敗: ${err.message}`);
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
    loadFileIntoCropper(file);
  } else {
    log("⚠️ 拖入的項目非有效檔案。");
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
    if ($previewFileSize) $previewFileSize.textContent = `${kbStr} (RGB565 原生未壓縮點陣)`;
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
      if ($selectedImageSize) $selectedImageSize.textContent = `${kbStr} (約 ${chunks} 塊)`;
      if ($previewFileSize) $previewFileSize.textContent = `${kbStr} (${format === "avi" ? "MJPEG AVI" : "Baseline JPEG"})`;
    } catch {
      if (gen === estimateGeneration && $selectedImageSize) {
        $selectedImageSize.textContent = "估算失敗";
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
    showNotice("warn", "尚未連線至徽章", "請先點擊上方「搜尋並連接徽章」。");
    return;
  }
  if (!currentImg) {
    showNotice("warn", "尚未選取相片", "請先選擇或拖入一張相片！");
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
      showProgress(true, "正在處理相片 (MJPEG AVI 轉碼與封裝)...");
      bytes = await client.canvasToBadgeAvi(outCanvas, { quality: 0.90, maxBytes: 96 * 1024, fps: 5 });
      isAvi = 1;
      log(`準備傳輸 MJPEG AVI (${outCanvas.width}x${outCanvas.height}, ${bytes.length} 位元組, 含 4B 標頭共 ${bytes.length + 4}B)...`);
    } else if (format === "jpeg") {
      showProgress(true, "正在處理相片 (Baseline JPEG 轉碼)...");
      bytes = await client.canvasToBadgeJpeg(outCanvas, { quality: 0.90, maxBytes: 96 * 1024 });
      isAvi = 0;
      log(`⚠️ 準備傳輸 Baseline JPEG (static isAvi=0, ${bytes.length}B) — 注意 BG02 韌體預設僅對 .avi (isAvi=1) 啟用解碼顯示`);
    } else {
      showProgress(true, "正在處理相片 (RGB565 原生點陣)...");
      bytes = client.canvasToRgb565(outCanvas);
      isAvi = 0;
      log(`⚠️ 準備傳輸 RGB565 原生點陣 (${outCanvas.width}x${outCanvas.height}, ${bytes.length}B, isAvi=0)`);
    }

    log(`🚀 開始向徽章發送啟動指令 (固定儲存槽位: Slot ${slot} /bgp_wa${slot}${isAvi ? ".avi" : ""}, isAvi=${isAvi}, custom=0)...`);
    await client.uploadDialImage(bytes, (sent, total, pct) => {
      updateProgress(sent, total, pct, `正在傳輸至徽章 (進度: ${pct}%)...`);
    }, { slot, isAvi, custom: 0, dialId: client.activeDialId, fontPos: 0 });

    showProgress(false);
    log("🎉 圖像已成功寫入徽章 Flash (UPLOAD SUCCESS)！");
    await refreshStorageSpace();
    showNotice("success", "🎉 相片已成功寫入徽章！", "徽章螢幕現已退出傳輸狀態並更新顯示！");
  } catch (err) {
    log(`相片上傳失敗: ${err.message}`);
    showNotice("error", "相片上傳失敗", err.message);
  } finally {
    $btnUploadCropped.disabled = false;
    showProgress(false);
  }
});

// ==========================================
// 5. GIF 動態圖 / MP4 影片 / AVI 動畫上傳
// ==========================================
let currentMediaFile = null;

$btnSelectMedia.addEventListener("click", () => $fileMediaInput.click());

$fileMediaInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;
  currentMediaFile = file;
  $txtMediaName.value = file.name.replace(/\.[^/.]+$/, "");

  const lower = file.name.toLowerCase();
  if (file.type.includes("gif") || lower.endsWith(".gif")) {
    $selMediaType.value = "ANIMATION";
    $mediaPreviewContainer.innerHTML = `<img src="${URL.createObjectURL(file)}" class="preview-thumbnail" style="width: 180px; height: 180px; object-fit: contain;" />`;
  } else if (file.type.includes("video") || lower.endsWith(".mp4") || lower.endsWith(".webm")) {
    $selMediaType.value = "VIDEO";
    $mediaPreviewContainer.innerHTML = `<video src="${URL.createObjectURL(file)}" autoplay loop muted style="max-width: 220px; max-height: 200px; border-radius: 8px;"></video>`;
  } else if (lower.endsWith(".avi")) {
    $selMediaType.value = "VIDEO";
    $mediaPreviewContainer.innerHTML = `<span style="color: #38bdf8; font-size: 13px;">🎞️ 已選取原生 AVI 動畫檔案：${file.name}</span>`;
  }

  const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
  $mediaDetails.textContent = `檔案: ${file.name} | 大小: ${sizeMb} MB | 類型: ${file.type || "application/octet-stream"}`;
});

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
  const rawBuf = new Uint8Array(await file.arrayBuffer());
  const isAlreadyAvi = rawBuf.length >= 12 &&
    rawBuf[0] === 0x52 && rawBuf[1] === 0x49 && rawBuf[2] === 0x46 && rawBuf[3] === 0x46 &&
    rawBuf[8] === 0x41 && rawBuf[9] === 0x56 && rawBuf[10] === 0x49 && rawBuf[11] === 0x20;
  if (isAlreadyAvi) return rawBuf;

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
        canvases.push(drawSourceCoverToBadgeCanvas(image, image.displayWidth || targetW, image.displayHeight || targetH, targetW, targetH));
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
        el.onerror = () => reject(new Error("無法載入 GIF 檔案"));
        el.src = imgUrl;
      });
      canvases.push(drawSourceCoverToBadgeCanvas(img, img.naturalWidth || targetW, img.naturalHeight || targetH, targetW, targetH));
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
        video.onerror = () => reject(new Error("瀏覽器無法解碼此影片檔案"));
      });
      const duration = Math.max(0.2, Math.min(4.0, video.duration || 2.0));
      const count = Math.min(maxFrames, Math.max(2, Math.round(duration * fps)));
      for (let i = 0; i < count; i++) {
        const t = Math.min(duration - 0.02, (i / count) * duration);
        await new Promise((resolve) => {
          video.onseeked = resolve;
          video.currentTime = Math.max(0, t);
        });
        canvases.push(drawSourceCoverToBadgeCanvas(video, video.videoWidth || targetW, video.videoHeight || targetH, targetW, targetH));
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
    const avi = SuperBandClient.buildMjpegAvi(jpegs, targetW, targetH, fps);
    if (avi.length <= maxAviBytes || q === 0.38) return avi;
  }
  throw new Error("動畫編碼後仍超過容量上限");
}

$btnUploadMedia.addEventListener("click", async () => {
  hideNotice();
  if (!client.isConnected) {
    showNotice("warn", "尚未連線至徽章", "請先連線至徽章！");
    return;
  }
  if (!currentMediaFile) {
    showNotice("warn", "尚未選取檔案", "請先選擇 GIF 動態圖、MP4 影片或 AVI 檔案！");
    return;
  }

  try {
    $btnUploadMedia.disabled = true;
    showProgress(true, "正在擷取影格並轉碼為 MJPEG AVI...");
    const targetW = client.screenWidth || cropState.targetW || 240;
    const targetH = client.screenHeight || cropState.targetH || 240;
    const bytes = await encodeMediaFileToMjpegAvi(currentMediaFile, targetW, targetH, 220 * 1024);
    const fileName = $txtMediaName.value.trim() || currentMediaFile.name;
    const typeStr = $selMediaType.value;
    const slot = 0;

    log(`開始上傳 ${typeStr}: ${fileName} (MJPEG AVI ${targetW}x${targetH}, ${bytes.length} 位元組, 固定槽位 Slot ${slot})...`);
    await client.uploadDialImage(bytes, (sent, total, pct) => {
      updateProgress(sent, total, pct, `正在傳輸 ${fileName} (${pct}%)...`);
    }, { slot, isAvi: 1, custom: 0, dialId: client.activeDialId, fontPos: 0 });

    showProgress(false);
    log(`🎉 ${typeStr} 徽章確認寫入成功！`);
    await refreshStorageSpace();
    showNotice("success", "🎉 媒體已成功寫入徽章！", `${typeStr}: ${fileName} 已完成傳輸並更新顯示。`);
  } catch (err) {
    log(`媒體上傳失敗: ${err.message}`);
    showNotice("error", "媒體上傳失敗", err.message);
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
document.querySelectorAll(".tab-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".tab-btn").forEach(b => b.classList.remove("active"));
    document.querySelectorAll(".tab-pane").forEach(p => p.classList.remove("active"));
    btn.classList.add("active");
    const targetId = btn.getAttribute("data-tab");
    $(targetId).classList.add("active");
  });
});

// 初始化畫布
updateCropTargetResolution();
