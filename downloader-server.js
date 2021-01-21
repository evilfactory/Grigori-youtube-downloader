const express = require('express')
const ytdl = require('ytdl-core')
const ffmpeg = require('ffmpeg-static')
const cp = require('child_process')

console.log(ffmpeg)
const app = express()
app.use('/', express.static('./static'))

app.listen(80, () => {
	console.log("App running on port 80")
})


let map = { "480p mp4": 1, "360p mp4": 2, "720p mp4": 3, "audio mp3": 4 }
let resMap = { 1: "852:480", 2: "640:360", 3: "1280:720", 4: "0:0" }

app.get('/download', async (req, res) => {
	var videotype = map[req.query.videotype]
	var url = req.query.url

	const audio = ytdl(url, { quality: 'highestaudio' })

	const video = ytdl(url, { quality: 'highestvideo' })

	console.log(`Video Download: ${url}, format: ${req.query.videotype}`)
	res.header("Content-Disposition", `attachment; filename="Video.${videotype == 4 ? "mp3" : "mp4"}"`)

	ProcessVideo(audio, video, res, videotype)

})


function ProcessVideo(audio, video, res, videotype) {
	let format = videotype == 4 ? "mp3" : "mp4"

	let ffmpegProcess

	const spawnOptions = {
		windowsHide: true,
		stdio: [
			'inherit', 'inherit', 'inherit',
			'pipe', 'pipe', 'pipe'
		],
	}

	if (format == "mp4") {
		ffmpegProcess = cp.spawn(ffmpeg, [
			'-loglevel', '8', '-hide_banner',

			// Set inputs
			'-i', 'pipe:3',
			'-i', 'pipe:4',
			// Map audio & video from streams
			'-map', '0:a',
			'-map', '1:v',

			// Scale video
			'-vf', `scale=${resMap[videotype]},setsar=1`,

			// Define output file and format
			'-f', 'matroska', 'pipe:5',
		], spawnOptions)
	} else {
		ffmpegProcess = cp.spawn(ffmpeg, [
			'-loglevel', '8', '-hide_banner',
			// Set inputs
			'-i', 'pipe:3',
			// Map audio from stream
			'-map', '0:a',
			// Keep encoding
			'-c:v', 'copy',
			// Define output file
			'-f', 'mp3', 'pipe:5',
		], spawnOptions)
	}


	ffmpegProcess.on('close', () => {
		console.log('done')
	})

	audio.pipe(ffmpegProcess.stdio[3])

	if (format == "mp4") { video.pipe(ffmpegProcess.stdio[4]) }

	return ffmpegProcess.stdio[5].pipe(res, { end: true })
}