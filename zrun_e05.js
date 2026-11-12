/**
 * ZRun / E05 / E87 Smart E-Badge BLE Protocol Client (v40)
 * Based on JieLi AC697 / RCSP reverse-engineered protocol (MIT references:
 * hybridherbst/web-bluetooth-e87 & jumpingmushroom/e87_badge):
 * - Image/Auth Service: 0000AE00-0000-1000-8000-00805F9B34FB (Write AE01, Notify AE02)
 * - Control Service:    C2E6FD00-E966-1000-8000-BEF9C223DF6A (Write FD02, Notify FD01/FD03/FD05)
 */
import { t } from "./i18n.js?v=41";

export const ZRUN_E05_SERVICES = {
  AE_SERVICE_UUID: "0000ae00-0000-1000-8000-00805f9b34fb",
  AE_WRITE_UUID: "0000ae01-0000-1000-8000-00805f9b34fb",
  AE_NOTIFY_UUID: "0000ae02-0000-1000-8000-00805f9b34fb",
  FD00_ADVERT_UUID: "0000fd00-0000-1000-8000-00805f9b34fb",
  FD_SERVICE_UUID: "c2e6fd00-e966-1000-8000-bef9c223df6a",
  FD_WRITE_UUID: "c2e6fd02-e966-1000-8000-bef9c223df6a",
  FD_NOTIFY_UUIDS: [
    "c2e6fd01-e966-1000-8000-bef9c223df6a",
    "c2e6fd03-e966-1000-8000-bef9c223df6a",
    "c2e6fd05-e966-1000-8000-bef9c223df6a",
  ],
  DISCOVERY_SERVICE_UUIDS: [
    "0000ae00-0000-1000-8000-00805f9b34fb",
    "0000fd00-0000-1000-8000-00805f9b34fb",
    "c2e6fd00-e966-1000-8000-bef9c223df6a",
  ],
  DEFAULT_CHUNK_SIZE: 490,
};

// ── JieLi RCSP Auth Cipher (reverse-engineered from libjl_auth.so) ──────────

const KS_TABLE = [
  0x64,0xac,0x28,0x5a,0xc9,0xb3,0x37,0xc5,0x0a,0x10,0xb7,0xa3,0xba,0xb1,0x97,0x46,
  0x3d,0x05,0xdc,0x66,0x6e,0xf6,0x9a,0xf8,0x0d,0x58,0x95,0x67,0xc6,0xaa,0xab,0xec,
  0xa0,0x68,0x9b,0x96,0xd4,0xeb,0xbf,0x43,0x49,0x36,0xe9,0x6a,0x89,0xd8,0xc3,0x8a,
  0x94,0x63,0x99,0xbc,0x7b,0xbe,0xc1,0x22,0xbb,0x5c,0x71,0xd5,0x1f,0x92,0x57,0x5d,
  0x8f,0x44,0x41,0x1d,0x51,0xe6,0x40,0x17,0xfb,0xfd,0x19,0x32,0x34,0xb8,0x61,0x2a,
  0xca,0x23,0x6f,0xda,0x39,0xf7,0xa2,0x01,0x7f,0xd6,0x31,0xe7,0xde,0x80,0x04,0xdd,
  0x2c,0x59,0x82,0xaf,0xa8,0xe0,0x0f,0xcd,0xa1,0x12,0x3e,0x30,0xd1,0x1c,0xd0,0x3a,
  0x33,0x72,0x2e,0x4f,0x90,0x02,0x13,0x06,0x75,0xce,0x87,0xc2,0xef,0xb2,0xad,0x7d,
  0x38,0x15,0xe1,0x52,0x9f,0x7a,0x6c,0x2f,0x27,0xc4,0xe2,0x81,0xa9,0xcf,0x8d,0xc0,
  0xd7,0xdf,0xff,0x60,0x76,0x14,0x8c,0x5e,0x55,0x09,0xe4,0x08,0xc7,0x42,0x20,0xfc,
  0xd2,0x50,0x91,0xd9,0x4c,0x62,0x9e,0xe8,0xb9,0xa6,0xf9,0x1a,0x00,0x21,0x0b,0xfa,
  0x35,0x9c,0x4e,0x4b,0x69,0x48,0xcb,0x0e,0xc8,0xa4,0x5b,0xea,0x84,0x07,0xb4,0x18,
  0xf4,0xae,0x6b,0xdb,0xa7,0xcc,0x3f,0x8b,0x4a,0x0c,0x3c,0x25,0xe5,0x54,0x4d,0x45,
  0x83,0xed,0x11,0xf0,0xb0,0x53,0x93,0xf2,0x74,0x26,0xb5,0x9d,0x6d,0x7c,0xf3,0x2d,
  0xf1,0x56,0x24,0x7e,0x47,0x1b,0x86,0xbd,0x70,0x8e,0x1e,0x3b,0x73,0x16,0x03,0xb6,
  0xac,0x28,0x5a,0xc9,0xb3,0x37,0xc5,0x0a,0x10,0xb7,0xa3,0xba,0xb1,0x97,0x46,0x88,
];

const SBOX = [
  0x01,0x2d,0xe2,0x93,0xbe,0x45,0x15,0xae,0x78,0x03,0x87,0xa4,0xb8,0x38,0xcf,0x3f,
  0x08,0x67,0x09,0x94,0xeb,0x26,0xa8,0x6b,0xbd,0x18,0x34,0x1b,0xbb,0xbf,0x72,0xf7,
  0x40,0x35,0x48,0x9c,0x51,0x2f,0x3b,0x55,0xe3,0xc0,0x9f,0xd8,0xd3,0xf3,0x8d,0xb1,
  0xff,0xa7,0x3e,0xdc,0x86,0x77,0xd7,0xa6,0x11,0xfb,0xf4,0xba,0x92,0x91,0x64,0x83,
  0xf1,0x33,0xef,0xda,0x2c,0xb5,0xb2,0x2b,0x88,0xd1,0x99,0xcb,0x8c,0x84,0x1d,0x14,
  0x81,0x97,0x71,0xca,0x5f,0xa3,0x8b,0x57,0x3c,0x82,0xc4,0x52,0x5c,0x1c,0xe8,0xa0,
  0x04,0xb4,0x85,0x4a,0xf6,0x13,0x54,0xb6,0xdf,0x0c,0x1a,0x8e,0xde,0xe0,0x39,0xfc,
  0x20,0x9b,0x24,0x4e,0xa9,0x98,0x9e,0xab,0xf2,0x60,0xd0,0x6c,0xea,0xfa,0xc7,0xd9,
  0x00,0xd4,0x1f,0x6e,0x43,0xbc,0xec,0x53,0x89,0xfe,0x7a,0x5d,0x49,0xc9,0x32,0xc2,
  0xf9,0x9a,0xf8,0x6d,0x16,0xdb,0x59,0x96,0x44,0xe9,0xcd,0xe6,0x46,0x42,0x8f,0x0a,
  0xc1,0xcc,0xb9,0x65,0xb0,0xd2,0xc6,0xac,0x1e,0x41,0x62,0x29,0x2e,0x0e,0x74,0x50,
  0x02,0x5a,0xc3,0x25,0x7b,0x8a,0x2a,0x5b,0xf0,0x06,0x0d,0x47,0x6f,0x70,0x9d,0x7e,
  0x10,0xce,0x12,0x27,0xd5,0x4c,0x4f,0xd6,0x79,0x30,0x68,0x36,0x75,0x7d,0xe4,0xed,
  0x80,0x6a,0x90,0x37,0xa2,0x5e,0x76,0xaa,0xc5,0x7f,0x3d,0xaf,0xa5,0xe5,0x19,0x61,
  0xfd,0x4d,0x7c,0xb7,0x0b,0xee,0xad,0x4b,0x22,0xf5,0xe7,0x73,0x23,0x21,0xc8,0x05,
  0xe1,0x66,0xdd,0xb3,0x58,0x69,0x63,0x56,0x0f,0xa1,0x31,0x95,0x17,0x07,0x3a,0x28,
];

