import * as express from 'express';
import * as ytdl from 'ytdl-core';
import * as ytsr from 'ytsr';
import * as fs from 'fs';

const app = express();
const port = process.env.PORT || 3000;

var progresses = {};

app.use('/', express.static(__dirname + '/static'));

app.get('/stream', (req, res) => {

    trimRequestParams(req.query.q as string)
        .then((url) => {
            ytdl(url).pipe(res);
        })

        .catch((error) => {
            res.status(404).end();

            console.log(error);
        });
});

app.get('/info', (req, res) => {

    trimRequestParams(req.query.q as string)
        .then((url) => {
            ytdl.getBasicInfo(url).then(result => {
                res.json(JSON.stringify(result.videoDetails));
                res.end();
            });
        })

        .catch((error) => {
            res.status(404).end();

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

            let videoInfo = await ytdl.getBasicInfo(url);
            let videoName = reqID + ".mp4";
            let videoNamePath = __dirname + "/" + videoName;

            let video = ytdl(url);

            let stream = video.pipe(fs.createWriteStream(videoNamePath));

            progresses[reqID] = 0;

            video.on('progress', (chunkLength, downloaded, total) => {

                progresses[reqID] = downloaded / total;

            });

            stream.on('close', async () => {

                await res.sendFile(videoNamePath, (err) => {

                    if (err) {
                        console.log(err);
                        res.status(500).end();
                    }
                });

                fs.exists(videoNamePath, (exists) => {
                    if (exists)
                        fs.unlink(videoNamePath, () => { });
                });

                delete progresses[reqID];
            });
        })

        .catch((error) => {

            res.status(404).end();

            console.log(error);

        });

});

app.get('/search', (req, res) => {
    if (!(req.query.q as string))
        return res.status(400).end();

    ytsr(req.query.q as string, { limit: 20 })
        .then(r => res.send(r)) // Send the search results to client.
        .catch(e => res.status(404).end()); // If any errors send custom error code to client to handle itself.
});

app.listen(port, () => {
    console.log(`Listening on ${port}...`);
});

function trimRequestParams(input: string): Promise<string> {
    return new Promise((resolve, reject) => {
        if (ytdl.validateURL(input)) {
            resolve(input);
        } else {
            reject("Bad URL: " + input);
        }
    });
}


