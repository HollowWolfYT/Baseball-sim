// =============================================================================
// MLB BASEBALL — Complete Overhaul
// Three.js + Vite | Single-file game
// =============================================================================

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader.js';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';


THREE.DefaultLoadingManager.setURLModifier((url) => {
  const base = import.meta.env.BASE_URL;

  if (url.startsWith('/') && !url.startsWith(base)) {
    return base + url.slice(1);
  }

  return url;
});

// =============================================================================
// TEAM CONFIGURATION
// =============================================================================
const TEAM_CONFIG = {
  home: {
    name: 'BLUE JAYS',
    abbreviation: 'TOR',
    primaryColor: 0x003580,
    secondaryColor: 0xe8291c,
  },
  away: {
    name: 'RED SOX',
    abbreviation: 'BOS',
    primaryColor: 0x1155ee,
    secondaryColor: 0xffffff,
  },
};

// =============================================================================
// FIELD CONFIGURATION
// =============================================================================
const FIELD_CONFIG = {
  positionX: 0,
  positionY: 0,
  positionZ: 0,
  rotationY: 0,
  scale: 1.0,
  basepathLength: 90,
  pitchingDistance: 60.5,
  outfieldDistance: 175,
  foulLineLength: 330,
  backstopDistance: 55,
  dirtColor: '#8B7355',
  grassColor: '#2d7a2d',
  baseColor: '#ffffff',
  lineColor: '#ffffff',
  warningTrackColor: '#CC8844',
  moundRadius: 9,
  moundHeight: 0.83,
};

// =============================================================================
// PLAYER CONFIGURATION
// =============================================================================
const PLAYER_CONFIG = {
  height: 6.0,
  shoulderWidth: 1.8,
  swingDuration: 0.45,
  pitchDuration: 0.7,
  jogSpeed: 10,
  runSpeed: 14,
  sprintSpeed: 18,
};

// =============================================================================
// BAT CONFIGURATION
// =============================================================================
const BAT_CONFIG = {
  length: 2.83,
  handleRadius: 0.04,
  barrelRadius: 0.11,
  woodColor: '#8B4513',
  gripColor: '#1a1a1a',
};

// =============================================================================
// STADIUM CONFIGURATION
// =============================================================================
const STADIUM_CONFIG = {
  wallHeight: 12,
  wallColor: 0x1a4a1a,
  generateCrowd: true,
  crowdDensity: 0.65,
  crowdColors: ['#cc0000', '#003580', '#ffffff', '#ffd700', '#22aa22', '#aa44aa', '#ff8800', '#005500'],
  ambientIntensity: 0.55,
  sunIntensity: 1.15,
};

// =============================================================================
// GAME CONFIG
// =============================================================================
const GAME_CONFIG = {
  innings: 9,
  balls: 4,
  strikes: 3,
  outs: 3,
  ballRadius: 0.18,
  gravity: 32.2,
  airResistance: 0.0008,
  pitchSpeeds: {
    fastball: 95,
    curveball: 78,
    slider: 86,
    changeup: 80,
  },
  hitPowerMultiplier: 0.55,
  cameraSmooth: 0.07,
  broadcastHeight: 38,
  broadcastDistance: 75,
  pitchingCamera: {
    height: 7,
    distanceBehindMound: 16,
    lookHeight: 3.2,
    lookZOffset: 2,
  },
};

// =============================================================================
// CUSTOM STADIUM CONFIGURATION
// =============================================================================
const CUSTOM_STADIUM_CONFIG = {
  enabled: true,
  path: '/stadium.glb',
  scale: 200.0,
  position: { x: -3, y: 0, z: -5 },
  rotation: { x: 0, y: 134, z: 0 },
  hideGeneratedField: true,
  baseOverrides: {
    home:   { x: -3.00, y: 0.15, z: -5.00 },
    first:  { x: 30.00, y: 0.45, z: -38.00 },
    second: { x: -2.00, y: 0.25, z: -73.00 },
    third:  { x: -35.00, y: 0.25, z: -40.00 },
  },
};

// =============================================================================
// CUSTOM CHARACTER CONFIGURATION
// =============================================================================
const CUSTOM_CHAR_CONFIG = {
  enabled: true,        // auto-enabled; toggled from main menu
  scale: 0.033,         // Meshy/Mixamo FBX is in cm; 6 ft player ≈ 182 cm → 0.033 units/cm ≈ 1 unit/ft
  xOffset: 0,           // fine-tune X after stadium anchor is applied (positive = right, negative = left)
  yOffset: 0,           // world-space Y nudge (negative = sink into ground, positive = float)
  zOffset: 0,           // world-space Z nudge
  batterRotationY: Math.PI,   // face pitcher (model's front is +Z, so Math.PI rotates to face -Z / pitcher)
  batterXOffset:  -5,       // batter X nudge (independent of global xOffset)
  catcherXOffset: -1.1,       // catcher X nudge (independent of global xOffset)
  releasePoint: 0.60,   // fraction through pitch animation when ball releases
  contactPoint: 0.55,   // fraction through swing animation when contact is checked
  // Bat rotation offset applied in the hand bone's local frame (tune if bat angle looks off)
  batRotation:  { x: -Math.PI / 2, y: 0, z: 0 },
  // Player body weight: 0 = beanpole, 0.5 = normal, 1.0 = absolute unit
  weight: 0.5,
};

// =============================================================================
// DIFFICULTY CONFIGURATION
// =============================================================================
const DIFFICULTY_CONFIG = {
  level: 50, // 0 = Easy (Rookie), 100 = Hard (All-Star)
};
function getDiffScale() { return DIFFICULTY_CONFIG.level / 100; } // 0..1

// =============================================================================
// GAME STATES
// =============================================================================
const GAME_STATE = {
  LOADING: 'loading',
  STADIUM_SETUP: 'stadium_setup',
  MENU: 'menu',
  AWAITING_PITCH_REQUEST: 'awaiting_pitch_request',
  PITCH_INCOMING: 'pitch_incoming',
  PITCH_AIMING: 'pitch_aiming',
  PITCH_THROWN: 'pitch_thrown',
  BALL_IN_PLAY: 'ball_in_play',
  FIELDING: 'fielding',
  BASE_RUNNING: 'base_running',
  PLAY_RESOLVED: 'play_resolved',
  HALF_INNING_END: 'half_inning_end',
  INNING_TRANSITION: 'inning_transition',
  GAME_OVER: 'game_over',
  PAUSED: 'paused',
  STEAL_MINIGAME: 'steal_minigame',
  TIMEOUT: 'timeout',
  LOCKER_ROOM: 'locker_room',
  INTRO_CUTSCENE: 'intro_cutscene',
  REPLAY: 'replay',
};

// =============================================================================
// THREE.JS SETUP
// =============================================================================
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87CEEB);
scene.fog = new THREE.Fog(0x87CEEB, 300, 900);

// =============================================================================
// WEATHER SYSTEM
// =============================================================================
let activeWeather = 'clear';
let _rainParticles = null;
let _rainGeo = null;
let _rainMat = null;
let _rainVels = null;
let _rainStreakLen = 4;
const RAIN_COUNT = 1000;

let _tornadoActive = false;
let _tornadoParticles = null;
let _tornadoGeo = null;
let _tornadoMat = null;
let _tornadoX = 0;
let _tornadoZ = 0;
let _tornadoTimer = 0;
const TORNADO_DURATION = 20;
let _tornadoLiftedPlayers = []; // { obj, origPos, t }
let _tornadoMode = false;
let _tornadoModeTimer = 0;
let _tornadoModeTriggerAt = 0;
let _tornadoCutsceneActive = false;
let _prevStateBeforeTornado = null;

const WEATHER_PRESETS = {
  clear:    { sky: 0x87CEEB, fog: 0x87CEEB, fogNear: 300, fogFar: 900, ambient: 1.0, sun: 1.0,  rainHeavy: false, rain: false },
  overcast: { sky: 0x8899aa, fog: 0x8899aa, fogNear: 200, fogFar: 600, ambient: 0.7, sun: 0.45, rainHeavy: false, rain: false },
  rain:     { sky: 0x4a5566, fog: 0x4a5566, fogNear: 150, fogFar: 450, ambient: 0.5, sun: 0.25, rainHeavy: false, rain: true  },
  storm:    { sky: 0x252830, fog: 0x252830, fogNear: 80,  fogFar: 300, ambient: 0.3, sun: 0.10, rainHeavy: true,  rain: true  },
};

function applyWeather(type) {
  activeWeather = type;
  const p = WEATHER_PRESETS[type] || WEATHER_PRESETS.clear;
  scene.background = new THREE.Color(p.sky);
  scene.fog.color.set(p.sky);
  scene.fog.near = p.fogNear;
  scene.fog.far  = p.fogFar;
  // Update lights (find them by type in scene)
  scene.children.forEach(c => {
    if (c.isAmbientLight)              c.intensity = p.ambient * 1.0;
    if (c.isDirectionalLight && c.castShadow) c.intensity = p.sun * 1.2;
  });
  renderer.toneMappingExposure = type === 'storm' ? 0.55 : type === 'rain' ? 0.72 : 1.0;
  // Rain particles
  if (p.rain) {
    _createRain(p.rainHeavy);
  } else {
    _destroyRain();
  }
}

function _createRain(heavy) {
  _destroyRain();
  // LineSegments: each raindrop is two vertices (top → bottom streak)
  // Far more visible than point sprites
  const count = heavy ? RAIN_COUNT * 2 : RAIN_COUNT;
  _rainStreakLen = heavy ? 6 : 4;
  const verts = new Float32Array(count * 6); // 2 pts × 3 floats each
  _rainVels = new Float32Array(count);
  for (let i = 0; i < count; i++) {
    const x = (Math.random() - 0.5) * 500;
    const y = Math.random() * 220;
    const z = (Math.random() - 0.5) * 500;
    verts[i*6]   = x;  verts[i*6+1] = y;                   verts[i*6+2] = z;
    verts[i*6+3] = x;  verts[i*6+4] = y - _rainStreakLen;   verts[i*6+5] = z;
    _rainVels[i] = 75 + Math.random() * 45;
  }
  _rainGeo = new THREE.BufferGeometry();
  _rainGeo.setAttribute('position', new THREE.BufferAttribute(verts, 3));
  _rainMat = new THREE.LineBasicMaterial({
    color: heavy ? 0x99bbd8 : 0xb8d4ee,
    transparent: true,
    opacity: heavy ? 0.92 : 0.78,
  });
  _rainParticles = new THREE.LineSegments(_rainGeo, _rainMat);
  scene.add(_rainParticles);
}

function _destroyRain() {
  if (_rainParticles) { scene.remove(_rainParticles); _rainGeo.dispose(); _rainMat.dispose(); _rainParticles = null; _rainGeo = null; _rainMat = null; _rainVels = null; }
}

function _updateRain(dt) {
  if (!_rainParticles) return;
  const arr = _rainGeo.attributes.position.array;
  const count = arr.length / 6; // 6 floats per streak
  for (let i = 0; i < count; i++) {
    const dy = _rainVels[i] * dt;
    arr[i*6+1] -= dy;  // top y
    arr[i*6+4] -= dy;  // bottom y
    if (arr[i*6+4] < -5) { // reset when streak fully below ground
      const x = (Math.random() - 0.5) * 500;
      const z = (Math.random() - 0.5) * 500;
      const y = 215 + Math.random() * 15;
      arr[i*6]   = x;  arr[i*6+1] = y;                   arr[i*6+2] = z;
      arr[i*6+3] = x;  arr[i*6+4] = y - _rainStreakLen;   arr[i*6+5] = z;
    }
  }
  _rainGeo.attributes.position.needsUpdate = true;
}

function triggerTornado() {
  if (_tornadoActive) return;
  _tornadoActive = true;
  _tornadoTimer = 0;
  _tornadoX = (Math.random() - 0.5) * 60;
  _tornadoZ = (Math.random() - 0.5) * 40 - 20;
  _tornadoLiftedPlayers = [];

  // Build tornado funnel — dense multi-layer spiral
  const count = 1800;
  const positions = new Float32Array(count * 3);
  for (let i = 0; i < count; i++) {
    const frac = i / count;
    // Outer funnel layer (first 1200) + inner tight core (last 600)
    const isCore = i >= 1200;
    const h = frac * 110;
    const baseR = isCore ? (1 - frac) * 8 + 0.5 : (1 - frac) * 26 + 2;
    const jitter = (Math.random() - 0.5) * 3.5;
    const r = baseR + jitter;
    const a = (frac * Math.PI * 36) + (isCore ? 1.2 : 0);
    positions[i*3]   = _tornadoX + Math.cos(a) * r;
    positions[i*3+1] = h * (isCore ? 0.85 : 1);
    positions[i*3+2] = _tornadoZ + Math.sin(a) * r;
  }
  _tornadoGeo = new THREE.BufferGeometry();
  _tornadoGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  _tornadoMat = new THREE.PointsMaterial({
    color: 0x554433,
    size: 1.4,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0.82,
    depthWrite: false,
    vertexColors: false,
  });
  _tornadoParticles = new THREE.Points(_tornadoGeo, _tornadoMat);
  scene.add(_tornadoParticles);

  // Lift all players with chaotic flying animation
  const allObjs = [];
  if (batter)  allObjs.push(batter);
  if (pitcher) allObjs.push(pitcher);
  if (catcherPlayer) allObjs.push(catcherPlayer);
  Object.values(fielders).forEach(f => { if (f && f !== pitcher && f !== catcherPlayer) allObjs.push(f); });
  baseRunners.forEach(r => allObjs.push(r));
  allObjs.forEach((obj, idx) => {
    const origY = obj.position.y;
    _tornadoLiftedPlayers.push({ obj, origPos: obj.position.clone(), origY, t: 0, delay: idx * 0.25, phase: Math.random() * Math.PI * 2 });
  });
}

function _updateTornado(dt) {
  if (!_tornadoActive) return;
  _tornadoTimer += dt;

  // Tornado drifts menacingly across the field
  _tornadoX += Math.sin(_tornadoTimer * 0.35) * dt * 9;
  _tornadoZ += Math.cos(_tornadoTimer * 0.28) * dt * 7;

  // Rebuild funnel — spins faster as timer progresses, gradually gets taller
  const arr = _tornadoGeo.attributes.position.array;
  const count = arr.length / 3;
  const spinSpeed = 4.5 + _tornadoTimer * 0.18;
  const heightScale = Math.min(1.3, 1 + _tornadoTimer * 0.015);
  for (let i = 0; i < count; i++) {
    const frac = i / count;
    const isCore = i >= 1200;
    const h = frac * 110 * heightScale;
    const baseR = isCore ? (1 - frac) * 8 + 0.5 : (1 - frac) * 26 + 2;
    const jitter = Math.sin(i * 7.3 + _tornadoTimer * 11) * 1.8;
    const r = baseR + jitter;
    const a = (frac * Math.PI * 36) + _tornadoTimer * spinSpeed + (isCore ? 1.2 : 0);
    arr[i*3]   = _tornadoX + Math.cos(a) * r;
    arr[i*3+1] = h * (isCore ? 0.85 : 1);
    arr[i*3+2] = _tornadoZ + Math.sin(a) * r;
  }
  _tornadoGeo.attributes.position.needsUpdate = true;

  // Animate lifted players: wild spiral up, chaotic float, then plummet back down
  const halfT = TORNADO_DURATION * 0.5;
  _tornadoLiftedPlayers.forEach(lp => {
    lp.t += dt;
    const et = Math.max(0, lp.t - lp.delay);
    if (et <= 0) return;
    const risePhase = Math.min(1, et / (halfT * 0.55));
    const dropPhase = Math.max(0, (et - halfT * 0.75) / (halfT * 1.25));
    const height = Math.sin(risePhase * Math.PI * 0.5) * 72 * (1 - dropPhase * dropPhase);
    // Wild spinning orbit — speed ramps up then slows near peak
    const spinSpeed2 = lp.phase + et * (2.5 + Math.sin(et * 1.3)) * 2.2;
    const dist = risePhase * 30 * (1 - dropPhase * 0.6);
    lp.obj.position.x = lp.origPos.x + Math.cos(spinSpeed2) * dist;
    lp.obj.position.y = lp.origY + height;
    lp.obj.position.z = lp.origPos.z + Math.sin(spinSpeed2) * dist;
    // Full body tumbling — every axis goes wild
    lp.obj.rotation.y = spinSpeed2 * 3.5;
    lp.obj.rotation.z = Math.sin(et * 5.2) * 1.4;
    lp.obj.rotation.x = Math.cos(et * 3.8) * 0.9;
  });

  if (_tornadoTimer >= TORNADO_DURATION) {
    // Restore all players
    _tornadoLiftedPlayers.forEach(lp => {
      lp.obj.position.copy(lp.origPos);
      lp.obj.rotation.set(0, 0, 0);
    });
    _tornadoLiftedPlayers = [];
    scene.remove(_tornadoParticles);
    _tornadoGeo.dispose(); _tornadoMat.dispose();
    _tornadoParticles = null; _tornadoGeo = null; _tornadoMat = null;
    _tornadoActive = false;
    // Clear storm weather when tornado ends
    if (_tornadoMode) applyWeather('clear');
  }
}

function playTornadoCutscene() {
  if (_tornadoCutsceneActive || _tornadoActive) return;
  _tornadoCutsceneActive = true;

  // Storm weather + heavy rain kick in immediately
  applyWeather('storm');

  // Spawn the tornado funnel and queue up player lifting
  triggerTornado();

  // Freeze game logic, enter cutscene camera state
  _prevStateBeforeTornado = gameState;
  const overlay = document.getElementById('cutscene-overlay');
  overlay.classList.add('active');
  gameState = GAME_STATE.INTRO_CUTSCENE;
  cutscenePlaying = true;
  _introTimers = [];

  const plate = getPitchPlateCenter ? getPitchPlateCenter() : new THREE.Vector3(0, 0, 0);
  const px = plate.x, pz = plate.z;
  const tx = _tornadoX, tz = _tornadoZ;

  // Shot 1 (0s): Dramatic wide aerial shot — dark storm rolling in
  _csShowTitle('', '', false);
  _csShowLowerThird('', '', false);
  _csSetShot('');
  cameraTargetPos.set(px + 15, 75, pz + 90);
  cameraTargetLook.set(px, 3, pz - 30);

  _csTick(() => {
    _csFlash('#111111', 350);
    _csShowTitle('⚠  WARNING  ⚠', 'TORNADO ON THE FIELD', true);
    triggerScreenShake(1.2, 1.0);
  }, 150);

  // Lightning flash 1
  _csTick(() => {
    _csFlash('#ffffaa', 90);
    triggerScreenShake(0.8, 0.3);
  }, 900);

  // Shot 2 (1.8s): Side shot of funnel touching down on the field
  _csTick(() => {
    _csShowTitle('', '', false);
    _csFlash('#000000', 180);
    _csSetShot('TORNADO TOUCHDOWN');
    cameraTargetPos.set(tx + 50, 22, tz + 25);
    cameraTargetLook.set(tx, 12, tz);
    triggerScreenShake(2.0, 0.7);
  }, 1800);

  // Lightning flash 2
  _csTick(() => {
    _csFlash('#ffffff', 100);
    triggerScreenShake(1.4, 0.4);
  }, 2700);

  // Shot 3 (3.3s): Ground level — looking straight UP at the swirling funnel
  _csTick(() => {
    _csFlash('#ff8800', 500);
    _csSetShot('');
    cameraTargetPos.set(px + 14, 1.2, pz + 10);
    cameraTargetLook.set(tx, 35, tz);
    triggerScreenShake(4.5, 1.4);
    _csShowLowerThird('EVERYONE', 'IS ABOUT TO HAVE A VERY BAD DAY', true);
  }, 3300);

  // Rumble
  _csTick(() => {
    _csFlash('#ccddff', 110);
    triggerScreenShake(3.0, 0.6);
  }, 4200);

  // Shot 4 (5.0s): Overhead view — players already spiralling up into the sky
  _csTick(() => {
    _csShowLowerThird('', '', false);
    _csFlash('#000000', 220);
    cameraTargetPos.set(px + 4, 55, pz + 12);
    cameraTargetLook.set(px, 8, pz - 18);
    triggerScreenShake(3.5, 0.9);
    _csShowTitle('HOLD ON!', "EVERYBODY'S FLYING!", true);
  }, 5000);

  // Lightning flash 3
  _csTick(() => {
    _csFlash('#ffff00', 140);
    triggerScreenShake(2.5, 0.5);
  }, 5900);

  // Shot 5 (6.4s): Mid-air close-up of players tumbling through the sky
  _csTick(() => {
    _csShowTitle('', '', false);
    _csFlash('#111111', 200);
    cameraTargetPos.set(px - 8, 26, pz + 8);
    cameraTargetLook.set(px + 10, 22, pz - 8);
    triggerScreenShake(2.2, 0.7);
    _csShowLowerThird('THIS IS FINE', '🌪️  COMPLETELY NORMAL BASEBALL  🌪️', true);
  }, 6400);

  // End (8.0s): Return to game — players still mid-flight, tornado still active
  _csTick(() => {
    _csShowTitle('', '', false);
    _csShowLowerThird('', '', false);
    overlay.classList.remove('active', 'cs-wide');
    document.getElementById('cs-shot-label').classList.remove('show');
    cutscenePlaying = false;
    _tornadoCutsceneActive = false;
    gameState = _prevStateBeforeTornado || GAME_STATE.AWAITING_PITCH_REQUEST;
    _prevStateBeforeTornado = null;
  }, 8000);
}

const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);

const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('game-canvas'),
  antialias: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

function setupLighting() {
  const ambient = new THREE.AmbientLight(0xffffff, STADIUM_CONFIG.ambientIntensity);
  scene.add(ambient);

  const sun = new THREE.DirectionalLight(0xfff4d6, STADIUM_CONFIG.sunIntensity);
  sun.position.set(120, 180, 60);
  sun.castShadow = true;
  sun.shadow.mapSize.width = 2048;
  sun.shadow.mapSize.height = 2048;
  sun.shadow.camera.near = 50;
  sun.shadow.camera.far = 600;
  sun.shadow.camera.left = -250;
  sun.shadow.camera.right = 250;
  sun.shadow.camera.top = 250;
  sun.shadow.camera.bottom = -250;
  sun.shadow.bias = -0.0005;
  scene.add(sun);

  const fill = new THREE.DirectionalLight(0xaaccff, 0.35);
  fill.position.set(-60, 60, -60);
  scene.add(fill);

  const hemi = new THREE.HemisphereLight(0x88aaff, 0x442200, 0.35);
  scene.add(hemi);
}

// =============================================================================
// FIELD CREATION
// =============================================================================
function createGrassTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 512; canvas.height = 512;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = FIELD_CONFIG.grassColor;
  ctx.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 6000; i++) {
    const x = Math.random() * 512, y = Math.random() * 512;
    const shade = Math.random() * 36 - 18;
    ctx.fillStyle = `rgb(${Math.max(0, 45 + shade)},${Math.max(0, 122 + shade)},${Math.max(0, 45 + shade)})`;
    ctx.fillRect(x, y, 2, 4);
  }
  for (let i = 0; i < 512; i += 32) {
    ctx.fillStyle = 'rgba(255,255,255,0.04)';
    ctx.fillRect(0, i, 512, 16);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(20, 20);
  return t;
}

function createDirtTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256; canvas.height = 256;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = FIELD_CONFIG.dirtColor;
  ctx.fillRect(0, 0, 256, 256);
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * 256, y = Math.random() * 256;
    const shade = Math.random() * 30 - 15;
    ctx.fillStyle = `rgb(${139 + shade},${115 + shade},${85 + shade})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }
  const t = new THREE.CanvasTexture(canvas);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(8, 8);
  return t;
}

function createField() {
  const group = new THREE.Group();

  const grassTexture = createGrassTexture();
  const outfieldGeom = new THREE.CircleGeometry(FIELD_CONFIG.outfieldDistance, 64, Math.PI / 4, Math.PI / 2);
  const outfield = new THREE.Mesh(outfieldGeom, new THREE.MeshStandardMaterial({ map: grassTexture, roughness: 0.95 }));
  outfield.rotation.x = -Math.PI / 2;
  outfield.receiveShadow = true;
  group.add(outfield);

  const foulGrass = new THREE.Mesh(
    new THREE.CircleGeometry(FIELD_CONFIG.outfieldDistance, 64, Math.PI / 4 + Math.PI / 2, Math.PI * 1.5),
    new THREE.MeshStandardMaterial({ color: 0x1a5a1a, roughness: 0.95 })
  );
  foulGrass.rotation.x = -Math.PI / 2;
  foulGrass.position.y = -0.005;
  foulGrass.receiveShadow = true;
  group.add(foulGrass);

  const dirtTex = createDirtTexture();
  const dirtMat = new THREE.MeshStandardMaterial({ map: dirtTex, roughness: 1.0 });
  const infieldDirt = new THREE.Mesh(new THREE.CircleGeometry(95, 48, Math.PI / 4, Math.PI / 2), dirtMat);
  infieldDirt.rotation.x = -Math.PI / 2;
  infieldDirt.position.y = 0.01;
  infieldDirt.receiveShadow = true;
  group.add(infieldDirt);

  const diamondShape = new THREE.Shape();
  const home = { x: 0, z: 6 };
  const first = { x: 60, z: -54 };
  const second = { x: 0, z: -114 };
  const third = { x: -60, z: -54 };
  diamondShape.moveTo(home.x, home.z);
  diamondShape.lineTo(first.x, first.z);
  diamondShape.lineTo(second.x, second.z);
  diamondShape.lineTo(third.x, third.z);
  diamondShape.closePath();
  const infieldGrass = new THREE.Mesh(
    new THREE.ShapeGeometry(diamondShape),
    new THREE.MeshStandardMaterial({ map: grassTexture.clone(), roughness: 0.95 })
  );
  infieldGrass.rotation.x = -Math.PI / 2;
  infieldGrass.position.y = 0.02;
  infieldGrass.receiveShadow = true;
  group.add(infieldGrass);

  // Pitcher's mound
  const mound = new THREE.Mesh(
    new THREE.CylinderGeometry(FIELD_CONFIG.moundRadius, FIELD_CONFIG.moundRadius + 2, FIELD_CONFIG.moundHeight, 32),
    dirtMat
  );
  mound.position.set(0, FIELD_CONFIG.moundHeight / 2, -FIELD_CONFIG.pitchingDistance);
  mound.receiveShadow = true; mound.castShadow = true;
  group.add(mound);

  const rubberMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
  const rubber = new THREE.Mesh(new THREE.BoxGeometry(2, 0.1, 0.5), rubberMat);
  rubber.position.set(0, FIELD_CONFIG.moundHeight + 0.05, -FIELD_CONFIG.pitchingDistance);
  group.add(rubber);

  const baseMat = new THREE.MeshStandardMaterial({ color: FIELD_CONFIG.baseColor });
  const baseGeom = new THREE.BoxGeometry(1.5, 0.25, 1.5);

  const firstBase = new THREE.Mesh(baseGeom, baseMat);
  firstBase.position.set(first.x, 0.13, first.z);
  firstBase.rotation.y = Math.PI / 4;
  firstBase.castShadow = true;
  group.add(firstBase);

  const secondBase = new THREE.Mesh(baseGeom, baseMat);
  secondBase.position.set(second.x, 0.13, second.z);
  secondBase.rotation.y = Math.PI / 4;
  secondBase.castShadow = true;
  group.add(secondBase);

  const thirdBase = new THREE.Mesh(baseGeom, baseMat);
  thirdBase.position.set(third.x, 0.13, third.z);
  thirdBase.rotation.y = Math.PI / 4;
  thirdBase.castShadow = true;
  group.add(thirdBase);

  const homeShape = new THREE.Shape();
  homeShape.moveTo(0, 0.85); homeShape.lineTo(0.85, 0.42);
  homeShape.lineTo(0.85, -0.42); homeShape.lineTo(-0.85, -0.42);
  homeShape.lineTo(-0.85, 0.42); homeShape.closePath();
  const homePlate = new THREE.Mesh(
    new THREE.ExtrudeGeometry(homeShape, { depth: 0.1, bevelEnabled: false }),
    rubberMat
  );
  homePlate.rotation.x = -Math.PI / 2;
  homePlate.position.set(0, 0.06, 0);
  group.add(homePlate);

  const lineMat = new THREE.MeshBasicMaterial({ color: FIELD_CONFIG.lineColor });

  const rightLine = new THREE.Mesh(new THREE.PlaneGeometry(0.4, FIELD_CONFIG.foulLineLength), lineMat);
  rightLine.rotation.x = -Math.PI / 2;
  rightLine.rotation.z = -Math.PI / 4;
  rightLine.position.set(FIELD_CONFIG.foulLineLength / 2 / Math.sqrt(2), 0.04, -FIELD_CONFIG.foulLineLength / 2 / Math.sqrt(2));
  group.add(rightLine);

  const leftLine = new THREE.Mesh(new THREE.PlaneGeometry(0.4, FIELD_CONFIG.foulLineLength), lineMat);
  leftLine.rotation.x = -Math.PI / 2;
  leftLine.rotation.z = Math.PI / 4;
  leftLine.position.set(-FIELD_CONFIG.foulLineLength / 2 / Math.sqrt(2), 0.04, -FIELD_CONFIG.foulLineLength / 2 / Math.sqrt(2));
  group.add(leftLine);

  const boxOutline = new THREE.EdgesGeometry(new THREE.PlaneGeometry(4, 6));
  const boxMat = new THREE.LineBasicMaterial({ color: 0xffffff, linewidth: 2 });
  const leftBox = new THREE.LineSegments(boxOutline, boxMat);
  leftBox.rotation.x = -Math.PI / 2;
  leftBox.position.set(-3, 0.05, 0);
  group.add(leftBox);
  const rightBox = new THREE.LineSegments(boxOutline.clone(), boxMat);
  rightBox.rotation.x = -Math.PI / 2;
  rightBox.position.set(3, 0.05, 0);
  group.add(rightBox);

  const catcherBox = new THREE.LineSegments(
    new THREE.EdgesGeometry(new THREE.PlaneGeometry(8, 4)),
    boxMat.clone()
  );
  catcherBox.rotation.x = -Math.PI / 2;
  catcherBox.position.set(0, 0.05, 5);
  group.add(catcherBox);

  group.position.set(FIELD_CONFIG.positionX, FIELD_CONFIG.positionY, FIELD_CONFIG.positionZ);
  group.rotation.y = FIELD_CONFIG.rotationY * (Math.PI / 180);
  scene.add(group);

  return {
    group,
    baseMeshes: { home: homePlate, first: firstBase, second: secondBase, third: thirdBase },
    basePositions: {
      home: new THREE.Vector3(home.x, 0.25, home.z - 6),
      first: new THREE.Vector3(first.x, 0.25, first.z),
      second: new THREE.Vector3(second.x, 0.25, second.z),
      third: new THREE.Vector3(third.x, 0.25, third.z),
    },
  };
}

// =============================================================================
// OUTFIELD WALL + STANDS
// =============================================================================
function createOutfieldWall() {
  const group = new THREE.Group();

  // Outfield wall
  const wallMat = new THREE.MeshStandardMaterial({ color: STADIUM_CONFIG.wallColor, roughness: 0.6 });
  const segments = 40;
  const angleSpan = Math.PI / 2;

  for (let i = 0; i < segments; i++) {
    const a1 = -Math.PI / 4 + (angleSpan / segments) * i;
    const a2 = -Math.PI / 4 + (angleSpan / segments) * (i + 1);
    const x1 = Math.sin(a1) * FIELD_CONFIG.outfieldDistance;
    const z1 = -Math.cos(a1) * FIELD_CONFIG.outfieldDistance;
    const x2 = Math.sin(a2) * FIELD_CONFIG.outfieldDistance;
    const z2 = -Math.cos(a2) * FIELD_CONFIG.outfieldDistance;
    const width = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);

    const wall = new THREE.Mesh(new THREE.BoxGeometry(width, STADIUM_CONFIG.wallHeight, 1), wallMat);
    wall.position.set((x1 + x2) / 2, STADIUM_CONFIG.wallHeight / 2, (z1 + z2) / 2);
    wall.rotation.y = Math.atan2(x2 - x1, z2 - z1);
    wall.castShadow = true;
    group.add(wall);

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.5, 1.2),
      new THREE.MeshStandardMaterial({ color: 0xffd700 })
    );
    top.position.copy(wall.position);
    top.position.y = STADIUM_CONFIG.wallHeight + 0.25;
    top.rotation.copy(wall.rotation);
    group.add(top);
  }

  // Warning track
  const trackMat = new THREE.MeshStandardMaterial({ color: FIELD_CONFIG.warningTrackColor, roughness: 1.0 });
  const track = new THREE.Mesh(
    new THREE.RingGeometry(FIELD_CONFIG.outfieldDistance - 15, FIELD_CONFIG.outfieldDistance, 48, 1, Math.PI / 4, Math.PI / 2),
    trackMat
  );
  track.rotation.x = -Math.PI / 2;
  track.position.y = 0.03;
  group.add(track);

  buildStands(group);
  scene.add(group);
  return group;
}

function buildStands(parent) {
  const standsMat = new THREE.MeshStandardMaterial({ color: 0x2a2a2a, roughness: 0.9 });
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.8 });
  const tiers = 3;
  const tierHeight = 8;
  const tierDepth = 22;
  const segments = 40;
  // Reduced wrap: 210° arc so stands don't appear awkwardly behind home plate
  const angleSpan = Math.PI * 1.17;
  const angleStart = -Math.PI / 4 - Math.PI * 0.46;

  for (let tier = 0; tier < tiers; tier++) {
    const radius = FIELD_CONFIG.outfieldDistance + 8 + tier * tierDepth;
    const height = STADIUM_CONFIG.wallHeight + 2 + tier * tierHeight;
    const matToUse = tier === 0 ? concreteMat : standsMat;

    for (let i = 0; i < segments; i++) {
      const a1 = angleStart + (angleSpan / segments) * i;
      const a2 = angleStart + (angleSpan / segments) * (i + 1);
      const x1 = Math.sin(a1) * radius, z1 = -Math.cos(a1) * radius;
      const x2 = Math.sin(a2) * radius, z2 = -Math.cos(a2) * radius;
      const w = Math.sqrt((x2 - x1) ** 2 + (z2 - z1) ** 2);

      const seat = new THREE.Mesh(new THREE.BoxGeometry(w, tierHeight, tierDepth), matToUse);
      seat.position.set((x1 + x2) / 2, height, (z1 + z2) / 2);
      seat.rotation.y = Math.atan2(x2 - x1, z2 - z1);
      seat.castShadow = true; seat.receiveShadow = true;
      parent.add(seat);
    }
  }

  // Colored seating rows on tier 0 (near home plate sections)
  const seatColors = [0x003580, 0xbd3039, 0x003580, 0xbd3039, 0x003580];
  for (let si = 0; si < seatColors.length; si++) {
    const seatMat = new THREE.MeshStandardMaterial({ color: seatColors[si] });
    const aStart = angleStart + (angleSpan * (si / seatColors.length));
    const aEnd = aStart + angleSpan / seatColors.length;
    const radius = FIELD_CONFIG.outfieldDistance + 8;
    const midA = (aStart + aEnd) / 2;
    const x = Math.sin(midA) * radius;
    const z = -Math.cos(midA) * radius;
    const spanW = Math.abs(Math.sin(aEnd - aStart) * radius * 2 + 2);
    const seatBlock = new THREE.Mesh(new THREE.BoxGeometry(spanW, 4, 18), seatMat);
    seatBlock.position.set(x, STADIUM_CONFIG.wallHeight + 4, z);
    seatBlock.rotation.y = midA;
    parent.add(seatBlock);
  }

  // Crowd instances
  if (STADIUM_CONFIG.generateCrowd) {
    const crowdGeom = new THREE.BoxGeometry(0.6, 1.4, 0.5);
    const totalSeats = 2000;
    const dummy = new THREE.Object3D();
    STADIUM_CONFIG.crowdColors.forEach((color) => {
      const count = Math.floor(totalSeats / STADIUM_CONFIG.crowdColors.length);
      const inst = new THREE.InstancedMesh(crowdGeom, new THREE.MeshStandardMaterial({ color }), count);
      let placed = 0;
      while (placed < count) {
        const tier = Math.floor(Math.random() * tiers);
        const radius = FIELD_CONFIG.outfieldDistance + 8 + tier * tierDepth + (Math.random() * tierDepth * 0.6 - tierDepth * 0.3);
        const height = STADIUM_CONFIG.wallHeight + 2 + tier * tierHeight + tierHeight / 2 + 0.7;
        const a = angleStart + Math.random() * angleSpan;
        const x = Math.sin(a) * radius;
        const z = -Math.cos(a) * radius;
        if (Math.random() > STADIUM_CONFIG.crowdDensity) { placed++; continue; }
        dummy.position.set(x, height, z);
        dummy.rotation.y = Math.atan2(-x, -z);
        dummy.updateMatrix();
        inst.setMatrixAt(placed, dummy.matrix);
        placed++;
      }
      inst.instanceMatrix.needsUpdate = true;
      parent.add(inst);
    });
  }

  // Scoreboard
  const sb = new THREE.Mesh(
    new THREE.BoxGeometry(55, 28, 3),
    new THREE.MeshStandardMaterial({ color: 0x111111, emissive: 0x002200, emissiveIntensity: 0.3 })
  );
  sb.position.set(0, STADIUM_CONFIG.wallHeight + 20, -FIELD_CONFIG.outfieldDistance - 5);
  parent.add(sb);

  const sbScreen = new THREE.Mesh(
    new THREE.PlaneGeometry(50, 24),
    new THREE.MeshBasicMaterial({ color: 0x114411 })
  );
  sbScreen.position.set(0, STADIUM_CONFIG.wallHeight + 20, -FIELD_CONFIG.outfieldDistance - 3.4);
  parent.add(sbScreen);

  // Light poles
  const lightPoleMat = new THREE.MeshStandardMaterial({ color: 0x666666 });
  for (let i = 0; i < 6; i++) {
    const a = -Math.PI / 4 + (Math.PI / 2) * (i / 5);
    const r = FIELD_CONFIG.outfieldDistance + 30;
    const x = Math.sin(a) * r, z = -Math.cos(a) * r;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.8, 65, 8), lightPoleMat);
    pole.position.set(x, 32, z);
    parent.add(pole);

    const lampHousing = new THREE.Mesh(new THREE.BoxGeometry(10, 2.5, 2), new THREE.MeshStandardMaterial({ color: 0x222222 }));
    lampHousing.position.set(x, 65, z);
    lampHousing.lookAt(0, 30, 0);
    parent.add(lampHousing);

    // Light
    const lamp = new THREE.Mesh(new THREE.PlaneGeometry(9, 2), new THREE.MeshBasicMaterial({ color: 0xffffd0, side: THREE.DoubleSide }));
    lamp.position.set(x, 65.3, z);
    lamp.lookAt(0, 30, 0);
    parent.add(lamp);
  }
}

// =============================================================================
// DETAILED BACKSTOP AREA (behind home plate)
// =============================================================================
function createBackstopArea() {
  const group = new THREE.Group();
  const postMat = new THREE.MeshStandardMaterial({ color: 0xaaaaaa, roughness: 0.4 });
  const netMat = new THREE.MeshStandardMaterial({ color: 0xbbbbbb, transparent: true, opacity: 0.10, side: THREE.DoubleSide });
  const concreteMat = new THREE.MeshStandardMaterial({ color: 0x888888, roughness: 0.85 });

  const backstopR = FIELD_CONFIG.backstopDistance;
  const backstopH = 22;
  const numPosts = 16;
  const angleSpan = Math.PI * 0.72;

  // Posts and netting panels
  for (let i = 0; i <= numPosts; i++) {
    const a = -angleSpan / 2 + (angleSpan / numPosts) * i;
    const x = Math.sin(a) * backstopR;
    const z = Math.cos(a) * backstopR;
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, backstopH, 8), postMat);
    post.position.set(x, backstopH / 2, z);
    post.castShadow = true;
    group.add(post);

    // Cross-braces at intervals
    if (i < numPosts) {
      const a2 = -angleSpan / 2 + (angleSpan / numPosts) * (i + 1);
      const x2 = Math.sin(a2) * backstopR;
      const z2 = Math.cos(a2) * backstopR;
      const w = Math.sqrt((x2 - x) ** 2 + (z2 - z) ** 2);

      // Net panel
      const net = new THREE.Mesh(new THREE.PlaneGeometry(w, backstopH), netMat);
      net.position.set((x + x2) / 2, backstopH / 2, (z + z2) / 2);
      net.rotation.y = Math.atan2(x2 - x, z2 - z);
      group.add(net);

      // Horizontal bars
      for (let hh = 0; hh <= backstopH; hh += 3.5) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(w, 0.07, 0.07), postMat);
        bar.position.set((x + x2) / 2, hh, (z + z2) / 2);
        bar.rotation.y = Math.atan2(x2 - x, z2 - z);
        group.add(bar);
      }
    }
  }

  // Ground concrete apron behind home plate (smaller radius, only the fan-shaped section)
  const apron = new THREE.Mesh(
    new THREE.CircleGeometry(backstopR * 0.55, 48, -angleSpan / 2, angleSpan),
    concreteMat
  );
  apron.rotation.x = -Math.PI / 2;
  apron.position.y = 0.005;
  group.add(apron);

  // DUGOUTS — left side (home) and right side (away)
  for (let side of [-1, 1]) {
    const dx = side * 42;
    const teamColor = side === 1 ? TEAM_CONFIG.home.primaryColor : TEAM_CONFIG.away.primaryColor;
    const teamMat = new THREE.MeshStandardMaterial({ color: teamColor, roughness: 0.8 });

    // Dugout roof
    const roof = new THREE.Mesh(new THREE.BoxGeometry(28, 0.5, 12), new THREE.MeshStandardMaterial({ color: 0x333333 }));
    roof.position.set(dx, 1.5, -12);
    group.add(roof);

    // Roof supports
    for (let pi = -1; pi <= 1; pi++) {
      const pillar = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 2, 6), concreteMat);
      pillar.position.set(dx + pi * 10, 0.75, -6);
      group.add(pillar);
    }

    // Front rail
    const rail = new THREE.Mesh(new THREE.BoxGeometry(28, 0.8, 0.4), new THREE.MeshStandardMaterial({ color: 0x555555 }));
    rail.position.set(dx, 1.1, -6.4);
    group.add(rail);

    // Back wall
    const backWall = new THREE.Mesh(new THREE.BoxGeometry(28, 4, 0.4), teamMat);
    backWall.position.set(dx, 0.5, -18);
    group.add(backWall);

    // Dugout interior floor (sunken)
    const floor = new THREE.Mesh(new THREE.BoxGeometry(28, 0.3, 12), concreteMat);
    floor.position.set(dx, -0.5, -12);
    group.add(floor);

    // Team letter on back wall
    const letterGeom = new THREE.BoxGeometry(2, 2.5, 0.2);
    const letterMesh = new THREE.Mesh(letterGeom, new THREE.MeshStandardMaterial({ color: 0xffffff }));
    letterMesh.position.set(dx, 1.5, -17.9);
    group.add(letterMesh);

    // Bench in dugout
    const bench = new THREE.Mesh(new THREE.BoxGeometry(24, 0.3, 1.5), new THREE.MeshStandardMaterial({ color: 0x5c3d1e }));
    bench.position.set(dx, 0.3, -14);
    group.add(bench);

    // Dugout players (static decorative)
    for (let p = 0; p < 5; p++) {
      const px = dx - 10 + p * 5;
      const player = createGeneratedPlayer('fielder', new THREE.Vector3(px, -0.5, -13), teamColor);
      player.scale.setScalar(0.8);
      poseFielderIdle(player);
      player.lookAt(new THREE.Vector3(0, 0, 0));
      // Don't add to scene separately - but createGeneratedPlayer adds to scene...
      // Let's add it to the group and remove from scene first
      scene.remove(player);
      group.add(player);
    }
  }

  // PRESS BOX above home plate (on top of upper deck)
  const pressBoxMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e, roughness: 0.7 });
  const pressBox = new THREE.Mesh(new THREE.BoxGeometry(50, 10, 16), pressBoxMat);
  pressBox.position.set(0, 62, backstopR + 18);
  group.add(pressBox);

  // Press box windows
  const winMat = new THREE.MeshStandardMaterial({ color: 0x6699bb, transparent: true, opacity: 0.7 });
  for (let w = -4; w <= 4; w++) {
    const win = new THREE.Mesh(new THREE.PlaneGeometry(4.5, 6), winMat);
    win.position.set(w * 5.2, 62, backstopR + 10.1);
    group.add(win);
  }

  // Press box logo stripe
  const logoStripe = new THREE.Mesh(new THREE.BoxGeometry(50, 1.5, 0.3), new THREE.MeshStandardMaterial({ color: 0xcc0000 }));
  logoStripe.position.set(0, 67.5, backstopR + 18);
  group.add(logoStripe);

  // Home plate expanded seating bowl (lower box seats)
  const bowlMat = new THREE.MeshStandardMaterial({ color: 0x222244, roughness: 0.9 });
  const innerBowl = new THREE.Mesh(new THREE.TorusGeometry(backstopR + 12, 10, 4, 32, angleSpan), bowlMat);
  innerBowl.position.set(0, 14, 0);
  innerBowl.rotation.x = Math.PI / 2;
  group.add(innerBowl);

  // FOUL POLES — tall yellow poles at foul lines
  const foulPoleColor = new THREE.MeshStandardMaterial({ color: 0xffd700, roughness: 0.3 });
  for (let side of [-1, 1]) {
    const angle = side * Math.PI / 4;
    const r = FIELD_CONFIG.foulLineLength;
    const px = Math.sin(angle) * r;
    const pz = -Math.cos(angle) * r;

    const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.35, 55, 8), foulPoleColor);
    pole.position.set(px, 27.5, pz);
    pole.castShadow = true;
    group.add(pole);

    const screen = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 10), foulPoleColor);
    screen.position.set(px + side * 1.25, 50, pz);
    group.add(screen);

    // Flag at top
    const flag = new THREE.Mesh(new THREE.PlaneGeometry(3, 2), new THREE.MeshStandardMaterial({ color: side === 1 ? 0x003580 : 0xbd3039, side: THREE.DoubleSide }));
    flag.position.set(px + side * 1.5, 56, pz);
    group.add(flag);
  }

  // Bullpen areas in foul territory (beyond 1st and 3rd)
  for (let side of [-1, 1]) {
    const bpX = side * 160, bpZ = -120;
    const bullpenMat = new THREE.MeshStandardMaterial({ color: 0x1a5a1a, roughness: 0.9 });
    const moundGeo = new THREE.CylinderGeometry(7, 9, 0.5, 16);
    const bpMound = new THREE.Mesh(moundGeo, new THREE.MeshStandardMaterial({ color: 0x8B7355 }));
    bpMound.position.set(bpX, 0.25, bpZ);
    group.add(bpMound);
  }

  scene.add(group);
  return group;
}

// =============================================================================
// CUSTOM STADIUM LOADING + FIELD OVERRIDES
// =============================================================================
function loadCustomStadium() {
  const cfg = CUSTOM_STADIUM_CONFIG;
  if (!cfg.enabled || !cfg.path) return Promise.resolve();
  return new Promise((resolve) => {
    const loader = new GLTFLoader();
    loader.load(cfg.path, (gltf) => {
      customStadiumModel = gltf.scene;
      customStadiumModel.scale.setScalar(cfg.scale);
      customStadiumModel.position.set(cfg.position.x, cfg.position.y, cfg.position.z);
      customStadiumModel.rotation.set(
        THREE.MathUtils.degToRad(cfg.rotation.x),
        THREE.MathUtils.degToRad(cfg.rotation.y),
        THREE.MathUtils.degToRad(cfg.rotation.z)
      );
      customStadiumModel.traverse(child => {
        if (child.isMesh) { child.castShadow = true; child.receiveShadow = true; }
      });
      scene.add(customStadiumModel);
      resolve();
    }, undefined, (err) => {
      console.warn('Custom stadium failed to load:', err);
      resolve();
    });
  });
}

function applyHideGeneratedField() {
  if (!CUSTOM_STADIUM_CONFIG.hideGeneratedField) return;
  if (fieldData) fieldData.group.visible = false;
  if (outfieldWallGroup) outfieldWallGroup.visible = false;
  if (backstopGroup) backstopGroup.visible = false;
}

function applyBaseOverrides() {
  if (!fieldData) return;
  const ov = CUSTOM_STADIUM_CONFIG.baseOverrides;
  ['home', 'first', 'second', 'third'].forEach(name => {
    if (!ov[name]) return;
    const { x, y, z } = ov[name];
    fieldData.basePositions[name].set(x, y, z);
    const mesh = fieldData.baseMeshes[name];
    if (mesh) mesh.position.set(x, y - 0.12, z);
  });
}

// =============================================================================
// BAT CREATION
// =============================================================================
function createBat() {
  const group = new THREE.Group();

  const handleMat = new THREE.MeshStandardMaterial({ color: BAT_CONFIG.gripColor, roughness: 0.7 });
  const barrelMat = new THREE.MeshStandardMaterial({ color: BAT_CONFIG.woodColor, roughness: 0.5 });

  const handle = new THREE.Mesh(
    new THREE.CylinderGeometry(BAT_CONFIG.handleRadius, BAT_CONFIG.handleRadius * 0.8, BAT_CONFIG.length * 0.4, 16),
    handleMat
  );
  handle.position.y = BAT_CONFIG.length * 0.2;
  handle.castShadow = true;
  group.add(handle);

  const barrel = new THREE.Mesh(
    new THREE.CylinderGeometry(BAT_CONFIG.barrelRadius, BAT_CONFIG.handleRadius, BAT_CONFIG.length * 0.6, 16),
    barrelMat
  );
  barrel.position.y = BAT_CONFIG.length * 0.7;
  barrel.castShadow = true;
  group.add(barrel);

  const cap = new THREE.Mesh(
    new THREE.SphereGeometry(BAT_CONFIG.barrelRadius, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2),
    barrelMat
  );
  cap.position.y = BAT_CONFIG.length;
  group.add(cap);

  const knob = new THREE.Mesh(new THREE.SphereGeometry(BAT_CONFIG.handleRadius * 1.6, 16, 16), handleMat);
  knob.position.y = 0;
  group.add(knob);

  return group;
}

// =============================================================================
// PLAYER CREATION
// =============================================================================
function createGeneratedPlayer(type, position, teamColor) {
  const group = new THREE.Group();
  const skinColor = new THREE.Color(0xc68642);
  const jerseyColor = new THREE.Color(teamColor || TEAM_CONFIG.home.primaryColor);
  const pantsColor = new THREE.Color(0xeeeeee);
  const h = PLAYER_CONFIG.height;

  const hip = new THREE.Group();
  hip.position.y = h * 0.45;
  group.add(hip);

  const jerseyMat = new THREE.MeshStandardMaterial({ color: jerseyColor, roughness: 0.6 });
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.5, h * 0.32, 12), jerseyMat);
  torso.position.y = h * 0.16;
  torso.castShadow = true;
  hip.add(torso);

  // Number on jersey
  const numMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
  const numBadge = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.5), numMat);
  numBadge.position.set(0, h * 0.16, 0.56);
  hip.add(numBadge);

  const belt = new THREE.Mesh(
    new THREE.CylinderGeometry(0.5, 0.5, 0.08, 12),
    new THREE.MeshStandardMaterial({ color: 0x111111 })
  );
  belt.position.y = -0.02;
  hip.add(belt);

  const legsGroup = new THREE.Group();
  legsGroup.position.y = -h * 0.05;
  hip.add(legsGroup);

  const legGeom = new THREE.CylinderGeometry(0.13, 0.11, h * 0.4, 8);
  const legMat = new THREE.MeshStandardMaterial({ color: pantsColor, roughness: 0.8 });

  const leftLegPivot = new THREE.Group();
  leftLegPivot.position.set(-0.18, 0, 0);
  legsGroup.add(leftLegPivot);
  const leftLeg = new THREE.Mesh(legGeom, legMat);
  leftLeg.position.y = -h * 0.2;
  leftLeg.castShadow = true;
  leftLegPivot.add(leftLeg);

  const rightLegPivot = new THREE.Group();
  rightLegPivot.position.set(0.18, 0, 0);
  legsGroup.add(rightLegPivot);
  const rightLeg = new THREE.Mesh(legGeom, legMat);
  rightLeg.position.y = -h * 0.2;
  rightLeg.castShadow = true;
  rightLegPivot.add(rightLeg);

  // Stirrups
  const stirrupMat = new THREE.MeshStandardMaterial({ color: jerseyColor, roughness: 0.8 });
  for (let leg of [leftLegPivot, rightLegPivot]) {
    const stirrup = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.10, h * 0.1, 8), stirrupMat);
    stirrup.position.y = -h * 0.38;
    leg.add(stirrup);
  }

  const cleatMat = new THREE.MeshStandardMaterial({ color: 0x111111 });
  const leftFoot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.55), cleatMat);
  leftFoot.position.set(0, -h * 0.4 - 0.075, 0.1);
  leftFoot.castShadow = true;
  leftLegPivot.add(leftFoot);
  const rightFoot = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.15, 0.55), cleatMat);
  rightFoot.position.set(0, -h * 0.4 - 0.075, 0.1);
  rightFoot.castShadow = true;
  rightLegPivot.add(rightFoot);

  const shoulderY = h * 0.32;
  const leftShoulder = new THREE.Group();
  leftShoulder.position.set(-0.55, shoulderY, 0);
  hip.add(leftShoulder);
  const rightShoulder = new THREE.Group();
  rightShoulder.position.set(0.55, shoulderY, 0);
  hip.add(rightShoulder);

  const upperArmGeom = new THREE.CylinderGeometry(0.11, 0.09, h * 0.18, 8);
  const armMat = new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 });

  const leftUpperArm = new THREE.Mesh(upperArmGeom, armMat);
  leftUpperArm.position.y = -h * 0.09;
  leftUpperArm.castShadow = true;
  leftShoulder.add(leftUpperArm);
  const leftElbow = new THREE.Group();
  leftElbow.position.y = -h * 0.18;
  leftShoulder.add(leftElbow);
  const leftForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, h * 0.16, 8), armMat);
  leftForearm.position.y = -h * 0.08;
  leftForearm.castShadow = true;
  leftElbow.add(leftForearm);
  const leftHand = new THREE.Group();
  leftHand.position.y = -h * 0.16;
  leftElbow.add(leftHand);
  leftHand.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), armMat));

  const rightUpperArm = new THREE.Mesh(upperArmGeom, armMat);
  rightUpperArm.position.y = -h * 0.09;
  rightUpperArm.castShadow = true;
  rightShoulder.add(rightUpperArm);
  const rightElbow = new THREE.Group();
  rightElbow.position.y = -h * 0.18;
  rightShoulder.add(rightElbow);
  const rightForearm = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.08, h * 0.16, 8), armMat);
  rightForearm.position.y = -h * 0.08;
  rightForearm.castShadow = true;
  rightElbow.add(rightForearm);
  const rightHand = new THREE.Group();
  rightHand.position.y = -h * 0.16;
  rightElbow.add(rightHand);
  rightHand.add(new THREE.Mesh(new THREE.SphereGeometry(0.1, 10, 10), armMat));

  // Head + helmet
  const head = new THREE.Mesh(
    new THREE.SphereGeometry(0.27, 16, 16),
    new THREE.MeshStandardMaterial({ color: skinColor, roughness: 0.7 })
  );
  head.position.y = h * 0.4;
  head.castShadow = true;
  hip.add(head);

  const helmetMat = new THREE.MeshStandardMaterial({ color: jerseyColor, roughness: 0.35 });
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.3, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2), helmetMat);
  cap.position.y = h * 0.43;
  hip.add(cap);

  // Helmet ear flap (for batters)
  if (type === 'batter') {
    const earFlap = new THREE.Mesh(new THREE.SphereGeometry(0.14, 8, 8, 0, Math.PI, 0, Math.PI / 2), helmetMat);
    earFlap.position.set(-0.24, h * 0.41, 0.1);
    earFlap.rotation.z = -Math.PI / 2;
    hip.add(earFlap);
  }

  const brim = new THREE.Mesh(
    new THREE.CylinderGeometry(0.4, 0.4, 0.04, 16, 1, false, Math.PI * 1.7, Math.PI * 0.6),
    helmetMat
  );
  brim.position.set(0, h * 0.41, 0.18);
  hip.add(brim);

  // Glove for fielders/catchers
  if (type === 'fielder' || type === 'catcher') {
    const gloveMat = new THREE.MeshStandardMaterial({ color: 0x8B4513, roughness: 0.8 });
    const glove = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 10), gloveMat);
    leftHand.add(glove);
  }

  group.position.copy(position);
  group.userData = {
    type,
    teamColor,
    jerseyMaterials: [jerseyMat, stirrupMat, helmetMat],
    skeleton: { hip, torso, legs: legsGroup, leftLegPivot, rightLegPivot, leftShoulder, rightShoulder, leftElbow, rightElbow, leftHand, rightHand, head },
    animState: 'idle',
    animTime: 0,
  };

  scene.add(group);
  return group;
}

// =============================================================================
function setPlayerTeamColor(player, newColor) {
  const c = new THREE.Color(newColor);
  (player.userData.jerseyMaterials || []).forEach(m => m.color.copy(c));
  player.userData.teamColor = newColor;
}

function refreshPlayerColors() {
  // Batter wears batting team's color; pitcher+fielders wear fielding team's color
  const battingColor  = isTopOfInning ? TEAM_CONFIG.away.primaryColor : TEAM_CONFIG.home.primaryColor;
  const fieldingColor = isTopOfInning ? TEAM_CONFIG.home.primaryColor : TEAM_CONFIG.away.primaryColor;
  if (batter)  setPlayerTeamColor(batter, battingColor);
  if (pitcher) setPlayerTeamColor(pitcher, fieldingColor);
  Object.values(fielders).forEach(f => setPlayerTeamColor(f, fieldingColor));
}

// =============================================================================
// PROCEDURAL ANIMATIONS
// =============================================================================
function poseBatterIdle(player) {
  const s = player.userData.skeleton;
  s.hip.position.y = PLAYER_CONFIG.height * 0.43;
  player.rotation.y = Math.PI;
  s.rightShoulder.rotation.set(-0.6, 0, -1.6);
  s.rightElbow.rotation.set(0, 0, 1.0);
  s.leftShoulder.rotation.set(-0.6, 0, -1.6);
  s.leftElbow.rotation.set(0, 0, 1.0);
  s.leftLegPivot.rotation.set(0, 0, 0);
  s.rightLegPivot.rotation.set(0, 0, 0);
}

function posePitcherIdle(player) {
  const s = player.userData.skeleton;
  s.hip.position.y = PLAYER_CONFIG.height * 0.45;
  player.rotation.y = 0;
  s.rightShoulder.rotation.set(0, 0, 0);
  s.leftShoulder.rotation.set(0, 0, 0);
  s.rightElbow.rotation.set(0, 0, 0);
  s.leftElbow.rotation.set(0, 0, 0);
  s.leftLegPivot.rotation.set(0, 0, 0);
  s.rightLegPivot.rotation.set(0, 0, 0);
}

function poseFielderIdle(player) {
  const s = player.userData.skeleton;
  s.hip.position.y = PLAYER_CONFIG.height * 0.42;
  s.rightShoulder.rotation.set(0.3, 0, -0.2);
  s.leftShoulder.rotation.set(0.3, 0, 0.2);
  s.rightElbow.rotation.set(0.6, 0, 0);
  s.leftElbow.rotation.set(0.6, 0, 0);
  s.leftLegPivot.rotation.set(0, 0, 0);
  s.rightLegPivot.rotation.set(0, 0, 0);
}

class ProceduralSwingAnimator {
  constructor(player) {
    this.player = player;
    this.bat = null;
    this.batPivot = null;
    this.swinging = false;
    this.t = 0;
    this.duration = PLAYER_CONFIG.swingDuration;
    this.contactT = 0.55;
    this._onContactCallback = null;
  }

  setBat(bat) {
    const s = this.player.userData.skeleton;
    const pivot = new THREE.Group();
    s.rightHand.add(pivot);
    pivot.add(bat);
    bat.position.set(0, 0, 0);
    bat.rotation.set(-0.3, 0, 0);
    this.batPivot = pivot;
    this.bat = bat;
  }

  startSwing(onContact) {
    this.swinging = true;
    this.t = 0;
    this._onContactCallback = onContact;
    this._contactFired = false;
  }

  update(dt) {
    if (!this.swinging) return;
    const s = this.player.userData.skeleton;
    this.t += dt;
    const u = Math.min(this.t / this.duration, 1.0);
    const loaded = this.smoothstep(0, 0.35, u);
    const explode = this.smoothstep(0.35, 0.65, u);
    const follow = this.smoothstep(0.65, 1.0, u);

    s.hip.rotation.y = -loaded * 0.35 + explode * 1.4 + follow * 0.3;
    s.rightShoulder.rotation.x = -0.6 - loaded * 0.5 + explode * 1.4;
    s.rightShoulder.rotation.z = -1.6 + explode * 1.6;
    s.rightShoulder.rotation.y = explode * 1.0;
    s.rightElbow.rotation.z = 1.0 - explode * 0.9;
    s.leftShoulder.rotation.x = -0.6 - loaded * 0.4 + explode * 1.2;
    s.leftShoulder.rotation.z = -1.6 + explode * 1.4;
    s.leftElbow.rotation.z = 1.0 - explode * 0.7;

    if (this.bat) {
      this.bat.rotation.x = -0.3 + explode * 2.4;
      this.bat.rotation.z = 0;
    }

    if (!this._contactFired && u >= this.contactT) {
      this._contactFired = true;
      if (this._onContactCallback) this._onContactCallback();
    }

    if (u >= 1.0) {
      this.swinging = false;
      setTimeout(() => poseBatterIdle(this.player), 250);
    }
  }

  smoothstep(a, b, x) {
    if (x <= a) return 0;
    if (x >= b) return 1;
    const t = (x - a) / (b - a);
    return t * t * (3 - 2 * t);
  }

  isInContactWindow() {
    if (!this.swinging) return false;
    const u = this.t / this.duration;
    return u >= 0.45 && u <= 0.65;
  }
}

class ProceduralPitchAnimator {
  constructor(player) {
    this.player = player;
    this.pitching = false;
    this.t = 0;
    this.duration = PLAYER_CONFIG.pitchDuration;
    this._releaseCallback = null;
    this._fired = false;
  }

  startPitch(onRelease) {
    this.pitching = true;
    this.t = 0;
    this._releaseCallback = onRelease;
    this._fired = false;
  }

  update(dt) {
    if (!this.pitching) return;
    const s = this.player.userData.skeleton;
    this.t += dt;
    const u = Math.min(this.t / this.duration, 1.0);
    const windup = this.smoothstep(0, 0.4, u);
    const release = this.smoothstep(0.4, 0.7, u);
    const follow = this.smoothstep(0.7, 1.0, u);

    s.rightShoulder.rotation.x = -windup * 2.8 + release * 4.2;
    s.rightShoulder.rotation.z = windup * 0.4 - release * 0.4;
    s.rightElbow.rotation.x = -windup * 0.8 + release * 0.6;
    s.leftLegPivot.rotation.x = -windup * 1.4 + release * 1.4;
    s.hip.rotation.x = release * 0.3 - follow * 0.3;

    if (!this._fired && u >= 0.6) {
      this._fired = true;
      if (this._releaseCallback) this._releaseCallback();
    }

    if (u >= 1.0) {
      this.pitching = false;
      setTimeout(() => posePitcherIdle(this.player), 300);
    }
  }

  smoothstep(a, b, x) {
    if (x <= a) return 0;
    if (x >= b) return 1;
    const t = (x - a) / (b - a);
    return t * t * (3 - 2 * t);
  }
}

// =============================================================================
// CUSTOM CHARACTER SYSTEM
// =============================================================================

// Wraps one cloned FBX mesh + its AnimationMixer
class CustomPlayer {
  constructor(mesh, clips) {
    this.mesh = mesh;
    this.mixer = new THREE.AnimationMixer(mesh);
    this.actions = {};
    this.currentAction = null;
    this.rightHandBone = null;
    this.leftHandBone  = null;

    for (const [name, clip] of Object.entries(clips)) {
      this.actions[name] = this.mixer.clipAction(clip);
    }

    // Locate Mixamo hand bones (handles both 'mixamorigRightHand' and 'RightHand')
    mesh.traverse(n => {
      const nl = n.name.toLowerCase();
      const notFinger = !['index','middle','ring','pinky','thumb'].some(s => nl.includes(s));
      if (notFinger && nl.includes('righthand') && !this.rightHandBone) this.rightHandBone = n;
      if (notFinger && nl.includes('lefthand')  && !this.leftHandBone)  this.leftHandBone  = n;
    });
  }

  play(name, loop = true, fadeIn = 0.2) {
    const action = this.actions[name];
    if (!action) return this;
    if (this.currentAction && this.currentAction !== action) this.currentAction.fadeOut(fadeIn);
    action.reset().fadeIn(fadeIn);
    action.setLoop(loop ? THREE.LoopRepeat : THREE.LoopOnce, Infinity);
    if (!loop) action.clampWhenFinished = true;
    action.play();
    this.currentAction = action;
    return this;
  }

  playOnce(name, fadeIn = 0.15, onDone) {
    this.play(name, false, fadeIn);
    if (onDone) {
      const fn = (e) => {
        if (e.action === this.actions[name]) {
          this.mixer.removeEventListener('finished', fn);
          onDone();
        }
      };
      this.mixer.addEventListener('finished', fn);
    }
    return this;
  }

  idle()    { return this.play('idle'); }
  run()     { return this.play('run'); }
  update(dt){ this.mixer.update(dt); }
  get position() { return this.mesh.position; }
}

// Same public API as ProceduralPitchAnimator (startPitch, update, .pitching)
class CustomPitchAnimator {
  constructor(player) {
    this.player = player;
    this.pitching = false;
    this.t = 0;
    this.duration = 0.7;
    this._cb = null;
    this._fired = false;
  }

  startPitch(onRelease) {
    this.pitching = true;
    this.t = 0;
    this._cb = onRelease;
    this._fired = false;
    // Normalize playback so pitch completes in PLAYER_CONFIG.pitchDuration (matches procedural timing)
    this.duration = PLAYER_CONFIG.pitchDuration;
    const action = this.player.actions['pitch'];
    this.player.play('pitch', false, 0.05);
    if (action) action.timeScale = action.getClip().duration / this.duration;
    customBallHeld = true; // ball tracks hand until release
  }

  update(dt) {
    if (!this.pitching) return;
    this.t += dt;
    const u = Math.min(this.t / this.duration, 1.0);

    // Track ball to right-hand bone while winding up
    if (customBallHeld && this.player.rightHandBone) {
      const wp = new THREE.Vector3();
      this.player.rightHandBone.getWorldPosition(wp);
      baseball.position.copy(wp);
    }

    if (!this._fired && u >= CUSTOM_CHAR_CONFIG.releasePoint) {
      this._fired = true;
      customBallHeld = false;
      if (this._cb) this._cb(); // → launchPitch()
    }

    if (u >= 1.0) {
      this.pitching = false;
      setTimeout(() => { if (this.player) this.player.play('standIdle'); }, 200);
    }
  }

  smoothstep(a, b, x) {
    if (x <= a) return 0; if (x >= b) return 1;
    const t = (x - a) / (b - a); return t * t * (3 - 2 * t);
  }
}

// Same public API as ProceduralSwingAnimator (startSwing, update, .swinging, .isInContactWindow, setBat)
class CustomSwingAnimator {
  constructor(player) {
    this.player = player;
    this.swinging = false;
    this.t = 0;
    this.duration = 0.45;
    this.contactT = CUSTOM_CHAR_CONFIG.contactPoint;
    this._cb = null;
    this._contactFired = false;
    this.bat = null;
    this.batPivot = null;
  }

  setBat(bat) {
    // Add to scene root — world-space position is tracked to the hand bone each frame,
    // avoiding scale inheritance from the 0.033-scaled FBX hierarchy.
    scene.add(bat);
    this.bat = bat;
    this.batPivot = null;
  }

  startSwing(onContact) {
    this.swinging = true;
    this.t = 0;
    this._cb = onContact;
    this._contactFired = false;
    // Normalize playback so swing completes in PLAYER_CONFIG.swingDuration (matches procedural timing)
    this.duration = PLAYER_CONFIG.swingDuration;
    const action = this.player.actions['swing'];
    this.player.play('swing', false, 0.05);
    if (action) action.timeScale = action.getClip().duration / this.duration;
  }

  update(dt) {
    // Track bat to hand bone every frame regardless of swing state
    if (this.bat && this.player.rightHandBone) {
      const _bwp = new THREE.Vector3();
      const _bwq = new THREE.Quaternion();
      this.player.rightHandBone.getWorldPosition(_bwp);
      this.player.rightHandBone.getWorldQuaternion(_bwq);
      this.bat.position.copy(_bwp);
      const cfg = CUSTOM_CHAR_CONFIG;
      const offsetQ = new THREE.Quaternion().setFromEuler(
        new THREE.Euler(cfg.batRotation.x, cfg.batRotation.y, cfg.batRotation.z)
      );
      _bwq.multiply(offsetQ);
      this.bat.quaternion.copy(_bwq);
    }

    if (!this.swinging) return;
    this.t += dt;
    const u = Math.min(this.t / this.duration, 1.0);
    if (!this._contactFired && u >= this.contactT) {
      this._contactFired = true;
      if (this._cb) this._cb(); // → resolveContact()
    }
    if (u >= 1.0) {
      this.swinging = false;
      setTimeout(() => { if (this.player) this.player.idle(); }, 200);
    }
  }

  isInContactWindow() {
    if (!this.swinging) return false;
    const u = this.t / this.duration;
    return u >= 0.45 && u <= 0.65;
  }

  smoothstep(a, b, x) {
    if (x <= a) return 0; if (x >= b) return 1;
    const t = (x - a) / (b - a); return t * t * (3 - 2 * t);
  }
}

// Load all FBX assets (cached after first call)
async function loadCustomCharacters() {
  if (customCharAssets) return true;

  const loader = new FBXLoader();
  const load = (path) => new Promise(res =>
    loader.load(path, res, undefined, err => { console.warn('FBX load failed:', path, err); res(null); })
  );

  const base = await load('/claudechar2.fbx');
  if (!base) { console.error('Base character failed to load'); return false; }

  const animPaths = {
    idle:       '/Baseball Idle (1).fbx',
    standIdle:  '/Idle.fbx',
    pitch:      '/Baseball Pitching (1).fbx',
    swing:      '/Baseball Hit (1).fbx',
    run:        '/Running (1).fbx',
    catcher:    '/Baseball Catcher (2).fbx',
    strike:     '/Baseball Strike.fbx',
    catchBall:  '/Catch Ball.fbx',
    slide:      '/Running Slide (1).fbx',
    bunt:       '/Baseball Bunt (1).fbx',
    celebrate1: '/Wave Hip Hop Dance.fbx',
    celebrate2: '/Chicken Dance.fbx',
    punch:      '/Illegal Elbow Punch.fbx',
  };

  const clips = {};
  for (const [name, path] of Object.entries(animPaths)) {
    const fbx = await load(path);
    if (fbx && fbx.animations.length > 0) {
      const clip = fbx.animations[0];
      clip.name = name;
      clips[name] = clip;
    }
  }

  customCharAssets = { base, clips };
  return true;
}

function spawnCustomPlayer(position, rotY = 0, teamTint = null) {
  const mesh = skeletonClone(customCharAssets.base);
  const base = CUSTOM_CHAR_CONFIG.scale;
  const w = CUSTOM_CHAR_CONFIG.weight;
  // Exponential curve: center (w=0.5) is normal, extremes are wild
  const wFactor = Math.exp((w - 0.5) * 3.2);  // 0 → 0.20×, 0.5 → 1.0×, 1 → 4.95× width
  const hFactor = Math.exp(-(w - 0.5) * 2.2); // 0 → 3.0×, 0.5 → 1.0×, 1 → 0.33× height
  mesh.scale.set(base * wFactor, base * hFactor, base * wFactor);
  mesh.position.copy(position);
  mesh.rotation.y = rotY;
  mesh.traverse(c => {
    if (c.isMesh) {
      c.castShadow = true; c.receiveShadow = true;
      if (teamTint !== null) {
        const mats = Array.isArray(c.material) ? c.material : [c.material];
        mats.forEach(m => {
          if (m) { const nm = m.clone(); nm.color.setHex(teamTint); c.material = nm; }
        });
      }
    }
  });
  scene.add(mesh);
  return new CustomPlayer(mesh, customCharAssets.clips);
}

// Create all custom players and swap in custom animators
function initCustomCharacters() {
  destroyCustomCharacters();

  // Batter
  customBatterPlayer = spawnCustomPlayer(new THREE.Vector3(1.6, 0, 1.5), CUSTOM_CHAR_CONFIG.batterRotationY);
  customBatterPlayer.idle();

  const awayTint = TEAM_CONFIG.away.primaryColor;

  // Pitcher — face home plate
  customPitcherPlayer = spawnCustomPlayer(
    new THREE.Vector3(0, FIELD_CONFIG.moundHeight, -FIELD_CONFIG.pitchingDistance), 0, awayTint
  );
  customPitcherPlayer.mesh.lookAt(new THREE.Vector3(0, 0, 0));
  customPitcherPlayer.play('standIdle');

  // Catcher — use catcher squat anim as idle
  customCatcherPlayer = spawnCustomPlayer(new THREE.Vector3(0, 0, 4), Math.PI, awayTint);
  customCatcherPlayer.play('catcher', true, 0.1);

  // Fielders
  for (const [role, pos] of Object.entries(FIELD_POSITIONS)) {
    if (role === 'pitcher' || role === 'catcher') continue;
    const cp = spawnCustomPlayer(new THREE.Vector3(pos.x, 0, pos.z), 0, awayTint);
    cp.mesh.lookAt(new THREE.Vector3(0, 0, 0));
    cp.play('standIdle');
    customFielderPlayers[role] = cp;
  }

  // Swap animators: same API, custom visual output
  pitchAnimator = new CustomPitchAnimator(customPitcherPlayer);
  swingAnimator = new CustomSwingAnimator(customBatterPlayer);
  const customBat = createBat();           // fresh bat mesh for custom batter
  swingAnimator.setBat(customBat);

  setProceduralVisibility(false);
}

function destroyCustomCharacters() {
  // Remove bat from scene root (world-space attachment — not part of any mesh hierarchy)
  if (swingAnimator && swingAnimator instanceof CustomSwingAnimator && swingAnimator.bat) {
    scene.remove(swingAnimator.bat);
  }
  [customBatterPlayer, customPitcherPlayer, customCatcherPlayer,
    ...Object.values(customFielderPlayers)].forEach(p => { if (p) scene.remove(p.mesh); });
  customBatterPlayer  = null;
  customPitcherPlayer = null;
  customCatcherPlayer = null;
  customFielderPlayers = {};
  customBallHeld = false;
}

function setProceduralVisibility(visible) {
  if (batter)       batter.visible = visible;
  if (pitcher)      pitcher.visible = visible;
  if (catcherPlayer) catcherPlayer.visible = visible;
  if (fielders) Object.values(fielders).forEach(f => { if (f) f.visible = visible; });
}

// Per-frame custom character update — sync positions to procedural (AI still drives them)
const _cpPrevPos = new WeakMap();

function updateCustomModels(dt) {
  if (!CUSTOM_CHAR_CONFIG.enabled || !customCharAssets) return;

  // Keep ball at hand while pitcher holds it (between pitch requests)
  if (!customBallHeld &&
      (gameState === GAME_STATE.AWAITING_PITCH_REQUEST ||
       gameState === GAME_STATE.PITCH_AIMING) &&
      customPitcherPlayer && customPitcherPlayer.rightHandBone) {
    const wp = new THREE.Vector3();
    customPitcherPlayer.rightHandBone.getWorldPosition(wp);
    baseball.position.copy(wp);
  }

  // Update all mixers
  [customBatterPlayer, customPitcherPlayer, customCatcherPlayer,
    ...Object.values(customFielderPlayers)].forEach(p => { if (p) p.update(dt); });

  // Anchor custom characters to the custom stadium's home plate so they line up with the GLB field,
  // not the hidden procedural field. Fine-tune with xOffset/yOffset/zOffset in CUSTOM_CHAR_CONFIG.
  const _xo = CUSTOM_CHAR_CONFIG.xOffset;
  const _yo = CUSTOM_CHAR_CONFIG.yOffset;
  const _zo = CUSTOM_CHAR_CONFIG.zOffset;
  const _cHome = CUSTOM_STADIUM_CONFIG.baseOverrides ? CUSTOM_STADIUM_CONFIG.baseOverrides.home : { x: 0, y: 0, z: 0 };
  const _fdx = _cHome.x + _xo;  // total X shift: stadium anchor + user fine-tune
  const _fdz = _cHome.z + _zo;  // total Z shift

  const _bxo = CUSTOM_CHAR_CONFIG.batterXOffset  || 0;
  const _cxo = CUSTOM_CHAR_CONFIG.catcherXOffset || 0;
  if (customBatterPlayer && batter) {
    customBatterPlayer.mesh.position.set(batter.position.x + _fdx + _bxo, batter.position.y + _yo, batter.position.z + _fdz);
    customBatterPlayer.mesh.rotation.y = CUSTOM_CHAR_CONFIG.batterRotationY;
  }
  if (customPitcherPlayer && pitcher) {
    customPitcherPlayer.mesh.position.set(pitcher.position.x + _fdx, pitcher.position.y + _yo, pitcher.position.z + _fdz);
    customPitcherPlayer.mesh.rotation.y = pitcher.rotation.y;
  }
  if (customCatcherPlayer && catcherPlayer) {
    customCatcherPlayer.mesh.position.set(catcherPlayer.position.x + _fdx + _cxo, catcherPlayer.position.y + _yo, catcherPlayer.position.z + _fdz);
  }

  // Sync fielders and blend idle/run
  for (const [role, cp] of Object.entries(customFielderPlayers)) {
    const pf = fielders[role];
    if (!pf || !cp) continue;
    const prev = _cpPrevPos.get(cp) || pf.position.clone();
    const moved = pf.position.distanceTo(prev) > 0.05;
    _cpPrevPos.set(cp, pf.position.clone());

    cp.mesh.position.set(pf.position.x + _fdx, pf.position.y + _yo, pf.position.z + _fdz);
    cp.mesh.rotation.y = pf.rotation.y || 0;

    const wantAnim = moved ? 'run' : 'standIdle';
    if (cp.currentAction !== cp.actions[wantAnim]) cp.play(wantAnim, true, 0.2);
  }

  // Catcher: play catchBall when ball is very close, then return to catcher squat
  if (customCatcherPlayer && catcherPlayer) {
    const distBallToCatcher = baseball.position.distanceTo(catcherPlayer.position);
    if (distBallToCatcher < 3 && !baseball.userData.isInPlay &&
        baseball.userData.isPitched && !pitchAnimator.pitching) {
      if (customCatcherPlayer.currentAction !== customCatcherPlayer.actions['catchBall']) {
        customCatcherPlayer.playOnce('catchBall', 0.1, () => {
          if (customCatcherPlayer) customCatcherPlayer.play('catcher', true, 0.3);
        });
      }
    }
  }

  // Batter: play strike animation on swing-and-miss (detected via game state reset)
  if (customBatterPlayer && !swingAnimator.swinging &&
      gameState === GAME_STATE.AWAITING_PITCH_REQUEST &&
      customBatterPlayer.currentAction === customBatterPlayer.actions['swing']) {
    customBatterPlayer.playOnce('strike', 0.1, () => {
      if (customBatterPlayer) customBatterPlayer.idle();
    });
  }
}

function updateRunningCycle(player, dt) {
  const s = player.userData.skeleton;
  if (!player.userData.runPhase) player.userData.runPhase = 0;
  player.userData.runPhase += dt * 7;
  const swing = Math.sin(player.userData.runPhase) * 0.9;
  s.leftLegPivot.rotation.x = swing;
  s.rightLegPivot.rotation.x = -swing;
  s.leftShoulder.rotation.x = -swing * 0.8;
  s.rightShoulder.rotation.x = swing * 0.8;
  s.leftShoulder.rotation.z = 0;
  s.rightShoulder.rotation.z = 0;
  s.leftElbow.rotation.z = 0;
  s.rightElbow.rotation.z = 0;
  s.hip.position.y = PLAYER_CONFIG.height * 0.45 + Math.abs(Math.sin(player.userData.runPhase)) * 0.05;
}

// =============================================================================
// BASEBALL
// =============================================================================
function createBall() {
  const canvas = document.createElement('canvas');
  canvas.width = 128; canvas.height = 128;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 128, 128);
  ctx.strokeStyle = '#cc0000';
  ctx.lineWidth = 2.5;
  ctx.beginPath(); ctx.arc(64, 64, 40, 0.5, 2.6); ctx.stroke();
  ctx.beginPath(); ctx.arc(64, 64, 40, 3.6, 5.7); ctx.stroke();
  ctx.lineWidth = 1.2;
  for (let i = 0; i < 12; i++) {
    const a = 0.5 + (i * (2.6 - 0.5) / 12);
    ctx.beginPath();
    ctx.moveTo(64 + Math.cos(a) * 36, 64 + Math.sin(a) * 36);
    ctx.lineTo(64 + Math.cos(a) * 44, 64 + Math.sin(a) * 44);
    ctx.stroke();
  }
  const ball = new THREE.Mesh(
    new THREE.SphereGeometry(GAME_CONFIG.ballRadius, 32, 32),
    new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(canvas), roughness: 0.4 })
  );
  ball.castShadow = true;
  ball.userData = {
    velocity: new THREE.Vector3(),
    isInPlay: false,
    isPitched: false,
    isThrown: false,
    pitchType: null,
    spin: null,
    targetX: 0,
    targetY: 3,
    targetZ: 0,
    timeAlive: 0,
  };
  scene.add(ball);
  return ball;
}

// =============================================================================
// FIELDERS
// =============================================================================
const FIELD_POSITIONS = {
  pitcher:     { x: 0,    z: -60.5 },
  catcher:     { x: 0,    z: 4 },
  firstBase:   { x: 50,   z: -50 },
  secondBase:  { x: 25,   z: -95 },
  thirdBase:   { x: -50,  z: -50 },
  shortstop:   { x: -25,  z: -95 },
  leftField:   { x: -130, z: -180 },
  centerField: { x: 0,    z: -240 },
  rightField:  { x: 130,  z: -180 },
};

let fielders = {};
let baseRunners = [];
let activeFielder = null;

function createFielders(teamColor) {
  const result = {};
  for (const [name, pos] of Object.entries(FIELD_POSITIONS)) {
    if (name === 'pitcher' || name === 'catcher') continue;
    const f = createGeneratedPlayer('fielder', new THREE.Vector3(pos.x, 0, pos.z), teamColor);
    f.userData.role = name;
    f.userData.homePos = new THREE.Vector3(pos.x, 0, pos.z);
    f.userData.holdingBall = false;
    poseFielderIdle(f);
    f.lookAt(new THREE.Vector3(0, 0, 0));
    result[name] = f;
  }
  return result;
}

function createCatcher(teamColor) {
  const c = createGeneratedPlayer('catcher', new THREE.Vector3(0, 0, 4), teamColor);
  c.userData.role = 'catcher';
  c.userData.holdingBall = false;
  poseFielderIdle(c);
  const s = c.userData.skeleton;
  s.hip.position.y = PLAYER_CONFIG.height * 0.3;
  s.leftLegPivot.rotation.x = 1.4;
  s.rightLegPivot.rotation.x = 1.4;
  c.lookAt(new THREE.Vector3(0, 0, -50));
  return c;
}

// =============================================================================
// BASE RUNNERS
// =============================================================================
function createRunner(teamColor, startPos) {
  let mesh, cp = null;
  if (CUSTOM_CHAR_CONFIG.enabled && customCharAssets) {
    cp = spawnCustomPlayer(startPos.clone(), 0);
    mesh = cp.mesh;
    cp.run();
  } else {
    mesh = createGeneratedPlayer('runner', startPos.clone(), teamColor);
  }
  mesh.userData.customPlayer = cp;
  mesh.userData.path = [];
  mesh.userData.pathIndex = 0;
  mesh.userData.speed = PLAYER_CONFIG.runSpeed;
  mesh.userData.onArrive = null;
  mesh.userData.isRunner = true;
  mesh.userData.targetBase = 0;
  mesh.userData.isUserTeam = false;
  mesh.userData.runDelay = 0;
  mesh.userData.prevBase = 0;
  mesh.userData.hitStartPos = null;
  baseRunners.push(mesh);
  return mesh;
}

function updateBaseRunners(dt) {
  // Track how long the ball has been unfielded; advance parked runners periodically
  if ((gameState === GAME_STATE.BALL_IN_PLAY || gameState === GAME_STATE.FIELDING) && baseball.userData.isInPlay) {
    ballInPlayTimer += dt;
    // Every 4 seconds unfielded, advance parked runners to next base
    if (ballInPlayTimer - lastRunnerAdvanceAt > 4.0 && ballInPlayTimer > 2.5) {
      lastRunnerAdvanceAt = ballInPlayTimer;
      advanceParkedRunnersOneBase();
    }
  }

  // Runners hesitate when fielder has ball; also slow when user is fielding for fairness
  const runnerSpeedMult = aiHasBall ? 0.35
    : (gameState === GAME_STATE.FIELDING ? 0.55 : 1.0)
    * (firstPersonMode ? 0.62 : 1.18);

  for (let i = baseRunners.length - 1; i >= 0; i--) {
    const r = baseRunners[i];
    const cp = r.userData.customPlayer;
    // Always tick custom mixer so idle/slide animations play even when parked at base
    if (cp) cp.update(dt);

    // --- Smart abort window (user team runners only) ---
    if (r.userData.isUserTeam && (r.userData.runDelay || 0) > 0) {
      r.userData.runDelay -= dt;
      // Ball fielded during read window — check if runner can safely go back
      const ballFielded = aiHasBall ||
        (activeFielder && activeFielder.userData.holdingBall);
      if (ballFielded && r.userData.prevBase >= 1 && (r.userData.targetBase || 0) < 4) {
        const hitStart = r.userData.hitStartPos || r.position;
        const targetPos = baseIndexToPos(r.userData.targetBase);
        const totalDist = hitStart.distanceTo(targetPos);
        const distTraveled = r.position.distanceTo(hitStart);
        const pctTraveled = totalDist > 0.1 ? distTraveled / totalDist : 1.0;
        if (pctTraveled < 0.35) {
          // Not yet committed — retreat to the base they started from
          r.userData.runDelay = 0;
          r.userData.path = null;
          const prevBase = r.userData.prevBase;
          r.userData.prevBase = undefined;
          r.userData.hitStartPos = null;
          if (cp) cp.play('standIdle');
          onRunnerArriveAtBase(r, prevBase);
          continue;
        }
        // Past the point of no return — commit and clear the window
        r.userData.runDelay = 0;
        r.userData.hitStartPos = null;
      }
    }

    const path = r.userData.path;
    if (!path || path.length === 0) continue;
    const target = path[r.userData.pathIndex];
    if (!target) continue;
    const dir = target.clone().sub(r.position);
    dir.y = 0;
    const dist = dir.length();

    // User team gets a speed boost; slow-jog during the read window
    const teamBoost = r.userData.isUserTeam ? 1.25 : 1.0;
    const readMult  = (r.userData.isUserTeam && (r.userData.runDelay || 0) > 0) ? 0.5 : 1.0;
    const step = r.userData.speed * runnerSpeedMult * teamBoost * readMult * dt;
    if (dist <= step) {
      r.position.copy(target);
      r.userData.pathIndex++;
      if (r.userData.pathIndex >= path.length) {
        if (r.userData.onArrive) r.userData.onArrive(r);
        r.userData.path = null;
        if (!cp) {
          const s = r.userData.skeleton;
          s.leftLegPivot.rotation.x = 0;
          s.rightLegPivot.rotation.x = 0;
          s.hip.position.y = PLAYER_CONFIG.height * 0.45;
        }
      }
    } else {
      dir.normalize();
      r.position.add(dir.multiplyScalar(step));
      r.rotation.y = Math.atan2(dir.x, dir.z);
      if (!cp) updateRunningCycle(r, dt);
    }
  }
}

























// =============================================================================
// GAME STATE VARIABLES
// =============================================================================
let ballInPlayTimer = 0;
let lastRunnerAdvanceAt = 0;
let aiFielderAssigned = null; // fielder assigned to chase this hit
let aiHasBall = false;        // true while AI is holding ball before/during throw
let baseball, batter, pitcher, catcherPlayer;
let fieldData;
let outfieldWallGroup = null;
let backstopGroup = null;
let customStadiumModel = null;

// Custom character models
let customCharAssets    = null; // { clips: {} } — cached after first load
let customBatterPlayer  = null;
let customPitcherPlayer = null;
let customCatcherPlayer = null;
let customFielderPlayers = {};
let customBallHeld = false; // true while ball tracks pitcher's hand bone

// Setup mode state
const setupCtrl = {
  active: false,
  tab: 'stadium',        // 'stadium' | 'bases'
  selectedBase: 'first', // 'home' | 'first' | 'second' | 'third'
  camYaw: Math.PI,       // looking toward field center from behind home
  camPitch: 0.35,
  camPos: new THREE.Vector3(0, 80, 130),
  rmb: false,
  lastMX: 0,
  lastMY: 0,
  scrollDelta: 0,
  baseHelpers: {},
  helperGroup: null,
};
let swingAnimator, pitchAnimator;
let gameState = GAME_STATE.LOADING;
let cutscenePlaying = false;  // when true, updateCamera skips overwriting targets
let hrCheatMode = false;       // L-key / dev toggle: every hit is a cinematic HR
// HR cinematic slow-cam
let _hrSlowCamActive = false;
let _hrSlowCamTimer  = 0;
let _hrCamLookSmoothed = null; // smoothed lookAt target so pan never snaps
const HR_CINEMATIC_MAX = 12.0; // safety cutoff in real seconds

// Time-scale (for slow-motion effects; 1.0 = normal)
let timeScale = 1.0;
let _pendingAwayColorChange = false;
let introCutsceneEnabled = true;
let _introTimers = [];
let _introOnComplete = null;
let firstPersonMode = false;
let _fpvRunnerAtBase = false;
let _fpvYaw = 0;
let _fpvPitch = 0;
const _fpvPitchMin = -Math.PI * 0.38;
const _fpvPitchMax = Math.PI * 0.38;
let _fpvArcHeightBonus = 0;
let _fpvWatchBall = false;    // brief "see the hit" window before switching to runner/fielder
let _fpvWatchBallTimer = 0;
const _fpvHeadTmp = new THREE.Vector3();
const _fpvLookTmp = new THREE.Vector3(0, 5, -60); // pre-aimed toward pitcher

// Steal base minigame
const STEAL_KEY_POOL = ['KeyQ','KeyE','KeyF','KeyG','KeyJ','KeyK','KeyM','KeyV','KeyX','KeyZ','KeyY','KeyN'];
const STEAL_KEY_LABELS = { KeyQ:'Q', KeyE:'E', KeyF:'F', KeyG:'G', KeyJ:'J', KeyK:'K', KeyM:'M', KeyV:'V', KeyX:'X', KeyZ:'Z', KeyY:'Y', KeyN:'N' };
let stealMinigameActive = false;
let stealRunner = null;
let stealTargetBase = 0;
let stealSequence = [];
let stealProgress = 0;
let stealTimer = 3.0;

// Batter-runner reference for hit type banners
let batterRunnerRef = null;

// Arc throw system
let arcThrowActive = false;
let arcLine = null;
let arcRing = null;
let arcTargetPos = new THREE.Vector3();
const mouseNDC = new THREE.Vector2(0, 0);

let balls = 0, strikes = 0, outs = 0;
let inning = 1;
let isTopOfInning = true;
let homeScore = 0, awayScore = 0;

let basesOccupied = [false, false, false];
let runnersOnBase = [null, null, null];

let aimX = 0, aimY = 0;
let selectedPitch = 'fastball';

const USER_TEAM = 'home';

// DEV: null = follow normal inning logic, 'batting' or 'pitching' = force role
let devRoleOverride = null;

const cameraTargetPos = new THREE.Vector3();
const cameraTargetLook = new THREE.Vector3();

// Inning transition camera animation
let transitionTimer = 0;
let transitionDuration = 2.5;
let transitionFrom = new THREE.Vector3();
let transitionLookFrom = new THREE.Vector3();
let transitionTo = new THREE.Vector3();
let transitionLookTo = new THREE.Vector3();

// Ball landing prediction cache
let predictedLandingPos = null;

// =============================================================================
// BALL LANDING PREDICTION
// =============================================================================
function predictBallLanding() {
  const ball = baseball;
  if (!ball.userData.isInPlay) return null;
  const vel = ball.userData.velocity;
  const pos = ball.position;
  const y0 = pos.y, vy = vel.y, g = GAME_CONFIG.gravity;
  const discriminant = vy * vy + 2 * g * y0;
  if (discriminant < 0) return null;
  const t = (vy + Math.sqrt(discriminant)) / g;
  return new THREE.Vector3(pos.x + vel.x * t, 0, pos.z + vel.z * t);
}

// =============================================================================
// PITCHING
// =============================================================================
function getPitchPlateCenter() {
  return (fieldData && fieldData.basePositions && fieldData.basePositions.home)
    ? fieldData.basePositions.home
    : new THREE.Vector3(0, 0, 0);
}

function startPitchSequence() {
  // Don't clobber an active play — only stale recordStrike/recordBall timers hit this guard
  if (gameState === GAME_STATE.BALL_IN_PLAY || gameState === GAME_STATE.FIELDING) return;
  // PLAY_RESOLVED is set by transitionToNextPlay before calling here — always allow it

  baseball.userData.isPitched = false;
  baseball.userData.isInPlay = false;
  baseball.userData.isThrown = false;
  baseball.userData.throwStartPos = null;
  baseball.userData.spin = null;
  baseball.userData.timeAlive = 0;
  predictedLandingPos = null;
  ballInPlayTimer = 0;
  lastRunnerAdvanceAt = 0;

  // Re-show batter model in case it was hidden after a bunt/hit
  if (CUSTOM_CHAR_CONFIG.enabled && customBatterPlayer) {
    customBatterPlayer.mesh.visible = true;
    customBatterPlayer.idle();
  }
  _fpvRunnerAtBase = false;
  _fpvWatchBall = false;
  _fpvLastMesh = null; // allow snap on first frame of new at-bat

  if (isUserBatting()) {
    gameState = GAME_STATE.AWAITING_PITCH_REQUEST;
    showBatterUI(true, 'LEFT CLICK → REQUEST PITCH', false);
    showPitcherUI(false);
    showFieldingUI(false);
    hideThrowUI();
    setModeBanner('YOU ARE BATTING — Click to pitch, SPACE to swing');
    parkBallAtPitcherHand();
  } else {
    gameState = GAME_STATE.PITCH_AIMING;
    showBatterUI(false);
    showPitcherUI(true);
    showFieldingUI(false);
    hideThrowUI();
    setModeBanner('YOU ARE PITCHING — Aim, select pitch, SPACE to throw');
    parkBallAtPitcherHand();
  }
}

function parkBallAtPitcherHand() {
  if (baseball.parent !== scene) scene.add(baseball);
  if (CUSTOM_CHAR_CONFIG.enabled && customPitcherPlayer && customPitcherPlayer.rightHandBone) {
    const wp = new THREE.Vector3();
    customPitcherPlayer.rightHandBone.getWorldPosition(wp);
    baseball.position.copy(wp);
  } else {
    baseball.position.set(0.4, FIELD_CONFIG.moundHeight + PLAYER_CONFIG.height * 0.65, -FIELD_CONFIG.pitchingDistance + 0.3);
  }
  baseball.userData.velocity.set(0, 0, 0);
}

function aiThrowPitch() {
  if (gameState !== GAME_STATE.AWAITING_PITCH_REQUEST) return;
  const types = ['fastball', 'curveball', 'slider', 'changeup'];
  const type = types[Math.floor(Math.random() * types.length)];
  const inZone = Math.random() < 0.83;
  const plate = getPitchPlateCenter();
  const tx = plate.x + (inZone ? (Math.random() - 0.5) * 1.2 : (Math.random() - 0.5) * 2.4);
  const ty = inZone ? 3 + (Math.random() - 0.5) * 1.4 : 3 + (Math.random() - 0.5) * 2.6;
  pitchAnimator.startPitch(() => launchPitch(type, tx, ty));
  showBatterUI(true, 'PITCH INCOMING — Press SPACE to swing!', true);
  showPitchTypeIndicator(type);
}

function userThrowPitch() {
  if (gameState !== GAME_STATE.PITCH_AIMING) return;
  const plate = getPitchPlateCenter();
  const tx = plate.x + aimX * 1.5;
  const ty = 3 + aimY * 1.5;
  pitchAnimator.startPitch(() => launchPitch(selectedPitch, tx, ty));
  showPitcherUI(false);
  setModeBanner('PITCH THROWN');
}

function launchPitch(type, targetX, targetY) {
  const ball = baseball;
  const startPos = new THREE.Vector3(0.4, FIELD_CONFIG.moundHeight + PLAYER_CONFIG.height * 0.7, -FIELD_CONFIG.pitchingDistance + 1.5);
  // For custom models, start ball from the pitcher's actual hand bone world position
  if (CUSTOM_CHAR_CONFIG.enabled && customPitcherPlayer && customPitcherPlayer.rightHandBone) {
    customPitcherPlayer.rightHandBone.getWorldPosition(startPos);
  }
  ball.position.copy(startPos);
  ball.userData.pitchType = type;
  ball.userData.isPitched = true;
  ball.userData.isInPlay = false;
  ball.userData.timeAlive = 0;
  ball.userData.targetX = targetX;
  ball.userData.targetY = targetY;
  ball.userData.targetZ = getPitchPlateCenter().z;

  // Difficulty: easy = 70% speed, normal = 100%, hard = 130% (only when user is batting)
  const speedMult = isUserBatting() ? (0.70 + getDiffScale() * 0.60) : 1.0;
  const speed = GAME_CONFIG.pitchSpeeds[type] * speedMult;
  const dz = ball.userData.targetZ - startPos.z;
  const flightTime = dz / speed;
  const vx = (targetX - startPos.x) / flightTime;
  const vy = (targetY - startPos.y + 0.5 * GAME_CONFIG.gravity * flightTime * flightTime) / flightTime;
  const vz = dz / flightTime;
  ball.userData.velocity.set(vx, vy, vz);
  ball.userData.flightTime = flightTime;

  switch (type) {
    case 'curveball':  ball.userData.spin = { x: 0, y: -22 }; break;
    case 'slider':     ball.userData.spin = { x: -16, y: -6 }; break;
    case 'changeup':   ball.userData.spin = { x: 0, y: -8 }; break;
    default:           ball.userData.spin = null;
  }

  if (isUserBatting()) {
    gameState = GAME_STATE.PITCH_INCOMING;
  } else {
    gameState = GAME_STATE.PITCH_THROWN;
    scheduleAISwing(flightTime);
  }
}

function scheduleAISwing(flightTime) {
  const tx = baseball.userData.targetX;
  const ty = baseball.userData.targetY;
  const plate = getPitchPlateCenter();
  const inZoneX = Math.abs(tx - plate.x) < 1.5;
  const inZoneY = ty > 1.6 && ty < 4.6;

  // Difficulty: hard AI swings more accurately in zone and misses less out of zone
  const inZoneSwingChance = 0.60 + getDiffScale() * 0.30; // easy: 0.60, normal: 0.75, hard: 0.90
  const willSwing = (inZoneX && inZoneY) ? Math.random() < inZoneSwingChance : Math.random() < 0.12;
  if (!willSwing) return;

  const timingSpread = 0.30 - getDiffScale() * 0.22; // easy: 0.30, normal: 0.19, hard: 0.08
  const timingError = (Math.random() - 0.5) * timingSpread;
  const contactT = PLAYER_CONFIG.swingDuration * 0.55;
  const startDelay = Math.max(0, (flightTime - contactT) + timingError);

  setTimeout(() => {
    if (gameState !== GAME_STATE.PITCH_THROWN) return;
    if (swingAnimator.swinging) return;
    swingAnimator.startSwing(() => resolveContact(false));
  }, startDelay * 1000);
}

// =============================================================================
// BATTING
// =============================================================================
function attemptUserSwing() {
  if (gameState !== GAME_STATE.PITCH_INCOMING) return;
  if (swingAnimator.swinging) return;
  swingAnimator.startSwing(() => resolveContact(true));
  showBatterUI(false);
}

function resolveContact(isUserSwing) {
  const ball = baseball;
  const plate = getPitchPlateCenter();
  const plateZ = plate.z;
  const distZ = Math.abs(ball.position.z - plateZ);
  const distXY = new THREE.Vector2(ball.position.x - plate.x, ball.position.y - 3).length();

  // Difficulty: easy = bigger hit window, hard = tighter window (user swing only)
  const diffAdj = isUserSwing ? (0.5 - getDiffScale()) : 0;
  const zoneZ  = 5.5 + diffAdj * 3.0;  // easy: 7.0, normal: 5.5, hard: 4.0
  const zoneXY = 2.6 + diffAdj * 2.4;  // easy: 3.8, normal: 2.6, hard: 1.4

  const inContactZ = distZ < zoneZ;
  const inContactXY = distXY < zoneXY;

  if (!inContactZ || !inContactXY) {
    ball.userData.isPitched = false;
    showResult('SWING & MISS', 'strike');
    recordStrike();
    return;
  }

  const timing = 1 - distZ / zoneZ;
  const skill = isUserSwing ? 1.0 : 0.75; // AI makes weaker contact

  // Difficulty: easy lowers perfect threshold, hard raises it
  const perfectThresh = isUserSwing ? (0.72 - diffAdj * 0.32) : 0.72;
  let quality;
  if (timing > perfectThresh && distXY < zoneXY * 0.46) quality = 'perfect';
  else if (timing > 0.45) quality = 'good';
  else quality = 'weak';

  executeHit(quality, ball, isUserSwing, skill);
}

function executeHit(quality, ball, isUserSwing, skill) {
  ball.userData.isPitched = false;
  ball.userData.isInPlay = true;
  ball.userData.spin = null;

  // HR cheat toggle: every hit is a guaranteed HR
  const forcedHR = hrCheatMode;
  if (forcedHR) { quality = 'perfect'; skill = 1.0; }

  let basePower = 90, launchAngle = 25, direction = 0;

  switch (quality) {
    case 'perfect':
      // basePower 80-96: ~40-60% chance of clearing the 175-unit wall
      basePower = forcedHR ? 160 : (80 + Math.random() * 16) * skill;
      launchAngle = 25 + Math.random() * 12; // 25-37°, higher variance
      direction = (Math.random() - 0.5) * 50;
      showResult('CRUSHED!', 'hit');  // HR is confirmed later by physics
      break;
    case 'good':
      basePower = 58 * skill;
      launchAngle = 10 + Math.random() * 22;
      direction = (Math.random() - 0.5) * 70;
      showResult('SOLID HIT!', 'hit');
      break;
    case 'weak':
      basePower = 35 * skill;
      launchAngle = 4 + Math.random() * 28;
      direction = (Math.random() - 0.5) * 100;
      showResult('WEAK CONTACT', 'hit');
      break;
  }

  basePower += (Math.random() - 0.5) * 8;

  const radAngle = launchAngle * Math.PI / 180;
  const radDir = direction * Math.PI / 180;
  ball.userData.velocity.set(
    Math.sin(radDir) * basePower * Math.cos(radAngle),
    Math.sin(radAngle) * basePower,
    -Math.cos(radDir) * basePower * Math.cos(radAngle)
  );

  // HR cinematic slow-mo: kick in when cheat is active and this is a user swing
  if (forcedHR && isUserSwing) _startHRSlowCam();

  // Hit particles + screen shake based on quality
  const contactPos = baseball.position.clone();
  if (quality === 'perfect') {
    spawnHitParticles(contactPos, forcedHR);
    triggerScreenShake(forcedHR ? 2.2 : 0.9, forcedHR ? 0.5 : 0.3);
  } else if (quality === 'good') {
    spawnHitParticles(contactPos, false);
    triggerScreenShake(0.4, 0.18);
  } else {
    triggerScreenShake(0.15, 0.1);
  }

  gameState = GAME_STATE.BALL_IN_PLAY;
  // FPV: watch ball fly for 1.4s before switching to runner/nearest fielder
  if (firstPersonMode && CUSTOM_CHAR_CONFIG.enabled) {
    _fpvWatchBall = true;
    _fpvWatchBallTimer = 1.4;
  }
  startBaseRunningOnHit();

  if (!isUserBatting()) {
    // Give 1.5s of broadcast view before handing control to user fielder
    setTimeout(() => {
      if (gameState !== GAME_STATE.BALL_IN_PLAY) return;
      gameState = GAME_STATE.FIELDING;
      showFieldingUI(true);
      setModeBanner('FIELD THE BALL — WASD override, auto-chases ball  |  SPACE/1-4 to throw');
      pickClosestFielderToBall();
    }, 1500);
  } else {
    setModeBanner('BALL IN PLAY — Watch your runners!');
  }
}

// =============================================================================
// BASE RUNNING
// =============================================================================

// Route a runner to a specific base (1=1st, 2=2nd, 3=3rd, 4=score/home)
function sendRunnerToBase(runner, targetBase) {
  const cp = runner.userData.customPlayer;
  if (targetBase >= 4) {
    runner.userData.targetBase = 4;
    runner.userData.path = [fieldData.basePositions.home.clone()];
    runner.userData.pathIndex = 0;
    runner.userData.onArrive = (r) => { awardRun(); fadeOutAndRemove(r); };
    if (cp) cp.run();
    return;
  }
  runner.userData.targetBase = targetBase;
  runner.userData.path = [baseIndexToPos(targetBase)];
  runner.userData.pathIndex = 0;
  runner.userData.onArrive = (r) => onRunnerArriveAtBase(r, targetBase);
  if (cp) cp.run();
}

function startBaseRunningOnHit() {
  const teamColor = isUserBatting() ? TEAM_CONFIG.home.primaryColor : TEAM_CONFIG.away.primaryColor;

  // Clear all parked runners from base records — they are now all in motion
  for (let i = 0; i < 3; i++) {
    basesOccupied[i] = false;
    runnersOnBase[i] = null;
  }
  updateBasesUI();

  const isUserHit = isUserBatting();

  // Advance every existing runner by 1 base; user team gets a smart abort window
  baseRunners.forEach(r => {
    const currentTarget = r.userData.targetBase || 1;
    r.userData.isUserTeam = isUserHit;
    r.userData.prevBase = currentTarget;
    r.userData.hitStartPos = r.position.clone();
    // Abort window: user runners get 0.8s to read the play and cancel if needed.
    // No abort window for runners about to score (don't hold them up).
    r.userData.runDelay = (isUserHit && currentTarget + 1 < 4) ? 0.8 : 0;
    sendRunnerToBase(r, currentTarget + 1);
  });

  // Spawn the new batter-runner heading to 1st; track for hit-type banner
  const bRunner = createRunner(teamColor, new THREE.Vector3(0, 0, 2));
  bRunner.userData.isUserTeam = isUserHit;
  bRunner.userData.prevBase = 0;
  bRunner.userData.hitStartPos = bRunner.position.clone();
  bRunner.userData.runDelay = 0; // batter always runs immediately
  batterRunnerRef = bRunner;
  // Hide the batter-at-plate model — the runner's own mesh takes over visually
  if (CUSTOM_CHAR_CONFIG.enabled && customBatterPlayer) {
    customBatterPlayer.mesh.visible = false;
  }
  sendRunnerToBase(bRunner, 1);

  // Reset ball-unfielded timer and AI fielder state
  ballInPlayTimer = 0;
  lastRunnerAdvanceAt = 0;
  aiFielderAssigned = null;
  aiHasBall = false;
}

function baseIndexToPos(idx) {
  if (idx === 1) return fieldData.basePositions.first.clone();
  if (idx === 2) return fieldData.basePositions.second.clone();
  if (idx === 3) return fieldData.basePositions.third.clone();
  return fieldData.basePositions.home.clone();
}

function onRunnerArriveAtBase(runner, baseIdx) {
  if (baseIdx >= 4) { awardRun(); fadeOutAndRemove(runner); return; }
  basesOccupied[baseIdx - 1] = true;
  runnersOnBase[baseIdx - 1] = runner;
  runner.userData.targetBase = baseIdx;
  runner.userData.currentBase = baseIdx;
  updateBasesUI();
  spawnDustBurst(runner.position.clone(), 22);

  // Show hit-type banner when the batter-runner arrives at a base
  if (runner === batterRunnerRef && isUserBatting()) {
    if (baseIdx === 1) showHitTypeBanner('SINGLE');
    else if (baseIdx === 2) showHitTypeBanner('DOUBLE');
    else if (baseIdx === 3) showHitTypeBanner('TRIPLE');
  }

  // FPV: after user's runner reaches a base, switch back to broadcast camera so they watch the rest of the play
  if (firstPersonMode && runner === batterRunnerRef && isUserBatting()) {
    const slideDelay = 1400; // enough time for slide anim + a beat
    setTimeout(() => { _fpvRunnerAtBase = true; _fpvShowAll(); }, slideDelay);
  }

  const cp = runner.userData.customPlayer;
  if (cp) {
    const basePos = baseIndexToPos(baseIdx);
    // 30% chance to slide into base
    if (Math.random() < 0.30 && cp.actions['slide']) {
      cp.playOnce('slide', 0.1, () => {
        runner.position.copy(basePos);
        runner.position.y = 0;
        cp.play('standIdle');
        runner.lookAt(new THREE.Vector3(0, 0, 0));
      });
    } else {
      cp.play('standIdle');
      runner.lookAt(new THREE.Vector3(0, 0, 0));
    }
  } else {
    poseFielderIdle(runner);
    runner.lookAt(new THREE.Vector3(0, 0, 0));
  }
}

// Advance all parked runners one extra base (ball still unfielded)
function advanceParkedRunnersOneBase() {
  let advanced = false;
  for (let i = 2; i >= 0; i--) {
    if (basesOccupied[i] && runnersOnBase[i]) {
      const r = runnersOnBase[i];
      basesOccupied[i] = false;
      runnersOnBase[i] = null;
      sendRunnerToBase(r, i + 2); // i is 0-indexed, base number = i+1, next = i+2
      advanced = true;
    }
  }
  if (advanced) { updateBasesUI(); showResult('RUNNERS ADVANCE!', 'hit'); }
}

function fadeOutAndRemove(obj) {
  scene.remove(obj);
  baseRunners = baseRunners.filter(r => r !== obj);
}

function awardRun() {
  if (isUserBatting()) { if (USER_TEAM === 'home') homeScore++; else awayScore++; }
  else                  { if (USER_TEAM === 'home') awayScore++; else homeScore++; }
  showResult('RUN SCORES!', 'homerun');
  showScreenFlash('#ffcc00', 600);
  updateScoreboard();
}

// =============================================================================
// AI FIELDERS — auto-move toward ball, pick up, and throw
// =============================================================================

// Maps fielder role → the base index (1/2/3) they are responsible for covering
const ROLE_COVERS_BASE = { firstBase: 1, secondBase: 2, thirdBase: 3 };

// Returns a Set of base indices (1-3) that currently have a runner heading to them
function getBasesToCover() {
  const s = new Set();
  baseRunners.forEach(r => { const tb = r.userData.targetBase; if (tb >= 1 && tb <= 3) s.add(tb); });
  return s;
}

function updateAIFielders(dt) {
  if (gameState !== GAME_STATE.BALL_IN_PLAY && gameState !== GAME_STATE.FIELDING) return;

  // When user is BATTING: AI fully fields the ball autonomously
  if (isUserBatting()) {
    // Keep running even if isInPlay cleared (ball settled) so assigned fielder can still pick it up
    if (aiHasBall) return;
    const ballActive = baseball.userData.isInPlay ||
      (!baseball.userData.isPitched && !baseball.userData.isThrown && aiFielderAssigned);
    if (!ballActive) return;

    // Keep prediction fresh (only while ball is in flight)
    if (baseball.userData.isInPlay) predictedLandingPos = predictBallLanding();
    const target = predictedLandingPos || baseball.position;

    const basesToCover = getBasesToCover();

    // Assign chaser: nearest fielder that isn't pinned to a coverage base
    if (!aiFielderAssigned) {
      let nearest = null, nearestDist = Infinity;
      Object.entries(fielders).forEach(([role, f]) => {
        if (role === 'pitcher' || role === 'catcher') return;
        const cb = ROLE_COVERS_BASE[role];
        if (cb !== undefined && basesToCover.has(cb)) return; // must stay at base
        const d = f.position.distanceTo(target);
        if (d < nearestDist) { nearestDist = d; nearest = f; }
      });
      aiFielderAssigned = nearest;
    }

    Object.entries(fielders).forEach(([role, f]) => {
      if (role === 'pitcher' || role === 'catcher') return;
      if (f.userData.holdingBall) return;

      // ── Coverage fielder: hold at bag, face the ball ───────────────────────
      const cb = ROLE_COVERS_BASE[role];
      if (cb !== undefined && basesToCover.has(cb)) {
        const hp = f.userData.homePos;
        if (hp) {
          const toHp = hp.clone().sub(f.position); toHp.y = 0;
          if (toHp.length() > 0.8) {
            toHp.normalize();
            f.position.addScaledVector(toHp, Math.min(toHp.length(), PLAYER_CONFIG.runSpeed * dt));
          }
        }
        const toBall = baseball.position.clone().sub(f.position); toBall.y = 0;
        if (toBall.length() > 2) f.rotation.y = Math.atan2(toBall.x, toBall.z);
        poseFielderIdle(f);
        return;
      }

      // ── Ball chaser ────────────────────────────────────────────────────────
      const chaseTarget = (f === aiFielderAssigned) ? baseball.position.clone() : target.clone();
      const dir = chaseTarget.clone().sub(f.position);
      dir.y = 0;
      const dist = dir.length();

      if (f === aiFielderAssigned) {
        if (dist < 4.5) {
          poseFielderIdle(f);
          const ballLow = baseball.position.y < PLAYER_CONFIG.height * 1.2;
          const canPickup = baseball.userData.isInPlay ||
            (!baseball.userData.isPitched && !baseball.userData.isThrown && !aiHasBall);
          if (ballLow && canPickup) aiPickupBall(f);
        } else {
          dir.normalize();
          f.position.addScaledVector(dir, PLAYER_CONFIG.runSpeed * dt);
          f.rotation.y = Math.atan2(dir.x, dir.z);
          updateRunningCycle(f, dt);
        }
      } else {
        // Backup: drift toward ball but don't crowd the chaser
        if (dist > 20 && dist < 200) {
          dir.normalize();
          f.position.addScaledVector(dir, PLAYER_CONFIG.runSpeed * 0.6 * dt);
          f.rotation.y = Math.atan2(dir.x, dir.z);
          updateRunningCycle(f, dt);
        } else {
          poseFielderIdle(f);
        }
      }
    });
    return;
  }

  // When user is FIELDING: same coverage logic for AI backup fielders
  if (baseball.userData.isInPlay) predictedLandingPos = predictBallLanding();
  if (!predictedLandingPos) return;

  const basesToCoverF = getBasesToCover();

  Object.entries(fielders).forEach(([role, f]) => {
    if (f === activeFielder) return;
    if (role === 'pitcher' || role === 'catcher') return;
    if (f.userData.holdingBall) return;

    // Coverage fielder: stay at their base, face ball
    const cb = ROLE_COVERS_BASE[role];
    if (cb !== undefined && basesToCoverF.has(cb)) {
      const hp = f.userData.homePos;
      if (hp) {
        const toHp = hp.clone().sub(f.position); toHp.y = 0;
        if (toHp.length() > 0.8) {
          toHp.normalize();
          f.position.addScaledVector(toHp, Math.min(toHp.length(), PLAYER_CONFIG.runSpeed * dt));
        }
      }
      const toBall = baseball.position.clone().sub(f.position); toBall.y = 0;
      if (toBall.length() > 2) f.rotation.y = Math.atan2(toBall.x, toBall.z);
      poseFielderIdle(f);
      return;
    }

    const dir = predictedLandingPos.clone().sub(f.position);
    dir.y = 0;
    const dist = dir.length();
    if (dist < 2.5) { poseFielderIdle(f); return; }
    if (dist > 200) return;
    dir.normalize();
    f.position.addScaledVector(dir, PLAYER_CONFIG.runSpeed * 0.7 * dt);
    f.rotation.y = Math.atan2(dir.x, dir.z);
    updateRunningCycle(f, dt);
  });
}

function aiPickupBall(fielder) {
  aiHasBall = true;
  fielder.userData.holdingBall = true;
  baseball.userData.isInPlay = false;
  baseball.userData.velocity.set(0, 0, 0);
  const pickupPos = new THREE.Vector3(); baseball.getWorldPosition(pickupPos);
  spawnDustBurst(pickupPos);
  attachBallToFielder(fielder);
  showResult('FIELDED!', 'hit');

  // Brief pause before throw (fielder "sets")
  const throwDelay = 350 + Math.random() * 250;
  setTimeout(() => {
    if (!aiHasBall) return;
    const throwTarget = aiBestThrowTarget();
    aiExecuteThrow(fielder, throwTarget);
  }, throwDelay);
}

function aiBestThrowTarget() {
  // Find the base with the most advanced threatening runner
  // Priority: try to get the lead runner (furthest advanced) out
  let bestBase = null, bestRunnerAdvance = -1;

  baseRunners.forEach(r => {
    const tb = r.userData.targetBase || 1;
    const dest = tb >= 4 ? fieldData.basePositions.home : baseIndexToPos(tb);
    const distToBase = r.position.distanceTo(dest);
    const totalDist = r.userData.path && r.userData.path[0] ? r.position.distanceTo(r.userData.path[0]) + 0.01 : 0.01;
    const pctThere = 1 - (distToBase / (totalDist + distToBase));
    // Urgency: runner close to scoring (high target base) but not already there
    const urgency = tb * 10 - pctThere * 5;
    if (urgency > bestRunnerAdvance && pctThere < 0.9) {
      bestRunnerAdvance = urgency;
      bestBase = dest.clone();
    }
  });

  // Default to first base if no runners to worry about
  return bestBase || fieldData.basePositions.first.clone();
}

function aiExecuteThrow(fielder, targetPos) {
  if (!fielder.userData.holdingBall) return;
  detachBallFromFielder(fielder);
  fielder.userData.holdingBall = false;
  aiHasBall = false;

  const start = baseball.position.clone();
  spawnThrowRelease(start);
  const dist = start.distanceTo(targetPos);
  const flightTime = Math.max(0.45, dist / 120);

  baseball.userData.isThrown = true;
  baseball.userData.isInPlay = false;
  baseball.userData.throwStartPos = start.clone();
  baseball.userData.throwEndPos = targetPos.clone();
  baseball.userData.throwElapsed = 0;
  baseball.userData.throwDuration = flightTime;
  baseball.userData.throwArcHeight = Math.max(3, dist * 0.07);
  baseball.userData.throwTarget = targetPos.clone();
  baseball.userData.velocity.set(0, 0, 0);

  // Face the throw direction
  const throwDir = targetPos.clone().sub(start);
  fielder.rotation.y = Math.atan2(throwDir.x, throwDir.z);

  setTimeout(() => resolvePlayAfterThrow(targetPos), flightTime * 1000 + 150);
}

// =============================================================================
// FIELDING — user controls nearest fielder with WASD
// =============================================================================
function pickClosestFielderToBall() {
  const landing = predictBallLanding() || baseball.position;
  let closest = null, closestDist = Infinity;
  Object.entries(fielders).forEach(([role, f]) => {
    if (role === 'pitcher' || role === 'catcher') return;
    const d = f.position.distanceTo(landing);
    if (d < closestDist) { closestDist = d; closest = f; }
  });
  activeFielder = closest;
  if (activeFielder) addControlMarker(activeFielder);
}

let controlMarker = null;
function addControlMarker(player) {
  if (controlMarker && controlMarker.parent) controlMarker.parent.remove(controlMarker);
  controlMarker = new THREE.Mesh(
    new THREE.RingGeometry(0.6, 0.9, 24),
    new THREE.MeshBasicMaterial({ color: 0x00ffff, side: THREE.DoubleSide, transparent: true, opacity: 0.8 })
  );
  controlMarker.rotation.x = -Math.PI / 2;
  controlMarker.position.y = 0.05;
  player.add(controlMarker);
}

function removeControlMarker() {
  if (controlMarker && controlMarker.parent) { controlMarker.parent.remove(controlMarker); controlMarker = null; }
}

function updateFielderControl(dt) {
  if (gameState !== GAME_STATE.FIELDING) return;

  const hasInput = keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'];

  // Continuously re-select the closest fielder to the ball when no WASD override
  // (only when ball hasn't been picked up yet)
  if (baseball.userData.isInPlay && !hasInput) {
    let nearest = null, nearestDist = Infinity;
    Object.entries(fielders).forEach(([role, f]) => {
      if (role === 'pitcher' || role === 'catcher') return;
      if (f.userData.holdingBall) return;
      const d = f.position.distanceTo(baseball.position);
      if (d < nearestDist) { nearestDist = d; nearest = f; }
    });
    if (nearest && nearest !== activeFielder) {
      removeControlMarker();
      activeFielder = nearest;
      addControlMarker(activeFielder);
    }
  }

  if (!activeFielder) return;

  const holdingBall = activeFielder.userData.holdingBall;
  const isSprinting = (keys['ShiftLeft'] || keys['ShiftRight']) && !holdingBall;
  const speed = holdingBall ? PLAYER_CONFIG.runSpeed * 0.6
              : isSprinting ? PLAYER_CONFIG.runSpeed * 1.75
              : PLAYER_CONFIG.runSpeed;
  const dir = new THREE.Vector3();

  if (hasInput) {
    if (firstPersonMode || holdingBall) {
      // Camera-relative movement (FPV or ball-carrying jog)
      const camFwd = new THREE.Vector3();
      camera.getWorldDirection(camFwd);
      camFwd.y = 0; camFwd.normalize();
      const camRight = new THREE.Vector3().crossVectors(camFwd, new THREE.Vector3(0, 1, 0)).normalize();
      if (keys['KeyW']) dir.add(camFwd);
      if (keys['KeyS']) dir.sub(camFwd);
      if (keys['KeyA']) dir.sub(camRight);
      if (keys['KeyD']) dir.add(camRight);
    } else {
      if (keys['KeyW']) dir.z -= 1;
      if (keys['KeyS']) dir.z += 1;
      if (keys['KeyA']) dir.x -= 1;
      if (keys['KeyD']) dir.x += 1;
    }
  } else if (!holdingBall && (baseball.userData.isInPlay || gameState === GAME_STATE.FIELDING)) {
    // Once ball is rolling slowly, chase its actual position; otherwise use predicted landing
    const ballVel = baseball.userData.velocity ? baseball.userData.velocity.length() : 0;
    const chasePos = (ballVel < 20 || !predictedLandingPos) ? baseball.position : predictedLandingPos;
    const autoDir = chasePos.clone().sub(activeFielder.position);
    autoDir.y = 0;
    if (autoDir.length() > 1.5) dir.copy(autoDir.normalize());
  }

  if (dir.lengthSq() > 0) {
    dir.normalize();
    activeFielder.position.x += dir.x * speed * dt;
    activeFielder.position.z += dir.z * speed * dt;
    activeFielder.rotation.y = Math.atan2(dir.x, dir.z);
    updateRunningCycle(activeFielder, dt);
    // Sync custom player run animation when carrying ball
    if (holdingBall && CUSTOM_CHAR_CONFIG.enabled) {
      const role = Object.keys(fielders).find(k => fielders[k] === activeFielder);
      const cp = role ? customFielderPlayers[role] : null;
      if (cp && cp.currentAction !== cp.actions['run']) cp.play('run', true, 0.15);
    }
  } else if (!holdingBall) {
    poseFielderIdle(activeFielder);
  } else if (holdingBall && CUSTOM_CHAR_CONFIG.enabled) {
    // Standing still with ball — return to idle
    const role = Object.keys(fielders).find(k => fielders[k] === activeFielder);
    const cp = role ? customFielderPlayers[role] : null;
    if (cp && cp.currentAction !== cp.actions['standIdle']) cp.play('standIdle', true, 0.2);
  }

  // Auto-pickup — works whether or not isInPlay (ball may have settled already)
  const ballPickupable = baseball.userData.isInPlay ||
    (!baseball.userData.isPitched && !baseball.userData.isThrown && !activeFielder.userData.holdingBall);
  if (!activeFielder.userData.holdingBall && ballPickupable) {
    const dist2D = Math.hypot(activeFielder.position.x - baseball.position.x, activeFielder.position.z - baseball.position.z);
    const ballNearGround = baseball.position.y < PLAYER_CONFIG.height * 1.2;
    if (dist2D < 5.0 && ballNearGround) {
      activeFielder.userData.holdingBall = true;
      baseball.userData.isInPlay = false;
      baseball.userData.velocity.set(0, 0, 0);
      const _pickPos = new THREE.Vector3(); baseball.getWorldPosition(_pickPos);
      spawnDustBurst(_pickPos);
      attachBallToFielder(activeFielder);
      showResult('FIELDED!', 'hit');
      setModeBanner('AIM ARC with mouse — CLICK to throw | [1] 1st  [2] 2nd  [3] 3rd  [4] Home');
      initArcThrow();
      predictedLandingPos = null;
    }
  }

  // AI teammate catches while ball is in play
  if (baseball.userData.isInPlay) {
    Object.entries(fielders).forEach(([role, f]) => {
      if (f === activeFielder || f.userData.holdingBall) return;
      if (role === 'pitcher' || role === 'catcher') return;
      const d2 = Math.hypot(f.position.x - baseball.position.x, f.position.z - baseball.position.z);
      if (d2 < 4.0 && baseball.position.y < PLAYER_CONFIG.height * 1.2) {
        // AI teammate fields it — hand control to user's fielder or swap
        f.userData.holdingBall = true;
        baseball.userData.isInPlay = false;
        baseball.userData.velocity.set(0, 0, 0);
        attachBallToFielder(f);
        activeFielder.userData.holdingBall = false;
        activeFielder = f;
        addControlMarker(f);
        showResult('TEAMMATE FIELDS!', 'hit');
        setModeBanner('AIM ARC with mouse — CLICK to throw | [1] 1st  [2] 2nd  [3] 3rd  [4] Home');
        initArcThrow();
        predictedLandingPos = null;
      }
    });
  }
}

function attachBallToFielder(f) {
  const s = f.userData.skeleton;
  s.rightHand.add(baseball);
  baseball.position.set(0, 0, 0);
  baseball.scale.set(1, 1, 1);
}

function detachBallFromFielder(f) {
  const worldPos = new THREE.Vector3();
  f.userData.skeleton.rightHand.getWorldPosition(worldPos);
  scene.add(baseball);
  baseball.position.copy(worldPos);
}

function userFielderThrowToBase() {
  // Smart throw — find closest threatening runner
  let targetBase = null;
  let bestUrgency = -Infinity;
  baseRunners.forEach(r => {
    if (!r.userData.path) return;
    const dest = r.userData.path[r.userData.pathIndex];
    if (!dest) return;
    const distToDest = r.position.distanceTo(dest);
    const urgency = 40 - distToDest;
    if (urgency > bestUrgency) { bestUrgency = urgency; targetBase = dest.clone(); }
  });
  if (!targetBase) targetBase = fieldData.basePositions.first.clone();
  doThrowToTarget(targetBase);
}

function throwToBase(baseIdx) {
  if (!activeFielder || !activeFielder.userData.holdingBall) return;
  let targetPos;
  switch (baseIdx) {
    case 1: targetPos = fieldData.basePositions.first.clone(); break;
    case 2: targetPos = fieldData.basePositions.second.clone(); break;
    case 3: targetPos = fieldData.basePositions.third.clone(); break;
    case 0: targetPos = fieldData.basePositions.home.clone(); break;
    default: return;
  }
  doThrowToTarget(targetPos);
}

function doThrowToTarget(targetBase) {
  if (!activeFielder || !activeFielder.userData.holdingBall) return;
  detachBallFromFielder(activeFielder);
  activeFielder.userData.holdingBall = false;
  clearArcThrow();

  const start = baseball.position.clone();
  spawnThrowRelease(start);
  const dist = start.distanceTo(targetBase);
  const flightTime = Math.max(0.5, dist / 110);

  // Parametric arc: ball is guided to target, ignoring physics drift
  baseball.userData.isThrown = true;
  baseball.userData.isInPlay = false;
  baseball.userData.throwStartPos = start.clone();
  baseball.userData.throwEndPos = targetBase.clone();
  baseball.userData.throwElapsed = 0;
  baseball.userData.throwDuration = flightTime;
  // Arc height scales with distance so short throws are flat, long throws have a loft
  baseball.userData.throwArcHeight = Math.max(4, dist * 0.09);
  baseball.userData.throwTarget = targetBase.clone();
  baseball.userData.velocity.set(0, 0, 0); // physics driven by arc, not velocity

  removeControlMarker();
  setModeBanner('THROW IN FLIGHT...');

  setTimeout(() => resolvePlayAfterThrow(targetBase), flightTime * 1000 + 150);
}

function resolvePlayAfterThrow(targetBase) {
  // Snap ball exactly to the target base so it never ends up in a weird spot
  baseball.userData.isThrown = false;
  baseball.userData.throwStartPos = null;
  baseball.position.copy(targetBase);
  baseball.userData.velocity.set(0, 0, 0);
  setModeBanner('');
  spawnImpactSpark(targetBase);

  let runnerOut = null;
  baseRunners.forEach(r => {
    if (!r.userData.path) return;
    const dest = r.userData.path[r.userData.pathIndex];
    if (!dest) return;
    if (dest.distanceTo(targetBase) < 3) {
      const distRemaining = r.position.distanceTo(dest);
      if (distRemaining > 4) runnerOut = r;
    }
  });

  if (runnerOut) {
    showResult('OUT AT BASE!', 'out');
    fadeOutAndRemove(runnerOut);
    recordOut();
    setTimeout(() => triggerReplay(targetBase, () => transitionToNextPlay()), 800);
  } else {
    showResult('SAFE!', 'hit');
    setTimeout(() => triggerReplay(targetBase, () => transitionToNextPlay()), 800);
  }
}

function transitionToNextPlay() {
  Object.entries(fielders).forEach(([role, f]) => {
    f.userData.holdingBall = false;
    if (role === 'pitcher' || role === 'catcher') return;
    if (f.userData.homePos) f.position.copy(f.userData.homePos);
    poseFielderIdle(f);
    f.lookAt(new THREE.Vector3(0, 0, 0));
  });
  removeControlMarker();
  activeFielder = null;
  aiFielderAssigned = null;
  aiHasBall = false;
  showFieldingUI(false);
  clearArcThrow();

  // Ensure ball is back in scene root (not parented to a fielder's hand bone)
  if (baseball.parent !== scene) scene.add(baseball);

  if (outs >= GAME_CONFIG.outs) {
    endHalfInning();
    return;
  }
  // Step game state out of BALL_IN_PLAY/FIELDING so startPitchSequence guard lets it through
  gameState = GAME_STATE.PLAY_RESOLVED;
  resetCountAfterPlay(false);
  startPitchSequence();
}

// =============================================================================
// BALL PHYSICS
// =============================================================================
function updateBallPhysics(dt) {
  const ball = baseball;
  if (!ball.userData.isPitched && !ball.userData.isInPlay && !ball.userData.isThrown) return;
  if (ball.parent !== scene) return;

  // Thrown balls follow a guaranteed parametric arc to the target
  if (ball.userData.isThrown && ball.userData.throwStartPos) {
    ball.userData.throwElapsed = Math.min(
      ball.userData.throwElapsed + dt,
      ball.userData.throwDuration
    );
    const t = ball.userData.throwElapsed / ball.userData.throwDuration;
    const ease = t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t; // ease in-out
    ball.position.lerpVectors(ball.userData.throwStartPos, ball.userData.throwEndPos, ease);
    // Add parabolic arc height (sin curve peaks at t=0.5)
    ball.position.y += Math.sin(t * Math.PI) * ball.userData.throwArcHeight;
    ball.rotation.x += 0.25;
    ball.rotation.y += 0.1;
    return;
  }

  const vel = ball.userData.velocity;
  vel.y -= GAME_CONFIG.gravity * dt;
  vel.multiplyScalar(1 - GAME_CONFIG.airResistance);

  if (ball.userData.spin) {
    vel.x += ball.userData.spin.x * dt;
    vel.y += ball.userData.spin.y * dt;
  }

  ball.position.addScaledVector(vel, dt);
  ball.userData.timeAlive += dt;
  ball.rotation.x += vel.z * dt * 0.4;
  ball.rotation.y += vel.x * dt * 0.4;

  const pitchPlateZ = ball.userData.targetZ ?? getPitchPlateCenter().z;
  if (ball.userData.isPitched && ball.position.z >= pitchPlateZ - 0.5) {
    pitchReachedPlate();
  }

  if (ball.position.y < GAME_CONFIG.ballRadius) {
    ball.position.y = GAME_CONFIG.ballRadius;
    if (ball.userData.isInPlay) {
      vel.y = -vel.y * 0.45;
      vel.x *= 0.78;
      vel.z *= 0.78;
    } else {
      pitchReachedPlate();
    }
  }

  if (ball.userData.isInPlay) checkInPlayResult();
}

function pitchReachedPlate() {
  const ball = baseball;
  if (!ball.userData.isPitched) return;
  // If a swing is in progress, let resolveContact handle the outcome — don't double-count
  if (swingAnimator && swingAnimator.swinging) {
    ball.userData.isPitched = false;
    return;
  }
  ball.userData.isPitched = false;
  const plate = getPitchPlateCenter();
  const ax = Math.abs(ball.position.x - plate.x);
  const ay = ball.position.y;
  const inStrike = ax < 1.5 && ay > 1.6 && ay < 4.6;

  if (gameState === GAME_STATE.PITCH_INCOMING || gameState === GAME_STATE.PITCH_THROWN) {
    if (inStrike) { showResult('STRIKE!', 'strike'); recordStrike(); }
    else          { showResult('BALL', 'ball'); recordBall(); }
  }
}

function checkInPlayResult() {
  const ball = baseball;
  const plate = getPitchPlateCenter();
  const distFromHome = Math.hypot(ball.position.x - plate.x, ball.position.z - plate.z);
  if (distFromHome > FIELD_CONFIG.outfieldDistance && ball.position.y > STADIUM_CONFIG.wallHeight) {
    ball.userData.isInPlay = false;
    awardRunsForHomeRun();
    playHomeRunCutscene();
    return;
  }
  if (ball.userData.timeAlive > 7 && ball.userData.velocity.length() < 5) {
    ball.userData.isInPlay = false;
    setTimeout(() => {
      // Don't auto-transition if a fielder already picked up the ball
      if (aiHasBall || (activeFielder && activeFielder.userData.holdingBall)) return;
      transitionToNextPlay();
    }, 1000);
  }
}

function showScreenFlash(color = '#ffffff', durationMs = 300) {
  let fl = document.getElementById('hr-screen-flash');
  if (!fl) {
    fl = document.createElement('div');
    fl.id = 'hr-screen-flash';
    fl.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:9999;opacity:0;transition:opacity 0.08s ease-in';
    document.body.appendChild(fl);
  }
  fl.style.background = color;
  fl.style.transition = 'opacity 0.08s ease-in';
  fl.style.opacity = '0.7';
  setTimeout(() => { fl.style.transition = `opacity ${durationMs}ms ease-out`; fl.style.opacity = '0'; }, 80);
}

function playHomeRunCutscene() {
  _endHRSlowCam(); // restore timeScale and release camera from slow-cam mode
  _fpvShowAll();   // ensure batter mesh is visible for celebration animations

  const celebrations = ['celebrate1', 'celebrate2'];
  const celebAnim  = celebrations[Math.floor(Math.random() * celebrations.length)];
  const celebAnim2 = celebrations[1 - celebrations.indexOf(celebAnim)];
  const plate = getPitchPlateCenter();

  gameState = GAME_STATE.PLAY_RESOLVED;
  cutscenePlaying = true;

  // ── PHASE 1 (0s) ─────────────────────────────────────────────────────────
  // White flash + banner. Tight ground-level angle behind batter looking outfield.
  showScreenFlash('#ffffff', 400);
  showResult('HOME RUN!', 'homerun');
  spawnHitParticles(baseball.position.clone(), true);
  triggerScreenShake(2.0, 0.55);
  cameraTargetPos.set(plate.x + 1, 3, plate.z + 18);
  cameraTargetLook.set(plate.x, 4, plate.z - 25);

  // ── PHASE 2 (0.7s) ───────────────────────────────────────────────────────
  // Golden flash. Low hero shot pulled back — batter fully in frame.
  setTimeout(() => {
    showScreenFlash('#ffcc00', 250);
    cameraTargetPos.set(plate.x + 6, 3.5, plate.z + 16);
    cameraTargetLook.set(plate.x - 1, 4.5, plate.z - 8);
  }, 700);

  // ── PHASE 3 (0.9s) ───────────────────────────────────────────────────────
  // Batter starts first celebration dance.
  setTimeout(() => {
    if (CUSTOM_CHAR_CONFIG.enabled && customBatterPlayer && customBatterPlayer.actions[celebAnim]) {
      customBatterPlayer.play(celebAnim, true, 0.1);
    }
  }, 900);

  // ── PHASE 4 (1.9s) ───────────────────────────────────────────────────────
  // Right-side broadcast angle, pulled back to show more of the infield.
  setTimeout(() => {
    cameraTargetPos.set(plate.x + 16, 7, plate.z + 12);
    cameraTargetLook.set(plate.x - 1, 3.5, plate.z - 8);
  }, 1900);

  // ── PHASE 5 (2.9s) ───────────────────────────────────────────────────────
  // Red flash. Left-side mirror, equally pulled back.
  setTimeout(() => {
    showScreenFlash('#ff4400', 300);
    cameraTargetPos.set(plate.x - 16, 7, plate.z + 12);
    cameraTargetLook.set(plate.x + 1, 3.5, plate.z - 8);
  }, 2900);

  // ── PHASE 6 (3.8s) ───────────────────────────────────────────────────────
  // Overhead diamond view — higher and further back to show the whole infield.
  setTimeout(() => {
    showResult('HOME RUN!', 'homerun');
    cameraTargetPos.set(plate.x + 4, 35, plate.z + 22);
    cameraTargetLook.set(plate.x, 0, plate.z - 20);
  }, 3800);

  // ── PHASE 7 (4.6s) ───────────────────────────────────────────────────────
  // Switch to second dance. Behind-plate wide shot looking toward mound.
  setTimeout(() => {
    if (CUSTOM_CHAR_CONFIG.enabled && customBatterPlayer && customBatterPlayer.actions[celebAnim2]) {
      customBatterPlayer.play(celebAnim2, true, 0.15);
    }
    cameraTargetPos.set(plate.x, 6, plate.z + 20);
    cameraTargetLook.set(plate.x, 4, plate.z - 15);
  }, 4600);

  // ── PHASE 8 (5.5s) ───────────────────────────────────────────────────────
  // White flash. Mid-height diagonal pulled back to show batter + infield.
  setTimeout(() => {
    showScreenFlash('#ffffff', 250);
    cameraTargetPos.set(plate.x - 10, 18, plate.z + 18);
    cameraTargetLook.set(plate.x, 2, plate.z - 10);
  }, 5500);

  // ── PHASE 9 (6.3s) ───────────────────────────────────────────────────────
  // Final gold flash + third banner. Batter idles.
  setTimeout(() => {
    showScreenFlash('#ffcc00', 500);
    showResult('HOME RUN!', 'homerun');
    if (CUSTOM_CHAR_CONFIG.enabled && customBatterPlayer) customBatterPlayer.idle();
  }, 6300);

  // ── END (7.3s) ────────────────────────────────────────────────────────────
  setTimeout(() => {
    cutscenePlaying = false;
    transitionToNextPlay();
  }, 7300);
}

function awardRunsForHomeRun() {
  let runs = 1;
  for (let i = 0; i < 3; i++) {
    if (basesOccupied[i]) {
      runs++;
      if (runnersOnBase[i]) fadeOutAndRemove(runnersOnBase[i]);
      basesOccupied[i] = false;
      runnersOnBase[i] = null;
    }
  }
  baseRunners.slice().forEach(r => fadeOutAndRemove(r));
  baseRunners = [];
  updateBasesUI();

  if (isUserBatting()) { if (USER_TEAM === 'home') homeScore += runs; else awayScore += runs; }
  else                  { if (USER_TEAM === 'home') awayScore += runs; else homeScore += runs; }
  updateScoreboard();
}

// =============================================================================
// COUNT / INNING SYSTEM
// =============================================================================
function recordBall() {
  balls++;
  if (balls >= GAME_CONFIG.balls) { showResult('WALK!', 'ball'); walkBatter(); return; }
  updateCountUI();
  setTimeout(() => startPitchSequence(), 1100);
}

function recordStrike() {
  strikes++;
  if (strikes >= GAME_CONFIG.strikes) {
    showResult('STRIKEOUT!', 'out');
    recordOut();
    setTimeout(() => {
      if (outs < GAME_CONFIG.outs) { resetCountAfterPlay(false); startPitchSequence(); }
      else endHalfInning();
    }, 1300);
    return;
  }
  updateCountUI();
  setTimeout(() => startPitchSequence(), 1100);
}

function recordOut() {
  outs++;
  updateCountUI();
}

function walkBatter() {
  const teamColor = isUserBatting() ? TEAM_CONFIG.home.primaryColor : TEAM_CONFIG.away.primaryColor;

  // Force-advance runners if 1st is occupied (chain reaction)
  if (basesOccupied[0]) {
    if (basesOccupied[1]) {
      if (basesOccupied[2]) {
        // Bases loaded — runner on 3rd scores on walk
        const r3 = runnersOnBase[2];
        basesOccupied[2] = false; runnersOnBase[2] = null;
        if (r3) sendRunnerToBase(r3, 4);
      }
      const r2 = runnersOnBase[1];
      basesOccupied[1] = false; runnersOnBase[1] = null;
      if (r2) sendRunnerToBase(r2, 3);
    }
    const r1 = runnersOnBase[0];
    basesOccupied[0] = false; runnersOnBase[0] = null;
    if (r1) sendRunnerToBase(r1, 2);
  }

  const bRunner = createRunner(teamColor, new THREE.Vector3(0, 0, 2));
  sendRunnerToBase(bRunner, 1);

  updateBasesUI();
  resetCountAfterPlay(true);
  setTimeout(() => startPitchSequence(), 1500);
}

function resetCountAfterPlay(keepBases) {
  balls = 0; strikes = 0;
  updateCountUI();
}

function endHalfInning() {
  outs = 0; balls = 0; strikes = 0;
  runnersOnBase.forEach(r => { if (r) fadeOutAndRemove(r); });
  runnersOnBase = [null, null, null];
  basesOccupied = [false, false, false];
  baseRunners.slice().forEach(r => fadeOutAndRemove(r));
  baseRunners = [];

  const wasTop = isTopOfInning;
  if (isTopOfInning) {
    isTopOfInning = false;
  } else {
    isTopOfInning = true;
    inning++;
    if (inning > GAME_CONFIG.innings) { endGame(); return; }
  }

  refreshPlayerColors();

  updateCountUI();
  updateBasesUI();
  updateScoreboard();

  const label = isTopOfInning ? `TOP ${inning}` : `BOT ${inning}`;
  showResult(label, 'hit');
  showInningSwitchOverlay(wasTop ? 'INNING OVER — Switching sides' : `TOP ${inning} — Batter up!`);

  // Camera transition: sweep from current to new perspective
  startInningSwitchTransition();

  setTimeout(() => {
    hideInningSwitchOverlay();
    startPitchSequence();
  }, 3000);
}

function endGame() {
  gameState = GAME_STATE.GAME_OVER;
  const userWon = (USER_TEAM === 'home' ? homeScore : awayScore) > (USER_TEAM === 'home' ? awayScore : homeScore);
  const tied = homeScore === awayScore;
  document.getElementById('game-over-title').textContent = tied ? 'TIE GAME' : (userWon ? 'YOU WIN!' : 'YOU LOSE');
  document.getElementById('final-score-display').textContent =
    `${TEAM_CONFIG.away.name} ${awayScore}  —  ${TEAM_CONFIG.home.name} ${homeScore}`;
  document.getElementById('game-over').classList.add('visible');
}

function isUserBatting() {
  if (devRoleOverride === 'batting') return true;
  if (devRoleOverride === 'pitching') return false;
  return USER_TEAM === 'home' ? !isTopOfInning : isTopOfInning;
}

function devSwapRole() {
  const natural = USER_TEAM === 'home' ? !isTopOfInning : isTopOfInning;
  devRoleOverride = devRoleOverride === null ? (natural ? 'pitching' : 'batting') : null;
  updateDevRoleLabel();

  // Determine which state we're actually in (accounting for pause)
  const activeState = gameState === GAME_STATE.PAUSED ? stateBeforePause : gameState;
  const canRestart = [GAME_STATE.AWAITING_PITCH_REQUEST, GAME_STATE.PITCH_AIMING, GAME_STATE.PLAY_RESOLVED];
  if (canRestart.includes(activeState)) {
    if (gameState === GAME_STATE.PAUSED) togglePause();
    balls = 0; strikes = 0;
    startPitchSequence();
  }
}

function toggleDevScoreMenu() {
  let el = document.getElementById('dev-score-menu');
  if (!el) {
    // Build it once on first open
    el = document.createElement('div');
    el.id = 'dev-score-menu';
    el.innerHTML = `
      <div class="dsm-title">⚾ DEV — SCORE EDITOR</div>
      <div class="dsm-row">
        <label class="dsm-label" id="dsm-away-label">AWAY</label>
        <button class="dsm-btn" id="dsm-away-dec">−</button>
        <span class="dsm-val" id="dsm-away-val">0</span>
        <button class="dsm-btn" id="dsm-away-inc">+</button>
      </div>
      <div class="dsm-row">
        <label class="dsm-label" id="dsm-home-label">HOME</label>
        <button class="dsm-btn" id="dsm-home-dec">−</button>
        <span class="dsm-val" id="dsm-home-val">0</span>
        <button class="dsm-btn" id="dsm-home-inc">+</button>
      </div>
      <div class="dsm-row dsm-row-inning">
        <label class="dsm-label">INNING</label>
        <button class="dsm-btn" id="dsm-inn-dec">−</button>
        <span class="dsm-val" id="dsm-inn-val">1</span>
        <button class="dsm-btn" id="dsm-inn-inc">+</button>
      </div>
      <div class="dsm-row dsm-row-outs">
        <label class="dsm-label">OUTS</label>
        <button class="dsm-btn" id="dsm-outs-dec">−</button>
        <span class="dsm-val" id="dsm-outs-val">0</span>
        <button class="dsm-btn" id="dsm-outs-inc">+</button>
      </div>
      <div class="dsm-hint">O to close</div>`;
    document.body.appendChild(el);

    function refreshDsm() {
      document.getElementById('dsm-away-val').textContent = awayScore;
      document.getElementById('dsm-home-val').textContent = homeScore;
      document.getElementById('dsm-inn-val').textContent  = inning;
      document.getElementById('dsm-outs-val').textContent = outs;
      const awayName = TEAM_CONFIG.away.name || 'AWAY';
      const homeName = TEAM_CONFIG.home.name || 'HOME';
      document.getElementById('dsm-away-label').textContent = awayName;
      document.getElementById('dsm-home-label').textContent = homeName;
    }

    el.addEventListener('click', ev => {
      const id = ev.target.id;
      if (id === 'dsm-away-dec') { awayScore = Math.max(0, awayScore - 1); updateScoreboard(); }
      if (id === 'dsm-away-inc') { awayScore++; updateScoreboard(); }
      if (id === 'dsm-home-dec') { homeScore = Math.max(0, homeScore - 1); updateScoreboard(); }
      if (id === 'dsm-home-inc') { homeScore++; updateScoreboard(); }
      if (id === 'dsm-inn-dec')  { inning  = Math.max(1, inning  - 1); updateCountUI(); }
      if (id === 'dsm-inn-inc')  { inning  = Math.min(99, inning  + 1); updateCountUI(); }
      if (id === 'dsm-outs-dec') { outs    = Math.max(0, outs    - 1); updateCountUI(); }
      if (id === 'dsm-outs-inc') { outs    = Math.min(2, outs    + 1); updateCountUI(); }
      refreshDsm();
    });

    refreshDsm();
  }

  const visible = el.classList.toggle('dsm-open');
  if (visible) {
    // Refresh live values on open
    document.getElementById('dsm-away-val').textContent = awayScore;
    document.getElementById('dsm-home-val').textContent = homeScore;
    document.getElementById('dsm-inn-val').textContent  = inning;
    document.getElementById('dsm-outs-val').textContent = outs;
    const awayName = TEAM_CONFIG.away.name || 'AWAY';
    const homeName = TEAM_CONFIG.home.name || 'HOME';
    document.getElementById('dsm-away-label').textContent = awayName;
    document.getElementById('dsm-home-label').textContent = homeName;
  }
}

function updateDevRoleLabel() {
  const el = document.getElementById('dev-role-label');
  if (!el) return;
  if (devRoleOverride === null) {
    el.textContent = 'Currently: AUTO  |  Backtick ` to toggle anytime';
  } else {
    el.textContent = `Currently: FORCED ${devRoleOverride.toUpperCase()}  |  Backtick \` to toggle anytime`;
    el.style.color = devRoleOverride === 'batting' ? 'rgba(68,255,136,0.7)' : 'rgba(100,160,255,0.7)';
  }
}

