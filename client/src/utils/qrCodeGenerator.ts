interface QrVersionSpec {
  version: number
  size: number
  dataCodewords: number
  ecCodewords: number
  alignmentCenters: number[]
}

const QR_VERSIONS_L: QrVersionSpec[] = [
  { version: 1, size: 21, dataCodewords: 19, ecCodewords: 7, alignmentCenters: [] },
  { version: 2, size: 25, dataCodewords: 34, ecCodewords: 10, alignmentCenters: [6, 18] },
  { version: 3, size: 29, dataCodewords: 55, ecCodewords: 15, alignmentCenters: [6, 22] },
  { version: 4, size: 33, dataCodewords: 80, ecCodewords: 20, alignmentCenters: [6, 26] },
  { version: 5, size: 37, dataCodewords: 108, ecCodewords: 26, alignmentCenters: [6, 30] },
]

// Таблиці поля Галуа GF(256) з примітивним поліномом 0x11D
const GF_EXP = new Uint8Array(512)
const GF_LOG = new Uint8Array(256)

;(function initGaloisField() {
  let x = 1
  for (let i = 0; i < 255; i += 1) {
    GF_EXP[i] = x
    GF_LOG[x] = i
    x <<= 1
    if (x & 0x100) {
      x ^= 0x11d
    }
  }
  for (let i = 255; i < 512; i += 1) {
    GF_EXP[i] = GF_EXP[i - 255]
  }
})()

function gfMul(a: number, b: number): number {
  return a === 0 || b === 0 ? 0 : GF_EXP[GF_LOG[a] + GF_LOG[b]]
}

function buildGeneratorPoly(degree: number): Uint8Array {
  let poly = new Uint8Array([1])
  for (let i = 0; i < degree; i += 1) {
    const next = new Uint8Array(poly.length + 1)
    const factor = GF_EXP[i]
    for (let j = 0; j < poly.length; j += 1) {
      next[j] ^= poly[j]
      next[j + 1] ^= gfMul(poly[j], factor)
    }
    poly = next
  }
  return poly
}

function computeReedSolomon(data: number[], ecCount: number): number[] {
  const gen = buildGeneratorPoly(ecCount)
  const remainder = new Uint8Array(ecCount)

  for (const byte of data) {
    const factor = byte ^ remainder[0]
    remainder.copyWithin(0, 1)
    remainder[ecCount - 1] = 0
    for (let i = 0; i < ecCount; i += 1) {
      remainder[i] ^= gfMul(gen[i + 1], factor)
    }
  }

  return Array.from(remainder)
}

function encodeDataCodewords(bytes: Uint8Array, totalDataCodewords: number): number[] {
  const bits: number[] = []
  const pushBits = (val: number, len: number) => {
    for (let i = len - 1; i >= 0; i -= 1) {
      bits.push((val >>> i) & 1)
    }
  }

  // Byte mode indicator (0100) + 8-bit length
  pushBits(0b0100, 4)
  pushBits(bytes.length, 8)
  for (const b of bytes) {
    pushBits(b, 8)
  }

  const maxBits = totalDataCodewords * 8
  const terminatorLen = Math.min(4, maxBits - bits.length)
  pushBits(0, terminatorLen)

  while (bits.length % 8 !== 0) {
    bits.push(0)
  }

  const codewords: number[] = []
  for (let i = 0; i < bits.length; i += 8) {
    let byte = 0
    for (let j = 0; j < 8; j += 1) {
      byte = (byte << 1) | bits[i + j]
    }
    codewords.push(byte)
  }

  const padBytes = [0xec, 0x11]
  let padIdx = 0
  while (codewords.length < totalDataCodewords) {
    codewords.push(padBytes[padIdx % 2])
    padIdx += 1
  }

  return codewords
}

