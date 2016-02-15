import {Message} from "../packets/Messages";
import {HandlerContext} from "./Handlers";
import {ServerListMessage} from "../packets/Messages";
import {ServerListReply} from "../packets/Messages";
import {ServerStartMessage} from "../packets/Messages";
import {ServerPojo} from "../db/sequelize-types";
import {ServerUpdateMessage} from "../packets/Messages";

import * as Promise from "bluebird";

export function handleServerListMessage(message: Message, context: HandlerContext): Promise<void> {
    context.Logger.info("Client has requested the server list");

    let msg = <ServerListMessage>message;

    // TODO: Implement filtering
    return context.Server.ServerList.expireServers().then(() => {
        return context.Client.sendToClient(new ServerListReply(context.Server.ServerList.Servers));
    });
}


export function handleServerStartMessage(message: Message, context: HandlerContext): Promise<void> {
    context.Logger.info("Client has started a server.");

    let msg = <ServerStartMessage>message;

    // Convert message data to pojo data
    let data: ServerPojo = {
        Name: msg.Properties.name,
        MissionName: msg.Properties.mission_name,
        Title: msg.Properties.title,
        CampaignName: msg.Properties.campaign_name,
        CampaignMode: msg.Properties.campaign_mode,
        Flags: msg.Properties.flags,
        TypeFlags: msg.Properties.type_flags,
        NumPlayers: msg.Properties.num_players,
        MaxPlayers: msg.Properties.max_players,
        Mode: msg.Properties.mode,
        RankBase: msg.Properties.rank_base,
        GameState: msg.Properties.game_state,
        ConnectionSpeed: msg.Properties.connection_speed,
        TrackerChannel: msg.Properties.tracker_channel,

        Ip: context.Client.RemoteAddress,
        Port: context.Client.RemotePort
    };

    return context.Server.ServerList.addServer(data).then(() => {
        // Mark this client as being a server
        context.Client.IsServer = true;
    }).then(() => {
        return context.Server.ServerList.expireServers();
    });
}

export function handleServerUpdateMessage(message: Message, context: HandlerContext): Promise<void> {
    context.Logger.info("Updating server.");
    let msg = <ServerUpdateMessage>message;

    let server = context.Server.ServerList.getServer(context.Client.RemoteAddress, context.Client.RemotePort);

    if (!server) {
        context.Logger.info("Server is no longer valid!");
        return Promise.resolve();
    }

    server.MissionName = msg.Properties.mission_name;
    server.Title = msg.Properties.title;
    server.CampaignName = msg.Properties.campaign_name;
    server.CampaignMode = msg.Properties.campaign_mode;
    server.NumPlayers = msg.Properties.num_players;
    server.GameState = msg.Properties.game_state;

    return server.save().then(() => {
        // Ignore return value
    });
}
export function handleServerDisconnectMessage(message: Message, context: HandlerContext): Promise<void> {
    context.Logger.info("Removing server.");

    let server = context.Server.ServerList.getServer(context.Client.RemoteAddress, context.Client.RemotePort);

    return context.Server.ServerList.removeServer(server).then(_ => {
        // Unmark this client as being a server
        context.Client.IsServer = false;
    });
}