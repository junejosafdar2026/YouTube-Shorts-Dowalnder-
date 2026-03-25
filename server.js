const express = require('express');
const cors = require('cors');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static frontend files from the "public" folder
app.use(express.static(path.join(__dirname, 'public')));

/**
 * Helper function to validate YouTube URLs
 */
const isValidYoutubeUrl = (url) => {
    return /^https?:\/\/(www\.)?(youtube\.com|youtu\.be)\/.+/.test(url);
};

/**
 * Endpoint 1: Fetch Video Info (Title, Thumbnail, Formats)
 * Method: GET /api/info?url=...
 */
app.get('/api/info', (req, res) => {
    const videoUrl = req.query.url;

    if (!videoUrl || !isValidYoutubeUrl(videoUrl)) {
        return res.status(400).json({ error: 'Valid YouTube URL is required' });
    }

    // Spawn yt-dlp to dump JSON info
    const ytDlp = spawn('yt-dlp', ['--dump-json', videoUrl]);
    
    let output = '';
    let errorOutput = '';

    ytDlp.stdout.on('data', (data) => {
        output += data.toString();
    });

    ytDlp.stderr.on('data', (data) => {
        errorOutput += data.toString();
    });

    ytDlp.on('close', (code) => {
        if (code !== 0) {
            console.error(`yt-dlp Error: ${errorOutput}`);
            return res.status(500).json({ error: 'Failed to extract video info. Is yt-dlp installed on the server?' });
        }

        try {
            const info = JSON.parse(output);

            // Filter for acceptable formats (typically MP4)
            let formats = info.formats
                .filter(f => f.ext === 'mp4' && f.vcodec !== 'none')
                .map(f => ({
                    format_id: f.format_id,
                    resolution: f.resolution || (f.height ? `${f.height}p` : 'Unknown'),
                    hasAudio: f.acodec !== 'none',
                    ext: f.ext
                }))
                // Sort by quality (height) descending
                .sort((a, b) => {
                    const hA = parseInt(a.resolution) || 0;
                    const hB = parseInt(b.resolution) || 0;
                    return hB - hA;
                });

            // Clean up: keep only one unique entry per resolution
            const uniqueFormats = [];
            const seenResolutions = new Set();
            for (const f of formats) {
                if (!seenResolutions.has(f.resolution) && f.resolution !== 'Unknown') {
                    seenResolutions.add(f.resolution);
                    uniqueFormats.push(f);
                }
            }

            res.json({
                title: info.title,
                thumbnail: info.thumbnail,
                formats: uniqueFormats.length > 0 ? uniqueFormats : formats.slice(0, 5)
            });

        } catch (parseError) {
            console.error('Parse Error:', parseError);
            res.status(500).json({ error: 'Error processing video data.' });
        }
    });
});

/**
 * Endpoint 2: Proxy the video download
 * Method: GET /api/download?url=...&format=...
 */
app.get('/api/download', (req, res) => {
    const videoUrl = req.query.url;
    const formatId = req.query.format || 'best';

    if (!videoUrl || !isValidYoutubeUrl(videoUrl)) {
        return res.status(400).send('Valid YouTube URL is required');
    }

    res.setHeader('Content-Disposition', 'attachment; filename="YouTube_Short.mp4"');
    res.setHeader('Content-Type', 'video/mp4');

    let formatString = formatId === 'best' 
        ? 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/best' 
        : `${formatId}+bestaudio[ext=m4a]/best`;

    // -o - means output to standard output (stdout)
    const ytDlpDownload = spawn('yt-dlp', ['-f', formatString, '-o', '-', videoUrl]);

    // Pipe the yt-dlp stdout stream directly to the Express response
    ytDlpDownload.stdout.pipe(res);

    ytDlpDownload.stderr.on('data', (data) => {
        console.log(`[yt-dlp log]: ${data}`);
    });
});

app.listen(PORT, () => {
    console.log(`✅ Backend server is running on http://localhost:${PORT}`);
    console.log(`Ensure 'yt-dlp' is installed on your system to process videos.`);
});

