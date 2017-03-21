function videoPlayerInit() {

    function playFile(event) {
        var file = event.target.files[0];
        var videoNode = document.querySelector('video');
        var fileURL = window.URL.createObjectURL(file);
        videoNode.src = fileURL;
        videoNode.loaded = true;
    }

    inputNode = document.getElementById('input'); 
	inputNode.addEventListener('change', playFile, false);
	initButtons();
};

function initButtons() {
	// Buttons	
	var playButton = document.getElementById("play-pause");
	var muteButton = document.getElementById("mute");
	var fullScreenButton = document.getElementById("full-screen");
	var plusButton = document.getElementById("plus-one-frame");
	var minusButton = document.getElementById("minus-one-frame");
    var addPointButton = document.getElementById("add-pt-btn");
	
	// Sliders
	var seekBar = document.getElementById("seek-bar");
	var volumeBar = document.getElementById("volume-bar");

	// Time
	var currentTime = document.getElementById("current-time")
	
	// Video
	var video = document.getElementById("video");
	var canvas = document.getElementById('video-canvas');
    var videoControls = document.getElementById("video-controls");
    // initCanvas(video, canvas);
    
    // Motion tracking points
    var points = [];
    var pointTimes = [];
    var lastPoint = null;
        
    
    // Time / distance data
    var measurements = [];
    var measureTimes = [];
    var measurePositions = [];
    var startTime = 0;
    var numRuns = 1;
    var measureTable = new Handsontable(
        document.getElementById('measureTable'),
        {
            colHeaders: ['Time', 'Run #1'],
            columns: [
                {
                    data: 'time',
                    type: 'numeric',
                    format: '0.000',
                    readOnly: true
                },
                {
                    data: 'position1',
                    type: 'numeric',
                    format: '0.000'
                }
            ],
            colWidths: 80,
            currentRowClassName: 'selected-point-row',
            multiSelect: true,
            afterChange: (changes, source) => {
                if(changes) {
                    var change = changes[0];
                    if(change[1].includes("position")) {
                        // TODO: cleanup
                        var i = change[0]; // get the row
                        var meas = measurements[i]
                        meas["position" + numRuns] = change[3]; // set the value
                        measureTimes[i] = measurements[i].time;
                        measurePositions[i] = meas["position" + numRuns];
                        updateChart();
                    }
                }
            }
        }
    );
    
    function updateChart() {
        var dataPts = [];
        var lineData = [];
        for (var j=0; j < numRuns; j++) {
            for(var i=0; i < measurements.length; i++) {
                var meas = measurements[i]
                var run = (j + 1)
                dataPts.push({x:meas.time, y:meas["position" + run]});
            }
            lineData.push({        
                type: "line",
                dataPoints: dataPts,
                toolTipContent: "{x} s : {y}"
            })
            dataPts = []
        }        
        
        var chart = new CanvasJS.Chart("measureChart",
        {
            axisX: {
                minimum: 0,
                valueFormatString: "#.### s",
                gridThickness: 1,
                gridColor: "grey"
            },
            axisY:{
            },
            data: lineData,
            exportEnabled: true,
        });
        
        chart.render();
    }
    
	// hackey bit to get a simple fps solution in place. ideally the FPS should come 
	// from the video but the browser doesn't have access to that information, so
	// we get it from a button in the html instead
	var enableFPSButton = document.getElementById('enable-frame-seek');
	var fpsButtons = document.getElementById('hidden-fps');
    var fps15Button = document.getElementById('15-fps');
	var fps24Button = document.getElementById('24-fps');
	var fps25Button = document.getElementById('25-fps');
	var fps30Button = document.getElementById('30-fps');
	var fps50Button = document.getElementById('50-fps');
	var fps60Button = document.getElementById('60-fps');

	function hideEnableShowFPS() {
		var enableButton = document.getElementById('enable-frame-seek');
		fpsButtons.classList.remove("hidden");
	};

    function hideFPSButtons() {
		var frameButtons = document.getElementsByClassName('frame-btn')
		fpsButtons.classList.add("hidden");
        
		for (var i = 0; i < frameButtons.length; i++) {
			frameButtons[i].classList.remove("disabled");
            frameButtons[i].disabled = false;
		};
	}

	function setFPS(framerate) {
		video.fps = framerate;
		hideFPSButtons()
	}

	// The delta requires pausing since this level of fine control
	// is meaningless while the video is playing
	function videoTimeDelta(delta) {
		if (video.paused == true) {
		    setVideoTime(video.currentTime + delta);
            draw(video,canvas.getContext('2d'),canvasWidth,canvasHeight, false); // updates the canvas
        } 
	}
    
    function setVideoTime(time) {
        video.addEventListener('canplay', drawOnTimeChange);
        video.currentTime = time;
    }
    
    // Update the canvas when video frame is loaded
    video.addEventListener('canplay', drawFirstFrame);
    
    function drawFirstFrame(e) {
        video.removeEventListener('canplay', drawFirstFrame);
        video.play();
        draw(video,canvas.getContext('2d'),canvasWidth,canvasHeight, false);
        video.pause();
    }
    
    function drawOnTimeChange(e) {
        video.removeEventListener('canplay', drawOnTimeChange);
        draw(video,canvas.getContext('2d'),canvasWidth,canvasHeight, false);
    }

	// Listener to show the fps buttons
	enableFPSButton.addEventListener('click', hideEnableShowFPS, false);
	
	// Listener to get the FPS from the buttons
	video.fps = 9999999; // dummy	
    fps15Button.addEventListener("click",function(){ setFPS(15) }, false);
	fps24Button.addEventListener("click",function(){ setFPS(24) }, false);
	fps25Button.addEventListener("click",function(){ setFPS(24.99) }, false);
	fps30Button.addEventListener("click",function(){ setFPS(30) }, false);
	fps50Button.addEventListener("click",function(){ setFPS(50) }, false);
	fps60Button.addEventListener("click",function(){ setFPS(60) }, false);
	
	// Enables the +/- functions of the framerate buttons
	plusButton.addEventListener("click", function(){
        if (video.fps == 9999999) {
            alert("FPS not set!");
        } else {
            videoTimeDelta(1/video.fps)
        }
    });
	minusButton.addEventListener("click", function(){
        if (video.fps == 9999999) {
            alert("FPS not set!");
        } else {
            videoTimeDelta(-1/video.fps)
        }
    });
	
	// Event listener for the play/pause button
	playButton.addEventListener("click", function() {
		if (video.loaded) {
			if (video.paused == true) {
				video.play();
				setPauseBtn();
			} else {
				video.pause();
                setPlayBtn();
			}
		}
	});
    
    function setPlayBtn() {
        playButton.innerHTML = "<i class='fa fa-play'></i>";
    }
		
    function setPauseBtn() {
        playButton.innerHTML = "<i class='fa fa-pause'></i>";
    }
    
	// Event listener for the mute button
	muteButton.addEventListener("click", function() {
		if (video.muted == false) {
            // Mute the video
            video.muted = true;

            // Update the button text
            muteButton.innerHTML = "<i class='fa fa-volume-off'></i><i class='fa fa-times'></i>";
		} else {
            // Unmute the video
            video.muted = false;

            // Update the button text
            muteButton.innerHTML = "<i class='fa fa-volume-up'></i>";
		}
	});
	
	// Event listener for the volume bar
	volumeBar.addEventListener("change", function() {
		// Update the video volume
		video.volume = volumeBar.value;
	});
	
	// Event listener for the full-screen button
	fullScreenButton.addEventListener("click", function() {
		if (video.requestFullscreen) {
		video.requestFullscreen();
		} else if (video.mozRequestFullScreen) {
		video.mozRequestFullScreen(); // Firefox
		} else if (video.webkitRequestFullscreen) {
		video.webkitRequestFullscreen(); // Chrome and Safari
		}
	});
	
	// Event listener for the seek bar
	seekBar.addEventListener("change", function() {
        // Calculate the new time
		var time = video.duration * (seekBar.value / 100);
	   
        video.addEventListener('canplay', drawOnTimeChange);
		// Update the video time
		setVideoTime(time);
	});
    
	// Update the seek bar as the video plays
	video.addEventListener("timeupdate", function() {
		// Calculate the slider value
		var value = (100 / video.duration) * video.currentTime;
	
		// Update the slider value
		seekBar.value = value;
	});
    
	video.onloadeddata = function() {
        currentTime.innerHTML = video.currentTime.toFixed(3);
		document.getElementById("duration").innerHTML = video.duration.toFixed(3);
        startTime = 0;
		initCanvas(video, canvas);

        
        // jump video to point time on row selection
        measureTable.updateSettings({
            afterSelectionEnd: function(e) {
                setVideoTime(measurements[e].time + startTime);
            }
        });
        
        videoControls.classList.remove("hidden");
	};
	
	// Update the current time display
	video.addEventListener("timeupdate", function() {
        updateTimeDisplay();
    });
                           
    function updateTimeDisplay() {
		document.getElementById("duration").innerHTML = (video.duration - startTime).toFixed(3);
		currentTime.innerHTML = (video.currentTime - startTime).toFixed(3);
	}
    
    video.addEventListener("ended", function() {
		setPlayBtn();		
	});
	
	// Pause the video when the slider handle is being dragged
	seekBar.addEventListener("mousedown", function() {
		video.pause();
	});
	
	// Play the video when the slider handle is dropped
	seekBar.addEventListener("mouseup", function() {
        // to cue that the video is paused and needs to be played
		setPlayBtn();
	});

	// Allows keyboard controls
	document.onkeypress=function(e){
		var key = e.charCode; 
		console.log("Key code:" + e.charCode.toString()) // uncomment this to see live key presses
		if (key == 112 && video.loaded == true) { // p : play
			playButton.click()
		} else if (key == 102) {
			// f : fullscreen
			fullScreenButton.click()
		} else if (key == 45 || key == 95) {
			// - or _ : go back a frame
            if (video.fps == 9999999) {
                alert("FPS not set!");
            } else {
                minusButton.click()
            }
			
		} else if (key == 61 || key == 43 ) {
			// + or = : go forward a frame
            if (video.fps == 9999999) {
                alert("FPS not set!");
            } else {
			    plusButton.click()
            }
		} else if (key == 109) {
			// m : mute
			muteButton.click()
		};
	}

	// This handles rotating the video. There's probably a more reliable way to do this
	// since more/other/complex transforms may be done on the element
	function rotateElement(element) {
		if (element.style.transform === 'rotate(90deg)') { 
			element.style.transform = 'rotate(180deg)' }
		else if (element.style.transform === 'rotate(180deg)') { 
			element.style.transform = 'rotate(270deg)' }
		else if (element.style.transform === 'rotate(270deg)') { 
			element.style.transform = 'rotate(0deg)' }		
		else { element.style.transform='rotate(90deg)' }
	}

	// Listener for the rotate button
	var rotateButton = document.getElementById("rotate-video");	
	rotateButton.addEventListener("click", function(){rotateElement(canvas)});


	// Draws the video on the canvas
	function initCanvas(video, canvas) {
        console.log('initCanvas');
		var context = canvas.getContext('2d');
		canvasWidth = video.videoWidth;
	    canvasHeight = video.videoHeight;
	    video.style.display = 'none';
	    canvas.width = canvasWidth;
	    canvas.height = canvasHeight;
	   
        // update canvas as video plays
        video.addEventListener('play', ()=>{
            draw(video,context,canvasWidth,canvasHeight, true);
	    },false);
	}
    
    function draw(v,c,w,h,repeat) {
        console.log("draw");
       if(repeat && (v.paused || v.ended)) return false;
       
//       c.clearRect(0, 0, w, h); // shouldn't be needed since we are redrawing over the entire canvas
	   c.drawImage(v,0,0,w,h);
       if(repeat) {
	       setTimeout(draw,20,v,c,w,h, true);
       }
       
       // check for point at or before current time
       var delta = 0;
       for(var i = 0; i < points.length; i++) {
           var pt = points[i];
           var alpha = 0.3;
           if(pointTimes[i] <= v.currentTime) {
               delta = v.currentTime - pointTimes[i];
               alpha = Math.max(1 - delta, alpha);
           }
           drawPoint(pt.x, pt.y, alpha);
       }
	}
    
    var numRuns = 1;
    var columnHeaders = ['Time', 'Run #' + numRuns];
    var columnData = [
                {
                    data: 'time',
                    type: 'numeric',
                    format: '0.000',
                    readOnly: true
                },
                {
                    data: 'position1',
                    type: 'numeric',
                    format: '0.000'
                }
            ]
    
    var resetTimerBtn = document.getElementById("resetTimerBtn");
    
    resetTimerBtn.addEventListener("click", (e) => {
        startTime = video.currentTime;
        updateTimeDisplay();
        console.log("new start time: " + startTime);
        
        numRuns++;
        columnHeaders = columnHeaders.concat(['Run #' + numRuns]);
        columnData = columnData.concat([{
                    data: 'position' + numRuns,
                    type: 'numeric',
                    format: '0.000'
                }]);

        // adds a new column per click
        measureTable.updateSettings({
            columns: columnData,
            colHeaders: columnHeaders
        });        
    });
    
    addEntryBtn.addEventListener("click", (e) => {
        var time = video.currentTime - startTime;
        
        if (time < 0) {
            startTime = video.currentTime;
            console.log("negative time, resetting starttime \nnew start time: " + startTime);
            time = video.currentTime - startTime;
            

        }
        updateTimeDisplay();
        addTimeEntry(time); 
    });
    
    document.measureTable = measureTable;
    document.measurements = measurements;
    document.measureTable.updateChart = updateChart()
    
    
    function addTimeEntry(time) {
        console.log("time: " + time)
        if(measureTimes.indexOf(time) != -1) return;
        
        for(var i=0; i < measurements.length; i++) {
            if(measureTimes[i] > time ) {
                break;
            }
        }
        measurements.splice(i, 0, {time: Math.round(time * 1000) / 1000});
        //update table
        measureTable.loadData(measurements);
        measureTable.selectCell(i, numRuns);
        updateChart();
    }

    deleteEntryBtn.addEventListener("click", (e) => {
        var time = video.currentTime - startTime;
        deleteTimeEntry(time); 
    });
    
    function deleteTimeEntry(time) {
        var i = measureTimes.indexOf(time);
        if(i == -1) return;
        
        measurements.splice(i, 1);
        measureTimes.splice(i, 1);
        measurePositions.splice(i, 1);
        
        measureTable.loadData(measurements);
        updateChart();
    }


    function drawPoint(x, y, alpha=1) {
        var ctx = canvas.getContext('2d');
        ctx.fillStyle = "rgba(255, 0, 0, " + alpha + ")";
        ctx.beginPath();
        ctx.arc(x, y, 4, 0, Math.PI * 2, true);
        ctx.fill();
    }
}

