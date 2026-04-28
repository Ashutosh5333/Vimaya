// Creates a simple GLB file programmatically (binary glTF)
// This builds a Vima3ya logo-like shape: a torus + sphere + box scene

const fs = require('fs');

// Minimal valid GLB with a simple geometric scene
// We'll build a proper glTF JSON then encode to GLB

function createTorusGeometry(radius, tubeRadius, radialSegments, tubularSegments) {
  const positions = [];
  const normals = [];
  const indices = [];

  for (let j = 0; j <= radialSegments; j++) {
    for (let i = 0; i <= tubularSegments; i++) {
      const u = (i / tubularSegments) * Math.PI * 2;
      const v = (j / radialSegments) * Math.PI * 2;

      const x = (radius + tubeRadius * Math.cos(v)) * Math.cos(u);
      const y = (radius + tubeRadius * Math.cos(v)) * Math.sin(u);
      const z = tubeRadius * Math.sin(v);

      positions.push(x, y, z);

      const cx = radius * Math.cos(u);
      const cy = radius * Math.sin(u);
      const nx = x - cx;
      const ny = y - cy;
      const nz = z;
      const len = Math.sqrt(nx*nx + ny*ny + nz*nz);
      normals.push(nx/len, ny/len, nz/len);
    }
  }

  for (let j = 1; j <= radialSegments; j++) {
    for (let i = 1; i <= tubularSegments; i++) {
      const a = (tubularSegments + 1) * j + i - 1;
      const b = (tubularSegments + 1) * (j - 1) + i - 1;
      const c = (tubularSegments + 1) * (j - 1) + i;
      const d = (tubularSegments + 1) * j + i;
      indices.push(a, b, d);
      indices.push(b, c, d);
    }
  }

  return { positions, normals, indices };
}

function createBoxGeometry(w, h, d) {
  const hw = w/2, hh = h/2, hd = d/2;
  const positions = [
    -hw,-hh, hd,  hw,-hh, hd,  hw, hh, hd, -hw, hh, hd, // front
    -hw,-hh,-hd, -hw, hh,-hd,  hw, hh,-hd,  hw,-hh,-hd, // back
    -hw, hh,-hd, -hw, hh, hd,  hw, hh, hd,  hw, hh,-hd, // top
    -hw,-hh,-hd,  hw,-hh,-hd,  hw,-hh, hd, -hw,-hh, hd, // bottom
     hw,-hh,-hd,  hw, hh,-hd,  hw, hh, hd,  hw,-hh, hd, // right
    -hw,-hh,-hd, -hw,-hh, hd, -hw, hh, hd, -hw, hh,-hd, // left
  ];
  const normals = [
    0,0,1, 0,0,1, 0,0,1, 0,0,1,
    0,0,-1, 0,0,-1, 0,0,-1, 0,0,-1,
    0,1,0, 0,1,0, 0,1,0, 0,1,0,
    0,-1,0, 0,-1,0, 0,-1,0, 0,-1,0,
    1,0,0, 1,0,0, 1,0,0, 1,0,0,
    -1,0,0, -1,0,0, -1,0,0, -1,0,0,
  ];
  const indices = [];
  for (let i = 0; i < 6; i++) {
    const b = i * 4;
    indices.push(b, b+1, b+2, b, b+2, b+3);
  }
  return { positions, normals, indices };
}

function floatArrayToBuffer(arr) {
  const buf = Buffer.allocUnsafe(arr.length * 4);
  for (let i = 0; i < arr.length; i++) buf.writeFloatLE(arr[i], i * 4);
  return buf;
}

function uint16ArrayToBuffer(arr) {
  // Use uint32 for larger meshes
  const buf = Buffer.allocUnsafe(arr.length * 4);
  for (let i = 0; i < arr.length; i++) buf.writeUInt32LE(arr[i], i * 4);
  return buf;
}

function minMax(arr, stride) {
  const dims = stride;
  const min = Array(dims).fill(Infinity);
  const max = Array(dims).fill(-Infinity);
  for (let i = 0; i < arr.length; i += stride) {
    for (let d = 0; d < dims; d++) {
      if (arr[i+d] < min[d]) min[d] = arr[i+d];
      if (arr[i+d] > max[d]) max[d] = arr[i+d];
    }
  }
  return { min, max };
}

// Build scene
const torus = createTorusGeometry(0.6, 0.18, 24, 36);
const box = createBoxGeometry(0.4, 0.4, 0.4);

// Encode buffers
const torusPosBuffer = floatArrayToBuffer(torus.positions);
const torusNrmBuffer = floatArrayToBuffer(torus.normals);
const torusIdxBuffer = uint16ArrayToBuffer(torus.indices);

const boxPosBuffer = floatArrayToBuffer(box.positions);
const boxNrmBuffer = floatArrayToBuffer(box.normals);
const boxIdxBuffer = uint16ArrayToBuffer(box.indices);

