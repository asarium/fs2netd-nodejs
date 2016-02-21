import {RouterContext} from "../../WebInterface";
import {Router} from "express";
import {authenticate} from "./authentication";
import {isAdmin} from "../../../util/Roles";
import {MissionPojo} from "../../../db/models/Mission";

let paperwork = require("paperwork");
let promiseRouter = require("express-promise-router");

// This could also be done with JSON schemas but currently this simple template is enough
const MISSION_TEMPLATE = {
    filename: String,
    crc32: Number,
    mission_type: String,
    max_players: Number,
    description: String,
    id: paperwork.optional(Number),
};

export = function (context: RouterContext): Router {
    let router = promiseRouter();

    router.get("/", authenticate(), async (req, res) => {
        if (!(await isAdmin(req.user))) {
            res.status(403).json({
                                     err: "Only admins may execute this action"
                                 });
            return;
        }

        let missions = await context.Database.Models.Mission.findAll();

        res.status(200).json(missions.map(mission => {
            return {
                filename: mission.Filename,
                crc32: mission.CRC32,
                mission_type: mission.MissionType,
                max_players: mission.MaxPlayers,
                description: mission.Description,
                id: mission.id
            }
        }));
    });

    router.put("/", authenticate(), paperwork.accept(MISSION_TEMPLATE), async (req, res) => {
        if (!(await isAdmin(req.user))) {
            res.status(403).json({
                                     err: "Only admins may execute this action"
                                 });
            return;
        }

        let count = await context.Database.Models.Mission.count({
                                                                    where: {
                                                                        Filename: req.body.filename
                                                                    }
                                                                });

        if (count != 0) {
            res.status(409).json({
                                     err: "Mission with specified name already exists"
                                 });
            return;
        }

        let mission_info: MissionPojo = {
            Filename: req.body.filename,
            CRC32: req.body.crc32,
            MissionType: req.body.mission_type,
            MaxPlayers: req.body.max_players,
            Description: req.body.description
        };

        let mission = await context.Database.Models.Mission.create(mission_info);

        res.status(200).json({
                                 filename: mission.Filename,
                                 crc32: mission.CRC32,
                                 mission_type: mission.MissionType,
                                 max_players: mission.MaxPlayers,
                                 description: mission.Description,
                                 id: mission.id
                             });
    });

    router.post("/:id", authenticate(), paperwork.accept(MISSION_TEMPLATE), async (req, res) => {
        if (!(await isAdmin(req.user))) {
            res.status(403).json({
                                     err: "Only admins may execute this action"
                                 });
            return;
        }

        let mission = await context.Database.Models.Mission.findById(req.params.id);

        if (mission.Filename !== req.body.filename) {
            // Name change, check if unique
            let count = await context.Database.Models.Mission.count({
                                                                        where: {
                                                                            Filename: req.body.filename
                                                                        }
                                                                    });

            if (count != 0) {
                res.status(409).json({
                                         err: "Mission with specified name already exists"
                                     });
                return;
            }
        }

        mission.Filename = req.body.filename;
        mission.CRC32 = req.body.crc32;
        mission.MissionType = req.body.mission_type;
        mission.MaxPlayers = req.body.max_players;
        mission.Description = req.body.description;

        mission = await mission.save();

        res.status(200).json({
                                 filename: mission.Filename,
                                 crc32: mission.CRC32,
                                 mission_type: mission.MissionType,
                                 max_players: mission.MaxPlayers,
                                 description: mission.Description,
                                 id: mission.id
                             });
    });

    router.delete("/:id", authenticate(), async (req, res) => {
        if (!(await isAdmin(req.user))) {
            res.status(403).json({
                                     err: "Only admins may execute this action"
                                 });
            return;
        }

        let mission = await context.Database.Models.Mission.findById(req.params.id);

        if (!mission) {
            res.status(409).json({
                                     err: "Mission does not exist"
                                 });
            return;
        }

        await mission.destroy();

        res.status(200).send(null);
    });

    return router;
}