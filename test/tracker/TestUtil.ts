
import {parsePackedString} from "../../src/tracker/Utils";
import {packString} from "../../src/tracker/Utils";
import {INameCount} from "../../src/tracker/Utils";
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
            let parameter: INameCount[] = [];

            let result = packString(parameter);

            assert.equal(result, "");
        });

        it("should handle a list properly", () => {
            let parameter: INameCount[] = [
                {
                    Name: "Test1",
                    Count: 5
                },
                {
                    Name: "Test2",
                    Count: 42
                }
            ];

            let result = packString(parameter);

            assert.equal(result, "Test1;5;Test2;42");
        });

        it("should handle empty names properly", () => {
            let parameter: INameCount[] = [
                {
                    Name: "",
                    Count: 5
                },
                {
                    Name: "",
                    Count: 42
                }
            ];

            let result = packString(parameter);

            assert.equal(result, ";5;;42");
        });

        it("should handle a null argument properly", () => {
            let result = packString(null);

            assert.equal(result, "");
        });
    });
});