// Align to 4 bytes
function pad4(n) { return Math.ceil(n / 4) * 4; }

const buffers = [torusPosBuffer, torusNrmBuffer, torusIdxBuffer, boxPosBuffer, boxNrmBuffer, boxIdxBuffer];
const offsets = [];
let totalLen = 0;
for (const buf of buffers) {
  offsets.push(totalLen);
  totalLen += pad4(buf.length);
}

const binBuffer = Buffer.alloc(totalLen, 0);
for (let i = 0; i < buffers.length; i++) {
  buffers[i].copy(binBuffer, offsets[i]);
}

const torusPMin = minMax(torus.positions, 3);
const boxPMin = minMax(box.positions, 3);

const gltf = {
  asset: { version: '2.0', generator: 'vima3ya-script' },
  scene: 0,
  scenes: [{ nodes: [0, 1] }],
  nodes: [
    { mesh: 0, name: 'Torus', rotation: [0, 0, 0, 1] },
    { mesh: 1, name: 'Box', translation: [0, 0, 0], rotation: [0.383, 0.383, 0, 0.924] },
  ],
  meshes: [
    {
      name: 'TorusMesh',
      primitives: [{
        attributes: { POSITION: 0, NORMAL: 1 },
        indices: 2,
        material: 0,
      }],
    },
    {
      name: 'BoxMesh',
      primitives: [{
        attributes: { POSITION: 3, NORMAL: 4 },
        indices: 5,
        material: 1,
      }],
    },
  ],
  materials: [
    {
      name: 'TorusMat',
      pbrMetallicRoughness: {
        baseColorFactor: [0.24, 0.29, 1.0, 1.0],
        metallicFactor: 0.9,
        roughnessFactor: 0.1,
      },
    },
    {
      name: 'BoxMat',
      pbrMetallicRoughness: {
        baseColorFactor: [0.0, 0.9, 0.71, 1.0],
        metallicFactor: 0.5,
        roughnessFactor: 0.3,
      },
    },
  ],
  accessors: [
    // Torus positions
    { bufferView: 0, componentType: 5126, count: torus.positions.length / 3, type: 'VEC3', min: torusPMin.min, max: torusPMin.max },
    // Torus normals
    { bufferView: 1, componentType: 5126, count: torus.normals.length / 3, type: 'VEC3' },
    // Torus indices
    { bufferView: 2, componentType: 5125, count: torus.indices.length, type: 'SCALAR' },
    // Box positions
    { bufferView: 3, componentType: 5126, count: box.positions.length / 3, type: 'VEC3', min: boxPMin.min, max: boxPMin.max },
    // Box normals
    { bufferView: 4, componentType: 5126, count: box.normals.length / 3, type: 'VEC3' },
    // Box indices
    { bufferView: 5, componentType: 5125, count: box.indices.length, type: 'SCALAR' },
  ],
  bufferViews: [
    { buffer: 0, byteOffset: offsets[0], byteLength: torusPosBuffer.length, target: 34962 },
    { buffer: 0, byteOffset: offsets[1], byteLength: torusNrmBuffer.length, target: 34962 },
    { buffer: 0, byteOffset: offsets[2], byteLength: torusIdxBuffer.length, target: 34963 },
    { buffer: 0, byteOffset: offsets[3], byteLength: boxPosBuffer.length, target: 34962 },
    { buffer: 0, byteOffset: offsets[4], byteLength: boxNrmBuffer.length, target: 34962 },
    { buffer: 0, byteOffset: offsets[5], byteLength: boxIdxBuffer.length, target: 34963 },
  ],
  buffers: [{ byteLength: totalLen }],
};

const jsonStr = JSON.stringify(gltf);
const jsonBuf = Buffer.from(jsonStr, 'utf8');
const jsonPadded = Buffer.alloc(pad4(jsonBuf.length), 0x20); // space pad
jsonBuf.copy(jsonPadded);

const totalGLB = 12 + 8 + jsonPadded.length + 8 + binBuffer.length;
const out = Buffer.alloc(totalGLB);
let pos = 0;

// GLB header
out.writeUInt32LE(0x46546C67, pos); pos += 4; // magic
out.writeUInt32LE(2, pos); pos += 4; // version
out.writeUInt32LE(totalGLB, pos); pos += 4; // total length

// JSON chunk
out.writeUInt32LE(jsonPadded.length, pos); pos += 4;
out.writeUInt32LE(0x4E4F534A, pos); pos += 4; // JSON
jsonPadded.copy(out, pos); pos += jsonPadded.length;

// BIN chunk
out.writeUInt32LE(binBuffer.length, pos); pos += 4;
out.writeUInt32LE(0x004E4942, pos); pos += 4; // BIN
binBuffer.copy(out, pos); pos += binBuffer.length;

const origPath = 'public/model.glb';
fs.writeFileSync(origPath, out);
console.log(`Original GLB written: ${out.length} bytes (${(out.length/1024).toFixed(1)} KB)`);
