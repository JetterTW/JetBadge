/**
 * JetBadge Bilingual i18n Module (Traditional Chinese / English)
 * Works in both Browser ES Module and Node.js test environments.
 */

export const LANG_STORAGE_KEY = "jetbadge_lang";

export const STRINGS = {
  zh: {
    pageTitle: "電子徽章 (JetBadge) 管理控制台",
    headerTitle: "⚡ 電子徽章 (JetBadge) 管理控制台",
    headerSubtitle: "直接透過瀏覽器 Web Bluetooth 連線，支援相片裁切、GIF 動畫、MP4 影片上傳與圖像管理",
    statusDisconnected: "未連線",
    statusConnected: "已連線: {name}",
    btnConnect: "搜尋並連接徽章",
    btnDisconnect: "中斷連線",
    cardDeviceTitle: "設備資訊與規格",
    btnFindMe: "🔔 喚醒/尋找",
    btnRefreshInfo: "讀取資訊",
    chkAllDevicesLabel: "搜尋附近全部藍牙設備（若徽章未廣播 Service UUID 請勾選）",
    labelDeviceName: "設備名稱",
    labelResolution: "螢幕規格 / 解析度",
    labelProfile: "通訊 Profile",
    labelVersion: "韌體與協定版本",
    labelRemainingSpace: "徽章剩餘可用空間:",
    btnRefreshSpace: "重新整理",
    tabPhoto: "📸 相片裁切與上傳 (JPG/PNG)",
    tabVideo: "🎬 GIF / MP4 / AVI 動畫與影片",
    btnCloseNoticeTitle: "關閉提示",
    dropTipLine1: "點擊下方按鈕或拖曳圖片 (JPG/PNG) 至此處",
    dropTipLine2: "支援滑鼠滾輪縮放、按住拖曳調整構圖",
    labelZoom: "縮放:",
    btnRotateLeftTitle: "向左旋轉90度",
    btnRotateRightTitle: "向右旋轉90度",
    btnResetCrop: "重設",
    labelSelectPhoto: "選擇或更換圖片檔案",
    btnSelectFile: "📂 瀏覽電腦中的圖片 (JPG/PNG)",
    labelCropShape: "徽章裁切遮罩形狀",
    optCircleMask: "圓形徽章 (圓形電子吧唧，預覽外圍半透明黑遮罩)",
    optSquareMask: "方形徽章 (方形/矩形螢幕)",
    labelTargetRes: "目標輸出寬高 (像素)",
    optRes240x240: "240 x 240 (標準圓形/方形吧唧)",
    optRes360x360: "360 x 360 (高解析圓形吧唧)",
    optRes240x280: "240 x 280 (長方形螢幕)",
    optRes128x128: "128 x 128 (小尺寸點陣)",
    labelFormat: "影像編碼格式",
    optFmtAvi: "MJPEG AVI 封裝 (BG02 /bgp_wa0.avi 原生顯示格式)",
    optFmtJpeg: "Baseline JPEG 靜態圖 (isAvi=0，僅供測試)",
    optFmtRgb565: "RGB565 原生點陣 (isAvi=0，115.2 KB，僅供測試)",
    labelSelectedImageSize: "已選影像大小:",
    labelCropOutputRes: "裁切輸出解析度:",
    labelPhotoName: "上傳相片名稱",
    placeholderPhotoName: "例如：my_badge",
    btnUploadCropped: "🚀 裁切並立即上傳至徽章",
    labelSelectMedia: "選擇 GIF 動態圖、MP4 影片或 AVI 檔案",
    btnSelectMedia: "🎞️ 瀏覽 GIF / MP4 / AVI 檔案",
    labelMediaName: "上傳檔名",
    labelMediaMode: "傳輸模式",
    optModeAnimation: "ANIMATION (適用 GIF 動態圖片)",
    optModeVideo: "VIDEO (適用 MP4 短影片)",
    btnUploadMedia: "🚀 上傳動畫/影片至徽章",
    mediaPreviewEmpty: "尚未選取檔案預覽",
    mediaPreviewAvi: "🎞️ 已選取原生 AVI 動畫檔案：{name}",
    mediaDetailsFmt: "檔案: {name} | 大小: {sizeMb} MB | 類型: {type}",
    cardProgressTitle: "傳輸進度與 BLE 通訊日誌",
    progressReady: "準備傳輸...",
    btnClearLog: "清除記錄",
    versionFormat: "韌體 {fw} / 協定 {proto}",
    sizeChunks: "{kb} ({chunks} 塊)",
    sizeRgb565Note: "{kb} (RGB565 原生未壓縮點陣)",
    sizeEstimateFailed: "估算失敗",

    // Language status logs
    langStatusAuto: "🌐 自動偵測介面語言：繁體中文 (瀏覽器語系: {browserLang})",
    langStatusSaved: "🌐 已載入偏好語言：繁體中文",
    langStatusQuery: "🌐 依網址參數設定語言：繁體中文",
    langSwitched: "🌐 介面語言已切換為：繁體中文",

    // App logs & notices
    logScriptError: "⚠️ 腳本執行錯誤: {msg} ({file}:{line})",
    logUnhandledRejection: "⚠️ 非同步未捕捉錯誤: {reason}",
    logBleDisconnected: "藍牙設備已離線，UI 狀態已重設為未連線",
    logConnectFailed: "連線失敗: {msg}",
    logManualDisconnect: "已手動斷開連線",
    logDisconnectError: "中斷連線異常: {msg}",
    logReadSpaceFailed: "讀取剩餘空間失敗: {msg}",
    logReadInfoFailed: "讀取設備資訊失敗: {msg}",
    logFindMeFailed: "尋找/喚醒徽章失敗: {msg}",
    logLoadingImage: "📸 正在載入圖片檔案: {name} ({sizeKb} KB)...",
    logImageLoaded: "✅ 圖片 {name} 載入成功 ({w} x {h})！可在上方滑鼠拖曳/縮放調整構圖。",
    logImageInitError: "❌ 圖片初始化異常: {msg}",
    logImageParseError: "❌ 圖片解析失敗，請確認檔案格式是否受瀏覽器支援。",
    noticeImageParseTitle: "圖片解析失敗",
    noticeImageParseBody: "請選擇有效的 JPG、PNG 或 WebP 圖檔！",
    logLoadImageFailed: "❌ 載入圖片失敗: {msg}",
    logInvalidDropFile: "⚠️ 拖入的項目非有效檔案。",
    noticeNotConnectedTitle: "尚未連線至徽章",
    noticeNotConnectedBodyPhoto: "請先點擊上方「搜尋並連接徽章」。",
    noticeNoPhotoTitle: "尚未選取相片",
    noticeNoPhotoBody: "請先選擇或拖入一張相片！",
    progressEncodingAvi: "正在處理相片 (MJPEG AVI 轉碼與封裝)...",
    logPrepareAvi: "準備傳輸 MJPEG AVI ({w}x{h}, {bytes} 位元組, 含 4B 標頭共 {totalBytes}B)...",
    progressEncodingJpeg: "正在處理相片 (Baseline JPEG 轉碼)...",
    logPrepareJpeg: "⚠️ 準備傳輸 Baseline JPEG (static isAvi=0, {bytes}B) — 注意 BG02 韌體預設僅對 .avi (isAvi=1) 啟用解碼顯示",
    progressEncodingRgb565: "正在處理相片 (RGB565 原生點陣)...",
    logPrepareRgb565: "⚠️ 準備傳輸 RGB565 原生點陣 ({w}x{h}, {bytes}B, isAvi=0)",
    logPhotoUploadStart: "🚀 開始向徽章發送啟動指令 (固定儲存槽位: Slot {slot} /bgp_wa{slot}{ext}, isAvi={isAvi}, custom=0)...",
    progressUploadingPhoto: "正在傳輸至徽章 (進度: {pct}%)...",
    logPhotoUploadSuccess: "🎉 圖像已成功寫入徽章 Flash (UPLOAD SUCCESS)！",
    noticePhotoSuccessTitle: "🎉 相片已成功寫入徽章！",
    noticePhotoSuccessBody: "徽章螢幕現已退出傳輸狀態並更新顯示！",
    logPhotoUploadFailed: "相片上傳失敗: {msg}",
    noticePhotoFailedTitle: "相片上傳失敗",
    noticeNotConnectedBodyMedia: "請先連線至徽章！",
    noticeNoMediaTitle: "尚未選取檔案",
    noticeNoMediaBody: "請先選擇 GIF 動態圖、MP4 影片或 AVI 檔案！",
    progressTranscodingMedia: "正在擷取影格並轉碼為 MJPEG AVI...",
    logMediaUploadStart: "開始上傳 {type}: {name} (MJPEG AVI {w}x{h}, {bytes} 位元組, 固定槽位 Slot {slot})...",
    progressUploadingMedia: "正在傳輸 {name} ({pct}%)...",
    logMediaUploadSuccess: "🎉 {type} 徽章確認寫入成功！",
    noticeMediaSuccessTitle: "🎉 媒體已成功寫入徽章！",
    noticeMediaSuccessBody: "{type}: {name} 已完成傳輸並更新顯示。",
    logMediaUploadFailed: "媒體上傳失敗: {msg}",
    noticeMediaFailedTitle: "媒體上傳失敗",
    errGifLoadFailed: "無法載入 GIF 檔案",
    errVideoDecodeFailed: "瀏覽器無法解碼此影片檔案",
    errMediaSizeExceeded: "動畫編碼後仍超過容量上限",
    errInvalidAvi: "無效的 AVI 檔案（缺少 RIFF/AVI 標頭或找不到影像軌）",
    errAviCodecUnsupported: "此 AVI 使用 {codec} 編碼且瀏覽器無法解碼；請使用 MJPEG AVI、MP4 或 GIF",
    errAviTooLargeAfterCompress: "AVI 即使最佳化壓縮後仍超過徽章可用空間 ({kb} KB > {budgetKb} KB)",
    mediaAviDetailsFmt: "檔案: {name} | 大小: {sizeKb} KB | {codec} {w}×{h} | {frames} 格 @ {fpsStr}{autoNote}",
    mediaAviFpsSec: "{fps} fps (每格 {sec}s)",
    mediaAviAutoOptimizeNote: " → 上傳將自動調整為 {bw}×{bh} 並壓縮至 {budgetKb} KB 內",
    mediaAviPreviewBadge: "第 {idx}/{total} 格 • {sec}s/格",
    logAviParsed: "🎞️ 解析 AVI 檔案: {w}×{h} {codec}, {frames} 影格 @ {fps} fps, {kb} KB",
    logAviRemuxLossless: "✨ AVI 尺寸與格式已符合徽章規範，已完成無損清理封裝 ({bytes} B)",
    logAviOptimizing: "🔄 正在最佳化 AVI 為徽章相容格式 ({srcW}×{srcH} → {dstW}×{dstH}, {frames} 影格, 上限 {budgetKb} KB)...",
    logAviOptimizedDone: "✅ AVI 最佳化完成: {bytes} B ({kb} KB, q={q})",
    logDropSwitchedToVideoTab: "🎞️ 偵測到動畫/影片檔案，已自動切換至媒體上傳分頁: {name}",

    // BLE Client (baji.js)
    profileBg02: "BG02 / DG01 (SuperBand專屬通訊通道)",
    profileVendor5833: "VENDOR_5833 (SuperBand通用徽章通道)",
    profileJieli01f0: "JIELI_01F0 (Beambox / Niji吧唧通道)",
    profileVendorFee0: "VENDOR_FEE0 (經典LED徽章標準)",
    profileIssc: "ISSC (Microchip串口備選)",
    errWebBleUnsupported: "您的瀏覽器不支援 Web Bluetooth，請使用 Chrome 或 Edge 桌面版。",
    logScanningBle: "開始搜尋藍牙設備... (過濾模式: {mode})",
    scanModeAll: "顯示全部附近設備",
    scanModeService: "僅匹配徽章Service",
    logSelectedDevice: "選中設備: {name} [ID: {id}]",
    unnamedDevice: "(未命名設備)",
    logBleLinkDropped: "藍牙設備已斷開連線！",
    logConnectingGatt: "正在連接 GATT 服務器...",
    logGattConnected: "GATT 服務器連線成功，正在自動配對通訊通道 (優先測試 BG02 專屬 NUS 通道)...",
    logAuxNotifyEnabled: "   └ 輔助 Notify 特徵值已啟用: {uuid}",
    logProfileMatched: "🎯 成功配對通訊通道: {name}",
    logWriteUuid: "   └ 寫入 UUID: {uuid}",
    logNotifyUuid: "   └ 通知 UUID: {uuid}",
    errNoMatchingProfile: "未能找到支援的徽章通訊特徵值，請確認徽章已開機且為相容型號。",
    errDeviceDisconnected: "設備已斷線",
    logFlashAck: "📥 收到徽章 Flash 寫入確認: 第 {seq} 塊 (status={status})",
    logRxPacket: "📥 收到徽章封包: magic=0x{magic} cmd={cmd} sub={sub}{statusStr} (長度: {len}B)",
    errWaitTimeout: "等待徽章回應逾時 ({ms}ms)",
    errNotConnectedConnectFirst: "徽章尚未連線，請先點擊「搜尋並連接徽章」",
    errConnectionInterruptedRestart: "徽章連線已中斷 (設備已重啟或斷線)",
    errConnectionInterrupted: "徽章連線已中斷",
    logReadingDeviceInfo: "正在讀取徽章設備資訊與螢幕尺寸...",
    logBatteryLevel: "🔋 取得徽章電池電量: {pct}%",
    logQueryResolution: "發送螢幕規格查詢 (getDialClockInfo: cmd=32, sub=2)...",
    logResolutionOk: "✨ 成功讀取硬體螢幕解析度: {res}",
    logResolutionHint: "螢幕尺寸查詢提示: {msg} (採用預設 240x240)",
    logQueryDialId: "發送徽章錶盤槽位識別查詢 (CMD=32, SUB=5)...",
    logDialInfo: "🧩 取得徽章主錶盤資訊: 槽位數={count}, DialID=0x{dialId} [{hex}...]",
    logDialHint: "錶盤識別查詢提示: {msg}",
    logSpaceHint: "可用空間查詢提示: {msg}",
    errNotConnected: "尚未連線",
    logQuerySpace: "發送實際剩餘 Flash 空間查詢 (CMD=32, SUB=4)...",
    logFreeSpace: "💾 取得徽章實際剩餘空間: {kb} KB ({bytes} Bytes)",
    errSpacePayloadShort: "徽章回傳之空間數據長度不足",
    errJpegEncodeFailed: "Canvas 無法編碼為 JPEG",
    errJpegMissingSos: "JPEG 缺少 SOS (0xFFDA) 標記",
    errJpegTooLarge: "影像超過上限 {maxBytes}B（目前 {curBytes}B）",
    errAviNoFrames: "MJPEG AVI 至少需要 1 張影格",
    errJpegInvalidSoi: "無效的 JPEG 檔案：缺少 SOI (0xFFD8) 標頭",
    errJpegEoiBeforeSos: "無效的 JPEG：尚未進入掃描數據即遇到 EOI",
    errJpegTruncated: "JPEG 區段長度截斷",
    errJpegSegLen: "JPEG 區段 0xFF{marker} 長度異常",
    errJpegDriLen: "JPEG DRI 區段超過 512 位元組上限",
    errJpegSosFmt: "JPEG SOS 標頭不符韌體規範 (需 3 通道且 <= 512B)",
    errJpegMissingSof0: "JPEG 缺少 SOF0 (Baseline DCT) 區段",
    errJpegNonBaseline: "韌體不支援非 Baseline JPEG 編碼 (0xFF{marker})",
    errJpegMissingSosOrEoi: "JPEG 缺少 SOS 掃描區段或 EOI 結尾",
    errJpegSof0Len: "JPEG SOF0 區段長度不符韌體規範",
    errJpegUnsupportedFmt: "韌體僅支援 8-bit 3 通道 JPEG (目前 {precision}-bit, {numComp} 通道)",
    errJpegResLimit: "JPEG 解析度 {w}x{h} 超出韌體上限 (359x359)",
    errJpegSubsampling: "不支援的色度抽樣格式 (0x{y}/0x{cb}/0x{cr})",
    errJpegDqtIndex: "JPEG 量化表索引超過韌體支援上限 (0..1)",
    errJpegDqtLen: "JPEG DQT 量化表區段超過 512B 或長度不足",
    errJpegDqtStruct: "JPEG DQT 區段結構不完整",
    errJpegDqtPrecision: "韌體僅支援 8-bit JPEG 量化表精度",
    errJpegDqtId: "韌體僅支援 JPEG 量化表 ID 0 與 1",
    errJpegDhtLen: "JPEG DHT 霍夫曼表區段超過 512B 或長度不足",
    errJpegDhtStruct: "JPEG DHT 區段結構不完整",
    errJpegDhtId: "韌體不支援的 JPEG 霍夫曼表類別/索引 0x{tcTh}",
    errJpegOverflow: "JPEG DHT 符號表長度溢位",
    errJpegMissingEoi: "JPEG 缺少結尾 EOI (0xFFD9)",
    logFindMeCmd: "🔔 發送尋找/喚醒徽章指令 (CMD_SETTINGS 18, SUB_FIND_ME 11)...",
    logFindMeAck: "✨ 喚醒/亮屏指令已送達！",
    logPrepareImageTransfer: "開始準備傳輸圖像 (檔案大小: {totalBytes} 位元組, 目標槽位: /bgp_wa{slot}{ext}, isAvi={isAvi}, custom={custom})...",
    fatalStatus1: "徽章數據校驗失敗 (status=1, ERROR_CHECK - 請檢查檔案格式)",
    fatalStatus3: "徽章電量過低 (<30%) 拒絕傳輸 (status=3, ERROR_BATTERY_LOW)",
    fatalStatus4: "徽章處於充電保護狀態 (status=4, ERROR_CHARGE_BATTERY)，請先拔除充電線後再上傳",
    fatalStatus5: "徽章剩餘 Flash 儲存空間不足 (status=5, ERROR_OUT_OF_MEMORY)",
    fatalStatus7: "徽章內部狀態忙碌或未就緒 (status=7, ERROR_STATE)",
    fatalStatusDefault: "徽章回報異常狀態碼 (status={code})",
    logStartHandshake: "📤 1/3 發送單圖推送啟動握手 (CMD=31 SUB=2, dialId=0x{dialId}, isAvi={isAvi}, bitmask=0x{bitmask}, size={size}B)...",
    errReconnectRequired: "徽章連線已中斷，請重新連接後再試",
    logStartSuccess: "🎯 啟動握手成功 (status={status})！徽章螢幕已切換至「手機 ⇄ 徽章」藍色進度條傳輸畫面！",
    logStartRetry: "⚠️ 未收到徽章業務啟動確認 (status=1000)，正在重試啟動握手 (第 {next}/2 次)...",
    errNoStartAck: "徽章未回應啟動確認 (status=1000，dialId=0x{dialId})，已中止傳輸以免空白發包",
    logStartStreaming: "📤 2/3 開始串流檔案分塊 (共 {totalChunks} 塊，每塊 {chunkSize}B，採用徽章 Flash ACK 流控)...",
    errTransferDisconnected: "徽章於傳輸中途斷開連線 (設備可能已重啟或關機)",
    logChunkRetry: "⚠️ 第 {seq}/{totalChunks} 塊未及時收到 Flash 確認 (目前已確認至第 {confirmed} 塊)，正在重發 (第 {retry}/2 次)...",
    errChunkTimeout: "分塊 {seq}/{totalChunks} 傳輸逾時，徽章未回傳 Flash 寫入確認 (已確認至 {confirmed})",
    logStreamingDone: "⚡ 數據分塊已全數送達並獲徽章 Flash 確認 ({confirmed}/{totalChunks} 塊)！耗時 {sec} 秒 (平均 {kbps} KB/s)",
    errPreFinishDisconnected: "徽章於傳輸完成前斷開連線",
    logFinishCmd: "📤 3/3 發送完成提交指令 (CMD=31 SUB=3, 檔案大小={totalBytes}B, 總校驗和=0x{sum})...",
    logFinishFailed: "❌ Flash 寫入提交失敗: {msg}",
    logUploadComplete: "🎉 徽章回報業務寫入完成 (status={status})！已成功保存至槽位 /bgp_wa{slot}{ext}！",
  },

  en: {
    pageTitle: "JetBadge Web E-Badge Console",
    headerTitle: "⚡ JetBadge Web E-Badge Console",
    headerSubtitle: "Connect directly via browser Web Bluetooth to crop photos, transcode GIF/MP4 animations, and upload wirelessly.",
    statusDisconnected: "Disconnected",
    statusConnected: "Connected: {name}",
    btnConnect: "Search & Connect Badge",
    btnDisconnect: "Disconnect",
    cardDeviceTitle: "Device Info & Specifications",
    btnFindMe: "🔔 Wake / Find",
    btnRefreshInfo: "Read Info",
    chkAllDevicesLabel: "Scan all nearby Bluetooth devices (check if the badge does not advertise its Service UUID)",
    labelDeviceName: "Device Name",
    labelResolution: "Screen / Resolution",
    labelProfile: "BLE Profile",
    labelVersion: "Firmware & Protocol",
    labelRemainingSpace: "Device remaining space:",
    btnRefreshSpace: "REFRESH",
    tabPhoto: "📸 Photo Crop & Upload (JPG/PNG)",
    tabVideo: "🎬 GIF / MP4 / AVI Animation & Video",
    btnCloseNoticeTitle: "Close notice",
    dropTipLine1: "Click the button below or drag & drop an image (JPG/PNG) here",
    dropTipLine2: "Mouse wheel to zoom, click & drag to pan composition",
    labelZoom: "Zoom:",
    btnRotateLeftTitle: "Rotate 90° left",
    btnRotateRightTitle: "Rotate 90° right",
    btnResetCrop: "Reset",
    labelSelectPhoto: "Select or Replace Image File",
    btnSelectFile: "📂 Browse Image from Computer (JPG/PNG)",
    labelCropShape: "Badge Crop Mask Shape",
    optCircleMask: "Circle Badge (round badge preview with translucent mask)",
    optSquareMask: "Square / Rectangular Badge",
    labelTargetRes: "Output Dimensions (px)",
    optRes240x240: "240 x 240 (Standard Round/Square)",
    optRes360x360: "360 x 360 (High-Res Round)",
    optRes240x280: "240 x 280 (Rectangular Screen)",
    optRes128x128: "128 x 128 (Compact Matrix)",
    labelFormat: "Encoding Format",
    optFmtAvi: "MJPEG AVI Container (BG02 /bgp_wa0.avi native format)",
    optFmtJpeg: "Baseline JPEG Static Image (isAvi=0, test only)",
    optFmtRgb565: "RGB565 Raw Bitmap (isAvi=0, 115.2 KB, test only)",
    labelSelectedImageSize: "Selected image size:",
    labelCropOutputRes: "Output resolution:",
    labelPhotoName: "Photo Name",
    placeholderPhotoName: "e.g., my_badge",
    btnUploadCropped: "🚀 Crop & Upload to Badge",
    labelSelectMedia: "Select GIF Animation, MP4 Video, or AVI File",
    btnSelectMedia: "🎞️ Browse GIF / MP4 / AVI File",
    labelMediaName: "Upload Name",
    labelMediaMode: "Transfer Mode",
    optModeAnimation: "ANIMATION (for GIF animations)",
    optModeVideo: "VIDEO (for MP4 short clips)",
    btnUploadMedia: "🚀 Upload Animation / Video",
    mediaPreviewEmpty: "No file selected for preview",
    mediaPreviewAvi: "🎞️ Native AVI animation selected: {name}",
    mediaDetailsFmt: "File: {name} | Size: {sizeMb} MB | Type: {type}",
    cardProgressTitle: "Transfer Progress & BLE Communication Log",
    progressReady: "Preparing transfer...",
    btnClearLog: "Clear Log",
    versionFormat: "FW {fw} / Protocol {proto}",
    sizeChunks: "{kb} (~{chunks} chunks)",
    sizeRgb565Note: "{kb} (RGB565 raw uncompressed)",
    sizeEstimateFailed: "Estimate failed",

    // Language status logs
    langStatusAuto: "🌐 Auto-detected language: English (browser locale: {browserLang})",
    langStatusSaved: "🌐 Loaded saved language: English",
    langStatusQuery: "🌐 Language set via URL parameter: English",
    langSwitched: "🌐 Interface language switched to: English",

    // App logs & notices
    logScriptError: "⚠️ Script error: {msg} ({file}:{line})",
    logUnhandledRejection: "⚠️ Unhandled async rejection: {reason}",
    logBleDisconnected: "Bluetooth device disconnected; UI reset to disconnected.",
    logConnectFailed: "Connection failed: {msg}",
    logManualDisconnect: "Manually disconnected.",
    logDisconnectError: "Disconnect error: {msg}",
    logReadSpaceFailed: "Failed to read free space: {msg}",
    logReadInfoFailed: "Failed to read device info: {msg}",
    logFindMeFailed: "Wake/Find command failed: {msg}",
    logLoadingImage: "📸 Loading image: {name} ({sizeKb} KB)...",
    logImageLoaded: "✅ Loaded {name} ({w} x {h}). Drag or scroll above to adjust framing.",
    logImageInitError: "❌ Image initialization error: {msg}",
    logImageParseError: "❌ Failed to decode image. Please ensure the format is browser-supported.",
    noticeImageParseTitle: "Image Parse Failed",
    noticeImageParseBody: "Please select a valid JPG, PNG, or WebP image file.",
    logLoadImageFailed: "❌ Failed to load image: {msg}",
    logInvalidDropFile: "⚠️ Dropped item is not a valid file.",
    noticeNotConnectedTitle: "Badge Not Connected",
    noticeNotConnectedBodyPhoto: 'Please click "Search & Connect Badge" at the top first.',
    noticeNoPhotoTitle: "No Photo Selected",
    noticeNoPhotoBody: "Please select or drop a photo first.",
    progressEncodingAvi: "Processing photo (MJPEG AVI encoding)...",
    logPrepareAvi: "Preparing MJPEG AVI ({w}x{h}, {bytes} bytes, {totalBytes}B with 4B header)...",
    progressEncodingJpeg: "Processing photo (Baseline JPEG encoding)...",
    logPrepareJpeg: "⚠️ Preparing Baseline JPEG (static isAvi=0, {bytes}B) — note BG02 firmware defaults to .avi (isAvi=1) for display",
    progressEncodingRgb565: "Processing photo (RGB565 bitmap)...",
    logPrepareRgb565: "⚠️ Preparing RGB565 raw bitmap ({w}x{h}, {bytes}B, isAvi=0)",
    logPhotoUploadStart: "🚀 Sending start handshake to badge (fixed Slot {slot} /bgp_wa{slot}{ext}, isAvi={isAvi}, custom=0)...",
    progressUploadingPhoto: "Uploading to badge ({pct}%)...",
    logPhotoUploadSuccess: "🎉 Image written to badge Flash (UPLOAD SUCCESS)!",
    noticePhotoSuccessTitle: "🎉 Photo Written to Badge!",
    noticePhotoSuccessBody: "The badge has exited transfer mode and updated its display.",
    logPhotoUploadFailed: "Photo upload failed: {msg}",
    noticePhotoFailedTitle: "Photo Upload Failed",
    noticeNotConnectedBodyMedia: "Please connect to your badge first.",
    noticeNoMediaTitle: "No Media Selected",
    noticeNoMediaBody: "Please select a GIF animation, MP4 video, or AVI file first.",
    progressTranscodingMedia: "Extracting frames and transcoding to MJPEG AVI...",
    logMediaUploadStart: "Starting {type} upload: {name} (MJPEG AVI {w}x{h}, {bytes} bytes, fixed Slot {slot})...",
    progressUploadingMedia: "Uploading {name} ({pct}%)...",
    logMediaUploadSuccess: "🎉 {type} write confirmed by badge!",
    noticeMediaSuccessTitle: "🎉 Media Written to Badge!",
    noticeMediaSuccessBody: "{type}: {name} uploaded and display updated.",
    logMediaUploadFailed: "Media upload failed: {msg}",
    noticeMediaFailedTitle: "Media Upload Failed",
    errGifLoadFailed: "Unable to load GIF file",
    errVideoDecodeFailed: "Browser could not decode this video file",
    errMediaSizeExceeded: "Encoded animation still exceeds capacity limit",
    errInvalidAvi: "Invalid AVI file (missing RIFF/AVI header or video frames)",
    errAviCodecUnsupported: "Unsupported AVI codec ({codec}); please use MJPEG AVI, MP4, or GIF",
    errAviTooLargeAfterCompress: "AVI still exceeds badge free space after optimization ({kb} KB > {budgetKb} KB)",
    mediaAviDetailsFmt: "File: {name} | Size: {sizeKb} KB | {codec} {w}×{h} | {frames} frames @ {fpsStr}{autoNote}",
    mediaAviFpsSec: "{fps} fps ({sec}s/frame)",
    mediaAviAutoOptimizeNote: " → Auto-fits to {bw}×{bh} within {budgetKb} KB on upload",
    mediaAviPreviewBadge: "Frame {idx}/{total} • {sec}s/frame",
    logAviParsed: "🎞️ Parsed AVI: {w}×{h} {codec}, {frames} frames @ {fps} fps, {kb} KB",
    logAviRemuxLossless: "✨ AVI matches badge specs; losslessly remuxed clean RIFF ({bytes} B)",
    logAviOptimizing: "🔄 Optimizing AVI for badge ({srcW}×{srcH} → {dstW}×{dstH}, {frames} frames, max {budgetKb} KB)...",
    logAviOptimizedDone: "✅ AVI optimization complete: {bytes} B ({kb} KB, q={q})",
    logDropSwitchedToVideoTab: "🎞️ Animation/video file detected; switched to Media Upload tab: {name}",

    // BLE Client (baji.js)
    profileBg02: "BG02 / DG01 (SuperBand Exclusive Channel)",
    profileVendor5833: "VENDOR_5833 (SuperBand Generic Badge)",
    profileJieli01f0: "JIELI_01F0 (Beambox / Niji Channel)",
    profileVendorFee0: "VENDOR_FEE0 (Classic LED Badge)",
    profileIssc: "ISSC (Microchip UART Fallback)",
    errWebBleUnsupported: "Your browser does not support Web Bluetooth. Please use desktop Chrome or Edge.",
    logScanningBle: "Scanning for Bluetooth devices... (Filter: {mode})",
    scanModeAll: "Show all nearby devices",
    scanModeService: "Badge service UUIDs only",
    logSelectedDevice: "Selected device: {name} [ID: {id}]",
    unnamedDevice: "(Unnamed device)",
    logBleLinkDropped: "Bluetooth device disconnected!",
    logConnectingGatt: "Connecting to GATT server...",
    logGattConnected: "GATT server connected. Auto-matching profile (trying BG02 NUS first)...",
    logAuxNotifyEnabled: "   └ Aux Notify characteristic enabled: {uuid}",
    logProfileMatched: "🎯 Matched BLE profile: {name}",
    logWriteUuid: "   └ Write UUID: {uuid}",
    logNotifyUuid: "   └ Notify UUID: {uuid}",
    errNoMatchingProfile: "No compatible badge GATT characteristics found. Ensure the badge is powered on and supported.",
    errDeviceDisconnected: "Device disconnected",
    logFlashAck: "📥 Badge Flash ACK: chunk #{seq} (status={status})",
    logRxPacket: "📥 Badge packet: magic=0x{magic} cmd={cmd} sub={sub}{statusStr} ({len}B)",
    errWaitTimeout: "Timed out waiting for badge response ({ms}ms)",
    errNotConnectedConnectFirst: 'Badge is not connected. Click "Search & Connect Badge" first.',
    errConnectionInterruptedRestart: "Badge connection lost (device may have rebooted or disconnected)",
    errConnectionInterrupted: "Badge connection lost",
    logReadingDeviceInfo: "Reading badge device info and screen dimensions...",
    logBatteryLevel: "🔋 Badge battery level: {pct}%",
    logQueryResolution: "Querying screen specs (getDialClockInfo: cmd=32, sub=2)...",
    logResolutionOk: "✨ Hardware screen resolution: {res}",
    logResolutionHint: "Screen query note: {msg} (using default 240x240)",
    logQueryDialId: "Querying badge dial slot ID (CMD=32, SUB=5)...",
    logDialInfo: "🧩 Primary dial info: count={count}, DialID=0x{dialId} [{hex}...]",
    logDialHint: "Dial query note: {msg}",
    logSpaceHint: "Free space query note: {msg}",
    errNotConnected: "Not connected",
    logQuerySpace: "Querying actual Flash remaining space (CMD=32, SUB=4)...",
    logFreeSpace: "💾 Actual Flash remaining space: {kb} KB ({bytes} Bytes)",
    errSpacePayloadShort: "Badge returned truncated space payload",
    errJpegEncodeFailed: "Canvas could not encode JPEG",
    errJpegMissingSos: "JPEG is missing SOS (0xFFDA) marker",
    errJpegTooLarge: "Image exceeds {maxBytes}B limit ({curBytes}B)",
    errAviNoFrames: "MJPEG AVI requires at least 1 frame",
    errJpegInvalidSoi: "Invalid JPEG: missing SOI (0xFFD8) header",
    errJpegEoiBeforeSos: "Invalid JPEG: encountered EOI before SOS scan data",
    errJpegTruncated: "JPEG segment length truncated",
    errJpegSegLen: "Invalid JPEG segment length for marker 0xFF{marker}",
    errJpegDriLen: "JPEG DRI segment exceeds 512-byte limit",
    errJpegSosFmt: "JPEG SOS header incompatible with firmware (requires 3 components, <= 512B)",
    errJpegMissingSof0: "JPEG missing SOF0 (Baseline DCT) segment",
    errJpegNonBaseline: "Firmware does not support non-Baseline JPEG encoding (0xFF{marker})",
    errJpegMissingSosOrEoi: "JPEG missing SOS scan segment or EOI tail",
    errJpegSof0Len: "JPEG SOF0 segment length incompatible with firmware",
    errJpegUnsupportedFmt: "Firmware only supports 8-bit 3-channel JPEG (got {precision}-bit, {numComp} channels)",
    errJpegResLimit: "JPEG dimensions {w}x{h} exceed firmware limit (359x359)",
    errJpegSubsampling: "Unsupported chroma subsampling (0x{y}/0x{cb}/0x{cr})",
    errJpegDqtIndex: "JPEG quantization table index exceeds firmware limit (0..1)",
    errJpegDqtLen: "JPEG DQT segment exceeds 512B or is truncated",
    errJpegDqtStruct: "JPEG DQT segment structure incomplete",
    errJpegDqtPrecision: "Firmware only supports 8-bit JPEG quantization precision",
    errJpegDqtId: "Firmware only supports JPEG quantization table ID 0 and 1",
    errJpegDhtLen: "JPEG DHT segment exceeds 512B or is truncated",
    errJpegDhtStruct: "JPEG DHT segment structure incomplete",
    errJpegDhtId: "Unsupported JPEG Huffman table class/ID 0x{tcTh}",
    errJpegOverflow: "JPEG DHT symbol table length overflow",
    errJpegMissingEoi: "JPEG missing trailing EOI (0xFFD9)",
    logFindMeCmd: "🔔 Sending wake/find badge command (CMD_SETTINGS 18, SUB_FIND_ME 11)...",
    logFindMeAck: "✨ Wake/screen-on command delivered!",
    logPrepareImageTransfer: "Preparing image transfer (size: {totalBytes} bytes, slot: /bgp_wa{slot}{ext}, isAvi={isAvi}, custom={custom})...",
    fatalStatus1: "Badge data checksum verification failed (status=1, ERROR_CHECK - check file format)",
    fatalStatus3: "Badge battery too low (<30%) for transfer (status=3, ERROR_BATTERY_LOW)",
    fatalStatus4: "Badge is in charging protection mode (status=4, ERROR_CHARGE_BATTERY). Please unplug the charging cable before uploading.",
    fatalStatus5: "Insufficient remaining Flash space on badge (status=5, ERROR_OUT_OF_MEMORY)",
    fatalStatus7: "Badge is busy or not ready (status=7, ERROR_STATE)",
    fatalStatusDefault: "Badge returned error status (status={code})",
    logStartHandshake: "📤 1/3 Sending start handshake (CMD=31 SUB=2, dialId=0x{dialId}, isAvi={isAvi}, bitmask=0x{bitmask}, size={size}B)...",
    errReconnectRequired: "Badge connection lost. Please reconnect and try again.",
    logStartSuccess: "🎯 Start handshake succeeded (status={status})! Badge switched to transfer screen.",
    logStartRetry: "⚠️ Start confirmation (status=1000) not received; retrying handshake (attempt {next}/2)...",
    errNoStartAck: "Badge did not confirm transfer start (status=1000, dialId=0x{dialId}); aborted to avoid blank writes.",
    logStartStreaming: "📤 2/3 Streaming chunks ({totalChunks} chunks, {chunkSize}B each, badge Flash ACK flow control)...",
    errTransferDisconnected: "Badge disconnected mid-transfer (device may have rebooted or powered off)",
    logChunkRetry: "⚠️ Chunk {seq}/{totalChunks} ACK delayed (confirmed up to {confirmed}); resending (retry {retry}/2)...",
    errChunkTimeout: "Chunk {seq}/{totalChunks} timed out waiting for Flash ACK (confirmed up to {confirmed})",
    logStreamingDone: "⚡ All chunks delivered and Flash-verified ({confirmed}/{totalChunks}) in {sec}s ({kbps} KB/s)",
    errPreFinishDisconnected: "Badge disconnected before transfer commit",
    logFinishCmd: "📤 3/3 Sending finish commit command (CMD=31 SUB=3, size={totalBytes}B, checksum=0x{sum})...",
    logFinishFailed: "❌ Flash commit failed: {msg}",
    logUploadComplete: "🎉 Badge confirmed write success (status={status}) at /bgp_wa{slot}{ext}!",
  },
};

