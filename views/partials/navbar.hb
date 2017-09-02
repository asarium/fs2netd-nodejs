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
                <a href="/register" class="btn btn-outline-info my-2 my-sm-0">Create Account</a>
            </form>
        {{/if}}
    </div>
</nav>
