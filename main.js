import * as THREE from "three";

import {
    RollerCoasterGeometry,
    RollerCoasterShadowGeometry,
    RollerCoasterLiftersGeometry,
    TreesGeometry,
    SkyGeometry
} from "three/addons/misc/RollerCoaster.js";
import {
    VRButton
} from "three/addons/webxr/VRButton.js";

let renderer, scene, camera;
let train, curve;
const funfairs = [];


/*
const PI2 = Math.PI * 2;
const curve = (function() {

    const vector = new THREE.Vector3();
    const vector2 = new THREE.Vector3();

    return {

        getPointAt: function(t) {

            t = t * PI2;

            const x = Math.sin(t * 3) * Math.cos(t * 4) * 50;
            const y = Math.sin(t * 10) * 2 + Math.cos(t * 17) * 2 + 5;
            const z = Math.sin(t) * Math.sin(t * 4) * 50;

            return vector.set(x, y, z).multiplyScalar(2);

        },

        getTangentAt: function(t) {

            const delta = 0.0001;
            const t1 = Math.max(0, t - delta);
            const t2 = Math.min(1, t + delta);

            return vector2.copy(this.getPointAt(t2))
                .sub(this.getPointAt(t1)).normalize();

        }

    };

})();
*/

function initScene(positions) {

    let mesh, material, geometry;

    renderer = new THREE.WebGLRenderer({
        antialias: true,
    });

    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.xr.enabled = true;
    renderer.xr.setReferenceSpaceType("local");

    const container = document.getElementById("app");
    container.appendChild(renderer.domElement);
    container.appendChild(VRButton.createButton(renderer));

    //

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f0ff);

    const light = new THREE.HemisphereLight(0xfff0f0, 0x60606, 3);
    light.position.set(1, 1, 1);
    scene.add(light);

    train = new THREE.Object3D();
    scene.add(train);

    camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 500);
    train.add(camera);

    // environment

    geometry = new THREE.PlaneGeometry(500, 500, 15, 15);
    geometry.rotateX(-Math.PI / 2);

    const treePositions = geometry.attributes.position.array;
    const vertex = new THREE.Vector3();

    for (let i = 0; i < treePositions.length; i += 3) {

        vertex.fromArray(treePositions, i);

        vertex.x += Math.random() * 10 - 5;
        vertex.z += Math.random() * 10 - 5;

        const distance = (vertex.distanceTo(scene.position) / 5) - 25;
        vertex.y = Math.random() * Math.max(0, distance);

        vertex.toArray(treePositions, i);

    }

    geometry.computeVertexNormals();

    material = new THREE.MeshLambertMaterial({
        color: 0x407000
    });

    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    geometry = new TreesGeometry(mesh);
    material = new THREE.MeshBasicMaterial({
        side: THREE.DoubleSide,
        vertexColors: true
    });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    geometry = new SkyGeometry();
    material = new THREE.MeshBasicMaterial({
        color: 0xffffff
    });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    curve = new THREE.CatmullRomCurve3(
        positions
    );

    geometry = new RollerCoasterGeometry(curve, 20000);
    material = new THREE.MeshPhongMaterial({
        vertexColors: true
    });
    mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    geometry = new RollerCoasterLiftersGeometry(curve, 800);
    material = new THREE.MeshPhongMaterial();
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.1;
    scene.add(mesh);

    geometry = new RollerCoasterShadowGeometry(curve, 4000);
    material = new THREE.MeshBasicMaterial({
        color: 0x305000,
        depthWrite: false,
        transparent: true
    });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.y = 0.1;
    scene.add(mesh);


    //

    geometry = new THREE.CylinderGeometry(10, 10, 5, 15);
    material = new THREE.MeshLambertMaterial({
        color: 0xff8080
    });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(-80, 10, -70);
    mesh.rotation.x = Math.PI / 2;
    scene.add(mesh);

    funfairs.push(mesh);

    geometry = new THREE.CylinderGeometry(5, 6, 4, 10);
    material = new THREE.MeshLambertMaterial({
        color: 0x8080ff
    });
    mesh = new THREE.Mesh(geometry, material);
    mesh.position.set(50, 2, 30);
    scene.add(mesh);

    funfairs.push(mesh);

    //

    window.addEventListener("resize", onWindowResize);

    function onWindowResize() {

        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();

        renderer.setSize(window.innerWidth, window.innerHeight);

    }

    //

}

const position = new THREE.Vector3();
const tangent = new THREE.Vector3();

const lookAt = new THREE.Vector3();

let velocity = 0;
let progress = 0;

let prevTime = performance.now();

function render() {

    const time = performance.now();
    const delta = time - prevTime;

    for (let i = 0; i < funfairs.length; i++) {

        funfairs[i].rotation.y = time * 0.0004;

    }

    //

    progress += velocity;
    progress = progress % 1;

    position.copy(curve.getPointAt(progress));
    position.y += 0.3;

    train.position.copy(position);

    tangent.copy(curve.getTangentAt(progress));

    velocity -= tangent.y * 0.000000010 * delta;
    velocity = Math.max(0.0000030, Math.min(0.000020, velocity));

    train.lookAt(lookAt.copy(position).sub(tangent));

    //

    renderer.render(scene, camera);

    prevTime = time;

}

const fileInput = document.getElementById("fileInput");
fileInput.addEventListener("change", () => {
    let confFile, topFile;
    for (const file of fileInput.files) {
        for (const suffix of [".dat", ".conf", ".oxdna"]) {
            if (file.name.includes(suffix)) {
                confFile = file;
                break;
            }
        }
        if (file.name.includes(".top")) {
            topFile = file;
        }
    }

    parseFiles(confFile, topFile).then(strands => {
        const longestStrand = [...strands.values()].sort(
            (a,b)=>b.length - a.length
        )[0];
        const positions = longestStrand.map(e=>e.position).reverse();

        // Place lowest point 10 m above ground
        const lowestHeight = Math.min(...positions.map(p=>p.y));
        positions.forEach(p => {
            p.y -= lowestHeight - 10;
        });

        initScene(positions);
        renderer.setAnimationLoop(render);
        document.getElementById("inputContainer").style.display = "none";
    });

});

async function parseFiles(confFile, topFile) {
    const topText = await topFile.text();
    const confText = await confFile.text();

    const topLines = topText.split("\n").slice(1);
    const confLines = confText.split("\n").slice(3);

    console.assert(topLines.length <= confLines.length);

    const strands = new Map();

    for (let i=0; i<topLines.length; i++) {
        const [sidStr, base, n3, n5] = topLines[i].split(" ");
        const sid = parseInt(sidStr);
        const [
            xPos, yPos, zPos,
            xDir, yDir, zDir,
            xNor, yNor, zNor
        ] = confLines[i].split(" ").map(v=>parseFloat(v));

        if (!strands.has(sid)) {
            strands.set(sid, []);
        }
        strands.get(sid).push({
            id: i,
            base: base,
            n5_id: parseInt(n5),
            n3_id: parseInt(n3),
            position: new THREE.Vector3(xPos, yPos, zPos),
            a1: new THREE.Vector3(xDir, yDir, zDir),
            a3: new THREE.Vector3(xNor, yNor, zNor),
        });
    }
    return strands;
}
