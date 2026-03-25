YouTube Shorts Downloader
1. Setup Instructions (Local)
 * Create a folder named shorts-downloader and put server.js, package.json, and this README.md inside it.
 * Inside that folder, create a sub-folder named public and put the index.html file inside it.
 * Install Node.js and Python on your computer if you haven't already.
 * Open a terminal and run pip install yt-dlp to install the required YouTube downloader engine.
 * In your project folder terminal, run npm install to install Express and CORS.
 * Run npm start.
 * Go to http://localhost:3000 in your web browser.
2. Deployment Instructions (GitHub Pages & Render)
Because the downloading logic requires a backend and yt-dlp installed on the server, you cannot host the entire app only on GitHub Pages.
Step 1: Deploy Backend (Render)
 * Upload your code to a GitHub repository.
 * Sign up for a free account at Render.com.
 * Create a new "Web Service" and link your GitHub repo.
 * Render needs yt-dlp installed. In your Render settings, set the build command to: npm install && apt-get update && apt-get install -y python3 ffmpeg && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp && chmod a+rx /usr/local/bin/yt-dlp (Note: You may need a Dockerfile for more complex setups, but for local testing the above local instructions are easiest).
 * Render will give you a backend URL like https://my-app.onrender.com.
Step 2: Deploy Frontend (GitHub Pages)
 * Open your public/index.html file.
 * Change line 170: const API_BASE = 'http://localhost:3000'; to your new Render URL: const API_BASE = 'https://my-app.onrender.com';.
 * Push the change to GitHub.
 * Go to your repository Settings > Pages.
 * Select the main branch and the /public directory (or /root if you moved index.html to the main folder). Save.
