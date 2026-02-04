console.log('MMStitcher script loaded');

class MMStitcher {
    constructor() {
        console.log('MMStitcher constructor called');
        
        this.images = {};
        this.requiredFaces = ['front', 'back', 'left', 'right', 'top', 'bottom'];
        this.canvas = document.getElementById('preview-canvas');
        this.ctx = this.canvas.getContext('2d', { willReadFrequently: true });
        this.outputWidth = 4096;
        this.outputHeight = 2048;
        this.outputFormat = 'jpeg';
        this.jpegQuality = 0.92;
        
        console.log('Calling setupEventListeners...');
        this.setupEventListeners();
        console.log('Setup complete');
    }

    setupEventListeners() {
        // Image upload handlers
        const inputs = document.querySelectorAll('input[type="file"]');
        console.log(`Found ${inputs.length} file inputs`);
        
        inputs.forEach((input, index) => {
            console.log(`Setting up listener for input ${index}: ${input.id}`);
            input.addEventListener('change', (e) => {
                console.log(`File input changed: ${e.target.id}`);
                this.handleImageUpload(e);
            });
        });

        // Make labels clickable
        const labels = document.querySelectorAll('.upload-slot label');
        console.log(`Found ${labels.length} labels`);
        labels.forEach((label, index) => {
            label.addEventListener('click', (e) => {
                console.log(`Label clicked: ${index}`);
            });
        });

        // Make thumbnails clickable to re-upload
        document.querySelectorAll('.preview-thumb').forEach(thumb => {
            thumb.addEventListener('click', (e) => {
                e.stopPropagation();
                const position = e.target.id.replace('thumb-', '');
                console.log(`Thumbnail clicked for ${position}`);
                document.getElementById(`img-${position}`).click();
            });
        });

        // Button handlers
        const stitchBtn = document.getElementById('stitch-btn');
        const downloadBtn = document.getElementById('download-btn');
        const clearBtn = document.getElementById('clear-btn');
        
        console.log('Stitch button:', stitchBtn);
        console.log('Download button:', downloadBtn);
        console.log('Clear button:', clearBtn);
        
        stitchBtn.addEventListener('click', () => {
            console.log('Stitch button clicked');
            this.stitch();
        });
        
        downloadBtn.addEventListener('click', () => {
            console.log('Download button clicked');
            this.download();
        });
        
        clearBtn.addEventListener('click', () => {
            console.log('Clear button clicked');
            this.clearAll();
        });

        // Settings handlers
        document.getElementById('output-width').addEventListener('change', (e) => {
            this.outputWidth = parseInt(e.target.value);
            this.outputHeight = this.outputWidth / 2;
            console.log(`Output size changed to ${this.outputWidth}x${this.outputHeight}`);
        });

        document.getElementById('output-format').addEventListener('change', (e) => {
            this.outputFormat = e.target.value;
            document.getElementById('quality-group').style.display = 
                e.target.value === 'jpeg' ? 'flex' : 'none';
            console.log(`Format changed to ${this.outputFormat}`);
        });

        document.getElementById('jpeg-quality').addEventListener('input', (e) => {
            this.jpegQuality = e.target.value / 100;
            document.getElementById('quality-value').textContent = e.target.value + '%';
        });
    }

    handleImageUpload(event) {
        console.log('handleImageUpload called', event);
        
        const file = event.target.files[0];
        const position = event.target.id.replace('img-', '');
        
        console.log(`Position: ${position}`);
        console.log(`File:`, file);
        
        if (!file) {
            console.log('No file selected');
            return;
        }
        
        // Validate it's an image
        if (!file.type.startsWith('image/')) {
            console.error('File is not an image:', file.type);
            alert('Please upload an image file');
            return;
        }
        
        console.log(`Reading file: ${file.name}, type: ${file.type}, size: ${file.size} bytes`);
        
        const reader = new FileReader();
        
        reader.onload = (e) => {
            console.log(`FileReader loaded for ${position}`);
            
            const img = new Image();
            
            img.onload = () => {
                console.log(`Image loaded for ${position}: ${img.width}x${img.height}`);
                this.images[position] = img;
                this.showThumbnail(position, e.target.result);
                this.updateUI();
            };
            
            img.onerror = (err) => {
                console.error(`Failed to load image for ${position}:`, err);
                alert('Failed to load image');
            };
            
            img.src = e.target.result;
        };
        
        reader.onerror = (err) => {
            console.error('FileReader error:', err);
            alert('Failed to read file');
        };
        
        reader.readAsDataURL(file);
    }

