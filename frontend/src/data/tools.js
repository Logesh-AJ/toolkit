import {
  FiFileText, FiFile, FiImage, FiLayers, FiScissors, FiMinimize2,
  FiList, FiEye, FiEdit3, FiEdit, FiLock, FiUnlock, FiCamera,
  FiCrop, FiRepeat, FiFilm, FiVideo, FiMusic, FiHeadphones,
  FiGrid, FiFolder, FiPackage,
} from 'react-icons/fi'
import { BsQrCode } from 'react-icons/bs'

// Each tool maps to a route slug used for /tool/:slug
export const TOOL_CATEGORIES = [
  { id: 'pdf', label: 'PDF Tools' },
  { id: 'image', label: 'Image Tools' },
  { id: 'video', label: 'Video & Audio' },
  { id: 'utility', label: 'Utilities' },
]

export const TOOLS = [
  // ---------------- PDF ----------------
  { slug: 'pdf-to-word', name: 'PDF to Word', desc: 'Convert PDF files into editable Word documents.', icon: FiFileText, category: 'pdf', formats: ['.pdf'], popular: true },
  { slug: 'word-to-pdf', name: 'Word to PDF', desc: 'Turn DOC and DOCX files into polished PDFs.', icon: FiFile, category: 'pdf', formats: ['.doc', '.docx'], popular: true },
  { slug: 'image-to-pdf', name: 'JPG/PNG to PDF', desc: 'Combine images into a single PDF document.', icon: FiImage, category: 'pdf', formats: ['.jpg', '.jpeg', '.png'], popular: true },
  { slug: 'pdf-to-jpg', name: 'PDF to JPG', desc: 'Export every PDF page as a high-quality image.', icon: FiImage, category: 'pdf', formats: ['.pdf'] },
  { slug: 'merge-pdf', name: 'Merge PDFs', desc: 'Combine multiple PDFs into one document.', icon: FiLayers, category: 'pdf', formats: ['.pdf'], popular: true },
  { slug: 'split-pdf', name: 'Split PDF', desc: 'Extract pages into separate PDF files.', icon: FiScissors, category: 'pdf', formats: ['.pdf'] },
  { slug: 'compress-pdf', name: 'Compress PDF', desc: 'Shrink file size while keeping quality.', icon: FiMinimize2, category: 'pdf', formats: ['.pdf'], popular: true },
  { slug: 'reorder-pdf', name: 'Reorder / Delete Pages', desc: 'Rearrange or remove pages from a PDF.', icon: FiList, category: 'pdf', formats: ['.pdf'] },
  { slug: 'ocr-pdf', name: 'OCR Text Extraction', desc: 'Pull editable text from scans and images.', icon: FiEye, category: 'pdf', formats: ['.pdf', '.jpg', '.png'] },
  { slug: 'sign-pdf', name: 'Sign PDF', desc: 'Add a digital signature to any document.', icon: FiEdit3, category: 'pdf', formats: ['.pdf'] },
  { slug: 'fill-pdf', name: 'Fill PDF Forms', desc: 'Complete fillable PDF forms online.', icon: FiEdit, category: 'pdf', formats: ['.pdf'] },
  { slug: 'protect-pdf', name: 'Password Protect PDF', desc: 'Lock a PDF with a password.', icon: FiLock, category: 'pdf', formats: ['.pdf'] },
  { slug: 'unlock-pdf', name: 'Unlock PDF', desc: 'Remove a password from a protected PDF.', icon: FiUnlock, category: 'pdf', formats: ['.pdf'] },

  // ---------------- Image ----------------
  { slug: 'remove-background', name: 'Remove Background', desc: 'Cut out backgrounds from any image.', icon: FiImage, category: 'image', formats: ['.jpg', '.png'], popular: true },
  { slug: 'compress-image', name: 'Compress Images', desc: 'Reduce image file size with no visible loss.', icon: FiMinimize2, category: 'image', formats: ['.jpg', '.png', '.webp'], popular: true },
  { slug: 'convert-image', name: 'Convert Image Format', desc: 'Switch between PNG, JPG, and WEBP.', icon: FiRepeat, category: 'image', formats: ['.jpg', '.png', '.webp'] },
  { slug: 'resize-image', name: 'Resize / Crop Images', desc: 'Adjust dimensions or crop to size.', icon: FiCrop, category: 'image', formats: ['.jpg', '.png', '.webp'] },
  { slug: 'scan-to-pdf', name: 'Document Scanner', desc: 'Turn a photo of a document into a clean PDF.', icon: FiCamera, category: 'image', formats: ['.jpg', '.png'] },

  // ---------------- Video / Audio ----------------
  { slug: 'convert-video', name: 'Convert Video Format', desc: 'Change between MP4, MOV, AVI, and more.', icon: FiFilm, category: 'video', formats: ['.mp4', '.mov', '.avi', '.mkv'] },
  { slug: 'compress-video', name: 'Compress Video', desc: 'Shrink video size for easy sharing.', icon: FiMinimize2, category: 'video', formats: ['.mp4', '.mov'], popular: true },
  { slug: 'trim-video', name: 'Trim / Cut Video', desc: 'Cut a clip down to the part that matters.', icon: FiScissors, category: 'video', formats: ['.mp4', '.mov'] },
  { slug: 'extract-audio', name: 'Extract Audio', desc: 'Pull the audio track out of any video.', icon: FiHeadphones, category: 'video', formats: ['.mp4', '.mov'] },
  { slug: 'convert-audio', name: 'Convert Audio Format', desc: 'Switch between MP3, WAV, AAC, and more.', icon: FiMusic, category: 'video', formats: ['.mp3', '.wav', '.aac'] },

  // ---------------- Utility ----------------
  { slug: 'qr-generator', name: 'QR Code Generator', desc: 'Create a scannable QR code instantly.', icon: BsQrCode, category: 'utility', formats: ['text/url'], popular: true },
  { slug: 'zip-files', name: 'ZIP / Unzip Files', desc: 'Compress files or extract an archive.', icon: FiPackage, category: 'utility', formats: ['.zip', '.rar', 'any'] },
]

export const getToolBySlug = (slug) => TOOLS.find(t => t.slug === slug)
export const getPopularTools = () => TOOLS.filter(t => t.popular)
export const getToolsByCategory = (categoryId) => TOOLS.filter(t => t.category === categoryId)