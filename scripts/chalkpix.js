"use strict";


const recorderCanvas = document.querySelector(".recorderCanvas");
const replayCanvas = document.querySelector(".replayCanvas");
const recorderAudio = document.querySelector(".recorderAudio");
const replayAudio = document.querySelector(".replayAudio");
const recorderBtn = document.querySelector(".recorderBtn");
const replayBtn = document.querySelector(".replayBtn");
const recorderStatus = document.querySelector(".recorderStatus");
const replayStatus = document.querySelector(".replayStatus");


let isRecording = false;
let isReplaying = false;

let isMouseDown = false;
let x = 0;
let y = 0;
let drawLineCoords = [];
let audioChunks = [];
let audioBlob;
let mediaRecorder;
let audioURL;
let dpi = window.devicePixelRatio;
let recordStartTime = 0;
let recordEndTime = 0;
let replayStartTime = 0;
let replayEndTime = 0;
let SPEED = 1.0;


const handleSuccess = function(stream) {

    if(window.URL) recorderAudio.srcObject = stream;
    else recorderAudio.src = stream;

    mediaRecorder = new MediaRecorder(stream);
    mediaRecorder.ondataavailable = async function (event) {
        console.log(`Audio data available`);
        audioChunks.push(event.data);
        console.log(`Audio chunks length : ${audioChunks.length}`);
        audioBlob = new Blob(audioChunks, {type:'audio/ogg; codec=opus'});
    };

    mediaRecorder.onstop = async function (event) {
        console.log(`Audio recording stopped`);
        audioBlob = new Blob(audioChunks, {type:'audio/ogg; codec=opus'});
        console.log(`Audio Blob size: ${audioBlob.size}`);

        try {

            audioURL = window.URL.createObjectURL(audioBlob);
            console.log(`Audio URL: ${audioURL}`);
            replayAudio = new Audio(audioURL);
            replayAudio.srcObject = audioURL;
            replayAudio.src = audioURL;

        } catch(err) {
            console.log(`Error occured while creating blob`);
        }

    }

};


navigator.mediaDevices.getUserMedia({audio:true, video:false}).then(handleSuccess);

console.log(`recorder canvas: ${getComputedStyle(recorderCanvas).width} ${getComputedStyle(recorderCanvas).height}`);
console.log(`replay canvas: ${getComputedStyle(replayCanvas).width} ${getComputedStyle(replayCanvas).height}`);

function fix_dpi(canvas) {

    var dpr = window.devicePixelRatio || 1;

    var rect = canvas.getBoundingClientRect();

    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;

}

fix_dpi(recorderCanvas);
fix_dpi(replayCanvas);

console.log(`recorder canvas: ${getComputedStyle(recorderCanvas).width} ${getComputedStyle(recorderCanvas).height}`);
console.log(`replay canvas: ${getComputedStyle(replayCanvas).width} ${getComputedStyle(replayCanvas).height}`);

recorderCanvas.addEventListener('mousedown', (event) => {

    event.preventDefault();
    event.stopPropagation();

    console.groupCollapsed(`Mouse down`);
    console.log(`Mouse related target: ${event.relatedTarget}`);
    console.log(`Mouse offset X:${event.offsetX}, Y: ${event.offsetY}`);
    console.groupEnd();

    isMouseDown = true;
    x = event.clientX;
    y = event.clientY;
    
});


recorderCanvas.addEventListener('mousemove', (event) => {

    if(!isMouseDown || !isRecording) return;

    event.preventDefault();
    event.stopPropagation();

    console.groupCollapsed(`Mouse move`);
    console.log(`Mouse related target: ${event.relatedTarget}`);
    console.log(`Mouse offset X: ${event.offsetX}, Y: ${event.offsetY}`);
    console.groupEnd();

    drawLine(recorderCanvas, x, y, event.clientX, event.clientY);
    x = event.clientX;
    y = event.clientY;

});


recorderCanvas.addEventListener('mouseup', (event) => {

    event.preventDefault();
    event.stopPropagation();

    console.groupCollapsed(`Mouse up`);
    console.log(`Mouse related target: ${event.relatedTarget}`);
    console.log(`Mouse offset X: ${event.offsetX}, Y: ${event.offsetY}`);
    console.groupEnd();

    if(isRecording)
        drawLine(recorderCanvas, x, y, event.clientX, event.clientY);
    
    x = 0;
    y = 0;
    isMouseDown = false; 

});


document.body.onresize = resize_canvas;

function resize_canvas() {

    console.groupCollapsed(`Resize Event`);

    const ctx = replayCanvas.getContext("2d");
    ctx.canvas.width = replayCanvas.clientWidth;
    ctx.canvas.height = replayCanvas.clientHeight;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawLineCoords.forEach((coords) => drawLineReplay(replayCanvas, coords[0], coords[1], coords[2], coords[3]));

    ctx = recordingCanvas.getContext("2d");
    ctx.canvas.width = recorderCanvas.clientWidth;
    ctx.canvas.height = recorderCanvas.clientHeight;

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    drawLineCoords.forEach((coords) => drawLineReplay(recorderCanvas, coords[0], coords[1], coords[2], coords[3]));

    console.groupEnd();

}


