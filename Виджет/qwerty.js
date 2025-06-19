import * as THREE from 'https://cdn.skypack.dev/three@0.131.1';
import { OrbitControls } from 'https://cdn.skypack.dev/three@0.131.1/examples/jsm/controls/OrbitControls.js';
import { RGBELoader } from 'https://cdn.skypack.dev/three@0.131.1/examples/jsm/loaders/RGBELoader.js';

const hdriURL = 'https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/empty_warehouse_01_1k.hdr';
const heightMapURL = 'https://kvotua.github.io/ponarthFairy/Виджет/oYS135g.jpeg';
const displacementMapURL = 'https://kvotua.github.io/ponarthFairy/Виджет/L1pqRg9.jpeg';

window.createMarbleWidget = function(containerSelector, params = {}) {
    const defaultParams = {
        roughness: 0.1,
        iterations: 48,
        depth: 0.6,
        smoothing: 0.2,
        displacement: 0.1,
        speed: 0.05,
        colorA: '#000000',
        colorB: '#00ffaa'
    };
    params = Object.assign({}, defaultParams, params);

    const container = typeof containerSelector === 'string'
        ? document.querySelector(containerSelector)
        : containerSelector;

    const scene = new THREE.Scene();
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(200, 200);
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.display = 'block';

    if (container) {
        container.appendChild(renderer.domElement);
    } else {
        document.body.appendChild(renderer.domElement);
    }

    const camera = new THREE.PerspectiveCamera(75, 1, 0.1, 1000);
    camera.position.set(0, 0, 2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.autoRotate = true;
    controls.enableZoom = false;

    async function loadTexture(url) {
        const loader = new THREE.TextureLoader();
        return new Promise(resolve => {
            loader.load(url, texture => resolve(texture));
        });
    }

    async function loadHDRI(url, renderer) {
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

    async function init() {
        const geometry = new THREE.SphereGeometry(1, 64, 32);
        const material = new THREE.MeshStandardMaterial({ roughness: params.roughness });

        const heightMap = await loadTexture(heightMapURL);
        const displacementMap = await loadTexture(displacementMapURL);
        displacementMap.wrapS = displacementMap.wrapT = THREE.RepeatWrapping;
        heightMap.minFilter = displacementMap.minFilter = THREE.NearestFilter;

        const uniforms = {
            iterations: { value: params.iterations },
            depth: { value: params.depth },
            smoothing: { value: params.smoothing },
            colorA: { value: new THREE.Color(params.colorA) },
            colorB: { value: new THREE.Color(params.colorB) },
            heightMap: { value: heightMap },
            displacementMap: { value: displacementMap },
            displacement: { value: params.displacement },
            time: { value: 0 }
        };

        material.onBeforeCompile = shader => {
            shader.uniforms = { ...shader.uniforms, ...uniforms };
            shader.vertexShader = `
                varying vec3 v_pos;
                varying vec3 v_dir;
            ` + shader.vertexShader;
            shader.vertexShader = shader.vertexShader.replace(/void main\(\) {/, (match) => match + `
                v_dir = position - cameraPosition;
                v_pos = position;
            `);
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
            shader.fragmentShader = shader.fragmentShader.replace(/void main\(\) {/, (match) => `
                vec3 displacePoint(vec3 p, float strength) {
                    vec2 uv = equirectUv(normalize(p));
                    vec2 scroll = vec2(time, 0.);
                    vec3 displacementA = texture(displacementMap, uv + scroll).rgb;
                    vec3 displacementB = texture(displacementMap, uv * FLIP - scroll).rgb;
                    displacementA -= 0.5;
                    displacementB -= 0.5;
                    return p + strength * (displacementA + displacementB);
                }
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

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const envMap = await loadHDRI(hdriURL, renderer);
        scene.environment = envMap;

        const clock = new THREE.Clock();
        function animate() {
            requestAnimationFrame(animate);
            controls.update();
            uniforms.time.value += clock.getDelta() * params.speed;
            renderer.render(scene, camera);
        }
        animate();
    }

    init();
};