// =============================================================================
// CAMERA SYSTEM
// =============================================================================
let fieldingWithBallCamera = false;

function getPitchingCameraView() {
  const plate = getPitchPlateCenter();
  return {
    pos: new THREE.Vector3(
      plate.x,
      FIELD_CONFIG.moundHeight + GAME_CONFIG.pitchingCamera.height,
      plate.z - FIELD_CONFIG.pitchingDistance - GAME_CONFIG.pitchingCamera.distanceBehindMound
    ),
    look: new THREE.Vector3(
      plate.x,
      GAME_CONFIG.pitchingCamera.lookHeight,
      plate.z + GAME_CONFIG.pitchingCamera.lookZOffset
    ),
  };
}

function startInningSwitchTransition() {
  transitionTimer = 0;
  gameState = GAME_STATE.INNING_TRANSITION;

  transitionFrom.copy(camera.position);
  // Calculate where it will look from and to
  if (isTopOfInning) {
    // Now user pitching — move from home plate view to pitcher view
    const pitchingView = getPitchingCameraView();
    transitionTo.copy(pitchingView.pos);
    transitionLookTo.copy(pitchingView.look);
  } else {
    // Now user batting — move from pitcher view to batting view
    transitionTo.set(0, 8, 15);
    transitionLookTo.set(0, 4, -FIELD_CONFIG.pitchingDistance);
  }
  transitionLookFrom.set(0, 4, -FIELD_CONFIG.pitchingDistance / 2);
}

