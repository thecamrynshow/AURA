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
                lifeforms: ['trees', 'flowers'],
                suns: 1,
                moons: 1
            };
        }
        
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
        
        // Ambient light
        const ambient = new THREE.AmbientLight(0xffffff, 0.4);
        this.scene.add(ambient);
        
        // Sun (directional light)
        this.sun = new THREE.DirectionalLight(config.sunColor, 1);
        this.sun.position.set(50, 100, 50);
        this.sun.castShadow = true;
        this.sun.shadow.mapSize.width = 2048;
        this.sun.shadow.mapSize.height = 2048;
        this.sun.shadow.camera.near = 0.5;
        this.sun.shadow.camera.far = 500;
        this.sun.shadow.camera.left = -100;
        this.sun.shadow.camera.right = 100;
        this.sun.shadow.camera.top = 100;
        this.sun.shadow.camera.bottom = -100;
        this.scene.add(this.sun);
        
        // Hemisphere light for sky/ground color
        const hemi = new THREE.HemisphereLight(config.skyTop, config.groundColor, 0.6);
        this.scene.add(hemi);
        
        // Sun visual (sphere in sky)
        const sunGeom = new THREE.SphereGeometry(5, 32, 32);
        const sunMat = new THREE.MeshBasicMaterial({
            color: config.sunColor,
            emissive: config.sunColor,
            emissiveIntensity: 1
        });
        const sunMesh = new THREE.Mesh(sunGeom, sunMat);
        sunMesh.position.set(80, 100, 80);
        this.scene.add(sunMesh);
        
        // Add glow to sun
        const sunGlow = new THREE.PointLight(config.sunColor, 2, 200);
        sunGlow.position.copy(sunMesh.position);
        this.scene.add(sunGlow);
    }
    
    setupSky() {
        const config = this.terrainConfigs[this.planet.terrain] || this.terrainConfigs.earth;
        
        // Sky dome
        const skyGeom = new THREE.SphereGeometry(400, 32, 32);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: {
                topColor: { value: new THREE.Color(config.skyTop) },
                bottomColor: { value: new THREE.Color(config.skyBottom) },
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
        
        // Rocks (always add some)
        this.addRocks(30, terrain);
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
            
            // Rotate sky slowly
            if (this.sky) {
                this.sky.rotation.y += delta * 0.01;
            }
            
            this.renderer.render(this.scene, this.camera);
        });
    }
}

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    window.planetExplore = new PlanetExplore();
});

