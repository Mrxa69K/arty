// iPadOS Safari reports navigator.platform as "MacIntel" just like a real Mac —
// maxTouchPoints > 1 is the standard way to tell an iPad apart from an actual
// Mac, which has no touch points.
function isIOS() {
  if (typeof navigator === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) ||
    (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1)
}

// Saves a single file to the visitor's device, preferring the native share
// sheet on iOS specifically (this surfaces a direct "Save Image" action that
// writes to the Photos app — the classic <a download> trick instead saves to
// the Files app, which most people don't expect and have trouble finding
// again). Desktop browsers (macOS Safari/Chrome included) also implement
// navigator.canShare({files}) now, which without this platform check pops
// the OS-level share sheet instead of just downloading the file — worse than
// the plain download desktop users actually expect, so it's gated to iOS only.
//
// Not used for zip downloads: a zip isn't an image, so iOS's share sheet
// has nothing better to offer for it than the plain "Save to Files" option
// a normal download link already gives for free.
export async function saveFileToDevice(blob, filename) {
  const file = new File([blob], filename, { type: blob.type })

  if (isIOS() && navigator.canShare && navigator.canShare({ files: [file] })) {
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
