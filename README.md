# Multer API Gallery

A beginner-to-intermediate **Image Gallery API** built with **Node.js, Express.js, and Multer**.

This project demonstrates how to handle multiple image uploads, validate files, store them locally, retrieve uploaded images, and delete them.

## 🚀 Features

* 📤 Upload up to 10 images at once
* 🖼️ Supports JPG, JPEG, and PNG images
* 📦 Maximum file size of 5 MB per image
* 🔐 Generates unique filenames for uploaded images
* 📋 Get a list of all uploaded images
* 🖼️ View individual images
* 🗑️ Delete uploaded images
* ⚠️ Centralized Multer error handling
* 🛡️ Basic filename/path sanitization
* 🌐 Simple HTML gallery interface

## 🛠️ Tech Stack

* **Node.js**
* **Express.js**
* **Multer**
* **HTML**
* **JavaScript**
* **File System (`fs/promises`)**

## 📁 Project Structure

```text
Multer-API-gallery/
│
├── server.js
├── index.html
├── package.json
├── package-lock.json
├── .gitignore
└── uploads/
```

## ⚙️ Installation

Clone the repository:

```bash
git clone https://github.com/Lavish09-Mehra/Multer-API-gallery.git
```

Move into the project:

```bash
cd Multer-API-gallery
```

Install dependencies:

```bash
npm install
```

Start the server:

```bash
node server.js
```

The API will run at:

```text
http://localhost:3000
```

Open the gallery in your browser:

```text
http://localhost:3000/
```

## 📤 API Endpoints

| Method | Endpoint            | Description               |
| ------ | ------------------- | ------------------------- |
| POST   | `/images/upload`    | Upload 1–10 images        |
| GET    | `/images`           | Get all uploaded images   |
| GET    | `/images/:filename` | View a specific image     |
| DELETE | `/images/:filename` | Delete an image           |
| GET    | `/`                 | Open the gallery frontend |

## 📤 Upload Images

### Endpoint

```text
POST /images/upload
```

The upload field name is:

```text
file
```

The API accepts up to **10 files**:

```js
upload.array('file', 10)
```

Uploaded files are available through:

```js
req.files
```

The API returns information such as:

```json
{
  "message": "2 image(s) uploaded successfully",
  "files": [
    {
      "filename": "unique-file-name.png",
      "originalname": "photo.png",
      "size": 24567,
      "mimetype": "image/png",
      "url": "/images/unique-file-name.png"
    }
  ]
}
```

## 🔍 File Validation

Only these image formats are accepted:

```text
.jpg
.jpeg
.png
```

The project checks both:

* File extension
* MIME type

Invalid files are rejected with an error response.

## 📦 File Size Limit

Each uploaded file has a maximum size of:

```text
5 MB
```

This is configured using Multer:

```js
limits: {
    fileSize: 5 * 1024 * 1024
}
```

## 🖼️ View Images

Get all uploaded images:

```text
GET /images
```

Example response:

```json
{
  "count": 2,
  "images": [
    {
      "filename": "123456789.png",
      "url": "/images/123456789.png"
    }
  ]
}
```

To view a specific image:

```text
GET /images/:filename
```

The server uses `res.sendFile()` to send the image to the browser.

## 🗑️ Delete an Image

Use:

```text
DELETE /images/:filename
```

The server uses Node.js `fs.unlink()` to remove the image from the `uploads` directory.

## 🔐 Filename Security

Uploaded files are given unique filenames instead of directly using the original filename.

Example:

```text
1786875190227-730862458.png
```

This helps prevent files with the same name from overwriting each other.

The project also uses:

```js
path.basename(req.params.filename)
```

when accessing or deleting files to prevent paths such as:

```text
../server.js
```

from escaping the uploads directory.

## 🔄 How the Project Works

```text
        Browser
           │
           │ Upload images
           ▼
   POST /images/upload
           │
           ▼
        Multer
           │
     ┌─────┴─────┐
     │           │
 Validation    Size Limit
     │           │
     └─────┬─────┘
           ▼
      diskStorage()
           │
           ▼
       uploads/
           │
     ┌─────┴──────────┐
     │                │
 GET /images    GET /images/:filename
     │                │
     ▼                ▼
 List images      View image
           │
           ▼
 DELETE /images/:filename
           │
           ▼
       fs.unlink()
```

## 📚 Multer Concepts Practiced

This project builds on the basic Multer concepts:

```text
upload.single()
      ↓
upload.array()
      ↓
req.file
      ↓
req.files
      ↓
diskStorage()
      ↓
fileFilter
      ↓
limits
      ↓
File deletion
      ↓
Error handling
```

## 🎯 Learning Goals

The main purpose of this project is to understand how **file uploads work in Express.js using Multer**.

### Concepts learned

* Handling `multipart/form-data`
* Multer middleware
* `diskStorage()`
* `upload.array()`
* `req.files`
* File filtering
* File size limits
* Unique filenames
* Node.js `fs/promises`
* `fs.readdir()`
* `fs.unlink()`
* `res.sendFile()`
* Express error-handling middleware
* Basic path sanitization

## 🔮 Future Improvements

Possible improvements:

* [ ] Store image metadata in MongoDB
* [ ] Add user authentication
* [ ] Associate images with users
* [ ] Add image search
* [ ] Add pagination
* [ ] Add Cloudinary/AWS S3 storage
* [ ] Add image compression
* [ ] Add image resizing
* [ ] Add drag-and-drop uploads

## 👨‍💻 Author

**Lavish Mehra**

GitHub: https://github.com/Lavish09-Mehra

---

⭐ A learning project focused on **Multer, Express.js, and file management**.
