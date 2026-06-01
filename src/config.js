export const CONFIG = {
  // Player movement
  walkSpeed: 8,
  runSpeed: 14,
  acceleration: 30,
  friction: 0.90,
  jumpForce: 10,
  gravity: -20,
  glideGravity: -3,
  dashForce: 28,
  dashDuration: 0.25,
  wallJumpHorizontal: 8,
  playerRadius: 0.5,
  playerHeight: 1.5,

  // Camera
  camDistance: 7,
  camDistanceGlide: 11,
  camHeight: 2.5,
  camLerpSpeed: 4,
  camLookAhead: 2,
  fovDefault: 60,
  fovRun: 68,
  mouseSensitivity: 0.003,
  invertY: false,

  // World
  worldSize: 200,
  terrainResolution: 150,
  noiseScale: 0.012,
  noiseAmplitude: 8,
  islandCount: 10,
  orbsOnIslands: 1,
  totalOrbs: 3,
  crystalCount: 8,
  archCount: 5,
  portalDistance: 80,

  // Tower
  tower: {
    distance: 80,
    height: 110,
    platformCount: 30,
    orbCount: 1,
    platformColors: ['#7a5a9a', '#8a6aaa', '#9a7aba', '#6a4a8a'],
    spireColor: '#5533aa',
    spireGlowColor: '#8866cc',
  },

  // Colors
  skyTop: '#0a0a2e',
  skyMid: '#3a1a5e',
  skyBottom: '#c4709e',
  fogColor: '#3a2f5e',
  terrainLow: '#151545',
  terrainMid: '#3a5a8a',
  terrainHigh: '#9a7ac4',
  playerColor: '#88ddff',
  crystalColor: '#55ddff',
  portalColor: '#ff55aa',
  portalGlow: '#ff88cc',
  orbColor: '#ffcc33',
  particleColors: ['#ffffff', '#aaddff', '#ffbbee', '#88eeff'],

  // Sky / Space
  starCount: 3000,
  moonSize: 18,
  nebulaCount: 6,
  starFieldRadius: 380,
};
