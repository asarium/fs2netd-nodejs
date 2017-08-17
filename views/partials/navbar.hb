<nav class="navbar navbar-expand-md navbar-dark fixed-top bg-dark">
    <a class="navbar-brand" href="/">FS2NET</a>
    <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarsExampleDefault"
            aria-controls="navbarsExampleDefault" aria-expanded="false" aria-label="Toggle navigation">
        <span class="navbar-toggler-icon"></span>
    </button>

    <div class="collapse navbar-collapse" id="navbarsExampleDefault">
        <ul class="navbar-nav mr-auto">
        </ul>
        {{#if user}}
            <span class="navbar-text">Logged in as {{user.Username}}</span>

            <form class="form-inline my-2 my-lg-0" id="frmLogin" action="/logout" method="post">
                <button class="btn btn-outline-info my-2 my-sm-0" id="btnLogin" type="submit">Log out</button>
            </form>
        {{else}}
            <form class="form-inline my-2 my-lg-0" id="frmLogin" action="/login" method="post">
                <input class="form-control mr-sm-2" type="text" placeholder="User" aria-label="User" id="txtLoginUser"
                       name="username">
                <input class="form-control mr-sm-2" type="password" placeholder="Password" aria-label="Password"
                       id="txtLoginPassword" name="password">
                <button class="btn btn-outline-success my-2 my-sm-0" id="btnLogin" type="submit">Login</button>
                <button class="btn btn-outline-info my-2 my-sm-0" id="btnRegister" type="button">Create Account</button>
            </form>
        {{/if}}
    </div>
</nav>
<!-- Register dialog -->
<div id="dlgRegister" class="modal fade" role="dialog">
    <div class="modal-dialog">

        <!-- Modal content-->
        <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal">&times;</button>
                <h4 class="modal-title">Register a new User</h4>
            </div>
            <div class="modal-body">
                <form class="form-horizontal" method="post" action="/register">

                    <div class="form-group">
                        <label for="txtRegisterUsername" class="cols-sm-2 control-label">Username</label>
                        <div class="cols-sm-10">
                            <div class="input-group">
                                <span class="input-group-addon"><i class="fa fa-users fa" aria-hidden="true"></i></span>
                                <input type="text" class="form-control" name="username" id="txtRegisterUsername"
                                       placeholder="Enter your Username"/>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="txtRegisterPassword" class="cols-sm-2 control-label">Password</label>
                        <div class="cols-sm-10">
                            <div class="input-group">
                                <span class="input-group-addon"><i class="fa fa-lock fa-lg"
                                                                   aria-hidden="true"></i></span>
                                <input type="password" class="form-control" name="password" id="txtRegisterPassword"
                                       placeholder="Enter your Password"/>
                            </div>
                        </div>
                    </div>

                    <div class="form-group">
                        <label for="txtRegisterPasswordConfirm" class="cols-sm-2 control-label">Confirm Password</label>
                        <div class="cols-sm-10">
                            <div class="input-group">
                                <span class="input-group-addon"><i class="fa fa-lock fa-lg"
                                                                   aria-hidden="true"></i></span>
                                <input type="password" class="form-control" name="confirm"
                                       id="txtRegisterPasswordConfirm"
                                       placeholder="Confirm your Password"/>
                            </div>
                        </div>
                    </div>

                    <div class="form-group ">
                        <button type="submit" id="btnFinishRegister"
                                class="btn btn-primary btn-lg btn-block login-button">Register
                        </button>
                    </div>
                </form>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
            </div>
        </div>

    </div>
</div>

<script src="/scripts/navbar.js"></script>