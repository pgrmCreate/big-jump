// script.js – Ajout « drag » + slider profondeur – 29 juil. 2025
// -----------------------------------------------------------------
const DEBUG_CONSOLE = false;
const dbg = (...args)=>{ if (DEBUG_CONSOLE) console.log(...args); };

import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';

/* ---------- œuvres -------------------------------------------- */
const artworks = [{
    title:'Jef Aérosol – La liberté sait‑elle nager ?',
    src  :'assets/jeff-80.jpg',
    w:135, h:82
},{
    title:'Out of reach',
    src  :'assets/jeff-300.jpg',
    w:243, h:300
}];

/* ---------- DOM ------------------------------------------------ */
const $ = id=>document.getElementById(id);
const gui = {
    select : $('artSelect'),
    feedback: $('feedback'),
    fab    : $('resetBtn'),
    gizmo  : $('gizmoBtn'),
    depth  : $('depthBtn'),
    depthCont:$('depthSliderCont'),
    depthSlider:$('depthSlider'),
    arCont : $('arButtonContainer'),
    panel  : $('toolPanel'),
    posVal : $('posVal'),
    rotVal : $('rotVal'),
    slider : $('adjustSlider'),
    snap   : $('snapBtn'),
    resetG : $('resetGizmo'),
    modeB  : [...document.querySelectorAll('.mode-btn')],
    axisB  : [...document.querySelectorAll('.axis-btn')]
};

/* ---------- constantes appli ---------------------------------- */
const PREVIEW_DISTANCE = 2;            // œuvre à 2 m lors du preview
const LONG_PRESS_MS    = 200;          // long‑press (drag ou panneau)

/* ---------- THREE / XR vars ----------------------------------- */
let renderer, scene, camera;
let painting;
let refSpace;

/* ---------- états --------------------------------------------- */
let previewMode=false, paintingPlaced=false;
let lastCamPos=new THREE.Vector3();

/* ---------- FAB ----------------------------------------------- */
const MODE_FORCE='force', MODE_RESET='reset';
let fabMode=MODE_FORCE;
function setFab(m){fabMode=m;gui.fab.textContent=m===MODE_FORCE?'🎯':'↺';}

/* --------- remplissage du select ------------------ */
artworks.forEach((item,idx)=>{
    const o=document.createElement('option');
    o.text=item.title; o.value=idx.toString();
    gui.select.appendChild(o);
});

/* ---------- mesh helper --------------------------------------- */
function meshFrom(i){
    if(!artworks[i]) i=0;
    const {src,w,h}=artworks[i];
    const tex=new THREE.TextureLoader().load(src);
    tex.colorSpace=THREE.SRGBColorSpace;
    const m=new THREE.Mesh(
        new THREE.PlaneGeometry(w/100,h/100),
        new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,transparent:true,opacity:1,color:0xffffff})
    );
    m.frustumCulled=false;
    return m;
}

/* ---------- gizmo d’origine (inchangé) ------------------------ */
const mapT={x:'x',y:'z',z:'y'}, mapR={x:'x',y:'z',z:'y'};
let mode='translate', axis='x';
let basePos=new THREE.Vector3(), baseRot=new THREE.Euler();
function updateVals(){
    gui.posVal.textContent=`${painting.position.x.toFixed(2)},${painting.position.z.toFixed(2)},${painting.position.y.toFixed(2)}`;
    gui.rotVal.textContent=`${THREE.MathUtils.radToDeg(painting.rotation.x).toFixed(0)},${THREE.MathUtils.radToDeg(painting.rotation.z).toFixed(0)},${THREE.MathUtils.radToDeg(painting.rotation.y).toFixed(0)}`;
}
function configSlider(){
    if(mode==='translate'){gui.slider.min=-3;gui.slider.max=3;gui.slider.step=0.01;}
    else{gui.slider.min=-180;gui.slider.max=180;gui.slider.step=1;}
}
gui.modeB.forEach(b=>b.onclick=()=>{gui.modeB.forEach(x=>x.classList.remove('active'));b.classList.add('active');mode=b.dataset.mode;configSlider();});
gui.axisB.forEach(b=>b.onclick=()=>{gui.axisB.forEach(x=>x.classList.remove('active'));b.classList.add('active');axis=b.dataset.axis;configSlider();});
gui.slider.oninput=()=>{
    const v=parseFloat(gui.slider.value);
    if(mode==='translate') painting.position[mapT[axis]]=basePos[mapT[axis]]+v;
    else                    painting.rotation[mapR[axis]]=baseRot[mapR[axis]]+THREE.MathUtils.degToRad(v);
    updateVals();
};
gui.slider.onchange = ()=>{basePos.copy(painting.position);baseRot.copy(painting.rotation);};
gui.snap .onclick = ()=>{painting.rotation.x=painting.rotation.z=0;baseRot.copy(painting.rotation);gui.slider.value=0;updateVals();};
gui.resetG.onclick = ()=>{painting.position.set(0,0,0);painting.rotation.set(0,0,0);basePos.set(0,0,0);baseRot.set(0,0,0);gui.slider.value=0;updateVals();};

