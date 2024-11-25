document.addEventListener('DOMContentLoaded', function() {
    const audioUpload = document.getElementById('audio-upload');
    const canvas = document.getElementById('visualizer');
    const playPauseButton = document.getElementById('play-pause');
    let audioContext, source, analyser, dataArray, bufferLength, canvasContext, audioBuffer;
    let isPlaying = false;
    let hue = 0;

    function resizeCanvas() {
        const dpr = window.devicePixelRatio || 1;
        canvas.width = window.innerWidth * dpr;
        canvas.height = window.innerHeight * dpr;
        canvas.style.width = `${window.innerWidth}px`;
        canvas.style.height = `${window.innerHeight}px`;
        canvasContext = canvas.getContext('2d');
        canvasContext.scale(dpr, dpr);
    }

    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    if (audioUpload && canvas && playPauseButton) {
        audioUpload.addEventListener('change', function(event) {
            const file = event.target.files[0];
            const reader = new FileReader();

            reader.onload = function(fileEvent) {
                if (audioContext) {
                    audioContext.close();
                }
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                canvasContext = canvas.getContext('2d');

                audioContext.decodeAudioData(fileEvent.target.result, function(buffer) {
                    audioBuffer = buffer;
                    setupAudioNodes();
                    draw();
                });
            };

            reader.readAsArrayBuffer(file);
        });

        playPauseButton.addEventListener('click', function() {
            if (isPlaying) {
                source.stop();
                playPauseButton.innerHTML = '<span class="iconify" data-icon="ic:round-play-arrow" data-inline="false"></span>';
            } else {
                setupAudioNodes();
                source.start(0);
                playPauseButton.innerHTML = '<span class="iconify" data-icon="ic:round-pause" data-inline="false"></span>';
            }
            isPlaying = !isPlaying;
        });

        // Load default audio
        fetch('assets/default.mp3')
            .then(response => response.arrayBuffer())
            .then(data => {
                audioContext = new (window.AudioContext || window.webkitAudioContext)();
                canvasContext = canvas.getContext('2d');
                audioContext.decodeAudioData(data, function(buffer) {
                    audioBuffer = buffer;
                    setupAudioNodes();
                    source.start(0);
                    playPauseButton.innerHTML = '<span class="iconify" data-icon="ic:round-pause" data-inline="false"></span>';
                    isPlaying = true;
                    draw();
                });
            });
    } else {
        console.error('Required elements not found');
    }

    function setupAudioNodes() {
        source = audioContext.createBufferSource();
        source.buffer = audioBuffer;
        analyser = audioContext.createAnalyser();
        source.connect(analyser);
        analyser.connect(audioContext.destination);

        analyser.fftSize = 2048;
        bufferLength = analyser.fftSize;
        dataArray = new Uint8Array(bufferLength);
    }

    function draw() {
        requestAnimationFrame(draw);
        analyser.getByteTimeDomainData(dataArray);

        canvasContext.fillStyle = 'rgb(0, 0, 0)';
        canvasContext.fillRect(0, 0, canvas.width, canvas.height);

        canvasContext.lineWidth = 4; // Thicker lines

        const sliceWidth = canvas.width * 1.0 / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
            const v = dataArray[i] / 128.0;
            const y = v * canvas.height / 2;

            hue = (i / bufferLength) * 360 + (Date.now() / 50); // Calculate hue based on position and time
            canvasContext.strokeStyle = `hsl(${hue % 360}, 100%, 50%)`;

            if (i === 0) {
                canvasContext.beginPath();
                canvasContext.moveTo(x, y);
            } else {
                canvasContext.lineTo(x, y);
            }

            x += sliceWidth;
        }

        canvasContext.lineTo(canvas.width, canvas.height / 2);
        canvasContext.stroke();
    }
});