const ISBOX = [
  0x80,0x00,0xb0,0x09,0x60,0xef,0xb9,0xfd,0x10,0x12,0x9f,0xe4,0x69,0xba,0xad,0xf8,
  0xc0,0x38,0xc2,0x65,0x4f,0x06,0x94,0xfc,0x19,0xde,0x6a,0x1b,0x5d,0x4e,0xa8,0x82,
  0x70,0xed,0xe8,0xec,0x72,0xb3,0x15,0xc3,0xff,0xab,0xb6,0x47,0x44,0x01,0xac,0x25,
  0xc9,0xfa,0x8e,0x41,0x1a,0x21,0xcb,0xd3,0x0d,0x6e,0xfe,0x26,0x58,0xda,0x32,0x0f,
  0x20,0xa9,0x9d,0x84,0x98,0x05,0x9c,0xbb,0x22,0x8c,0x63,0xe7,0xc5,0xe1,0x73,0xc6,
  0xaf,0x24,0x5b,0x87,0x66,0x27,0xf7,0x57,0xf4,0x96,0xb1,0xb7,0x5c,0x8b,0xd5,0x54,
  0x79,0xdf,0xaa,0xf6,0x3e,0xa3,0xf1,0x11,0xca,0xf5,0xd1,0x17,0x7b,0x93,0x83,0xbc,
  0xbd,0x52,0x1e,0xeb,0xae,0xcc,0xd6,0x35,0x08,0xc8,0x8a,0xb4,0xe2,0xcd,0xbf,0xd9,
  0xd0,0x50,0x59,0x3f,0x4d,0x62,0x34,0x0a,0x48,0x88,0xb5,0x56,0x4c,0x2e,0x6b,0x9e,
  0xd2,0x3d,0x3c,0x03,0x13,0xfb,0x97,0x51,0x75,0x4a,0x91,0x71,0x23,0xbe,0x76,0x2a,
  0x5f,0xf9,0xd4,0x55,0x0b,0xdc,0x37,0x31,0x16,0x74,0xd7,0x77,0xa7,0xe6,0x07,0xdb,
  0xa4,0x2f,0x46,0xf3,0x61,0x45,0x67,0xe3,0x0c,0xa2,0x3b,0x1c,0x85,0x18,0x04,0x1d,
  0x29,0xa0,0x8f,0xb2,0x5a,0xd8,0xa6,0x7e,0xee,0x8d,0x53,0x4b,0xa1,0x9a,0xc1,0x0e,
  0x7a,0x49,0xa5,0x2c,0x81,0xc4,0xc7,0x36,0x2b,0x7f,0x43,0x95,0x33,0xf2,0x6c,0x68,
  0x6d,0xf0,0x02,0x28,0xce,0xdd,0x9b,0xea,0x5e,0x99,0x7c,0x14,0x86,0xcf,0xe5,0x42,
  0xb8,0x40,0x78,0x2d,0x3a,0xe9,0x64,0x1f,0x92,0x90,0x7d,0x39,0x6f,0xe0,0x89,0x30,
];

const STATIC_KEY = [
  0x06,0x77,0x5f,0x87,0x91,0x8d,0xd4,0x23,
  0x00,0x5d,0xf1,0xd8,0xcf,0x0c,0x14,0x2b,
];
const MAGIC = [0x11, 0x22, 0x33, 0x33, 0x22, 0x11];
const MASK = 0x9999;

function keySchedule(data16) {
  const out = new Array(272).fill(0);
  for (let i = 0; i < 16; i++) out[i] = data16[i];

  const buf = data16.slice(0, 16);
  let checksum = 0;
  for (const b of data16) checksum ^= b;
  buf.push(checksum & 0xff);

  for (let rnd = 0; rnd < 16; rnd++) {
    for (let i = 0; i < 17; i++) {
      const b = buf[i];
      buf[i] = ((b << 3) | (b >>> 5)) & 0xff;
    }
    let readPos = (rnd + 1) % 17;
    for (let j = 0; j < 16; j++) {
      const src = buf[readPos];
      const tblIdx = 0x0f + rnd * 16 - j;
      out[16 + rnd * 16 + j] = (KS_TABLE[tblIdx] + src) & 0xff;
      readPos += 1;
      if (readPos > 16) readPos = 0;
    }
  }
  return out;
}

function fibonacciMix(s) {
  const M = 0xffffffff;
  let r16 = s[0], r17 = s[1], r3 = s[2], r4 = s[3];
  let r5 = s[4], r6 = s[5], r7 = s[6], r19 = s[7];
  let r20 = s[8], r21 = s[9], r22 = s[10], r23 = s[11];
  let r24 = s[12], r25 = s[13], r26 = s[14], r27 = s[15];
  let r28 = 0;

  // Stage 1
  r28 = (r17 + r16 * 2) & M; r16 = (r17 + r16) & M;
  r17 = (r4 + r3 * 2) & M;   r3 = (r4 + r3) & M;
  r4 = (r6 + r5 * 2) & M;    r5 = (r6 + r5) & M;
  r6 = (r19 + r7 * 2) & M;   r7 = (r19 + r7) & M;
  r19 = (r21 + r20 * 2) & M; r20 = (r21 + r20) & M;
  r21 = (r23 + r22 * 2) & M; r22 = (r23 + r22) & M;
  r23 = (r25 + r24 * 2) & M; r24 = (r25 + r24) & M;
  r25 = (r27 + r26 * 2) & M; r26 = (r27 + r26) & M;

  // Stage 2
  r27 = (r22 + r19 * 2) & M; r19 = (r22 + r19) & M;
  r22 = (r26 + r23 * 2) & M; r23 = (r26 + r23) & M;
  r26 = (r16 + r17 * 2) & M; r16 = (r17 + r16) & M;
  r17 = (r5 + r6 * 2) & M;   r5 = (r6 + r5) & M;
  r6 = (r20 + r21 * 2) & M;  r20 = (r21 + r20) & M;
  r21 = (r24 + r25 * 2) & M; r24 = (r25 + r24) & M;
  r25 = (r7 + r28 * 2) & M;  r7 = (r7 + r28) & M;
  r28 = (r3 + r4 * 2) & M;   r3 = (r4 + r3) & M;

  // Stage 3
  r4 = (r24 + r6 * 2) & M;   r6 = (r24 + r6) & M;
  r24 = (r3 + r25 * 2) & M;  r3 = (r25 + r3) & M;
  r25 = (r19 + r22 * 2) & M; r19 = (r22 + r19) & M;
  r22 = (r16 + r17 * 2) & M; r16 = (r17 + r16) & M;
  r17 = (r20 + r21 * 2) & M; r20 = (r21 + r20) & M;
  r21 = (r7 + r28 * 2) & M;  r7 = (r7 + r28) & M;
  r28 = (r5 + r27 * 2) & M;  r5 = (r27 + r5) & M;
  r27 = (r23 + r26 * 2) & M; r23 = (r23 + r26) & M;

  // Stage 4
  r26 = (r7 + r17 * 2) & M;  r17 = (r17 + r7) & M;
  r7 = (r23 + r28 * 2) & M;  r23 = (r23 + r28) & M;
  r28 = (r6 + r24 * 2) & M;  r6 = (r6 + r24) & M;
  r24 = (r19 + r22 * 2) & M; r19 = (r19 + r22) & M;
  r22 = (r20 + r21 * 2) & M; r20 = (r20 + r21) & M;
  r21 = (r5 + r27 * 2) & M;  r5 = (r27 + r5) & M;
  r27 = (r16 + r4 * 2) & M;  r16 = (r4 + r16) & M;
  r4 = (r3 + r25 * 2) & M;   r3 = (r25 + r3) & M;

  return [
    r26 & 0xff, r17 & 0xff, r7 & 0xff, r23 & 0xff,
    r28 & 0xff, r6 & 0xff, r24 & 0xff, r19 & 0xff,
    r22 & 0xff, r20 & 0xff, r21 & 0xff, r5 & 0xff,
    r27 & 0xff, r16 & 0xff, r4 & 0xff, r3 & 0xff,
  ];
}

