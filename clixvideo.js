document.addEventListener("DOMContentLoaded", videoPlayerInit)
function videoPlayerInit() {

    function playFile(event) {
        var file = event.target.files[0]
        var videoNode = document.querySelector("video")
        var fileURL = window.URL.createObjectURL(file)
        videoNode.src = fileURL
        videoNode.loaded = true
    }

    document.inputNode = document.getElementById("input") 
    document.inputNode.addEventListener("change", playFile, false)
    initButtons()

    if (navigator.userAgent.indexOf("Chrome") == -1) {
        alert("This tool is written for Chrome49+.\nPlease change to a supported browser.")
    }
}

function initButtons() {
// Buttons	
    var playButton = document.getElementById("play-pause")
    var muteButton = document.getElementById("mute")
    var fullScreenButton = document.getElementById("full-screen")
    var plusButton = document.getElementById("plus-one-frame")
    var minusButton = document.getElementById("minus-one-frame")

    // Sliders
    var seekBar = document.getElementById("seek-bar")
    var volumeBar = document.getElementById("volume-bar")

    // Time
    var currentTime = document.getElementById("current-time")

    // Video
    var video = document.getElementById("video")
    var canvas = document.getElementById("video-canvas")
    var videoControls = document.getElementById("video-controls")
    // initCanvas(video, canvas);

    // Motion tracking points
    var points = []
    var pointTimes = []


    // Time / distance data
    var measurements = []
    document.measureTimes = []
    var startTime = 0
    document.numRuns = 0

    var columnHeaders = ["Time"]
    var columnData = [
        {
            data: "time",
            type: "numeric",
            format: "0.000",
            readOnly: true
        }
    ]
    var measureTable = new Handsontable(
        document.getElementById("measureTable"),
        {
            colHeaders: ["Time"],
            columns: [
                {
                    data: "time",
                    type: "numeric",
                    format: "0.000",
                    readOnly: true
                }
            ],
            colWidths: 80,
            currentRowClassName: "selected-point-row",
            multiSelect: false,
            outsideClickDeselects: false,
            afterChange: (changes) => {
                if(changes) {
                    console.log(changes)
                    var change = changes[0]
                    if(change[1].includes("position")) {
                        // TODO: cleanup
                        var i = change[0] // get the row
                        document.measureTimes[i] = measurements[i].time
                        updateChart()
                    }
                }
            }
        }
    )

    function updateChart() {
        var dataPts = []
        var lineData = []
        //        console.log("numRuns: " + document.numRuns)
        //        console.log("measurements ")
        //        console.log(document.measurements)

        for (var run=1; run <= document.numRuns; run++) {
            for(var i=0; i < document.measurements.length; i++) {
                var meas = document.measurements[i]
                //                var run = (j + 1)
                if (meas["position" + run] != null) {
                    dataPts.push({x:meas.time, y:meas["position" + run]})
                }
            }
            lineData.push({        
                type: "line",
                dataPoints: dataPts,
                toolTipContent: "{x} s : {y}"
            })
            //            console.log(dataPts)
            dataPts = []
        }       

        //        console.log(lineData)
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
            })

        chart.render()
    }

    // hackey bit to get a simple fps solution in place. ideally the FPS should come 
    // from the video but the browser doesn't have access to that information, so
    // we get it from a button in the html instead
    var enableFPSButton = document.getElementById("enable-frame-seek")
    var fpsButtons = document.getElementById("hidden-fps")
    var fps15Button = document.getElementById("15-fps")
    var fps24Button = document.getElementById("24-fps")
    var fps25Button = document.getElementById("25-fps")
    var fps30Button = document.getElementById("30-fps")
    var fps50Button = document.getElementById("50-fps")
    var fps60Button = document.getElementById("60-fps")

    function hideEnableShowFPS() {
        fpsButtons.classList.remove("hidden")
    }

    function hideFPSButtons() {
        var frameButtons = document.getElementsByClassName("frame-btn")
        fpsButtons.classList.add("hidden")

        for (var i = 0; i < frameButtons.length; i++) {
            frameButtons[i].classList.remove("disabled")
            frameButtons[i].disabled = false
        }
    }

    function setFPS(framerate) {
        video.fps = framerate
        hideFPSButtons()
    }

    // The delta requires pausing since this level of fine control
    // is meaningless while the video is playing
    function videoTimeDelta(delta) {
        if (video.paused == true) {
            setVideoTime(video.currentTime + delta)
            draw(video,canvas.getContext("2d"),document.canvasWidth,document.canvasHeight, false) // updates the canvas
        } 
    }

    function setVideoTime(time) {
        video.addEventListener("canplay", drawOnTimeChange)
        video.currentTime = time
    }

    // Update the canvas when video frame is loaded
    video.addEventListener("canplay", drawFirstFrame)

    function drawFirstFrame() {
        video.removeEventListener("canplay", drawFirstFrame)
        video.play()
        draw(video,canvas.getContext("2d"),document.canvasWidth,document.canvasHeight, false)
        video.pause()
    }

    function drawOnTimeChange() {
        video.removeEventListener("canplay", drawOnTimeChange)
        draw(video,canvas.getContext("2d"),document.canvasWidth,document.canvasHeight, false)
    }

    // Listener to show the fps buttons
    enableFPSButton.addEventListener("click", hideEnableShowFPS, false)

    // Listener to get the FPS from the buttons
    video.fps = 9999999 // dummy	
    fps15Button.addEventListener("click",function(){ setFPS(15) }, false)
    fps24Button.addEventListener("click",function(){ setFPS(24) }, false)
    fps25Button.addEventListener("click",function(){ setFPS(24.99) }, false)
    fps30Button.addEventListener("click",function(){ setFPS(30) }, false)
    fps50Button.addEventListener("click",function(){ setFPS(50) }, false)
    fps60Button.addEventListener("click",function(){ setFPS(60) }, false)

    // Enables the +/- functions of the framerate buttons
    plusButton.addEventListener("click", function(){
        if (video.fps == 9999999) {
            alert("FPS not set!")
        } else {
            videoTimeDelta(1/video.fps)
        }
    })
    minusButton.addEventListener("click", function(){
        if (video.fps == 9999999) {
            alert("FPS not set!")
        } else {
            videoTimeDelta(-1/video.fps)
        }
    })

    // Event listener for the play/pause button
    playButton.addEventListener("click", function() {
        if (video.loaded) {
            if (video.paused == true) {
                video.play()
                setPauseBtn()
            } else {
                video.pause()
                setPlayBtn()
            }
        }
    })

    function setPlayBtn() {
        playButton.innerHTML = "<i class='fa fa-play'></i>"
    }

    function setPauseBtn() {
        playButton.innerHTML = "<i class='fa fa-pause'></i>"
    }

    // Event listener for the mute button
    muteButton.addEventListener("click", function() {
        if (video.muted == false) {
            // Mute the video
            video.muted = true

            // Update the button text
            muteButton.innerHTML = "<i class='fa fa-volume-off'></i><i class='fa fa-times'></i>"
        } else {
            // Unmute the video
            video.muted = false

            // Update the button text
            muteButton.innerHTML = "<i class='fa fa-volume-up'></i>"
        }
    })

    // Event listener for the volume bar
    volumeBar.addEventListener("change", function() {
        // Update the video volume
        video.volume = volumeBar.value
    })

    // Event listener for the full-screen button
    fullScreenButton.addEventListener("click", function() {
        if (video.requestFullscreen) {
            video.requestFullscreen()
        } else if (video.mozRequestFullScreen) {
            video.mozRequestFullScreen() // Firefox
        } else if (video.webkitRequestFullscreen) {
            video.webkitRequestFullscreen() // Chrome and Safari
        }
    })

    // Event listener for the seek bar
    seekBar.addEventListener("change", function() {
        // Calculate the new time
        var time = video.duration * (seekBar.value / 100)

        video.addEventListener("canplay", drawOnTimeChange)
        // Update the video time
        setVideoTime(time)
    })

    // Update the seek bar as the video plays
    video.addEventListener("timeupdate", function() {
        // Calculate the slider value
        var value = (100 / video.duration) * video.currentTime

        // Update the slider value
        seekBar.value = value
    })

    video.onloadeddata = function() {
        currentTime.innerHTML = video.currentTime.toFixed(3)
        document.getElementById("duration").innerHTML = video.duration.toFixed(3)
        startTime = 0
        initCanvas(video, canvas)

        videoControls.classList.remove("hidden")
    }

    // Update the current time display
    video.addEventListener("timeupdate", function() {
        updateTimeDisplay()
    })

    function updateTimeDisplay() {
        document.getElementById("duration").innerHTML = (video.duration - startTime).toFixed(3)
        currentTime.innerHTML = (video.currentTime - startTime).toFixed(3)
    }

    video.addEventListener("ended", function() {
        setPlayBtn()		
    })

    // Pause the video when the slider handle is being dragged
    seekBar.addEventListener("mousedown", function() {
        video.pause()
    })

    // Play the video when the slider handle is dropped
    seekBar.addEventListener("mouseup", function() {
        // to cue that the video is paused and needs to be played
        setPlayBtn()
    })

    // Allows keyboard controls
    document.onkeypress=function(e){
        var key = e.charCode
        //        console.log("Key code:" + e.charCode.toString()) // uncomment this to see live key presses
        if (video.loaded == true) {
            if (key == 112) { // p : play
                playButton.click()
            } else if (key == 102) {
                // f : fullscreen
                fullScreenButton.click()
                return false
            } else if (key == 45 || key == 95) {
                // - or _ : go back a frame
                if (video.fps == 9999999) {
                    alert("FPS not set!")
                } else {
                    minusButton.click()
                }
                return false			
            } else if (key == 61 || key == 43 ) {
                // + or = : go forward a frame
                if (video.fps == 9999999) {
                    alert("FPS not set!")
                } else {
                    plusButton.click()
                }
                return false
            } else if (key == 109) {
                // m : mute
                muteButton.click()
                return false
            }
        }
    }

    measureTable.updateSettings({
        beforeKeyDown: function (e) {
            var key = e.keyCode
            // this bit prevents hotkey presses from being entered into the spreadsheet
            // 80 is p, 70 is f, -/_ is 189,+/= is 187, m is 77
            // Not sure how stable these are across browsers & versions
            if (video.loaded == true) {
                if (key == 80 || key == 70 || key == 189 || key == 187 || key == 77 ) {
                    //                    console.log(key)
                    document.measureTable.deselectCell()
                    e.stopImmediatePropagation()
                }
            }
        }
    })

    // This handles rotating the video. There's probably a more reliable way to do this
    // since more/other/complex transforms may be done on the element
    function rotateElement(element) {
        if (element.style.transform === "rotate(90deg)") { 
            element.style.transform = "rotate(180deg)" }
        else if (element.style.transform === "rotate(180deg)") { 
            element.style.transform = "rotate(270deg)" }
        else if (element.style.transform === "rotate(270deg)") { 
            element.style.transform = "rotate(0deg)" }		
        else { element.style.transform="rotate(90deg)" }
    }

    // Listener for the rotate button
    var rotateButton = document.getElementById("rotate-video")	
    rotateButton.addEventListener("click", function(){rotateElement(canvas)})


    // Draws the video on the canvas
    function initCanvas(video, canvas) {
        //        console.log("initCanvas")
        var context = canvas.getContext("2d")
        document.canvasWidth = video.videoWidth
        document.canvasHeight = video.videoHeight
        video.style.display = "none"
        canvas.width = document.canvasWidth
        canvas.height = document.canvasHeight

        // update canvas as video plays
        video.addEventListener("play", ()=>{
            draw(video,context,document.canvasWidth,document.canvasHeight, true)
        },false)
    }

    function draw(v,c,w,h,repeat) {
        //        console.log("draw");
        if(repeat && (v.paused || v.ended)) return false

        //       c.clearRect(0, 0, w, h); // shouldn't be needed since we are redrawing over the entire canvas
        c.drawImage(v,0,0,w,h)
        if(repeat) {
            setTimeout(draw,20,v,c,w,h, true)
        }

        // check for point at or before current time
        var delta = 0
        for(var i = 0; i < points.length; i++) {
            var pt = points[i]
            var alpha = 0.3
            if(pointTimes[i] <= v.currentTime) {
                delta = v.currentTime - pointTimes[i]
                alpha = Math.max(1 - delta, alpha)
            }
            drawPoint(pt.x, pt.y, alpha)
        }
    }

    var resetTimerBtn = document.getElementById("resetTimerBtn")

    resetTimerBtn.addEventListener("click", () => {
        measureTable.selectCell(0,0)
        startTime = video.currentTime
        updateTimeDisplay()
        console.log("new start time: " + startTime)

        document.numRuns++
        columnHeaders = columnHeaders.concat(["Run #" + document.numRuns])
        columnData = columnData.concat([{
            data: "position" + document.numRuns,
            type: "numeric",
            format: "0.000"
        }])

        // adds a new column per click
        document.readOnlyRows = []
        measureTable.updateSettings({
            columns: columnData,
            colHeaders: columnHeaders,
            cells: function (row, col) {
                var cellProperties = {}
                if (col == 0) {
                    cellProperties.readOnly = true
                }
                return cellProperties
            }
        })       
        document.measureTable.loadData(document.measurements)
    })

    addEntryBtn.addEventListener("click", () => {
        measureTable.selectCell(0,0)
        var time = video.currentTime - startTime

        if (time < 0) {
            startTime = video.currentTime
            //            console.log("negative time, resetting starttime \nnew start time: " + startTime)
            time = video.currentTime - startTime


        }
        time = Math.round(time * 1000) / 1000
        updateTimeDisplay()
        //        console.log(time)
        addTimeEntry(time) 
        measureTable.updateSettings({
            cells: function (row,col) { 
                var cellProperties = {}       
                if (col == 0) {
                    cellProperties.readOnly = true
                }
                return cellProperties
            }
        })   

    })

    document.measureTable = measureTable
    document.measurements = measurements
    document.measureTable.updateChart = updateChart()


    function addTimeEntry(time) {
        if(document.measureTimes.indexOf(time) != -1) {
            alert("A row for this time already exists.")
            return
        }

        document.measureTimes.push(time)
        document.measureTimes.sort(function(a,b){return a - b})
        document.measurements.push({time: Math.round(time * 1000) / 1000})
        document.measurements = document.measurements.sort(function(a,b){return a.time - b.time})

        document.measureTable.loadData(document.measurements)
        document.measureTable.selectCell(document.measureTimes.indexOf(time), document.numRuns)
        updateChart()
        console.log(document.measurements)
    }

    deleteEntryBtn.addEventListener("click", () => {
        var selection = document.measureTable.getSelected()
        deleteTimeEntry(selection) 
    })

    function deleteTimeEntry(cell) {
        //        console.log(cell)
        var cellX = cell[1]
        var cellY = cell[0]
        //        console.log("deleteing xy: " + cellX + " " + cellY)
        if (cellX == 0) {
            document.measurements.splice(cellY,1)
            document.measureTimes.splice(cellY,1)
        } else {
            document.measurements[cellY]["position" + cellX] = null
        }
        document.measureTable.loadData(document.measurements)
        updateChart()
    }


    function drawPoint(x, y, alpha=1) {
        var ctx = canvas.getContext("2d")
        ctx.fillStyle = "rgba(255, 0, 0, " + alpha + ")"
        ctx.beginPath()
        ctx.arc(x, y, 4, 0, Math.PI * 2, true)
        ctx.fill()
    }
}

