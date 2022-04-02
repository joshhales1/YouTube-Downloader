'use strict';

const urlButton: HTMLButtonElement = $("url-button") as HTMLButtonElement;
const urlBar: HTMLInputElement = $("url-input") as HTMLInputElement;

const previewButton: HTMLButtonElement = $("preview") as HTMLButtonElement;

const searchButton = $("search-button");
const searchBar: HTMLInputElement = $("search-input") as HTMLInputElement;
const resultsBox = $('search-output');

const logElement: HTMLParagraphElement = $('log') as HTMLParagraphElement;

const progressBar: HTMLProgressElement = $("progress-bar") as HTMLProgressElement;
const videoElement: HTMLVideoElement = $('video-element') as HTMLVideoElement;

const formatSelector: HTMLSelectElement = $('format') as HTMLSelectElement;

urlButton.onclick = download;
searchButton.onclick = loadSearchResults;
previewButton.onclick = preview;

function loadVideo(url: string): any {
    urlBar.value = url;
    videoElement.src = "./stream/?q=" + urlBar.value;
}

function preview() {
    videoElement.src = "./stream/?q=" + urlBar.value;
}

async function download() {
    let videoDetails;

    urlButton.disabled = true; // Only thing that messes up with multiple downloads is the UI so this isn't critical, therefore can stay on the client.

    try {
        videoDetails = await ajax('./info/?q=' + urlBar.value);
        videoDetails = JSON.parse(JSON.parse(videoDetails)); // No clue why this is needed.

    } catch (e) {

        logElement.innerHTML = "Not a valid YouTube URL.";

        urlButton.disabled = false;

        return;
    }

    let link = document.createElement("a");
    let uid = uuidv4();

    link.download = videoDetails.title;
    link.href = "./file/?q=" + urlBar.value + "&uid=" + uid + "&format=" + formatSelector.value;
    link.click();

    let interval = setInterval(async () => {

        try {
            let progress = JSON.parse(await ajax('./progress/?uid=' + uid)).progress;

            if (progress != undefined) {
                progressBar.value = parseFloat(progress) * 100;

            } else {
                cleanUpDownload(interval);
            }

        } catch (e) {

            console.log(e);

            cleanUpDownload(interval);
        }

    }, 1000);    
}

function cleanUpDownload(interval) {
    clearInterval(interval);
    urlButton.disabled = false;
    progressBar.value = 100;
}

async function loadSearchResults() {
    let results = JSON.parse(await ajax('./search/?q=' + searchBar.value)).items;
    

    console.log(results);
    let resultsHTML = '';

    for (let result of results) {
        if (result.type != 'video') continue; // Skip over any channels/playlists etc.

        resultsHTML += `<div onclick="loadVideo('${result.url}')">
      <div class='yt-result'>
        <div class="result-text">
          <h1>${result.title}</h1>
          <h2>Uploaded by: ${result.author.name}</h2>
          <h3>${result.duration}</h3>
        </div>
        <img class='result-img' src="${result.bestThumbnail.url}">
      </div>
      <hr>
    </div>`; // Present the JSON cleanly


    }

    resultsBox.innerHTML = resultsHTML;

}

function $(id: string) {
    return document.getElementById(id);
}

function ajax(url: string): Promise<string> {

    return new Promise((resolve, reject) => {

        var xhttp = new XMLHttpRequest();
        xhttp.onreadystatechange = function () {
            if (this.readyState == 4 && this.status == 200) {
                resolve(this.responseText);
                console.log(this.status);
            } else if (this.readyState == 4) {

                console.log(this.status);

                if (this.status == 569)
                    alert("This video seems to have no audio associated with it. Please try another video. The problem is likely to be specific to that video");

                reject(this.status.toString());
            }
        };
        xhttp.open("GET", url, true);
        xhttp.send();
    });
}

function uuidv4(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}
