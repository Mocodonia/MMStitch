// Debug
const debugEl = document.getElementById('debug');
debugEl.textContent = 'Stitcher loaded ✓ (Cam360 spherical)';
debugEl.style.background = 'rgba(16, 185, 129, 0.5)';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

let outputWidth = 4096;
let outputHeight = 2048;

document.getElementById('resolution').addEventListener('change', e => {
    outputWidth = parseInt(e.target.value, 10);
    outputHeight = outputWidth / 2;
});

const stitchBtn = document.getElementById('btn-stitch');
const downloadBtn = document.getElementById('btn-download');
const clearBtn = document.getElementById('btn-clear');
const loadingEl = document.getElementById('loading');

stitchBtn.addEventListener('click', async () => {
    loadingEl.classList.add('active');
    stitchBtn.disabled = true;

    await new Promise(r => setTimeout(r, 50));

    try {
        await stitchCam360();
        downloadBtn.disabled = false;
    } catch (err) {
        alert('Error: ' + err.message);
        console.error(err);
    }

    loadingEl.classList.remove('active');
    stitchBtn.disabled = false;
});

downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = `mmstitch-${date}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
});

clearBtn.addEventListener('click', () => {
    if (window.clearUploads) window.clearUploads();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    downloadBtn.disabled = true;
});

// Cam360 order
const ORDER = [
    'front', 'frontright', 'right', 'backright',
    'back', 'backleft', 'left', 'frontleft',
    'top', 'bottom'
];

// Horizontal FOV guess for Quake Pro
const FOV_H = 150 * Math.PI / 180; // radians

async function stitchCam360() {
    const imgs = ORDER.map(f => window.uploadedImages[f] || null);

    const horiz = imgs.slice(0, 8);
    const imgTop = imgs[8];
    const imgBottom = imgs[9];

    if (horiz.filter(Boolean).length < 3)
        throw new Error("Need at least 3 horizontal images");

    const srcCanvases = imgs.map(img => {
        if (!img) return null;
        const c = document.createElement('canvas');
        c.width = img.width;
        c.height = img.height;
        const cctx = c.getContext('2d', { willReadFrequently: true });
        cctx.drawImage(img, 0, 0);
        return { canvas: c, ctx: cctx };
    });

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    for (let y = 0; y < outputHeight; y++) {
        const v = (y / outputHeight) * Math.PI - Math.PI / 2;

        for (let x = 0; x < outputWidth; x++) {
            const u = (x / outputWidth) * 2 * Math.PI;

            const dx = Math.cos(v) * Math.cos(u);
            const dy = Math.sin(v);
            const dz = Math.cos(v) * Math.sin(u);

            let pixel;

            if (dy > 0.7 && imgTop) {
                pixel = samplePole(srcCanvases[8], dx, dz);
            } else if (dy < -0.7 && imgBottom) {
                pixel = samplePole(srcCanvases[9], dx, dz);
            } else {
                pixel = sampleRing(srcCanvases, u, v);
            }

            ctx.fillStyle = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
            ctx.fillRect(x, y, 1, 1);
        }

        if (y % 32 === 0) await new Promise(r => setTimeout(r, 0));
    }
}

function sampleRing(srcs, u, v) {
    const angle = (u + 2 * Math.PI) % (2 * Math.PI);
    const slice = angle / (2 * Math.PI) * 8;
    const idx = Math.floor(slice);
    const local = slice - idx;

    const src = srcs[idx];
    if (!src) return [0, 0, 0];

    const sx = Math.floor(local * (src.canvas.width - 1));
    const sy = Math.floor(((v + Math.PI / 2) / Math.PI) * (src.canvas.height - 1));

    return src.ctx.getImageData(sx, sy, 1, 1).data;
}

function samplePole(src, dx, dz) {
    if (!src) return [0, 0, 0];

    const angle = Math.atan2(dz, dx);
    const u = (angle + Math.PI) / (2 * Math.PI);

    const sx = Math.floor(u * (src.canvas.width - 1));
    const sy = Math.floor(src.canvas.height / 2);

    return src.ctx.getImageData(sx, sy, 1, 1).data;
}
