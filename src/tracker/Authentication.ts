
import * as bcrypt from "bcryptjs";
import * as Promise from "bluebird";
import {UserPojo} from "db/sequelize-types";
import {UserInstance} from "db/sequelize-types";

export class Authentication {
    static verifyPassword(user: UserPojo, password: string): Promise<boolean> {
        return new Promise<boolean>((done, reject) => {
            bcrypt.compare(password, user.PasswordHash, (err, res) => {
                if (err) {
                    reject(err);
                } else {
                    done(res);
                }
            });
        });
    }

    static setPassword(user:UserInstance, password: string): Promise<UserInstance> {
        return new Promise<string>((done, reject) => {
            bcrypt.genSalt(10, (err, salt) => {
                if (err) {
                    reject(err);
                } else {
                    bcrypt.hash(password, salt, (err, hash) => {
                        if (err) {
                            reject(err);
                        } else {
                            done(hash);
                        }
                    });
                }
            });
        }).then(hash => {
            user.PasswordHash = hash;
            return user.save();
        });
    }
}
