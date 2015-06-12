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
    var timer;


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
        var setupCameraPromise = enumerateCamerasAsync()
            .then(initMediaCaptureAsync)
            .done(watchForPatrons);
    }

    function watchForPatrons() {
        //timer = setInterval(function () { 
        if (!isAnalyzing) {
            isAnalyzing = true;
            capturePhotoAsync()
                .then(detectAsync, errorHandler)
                .then(identifyAsync, errorHandler)
                .done(function (result) {
                    isAnalyzing = false;
                    if (result) {
                        if (result.isNew) {
                            trainModel();
                        }
                        //WinJS.Navigation.navigate("/ManageTab.html", result);
                        document.location = "/ManageTab.html";
                    }
                }, errorHandler);
        }
        //}, 1000);
    }

    // Identify available cameras.
    function enumerateCamerasAsync() {
        var deviceInfo = Windows.Devices.Enumeration.DeviceInformation;
        return deviceInfo.findAllAsync(Windows.Devices.Enumeration.DeviceClass.videoCapture).then(function (devices) {
            // Add the devices to deviceList
            if (devices.length > 0) {

                for (var i = 0; i < devices.length; i++) {
                    deviceList.push(devices[i]);
                }

                captureInitSettings = null;
                captureInitSettings = new Windows.Media.Capture.MediaCaptureInitializationSettings();
                captureInitSettings.audioDeviceId = "";
                captureInitSettings.videoDeviceId = "";
                captureInitSettings.streamingCaptureMode = Windows.Media.Capture.StreamingCaptureMode.audioAndVideo;
                captureInitSettings.photoCaptureSource = Windows.Media.Capture.PhotoCaptureSource.auto;
                if (deviceList.length > 0)
                    captureInitSettings.videoDeviceId = deviceList[0].id;

                //initMediaCapture();

                displayMessage("Initialization complete.");

            } else {
                displayMessage("No camera device is found ");
            }
        }, errorHandler);
    }


    // Initialize the MediaCaptureInitialzationSettings.
    //function initCaptureSettings() {
    //}


    // Create and initialze the MediaCapture object.
    function initMediaCaptureAsync() {
        oMediaCapture = null;
        oMediaCapture = new Windows.Media.Capture.MediaCapture();
        return oMediaCapture.initializeAsync(captureInitSettings).then(function (result) {
            //        profile = Windows.Media.MediaProperties.MediaEncodingProfile.createMp4(
            //Windows.Media.MediaProperties.VideoEncodingQuality.hd720p);
            var video = document.getElementById("previewVideo");
            video.src = URL.createObjectURL(oMediaCapture, { oneTimeOnly: true });
            video.play();
            displayMessage("Preview started");
        }, errorHandler);
    }

    function capturePhotoAsync() {

        return Windows.Storage.KnownFolders.picturesLibrary.createFileAsync("cameraCapture.png", Windows.Storage.CreationCollisionOption.replaceExisting).then(function (photoFile) {
            var photoFormat = Windows.Media.MediaProperties.ImageEncodingProperties.createPng();
            photoFormat.width = 200;
            photoFormat.height = 200;
            return oMediaCapture.capturePhotoToStorageFileAsync(photoFormat, photoFile).then(function (result) {
                displayMessage("Captured");
                return photoFile;
            }, errorHandler);
        });
    }

    function detectAsync(photoFile) {
        return photoFile.openAsync(Windows.Storage.FileAccessMode.read).then(function (stream) {
            var blob = MSApp.createBlobFromRandomAccessStream("image/png", stream);
            return WinJS.xhr({
                type: "POST",
                url: "https://api.projectoxford.ai/face/v0/detections/?analyzesAge=true",
                data: blob,
                headers: {
                    "Content-Type": "application/octet-stream",
                    "Ocp-Apim-Subscription-Key": "d3151dd7f3314a848baa820db31fac11"
                }
            }).then(
                function completed(xhr) {
                    var detections = JSON.parse(xhr.responseText);
                    if (detections && detections.length) {
                        var faceId = detections[0].faceId;
                        if (faceId) {
                            return [faceId];
                        }
                    }
                },
                function error(request) {
                    displayMessage(request);
                    isAnalyzing = false;
                });
        }, errorHandler);
    }

    function identifyAsync(faceIds) {
        var idReq = {
            faceIds: faceIds,
            personGroupId: 1,
            maxNumOfCandidatesReturned: 3
        };

        return WinJS.xhr({
            type: "POST",
            url: "https://api.projectoxford.ai/face/v0/identifications",
            data: JSON.stringify(idReq),
            headers: {
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": "d3151dd7f3314a848baa820db31fac11"
            }
        }).then(
        function completed(xhr) {
            var identifications = JSON.parse(xhr.responseText);
            if (identifications && identifications.length && identifications[0].candidates && identifications[0].candidates.length) {
                var candidate = identifications[0].candidates[0];
                displayMessage("Person Found");
                return { personId: candidate.personId, isNew: false };

                isAnalyzing = false;
            } else {
                return createPersonAsync(faceIds);
            }
        },
        function error(request) {

            isAnalyzing = false;
            displayMessage(request);
        });
    }

    function createPersonAsync(faceIds) {
        var person = { faceIds: faceIds, name: "UNKNOWN" };

        return WinJS.xhr({
            type: "POST",
            url: "https://api.projectoxford.ai/face/v0/persongroups/1/persons",
            data: JSON.stringify(person),
            headers: {
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": "d3151dd7f3314a848baa820db31fac11"
            }
        }).then(
        function completed(xhr) {
            var person = JSON.parse(xhr.responseText);
            if (person) {
                displayMessage("Person Created");
                return { personId : person.personId, isNew : true };
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

        return WinJS.xhr({
            type: "POST",
            url: "https://api.projectoxford.ai/face/v0/persongroups/1/training",
            headers: {
                "Content-Type": "application/json",
                "Ocp-Apim-Subscription-Key": "d3151dd7f3314a848baa820db31fac11"
            }
        }).then(
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