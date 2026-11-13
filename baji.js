/**
 * SuperBand & BG02 / DG01 + ZRun / E05 / E87 Smart E-Badge BLE Protocol Client (v40)
 * Verified against:
 * - BG02 / oem_DG01 (SuperBand NUS 7E400001-B5A3-F393-E0A9-E50E24DCCA9D)
 * - E05 / E87 (ZRun / JieLi RCSP AE00 + C2E6FD00-E966-1000-8000-BEF9C223DF6A)
 */
import { t } from "./i18n.js?v=43";
import { ZRUN_E05_SERVICES, ZrunE05Session, buildZrunMjpgAvi } from "./zrun_e05.js?v=43";

export const BleProfiles = [
  {
    id: "BG02_NUS",
    nameKey: "profileBg02",
    name: "BG02 / DG01 (SuperBand專屬通訊通道)",
    serviceUuid: "7e400001-b5a3-f393-e0a9-e50e24dcca9d",
    writeUuid:   "7e400002-b5a3-f393-e0a9-e50e24dcca9d",
    notifyUuid:  "7e400003-b5a3-f393-e0a9-e50e24dcca9d",
    auxNotifyUuid: "7e400004-b5a3-f393-e0a9-e50e24dcca9d",
  },
  {
    id: "VENDOR_5833",
    nameKey: "profileVendor5833",
    name: "VENDOR_5833 (SuperBand通用徽章通道)",
    serviceUuid: "5833ff01-9b8b-5191-6142-22a4536ef123",
    writeUuid:   "5833ff02-9b8b-5191-6142-22a4536ef123",
    notifyUuid:  "5833ff03-9b8b-5191-6142-22a4536ef123",
  },
  {
    id: "JIELI_01F0",
    nameKey: "profileJieli01f0",
    name: "JIELI_01F0 (Beambox / Niji吧唧通道)",
    serviceUuid: "000001f0-0000-1000-8000-00805f9b34fb",
    writeUuid:   "000001f1-0000-1000-8000-00805f9b34fb",
    notifyUuid:  "000001f2-0000-1000-8000-00805f9b34fb",
  },
  {
    id: "VENDOR_FEE0",
    nameKey: "profileVendorFee0",
    name: "VENDOR_FEE0 (經典LED徽章標準)",
    serviceUuid: "0000fee0-0000-1000-8000-00805f9b34fb",
    writeUuid:   "0000fee1-0000-1000-8000-00805f9b34fb",
    notifyUuid:  "0000fee2-0000-1000-8000-00805f9b34fb",
  },
  {
    id: "ISSC",
    nameKey: "profileIssc",
    name: "ISSC (Microchip串口備選)",
    serviceUuid: "49535343-fe7d-4ae5-8fa9-9fafd205e455",
    writeUuid:   "49535343-8841-43f4-a8d4-ecbe34729bb3",
    notifyUuid:  "49535343-1e4d-4bd9-ba61-23c647249616",
  }
];

// 標準 SIG 服務
export const DIS_SERVICE_UUID = "0000180a-0000-1000-8000-00805f9b34fb";
export const BAS_SERVICE_UUID = "0000180f-0000-1000-8000-00805f9b34fb";

export class SuperBandClient {
  constructor(logger = console.log) {
    this.logger = logger;
    this.device = null;
    this.server = null;
    this.writeChar = null;
    this.notifyChar = null;
    this.activeProfile = null;
    this.protocolKind = "superband";
    this.zrunSession = null;
    this.rxBuffer = new Uint8Array(0);
    this.waiters = [];
    this.screenWidth = 240;
    this.screenHeight = 240;
    this.activeDialId = 0x000015A2;
    this.quietRxLog = false;
  }

  log(msg) {
    if (this.logger) this.logger(msg);
  }

  get isConnected() {
    if (this.protocolKind === "zrun_e05") {
      return !!(this.server && this.server.connected && this.zrunSession && this.zrunSession.isAttached);
    }
    return !!(this.server && this.server.connected && this.writeChar);
  }

