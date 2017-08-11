import {Message} from "../packets/Messages";
import {IHandlerContext} from "./Handlers";
import {ServerListMessage} from "../packets/Messages";
import {ServerListReply} from "../packets/Messages";
import {ServerStartMessage} from "../packets/Messages";
import {ServerUpdateMessage} from "../packets/Messages";

import * as Promise from "bluebird";
import {ChannelCountRequest} from "../packets/Messages";
import {ChannelCountReply} from "../packets/Messages";
import {IServerPojo} from "../../db/models/Server";

export function handleServerListMessage(message: Message, context: IHandlerContext): Promise<void> {
    context.Logger.info("Client has requested the server list");

    let msg = <ServerListMessage>message;

    return context.Server.ServerList.expireServers().then(() => {
        if (msg.Filter) {
            let filtered = [];
            for (let server of context.Server.ServerList.Servers) {
                if (server.TrackerChannel.length == 0 || server.TrackerChannel === msg.Filter) {
                    filtered.push(server);
                }
            }

            return context.Client.sendToClient(new ServerListReply(filtered));
        } else {
            return context.Client.sendToClient(new ServerListReply(context.Server.ServerList.Servers));
        }
    });
}

export function handleServerStartMessage(message: Message, context: IHandlerContext): Promise<void> {
    context.Logger.info("Client has started a server.");

    let msg = <ServerStartMessage>message;

    // Convert message data to pojo data
    let data: IServerPojo = {
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

export function handleServerUpdateMessage(message: Message, context: IHandlerContext): Promise<void> {
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

export function handleServerDisconnectMessage(message: Message, context: IHandlerContext): Promise<void> {
    context.Logger.info("Removing server.");

    let server = context.Server.ServerList.getServer(context.Client.RemoteAddress, context.Client.RemotePort);

    return context.Server.ServerList.removeServer(server).then(_ => {
        // Unmark this client as being a server
        context.Client.IsServer = false;
    });
}

export function handleChannelCountRequest(message: Message, context: IHandlerContext): Promise<void> {
    context.Logger.info("Client requesting channel count.");

    let msg = <ChannelCountRequest>message;

    let servers = context.Server.ServerList.Servers;
    let count = 0;
    for (let server of servers) {
        if (server.TrackerChannel.length == 0 || server.TrackerChannel === msg.Channel) {
            ++count;
        }
    }

    return context.Client.sendToClient(new ChannelCountReply(msg.Channel, count));
}
