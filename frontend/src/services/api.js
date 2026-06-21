import axios from 'axios'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

export const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 120000, // 2 min for large file processing
})

/**
 * Upload one or more files to a tool endpoint with progress tracking.
 *
 * @param {string} endpoint - e.g. '/api/pdf/merge'
 * @param {File[]} files - array of File objects
 * @param {object} extraFields - additional form fields (e.g. { password: '1234' })
 * @param {(percent: number) => void} onProgress
 */
export async function uploadFiles(endpoint, files, extraFields = {}, onProgress) {
  const formData = new FormData()

  files.forEach((file) => {
    formData.append(files.length > 1 ? 'files' : 'file', file)
  })

  Object.entries(extraFields).forEach(([key, value]) => {
    formData.append(key, value)
  })

  const response = await api.post(endpoint, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        const percent = Math.round((event.loaded * 100) / event.total)
        onProgress(percent)
      }
    },
  })

  return response.data
}

/**
 * Build a full download URL from a relative path returned by the backend.
 */
export function getDownloadUrl(relativePath) {
  if (!relativePath) return null
  if (relativePath.startsWith('http')) return relativePath
  return `${API_BASE_URL}${relativePath}`
}

export default api