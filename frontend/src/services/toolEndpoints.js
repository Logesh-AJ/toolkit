// Maps each tool slug to its backend endpoint and request config.
// PDF group (merge, split, compress, pdf-to-jpg, images-to-pdf) is now live as of Phase 4.
// Remaining tools are wired progressively in later phases.

export const TOOL_ENDPOINTS = {
  'pdf-to-word': { endpoint: '/api/pdf/to-word', multiple: false },
  'word-to-pdf': { endpoint: '/api/pdf/from-word', multiple: false },
  'image-to-pdf': { endpoint: '/api/pdf/from-images', multiple: true },
  'pdf-to-jpg': { endpoint: '/api/pdf/to-jpg', multiple: false },
  'merge-pdf': { endpoint: '/api/pdf/merge', multiple: true },
  'split-pdf': { endpoint: '/api/pdf/split', multiple: false },
  'compress-pdf': { endpoint: '/api/pdf/compress', multiple: false },
  'reorder-pdf': { endpoint: '/api/pdf/reorder', multiple: false },
  'ocr-pdf': { endpoint: '/api/pdf/ocr', multiple: false },
  'sign-pdf': { endpoint: '/api/pdf/sign', multiple: false },
  'fill-pdf': { endpoint: '/api/pdf/fill', multiple: false },
  'protect-pdf': { endpoint: '/api/pdf/protect', multiple: false },
  'unlock-pdf': { endpoint: '/api/pdf/unlock', multiple: false },

  'remove-background': { endpoint: '/api/image/remove-background', multiple: false },
  'compress-image': { endpoint: '/api/image/compress', multiple: false },
  'convert-image': { endpoint: '/api/image/convert', multiple: false },
  'resize-image': { endpoint: '/api/image/resize', multiple: false },
  'scan-to-pdf': { endpoint: '/api/image/scan-to-pdf', multiple: false },

  'convert-video': { endpoint: '/api/video/convert', multiple: false },
  'compress-video': { endpoint: '/api/video/compress', multiple: false },
  'trim-video': { endpoint: '/api/video/trim', multiple: false },
  'extract-audio': { endpoint: '/api/video/extract-audio', multiple: false },
  'convert-audio': { endpoint: '/api/audio/convert', multiple: false },

  'qr-generator': { endpoint: '/api/qr/generate', multiple: false },
  'zip-files': { endpoint: '/api/archive/zip', multiple: true },
}

export function getToolEndpoint(slug) {
  return TOOL_ENDPOINTS[slug] || null
}