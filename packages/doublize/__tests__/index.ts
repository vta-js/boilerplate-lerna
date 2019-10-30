import doublize from "../src/index";

it("doublize", () => doublize(12).then(result => expect(result).toBe(24)));