function condMix(state, keyBlock, mask, phase) {
  const result = state.slice();
  for (let i = 0; i < 16; i++) {
    const bitSet = ((1 << i) & mask) !== 0;
    if (phase === 3) {
      result[i] = bitSet ? (result[i] ^ keyBlock[i]) : ((keyBlock[i] + result[i]) & 0xff);
    } else {
      result[i] = bitSet ? ((keyBlock[i] + result[i]) & 0xff) : (result[i] ^ keyBlock[i]);
    }
  }
  return result;
}

function sboxSub(state) {
  const result = state.slice();
  for (const pos of [0, 3, 4, 7, 8, 11, 12, 15]) result[pos] = SBOX[result[pos]];
  for (const pos of [1, 2, 5, 6, 9, 10, 13, 14]) result[pos] = ISBOX[result[pos]];
  return result;
}

function blockCipher(stateIn, ek, mode) {
  let s = stateIn.slice();
  const initial = stateIn.slice();

  s = condMix(s, ek.slice(0, 16), MASK, 3);
  s = sboxSub(s);
  s = condMix(s, ek.slice(16, 32), MASK, 5);

  for (let x9 = 1; x9 <= 8; x9++) {
    s = fibonacciMix(s);
    const ekOff = x9 * 0x20;
    if (x9 === 8) {
      s = condMix(s, ek.slice(0x100, 0x110), MASK, 3);
      break;
    }
    if (mode !== 0 && x9 === 2) {
      for (let i = 0; i < 16; i++) {
        const bitSet = ((1 << i) & MASK) !== 0;
        s[i] = bitSet ? (s[i] ^ initial[i]) : ((initial[i] + s[i]) & 0xff);
      }
    }
    s = condMix(s, ek.slice(ekOff, ekOff + 16), MASK, 3);
    s = sboxSub(s);
    s = condMix(s, ek.slice(ekOff + 16, ekOff + 32), MASK, 5);
  }
  return s;
}

export function jlFunctionE1test(key6, input16, seed16) {
  const expandedKey = Array.from({ length: 16 }, (_, i) => key6[i % 6]);
  const output = input16.slice(0, 16);
  const ks1 = keySchedule(seed16.slice(0, 16));
  const cipherOut = blockCipher(output, ks1, 0);

  for (let i = 0; i < 16; i++) {
    cipherOut[i] = (expandedKey[i] + (cipherOut[i] ^ input16[i])) & 0xff;
  }

  const obf = [
    (seed16[0] - 0x17) & 0xff, (seed16[1] ^ 0xe5),
    (seed16[2] - 0x21) & 0xff, (seed16[3] ^ 0xc1),
    (seed16[4] - 0x4d) & 0xff, (seed16[5] ^ 0xa7),
    (seed16[6] - 0x6b) & 0xff, (seed16[7] ^ 0x83),
    (seed16[8] ^ 0xe9),        (seed16[9] - 0x1b) & 0xff,
    (seed16[10] ^ 0xdf),       (seed16[11] - 0x3f) & 0xff,
    (seed16[12] ^ 0xb3),       (seed16[13] - 0x59) & 0xff,
    (seed16[14] ^ 0x95),       (seed16[15] - 0x7d) & 0xff,
  ];
  const ks2 = keySchedule(obf);
  return blockCipher(cipherOut, ks2, 1);
}

export function jlGetRandomAuthData() {
  const result = new Uint8Array(17);
  result[0] = 0x00;
  if (globalThis.crypto?.getRandomValues) {
    globalThis.crypto.getRandomValues(result.subarray(1));
  } else {
    for (let i = 1; i < 17; i++) result[i] = (Math.random() * 256) | 0;
  }
  return result;
}

export function jlGetEncryptedAuthData(deviceData17) {
  const input16 = Array.from(deviceData17.subarray(1, 17));
  const encrypted = jlFunctionE1test(MAGIC, input16, STATIC_KEY);
  const result = new Uint8Array(17);
  result[0] = 0x01;
  for (let i = 0; i < 16; i++) result[i + 1] = encrypted[i];
  return result;
}

// ── Wire Framing, Checksum & Utilities ──────────────────────────────────────

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const toHex = (bytes) => Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");

function hexToBytes(hex) {
  const clean = hex.replace(/[^0-9a-fA-F]/g, "");
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < clean.length; i += 2) {
    out[i / 2] = Number.parseInt(clean.slice(i, i + 2), 16);
  }
  return out;
}

export function crc16xmodem(data) {
  let crc = 0x0000;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i] << 8;
    for (let j = 0; j < 8; j++) {
      crc = (crc & 0x8000) ? (((crc << 1) ^ 0x1021) & 0xffff) : ((crc << 1) & 0xffff);
    }
  }
  return crc;
}

export function buildFeFrame(flag, cmd, body = new Uint8Array(0)) {
  const out = new Uint8Array(8 + body.length);
  out[0] = 0xfe;
  out[1] = 0xdc;
  out[2] = 0xba;
  out[3] = flag & 0xff;
  out[4] = cmd & 0xff;
  out[5] = (body.length >> 8) & 0xff;
  out[6] = body.length & 0xff;
  if (body.length) out.set(body, 7);
  out[out.length - 1] = 0xef;
  return out;
}

export function parseFeFrame(raw) {
  if (!raw || raw.length < 8) return null;
  if (raw[0] !== 0xfe || raw[1] !== 0xdc || raw[2] !== 0xba) return null;
  if (raw[raw.length - 1] !== 0xef) return null;
  const flag = raw[3];
  const cmd = raw[4];
  const length = (raw[5] << 8) | raw[6];
  const body = raw.subarray(7, raw.length - 1);
  if (body.length !== length) return null;
  return { flag, cmd, length, body };
}

export function splitFePackets(raw) {
  if (!raw || raw.length < 8) return [raw];
  if (parseFeFrame(raw)) return [raw];
  const out = [];
  for (let i = 0; i <= raw.length - 8; i++) {
    if (raw[i] === 0xfe && raw[i + 1] === 0xdc && raw[i + 2] === 0xba) {
      const length = (raw[i + 5] << 8) | raw[i + 6];
      const end = i + 7 + length;
      if (end < raw.length && raw[end] === 0xef) {
        out.push(raw.subarray(i, end + 1));
        i = end;
      }
    }
  }
  return out.length ? out : [raw];
}

