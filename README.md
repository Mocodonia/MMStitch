# MMStitch 🌐

A browser-based tool for creating 360° panoramic images from cubemap faces. Built for MMView!

## Features

✨ **Fully Client-Side** - No server required, works completely in your browser  
📷 **Cubemap to Equirectangular** - Converts 6 cubemap faces into a seamless 360° panorama  
🎨 **Clean UI** - Modern, intuitive interface  
⚙️ **Customizable Output** - Choose resolution (2K-8K) and format (PNG/JPEG)  
💾 **Instant Download** - Save your panoramic images directly  
🚀 **GitHub Pages Ready** - Deploy anywhere static hosting is available

## How to Use

1. **Upload Images**: Click each slot to upload your 6 cubemap face images:
   - Front, Back, Left, Right, Top, Bottom
   - (Optional: 2 extra image slots for future features)

2. **Configure Settings** (optional):
   - Choose output resolution (2048px - 8192px)
   - Select format (PNG or JPEG)
   - Adjust JPEG quality if needed

3. **Stitch**: Click "Stitch Images" to convert to 360° panorama

4. **Download**: Save your equirectangular panoramic image

## Image Requirements

- **Format**: JPG, PNG, or other web-compatible formats
- **Face Orientation**: Standard cubemap layout
  - All faces should be square and the same size
  - Images should be oriented correctly for their position
- **Recommended Size**: 1024x1024 to 2048x2048 per face

## Technical Details

- Pure JavaScript (ES6+)
- HTML5 Canvas API for image processing
- No external dependencies
- Cubemap to equirectangular projection conversion
- Supports high-resolution output (up to 8K)

## Browser Compatibility

Works in all modern browsers that support:
- HTML5 Canvas
- FileReader API
- ES6 JavaScript

Tested in Chrome, Firefox, Safari, and Edge.

## License

GPL-3.0 License

## For MMView

This tool creates panoramic images specifically formatted for use in MMView's Google Street View-style interface.

---

Made with ❤️ for Mocodonia
