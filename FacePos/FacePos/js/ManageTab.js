

// For an introduction to the Blank template, see the following documentation:
// http://go.microsoft.com/fwlink/?LinkId=232509
(function () {
    "use strict";

    var app = WinJS.Application;
    var activation = Windows.ApplicationModel.Activation;

    var itemArray = [
    { title: "Marvelous Mint", text: "Gelato", picture: "/images/60Mint.png" },
    { title: "Succulent Strawberry", text: "Sorbet", picture: "/images/60Strawberry.png" },
    { title: "Banana Blast", text: "Low-fat frozen yogurt", picture: "/images/60Banana.png" },
    { title: "Lavish Lemon Ice", text: "Sorbet", picture: "/images/60Lemon.png" },
    { title: "Creamy Orange", text: "Sorbet", picture: "/images/60Orange.png" },
    { title: "Very Vanilla", text: "Ice Cream", picture: "/images/60Vanilla.png" },
    { title: "Banana Blast", text: "Low-fat frozen yogurt", picture: "/images/60Banana.png" },
    { title: "Lavish Lemon Ice", text: "Sorbet", picture: "/images/60Lemon.png" }
    ];

    var items = [];

    // Generate 16 items
    for (var i = 0; i < 2; i++) {
        itemArray.forEach(function (item) {
            items.push(item);
        });
    }

    WinJS.Namespace.define("Sample.ListView", {
        modes: {
            single: {
                name: 'single',
                selectionMode: WinJS.UI.SelectionMode.single,
                tapBehavior: WinJS.UI.TapBehavior.directSelect
            }
        },
        listView: null,
        changeSelectionMode: WinJS.UI.eventHandler(function (ev) {
            var listView = Sample.ListView.listView;
            if (listView) {
                var command = ev.target;
                if (command.textContent) {
                    var mode = command.textContent.toLowerCase();
                    listView.selection.clear();

                    Sample.ListView.context.currentMode = Sample.ListView.modes[mode];

                    listView.selectionMode = Sample.ListView.context.currentMode.selectionMode;
                    listView.tapBehavior = Sample.ListView.context.currentMode.tapBehavior;
                }
            }
        }),
        data: new WinJS.Binding.List(items),
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
                    var splitView = document.querySelector(".splitView").winControl;
                    new WinJS.UI._WinKeyboard(splitView.paneElement); // Temporary workaround: Draw keyboard focus visuals on NavBarCommands

                    document.querySelector("#lvDrinks").addEventListener("click",    function addDrink() {
                        console.log("Got Here");
                    });
                }
                ));
        }
    };

    app.oncheckpoint = function (args) {
        // TODO: This application is about to be suspended. Save any state that needs to persist across suspensions here.
        // You might use the WinJS.Application.sessionState object, which is automatically saved and restored across suspension.
        // If you need to complete an asynchronous operation before your application is suspended, call args.setPromise().
    };

    app.start();
})();
