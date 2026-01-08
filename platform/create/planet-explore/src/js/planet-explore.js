/**
 * Planet Explore - First Person 3D Experience
 * PNEUOMA Create
 * 
 * WebXR-ready for Apple Vision Pro and VR headsets
 */

class PlanetExplore {
    constructor() {
        // Planet data
        this.planet = null;
        this.creatures = [];
        
        // Three.js core
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.clock = new THREE.Clock();
        
        // Player
        this.player = {
            height: 1.7,
            speed: 5,
            jumpForce: 8,
            velocity: new THREE.Vector3(),
            onGround: true,
            position: new THREE.Vector3(0, 1.7, 0)
        };
        
        // Controls
        this.keys = {};
        this.mouseMovement = { x: 0, y: 0 };
        this.isPointerLocked = false;
        this.euler = new THREE.Euler(0, 0, 0, 'YXZ');
        
        // Mobile controls
        this.joystickActive = false;
        this.joystickVector = { x: 0, y: 0 };
        this.lookActive = false;
        this.lastLookPos = { x: 0, y: 0 };
        
        // World objects
        this.terrain = null;
        this.sky = null;
        this.sun = null;
        this.moons = [];
        this.birds = [];
        this.creatureObjects = [];
        this.lifeObjects = [];
        
        // Audio
        this.audioContext = null;
        this.musicPlaying = false;
        
        // WebXR
        this.xrSession = null;
        this.xrSupported = false;
        
        // Terrain config based on planet type
        this.terrainConfigs = {
            earth: {
                groundColor: 0x4ade80,
                groundColor2: 0x22c55e,
                skyTop: 0x87CEEB,
                skyBottom: 0xE0F6FF,
                sunColor: 0xfff9c4,
                fogColor: 0xb8d4e3,
                fogDensity: 0.015
            },
            ocean: {
                groundColor: 0x3b82f6,
                groundColor2: 0x1d4ed8,
                skyTop: 0x0077b6,
                skyBottom: 0x90e0ef,
                sunColor: 0xffffff,
                fogColor: 0x90e0ef,
                fogDensity: 0.02
            },
            desert: {
                groundColor: 0xf59e0b,
                groundColor2: 0xd97706,
                skyTop: 0xfcd34d,
                skyBottom: 0xfef3c7,
                sunColor: 0xfbbf24,
                fogColor: 0xfef3c7,
                fogDensity: 0.01
            },
            ice: {
                groundColor: 0xbae6fd,
                groundColor2: 0x7dd3fc,
                skyTop: 0xbfdbfe,
                skyBottom: 0xeff6ff,
                sunColor: 0xffffff,
                fogColor: 0xeff6ff,
                fogDensity: 0.025
            },
            volcanic: {
                groundColor: 0x7f1d1d,
                groundColor2: 0x450a0a,
                skyTop: 0x1c1917,
                skyBottom: 0x44403c,
                sunColor: 0xef4444,
                fogColor: 0x292524,
                fogDensity: 0.03
            },
            crystal: {
                groundColor: 0xc084fc,
                groundColor2: 0x9333ea,
                skyTop: 0x581c87,
                skyBottom: 0xa855f7,
                sunColor: 0xe9d5ff,
                fogColor: 0x7c3aed,
                fogDensity: 0.018
            }
        };
        
        this.init();
    }
    
    async init() {
        this.loadPlanetData();
        this.setupScene();
        this.setupLighting();
        this.setupSky();
        this.setupTerrain();
        this.setupCreatures();
        this.setupLifeforms();
        this.setupEventListeners();
        this.checkVRSupport();
        this.setupAudio();
        this.updateUI();
        
        // Start render loop
        this.animate();
        
        // Hide loading screen after a moment
        setTimeout(() => {
            document.getElementById('loading-screen').classList.add('hidden');
        }, 1500);
    }
    
    loadPlanetData() {
        const params = new URLSearchParams(window.location.search);
        const planetName = params.get('planet');
        
        if (planetName) {
            const savedWorlds = JSON.parse(localStorage.getItem('pneuoma-worlds') || '[]');
            this.planet = savedWorlds.find(w => w.name === planetName);
        }
        
        if (!this.planet) {
            this.planet = {
                name: 'New World',
                terrain: 'earth',
                skyColor: 'blue',
                lifeforms: ['trees', 'flowers'],
                extras: [],
                sunCount: 1,
                moonCount: 1,
                clouds: true,
                cloudDensity: 50,
                glowIntensity: 50
            };
        }
        
        // Normalize data (handle old saves)
        this.planet.sunCount = this.planet.sunCount || this.planet.suns || 1;
        this.planet.moonCount = this.planet.moonCount || this.planet.moons || 1;
        this.planet.lifeforms = this.planet.lifeforms || ['trees', 'flowers'];
        this.planet.extras = this.planet.extras || [];
        this.planet.skyColor = this.planet.skyColor || 'blue';
        
        console.log('🌍 Loaded planet:', this.planet);
        
        // Load creatures
        const allCreatures = JSON.parse(localStorage.getItem('pneuoma-creatures') || '[]');
        const planetCreatures = JSON.parse(localStorage.getItem(`planet-creatures-${this.planet.name}`) || '[]');
        this.creatures = planetCreatures.map(name => allCreatures.find(c => c.name === name)).filter(Boolean);
        
        // Default some creatures if none
        if (this.creatures.length === 0) {
            this.creatures = [
                { name: 'Blobby', color: '#4ade80', traits: ['Friendly'] },
                { name: 'Sparky', color: '#fbbf24', traits: ['Curious'] }
            ];
        }
    }
    
    setupScene() {
        const container = document.getElementById('canvas-container');
        
        // Scene
        this.scene = new THREE.Scene();
        
        const config = this.terrainConfigs[this.planet.terrain] || this.terrainConfigs.earth;
        this.scene.fog = new THREE.FogExp2(config.fogColor, config.fogDensity);
        this.scene.background = new THREE.Color(config.skyBottom);
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, this.player.height, 5);
        
