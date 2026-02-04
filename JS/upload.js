// Update debug status
document.getElementById('debug').textContent = 'Upload.js loaded ✓';
document.getElementById('debug').style.background = 'rgba(16, 185, 129, 0.3)';

// Global state for uploaded images
window.uploadedImages = {};
window.uploadedCount = 0;

// Face names
const FACES = ['front', 'back', 'left', 'right', 'top', 'bottom'];

// Debug logger - shows messages on screen
function debugLog(message) {
    const debug = document.getElementById('debug');
    debug.textContent = message;
    console.log(message);
}

// Setup upload handlers
function setupUploads() {
    debugLog('Setting up upload handlers...');
    
    let handlersSetup = 0;
    
    FACES.forEach(face => {
        const input = document.getElementById(`input-${face}`);
        const box = document.getElementById(`box-${face}`);
        const thumb = document.getElementById(`thumb-${face}`);
        
        if (!input) {
            debugLog(`ERROR: input-${face} not found!`);
            return;
        }
        
        if (!box) {
            debugLog(`ERROR: box-${face} not found!`);
            return;
        }
        
        if (!thumb) {
            debugLog(`ERROR: thumb-${face} not found!`);
            return;
        }
        
        // When file input changes
        input.addEventListener('change', function(e) {
            debugLog(`File selected for ${face}!`);
            
            const file = e.target.files[0];
            
            if (!file) {
                debugLog(`No file selected for ${face}`);
                return;
            }
            
            debugLog(`File: ${file.name}, size: ${file.size}, type: ${file.type}`);
            
            if (!file.type.startsWith('image/')) {
                debugLog('ERROR: Not an image file!');
                alert('Please select an image file');
                return;
            }
            
            debugLog(`Reading ${face} image...`);
            
            // Read the file
            const reader = new FileReader();
            
            reader.onload = function(event) {
                debugLog(`FileReader finished for ${face}`);
                
                // Create image object
                const img = new Image();
                
                img.onload = function() {
                    debugLog(`Image loaded for ${face}: ${img.width}x${img.height}`);
                    
                    // Store the image
                    window.uploadedImages[face] = img;
                    
                    // Update count if this is a new upload
                    if (!box.classList.contains('has-image')) {
                        window.uploadedCount++;
                        debugLog(`Upload count: ${window.uploadedCount}`);
                    }
                    
                    // Show thumbnail
                    thumb.src = event.target.result;
                    box.classList.add('has-image');
                    
                    debugLog(`${face} uploaded successfully! Total: ${window.uploadedCount}/6`);
                    
                    // Update UI
                    updateUploadStatus();
                };
                
                img.onerror = function() {
                    debugLog(`ERROR: Failed to load image for ${face}`);
                };
                
                img.src = event.target.result;
            };
            
            reader.onerror = function() {
                debugLog(`ERROR: FileReader failed for ${face}`);
            };
            
            reader.readAsDataURL(file);
        });
        
        handlersSetup++;
    });
    
    debugLog(`${handlersSetup} upload handlers ready!`);
}

// Update the status bar
function updateUploadStatus() {
    const status = document.getElementById('status');
    const progress = document.getElementById('progress');
    const stitchBtn = document.getElementById('btn-stitch');
    
    if (!status || !progress || !stitchBtn) {
        debugLog('ERROR: Status elements not found!');
        return;
    }
    
    status.textContent = `${window.uploadedCount}/6 images uploaded`;
    progress.style.width = (window.uploadedCount / 6 * 100) + '%';
    
    // Enable stitch button when all 6 images are uploaded
    stitchBtn.disabled = window.uploadedCount < 6;
    
    debugLog(`UI updated: ${window.uploadedCount}/6 - Stitch button ${stitchBtn.disabled ? 'disabled' : 'enabled'}`);
}

// Clear all uploads
function clearUploads() {
    debugLog('Clearing all uploads...');
    
    window.uploadedImages = {};
    window.uploadedCount = 0;
    
    FACES.forEach(face => {
        const input = document.getElementById(`input-${face}`);
        const box = document.getElementById(`box-${face}`);
        const thumb = document.getElementById(`thumb-${face}`);
        
        if (input) input.value = '';
        if (box) box.classList.remove('has-image');
        if (thumb) thumb.src = '';
    });
    
    updateUploadStatus();
    debugLog('All uploads cleared');
}

// Initialize uploads when DOM is ready
if (document.readyState === 'loading') {
    debugLog('Waiting for DOM...');
    document.addEventListener('DOMContentLoaded', setupUploads);
} else {
    debugLog('DOM already loaded');
    setupUploads();
}

// Export clear function for use by other scripts
window.clearUploads = clearUploads;
