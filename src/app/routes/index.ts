import * as express from "express";
import * as bodyParser from "body-parser";
import * as path from "path";

import * as api from "./api";

let router = express.Router();

router.use("/api", api);
router.use(express.static(path.join(__dirname, "..", "..", "public")));

router.use((req, res, next) => {
    // Not found handler
    res.type('txt').status(404).send('Not found');
});

export = router;
