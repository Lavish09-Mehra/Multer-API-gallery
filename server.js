// ============================================================
// IMAGE GALLERY API - Built with Express + Multer
// ------------------------------------------------------------
// Multer is a Node.js middleware for handling multipart/form-data
// (file uploads). The main Multer flow you are learning:
//
//     upload.single()  ->  upload.array()  ->  req.file  ->  req.files
//     fileFilter       ->  limits          ->  File deletion
//
// Routes to remember:
//     POST   /images/upload       upload 1..10 images
//     GET    /images              list all images
//     GET    /images/:filename    view a single image
//     DELETE /images/:filename    delete a single image
// ============================================================

// --- 1. Imports ---------------------------------------------------
// express  : web framework -> creates the server + routing
// multer   : file upload middleware -> parses multipart/form-data
// path     : works with file paths safely across Windows/Linux/Mac
// fs/promises : file SYSTEM as promises -> readdir, unlink, etc.
// fileURLToPath : converts the ESM module URL into a real path
import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { fileURLToPath } from 'url';

// --- 2. Create the Express app + basic config --------------------
const app = express();       // our server object
const PORT = 3000;           // port the server listens on

// `__dirname` exists in CommonJS but NOT in ES modules (we use
// "type": "module"). So we rebuild it manually:
//   import.meta.url  -> file:///C:/.../server.js
//   fileURLToPath()  -> C:/.../server.js
//   path.dirname()   -> C:/.../server.js  (the folder)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOADS_DIR = path.join(__dirname, 'uploads');

// `recursive: true` => create the folder IF it does not exist
// (no error if it already exists). Keeps uploads/ available on boot.
await fs.mkdir(UPLOADS_DIR, { recursive: true });

// --- 3. Multer storage ENGINES ------------------------------------
// Multer needs somewhere to store files. Two options:
//   1. multer.diskStorage()  -> saves files to real disk (we use this)
//   2. multer.memoryStorage()-> keeps files in RAM (for Cloudinary etc.)
// diskStorage takes an object with destination() and filename().
const storage = multer.diskStorage({
    // destination() decides WHICH folder the file lands in.
    //   cb(error, folderPath) - call cb(null, path) on success.
    destination: (req, file, cb) => {
        cb(null, UPLOADS_DIR);          // uploads/ folder
    },
    // filename() decides WHAT the saved file is called.
    // NOTE: using file.originalname directly can overwrite existing
    // files and break with special characters. We generate a unique name.
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname).toLowerCase(); // ".png"
        // Date.now() + random -> practically unique per upload
        const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
        cb(null, `${uniqueSuffix}${ext}`); // e.g. 1786875190227-730862458.png
    }
});

// --- 4. fileFilter -> VALIDATE which files Multer accepts ----------
// Runs for EVERY file BEFORE it is saved. This is our "JPG/JPEG/PNG
// only" gate. Multer calls cb(null, true) to accept, cb(null, false)
// to silently skip, or cb(new Error(...)) to reject with an error.
const fileFilter = (req, file, cb) => {
    // Check 1: the file EXTENSION (.jpg, .jpeg, .png)
    const extAllowed = /\.(jpg|jpeg|png)$/i.test(file.originalname);
    // Check 2: the MIME TYPE the browser reported (image/jpeg, image/png)
    const mimeAllowed = ['image/jpeg', 'image/png'].includes(file.mimetype);
    if (extAllowed && mimeAllowed) {
        cb(null, true);                       // accept the file
    } else {
        cb(new Error('Only JPG, JPEG, and PNG images are allowed'));
    }
};

// --- 5. Build the Multer middleware ------------------------------
// This bundles everything: storage engine + validation + size limit.
// `limits.fileSize` is in BYTES -> 5 * 1024 * 1024 = 5 MB.
// Multer will throw a LIMIT_FILE_SIZE error if a file exceeds this.
const upload = multer({
    storage,
    fileFilter,
    limits: { fileSize: 5 * 1024 * 1024 }
});

// --- 6. Middleware ------------------------------------------------
// express.json() lets Express parse JSON request bodies as req.body.
app.use(express.json());

