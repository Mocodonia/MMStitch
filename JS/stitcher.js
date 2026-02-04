// Change title to confirm JS loaded
document.title = "MMStitch - Ready! ✅";

class MMStitcher {
    constructor() {
        this.images = {};
        this.faces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
        this.canvas = document.getElementById('canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.width = 4096;
        this.height = 2048;
        this.format = 'jpeg';
        
        this.init();
    }

    init() {
        // Make upload slots clickable
        this.faces.forEach(face => {
            const slot = document.querySelector(`[data-face="${face}"]`);
            const input = document.getElementById(`file-${face}`);
            
            // Click slot opens file picker
            slot.addEventListener('click', () => {
                input.click();
            });
            
            // File selected
            input.addEventListener('change', (e) => {
                this.handleUpload(face, e.target.files[0]);
            });
        });

        // Button events
        document.getElementById('btn-stitch').addEventListener('click', () => this.stitch());
        document.getElementById('btn-download').addEventListener('click', () => this.download());
        document.getElementById('btn-clear').addEventListener('click', () => this.clear());

        // Settings
        document.getElementById('resolution').addEventListener('change', (e) => {
            this.width = parseInt(e.target.value);
            this.height = this.width / 2;
        });

        document.getElementById('format').addEventListener('change', (e) => {
            this.format = e.target.value;
        });
    }

    handleUpload(face, file) {
        if (!file || !file.type.startsWith('image/')) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.images[face] = img;
                this.showPreview(face, e.target.result);
                this.updateUI();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    showPreview(face, src) {
        const slot = document.querySelector(`[data-face="${face}"]`);
        const preview = document.getElementById(`preview-${face}`);
        
        preview.innerHTML = `<img src="${src}" alt="${face}">`;
        slot.classList.add('uploaded');
    }

    updateUI() {
        const count = Object.keys(this.images).length;
        const required = 6;
        
        // Update status
        document.getElementById('status').textContent = `${count}/${required} required images uploaded`;
        
        // Update progress
        const progress = (count / required) * 100;
        document.getElementById('progress').style.width = progress + '%';
        
        // Enable stitch button
        document.getElementById('btn-stitch').disabled = count < required;
    }

    clear() {
        this.images = {};
        
        this.faces.forEach(face => {
            const slot = document.querySelector(`[data-face="${face}"]`);
            const preview = document.getElementById(`preview-${face}`);
            const input = document.getElementById(`file-${face}`);
            
            slot.classList.remove('uploaded');
            preview.innerHTML = '';
            input.value = '';
        });
        
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        document.getElementById('btn-download').disabled = true;
        this.updateUI();
    }

    async stitch() {
        const loading = document.getElementById('loading');
        loading.classList.add('active');
        document.getElementById('btn-stitch').disabled = true;

        await new Promise(r => setTimeout(r, 100));

        try {
            this.canvas.width = this.width;
            this.canvas.height = this.height;

            // Prepare face canvases
            const faceCanvases = {};
            const faceContexts = {};

            this.faces.forEach(face => {
                if (this.images[face]) {
                    const canvas = document.createElement('canvas');
                    const img = this.images[face];
                    canvas.width = img.width;
                    canvas.height = img.height;
                    const ctx = canvas.getContext('2d', { willReadFrequently: true });
                    ctx.drawImage(img, 0, 0);
                    faceCanvases[face] = canvas;
                    faceContexts[face] = ctx;
                }
            });

            // Convert cubemap to equirectangular
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const u = x / this.width;
                    const v = y / this.height;
                    
                    const theta = u * Math.PI * 2;
                    const phi = v * Math.PI;
                    
                    const sinPhi = Math.sin(phi);
                    const dx = sinPhi * Math.sin(theta);
                    const dy = Math.cos(phi);
                    const dz = sinPhi * Math.cos(theta);
                    
                    const face = this.selectFace(dx, dy, dz);
                    const uv = this.getFaceUV(dx, dy, dz, face);
                    const pixel = this.samplePixel(faceContexts[face], faceCanvases[face], uv.u, uv.v);
                    
                    if (pixel) {
                        this.ctx.fillStyle = `rgb(${pixel[0]},${pixel[1]},${pixel[2]})`;
                        this.ctx.fillRect(x, y, 1, 1);
                    }
                }
                
                if (y % 50 === 0) {
                    await new Promise(r => setTimeout(r, 0));
                }
            }

            document.getElementById('btn-download').disabled = false;
        } catch (err) {
            alert('Stitching error: ' + err.message);
        } finally {
            loading.classList.remove('active');
            document.getElementById('btn-stitch').disabled = false;
        }
    }

    selectFace(x, y, z) {
        const absX = Math.abs(x);
        const absY = Math.abs(y);
        const absZ = Math.abs(z);
        
        if (absX >= absY && absX >= absZ) return x > 0 ? 'right' : 'left';
        if (absY >= absX && absY >= absZ) return y > 0 ? 'top' : 'bottom';
        return z > 0 ? 'back' : 'front';
    }

    getFaceUV(x, y, z, face) {
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

    samplePixel(ctx, canvas, u, v) {
        if (!ctx) return null;
        const x = Math.floor(u * (canvas.width - 1));
        const y = Math.floor(v * (canvas.height - 1));
        try {
            return ctx.getImageData(x, y, 1, 1).data;
        } catch (e) {
            return null;
        }
    }

    download() {
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        const ext = this.format === 'png' ? 'png' : 'jpg';
        link.download = `360-panorama-${timestamp}.${ext}`;
        link.href = this.format === 'png' 
            ? this.canvas.toDataURL('image/png')
            : this.canvas.toDataURL('image/jpeg', 0.92);
        link.click();
    }
}

// Initialize
new MMStitcher();
