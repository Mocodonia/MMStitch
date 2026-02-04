// ===============================
// MMStitch Upload Handler (Fixed)
// ===============================

// Debug indicator
const debug = document.getElementById('debug');
debug.textContent = 'Upload.js loaded ✓';
debug.style.background = 'rgba(16, 185, 129, 0.3)';

// Required faces for stitching
const REQUIRED_FACES = ['front', 'back', 'left', 'right'];
const OPTIONAL_FACES = ['top', 'bottom'];
const ALL_FACES = [...REQUIRED_FACES, ...OPTIONAL_FACES];

// Global state
window.uploadedImages = {};
window.uploadedCount = 0;

// Debug logger
function debugLog(msg) {
    console.log(msg);
    debug.textContent = msg;
}

// Setup upload handlers
function setupUploads() {
    debugLog('Setting up upload handlers...');

    ALL_FACES.forEach(face => {
        const input = document.getElementById(`input-${face}`);
        const box = document.getElementById(`box-${face}`);
        const thumb = document.getElementById(`thumb-${face}`);

        if (!input || !box || !thumb) return;

        // Clicking the box opens the file picker
        box.addEventListener('click', () => input.click());

        // When a file is selected
        input.addEventListener('change', e => {
            const file = e.target.files[0];
            if (!file) return;

            if (!file.type.startsWith('image/')) {
                alert('Please upload an image file');
                return;
            }

            const reader = new FileReader();
            reader.onload = event => {
                const img = new Image();
                img.onload = () => {
                    window.uploadedImages[face] = img;

                    // Count only if first time uploading this face
                    if (!box.classList.contains('has-image')) {
                        window.uploadedCount++;
                    }

                    // Show thumbnail
                    thumb.src = event.target.result;
                    thumb.style.display = 'block';
                    box.classList.add('has-image');

                    updateUploadStatus();
                };
                img.src = event.target.result;
            };

            reader.readAsDataURL(file);
        });
    });

    updateUploadStatus();
}

// Update UI status
function updateUploadStatus() {
    const status = document.getElementById('status');
    const progress = document.getElementById('progress');
    const stitchBtn = document.getElementById('btn-stitch');

    const requiredUploaded = REQUIRED_FACES.filter(f => window.uploadedImages[f]).length;

    status.textContent = `${requiredUploaded}/4 required images uploaded`;
    progress.style.width = (requiredUploaded / 4 * 100) + '%';

    stitchBtn.disabled = requiredUploaded < 4;
}

// Clear all uploads
function clearUploads() {
    window.uploadedImages = {};
    window.uploadedCount = 0;

    ALL_FACES.forEach(face => {
        const input = document.getElementById(`input-${face}`);
        const box = document.getElementById(`box-${face}`);
        const thumb = document.getElementById(`thumb-${face}`);

        if (input) input.value = '';
        if (box) box.classList.remove('has-image');
        if (thumb) {
            thumb.src = '';
            thumb.style.display = 'none';
        }
    });

    updateUploadStatus();
}

// Expose clear function
window.clearUploads = clearUploads;

// Initialize
document.addEventListener('DOMContentLoaded', setupUploads);
