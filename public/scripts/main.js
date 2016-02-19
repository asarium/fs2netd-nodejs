(function() {
    "use strict";

    var overlay = $("#overlay");
    var content = $("#content");

    // Load the server list
    $.ajax("/api/v1/servers", {
        accepts: "application/json"
    }).then(function(data) {
        console.log(data);

        var names = data.map(function(server) {
            return server.name;
        });

        content.text(names.join("\n"));

        overlay.hide();
    });
})();