// =============================================================================
// FIRST-PERSON CAMERA
// =============================================================================
let _fpvHiddenMesh = null;

function _fpvGetHeadPos(mesh) {
  let bone = null;
  mesh.traverse(c => {
    if (!bone && c.isBone && c.name.toLowerCase().includes('head')) bone = c;
  });
  if (bone) {
    bone.getWorldPosition(_fpvHeadTmp);
    return _fpvHeadTmp.clone();
  }
  const w = CUSTOM_CHAR_CONFIG.weight;
  const hf = Math.exp(-(w - 0.5) * 2.2);
  return new THREE.Vector3(mesh.position.x, mesh.position.y + 5.4 * hf, mesh.position.z);
}

function _fpvGetBodyCenter(mesh) {
  let bone = null;
  mesh.traverse(c => {
    if (!bone && c.isBone && (c.name.toLowerCase().includes('spine') || c.name.toLowerCase().includes('hip'))) bone = c;
  });
  if (bone) {
    const v = new THREE.Vector3();
    bone.getWorldPosition(v);
    return v;
  }
  const w = CUSTOM_CHAR_CONFIG.weight;
  const hf = Math.exp(-(w - 0.5) * 2.2);
  return new THREE.Vector3(mesh.position.x, mesh.position.y + 3.2 * hf, mesh.position.z);
}

