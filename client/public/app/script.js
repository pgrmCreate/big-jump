/*
 * app.js — v3 : interface statique, logique dynamique uniquement
 * diamètre de piece de 1€ : 	23,25mm
 */


let cvReady      = false;
let displayScale = 1;   // mise à l'échelle initiale de la photo
let zoomFactor   = 1;   // zoom dynamique utilisateur
let scalePxPerMm = 0;   // ratio pixels/mm après calibration

const refPoints = [];

const workspace = document.getElementById('workspace');
const canvas    = document.getElementById('canvas');
const ctx       = canvas.getContext('2d');
const artImg    = document.getElementById('artworkPreview');

/* --------------------------------- ZOOM ---------------------------------- */
function updateZoom(){
    workspace.style.transform = `scale(${zoomFactor})`;
}

document.getElementById('zoomIn').addEventListener('click', ()=>{ zoomFactor*=1.5; updateZoom(); });
document.getElementById('zoomOut').addEventListener('click', ()=>{ zoomFactor=Math.max(1, zoomFactor/1.5); updateZoom(); });
document.getElementById('zoomReset').addEventListener('click', ()=>{ zoomFactor=1; updateZoom(); });

window.addEventListener('keydown', e=>{
    if(e.key==='z' || (e.ctrlKey && e.key==='=')){ zoomFactor*=1.5; updateZoom(); }
    if(e.key==='Escape'){ zoomFactor=1; updateZoom(); }
});

/* ----------------------------- OpenCV ready ------------------------------ */
window.cv = window.cv || {};
cv['onRuntimeInitialized'] = ()=>{ cvReady = true; };

/* ----------------------- Chargement photo pièce -------------------------- */
function loadRoom(file){
    const img = new Image();
    img.onload = ()=>{
        resetCalibration();

        const maxW = window.innerWidth  - 40;
        const maxH = window.innerHeight - 200;
        displayScale = Math.min(maxW/img.width, maxH/img.height, 1);

        canvas.width  = Math.round(img.width  * displayScale);
        canvas.height = Math.round(img.height * displayScale);

        ctx.clearRect(0,0,canvas.width,canvas.height);
        ctx.drawImage(img,0,0,canvas.width,canvas.height);

        zoomFactor=1;
        updateZoom();
    };
    img.src = URL.createObjectURL(file);
}

document.getElementById('roomInput').addEventListener('change', e=>loadRoom(e.target.files[0]));

/* ----------------------- Chargement image œuvre -------------------------- */
function loadArtwork(file){
    const img = new Image();
    img.onload = ()=>{
        artImg.src = img.src;
        artImg.style.display = 'block';

        const realMm = parseFloat(document.getElementById('artRealWidth').value);
        if(scalePxPerMm && realMm){ resizeArtwork(realMm); }
        else {
            artImg.width  = img.width  * displayScale;
            artImg.height = img.height * displayScale;
        }
        positionArtworkCentre();
    };
    img.src = URL.createObjectURL(file);
}

document.getElementById('artInput').addEventListener('change', e=>loadArtwork(e.target.files[0]));

function positionArtworkCentre(){
    artImg.style.left = ((canvas.width/2) - artImg.width /2) + 'px';
    artImg.style.top  = ((canvas.height/2)- artImg.height/2) + 'px';
}

function resizeArtwork(realMm){
    const newW = realMm * scalePxPerMm;
    const ratio = artImg.naturalHeight / artImg.naturalWidth;
    artImg.width  = newW;
    artImg.height = newW * ratio;
}

document.getElementById('setScale').addEventListener('click', computeScale);

/* ------------------- Sélection des points de référence ------------------- */
canvas.addEventListener('click', handleCanvasClick);
const DESIRED_SCREEN_RADIUS = 4; // px

function handleCanvasClick(e){
    if(scalePxPerMm) return;
    const rect = canvas.getBoundingClientRect();
    const xDisp = e.clientX - rect.left;
    const yDisp = e.clientY - rect.top;
    const baseX = xDisp / zoomFactor;
    const baseY = yDisp / zoomFactor;
    refPoints.push({x: baseX, y: baseY});

    const r  = Math.max(1, DESIRED_SCREEN_RADIUS * displayScale / zoomFactor);
    const lw = Math.max(1, 2 * displayScale / zoomFactor);

    ctx.save();
    ctx.fillStyle = 'red';
    ctx.strokeStyle = 'red';
    ctx.lineWidth = lw;
    ctx.beginPath();
    ctx.arc(baseX, baseY, r, 0, Math.PI*2);
    ctx.fill();

    if(refPoints.length === 2){
        ctx.beginPath();
        ctx.moveTo(refPoints[0].x, refPoints[0].y);
        ctx.lineTo(refPoints[1].x, refPoints[1].y);
        ctx.stroke();
    }
    ctx.restore();
}

function computeScale(){
    if(refPoints.length !== 2){ alert('Sélectionnez deux points.'); return; }
    const realMm = parseFloat(document.getElementById('refSize').value);
    if(!realMm){ alert('Indiquez le diamètre réel (mm).'); return; }

    const dx = refPoints[0].x - refPoints[1].x;
    const dy = refPoints[0].y - refPoints[1].y;
    const distPxBase = Math.hypot(dx, dy);
    scalePxPerMm = distPxBase / realMm;
    alert(`Échelle définie : ${scalePxPerMm.toFixed(2)} px/mm`);

    const realWidthMm = parseFloat(document.getElementById('artRealWidth').value);
    if(artImg.src && realWidthMm){ resizeArtwork(realWidthMm); positionArtworkCentre(); }
}

function resetCalibration(){
    refPoints.length = 0;
    scalePxPerMm = 0;
    ctx.clearRect(0,0,canvas.width,canvas.height);
}

/* ---------------------- Drag & drop œuvre (pointer) ---------------------- */
let dragging = false, dragOffset = [0, 0], activeId = null;

const startDrag = e => {
    e.preventDefault();                // évite le scroll pendant le drag
    activeId  = e.pointerId;
    dragging  = true;
    artImg.setPointerCapture(activeId);

    dragOffset = [e.offsetX, e.offsetY];
};

const moveDrag = e => {
    if (!dragging || e.pointerId !== activeId) return;

    const rect = workspace.getBoundingClientRect();
    artImg.style.left = ((e.clientX - rect.left - dragOffset[0]) / zoomFactor) + 'px';
    artImg.style.top  = ((e.clientY - rect.top  - dragOffset[1]) / zoomFactor) + 'px';
};

const endDrag = e => {
    if (e.pointerId !== activeId) return;
    dragging = false;
    artImg.releasePointerCapture(activeId);
    activeId = null;
};

/* bloc pointer déjà présent… */
artImg.addEventListener('pointerdown', startDrag);
window .addEventListener('pointermove',  moveDrag);
window .addEventListener('pointerup',    endDrag);
window .addEventListener('pointercancel',endDrag);

/* NEW : neutralise le menu contextuel long-press */
artImg.addEventListener('contextmenu', e => e.preventDefault());
