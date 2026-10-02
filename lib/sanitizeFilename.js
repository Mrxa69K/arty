// photo.file_name is the browser File object's name at upload time —
// fully client-controlled. It lands unescaped inside a Content-Disposition
// header; a quote or CR/LF in it could break out of the filename="..."
// value or corrupt the header. Strip anything that isn't a safe filename
// character before it ever reaches a header.
export function sanitizeFilename(name) {
  return String(name).replace(/[\r\n"]/g, '_')
}

// Same client-controlled file_name, but destined for a zip entry/folder
// name instead of an HTTP header — a "../" here is the classic zip-slip
// primitive (lets extracted files land outside the target directory on
// whoever opens the zip). Flatten any path separators or leading dots.
export function sanitizeZipEntryName(name) {
  return String(name).replace(/[\r\n]/g, '_').replace(/[\\/]/g, '_').replace(/^\.+/, '_')
}
