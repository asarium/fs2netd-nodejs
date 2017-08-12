import * as bcrypt from "bcryptjs";
import {IUserPojo} from "../db/models/User";
import {IUserInstance} from "../db/models/User";

export async function verifyPassword(user: IUserPojo, password: string): Promise<boolean> {
    return await bcrypt.compare(password, user.PasswordHash);
}

export async function setPassword(user: IUserInstance, password: string): Promise<IUserInstance> {
    const salt = await bcrypt.genSalt(10);

    user.PasswordHash = await bcrypt.hash(password, salt);
    return await user.save();
}
