(function() {
    "use strict";

    var overlay = $("#overlay");
    var content = $("#server-list");

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

    $("#user-registration").click(function() {
        var name = prompt("Please enter user name");
        var password = prompt("Pleas enter password");

        if (!name || !password) {
            return;
        }

        $.ajax("/api/v1/users", {
            method: "PUT",
            contentType: "application/json",
            data: JSON.stringify({
                user: name,
                password: password
            })
        }).then(function() {
            alert("User registered!");
        });
    });
})();