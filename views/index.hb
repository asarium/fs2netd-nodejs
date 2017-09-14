<div class="jumbotron">
    <div class="container">
        <h1 class="display-3">Welcome to FS2NET</h1>
        <p>This is the web interface for the FreeSpace Open multiplayer server tracker. You can log into your FS2NET
            account here or create a new account for playing online by using the buttons above.</p>
    </div>
</div>

<div class="container">
    <h2>Active Games</h2>
    <div class="table-responsive">
        <table class="table" id="tblServerList">
            <thead>
            <tr>
                <th>Name</th>
                <th>Mission</th>
                <th>Title</th>
                <th>Players</th>
                <th>Ping</th>
            </tr>
            </thead>
            <tbody>
            {{#each servers}}
                <tr>
                    <td>{{this.Name}}</td>
                    <td>{{this.MissionName}}</td>
                    <td>{{this.Title}}</td>
                    <td>{{this.NumPlayers}}</td>
                    <td></td>
                </tr>
            {{/each}}
            </tbody>
        </table>
    </div>
</div> <!-- /container -->
