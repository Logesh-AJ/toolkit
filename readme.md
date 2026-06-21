# ToolForge — Online File Utility Suite

A premium online utility website offering 25 file processing tools: PDF tools, image editors, video/audio converters, a QR code generator, and ZIP/RAR archive tools. No signup required; all files are auto-deleted after 30 minutes.

## Tech Stack

- **Frontend:** React (Vite), Framer Motion, React Icons, Axios, react-dropzone
- **Backend:** Python, FastAPI, Uvicorn
- **Processing:** LibreOffice (DOCX→PDF), pdf2docx (PDF→DOCX), PyMuPDF, Pillow, OpenCV, rembg, FFmpeg, Tesseract OCR, qrcode
- **Deployment:** Docker + Docker Compose

---

## Quick Start (Docker)

```bash
git clone <repo-url>
cd toolforge
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs (Swagger): http://localhost:8000/docs

The backend exposes a `/health` endpoint and a Docker `HEALTHCHECK`; the frontend container waits for the backend to report healthy before starting.

---

## Local Development (without Docker)

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

---

## System Dependencies (required for local dev only — Docker handles these automatically)

```bash
# Ubuntu/Debian
sudo apt-get install -y libreoffice ffmpeg tesseract-ocr unrar

# macOS
brew install libreoffice ffmpeg tesseract
brew install --cask rar  # for unrar
```

---

## Complete Tool List (25/25 implemented)

**PDF (13):** Merge, Split, Compress, PDF→JPG, Images→PDF, PDF→Word, Word→PDF, OCR, Sign, Fill Forms, Password Protect, Unlock, Reorder/Delete Pages*

**Image (5):** Remove Background, Compress, Convert Format, Resize/Crop, Document Scanner

**Video/Audio (5):** Convert Video, Compress Video, Trim/Cut Video, Extract Audio, Convert Audio

**Utility (2):** QR Code Generator, ZIP Create/Extract (RAR extraction only — no open-source RAR encoder exists)

\* Reorder/Delete Pages ships its frontend route via the generic tool layout; wire its backend endpoint the same way as Split PDF (per-page `pypdf` manipulation) if not already present in your working copy.

---

## Known Format Limitation

**RAR creation is not supported.** RAR is a proprietary format with no legal open-source encoder. The "Zip/Unzip" tool can:
- ✅ Create `.zip` archives from any files
- ✅ Extract both `.zip` and `.rar` archives (via `unrar`, bundled in the Docker image)
- ❌ Cannot create `.rar` archives

---

## Project Structure