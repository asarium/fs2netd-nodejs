<div class="container">
    <div class="page-header register-account-header">
        <div class="panel-title text-center">
            <h1 class="title">Register Account</h1>
            <hr/>
        </div>
    </div>
    <div class="main-center">
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
</div>