function drawLine(canvas, x1, y1, x2, y2) {

    console.log(`Drawline coords length: ${drawLineCoords.length}`);

    let rect = canvas.getBoundingClientRect();
    let scaleX = canvas.width / rect.width;
    let scaleY = canvas.height / rect.height;
    console.log(`${scaleX} ${scaleY}, ${rect.left} ${rect.top}`);

    let posX1 = (x1 - rect.left) * scaleX;
    let posY1 = (y1 - rect.top) * scaleY;
    let posX2 = (x2 - rect.left) * scaleX;
    let posY2 = (y2 - rect.top) * scaleY;
    console.log(`Specific Positions: (${posX1}, ${posY1}) - (${posX2}, ${posY2})`);

    if(canvas !== replayCanvas)
        drawLineCoords.push([
            (x1 - rect.left) / rect.width,
            (y1 - rect.top) / rect.height,
            (x2 - rect.left) / rect.width,
            (y2 - rect.top) / rect.height,
            Date.now()
        ]);
    console.log(``);

    let context = canvas.getContext("2d");
    context.scale(window.devicePixelRatio||1, window.devicePixelRatio||1);

    context.beginPath();
    context.strokestyle = "black";
    context.lineWidth = 2;
    context.moveTo(posX1, posY1);
    context.lineTo(posX2, posY2);
    context.stroke();
    context.closePath();

}




recorderBtn.addEventListener('click', async (event) => {

    event.preventDefault();
    event.stopPropagation();

    if(!isRecording) {

        mediaRecorder.start();
        if(mediaRecorder.state == "recording") {
            recordStartTime = Date.now();
            recorderStatus.innerHTML = "Recording";
            drawLineCoords = [];
            isRecording = true;
        }

    } else {

        await mediaRecorder.stop();
        recordEndTime = Date.now();
        isRecording = false;
        recorderStatus.innerHTML = "Done recording.";

    }

});


replayBtn.addEventListener('click', (event) => {

    event.preventDefault();
    event.stopPropagation();

    // clearing canvas before starting.
    replayCanvas.getContext("2d").clearRect(0, 0, replayCanvas.width, replayCanvas.height);

    let i = 0;
    replayStartTime = Date.now();
    replayAudio.src = audioURL;
    replayAudio.oncanplay = (event) => {

        replayAudio.play();

        replayAudio.onplay = (event) => {

            replayStatus.innerHTML = "Playing";
            console.log(`Starting replay at ${replayStartTime}`);

            (function draw() {

                let coords = drawLineCoords[i];

                if(!coords) return;
                console.log(`coords: ${coords}`);

                let offsetRecording = coords[4] - recordStartTime;
                let offsetPlay = (Date.now() - replayStartTime) * SPEED;

                while(offsetPlay < offsetRecording) {
                    cancelAnimationFrame(draw);
                    offsetPlay = (Date.now() - replayStartTime) * SPEED;
                }

                if(offsetPlay >= offsetRecording) {
                    drawLineReplay(replayCanvas, coords[0], coords[1], coords[2], coords[3]);
                    i++;
                }   

                if(i < drawLineCoords.length) {
                    requestAnimationFrame(draw);
                } else {
                    cancelAnimationFrame(draw);
                    replayStatus.innerHTML = "Done.";
                    console.log(`Recording of duration ${recordEndTime-recordStartTime} is replayed for duration ${Date.now() - replayStartTime}`);
                    replayStartTime = 0;
                }

            })();

        };

    };

});




function drawLineReplay(canvas, x1, y1, x2, y2)  {

    console.log(`in draw line replay: ${x1}, ${y1}, ${x2}, ${y2}`);
    const rect = canvas.getBoundingClientRect();

    const context = canvas.getContext("2d");
    const borderWidth = +getComputedStyle(canvas).borderWidth.slice(0, -2);
    console.log(`border width:${borderWidth}`);

    const scaleX = context.canvas.width / rect.width;
    const scaleY = context.canvas.height / rect.height;
    console.log(`${scaleX} ${scaleY}`);

    let posX1 = x1 * rect.width;
    let posY1 = y1 * rect.height;
    let posX2 = x2 * rect.width;
    let posY2 = y2 * rect.height;

    posX1 = posX1 * scaleX;
    posY1 = posY1 * scaleY;
    posX2 = posX2 * scaleX;
    posY2 = posY2 * scaleY;

    posX1 -= borderWidth;
    posY1 -= borderWidth;
    posX2 -= borderWidth;
    posY2 -= borderWidth;

    context.scale(window.devicePixelRatio||1, window.devicePixelRatio||1);
    console.log(posX1, posY1, posX2, posY2);
    context.beginPath();
    context.lineCap = "round";
    context.lineJoin = "round";
    context.strokestyle = "black";
    context.lineWidth = 2;
    context.moveTo(posX1, posY1);
    context.lineTo(posX2, posY2);
    context.stroke();
    context.closePath();

}