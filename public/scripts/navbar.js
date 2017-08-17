window.addEventListener("load", () => {
    "use strict";

    (function ($) {
        "use strict";
        const dlgRegister = $("#dlgRegister");

        $("#btnRegister").click(() => {
            dlgRegister.modal();
        });
        $("#btnFinishRegister").click((event) => {
            const name = $("#txtRegisterUsername").val();
            const password = $("#txtRegisterPassword").val();
            const passwordConfirm = $("#txtRegisterPasswordConfirm").val();

            if (name === "") {
                bootbox.alert({
                    size: "small",
                    title: "Error",
                    message: "The username may not be empty!",
                });
                event.preventDefault();
                return;
            }

            if (password !== passwordConfirm) {
                bootbox.alert({
                    size: "small",
                    title: "Error",
                    message: "The password confirmation failed!",
                });
                event.preventDefault();
                return;
            }
            // Default action can be taken now
        });
    })(jQuery);
});
