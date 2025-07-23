// script.js – mode « manuel pur » + switch de logs – 12 août 2025
// ---------------------------------------------------------------
// Mettre DEBUG_CONSOLE à true pour voir tous les console.log,
// sinon les traces sont désactivées.

const DEBUG_CONSOLE = false;
const dbg = (...args)=>{ if (DEBUG_CONSOLE) console.log(...args); };

import * as THREE from 'three';
import { ARButton } from 'three/addons/webxr/ARButton.js';

/* ---------- œuvres -------------------------------- */
const artworks = [{
    title:'Jef Aérosol – La liberté sait‑elle nager ?',
    src  :'assets/jeff-80.jpg',
    w:135, h:82
},{
    title:'Out of reach',
    src  :'assets/jeff-300.jpg',
    w:243, h:300
}];

/* ---------- DOM ----------------------------------- */
const $ = id=>document.getElementById(id);
const gui = {
    select : $('artSelect'),
    feedback: $('feedback'),
    fab    : $('resetBtn'),
    gizmo  : $('gizmoBtn'),
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

/* --------- distance preview ----------------------- */
const PREVIEW_DISTANCE = 2;      // change ici si tu veux 1 m, 1.5 m…

/* --------- remplissage du select ------------------ */
artworks.forEach((item,idx)=>{
    const o=document.createElement('option');
    o.text=item.title; o.value=idx.toString();
    gui.select.appendChild(o);
});

/* ---------- THREE / XR vars ----------------------- */
let renderer, scene, camera;
let painting;
let refSpace;

/* ---------- états -------------------------------- */
let previewMode=false, paintingPlaced=false;
let longPressT, lastCamPos=new THREE.Vector3();

/* ---------- FAB ---------------------------------- */
const MODE_FORCE='force', MODE_RESET='reset';
let fabMode=MODE_FORCE;
function setFab(m){fabMode=m;gui.fab.textContent=m===MODE_FORCE?'🎯':'↺';}

/* ---------- helper mesh -------------------------- */
function meshFrom(i){
    if(!artworks[i]){dbg('meshFrom: index',i,'invalid, fallback 0');i=0;}
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

/* ---------- gizmo (identique simplifié) ---------- */
const mapT={x:'x',y:'z',z:'y'}, mapR={x:'x',y:'z',z:'y'};
let mode='translate', axis='x';
let basePos=new THREE.Vector3(), baseRot=new THREE.Euler();
function updateVals(){
    gui.posVal.textContent=`${painting.position.x.toFixed(2)},${painting.position.z.toFixed(2)},${painting.position.y.toFixed(2)}`;
    gui.rotVal.textContent=`${THREE.MathUtils.radToDeg(painting.rotation.x).toFixed(0)},${THREE.MathUtils.radToDeg(painting.rotation.z).toFixed(0)},${THREE.MathUtils.radToDeg(painting.rotation.y).toFixed(0)}`;
}
function configSlider(){ if(mode==='translate'){gui.slider.min=-3;gui.slider.max=3;gui.slider.step=0.01;}
else{gui.slider.min=-180;gui.slider.max=180;gui.slider.step=1;} }
gui.modeB.forEach(b=>b.onclick=()=>{gui.modeB.forEach(x=>x.classList.remove('active'));b.classList.add('active');mode=b.dataset.mode;configSlider();});
gui.axisB.forEach(b=>b.onclick=()=>{gui.axisB.forEach(x=>x.classList.remove('active'));b.classList.add('active');axis=b.dataset.axis;configSlider();});
gui.slider.oninput=()=>{const v=parseFloat(gui.slider.value);
    if(mode==='translate')painting.position[mapT[axis]]=basePos[mapT[axis]]+v;
    else painting.rotation[mapR[axis]]=baseRot[mapR[axis]]+THREE.MathUtils.degToRad(v);
    updateVals();};
gui.slider.onchange = ()=>{basePos.copy(painting.position);baseRot.copy(painting.rotation);dbg('GIZMO',painting.position.toArray(),painting.rotation.toArray());};
gui.snap.onclick = ()=>{painting.rotation.x=painting.rotation.z=0;baseRot.copy(painting.rotation);gui.slider.value=0;updateVals();};
gui.resetG.onclick = ()=>{painting.position.set(0,0,0);painting.rotation.set(0,0,0);basePos.set(0,0,0);baseRot.set(0,0,0);gui.slider.value=0;updateVals();dbg('GIZMO_RESET');};
function showPanel(){if(gui.panel.classList.contains('open'))return;basePos.copy(painting.position);baseRot.copy(painting.rotation);
    gui.slider.value=0;configSlider();gui.panel.classList.add('open');gui.gizmo.classList.add('active');updateVals();}
function hidePanel(){gui.panel.classList.remove('open');gui.gizmo.classList.remove('active');}

/* ---------- reset -------------------------------- */
function resetAll(){
    previewMode=paintingPlaced=false;hidePanel();gui.gizmo.hidden=true;
    painting.visible=false;painting.material.opacity=1;painting.material.transparent=true;painting.material.color.set(0xffffff);
    setFab(MODE_FORCE);gui.feedback.textContent='Appuyez 🎯 pour afficher l’œuvre.';dbg('RESET');
}

/* ---------- boot -------------------------------- */
(async()=>{(await navigator.xr?.isSessionSupported?.('immersive-ar'))?initAR():gui.feedback.textContent='RA non supportée';})();

/* ---------- AR init ----------------------------- */
function initAR(){
    renderer=new THREE.WebGLRenderer({alpha:true,antialias:true});
    renderer.setPixelRatio(devicePixelRatio);renderer.setSize(innerWidth,innerHeight);
    renderer.xr.enabled=true;document.body.prepend(renderer.domElement);

    gui.arCont.appendChild(
        ARButton.createButton(renderer,{requiredFeatures:['dom-overlay'],domOverlay:{root:document.body}})
    );

    camera=new THREE.PerspectiveCamera(70,innerWidth/innerHeight,0.05,20);
    scene=new THREE.Scene();

    painting=meshFrom(0);scene.add(painting);

    renderer.xr.addEventListener('sessionstart',async()=>{
        gui.arCont.style.display='none';
        refSpace=await renderer.xr.getSession().requestReferenceSpace('local');
        resetAll();
    });
    renderer.xr.addEventListener('sessionend',()=>{gui.arCont.style.display='block';resetAll();});

    renderer.setAnimationLoop(onXRFrame);

    renderer.domElement.addEventListener('click',tapHandler);
    renderer.domElement.addEventListener('touchstart',e=>{
        if(!paintingPlaced)return;
        longPressT=setTimeout(showPanel,550);
        const stop=()=>clearTimeout(longPressT);
        e.target.addEventListener('touchend',stop,{once:true});
        e.target.addEventListener('touchmove',stop,{once:true});
    });

    gui.fab.onclick=()=>fabMode===MODE_FORCE?startPreview():resetAll();
    gui.gizmo.onclick=()=>gui.panel.classList.contains('open')?hidePanel():showPanel();
    gui.select.onchange=()=>{scene.remove(painting);painting=meshFrom(gui.select.value);scene.add(painting);resetAll();};

    addEventListener('resize',()=>{camera.aspect=innerWidth/innerHeight;camera.updateProjectionMatrix();renderer.setSize(innerWidth,innerHeight);});
    addEventListener('devicemotion',shakeReset);
}

/* ---------- Preview ----------------------------- */
function startPreview(){
    if(previewMode||paintingPlaced)return;
    previewMode=true;setFab(MODE_RESET);
    painting.material.opacity=0.55;painting.material.transparent=true;painting.material.color.set(0x00ff00);
    painting.visible=true;gui.feedback.textContent='Déplacez‑vous, puis touchez pour valider.';dbg('PREVIEW_START');
}

/* ---------- validation -------------------------- */
function tapHandler(e){
    if(!previewMode)return;if(e.target!==renderer.domElement)return;
    previewMode=false;paintingPlaced=true;
    painting.material.opacity=1;painting.material.transparent=false;painting.material.color.set(0xffffff);
    gui.gizmo.hidden=false;hidePanel();setFab(MODE_RESET);
    gui.feedback.textContent='Œuvre placée.';dbg('VALIDATE',painting.position.toArray());
}

/* ---------- shake reset ------------------------- */
let lastShake=0;
function shakeReset(e){
    const a=e.accelerationIncludingGravity;if(!a)return;
    const mag=Math.hypot(a.x,a.y,a.z),now=Date.now();
    if(mag>50&&now-lastShake>1200){lastShake=now;resetAll();}
}

/* ---------- frame loop -------------------------- */
let frameIdx=0;
function onXRFrame(_,frame){
    if(!frame){renderer.render(scene,camera);return;}
    frameIdx++;
    if(frameIdx%30===0) dbg('DRAW_CALLS',renderer.info.render.calls);

    /* preview suit caméra */
    if(previewMode){
        const dir=new THREE.Vector3();camera.getWorldDirection(dir).normalize();
        const camPos=new THREE.Vector3();camPos.setFromMatrixPosition(camera.matrixWorld);
        const pos=camPos.clone().add(dir.multiplyScalar(PREVIEW_DISTANCE));
        const yaw=Math.atan2(dir.x,dir.z)+Math.PI;
        painting.position.copy(pos);painting.rotation.set(0,yaw,0);
        if(frameIdx%30===0) dbg('PREVIEW_FRAME',pos.toArray());
        lastCamPos.copy(camPos);renderer.render(scene,camera);return;
    }

    /* dérive simple */
    if(paintingPlaced){
        const camPos=new THREE.Vector3();camPos.setFromMatrixPosition(camera.matrixWorld);
        const dist=camPos.distanceTo(lastCamPos);
        if(dist>0.6){dbg('DERIVE',dist.toFixed(2));gui.feedback.textContent='Suivi perdu : appuyez ↺ puis 🎯';}
        if(frameIdx%30===0) dbg('FIXED_FRAME camDist',dist.toFixed(2));
        lastCamPos.copy(camPos);
    }

    renderer.render(scene,camera);
}

/* ---------- fallback ---------------------------- */
function initFallback(){gui.feedback.textContent='RA non supportée';}