const _fpvBallWorldPos = new THREE.Vector3();
function _fpvGetNearestFielderMesh() {
  // Use predicted landing when ball is airborne — gets FPV to the catcher BEFORE ball arrives
  if (predictedLandingPos && baseball.position.y > 4) {
    _fpvBallWorldPos.copy(predictedLandingPos);
  } else {
    // Ball on/near ground or parented to hand — use world position
    baseball.getWorldPosition(_fpvBallWorldPos);
  }
  let nearest = null, minDist = Infinity;
  const candidates = [
    ...Object.values(customFielderPlayers),
    customPitcherPlayer,
    customCatcherPlayer,
  ];
  for (const cp of candidates) {
    if (!cp?.mesh) continue;
    const d = cp.mesh.position.distanceTo(_fpvBallWorldPos);
    if (d < minDist) { minDist = d; nearest = cp.mesh; }
  }
  return nearest || customPitcherPlayer?.mesh;
}

function _fpvGetActiveMesh() {
  const isBatting = isUserBatting();
  const gs = gameState;
  if (isBatting) {
    // Watch-ball phase: stay at home plate watching the ball fly
    if (_fpvWatchBall) return customBatterPlayer?.mesh;
    // Runner is active: follow the runner's own spawned custom mesh (lines up with bases)
    const runnerRunning = batterRunnerRef &&
      (gs === GAME_STATE.BALL_IN_PLAY || gs === GAME_STATE.BASE_RUNNING || gs === GAME_STATE.FIELDING);
    if (runnerRunning && batterRunnerRef.userData.customPlayer?.mesh) {
      return batterRunnerRef.userData.customPlayer.mesh;
    }
    return customBatterPlayer?.mesh;
  }
  // Fielding side: nearest player to ball, but enforce a switch cooldown so the camera
  // doesn't teleport every frame as the ball moves and the nearest fielder changes.
  if (gs === GAME_STATE.BALL_IN_PLAY || gs === GAME_STATE.FIELDING) {
    const nearest = _fpvGetNearestFielderMesh();
    const now = performance.now() * 0.001;
    if (nearest !== _fpvLastMesh && (now - _fpvLastSwitchTime) < 0.6) {
      return _fpvLastMesh || nearest; // hold current mesh until cooldown expires
    }
    if (nearest !== _fpvLastMesh) _fpvLastSwitchTime = now;
    return nearest;
  }
  return customPitcherPlayer?.mesh;
}

function _fpvHideMesh(mesh) {
  if (_fpvHiddenMesh === mesh) return;
  if (_fpvHiddenMesh) _fpvHiddenMesh.visible = true;
  _fpvHiddenMesh = mesh;
  if (mesh) mesh.visible = false;
}

function _fpvShowAll() {
  if (_fpvHiddenMesh) { _fpvHiddenMesh.visible = true; _fpvHiddenMesh = null; }
}

function setFirstPersonMode(enabled) {
  firstPersonMode = enabled;
  const overlay = document.getElementById('fpv-overlay');
  if (enabled) {
    overlay.classList.add('active');
    camera.fov = 72;
    camera.near = 0.15;
    camera.updateProjectionMatrix();
    // Seed yaw/pitch from the active mesh's facing so camera starts looking the right way
    const activeMesh = _fpvGetActiveMesh?.();
    _fpvYaw = activeMesh ? activeMesh.rotation.y : (() => {
      const d = new THREE.Vector3(); camera.getWorldDirection(d);
      return Math.atan2(d.x, d.z);
    })();
    _fpvPitch = 0;
    _fpvArcHeightBonus = 0;
    renderer.domElement.requestPointerLock();
  } else {
    _fpvShowAll();
    overlay.classList.remove('active');
    camera.fov = 75;
    camera.near = 0.1;
    camera.updateProjectionMatrix();
    document.getElementById('fpv-crosshair').classList.remove('show');
    document.getElementById('fpv-pitch-label').classList.remove('show');
    if (document.pointerLockElement) document.exitPointerLock();
  }
}

document.addEventListener('pointerlockchange', () => {
  if (!document.pointerLockElement && firstPersonMode) {
    // Pointer lock lost (user pressed Escape) — exit FPV cleanly
    firstPersonMode = false;
    setFirstPersonMode(false);
  }
});

let _fpvLastMesh = null;
let _fpvLastSwitchTime = 0; // prevent rapid fielder-mesh switching
function _updateFPVCamera(dt) {
  // Tick watch-ball timer
  if (_fpvWatchBall) {
    _fpvWatchBallTimer -= dt;
    if (_fpvWatchBallTimer <= 0) { _fpvWatchBall = false; _fpvLastMesh = null; } // force snap on switch
  }

  const now = performance.now() * 0.001;
  const isBatting = isUserBatting();
  const gs = gameState;

  const activeMesh = _fpvGetActiveMesh();
  if (!activeMesh) return;

  // If the tracked mesh changed, seed yaw from new mesh facing and snap camera position
  if (activeMesh !== _fpvLastMesh) {
    _fpvLastMesh = activeMesh;
    _fpvYaw = activeMesh.rotation.y;
    _fpvPitch = 0;
    // Force world matrices up-to-date so bone positions are correct at the snap moment
    activeMesh.updateWorldMatrix(true, true);
    const snapEye = _fpvGetHeadPos(activeMesh);
    const snapQuat = new THREE.Quaternion();
    activeMesh.getWorldQuaternion(snapQuat);
    const snapFwd = new THREE.Vector3(0, 0, 1).applyQuaternion(snapQuat);
    snapEye.addScaledVector(snapFwd, 0.55);
    camera.position.copy(snapEye);
  }

  // Hide the active player so their mesh doesn't clip into view
  _fpvHideMesh(activeMesh);

  // Head position from bone (or estimate)
  const eyePos = _fpvGetHeadPos(activeMesh);
  const fwdWorld = new THREE.Vector3(0, 0, 1).applyQuaternion(activeMesh.quaternion);
  eyePos.addScaledVector(fwdWorld, 0.55);
  eyePos.y += 0.08;

  // Breathing / footstep bob
  const holdingBall = !isBatting && activeFielder && activeFielder.userData.holdingBall;
  const isRunning = gs === GAME_STATE.BALL_IN_PLAY || gs === GAME_STATE.BASE_RUNNING;
  const hasWASD = keys['KeyW'] || keys['KeyS'] || keys['KeyA'] || keys['KeyD'];
  const isJogging = holdingBall && hasWASD;
  const bobFreq = isRunning ? 4.8 : isJogging ? 3.6 : 1.55;
  const bobAmp  = isRunning ? 0.06 : isJogging ? 0.045 : 0.022;
  eyePos.y += Math.sin(now * bobFreq) * bobAmp;
  eyePos.x += Math.sin(now * bobFreq * 0.5) * (bobAmp * 0.4);

  // Frame-rate independent lerp: equivalent to ~0.28/frame at 60fps
  // If the target is impossibly far away (bone glitch), snap rather than fly across the field
  const eyeDist = eyePos.distanceTo(camera.position);
  if (eyeDist > 10) {
    camera.position.copy(eyePos);
  } else {
    const lerpT = 1 - Math.pow(0.72, dt * 60);
    camera.position.lerp(eyePos, lerpT);
  }

  const crosshair  = document.getElementById('fpv-crosshair');
  const pitchLabel = document.getElementById('fpv-pitch-label');

  const pitchFlying = gs === GAME_STATE.PITCH_INCOMING && baseball.userData.isPitched;

  if (_fpvWatchBall) {
    // Watch the ball fly — auto-track it so user sees the hit
    const ballWP = new THREE.Vector3();
    baseball.getWorldPosition(ballWP);
    const toBall = ballWP.clone().sub(eyePos).normalize();
    _fpvYaw   = Math.atan2(toBall.x, toBall.z);
    _fpvPitch = Math.asin(Math.max(-1, Math.min(1, toBall.y)));
    crosshair.classList.remove('show');
    pitchLabel.classList.remove('show');
  } else if (pitchFlying && isBatting) {
    // Auto-snap toward incoming pitch, keep crosshair on
    const ballWP2 = new THREE.Vector3();
    baseball.getWorldPosition(ballWP2);
    const toBall2 = ballWP2.clone().sub(eyePos).normalize();
    _fpvYaw   = Math.atan2(toBall2.x, toBall2.z);
    _fpvPitch = Math.asin(Math.max(-1, Math.min(1, toBall2.y)));
    crosshair.classList.add('show');
    pitchLabel.classList.add('show');
  } else if (holdingBall) {
    // Arc-throw: camera follows arc target, keep crosshair
    const arcAim = arcTargetPos.clone(); arcAim.y += 1.0;
    const toArc = arcAim.clone().sub(eyePos).normalize();
    _fpvYaw   = Math.atan2(toArc.x, toArc.z);
    _fpvPitch = Math.asin(Math.max(-1, Math.min(1, toArc.y)));
    crosshair.classList.add('show');
    pitchLabel.classList.remove('show');
  } else {
    crosshair.classList.remove('show');
    pitchLabel.classList.remove('show');
  }

  // Resolve look direction from yaw/pitch — free-look drives this every frame via mousemove
  const lookDir = new THREE.Vector3(
    Math.sin(_fpvYaw) * Math.cos(_fpvPitch),
    Math.sin(_fpvPitch),
    Math.cos(_fpvYaw) * Math.cos(_fpvPitch)
  );
  _fpvLookTmp.copy(camera.position).addScaledVector(lookDir, 20);
  camera.lookAt(_fpvLookTmp);
}

function updateCamera(dt) {
  // During cutscenes the cutscene code owns cameraTargetPos/Look — just lerp, don't overwrite.
  if (cutscenePlaying) {
    camera.position.lerp(cameraTargetPos, 0.12);
    camera.lookAt(cameraTargetLook);
    return;
  }

  // HR cinematic overrides camera directly in _updateHRSlowCam
  if (_hrSlowCamActive) { _fpvShowAll(); return; }

  // FPV mode — bone-tracked head camera (only when custom models are active and in-game)
  // Temporarily disabled while _fpvRunnerAtBase so user can watch the rest of the play
  if (firstPersonMode && !_fpvRunnerAtBase && CUSTOM_CHAR_CONFIG.enabled && customCharAssets &&
      gameState !== GAME_STATE.MENU && gameState !== GAME_STATE.LOADING &&
      gameState !== GAME_STATE.LOCKER_ROOM && gameState !== GAME_STATE.INTRO_CUTSCENE) {
    _updateFPVCamera(dt);
    return;
  }
  // Not in FPV — make sure any hidden mesh is restored
  _fpvShowAll();

  let pos, look;

  if (gameState === GAME_STATE.INNING_TRANSITION) {
    transitionTimer += dt;
    const t = Math.min(transitionTimer / transitionDuration, 1);
    const eased = t * t * (3 - 2 * t); // smoothstep
    pos = transitionFrom.clone().lerp(transitionTo, eased);
    look = transitionLookFrom.clone().lerp(transitionLookTo, eased);

    if (transitionTimer >= transitionDuration) {
      gameState = GAME_STATE.HALF_INNING_END;
    }
    camera.position.copy(pos);
    camera.lookAt(look);
    return;
  }

  switch (gameState) {
    case GAME_STATE.AWAITING_PITCH_REQUEST:
    case GAME_STATE.PITCH_INCOMING: {
      // Batting: centered behind batter, lower angle looking toward pitcher
      pos = new THREE.Vector3(0, 8, 14);
      look = new THREE.Vector3(0, 4, -FIELD_CONFIG.pitchingDistance);
      break;
    }
    case GAME_STATE.PITCH_AIMING:
    case GAME_STATE.PITCH_THROWN: {
      // Pitching: low, centered, just behind the mound — batter clearly visible
      const pitchingView = getPitchingCameraView();
      pos = pitchingView.pos;
      look = pitchingView.look;
      break;
    }
    case GAME_STATE.BALL_IN_PLAY: {
      const ball = baseball;
      if (isUserBatting()) {
        if (aiHasBall || baseball.userData.isThrown) {
          // AI has ball / throw in flight — wide overhead shows whole diamond + runners
          pos = new THREE.Vector3(0, 100, 50);
          look = new THREE.Vector3(0, 0, -50);
        } else {
          const bx = ball.position.x;
          const bz = ball.position.z;
          const by = Math.max(0, ball.position.y);
          // Bunt detection: ball near home, low and slow — use tight infield cam
          const isBuntBall = bz > -45 && by < 8;
          if (isBuntBall) {
            pos  = new THREE.Vector3(bx * 0.2, 28, bz + 38);
            look = new THREE.Vector3(bx * 0.4, 0, bz - 18);
          } else {
            // Zoomed-out follow-cam so whole field visible as ball travels
            const camH = Math.max(45, by * 0.7 + 38);
            pos  = new THREE.Vector3(bx * 0.12, camH, bz + 70);
            look = new THREE.Vector3(bx * 0.3, Math.max(0, by - 5), bz - 30);
          }
        }
      } else {
        // Follow ball, stay back enough to see nearby fielders
        pos = new THREE.Vector3(ball.position.x * 0.3, 42, ball.position.z + 60);
        look = new THREE.Vector3(ball.position.x * 0.5, 0, ball.position.z - 20);
      }
      break;
    }
    case GAME_STATE.FIELDING: {
      if (activeFielder && activeFielder.userData.holdingBall) {
        // Angled overhead showing the whole diamond — like a TV broadcast
        pos = new THREE.Vector3(-20, 80, 25);
        look = new THREE.Vector3(0, 0, -60);
      } else {
        // Follow ball closely while it's still moving/bouncing
        const ball = baseball;
        pos = new THREE.Vector3(ball.position.x * 0.3, 42, ball.position.z + 60);
        look = new THREE.Vector3(ball.position.x * 0.5, 0, ball.position.z - 20);
      }
      break;
    }
    default: {
      pos = new THREE.Vector3(0, GAME_CONFIG.broadcastHeight, GAME_CONFIG.broadcastDistance);
      look = new THREE.Vector3(0, 2, -FIELD_CONFIG.pitchingDistance / 2);
    }
  }

  if (pos) {
    cameraTargetPos.copy(pos);
    cameraTargetLook.copy(look);
    // Track ball faster during play; smooth during set pieces
    const inPlay = gameState === GAME_STATE.BALL_IN_PLAY || gameState === GAME_STATE.FIELDING;
    const lerpSpeed = inPlay ? 0.12 : GAME_CONFIG.cameraSmooth;
    camera.position.lerp(cameraTargetPos, lerpSpeed);
    camera.lookAt(cameraTargetLook);
  }
}

// =============================================================================
// UI UPDATES
// =============================================================================
function buildDots(parentId, count, klass) {
  const parent = document.getElementById(parentId);
  parent.innerHTML = '';
  for (let i = 0; i < count; i++) {
    const d = document.createElement('div');
    d.className = `count-dot ${klass}`;
    parent.appendChild(d);
  }
}

function setActiveDots(parentId, n) {
  const parent = document.getElementById(parentId);
  if (!parent) return;
  Array.from(parent.children).forEach((d, i) => d.classList.toggle('active', i < n));
}

function updateCountUI() {
  setActiveDots('balls-dots', balls);
  setActiveDots('strikes-dots', strikes);
  setActiveDots('outs-dots', outs);
}

function updateScoreboard() {
  document.getElementById('away-score').textContent = awayScore;
  document.getElementById('home-score').textContent = homeScore;
  document.getElementById('inning-half').textContent = isTopOfInning ? '▲' : '▼';
  document.getElementById('inning-display').textContent = ordinal(inning);
  document.getElementById('away-name').textContent = TEAM_CONFIG.away.abbreviation;
  document.getElementById('home-name').textContent = TEAM_CONFIG.home.abbreviation;
}

function updateBasesUI() {
  document.getElementById('base-1').classList.toggle('occupied', basesOccupied[0]);
  document.getElementById('base-2').classList.toggle('occupied', basesOccupied[1]);
  document.getElementById('base-3').classList.toggle('occupied', basesOccupied[2]);
}

function ordinal(n) {
  const s = ['th','st','nd','rd'];
  const v = n % 100;
  return n + (s[(v - 20) % 10] || s[v] || s[0]);
}

function showResult(text, klass) {
  const el = document.getElementById('result-popup');
  el.textContent = text;
  el.className = `visible result-${klass}`;
  clearTimeout(showResult._t);
  showResult._t = setTimeout(() => el.classList.remove('visible'), 1600);
}

function setModeBanner(text) {
  const el = document.getElementById('mode-banner');
  if (!text) { el.classList.remove('visible'); return; }
  el.textContent = text;
  el.classList.add('visible');
}

function showBatterUI(visible, text, swingPrompt) {
  const el = document.getElementById('batter-ui');
  el.classList.toggle('visible', visible);
  if (visible) {
    const p = document.getElementById('batter-prompt');
    p.textContent = text || 'CLICK TO REQUEST PITCH';
    p.classList.toggle('swing-prompt', !!swingPrompt);
  }
}

function showPitcherUI(visible) {
  document.getElementById('pitcher-ui').classList.toggle('visible', visible);
}

function showFieldingUI(visible) {
  document.getElementById('fielding-ui').classList.toggle('visible', visible);
}

function showThrowUI(visible) {
  const el = document.getElementById('throw-ui');
  if (el) el.classList.toggle('visible', visible);
}

function hideThrowUI() {
  const el = document.getElementById('throw-ui');
  if (el) el.classList.remove('visible');
}

function showPitchTypeIndicator(type) {
  const el = document.getElementById('pitch-type-indicator');
  if (!el) return;
  const names = { fastball: 'FASTBALL', curveball: 'CURVE', slider: 'SLIDER', changeup: 'CHANGEUP' };
  el.textContent = names[type] || type.toUpperCase();
  el.classList.add('visible');
  clearTimeout(showPitchTypeIndicator._t);
  showPitchTypeIndicator._t = setTimeout(() => el.classList.remove('visible'), 2500);
}

function showInningSwitchOverlay(text) {
  const el = document.getElementById('inning-overlay');
  if (!el) return;
  document.getElementById('inning-overlay-text').textContent = text;
  el.classList.add('visible');
}

function hideInningSwitchOverlay() {
  const el = document.getElementById('inning-overlay');
  if (el) el.classList.remove('visible');
}