function showPanel(){
    if(gui.panel.classList.contains('open')) return;
    basePos.copy(painting.position);baseRot.copy(painting.rotation);
    gui.slider.value=0;configSlider();
    gui.panel.classList.add('open');gui.gizmo.classList.add('active');
    updateVals();
}
function hidePanel(){
    gui.panel.classList.remove('open');gui.gizmo.classList.remove('active');
}





/* ---------- drag translation in painting plane (touch) --------- */
let dragTimer=null, dragging=false;
let dragStartWorld=new THREE.Vector3();      // point de départ sur le plan
let dragBasePos   =new THREE.Vector3();      // position de l'œuvre à l'origine du drag
let dragPlane     =new THREE.Plane();        // plan du tableau
const raycaster   =new THREE.Raycaster();

function touchStartHandler(e){
    if(!paintingPlaced) return;

    const t=e.touches[0];
    const nx=(t.clientX/innerWidth)*2-1;
    const ny=-(t.clientY/innerHeight)*2+1;

    raycaster.setFromCamera({x:nx,y:ny},camera);
    const intersects=raycaster.intersectObject(painting,true);
    const hit = intersects.length>0;

    if(hit){
        dragStartWorld.copy(intersects[0].point);
        /* plan coplanaire au tableau ---------------------------------- */
        const normal=new THREE.Vector3();
        painting.getWorldDirection(normal);  // normal sortant (vers -Z local)
        dragPlane.setFromNormalAndCoplanarPoint(normal, dragStartWorld);

        dragBasePos.copy(painting.position);
        dragTimer = setTimeout(()=>{dragging=true;}, LONG_PRESS_MS);

        e.target.addEventListener('touchmove', touchMoveHandler);
        e.target.addEventListener('touchend',  touchEndHandler,{once:true});
        e.target.addEventListener('touchcancel', touchEndHandler,{once:true});
    }else{
        /* long‑press hors œuvre → panneau gizmo ----------------------- */
        dragTimer = setTimeout(showPanel, LONG_PRESS_MS);
        const stop = () => clearTimeout(dragTimer);
        e.target.addEventListener('touchend', stop, {once:true});
        e.target.addEventListener('touchmove', stop, {once:true});
    }
}

function touchMoveHandler(ev){
    if(!dragging) return;
    const t=ev.touches[0];
    const nx=(t.clientX/innerWidth)*2-1;
    const ny=-(t.clientY/innerHeight)*2+1;
    raycaster.setFromCamera({x:nx, y:ny}, camera);

    const intersectPoint = new THREE.Vector3();
    if(raycaster.ray.intersectPlane(dragPlane, intersectPoint)){
        const delta = intersectPoint.clone().sub(dragStartWorld);
        painting.position.copy(dragBasePos.clone().add(delta));
        updateVals();
    }
}

function touchEndHandler(){
    clearTimeout(dragTimer);
    if(dragging) basePos.copy(painting.position);  // maj pour le gizmo
    dragging=false;
    renderer.domElement.removeEventListener('touchmove', touchMoveHandler);
}

/* slider profondeur (axe Z) ------------------------------------ */
const OFFSET_RANGE = 2;          // ±2 m offset autour de la base
const Z_MIN = -3, Z_MAX = 3;     // bornes absolues
let depthBase = 0;

function updateDepthSliderBounds(){
    gui.depthSlider.min  = -OFFSET_RANGE;
    gui.depthSlider.max  =  OFFSET_RANGE;
    gui.depthSlider.step = 0.1;
}

/* ouverture du panneau profondeur */
gui.depth.onclick = () => {
    if(!paintingPlaced) return;
    const open = gui.depthCont.classList.toggle('show');
    gui.depth.classList.toggle('active', open);
    if(open){
        depthBase = painting.position.z;
        updateDepthSliderBounds();   // plage -2 → +2
        gui.depthSlider.value = "0"; // curseur au centre
    }
};