export function generateScannableQrMatrix(payloadText: string): boolean[][] {
  const encoder = new TextEncoder()
  const rawBytes = encoder.encode(payloadText)
  const maxBytes = QR_VERSIONS_L[QR_VERSIONS_L.length - 1].dataCodewords - 2
  const bytes = rawBytes.length > maxBytes ? rawBytes.slice(0, maxBytes) : rawBytes

  const spec =
    QR_VERSIONS_L.find((v) => bytes.length + 2 <= v.dataCodewords) ??
    QR_VERSIONS_L[QR_VERSIONS_L.length - 1]

  const { size, dataCodewords, ecCodewords, alignmentCenters } = spec
  const modules: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  )
  const isFunction: boolean[][] = Array.from({ length: size }, () =>
    Array.from({ length: size }, () => false),
  )

  const setFunctionModule = (r: number, c: number, dark: boolean) => {
    if (r >= 0 && r < size && c >= 0 && c < size) {
      modules[r][c] = dark
      isFunction[r][c] = true
    }
  }

  const drawFinderPattern = (r0: number, c0: number) => {
    for (let dr = -1; dr <= 7; dr += 1) {
      for (let dc = -1; dc <= 7; dc += 1) {
        const inOuter = dr >= 0 && dr <= 6 && dc >= 0 && dc <= 6
        const isBorder = dr === 0 || dr === 6 || dc === 0 || dc === 6
        const isCore = dr >= 2 && dr <= 4 && dc >= 2 && dc <= 4
        setFunctionModule(r0 + dr, c0 + dc, inOuter && (isBorder || isCore))
      }
    }
  }

  drawFinderPattern(0, 0)
  drawFinderPattern(0, size - 7)
  drawFinderPattern(size - 7, 0)

  // Timing patterns
  for (let i = 8; i < size - 8; i += 1) {
    setFunctionModule(6, i, i % 2 === 0)
    setFunctionModule(i, 6, i % 2 === 0)
  }

  // Alignment patterns
  for (const rCenter of alignmentCenters) {
    for (const cCenter of alignmentCenters) {
      const overlapsFinder =
        (rCenter <= 8 && cCenter <= 8) ||
        (rCenter <= 8 && cCenter >= size - 9) ||
        (rCenter >= size - 9 && cCenter <= 8)
      if (!overlapsFinder) {
        for (let dr = -2; dr <= 2; dr += 1) {
          for (let dc = -2; dc <= 2; dc += 1) {
            const dist = Math.max(Math.abs(dr), Math.abs(dc))
            setFunctionModule(rCenter + dr, cCenter + dc, dist !== 1)
          }
        }
      }
    }
  }

  // Dark module
  setFunctionModule(size - 8, 8, true)

  // Reserve format info slots
  for (let i = 0; i < 9; i += 1) {
    if (!isFunction[8][i]) setFunctionModule(8, i, false)
    if (!isFunction[i][8]) setFunctionModule(i, 8, false)
  }
  for (let i = 0; i < 8; i += 1) {
    if (!isFunction[8][size - 1 - i]) setFunctionModule(8, size - 1 - i, false)
    if (!isFunction[size - 1 - i][8]) setFunctionModule(size - 1 - i, 8, false)
  }

  const dataWords = encodeDataCodewords(bytes, dataCodewords)
  const ecWords = computeReedSolomon(dataWords, ecCodewords)
  const allWords = [...dataWords, ...ecWords]

  const bitStream: number[] = []
  for (const word of allWords) {
    for (let i = 7; i >= 0; i -= 1) {
      bitStream.push((word >>> i) & 1)
    }
  }

  // Zig-zag bit placement with Mask 0: (r + c) % 2 === 0
  let bitIdx = 0
  let upward = true
  for (let rightCol = size - 1; rightCol >= 1; rightCol -= 2) {
    const col = rightCol === 6 ? rightCol - 1 : rightCol
    if (rightCol === 6) {
      rightCol -= 1
    }
    for (let step = 0; step < size; step += 1) {
      const r = upward ? size - 1 - step : step
      for (let dc = 0; dc < 2; dc += 1) {
        const c = col - dc
        if (!isFunction[r][c]) {
          const bit = bitIdx < bitStream.length ? bitStream[bitIdx] === 1 : false
          bitIdx += 1
          const mask = (r + c) % 2 === 0
          modules[r][c] = mask ? !bit : bit
        }
      }
    }
    upward = !upward
  }

  // Format information for ECC Level L (01) + Mask 0 (000) -> BCH & XOR = 0x77C4
  const formatBits = 0x77c4
  const getFmtBit = (i: number) => ((formatBits >>> i) & 1) === 1

  const topCols = [0, 1, 2, 3, 4, 5, 7, 8]
  for (let i = 0; i < 8; i += 1) {
    modules[8][topCols[i]] = getFmtBit(14 - i)
  }
  const leftRows = [7, 5, 4, 3, 2, 1, 0]
  for (let i = 0; i < 7; i += 1) {
    modules[leftRows[i]][8] = getFmtBit(6 - i)
  }
  for (let i = 0; i < 7; i += 1) {
    modules[size - 1 - i][8] = getFmtBit(14 - i)
  }
  for (let i = 0; i < 8; i += 1) {
    modules[8][size - 8 + i] = getFmtBit(7 - i)
  }

  return modules
}