function setupUI() {
  buildDots('balls-dots', GAME_CONFIG.balls - 1, 'ball');
  buildDots('strikes-dots', GAME_CONFIG.strikes - 1, 'strike');
  buildDots('outs-dots', GAME_CONFIG.outs - 1, 'out');
  updateCountUI();
  updateScoreboard();
  updateBasesUI();

  // Team names + badges on menu
  const awayEl = document.getElementById('menu-away-team');
  const homeEl = document.getElementById('menu-home-team');
  if (awayEl) awayEl.textContent = TEAM_CONFIG.away.name;
  if (homeEl) homeEl.textContent = TEAM_CONFIG.home.name;
  const awayBadge = document.getElementById('menu-away-badge');
  const homeBadge = document.getElementById('menu-home-badge');
  if (awayBadge) awayBadge.textContent = TEAM_CONFIG.away.abbreviation;
  if (homeBadge) homeBadge.textContent = TEAM_CONFIG.home.abbreviation;

  // Away team color picker
  const colorPicker = document.getElementById('away-color-picker');
  if (colorPicker) {
    colorPicker.addEventListener('input', (e) => {
      const hex = e.target.value;
      const r = parseInt(hex.slice(1,3),16), g = parseInt(hex.slice(3,5),16), b = parseInt(hex.slice(5,7),16);
      TEAM_CONFIG.away.primaryColor = (r<<16)|(g<<8)|b;
      // Update badge visual immediately
      const badge = document.getElementById('menu-away-badge');
      if (badge) {
        badge.style.background = `radial-gradient(circle at 38% 32%, ${hex}dd 0%, ${hex} 50%, ${hex}88 100%)`;
        badge.style.boxShadow  = `0 0 55px ${hex}88, 0 8px 32px rgba(0,0,0,0.65), inset 0 1px 0 rgba(255,255,255,0.12)`;
        badge.style.borderColor = hex + '55';
      }
      // Will be applied to players when game starts
      _pendingAwayColorChange = true;
    });
  }

  // Locker Room button
  const lrBtn = document.createElement('button');
  lrBtn.id = 'locker-room-btn';
  lrBtn.className = 'menu-btn secondary';
  lrBtn.style.cssText = 'min-width:0; width:88%; max-width:340px; margin: 2px auto 0; display:block; font-size:0.9rem;';
  lrBtn.textContent = '🚪 LOCKER ROOM';
  const menuContent2 = document.getElementById('play-btn').parentElement;
  const controlsHint = menuContent2.querySelector('.menu-controls-hint');
  menuContent2.insertBefore(lrBtn, controlsHint);
  lrBtn.addEventListener('click', () => enterLockerRoom());

  // Intro cutscene toggle
  const csToggle = document.createElement('button');
  csToggle.id = 'cutscene-toggle-btn';
  csToggle.style.cssText = 'display:block; width:88%; max-width:340px; margin:2px auto 0; padding:8px 0; font-family:\'Oswald\',sans-serif; font-size:12px; font-weight:bold; letter-spacing:1.5px; border:2px solid #4af; border-radius:6px; cursor:pointer; background:#051830; color:#4af; text-transform:uppercase; clip-path:none;';
  csToggle.textContent = '🎬 INTRO CUTSCENE: ON';
  menuContent2.insertBefore(csToggle, controlsHint);
  csToggle.addEventListener('click', () => {
    introCutsceneEnabled = !introCutsceneEnabled;
    if (introCutsceneEnabled) {
      csToggle.style.borderColor = '#4af';
      csToggle.style.color = '#4af';
      csToggle.style.background = '#051830';
      csToggle.textContent = '🎬 INTRO CUTSCENE: ON';
    } else {
      csToggle.style.borderColor = '#555';
      csToggle.style.color = '#666';
      csToggle.style.background = '#111';
      csToggle.textContent = '🎬 INTRO CUTSCENE: OFF';
    }
  });

  // FPV toggled via C key — no menu button needed

  // Locker room UI handlers
  document.getElementById('lr-back-btn').addEventListener('click', () => exitLockerRoom());
  document.getElementById('lr-weight-slider').addEventListener('input', (e) => {
    const v = e.target.value / 100;
    CUSTOM_CHAR_CONFIG.weight = v;
    _updateLRWeightLabel(v);
    _applyShowcaseWeight();
    // Also sync the menu weight slider if visible
    const menuSlider = document.getElementById('weight-slider');
    if (menuSlider) { menuSlider.value = e.target.value; }
    const menuLabel = document.getElementById('weight-label');
    if (menuLabel) {
      menuLabel.textContent = v < 0.15 ? 'SKELETON MODE 💀' :
        v < 0.35 ? 'LEAN MACHINE 🏃' :
        v < 0.65 ? 'NORMAL BUILD ⚾' :
        v < 0.85 ? 'CHUNKY SLUGGER 💪' : 'ABSOLUTE UNIT 🐷';
    }
  });

  // Live clock in menu bar
  function tickMenuClock() {
    const el = document.getElementById('menu-clock');
    if (!el) return;
    const d = new Date();
    const h = d.getHours() % 12 || 12;
    const m = d.getMinutes().toString().padStart(2, '0');
    el.textContent = `${h}:${m} ${d.getHours() < 12 ? 'AM' : 'PM'} ET`;
  }
  tickMenuClock();
  setInterval(tickMenuClock, 10000);

  document.querySelectorAll('.pitch-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.pitch-btn').forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedPitch = btn.dataset.pitch;
    });
  });

  const pitchBox = document.getElementById('pitch-box');
  const aimMarker = document.getElementById('pitch-aim-marker');
  pitchBox.addEventListener('mousemove', (e) => {
    if (gameState !== GAME_STATE.PITCH_AIMING) return;
    const rect = pitchBox.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    aimMarker.style.left = `${px * 100}%`;
    aimMarker.style.top = `${py * 100}%`;
    aimX = (px - 0.5) * 2;
    aimY = (0.5 - py) * 2;
  });
  pitchBox.addEventListener('click', (e) => e.stopPropagation());

  document.getElementById('play-btn').addEventListener('click', startGame);
  document.getElementById('exhibition-btn').addEventListener('click', () => { GAME_CONFIG.innings = 3; startGame(); });
  // Weather buttons
  document.querySelectorAll('.weather-btn[data-weather]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.weather-btn[data-weather]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      applyWeather(btn.dataset.weather);
    });
  });
  const tornadoBtnEl = document.getElementById('tornado-btn');
  if (tornadoBtnEl) tornadoBtnEl.addEventListener('click', () => {
    _tornadoMode = !_tornadoMode;
    tornadoBtnEl.classList.toggle('active', _tornadoMode);
  });

  // Inject difficulty slider + custom-models toggle + weight slider into main menu
  const playBtn  = document.getElementById('play-btn');
  const menuContent = playBtn.parentElement; // .menu-content

  // Difficulty slider
  const difficultyRow = document.createElement('div');
  difficultyRow.id = 'difficulty-row';
  difficultyRow.style.cssText = `
    width:88%; max-width:340px; margin:4px auto 2px;
    padding:12px 18px 10px; background:rgba(255,255,255,0.05);
    border:1px solid rgba(255,255,255,0.13); border-radius:6px; text-align:center;
  `;
  difficultyRow.innerHTML = `
    <div style="font-family:'Oswald',sans-serif;font-size:11px;color:#777;letter-spacing:0.2em;margin-bottom:8px;">DIFFICULTY</div>
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-family:'Oswald',sans-serif;font-size:10px;color:#4a8;letter-spacing:0.1em;">EASY</span>
      <input type="range" id="difficulty-slider" min="0" max="100" value="${DIFFICULTY_CONFIG.level}"
        style="flex:1;accent-color:#cc2222;cursor:pointer;height:4px;">
      <span style="font-family:'Oswald',sans-serif;font-size:10px;color:#e44;letter-spacing:0.1em;">HARD</span>
    </div>
    <div id="difficulty-label" style="font-family:'Oswald',sans-serif;font-size:12px;color:#ffd700;margin-top:7px;letter-spacing:0.12em;">
      NORMAL ⭐⭐⭐
    </div>
  `;
  menuContent.insertBefore(difficultyRow, playBtn);

  document.getElementById('difficulty-slider').addEventListener('input', (e) => {
    const v = parseInt(e.target.value);
    DIFFICULTY_CONFIG.level = v;
    const lbl =
      v <= 20 ? 'ROOKIE ⭐' :
      v <= 40 ? 'AMATEUR ⭐⭐' :
      v <= 60 ? 'NORMAL ⭐⭐⭐' :
      v <= 80 ? 'VETERAN ⭐⭐⭐⭐' :
                'ALL-STAR ⭐⭐⭐⭐⭐';
    document.getElementById('difficulty-label').textContent = lbl;
  });

  // Weight slider (hidden until custom models ON)
  const weightRow = document.createElement('div');
  weightRow.id = 'weight-row';
  weightRow.style.cssText = `
    display:none; width:88%; max-width:340px; margin:2px auto 4px;
    padding:12px 18px 10px; background:rgba(255,255,255,0.05);
    border:1px solid rgba(255,255,255,0.13); border-radius:6px; text-align:center;
  `;
  weightRow.innerHTML = `
    <div style="font-family:'Oswald',sans-serif;font-size:11px;color:#777;letter-spacing:0.2em;margin-bottom:8px;">PLAYER BUILD</div>
    <div style="display:flex;align-items:center;gap:10px;">
      <span style="font-size:13px;" title="Beanpole">🦴</span>
      <input type="range" id="weight-slider" min="0" max="100" value="50"
        style="flex:1;accent-color:#cc2222;cursor:pointer;height:4px;">
      <span style="font-size:13px;" title="Absolute Unit">🐷</span>
    </div>
    <div id="weight-label" style="font-family:'Oswald',sans-serif;font-size:12px;color:#aaa;margin-top:7px;letter-spacing:0.12em;">
      NORMAL BUILD
    </div>
  `;

  const customToggle = document.createElement('button');
  customToggle.id = 'custom-models-btn';
  customToggle.style.cssText = `
    display:block; width:88%; max-width:340px; margin:4px auto 0;
    padding:10px 0; font-family:'Oswald',sans-serif; font-size:13px; font-weight:bold;
    letter-spacing:1.5px; border:2px solid #555; border-radius:6px; cursor:pointer;
    background:#111; color:#666; text-transform:uppercase; clip-path:none;
  `;
  customToggle.textContent = 'CUSTOM MODELS: OFF';

  menuContent.insertBefore(customToggle, playBtn);
  menuContent.insertBefore(weightRow, playBtn);

  // Auto-load custom models if enabled by default
  if (CUSTOM_CHAR_CONFIG.enabled) {
    customToggle.textContent = 'CUSTOM MODELS: LOADING…';
    customToggle.style.borderColor = '#888';
    customToggle.style.color = '#888';
    customToggle.disabled = true;
    loadCustomCharacters().then(ok => {
      customToggle.disabled = false;
      if (ok) {
        customToggle.style.background = '#0d2a0d';
        customToggle.style.borderColor = '#4f4';
        customToggle.style.color = '#4f4';
        customToggle.textContent = 'CUSTOM MODELS: ON ✓';
        document.getElementById('weight-row').style.display = 'block';
      } else {
        CUSTOM_CHAR_CONFIG.enabled = false;
        customToggle.style.color = '#f44';
        customToggle.textContent = 'CUSTOM MODELS: LOAD FAILED';
      }
    });
  }

  document.getElementById('weight-slider').addEventListener('input', (e) => {
    const v = e.target.value / 100;
    CUSTOM_CHAR_CONFIG.weight = v;
    const lbl =
      v < 0.15 ? 'SKELETON MODE 💀' :
      v < 0.35 ? 'LEAN MACHINE 🏃' :
      v < 0.65 ? 'NORMAL BUILD ⚾' :
      v < 0.85 ? 'CHUNKY SLUGGER 💪' :
                 'ABSOLUTE UNIT 🐷';
    document.getElementById('weight-label').textContent = lbl;
  });

  customToggle.addEventListener('click', async () => {
    if (CUSTOM_CHAR_CONFIG.enabled) {
      CUSTOM_CHAR_CONFIG.enabled = false;
      customToggle.style.background = '#111';
      customToggle.style.borderColor = '#555';
      customToggle.style.color = '#666';
      customToggle.textContent = 'CUSTOM MODELS: OFF';
      document.getElementById('weight-row').style.display = 'none';
      return;
    }
    if (!customCharAssets) {
      customToggle.textContent = 'LOADING MODELS…';
      customToggle.disabled = true;
      const ok = await loadCustomCharacters();
      customToggle.disabled = false;
      if (!ok) {
        customToggle.style.color = '#f44';
        customToggle.textContent = 'CUSTOM MODELS: LOAD FAILED';
        return;
      }
    }
    CUSTOM_CHAR_CONFIG.enabled = true;
    customToggle.style.background = '#0d2a0d';
    customToggle.style.borderColor = '#4f4';
    customToggle.style.color = '#4f4';
    customToggle.textContent = 'CUSTOM MODELS: ON ✓';
    document.getElementById('weight-row').style.display = 'block';
  });
  document.getElementById('resume-btn').addEventListener('click', togglePause);
  document.getElementById('dev-swap-role-btn').addEventListener('click', devSwapRole);
  document.getElementById('dev-timeout-btn').addEventListener('click', () => {
    togglePause();
    setTimeout(() => tryTriggerTimeout(true), 100);
  });
  document.getElementById('quit-btn').addEventListener('click', () => location.reload());
  document.getElementById('play-again-btn').addEventListener('click', () => location.reload());

  // Throw base buttons
  document.querySelectorAll('.throw-base-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const base = parseInt(btn.dataset.base, 10);
      throwToBase(base);
    });
  });
}

let stateBeforePause = null;
function togglePause() {
  const pm = document.getElementById('pause-menu');
  if (gameState === GAME_STATE.PAUSED) {
    gameState = stateBeforePause;
    pm.classList.remove('visible');
  } else {
    stateBeforePause = gameState;
    gameState = GAME_STATE.PAUSED;
    pm.classList.add('visible');
    updateDevRoleLabel();
  }
}

// =============================================================================
// INTRO CUTSCENE
// =============================================================================
function _csFlash(color = '#ffffff', dur = 400) {
  const el = document.getElementById('cs-flash');
  el.style.background = color;
  el.classList.remove('flash');
  void el.offsetWidth;
  el.style.animationDuration = dur + 'ms';
  el.classList.add('flash');
}

function _csShowTitle(main, sub, show) {
  const card = document.getElementById('cs-title-card');
  document.getElementById('cs-title-main').textContent = main;
  document.getElementById('cs-title-sub').textContent  = sub;
  if (show) card.classList.add('show');
  else card.classList.remove('show');
}

function _csShowLowerThird(name, role, show) {
  document.getElementById('cs-lt-name').textContent = name;
  document.getElementById('cs-lt-role').textContent = role;
  const el = document.getElementById('cs-lower-third');
  if (show) el.classList.add('show');
  else el.classList.remove('show');
}

function _csSetShot(label) {
  const el = document.getElementById('cs-shot-label');
  el.classList.remove('show');
  void el.offsetWidth;
  el.textContent = label;
  el.classList.add('show');
}

function _csTick(fn, ms) {
  const id = setTimeout(fn, ms);
  _introTimers.push(id);
}

function playIntroCutscene(onComplete) {
  const overlay = document.getElementById('cutscene-overlay');
  overlay.classList.add('active');

  gameState = GAME_STATE.INTRO_CUTSCENE;
  cutscenePlaying = true;
  _introTimers = [];
  _introOnComplete = onComplete;

  const plate = getPitchPlateCenter();
  const pitchX = plate.x, pitchZ = plate.z;

  // ── SHOT 1 (0s) — Wide aerial "TODAY'S MATCHUP" title card ───────────────
  _csShowTitle('TODAY\'S MATCHUP', `${TEAM_CONFIG.away.name} vs ${TEAM_CONFIG.home.name}`, false);
  _csShowLowerThird('', '', false);
  _csSetShot('SHOT 1 — AERIAL WIDE');
  cameraTargetPos.set(pitchX + 5, 40, pitchZ + 50);
  cameraTargetLook.set(pitchX, 0, pitchZ - 20);

  _csTick(() => {
    _csShowTitle('TODAY\'S MATCHUP', `${TEAM_CONFIG.away.name} vs ${TEAM_CONFIG.home.name}`, true);
  }, 300);

  // ── SHOT 2 (1.4s) — Pitcher warming up on the mound — CELEBRATE ──────────
  _csTick(() => {
    _csShowTitle('', '', false);
    _csFlash('#000000', 180);
    _csSetShot('SHOT 2 — THE PITCHER');
    cameraTargetPos.set(pitchX - 3, 4, pitchZ - 36);
    cameraTargetLook.set(pitchX, 5, pitchZ - 60);
    _csShowLowerThird('THE STARTING PITCHER', 'WARMING UP · READY TO DOMINATE', true);
    if (CUSTOM_CHAR_CONFIG.enabled && customPitcherPlayer) {
      customPitcherPlayer.play('celebrate1', true, 0.1);
    }
  }, 1400);

  // ── SHOT 3 (2.8s) — Close-up batter in box doing chicken dance ───────────
  _csTick(() => {
    _csShowLowerThird('', '', false);
    _csFlash('#000000', 180);
    _csSetShot('SHOT 3 — THE BATTER');
    cameraTargetPos.set(pitchX + 4, 3.5, pitchZ + 14);
    cameraTargetLook.set(pitchX, 4, pitchZ + 4);
    _csShowLowerThird('THE BATTER', 'PSYCHING UP · ABSOLUTELY TERRIFYING', true);
    if (CUSTOM_CHAR_CONFIG.enabled && customBatterPlayer) {
      customBatterPlayer.play('celebrate2', true, 0.1);
    }
  }, 2800);

  // ── SHOT 4 (4.0s) — Pitcher sees batter dancing, starts RUNNING at them ──
  _csTick(() => {
    _csShowLowerThird('', '', false);
    _csFlash('#000000', 180);
    _csSetShot('SHOT 4 — OH NO');
    cameraTargetPos.set(pitchX, 5, pitchZ - 30);
    cameraTargetLook.set(pitchX, 3, pitchZ + 10);
    _csShowLowerThird('THE PITCHER', 'HAS HAD ENOUGH OF THIS', true);
    if (CUSTOM_CHAR_CONFIG.enabled && customPitcherPlayer) {
      customPitcherPlayer.play('run', true, 0.1);
    }
  }, 4000);

  // ── SHOT 5 (5.2s) — PUNCH! Close-up red flash screen shake ───────────────
  _csTick(() => {
    _csShowLowerThird('', '', false);
    _csFlash('#ff2200', 600);
    _csSetShot('SHOT 5 — 💥 POW');
    triggerScreenShake(3.0, 0.7);
    cameraTargetPos.set(pitchX + 1.5, 4.5, pitchZ + 8);
    cameraTargetLook.set(pitchX - 0.5, 5, pitchZ + 2);
    _csShowLowerThird('ILLEGAL ELBOW PUNCH', 'OFFICIALS ARE LOOKING THE OTHER WAY', true);
    if (CUSTOM_CHAR_CONFIG.enabled && customPitcherPlayer) {
      customPitcherPlayer.playOnce('punch', 0.1, () => {
        if (gameState === GAME_STATE.INTRO_CUTSCENE && customPitcherPlayer)
          customPitcherPlayer.idle();
      });
    }
    if (CUSTOM_CHAR_CONFIG.enabled && customBatterPlayer) {
      customBatterPlayer.playOnce('slide', 0.1, () => {
        if (gameState === GAME_STATE.INTRO_CUTSCENE && customBatterPlayer)
          customBatterPlayer.idle();
      });
    }
  }, 5200);

  // ── SHOT 6 (6.4s) — Wide overhead: everyone celebrates ───────────────────
  _csTick(() => {
    _csShowLowerThird('', '', false);
    _csFlash('#000000', 200);
    _csSetShot('SHOT 6 — WIDE OVERHEAD');
    cameraTargetPos.set(pitchX + 2, 28, pitchZ + 18);
    cameraTargetLook.set(pitchX, 0, pitchZ - 10);
    _csShowLowerThird('BASEBALL', 'THE GREATEST SPORT ON EARTH', true);
    if (CUSTOM_CHAR_CONFIG.enabled) {
      if (customBatterPlayer) customBatterPlayer.play('celebrate1', true, 0.2);
      if (customPitcherPlayer) customPitcherPlayer.play('celebrate2', true, 0.2);
      if (customCatcherPlayer) customCatcherPlayer.play('celebrate1', true, 0.2);
    }
  }, 6400);

  // ── SHOT 7 (7.6s) — "PLAY BALL!" big card with white flash ───────────────
  _csTick(() => {
    _csShowLowerThird('', '', false);
    _csFlash('#ffffff', 300);
    _csSetShot('');
    overlay.classList.add('cs-wide');
    _csShowTitle('PLAY BALL!', '⚾  FIRST PITCH  ⚾', true);
    cameraTargetPos.set(pitchX - 2, 8, pitchZ + 22);
    cameraTargetLook.set(pitchX, 3, pitchZ - 10);
  }, 7600);

  // ── END (9.2s) ────────────────────────────────────────────────────────────
  _csTick(() => {
    _cleanupIntroCutscene();
    const cb = _introOnComplete;
    _introOnComplete = null;
    if (cb) cb();
  }, 9200);
}

function _cleanupIntroCutscene() {
  const overlay = document.getElementById('cutscene-overlay');
  overlay.classList.remove('active', 'cs-wide');
  _csShowTitle('', '', false);
  _csShowLowerThird('', '', false);
  document.getElementById('cs-shot-label').classList.remove('show');
  cutscenePlaying = false;
  gameState = GAME_STATE.AWAITING_PITCH_REQUEST;
  // Restore everyone to their role-appropriate idle
  if (CUSTOM_CHAR_CONFIG.enabled) {
    if (customBatterPlayer)  customBatterPlayer.idle();
    if (customPitcherPlayer) customPitcherPlayer.play('standIdle', true, 0.3);
    if (customCatcherPlayer) customCatcherPlayer.play('catcher',   true, 0.3);
    Object.values(customFielderPlayers).forEach(p => { if (p) p.play('standIdle', true, 0.3); });
  }
}

function skipIntroCutscene() {
  if (gameState !== GAME_STATE.INTRO_CUTSCENE) return;
  _introTimers.forEach(id => clearTimeout(id));
  _introTimers = [];
  _cleanupIntroCutscene(); // also restores animations
  const cb = _introOnComplete;
  _introOnComplete = null;
  if (cb) cb();
}

window._skipIntroCutscene = skipIntroCutscene;

function startGame() {
  document.getElementById('main-menu').classList.remove('visible');
  document.getElementById('hud').classList.add('visible');
  if (CUSTOM_CHAR_CONFIG.enabled && customCharAssets) {
    initCustomCharacters();
  } else {
    setProceduralVisibility(true);
    // Apply pending color change to procedural away players
    if (_pendingAwayColorChange) {
      _pendingAwayColorChange = false;
      if (pitcher) setPlayerTeamColor(pitcher, TEAM_CONFIG.away.primaryColor);
      if (catcherPlayer) setPlayerTeamColor(catcherPlayer, TEAM_CONFIG.away.primaryColor);
      if (fielders) Object.values(fielders).forEach(f => { if (f) setPlayerTeamColor(f, TEAM_CONFIG.away.primaryColor); });
    }
  }
  scheduleNextTimeout();
  if (_tornadoMode) {
    _tornadoModeTimer = 0;
    _tornadoModeTriggerAt = 15 + Math.random() * 5;
    applyWeather('storm');
  }
  if (introCutsceneEnabled && CUSTOM_CHAR_CONFIG.enabled && customCharAssets) {
    playIntroCutscene(() => startPitchSequence());
  } else {
    startPitchSequence();
  }
}

// =============================================================================
// CONTROLS
// =============================================================================
const keys = {};

document.addEventListener('keydown', (e) => {
  keys[e.code] = true;

  // Block all game inputs during timeout comedy show
  if (timeoutActive) return;

  // Skip replay on ESC or Space
  if (gameState === GAME_STATE.REPLAY) {
    if (e.code === 'Escape' || e.code === 'Space') endReplay();
    return;
  }

  // Skip intro cutscene on ESC
  if (gameState === GAME_STATE.INTRO_CUTSCENE) {
    if (e.code === 'Escape' || e.code === 'Space') skipIntroCutscene();
    return;
  }

  // In setup mode, arrow keys control stadium/base — prevent page scroll
  if (gameState === GAME_STATE.STADIUM_SETUP) {
    if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','PageUp','PageDown'].includes(e.code)) e.preventDefault();
    return;
  }

  switch (e.code) {
    case 'KeyO':
      if (gameState !== GAME_STATE.LOADING && gameState !== GAME_STATE.MENU) toggleDevScoreMenu();
      break;
    case 'Backquote':
      if (gameState !== GAME_STATE.LOADING && gameState !== GAME_STATE.MENU) devSwapRole();
      break;
    case 'KeyC':
      if (gameState !== GAME_STATE.LOADING && gameState !== GAME_STATE.MENU && CUSTOM_CHAR_CONFIG.enabled) {
        firstPersonMode = !firstPersonMode;
        setFirstPersonMode(firstPersonMode);
      }
      break;
    case 'Escape':
      if (!stealMinigameActive && gameState !== GAME_STATE.LOADING && gameState !== GAME_STATE.MENU) togglePause();
      break;
    case 'Space':
      e.preventDefault();
      if (gameState === GAME_STATE.PITCH_INCOMING) {
        attemptUserSwing();
      } else if (gameState === GAME_STATE.PITCH_AIMING) {
        userThrowPitch();
      } else if (gameState === GAME_STATE.FIELDING && activeFielder && activeFielder.userData.holdingBall) {
        userFielderThrowToBase();
      }
      break;
    case 'Digit1':
      if (gameState === GAME_STATE.PITCH_AIMING) selectPitchType('fastball');
      else if (gameState === GAME_STATE.FIELDING && activeFielder && activeFielder.userData.holdingBall) throwToBase(1);
      break;
    case 'Digit2':
      if (gameState === GAME_STATE.PITCH_AIMING) selectPitchType('curveball');
      else if (gameState === GAME_STATE.FIELDING && activeFielder && activeFielder.userData.holdingBall) throwToBase(2);
      break;
    case 'Digit3':
      if (gameState === GAME_STATE.PITCH_AIMING) selectPitchType('slider');
      else if (gameState === GAME_STATE.FIELDING && activeFielder && activeFielder.userData.holdingBall) throwToBase(3);
      break;
    case 'Digit4':
      if (gameState === GAME_STATE.PITCH_AIMING) selectPitchType('changeup');
      else if (gameState === GAME_STATE.FIELDING && activeFielder && activeFielder.userData.holdingBall) throwToBase(0);
      break;
    case 'KeyH':
      if (gameState === GAME_STATE.FIELDING && activeFielder && activeFielder.userData.holdingBall) throwToBase(0);
      break;
    case 'KeyL':
      hrCheatMode = !hrCheatMode;
      showResult(hrCheatMode ? '🏠 HR CHEAT ON' : 'HR CHEAT OFF', 'homerun');
      break;
    case 'KeyR':
      if (gameState === GAME_STATE.AWAITING_PITCH_REQUEST && isUserBatting() && !stealMinigameActive) {
        initiateSteal();
      }
      break;
    case 'KeyB':
      if (gameState === GAME_STATE.PITCH_INCOMING && isUserBatting()) {
        attemptBunt();
      }
      break;
    default:
      // Handle steal minigame key presses
      if (stealMinigameActive) handleStealKey(e.code);
      break;
  }
});

document.addEventListener('keyup', (e) => { keys[e.code] = false; });

function selectPitchType(name) {
  selectedPitch = name;
  document.querySelectorAll('.pitch-btn').forEach(b => b.classList.toggle('selected', b.dataset.pitch === name));
}

const _mouseDelta = new THREE.Vector2(0, 0);
document.addEventListener('mousemove', (e) => {
  if (document.pointerLockElement && firstPersonMode) {
    const sens = 0.0022;
    _fpvYaw   -= e.movementX * sens;
    _fpvPitch -= e.movementY * sens;
    _fpvPitch = Math.max(_fpvPitchMin, Math.min(_fpvPitchMax, _fpvPitch));
    // Also drive arc-throw delta when fielder holds ball
    _mouseDelta.x += (e.movementX / window.innerWidth) * 2;
    _mouseDelta.y -= (e.movementY / window.innerHeight) * 2;
    return;
  }
  const nx = (e.clientX / window.innerWidth) * 2 - 1;
  const ny = -(e.clientY / window.innerHeight) * 2 + 1;
  _mouseDelta.x += nx - mouseNDC.x;
  _mouseDelta.y += ny - mouseNDC.y;
  mouseNDC.x = nx;
  mouseNDC.y = ny;
});

document.addEventListener('mousedown', (e) => {
  if (e.button !== 0) return;
  if (timeoutActive) return;
  // Arc throw takes priority — click executes the throw
  if (arcThrowActive && gameState === GAME_STATE.FIELDING && activeFielder && activeFielder.userData.holdingBall) {
    executeArcThrow();
    return;
  }
  if (gameState === GAME_STATE.AWAITING_PITCH_REQUEST && !stealMinigameActive) aiThrowPitch();
});

document.addEventListener('wheel', (e) => {
  if (arcThrowActive && activeFielder && activeFielder.userData.holdingBall) {
    e.preventDefault();
    _fpvArcHeightBonus = Math.max(-4, Math.min(30, _fpvArcHeightBonus - e.deltaY * 0.04));
  }
}, { passive: false });

function updateAimingControl(dt) {
  if (gameState !== GAME_STATE.PITCH_AIMING) return;
  const speed = 1.6;
  let changed = false;
  if (keys['KeyW']) { aimY = Math.min(1, aimY + speed * dt); changed = true; }
  if (keys['KeyS']) { aimY = Math.max(-1, aimY - speed * dt); changed = true; }
  if (keys['KeyA']) { aimX = Math.max(-1, aimX - speed * dt); changed = true; }
  if (keys['KeyD']) { aimX = Math.min(1, aimX + speed * dt); changed = true; }
  if (changed) {
    const aimMarker = document.getElementById('pitch-aim-marker');
    if (aimMarker) {
      aimMarker.style.left = `${(aimX + 1) * 50}%`;
      aimMarker.style.top  = `${(1 - aimY) * 50}%`;
    }
  }
}

// =============================================================================
// STADIUM SETUP MODE
// =============================================================================

function createBaseHelpers() {
  const grp = new THREE.Group();
  scene.add(grp);
  setupCtrl.helperGroup = grp;

  const ringGeo = new THREE.TorusGeometry(3, 0.35, 8, 32);
  const colors = { home: 0xffffff, first: 0xffaa00, second: 0x00ffff, third: 0xff44ff };

  ['home', 'first', 'second', 'third'].forEach(name => {
    const mat = new THREE.MeshBasicMaterial({ color: colors[name], depthTest: false });
    const ring = new THREE.Mesh(ringGeo, mat);
    ring.rotation.x = Math.PI / 2;
    const bp = fieldData.basePositions[name];
    ring.position.set(bp.x, bp.y + 3, bp.z);
    grp.add(ring);
    setupCtrl.baseHelpers[name] = ring;

    // Label sprite
    const labelCanvas = document.createElement('canvas');
    labelCanvas.width = 128; labelCanvas.height = 64;
    const lctx = labelCanvas.getContext('2d');
    lctx.fillStyle = 'rgba(0,0,0,0.6)';
    lctx.roundRect(4, 4, 120, 56, 8);
    lctx.fill();
    lctx.fillStyle = '#' + colors[name].toString(16).padStart(6, '0');
    lctx.font = 'bold 28px monospace';
    lctx.textAlign = 'center';
    lctx.textBaseline = 'middle';
    lctx.fillText(name === 'home' ? 'H' : name === 'first' ? '1B' : name === 'second' ? '2B' : '3B', 64, 32);
    const sprite = new THREE.Sprite(new THREE.SpriteMaterial({ map: new THREE.CanvasTexture(labelCanvas), depthTest: false }));
    sprite.scale.set(8, 4, 1);
    sprite.position.set(bp.x, bp.y + 8, bp.z);
    grp.add(sprite);
    setupCtrl.baseHelpers[name + '_label'] = sprite;
  });
}

function updateBaseHelperPositions() {
  ['home', 'first', 'second', 'third'].forEach(name => {
    const bp = fieldData.basePositions[name];
    const ring = setupCtrl.baseHelpers[name];
    const label = setupCtrl.baseHelpers[name + '_label'];
    if (ring) ring.position.set(bp.x, bp.y + 3, bp.z);
    if (label) label.position.set(bp.x, bp.y + 8, bp.z);
  });
}

function destroyBaseHelpers() {
  if (setupCtrl.helperGroup) {
    scene.remove(setupCtrl.helperGroup);
    setupCtrl.helperGroup = null;
    setupCtrl.baseHelpers = {};
  }
}

function createSetupUI() {
  const panel = document.createElement('div');
  panel.id = 'setup-panel';
  panel.style.cssText = `
    position:fixed; top:16px; right:16px; width:300px;
    background:rgba(10,10,20,0.88); color:#eee;
    font-family:'Courier New',monospace; font-size:12px;
    border:1px solid #444; border-radius:10px;
    padding:14px; z-index:9999; user-select:none;
    box-shadow:0 4px 24px rgba(0,0,0,0.6);
  `;

  const btnStyle = 'border:none;border-radius:4px;cursor:pointer;font-weight:bold;padding:3px 6px;font-size:11px;';
  const stepBtnStyle = `${btnStyle}background:#2a2a2a;color:#ccc;min-width:30px;`;
  const valStyle = 'color:#fff;font-size:12px;min-width:54px;display:inline-block;text-align:center;';

  function axisRow(label, idVal, steps) {
    const stepBtns = steps.map(s =>
      `<button class="sv-step-btn" data-id="${idVal}" data-step="${s}" style="${stepBtnStyle}">${s > 0 ? '+' : ''}${s}</button>`
    ).join('');
    return `<tr>
      <td style="color:#888;padding:3px 0;width:30px;">${label}</td>
      <td style="padding:3px 0;">
        <div style="display:flex;align-items:center;gap:3px;">
          ${stepBtns.slice(0, stepBtns.indexOf('</button>') + 9)}
          ${stepBtns.slice(stepBtns.indexOf('</button>') + 9, stepBtns.lastIndexOf('<button'))}
          <span id="${idVal}" style="${valStyle}">0</span>
          ${stepBtns.slice(stepBtns.lastIndexOf('<button'))}
        </div>
      </td>
    </tr>`;
  }

  // Build axis rows manually for clarity
  function axisRowHTML(label, spanId, stepsNeg, stepsPos) {
    const mkBtn = (s) => `<button class="sv-step-btn" data-id="${spanId}" data-step="${s}" style="${stepBtnStyle}">${s > 0 ? '+' : ''}${s}</button>`;
    return `<tr>
      <td style="color:#888;padding:3px 0;width:30px;">${label}</td>
      <td style="padding:3px 0;">
        <div style="display:flex;align-items:center;gap:2px;flex-wrap:nowrap;">
          ${stepsNeg.map(mkBtn).join('')}
          <span id="${spanId}" style="${valStyle}">0</span>
          ${stepsPos.map(mkBtn).join('')}
        </div>
      </td>
    </tr>`;
  }

  panel.innerHTML = `
    <div style="font-size:14px;font-weight:bold;color:#ffd700;margin-bottom:8px;letter-spacing:1px;">
      STADIUM SETUP
    </div>

    <div style="display:flex;gap:5px;margin-bottom:10px;">
      <button id="stab-stadium" style="flex:1;padding:5px 0;background:#ffd700;color:#000;border:none;border-radius:5px;cursor:pointer;font-weight:bold;font-size:11px;">STADIUM</button>
      <button id="stab-bases" style="flex:1;padding:5px 0;background:#333;color:#aaa;border:none;border-radius:5px;cursor:pointer;font-weight:bold;font-size:11px;">BASES</button>
    </div>

    <!-- STADIUM TAB -->
    <div id="setup-tab-stadium">
      <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
        ${axisRowHTML('PosX','sv-px',[-10,-1],[1,10])}
        ${axisRowHTML('PosY','sv-py',[-1,-0.1],[0.1,1])}
        ${axisRowHTML('PosZ','sv-pz',[-10,-1],[1,10])}
        ${axisRowHTML('RotY','sv-ry',[-45,-5],[5,45])}
        ${axisRowHTML('Scale','sv-sc',[-50,-5],[5,50])}
      </table>
      <div style="color:#555;font-size:10px;line-height:1.5;">
        Also: ← → = X &nbsp; ↑ ↓ = Z &nbsp; PgUp/Dn = Y<br>
        [ ] = Rotate &nbsp; +/− = Scale &nbsp; Shift = slow
      </div>
    </div>

    <!-- BASES TAB -->
    <div id="setup-tab-bases" style="display:none;">
      <div style="display:flex;gap:4px;margin-bottom:8px;">
        <button data-base="home"   style="flex:1;padding:4px 0;border:none;border-radius:4px;cursor:pointer;font-size:10px;font-weight:bold;background:#555;color:#fff;">HOME</button>
        <button data-base="first"  style="flex:1;padding:4px 0;border:none;border-radius:4px;cursor:pointer;font-size:10px;font-weight:bold;background:#555;color:#fff;">1ST</button>
        <button data-base="second" style="flex:1;padding:4px 0;border:none;border-radius:4px;cursor:pointer;font-size:10px;font-weight:bold;background:#555;color:#fff;">2ND</button>
        <button data-base="third"  style="flex:1;padding:4px 0;border:none;border-radius:4px;cursor:pointer;font-size:10px;font-weight:bold;background:#555;color:#fff;">3RD</button>
      </div>
      <div style="color:#ffd700;font-size:11px;margin-bottom:6px;">
        Selected: <span id="sv-base-name" style="font-weight:bold;">FIRST</span>
        <span style="color:#555;font-size:10px;"> (colored ring = base position)</span>
      </div>
      <table style="width:100%;border-collapse:collapse;margin-bottom:6px;">
        ${axisRowHTML('X','sv-bx',[-10,-1],[1,10])}
        ${axisRowHTML('Y','sv-by',[-1,-0.1],[0.1,1])}
        ${axisRowHTML('Z','sv-bz',[-10,-1],[1,10])}
      </table>
      <div style="color:#555;font-size:10px;line-height:1.5;">
        Also: ← → = X &nbsp; ↑ ↓ = Z &nbsp; PgUp/Dn = Y &nbsp; Shift = slow
      </div>
    </div>

    <hr style="border-color:#2a2a2a;margin:8px 0;">
    <div style="color:#444;font-size:10px;margin-bottom:7px;line-height:1.5;">
      CAM: Right-drag=look &nbsp; Scroll=fwd &nbsp; WASD=fly &nbsp; Q/E=up/dn
    </div>
    <div style="display:flex;gap:5px;">
      <button id="setup-copy-btn" style="flex:1;padding:6px 0;background:#1a5a1a;color:#fff;border:none;border-radius:5px;cursor:pointer;font-weight:bold;font-size:11px;">COPY CONFIG</button>
      <button id="setup-done-btn" style="flex:1;padding:6px 0;background:#1a3060;color:#fff;border:none;border-radius:5px;cursor:pointer;font-weight:bold;font-size:11px;">DONE →</button>
    </div>
    <div id="setup-copy-msg" style="color:#4f4;font-size:10px;margin-top:5px;display:none;">Copied to clipboard!</div>
  `;
  document.body.appendChild(panel);

  // Tab switching
  document.getElementById('stab-stadium').addEventListener('click', () => switchSetupTab('stadium'));
  document.getElementById('stab-bases').addEventListener('click', () => switchSetupTab('bases'));

  // --- STADIUM step buttons ---
  const stadiumStepMap = {
    'sv-px': (d) => { CUSTOM_STADIUM_CONFIG.position.x += d; applyStadiumTransform(); },
    'sv-py': (d) => { CUSTOM_STADIUM_CONFIG.position.y += d; applyStadiumTransform(); },
    'sv-pz': (d) => { CUSTOM_STADIUM_CONFIG.position.z += d; applyStadiumTransform(); },
    'sv-ry': (d) => { CUSTOM_STADIUM_CONFIG.rotation.y += d; applyStadiumTransform(); },
    'sv-sc': (d) => { CUSTOM_STADIUM_CONFIG.scale = Math.max(1, CUSTOM_STADIUM_CONFIG.scale + d); applyStadiumTransform(); },
  };

  // --- BASE step buttons ---
  const baseStepMap = {
    'sv-bx': (d) => stepSelectedBase('x', d),
    'sv-by': (d) => stepSelectedBase('y', d),
    'sv-bz': (d) => stepSelectedBase('z', d),
  };

  // Wire all step buttons
  panel.querySelectorAll('.sv-step-btn').forEach(btn => {
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault(); // prevent focus steal so keyboard keeps working
      const id = btn.dataset.id;
      const step = parseFloat(btn.dataset.step);
      if (stadiumStepMap[id]) stadiumStepMap[id](step);
      if (baseStepMap[id])   baseStepMap[id](step);
      updateSetupUI();
    });
  });

  // Base selector buttons
  panel.querySelectorAll('[data-base]').forEach(btn => {
    btn.addEventListener('mousedown', (e) => {
      e.preventDefault();
      setupCtrl.selectedBase = btn.dataset.base;
      panel.querySelectorAll('[data-base]').forEach(b => {
        b.style.background = b.dataset.base === setupCtrl.selectedBase ? '#ffd700' : '#555';
        b.style.color = b.dataset.base === setupCtrl.selectedBase ? '#000' : '#fff';
      });
      document.getElementById('sv-base-name').textContent = btn.textContent;
      updateSetupUI();
    });
  });

  // Copy config
  document.getElementById('setup-copy-btn').addEventListener('mousedown', (e) => {
    e.preventDefault();
    const txt = getSetupConfigString();
    navigator.clipboard.writeText(txt).catch(() => {});
    const msg = document.getElementById('setup-copy-msg');
    msg.style.display = 'block';
    setTimeout(() => { msg.style.display = 'none'; }, 2500);
  });

  // Done
  document.getElementById('setup-done-btn').addEventListener('mousedown', (e) => {
    e.preventDefault();
    exitSetupMode();
  });

  updateSetupUI();
}