    showThumbnail(position, src) {
        console.log(`showThumbnail called for ${position}`);
        
        const thumb = document.getElementById(`thumb-${position}`);
        const slot = thumb ? thumb.parentElement : null;
        
        console.log('Thumb element:', thumb);
        console.log('Slot element:', slot);
        
        if (thumb && slot) {
            thumb.style.backgroundImage = `url(${src})`;
            thumb.style.display = 'block';
            slot.classList.add('uploaded');
            console.log(`Thumbnail set for ${position}`);
        } else {
            console.error(`Could not find elements for ${position}`);
        }
    }

    updateUI() {
        console.log('updateUI called');
        console.log('Current images:', Object.keys(this.images));
        
        const uploadedRequired = this.requiredFaces.filter(face => this.images[face]).length;
        const totalRequired = this.requiredFaces.length;
        
        console.log(`Uploaded: ${uploadedRequired}/${totalRequired}`);
        
        // Update progress bar
        const progress = (uploadedRequired / totalRequired) * 100;
        document.getElementById('upload-progress').style.width = progress + '%';
        
        // Update status text
        document.getElementById('upload-status').textContent = 
            `${uploadedRequired}/${totalRequired} required images uploaded`;
        
        // Enable stitch button if all required images are uploaded
        const stitchBtn = document.getElementById('stitch-btn');
        stitchBtn.disabled = uploadedRequired < totalRequired;
        console.log(`Stitch button disabled: ${stitchBtn.disabled}`);
    }

    clearAll() {
        console.log('clearAll called');
        this.images = {};
        
        // Clear all thumbnails and states
        document.querySelectorAll('.upload-slot').forEach(slot => {
            slot.classList.remove('uploaded');
        });
        
        document.querySelectorAll('.preview-thumb').forEach(thumb => {
            thumb.style.backgroundImage = '';
            thumb.style.display = 'none';
        });
        
        document.querySelectorAll('input[type="file"]').forEach(input => {
            input.value = '';
        });
        
        // Clear canvas
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        this.updateUI();
        document.getElementById('download-btn').disabled = true;
    }

    async stitch() {
        console.log('stitch() called');
        
        // Show loading
        document.getElementById('loading').classList.add('active');
        document.getElementById('stitch-btn').disabled = true;
        
        // Small delay to allow UI to update
        await new Promise(resolve => setTimeout(resolve, 100));
        
        try {
            // Set canvas size
            this.canvas.width = this.outputWidth;
            this.canvas.height = this.outputHeight;
            
            console.log(`Starting stitch at ${this.outputWidth}x${this.outputHeight}`);
            
            // Perform the conversion
            await this.convertCubemapToEquirectangular();
            
            console.log('Stitching complete!');
            
            // Enable download button
            document.getElementById('download-btn').disabled = false;
        } catch (error) {
            console.error('Stitching error:', error);
            alert('Error stitching images. Please check console for details.');
        } finally {
            // Hide loading
            document.getElementById('loading').classList.remove('active');
            document.getElementById('stitch-btn').disabled = false;
        }
    }

    async convertCubemapToEquirectangular() {
        const width = this.canvas.width;
        const height = this.canvas.height;
        
        console.log('Creating face canvases...');
        
        // Create temporary canvases for sampling
        this.faceCanvases = {};
        this.faceContexts = {};
        
        for (let face of this.requiredFaces) {
            if (this.images[face]) {
                const tempCanvas = document.createElement('canvas');
                const img = this.images[face];
                tempCanvas.width = img.width;
                tempCanvas.height = img.height;
                const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
                tempCtx.drawImage(img, 0, 0);
                
                this.faceCanvases[face] = tempCanvas;
                this.faceContexts[face] = tempCtx;
                console.log(`Created canvas for ${face}: ${img.width}x${img.height}`);
            }
        }
        
        console.log('Starting pixel conversion...');
        
        // Process in chunks to avoid blocking UI
        const chunkSize = 10; // Process 10 rows at a time
        for (let y = 0; y < height; y += chunkSize) {
            const endY = Math.min(y + chunkSize, height);
            
            for (let row = y; row < endY; row++) {
                for (let x = 0; x < width; x++) {
                    const pixel = this.sampleEquirectangular(x, row, width, height);
                    if (pixel) {
                        this.ctx.fillStyle = `rgba(${pixel[0]},${pixel[1]},${pixel[2]},${pixel[3] / 255})`;
                        this.ctx.fillRect(x, row, 1, 1);
                    }
                }
            }
            
            // Log progress
            if (y % 200 === 0) {
                console.log(`Progress: ${Math.round((y / height) * 100)}%`);
            }
            
            // Allow UI updates between chunks
            if (y % 100 === 0) {
                await new Promise(resolve => setTimeout(resolve, 0));
            }
        }
        
        console.log('Pixel conversion complete');
    }

