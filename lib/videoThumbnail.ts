// lib/videoThumbnail.ts
export function generateVideoThumbnail(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.muted = true;
    video.playsInline = true;

    const url = URL.createObjectURL(file);
    video.src = url;

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration * 0.1 || 0.1);
    };

    video.onseeked = () => {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        canvas.toBlob((blob) => {
          URL.revokeObjectURL(url);
          resolve(blob!);
        }, 'image/jpeg', 0.85);
      } else {
        URL.revokeObjectURL(url);
        reject(new Error('Canvas error'));
      }
    };

    video.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Video load error'));
    };
  });
}
