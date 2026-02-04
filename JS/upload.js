// Update debug status
document.getElementById('debug').textContent = 'Upload.js loaded ✓';
document.getElementById('debug').style.background = 'rgba(16, 185, 129, 0.3)';

// Global state for uploaded images
window.uploadedImages = {};
window.uploadedCount = 0;

// Face names
const FACES = ['front', 'back', 'left', 'right', 'top', 'bottom'];

// Setup upload handlers
function setupUploads() {
    FACES.forEach(face => {
        const input = document.getElementById(`input-${face}`);
        const box = document.getElementById(`box-${face}`);
        const thumb = document.getElementById(`thumb-${face}`);
        
        // When file input changes
        input.addEventListener('change', function(e) {
            const file = e.target.files[0];
            
            if (!file) {
                return;
            }
            
            if (!file.type.startsWith('image/')) {
                alert('Please select an image file');
                return;
            }
            
            // Read the file
            const reader = new FileReader();
            
            reader.onload = function(event) {
                // Create image object
                const img = new Image();
                
                img.onload = function() {
                    // Store the image
                    window.uploadedImages[face] = img;
                    
                    // Update count if this is a new upload
                    if (!box.classList.contains('has-image')) {
                        window.uploadedCount++;
                    }
                    
                    // Show thumbnail
                    thumb.src = event.target.result;
                    box.classList.add('has-image');
                    
                    // Update UI
                    updateUploadStatus();
                };
                
                img.src = event.target.result;
            };
            
            reader.readAsDataURL(file);
        });
    });
}

// Update the status bar
function updateUploadStatus() {
    const status = document.getElementById('status');
    const progress = document.getElementById('progress');
    const stitchBtn = document.getElementById('btn-stitch');
    
    status.textContent = `${window.uploadedCount}/6 images uploaded`;
    progress.style.width = (window.uploadedCount / 6 * 100) + '%';
    
    // Enable stitch button when all 6 images are uploaded
    stitchBtn.disabled = window.uploadedCount < 6;
}

// Clear all uploads
function clearUploads() {
    window.uploadedImages = {};
    window.uploadedCount = 0;
    
    FACES.forEach(face => {
        const input = document.getElementById(`input-${face}`);
        const box = document.getElementById(`box-${face}`);
        const thumb = document.getElementById(`thumb-${face}`);
        
        input.value = '';
        box.classList.remove('has-image');
        thumb.src = '';
    });
    
    updateUploadStatus();
}

// Initialize uploads when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', setupUploads);
} else {
    setupUploads();
}

// Export clear function for use by other scripts
window.clearUploads = clearUploads;
