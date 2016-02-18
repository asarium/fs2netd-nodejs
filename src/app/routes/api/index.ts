
import * as express from "express";
import * as bodyParser from "body-parser";

let router = express.Router();

router.use(bodyParser.urlencoded({ extended: true }));
router.use(bodyParser.json());


export = router;