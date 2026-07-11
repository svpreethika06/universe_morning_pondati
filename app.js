/*
  MY UNIVERSE — cinematic Three.js love experience
  -------------------------------------------------
  Real Earth maps, procedural stars, galaxy, Sun, nebulae,
  touch stardust, drag parallax, a hold-to-unlock heart ritual,
  joyful heart fireworks, and an interactive love-message reveal.
*/

(() => {
  "use strict";

  const $ = (selector) => document.querySelector(selector);
  const canvas = $("#space-canvas");
  const experience = $("#experience");
  const loadingScreen = $("#loading-screen");
  const loadingText = $("#loading-text");
  const startScreen = $("#start-screen");
  const startButton = $("#start-button");
  const replayButton = $("#replay-button");
  const skipButton = $("#skip-button");
  const soundButton = $("#sound-button");
  const backgroundMusic = $("#background-music");
  const progress = $("#progress");
  const progressBar = $("#progress-bar");
  const storyCopy = $("#story-copy");
  const storyKicker = $("#story-kicker");
  const storyTitle = $("#story-title");
  const storyText = $("#story-text");
  const touchHint = $("#touch-hint");
  const touchLayer = $("#touch-layer");
  const finalMessage = $("#final-message");
  const heartRitual = $("#heart-ritual");
  const heartButton = $("#heart-button");
  const heartInstruction = $("#heart-instruction");
  const loveReveal = $("#love-reveal");
  const reasonCard = $("#reason-card");
  const reasonButton = $("#reason-button");

  if (!window.THREE || !window.gsap) {
    loadingText.textContent = "The universe could not load. Please check your internet connection.";
    return;
  }

  const isMobile = window.matchMedia("(max-width: 720px)").matches;
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const scene = new THREE.Scene();
  scene.fog = new THREE.FogExp2(0x02030a, 0.0043);

  const cameraRig = new THREE.Group();
  const camera = new THREE.PerspectiveCamera(46, innerWidth / innerHeight, 0.1, 4000);
  camera.position.set(0, 0.25, 8.9);
  cameraRig.add(camera);
  scene.add(cameraRig);

  const renderer = new THREE.WebGLRenderer({
    canvas,
    antialias: true,
    alpha: true,
    powerPreference: "high-performance"
  });

  renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.65 : 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.outputEncoding = THREE.sRGBEncoding;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  renderer.physicallyCorrectLights = true;

  const clock = new THREE.Clock();
  const animated = [];
  const world = new THREE.Group();
  scene.add(world);

  const ambientLight = new THREE.HemisphereLight(0x536d9e, 0x090612, 0.72);
  const keyLight = new THREE.DirectionalLight(0xfff0d9, 3.8);
  keyLight.position.set(5.5, 2.2, 6.5);
  scene.add(ambientLight, keyLight);

  let masterTimeline;
  let started = false;
  let muted = false;
  let assetsReady = false;
  let audioEngine;
  let heartPulse;
  let holdTween;
  let holdState = { value: 0 };
  let loveUnlocked = false;
  let reasonIndex = 0;
  let lastTouchTime = 0;
  let musicFadeTween;
  let musicWasPlayingBeforeHidden = false;

  const pointer = {
    targetX: 0,
    targetY: 0,
    currentX: 0,
    currentY: 0,
    down: false,
    moved: false,
    startX: 0,
    startY: 0
  };

  const reasons = [
    "You are the peace my heart searches for in every difficult moment maa",
    "Your smile can turn an ordinary morning into the most beautiful part of my day thangameyyy",
    "Even across the distance, your love makes me feel less alone and more complete baby maa",
    "You are not only the woman I love; you are my comfort, my best friend, and my home chellow",
    "I love the way my heart becomes softer whenever I think about you my beloved pondati",
    "You make me want to grow, work harder, and build a beautiful life beside you thangoo",
    "No star could shine brighter than the happiness you bring into my life maa",
    "I choose you in my happiest moments, my hardest moments, and every lifetime after this one pondati",
    "My favourite future is every future where I wake up and find you beside me chellowmeyyy"
  ];

  function mulberry32(seed) {
    return function random() {
      let value = (seed += 0x6d2b79f5);
      value = Math.imul(value ^ (value >>> 15), value | 1);
      value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
      return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
    };
  }

  function createRadialTexture(stops, size = 512) {
    const textureCanvas = document.createElement("canvas");
    textureCanvas.width = textureCanvas.height = size;
    const context = textureCanvas.getContext("2d");
    const gradient = context.createRadialGradient(
      size / 2,
      size / 2,
      0,
      size / 2,
      size / 2,
      size / 2
    );

    stops.forEach(([offset, color]) => gradient.addColorStop(offset, color));
    context.fillStyle = gradient;
    context.fillRect(0, 0, size, size);

    const texture = new THREE.CanvasTexture(textureCanvas);
    texture.needsUpdate = true;
    return texture;
  }

  const starTexture = createRadialTexture([
    [0, "rgba(255,255,255,1)"],
    [0.14, "rgba(255,255,255,.95)"],
    [0.42, "rgba(199,218,255,.32)"],
    [1, "rgba(0,0,0,0)"]
  ], 128);

  const loadingManager = new THREE.LoadingManager();
  const textureLoader = new THREE.TextureLoader(loadingManager);

  loadingManager.onProgress = (_url, loaded, total) => {
    const percent = Math.round((loaded / Math.max(total, 1)) * 100);
    loadingText.textContent = `Preparing your universe… ${percent}%`;
  };

  loadingManager.onError = () => {
    loadingText.textContent = "Finishing the last few stars…";
  };

  loadingManager.onLoad = () => revealStartScreen();

  function loadTexture(path, srgb = false) {
    const texture = textureLoader.load(path);
    texture.anisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    texture.wrapS = THREE.RepeatWrapping;
    if (srgb) texture.encoding = THREE.sRGBEncoding;
    return texture;
  }

  const earthMaps = {
    day: loadTexture("assets/earth_atmos_2048.jpg", true),
    clouds: loadTexture("assets/earth_clouds_1024.png"),
    night: loadTexture("assets/earth_lights_2048.png", true),
    normal: loadTexture("assets/earth_normal_2048.jpg"),
    specular: loadTexture("assets/earth_specular_2048.jpg")
  };

  function revealStartScreen() {
    if (assetsReady) return;
    assetsReady = true;
    startButton.disabled = false;
    loadingText.textContent = "Your universe is ready";

    window.setTimeout(() => {
      loadingScreen.classList.add("is-hidden");
      startScreen.classList.add("screen--visible");
    }, 430);
  }

  // Safety fallback for browsers that report local texture progress slowly.
  window.setTimeout(revealStartScreen, 7000);

  function createAtmosphere(radius, color, intensity = 0.72) {
    const material = new THREE.ShaderMaterial({
      uniforms: {
        glowColor: { value: new THREE.Color(color) },
        intensity: { value: intensity }
      },
      vertexShader: `
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          vNormal = normalize(normalMatrix * normal);
          vViewPosition = normalize(-mvPosition.xyz);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform vec3 glowColor;
        uniform float intensity;
        varying vec3 vNormal;
        varying vec3 vViewPosition;
        void main() {
          float rim = pow(max(0.0, 0.76 - dot(vNormal, vViewPosition)), 3.1);
          gl_FragColor = vec4(glowColor, rim * intensity);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      side: THREE.BackSide,
      depthWrite: false
    });

    return new THREE.Mesh(
      new THREE.SphereGeometry(radius, isMobile ? 72 : 112, isMobile ? 72 : 112),
      material
    );
  }

  function createEarth() {
    const group = new THREE.Group();
    group.position.set(0, 0.08, 0);
    group.rotation.z = -0.18;

    const segments = isMobile ? 80 : 128;
    const geometry = new THREE.SphereGeometry(1.72, segments, segments);

    const planet = new THREE.Mesh(
      geometry,
      new THREE.MeshPhongMaterial({
        map: earthMaps.day,
        normalMap: earthMaps.normal,
        normalScale: new THREE.Vector2(0.46, 0.46),
        specularMap: earthMaps.specular,
        specular: new THREE.Color(0x5d86a8),
        shininess: 18,
        emissive: new THREE.Color(0x020817),
        emissiveIntensity: 0.18
      })
    );

    const nightLights = new THREE.Mesh(
      new THREE.SphereGeometry(1.724, segments, segments),
      new THREE.ShaderMaterial({
        uniforms: {
          nightMap: { value: earthMaps.night },
          lightDirection: { value: keyLight.position.clone().normalize() },
          glowStrength: { value: 1.38 }
        },
        vertexShader: `
          varying vec2 vUv;
          varying vec3 vWorldNormal;
          void main() {
            vUv = uv;
            vWorldNormal = normalize(mat3(modelMatrix) * normal);
            gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
          }
        `,
        fragmentShader: `
          uniform sampler2D nightMap;
          uniform vec3 lightDirection;
          uniform float glowStrength;
          varying vec2 vUv;
          varying vec3 vWorldNormal;
          void main() {
            float daylight = dot(normalize(vWorldNormal), normalize(lightDirection));
            float nightSide = 1.0 - smoothstep(-0.42, 0.18, daylight);
            vec3 city = texture2D(nightMap, vUv).rgb;
            float luminance = max(max(city.r, city.g), city.b);
            vec3 warmLights = city * vec3(1.36, 1.13, 0.78) * glowStrength;
            gl_FragColor = vec4(warmLights, luminance * nightSide * 0.94);
          }
        `,
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );

    const cloudShadow = new THREE.Mesh(
      new THREE.SphereGeometry(1.732, segments, segments),
      new THREE.MeshPhongMaterial({
        alphaMap: earthMaps.clouds,
        color: 0x07101a,
        transparent: true,
        opacity: 0.2,
        depthWrite: false
      })
    );

    const clouds = new THREE.Mesh(
      new THREE.SphereGeometry(1.758, segments, segments),
      new THREE.MeshPhongMaterial({
        alphaMap: earthMaps.clouds,
        color: 0xffffff,
        transparent: true,
        opacity: 0.68,
        shininess: 4,
        depthWrite: false
      })
    );

    const atmosphere = createAtmosphere(1.96, 0x5ecbff, 0.9);
    const halo = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createRadialTexture([
          [0, "rgba(83,190,255,.13)"],
          [0.48, "rgba(46,111,255,.055)"],
          [1, "rgba(0,0,0,0)"]
        ]),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
      })
    );
    halo.scale.set(6.8, 6.8, 1);

    group.add(halo, planet, nightLights, cloudShadow, clouds, atmosphere);
    group.userData = { planet, nightLights, cloudShadow, clouds, atmosphere, halo };
    animated.push({ type: "earth", group });
    return group;
  }

  function createSun() {
    const group = new THREE.Group();
    group.position.set(23, 0, -32);
    group.scale.setScalar(0.001);

    const geometry = new THREE.SphereGeometry(4.25, isMobile ? 80 : 120, isMobile ? 80 : 120);
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        coreA: { value: new THREE.Color(0xfff6bf) },
        coreB: { value: new THREE.Color(0xff6c16) }
      },
      vertexShader: `
        varying vec2 vUv;
        varying vec3 vNormal;
        void main() {
          vUv = uv;
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform float time;
        uniform vec3 coreA;
        uniform vec3 coreB;
        varying vec2 vUv;
        varying vec3 vNormal;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          f = f * f * (3.0 - 2.0 * f);
          return mix(
            mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
            mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
            f.y
          );
        }

        float fbm(vec2 p) {
          float value = 0.0;
          float amplitude = 0.52;
          for (int i = 0; i < 5; i++) {
            value += amplitude * noise(p);
            p = p * 2.03 + 17.7;
            amplitude *= 0.5;
          }
          return value;
        }

        void main() {
          vec2 p = vUv * vec2(8.0, 4.0);
          float flow = fbm(p + vec2(time * 0.035, -time * 0.022));
          float cells = fbm(p * 2.2 - vec2(time * 0.02, time * 0.027));
          float surface = smoothstep(0.18, 0.92, flow * 0.72 + cells * 0.43);
          float rim = pow(1.0 - abs(vNormal.z), 1.8);
          vec3 color = mix(coreB, coreA, surface);
          color += vec3(1.0, 0.34, 0.04) * rim * 0.58;
          gl_FragColor = vec4(color, 1.0);
        }
      `
    });

    const sphere = new THREE.Mesh(geometry, material);
    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createRadialTexture([
          [0, "rgba(255,255,228,1)"],
          [0.11, "rgba(255,228,129,.98)"],
          [0.31, "rgba(255,126,26,.55)"],
          [0.62, "rgba(255,54,4,.13)"],
          [1, "rgba(0,0,0,0)"]
        ]),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
      })
    );
    glow.scale.set(19, 19, 1);

    const outerGlow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createRadialTexture([
          [0, "rgba(255,131,32,.22)"],
          [0.38, "rgba(255,83,12,.11)"],
          [1, "rgba(0,0,0,0)"]
        ]),
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8,
        depthWrite: false
      })
    );
    outerGlow.scale.set(30, 30, 1);

    const corona = createAtmosphere(4.95, 0xff7922, 1.02);
    const solarLight = new THREE.PointLight(0xff8d44, 84, 250, 2);

    const flareMaterial = new THREE.MeshBasicMaterial({
      color: 0xff9b45,
      transparent: true,
      opacity: 0.12,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
      depthWrite: false
    });

    const flares = new THREE.Group();
    for (let i = 0; i < 3; i += 1) {
      const flare = new THREE.Mesh(
        new THREE.TorusGeometry(4.65 + i * 0.25, 0.025 + i * 0.015, 8, 128),
        flareMaterial.clone()
      );
      flare.rotation.set(0.45 + i * 0.9, i * 1.25, 0.2 + i * 0.7);
      flares.add(flare);
    }

    group.add(outerGlow, glow, corona, flares, sphere, solarLight);
    group.userData = { sphere, glow, outerGlow, corona, flares, solarLight, material };
    animated.push({ type: "sun", group });
    return group;
  }

  function createStarField(count, radius, size, opacity = 1) {
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const random = mulberry32(count + radius * 19);
    const palette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0xc8dcff),
      new THREE.Color(0xe9c9ff),
      new THREE.Color(0xffd5e8),
      new THREE.Color(0xa8ecff),
      new THREE.Color(0xffe8c7)
    ];

    for (let i = 0; i < count; i += 1) {
      const r = radius * (0.23 + random() * 0.77);
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      positions[i * 3] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      const color = palette[Math.floor(random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
      sizes[i] = 0.6 + random() * 1.5;
    }

    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));

    const material = new THREE.PointsMaterial({
      map: starTexture,
      alphaTest: 0.01,
      size,
      vertexColors: true,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      sizeAttenuation: true
    });

    return new THREE.Points(geometry, material);
  }

  function createGalaxy() {
    const group = new THREE.Group();
    group.position.set(0, 0, -150);
    group.rotation.set(1.08, 0, -0.16);
    group.scale.setScalar(0.001);

    const count = isMobile ? 22000 : 42000;
    const arms = 5;
    const radius = 35;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const random = mulberry32(7931);
    const inner = new THREE.Color(0xfff6d9);
    const middle = new THREE.Color(0xe3b4ff);
    const outer = new THREE.Color(0x6797ff);

    for (let i = 0; i < count; i += 1) {
      const distance = Math.pow(random(), 1.72) * radius;
      const arm = i % arms;
      const branchAngle = (arm / arms) * Math.PI * 2;
      const spinAngle = distance * 0.33;
      const jitter = (1 - distance / radius) * 0.62 + 0.2;
      const angle = branchAngle + spinAngle + (random() - 0.5) * jitter;

      positions[i * 3] = Math.cos(angle) * distance + (random() - 0.5) * Math.max(0.3, distance * 0.08);
      positions[i * 3 + 1] = (random() - 0.5) * (1.2 + distance * 0.05);
      positions[i * 3 + 2] = Math.sin(angle) * distance + (random() - 0.5) * Math.max(0.3, distance * 0.08);

      const t = distance / radius;
      const color = t < 0.46
        ? inner.clone().lerp(middle, t / 0.46)
        : middle.clone().lerp(outer, (t - 0.46) / 0.54);
      color.offsetHSL((random() - 0.5) * 0.035, 0, (random() - 0.5) * 0.08);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        map: starTexture,
        alphaTest: 0.01,
        size: isMobile ? 0.14 : 0.105,
        vertexColors: true,
        transparent: true,
        opacity: 0.95,
        depthWrite: false,
        blending: THREE.AdditiveBlending
      })
    );

    const core = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createRadialTexture([
          [0, "rgba(255,255,255,.98)"],
          [0.08, "rgba(255,241,200,.92)"],
          [0.28, "rgba(224,163,255,.45)"],
          [0.58, "rgba(93,96,255,.15)"],
          [1, "rgba(0,0,0,0)"]
        ]),
        blending: THREE.AdditiveBlending,
        transparent: true,
        depthWrite: false
      })
    );
    core.scale.set(24, 24, 1);
    core.rotation.x = -group.rotation.x;

    group.add(points, core);
    group.userData = { points, core };
    animated.push({ type: "galaxy", group });
    return group;
  }

  function createNebulae() {
    const group = new THREE.Group();
    group.position.set(0, 0, -95);
    group.scale.setScalar(0.001);

    const colors = [
      ["rgba(121,62,255,.44)", "rgba(49,50,180,.15)"],
      ["rgba(255,94,181,.34)", "rgba(103,35,124,.12)"],
      ["rgba(71,188,255,.3)", "rgba(30,61,135,.11)"],
      ["rgba(255,159,99,.18)", "rgba(118,57,52,.07)"]
    ];
    const positions = [
      [-35, 16, -22, 52, 30],
      [31, -18, -8, 46, 28],
      [2, 22, -40, 60, 34],
      [-8, -25, -18, 44, 24],
      [18, 4, -52, 38, 22]
    ];

    positions.forEach((item, index) => {
      const [x, y, z, width, height] = item;
      const [center, edge] = colors[index % colors.length];
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: createRadialTexture([
            [0, center],
            [0.34, edge],
            [1, "rgba(0,0,0,0)"]
          ]),
          blending: THREE.AdditiveBlending,
          transparent: true,
          opacity: 0.75,
          depthWrite: false
        })
      );
      sprite.position.set(x, y, z);
      sprite.scale.set(width, height, 1);
      sprite.material.rotation = index * 0.9;
      sprite.userData.rotationSpeed = (index % 2 ? -1 : 1) * (0.003 + index * 0.0005);
      group.add(sprite);
    });

    animated.push({ type: "nebula", group });
    return group;
  }

  function createHeartParticles() {
    const group = new THREE.Group();
    group.position.set(0, -0.8, -35);
    group.scale.setScalar(0.001);

    const count = isMobile ? 3100 : 6200;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const random = mulberry32(4421);
    const colorA = new THREE.Color(0xffc4e0);
    const colorB = new THREE.Color(0xcdb8ff);
    const colorC = new THREE.Color(0x9ce9ff);

    for (let i = 0; i < count; i += 1) {
      const t = random() * Math.PI * 2;
      const fill = Math.sqrt(random());
      const x = 16 * Math.pow(Math.sin(t), 3);
      const y = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
      const depth = (random() - 0.5) * 3.2;

      positions[i * 3] = x * 0.18 * fill + (random() - 0.5) * 0.08;
      positions[i * 3 + 1] = y * 0.18 * fill + (random() - 0.5) * 0.08;
      positions[i * 3 + 2] = depth * (1 - fill * 0.45);

      const mix = random();
      const color = mix < 0.5
        ? colorA.clone().lerp(colorB, mix * 2)
        : colorB.clone().lerp(colorC, (mix - 0.5) * 2);
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const points = new THREE.Points(
      geometry,
      new THREE.PointsMaterial({
        map: starTexture,
        alphaTest: 0.01,
        size: isMobile ? 0.065 : 0.048,
        vertexColors: true,
        transparent: true,
        opacity: 0.96,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );

    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: createRadialTexture([
          [0, "rgba(255,193,225,.3)"],
          [0.35, "rgba(187,132,255,.12)"],
          [1, "rgba(0,0,0,0)"]
        ]),
        transparent: true,
        blending: THREE.AdditiveBlending,
        depthWrite: false
      })
    );
    glow.scale.set(9, 9, 1);

    group.add(glow, points);
    group.userData = { points, glow };
    animated.push({ type: "heart", group });
    return group;
  }

  function createDust() {
    const group = new THREE.Group();
    const random = mulberry32(2048);

    for (let i = 0; i < (isMobile ? 34 : 58); i += 1) {
      const sprite = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: starTexture,
          transparent: true,
          opacity: 0.12 + random() * 0.34,
          blending: THREE.AdditiveBlending,
          depthWrite: false
        })
      );
      sprite.position.set(
        (random() - 0.5) * 42,
        (random() - 0.5) * 25,
        -5 - random() * 80
      );
      const scale = 0.05 + random() * 0.24;
      sprite.scale.set(scale, scale, 1);
      sprite.userData.speed = 0.025 + random() * 0.085;
      group.add(sprite);
    }

    animated.push({ type: "dust", group });
    return group;
  }

  function createWarpField() {
    const count = isMobile ? 160 : 280;
    const positions = new Float32Array(count * 6);
    const random = mulberry32(8751);

    for (let i = 0; i < count; i += 1) {
      const x = (random() - 0.5) * 26;
      const y = (random() - 0.5) * 16;
      const z = -6 - random() * 76;
      const length = 0.7 + random() * 3.8;
      positions[i * 6] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = z - length;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: 0xd8e8ff,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const lines = new THREE.LineSegments(geometry, material);
    lines.frustumCulled = false;
    camera.add(lines);
    animated.push({ type: "warp", group: lines });
    return lines;
  }

  function createLoveExplosion() {
    const count = isMobile ? 700 : 1250;
    const positions = new Float32Array(count * 3);
    const colors = new Float32Array(count * 3);
    const velocities = new Float32Array(count * 3);
    const random = mulberry32(Date.now() % 100000);
    const palette = [
      new THREE.Color(0xffb6da),
      new THREE.Color(0xd7bbff),
      new THREE.Color(0xa6e9ff),
      new THREE.Color(0xffffff)
    ];

    for (let i = 0; i < count; i += 1) {
      const theta = random() * Math.PI * 2;
      const phi = Math.acos(2 * random() - 1);
      const speed = 2.4 + random() * 7.8;
      velocities[i * 3] = Math.sin(phi) * Math.cos(theta) * speed;
      velocities[i * 3 + 1] = Math.sin(phi) * Math.sin(theta) * speed;
      velocities[i * 3 + 2] = Math.cos(phi) * speed;

      const color = palette[Math.floor(random() * palette.length)];
      colors[i * 3] = color.r;
      colors[i * 3 + 1] = color.g;
      colors[i * 3 + 2] = color.b;
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));

    const material = new THREE.PointsMaterial({
      map: starTexture,
      alphaTest: 0.01,
      size: isMobile ? 0.13 : 0.1,
      vertexColors: true,
      transparent: true,
      opacity: 1,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    const points = new THREE.Points(geometry, material);
    points.position.copy(heart.position);
    world.add(points);
    animated.push({ type: "burst", points, velocities, life: 0, maxLife: 3.2 });
  }

  const starsNear = createStarField(isMobile ? 1800 : 3200, 135, 0.48, 0.84);
  const starsFar = createStarField(isMobile ? 4600 : 8400, 440, 0.78, 0.72);
  starsNear.rotation.x = 0.18;
  starsFar.rotation.z = 0.4;
  scene.add(starsNear, starsFar);
  animated.push({ type: "stars", near: starsNear, far: starsFar });

  const earth = createEarth();
  const sun = createSun();
  const nebulae = createNebulae();
  const galaxy = createGalaxy();
  const heart = createHeartParticles();
  const dust = createDust();
  const warpField = createWarpField();
  world.add(earth, sun, nebulae, galaxy, heart, dust);

  function createAudioEngine() {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return null;

    const context = new AudioContextClass();
    const master = context.createGain();
    master.gain.value = 0.11;
    master.connect(context.destination);

    const frequencies = [110, 164.81, 220, 329.63];
    frequencies.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const filter = context.createBiquadFilter();

      oscillator.type = index % 2 === 0 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = index * 4 - 6;
      filter.type = "lowpass";
      filter.frequency.value = 450 + index * 130;
      gain.gain.value = 0.011 / (index + 1);

      oscillator.connect(filter);
      filter.connect(gain);
      gain.connect(master);
      oscillator.start();
    });

    const lfo = context.createOscillator();
    const lfoGain = context.createGain();
    lfo.frequency.value = 0.08;
    lfoGain.gain.value = 0.014;
    lfo.connect(lfoGain);
    lfoGain.connect(master.gain);
    lfo.start();

    function playTone({ frequency, endFrequency, duration, volume, type = "sine", delay = 0 }) {
      const now = context.currentTime + delay;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.type = type;
      oscillator.frequency.setValueAtTime(frequency, now);
      if (endFrequency) {
        oscillator.frequency.exponentialRampToValueAtTime(endFrequency, now + duration);
      }
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(volume, now + Math.min(0.08, duration * 0.2));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      oscillator.connect(gain);
      gain.connect(master);
      oscillator.start(now);
      oscillator.stop(now + duration + 0.05);
    }

    return {
      context,
      master,
      setMuted(value) {
        master.gain.cancelScheduledValues(context.currentTime);
        master.gain.linearRampToValueAtTime(value ? 0 : 0.11, context.currentTime + 0.35);
      },
      swell(strength = 1) {
        playTone({ frequency: 170, endFrequency: 650, duration: 2.35, volume: 0.032 * strength });
      },
      twinkle() {
        playTone({ frequency: 720, endFrequency: 1180, duration: 0.38, volume: 0.026 });
      },
      heartbeat() {
        playTone({ frequency: 64, endFrequency: 46, duration: 0.18, volume: 0.055, type: "sine" });
        playTone({ frequency: 58, endFrequency: 42, duration: 0.16, volume: 0.04, type: "sine", delay: 0.22 });
      },
      celebrate() {
        [523.25, 659.25, 783.99, 1046.5].forEach((frequency, index) => {
          playTone({
            frequency,
            endFrequency: frequency * 1.02,
            duration: 1.05,
            volume: 0.023,
            type: index % 2 ? "triangle" : "sine",
            delay: index * 0.11
          });
        });
      }
    };
  }

  function setStory(kicker, title, text) {
    storyKicker.textContent = kicker;
    storyTitle.textContent = title;
    storyText.textContent = text;
  }

  function showStory(kicker, title, text, hold = 2.5) {
    const timeline = gsap.timeline();
    timeline.call(() => setStory(kicker, title, text));
    timeline.to(storyCopy, {
      opacity: 1,
      y: 0,
      duration: 0.9,
      ease: "power3.out"
    });
    timeline.to({}, { duration: hold });
    timeline.to(storyCopy, {
      opacity: 0,
      y: -18,
      duration: 0.7,
      ease: "power2.in"
    });
    timeline.set(storyCopy, { y: 20 });
    return timeline;
  }

  function buildTimeline() {
    if (masterTimeline) masterTimeline.kill();

    gsap.set(finalMessage, { opacity: 0, scale: 0.98 });
    finalMessage.classList.remove("is-visible");
    gsap.set(storyCopy, { opacity: 0, y: 20 });
    progressBar.style.width = "0%";

    masterTimeline = gsap.timeline({
      paused: true,
      defaults: { ease: "power2.inOut" },
      onUpdate: () => {
        progressBar.style.width = `${masterTimeline.progress() * 100}%`;
      },
      onComplete: () => {
        skipButton.classList.remove("is-visible");
        progress.classList.remove("is-visible");
        touchHint.classList.remove("is-visible");
      }
    });

    masterTimeline
      .add(showStory(
        "01 — OUR WORLD",
        "In this whole world, my heart found you maa",
        "Across every road, every distance, and every morning, you remain the place where my heart feels at home maa",
        2.45
      ), 0.35)
      .to(earth.rotation, { y: Math.PI * 1.75, duration: 5.8, ease: "none" }, 0)
      .to(camera.position, { x: 0.5, y: 0.3, z: 7.05, duration: 5.4 }, 0)
      .to(earth.position, { x: -0.22, y: 0.12, duration: 5.2 }, 0)
      .to(renderer, { toneMappingExposure: 1.2, duration: 4.2 }, 0.4)
      .call(() => audioEngine?.swell(0.6), null, 4.75)

      .add(showStory(
        "02 — YOUR LIGHT",
        "You are the light my morning always searches for baby maa",
        "Brighter than the Sun, warmer than its glow, and gentle enough to make even the darkest day feel beautiful",
        2.55
      ), 6.15)
      .to(warpField.material, { opacity: 0.46, duration: 0.9 }, 5.7)
      .to(warpField.scale, { z: 3.8, duration: 3.4, ease: "power2.in" }, 5.8)
      .to(warpField.material, { opacity: 0, duration: 1.1 }, 9.4)
      .to(camera.position, { x: 18.5, y: 0.2, z: -20, duration: 6.75, ease: "power2.inOut" }, 5.8)
      .to(earth.position, { x: -10, y: -1.2, z: 8, duration: 6.4 }, 5.8)
      .to(earth.scale, { x: 0.12, y: 0.12, z: 0.12, duration: 6.4 }, 5.8)
      .to(sun.scale, { x: 1, y: 1, z: 1, duration: 4.2, ease: "power3.out" }, 6.4)
      .to(sun.position, { x: 21, y: 0, z: -30, duration: 6.4 }, 5.8)
      .to(renderer, { toneMappingExposure: 1.36, duration: 2.7 }, 8.4)
      .call(() => audioEngine?.swell(0.9), null, 10.95)

      .add(showStory(
        "03 — BEYOND THE SUN",
        "But even the Sun is too small to describe what you are to me thangameyyy",
        "My love for you does not stop at the edge of this world. It travels farther beyond every light we can see my dearest pondati",
        2.7
      ), 12.4)
      .to(warpField.scale, { z: 1, duration: 0.01 }, 11.8)
      .to(warpField.material, { opacity: 0.6, duration: 0.85 }, 11.95)
      .to(warpField.scale, { z: 5.2, duration: 4.2, ease: "power3.in" }, 12.0)
      .to(warpField.material, { opacity: 0, duration: 1.25 }, 16.75)
      .to(camera.position, { x: 2.4, y: 1.2, z: -87, duration: 7.25, ease: "power3.inOut" }, 12.0)
      .to(camera.rotation, { x: -0.035, y: 0.012, z: 0.018, duration: 7.2 }, 12.0)
      .to(sun.position, { x: -19, y: 5.5, z: -15, duration: 7.2 }, 12.0)
      .to(sun.scale, { x: 0.16, y: 0.16, z: 0.16, duration: 6.6 }, 12.0)
      .to(nebulae.scale, { x: 1, y: 1, z: 1, duration: 5.2, ease: "power2.out" }, 14.2)
      .to(starsNear.material, { opacity: 1, duration: 4 }, 14.0)
      .to(starsFar.material, { opacity: 0.98, duration: 4 }, 14.0)
      .to(renderer, { toneMappingExposure: 1.08, duration: 3 }, 15.5)
      .call(() => audioEngine?.swell(1.08), null, 17.55)

      .add(showStory(
        "04 — MY UNIVERSE",
        "Every star leads me back to one beautiful truth: you are my universe, my everything, and the love of my life",
        "The universe is the woman I love, the soul I choose, and the wife I want beside me through every lifetime",
        2.9
      ), 19.15)
      .to(camera.position, { x: 0, y: 1.5, z: -109, duration: 7.45, ease: "power3.inOut" }, 18.8)
      .to(galaxy.scale, { x: 1, y: 1, z: 1, duration: 6.9, ease: "power3.out" }, 19.1)
      .to(galaxy.rotation, { x: 1.25, z: 0.38, duration: 7.5, ease: "power1.inOut" }, 19.0)
      .to(nebulae.position, { z: -25, duration: 7.4 }, 19.0)
      .to(sun.userData.glow.material, { opacity: 0, duration: 3 }, 20.8)
      .to(sun.userData.outerGlow.material, { opacity: 0, duration: 3 }, 20.8)

      .to(galaxy.scale, { x: 0.78, y: 0.78, z: 0.78, duration: 4.3, ease: "power2.inOut" }, 26.5)
      .to(galaxy.position, { y: 1.8, z: -161, duration: 4.3 }, 26.5)
      .to(heart.scale, { x: 1, y: 1, z: 1, duration: 3.9, ease: "back.out(1.65)" }, 27.2)
      .to(heart.rotation, { y: Math.PI * 2, duration: 7.1, ease: "none" }, 27.2)
      .to(renderer, { toneMappingExposure: 1.22, duration: 2.8 }, 27.0)
      .call(() => audioEngine?.swell(1.42), null, 28.5)
      .call(() => {
        touchHint.classList.remove("is-visible");
        finalMessage.classList.add("is-visible");
      }, null, 29.25)
      .to(finalMessage, { opacity: 1, scale: 1, duration: 2.25, ease: "power3.out" }, 29.25)
      .call(() => {
        heartPulse?.kill();
        heartPulse = gsap.to(heart.scale, {
          x: 1.18,
          y: 1.18,
          z: 1.18,
          duration: 3.9,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true
        });
      }, null, 30.3);

    return masterTimeline;
  }

  function clearBursts() {
    for (let i = animated.length - 1; i >= 0; i -= 1) {
      const item = animated[i];
      if (item.type !== "burst") continue;
      world.remove(item.points);
      item.points.geometry.dispose();
      item.points.material.dispose();
      animated.splice(i, 1);
    }
  }

  function resetHeartInteraction() {
    holdTween?.kill();
    holdTween = null;
    holdState.value = 0;
    heartButton.style.setProperty("--hold-progress", "0deg");
    heartButton.classList.remove("is-holding", "is-unlocked");
    heartInstruction.textContent = "Touch and hold my heart for a little surprise";
    heartRitual.style.opacity = "1";
    loveReveal.classList.remove("is-visible");
    loveUnlocked = false;
    reasonIndex = 0;
    reasonCard.textContent = reasons[0];
  }

  function resetScene() {
    if (masterTimeline) {
      masterTimeline.kill();
      masterTimeline = null;
    }
    heartPulse?.kill();
    heartPulse = null;
    clearBursts();
    resetHeartInteraction();

    cameraRig.rotation.set(0, 0, 0);
    camera.position.set(0, 0.25, 8.9);
    camera.rotation.set(0, 0, 0);

    earth.position.set(0, 0.08, 0);
    earth.scale.setScalar(1);
    earth.rotation.set(0, 0, -0.18);

    sun.position.set(23, 0, -32);
    sun.scale.setScalar(0.001);
    sun.userData.glow.material.opacity = 1;
    sun.userData.outerGlow.material.opacity = 0.8;

    nebulae.position.set(0, 0, -95);
    nebulae.scale.setScalar(0.001);

    galaxy.position.set(0, 0, -150);
    galaxy.rotation.set(1.08, 0, -0.16);
    galaxy.scale.setScalar(0.001);

    heart.position.set(0, -0.8, -35);
    heart.rotation.set(0, 0, 0);
    heart.scale.setScalar(0.001);

    warpField.scale.set(1, 1, 1);
    warpField.material.opacity = 0;
    starsNear.material.opacity = 0.84;
    starsFar.material.opacity = 0.72;
    renderer.toneMappingExposure = 1.12;

    storyCopy.style.opacity = 0;
    storyCopy.style.transform = "translateY(20px)";
    finalMessage.style.opacity = 0;
    finalMessage.style.transform = "scale(0.98)";
    finalMessage.classList.remove("is-visible");
    finalMessage.scrollTop = 0;
  }

  async function startExperience() {
    if (!assetsReady) return;
    if (!audioEngine) audioEngine = createAudioEngine();
    if (audioEngine?.context.state === "suspended") {
      await audioEngine.context.resume();
    }

    await startBackgroundMusic(true);
    started = true;
    startScreen.classList.remove("screen--visible");
    skipButton.classList.add("is-visible");
    soundButton.classList.add("is-visible");
    progress.classList.add("is-visible");
    window.setTimeout(() => touchHint.classList.add("is-visible"), 1600);

    resetScene();
    buildTimeline().play(0);
  }

  async function startBackgroundMusic(restart = false) {
    if (!backgroundMusic) return;

    musicFadeTween?.kill();
    backgroundMusic.muted = muted;

    if (restart) {
      backgroundMusic.currentTime = 0;
    }

    backgroundMusic.volume = 0;

    try {
      await backgroundMusic.play();
      musicFadeTween = gsap.to(backgroundMusic, {
        volume: 0.72,
        duration: 2.6,
        ease: "sine.out",
        overwrite: true
      });
    } catch (error) {
      console.warn("The background music could not start:", error);
    }
  }

  function skipToFinal() {
    if (!masterTimeline) return;
    masterTimeline.seek(29.35).play();
  }

  async function replayExperience() {
    await startBackgroundMusic(true);
    resetScene();
    skipButton.classList.add("is-visible");
    progress.classList.add("is-visible");
    window.setTimeout(() => touchHint.classList.add("is-visible"), 1000);
    buildTimeline().play(0);
  }

  function toggleSound() {
    muted = !muted;
    soundButton.classList.toggle("is-muted", muted);
    soundButton.setAttribute("aria-label", muted ? "Turn sound on" : "Turn sound off");
    audioEngine?.setMuted(muted);

    if (backgroundMusic) {
      backgroundMusic.muted = muted;
      if (!muted && started && backgroundMusic.paused) {
        backgroundMusic.play().catch(() => {});
      }
    }
  }

  function createTouchBurst(clientX, clientY, strength = 1) {
    const now = performance.now();
    if (now - lastTouchTime < 90) return;
    lastTouchTime = now;

    const sparkCount = Math.round(8 + strength * 5);
    const random = mulberry32(Math.floor(clientX * 17 + clientY * 31 + now));

    for (let i = 0; i < sparkCount; i += 1) {
      const spark = document.createElement("span");
      spark.className = "touch-spark";
      const angle = random() * Math.PI * 2;
      const distance = 25 + random() * 72 * strength;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const size = 2.5 + random() * 4.5;
      spark.style.setProperty("--left", `${clientX}px`);
      spark.style.setProperty("--top", `${clientY}px`);
      spark.style.setProperty("--size", `${size}px`);
      touchLayer.appendChild(spark);

      spark.animate([
        { transform: "translate(-50%, -50%) scale(.2) rotate(0deg)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1, offset: 0.18 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(0) rotate(${120 + random() * 180}deg)`, opacity: 0 }
      ], {
        duration: 720 + random() * 520,
        easing: "cubic-bezier(.17,.67,.24,1)",
        fill: "forwards"
      }).onfinish = () => spark.remove();
    }

    if (started && !muted) audioEngine?.twinkle();
  }

  function launchHeartConfetti() {
    const rect = heartButton.getBoundingClientRect();
    const originX = rect.left + rect.width / 2;
    const originY = rect.top + rect.height / 2;
    const symbols = ["♥", "♡", "✦", "✧"];
    const random = mulberry32(Date.now() % 100000);
    const count = isMobile ? 34 : 52;

    for (let i = 0; i < count; i += 1) {
      const item = document.createElement("span");
      item.className = "floating-heart";
      item.textContent = symbols[Math.floor(random() * symbols.length)];
      item.style.setProperty("--left", `${originX}px`);
      item.style.setProperty("--top", `${originY}px`);
      item.style.setProperty("--size", `${11 + random() * 18}px`);
      item.style.color = random() > 0.48 ? "#ffc0df" : random() > 0.5 ? "#d4bbff" : "#b4ebff";
      touchLayer.appendChild(item);

      const angle = random() * Math.PI * 2;
      const distance = 90 + random() * Math.min(innerWidth, innerHeight) * 0.34;
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance - 40;
      item.animate([
        { transform: "translate(-50%, -50%) scale(.2) rotate(0deg)", opacity: 0 },
        { transform: "translate(-50%, -50%) scale(1)", opacity: 1, offset: 0.13 },
        { transform: `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px)) scale(${0.6 + random() * 0.6}) rotate(${(random() - 0.5) * 480}deg)`, opacity: 0 }
      ], {
        duration: 1600 + random() * 1300,
        easing: "cubic-bezier(.15,.7,.2,1)",
        fill: "forwards"
      }).onfinish = () => item.remove();
    }
  }

  function showLoveToast(message) {
    const existing = touchLayer.querySelector(".love-toast");
    existing?.remove();
    const toast = document.createElement("div");
    toast.className = "love-toast";
    toast.textContent = message;
    touchLayer.appendChild(toast);
    toast.animate([
      { transform: "translate(-50%, 12px) scale(.96)", opacity: 0 },
      { transform: "translate(-50%, 0) scale(1)", opacity: 1, offset: 0.18 },
      { transform: "translate(-50%, -8px) scale(.98)", opacity: 0 }
    ], {
      duration: 2800,
      easing: "cubic-bezier(.22,1,.36,1)",
      fill: "forwards"
    }).onfinish = () => toast.remove();
  }

  function beginHeartHold(event) {
    if (!finalMessage.classList.contains("is-visible") || loveUnlocked) return;
    event.preventDefault();
    holdTween?.kill();
    holdState.value = Number.parseFloat(heartButton.style.getPropertyValue("--hold-progress")) || 0;
    heartButton.classList.add("is-holding");
    audioEngine?.heartbeat();

    holdTween = gsap.to(holdState, {
      value: 360,
      duration: reduceMotion ? 0.4 : 1.45,
      ease: "power1.inOut",
      onUpdate: () => {
        heartButton.style.setProperty("--hold-progress", `${holdState.value}deg`);
      },
      onComplete: unlockLove
    });
  }

  function cancelHeartHold() {
    if (loveUnlocked) return;
    holdTween?.kill();
    heartButton.classList.remove("is-holding");
    holdTween = gsap.to(holdState, {
      value: 0,
      duration: 0.35,
      ease: "power2.out",
      onUpdate: () => heartButton.style.setProperty("--hold-progress", `${holdState.value}deg`)
    });
  }

  function unlockLove() {
    if (loveUnlocked) return;
    loveUnlocked = true;
    heartButton.classList.remove("is-holding");
    heartButton.classList.add("is-unlocked");
    heartButton.style.setProperty("--hold-progress", "360deg");
    heartInstruction.textContent = "You found the heart of my universe";

    audioEngine?.celebrate();
    createLoveExplosion();
    launchHeartConfetti();
    createTouchBurst(innerWidth / 2, innerHeight / 2, 1.8);
    showLoveToast("You make my whole universe smile, maa ♥");

    gsap.to(heart.scale, {
      x: 1.48,
      y: 1.48,
      z: 1.48,
      duration: 0.42,
      ease: "back.out(2.2)",
      yoyo: true,
      repeat: 1
    });

    window.setTimeout(() => {
      loveReveal.classList.add("is-visible");
      finalMessage.scrollTo({
        top: finalMessage.scrollHeight,
        behavior: reduceMotion ? "auto" : "smooth"
      });
    }, reduceMotion ? 80 : 520);
  }

  function cycleReason(event) {
    event.stopPropagation();
    reasonIndex = (reasonIndex + 1) % reasons.length;
    const rect = reasonButton.getBoundingClientRect();
    createTouchBurst(rect.left + rect.width / 2, rect.top + rect.height / 2, 0.8);

    gsap.to(reasonCard, {
      opacity: 0,
      y: -8,
      duration: 0.22,
      ease: "power2.in",
      onComplete: () => {
        reasonCard.textContent = reasons[reasonIndex];
        gsap.fromTo(reasonCard, { opacity: 0, y: 10 }, {
          opacity: 1,
          y: 0,
          duration: 0.48,
          ease: "power3.out"
        });
      }
    });
  }

  function isInteractiveTarget(target) {
    return Boolean(target.closest("button, .love-reveal, .start-card, .final-content"));
  }

  function updatePointerFromEvent(event) {
    pointer.targetX = THREE.MathUtils.clamp((event.clientX / innerWidth) * 2 - 1, -1, 1);
    pointer.targetY = THREE.MathUtils.clamp((event.clientY / innerHeight) * 2 - 1, -1, 1);
  }

  experience.addEventListener("pointerdown", (event) => {
    updatePointerFromEvent(event);
    if (isInteractiveTarget(event.target)) return;
    pointer.down = true;
    pointer.moved = false;
    pointer.startX = event.clientX;
    pointer.startY = event.clientY;
  });

  experience.addEventListener("pointermove", (event) => {
    updatePointerFromEvent(event);
    if (!pointer.down) return;
    if (Math.hypot(event.clientX - pointer.startX, event.clientY - pointer.startY) > 9) {
      pointer.moved = true;
    }
  });

  experience.addEventListener("pointerup", (event) => {
    if (!pointer.down) return;
    pointer.down = false;
    if (!pointer.moved && !isInteractiveTarget(event.target) && started) {
      createTouchBurst(event.clientX, event.clientY, 1);
    }
  });

  experience.addEventListener("pointercancel", () => {
    pointer.down = false;
  });

  startButton.addEventListener("click", startExperience);
  replayButton.addEventListener("click", replayExperience);
  skipButton.addEventListener("click", skipToFinal);
  soundButton.addEventListener("click", toggleSound);
  reasonButton.addEventListener("click", cycleReason);

  heartButton.addEventListener("pointerdown", beginHeartHold);
  heartButton.addEventListener("pointerup", cancelHeartHold);
  heartButton.addEventListener("pointerleave", cancelHeartHold);
  heartButton.addEventListener("pointercancel", cancelHeartHold);
  heartButton.addEventListener("contextmenu", (event) => event.preventDefault());
  heartButton.addEventListener("keydown", (event) => {
    if (event.repeat) return;
    if (event.key === " " || event.key === "Enter") beginHeartHold(event);
  });
  heartButton.addEventListener("keyup", (event) => {
    if (event.key === " " || event.key === "Enter") cancelHeartHold();
  });

  window.addEventListener("resize", () => {
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
    renderer.setPixelRatio(Math.min(devicePixelRatio, isMobile ? 1.65 : 2));
    renderer.setSize(innerWidth, innerHeight);
  });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      if (masterTimeline) masterTimeline.pause();
      musicWasPlayingBeforeHidden = Boolean(backgroundMusic && !backgroundMusic.paused);
      backgroundMusic?.pause();
      return;
    }

    if (started && masterTimeline && !finalMessage.classList.contains("is-visible")) {
      masterTimeline.resume();
    }

    if (started && musicWasPlayingBeforeHidden && !muted) {
      backgroundMusic?.play().catch(() => {});
    }
  });

  function animate() {
    requestAnimationFrame(animate);
    const delta = Math.min(clock.getDelta(), 0.04);
    const elapsed = clock.elapsedTime;

    pointer.currentX += (pointer.targetX - pointer.currentX) * (pointer.down ? 0.085 : 0.035);
    pointer.currentY += (pointer.targetY - pointer.currentY) * (pointer.down ? 0.085 : 0.035);
    const parallaxStrength = started ? (finalMessage.classList.contains("is-visible") ? 0.055 : 0.032) : 0.018;
    cameraRig.rotation.y += (pointer.currentX * -parallaxStrength - cameraRig.rotation.y) * 0.045;
    cameraRig.rotation.x += (pointer.currentY * -parallaxStrength * 0.62 - cameraRig.rotation.x) * 0.045;

    for (let i = animated.length - 1; i >= 0; i -= 1) {
      const item = animated[i];
      switch (item.type) {
        case "earth":
          item.group.userData.planet.rotation.y += delta * 0.105;
          item.group.userData.nightLights.rotation.y = item.group.userData.planet.rotation.y;
          item.group.userData.cloudShadow.rotation.y += delta * 0.132;
          item.group.userData.clouds.rotation.y += delta * 0.142;
          item.group.userData.clouds.rotation.x = Math.sin(elapsed * 0.12) * 0.023;
          break;
        case "sun":
          item.group.userData.material.uniforms.time.value = elapsed;
          item.group.userData.glow.material.rotation = elapsed * 0.014;
          item.group.userData.outerGlow.material.rotation = -elapsed * 0.009;
          item.group.userData.flares.rotation.y += delta * 0.045;
          item.group.userData.flares.rotation.z -= delta * 0.018;
          item.group.rotation.y += delta * 0.03;
          break;
        case "galaxy":
          item.group.userData.points.rotation.y += delta * 0.034;
          item.group.userData.core.material.rotation = elapsed * 0.024;
          break;
        case "nebula":
          item.group.children.forEach((sprite) => {
            sprite.material.rotation += sprite.userData.rotationSpeed * delta * 60;
          });
          break;
        case "heart":
          item.group.userData.points.rotation.z = Math.sin(elapsed * 0.32) * 0.026;
          item.group.userData.glow.material.opacity = 0.7 + Math.sin(elapsed * 1.1) * 0.12;
          break;
        case "dust":
          item.group.children.forEach((particle) => {
            particle.position.y += particle.userData.speed * delta;
            if (particle.position.y > 13) particle.position.y = -13;
          });
          break;
        case "stars":
          item.near.rotation.y += delta * 0.0035;
          item.far.rotation.y -= delta * 0.0012;
          item.near.material.opacity += (0.88 + Math.sin(elapsed * 0.7) * 0.08 - item.near.material.opacity) * 0.008;
          break;
        case "warp":
          item.group.rotation.z += delta * 0.02;
          break;
        case "burst": {
          item.life += delta;
          const positions = item.points.geometry.attributes.position.array;
          for (let p = 0; p < positions.length; p += 3) {
            positions[p] += item.velocities[p] * delta;
            positions[p + 1] += item.velocities[p + 1] * delta;
            positions[p + 2] += item.velocities[p + 2] * delta;
            item.velocities[p] *= 0.992;
            item.velocities[p + 1] = item.velocities[p + 1] * 0.992 - delta * 0.16;
            item.velocities[p + 2] *= 0.992;
          }
          item.points.geometry.attributes.position.needsUpdate = true;
          item.points.rotation.z += delta * 0.16;
          item.points.material.opacity = Math.max(0, 1 - item.life / item.maxLife);
          if (item.life >= item.maxLife) {
            world.remove(item.points);
            item.points.geometry.dispose();
            item.points.material.dispose();
            animated.splice(i, 1);
          }
          break;
        }
        default:
          break;
      }
    }

    if (!started) {
      camera.position.x = Math.sin(elapsed * 0.18) * 0.14;
      camera.position.y = 0.25 + Math.cos(elapsed * 0.22) * 0.05;
    }

    renderer.render(scene, camera);
  }

  animate();
})();
