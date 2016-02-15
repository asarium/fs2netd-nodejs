
/// <reference path="../typings/tsd.d.ts" />
import {parsePackedString} from "../src/tracker/Utils";
import {packString} from "../src/tracker/Utils";
import {NameCount} from "../src/tracker/Utils";
import * as assert from "assert";

describe("Util", () => {
    describe("#parsePackedString()", () => {
        it("should return an empty list for an empty string", () => {
            let result = parsePackedString("");

            assert.equal(result.length, 0);
        });

        it("should handle a packed string correctly", () => {
            let result = parsePackedString("Test;5;Test1;4");

            assert.equal(result.length, 2);

            assert.equal(result[0].Name, "Test");
            assert.equal(result[0].Count, 5);

            assert.equal(result[1].Name, "Test1");
            assert.equal(result[1].Count, 4);
        });

        it("should handle a null string correctly", () => {
            let result = parsePackedString(null);

            assert.equal(result.length, 0);
        });
    });

    describe("#packString()", () => {
        it("should return an empty string for an empty list", () => {
            let parameter: NameCount[] = [];

            let result = packString(parameter);

            assert.equal(result, "");
        });
    });
});