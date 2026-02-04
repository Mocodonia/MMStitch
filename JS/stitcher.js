const debug = document.getElementById('debug');
debug.textContent = 'MMStitch Minecraft mode loaded ✓';
debug.style.background = 'rgba(16, 185, 129, 0.3)';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

let outputWidth = 4096;
let outputHeight = 2048;

const images = [];      // ordered screenshots
const imageCanvases = []; // pre-rendered canvases for sampling

// Resolution selector
document.getElementById('resolution').addEventListener('change', e => {
    outputWidth = parseInt(e.target.value, 10);
    outputHeight = outputWidth / 2;
});

// Setup uploads
const uploadGrid = document.getElementById('upload-grid');
const statusEl = document.getElementById('status');
const progressEl = document.getElementById('progress');
const stitchBtn = document.getElementById('btn-stitch');
const downloadBtn = document.getElementById('btn-download');
const clearBtn = document.getElementById('btn-clear');
const loadingEl = document.getElementById('loading');

setupUploads();
updateStatus();

function setupUploads() {
    const boxes = uploadGrid.querySelectorAll('.upload-box');
    boxes.forEach(box => {
        const input = box.querySelector('input[type="file"]');
        const thumb = box.querySelector('.thumb');
        const index = parseInt(box.dataset.index, 10);

        box.addEventListener('click', () => input.click());

        input.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;
            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }

            const reader = new FileReader();
            reader.onload = ev => {
                const img = new Image();
                img.onload = () => {
                    images[index] = img;

                    // create sampling canvas
                    const c = document.createElement('canvas');
                    c.width = img.width;
                    c.height = img.height;
                    const cctx = c.getContext('2d', { willReadFrequently: true });
                    cctx.drawImage(img, 0, 0);
                    imageCanvases[index] = { canvas: c, ctx: cctx };

                    thumb.src = ev.target.result;
                    box.classList.add('has-image');
                    updateStatus();
                };
                img.src = ev.target.result;
            };
            reader.readAsDataURL(file);
        });
    });
}

function updateStatus() {
    const count = images.filter(Boolean).length;
    statusEl.textContent = `${count} images uploaded`;
    const minNeeded = 4;
    progressEl.style.width = Math.min(count / minNeeded, 1) * 100 + '%';
    stitchBtn.disabled = count < minNeeded;
}

// Clear
clearBtn.addEventListener('click', () => {
    for (let i = 0; i < images.length; i++) {
        images[i] = null;
        imageCanvases[i] = null;
    }
    const boxes = uploadGrid.querySelectorAll('.upload-box');
    boxes.forEach(box => {
        const input = box.querySelector('input[type="file"]');
        const thumb = box.querySelector('.thumb');
        input.value = '';
        thumb.src = '';
        box.classList.remove('has-image');
    });
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    downloadBtn.disabled = true;
    updateStatus();
});

// Stitch button
stitchBtn.addEventListener('click', async () => {
    loadingEl.classList.add('active');
    stitchBtn.disabled = true;

    await new Promise(r => setTimeout(r, 50));

    try {
        await stitchMinecraftRing();
        downloadBtn.disabled = false;
    } catch (e) {
        alert('Error while stitching: ' + e.message);
        console.error(e);
    }

    loadingEl.classList.remove('active');
    stitchBtn.disabled = false;
});

// Download
downloadBtn.addEventListener('click', () => {
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = `mmstitch-minecraft-${date}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
});

// Core: simple circular stitcher for Minecraft screenshots
async function stitchMinecraftRing() {
    const validImages = imageCanvases.filter(Boolean);
    const n = validImages.length;
    if (n < 4) throw new Error('Need at least 4 screenshots');

    canvas.width = outputWidth;
    canvas.height = outputHeight;

    // Assume screenshots are taken evenly around 360°
    // Each image covers 360 / n degrees horizontally
    for (let y = 0; y < outputHeight; y++) {
        const v = y / outputHeight; // 0..1 vertical

        for (let x = 0; x < outputWidth; x++) {
            const u = x / outputWidth; // 0..1 horizontal

            // Map u to angle 0..1 around circle
            const angle = u; // 0..1 → 0..360°
            const imgIndexFloat = angle * n;
            const imgIndex = Math.floor(imgIndexFloat) % n;
            const localU = imgIndexFloat - imgIndex; // position within that image (0..1)

            const { canvas: ic, ctx: icx } = validImages[imgIndex];

            const sx = Math.floor(localU * (ic.width - 1));
            const sy = Math.floor(v * (ic.height - 1));

            const pixel = icx.getImageData(sx, sy, 1, 1).data;
            ctx.fillStyle = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
            ctx.fillRect(x, y, 1, 1);
        }

        if (y % 32 === 0) {
            await new Promise(r => setTimeout(r, 0));
        }
    }
}
