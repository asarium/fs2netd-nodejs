import {Router} from "express";
import * as promiseRouter from "express-promise-router";
import * as paperwork from "paperwork";
import {IMissionPojo} from "../../../db/models/Mission";
import {ADMIN_ROLE} from "../../../db/models/Role";
import {IRouterContext} from "../../WebInterface";
import {authenticate} from "./authentication";
import {checkUserRole} from "./authentication";

// This could also be done with JSON schemas but currently this simple template is enough
const MISSION_TEMPLATE = {
    filename:     String,
    crc32:        Number,
    mission_type: String,
    max_players:  Number,
    description:  String,
    id:           paperwork.optional(Number),
};

export = (context: IRouterContext): Router => {
    const router = promiseRouter();

    router.get("/", authenticate(), checkUserRole([ADMIN_ROLE]), async (req, res) => {
        const missions = await context.Database.Models.Mission.findAll();

        res.status(200).json(missions.map((mission) => {
            return {
                filename:     mission.Filename,
                crc32:        mission.CRC32,
                mission_type: mission.MissionType,
                max_players:  mission.MaxPlayers,
                description:  mission.Description,
                id:           mission.id,
            };
        }));
    });

    router.put("/", authenticate(), checkUserRole([ADMIN_ROLE]),
               paperwork.accept(MISSION_TEMPLATE), async (req, res) => {
            const count = await context.Database.Models.Mission.count({
                                                                          where: {
                                                                              Filename: req.body.filename,
                                                                          },
                                                                      });

            if (count !== 0) {
                res.status(409).json({
                                         err: "Mission with specified name already exists",
                                     });
                return;
            }

            const missionInfo: IMissionPojo = {
                Filename:    req.body.filename,
                CRC32:       req.body.crc32,
                MissionType: req.body.mission_type,
                MaxPlayers:  req.body.max_players,
                Description: req.body.description,
            };

            const mission = await context.Database.Models.Mission.create(missionInfo);

            res.status(201).json({
                                     filename:     mission.Filename,
                                     crc32:        mission.CRC32,
                                     mission_type: mission.MissionType,
                                     max_players:  mission.MaxPlayers,
                                     description:  mission.Description,
                                     id:           mission.id,
                                 });
        });

    router.post("/:id", authenticate(), checkUserRole([ADMIN_ROLE]),
                paperwork.accept(MISSION_TEMPLATE), async (req, res) => {
            let mission = await context.Database.Models.Mission.findById(req.params.id);

            if (!mission) {
                res.status(400).json({
                                         status: "bad_request",
                                         reason: "Parameters were invalid",
                                         errors: [
                                             "Invalid ID specified",
                                         ],
                                     });
                return;
            }

            if (mission.Filename !== req.body.filename) {
                // Name change, check if unique
                const count = await context.Database.Models.Mission.count({
                                                                              where: {
                                                                                  Filename: req.body.filename,
                                                                              },
                                                                          });

                if (count !== 0) {
                    res.status(409).json({
                                             err: "Mission with specified name already exists",
                                         });
                    return;
                }
            }

            mission.Filename    = req.body.filename;
            mission.CRC32       = req.body.crc32;
            mission.MissionType = req.body.mission_type;
            mission.MaxPlayers  = req.body.max_players;
            mission.Description = req.body.description;

            mission = await mission.save();

            res.status(200).json({
                                     filename:     mission.Filename,
                                     crc32:        mission.CRC32,
                                     mission_type: mission.MissionType,
                                     max_players:  mission.MaxPlayers,
                                     description:  mission.Description,
                                     id:           mission.id,
                                 });
        });

    router.delete("/:id", authenticate(), checkUserRole([ADMIN_ROLE]), async (req, res) => {
        const mission = await context.Database.Models.Mission.findById(req.params.id);

        if (!mission) {
            res.status(400).json({
                                     status: "bad_request",
                                     reason: "Parameters were invalid",
                                     errors: [
                                         "Invalid ID specified",
                                     ],
                                 });
            return;
        }

        await mission.destroy();

        res.status(200).send(null);
    });

    return router;
};
