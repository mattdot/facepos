(function () {

    "use strict";
    var isAnalyzing = false;
    var oMediaCapture;
    var profile;
    var captureInitSettings;
    var deviceList = new Array();
    var recordState = false;
    var storageFile;
    var photosPerSecond = 10;


    var page = WinJS.UI.Pages.define("/hello.html", {

        ready: function (element, options) {
            initialization();
        },

        unload: function (element, options) {
        }
    });

    function errorHandler(e) {
        document.getElementById("message").innerHTML = e.message;
    }

    function displayMessage(msg) {
        document.getElementById("message").innerHTML = msg;
    }

    // Begin initialization.
    function initialization() {
        displayMessage("Initialization started.");
        enumerateCameras();
    }


    // Identify available cameras.
    function enumerateCameras() {
        var deviceInfo = Windows.Devices.Enumeration.DeviceInformation;
        deviceInfo.findAllAsync(Windows.Devices.Enumeration.DeviceClass.videoCapture).then(function (devices) {
            // Add the devices to deviceList
            if (devices.length > 0) {

                for (var i = 0; i < devices.length; i++) {
                    deviceList.push(devices[i]);
                }

                initCaptureSettings();
                initMediaCapture();
                
                displayMessage("Initialization complete.");

            } else {
                displayMessage("No camera device is found ");
            }
        }, errorHandler);
    }


    // Initialize the MediaCaptureInitialzationSettings.
    function initCaptureSettings() {
        captureInitSettings = null;
        captureInitSettings = new Windows.Media.Capture.MediaCaptureInitializationSettings();
        captureInitSettings.audioDeviceId = "";
        captureInitSettings.videoDeviceId = "";
        captureInitSettings.streamingCaptureMode = Windows.Media.Capture.StreamingCaptureMode.audioAndVideo;
        captureInitSettings.photoCaptureSource = Windows.Media.Capture.PhotoCaptureSource.auto;
        if (deviceList.length > 0)
            captureInitSettings.videoDeviceId = deviceList[0].id;
    }


    // Create a profile.
    function createProfile() {
        profile = Windows.Media.MediaProperties.MediaEncodingProfile.createMp4(
            Windows.Media.MediaProperties.VideoEncodingQuality.hd720p);
    }

    // Create and initialze the MediaCapture object.
    function initMediaCapture() {
        oMediaCapture = null;
        oMediaCapture = new Windows.Media.Capture.MediaCapture();
        oMediaCapture.initializeAsync(captureInitSettings).then(function (result) {
            createProfile();
            var video = document.getElementById("previewVideo");
            video.src = URL.createObjectURL(oMediaCapture, { oneTimeOnly: true });
            video.play();
            displayMessage("Preview started");
            var timer = setInterval(function () { capturePhoto() }, 1000);
        }, errorHandler);
    }

    function capturePhoto() {
        if (!isAnalyzing) {
            isAnalyzing = true;
            Windows.Storage.KnownFolders.picturesLibrary.createFileAsync("cameraCapture.png", Windows.Storage.CreationCollisionOption.replaceExisting).then(function (photoFile) {
                var photoFormat = Windows.Media.MediaProperties.ImageEncodingProperties.createPng();
                photoFormat.width = 200;
                photoFormat.height = 200;
                oMediaCapture.capturePhotoToStorageFileAsync(photoFormat, photoFile).then(function (result) {
                    displayMessage("Captured");
                    detect(photoFile);
                }, errorHandler);
            });
        }
    }

    function detect(photoFile) {
        photoFile.openAsync(Windows.Storage.FileAccessMode.read).then(function (stream) {
            var blob = MSApp.createBlobFromRandomAccessStream("image/png", stream);
            WinJS.xhr({
                type: "POST",
                url: "https://api.projectoxford.ai/face/v0/detections/?analyzesAge=true",
                data: blob,
                headers: {
                    "Content-Type": "application/octet-stream",
                    "Ocp-Apim-Subscription-Key": "d3151dd7f3314a848baa820db31fac11"
                }
            }).done(
                function completed(xhr) {
                    var detections = JSON.parse(xhr.responseText);
                    if (detections) {
                        var faceId = detections[0].faceId;
                        if (faceId) {
                            identify([faceId]);
                        }
                    }
                },
                function error(request) {
                    displayMessage(request);

                    isAnalyzing = false;
                });
        }, errorHandler);
    }

    function identify(faceIds) {
        var idReq = {
            faceIds: faceIds,
            personGroupId: 1,
            maxNumOfCandidatesReturned: 3 
        };

        WinJS.xhr({
            type: "POST",
            url: "https://api.projectoxford.ai/face/v0/identifications",
            data: JSON.stringify(idReq),
            headers: {
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": "d3151dd7f3314a848baa820db31fac11"
            }
        }).done(
        function completed(xhr) {
            var identifications = JSON.parse(xhr.responseText);
            if (identifications && identifications.candidates) {
                displayMessage("Person Found");

                isAnalyzing = false;
            } else {
                createPerson(faceIds)
            }
        },
        function error(request) {

            isAnalyzing = false;
            displayMessage(request);
        });
    }

    function createPerson(faceIds) {        
        var person = { faceIds: faceIds, name: "UNKNOWN" };

        WinJS.xhr({
            type: "POST",
            url: "https://api.projectoxford.ai/face/v0/persongroups/1/persons",
            data: JSON.stringify(person),
            headers: {
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": "d3151dd7f3314a848baa820db31fac11"
            }
        }).done(
        function completed(xhr) {
            var person = JSON.parse(xhr.responseText);
            if (person) {
                displayMessage("Person Created");
                trainModel();
            } else {

                isAnalyzing = false;
                displayMessage("Could not create new person");
            }
        },
        function error(request) {

            isAnalyzing = false;
            displayMessage(request);
        });
    }

    function trainModel() {

        WinJS.xhr({
            type: "POST",
            url: "https://api.projectoxford.ai/face/v0/persongroups/1/training",
            headers: {
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": "d3151dd7f3314a848baa820db31fac11"
            }
        }).done(
        function completed(xhr) {

            isAnalyzing = false;
            displayMessage("Model updated");
        },
        function error(request) {

            isAnalyzing = false;
            displayMessage(request);
        });

    }

    // Stop the video capture.
    function stopMediaCaptureSession() {
        oMediaCapture.stopRecordAsync().then(function (result) {

        }, errorHandler);
    }

})();