/* déplacement en continu */
gui.depthSlider.oninput = () => {
    const offset = parseFloat(gui.depthSlider.value);
    const clampedZ = THREE.MathUtils.clamp(depthBase + offset, Z_MIN, Z_MAX);
    painting.position.z = clampedZ;
    updateVals();
};

/* relâchement : nouvelle base et recentrage du curseur */
gui.depthSlider.onchange = () => {
    depthBase = painting.position.z;
    updateDepthSliderBounds();
    gui.depthSlider.value = "0";
};
/* ---------- reset & utilitaires ------------------------------- */
function resetAll(){
    previewMode=paintingPlaced=false;
    hidePanel();
    gui.gizmo.hidden=true;
    gui.depth.hidden=true;
    gui.depthCont.classList.remove('show');gui.depth.classList.remove('active');
    painting.visible=false;painting.material.opacity=1;painting.material.transparent=true;painting.material.color.set(0xffffff);
    setFab(MODE_FORCE);
    gui.feedback.textContent='Appuyez 🎯 pour afficher l’œuvre.';
}

function startPreview(){
    if(previewMode||paintingPlaced) return;
    previewMode=true;setFab(MODE_RESET);
    painting.material.opacity=.55;painting.material.transparent=true;painting.material.color.set(0x00ff00);
    painting.visible=true;gui.feedback.textContent='Déplacez‑vous, puis touchez pour valider.';
}

function tapHandler(e){
    if(!previewMode) return;
    if(e.target!==renderer.domElement) return;
    previewMode=false;paintingPlaced=true;
    painting.material.opacity=1;painting.material.transparent=false;painting.material.color.set(0xffffff);
    gui.gizmo.hidden=false;
    gui.depth.hidden=false;
    hidePanel();setFab(MODE_RESET);
    gui.feedback.textContent='Œuvre placée.';
}

/* ---------- initialisation AR --------------------------------- */
(async()=>{
    (await navigator.xr?.isSessionSupported?.('immersive-ar')) ? initAR() : gui.feedback.textContent='RA non supportée';
})();

function initAR(){
    /* renderer & scène ------------------------------------------ */
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
    renderer.setPixelRatio(devicePixelRatio);
    renderer.setSize(innerWidth,innerHeight);
    renderer.xr.enabled=true;
    document.body.prepend(renderer.domElement);

    gui.arCont.appendChild(
        ARButton.createButton(renderer,{requiredFeatures:['dom-overlay'],domOverlay:{root:document.body}})
    );

    camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,0.05,20);
    scene = new THREE.Scene();

    painting = meshFrom(0);
    scene.add(painting);

    renderer.xr.addEventListener('sessionstart',async()=>{
        gui.arCont.style.display='none';
        refSpace = await renderer.xr.getSession().requestReferenceSpace('local');
        resetAll();
    });
    renderer.xr.addEventListener('sessionend',()=>{
        gui.arCont.style.display='block';
        resetAll();
    });

    renderer.setAnimationLoop(onXRFrame);

    /* listeners -------------------------------------------------- */
    renderer.domElement.addEventListener('click',tapHandler);
    renderer.domElement.addEventListener('touchstart',touchStartHandler);

    gui.fab   .onclick = ()=> fabMode===MODE_FORCE ? startPreview() : resetAll();
    gui.gizmo .onclick = ()=> gui.panel.classList.contains('open') ? hidePanel() : showPanel();
    gui.select.onchange = ()=>{
        scene.remove(painting);
        painting = meshFrom(gui.select.value);
        scene.add(painting);
        resetAll();
    };

    addEventListener('resize',()=>{
        camera.aspect=innerWidth/innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(innerWidth,innerHeight);
    });
}

/* ---------- boucle XR ---------------------------------------- */
let frameIdx=0,lastShake=0;
function onXRFrame(_,frame){
    if(!frame){renderer.render(scene,camera);return;}
    frameIdx++;

    /* MODE PREVIEW : l’œuvre suit la caméra --------------------- */
    if(previewMode){
        const dir=new THREE.Vector3();
        camera.getWorldDirection(dir).normalize();
        const camPos=new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld);
        painting.position.copy(camPos.clone().add(dir.multiplyScalar(PREVIEW_DISTANCE)));
        const yaw=Math.atan2(dir.x,dir.z)+Math.PI;
        painting.rotation.set(0,yaw,0);
        lastCamPos.copy(camPos);
        renderer.render(scene,camera);return;
    }

    renderer.render(scene,camera);
}
