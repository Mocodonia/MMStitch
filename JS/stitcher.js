// Update debug status
document.getElementById('debug').textContent = 'All JavaScript loaded ✓✓';
document.getElementById('debug').style.background = 'rgba(16, 185, 129, 0.5)';

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d', { willReadFrequently: true });

let outputWidth = 4096;
let outputHeight = 2048;

// Resolution selector
document.getElementById('resolution').addEventListener('change', function(e) {
    outputWidth = parseInt(e.target.value);
    outputHeight = outputWidth / 2;
});

// Stitch button
document.getElementById('btn-stitch').addEventListener('click', async function() {
    const loading = document.getElementById('loading');
    loading.classList.add('active');
    this.disabled = true;
    
    await new Promise(r => setTimeout(r, 100));
    
    try {
        await stitchImages();
        document.getElementById('btn-download').disabled = false;
    } catch (err) {
        alert('Error: ' + err.message);
    }
    
    loading.classList.remove('active');
    this.disabled = false;
});

// Download button
document.getElementById('btn-download').addEventListener('click', function() {
    const link = document.createElement('a');
    const date = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
    link.download = `panorama-${date}.jpg`;
    link.href = canvas.toDataURL('image/jpeg', 0.92);
    link.click();
});

// Clear button
document.getElementById('btn-clear').addEventListener('click', function() {
    window.clearUploads();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    document.getElementById('btn-download').disabled = true;
});

// Main stitching function
async function stitchImages() {
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    
    // Prepare face canvases
    const faceData = {};
    const faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
    
    faces.forEach(face => {
        const img = window.uploadedImages[face];
        if (img) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = img.width;
            tempCanvas.height = img.height;
            const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
            tempCtx.drawImage(img, 0, 0);
            faceData[face] = { canvas: tempCanvas, ctx: tempCtx };
        }
    });
    
    // Convert cubemap to equirectangular
    for (let y = 0; y < outputHeight; y++) {
        for (let x = 0; x < outputWidth; x++) {
            const pixel = getPixelFromCubemap(x, y, outputWidth, outputHeight, faceData);
            if (pixel) {
                ctx.fillStyle = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
                ctx.fillRect(x, y, 1, 1);
            }
        }
        
        if (y % 50 === 0) {
            await new Promise(r => setTimeout(r, 0));
        }
    }
}

// Get pixel from cubemap
function getPixelFromCubemap(x, y, width, height, faceData) {
    const u = x / width;
    const v = y / height;
    
    const theta = u * Math.PI * 2;
    const phi = v * Math.PI;
    
    const sinPhi = Math.sin(phi);
    const dx = sinPhi * Math.sin(theta);
    const dy = Math.cos(phi);
    const dz = sinPhi * Math.cos(theta);
    
    const face = selectFace(dx, dy, dz);
    const uv = getFaceUV(dx, dy, dz, face);
    
    return sampleFace(faceData[face], uv.u, uv.v);
}

// Select which face to use
function selectFace(x, y, z) {
    const ax = Math.abs(x);
    const ay = Math.abs(y);
    const az = Math.abs(z);
    
    if (ax >= ay && ax >= az) return x > 0 ? 'right' : 'left';
    if (ay >= ax && ay >= az) return y > 0 ? 'top' : 'bottom';
    return z > 0 ? 'back' : 'front';
}

// Get UV coordinates for face
function getFaceUV(x, y, z, face) {
    let u, v;
    switch(face) {
        case 'front':
            u = (-x / z + 1) / 2;
            v = (-y / z + 1) / 2;
            break;
        case 'back':
            u = (x / -z + 1) / 2;
            v = (-y / -z + 1) / 2;
            break;
        case 'left':
            u = (z / -x + 1) / 2;
            v = (-y / -x + 1) / 2;
            break;
        case 'right':
            u = (-z / x + 1) / 2;
            v = (-y / x + 1) / 2;
            break;
        case 'top':
            u = (-x / y + 1) / 2;
            v = (z / y + 1) / 2;
            break;
        case 'bottom':
            u = (-x / -y + 1) / 2;
            v = (-z / -y + 1) / 2;
            break;
    }
    return { u, v };
}

// Sample pixel from face
function sampleFace(faceData, u, v) {
    if (!faceData) return null;
    
    const { canvas, ctx } = faceData;
    const x = Math.floor(u * (canvas.width - 1));
    const y = Math.floor(v * (canvas.height - 1));
    
    try {
        return ctx.getImageData(x, y, 1, 1).data;
    } catch (e) {
        return null;
    }
}
