/* NESTORA - THREE.JS HOUSE MODEL */

(function () {
    "use strict";

    const mount = document.getElementById("house-3d-stage");
    if (!mount) return;

    const stageGroups = {};
    const groupSettings = [
        ["siteGroup", 1, 0],
        ["clearingGroup", 2, 0],
        ["markingGroup", 3, 0],
        ["excavationGroup", 4, 0],
        ["foundationGroup", 5, 0.4],
        ["plinthGroup", 6, 0.4],
        ["groundStructureGroup", 7, 1],
        ["columnBeamGroup", 8, 2],
        ["upperStructureGroup", 9, 3.2],
        ["roofGroup", 10, 5.8],
        ["wallGroup", 11, 2.8],
        ["servicesGroup", 12, 2.3],
        ["openingsGroup", 13, 2.8],
        ["plasterGroup", 14, 2.8],
        ["flooringGroup", 15, 0.2],
        ["paintingGroup", 16, 2.8],
        ["interiorGroup", 17, 1.4],
        ["exteriorGroup", 18, 2.8],
        ["landscapingGroup", 19, 0.2],
        ["finalDetailsGroup", 20, 0.2]
    ];

    let renderer;
    let scene;
    let camera;
    let modelRoot;
    let currentStage = 1;
    let rotationPaused = false;
    let pageVisible = !document.hidden;
    let stageVisible = true;
    let animationFrame = 0;
    let lastFrameTime = 0;
    let dragStart = null;
    let userRotating = false;
    let cameraTarget;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const geometryCache = new Map();
    const materials = {};

    function showFallback(message) {
        const canvas = mount.querySelector("canvas");
        if (canvas) canvas.remove();
        const fallback = document.createElement("p");
        fallback.className = "house-stage-fallback";
        fallback.setAttribute("role", "status");
        fallback.textContent = message;
        mount.appendChild(fallback);
        console.error("NESTORA 3D model:", message);
    }

    if (!window.THREE) {
        showFallback("The 3D library could not be loaded. Confirm libs/three.min.js is present beside index.html.");
        return;
    }

    const canvas = mount.querySelector(".house-3d-canvas");
    if (!canvas) {
        showFallback("The 3D canvas is missing from this page.");
        return;
    }
    cameraTarget = new THREE.Vector3(0, 2.45, 0);

    function createMaterial(name, color, options) {
        materials[name] = new THREE.MeshStandardMaterial(Object.assign({
            color: color,
            roughness: 0.82
        }, options || {}));
        return materials[name];
    }

    function setupMaterials() {
        createMaterial("site", 0x625f56, { roughness: 1 });
        createMaterial("soil", 0x594a3b, { roughness: 1 });
        createMaterial("gravel", 0x817b70, { roughness: 1 });
        createMaterial("concrete", 0x99968d, { roughness: 0.9 });
        createMaterial("foundation", 0x858780, { roughness: 1 });
        createMaterial("roughWall", 0xa89b87, { roughness: 0.94 });
        createMaterial("ivory", 0xded7ca, { roughness: 0.8 });
        createMaterial("accent", 0xbbaa8b, { roughness: 0.78 });
        createMaterial("dark", 0x292d2d, { metalness: 0.4, roughness: 0.5 });
        createMaterial("glass", 0x8eaaa9, {
            metalness: 0.38,
            roughness: 0.2,
            transparent: true,
            opacity: 0.62
        });
        createMaterial("timber", 0x80563c, { roughness: 0.75 });
        createMaterial("gold", 0xb89a63, { metalness: 0.65, roughness: 0.38 });
        createMaterial("green", 0x65745b, { roughness: 1 });
        createMaterial("leaf", 0x718264, { roughness: 1 });
        createMaterial("leafLight", 0x8b9675, { roughness: 1 });
        createMaterial("marking", 0xc7ab69, { roughness: 1 });
        createMaterial("pipeBlue", 0x718e99, { roughness: 0.65 });
        createMaterial("pipeTerracotta", 0xa66c52, { roughness: 0.75 });
        createMaterial("white", 0xf0ece4, { roughness: 0.8 });
        createMaterial("sofa", 0x9a8b76, { roughness: 1 });
        createMaterial("fabric", 0xc4b49a, { roughness: 1 });
    }

    function makeGroup(name) {
        const group = new THREE.Group();
        group.name = name;
        group.visible = false;
        stageGroups[name] = group;
        modelRoot.add(group);
        return group;
    }

    function box(parent, name, x, y, z, width, height, depth, material) {
        const key = [width, height, depth].join(":");
        let geometry = geometryCache.get(key);
        if (!geometry) {
            geometry = new THREE.BoxGeometry(width, height, depth);
            geometryCache.set(key, geometry);
        }
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = name;
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
    }

    function cylinder(parent, name, x, y, z, radiusTop, radiusBottom, height, material, segments) {
        const geometry = new THREE.CylinderGeometry(radiusTop, radiusBottom, height, segments || 8);
        const mesh = new THREE.Mesh(geometry, material);
        mesh.name = name;
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        parent.add(mesh);
        return mesh;
    }

    function sphere(parent, name, x, y, z, radius, material) {
        const mesh = new THREE.Mesh(new THREE.IcosahedronGeometry(radius, 1), material);
        mesh.name = name;
        mesh.position.set(x, y, z);
        mesh.castShadow = true;
        parent.add(mesh);
        return mesh;
    }

    function addTree(parent, x, z, scale) {
        cylinder(parent, "tree-trunk", x, 0.72 * scale, z, 0.11 * scale, 0.16 * scale, 1.45 * scale, materials.timber, 7);
        sphere(parent, "tree-canopy", x, 1.72 * scale, z, 0.78 * scale, materials.leaf);
        sphere(parent, "tree-canopy-light", x - 0.27 * scale, 1.92 * scale, z + 0.08 * scale, 0.48 * scale, materials.leafLight);
    }

    function addWindow(parent, centerX, centerY, centerZ, width, height, facing) {
        const frame = 0.075;
        if (facing === "front") {
            box(parent, "window-glazing", centerX, centerY, centerZ, width - frame * 2, height - frame * 2, 0.045, materials.glass);
            box(parent, "window-frame-top", centerX, centerY + height / 2, centerZ, width, frame, 0.11, materials.dark);
            box(parent, "window-frame-bottom", centerX, centerY - height / 2, centerZ, width, frame, 0.11, materials.dark);
            box(parent, "window-frame-left", centerX - width / 2, centerY, centerZ, frame, height, 0.11, materials.dark);
            box(parent, "window-frame-right", centerX + width / 2, centerY, centerZ, frame, height, 0.11, materials.dark);
            box(parent, "window-mullion", centerX, centerY, centerZ - 0.01, frame * 0.55, height - frame, 0.12, materials.dark);
        } else {
            box(parent, "side-window-glazing", centerX, centerY, centerZ, 0.045, height - frame * 2, width - frame * 2, materials.glass);
            box(parent, "side-window-top", centerX, centerY + height / 2, centerZ, 0.11, frame, width, materials.dark);
            box(parent, "side-window-bottom", centerX, centerY - height / 2, centerZ, 0.11, frame, width, materials.dark);
            box(parent, "side-window-left", centerX, centerY, centerZ - width / 2, 0.11, height, frame, materials.dark);
            box(parent, "side-window-right", centerX, centerY, centerZ + width / 2, 0.11, height, frame, materials.dark);
            box(parent, "side-window-mullion", centerX - 0.01, centerY, centerZ, 0.12, height - frame, frame * 0.55, materials.dark);
        }
    }

    function addFacade(parent, material) {
        const zFront = 2.35;
        const wallDepth = 0.19;

        // Front wall panels frame a generous entry and two bands of glazing.
        box(parent, "ground-front-left", -2.72, 1.61, zFront, 0.96, 2.52, wallDepth, material);
        box(parent, "ground-front-entry-pier", -0.75, 1.61, zFront, 1.95, 2.52, wallDepth, material);
        box(parent, "ground-front-window-pier", 0.27, 1.61, zFront, 0.12, 2.52, wallDepth, material);
        box(parent, "ground-front-right", 2.88, 1.61, zFront, 0.52, 2.52, wallDepth, material);
        box(parent, "ground-window-sill", 1.57, 0.93, zFront, 2.5, 0.18, wallDepth, material);
        box(parent, "ground-window-header", 1.57, 2.49, zFront, 2.5, 0.34, wallDepth, material);

        box(parent, "upper-front-left", -2.73, 4.56, zFront, 0.94, 2.25, wallDepth, material);
        box(parent, "upper-front-right", 2.9, 4.56, zFront, 0.48, 2.25, wallDepth, material);
        box(parent, "upper-window-left", -0.85, 4.56, zFront, 1.45, 2.25, wallDepth, material);
        box(parent, "upper-window-right", 2.09, 4.56, zFront, 1.37, 2.25, wallDepth, material);
        box(parent, "upper-window-sill", 0.65, 3.88, zFront, 1.55, 0.18, wallDepth, material);
        box(parent, "upper-window-header", 0.65, 5.45, zFront, 1.55, 0.47, wallDepth, material);

        // The rear and side elevations remain simple, with a large side opening.
        box(parent, "rear-ground-wall", 0, 1.61, -2.35, 6.4, 2.52, wallDepth, material);
        box(parent, "rear-upper-wall", 0, 4.56, -2.35, 6.4, 2.25, wallDepth, material);
        box(parent, "left-ground-wall", -3.2, 1.61, 0, wallDepth, 2.52, 4.7, material);
        box(parent, "left-upper-wall", -3.2, 4.56, 0, wallDepth, 2.25, 4.7, material);
        box(parent, "right-ground-front", 3.2, 1.61, 1.52, wallDepth, 2.52, 1.66, material);
        box(parent, "right-ground-rear", 3.2, 1.61, -1.72, wallDepth, 2.52, 1.26, material);
        box(parent, "right-ground-window-sill", 3.2, 0.91, -0.13, wallDepth, 0.16, 1.92, material);
        box(parent, "right-ground-window-header", 3.2, 2.48, -0.13, wallDepth, 0.34, 1.92, material);
        box(parent, "right-upper-wall", 3.2, 4.56, 0, wallDepth, 2.25, 4.7, material);
        box(parent, "interior-partition-ground", 0.05, 1.53, -0.62, 0.14, 2.2, 2.65, material);
        box(parent, "interior-partition-upper", -1.05, 4.5, -0.7, 0.14, 2.05, 2.6, material);
    }

    function buildScene() {
        modelRoot = new THREE.Group();
        modelRoot.name = "NESTORA contemporary villa";
        scene.add(modelRoot);
        groupSettings.forEach(([name]) => makeGroup(name));

        const site = stageGroups.siteGroup;
        box(site, "prepared-site", 0, -0.18, 0, 15, 0.22, 12, materials.site);
        box(site, "site-boundary-front", 0, -0.02, 5.65, 14.5, 0.16, 0.12, materials.concrete);
        box(site, "site-boundary-back", 0, -0.02, -5.65, 14.5, 0.16, 0.12, materials.concrete);
        box(site, "site-boundary-left", -7.2, -0.02, 0, 0.12, 0.16, 11.3, materials.concrete);
        box(site, "site-boundary-right", 7.2, -0.02, 0, 0.12, 0.16, 11.3, materials.concrete);
        const earlyGrowth = new THREE.Group();
        earlyGrowth.name = "initial-site-growth";
        site.add(earlyGrowth);
        [-5.4, -4.7, 4.8, 5.6].forEach((x, index) => {
            sphere(earlyGrowth, "site-scrub", x, 0.05, index % 2 ? -3.5 : 3.7, 0.34, materials.leaf);
        });

        const cleared = stageGroups.clearingGroup;
        box(cleared, "cleared-building-area", 0, -0.045, 0, 8.2, 0.05, 6.8, materials.gravel);
        box(cleared, "access-path", 0, -0.02, 4.2, 2.1, 0.08, 2.6, materials.concrete);

        const marking = stageGroups.markingGroup;
        const markY = 0.005;
        const footprintX = 3.25;
        const footprintZ = 2.45;
        box(marking, "mark-front", 0, markY, footprintZ, 6.5, 0.035, 0.035, materials.marking);
        box(marking, "mark-back", 0, markY, -footprintZ, 6.5, 0.035, 0.035, materials.marking);
        box(marking, "mark-left", -footprintX, markY, 0, 0.035, 0.035, 4.9, materials.marking);
        box(marking, "mark-right", footprintX, markY, 0, 0.035, 0.035, 4.9, materials.marking);
        [-2.7, 0, 2.7].forEach((x) => {
            box(marking, "layout-string", x, 0.035, 0, 0.025, 0.025, 5.05, materials.marking);
        });

        const excavation = stageGroups.excavationGroup;
        const trenchY = -0.055;
        box(excavation, "foundation-trench-front", 0, trenchY, 2.05, 6.15, 0.16, 0.58, materials.soil);
        box(excavation, "foundation-trench-back", 0, trenchY, -2.05, 6.15, 0.16, 0.58, materials.soil);
        box(excavation, "foundation-trench-left", -2.82, trenchY, 0, 0.58, 0.16, 3.65, materials.soil);
        box(excavation, "foundation-trench-right", 2.82, trenchY, 0, 0.58, 0.16, 3.65, materials.soil);

        const foundation = stageGroups.foundationGroup;
        box(foundation, "foundation-footing-front", 0, 0.04, 2.08, 6.5, 0.28, 0.62, materials.foundation);
        box(foundation, "foundation-footing-back", 0, 0.04, -2.08, 6.5, 0.28, 0.62, materials.foundation);
        box(foundation, "foundation-footing-left", -2.95, 0.04, 0, 0.62, 0.28, 3.55, materials.foundation);
        box(foundation, "foundation-footing-right", 2.95, 0.04, 0, 0.62, 0.28, 3.55, materials.foundation);
        [-2.65, 0, 2.65].forEach((x) => {
            [-1.9, 1.9].forEach((z) => box(foundation, "column-pad", x, 0.03, z, 0.72, 0.25, 0.72, materials.concrete));
        });

        const plinth = stageGroups.plinthGroup;
        box(plinth, "raised-plinth", 0, 0.3, 0, 6.4, 0.34, 4.7, materials.concrete);
        box(plinth, "damp-proof-course", 0, 0.49, 0, 6.35, 0.07, 4.65, materials.dark);

        const groundStructure = stageGroups.groundStructureGroup;
        box(groundStructure, "ground-floor-slab", 0, 0.63, 0, 6.45, 0.22, 4.75, materials.concrete);
        box(groundStructure, "entry-landing", 0, 0.5, 3.12, 3.1, 0.17, 1.15, materials.concrete);

        const frame = stageGroups.columnBeamGroup;
        [-2.95, 0, 2.95].forEach((x) => {
            [-2.1, 2.1].forEach((z) => {
                box(frame, "ground-storey-column", x, 1.94, z, 0.25, 2.55, 0.25, materials.concrete);
            });
        });
        box(frame, "ground-front-beam", 0, 3.04, 2.15, 6.35, 0.22, 0.24, materials.concrete);
        box(frame, "ground-rear-beam", 0, 3.04, -2.15, 6.35, 0.22, 0.24, materials.concrete);
        box(frame, "ground-left-beam", -3.05, 3.04, 0, 0.24, 0.22, 4.5, materials.concrete);
        box(frame, "ground-right-beam", 3.05, 3.04, 0, 0.24, 0.22, 4.5, materials.concrete);

        const upper = stageGroups.upperStructureGroup;
        [-2.95, 0, 2.95].forEach((x) => {
            [-2.1, 2.1].forEach((z) => {
                box(upper, "upper-storey-column", x, 4.53, z, 0.25, 2.45, 0.25, materials.concrete);
            });
        });
        box(upper, "upper-floor-slab", 0, 3.2, 0, 6.55, 0.2, 4.9, materials.concrete);
        box(upper, "balcony-structural-slab", 0.95, 3.19, 2.9, 4.45, 0.2, 1.35, materials.concrete);
        box(upper, "upper-front-beam", 0, 5.76, 2.15, 6.35, 0.22, 0.24, materials.concrete);
        box(upper, "upper-rear-beam", 0, 5.76, -2.15, 6.35, 0.22, 0.24, materials.concrete);
        box(upper, "upper-left-beam", -3.05, 5.76, 0, 0.24, 0.22, 4.5, materials.concrete);
        box(upper, "upper-right-beam", 3.05, 5.76, 0, 0.24, 0.22, 4.5, materials.concrete);

        const roof = stageGroups.roofGroup;
        box(roof, "flat-roof-slab", 0, 5.98, 0, 6.75, 0.28, 5.1, materials.concrete);
        box(roof, "roof-parapet-front", 0, 6.2, 2.4, 6.75, 0.2, 0.14, materials.ivory);
        box(roof, "roof-parapet-back", 0, 6.2, -2.4, 6.75, 0.2, 0.14, materials.ivory);
        box(roof, "roof-parapet-left", -3.3, 6.2, 0, 0.14, 0.2, 4.8, materials.ivory);
        box(roof, "roof-parapet-right", 3.3, 6.2, 0, 0.14, 0.2, 4.8, materials.ivory);

        addFacade(stageGroups.wallGroup, materials.roughWall);
        addFacade(stageGroups.plasterGroup, materials.ivory);

        const services = stageGroups.servicesGroup;
        box(services, "electrical-riser", -2.7, 1.72, 2.22, 0.055, 2.3, 0.06, materials.pipeTerracotta);
        box(services, "electrical-run", -1.4, 2.42, 2.22, 2.55, 0.055, 0.06, materials.pipeTerracotta);
        box(services, "water-riser", 3.12, 1.62, -0.13, 0.06, 2.1, 0.06, materials.pipeBlue);
        box(services, "water-run", 3.12, 2.24, -0.72, 0.06, 0.06, 1.2, materials.pipeBlue);

        const openings = stageGroups.openingsGroup;
        addWindow(openings, 1.58, 1.68, 2.47, 2.38, 1.45, "front");
        addWindow(openings, 0.65, 4.65, 2.47, 2.85, 1.5, "front");
        addWindow(openings, 3.3, 1.68, -0.13, 1.72, 1.42, "side");
        box(openings, "front-door", -1.78, 1.67, 2.47, 0.9, 2.3, 0.12, materials.timber);
        box(openings, "front-door-inset", -1.78, 1.7, 2.54, 0.62, 1.9, 0.025, materials.accent);
        sphere(openings, "door-handle", -1.43, 1.63, 2.58, 0.055, materials.gold);
        box(openings, "upper-balcony-door", -1.78, 4.58, 2.47, 0.85, 2.0, 0.1, materials.timber);

        const flooring = stageGroups.flooringGroup;
        box(flooring, "interior-ground-finish", 0, 0.755, 0, 6.15, 0.035, 4.45, materials.ivory);
        box(flooring, "upper-floor-finish", 0, 3.318, 0, 6.12, 0.035, 4.4, materials.accent);
        box(flooring, "front-paving", 0, -0.005, 4.0, 3.1, 0.1, 2.2, materials.concrete);
        [-0.95, 0, 0.95].forEach((x) => {
            box(flooring, "entry-step", x, 0.2, 3.45, 0.94, 0.12, 0.42, materials.concrete);
            box(flooring, "entry-step-upper", x, 0.33, 3.08, 0.94, 0.12, 0.34, materials.concrete);
        });

        const painting = stageGroups.paintingGroup;
        box(painting, "feature-wall-panel", 2.48, 1.75, 2.47, 0.48, 2.25, 0.08, materials.accent);
        box(painting, "entry-timber-screen", -2.85, 1.75, 2.49, 0.35, 2.25, 0.13, materials.timber);
        for (let index = 0; index < 6; index += 1) {
            box(painting, "screen-slat", -2.98 + index * 0.055, 1.75, 2.57, 0.018, 2.1, 0.025, materials.gold);
        }

        const interior = stageGroups.interiorGroup;
        box(interior, "living-room-sofa-base", 0.62, 1.14, -0.12, 1.55, 0.38, 0.72, materials.sofa);
        box(interior, "living-room-sofa-back", 0.62, 1.48, -0.43, 1.55, 0.48, 0.14, materials.sofa);
        box(interior, "living-room-table", 1.7, 0.99, -0.12, 0.7, 0.1, 0.55, materials.timber);
        box(interior, "dining-table", -1.85, 1.0, -1.25, 1.1, 0.12, 0.75, materials.timber);
        [-2.2, -1.5].forEach((x) => {
            [-1.65, -0.85].forEach((z) => box(interior, "dining-chair", x, 0.92, z, 0.28, 0.48, 0.28, materials.sofa));
        });
        box(interior, "upper-bed-base", 1.35, 3.64, -1.0, 1.65, 0.32, 1.9, materials.timber);
        box(interior, "upper-bed-linen", 1.35, 3.83, -1.0, 1.55, 0.1, 1.75, materials.fabric);
        box(interior, "upper-bed-headboard", 1.35, 4.02, -1.92, 1.7, 0.8, 0.12, materials.timber);

        const exterior = stageGroups.exteriorGroup;
        box(exterior, "balcony-deck-finish", 0.95, 3.34, 2.91, 4.35, 0.08, 1.3, materials.accent);
        box(exterior, "balcony-front-rail", 0.95, 3.88, 3.54, 4.35, 0.075, 0.075, materials.dark);
        box(exterior, "balcony-side-rail-left", -1.23, 3.88, 2.9, 0.075, 0.075, 1.3, materials.dark);
        box(exterior, "balcony-side-rail-right", 3.13, 3.88, 2.9, 0.075, 0.075, 1.3, materials.dark);
        for (let index = 0; index <= 12; index += 1) {
            box(exterior, "balcony-baluster", -1.15 + index * 0.35, 3.62, 3.54, 0.035, 0.52, 0.035, materials.gold);
        }
        box(exterior, "timber-facade-feature", 2.72, 4.52, 2.48, 0.72, 2.22, 0.12, materials.timber);
        for (let index = 0; index < 9; index += 1) {
            box(exterior, "facade-fin", 2.4 + index * 0.08, 4.52, 2.56, 0.025, 2.05, 0.04, materials.gold);
        }

        const landscape = stageGroups.landscapingGroup;
        box(landscape, "front-lawn", 0, -0.045, 4.95, 7.6, 0.08, 1.2, materials.green);
        box(landscape, "left-lawn", -5.3, -0.05, 0, 2.9, 0.06, 8.8, materials.green);
        box(landscape, "right-garden-bed", 5.15, -0.04, 0, 2.55, 0.07, 8.7, materials.soil);
        addTree(landscape, -5.5, 2.2, 1);
        addTree(landscape, 5.25, -2.4, 0.88);
        [-4.7, -3.85, 4.3, 4.8].forEach((x, index) => {
            sphere(landscape, "garden-shrub", x, 0.28, index % 2 ? 3.55 : -3.3, 0.38, index % 2 ? materials.leafLight : materials.leaf);
        });
        for (let index = 0; index < 5; index += 1) {
            cylinder(landscape, "path-light", -1.8 + index * 0.9, 0.24, 4.75, 0.055, 0.07, 0.45, materials.dark, 8);
        }

        const finalDetails = stageGroups.finalDetailsGroup;
        box(finalDetails, "roof-pergola-beam-left", -0.9, 6.48, 1.15, 0.12, 0.12, 2.3, materials.timber);
        box(finalDetails, "roof-pergola-beam-right", 0.7, 6.48, 1.15, 0.12, 0.12, 2.3, materials.timber);
        for (let index = 0; index < 6; index += 1) {
            box(finalDetails, "roof-pergola-slat", -0.9 + index * 0.32, 6.48, 1.15, 0.08, 0.1, 2.3, materials.timber);
        }
        cylinder(finalDetails, "entry-planter", -3.05, 0.2, 3.1, 0.35, 0.42, 0.4, materials.dark, 12);
        sphere(finalDetails, "entry-planter-greenery", -3.05, 0.62, 3.1, 0.34, materials.leafLight);
        box(finalDetails, "address-plaque", -3.26, 1.45, 1.88, 0.045, 0.27, 0.55, materials.gold);

        // The selected stage controls each named construction group independently.
        stageGroups.initialSiteGrowth = earlyGrowth;
    }

    function setGroupVisibility(stage) {
        groupSettings.forEach(([name, visibleFrom, baseY]) => {
            const group = stageGroups[name];
            let shouldShow = stage >= visibleFrom;
            if (name === "servicesGroup") {
                shouldShow = stage === 12;
            } else if (name === "wallGroup") {
                shouldShow = stage >= 11 && stage <= 13;
            } else if (name === "plasterGroup") {
                shouldShow = stage >= 14;
            } else if (name === "markingGroup") {
                shouldShow = stage === 3;
            } else if (name === "excavationGroup") {
                shouldShow = stage === 4;
            }

            if (group.userData.targetVisible === undefined) {
                group.userData.targetVisible = shouldShow;
                group.visible = shouldShow;
                group.scale.y = shouldShow ? 1 : 0.025;
                group.position.y = shouldShow ? 0 : baseY * 0.975;
                group.userData.baseY = baseY;
                return;
            }

            if (group.userData.targetVisible === shouldShow) return;
            group.userData.targetVisible = shouldShow;
            group.visible = true;
            group.userData.animationFromScale = group.scale.y;
            group.userData.animationFromY = group.position.y;
            group.userData.animationToScale = shouldShow ? 1 : 0.025;
            group.userData.animationToY = shouldShow ? 0 : baseY * 0.975;
            group.userData.revealStart = reducedMotion ? 0 : performance.now();
            if (reducedMotion) {
                group.scale.y = group.userData.animationToScale;
                group.position.y = group.userData.animationToY;
                group.visible = shouldShow;
            }
        });
        stageGroups.initialSiteGrowth.visible = stage === 1;
    }

    function updateStage(stage) {
        const parsed = Number(stage);
        if (!Number.isInteger(parsed) || parsed < 1 || parsed > 20) {
            console.warn("NESTORA: Ignored invalid construction stage.", stage);
            return;
        }
        currentStage = parsed;
        setGroupVisibility(parsed);
    }

    function updateScrollProgress(progress) {
        const bounded = THREE.MathUtils.clamp(progress, 0, 1);
        if (!reducedMotion) {
            cameraTarget.y = 2.2 + bounded * 0.25;
            camera.lookAt(cameraTarget);
        }
    }

    function resetCamera() {
        camera.position.set(10.5, 8.4, 11.5);
        camera.lookAt(cameraTarget);
        if (modelRoot) modelRoot.rotation.y = 0;
        userRotating = false;
    }

    function updateZoom(delta) {
        const offset = camera.position.clone().sub(cameraTarget);
        const distance = THREE.MathUtils.clamp(offset.length() * delta, 8.5, 24);
        offset.setLength(distance);
        camera.position.copy(cameraTarget).add(offset);
        camera.lookAt(cameraTarget);
    }

    function resizeRenderer() {
        const width = Math.max(1, mount.clientWidth);
        const height = Math.max(1, mount.clientHeight);
        renderer.setSize(width, height, false);
        camera.aspect = width / height;
        camera.fov = camera.aspect < 0.75 ? 52 : 36;
        camera.updateProjectionMatrix();
    }

    function animate(now) {
        animationFrame = 0;
        if (!pageVisible || !stageVisible) return;
        const deltaSeconds = lastFrameTime ? Math.min((now - lastFrameTime) / 1000, 0.05) : 0;
        lastFrameTime = now;

        groupSettings.forEach(([name]) => {
            const group = stageGroups[name];
            if (!group || !group.userData.revealStart) return;
            const progress = Math.min((now - group.userData.revealStart) / 520, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            group.scale.y = group.userData.animationFromScale
                + (group.userData.animationToScale - group.userData.animationFromScale) * eased;
            group.position.y = group.userData.animationFromY
                + (group.userData.animationToY - group.userData.animationFromY) * eased;
            if (progress === 1) {
                group.userData.revealStart = 0;
                group.visible = group.userData.targetVisible;
            }
        });

        if (!rotationPaused && !userRotating && !reducedMotion) {
            modelRoot.rotation.y += deltaSeconds * 0.055;
        }

        renderer.render(scene, camera);
        animationFrame = window.requestAnimationFrame(animate);
    }

    function syncRenderLoop() {
        if (pageVisible && stageVisible && !animationFrame) {
            lastFrameTime = 0;
            animationFrame = window.requestAnimationFrame(animate);
        } else if ((!pageVisible || !stageVisible) && animationFrame) {
            window.cancelAnimationFrame(animationFrame);
            animationFrame = 0;
            renderer.render(scene, camera);
        }
    }

    function setupControls() {
        const resetButton = document.getElementById("house-camera-reset");
        const rotationButton = document.getElementById("house-rotation-toggle");
        const zoomInButton = document.getElementById("house-zoom-in");
        const zoomOutButton = document.getElementById("house-zoom-out");
        const zoomFactor = 0.88;

        resetButton.addEventListener("click", () => {
            resetCamera();
            syncRenderLoop();
        });
        rotationButton.addEventListener("click", () => {
            rotationPaused = !rotationPaused;
            rotationButton.setAttribute("aria-pressed", String(rotationPaused));
            rotationButton.textContent = rotationPaused ? "Resume rotation" : "Pause rotation";
        });
        zoomInButton.addEventListener("click", () => updateZoom(zoomFactor));
        zoomOutButton.addEventListener("click", () => updateZoom(1 / zoomFactor));

        canvas.addEventListener("pointerdown", (event) => {
            if (event.pointerType === "touch") {
                dragStart = { x: event.clientX, y: event.clientY };
            } else {
                dragStart = { x: event.clientX, y: event.clientY };
                userRotating = true;
                canvas.setPointerCapture(event.pointerId);
            }
        });
        canvas.addEventListener("pointermove", (event) => {
            if (!dragStart) return;
            const deltaX = event.clientX - dragStart.x;
            const deltaY = event.clientY - dragStart.y;
            if (event.pointerType === "touch" && Math.abs(deltaY) > Math.abs(deltaX) * 1.15) {
                dragStart = null;
                return;
            }
            if (event.pointerType === "touch" && Math.abs(deltaX) > 4) userRotating = true;
            if (userRotating) modelRoot.rotation.y += deltaX * 0.008;
            dragStart = { x: event.clientX, y: event.clientY };
        });
        const endDrag = (event) => {
            dragStart = null;
            userRotating = false;
        };
        canvas.addEventListener("pointerup", endDrag);
        canvas.addEventListener("pointercancel", endDrag);
        canvas.addEventListener("lostpointercapture", endDrag);
        canvas.addEventListener("wheel", (event) => {
            updateZoom(event.deltaY > 0 ? 1.07 : 0.93);
        }, { passive: true });

        window.addEventListener("resize", resizeRenderer);
        if ("ResizeObserver" in window) {
            const resizeObserver = new ResizeObserver(resizeRenderer);
            resizeObserver.observe(mount);
        }
        document.addEventListener("visibilitychange", () => {
            pageVisible = !document.hidden;
            syncRenderLoop();
        });
        if ("IntersectionObserver" in window) {
            const intersectionObserver = new IntersectionObserver((entries) => {
                stageVisible = entries[0].isIntersecting;
                syncRenderLoop();
            }, { rootMargin: "160px 0px" });
            intersectionObserver.observe(mount);
        }
    }

    try {
        renderer = new THREE.WebGLRenderer({
            canvas: canvas,
            antialias: true,
            alpha: false,
            powerPreference: "high-performance"
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 1.6));
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        if (THREE.SRGBColorSpace) {
            renderer.outputColorSpace = THREE.SRGBColorSpace;
        } else {
            renderer.outputEncoding = THREE.sRGBEncoding;
        }
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 0.92;

        scene = new THREE.Scene();
        scene.background = new THREE.Color(0x202020);
        scene.fog = new THREE.Fog(0x202020, 22, 42);
        camera = new THREE.PerspectiveCamera(36, 1, 0.1, 100);
        resetCamera();

        scene.add(new THREE.HemisphereLight(0xece7da, 0x343b37, 1.1));
        const keyLight = new THREE.DirectionalLight(0xffe6c1, 2.4);
        keyLight.position.set(-7, 12, 8);
        keyLight.castShadow = true;
        keyLight.shadow.mapSize.set(1024, 1024);
        keyLight.shadow.camera.left = -12;
        keyLight.shadow.camera.right = 12;
        keyLight.shadow.camera.top = 13;
        keyLight.shadow.camera.bottom = -10;
        keyLight.shadow.bias = -0.00025;
        scene.add(keyLight);
        const fillLight = new THREE.DirectionalLight(0xc8d7dc, 0.7);
        fillLight.position.set(9, 7, -6);
        scene.add(fillLight);

        setupMaterials();
        buildScene();
        resizeRenderer();
        setupControls();
        updateStage(currentStage);

        window.NestoraHouse = {
            setStage: updateStage,
            setScrollProgress: updateScrollProgress,
            getStage: () => currentStage,
            resetCamera: resetCamera
        };
        syncRenderLoop();
    } catch (error) {
        showFallback("The 3D model could not start in this browser. Enable WebGL or try a WebGL-capable browser.");
        console.error(error);
    }
})();
