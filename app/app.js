"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const express = require("express");
const ytdl = require("ytdl-core");
const ytsr = require("ytsr");
const fs = require("fs");
const app = express();
const port = process.env.PORT || 3000;
var progresses = {};
app.use('/', express.static(__dirname + '/static'));
app.get('/stream', (req, res) => {
    trimRequestParams(req.query.q)
        .then((url) => {
        ytdl(url).pipe(res);
    })
        .catch((error) => {
        res.status(404).end();
        console.log(error);
    });
});
app.get('/info', (req, res) => {
    trimRequestParams(req.query.q)
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
    if (!req.query.uid)
        return res.status(400).end();
    res.type("text");
    res.json({ "progress": progresses[req.query.uid] });
});
app.get('/file', (req, res) => {
    trimRequestParams(req.query.q)
        .then((url) => __awaiter(void 0, void 0, void 0, function* () {
        if (!req.query.uid)
            return res.status(400).end();
        let reqID = req.query.uid;
        let videoInfo = yield ytdl.getBasicInfo(url);
        let videoName = reqID + ".mp4";
        let videoNamePath = __dirname + "/" + videoName;
        let video = ytdl(url);
        let stream = video.pipe(fs.createWriteStream(videoNamePath));
        progresses[reqID] = 0;
        video.on('progress', (chunkLength, downloaded, total) => {
            progresses[reqID] = downloaded / total;
        });
        stream.on('close', () => __awaiter(void 0, void 0, void 0, function* () {
            yield res.sendFile(videoNamePath, (err) => {
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
        }));
    }))
        .catch((error) => {
        res.status(404).end();
        console.log(error);
    });
});
app.get('/search', (req, res) => {
    if (!req.query.q)
        return res.status(400).end();
    ytsr(req.query.q, { limit: 20 })
        .then(r => res.send(r)) // Send the search results to client.
        .catch(e => res.status(404).end()); // If any errors send custom error code to client to handle itself.
});
app.listen(port, () => {
    console.log(`Listening on ${port}...`);
});
function trimRequestParams(input) {
    return new Promise((resolve, reject) => {
        if (ytdl.validateURL(input)) {
            resolve(input);
        }
        else {
            reject("Bad URL: " + input);
        }
    });
}