export function buildQixFrame(cmd, payload, flag) {
  const inner = new Uint8Array(4 + payload.length);
  inner[0] = flag & 0xff;
  inner[1] = cmd & 0xff;
  inner[2] = payload.length & 0xff;
  inner[3] = (payload.length >> 8) & 0xff;
  inner.set(payload, 4);
  let chk = 0;
  for (const b of inner) chk = (chk + b) & 0xff;
  const out = new Uint8Array(2 + inner.length);
  out[0] = 0x9e;
  out[1] = chk;
  out.set(inner, 2);
  return out;
}

export function parseQixFrame(raw) {
  if (!raw || raw.length < 6 || raw[0] !== 0x9e) return null;
  const flag = raw[2];
  const cmd = raw[3];
  const plen = raw[4] | (raw[5] << 8);
  if (raw.length < 6 + plen) return null;
  return { flag, cmd, payload: raw.subarray(6, 6 + plen) };
}

// ── ZRun / E87 / E05 RIFF MJPG AVI Container Builder ────────────────────────

const fourcc = (s) => Uint8Array.from([
  s.charCodeAt(0) & 0xff, s.charCodeAt(1) & 0xff, s.charCodeAt(2) & 0xff, s.charCodeAt(3) & 0xff,
]);

function u32le(v) {
  return Uint8Array.of(v & 0xff, (v >>> 8) & 0xff, (v >>> 16) & 0xff, (v >>> 24) & 0xff);
}

function u16le(v) {
  return Uint8Array.of(v & 0xff, (v >>> 8) & 0xff);
}

function concatBytes(...parts) {
  let total = 0;
  for (const p of parts) total += p.length;
  const out = new Uint8Array(total);
  let off = 0;
  for (const p of parts) {
    out.set(p, off);
    off += p.length;
  }
  return out;
}

function riffChunk(id, data) {
  const paddedLen = data.length + (data.length & 1);
  const out = new Uint8Array(8 + paddedLen);
  out.set(fourcc(id), 0);
  out.set(u32le(data.length), 4);
  out.set(data, 8);
  return out;
}

function riffList(type, ...children) {
  const inner = concatBytes(fourcc(type), ...children);
  const out = new Uint8Array(8 + inner.length);
  out.set(fourcc("LIST"), 0);
  out.set(u32le(inner.length), 4);
  out.set(inner, 8);
  return out;
}

/**
 * Build ZRun-compatible MJPG AVI container (vprp + OpenDML placeholder + JUNK aligned movi @ ~5742).
 * Accepts numeric fps OR rational timing object `{ scale, rate, usPerFrame, fps }`.
 */
export function buildZrunMjpgAvi(jpegFrames, width = 360, height = 360, timing = 5) {
  if (!jpegFrames || jpegFrames.length === 0) {
    throw new Error("buildZrunMjpgAvi requires at least one frame");
  }

  let scale = 1;
  let rate = 5;
  let usPerFrame = 200000;
  let intFps = 5;
  if (typeof timing === "object" && timing !== null) {
    scale = Math.max(1, Math.round(timing.scale || 1));
    rate = Math.max(1, Math.round(timing.rate || 1));
    usPerFrame = Math.max(1, Math.round(timing.usPerFrame || Math.round((1000000 * scale) / rate)));
    intFps = Math.max(1, Math.round(rate / scale));
  } else {
    const fps = Math.max(0.1, Number(timing) || 5);
    scale = fps < 1 ? 10 : 1;
    rate = fps < 1 ? Math.max(1, Math.round(fps * 10)) : Math.max(1, Math.round(fps));
    usPerFrame = Math.round(1000000 / fps);
    intFps = Math.max(1, Math.round(fps));
  }

  const totalFrames = jpegFrames.length;
  const maxFrameSize = jpegFrames.reduce((m, f) => Math.max(m, f.length), 0);

  const avih = riffChunk("avih", concatBytes(
    u32le(usPerFrame),
    u32le(25000),
    u32le(0),
    u32le(0x0910),
    u32le(totalFrames),
    u32le(0),
    u32le(1),
    u32le(0x00100000),
    u32le(width),
    u32le(height),
    new Uint8Array(16)
  ));

  const strh = riffChunk("strh", concatBytes(
    fourcc("vids"),
    fourcc("MJPG"),
    u32le(0),
    u16le(0),
    u16le(0),
    u32le(0),
    u32le(scale),
    u32le(rate),
    u32le(0),
    u32le(totalFrames),
    u32le(maxFrameSize),
    u32le(0xffffffff),
    u32le(0),
    u16le(0), u16le(0), u16le(width), u16le(height)
  ));

  const strf = riffChunk("strf", concatBytes(
    u32le(40),
    u32le(width),
    u32le(height),
    u16le(1),
    u16le(24),
    fourcc("MJPG"),
    u32le(width * height * 3),
    u32le(0), u32le(0), u32le(0), u32le(0)
  ));

  const junkSuper = new Uint8Array(4120);
  junkSuper[0] = 0x04;
  junkSuper.set(fourcc("00dc"), 8);
  const strl = riffList("strl", strh, strf, riffChunk("JUNK", junkSuper));

  const vprp = riffChunk("vprp", concatBytes(
    u32le(0),
    u32le(0),
    u32le(intFps),
    u32le(width),
    u32le(height),
    u32le(1 | (1 << 16)),
    u32le(width),
    u32le(height),
    u32le(1),
    u32le(width),
    u32le(height),
    u32le(width),
    u32le(height),
    u32le(0), u32le(0), u32le(0), u32le(0)
  ));

  const hdrl = riffList("hdrl", avih, strl, vprp, riffChunk("JUNK", new Uint8Array(260)));
  const isft = riffChunk("ISFT", new TextEncoder().encode("AviBuilder\0"));
  const info = riffList("INFO", isft);

  const headerSoFar = 12 + hdrl.length + info.length + 8;
  const junkAlignSize = Math.max(0, 5742 - headerSoFar - 8);
  const junkAlign = riffChunk("JUNK", new Uint8Array(junkAlignSize));

  const moviChildren = jpegFrames.map((f) => riffChunk("00dc", f));
  const movi = riffList("movi", ...moviChildren);

  const idx1Parts = [];
  let offset = 4;
  for (const frame of jpegFrames) {
    idx1Parts.push(fourcc("00dc"), u32le(0x10), u32le(offset), u32le(frame.length));
    offset += 8 + frame.length + (frame.length & 1);
  }
  const idx1 = riffChunk("idx1", concatBytes(...idx1Parts));

  const riffBody = concatBytes(fourcc("AVI "), hdrl, info, junkAlign, movi, idx1);
  return concatBytes(fourcc("RIFF"), u32le(riffBody.length), riffBody);
}

// ── E05 / E87 / ZRun Protocol Session ───────────────────────────────────────

const normUuid = (u) => (typeof u === "number" ? u.toString(16).padStart(4, "0") : String(u).toLowerCase().replace(/[^0-9a-f]/g, ""));
const uuidContains = (uuid, candidates) => {
  const n = normUuid(uuid);
  return candidates.some((c) => n.includes(normUuid(c)));
};

async function writeCharacteristic(char, data) {
  const buf = Uint8Array.from(data);
  if (char.properties?.writeWithoutResponse && char.writeValueWithoutResponse) {
    await char.writeValueWithoutResponse(buf);
    return;
  }
  if (char.writeValueWithResponse) {
    await char.writeValueWithResponse(buf);
    return;
  }
  await char.writeValue(buf);
}

function tryDecodeAscii(data) {
  if (!data || !data.length) return undefined;
  for (const b of data) {
    if (b < 0x20 || b > 0x7e) return undefined;
  }
  return new TextDecoder().decode(data);
}

