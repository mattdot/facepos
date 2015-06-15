

// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;
    var speechRecognizer = new Windows.Media.SpeechRecognition.SpeechRecognizer();
    var spokenText = '';
    var orderDrinkButton;
    var stopOrderDrinkButton;

    var items = [
        //Beers
    { title: "Heienken", text: "Beer", picture: "/images/beer.jpg" },
    { title: "Amstel Light", text: "Beer", picture: "/images/beer.jpg" },
    { title: "Budweiser", text: "Beer", picture: "/images/beer.jpg" },
    { title: "Bud Light", text: "Beer", picture: "/images/beer.jpg" },
    { title: "Black Raven Stout", text: "Beer", picture: "/images/beer.jpg" },
    { title: "Guiness", text: "Beer", picture: "/images/beer.jpg" },
    { title: "Bass Ale", text: "Beer", picture: "/images/beer.jpg" },
    { title: "Trickster", text: "Beer", picture: "/images/beer.jpg" },

    //Liquor 
    { title: "Vodka", text: "Liquor", picture: "/images/ScotchOnTheRocks.png" },
    { title: "Whiskey", text: "Liquor", picture: "/images/ScotchOnTheRocks.png" },
    { title: "Scotch", text: "Liquor", picture: "/images/ScotchOnTheRocks.png" },
    { title: "Gin", text: "Liquor", picture: "/images/ScotchOnTheRocks.png" },
    { title: "Lagavulin", text: "Liquor", picture: "/images/ScotchOnTheRocks.png" },
    { title: "Vodka Tonic", text: "Liquor", picture: "/images/ScotchOnTheRocks.png" },
    { title: "Jack and Coke", text: "Liquor", picture: "/images/ScotchOnTheRocks.png" },
    { title: "Macallan", text: "Liquor", picture: "/images/ScotchOnTheRocks.png" },
    { title: "Absolute", text: "Liquor", picture: "/images/ScotchOnTheRocks.png" },
    { title: "Vodka Martini", text: "Liquor", picture: "/images/ScotchOnTheRocks.png" },
    { title: "Gin Martini", text: "Liquor", picture: "/images/ScotchOnTheRocks.png" },

        //Wine
    { title: "Cabernet", text: "Wine", picture: "/images/wine.png" },
    { title: "Merlot", text: "Wine", picture: "/images/wine.png" },
    { title: "Chardonnay", text: "Wine", picture: "/images/wine.png" }
    ];

    var myData = new WinJS.Binding.List(items);

    var grouped = myData.createGrouped(function (item) {
        return item.text.toUpperCase();
    }, function (item) {
        return {
            text: item.text
        };
    }, function (left, right) {
        return left.charCodeAt(0) - right.charCodeAt(0);
    });

    WinJS.Namespace.define("Sample.ListView", {
        modes: {
            single: {
                name: 'single',
                selectionMode: WinJS.UI.SelectionMode.single,
                tapBehavior: WinJS.UI.TapBehavior.directSelect
            }
        },
        data: grouped,
        listView: null,
        //changeSelectionMode: WinJS.UI.eventHandler(function (ev) {
        myData: new WinJS.Binding.List(items),
        context: {
        }
    });

    Sample.ListView.context = WinJS.Binding.as({ currentMode: Sample.ListView.modes.single });

    app.onactivated = function (args) {
        if (args.detail.kind === activation.ActivationKind.launch) {
            if (args.detail.previousExecutionState !== activation.ApplicationExecutionState.terminated) {
                // TODO: This application has been newly launched. Initialize your application here.
            } else {
                // TODO: This application has been reactivated from suspension.
                // Restore application state here.
            }
            args.setPromise(WinJS.UI.processAll().done(
                function () {
                    orderDrinkButton = document.querySelector("#orderDrinkButton");
                    stopOrderDrinkButton = document.querySelector("#stopOrderDrink");

                    var splitView = document.querySelector(".splitView").winControl;
                    new WinJS.UI._WinKeyboard(splitView.paneElement); // Temporary workaround: Draw keyboard focus visuals on NavBarCommands

                    var microphone = document.querySelector("#microphone");

                    stopOrderDrinkButton.addEventListener("click", stop);

                    orderDrinkButton.addEventListener("click", function () {
                        
                        // hide order button and show stop button
                        WinJS.Utilities.removeClass(stopOrderDrinkButton, "orderHidden");
                        WinJS.Utilities.addClass(stopOrderDrinkButton, "orderVisible");

                        WinJS.Utilities.removeClass(orderDrinkButton, "orderVisible");
                        WinJS.Utilities.addClass(orderDrinkButton, "orderHidden");

                        var settings = new Windows.Media.Capture.MediaCaptureInitializationSettings();
                        settings.StreamingCaptureMode = Windows.Media.Capture.StreamingCaptureMode.audio;
                        settings.mediaCategory = Windows.Media.Capture.MediaCategory.speech;
                        var mc = new Windows.Media.Capture.MediaCapture();

                        mc.initializeAsync(settings).done(function () {                        

                            var srtc = new Windows.Media.SpeechRecognition.SpeechRecognitionTopicConstraint(Windows.Media.SpeechRecognition.SpeechRecognitionScenario.dictation, "dictation");

                            speechRecognizer.constraints.append(srtc);

                            // Compile the default dictation grammar.
                            speechRecognizer.compileConstraintsAsync().done(

                              // Success function.
                              function (result) {
                                  
                                  speechRecognizer.continuousRecognitionSession.oncompleted = completedCallback;
                                  speechRecognizer.continuousRecognitionSession.onresultgenerated = resultGeneratedCallback;

                                  speechRecognizer.continuousRecognitionSession.startAsync();

                              });

                        });
                        document.querySelector("#lvDrinks").addEventListener("click", function addDrink() {
                            console.log("Got Here");
                        });
                    }
                );
                }));
        }
    };

    function stop()
    {
        speechRecognizer.continuousRecognitionSession.stopAsync();

        //speechRecognizer.close();

        // hide order button and show stop button
        WinJS.Utilities.removeClass(stopOrderDrinkButton, "orderVisible");
        WinJS.Utilities.addClass(stopOrderDrinkButton, "orderHidden");

        WinJS.Utilities.removeClass(orderDrinkButton, "orderHidden");
        WinJS.Utilities.addClass(orderDrinkButton, "orderVisible");
    }


    function resultGeneratedCallback(result)
    {
        spokenText += result.result.text;
    }
    function completedCallback(speechRecognitionResult) {

            var url = "https://api.projectoxford.ai/luis/v1/application?id=0989ace8-c367-450b-a8f1-e18130c1e19b&subscription-key=d7d74f752d614902b6a381cf6d530085&q=" + spokenText;

            //var url = "https://api.projectoxford.ai/luis/v1/application?id=0989ace8-c367-450b-a8f1-e18130c1e19b&subscription-key=d7d74f752d614902b6a381cf6d530085&q=" + "I would like to order a macallan";

            var options = {
                    url: url,
                    type: 'GET'
        };
            WinJS.xhr(options).done(
                function (result) {
                    callback(result.responseText, result.status);
            },
                function (result) {
                    callback(null, result.status);
            }
            );
    }

        function callback(responseText, status) {
            if (status === 200) {
                var queryResult = JSON.parse(responseText);
                console.log(queryResult);
            } else {
                output("Error obtaining speech to text. XHR status code: " +status);
        }
    }

        app.oncheckpoint = function (args) {
            // TODO: This application is about to be suspended. Save any state that needs to persist across suspensions here.
            // You might use the WinJS.Application.sessionState object, which is automatically saved and restored across suspension.
            // If you need to complete an asynchronous operation before your application is suspended, call args.setPromise().
    };

        app.start();
    })();