function applyStadiumTransform() {
  if (!customStadiumModel) return;
  const cfg = CUSTOM_STADIUM_CONFIG;
  customStadiumModel.position.set(cfg.position.x, cfg.position.y, cfg.position.z);
  customStadiumModel.rotation.set(
    THREE.MathUtils.degToRad(cfg.rotation.x),
    THREE.MathUtils.degToRad(cfg.rotation.y),
    THREE.MathUtils.degToRad(cfg.rotation.z)
  );
  customStadiumModel.scale.setScalar(cfg.scale);
}

function stepSelectedBase(axis, delta) {
  if (!fieldData) return;
  const bp = fieldData.basePositions[setupCtrl.selectedBase];
  const mesh = fieldData.baseMeshes[setupCtrl.selectedBase];
  bp[axis] += delta;
  if (mesh) mesh.position.set(bp.x, bp.y - 0.12, bp.z);
  updateBaseHelperPositions();
}

function switchSetupTab(tab) {
  setupCtrl.tab = tab;
  document.getElementById('setup-tab-stadium').style.display = tab === 'stadium' ? '' : 'none';
  document.getElementById('setup-tab-bases').style.display   = tab === 'bases'   ? '' : 'none';
  document.getElementById('stab-stadium').style.background = tab === 'stadium' ? '#ffd700' : '#333';
  document.getElementById('stab-stadium').style.color      = tab === 'stadium' ? '#000' : '#aaa';
  document.getElementById('stab-bases').style.background   = tab === 'bases'   ? '#ffd700' : '#333';
  document.getElementById('stab-bases').style.color        = tab === 'bases'   ? '#000' : '#aaa';
  updateSetupUI();
}

function updateSetupUI() {
  const cfg = CUSTOM_STADIUM_CONFIG;
  const el = id => document.getElementById(id);
  if (el('sv-px')) el('sv-px').textContent = cfg.position.x.toFixed(2);
  if (el('sv-py')) el('sv-py').textContent = cfg.position.y.toFixed(2);
  if (el('sv-pz')) el('sv-pz').textContent = cfg.position.z.toFixed(2);
  if (el('sv-ry')) el('sv-ry').textContent = cfg.rotation.y.toFixed(1);
  if (el('sv-sc')) el('sv-sc').textContent = cfg.scale.toFixed(1);
  if (fieldData) {
    const bp = fieldData.basePositions[setupCtrl.selectedBase];
    if (el('sv-bx') && bp) el('sv-bx').textContent = bp.x.toFixed(2);
    if (el('sv-by') && bp) el('sv-by').textContent = bp.y.toFixed(2);
    if (el('sv-bz') && bp) el('sv-bz').textContent = bp.z.toFixed(2);
  }
}

function destroySetupUI() {
  const panel = document.getElementById('setup-panel');
  if (panel) panel.remove();
}

function getSetupConfigString() {
  const c = CUSTOM_STADIUM_CONFIG;
  const bp = fieldData ? fieldData.basePositions : null;
  const fmtV = v => v ? `{ x: ${v.x.toFixed(2)}, y: ${v.y.toFixed(2)}, z: ${v.z.toFixed(2)} }` : 'null';
  return [
    `customStadiumPath: '${c.path}', scale: ${c.scale.toFixed(1)},`,
    `positionX: ${c.position.x.toFixed(2)}, positionY: ${c.position.y.toFixed(2)}, positionZ: ${c.position.z.toFixed(2)},`,
    `rotationX: ${c.rotation.x.toFixed(1)}, rotationY: ${c.rotation.y.toFixed(1)}, rotationZ: ${c.rotation.z.toFixed(1)},`,
    `hideGeneratedField: false,`,
    `baseOverrides: {`,
    `  home:   ${bp ? fmtV(bp.home)   : 'null'},`,
    `  first:  ${bp ? fmtV(bp.first)  : 'null'},`,
    `  second: ${bp ? fmtV(bp.second) : 'null'},`,
    `  third:  ${bp ? fmtV(bp.third)  : 'null'},`,
    `}`,
  ].join('\n');
}

// Mouse events for setup camera (right-drag to look)
document.addEventListener('mousedown', (e) => {
  if (gameState !== GAME_STATE.STADIUM_SETUP) return;
  if (e.button === 2) { setupCtrl.rmb = true; setupCtrl.lastMX = e.clientX; setupCtrl.lastMY = e.clientY; }
});
document.addEventListener('mouseup',   (e) => { if (e.button === 2) setupCtrl.rmb = false; });
document.addEventListener('mousemove', (e) => {
  if (gameState !== GAME_STATE.STADIUM_SETUP || !setupCtrl.rmb) return;
  const dx = e.clientX - setupCtrl.lastMX;
  const dy = e.clientY - setupCtrl.lastMY;
  setupCtrl.camYaw   -= dx * 0.004;
  setupCtrl.camPitch -= dy * 0.004;
  setupCtrl.camPitch  = Math.max(-1.4, Math.min(1.4, setupCtrl.camPitch));
  setupCtrl.lastMX = e.clientX; setupCtrl.lastMY = e.clientY;
});
document.addEventListener('wheel', (e) => {
  if (gameState !== GAME_STATE.STADIUM_SETUP) return;
  setupCtrl.scrollDelta += e.deltaY;
}, { passive: true });
document.addEventListener('contextmenu', (e) => {
  if (gameState === GAME_STATE.STADIUM_SETUP) e.preventDefault();
});

function updateSetupCamera(dt) {
  // Consume scroll for forward/back movement
  if (setupCtrl.scrollDelta !== 0) {
    const fwd = new THREE.Vector3(
      Math.cos(setupCtrl.camPitch) * Math.sin(setupCtrl.camYaw),
      Math.sin(setupCtrl.camPitch),
      Math.cos(setupCtrl.camPitch) * Math.cos(setupCtrl.camYaw)
    );
    setupCtrl.camPos.addScaledVector(fwd, -setupCtrl.scrollDelta * 0.15);
    setupCtrl.scrollDelta = 0;
  }

  const isFast = keys['ShiftLeft'] || keys['ShiftRight'];
  const speed = isFast ? 160 : 40;
  const yaw = setupCtrl.camYaw;
  const pitch = setupCtrl.camPitch;

  const forward = new THREE.Vector3(
    Math.cos(pitch) * Math.sin(yaw),
    Math.sin(pitch),
    Math.cos(pitch) * Math.cos(yaw)
  );
  const right = new THREE.Vector3(Math.cos(yaw), 0, -Math.sin(yaw));

  if (keys['KeyW']) setupCtrl.camPos.addScaledVector(forward, speed * dt);
  if (keys['KeyS']) setupCtrl.camPos.addScaledVector(forward, -speed * dt);
  if (keys['KeyA']) setupCtrl.camPos.addScaledVector(right, -speed * dt);
  if (keys['KeyD']) setupCtrl.camPos.addScaledVector(right, speed * dt);
  if (keys['KeyQ']) setupCtrl.camPos.y -= speed * dt;
  if (keys['KeyE']) setupCtrl.camPos.y += speed * dt;

  camera.position.copy(setupCtrl.camPos);
  camera.lookAt(setupCtrl.camPos.clone().add(forward));
}

function updateSetupAdjustments(dt) {
  const isFine = keys['ShiftLeft'] || keys['ShiftRight'];
  const cfg = CUSTOM_STADIUM_CONFIG;

  if (setupCtrl.tab === 'stadium' && customStadiumModel) {
    const mv = isFine ? 3 : 30;
    const rv = isFine ? 1 : 15;
    const sv = isFine ? 5 : 50;
    let changed = false;

    if (keys['ArrowLeft'])    { cfg.position.x -= mv * dt; changed = true; }
    if (keys['ArrowRight'])   { cfg.position.x += mv * dt; changed = true; }
    if (keys['ArrowUp'])      { cfg.position.z -= mv * dt; changed = true; }
    if (keys['ArrowDown'])    { cfg.position.z += mv * dt; changed = true; }
    if (keys['PageUp'])       { cfg.position.y += mv * dt; changed = true; }
    if (keys['PageDown'])     { cfg.position.y -= mv * dt; changed = true; }
    if (keys['BracketLeft'])  { cfg.rotation.y -= rv * dt; changed = true; }
    if (keys['BracketRight']) { cfg.rotation.y += rv * dt; changed = true; }
    if (keys['Equal'])  { cfg.scale = Math.max(1, cfg.scale + sv * dt); changed = true; }
    if (keys['Minus'])  { cfg.scale = Math.max(1, cfg.scale - sv * dt); changed = true; }

    if (changed) { applyStadiumTransform(); updateSetupUI(); }
  }

  if (setupCtrl.tab === 'bases' && fieldData) {
    const mv = isFine ? 3 : 30;
    let moved = false;

    if (keys['ArrowLeft'])  { stepSelectedBase('x', -mv * dt); moved = true; }
    if (keys['ArrowRight']) { stepSelectedBase('x',  mv * dt); moved = true; }
    if (keys['ArrowUp'])    { stepSelectedBase('z', -mv * dt); moved = true; }
    if (keys['ArrowDown'])  { stepSelectedBase('z',  mv * dt); moved = true; }
    if (keys['PageUp'])     { stepSelectedBase('y',  mv * dt); moved = true; }
    if (keys['PageDown'])   { stepSelectedBase('y', -mv * dt); moved = true; }

    if (moved) updateSetupUI();
  }
}

function enterSetupMode() {
  gameState = GAME_STATE.STADIUM_SETUP;
  setupCtrl.active = true;
  createBaseHelpers();
  createSetupUI();
  document.getElementById('loading-screen').classList.add('hidden');
}

function exitSetupMode() {
  setupCtrl.active = false;
  destroyBaseHelpers();
  destroySetupUI();
  document.getElementById('loading-screen').classList.remove('hidden');
  gameState = GAME_STATE.LOADING;
  // Small delay so loading screen shows while we finish init
  setTimeout(finishGameInit, 100);
}

// =============================================================================
// STEAL BASE MINIGAME
// =============================================================================
function initiateSteal() {
  if (stealMinigameActive) return;

  // Find most advanced runner parked on a base
  let bestRunner = null, bestBase = 0;
  for (let i = 2; i >= 0; i--) {
    if (basesOccupied[i] && runnersOnBase[i]) {
      bestBase = i + 1; bestRunner = runnersOnBase[i];
      break;
    }
  }
  if (!bestRunner) { showResult('NO RUNNERS ON BASE', 'strike'); return; }
  const targetBase = bestBase + 1;
  if (targetBase > 4) { showResult('RUNNER ALREADY AT 3RD', 'hit'); return; }

  stealMinigameActive = true;
  stealRunner = bestRunner;
  stealTargetBase = targetBase;

  // Remove runner from base roster (now in motion)
  basesOccupied[bestBase - 1] = false;
  runnersOnBase[bestBase - 1] = null;
  updateBasesUI();

  // Random key sequence — 6 keys for a tougher challenge
  const pool = [...STEAL_KEY_POOL].sort(() => Math.random() - 0.5);
  stealSequence = pool.slice(0, 6);
  stealProgress = 0;
  stealTimer = 3.8;
  timeScale = 0.3;

  // Hand camera control to the steal cinematic
  cutscenePlaying = true;

  // Runner starts moving
  sendRunnerToBase(stealRunner, stealTargetBase);

  // Show UI
  const overlay = document.getElementById('steal-overlay');
  overlay.classList.add('active');
  const keysEl = document.getElementById('steal-keys');
  keysEl.innerHTML = '';
  stealSequence.forEach((code, i) => {
    const div = document.createElement('div');
    div.className = 'steal-key' + (i === 0 ? ' next' : '');
    div.id = `steal-key-${i}`;
    div.textContent = STEAL_KEY_LABELS[code];
    keysEl.appendChild(div);
  });
  document.getElementById('steal-timer-bar').style.width = '100%';
}

function handleStealKey(code) {
  if (!stealMinigameActive) return;
  if (stealProgress >= stealSequence.length) return;
  const expected = stealSequence[stealProgress];
  const keyEl = document.getElementById(`steal-key-${stealProgress}`);
  if (code === expected) {
    if (keyEl) keyEl.className = 'steal-key done';
    stealProgress++;
    if (stealProgress < stealSequence.length) {
      const nextEl = document.getElementById(`steal-key-${stealProgress}`);
      if (nextEl) nextEl.classList.add('next');
    }
    if (stealProgress >= stealSequence.length) endStealMinigame(true);
  } else {
    // Wrong key — red flash + time penalty
    if (keyEl) {
      keyEl.className = 'steal-key wrong';
      setTimeout(() => { if (keyEl) keyEl.className = 'steal-key next'; }, 320);
    }
    stealTimer = Math.max(0, stealTimer - 0.6);
  }
}

function updateStealMinigame(rawDt) {
  if (!stealMinigameActive) return;
  stealTimer -= rawDt;
  const pct = Math.max(0, stealTimer / 3.8) * 100;
  const barEl = document.getElementById('steal-timer-bar');
  if (barEl) barEl.style.width = `${pct}%`;
  if (stealTimer <= 0) { endStealMinigame(false); return; }

  // Cinematic camera: low side-on shot tracking the runner
  if (stealRunner) {
    const rp = stealRunner.position;
    const targetBasePos = baseIndexToPos(stealTargetBase);
    const runDir = targetBasePos.clone().sub(rp);
    const runLen = runDir.length();
    if (runLen > 0.1) runDir.divideScalar(runLen);
    // Perpendicular side vector (right of run direction)
    const side = new THREE.Vector3(-runDir.z, 0, runDir.x);
    // Low cinematic angle: 12 units to the side, slightly ahead, 5 units up
    cameraTargetPos.copy(rp)
      .addScaledVector(side, 12)
      .addScaledVector(runDir, -3)
      .add(new THREE.Vector3(0, 5, 0));
    cameraTargetLook.copy(rp).add(new THREE.Vector3(0, 2, 0));
  }
}

function endStealMinigame(success) {
  if (!stealMinigameActive) return;
  stealMinigameActive = false;
  timeScale = 1.0;
  cutscenePlaying = false;
  document.getElementById('steal-overlay').classList.remove('active');

  if (success) {
    showResult('STOLEN BASE!', 'homerun');
    showScreenFlash('#44ff88', 500);
    // Runner continues to target base (already in motion)
    setTimeout(() => {
      if (gameState === GAME_STATE.AWAITING_PITCH_REQUEST) startPitchSequence();
    }, 1400);
  } else {
    showResult('CAUGHT STEALING!', 'out');
    showScreenFlash('#ff4444', 500);
    if (stealRunner) {
      const cp = stealRunner.userData.customPlayer;
      if (cp && cp.actions['slide']) {
        cp.playOnce('slide', 0.1, () => { if (stealRunner) { fadeOutAndRemove(stealRunner); stealRunner = null; } });
      } else {
        fadeOutAndRemove(stealRunner);
        stealRunner = null;
      }
    }
    recordOut();
    setTimeout(() => {
      if (gameState === GAME_STATE.AWAITING_PITCH_REQUEST) {
        if (outs >= GAME_CONFIG.outs) { endHalfInning(); return; }
        startPitchSequence();
      }
    }, 1800);
  }
}

// =============================================================================
// HIT TYPE BANNER
// =============================================================================
function showHitTypeBanner(type) {
  const colors = { SINGLE: '#44ff88', DOUBLE: '#4488ff', TRIPLE: '#ff8800' };
  const banner = document.getElementById('hit-type-banner');
  const text = document.getElementById('hit-type-text');
  if (!banner || !text) return;
  text.textContent = type;
  text.style.color = colors[type] || '#ffffff';
  // Reset animation
  text.style.animation = 'none';
  text.offsetHeight; // reflow
  text.style.animation = '';
  banner.classList.remove('hiding');
  banner.classList.add('visible');
  clearTimeout(showHitTypeBanner._t);
  showHitTypeBanner._t = setTimeout(() => {
    banner.classList.add('hiding');
    setTimeout(() => banner.classList.remove('visible', 'hiding'), 450);
  }, 2400);
}

// =============================================================================
// ARC THROW SYSTEM
// =============================================================================
const _arcRaycaster = new THREE.Raycaster();
const _arcGroundPlane = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);

function initArcThrow() {
  clearArcThrow();
  arcThrowActive = true;
  _fpvArcHeightBonus = 0;
  // Seed target at home plate so FPV camera has a sensible initial aim
  const plate = getPitchPlateCenter();
  arcTargetPos.set(plate.x, 0, plate.z);

  // Line geometry — will be rebuilt every frame
  const mat = new THREE.LineBasicMaterial({ color: 0x64b4ff, transparent: true, opacity: 0.9 });
  const geo = new THREE.BufferGeometry();
  geo.setFromPoints([new THREE.Vector3(), new THREE.Vector3(0, 5, 0)]);
  arcLine = new THREE.Line(geo, mat);
  arcLine.renderOrder = 999;
  scene.add(arcLine);

  // Landing ring
  const ringGeo = new THREE.RingGeometry(0.7, 1.5, 36);
  const ringMat = new THREE.MeshBasicMaterial({ color: 0xff4444, side: THREE.DoubleSide, transparent: true, opacity: 0.9 });
  arcRing = new THREE.Mesh(ringGeo, ringMat);
  arcRing.rotation.x = -Math.PI / 2;
  arcRing.position.y = 0.12;
  scene.add(arcRing);

  const hint = document.getElementById('arc-throw-hint');
  if (hint) hint.classList.add('visible');
  hideThrowUI();
}

function updateArcThrow() {
  if (!arcThrowActive || !arcLine || !arcRing || !activeFielder) return;

  // FPV: delta-based aiming (avoids extreme perspective distortion at ground-level camera angles)
  if (firstPersonMode) {
    const sens = 28;
    const camFwd = new THREE.Vector3(); camera.getWorldDirection(camFwd); camFwd.y = 0; camFwd.normalize();
    const camRight = new THREE.Vector3().crossVectors(camFwd, new THREE.Vector3(0, 1, 0));
    arcTargetPos.addScaledVector(camRight, _mouseDelta.x * sens);
    arcTargetPos.addScaledVector(camFwd,  _mouseDelta.y * sens);
    arcTargetPos.y = 0;
    // Clamp to reasonable throw range from fielder
    const toTarget = arcTargetPos.clone().sub(activeFielder.position); toTarget.y = 0;
    if (toTarget.length() > 90) { toTarget.setLength(90); arcTargetPos.copy(activeFielder.position).add(toTarget); }
  } else {
    // Standard: raycast mouse to ground plane
    _arcRaycaster.setFromCamera(mouseNDC, camera);
    const hit = new THREE.Vector3();
    if (_arcRaycaster.ray.intersectPlane(_arcGroundPlane, hit)) {
      arcTargetPos.copy(hit);
      arcTargetPos.y = 0;
    }
  }
  _mouseDelta.set(0, 0);

  // Build arc start from fielder hand or estimated position
  const startPos = new THREE.Vector3();
  if (activeFielder.userData.skeleton && activeFielder.userData.skeleton.rightHand) {
    activeFielder.userData.skeleton.rightHand.getWorldPosition(startPos);
  } else {
    startPos.copy(activeFielder.position).add(new THREE.Vector3(0, PLAYER_CONFIG.height * 0.7, 0));
  }

  const endPos = arcTargetPos.clone();
  const dist = startPos.distanceTo(endPos);
  const midPos = startPos.clone().lerp(endPos, 0.5);
  midPos.y += Math.max(6, dist * 0.2) + _fpvArcHeightBonus;

  // Quadratic Bézier
  const pts = [];
  for (let i = 0; i <= 30; i++) {
    const t = i / 30;
    const mt = 1 - t;
    pts.push(new THREE.Vector3(
      mt * mt * startPos.x + 2 * mt * t * midPos.x + t * t * endPos.x,
      mt * mt * startPos.y + 2 * mt * t * midPos.y + t * t * endPos.y,
      mt * mt * startPos.z + 2 * mt * t * midPos.z + t * t * endPos.z
    ));
  }
  arcLine.geometry.setFromPoints(pts);

  // Position ring at target
  arcRing.position.set(arcTargetPos.x, 0.12, arcTargetPos.z);

  // Color: green if near a base
  let nearBase = false;
  if (fieldData) {
    for (const bp of Object.values(fieldData.basePositions)) {
      if (bp && arcTargetPos.distanceTo(bp) < 12) { nearBase = true; break; }
    }
  }
  arcRing.material.color.setHex(nearBase ? 0x44ff88 : 0xff4444);
  arcLine.material.color.setHex(nearBase ? 0x44ff88 : 0x64b4ff);
}

function clearArcThrow() {
  arcThrowActive = false;
  if (arcLine) { scene.remove(arcLine); arcLine.geometry.dispose(); arcLine.material.dispose(); arcLine = null; }
  if (arcRing) { scene.remove(arcRing); arcRing.geometry.dispose(); arcRing.material.dispose(); arcRing = null; }
  const hint = document.getElementById('arc-throw-hint');
  if (hint) hint.classList.remove('visible');
}

function executeArcThrow() {
  if (!arcThrowActive || !activeFielder || !activeFielder.userData.holdingBall) return;

  // Nearest base to arc target
  const baseDefs = [
    { pos: fieldData && fieldData.basePositions.first, idx: 1 },
    { pos: fieldData && fieldData.basePositions.second, idx: 2 },
    { pos: fieldData && fieldData.basePositions.third, idx: 3 },
    { pos: fieldData && fieldData.basePositions.home, idx: 0 },
  ];
  let nearest = baseDefs[0], nearestDist = Infinity;
  for (const b of baseDefs) {
    if (!b.pos) continue;
    const d = arcTargetPos.distanceTo(b.pos);
    if (d < nearestDist) { nearestDist = d; nearest = b; }
  }
  clearArcThrow();
  throwToBase(nearest.idx);
}

// =============================================================================
// BUNT
// =============================================================================
function attemptBunt() {
  if (gameState !== GAME_STATE.PITCH_INCOMING) return;
  const ball = baseball;
  if (!ball.userData.isPitched) return;

  ball.userData.isPitched = false;
  ball.userData.isInPlay = true;
  ball.userData.spin = null;

  const power = 12 + Math.random() * 8;
  const angle = 5 + Math.random() * 8;
  const dir = (Math.random() - 0.5) * 30;
  const radA = angle * Math.PI / 180;
  const radD = dir * Math.PI / 180;
  ball.userData.velocity.set(
    Math.sin(radD) * power * Math.cos(radA),
    Math.sin(radA) * power,
    -Math.cos(radD) * power * Math.cos(radA)
  );

  showResult('BUNT!', 'hit');
  showBatterUI(false);

  if (CUSTOM_CHAR_CONFIG.enabled && customBatterPlayer) {
    if (customBatterPlayer.actions && customBatterPlayer.actions['bunt']) {
      customBatterPlayer.playOnce('bunt', 0.15, () => {
        // Hide batter model after bunt animation; runner model takes over
        if (customBatterPlayer) customBatterPlayer.mesh.visible = false;
      });
    } else {
      customBatterPlayer.mesh.visible = false;
    }
  }

  gameState = GAME_STATE.BALL_IN_PLAY;
  startBaseRunningOnHit();

  if (!isUserBatting()) {
    setTimeout(() => {
      if (gameState !== GAME_STATE.BALL_IN_PLAY) return;
      gameState = GAME_STATE.FIELDING;
      showFieldingUI(true);
      setModeBanner('FIELD THE BALL — WASD override, auto-chases ball');
      pickClosestFielderToBall();
    }, 1500);
  } else {
    setModeBanner('BUNT! Watch your runners!');
  }
}

// =============================================================================
// RANDOM TIMEOUT SYSTEM
// =============================================================================
let timeoutActive = false;
let _timeoutCounterId = null;
let _timeoutScheduleId = null;
let _timeoutPunchTimers = [];
const TIMEOUT_DURATION = 10;

const TIMEOUT_SCENARIOS = [
  {
    icon: '👊',
    title: 'BENCH BRAWL!!',
    msg: 'Someone said the opposing team\'s hot dogs taste better. BIG. MISTAKE.',
    color: '#ff3322',
    anims: ['punch', 'punch', 'slide', 'catchBall'],
  },
  {
    icon: '💃',
    title: 'SPONTANEOUS\nDANCE-OFF!',
    msg: 'The umpire challenged the starting pitcher to a dance battle. Hips don\'t lie.',
    color: '#ff88ff',
    anims: ['celebrate1', 'celebrate2', 'celebrate1', 'celebrate2'],
  },
  {
    icon: '🐓',
    title: 'CHICKEN ON\nTHE FIELD!',
    msg: 'A live chicken has run onto the field. It is winning. No one can stop it.',
    color: '#ffcc00',
    anims: ['celebrate2', 'celebrate2', 'celebrate2', 'run'],
  },
  {
    icon: '😴',
    title: 'PLAYER\nFELL ASLEEP',
    msg: 'The pitcher has been on the mound for 4 hours. He gets a pass.',
    color: '#aaaaff',
    anims: ['idle', 'standIdle', 'idle', 'catcher'],
  },
  {
    icon: '🤦',
    title: 'MANAGER\nLOSES IT!',
    msg: 'The manager is disputing whether baseballs should have laces. The umpire agrees this is worth fighting about.',
    color: '#ffdd00',
    anims: ['strike', 'punch', 'strike', 'punch'],
  },
  {
    icon: '🦅',
    title: 'EAGLE STOLE\nHOME PLATE!',
    msg: 'Massive respect. The eagle flew in, grabbed it, and flew away. Nobody is stopping that bird.',
    color: '#44ddff',
    anims: ['slide', 'catchBall', 'run', 'idle'],
  },
  {
    icon: '💥',
    title: 'SUCKER\nPUNCH!!',
    msg: 'One player simply had enough of the celebration dances. Zero regrets. Standing ovation.',
    color: '#ff2200',
    anims: ['punch', 'slide', 'punch', 'catchBall'],
  },
  {
    icon: '🌮',
    title: 'TACO\nEMERGENCY!',
    msg: 'It\'s Tuesday. Contractually, all players must eat tacos mid-game. This is legally binding. Union thing.',
    color: '#ff8800',
    anims: ['celebrate1', 'run', 'celebrate2', 'idle'],
  },
  {
    icon: '🏃',
    title: 'STREAKER\nALERT!',
    msg: 'Someone ran onto the field in a full team uniform. Technically dressed for the occasion. Respect.',
    color: '#88ff88',
    anims: ['run', 'slide', 'run', 'catchBall'],
  },
  {
    icon: '🎤',
    title: 'CATCHER IS\nSINGING!',
    msg: 'The catcher started performing "Take Me Out to the Ball Game" at full volume. No one asked. Standing ovation.',
    color: '#ffaaff',
    anims: ['celebrate2', 'celebrate1', 'idle', 'standIdle'],
  },
  {
    icon: '🤸',
    title: 'VICTORY LAP\nGONE WRONG',
    msg: 'A fielder started doing backflips for absolutely no reason. He pulled something. Totally worth it.',
    color: '#44ffaa',
    anims: ['slide', 'run', 'celebrate1', 'punch'],
  },
  {
    icon: '👁️',
    title: 'UFO SPOTTED\nOVER CF!',
    msg: 'The entire outfield is staring at something above center field. The game has been paused for their safety.',
    color: '#88ffff',
    anims: ['idle', 'idle', 'standIdle', 'catchBall'],
  },
];

function scheduleNextTimeout() {
  clearTimeout(_timeoutScheduleId);
  const delay = (50 + Math.random() * 80) * 1000; // 50–130 s
  _timeoutScheduleId = setTimeout(tryTriggerTimeout, delay);
}

function tryTriggerTimeout(force = false) {
  const ok = [
    GAME_STATE.AWAITING_PITCH_REQUEST,
    GAME_STATE.PLAY_RESOLVED,
    GAME_STATE.PITCH_AIMING,
  ];
  if (!force && (!ok.includes(gameState) || timeoutActive)) {
    _timeoutScheduleId = setTimeout(tryTriggerTimeout, 5000);
    return;
  }
  if (timeoutActive) return;
  const s = TIMEOUT_SCENARIOS[Math.floor(Math.random() * TIMEOUT_SCENARIOS.length)];
  showTimeout(s);
}

function showTimeout(s) {
  timeoutActive = true;

  document.getElementById('tout-icon').textContent  = s.icon;
  document.getElementById('tout-title').textContent = s.title;
  document.getElementById('tout-title').style.color      = s.color;
  document.getElementById('tout-title').style.textShadow = `0 0 80px ${s.color}`;
  document.getElementById('tout-msg').textContent   = s.msg;
  document.getElementById('tout-bar-fill').style.width = '100%';
  document.getElementById('tout-secs').textContent  = TIMEOUT_DURATION;
  document.getElementById('timeout-overlay').classList.add('active');

  // Trigger scenario animations on custom players in staggered waves
  if (CUSTOM_CHAR_CONFIG.enabled) {
    const players = [
      customBatterPlayer,
      customPitcherPlayer,
      customCatcherPlayer,
      ...Object.values(customFielderPlayers),
    ].filter(Boolean);
    players.forEach((p, i) => {
      const anim = s.anims[i % s.anims.length];
      setTimeout(() => {
        if (p && p.actions && p.actions[anim]) p.play(anim, true, 0.2);
      }, i * 180);
    });

    // ── Punch mini-cutscene (always plays regardless of scenario) ──────────
    _timeoutPunchTimers = [];
    const plate = getPitchPlateCenter();

    // t=1.2s: camera slides to a SIDE angle that faces BOTH catcher and batter
    // Catcher is ~4 units behind plate (high z), batter is ~1.5 units behind plate
    // Camera from the first-base side, at eye level, looking across the pair
    _timeoutPunchTimers.push(setTimeout(() => {
      if (!timeoutActive) return;
      cutscenePlaying = true;
      cameraTargetPos.set(plate.x + 7, 3.2, plate.z + 2.5);
      cameraTargetLook.set(plate.x - 0.8, 3.2, plate.z + 2.5);
      // Hide the timeout UI so the punch is fully visible
      const ov = document.getElementById('timeout-overlay');
      ov.style.transition = 'opacity 0.4s ease';
      ov.style.opacity = '0';
      ov.style.pointerEvents = 'none';
    }, 1200));

    // t=2.4s: slow motion + catcher winds up — punch animation begins
    _timeoutPunchTimers.push(setTimeout(() => {
      if (!timeoutActive) return;
      timeScale = 0.35;
      if (customCatcherPlayer && customCatcherPlayer.actions['punch']) {
        customCatcherPlayer.playOnce('punch', 0.08, () => {
          if (customCatcherPlayer && timeoutActive) customCatcherPlayer.play('catcher', true, 0.3);
        });
      }
    }, 2400));

    // t=4.2s: punch CONNECTS — red flash, shake, batter crumples into slide
    // (1.8s of slow-mo time = ~0.63s of animation = well into punch contact)
    _timeoutPunchTimers.push(setTimeout(() => {
      if (!timeoutActive) return;
      showScreenFlash('#ff2200', 600);
      triggerScreenShake(3.0, 0.9);
      if (customBatterPlayer && customBatterPlayer.actions['slide']) {
        customBatterPlayer.playOnce('slide', 0.08, () => {
          if (customBatterPlayer && timeoutActive) customBatterPlayer.idle();
        });
      }
    }, 4200));

    // t=6.5s: slow motion ends, camera releases, timeout UI fades back in
    _timeoutPunchTimers.push(setTimeout(() => {
      if (!timeoutActive) return;
      timeScale = 1.0;
      cutscenePlaying = false;
      const ov = document.getElementById('timeout-overlay');
      ov.style.transition = 'opacity 0.5s ease';
      ov.style.opacity = '1';
      ov.style.pointerEvents = '';
    }, 6500));
  }

  let remaining = TIMEOUT_DURATION;
  _timeoutCounterId = setInterval(() => {
    remaining -= 0.1;
    const pct = Math.max(0, (remaining / TIMEOUT_DURATION) * 100);
    document.getElementById('tout-bar-fill').style.width = `${pct}%`;
    document.getElementById('tout-secs').textContent = Math.ceil(Math.max(0, remaining));
    if (remaining <= 0) {
      clearInterval(_timeoutCounterId);
      endTimeout();
    }
  }, 100);
}

function endTimeout() {
  timeoutActive = false;
  // Kill any lingering punch cutscene timers and release camera + speed
  _timeoutPunchTimers.forEach(id => clearTimeout(id));
  _timeoutPunchTimers = [];
  cutscenePlaying = false;
  timeScale = 1.0;

  const ov = document.getElementById('timeout-overlay');
  ov.style.pointerEvents = '';
  ov.style.opacity = '0';
  ov.style.transition = 'opacity 0.5s ease';
  setTimeout(() => {
    ov.classList.remove('active');
    ov.style.opacity = '';
    ov.style.transition = '';
  }, 520);

  // Return custom players to their role-appropriate idles
  if (CUSTOM_CHAR_CONFIG.enabled) {
    if (customBatterPlayer)  customBatterPlayer.idle();
    if (customPitcherPlayer) customPitcherPlayer.play('standIdle');
    if (customCatcherPlayer) customCatcherPlayer.play('catcher');
    Object.values(customFielderPlayers).forEach(p => { if (p) p.play('standIdle'); });
  }
  scheduleNextTimeout();
}

// =============================================================================
// HIT PARTICLES + SCREEN SHAKE
// =============================================================================
const hitParticlePool = [];
let screenShakeIntensity = 0;
let screenShakeDuration  = 0;