export class ZrunE05Session {
  constructor(logger = console.log) {
    this.logger = logger;
    this.device = null;
    this.server = null;
    this.writeChar = null;   // AE01
    this.controlChar = null; // FD02
    this.notifyChars = [];   // AE02 + FD01/FD03/FD05
    this.notificationQueue = [];
    this.isAuthenticated = false;
    this.authInFlight = null;
    this.rcspSeq = 1;
    this.qixSeq = 0;
    this.batteryLevel = null;
    this.screenWidth = 360;
    this.screenHeight = 360;
    this.freeMemoryBytes = null;
    this._onNotify = null;
  }

  log(msg) {
    if (this.logger) this.logger(msg);
  }

  get isAttached() {
    return !!(this.server && this.server.connected && this.writeChar && this.controlChar);
  }

  async tryAttach(device, server, discoveredServices = []) {
    const services = [...discoveredServices];
    const seen = new Set(services.map((s) => s.uuid));
    for (const uuid of [ZRUN_E05_SERVICES.AE_SERVICE_UUID, ZRUN_E05_SERVICES.FD_SERVICE_UUID]) {
      if (!seen.has(uuid)) {
        try {
          const s = await server.getPrimaryService(uuid);
          services.push(s);
          seen.add(s.uuid);
        } catch (_) {}
      }
    }

    const writable = [];
    const notifiable = [];
    for (const svc of services) {
      if (!uuidContains(svc.uuid, [0xae00, ZRUN_E05_SERVICES.FD_SERVICE_UUID, 0xfd00])) continue;
      let chars = [];
      try { chars = await svc.getCharacteristics(); } catch (_) { continue; }
      for (const c of chars) {
        const p = c.properties || {};
        if (p.write || p.writeWithoutResponse) writable.push(c);
        if (p.notify || p.indicate) notifiable.push(c);
      }
    }

    const writeChar = writable.find((c) => uuidContains(c.uuid, [0xae01, ZRUN_E05_SERVICES.AE_WRITE_UUID]));
    const controlChar = writable.find((c) => uuidContains(c.uuid, [ZRUN_E05_SERVICES.FD_WRITE_UUID]));
    if (!writeChar || !controlChar) return false;

    const notifyPreferred = notifiable.filter((c) => uuidContains(c.uuid, [
      0xae02,
      ZRUN_E05_SERVICES.AE_NOTIFY_UUID,
      ...ZRUN_E05_SERVICES.FD_NOTIFY_UUIDS,
    ]));
    const notifyChars = notifyPreferred.length ? notifyPreferred : notifiable;
    if (!notifyChars.length) return false;

    this.device = device;
    this.server = server;
    this.writeChar = writeChar;
    this.controlChar = controlChar;
    this.notifyChars = notifyChars;
    this.notificationQueue = [];
    this.isAuthenticated = false;
    this.authInFlight = null;
    this.rcspSeq = 1;
    this.qixSeq = 0;

    this._onNotify = (event) => {
      const target = event.target;
      const val = target?.value;
      if (!val) return;
      const raw = new Uint8Array(val.buffer.slice(val.byteOffset, val.byteOffset + val.byteLength));
      for (const pkt of splitFePackets(raw)) {
        const frame = parseFeFrame(pkt);
        if (frame && (frame.flag & 0xc0) === 0xc0 && frame.cmd !== 0x20 && frame.cmd !== 0x1c && frame.cmd !== 0x1d) {
          const deviceSeq = frame.body[0] ?? 0;
          const resp = buildFeFrame(0x00, frame.cmd, Uint8Array.of(0x00, deviceSeq));
          writeCharacteristic(this.writeChar, resp).catch(() => {});
          continue;
        }
        this.notificationQueue.push(pkt);
        if (this.notificationQueue.length > 250) this.notificationQueue.shift();
      }
    };

    for (const c of this.notifyChars) {
      c.addEventListener("characteristicvaluechanged", this._onNotify);
      await c.startNotifications();
    }

    this.log(t("logZrunAutoDetected"));
    return true;
  }

  async disconnect() {
    for (const c of this.notifyChars) {
      try {
        if (this._onNotify) c.removeEventListener("characteristicvaluechanged", this._onNotify);
        await c.stopNotifications();
      } catch (_) {}
    }
    this.cleanup();
  }

  cleanup() {
    this.server = null;
    this.writeChar = null;
    this.controlChar = null;
    this.notifyChars = [];
    this.notificationQueue = [];
    this.isAuthenticated = false;
    this.authInFlight = null;
    this._onNotify = null;
  }

  _nextRcspSeq() {
    const out = this.rcspSeq & 0xff;
    this.rcspSeq = (this.rcspSeq + 1) & 0xff;
    if (this.rcspSeq === 0) this.rcspSeq = 1;
    return out;
  }

  _nextQixSeq() {
    const out = this.qixSeq & 0x0f;
    this.qixSeq = (this.qixSeq + 1) & 0x0f;
    return out;
  }

