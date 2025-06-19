import * as THREE from '//cdn.skypack.dev/three@0.131.1';
import { GUI } from '//cdn.skypack.dev/three@0.131.1/examples/jsm/libs/dat.gui.module.js';
import { OrbitControls } from '//cdn.skypack.dev/three@0.131.1/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from '//cdn.skypack.dev/three@0.131.1/examples/jsm/loaders/RGBELoader.js';

const hdriURL = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/empty_warehouse_01_1k.hdr';
const heightMapURL = './oYS135g.jpeg';
const displacementMapURL = './L1pqRg9.jpeg';

createApp({
    params: {
        roughness: 0.1,
        iterations: 48,
        depth: 0.6,
        smoothing: 0.2,
        displacement: 0.1,
        speed: 0.05,
        colorA: '#000000',
        colorB: '#00ffaa'
    },
    async init() {
        const geometry = new THREE.SphereGeometry(1, 64, 32);
        const material = new THREE.MeshStandardMaterial({ roughness: this.params.roughness });

        // Load heightmap and displacement textures
        const heightMap = await this.loadTexture(heightMapURL);
        const displacementMap = await this.loadTexture(displacementMapURL);
        displacementMap.wrapS = displacementMap.wrapT = THREE.RepeatWrapping;

        // Prevent seam introduced by THREE.LinearFilter
        heightMap.minFilter = displacementMap.minFilter = THREE.NearestFilter;

        // Set up local uniforms object
        this.uniforms = {
            iterations: { value: this.params.iterations },
            depth: { value: this.params.depth },
            smoothing: { value: this.params.smoothing },
            colorA: { value: new THREE.Color(this.params.colorA) },
            colorB: { value: new THREE.Color(this.params.colorB) },
            heightMap: { value: heightMap },
            displacementMap: { value: displacementMap },
            displacement: { value: this.params.displacement },
            time: { value: 0 }
        };

        material.onBeforeCompile = shader => {
            // Wire up local uniform references
            shader.uniforms = { ...shader.uniforms, ...this.uniforms };

            // Add to top of vertex shader
            shader.vertexShader = `
                varying vec3 v_pos;
                varying vec3 v_dir;
            ` + shader.vertexShader;

            // Assign values to varyings inside of main()
            shader.vertexShader = shader.vertexShader.replace(/void main\(\) {/, (match) => match + `
                v_dir = position - cameraPosition; // Points from camera to vertex
                v_pos = position;
            `);

            // Add to top of fragment shader
            shader.fragmentShader = `
                #define FLIP vec2(1., -1.)
                
                uniform vec3 colorA;
                uniform vec3 colorB;
                uniform sampler2D heightMap;
                uniform sampler2D displacementMap;
                uniform int iterations;
                uniform float depth;
                uniform float smoothing;
                uniform float displacement;
                uniform float time;
                
                varying vec3 v_pos;
                varying vec3 v_dir;
            ` + shader.fragmentShader;

            // Add above fragment shader main()
            shader.fragmentShader = shader.fragmentShader.replace(/void main\(\) {/, (match) => `
                /**
                 * @param p - Point to displace
                 * @param strength - How much the map can displace the point
                 * @returns Point with scrolling displacement applied
                 */
                vec3 displacePoint(vec3 p, float strength) {
                    vec2 uv = equirectUv(normalize(p));
                    vec2 scroll = vec2(time, 0.);
                    vec3 displacementA = texture(displacementMap, uv + scroll).rgb; // Upright
                    vec3 displacementB = texture(displacementMap, uv * FLIP - scroll).rgb; // Upside down
                    
                    // Center the range to [-0.5, 0.5]
                    displacementA -= 0.5;
                    displacementB -= 0.5;
                    
                    return p + strength * (displacementA + displacementB);
                }
                
                /**
                 * @param rayOrigin - Point on sphere
                 * @param rayDir - Normalized ray direction
                 * @returns Diffuse RGB color
                 */
                vec3 marchMarble(vec3 rayOrigin, vec3 rayDir) {
                    float perIteration = 1. / float(iterations);
                    vec3 deltaRay = rayDir * perIteration * depth;
                    vec3 p = rayOrigin;
                    float totalVolume = 0.;
                    
                    for (int i=0; i<iterations; ++i) {
                        vec3 displaced = displacePoint(p, displacement);
                        vec2 uv = equirectUv(normalize(displaced));
                        float heightMapVal = texture(heightMap, uv).r;
                        float height = length(p);
                        float cutoff = 1. - float(i) * perIteration;
                        float slice = smoothstep(cutoff, cutoff + smoothing, heightMapVal);
                        totalVolume += slice * perIteration;
                        p += deltaRay;
                    }
                    return mix(colorA, colorB, totalVolume);
                }
            ` + match);

            shader.fragmentShader = shader.fragmentShader.replace(/vec4 diffuseColor.*;/, `
                vec3 rayDir = normalize(v_dir);
                vec3 rayOrigin = v_pos;
                
                vec3 rgb = marchMarble(rayOrigin, rayDir);
                vec4 diffuseColor = vec4(rgb, 1.);      
            `);
        };

        this.mesh = new THREE.Mesh(geometry, material);
        this.scene.add(this.mesh);

        // GUI (можно отключить для финальной версии)
       

        await this.setupEnvironment();
        this.setupOrbitControls();
    },
    tick(time, delta) {
        this.controls.update();
        this.uniforms.time.value += delta * this.params.speed;
    },
    setupOrbitControls() {
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.autoRotate = true;
        this.controls.enableZoom = false; // Отключаем зум для виджета
    },
    async setupEnvironment() {
        const envMap = await loadHDRI(hdriURL, this.renderer);
        this.scene.environment = envMap;
    },
    async loadTexture(url) {
        this.textureLoader = this.textureLoader || new THREE.TextureLoader();
        return new Promise(resolve => {
            this.textureLoader.load(url, texture => {
                resolve(texture);
            });
        });
    }
});

function createApp(app) {
    const scene = new THREE.Scene();
    const renderer = createRenderer();
    const camera = createCamera();
    
    // Настройки рендерера
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';
    // renderer.domElement.style.pointerEvents = 'none'; // УБРАТЬ или закомментировать!
    
    // Добавляем canvas внутрь ссылки
    const widgetLink = document.querySelector('.widget-link');
    if (widgetLink) {
        widgetLink.appendChild(renderer.domElement);
    } else {
        document.body.appendChild(renderer.domElement);
    }

    const clock = new THREE.Clock();
    const loop = () => {
        requestAnimationFrame(loop);
        const delta = clock.getDelta();
        app.tick(clock.elapsedTime, delta);
        renderer.render(scene, camera);
    };
    
    Object.assign(app, { scene, camera, renderer, clock });
    app.init().then(loop);
}


function createRenderer() {
    const renderer = new THREE.WebGLRenderer({ 
        antialias: true, 
        alpha: true 
    });
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.setSize(200, 200);
    return renderer;
}

function createCamera() {
    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 2);
    return camera;
}

function loadHDRI(url, renderer) {
    return new Promise(resolve => {
        const loader = new RGBELoader();
        const pmremGenerator = new THREE.PMREMGenerator(renderer);
        loader.load(url, (texture) => {
            const envMap = pmremGenerator.fromEquirectangular(texture).texture;
            texture.dispose();
            pmremGenerator.dispose();
            resolve(envMap);
        });
    });
}
