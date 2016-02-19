(function() {
    "use strict";

    var overlay = $("#overlay");
    var server_list = $("#server-list");
    var online_users_list = $("#online-users-list");

    // Load the server list
    $.ajax("/api/v1/servers", {
        accepts: "application/json"
    }).then(function(data) {
        console.log(data);

        var names = data.map(function(server) {
            return server.name;
        });

        server_list.append(names.join("<br>"));
    }).then(function(){
        return $.ajax("/api/v1/onlineusers",{
            accepts: "application/json"
        });
    }).then(function(data) {
        console.log(data);

        var names = data.map(function(user) {
            return user.name;
        });

        online_users_list.append(names.join("<br>"));
    }).then(function() {
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