  async _waitRaw(queue, predicate, timeoutMs, label) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      for (let i = 0; i < queue.length; i++) {
        if (predicate(queue[i])) {
          const item = queue[i];
          queue.splice(i, 1);
          return item;
        }
      }
      await sleep(20);
    }
    throw new Error(`Timeout waiting for ${label}`);
  }

  async _waitFrame(queue, predicate, timeoutMs, label) {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      for (let i = 0; i < queue.length; i++) {
        const frame = parseFeFrame(queue[i]);
        if (frame && predicate(frame)) {
          queue.splice(i, 1);
          return frame;
        }
      }
      await sleep(20);
    }
    throw new Error(`Timeout waiting for ${label}`);
  }

  async ensureAuth() {
    if (this.isAuthenticated) return;
    if (this.authInFlight) {
      await this.authInFlight;
      return;
    }

    this.authInFlight = (async () => {
      const mirrorQueue = [...this.notificationQueue];
      const onMirror = (event) => {
        const val = event.target?.value;
        if (!val) return;
        mirrorQueue.push(new Uint8Array(val.buffer.slice(val.byteOffset, val.byteOffset + val.byteLength)));
        if (mirrorQueue.length > 200) mirrorQueue.shift();
      };
      for (const c of this.notifyChars) c.addEventListener("characteristicvaluechanged", onMirror);

      try {
        this.log(t("logZrunAuthStart"));
        await writeCharacteristic(this.writeChar, jlGetRandomAuthData());
        await this._waitRaw(mirrorQueue, (r) => r.length === 17 && r[0] === 0x01, 5000, "E05 auth response");

        await writeCharacteristic(this.writeChar, Uint8Array.of(0x02, 0x70, 0x61, 0x73, 0x73));
        const challenge = await this._waitRaw(mirrorQueue, (r) => r.length === 17 && r[0] === 0x00, 5000, "E05 challenge");

        await writeCharacteristic(this.writeChar, jlGetEncryptedAuthData(challenge));
        await this._waitRaw(
          mirrorQueue,
          (r) => r.length >= 5 && r[0] === 0x02 && r[1] === 0x70 && r[2] === 0x61 && r[3] === 0x73 && r[4] === 0x73,
          5000,
          "E05 auth pass confirmation"
        );
        this.isAuthenticated = true;
        this.log(t("logZrunAuthSuccess"));
      } finally {
        for (const c of this.notifyChars) c.removeEventListener("characteristicvaluechanged", onMirror);
      }
    })();

    try {
      await this.authInFlight;
    } finally {
      this.authInFlight = null;
    }
  }

  async _sendQixAndWait(cmd, payload, respCmd, timeoutMs = 4000) {
    const seq = this._nextQixSeq();
    const flag = ((seq & 0x0f) << 3) | 0x02;
    await writeCharacteristic(this.controlChar, buildQixFrame(cmd, payload, flag));
    const raw = await this._waitRaw(
      this.notificationQueue,
      (r) => {
        const q = parseQixFrame(r);
        return q !== null && q.cmd === respCmd;
      },
      timeoutMs,
      `Qix 0x${respCmd.toString(16)}`
    );
    return parseQixFrame(raw);
  }

  async _sendRcspAndWait(cmd, paramData, timeoutMs = 5000) {
    const seq = this._nextRcspSeq();
    const body = new Uint8Array(1 + paramData.length);
    body[0] = seq;
    body.set(paramData, 1);
    await writeCharacteristic(this.writeChar, buildFeFrame(0xc0, cmd, body));
    const ack = await this._waitFrame(
      this.notificationQueue,
      (f) => f.cmd === cmd && ((f.body.length >= 2 && f.body[1] === seq) || ((f.flag & 0x80) === 0 && f.body.length >= 1)),
      timeoutMs,
      `RCSP cmd 0x${cmd.toString(16)}`
    );
    const status = ack.body[0] ?? 0xff;
    if (status !== 0x00) {
      throw new Error(`RCSP cmd 0x${cmd.toString(16)} failed status=0x${status.toString(16)}`);
    }
    return ack;
  }

  async getScreenInfo() {
    try {
      const resp = await this._sendQixAndWait(0xc6, Uint8Array.of(0x01), 0xc7, 3500);
      if (resp && resp.payload.length >= 9 && resp.payload[0] === 0x01) {
        const width = resp.payload[1] | (resp.payload[2] << 8);
        const height = resp.payload[3] | (resp.payload[4] << 8);
        const pictureWidth = resp.payload[5] | (resp.payload[6] << 8);
        const pictureHeight = resp.payload[7] | (resp.payload[8] << 8);
        const memory = resp.payload.length >= 13
          ? ((resp.payload[9] | (resp.payload[10] << 8) | (resp.payload[11] << 16) | (resp.payload[12] << 24)) >>> 0)
          : 0;
        const w = pictureWidth > 0 ? pictureWidth : width;
        const h = pictureHeight > 0 ? pictureHeight : height;
        if (w > 0 && h > 0) {
          this.screenWidth = w;
          this.screenHeight = h;
        }
        const memKb = memory > 0 ? (memory < 65536 ? memory : memory / 1024) : null;
        this.freeMemoryBytes = memKb != null ? Math.round(memKb * 1024) : null;
        this.log(t("logZrunScreenInfo", {
          w: width || w || 360,
          h: height || h || 360,
          pw: pictureWidth || w || 360,
          ph: pictureHeight || h || 360,
          mem: memKb != null ? `${memKb.toFixed(1)} KB` : "-",
        }));
        return { width, height, pictureWidth, pictureHeight, memory, freeKb: memKb };
      }
    } catch (_) {}
    return null;
  }

  async getBatteryLevel() {
    try {
      const resp = await this._sendQixAndWait(0x29, Uint8Array.of(0x80), 0x27, 3000);
      if (resp && resp.payload.length >= 2 && resp.payload[1] > 0) {
        this.batteryLevel = resp.payload[1];
        return this.batteryLevel;
      }
    } catch (_) {}
    try {
      const bas = await this.server.getPrimaryService(0x180f);
      const battChar = await bas.getCharacteristic(0x2a19);
      const val = await battChar.readValue();
      this.batteryLevel = val.getUint8(0);
      return this.batteryLevel;
    } catch (_) {}
    return null;
  }

  async getTargetInfo() {
    try {
      const ack = await this._sendRcspAndWait(0x03, Uint8Array.of(0xff, 0xff, 0xff, 0xff, 0x01), 4000);
      const payload = ack.body.subarray(2);
      const attrs = {};
      let i = 0;
      while (i < payload.length) {
        const attrLen = payload[i] ?? 0;
        if (attrLen < 1 || i + 1 + attrLen > payload.length) break;
        const type = payload[i + 1];
        const data = payload.subarray(i + 2, i + 1 + attrLen);
        const ascii = tryDecodeAscii(data);
        if (ascii) attrs[type] = ascii;
        i += 1 + attrLen;
      }
      return attrs;
    } catch (_) {
      return {};
    }
  }

  async getRemainingSpace() {
    if (!this.isAttached) throw new Error(t("errNotConnected"));
    await this.ensureAuth();
    const screen = await this.getScreenInfo();
    if (screen && screen.freeKb > 0) {
      return screen.freeKb;
    }
    return null;
  }

  async getDeviceInfo() {
    if (!this.isAttached) throw new Error(t("errNotConnected"));
    await this.ensureAuth();

    let modelName = this.device?.name || "E05";
    let fwVersion = "v1.0";
    try {
      const dis = await this.server.getPrimaryService("0000180a-0000-1000-8000-00805f9b34fb");
      try {
        const mc = await dis.getCharacteristic("00002a24-0000-1000-8000-00805f9b34fb");
        const mv = new TextDecoder().decode(await mc.readValue()).replace(/\0/g, "").trim();
        if (mv) modelName = mv;
      } catch (_) {}
      try {
        const fc = await dis.getCharacteristic("00002a26-0000-1000-8000-00805f9b34fb");
        const fv = new TextDecoder().decode(await fc.readValue()).replace(/\0/g, "").trim();
        if (fv) fwVersion = fv;
      } catch (_) {}
    } catch (_) {}

    const targetAttrs = await this.getTargetInfo();
    if (targetAttrs[16]) modelName = targetAttrs[16];
    if (targetAttrs[5] || targetAttrs[31]) fwVersion = targetAttrs[31] || targetAttrs[5];

    const screen = await this.getScreenInfo();
    const batt = await this.getBatteryLevel();
    const freeKb = screen && screen.freeKb > 0 ? screen.freeKb : null;

    const protoDesc = batt != null
      ? `ZRun RCSP (AE00 • ${batt}%)`
      : "ZRun RCSP (AE00 + FD00)";

    return {
      deviceName: modelName,
      deviceVersion: fwVersion,
      protocolVersion: protoDesc,
      detectedResolution: `${this.screenWidth} x ${this.screenHeight}`,
      freeStorage: freeKb != null ? Math.round(freeKb * 1024) : null,
      freeStorageKb: freeKb,
      activePhotoCount: 0,
      batteryPct: batt,
    };
  }

  _buildFilePathResponse(deviceSeq, ext) {
    const now = new Date();
    const stamp = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
    const devicePath = `\u555c${stamp}.${ext}`;
    const utf16 = new Uint8Array(devicePath.length * 2 + 2);
    for (let i = 0; i < devicePath.length; i++) {
      const code = devicePath.charCodeAt(i);
      utf16[i * 2] = code & 0xff;
      utf16[i * 2 + 1] = (code >> 8) & 0xff;
    }
    const resp = new Uint8Array(2 + utf16.length);
    resp[0] = 0x00;
    resp[1] = deviceSeq & 0xff;
    resp.set(utf16, 2);
    return resp;
  }

  async uploadFile(rawFileBytes, onProgress = null, options = {}) {
    if (!this.isAttached) throw new Error(t("errNotConnected"));
    const payloadBytes = rawFileBytes instanceof Uint8Array ? rawFileBytes : new Uint8Array(rawFileBytes);
    const isJpeg = (options.isAvi === 0) ||
      (options.isAvi == null && payloadBytes.length >= 2 && payloadBytes[0] === 0xff && payloadBytes[1] === 0xd8);
    const ext = isJpeg ? "jpg" : "avi";
    const cancelRequested = options.cancelRequested || (() => false);
    const interChunkDelayMs = options.interChunkDelayMs ?? 0;

    await this.ensureAuth();
    this.log(t("logZrunUploadStart", { bytes: payloadBytes.length, ext }));

    const uploadQueue = [];
    const recentRxTrace = [];
    const recordRxTrace = (uuid, raw) => {
      const tag = normUuid(uuid).slice(-4).toUpperCase();
      const fe = parseFeFrame(raw);
      const entry = fe
        ? `${tag}:FE[f=${fe.flag.toString(16).padStart(2, "0")},c=${fe.cmd.toString(16).padStart(2, "0")},b=${toHex(fe.body.subarray(0, 12))}]`
        : `${tag}:RAW(${raw.length})[${toHex(raw.subarray(0, 14))}]`;
      recentRxTrace.push(entry);
      if (recentRxTrace.length > 18) recentRxTrace.shift();
    };

    const onMirror = (event) => {
      const val = event.target?.value;
      if (!val) return;
      const raw = new Uint8Array(val.buffer.slice(val.byteOffset, val.byteOffset + val.byteLength));
      for (const pkt of splitFePackets(raw)) {
        recordRxTrace(event.target?.uuid || "", pkt);
        uploadQueue.push(pkt);
        if (uploadQueue.length > 300) uploadQueue.shift();
      }
    };

    let fileCompleteAutoRespond = false;
    let fileCompleteHandled = false;
    const onFileCompleteFast = (event) => {
      if (!fileCompleteAutoRespond || fileCompleteHandled) return;
      const val = event.target?.value;
      if (!val) return;
      const raw = new Uint8Array(val.buffer.slice(val.byteOffset, val.byteOffset + val.byteLength));
      for (const pkt of splitFePackets(raw)) {
        const frame = parseFeFrame(pkt);
        if (frame && frame.cmd === 0x20 && frame.flag === 0xc0) {
          fileCompleteHandled = true;
          const deviceSeq = frame.body[0] ?? 0;
          const respFrame = buildFeFrame(0x00, 0x20, this._buildFilePathResponse(deviceSeq, ext));
          writeCharacteristic(this.writeChar, respFrame).catch(() => {});
          break;
        }
      }
    };

    for (const c of this.notifyChars) {
      c.addEventListener("characteristicvaluechanged", onMirror);
      c.addEventListener("characteristicvaluechanged", onFileCompleteFast);
    }

    const sendFe = async (flag, cmd, body) => {
      await writeCharacteristic(this.writeChar, buildFeFrame(flag, cmd, body));
    };

    let seqCounter = 0x00;
    const abortSession = async () => {
      try {
        await sendFe(0xc0, 0x1c, Uint8Array.of(seqCounter & 0xff, 0x00));
        seqCounter = (seqCounter + 1) & 0xff;
      } catch (_) {}
    };

    try {
      // Phase 1: reset auth flag
      await sendFe(0xc0, 0x06, Uint8Array.of(0x00, 0x01));
      seqCounter = 0x01;
      try { await writeCharacteristic(this.controlChar, hexToBytes("9EBD0B600D0003")); } catch (_) {}
      try { await this._waitFrame(uploadQueue, (f) => f.cmd === 0x06, 900, "ack 0x06"); } catch (_) {}

      // Phase 2: FD02 time sync & session control
      const now = new Date();
      const timePayload = new Uint8Array([
        0x9e, 0x45, 0x08, 0x02, 0x07, 0x00,
        now.getFullYear() & 0xff, (now.getFullYear() >> 8) & 0xff,
        now.getMonth() + 1, now.getDate(), 0x00,
        now.getHours(), now.getMinutes(),
      ]);
      try {
        await writeCharacteristic(this.controlChar, timePayload);
        await sleep(20);
        await writeCharacteristic(this.controlChar, hexToBytes("9E200816010001"));
        await sleep(20);
        await writeCharacteristic(this.controlChar, hexToBytes("9EB50B29010080"));
        await sleep(150);
      } catch (_) {}

      // Phase 3 & 4: best-effort 0x03 & 0x07 queries
      try {
        await sendFe(0xc0, 0x03, Uint8Array.of(seqCounter++, 0xff, 0xff, 0xff, 0xff, 0x01));
        await writeCharacteristic(this.controlChar, hexToBytes("9ED30BC6010001"));
        await sleep(20);
        await writeCharacteristic(this.controlChar, hexToBytes("9E3008200200FF07"));
        await this._waitFrame(uploadQueue, (f) => f.cmd === 0x03, 1200, "ack 0x03");
      } catch (_) {}

      try {
        await sendFe(0xc0, 0x07, Uint8Array.of(seqCounter++, 0xff, 0xff, 0xff, 0xff, 0xff));
        await writeCharacteristic(this.controlChar, hexToBytes("9E2B08FF02002200"));
        await sleep(30);
        await writeCharacteristic(this.controlChar, hexToBytes("9E2D08FF02002400"));
        await this._waitFrame(uploadQueue, (f) => f.cmd === 0x07, 1200, "ack 0x07");
      } catch (_) {}

      // Phase 5: FD02 bootstrap
      try {
        await writeCharacteristic(this.controlChar, hexToBytes("9EB50B29010080"));
        await sleep(250);
        await writeCharacteristic(this.controlChar, hexToBytes("9ED30BC6010001"));
        try {
          await this._waitRaw(uploadQueue, (r) => r.length >= 5 && r[0] === 0x9e && (r[3] === 0xc7 || r[2] === 0xc7), 1500, "FD01 C7");
        } catch (_) {}
        await writeCharacteristic(this.controlChar, hexToBytes("9EF40BDC01000C"));
        try {
          await this._waitRaw(uploadQueue, (r) => r.length >= 4 && r[0] === 0x9e && r[1] === 0xe6, 1200, "FD03 ready");
        } catch (_) {}
      } catch (_) {}

      // Phase 6: cmd 0x21 (begin upload)
      await sendFe(0xc0, 0x21, Uint8Array.of(seqCounter++, 0x00));
      await this._waitFrame(uploadQueue, (f) => f.cmd === 0x21, 8000, "ack 0x21");

      // Phase 7: cmd 0x27 (transfer params)
      await sendFe(0xc0, 0x27, Uint8Array.of(seqCounter++, 0x00, 0x00, 0x00, 0x00, 0x02, 0x01));
      await this._waitFrame(uploadQueue, (f) => f.cmd === 0x27, 8000, "ack 0x27");

      // Phase 8: cmd 0x1B (file metadata + whole-file CRC-16/XMODEM + 8-hex ASCII .tmp filename)
      const fileSize = payloadBytes.length;
      const randHex8 = Array.from({ length: 8 }, () => Math.floor(Math.random() * 16).toString(16)).join("");
      const tempName = `${randHex8}.tmp`;
      const nameBytes = new TextEncoder().encode(tempName);
      const fileCrc = crc16xmodem(payloadBytes);
      const metaBody = new Uint8Array(8 + nameBytes.length);
      metaBody[0] = seqCounter++;
      metaBody[1] = (fileSize >>> 24) & 0xff;
      metaBody[2] = (fileSize >>> 16) & 0xff;
      metaBody[3] = (fileSize >>> 8) & 0xff;
      metaBody[4] = fileSize & 0xff;
      metaBody[5] = (fileCrc >> 8) & 0xff;
      metaBody[6] = fileCrc & 0xff;
      metaBody.set(nameBytes, 7);
      metaBody[metaBody.length - 1] = 0x00;

      await sendFe(0xc0, 0x1b, metaBody);
      const metaAck = await this._waitFrame(uploadQueue, (f) => f.cmd === 0x1b, 8000, "ack 0x1b");
      const metaStatus = metaAck.body[0] ?? 0xff;
      const metaAckHex = toHex(metaAck.body);
      let chunkSize = ZRUN_E05_SERVICES.DEFAULT_CHUNK_SIZE;
      if (metaAck.body.length >= 4) {
        const hint = (metaAck.body[2] << 8) | metaAck.body[3];
        if (hint > 0 && hint <= 4096) chunkSize = hint;
      }
      this.log(t("logZrunUploadChunkHint", {
        chunkSize,
        crc: fileCrc.toString(16).toUpperCase().padStart(4, "0"),
        ackHex: metaAckHex,
      }));
      if (metaStatus !== 0x00) {
        throw new Error(t("errZrunMetaStatus", {
          status: metaStatus.toString(16).padStart(2, "0"),
          hex: metaAckHex,
        }));
      }

      // Phase 9: windowed flow-controlled transfer
      let seq = seqCounter & 0xff;
      let totalBytesSent = 0;
      let maxOffsetDelivered = 0;
      let fileFullySent = false;
      const postEofResends = new Map();

      fileCompleteAutoRespond = true;
      fileCompleteHandled = false;

      const sendWindow = async (offset, winSize) => {
        let slot = 0;
        let bytesInWin = 0;
        while (bytesInWin < winSize) {
          if (cancelRequested()) throw new Error("Upload cancelled");
          const chunkOffset = offset + bytesInWin;
          if (chunkOffset >= payloadBytes.length) break;

          const remaining = Math.min(winSize - bytesInWin, payloadBytes.length - chunkOffset);
          const chunkLen = Math.min(chunkSize, remaining);
          const piece = payloadBytes.subarray(chunkOffset, chunkOffset + chunkLen);
          const isCommitChunk = offset === 0 && winSize <= chunkSize;

          const crc = crc16xmodem(piece);
          const body = new Uint8Array(5 + piece.length);
          body[0] = seq & 0xff;
          body[1] = 0x1d;
          body[2] = slot & 0xff;
          body[3] = (crc >> 8) & 0xff;
          body[4] = crc & 0xff;
          body.set(piece, 5);

          await sendFe(0x80, 0x01, body);
          totalBytesSent += chunkLen;
          if (onProgress) {
            const delivered = Math.min(payloadBytes.length, Math.max(maxOffsetDelivered, chunkOffset + chunkLen));
            onProgress(delivered, payloadBytes.length, Math.min(100, Math.round((delivered / payloadBytes.length) * 100)));
          }

          seq = (seq + 1) & 0xff;
          slot = (slot + 1) & 0x07;
          bytesInWin += chunkLen;
          if (!isCommitChunk && interChunkDelayMs > 0) await sleep(interChunkDelayMs);
        }
        maxOffsetDelivered = Math.max(maxOffsetDelivered, offset + bytesInWin);
      };

      const handleClose = async (closeFrame) => {
        const deviceSeq = closeFrame.body[0] ?? seq;
        const hasStatus = closeFrame.body.length >= 2;
        const statusByte = hasStatus ? closeFrame.body[1] : 0xff;
        fileCompleteAutoRespond = false;
        await sendFe(0x00, 0x1c, Uint8Array.of(0x00, deviceSeq & 0xff));
        if (hasStatus && statusByte !== 0x00) {
          throw new Error(t("errZrunSessionStatus", { status: statusByte.toString(16).padStart(2, "0") }));
        }
        if (onProgress) onProgress(payloadBytes.length, payloadBytes.length, 100);
        this.log(t("logZrunUploadComplete"));
      };

      let currentAck;
      try {
        currentAck = await this._waitFrame(
          uploadQueue,
          (f) => (f.cmd === 0x1d && f.body.length >= 8) || f.cmd === 0x1c || (f.cmd === 0x20 && f.flag === 0xc0),
          25000,
          "initial E05 window ack"
        );
      } catch (_) {
        this.log(t("logZrunDebugTrace", { trace: recentRxTrace.join(" | ") || "none" }));
        await abortSession();
        throw new Error(t("errZrunNoWindowAck", { sent: 0, total: payloadBytes.length }));
      }

      if (currentAck.cmd === 0x1c) {
        await handleClose(currentAck);
        return { success: true, status: 0 };
      }
      if (currentAck.cmd === 0x20 && currentAck.flag === 0xc0) {
        if (!fileCompleteHandled) {
          fileCompleteHandled = true;
          const deviceSeq20 = currentAck.body[0] ?? seq;
          await sendFe(0x00, 0x20, this._buildFilePathResponse(deviceSeq20, ext));
        }
        const closeFrame = await this._waitFrame(uploadQueue, (f) => f.cmd === 0x1c, 15000, "E05 session close");
        await handleClose(closeFrame);
        return { success: true, status: 0 };
      }

      while (true) {
        if (cancelRequested()) {
          await abortSession();
          throw new Error("Upload cancelled");
        }

        if (currentAck && currentAck.cmd === 0x1d && currentAck.body.length >= 8) {
          const winSize = (currentAck.body[2] << 8) | currentAck.body[3];
          const nextOffset =
            ((currentAck.body[4] << 24) |
             (currentAck.body[5] << 16) |
             (currentAck.body[6] << 8) |
             currentAck.body[7]) >>> 0;

          if (nextOffset >= payloadBytes.length) {
            fileFullySent = true;
          } else if (fileFullySent) {
            const cnt = postEofResends.get(nextOffset) || 0;
            if (cnt < 3) {
              postEofResends.set(nextOffset, cnt + 1);
              await sendWindow(nextOffset, winSize);
            }
          } else {
            await sendWindow(nextOffset, winSize);
            if (maxOffsetDelivered >= payloadBytes.length) {
              fileFullySent = true;
            }
          }
        }

        let nextFrame;
        try {
          nextFrame = await this._waitFrame(
            uploadQueue,
            (f) => (f.cmd === 0x1d && f.body.length >= 8) || f.cmd === 0x20 || f.cmd === 0x1c,
            18000,
            "E05 window ack / file complete / close"
          );
        } catch (_) {
          this.log(t("logZrunDebugTrace", { trace: recentRxTrace.join(" | ") || "none" }));
          await abortSession();
          throw new Error(t("errZrunNoWindowAck", {
            sent: Math.min(payloadBytes.length, maxOffsetDelivered || totalBytesSent),
            total: payloadBytes.length,
          }));
        }

        if (nextFrame.cmd === 0x20 && nextFrame.flag === 0xc0) {
          if (!fileCompleteHandled) {
            fileCompleteHandled = true;
            const deviceSeq20 = nextFrame.body[0] ?? seq;
            await sendFe(0x00, 0x20, this._buildFilePathResponse(deviceSeq20, ext));
          }
          const closeFrame = await this._waitFrame(uploadQueue, (f) => f.cmd === 0x1c, 15000, "E05 session close");
          await handleClose(closeFrame);
          return { success: true, status: 0 };
        }

        if (nextFrame.cmd === 0x1c) {
          await handleClose(nextFrame);
          return { success: true, status: 0 };
        }

        currentAck = nextFrame;
      }
    } finally {
      fileCompleteAutoRespond = false;
      for (const c of this.notifyChars) {
        c.removeEventListener("characteristicvaluechanged", onMirror);
        c.removeEventListener("characteristicvaluechanged", onFileCompleteFast);
      }
    }
  }
}
