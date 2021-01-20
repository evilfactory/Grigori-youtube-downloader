const express = require('express')
const ytdl = require('ytdl-core')

const app = express()
app.use('/', express.static('./static'))

app.listen(80, () => {
    console.log("App running on port 80")
})

app.get('/download', (req, res) => {
    var url = req.query.url;
    res.header("Content-Disposition", 'attachment; filename="Video.mp4');
    ytdl(url, {format: 'mp4'}).pipe(res);
})