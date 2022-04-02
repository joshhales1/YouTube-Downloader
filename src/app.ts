import * as express from 'express';
import * as ytdl from 'ytdl-core';
import * as ytsr from 'ytsr';
import * as fs from 'fs';
import * as ffmpeg from 'fluent-ffmpeg';

import * as jog from 'jayh';


const secret = fs.readFileSync('../jogger_secret', 'utf-8');

const app = express();
const port = process.env.PORT || 8084;

const COOKIE = {
    requestOptions: {
        headers: {
            cookie: 'x-youtube-identity-token=' + process.env.ID_TOKEN + ';'
        }
    }
};

var progresses = {};

app.use('/', express.static(__dirname + '/static'));

app.get('/stream', (req, res) => {

    trimRequestParams(req.query.q as string)
        .then((url) => {
            ytdl(url, COOKIE).pipe(res);
        })

        .catch((error) => {
            res.status(404).end();
	    qjog(2, error.toString());
            console.log(error);
        });
});

app.get('/info', (req, res) => {

    trimRequestParams(req.query.q as string)
        .then((url) => {
            ytdl.getBasicInfo(url, COOKIE).then(result => {
                res.json(JSON.stringify(result.videoDetails));
                res.end();
            });
        })

        .catch((error) => {
            res.status(404).end();
            qjog(2, error.toString());
            console.log(error);
        });

});

app.get('/progress', (req, res) => {

    if (!(req.query.uid as string))
        return res.status(400).end();

    res.type("text");

    res.json({ "progress": progresses[req.query.uid as string] });

});

app.get('/file', (req, res) => {

    trimRequestParams(req.query.q as string)
        .then(async (url) => {

            if (!(req.query.uid as string))
                return res.status(400).end();

            let reqID: string = req.query.uid as string;

            let videoName = reqID;           

            let video = ytdl(url, COOKIE);

            videoName = (req.query.format as string === "mp3") ? videoName + ".mp3" : videoName + ".mp4";
            let videoNamePath = __dirname + "/" + videoName;

            console.log(videoNamePath);

            if (req.query.format as string === "mp3") {


                ffmpeg(video)
                    .audioBitrate(128)
                    .save(videoNamePath)
                    .on('end', async () => {
                        endRequest(reqID, videoNamePath, res);
                    })
                    .on('error', async (e) => {

                        res.status(569).end();

                        fs.exists(videoNamePath, (exists) => {
                            if (exists)
                                fs.unlink(videoNamePath, () => { });
                        });
			qjog(2, e.toString());
                        delete progresses[reqID];

                    });
                

            } else {              

                let stream = video.pipe(fs.createWriteStream(videoNamePath));

                stream.on('close', async () => {
                    endRequest(reqID, videoNamePath, res);
                });
            }

            progresses[reqID] = 0;

            video.on('progress', (chunkLength, downloaded, total) => {

                progresses[reqID] = downloaded / total;

            });

            
        })

        .catch((error) => {

            res.status(404).end();
		qjog(2, error.toString());
            console.log(error);

        });

});

async function endRequest(reqID: string, fileName: string, res) {

    await res.sendFile(fileName, (err) => {

        if (err) {
            console.log(err);
            res.status(500).end();
            qjog(2, err.toString());
        }
    });

    fs.exists(fileName, (exists) => {
        if (exists)
            fs.unlink(fileName, () => { });
    });

    delete progresses[reqID];
}

app.get('/search', (req, res) => {
    if (!(req.query.q as string))
        return res.status(400).end();

    ytsr(req.query.q as string, { limit: 20 })
        .then(r => res.send(r)) // Send the search results to client.
        .catch(e => {res.status(404).end(); qjog(2, e.toString());}) // If any errors send custom error code to client to handle itself.
});

app.listen(port, () => {
    console.log(`Listening on ${port}...`);
    qjog(0, "Opening...")
});

function qjog(severity: number, message: string) {
	jog('959792991298543656', severity, 'YouTube Downloader', message, secret);
}

function trimRequestParams(input: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (ytdl.validateURL(input)) {
            resolve(input);
        } else {
            reject("Bad URL: " + input);
        }
    });
}


