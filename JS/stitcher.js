class MMStitcher {
    constructor() {
        this.images = {};
        this.canvas = document.getElementById('preview-canvas');
        this.ctx = this.canvas.getContext('2d');
        this.setupEventListeners();
    }

    setupEventListeners() {
        const inputs = document.querySelectorAll('input[type="file"]');
        inputs.forEach(input => {
            input.addEventListener('change', (e) => this.handleImageUpload(e));
        });

        document.getElementById('stitch-btn').addEventListener('click', () => this.stitch());
        document.getElementById('download-btn').addEventListener('click', () => this.download());
    }

    handleImageUpload(event) {
        const file = event.target.files[0];
        const position = event.target.id.replace('img-', '');
        
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                const img = new Image();
                img.onload = () => {
                    this.images[position] = img;
                    this.updateUI();
                };
                img.src = e.target.result;
            };
            reader.readAsDataURL(file);
        }
    }

    updateUI() {
        const uploadedCount = Object.keys(this.images).length;
        document.getElementById('stitch-btn').disabled = uploadedCount < 6; // Minimum 6 for cubemap
    }

    stitch() {
        // Set canvas size for equirectangular output (2:1 ratio)
        this.canvas.width = 2048;
        this.canvas.height = 1024;

        // This is a simplified example - actual cubemap-to-equirectangular
        // conversion requires proper UV mapping
        this.convertCubemapToEquirectangular();
        
        document.getElementById('download-btn').disabled = false;
    }

    convertCubemapToEquirectangular() {
        const width = this.canvas.width;
        const height = this.canvas.height;

        // For each pixel in the equirectangular image
        for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
                // Convert pixel coordinates to spherical coordinates
                const theta = (x / width) * 2 * Math.PI;
                const phi = (y / height) * Math.PI;

                // Convert spherical to Cartesian coordinates
                const dx = Math.sin(phi) * Math.cos(theta);
                const dy = Math.cos(phi);
                const dz = Math.sin(phi) * Math.sin(theta);

                // Determine which cube face this maps to
                const face = this.selectCubeFace(dx, dy, dz);
                const uv = this.getCubeFaceUV(dx, dy, dz, face);

                // Sample from the appropriate source image
                this.sampleAndDraw(face, uv, x, y);
            }
        }
    }

    selectCubeFace(x, y, z) {
        const absX = Math.abs(x);
        const absY = Math.abs(y);
        const absZ = Math.abs(z);

        if (absX >= absY && absX >= absZ) return x > 0 ? 'right' : 'left';
        if (absY >= absX && absY >= absZ) return y > 0 ? 'top' : 'bottom';
        return z > 0 ? 'front' : 'back';
    }

    getCubeFaceUV(x, y, z, face) {
        // Map 3D direction to 2D UV coordinates on cube face
        // This is simplified - you'll need proper math here
        return { u: 0.5, v: 0.5 };
    }

    sampleAndDraw(face, uv, x, y) {
        const img = this.images[face];
        if (!img) return;

        const srcX = uv.u * img.width;
        const srcY = uv.v * img.height;

        const imageData = this.ctx.createImageData(1, 1);
        // Sample pixel from source image
        // (Simplified - actual implementation needs proper pixel sampling)
        
        this.ctx.putImageData(imageData, x, y);
    }

    download() {
        const link = document.createElement('a');
        link.download = '360-panorama.png';
        link.href = this.canvas.toDataURL();
        link.click();
    }
}

// Initialize
new MMStitcher();
