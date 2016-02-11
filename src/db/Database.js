/// <reference path="../../typings/tsd.d.ts" />
var config = require("config");
var sequelize = require("sequelize");
var sequelize_types_1 = require("./sequelize-types");
var seqOptions = {
    dialect: "mysql",
    host: config.get("db.host"),
    pool: {
        maxConnections: config.get("db.connectionLimit")
    }
};
var Database = (function () {
    function Database() {
    }
    Database.prototype.initialize = function () {
        this._sequelize = new sequelize(config.get("db.database"), config.get("db.user"), config.get("db.pass"), seqOptions);
        this._models = sequelize_types_1.defineModels(this._sequelize);
        return this._sequelize.sync();
    };
    Database.prototype.createUser = function (data) {
        return this._models.User.build(data);
    };
    Database.prototype.getUserByName = function (username) {
        return this._models.User.find({
            where: {
                UserName: username
            }
        });
    };
    Database.prototype.updateLastLogin = function (user) {
        return user.update({
            LastLogin: this._sequelize.fn('NOW')
        });
    };
    Database.prototype.createOnlineUser = function (data) {
        return this._models.OnlineUser.build(data);
    };
    Database.prototype.pilotExists = function (user, pilotname) {
        return user.countPilots({
            where: {
                PilotName: pilotname
            }
        }).then(function (count) {
            return count > 0;
        });
    };
    Database.prototype.createPilot = function (values) {
        return this._models.Pilot.build(values);
    };
    Database.prototype.clearOnlineUsers = function () {
        return this._models.OnlineUser.truncate();
    };
    return Database;
})();
exports.Database = Database;
//# sourceMappingURL=Database.js.map