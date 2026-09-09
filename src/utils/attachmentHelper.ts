import { Attachment } from '../types';

/**
 * Open attachment base64 file (PDF, Image, or general document) inside a clean separate new tab.
 * This bypasses native iframe embedding blocks inside containers/sandboxes.
 */
export const openAttachmentInNewTab = async (file: Attachment) => {
  // If it is a physically stored file
  if (file.savedFileName) {
    const electronAPI = (window as any).electronAPI;
    if (electronAPI) {
      try {
        const result = await electronAPI.openAttachment(file.savedFileName);
        if (!result.success) {
          alert(`ফাইল খুলতে সমস্যা হয়েছে: ${result.error}`);
        }
      } catch (e) {
        console.error('Failed to open attachment via IPC:', e);
      }
      return;
    }
  }

  // Fallback for old base64 based files
  let rawData = (file as any).base64Data || file.url;
  if (!rawData) {
    // Generate static content if empty
    rawData = 'data:text/plain;base64,RmlsZSBjb250ZW50IGlzIGVtcHR5Lg==';
  }
  
  try {
    // Detect binary parts of the base64 URL
    const parts = rawData.split(',');
    if (parts.length < 2) throw new Error("Invalid base64 string");
    const mimeString = parts[0].split(':')[1].split(';')[0];
    const byteString = atob(parts[1]);
    
    // Create modern blob to bypass sandbox issues
    const ab = new ArrayBuffer(byteString.length);
    const ia = new Uint8Array(ab);
    for (let i = 0; i < byteString.length; i++) {
      ia[i] = byteString.charCodeAt(i);
    }
    
    const blob = new Blob([ab], { type: mimeString });
    const blobURL = URL.createObjectURL(blob);
    
    // Attempt standard tab launch
    const newTab = window.open(blobURL, '_blank');
    if (!newTab) {
      const anchor = document.createElement('a');
      anchor.href = blobURL;
      anchor.target = '_blank';
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
    }
  } catch (e) {
    console.error('Failed to open attachment in new tab:', e);
    // Standard data URL fallback
    window.open(rawData, '_blank');
  }
};