function spawnHitParticles(worldPos, isHomeRun = false) {
  const count   = isHomeRun ? 90 : 40;
  const life    = isHomeRun ? 1.6 : 0.75;
  const palette = isHomeRun
    ? [0xffdd00, 0xff8800, 0xff4400, 0xffffff, 0xffff88]
    : [0xffdd00, 0xffffff, 0xff8800, 0xffee44];

  const positions = new Float32Array(count * 3);
  const vels = [];

  for (let i = 0; i < count; i++) {
    positions[i * 3]     = worldPos.x;
    positions[i * 3 + 1] = worldPos.y;
    positions[i * 3 + 2] = worldPos.z;
    const spd   = isHomeRun ? 18 + Math.random() * 30 : 8 + Math.random() * 18;
    const yaw   = Math.random() * Math.PI * 2;
    const pitch = (Math.random() * 0.8 + 0.1) * Math.PI; // bias upward
    vels.push({
      x: Math.cos(pitch) * Math.cos(yaw) * spd,
      y: Math.abs(Math.sin(pitch)) * spd * 1.3 + 4,
      z: Math.cos(pitch) * Math.sin(yaw) * spd,
    });
  }

  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const color = palette[Math.floor(Math.random() * palette.length)];
  const mat = new THREE.PointsMaterial({
    size: isHomeRun ? 0.55 : 0.32,
    color,
    sizeAttenuation: true,
    transparent: true,
    depthWrite: false,
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  hitParticlePool.push({ pts, geo, mat, vels, t: 0, life });

  if (isHomeRun) {
    // second burst in gold
    const geo2 = new THREE.BufferGeometry();
    const pos2 = new Float32Array(50 * 3);
    const v2 = [];
    for (let i = 0; i < 50; i++) {
      pos2[i*3] = worldPos.x; pos2[i*3+1] = worldPos.y + 1; pos2[i*3+2] = worldPos.z;
      const s = 5 + Math.random() * 22;
      const a = Math.random() * Math.PI * 2;
      v2.push({ x: Math.cos(a)*s, y: Math.random()*25+8, z: Math.sin(a)*s });
    }
    geo2.setAttribute('position', new THREE.BufferAttribute(pos2, 3));
    const mat2 = new THREE.PointsMaterial({ size: 0.7, color: 0xffdd00, transparent: true, depthWrite: false, sizeAttenuation: true });
    const pts2 = new THREE.Points(geo2, mat2);
    scene.add(pts2);
    hitParticlePool.push({ pts: pts2, geo: geo2, mat: mat2, vels: v2, t: 0, life: 2.2 });
  }
}

// Dirt/dust burst — fielder pickups, runner slides
function spawnDustBurst(worldPos, count = 28) {
  const positions = new Float32Array(count * 3);
  const vels = [];
  const palette = [0xc4a86a, 0xa08050, 0x8b6914, 0xd2b48c, 0xbfa070];
  for (let i = 0; i < count; i++) {
    positions[i*3] = worldPos.x; positions[i*3+1] = worldPos.y; positions[i*3+2] = worldPos.z;
    const spd = 3 + Math.random() * 9;
    const yaw = Math.random() * Math.PI * 2;
    vels.push({
      x: Math.cos(yaw) * spd,
      y: Math.random() * 5 + 1,
      z: Math.sin(yaw) * spd,
    });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({
    size: 0.22 + Math.random() * 0.12,
    color: palette[Math.floor(Math.random() * palette.length)],
    sizeAttenuation: true, transparent: true, depthWrite: false,
  });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  hitParticlePool.push({ pts, geo, mat, vels, t: 0, life: 0.65 });
}

// Sharp impact sparkle — ball arrives at base after a throw
function spawnImpactSpark(worldPos) {
  const count = 22;
  const positions = new Float32Array(count * 3);
  const vels = [];
  for (let i = 0; i < count; i++) {
    positions[i*3] = worldPos.x; positions[i*3+1] = worldPos.y + 0.5; positions[i*3+2] = worldPos.z;
    const spd = 6 + Math.random() * 14;
    const yaw = Math.random() * Math.PI * 2;
    const pit = Math.random() * Math.PI * 0.5 + 0.2;
    vels.push({
      x: Math.cos(pit) * Math.cos(yaw) * spd,
      y: Math.abs(Math.sin(pit)) * spd * 0.9 + 2,
      z: Math.cos(pit) * Math.sin(yaw) * spd,
    });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  // Two colour bursts: white core + gold rim
  [0xffffff, 0xffdd66].forEach((col, idx) => {
    const g = idx === 0 ? geo : geo.clone();
    const m = new THREE.PointsMaterial({
      size: idx === 0 ? 0.30 : 0.18, color: col,
      sizeAttenuation: true, transparent: true, depthWrite: false,
    });
    const p = new THREE.Points(g, m);
    scene.add(p);
    hitParticlePool.push({ pts: p, geo: g, mat: m, vels: vels.map(v => ({...v})), t: 0, life: 0.55 });
  });
}

// Throw-release streak — quick white/teal burst when ball leaves hand
function spawnThrowRelease(worldPos) {
  const count = 16;
  const positions = new Float32Array(count * 3);
  const vels = [];
  for (let i = 0; i < count; i++) {
    positions[i*3] = worldPos.x; positions[i*3+1] = worldPos.y; positions[i*3+2] = worldPos.z;
    const spd = 5 + Math.random() * 12;
    const yaw = Math.random() * Math.PI * 2;
    vels.push({ x: Math.cos(yaw)*spd, y: Math.random()*6, z: Math.sin(yaw)*spd });
  }
  const geo = new THREE.BufferGeometry();
  geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  const mat = new THREE.PointsMaterial({ size: 0.20, color: 0xaaeeff, sizeAttenuation: true, transparent: true, depthWrite: false });
  const pts = new THREE.Points(geo, mat);
  scene.add(pts);
  hitParticlePool.push({ pts, geo, mat, vels, t: 0, life: 0.40 });
}

function updateHitParticles(dt) {
  for (let i = hitParticlePool.length - 1; i >= 0; i--) {
    const p = hitParticlePool[i];
    p.t += dt;
    const arr = p.geo.attributes.position.array;
    for (let j = 0; j < p.vels.length; j++) {
      p.vels[j].y -= 28 * dt;
      arr[j*3]   += p.vels[j].x * dt;
      arr[j*3+1] += p.vels[j].y * dt;
      arr[j*3+2] += p.vels[j].z * dt;
    }
    p.geo.attributes.position.needsUpdate = true;
    p.mat.opacity = Math.max(0, 1 - p.t / p.life);
    if (p.t >= p.life) {
      scene.remove(p.pts);
      p.geo.dispose();
      p.mat.dispose();
      hitParticlePool.splice(i, 1);
    }
  }
}

function triggerScreenShake(intensity = 1.0, duration = 0.28) {
  screenShakeIntensity = intensity;
  screenShakeDuration  = duration;
}

// =============================================================================
// LOCKER ROOM
// =============================================================================
let lockerRoomGroup       = null;
let lockerRoomPlayers     = []; // { player, patrol, baseAnim }
let lockerRoomShowcase    = null;
let lockerRoomLights      = [];
const LR_ORIGIN = new THREE.Vector3(0, 0, -700); // far behind CF
const LR_CAM_POS  = new THREE.Vector3(0, 4.5, -681);
const LR_CAM_LOOK = new THREE.Vector3(0, 1.0, -690);

const LR_PLAYER_NAMES = [
  'RODRIGUEZ','JOHNSON','WILLIAMS','BROWN',
  'JONES','DAVIS','MILLER','WILSON','MOORE',
];

function createLockerRoomFloorTex() {
  const c = document.createElement('canvas'); c.width = 256; c.height = 256;
  const ctx = c.getContext('2d');
  const ts = 32;
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      ctx.fillStyle = (row + col) % 2 === 0 ? '#1a1a2a' : '#141420';
      ctx.fillRect(col * ts, row * ts, ts, ts);
    }
  }
  ctx.strokeStyle = 'rgba(255,255,255,0.04)';
  ctx.lineWidth = 1;
  for (let i = 0; i <= 8; i++) {
    ctx.beginPath(); ctx.moveTo(i*ts, 0); ctx.lineTo(i*ts, 256); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0, i*ts); ctx.lineTo(256, i*ts); ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(6, 10);
  return t;
}

function createLockerRoom() {
  if (lockerRoomGroup) return;
  lockerRoomGroup = new THREE.Group();
  scene.add(lockerRoomGroup);
  const O = LR_ORIGIN;

  // Floor
  const floor = new THREE.Mesh(
    new THREE.PlaneGeometry(54, 90),
    new THREE.MeshStandardMaterial({ map: createLockerRoomFloorTex(), roughness: 0.45, metalness: 0.05 })
  );
  floor.rotation.x = -Math.PI / 2;
  floor.position.copy(O);
  floor.receiveShadow = false;
  scene.add(floor);

  // Ceiling
  const ceiling = new THREE.Mesh(
    new THREE.PlaneGeometry(54, 90),
    new THREE.MeshStandardMaterial({ color: 0x1a1a1a, roughness: 1 })
  );
  ceiling.rotation.x = Math.PI / 2;
  ceiling.position.set(O.x, O.y + 12, O.z);
  scene.add(ceiling);

  // Walls
  const woodMat = new THREE.MeshStandardMaterial({ color: 0x5c3d1e, roughness: 0.88 });
  const concMat = new THREE.MeshStandardMaterial({ color: 0x383838, roughness: 0.95 });

  const walls = [
    // [size, pos, rotY]
    [[54, 12], [O.x, O.y+6, O.z-45],  0,         woodMat],  // back wall
    [[54, 12], [O.x, O.y+6, O.z+45],  Math.PI,   concMat],  // front entrance
    [[90, 12], [O.x-27, O.y+6, O.z],  Math.PI/2, woodMat],  // left
    [[90, 12], [O.x+27, O.y+6, O.z], -Math.PI/2, woodMat],  // right
  ];
  for (const [[w,h], pos, ry, mat] of walls) {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat);
    m.position.set(...pos); m.rotation.y = ry; scene.add(m);
  }

  // Lockers on both side walls
  const lockerBodyMat = new THREE.MeshStandardMaterial({ color: 0x2244aa, roughness: 0.3, metalness: 0.7 });
  const lockerDoorMat = new THREE.MeshStandardMaterial({ color: 0x1a3388, roughness: 0.2, metalness: 0.9 });
  const plateMat = new THREE.MeshStandardMaterial({ color: 0xffd700, emissive: 0xaa8800, emissiveIntensity: 0.4 });
  for (const side of [-1, 1]) {
    const wx = O.x + side * 23.5;
    for (let i = 0; i < 10; i++) {
      const lz = O.z - 38 + i * 8;
      // Body
      const body = new THREE.Mesh(new THREE.BoxGeometry(3.2, 8, 1.6), lockerBodyMat);
      body.position.set(wx, O.y + 4, lz); scene.add(body);
      // Door
      const door = new THREE.Mesh(new THREE.BoxGeometry(2.9, 7.5, 0.1), lockerDoorMat);
      door.position.set(wx, O.y + 4, lz + side * 0.85); scene.add(door);
      // Name plate
      const plate = new THREE.Mesh(new THREE.BoxGeometry(2.5, 0.55, 0.12), plateMat);
      plate.position.set(wx, O.y + 7.6, lz + side * 0.86); scene.add(plate);
    }
  }


  // Spotlight cone over showcase area
  const spotGeo = new THREE.ConeGeometry(3.5, 10, 16, 1, true);
  const spotMat = new THREE.MeshBasicMaterial({ color: 0xffffcc, transparent: true, opacity: 0.06, side: THREE.BackSide });
  const spot = new THREE.Mesh(spotGeo, spotMat);
  spot.position.set(O.x, O.y + 10.5, O.z + 10); scene.add(spot);

  // Ceiling strip lights
  for (let lz = O.z - 30; lz <= O.z + 30; lz += 20) {
    const stripMesh = new THREE.Mesh(
      new THREE.BoxGeometry(20, 0.25, 1.5),
      new THREE.MeshStandardMaterial({ color: 0xffffee, emissive: 0xffffdd, emissiveIntensity: 2 })
    );
    stripMesh.position.set(O.x, O.y + 11.8, lz); scene.add(stripMesh);
    const pl = new THREE.PointLight(0xfff5e0, 1.8, 52);
    pl.position.set(O.x, O.y + 10, lz);
    scene.add(pl);
    lockerRoomLights.push(pl);
  }

  // Warm spotlight over showcase player
  const showSpot = new THREE.PointLight(0xffd080, 3.5, 28);
  showSpot.position.set(O.x, O.y + 11, O.z + 10);
  scene.add(showSpot);
  lockerRoomLights.push(showSpot);
}

function spawnLockerRoomPlayers() {
  destroyLockerRoomPlayers();
  if (!customCharAssets) return;

  const O = LR_ORIGIN;

  // ─── Showcase player ───────────────────────────────────────────
  lockerRoomShowcase = _spawnLRPlayer(new THREE.Vector3(O.x, O.y, O.z + 10), 0);
  lockerRoomShowcase.play('idle', true, 0.1);
  _applyShowcaseWeight();
  lockerRoomPlayers.push({ player: lockerRoomShowcase, patrol: null });

  // ─── Ambient locker players ────────────────────────────────────
  const ambientSetups = [
    { pos: [O.x - 20, O.y, O.z - 30], rotY: Math.PI / 2, anim: 'celebrate1' },
    { pos: [O.x + 20, O.y, O.z - 30], rotY: -Math.PI / 2, anim: 'celebrate2' },
    { pos: [O.x - 20, O.y, O.z - 14], rotY: Math.PI / 2, anim: 'standIdle' },
    { pos: [O.x + 20, O.y, O.z - 14], rotY: -Math.PI / 2, anim: 'idle' },
    { pos: [O.x - 20, O.y, O.z + 4],  rotY: Math.PI / 2, anim: 'punch' },
    { pos: [O.x + 20, O.y, O.z + 4],  rotY: -Math.PI / 2, anim: 'celebrate1' },
    { pos: [O.x - 10, O.y, O.z + 14], rotY: Math.PI * 0.7, anim: 'celebrate2' },
    { pos: [O.x + 10, O.y, O.z + 14], rotY: -Math.PI * 0.7, anim: 'idle' },
  ];

  const names = [...LR_PLAYER_NAMES];
  for (const s of ambientSetups) {
    const p = _spawnLRPlayer(new THREE.Vector3(...s.pos), s.rotY);
    // Stagger animation starts so they don't all sync up
    const delay = Math.random() * 1500;
    setTimeout(() => { if (p) p.play(s.anim, true, 0.2); }, delay);
    lockerRoomPlayers.push({ player: p, patrol: null });
  }

  // ─── Two patrolling players ────────────────────────────────────
  const patrolPaths = [
    [ new THREE.Vector3(O.x - 5, O.y, O.z - 38), new THREE.Vector3(O.x - 5, O.y, O.z + 35) ],
    [ new THREE.Vector3(O.x + 5, O.y, O.z + 35), new THREE.Vector3(O.x + 5, O.y, O.z - 38) ],
  ];
  for (const path of patrolPaths) {
    const p = _spawnLRPlayer(path[0].clone(), 0);
    p.play('run', true, 0.1);
    // Slow down animation speed a little
    if (p.actions['run']) p.actions['run'].timeScale = 0.65;
    lockerRoomPlayers.push({ player: p, patrol: { path, idx: 0, t: 0, speed: 5.5 } });
  }
}

function _spawnLRPlayer(position, rotY) {
  const mesh = skeletonClone(customCharAssets.base);
  const base = CUSTOM_CHAR_CONFIG.scale;
  mesh.scale.setScalar(base);
  mesh.position.copy(position);
  mesh.rotation.y = rotY;
  mesh.traverse(c => { if (c.isMesh) { c.castShadow = false; c.receiveShadow = false; } });
  scene.add(mesh);
  return new CustomPlayer(mesh, customCharAssets.clips);
}

function _applyShowcaseWeight() {
  if (!lockerRoomShowcase) return;
  const w    = CUSTOM_CHAR_CONFIG.weight;
  const base = CUSTOM_CHAR_CONFIG.scale;
  const wf   = Math.exp((w - 0.5) * 3.2);
  const hf   = Math.exp(-(w - 0.5) * 2.2);
  lockerRoomShowcase.mesh.scale.set(base * wf, base * hf, base * wf);
}

function destroyLockerRoomPlayers() {
  for (const obj of lockerRoomPlayers) {
    if (obj.player) scene.remove(obj.player.mesh);
  }
  lockerRoomPlayers = [];
  lockerRoomShowcase = null;
}

function updateLockerRoom(dt) {
  for (const obj of lockerRoomPlayers) {
    if (!obj.player) continue;
    obj.player.update(dt);
    if (obj.patrol) {
      const { path, idx } = obj.patrol;
      const start = path[idx];
      const end   = path[(idx + 1) % path.length];
      const segLen = start.distanceTo(end);
      obj.patrol.t += (dt * obj.patrol.speed) / segLen;
      if (obj.patrol.t >= 1) {
        obj.patrol.t -= 1;
        obj.patrol.idx = (obj.patrol.idx + 1) % path.length;
      }
      const newPos = start.clone().lerp(end, obj.patrol.t);
      obj.player.mesh.position.copy(newPos);
      const dir = end.clone().sub(start).normalize();
      if (dir.length() > 0.01) {
        obj.player.mesh.rotation.y = Math.atan2(dir.x, dir.z);
      }
    }
  }
}

async function enterLockerRoom() {
  gameState = GAME_STATE.LOCKER_ROOM;
  document.getElementById('main-menu').classList.remove('visible');
  document.getElementById('locker-room-ui').classList.add('visible');

  createLockerRoom();

  if (!customCharAssets) {
    document.getElementById('lr-loading').style.display = 'block';
    await loadCustomCharacters();
    document.getElementById('lr-loading').style.display = 'none';
  }

  spawnLockerRoomPlayers();

  // Showcase panel name
  const names = LR_PLAYER_NAMES;
  document.getElementById('lr-player-name').textContent = names[Math.floor(Math.random() * names.length)];

  // Sync slider to current weight
  const sliderEl = document.getElementById('lr-weight-slider');
  sliderEl.value = Math.round(CUSTOM_CHAR_CONFIG.weight * 100);
  _updateLRWeightLabel(CUSTOM_CHAR_CONFIG.weight);
}

function exitLockerRoom() {
  destroyLockerRoomPlayers();
  gameState = GAME_STATE.MENU;
  document.getElementById('locker-room-ui').classList.remove('visible');
  document.getElementById('main-menu').classList.add('visible');
}

function _updateLRWeightLabel(v) {
  const lbl = v < 0.15 ? 'SKELETON 💀' :
              v < 0.35 ? 'LEAN MACHINE 🏃' :
              v < 0.65 ? 'NORMAL BUILD ⚾' :
              v < 0.85 ? 'CHUNKY SLUGGER 💪' :
                         'ABSOLUTE UNIT 🐷';
  document.getElementById('lr-weight-label').textContent = lbl;
}

// =============================================================================
// MENU CAMERA ANIMATION
// =============================================================================
let menuCamAngle = Math.PI * 0.5; // start from side view

// =============================================================================
// REPLAY SYSTEM
// =============================================================================
const REPLAY_RECORD_RATE = 30;
const REPLAY_BUF_SECONDS = 6;
const REPLAY_BUF_SIZE = Math.ceil(REPLAY_RECORD_RATE * REPLAY_BUF_SECONDS);
let _replayBuf = new Array(REPLAY_BUF_SIZE).fill(null);
let _replayBufHead = 0;
let _replayBufCount = 0;
let _replayRecordAccum = 0;

let replayActive = false;
let _replayFrames = [];
let _replayPlayhead = 0;
let _replayCamA = new THREE.Vector3();        // fixed wide broadcast position for phase 1
let _replayCamB = new THREE.Vector3();        // fixed close-up position for phase 2
let _replayLookSmoothed = new THREE.Vector3(); // damped look target to avoid jitter
let _replayCamFirstFrame = true;
let _replayActionPoint = new THREE.Vector3();
let _replayOnEnd = null;

function _replaySnapshot() {
  const bp = new THREE.Vector3();
  baseball.getWorldPosition(bp);
  return {
    ball: { pos: bp.clone(), rx: baseball.rotation.x, ry: baseball.rotation.y },
    // Snapshot by object reference so index shifts after fadeOutAndRemove don't corrupt playback
    runners: baseRunners.map(r => ({ ref: r, pos: r.position.clone(), ry: r.rotation.y })),
    fielders: Object.entries(fielders).map(([role, f]) => ({ role, pos: f.position.clone(), ry: f.rotation.y })),
    batter:  batter  ? { pos: batter.position.clone(),  ry: batter.rotation.y  } : null,
    pitcher: pitcher ? { pos: pitcher.position.clone(), ry: pitcher.rotation.y } : null,
  };
}

function _updateReplayRecording(dt) {
  if (replayActive) return;
  const gs = gameState;
  if (gs === GAME_STATE.MENU || gs === GAME_STATE.LOADING ||
      gs === GAME_STATE.LOCKER_ROOM || gs === GAME_STATE.PAUSED) return;
  _replayRecordAccum += dt;
  if (_replayRecordAccum < 1 / REPLAY_RECORD_RATE) return;
  _replayRecordAccum -= 1 / REPLAY_RECORD_RATE;
  _replayBuf[_replayBufHead] = _replaySnapshot();
  _replayBufHead = (_replayBufHead + 1) % REPLAY_BUF_SIZE;
  if (_replayBufCount < REPLAY_BUF_SIZE) _replayBufCount++;
}

function triggerReplay(actionPoint, onEnd) {
  if (_replayBufCount < 8 || replayActive) { if (onEnd) setTimeout(onEnd, 0); return; }
  replayActive = true;
  _replayOnEnd = onEnd || null;
  _replayActionPoint.copy(actionPoint || new THREE.Vector3(0, 2, 0));
  _replayCamFirstFrame = true;

  // Build ordered frame list, trim to last 4.5 seconds so replay stays tight
  _replayFrames = [];
  const start = _replayBufCount < REPLAY_BUF_SIZE ? 0 : _replayBufHead;
  for (let i = 0; i < _replayBufCount; i++) {
    const f = _replayBuf[(start + i) % REPLAY_BUF_SIZE];
    if (f) _replayFrames.push(f);
  }
  const maxFrames = Math.ceil(REPLAY_RECORD_RATE * 4.5);
  if (_replayFrames.length > maxFrames) _replayFrames = _replayFrames.slice(-maxFrames);
  _replayPlayhead = 0;

  // ── Camera A: wide broadcast shot ──────────────────────────────────────────
  // Use the current camera position if it's already elevated (broadcast mode).
  // Fall back to a computed elevated position when in FPV (camera is at head height).
  const ap = _replayActionPoint;
  if (firstPersonMode || camera.position.y < 6) {
    _replayCamA.copy(ap).add(new THREE.Vector3(22, 28, 24));
  } else {
    _replayCamA.copy(camera.position);
  }

  // ── Camera B: tight side-on close-up of the base ───────────────────────────
  // Compute a direction perpendicular to (center→base), so the camera looks
  // "down the line" at the base — a classic out/safe angle.
  const toBase = ap.clone().sub(new THREE.Vector3(0, 0, 0));
  toBase.y = 0;
  if (toBase.length() < 0.5) toBase.set(1, 0, 0); // home plate fallback
  toBase.normalize();
  const perpDir = new THREE.Vector3(-toBase.z, 0, toBase.x); // 90° side-on
  _replayCamB.copy(ap).addScaledVector(perpDir, 13).add(new THREE.Vector3(0, 7, 0));

  // Initialise look target at the first recorded ball position so there's no pop on frame 1
  const firstFrame = _replayFrames[0];
  _replayLookSmoothed.copy(firstFrame ? firstFrame.ball.pos : ap).add(new THREE.Vector3(0, 1.5, 0));

  gameState = GAME_STATE.REPLAY;
  const ov = document.getElementById('replay-overlay');
  if (ov) ov.classList.add('active');
}

function _applyReplayFrame(frame) {
  if (!frame) return;
  if (baseball.parent !== scene) scene.add(baseball);
  baseball.position.copy(frame.ball.pos);
  baseball.rotation.x = frame.ball.rx;
  baseball.rotation.y = frame.ball.ry;
  // Use stored object reference — safe even if baseRunners array changed
  frame.runners.forEach(rd => {
    if (rd.ref && rd.ref.parent) {
      rd.ref.position.copy(rd.pos);
      rd.ref.rotation.y = rd.ry;
    }
  });
  frame.fielders.forEach(fd => {
    const f = fielders[fd.role];
    if (f) { f.position.copy(fd.pos); f.rotation.y = fd.ry; }
  });
  if (batter  && frame.batter)  { batter.position.copy(frame.batter.pos);   batter.rotation.y  = frame.batter.ry; }
  if (pitcher && frame.pitcher) { pitcher.position.copy(frame.pitcher.pos);  pitcher.rotation.y = frame.pitcher.ry; }
}

function _updateReplayCamera(dt) {
  const fi = Math.min(Math.floor(_replayPlayhead), _replayFrames.length - 1);
  const frame = _replayFrames[fi];
  const ballPos = frame ? frame.ball.pos.clone() : _replayActionPoint.clone();
  const ap = _replayActionPoint;

  // t: 0→1 over full replay
  const t = Math.min(1, _replayPlayhead / Math.max(1, _replayFrames.length - 1));

  // Phase 2 blend kicks in over the final 40% of the replay (shows the base play)
  const blend = Math.max(0, Math.min(1, (t - 0.60) / 0.40));
  const ease  = blend * blend; // ease-in so the cut feels intentional

  // ── Camera position: blend from fixed wide shot → fixed close-up ───────────
  // Both positions are constants computed at triggerReplay() — no moving target,
  // so there's nothing to glitch/swim toward.
  const targetPos = _replayCamA.clone().lerp(_replayCamB, ease);
  if (_replayCamFirstFrame) {
    camera.position.copy(targetPos);
    _replayCamFirstFrame = false;
  } else {
    // Phase 1: almost no movement (camera is already at A).
    // Phase 2: faster lerp to reach B before replay ends.
    const lerpRate = Math.min(1, dt * (2 + ease * 10));
    camera.position.lerp(targetPos, lerpRate);
  }

  // ── Look target: track ball in phase 1, shift to base in phase 2 ───────────
  // Smooth the raw look target with time-based damping to avoid jitter
  // as the ball moves frame-to-frame.
  const rawLook = ballPos.clone().lerp(ap.clone().add(new THREE.Vector3(0, 1.5, 0)), ease);
  rawLook.y = Math.max(rawLook.y, 0.5);
  const lookRate = Math.min(1, dt * 6); // converges in ~0.25s — responsive but not jittery
  _replayLookSmoothed.lerp(rawLook, lookRate);
  camera.lookAt(_replayLookSmoothed);
}

function updateReplay(dt) {
  const totalFrames = _replayFrames.length;
  if (totalFrames === 0) { endReplay(); return; }

  _replayPlayhead += dt * REPLAY_RECORD_RATE; // 1× real-time speed

  if (_replayPlayhead >= totalFrames) { endReplay(); return; }

  _applyReplayFrame(_replayFrames[Math.floor(_replayPlayhead)]);
  updateCustomModels(dt);
  _updateReplayCamera(dt);
}

function endReplay() {
  if (!replayActive) return;
  replayActive = false;
  const ov = document.getElementById('replay-overlay');
  if (ov) ov.classList.remove('active');
  const cb = _replayOnEnd; _replayOnEnd = null;
  if (cb) cb();
  // Sync custom meshes immediately after transitionToNextPlay resets procedural positions
  // so there's no one-frame ghost of players in their replay positions
  updateCustomModels(0);
}
window._skipReplay = endReplay;

// =============================================================================
// HR CINEMATIC SLOW-CAM
// =============================================================================
function _startHRSlowCam() {
  _hrSlowCamActive = true;
  _hrSlowCamTimer  = 0;
  _hrCamLookSmoothed = baseball.position.clone();
  timeScale = 0.5; // half speed — dramatic but ball still reaches wall in reasonable time
  _fpvShowAll();   // make sure batter mesh is visible before the cinematic
}

function _endHRSlowCam() {
  if (!_hrSlowCamActive) return;
  _hrSlowCamActive = false;
  timeScale = 1.0;
}

function _updateHRSlowCam(rawDt) {
  if (!_hrSlowCamActive) return;
  _hrSlowCamTimer += rawDt;
  if (_hrSlowCamTimer >= HR_CINEMATIC_MAX) { _endHRSlowCam(); return; }

  const plate = getPitchPlateCenter();
  const bp = baseball.position;

  // Single broadcast angle: camera sits on the first-base side at medium height
  // and slowly drifts upward as the ball rises — no sudden cuts.
  const ballHeight = Math.max(0, bp.y);
  const camHeight  = 10 + ballHeight * 0.35; // rises gently with ball
  cameraTargetPos.set(plate.x + 22, camHeight, plate.z + 16);
  camera.position.lerp(cameraTargetPos, Math.min(1, rawDt * 1.8));

  // Smooth look-at: seed on first frame, then lerp so pan is never jerky
  if (!_hrCamLookSmoothed) _hrCamLookSmoothed = bp.clone();
  _hrCamLookSmoothed.lerp(bp, Math.min(1, rawDt * 4.5));
  camera.lookAt(_hrCamLookSmoothed);
}

// =============================================================================
// GAME LOOP
// =============================================================================
const clock = new THREE.Clock();

function animate() {
  requestAnimationFrame(animate);

  if (gameState === GAME_STATE.STADIUM_SETUP) {
    const dt = Math.min(clock.getDelta(), 0.1);
    updateSetupCamera(dt);
    updateSetupAdjustments(dt);
    renderer.render(scene, camera);
    return;
  }

  if (gameState === GAME_STATE.PAUSED || gameState === GAME_STATE.LOADING) {
    renderer.render(scene, camera);
    return;
  }

  // Replay: update at slow-mo, skip normal game logic
  if (gameState === GAME_STATE.REPLAY) {
    const dt2 = Math.min(clock.getDelta(), 0.1);
    updateReplay(dt2);
    renderer.render(scene, camera);
    return;
  }

  // Slowly orbit around the stadium while the menu is up — looks like a real broadcast intro
  if (gameState === GAME_STATE.MENU) {
    const now = performance.now() * 0.001;
    menuCamAngle = now * 0.09;
    camera.position.set(
      Math.sin(menuCamAngle) * 88,
      40 + Math.sin(now * 0.13) * 4,
      Math.cos(menuCamAngle) * 88 + 8
    );
    camera.lookAt(0, 6, -12);
    renderer.render(scene, camera);
    return;
  }

  // Intro cutscene: update custom models + camera lerp, no game logic
  if (gameState === GAME_STATE.INTRO_CUTSCENE) {
    const dt2 = Math.min(clock.getDelta(), 0.1);
    updateCustomModels(dt2);
    updateCamera(dt2);
    _updateRain(dt2);
    _updateTornado(dt2);
    if (screenShakeDuration > 0) {
      screenShakeDuration -= dt2;
      const s = screenShakeIntensity * Math.max(0, screenShakeDuration / 0.28) * 0.45;
      camera.position.x += (Math.random() - 0.5) * s;
      camera.position.y += (Math.random() - 0.5) * s * 0.5;
    }
    renderer.render(scene, camera);
    return;
  }

  // Locker room: animate players, fixed camera
  if (gameState === GAME_STATE.LOCKER_ROOM) {
    const dt2 = Math.min(clock.getDelta(), 0.1);
    updateLockerRoom(dt2);
    const now = performance.now() * 0.001;
    // Slow cinematic drift
    camera.position.set(
      LR_CAM_POS.x + Math.sin(now * 0.18) * 1.2,
      LR_CAM_POS.y + Math.sin(now * 0.11) * 0.4,
      LR_CAM_POS.z
    );
    camera.lookAt(
      LR_CAM_LOOK.x + Math.sin(now * 0.22) * 0.6,
      LR_CAM_LOOK.y,
      LR_CAM_LOOK.z
    );
    renderer.render(scene, camera);
    return;
  }

  const rawDt = Math.min(clock.getDelta(), 0.1);
  const dt = rawDt * timeScale;

  _updateReplayRecording(dt);

  if (swingAnimator) swingAnimator.update(dt);
  if (pitchAnimator) pitchAnimator.update(dt);
  updateCustomModels(dt);
  updateBallPhysics(dt);
  updateBaseRunners(dt);
  updateAIFielders(dt);
  updateFielderControl(dt);
  updateAimingControl(dt);
  updateCamera(rawDt);
  updateStealMinigame(rawDt);
  updateArcThrow();
  updateHitParticles(dt);
  _updateHRSlowCam(rawDt);
  _updateRain(dt);
  _updateTornado(dt);

  // Tornado mode: auto-trigger after 15-20 seconds of gameplay
  if (_tornadoMode && !_tornadoActive && !_tornadoCutsceneActive) {
    _tornadoModeTimer += rawDt;
    if (_tornadoModeTimer >= _tornadoModeTriggerAt) {
      playTornadoCutscene();
    }
  }

  // Screen shake (applied after updateCamera so it jitters the final position)
  if (screenShakeDuration > 0) {
    screenShakeDuration -= rawDt;
    const s = screenShakeIntensity * Math.max(0, screenShakeDuration / 0.28) * 0.45;
    camera.position.x += (Math.random() - 0.5) * s;
    camera.position.y += (Math.random() - 0.5) * s * 0.5;
    camera.position.z += (Math.random() - 0.5) * s * 0.3;
  }

  renderer.render(scene, camera);
}

// =============================================================================
// INITIALIZATION
// =============================================================================
function updateLoadingProgress(pct) {
  const el = document.getElementById('progress-fill');
  if (el) el.style.width = `${Math.min(100, pct)}%`;
}

async function initGame() {
  setupLighting();
  updateLoadingProgress(15);

  fieldData = createField();
  updateLoadingProgress(25);

  outfieldWallGroup = createOutfieldWall();
  updateLoadingProgress(40);

  backstopGroup = createBackstopArea();
  updateLoadingProgress(55);

  await loadCustomStadium();
  updateLoadingProgress(70);

  applyBaseOverrides();

  animate(); // start render loop now (loading screen still covers canvas)

  const cfg = CUSTOM_STADIUM_CONFIG;
  if (cfg.enabled && !cfg.hideGeneratedField && customStadiumModel) {
    // Enter setup mode — finishGameInit() called when user clicks DONE
    enterSetupMode();
    return;
  }

  applyHideGeneratedField();
  finishGameInit();
}

function spawnMenuFloatingBalls() {
  const menu = document.getElementById('main-menu');
  for (let i = 0; i < 14; i++) {
    const ball = document.createElement('div');
    ball.className = 'menu-ball';
    const size = 18 + Math.random() * 26;
    const left = 2 + Math.random() * 96;
    const dur  = 9 + Math.random() * 14;
    const delay = -Math.random() * 23;
    ball.style.cssText = `
      left:${left}%; bottom:-50px;
      width:${size}px; height:${size}px;
      animation:menu-ball-float ${dur}s ${delay}s linear infinite;
    `;
    menu.appendChild(ball);
  }
}

function finishGameInit() {
  baseball = createBall();

  batter = createGeneratedPlayer('batter', new THREE.Vector3(1.6, 0, 1.5), TEAM_CONFIG.home.primaryColor);
  poseBatterIdle(batter);
  batter.rotation.y = Math.PI;

  const bat = createBat();
  swingAnimator = new ProceduralSwingAnimator(batter);
  swingAnimator.setBat(bat);

  pitcher = createGeneratedPlayer('pitcher', new THREE.Vector3(0, FIELD_CONFIG.moundHeight, -FIELD_CONFIG.pitchingDistance), TEAM_CONFIG.away.primaryColor);
  posePitcherIdle(pitcher);
  pitchAnimator = new ProceduralPitchAnimator(pitcher);

  catcherPlayer = createCatcher(TEAM_CONFIG.away.primaryColor);

  fielders = createFielders(TEAM_CONFIG.away.primaryColor);
  fielders.pitcher = pitcher;
  fielders.catcher = catcherPlayer;
  // Snap basemen home positions to actual base bag positions
  if (fieldData && fieldData.basePositions) {
    const bp = fieldData.basePositions;
    if (fielders.firstBase)  { fielders.firstBase.userData.homePos  = bp.first.clone();  fielders.firstBase.position.copy(bp.first);  }
    if (fielders.secondBase) { fielders.secondBase.userData.homePos = bp.second.clone(); fielders.secondBase.position.copy(bp.second); }
    if (fielders.thirdBase)  { fielders.thirdBase.userData.homePos  = bp.third.clone();  fielders.thirdBase.position.copy(bp.third);  }
  }

  refreshPlayerColors();

  setupUI();
  spawnMenuFloatingBalls();
  updateLoadingProgress(100);

  setTimeout(() => {
    gameState = GAME_STATE.MENU;
    document.getElementById('loading-screen').classList.add('hidden');
    document.getElementById('main-menu').classList.add('visible');
  }, 400);

  camera.position.set(0, GAME_CONFIG.broadcastHeight, GAME_CONFIG.broadcastDistance);
  camera.lookAt(0, 2, -FIELD_CONFIG.pitchingDistance / 2);
}

document.addEventListener('DOMContentLoaded', initGame);
