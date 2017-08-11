import {IServerPojo} from "../../db/models/Server";
import {Message} from "../packets/Messages";
import {ServerListMessage} from "../packets/Messages";
import {ServerListReply} from "../packets/Messages";
import {ServerStartMessage} from "../packets/Messages";
import {ServerUpdateMessage} from "../packets/Messages";
import {ChannelCountRequest} from "../packets/Messages";
import {ChannelCountReply} from "../packets/Messages";
import {IHandlerContext} from "./Handlers";

export async function handleServerListMessage(message: Message, context: IHandlerContext): Promise<void> {
    context.Logger.info("Client has requested the server list");

    const msg = message as ServerListMessage;

    await context.Server.ServerList.expireServers();

    if (msg.Filter) {
        const filtered = [];
        for (const server of context.Server.ServerList.Servers) {
            if (server.TrackerChannel.length === 0 || server.TrackerChannel === msg.Filter) {
                filtered.push(server);
            }
        }

        await context.Client.sendToClient(new ServerListReply(filtered));
    } else {
        await context.Client.sendToClient(new ServerListReply(context.Server.ServerList.Servers));
    }
}

export async function handleServerStartMessage(message: Message, context: IHandlerContext): Promise<void> {
    context.Logger.info("Client has started a server.");

    const msg = message as ServerStartMessage;

    // Convert message data to pojo data
    const data: IServerPojo = {
        Name:            msg.properties.name,
        MissionName:     msg.properties.mission_name,
        Title:           msg.properties.title,
        CampaignName:    msg.properties.campaign_name,
        CampaignMode:    msg.properties.campaign_mode,
        Flags:           msg.properties.flags,
        TypeFlags:       msg.properties.type_flags,
        NumPlayers:      msg.properties.num_players,
        MaxPlayers:      msg.properties.max_players,
        Mode:            msg.properties.mode,
        RankBase:        msg.properties.rank_base,
        GameState:       msg.properties.game_state,
        ConnectionSpeed: msg.properties.connection_speed,
        TrackerChannel:  msg.properties.tracker_channel,

        Ip:   context.Client.RemoteAddress,
        Port: context.Client.RemotePort,
    };

    await context.Server.ServerList.addServer(data);

    // Mark this client as being a server
    context.Client.IsServer = true;

    await context.Server.ServerList.expireServers();
}

export async function handleServerUpdateMessage(message: Message, context: IHandlerContext): Promise<void> {
    context.Logger.info("Updating server.");
    const msg = message as ServerUpdateMessage;

    const server = context.Server.ServerList.getServer(context.Client.RemoteAddress, context.Client.RemotePort);

    if (!server) {
        context.Logger.info("Server is no longer valid!");
        return Promise.resolve();
    }

    server.MissionName  = msg.properties.mission_name;
    server.Title        = msg.properties.title;
    server.CampaignName = msg.properties.campaign_name;
    server.CampaignMode = msg.properties.campaign_mode;
    server.NumPlayers   = msg.properties.num_players;
    server.GameState    = msg.properties.game_state;

    await server.save();
}

export async function handleServerDisconnectMessage(message: Message, context: IHandlerContext): Promise<void> {
    context.Logger.info("Removing server.");

    const server = context.Server.ServerList.getServer(context.Client.RemoteAddress, context.Client.RemotePort);

    await context.Server.ServerList.removeServer(server);

    // Unmark this client as being a server
    context.Client.IsServer = false;
}

export function handleChannelCountRequest(message: Message, context: IHandlerContext): Promise<void> {
    context.Logger.info("Client requesting channel count.");

    const msg = message as ChannelCountRequest;

    const servers = context.Server.ServerList.Servers;
    let count     = 0;
    for (const server of servers) {
        if (server.TrackerChannel.length === 0 || server.TrackerChannel === msg.Channel) {
            ++count;
        }
    }

    return context.Client.sendToClient(new ChannelCountReply(msg.Channel, count));
}
