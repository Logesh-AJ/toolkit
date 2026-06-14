# ToolForge — Online File Utility Suite

A premium online utility website offering 25 file processing tools including PDF tools, image editors, video converters, QR generators, and more.

## Tech Stack

- **Frontend:** React (Vite), Framer Motion, React Icons, Axios
- **Backend:** Python, FastAPI, Uvicorn
- **Processing:** LibreOffice, PyMuPDF, Pillow, FFmpeg, Tesseract OCR
- **Deployment:** Docker + Docker Compose

---

## Quick Start (Docker)

```bash
# Clone and enter the project
git clone <repo-url>
cd toolforge

# Start everything
docker-compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:8000
- API Docs: http://localhost:8000/docs

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

## System Dependencies

Install these on your OS before running locally (Docker handles them automatically):

```bash
# Ubuntu/Debian
sudo apt-get install -y libreoffice ffmpeg tesseract-ocr

# macOS
brew install libreoffice ffmpeg tesseract
```

---

## Project Structure