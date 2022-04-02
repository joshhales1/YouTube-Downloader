# YouTube Downloader

## NOTE: The dependencies are quite unstable and YouTube keeps changing things. If something is broken let me know so I can fix it. 

The repository is the source code for the awesomely simple YouTube downloader found at the link below. The goal of the project was to simplify the pain of downloading YouTube videos and provide a tool actually designed for users. No intrusive ads or fake progress bars, just the information and content a user would want and need.

Check out a running implementation [here](https://jayhal.es/ytdl/).

Either check out the implementation here or clone the repo and `npm i`, `npm run-script build` then `npm run`.

## What it does do
- Search YouTube for videos
- Download searched videos in `mp4` and `mp3` format
- Stream the video whilst waiting/to verify it is the correct video
- View download progress when transferring from YouTube to the server.

## What it does not do
- Store downloads for any time
- Allow scrubbing/scrolling/skipping in the preview stream

Makes use of the awesome `ytdl-core` and `ytsr` packages.