const langState = (globalThis.__JETBADGE_I18N__ ||= {
  currentLang: "zh",
  currentLangSource: "auto",
  currentBrowserLocale: "",
});

function normalizeLangTag(tag) {
  if (!tag || typeof tag !== "string") return null;
  const lower = tag.trim().toLowerCase();
  if (!lower) return null;
  return lower.startsWith("zh") ? "zh" : "en";
}

export function detectInitialLanguage(options = {}) {
  const search = options.search !== undefined
    ? options.search
    : (typeof window !== "undefined" && window.location ? window.location.search : "");

  if (search) {
    try {
      const sp = new URLSearchParams(search);
      const q = sp.get("lang");
      if (q === "zh" || q === "en") {
        return { lang: q, source: "query", browserLocale: "" };
      }
    } catch (_) {}
  }

  let saved = options.savedLang;
  if (saved === undefined && typeof localStorage !== "undefined") {
    try {
      saved = localStorage.getItem(LANG_STORAGE_KEY);
    } catch (_) {
      saved = null;
    }
  }
  if (saved === "zh" || saved === "en") {
    return { lang: saved, source: "saved", browserLocale: "" };
  }

  let navList = options.navigatorLanguages;
  if (navList === undefined && typeof navigator !== "undefined") {
    navList = Array.isArray(navigator.languages) && navigator.languages.length > 0
      ? navigator.languages
      : (navigator.language ? [navigator.language] : []);
  }
  const primary = Array.isArray(navList) && navList.length > 0 ? String(navList[0]) : "";
  const detected = normalizeLangTag(primary) || "en";
  return { lang: detected, source: "auto", browserLocale: primary || "unknown" };
}

export function initLanguage(options = {}) {
  const info = detectInitialLanguage(options);
  langState.currentLang = info.lang;
  langState.currentLangSource = info.source;
  langState.currentBrowserLocale = info.browserLocale;
  return info;
}

export function getCurrentLang() {
  return langState.currentLang;
}

export function getLanguageStatus() {
  return {
    lang: langState.currentLang,
    source: langState.currentLangSource,
    browserLocale: langState.currentBrowserLocale,
  };
}

export function setLanguage(lang, persist = true) {
  langState.currentLang = lang === "en" ? "en" : "zh";
  langState.currentLangSource = "manual";
  if (persist && typeof localStorage !== "undefined") {
    try {
      localStorage.setItem(LANG_STORAGE_KEY, langState.currentLang);
    } catch (_) {}
  }
  return langState.currentLang;
}

export function t(key, params = {}, lang = langState.currentLang) {
  const dict = STRINGS[lang] || STRINGS.zh;
  let str = dict[key] !== undefined ? dict[key] : (STRINGS.zh[key] !== undefined ? STRINGS.zh[key] : key);
  if (params && typeof params === "object") {
    for (const [k, v] of Object.entries(params)) {
      str = str.split(`{${k}}`).join(String(v));
    }
  }
  return str;
}
