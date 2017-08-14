(function ($) {
    "use strict";

    const server_list = $("#tblServerList").find("tbody");

    const dlgRegister = $("#dlgRegister");

    function configureLoggedIn() {
        const token = localStorage.getItem("jwt");

        if (!token) {
            return;
        }

        return $.ajax({
            url: "/api/v1/users/me",
            beforeSend: function (xhr) {
                xhr.setRequestHeader('Authorization', token);
            }
        }).then((user_data) => {
            $("#frmLogin").hide();
            $("#dvLoggedIn").show();

            $("#spLoggedInAs").text(user_data.name);
        }).catch((err) => {
            bootbox.alert({
                size: "small",
                title: "Error",
                message: "Failed to check login status: " + err,
            });
        });
    }

    function login(user, password) {
        const data = {
            name: user,
            password: password
        };

        return $.post("/api/v1/authenticate", data).then((result) => {
            localStorage.setItem("jwt", result.token);
            return configureLoggedIn();
        });
    }

    // Load the server list
    $.ajax("/api/v1/servers", {
        accepts: "application/json"
    }).then(function (data) {
        console.log(data);

        const rows = data.map((server) => {
            return `<tr><td>${server.name}</td><td>${server.mission}</td><td>${server.title}</td><td>${server.num_players}</td><td></td></tr>`;
        });

        server_list.append(rows.join(""));
    });

    $("#btnLogin").click(() => {
        const name = $("#txtLoginUser").val();
        const password = $("#txtLoginPassword").val();

        login(name, password);
    });

    $("#btnRegister").click(() => {
        dlgRegister.modal();
    });
    $("#btnFinishRegister").click(() => {
        const name = $("#txtRegisterUsername").val();
        const password = $("#txtRegisterPassword").val();
        const passwordConfirm = $("#txtRegisterPasswordConfirm").val();

        if (name === "") {
            bootbox.alert({
                size: "small",
                title: "Error",
                message: "The username may not be empty!",
            });
            return;
        }

        if (password !== passwordConfirm) {
            bootbox.alert({
                size: "small",
                title: "Error",
                message: "The password confirmation failed!",
            });
            return;
        }

        $.ajax("/api/v1/users", {
            method: "PUT",
            contentType: "application/json",
            data: JSON.stringify({
                name: name,
                password: password
            })
        }).then(function () {
            bootbox.alert({
                size: "small",
                title: "Success",
                message: "The user has been registered!",
                callback: () => {
                    dlgRegister.modal("hide");
                }
            });
        });
    });

    // Always check if we are already logged in
    configureLoggedIn();
})(jQuery);