// ============================================================
// 2. UPLOAD IMAGES  ->  POST /images/upload
// ------------------------------------------------------------
// upload.single('file') handles ONE file on field name "file".
// upload.array('file', 10) handles UP TO 10 files on "file".
//   \__ the parsed files appear on req.files (an ARRAY of files)
//      (with single() they appear on req.file instead)
// The route below runs ONLY if Multer parsed the request successfully.
// ============================================================
app.post('/images/upload', upload.array('file', 10), (req, res) => {

    // req.files = array of File objects Multer created.
    // Each File has: fieldname, originalname, encoding, mimetype,
    //                destination, filename, path, size
    if (!req.files || req.files.length === 0) {
        return res.status(400).json({ message: 'No files uploaded' });
    }

    // Build a clean JSON summary for each uploaded file:
    const files = req.files.map((file) => ({
        filename: file.filename,             // unique name on disk
        originalname: file.originalname,     // user's original name
        size: file.size,                     // bytes
        mimetype: file.mimetype,             // image/png ...
        url: `/images/${file.filename}`      // public URL to view it
    }));

    res.status(201).json({                   // 201 = Created
        message: `${req.files.length} image(s) uploaded successfully`,
        files
    });
});

// ============================================================
// 3a. VIEW IMAGES - list all  ->  GET /images
// ------------------------------------------------------------
// Reads the uploads/ folder and returns every image's name + URL.
// Async because we use fs/promises (readdir returns a Promise).
// ============================================================
app.get('/images', async (req, res, next) => {
    try {
        const allFiles = await fs.readdir(UPLOADS_DIR);   // names in folder

        // Keep ONLY files that end in .jpg/.jpeg/.png
        const images = allFiles
            .filter((f) => /\.(jpg|jpeg|png)$/i.test(f))
            .sort()      // alphabetical
            .reverse();  // newest first (roughly)

        res.json({
            count: images.length,                          // how many images
            images: images.map((filename) => ({
                filename,
                url: `/images/${filename}`
            }))
        });
    } catch (err) {
        next(err);   // pass the error to the error-handler below
    }
});

// ============================================================
// 3b. VIEW IMAGES - single file  ->  GET /images/:filename
// ------------------------------------------------------------
// req.params = route placeholders -> { filename: "photo.png" }.
// SECURITY: path.basename() strips any ../ so a malicious
// URL like /images/../server.js cannot escape the uploads/ folder.
// ============================================================
app.get('/images/:filename', async (req, res) => {
    const filename = path.basename(req.params.filename);  // sanitize
    const filePath = path.join(UPLOADS_DIR, filename);    // safe absolute path

    try {
        await fs.access(filePath);         // throws if file is missing
        res.sendFile(filePath);            // stream the file to the browser
    } catch {
        res.status(404).json({ message: 'Image not found' });
    }
});

// ============================================================
// 6. DELETE IMAGES  ->  DELETE /images/:filename
// ------------------------------------------------------------
// fs.unlink() deletes the file from disk. The file is GONE
// (that is why we always check it exists first with a try/catch).
// ============================================================
app.delete('/images/:filename', async (req, res) => {
    const filename = path.basename(req.params.filename);  // sanitize again!
    const filePath = path.join(UPLOADS_DIR, filename);

    try {
        await fs.unlink(filePath);         // delete from disk
        res.json({ message: 'Image deleted successfully', filename });
    } catch {
        res.status(404).json({ message: 'Image not found' });
    }
});

// --- 7. Frontend page ---------------------------------------------
// Serves the gallery HTML at http://localhost:3000/
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// --- 8. Central ERROR HANDLING ------------------------------------
// Express error handlers have FOUR args (err, req, res, next).
// Multer passes upload errors here automatically. Without this
// middleware, Multer errors would crash the server.
app.use((err, req, res, next) => {
    // MulterError = errors Multer created itself (e.g. size/count limits)
    if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({ message: 'File too large. Maximum size is 5 MB' });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({ message: 'Too many files uploaded (max 10)' });
        }
        return res.status(400).json({ message: err.message });
    }
    // Any other error (e.g. our fileFilter Error) lands here:
    res.status(400).json({ message: err.message });
});

// --- 9. START the server ------------------------------------------
// app.listen() binds the server to the port and logs confirmation.
app.listen(PORT, () => {
    console.log(`Image Gallery API running at http://localhost:${PORT}`);
});