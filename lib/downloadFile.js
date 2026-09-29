// Saves a single file to the visitor's device, preferring the native share
// sheet when the browser supports sharing files (iOS Safari: this surfaces a
// direct "Save Image" action that writes to the Photos app — the classic
// <a download> trick instead saves to the Files app, which most people
// don't expect and have trouble finding again).
//
// Not used for zip downloads: a zip isn't an image, so iOS's share sheet
// has nothing better to offer for it than the plain "Save to Files" option
// a normal download link already gives for free.
export async function saveFileToDevice(blob, filename) {
  const file = new File([blob], filename, { type: blob.type })

  if (navigator.canShare && navigator.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file] })
      return 'shared'
    } catch (err) {
      if (err.name === 'AbortError') return 'cancelled'
      // Any other share failure — fall through to the classic download below.
    }
  }

  const blobUrl = window.URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = blobUrl
  link.download = filename
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  setTimeout(() => { document.body.removeChild(link); window.URL.revokeObjectURL(blobUrl) }, 100)
  return 'downloaded'
}