        // Renderer
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: false
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.xr.enabled = true;
        
        container.appendChild(this.renderer.domElement);
    }
    
    setupLighting() {
        const config = this.terrainConfigs[this.planet.terrain] || this.terrainConfigs.earth;
        
        // Ambient light (brighter for no suns)
        const ambientIntensity = this.planet.sunCount > 0 ? 0.4 : 0.6;
        const ambient = new THREE.AmbientLight(0xffffff, ambientIntensity);
        this.scene.add(ambient);
        
        // Hemisphere light for sky/ground color
        const hemi = new THREE.HemisphereLight(config.skyTop, config.groundColor, 0.6);
        this.scene.add(hemi);
        
        // Create suns based on planet data
        const sunCount = this.planet.sunCount || 1;
        const sunConfigs = [
            { color: config.sunColor, position: [80, 100, 80], size: 5, intensity: 1 },
            { color: 0x82b1ff, position: [-60, 80, 60], size: 4, intensity: 0.7 } // Blue secondary sun
        ];
        
        for (let i = 0; i < Math.min(sunCount, 2); i++) {
            const sunConfig = sunConfigs[i];
            
            // Directional light from sun
            const sunLight = new THREE.DirectionalLight(sunConfig.color, sunConfig.intensity);
            sunLight.position.set(...sunConfig.position);
            sunLight.castShadow = i === 0; // Only first sun casts shadows
            if (i === 0) {
                sunLight.shadow.mapSize.width = 2048;
                sunLight.shadow.mapSize.height = 2048;
                sunLight.shadow.camera.near = 0.5;
                sunLight.shadow.camera.far = 500;
                sunLight.shadow.camera.left = -100;
                sunLight.shadow.camera.right = 100;
                sunLight.shadow.camera.top = 100;
                sunLight.shadow.camera.bottom = -100;
            }
            this.scene.add(sunLight);
            
            // Sun visual (sphere in sky)
            const sunGeom = new THREE.SphereGeometry(sunConfig.size, 32, 32);
            const sunMat = new THREE.MeshBasicMaterial({
                color: sunConfig.color
            });
            const sunMesh = new THREE.Mesh(sunGeom, sunMat);
            sunMesh.position.set(...sunConfig.position);
            this.scene.add(sunMesh);
            
            // Add glow to sun
            const sunGlow = new THREE.PointLight(sunConfig.color, 2, 200);
            sunGlow.position.copy(sunMesh.position);
            this.scene.add(sunGlow);
        }
        
        // Create moons based on planet data
        this.setupMoons();
    }
    
    setupMoons() {
        const moonCount = this.planet.moonCount || 0;
        const moonColors = [0xe5e7eb, 0xfcd34d, 0xc084fc, 0xef4444, 0x34d399, 0xf472b6, 0xfb923c, 0x67e8f9, 0xfde047, 0xa78bfa];
        
        this.moons = [];
        
        for (let i = 0; i < Math.min(moonCount, 10); i++) {
            const moonSize = 1.5 + Math.random() * 2;
            const moonGeom = new THREE.SphereGeometry(moonSize, 24, 24);
            const moonColor = new THREE.Color(moonColors[i % moonColors.length]);
            const moonMat = new THREE.MeshStandardMaterial({
                color: moonColor,
                roughness: 0.8,
                metalness: 0.1,
                emissive: moonColor,
                emissiveIntensity: 0.1
            });
            
            const moon = new THREE.Mesh(moonGeom, moonMat);
            
            // Position moons in the sky at different angles
            const angle = (i / moonCount) * Math.PI * 2;
            const distance = 120 + (i * 20);
            const height = 60 + Math.random() * 40;
            
            moon.position.set(
                Math.cos(angle) * distance,
                height,
                Math.sin(angle) * distance
            );
            
            moon.userData = {
                orbitAngle: angle,
                orbitSpeed: 0.02 + Math.random() * 0.03,
                orbitDistance: distance,
                orbitHeight: height
            };
            
            this.moons.push(moon);
            this.scene.add(moon);
        }
    }
    
    setupSky() {
        const config = this.terrainConfigs[this.planet.terrain] || this.terrainConfigs.earth;
        
        // Override sky colors based on planet's chosen skyColor
        const skyColorOverrides = {
            blue: { top: 0x87CEEB, bottom: 0xE0F6FF },
            purple: { top: 0x581c87, bottom: 0xa855f7 },
            pink: { top: 0xbe185d, bottom: 0xfda4af },
            orange: { top: 0xc2410c, bottom: 0xfed7aa },
            green: { top: 0x166534, bottom: 0xbbf7d0 },
            none: { top: 0x0f172a, bottom: 0x1e293b } // Dark space-like
        };
        
        const skyChoice = this.planet.skyColor || 'blue';
        const skyOverride = skyColorOverrides[skyChoice];
        
        const skyTop = skyOverride ? skyOverride.top : config.skyTop;
        const skyBottom = skyOverride ? skyOverride.bottom : config.skyBottom;
        
        // Update scene background and fog to match
        this.scene.background = new THREE.Color(skyBottom);
        this.scene.fog = new THREE.FogExp2(skyBottom, config.fogDensity);
        
        // Sky dome
        const skyGeom = new THREE.SphereGeometry(400, 32, 32);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(skyTop) },
                bottomColor: { value: new THREE.Color(skyBottom) },
                offset: { value: 20 },
                exponent: { value: 0.6 }
            },
            vertexShader: `
                varying vec3 vWorldPosition;
                void main() {
                    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                    vWorldPosition = worldPosition.xyz;
                    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
                }
            `,
            fragmentShader: `
                uniform vec3 topColor;
                uniform vec3 bottomColor;
                uniform float offset;
                uniform float exponent;
                varying vec3 vWorldPosition;
                void main() {
                    float h = normalize(vWorldPosition + offset).y;
                    gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
                }
            `,
            side: THREE.BackSide
        });
        
        this.sky = new THREE.Mesh(skyGeom, skyMat);
        this.scene.add(this.sky);
        
        // Add aurora if the planet has it in extras
        if (this.planet.extras && this.planet.extras.includes('aurora')) {
            this.setupAurora();
        }
        
        // Add clouds if enabled
        if (this.planet.clouds !== false) {
            this.setupClouds();
        }
    }
    
    setupAurora() {
        // Create aurora curtains in the sky
        const auroraColors = [0x22c55e, 0x3b82f6, 0xa855f7, 0x22d3ee];
        
        for (let i = 0; i < 3; i++) {
            const aurGeom = new THREE.PlaneGeometry(200, 50, 32, 8);
            
            // Wavy deformation
            const vertices = aurGeom.attributes.position.array;
            for (let j = 0; j < vertices.length; j += 3) {
                const x = vertices[j];
                const y = vertices[j + 1];
                vertices[j + 2] = Math.sin(x * 0.05 + i) * 5 + Math.cos(y * 0.1) * 3;
            }
            aurGeom.computeVertexNormals();
            
            const aurMat = new THREE.MeshBasicMaterial({
                color: auroraColors[i % auroraColors.length],
                transparent: true,
                opacity: 0.3,
                side: THREE.DoubleSide
            });
            
            const aurora = new THREE.Mesh(aurGeom, aurMat);
            aurora.position.set(
                (Math.random() - 0.5) * 100,
                80 + i * 15,
                -50 - i * 30
            );
            aurora.rotation.x = -0.3;
            
            aurora.userData.phase = i;
            this.scene.add(aurora);
        }
    }
    
    setupClouds() {
        const cloudDensity = (this.planet.cloudDensity || 50) / 100;
        const cloudCount = Math.floor(20 * cloudDensity);
        
        for (let i = 0; i < cloudCount; i++) {
            const cloud = new THREE.Group();
            
            // Cloud puffs
            const puffCount = 3 + Math.floor(Math.random() * 4);
            const cloudMat = new THREE.MeshStandardMaterial({
                color: 0xffffff,
                transparent: true,
                opacity: 0.6 + Math.random() * 0.3
            });
            
            for (let j = 0; j < puffCount; j++) {
                const puffSize = 3 + Math.random() * 4;
                const puffGeom = new THREE.SphereGeometry(puffSize, 8, 8);
                const puff = new THREE.Mesh(puffGeom, cloudMat);
                puff.position.set(
                    (Math.random() - 0.5) * 10,
                    (Math.random() - 0.5) * 3,
                    (Math.random() - 0.5) * 10
                );
                cloud.add(puff);
            }
            
            // Position cloud in sky
            const angle = Math.random() * Math.PI * 2;
            const distance = 40 + Math.random() * 80;
            cloud.position.set(
                Math.cos(angle) * distance,
                30 + Math.random() * 40,
                Math.sin(angle) * distance
            );
            
            cloud.userData.driftSpeed = 0.5 + Math.random() * 1;
            cloud.userData.driftAngle = angle;
            
            this.scene.add(cloud);
        }
    }
    
    setupTerrain() {
        const config = this.terrainConfigs[this.planet.terrain] || this.terrainConfigs.earth;
        
        // Ground plane with procedural hills
        const groundSize = 200;
        const segments = 100;
        const groundGeom = new THREE.PlaneGeometry(groundSize, groundSize, segments, segments);
        
        // Create hills
        const vertices = groundGeom.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const y = vertices[i + 1];
            
            // Perlin-like noise using sine waves
            let height = 0;
            height += Math.sin(x * 0.05) * Math.cos(y * 0.05) * 3;
            height += Math.sin(x * 0.1 + 1) * Math.cos(y * 0.08) * 1.5;
            height += Math.sin(x * 0.2) * Math.sin(y * 0.15) * 0.8;
            
            // Add some randomness
            height += (Math.random() - 0.5) * 0.2;
            
            vertices[i + 2] = height;
        }
        
        groundGeom.computeVertexNormals();
        
        // Ground material
        const groundMat = new THREE.MeshStandardMaterial({
            color: config.groundColor,
            roughness: 0.8,
            metalness: 0.1,
            flatShading: false
        });
        
        this.terrain = new THREE.Mesh(groundGeom, groundMat);
        this.terrain.rotation.x = -Math.PI / 2;
        this.terrain.receiveShadow = true;
        this.scene.add(this.terrain);
        
        // Add distant mountains
        this.addMountains(config);
        
        // Add planetary ring structure if planet has rings
        if (this.planet.extras && this.planet.extras.includes('ring')) {
            this.setupPlanetaryRing(config);
        }
    }
    
    setupPlanetaryRing(config) {
        // Create giant ring structure visible in the sky (like if you were on Saturn)
        const innerRadius = 300;
        const outerRadius = 400;
        
        const ringGeom = new THREE.RingGeometry(innerRadius, outerRadius, 64);
        const ringMat = new THREE.MeshBasicMaterial({
            color: config.groundColor,
            transparent: true,
            opacity: 0.2,
            side: THREE.DoubleSide
        });
        
        const ring = new THREE.Mesh(ringGeom, ringMat);
        ring.rotation.x = Math.PI * 0.4; // Tilt the ring
        ring.position.y = 100;
        
        this.scene.add(ring);
    }
    
    addMountains(config) {
        const mountainColor = new THREE.Color(config.groundColor2).multiplyScalar(0.6);
        
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const distance = 80 + Math.random() * 30;
            const height = 15 + Math.random() * 25;
            const width = 10 + Math.random() * 15;
            
            const mountainGeom = new THREE.ConeGeometry(width, height, 6);
            const mountainMat = new THREE.MeshStandardMaterial({
                color: mountainColor,
                roughness: 0.9,
                flatShading: true
            });
            
            const mountain = new THREE.Mesh(mountainGeom, mountainMat);
            mountain.position.set(
                Math.cos(angle) * distance,
                height / 2 - 2,
                Math.sin(angle) * distance
            );
            mountain.rotation.y = Math.random() * Math.PI;
            mountain.castShadow = true;
            mountain.receiveShadow = true;
            
            this.scene.add(mountain);
        }
    }
    
    setupCreatures() {
        this.creatures.forEach((creature, index) => {
            const creatureObj = this.createCreature(creature);
            
            // Position randomly around player
            const angle = (index / this.creatures.length) * Math.PI * 2;
            const distance = 5 + Math.random() * 15;
            creatureObj.position.set(
                Math.cos(angle) * distance,
                0.5,
                Math.sin(angle) * distance
            );
            
            creatureObj.userData = {
                creature: creature,
                originalY: 0.5,
                phase: Math.random() * Math.PI * 2,
                wanderAngle: Math.random() * Math.PI * 2,
                wanderSpeed: 0.5 + Math.random() * 1
            };
            
            this.creatureObjects.push(creatureObj);
            this.scene.add(creatureObj);
        });
    }
    
    createCreature(data) {
        const group = new THREE.Group();
        
        // Parse color
        const color = new THREE.Color(data.color || '#4ade80');
        
        // Body (sphere)
        const bodyGeom = new THREE.SphereGeometry(0.5, 32, 32);
        const bodyMat = new THREE.MeshStandardMaterial({
            color: color,
            roughness: 0.3,
            metalness: 0.1,
            emissive: color,
            emissiveIntensity: 0.1
        });
        const body = new THREE.Mesh(bodyGeom, bodyMat);
        body.castShadow = true;
        group.add(body);
        
        // Eyes
        const eyeGeom = new THREE.SphereGeometry(0.12, 16, 16);
        const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
        const pupilGeom = new THREE.SphereGeometry(0.06, 16, 16);
        const pupilMat = new THREE.MeshStandardMaterial({ color: 0x1a1a2e });
        
        [-0.15, 0.15].forEach(x => {
            const eye = new THREE.Mesh(eyeGeom, eyeMat);
            eye.position.set(x, 0.15, 0.4);
            group.add(eye);
            
            const pupil = new THREE.Mesh(pupilGeom, pupilMat);
            pupil.position.set(x, 0.15, 0.48);
            group.add(pupil);
        });
        
        // Glow effect
        const glowGeom = new THREE.SphereGeometry(0.6, 16, 16);
        const glowMat = new THREE.MeshBasicMaterial({
            color: color,
            transparent: true,
            opacity: 0.15
        });
        const glow = new THREE.Mesh(glowGeom, glowMat);
        group.add(glow);
        
        // Name tag (using sprite)
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.roundRect(0, 0, 256, 64, 10);
        ctx.fill();
        ctx.fillStyle = '#ffffff';
        ctx.font = '32px Space Grotesk';
        ctx.textAlign = 'center';
        ctx.fillText(data.name, 128, 42);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMat = new THREE.SpriteMaterial({ map: texture, transparent: true });
        const sprite = new THREE.Sprite(spriteMat);
        sprite.position.y = 1;
        sprite.scale.set(2, 0.5, 1);
        group.add(sprite);
        
        return group;
    }
    
    setupLifeforms() {
        const terrain = this.planet.terrain || 'earth';
        const lifeforms = this.planet.lifeforms || ['trees'];
        
        console.log('🌱 Setting up lifeforms:', lifeforms);
        
        // Trees
        if (lifeforms.includes('trees')) {
            this.addTrees(50, terrain);
        }
        
        // Flowers
        if (lifeforms.includes('flowers')) {
            this.addFlowers(100, terrain);
        }
        
        // Mushrooms
        if (lifeforms.includes('mushrooms')) {
            this.addMushrooms(30, terrain);
        }
        
        // Birds (flying)
        if (lifeforms.includes('birds')) {
            this.addBirds(15, terrain);
        }
        
        // Ocean life (for ocean terrain or fish selection)
        if (lifeforms.includes('fish') || terrain === 'ocean') {
            this.addFish(20, terrain);
        }
        
        // Creatures (ambient critters)
        if (lifeforms.includes('creatures')) {
            this.addAmbientCreatures(10, terrain);
        }
        
        // Rocks (always add some)
        this.addRocks(30, terrain);
    }
    
    addBirds(count, terrain) {
        const birdColors = {
            earth: [0x4a5568, 0x2d3748, 0xf472b6],
            desert: [0xf59e0b, 0x78350f, 0xfbbf24],
            ice: [0xbfdbfe, 0xffffff, 0x93c5fd],
            volcanic: [0xef4444, 0x7f1d1d, 0xfbbf24],
            crystal: [0xc084fc, 0xa855f7, 0xf0abfc],
            ocean: [0xffffff, 0x93c5fd, 0x6366f1]
        };
        
        const colors = birdColors[terrain] || birdColors.earth;
        this.birds = [];
        
        for (let i = 0; i < count; i++) {
            const bird = new THREE.Group();
            const color = colors[Math.floor(Math.random() * colors.length)];
            
            // Body
            const bodyGeom = new THREE.ConeGeometry(0.15, 0.5, 8);
            bodyGeom.rotateX(Math.PI / 2);
            const bodyMat = new THREE.MeshStandardMaterial({ color });
            const body = new THREE.Mesh(bodyGeom, bodyMat);
            bird.add(body);
            
            // Wings
            const wingGeom = new THREE.BoxGeometry(0.8, 0.02, 0.3);
            const wing = new THREE.Mesh(wingGeom, bodyMat);
            wing.name = 'wings';
            bird.add(wing);
            
            // Position in sky
            const angle = Math.random() * Math.PI * 2;
            const distance = 20 + Math.random() * 50;
            bird.position.set(
                Math.cos(angle) * distance,
                15 + Math.random() * 30,
                Math.sin(angle) * distance
            );
            
            bird.userData = {
                flyAngle: angle,
                flySpeed: 3 + Math.random() * 4,
                height: bird.position.y,
                wingPhase: Math.random() * Math.PI * 2
            };
            
            this.birds.push(bird);
            this.scene.add(bird);
        }
    }
    
    addFish(count, terrain) {
        // Fish swim above ground if ocean, or in ponds if other terrain
        const isOcean = terrain === 'ocean';
        const baseHeight = isOcean ? 0.5 : 0.2;
        
        for (let i = 0; i < count; i++) {
            const fish = new THREE.Group();
            
            // Body
            const bodyGeom = new THREE.SphereGeometry(0.2, 8, 8);
            bodyGeom.scale(1.5, 0.6, 0.6);
            const fishColor = [0x22d3ee, 0xf472b6, 0xfbbf24, 0xa855f7, 0x4ade80][Math.floor(Math.random() * 5)];
            const bodyMat = new THREE.MeshStandardMaterial({
                color: fishColor,
                metalness: 0.3,
                roughness: 0.5
            });
            const body = new THREE.Mesh(bodyGeom, bodyMat);
            fish.add(body);
            
            // Tail
            const tailGeom = new THREE.ConeGeometry(0.1, 0.25, 4);
            tailGeom.rotateZ(Math.PI / 2);
            const tail = new THREE.Mesh(tailGeom, bodyMat);
            tail.position.x = -0.25;
            fish.add(tail);
            
            // Position
            const angle = Math.random() * Math.PI * 2;
            const distance = 10 + Math.random() * 40;
            fish.position.set(
                Math.cos(angle) * distance,
                baseHeight + Math.random() * 2,
                Math.sin(angle) * distance
            );
            
            fish.userData = {
                swimAngle: angle,
                swimSpeed: 1 + Math.random() * 2,
                baseY: fish.position.y
            };
            
            this.lifeObjects.push(fish);
            this.scene.add(fish);
        }
    }
    
    addAmbientCreatures(count, terrain) {
        const colors = [0x4ade80, 0xf472b6, 0xfbbf24, 0x22d3ee, 0xa855f7];
        
        for (let i = 0; i < count; i++) {
            const creature = new THREE.Group();
            
            // Simple blob body
            const size = 0.3 + Math.random() * 0.3;
            const bodyGeom = new THREE.SphereGeometry(size, 16, 16);
            const color = colors[Math.floor(Math.random() * colors.length)];
            const bodyMat = new THREE.MeshStandardMaterial({
                color,
                emissive: color,
                emissiveIntensity: 0.2
            });
            const body = new THREE.Mesh(bodyGeom, bodyMat);
            creature.add(body);
            
            // Eyes
            const eyeGeom = new THREE.SphereGeometry(size * 0.25, 8, 8);
            const eyeMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
            [-0.15, 0.15].forEach(x => {
                const eye = new THREE.Mesh(eyeGeom, eyeMat);
                eye.position.set(x * size * 2, size * 0.3, size * 0.8);
                creature.add(eye);
            });
            
            // Position on ground
            const angle = Math.random() * Math.PI * 2;
            const distance = 15 + Math.random() * 40;
            creature.position.set(
                Math.cos(angle) * distance,
                size,
                Math.sin(angle) * distance
            );
            
            creature.userData = {
                wanderAngle: angle,
                wanderSpeed: 0.5 + Math.random() * 1,
                baseY: size,
                phase: Math.random() * Math.PI * 2
            };
            
            this.lifeObjects.push(creature);
            this.scene.add(creature);
        }
    }
    
    addTrees(count, terrain) {
        const treeColors = {
            earth: [0x228b22, 0x2e8b57, 0x3cb371],
            desert: [0x8b7355, 0xa0522d, 0xdeb887],
            ice: [0x87ceeb, 0xb0c4de, 0xe0ffff],
            volcanic: [0x2f4f4f, 0x4a4a4a, 0x696969],
            crystal: [0x9370db, 0xba55d3, 0xda70d6],
            ocean: [0x20b2aa, 0x008b8b, 0x40e0d0]
        };
        
        const colors = treeColors[terrain] || treeColors.earth;
        
        for (let i = 0; i < count; i++) {
            const tree = new THREE.Group();
            
            // Trunk
            const trunkGeom = new THREE.CylinderGeometry(0.2, 0.3, 2, 8);
            const trunkMat = new THREE.MeshStandardMaterial({
                color: 0x8b4513,
                roughness: 0.9
            });
            const trunk = new THREE.Mesh(trunkGeom, trunkMat);
            trunk.position.y = 1;
            trunk.castShadow = true;
            tree.add(trunk);
            
            // Foliage (multiple cones)
            const foliageColor = colors[Math.floor(Math.random() * colors.length)];
            const foliageMat = new THREE.MeshStandardMaterial({
                color: foliageColor,
                roughness: 0.7
            });
            
            [2.5, 3.2, 3.8].forEach((y, idx) => {
                const size = 1.5 - (idx * 0.3);
                const foliageGeom = new THREE.ConeGeometry(size, 1.5, 8);
                const foliage = new THREE.Mesh(foliageGeom, foliageMat);
                foliage.position.y = y;
                foliage.castShadow = true;
                tree.add(foliage);
            });
            
            // Random position
            const angle = Math.random() * Math.PI * 2;
            const distance = 10 + Math.random() * 60;
            tree.position.set(
                Math.cos(angle) * distance,
                0,
                Math.sin(angle) * distance
            );
            tree.rotation.y = Math.random() * Math.PI * 2;
            tree.scale.setScalar(0.8 + Math.random() * 0.6);
            
            this.lifeObjects.push(tree);
            this.scene.add(tree);
        }
    }
    
    addFlowers(count, terrain) {
        const flowerColors = [0xff69b4, 0xff1493, 0xffd700, 0xff6347, 0x9370db, 0x00ced1];
        
        for (let i = 0; i < count; i++) {
            const flower = new THREE.Group();
            
            // Stem
            const stemGeom = new THREE.CylinderGeometry(0.02, 0.02, 0.3, 8);
            const stemMat = new THREE.MeshStandardMaterial({ color: 0x228b22 });
            const stem = new THREE.Mesh(stemGeom, stemMat);
            stem.position.y = 0.15;
            flower.add(stem);
            
            // Petals
            const petalColor = flowerColors[Math.floor(Math.random() * flowerColors.length)];
            const petalGeom = new THREE.SphereGeometry(0.08, 8, 8);
            const petalMat = new THREE.MeshStandardMaterial({
                color: petalColor,
                emissive: petalColor,
                emissiveIntensity: 0.2
            });
            
            for (let j = 0; j < 5; j++) {
                const petal = new THREE.Mesh(petalGeom, petalMat);
                const angle = (j / 5) * Math.PI * 2;
                petal.position.set(
                    Math.cos(angle) * 0.08,
                    0.35,
                    Math.sin(angle) * 0.08
                );
                flower.add(petal);
            }
            
            // Center
            const centerGeom = new THREE.SphereGeometry(0.05, 8, 8);
            const centerMat = new THREE.MeshStandardMaterial({ color: 0xffd700 });
            const center = new THREE.Mesh(centerGeom, centerMat);
            center.position.y = 0.35;
            flower.add(center);
            
            // Position
            const angle = Math.random() * Math.PI * 2;
            const distance = 3 + Math.random() * 50;
            flower.position.set(
                Math.cos(angle) * distance,
                0,
                Math.sin(angle) * distance
            );
            
            this.lifeObjects.push(flower);
            this.scene.add(flower);
        }
    }
    
    addMushrooms(count, terrain) {
        const mushroomColors = [0xff6b6b, 0xffa07a, 0xdda0dd, 0x98fb98, 0x87cefa];
        
        for (let i = 0; i < count; i++) {
            const mushroom = new THREE.Group();
            
            // Stem
            const stemGeom = new THREE.CylinderGeometry(0.1, 0.15, 0.3, 12);
            const stemMat = new THREE.MeshStandardMaterial({ color: 0xfff8dc });
            const stem = new THREE.Mesh(stemGeom, stemMat);
            stem.position.y = 0.15;
            stem.castShadow = true;
            mushroom.add(stem);
            
            // Cap
            const capColor = mushroomColors[Math.floor(Math.random() * mushroomColors.length)];
            const capGeom = new THREE.SphereGeometry(0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
            const capMat = new THREE.MeshStandardMaterial({
                color: capColor,
                emissive: capColor,
                emissiveIntensity: 0.1
            });
            const cap = new THREE.Mesh(capGeom, capMat);
            cap.position.y = 0.3;
            cap.castShadow = true;
            mushroom.add(cap);
            
            // Position
            const angle = Math.random() * Math.PI * 2;
            const distance = 5 + Math.random() * 40;
            mushroom.position.set(
                Math.cos(angle) * distance,
                0,
                Math.sin(angle) * distance
            );
            mushroom.scale.setScalar(0.8 + Math.random() * 0.8);
            
            this.lifeObjects.push(mushroom);
            this.scene.add(mushroom);
        }
    }
    
    addRocks(count, terrain) {
        const config = this.terrainConfigs[terrain] || this.terrainConfigs.earth;
        const rockColor = new THREE.Color(config.groundColor2).multiplyScalar(0.5);
        
        for (let i = 0; i < count; i++) {
            const rockGeom = new THREE.DodecahedronGeometry(0.3 + Math.random() * 0.5, 0);
            const rockMat = new THREE.MeshStandardMaterial({
                color: rockColor,
                roughness: 0.9,
                flatShading: true
            });
            const rock = new THREE.Mesh(rockGeom, rockMat);
            
            const angle = Math.random() * Math.PI * 2;
            const distance = 5 + Math.random() * 60;
            rock.position.set(
                Math.cos(angle) * distance,
                0.2,
                Math.sin(angle) * distance
            );
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            rock.scale.setScalar(0.5 + Math.random() * 1.5);
            rock.castShadow = true;
            rock.receiveShadow = true;
            
            this.lifeObjects.push(rock);
            this.scene.add(rock);
        }
    }
    
    setupEventListeners() {
        // Window resize
        window.addEventListener('resize', () => this.onResize());
        
        // Keyboard
        window.addEventListener('keydown', (e) => {
            this.keys[e.code] = true;
            if (e.code === 'Space' && this.player.onGround) {
                this.player.velocity.y = this.player.jumpForce;
                this.player.onGround = false;
            }
        });
        window.addEventListener('keyup', (e) => this.keys[e.code] = false);
        
        // Mouse (pointer lock)
        document.addEventListener('click', () => {
            if (!this.isPointerLocked && !this.isMobile()) {
                this.renderer.domElement.requestPointerLock();
            }
        });
        
        document.addEventListener('pointerlockchange', () => {
            this.isPointerLocked = document.pointerLockElement === this.renderer.domElement;
        });
        
        document.addEventListener('mousemove', (e) => {
            if (this.isPointerLocked) {
                this.euler.setFromQuaternion(this.camera.quaternion);
                this.euler.y -= e.movementX * 0.002;
                this.euler.x -= e.movementY * 0.002;
                this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
                this.camera.quaternion.setFromEuler(this.euler);
            }
        });
        
        // Raycasting for creature interaction
        document.addEventListener('click', (e) => this.handleClick(e));
        
        // Mobile joystick
        this.setupMobileControls();
        
        // UI buttons
        document.getElementById('back-btn').addEventListener('click', () => {
            window.history.back();
        });
        
        document.getElementById('music-btn').addEventListener('click', () => {
            this.toggleMusic();
        });
        
        // Creature popup
        document.getElementById('popup-close').addEventListener('click', () => {
            document.getElementById('creature-popup').classList.remove('active');
        });
        
        document.getElementById('popup-pet').addEventListener('click', () => {
            this.vibrate([30, 50, 30, 50, 30]);
            document.getElementById('creature-popup').classList.remove('active');
        });
        
        document.getElementById('popup-feed').addEventListener('click', () => {
            this.vibrate([100]);
            document.getElementById('creature-popup').classList.remove('active');
        });
    }
    
    setupMobileControls() {
        const moveJoystick = document.getElementById('move-joystick');
        const moveKnob = document.getElementById('move-knob');
        const lookArea = document.getElementById('look-area');
        
        // Move joystick
        moveJoystick.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.joystickActive = true;
        });
        
        moveJoystick.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.joystickActive) return;
            
            const touch = e.touches[0];
            const rect = moveJoystick.getBoundingClientRect();
            const centerX = rect.left + rect.width / 2;
            const centerY = rect.top + rect.height / 2;
            
            let dx = touch.clientX - centerX;
            let dy = touch.clientY - centerY;
            
            const maxDist = rect.width / 2 - 25;
            const dist = Math.sqrt(dx * dx + dy * dy);
            
            if (dist > maxDist) {
                dx = (dx / dist) * maxDist;
                dy = (dy / dist) * maxDist;
            }
            
            moveKnob.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
            
            this.joystickVector.x = dx / maxDist;
            this.joystickVector.y = dy / maxDist;
        });
        
        moveJoystick.addEventListener('touchend', () => {
            this.joystickActive = false;
            this.joystickVector = { x: 0, y: 0 };
            moveKnob.style.transform = 'translate(-50%, -50%)';
        });
        
        // Look area
        lookArea.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.lookActive = true;
            this.lastLookPos = {
                x: e.touches[0].clientX,
                y: e.touches[0].clientY
            };
        });
        
        lookArea.addEventListener('touchmove', (e) => {
            e.preventDefault();
            if (!this.lookActive) return;
            
            const touch = e.touches[0];
            const dx = touch.clientX - this.lastLookPos.x;
            const dy = touch.clientY - this.lastLookPos.y;
            
            this.euler.setFromQuaternion(this.camera.quaternion);
            this.euler.y -= dx * 0.005;
            this.euler.x -= dy * 0.005;
            this.euler.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.euler.x));
            this.camera.quaternion.setFromEuler(this.euler);
            
            this.lastLookPos = {
                x: touch.clientX,
                y: touch.clientY
            };
        });
        
        lookArea.addEventListener('touchend', () => {
            this.lookActive = false;
        });
    }
    
    handleClick(e) {
        const raycaster = new THREE.Raycaster();
        const mouse = new THREE.Vector2();
        
        if (this.isPointerLocked) {
            mouse.set(0, 0); // Center of screen
        } else {
            mouse.x = (e.clientX / window.innerWidth) * 2 - 1;
            mouse.y = -(e.clientY / window.innerHeight) * 2 + 1;
        }
        
        raycaster.setFromCamera(mouse, this.camera);
        
        const intersects = raycaster.intersectObjects(
            this.creatureObjects.map(c => c.children[0]), // Body meshes
            false
        );
        
        if (intersects.length > 0) {
            const creatureObj = intersects[0].object.parent;
            const creature = creatureObj.userData.creature;
            
            document.getElementById('popup-creature-name').textContent = creature.name;
            document.getElementById('creature-popup').classList.add('active');
            this.vibrate([30]);
        }
    }
    
    async checkVRSupport() {
        if ('xr' in navigator) {
            try {
                this.xrSupported = await navigator.xr.isSessionSupported('immersive-vr');
                if (this.xrSupported) {
                    document.getElementById('vr-button').classList.add('visible');
                    document.getElementById('vr-button').addEventListener('click', () => {
                        this.enterVR();
                    });
                }
            } catch (e) {
                console.log('WebXR not available');
            }
        }
    }
    
    async enterVR() {
        if (!this.xrSupported) return;
        
        try {
            this.xrSession = await navigator.xr.requestSession('immersive-vr', {
                optionalFeatures: ['local-floor', 'bounded-floor']
            });
            
            this.renderer.xr.setSession(this.xrSession);
            
            this.xrSession.addEventListener('end', () => {
                this.xrSession = null;
            });
        } catch (e) {
            console.error('Failed to start VR session:', e);
        }
    }
    
    setupAudio() {
        // Will initialize on first user interaction
        document.addEventListener('click', () => {
            if (!this.audioContext) {
                this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.value = 0.3;
                this.masterGain.connect(this.audioContext.destination);
            }
        }, { once: true });
    }
    
    toggleMusic() {
        if (!this.audioContext) return;
        
        this.musicPlaying = !this.musicPlaying;
        document.getElementById('music-btn').textContent = this.musicPlaying ? '🔊' : '🔇';
        
        if (this.musicPlaying) {
            this.playAmbient();
        } else {
            this.masterGain.gain.value = 0;
        }
    }
    
    playAmbient() {
        if (!this.audioContext || !this.musicPlaying) return;
        
        this.masterGain.gain.value = 0.3;
        
        // Deep ambient drone
        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();
        
        osc.type = 'sine';
        osc.frequency.setValueAtTime(55, this.audioContext.currentTime);
        gain.gain.setValueAtTime(0.1, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.audioContext.currentTime + 8);
        
        osc.connect(gain).connect(this.masterGain);
        osc.start();
        osc.stop(this.audioContext.currentTime + 8);
        
        setTimeout(() => this.playAmbient(), 6000);
    }
    
    updateUI() {
        document.getElementById('planet-name').textContent = this.planet.name;
        document.getElementById('planet-terrain').textContent = 
            this.planet.terrain.charAt(0).toUpperCase() + this.planet.terrain.slice(1);
    }
    
    isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               window.matchMedia('(pointer: coarse)').matches;
    }
    
    vibrate(pattern) {
        if (navigator.vibrate) {
            navigator.vibrate(pattern);
        }
    }
    
    onResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
    
    updatePlayer(delta) {
        // Get movement direction
        const direction = new THREE.Vector3();
        const forward = new THREE.Vector3();
        const right = new THREE.Vector3();
        
        this.camera.getWorldDirection(forward);
        forward.y = 0;
        forward.normalize();
        
        right.crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize();
        
        // Keyboard input
        if (this.keys['KeyW'] || this.keys['ArrowUp']) direction.add(forward);
        if (this.keys['KeyS'] || this.keys['ArrowDown']) direction.sub(forward);
        if (this.keys['KeyA'] || this.keys['ArrowLeft']) direction.sub(right);
        if (this.keys['KeyD'] || this.keys['ArrowRight']) direction.add(right);
        
        // Mobile joystick input
        if (this.joystickActive) {
            direction.add(forward.clone().multiplyScalar(-this.joystickVector.y));
            direction.add(right.clone().multiplyScalar(this.joystickVector.x));
        }
        
        direction.normalize();
        
        // Apply movement
        const moveSpeed = this.player.speed * delta;
        this.camera.position.x += direction.x * moveSpeed;
        this.camera.position.z += direction.z * moveSpeed;
        
        // Gravity and jump
        this.player.velocity.y -= 20 * delta; // Gravity
        this.camera.position.y += this.player.velocity.y * delta;
        
        // Ground collision
        const groundHeight = this.player.height;
        if (this.camera.position.y < groundHeight) {
            this.camera.position.y = groundHeight;
            this.player.velocity.y = 0;
            this.player.onGround = true;
        }
        
        // Keep within bounds
        const bounds = 90;
        this.camera.position.x = Math.max(-bounds, Math.min(bounds, this.camera.position.x));
        this.camera.position.z = Math.max(-bounds, Math.min(bounds, this.camera.position.z));
    }
    
    updateCreatures(delta, time) {
        this.creatureObjects.forEach((creature) => {
            const data = creature.userData;
            
            // Bobbing animation
            creature.position.y = data.originalY + Math.sin(time * 2 + data.phase) * 0.2;
            
            // Wander movement
            data.wanderAngle += (Math.random() - 0.5) * delta;
            creature.position.x += Math.cos(data.wanderAngle) * data.wanderSpeed * delta;
            creature.position.z += Math.sin(data.wanderAngle) * data.wanderSpeed * delta;
            
            // Keep in bounds
            const wanderBounds = 30;
            if (creature.position.x > wanderBounds) data.wanderAngle = Math.PI;
            if (creature.position.x < -wanderBounds) data.wanderAngle = 0;
            if (creature.position.z > wanderBounds) data.wanderAngle = -Math.PI / 2;
            if (creature.position.z < -wanderBounds) data.wanderAngle = Math.PI / 2;
            
            // Face direction of movement
            creature.rotation.y = data.wanderAngle + Math.PI;
            
            // Look at player when close
            const distToPlayer = creature.position.distanceTo(this.camera.position);
            if (distToPlayer < 5) {
                const lookAt = new THREE.Vector3(
                    this.camera.position.x,
                    creature.position.y,
                    this.camera.position.z
                );
                creature.lookAt(lookAt);
            }
        });
    }
    
    animate() {
        this.renderer.setAnimationLoop((timestamp) => {
            const delta = this.clock.getDelta();
            const time = this.clock.getElapsedTime();
            
            this.updatePlayer(delta);
            this.updateCreatures(delta, time);
            this.updateMoons(delta, time);
            
            // Rotate sky slowly
            if (this.sky) {
                this.sky.rotation.y += delta * 0.01;
            }
            
            this.renderer.render(this.scene, this.camera);
        });
    }
    
    updateMoons(delta, time) {
        if (!this.moons || this.moons.length === 0) return;
        
        this.moons.forEach((moon, index) => {
            const data = moon.userData;
            
            // Orbit around the world
            data.orbitAngle += data.orbitSpeed * delta;
            
            moon.position.x = Math.cos(data.orbitAngle) * data.orbitDistance;
            moon.position.z = Math.sin(data.orbitAngle) * data.orbitDistance;
            
            // Gentle bobbing
            moon.position.y = data.orbitHeight + Math.sin(time * 0.5 + index) * 5;
            
            // Slow rotation
            moon.rotation.y += delta * 0.2;
        });
        
        // Update birds
        this.updateBirds(delta, time);
    }
    
    updateBirds(delta, time) {
        if (!this.birds || this.birds.length === 0) return;
        
        this.birds.forEach((bird) => {
            const data = bird.userData;
            
            // Fly in circles
            data.flyAngle += data.flySpeed * delta * 0.05;
            const distance = 20 + Math.sin(time + data.wingPhase) * 10;
            
            bird.position.x = Math.cos(data.flyAngle) * distance;
            bird.position.z = Math.sin(data.flyAngle) * distance;
            bird.position.y = data.height + Math.sin(time * 2 + data.wingPhase) * 3;
            
            // Face direction of movement
            bird.rotation.y = data.flyAngle + Math.PI / 2;
            
            // Wing flapping
            const wings = bird.getObjectByName('wings');
            if (wings) {
                wings.rotation.z = Math.sin(time * 15 + data.wingPhase) * 0.5;
            }
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.planetExplore = new PlanetExplore();
});