  async connect(acceptAllDevices = true, namePrefix = null) {
    if (!navigator.bluetooth) {
      throw new Error(t("errWebBleUnsupported"));
    }

    const superbandServices = BleProfiles.map(p => p.serviceUuid);
    const allServices = Array.from(new Set([
      ...superbandServices,
      ...ZRUN_E05_SERVICES.DISCOVERY_SERVICE_UUIDS,
      DIS_SERVICE_UUID,
      BAS_SERVICE_UUID,
    ]));

    const options = {
      optionalServices: allServices,
    };

    if (acceptAllDevices && !namePrefix) {
      options.acceptAllDevices = true;
    } else if (namePrefix) {
      options.filters = [{ namePrefix }];
    } else {
      options.filters = [
        ...superbandServices.map(s => ({ services: [s] })),
        { services: [ZRUN_E05_SERVICES.AE_SERVICE_UUID] },
        { services: [ZRUN_E05_SERVICES.FD_SERVICE_UUID] },
        { namePrefix: "E05" },
        { namePrefix: "E87" },
        { namePrefix: "L8" },
      ];
    }

    const modeStr = acceptAllDevices ? t("scanModeAll") : t("scanModeService");
    this.log(t("logScanningBle", { mode: modeStr }));
    this.device = await navigator.bluetooth.requestDevice(options);
    this.log(t("logSelectedDevice", { name: this.device.name || t("unnamedDevice"), id: this.device.id }));

    if (!this._boundDisconnectHandler) {
      this._boundDisconnectHandler = () => {
        this.log(t("logBleLinkDropped"));
        this.cleanup();
        if (this.onDisconnected) {
          try { this.onDisconnected(); } catch (e) {}
        }
      };
      this.device.addEventListener("gattserverdisconnected", this._boundDisconnectHandler);
    }

    let matched = false;
    let lastError = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        this.log(t("logConnectingGatt"));
        this.server = await this.device.gatt.connect();
        this.log(t("logGattConnected"));

        let discoveredServices = [];
        if (typeof this.server.getPrimaryServices === "function") {
          try {
            discoveredServices = await this.server.getPrimaryServices();
          } catch (_) {}
        }

        const zrunSession = new ZrunE05Session((m) => this.log(m));
        const isZrun = await zrunSession.tryAttach(this.device, this.server, discoveredServices);
        if (isZrun) {
          this.protocolKind = "zrun_e05";
          this.zrunSession = zrunSession;
          this.screenWidth = zrunSession.screenWidth || 360;
          this.screenHeight = zrunSession.screenHeight || 360;
          this.activeProfile = {
            id: "ZRUN_E05",
            nameKey: "profileZrunE05",
            name: "ZRun / E05 / E87 (JieLi RCSP + AE00)",
          };
          matched = true;
          break;
        }

        for (const profile of BleProfiles) {
          try {
            const service = await this.server.getPrimaryService(profile.serviceUuid);
            let charA = null;
            let charB = null;
            try { charA = await service.getCharacteristic(profile.writeUuid); } catch (e) {}
            try { charB = await service.getCharacteristic(profile.notifyUuid); } catch (e) {}

            let write = null;
            let notify = null;

            if (charA && (charA.properties.write || charA.properties.writeWithoutResponse)) write = charA;
            if (charB && (charB.properties.notify || charB.properties.indicate)) notify = charB;

            if (!write && charB && (charB.properties.write || charB.properties.writeWithoutResponse)) write = charB;
            if (!notify && charA && (charA.properties.notify || charA.properties.indicate)) notify = charA;

            if (write && !notify && (write.properties.notify || write.properties.indicate)) notify = write;

            if (write && notify) {
              this.protocolKind = "superband";
              this.zrunSession = null;
              this.writeChar = write;
              this.notifyChar = notify;
              this.activeProfile = profile;

              await this.notifyChar.startNotifications();
              this.notifyChar.addEventListener("characteristicvaluechanged", (event) => {
                const dv = event.target.value;
                const bytes = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
                this.handleIncomingBytes(bytes);
              });

              if (profile.auxNotifyUuid) {
                try {
                  const aux = await service.getCharacteristic(profile.auxNotifyUuid);
                  if (aux && (aux.properties.notify || aux.properties.indicate)) {
                    await aux.startNotifications();
                    aux.addEventListener("characteristicvaluechanged", (event) => {
                      const dv = event.target.value;
                      const bytes = new Uint8Array(dv.buffer, dv.byteOffset, dv.byteLength);
                      this.handleIncomingBytes(bytes);
                    });
                    this.log(t("logAuxNotifyEnabled", { uuid: profile.auxNotifyUuid }));
                  }
                } catch (e) {}
              }

              const profileLabel = profile.nameKey ? t(profile.nameKey) : profile.name;
              this.log(t("logProfileMatched", { name: profileLabel }));
              this.log(t("logSuperbandAutoDetected", { profile: profileLabel }));
              this.log(t("logWriteUuid", { uuid: write.uuid }));
              this.log(t("logNotifyUuid", { uuid: notify.uuid }));
              matched = true;
              break;
            }
          } catch (err) {
            // 嘗試下一個 profile
          }
        }
        if (matched) break;
        break; // Services read cleanly without matching either protocol; no retry needed
      } catch (err) {
        lastError = err;
        if (attempt < maxAttempts && (!this.server || !this.server.connected)) {
          await new Promise(r => setTimeout(r, 400 * attempt));
          continue;
        }
        throw err;
      }
    }

    if (!matched) {
      this.cleanup();
      throw lastError || new Error(t("errNoMatchingProfile"));
    }

    return {
      deviceName: this.device.name || (this.protocolKind === "zrun_e05" ? "E05 Badge" : "SuperBand Badge"),
      profileName: this.activeProfile.nameKey ? t(this.activeProfile.nameKey) : this.activeProfile.name,
      profileKey: this.activeProfile.nameKey || null,
      protocolKind: this.protocolKind,
    };
  }

  cleanup() {
    if (this.zrunSession) {
      try { this.zrunSession.cleanup(); } catch (_) {}
      this.zrunSession = null;
    }
    this.protocolKind = "superband";
    this.server = null;
    this.writeChar = null;
    this.notifyChar = null;
    this.activeProfile = null;
    this.rxBuffer = new Uint8Array(0);
    for (const waiter of this.waiters) {
      waiter.reject(new Error(t("errDeviceDisconnected")));
    }
    this.waiters = [];
  }

  async disconnect() {
    if (this.zrunSession) {
      try { await this.zrunSession.disconnect(); } catch (e) {}
    }
    if (this.notifyChar) {
      try { await this.notifyChar.stopNotifications(); } catch (e) {}
    }
    if (this.device && this.device.gatt.connected) {
      this.device.gatt.disconnect();
    }
    this.cleanup();
  }

  // --- 封包接收與分發 (支援 CD 資料幀與 DC ACK 幀) ---
  handleIncomingBytes(newBytes) {
    const combined = new Uint8Array(this.rxBuffer.length + newBytes.length);
    combined.set(this.rxBuffer, 0);
    combined.set(newBytes, this.rxBuffer.length);
    this.rxBuffer = combined;

    while (this.rxBuffer.length >= 8) {
      const magic = this.rxBuffer[0];
      if (magic !== 0xCD && magic !== 0xDC) {
        let idx = -1;
        for (let i = 1; i < this.rxBuffer.length; i++) {
          if (this.rxBuffer[i] === 0xCD || this.rxBuffer[i] === 0xDC) {
            idx = i;
            break;
          }
        }
        if (idx < 0) {
          this.rxBuffer = new Uint8Array(0);
          break;
        }
        this.rxBuffer = this.rxBuffer.slice(idx);
        if (this.rxBuffer.length < 8) break;
      }

      const dv = new DataView(this.rxBuffer.buffer, this.rxBuffer.byteOffset, this.rxBuffer.byteLength);
      let expectedTotal = 8;
      if (magic === 0xCD) {
        const totalMinus3 = dv.getUint16(1, false);
        expectedTotal = totalMinus3 + 3;
      } else if (magic === 0xDC) {
        expectedTotal = 8;
      }

      if (this.rxBuffer.length < expectedTotal) {
        break;
      }

      const frameBytes = this.rxBuffer.slice(0, expectedTotal);
      this.rxBuffer = this.rxBuffer.slice(expectedTotal);

      let cmd = 0;
      let sub = 0;
      let payload = new Uint8Array(0);

      if (magic === 0xCD) {
        cmd = frameBytes[3];
        sub = frameBytes[5];
        const plen = (frameBytes[6] << 8) | frameBytes[7];
        if (frameBytes.length >= 8 + plen) {
          payload = frameBytes.slice(8, 8 + plen);
        }
      } else {
        cmd = frameBytes[3];
        sub = frameBytes[4];
        payload = frameBytes.slice(5, 8);
      }

      const status = this.parseStatus({ magic, payload });
      const statusStr = status !== null ? ` status=${status}` : "";
      if (this.quietRxLog && status !== null && status >= 1000 && status <= 10000) {
        const seqAck = status - 1000;
        if (seqAck > 0 && (seqAck % 25 === 0 || seqAck === 1)) {
          this.log(t("logFlashAck", { seq: seqAck, status }));
        }
      } else if (!this.quietRxLog || (status !== 0 && status !== null)) {
        this.log(t("logRxPacket", { magic: magic.toString(16).toUpperCase(), cmd, sub, statusStr, len: frameBytes.length }));
      }
      this.dispatchFrame({ magic, cmd, sub, payload, raw: frameBytes });
    }
  }

  dispatchFrame(frame) {
    for (let i = this.waiters.length - 1; i >= 0; i--) {
      const waiter = this.waiters[i];
      if (waiter.predicate(frame)) {
        if (!waiter.persistent) {
          this.waiters.splice(i, 1);
        }
        waiter.resolve(frame);
        if (!waiter.persistent) {
          break;
        }
      }
    }
  }

  awaitFrame(predicate, timeoutMs = 6000) {
    if (!this.isConnected) {
      return Promise.reject(new Error(t("errDeviceDisconnected")));
    }
    return new Promise((resolve, reject) => {
      let settled = false;
      const waiter = {
        predicate,
        resolve: (frame) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          resolve(frame);
        },
        reject: (err) => {
          if (settled) return;
          settled = true;
          clearTimeout(timer);
          reject(err);
        }
      };

      const timer = setTimeout(() => {
        if (settled) return;
        settled = true;
        const idx = this.waiters.indexOf(waiter);
        if (idx >= 0) this.waiters.splice(idx, 1);
        reject(new Error(t("errWaitTimeout", { ms: timeoutMs })));
      }, timeoutMs);

      this.waiters.push(waiter);
    });
  }

  // --- BG02 0xCD 封包編碼器 (SuperBand SendData.getProtocol 標準) ---
  encodeCdFrame(cmd, sub, payload = new Uint8Array(0)) {
    const plen = payload.length;
    const totalMinus3 = 5 + plen;
    const buf = new Uint8Array(8 + plen);
    const dv = new DataView(buf.buffer);

    buf[0] = 0xCD;
    dv.setUint16(1, totalMinus3, false); // big-endian: 5 + plen
    buf[3] = cmd & 0xFF;
    buf[4] = 0x01;                       // protocol version / key flag = 1
    buf[5] = sub & 0xFF;
    dv.setUint16(6, plen, false);        // big-endian: payload length
    if (plen > 0) {
      buf.set(payload, 8);
    }
    return buf;
  }

  async sendRaw(bytes, preferWithoutResponse = true) {
    if (!this.isConnected || !this.writeChar) {
      throw new Error(t("errNotConnectedConnectFirst"));
    }
    const writeOnce = async (chunk) => {
      if (!this.writeChar || !this.writeChar.properties) {
        throw new Error(t("errConnectionInterruptedRestart"));
      }
      const props = this.writeChar.properties;
      if (preferWithoutResponse && props && props.writeWithoutResponse) {
        try {
          await this.writeChar.writeValueWithoutResponse(chunk);
          return;
        } catch (e) {
          // fallback
        }
      }
      if (props && props.write) {
        await this.writeChar.writeValue(chunk);
      } else if (props && props.writeWithoutResponse) {
        await this.writeChar.writeValueWithoutResponse(chunk);
      } else {
        await this.writeChar.writeValue(chunk);
      }
    };

    try {
      await writeOnce(bytes);
    } catch (err) {
      if (!this.isConnected || !this.writeChar) {
        throw new Error(t("errConnectionInterruptedRestart"));
      }
      // 若作業系統藍牙 MTU 限制單次寫入長度，自動以 20B GATT 分段送出 (韌體 0x02f27a 具備 500B 自動重組緩衝區)
      const mtu = 20;
      for (let off = 0; off < bytes.length; off += mtu) {
        if (!this.writeChar) throw new Error(t("errConnectionInterrupted"));
        const slice = bytes.slice(off, Math.min(off + mtu, bytes.length));
        await writeOnce(slice);
      }
    }
  }

  // --- 業務指令：讀取設備資訊、電池與 Flash 剩餘空間 ---
  async getDeviceInfo() {
    if (this.protocolKind === "zrun_e05" && this.zrunSession) {
      const info = await this.zrunSession.getDeviceInfo();
      if (this.zrunSession.screenWidth > 0 && this.zrunSession.screenHeight > 0) {
        this.screenWidth = this.zrunSession.screenWidth;
        this.screenHeight = this.zrunSession.screenHeight;
      }
      return info;
    }

    this.log(t("logReadingDeviceInfo"));

    let mfg = "-";
    let model = (this.device && this.device.name ? this.device.name.trim() : "") || "BG02";
    let fw = "-";
    let batteryPct = null;

    // 1. 嘗試讀取 SIG DIS 服務 (0x180A)
    try {
      const dis = await this.server.getPrimaryService(DIS_SERVICE_UUID);
      try {
        const cMfg = await dis.getCharacteristic("00002a29-0000-1000-8000-00805f9b34fb");
        const v = await cMfg.readValue();
        const disMfg = new TextDecoder().decode(v).replace(/\0/g, "").trim();
        if (disMfg) mfg = disMfg;
      } catch (e) {}
      try {
        const cModel = await dis.getCharacteristic("00002a24-0000-1000-8000-00805f9b34fb");
        const v = await cModel.readValue();
        const disModel = new TextDecoder().decode(v).replace(/\0/g, "").trim();
        if (disModel) model = disModel;
      } catch (e) {}
      try {
        const cFw = await dis.getCharacteristic("00002a26-0000-1000-8000-00805f9b34fb");
        const v = await cFw.readValue();
        const disFw = new TextDecoder().decode(v).replace(/\0/g, "").trim();
        if (disFw) fw = disFw;
      } catch (e) {}
    } catch (e) {}

    // 2. 嘗試讀取電池 (0x180F)
    try {
      const bas = await this.server.getPrimaryService(BAS_SERVICE_UUID);
      const cBat = await bas.getCharacteristic("00002a19-0000-1000-8000-00805f9b34fb");
      const v = await cBat.readValue();
      batteryPct = v.getUint8(0);
      this.log(t("logBatteryLevel", { pct: batteryPct }));
    } catch (e) {}

    // 3. 向 BG02 查詢螢幕規格 (cmd=32, sub=2, 韌體 0x0710a2)
    let detectedRes = "240 x 240";
    try {
      this.log(t("logQueryResolution"));
      const queryFrame = this.encodeCdFrame(32, 2, new Uint8Array(0));
      const waitPromise = this.awaitFrame(f => f.cmd === 32 && f.sub === 2, 2500);
      await this.sendRaw(queryFrame);
      const resp = await waitPromise;
      if (resp.payload.length >= 6) {
        const pdv = new DataView(resp.payload.buffer, resp.payload.byteOffset, resp.payload.byteLength);
        const w = pdv.getUint16(2, false);
        const h = pdv.getUint16(4, false);
        if (w > 0 && h > 0) {
          this.screenWidth = w;
          this.screenHeight = h;
          detectedRes = `${w} x ${h}`;
          this.log(t("logResolutionOk", { res: detectedRes }));
        }
      }
    } catch (e) {
      this.log(t("logResolutionHint", { msg: e.message }));
    }

    // 4. 向 BG02 查詢錶盤 DialID (CMD=32, SUB=5) 與實際 Flash 剩餘空間 (CMD=32, SUB=4)
    let freeStorageBytes = null;
    let freeStorageKb = null;
    let activePhotoCount = 0;
    try {
      this.log(t("logQueryDialId"));
      const dialFrame = this.encodeCdFrame(32, 5, new Uint8Array(0));
      const waitDial = this.awaitFrame(f => f.cmd === 32 && f.sub === 5, 2500);
      await this.sendRaw(dialFrame);
      const dialResp = await waitDial;
      if (dialResp.payload.length >= 2) {
        activePhotoCount = dialResp.payload[0];
        if (dialResp.payload.length >= 6) {
          const sdv = new DataView(
            dialResp.payload.buffer,
            dialResp.payload.byteOffset,
            dialResp.payload.byteLength
          );
          const parsedDialId = sdv.getUint32(2, false);
          if (parsedDialId > 0) {
            this.activeDialId = parsedDialId;
          }
        }
        const rawHex = Array.from(dialResp.payload).map(b => b.toString(16).padStart(2, "0")).join(" ");
        this.log(t("logDialInfo", {
          count: activePhotoCount,
          dialId: this.activeDialId.toString(16).toUpperCase().padStart(8, "0"),
          hex: rawHex.slice(0, 48),
        }));
      }
    } catch (e) {
      this.log(t("logDialHint", { msg: e.message }));
    }

    // 5. 查詢真實 Flash 剩餘空間 (CMD=32, SUB=4 -> 韌體 0x07117a 回傳 8-byte BE freeBytes)
    try {
      freeStorageKb = await this.getRemainingSpace();
      freeStorageBytes = Math.round(freeStorageKb * 1024);
    } catch (e) {
      this.log(t("logSpaceHint", { msg: e.message }));
    }

    return {
      deviceName: model,
      deviceVersion: fw !== "-" ? fw : "v1.0",
      protocolVersion: "SuperBand NUS (AC695N)",
      detectedResolution: detectedRes,
      freeStorage: freeStorageBytes,
      freeStorageKb,
      activePhotoCount,
      batteryPct,
    };
  }

  /**
   * 解析 CMD=32 SUB=4 回傳之 8-byte (或 4-byte) Big-Endian 實際 Flash 剩餘位元組數。
   */
  static parseFreeSpaceBytes(payload) {
    if (!payload || payload.length < 4) return null;
    const dv = new DataView(payload.buffer, payload.byteOffset, payload.byteLength);
    if (payload.length >= 8) {
      const hi = dv.getUint32(0, false);
      const lo = dv.getUint32(4, false);
      return (hi * 4294967296) + lo;
    }
    return dv.getUint32(0, false);
  }

  // --- 業務指令：單獨查詢真實剩餘可用 Flash 空間 (CMD=32, SUB=4) ---
  async getRemainingSpace() {
    if (!this.isConnected) throw new Error(t("errNotConnected"));
    if (this.protocolKind === "zrun_e05" && this.zrunSession) {
      return await this.zrunSession.getRemainingSpace();
    }
    this.log(t("logQuerySpace"));
    const spaceFrame = this.encodeCdFrame(32, 4, new Uint8Array(0));
    const waitSpace = this.awaitFrame(f => f.cmd === 32 && f.sub === 4, 2500);
    await this.sendRaw(spaceFrame);
    const spaceResp = await waitSpace;
    const freeBytes = SuperBandClient.parseFreeSpaceBytes(spaceResp.payload);
    if (freeBytes !== null) {
      const freeKb = freeBytes / 1024;
      this.log(t("logFreeSpace", { kb: freeKb.toFixed(2), bytes: freeBytes }));
      return freeKb;
    }
    throw new Error(t("errSpacePayloadShort"));
  }

  // --- 輔助：RGB888 轉 RGB565 Little-Endian (BG02 硬體點陣格式) ---
  canvasToRgb565(canvas) {
    const ctx = canvas.getContext("2d");
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imgData.data;
    const totalPixels = canvas.width * canvas.height;
    const bytes = new Uint8Array(totalPixels * 2);

    let byteIdx = 0;
    for (let i = 0; i < pixels.length; i += 4) {
      const r = pixels[i];
      const g = pixels[i + 1];
      const b = pixels[i + 2];

      const rgb565 = ((r >> 3) << 11) | ((g >> 2) << 5) | (b >> 3);
      bytes[byteIdx++] = rgb565 & 0xFF;
      bytes[byteIdx++] = (rgb565 >> 8) & 0xFF;
    }
    return bytes;
  }

  /**
   * 驗證並清理 JPEG 以符合 BG02/DG01 韌體 JLHWJPEG (0x038cf8) 解碼規範：
   * Baseline SOF0 (0xFFC0)、3 通道 YCbCr、8-bit DQT (ID 0/1, <=512B)、
   * DHT (0x00/0x01/0x10/0x11, <=512B)、寬高 <=359、並移除冗餘 APP1..15/COM 區段。
   */
  static sanitizeBadgeJpeg(jpegBytes, options = {}) {
    const maxDimension = options.maxDimension ?? 359;
    const src = jpegBytes instanceof Uint8Array ? jpegBytes : new Uint8Array(jpegBytes);
    if (src.length < 4 || src[0] !== 0xFF || src[1] !== 0xD8) {
      throw new Error(t("errJpegInvalidSoi"));
    }

    const parts = [new Uint8Array([0xFF, 0xD8])];
    let info = null;
    let pos = 2;

    while (pos < src.length) {
      while (pos < src.length && src[pos] === 0xFF) pos++;
      if (pos >= src.length) break;
      const marker = src[pos++];

      if (marker === 0x00 || (marker >= 0xD0 && marker <= 0xD7)) continue;
      if (marker === 0xD9) throw new Error(t("errJpegEoiBeforeSos"));
      if (pos + 2 > src.length) throw new Error(t("errJpegTruncated"));

      const segLen = (src[pos] << 8) | src[pos + 1];
      const payloadStart = pos + 2;
      const payloadEnd = pos + segLen;
      if (segLen < 2 || payloadEnd > src.length) {
        throw new Error(t("errJpegSegLen", { marker: marker.toString(16).toUpperCase() }));
      }
      const payload = src.subarray(payloadStart, payloadEnd);
      pos = payloadEnd;

      if (marker === 0xC0) {
        info = SuperBandClient._validateBadgeSof0(payload, maxDimension);
      } else if (marker === 0xDB) {
        SuperBandClient._validateBadgeDqt(payload);
      } else if (marker === 0xC4) {
        SuperBandClient._validateBadgeDht(payload);
      } else if (marker === 0xDD) {
        if (payload.length > 512) throw new Error(t("errJpegDriLen"));
      } else if (marker === 0xDA) {
        if (payload.length > 512 || payload.length < 1 || payload[0] !== 3) {
          throw new Error(t("errJpegSosFmt"));
        }
        if (!info) throw new Error(t("errJpegMissingSof0"));
        const tail = SuperBandClient._sliceScanThroughEoi(src, payloadStart - 4);
        parts.push(tail);
        return SuperBandClient._concatUint8Arrays(parts);
      } else if (marker >= 0xC1 && marker <= 0xCF) {
        throw new Error(t("errJpegNonBaseline", { marker: marker.toString(16).toUpperCase() }));
      } else if ((marker >= 0xE1 && marker <= 0xEF) || marker === 0xFE) {
        continue; // 剝除 EXIF/ICC/COM 等冗餘中繼資料以縮減體積
      } else if (marker === 0xE0 && payload.length > 64) {
        continue;
      }

      parts.push(src.subarray(payloadStart - 4, payloadEnd));
    }

    throw new Error(t("errJpegMissingSosOrEoi"));
  }

  static _validateBadgeSof0(payload, maxDimension = 359) {
    if (payload.length > 512 || payload.length < 6) {
      throw new Error(t("errJpegSof0Len"));
    }
    const precision = payload[0];
    const height = (payload[1] << 8) | payload[2];
    const width = (payload[3] << 8) | payload[4];
    const numComp = payload[5];
    if (precision !== 8 || numComp !== 3) {
      throw new Error(t("errJpegUnsupportedFmt", { precision, numComp }));
    }
    if (payload.length < 15) {
      throw new Error(t("errJpegSof0Len"));
    }
    if (width < 1 || height < 1 || width > maxDimension || height > maxDimension) {
      throw new Error(t("errJpegResLimit", { w: width, h: height, max: maxDimension }));
    }
    const ySamp = payload[7];
    const cbSamp = payload[10];
    const crSamp = payload[13];
    if (![0x11, 0x12, 0x21, 0x22].includes(ySamp) || cbSamp !== 0x11 || crSamp !== 0x11) {
      throw new Error(t("errJpegSubsampling", {
        y: ySamp.toString(16),
        cb: cbSamp.toString(16),
        cr: crSamp.toString(16),
      }));
    }
    for (let c = 0; c < 3; c++) {
      if (payload[8 + c * 3] > 1) throw new Error(t("errJpegDqtIndex"));
    }
    return { width, height, ySamp };
  }

  static _validateBadgeDqt(payload) {
    if (payload.length > 512 || payload.length < 65) {
      throw new Error(t("errJpegDqtLen"));
    }
    let off = 0;
    while (off < payload.length) {
      if (off + 65 > payload.length) throw new Error(t("errJpegDqtStruct"));
      const info = payload[off];
      if ((info & 0xF0) !== 0) throw new Error(t("errJpegDqtPrecision"));
      if ((info & 0x03) > 1) throw new Error(t("errJpegDqtId"));
      off += 65;
    }
  }

  static _validateBadgeDht(payload) {
    if (payload.length > 512 || payload.length < 17) {
      throw new Error(t("errJpegDhtLen"));
    }
    let off = 0;
    while (off < payload.length) {
      if (off + 17 > payload.length) throw new Error(t("errJpegDhtStruct"));
      const tcTh = payload[off++];
      if ((tcTh & 0xEE) !== 0) {
        throw new Error(t("errJpegDhtId", { tcTh: tcTh.toString(16) }));
      }
      let symCount = 0;
      for (let i = 0; i < 16; i++) symCount += payload[off + i];
      off += 16 + symCount;
      if (off > payload.length) throw new Error(t("errJpegOverflow"));
    }
  }

  static _sliceScanThroughEoi(src, sosStart) {
    // 掃描結尾的 0xFFD9，避免截斷 MCU 資料流內未出現或合法結尾之後的尾端雜訊
    for (let i = src.length - 2; i >= sosStart; i--) {
      if (src[i] === 0xFF && src[i + 1] === 0xD9) {
        return src.subarray(sosStart, i + 2);
      }
    }
    throw new Error(t("errJpegMissingEoi"));
  }

  static _concatUint8Arrays(chunks) {
    let total = 0;
    for (const c of chunks) total += c.length;
    const out = new Uint8Array(total);
    let offset = 0;
    for (const c of chunks) {
      out.set(c, offset);
      offset += c.length;
    }
    return out;
  }

  /**
   * 將 Canvas 轉碼為符合 BG02/DG01 韌體規範的 Baseline JPEG 位元組流。
   * 先鋪平於純黑底色畫布以確保角落透明區域穩定轉黑，必要時自動降質以控制容量。
   */
  async canvasToBadgeJpeg(canvas, options = {}) {
    const maxBytes = options.maxBytes ?? 96 * 1024;
    const maxDimension = options.maxDimension ?? (this.protocolKind === "zrun_e05" ? 512 : 359);
    const requestedQuality = options.quality ?? 0.90;
    const qualities = [requestedQuality, 0.85, 0.78, 0.70, 0.60, 0.45, 0.35, 0.25]
      .filter((q, idx, arr) => q <= requestedQuality && arr.indexOf(q) === idx);

    const flatCanvas = document.createElement("canvas");
    flatCanvas.width = canvas.width;
    flatCanvas.height = canvas.height;
    const fctx = flatCanvas.getContext("2d");
    fctx.fillStyle = "#000000";
    fctx.fillRect(0, 0, flatCanvas.width, flatCanvas.height);
    fctx.drawImage(canvas, 0, 0);

    let lastBytes = null;
    for (const q of qualities) {
      const blob = await new Promise((resolve) => flatCanvas.toBlob(resolve, "image/jpeg", q));
      if (!blob) throw new Error(t("errJpegEncodeFailed"));
      const raw = new Uint8Array(await blob.arrayBuffer());
      lastBytes = SuperBandClient.sanitizeBadgeJpeg(raw, { maxDimension });
      if (lastBytes.length <= maxBytes) return lastBytes;
    }
    return lastBytes;
  }

  /**
   * 解析標準 RIFF AVI ('AVI ') 容器：支援提取 MJPG 影格與幀率/尺寸資訊，並安全跳過 JUNK / vprp / INFO / idx1 等區塊。
   */
  static parseMjpegAvi(aviBytes) {
    const src = aviBytes instanceof Uint8Array ? aviBytes : new Uint8Array(aviBytes);
    const readTag = (pos) =>
      String.fromCharCode(src[pos], src[pos + 1], src[pos + 2], src[pos + 3]);

    if (src.length < 16 || readTag(0) !== "RIFF" || readTag(8) !== "AVI ") {
      throw new Error(t("errInvalidAvi"));
    }

    const dv = new DataView(src.buffer, src.byteOffset, src.byteLength);
    let width = 0;
    let height = 0;
    let usPerFrame = 0;
    let totalFramesHdr = 0;
    let scale = 0;
    let rate = 0;
    let codec = "";
    const rawVideoChunks = [];
    let inVideoStream = false;

    const walk = (start, end) => {
      let i = start;
      while (i + 8 <= end) {
        const tag = readTag(i);
        const sz = dv.getUint32(i + 4, true);
        const dataStart = i + 8;
        const dataEnd = Math.min(end, dataStart + sz);

        if (tag === "RIFF" || tag === "LIST") {
          if (dataStart + 4 <= end) {
            const subType = readTag(dataStart);
            if (subType === "strl") inVideoStream = false;
            walk(dataStart + 4, dataEnd);
          }
        } else if (tag === "avih" && dataEnd - dataStart >= 40) {
          usPerFrame = dv.getUint32(dataStart, true);
          totalFramesHdr = dv.getUint32(dataStart + 16, true);
          width = dv.getUint32(dataStart + 32, true);
          height = dv.getUint32(dataStart + 36, true);
        } else if (tag === "strh" && dataEnd - dataStart >= 28) {
          const fccType = readTag(dataStart);
          inVideoStream = fccType === "vids";
          if (inVideoStream) {
            codec = readTag(dataStart + 4).replace(/\0/g, "").trim();
            scale = dv.getUint32(dataStart + 20, true);
            rate = dv.getUint32(dataStart + 24, true);
            if (dataEnd - dataStart >= 36) {
              const len = dv.getUint32(dataStart + 32, true);
              if (len > 0 && !totalFramesHdr) totalFramesHdr = len;
            }
          }
        } else if (tag === "strf" && inVideoStream && dataEnd - dataStart >= 20) {
          const w = dv.getInt32(dataStart + 4, true);
          const h = Math.abs(dv.getInt32(dataStart + 8, true));
          const comp = readTag(dataStart + 16).replace(/\0/g, "").trim();
          if (w > 0 && h > 0) {
            width = w;
            height = h;
          }
          if (!codec || codec === "DIB") codec = comp || codec;
        } else if (tag === "00dc" || tag === "00db") {
          if (dataEnd > dataStart) {
            rawVideoChunks.push(src.subarray(dataStart, dataEnd));
          }
        }

        const step = 8 + (sz % 2 === 1 ? sz + 1 : sz);
        if (step < 8) break;
        i += step;
      }
    };

    const riffLimit = Math.min(src.length, 8 + dv.getUint32(4, true));
    walk(12, riffLimit);

    const upperCodec = codec.toUpperCase();
    const looksJpeg = rawVideoChunks.length > 0 &&
      rawVideoChunks.some((c) => c.length >= 4 && c[0] === 0xFF && c[1] === 0xD8);
    const isMjpeg = upperCodec === "MJPG" || upperCodec === "JPEG" || (upperCodec === "" && looksJpeg);

    const frames = isMjpeg
      ? rawVideoChunks.filter((c) => c.length >= 4 && c[0] === 0xFF && c[1] === 0xD8)
      : rawVideoChunks;

    let fps = 5;
    if (scale > 0 && rate > 0) {
      fps = rate / scale;
    } else if (usPerFrame > 0) {
      fps = 1000000 / usPerFrame;
    }
    if (!Number.isFinite(fps) || fps <= 0) fps = 5;
    const effectiveUsPerFrame = usPerFrame > 0 ? usPerFrame : Math.round(1000000 / fps);

    return {
      isAvi: true,
      codec: upperCodec || (isMjpeg ? "MJPG" : "UNKNOWN"),
      isMjpeg,
      width,
      height,
      fps,
      usPerFrame: effectiveUsPerFrame,
      scale,
      rate,
      totalFrames: frames.length || totalFramesHdr,
      frames,
    };
  }

  /**
   * 將每張圖片顯示間隔秒數 (0.1 ~ 10s，以 0.1s 為單位) 換算為精確 RIFF AVI 時基物件 { scale, rate, fps, intervalSec }。
   */
  static intervalSecToAviTiming(intervalSec) {
    const secNum = Number(intervalSec);
    const clamped = Number.isFinite(secNum) ? Math.max(0.1, Math.min(10, secNum)) : 1;
    const tenths = Math.max(1, Math.min(100, Math.round(clamped * 10)));
    const gcd = (a, b) => (b === 0 ? a : gcd(b, a % b));
    const g = gcd(tenths, 10);
    return {
      scale: tenths / g,
      rate: 10 / g,
      fps: 10 / tenths,
      intervalSec: tenths / 10,
    };
  }

  /**
   * 將一張或多張經 sanitizeBadgeJpeg 驗證之 Baseline JPEG 影格封裝為符合 BG02/DG01 韌體 (0x050b2c / JLHWJPEG)
   * 規範的標準 RIFF AVI (MJPG) 容器位元組流。
   * 內含 hdrl (avih, strl vids/MJPG strh+strf)、LIST movi (00dc 偶對齊分塊) 與 idx1 索引表。
   * 支援數值 FPS 或 { fps, scale, rate } 物件，可保留如 0.1 fps (每格 10 秒) 之慢速輪播節奏。
   */
  static buildMjpegAvi(jpegFrames, width, height, timing = 5) {
    if (!Array.isArray(jpegFrames) || jpegFrames.length === 0) {
      throw new Error(t("errAviNoFrames"));
    }
    const w = Math.max(1, Math.round(width));
    const h = Math.max(1, Math.round(height));

    let dwScale = 1;
    let dwRate = 5;
    let safeFps = 5;
    let usedExactScaleRate = false;

    if (timing && typeof timing === "object") {
      const reqScale = Number(timing.scale);
      const reqRate = Number(timing.rate);
      const reqFps = Number(timing.fps);
      if (reqScale > 0 && reqRate > 0) {
        const ratio = reqRate / reqScale;
        safeFps = Math.max(0.05, Math.min(30, ratio));
        if (Math.abs(safeFps - ratio) < 1e-6) {
          dwScale = Math.round(reqScale);
          dwRate = Math.round(reqRate);
          usedExactScaleRate = true;
        }
      } else if (Number.isFinite(reqFps) && reqFps > 0) {
        safeFps = Math.max(0.05, Math.min(30, reqFps));
      }
    } else {
      const numFps = Number(timing);
      safeFps = Number.isFinite(numFps) && numFps > 0 ? Math.max(0.05, Math.min(30, numFps)) : 5;
    }

    if (!usedExactScaleRate) {
      if (safeFps >= 1) {
        const rounded = Math.round(safeFps);
        if (Math.abs(safeFps - rounded) < 1e-3) {
          dwScale = 1;
          dwRate = rounded;
        } else {
          dwScale = 100;
          dwRate = Math.round(safeFps * 100);
        }
      } else {
        const inv = 1 / safeFps;
        const roundedInv = Math.round(inv);
        if (Math.abs(inv - roundedInv) < 1e-3) {
          dwScale = roundedInv;
          dwRate = 1;
        } else {
          dwScale = 1000;
          dwRate = Math.max(1, Math.round(safeFps * 1000));
        }
      }
    }
    const usPerFrame = Math.max(1, Math.round((1000000 * dwScale) / dwRate));

    const frames = jpegFrames.map((f) => SuperBandClient.sanitizeBadgeJpeg(f));
    let maxFrameSize = 0;
    let moviChunksBytes = 0;
    for (const f of frames) {
      if (f.length > maxFrameSize) maxFrameSize = f.length;
      moviChunksBytes += 8 + ((f.length + 1) & ~1);
    }

    const frameCount = frames.length;
    const idxSize = frameCount * 16;
    const hdrlStart = 12;
    const hdrlSize = 4 + 64 + (12 + 64 + 48); // 192
    const moviListStart = hdrlStart + 8 + hdrlSize; // 212
    const moviListSize = 4 + moviChunksBytes;
    const idxStart = moviListStart + 8 + moviListSize;
    const totalSize = idxStart + 8 + idxSize;

    const out = new Uint8Array(totalSize);
    const dv = new DataView(out.buffer);
    const writeTag = (pos, tag) => {
      out[pos] = tag.charCodeAt(0);
      out[pos + 1] = tag.charCodeAt(1);
      out[pos + 2] = tag.charCodeAt(2);
      out[pos + 3] = tag.charCodeAt(3);
    };

    // RIFF header
    writeTag(0, "RIFF");
    dv.setUint32(4, totalSize - 8, true);
    writeTag(8, "AVI ");

    // LIST hdrl
    writeTag(12, "LIST");
    dv.setUint32(16, hdrlSize, true);
    writeTag(20, "hdrl");

    // avih (56B)
    writeTag(24, "avih");
    dv.setUint32(28, 56, true);
    dv.setUint32(32, usPerFrame, true);                  // dwMicroSecPerFrame
    dv.setUint32(36, Math.max(1, Math.round((maxFrameSize * dwRate) / dwScale)), true); // dwMaxBytesPerSec
    dv.setUint32(40, 0, true);                           // dwPaddingGranularity
    dv.setUint32(44, 0x00000910, true);                  // AVIF_HASINDEX | AVIF_ISINTERLEAVED | AVIF_TRUSTCKTYPE
    dv.setUint32(48, frameCount, true);                  // dwTotalFrames
    dv.setUint32(52, 0, true);                           // dwInitialFrames
    dv.setUint32(56, 1, true);                           // dwStreams = 1 (vids)
    dv.setUint32(60, Math.max(maxFrameSize + 8, 16384), true); // dwSuggestedBufferSize
    dv.setUint32(64, w, true);                           // dwWidth
    dv.setUint32(68, h, true);                           // dwHeight

    // LIST strl (116B payload)
    writeTag(88, "LIST");
    dv.setUint32(92, 116, true);
    writeTag(96, "strl");

    // strh (56B)
    writeTag(100, "strh");
    dv.setUint32(104, 56, true);
    writeTag(108, "vids");                               // fccType
    writeTag(112, "MJPG");                               // fccHandler
    dv.setUint32(116, 0, true);                          // dwFlags
    dv.setUint16(120, 0, true);                          // wPriority
    dv.setUint16(122, 0, true);                          // wLanguage
    dv.setUint32(124, 0, true);                          // dwInitialFrames
    dv.setUint32(128, dwScale, true);                    // dwScale
    dv.setUint32(132, dwRate, true);                     // dwRate
    dv.setUint32(136, 0, true);                          // dwStart
    dv.setUint32(140, frameCount, true);                 // dwLength
    dv.setUint32(144, maxFrameSize, true);               // dwSuggestedBufferSize
    dv.setUint32(148, 0xFFFFFFFF, true);                 // dwQuality (-1)
    dv.setUint32(152, 0, true);                          // dwSampleSize
    dv.setUint16(156, 0, true);                          // rcFrame.left
    dv.setUint16(158, 0, true);                          // rcFrame.top
    dv.setUint16(160, w, true);                          // rcFrame.right
    dv.setUint16(162, h, true);                          // rcFrame.bottom

    // strf (40B BITMAPINFOHEADER)
    writeTag(164, "strf");
    dv.setUint32(168, 40, true);
    dv.setUint32(172, 40, true);                         // biSize
    dv.setInt32(176, w, true);                           // biWidth
    dv.setInt32(180, h, true);                           // biHeight
    dv.setUint16(184, 1, true);                          // biPlanes
    dv.setUint16(186, 24, true);                         // biBitCount
    writeTag(188, "MJPG");                               // biCompression
    dv.setUint32(192, w * h * 3, true);                  // biSizeImage

    // LIST movi
    writeTag(moviListStart, "LIST");
    dv.setUint32(moviListStart + 4, moviListSize, true);
    writeTag(moviListStart + 8, "movi");

    let curPos = moviListStart + 12;
    let relOffset = 4; // 相對於 'movi' type 起始位址之偏移 (與 watch@0x1fa000 一致)
    for (let i = 0; i < frameCount; i++) {
      const f = frames[i];
      writeTag(curPos, "00dc");
      dv.setUint32(curPos + 4, f.length, true);
      out.set(f, curPos + 8);
      const paddedPayloadLen = (f.length + 1) & ~1;

      const idxOff = idxStart + 8 + i * 16;
      writeTag(idxOff, "00dc");
      dv.setUint32(idxOff + 4, 0x00000010, true);        // AVIIF_KEYFRAME
      dv.setUint32(idxOff + 8, relOffset, true);
      dv.setUint32(idxOff + 12, f.length, true);

      curPos += 8 + paddedPayloadLen;
      relOffset += 8 + paddedPayloadLen;
    }

    // idx1
    writeTag(idxStart, "idx1");
    dv.setUint32(idxStart + 4, idxSize, true);

    return out;
  }

  /**
   * 依目前連線協定選擇對應的 MJPEG .avi 封裝器（BG02 精簡封裝 / ZRun E05 完整 vprp+JUNK 封裝）。
   */
  buildProtocolAvi(jpegFrames, width, height, timing = 5) {
    if (this.protocolKind === "zrun_e05") {
      return buildZrunMjpgAvi(jpegFrames, width, height, timing);
    }
    return SuperBandClient.buildMjpegAvi(jpegFrames, width, height, timing);
  }

  /**
   * 將單張 Canvas 轉碼並封裝為單影格 MJPEG .avi，供徽章原生解碼顯示。
   */
  async canvasToBadgeAvi(canvas, options = {}) {
    const maxBytes = options.maxBytes ?? 96 * 1024;
    const fps = options.fps ?? 5;
    const hdrReserve = this.protocolKind === "zrun_e05" ? 6000 : 260;
    const jpegBytes = await this.canvasToBadgeJpeg(canvas, {
      ...options,
      maxBytes: Math.max(4096, maxBytes - hdrReserve),
    });
    return this.buildProtocolAvi([jpegBytes], canvas.width, canvas.height, fps);
  }

  /**
   * 依據 CMD=31 SUB=1 第一塊規範 (bitmask & 0x08) 在資料最前端加上 4-byte Big-Endian 區段長度標頭。
   * 韌體會在收齊該長度後寫滿 bgPic.tmp，並將此 4-byte 標頭一併計入 totalSum。
   */
  static frameDialPayload(rawFileBytes, bitmask = 0x08) {
    const raw = rawFileBytes instanceof Uint8Array ? rawFileBytes : new Uint8Array(rawFileBytes);
    if ((bitmask & 0x08) === 0) return raw;
    const framed = new Uint8Array(4 + raw.length);
    new DataView(framed.buffer).setUint32(0, raw.length, false);
    framed.set(raw, 4);
    return framed;
  }

  /**
   * 建立 CMD=31 SUB=2 單圖推送啟動握手封包 (17 bytes)。
   * Byte 0..3 為 Dial ID (預設 0x000015A2，custom=0 才會匹配韌體 0x06fd26 錶盤清單)、
   * Byte 4 為 isAvi (1=.avi, 0=靜態圖)、Byte 5 為 bitmask (0x08)、Byte 9..12 為總串流長度 (BE u32)。
   */
  static buildDialStartPayload(totalStreamBytes, options = {}) {
    const fontPos = options.fontPos !== undefined ? (options.fontPos & 0xFF) : 0;
    const isCustom = options.custom !== undefined ? (options.custom & 0xFF) : 0;
    const isAvi = options.isAvi !== undefined ? (options.isAvi & 0xFF) : 0;
    const bitmask = options.bitmask !== undefined ? (options.bitmask & 0xFF) : 0x08;
    const dialId = options.dialId !== undefined && options.dialId !== null
      ? (options.dialId >>> 0)
      : (((fontPos & 0xFF) << 24) | ((isCustom & 0xFF) << 16) | 0x15A2) >>> 0;

    const startPayload = new Uint8Array(17);
    const sdv = new DataView(startPayload.buffer);
    sdv.setUint32(0, dialId, false);
    startPayload[4] = isAvi;
    startPayload[5] = bitmask; // 關鍵 Bit 3 (0x08): 觸發徽章開啟 ID_WINDOW_UPGRADE (0x006e0837) 傳輸畫面！
    startPayload[6] = 0xFF;
    startPayload[7] = 0xFF;
    startPayload[8] = 0xFF;
    sdv.setUint32(9, totalStreamBytes >>> 0, false);
    startPayload[13] = 0x00;
    startPayload[14] = 0x00;
    startPayload[15] = 0x00;
    startPayload[16] = fontPos;
    return startPayload;
  }

  /**
   * 計算 CMD=31 SUB=3 完成提交 4-byte Big-Endian 總校驗和 (累加整個串流 bytes，含首塊 4B 長度標頭)。
   */
  static buildDialFinishPayload(streamBytes) {
    let totalSum = 0;
    for (let i = 0; i < streamBytes.length; i++) {
      totalSum = (totalSum + streamBytes[i]) >>> 0;
    }
    const finishPayload = new Uint8Array(4);
    new DataView(finishPayload.buffer).setUint32(0, totalSum, false);
    return { totalSum, finishPayload };
  }

  // --- 業務指令：尋找與喚醒徽章 ---
  async findMe() {
    if (!this.isConnected) throw new Error(t("errNotConnected"));
    if (this.protocolKind === "zrun_e05") {
      throw new Error(t("errFindMeUnsupportedZrun"));
    }
    this.log(t("logFindMeCmd"));
    const buf = this.encodeCdFrame(18, 11, new Uint8Array([1]));
    await this.sendRaw(buf);
    this.log(t("logFindMeAck"));
  }

  /**
   * 業務指令：上傳單圖/相片至徽章 (經 oem_DG01.bin 韌體反組譯 100% 驗證之精確協定)
   *
   * 韌體狀態碼 (cmd=32, sub=1, 4-byte BE status, 0x071248):
   * - status = 8 : 啟動握手成功，徽章已開啟 `ID_WINDOW_UPGRADE (0x006e0837)` 藍色進度條傳輸畫面！
   * - status = 0 : 每 6 個數據塊 (u16[0x2a84] % 6 == 0) 或檔案最後一塊寫入 `bgPic.tmp` 完成之流控 ACK
   * - status = 2 : `SUB_DIAL_FINISH` 總校驗通過，已將 `bgPic.tmp` 寫入 `/bgp_wa%d` 並切換顯示畫面！
   * - status = 1 : 校驗和錯誤 (ERROR_CHECK)
   * - status = 3 : 電量低於 20% 拒絕寫入 (ERROR_BATTERY_LOW)
   * - status = 4 : 充電中拒絕寫入 (ERROR_CHARGE_BATTERY)
   * - status = 5 : 剩餘空間不足拒絕寫入 (ERROR_OUT_OF_MEMORY)
   * - status = 7 : 設備忙碌或狀態異常 (ERROR_STATE)
   */
  uploadDialImage(rawFileBytes, onProgress = null, options = {}) {
    if (!this.isConnected) throw new Error(t("errNotConnected"));
    if (this.protocolKind === "zrun_e05" && this.zrunSession) {
      return this.zrunSession.uploadFile(rawFileBytes, onProgress, options);
    }

    const rawArr = rawFileBytes instanceof Uint8Array ? rawFileBytes : new Uint8Array(rawFileBytes);
    const looksLikeAvi = rawArr.length >= 12 &&
      rawArr[0] === 0x52 && rawArr[1] === 0x49 && rawArr[2] === 0x46 && rawArr[3] === 0x46 &&
      rawArr[8] === 0x41 && rawArr[9] === 0x56 && rawArr[10] === 0x49 && rawArr[11] === 0x20;
    const bitmask = options.bitmask !== undefined ? (options.bitmask & 0xFF) : 0x08;
    const fileBytes = SuperBandClient.frameDialPayload(rawArr, bitmask);
    const totalBytes = fileBytes.length;
    const slot = options.slot !== undefined ? (options.slot & 0xFF) : 0;
    const isAvi = options.isAvi !== undefined ? (options.isAvi & 0xFF) : (looksLikeAvi ? 1 : 0);
    const isCustom = options.custom !== undefined ? (options.custom & 0xFF) : 0;
    const fontPos = options.fontPos !== undefined ? (options.fontPos & 0xFF) : 0;
    const dialId = options.dialId !== undefined
      ? options.dialId
      : (options.custom !== undefined || options.fontPos !== undefined ? undefined : this.activeDialId);

    const extLabel = isAvi ? `.avi` : "";
    this.log(t("logPrepareImageTransfer", {
      totalBytes,
      slot,
      ext: extLabel,
      isAvi,
      custom: isCustom,
    }));

    const isFatalStatus = (code) => {
      return code === 1 || code === 3 || code === 4 || code === 5 || code === 7;
    };

    const getFatalErrorMessage = (code) => {
      switch (code) {
        case 1: return t("fatalStatus1");
        case 3: return t("fatalStatus3");
        case 4: return t("fatalStatus4");
        case 5: return t("fatalStatus5");
        case 7: return t("fatalStatus7");
        default: return t("fatalStatusDefault", { code });
      }
    };

    return (async () => {
      // 1. 發送 17 位元組 START 握手封包 (CMD 31, SUB 2)
      const startPayload = SuperBandClient.buildDialStartPayload(totalBytes, {
        fontPos,
        custom: isCustom,
        isAvi,
        bitmask,
        dialId,
      });
      const dialIdHex = ((startPayload[0] << 24) | (startPayload[1] << 16) | (startPayload[2] << 8) | startPayload[3]) >>> 0;
      const dialIdStr = dialIdHex.toString(16).toUpperCase().padStart(8, "0");

      const startFrame = this.encodeCdFrame(31, 2, startPayload);

      this.log(t("logStartHandshake", {
        dialId: dialIdStr,
        isAvi,
        bitmask: bitmask.toString(16).padStart(2, "0"),
        size: totalBytes,
      }));

      let startAckReceived = false;

      const sendStartAndWait = (timeoutMs) => {
        return new Promise((resolve, reject) => {
          let settled = false;
          let mainTimer = null;

          const finish = (fn, val) => {
            if (settled) return;
            settled = true;
            if (mainTimer) clearTimeout(mainTimer);
            const idx = this.waiters.indexOf(waiter);
            if (idx >= 0) this.waiters.splice(idx, 1);
            fn(val);
          };

          const waiter = {
            persistent: true,
            predicate: (f) => {
              const st = this.parseStatus(f);
              if (st === null) return false;
              return (f.cmd === 32 && f.sub === 1) || (f.magic === 0xCD && f.cmd === 31 && f.sub === 2);
            },
            resolve: (f) => {
              const st = this.parseStatus(f);
              if (st >= 1000 || st === 8 || st === 0 || st === 2) {
                finish(resolve, { ok: true, status: st });
                return;
              }
              if (isFatalStatus(st)) {
                finish(resolve, { fatalStatus: st });
              }
            },
            reject: (err) => {
              finish(reject, err);
            },
          };

          mainTimer = setTimeout(() => {
            finish(resolve, { timedOut: true });
          }, timeoutMs);

          this.waiters.push(waiter);

          this.sendRaw(startFrame, true).catch((err) => {
            finish(reject, err);
          });
        });
      };

      for (let attempt = 1; attempt <= 2; attempt++) {
        if (!this.isConnected || !this.writeChar) {
          throw new Error(t("errReconnectRequired"));
        }

        const res = await sendStartAndWait(2500);
        if (res.ok) {
          startAckReceived = true;
          this.log(t("logStartSuccess", { status: res.status }));
          break;
        }
        if (res.fatalStatus !== undefined) {
          const errMsg = getFatalErrorMessage(res.fatalStatus);
          this.log(`❌ ${errMsg}`);
          throw new Error(errMsg);
        }
        if (attempt < 2) {
          this.log(t("logStartRetry", { next: attempt + 1 }));
        }
      }

      if (!startAckReceived) {
        const errMsg = t("errNoStartAck", { dialId: dialIdStr });
        this.log(`❌ ${errMsg}`);
        throw new Error(errMsg);
      }
      // 給予徽章 120ms 讓 FreeRTOS UI 完全初始化 ID_WINDOW_UPGRADE 進度條元件
      await new Promise(r => setTimeout(r, 120));

      // 2. ACK 流控串流分塊傳輸：每個分塊預設 200 Bytes，並逐塊確認徽章回傳 status = 1000 + seq
      const chunkSize = options.chunkSize || 200;
      const totalChunks = Math.ceil(totalBytes / chunkSize);
      const chunkAckTimeoutMs = options.chunkAckTimeoutMs || 2200;

      this.log(t("logStartStreaming", { totalChunks, chunkSize }));

      const startTime = performance.now();
      this.quietRxLog = true;
      let fatalError = null;
      let confirmedSeq = 0;
      let pendingTargetSeq = 0;
      let resolvePendingSeq = null;
      let rejectPendingSeq = null;

      const waitForConfirmedSeq = (targetSeq, timeoutMs) => {
        if (fatalError) return Promise.reject(fatalError);
        if (confirmedSeq >= targetSeq) return Promise.resolve(confirmedSeq);
        return new Promise((resolve, reject) => {
          pendingTargetSeq = targetSeq;
          const timer = setTimeout(() => {
            clearInterval(connPoll);
            if (resolvePendingSeq === onAck) {
              pendingTargetSeq = 0;
              resolvePendingSeq = null;
              rejectPendingSeq = null;
            }
            resolve(confirmedSeq);
          }, timeoutMs);
          const connPoll = setInterval(() => {
            if (!this.isConnected || !this.writeChar) {
              clearTimeout(timer);
              clearInterval(connPoll);
              if (rejectPendingSeq === onErr) {
                pendingTargetSeq = 0;
                resolvePendingSeq = null;
                rejectPendingSeq = null;
              }
              reject(new Error(t("errTransferDisconnected")));
            }
          }, 150);
          const onAck = (cur) => {
            clearTimeout(timer);
            clearInterval(connPoll);
            resolve(cur);
          };
          const onErr = (err) => {
            clearTimeout(timer);
            clearInterval(connPoll);
            reject(err);
          };
          resolvePendingSeq = onAck;
          rejectPendingSeq = onErr;
        });
      };

      const rxWaiter = {
        persistent: true,
        predicate: (f) => (f.cmd === 32 && f.sub === 1 && f.payload && f.payload.length >= 4),
        resolve: (f) => {
          const st = this.parseStatus(f);
          if (st !== null && isFatalStatus(st)) {
            fatalError = new Error(getFatalErrorMessage(st));
            if (rejectPendingSeq) {
              const rej = rejectPendingSeq;
              pendingTargetSeq = 0;
              resolvePendingSeq = null;
              rejectPendingSeq = null;
              rej(fatalError);
            }
            return;
          }
          if (st !== null && st >= 1000 && st <= 1000 + totalChunks) {
            const seqNum = st - 1000;
            if (seqNum > confirmedSeq) {
              confirmedSeq = seqNum;
            }
            if (resolvePendingSeq && confirmedSeq >= pendingTargetSeq) {
              const res = resolvePendingSeq;
              pendingTargetSeq = 0;
              resolvePendingSeq = null;
              rejectPendingSeq = null;
              res(confirmedSeq);
            }
          }
        },
        reject: () => {}
      };
      this.waiters.push(rxWaiter);

      try {
        for (let seq = 1; seq <= totalChunks; seq++) {
          if (!this.isConnected || !this.writeChar) {
            throw new Error(t("errTransferDisconnected"));
          }
          if (fatalError) throw fatalError;

          const offset = (seq - 1) * chunkSize;
          const end = Math.min(offset + chunkSize, totalBytes);
          const piece = fileBytes.subarray(offset, end);

          const body = new Uint8Array(2 + piece.length + 4);
          const bdv = new DataView(body.buffer);
          bdv.setUint16(0, seq, false);
          body.set(piece, 2);

          let ck = (body[0] + body[1]) >>> 0;
          for (let i = 0; i < piece.length; i++) {
            ck = (ck + piece[i]) >>> 0;
          }
          bdv.setUint32(2 + piece.length, ck, false);

          const chunkFrame = this.encodeCdFrame(31, 1, body);

          let acked = false;
          for (let retry = 0; retry <= 2; retry++) {
            if (retry > 0) {
              this.log(t("logChunkRetry", { seq, totalChunks, confirmed: confirmedSeq, retry }));
            }
            await this.sendRaw(chunkFrame, true);
            const cur = await waitForConfirmedSeq(seq, chunkAckTimeoutMs);
            if (fatalError) throw fatalError;
            if (cur >= seq) {
              acked = true;
              break;
            }
          }

          if (!acked) {
            throw new Error(t("errChunkTimeout", { seq, totalChunks, confirmed: confirmedSeq }));
          }

          if (seq % 20 === 0) {
            await new Promise(r => setTimeout(r, 25));
          } else {
            await new Promise(r => setTimeout(r, 8));
          }

          if (onProgress && (seq % 5 === 0 || seq === totalChunks)) {
            const pct = Math.min(100, Math.round((end / totalBytes) * 100));
            onProgress(end, totalBytes, pct);
          }
        }
      } finally {
        const idx = this.waiters.indexOf(rxWaiter);
        if (idx >= 0) this.waiters.splice(idx, 1);
        this.quietRxLog = false;
      }

      const elapsedSec = Math.max(0.1, (performance.now() - startTime) / 1000).toFixed(1);
      this.log(t("logStreamingDone", {
        confirmed: confirmedSeq,
        totalChunks,
        sec: elapsedSec,
        kbps: (totalBytes / 1024 / elapsedSec).toFixed(1),
      }));

      if (!this.isConnected || !this.writeChar) {
        throw new Error(t("errPreFinishDisconnected"));
      }

      // 3. 發送 FINISH 幀 (CMD 31, sub = 3)
      await new Promise(r => setTimeout(r, 150));

      const { totalSum, finishPayload } = SuperBandClient.buildDialFinishPayload(fileBytes);
      this.log(t("logFinishCmd", {
        totalBytes,
        sum: totalSum.toString(16).toUpperCase().padStart(8, "0"),
      }));

      const finishFrame = this.encodeCdFrame(31, 3, finishPayload);

      // 嚴格等待 CMD=32 SUB=1 status=2 (寫入並切換生效) 或致命錯誤 status (1/3/4/5/7)；絕不忽略逾時！
      const waitFinish = this.awaitFrame(f => {
        if (f.cmd === 32 && f.sub === 1) {
          const st = this.parseStatus(f);
          return st === 2 || (st !== null && isFatalStatus(st));
        }
        return false;
      }, 10000);

      await this.sendRaw(finishFrame, true);

      const finishResp = await waitFinish;
      const finishStatus = this.parseStatus(finishResp);
      if (finishStatus !== null && isFatalStatus(finishStatus)) {
        const errMsg = getFatalErrorMessage(finishStatus);
        this.log(t("logFinishFailed", { msg: errMsg }));
        throw new Error(errMsg);
      }

      this.log(t("logUploadComplete", {
        status: finishStatus,
        slot,
        ext: extLabel,
      }));
      return { success: true, status: finishStatus };
    })();
  }

  parseStatus(frame) {
    if (!frame || !frame.payload || frame.magic === 0xDC || frame.payload.length < 2) return null;
    const dv = new DataView(frame.payload.buffer, frame.payload.byteOffset, frame.payload.byteLength);
    if (frame.payload.length >= 4) {
      return dv.getInt32(0, false); // signed BE i32
    }
    return dv.getInt16(0, false);
  }
}
