const express = require('express');
const router = express.Router();
const { spawn, exec } = require('child_process');
const path = require('path');
const multer = require('multer');
const fs = require('fs');

const uploadDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_')),
});

const upload = multer({ storage });

router.post('/', upload.single('pdf'), (req, res) => {
    res.setHeader('Content-Type', 'text/plain');
    res.setHeader('Transfer-Encoding', 'chunked');

    const { grade, subject, medium, category, startPage, endPage } = req.body;
    const filePath = req.file.path;
    const metaData = JSON.stringify({ grade, subject, medium, category });

    console.log(`🚀 Starting ingestion for: ${req.file.originalname}`);

    const pythonProcess = spawn('python', [
        path.join(__dirname, '../scripts/ingest.py'),
        filePath,
        startPage,
        endPage,
        metaData
    ]);

    pythonProcess.stdout.on('data', (data) => res.write(data.toString()));
    pythonProcess.stderr.on('data', (data) => res.write(`LOG: ${data.toString()}`));

    // --- STOP BUTTON LOGIC (FORCE KILL) ---
    req.on('close', () => {
        if (!pythonProcess.killed) {
            console.log("🛑 Client Stop Requested. Killing Python Process...");
            exec(`taskkill /pid ${pythonProcess.pid} /f /t`, (err) => {
                if (err) pythonProcess.kill('SIGKILL'); // Fallback
            });
        }
    });

    pythonProcess.on('close', (code) => {
        console.log(`Process exited with code ${code}`);
        fs.unlink(filePath, () => {}); 
        if (!res.writableEnded) res.end();
    });
});

module.exports = router;