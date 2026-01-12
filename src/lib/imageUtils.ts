/**
 * Utility functions for image processing
 * Includes EXIF metadata stripping for privacy protection
 */

/**
 * Strips EXIF metadata from an image file
 * This removes GPS coordinates, device info, timestamps, etc.
 * @param file - The image file to process
 * @returns A new Blob with EXIF data removed
 */
export const stripExifData = async (file: File): Promise<Blob> => {
  // Only process JPEG files (EXIF is primarily in JPEGs)
  if (!file.type.includes('jpeg') && !file.type.includes('jpg')) {
    // For non-JPEG files (PNG, etc.), return as-is
    // PNG doesn't typically have EXIF data
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = async (e) => {
      try {
        const arrayBuffer = e.target?.result as ArrayBuffer;
        const dataView = new DataView(arrayBuffer);
        
        // Check if it's a valid JPEG
        if (dataView.getUint16(0) !== 0xFFD8) {
          resolve(file);
          return;
        }

        // Find and remove EXIF segment
        const cleanedBuffer = removeExifFromBuffer(arrayBuffer);
        const blob = new Blob([cleanedBuffer], { type: file.type });
        resolve(blob);
      } catch (error) {
        // If EXIF removal fails, return original file
        console.warn('Could not remove EXIF data, using original:', error);
        resolve(file);
      }
    };
    
    reader.onerror = () => {
      console.warn('Failed to read file for EXIF removal');
      resolve(file);
    };
    
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Removes EXIF segment from JPEG buffer
 * JPEG structure: SOI (FFD8) -> segments -> image data -> EOI (FFD9)
 * EXIF is stored in APP1 segment (FFE1)
 */
function removeExifFromBuffer(buffer: ArrayBuffer): ArrayBuffer {
  const view = new DataView(buffer);
  const pieces: ArrayBuffer[] = [];
  let offset = 0;
  
  // Add SOI marker (Start of Image)
  pieces.push(buffer.slice(0, 2));
  offset = 2;
  
  while (offset < buffer.byteLength - 1) {
    // Check for marker
    if (view.getUint8(offset) !== 0xFF) {
      // Not a marker, add rest of file
      pieces.push(buffer.slice(offset));
      break;
    }
    
    const marker = view.getUint8(offset + 1);
    
    // End of markers or start of scan data
    if (marker === 0xDA || marker === 0xD9) {
      // Add rest of file (actual image data)
      pieces.push(buffer.slice(offset));
      break;
    }
    
    // Check segment length
    if (offset + 4 > buffer.byteLength) {
      pieces.push(buffer.slice(offset));
      break;
    }
    
    const segmentLength = view.getUint16(offset + 2);
    const segmentEnd = offset + 2 + segmentLength;
    
    // Skip APP1 (EXIF) and APP2 (ICC) segments for privacy
    if (marker === 0xE1 || marker === 0xE2) {
      // Skip this segment (contains EXIF or ICC profile)
      offset = segmentEnd;
      continue;
    }
    
    // Keep other segments
    pieces.push(buffer.slice(offset, segmentEnd));
    offset = segmentEnd;
  }
  
  // Combine all pieces
  const totalLength = pieces.reduce((sum, piece) => sum + piece.byteLength, 0);
  const result = new Uint8Array(totalLength);
  let position = 0;
  
  for (const piece of pieces) {
    result.set(new Uint8Array(piece), position);
    position += piece.byteLength;
  }
  
  return result.buffer;
}
