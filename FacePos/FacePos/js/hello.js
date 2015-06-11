(function () {

    "use strict";
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

            var photoFormat = Windows.Media.MediaProperties.ImageEncodingProperties.createPng();
            oMediaCapture.videoDeviceController.lowLagPhotoSequence.thumbnailRequestedSize = 300;
            oMediaCapture.videoDeviceController.lowLagPhotoSequence.thumbnailEnabled = true;
        }, errorHandler);
    }


    // Start the video capture.
    function startMediaCaptureSession() {
        Windows.Storage.KnownFolders.videosLibrary.createFileAsync("cameraCapture.mp4", Windows.Storage.CreationCollisionOption.generateUniqueName).then(function (newFile) {
            storageFile = newFile;
            oMediaCapture.startRecordToStorageFileAsync(profile, storageFile).then(function (result) {

            }, errorHandler);
        });
    }

    // Stop the video capture.
    function stopMediaCaptureSession() {
        oMediaCapture.stopRecordAsync().then(function (result) {

        }, errorHandler);
    }

})();