    sampleEquirectangular(x, y, width, height) {
        // Convert pixel coordinates to spherical coordinates
        const u = x / width;
        const v = y / height;
        
        const theta = u * Math.PI * 2; // Longitude: 0 to 2π
        const phi = v * Math.PI;        // Latitude: 0 to π
        
        // Convert spherical to Cartesian coordinates (unit sphere)
        const sinPhi = Math.sin(phi);
        const dx = sinPhi * Math.sin(theta);
        const dy = Math.cos(phi);
        const dz = sinPhi * Math.cos(theta);
        
        // Determine which cube face this maps to
        const face = this.selectCubeFace(dx, dy, dz);
        const uv = this.getCubeFaceUV(dx, dy, dz, face);
        
        // Sample from the appropriate source image
        return this.sampleFromFace(face, uv.u, uv.v);
    }

    selectCubeFace(x, y, z) {
        const absX = Math.abs(x);
        const absY = Math.abs(y);
        const absZ = Math.abs(z);
        
        if (absX >= absY && absX >= absZ) {
            return x > 0 ? 'right' : 'left';
        }
        if (absY >= absX && absY >= absZ) {
            return y > 0 ? 'top' : 'bottom';
        }
        return z > 0 ? 'back' : 'front';
    }

    getCubeFaceUV(x, y, z, face) {
        let u, v;
        
        switch(face) {
            case 'front': // +Z
                u = (-x / z + 1) / 2;
                v = (-y / z + 1) / 2;
                break;
            case 'back': // -Z
                u = (x / -z + 1) / 2;
                v = (-y / -z + 1) / 2;
                break;
            case 'left': // -X
                u = (z / -x + 1) / 2;
                v = (-y / -x + 1) / 2;
                break;
            case 'right': // +X
                u = (-z / x + 1) / 2;
                v = (-y / x + 1) / 2;
                break;
            case 'top': // +Y
                u = (-x / y + 1) / 2;
                v = (z / y + 1) / 2;
                break;
            case 'bottom': // -Y
                u = (-x / -y + 1) / 2;
                v = (-z / -y + 1) / 2;
                break;
        }
        
        return { u, v };
    }

    sampleFromFace(face, u, v) {
        const ctx = this.faceContexts[face];
        if (!ctx) return null;
        
        const canvas = this.faceCanvases[face];
        const x = Math.floor(u * (canvas.width - 1));
        const y = Math.floor(v * (canvas.height - 1));
        
        try {
            const imageData = ctx.getImageData(x, y, 1, 1);
            return imageData.data;
        } catch (e) {
            return null;
        }
    }

    download() {
        console.log('download() called');
        
        const link = document.createElement('a');
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
        const extension = this.outputFormat === 'png' ? 'png' : 'jpg';
        
        link.download = `360-panorama-${timestamp}.${extension}`;
        
        if (this.outputFormat === 'png') {
            link.href = this.canvas.toDataURL('image/png');
        } else {
            link.href = this.canvas.toDataURL('image/jpeg', this.jpegQuality);
        }
        
        console.log(`Downloading as ${link.download}`);
        link.click();
    }
}

// Initialize when DOM is ready
console.log('Document readyState:', document.readyState);

function initMMStitcher() {
    console.log('Initializing MMStitcher...');
    window.stitcher = new MMStitcher();
    console.log('MMStitcher initialized:', window.stitcher);
}

if (document.readyState === 'loading') {
    console.log('Waiting for DOMContentLoaded...');
    document.addEventListener('DOMContentLoaded', initMMStitcher);
} else {
    console.log('DOM already loaded, initializing now...');
    initMMStitcher();
}
