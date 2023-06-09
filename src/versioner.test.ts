import { Versioner, VersionerSettings } from "./versioner";
import { describe, test, expect } from "@jest/globals";

describe("Versioner components", () => {
    test("Versioner should use 0.0.0 if tags is null", () => {
        const versioner = new Versioner(null, null);
        expect(versioner.getLatestTag()).toBe("0.0.0");
    });

    test("Versioner should use 0.0.0 if tags is empty", () => {
        const versioner = new Versioner([], null);
        expect(versioner.getLatestTag()).toBe("0.0.0");
    });

    test("Versioner should use 0.0.0 if tags are all invalid", () => {
        const versioner = new Versioner(["some-other-tag"], null);
        expect(versioner.getLatestTag()).toBe("0.0.0");
    });

    test("Versioner will append a prefix to the version", () => {
        const versioner = new Versioner(null, { prefix: "v" });
        expect(versioner.buildTag("1.0.0")).toBe("v1.0.0");
    });

    test("Versioner will pick the right tag to increment", () => {
        const versioner = new Versioner(["v1.0.0", "v2.0.0", "v1.4.5", "v1.9.9-preview"], null);
        expect(versioner.getLatestTag()).toBe("2.0.0");
    });

    test("Versioner will ignore prerelease tags", () => {
        const versioner = new Versioner(["v1.0.0", "v1.4.5", "v1.9.9-preview"], null);
        expect(versioner.getLatestTag()).toBe("1.4.5");
    });

    test("Versioner will sort correctly", () => {
        const versioner = new Versioner(["v1.0.0", "v1.9.0", "v1.10.1", "v1.11.0"], null);
        expect(versioner.getLatestTag()).toBe("1.11.0");
    });

    test("Versioner will increment the major version", () => {
        const versioner = new Versioner(["v1.0.0"], { major: true });
        expect(versioner.incrementVersion(versioner.getLatestTag())).toBe("2.0.0");
    });

    test("Versioner will increment the minor version", () => {
        const versioner = new Versioner(["v1.0.0"], { minor: true });
        expect(versioner.incrementVersion("1.0.0")).toBe("1.1.0");
    });

    test("Versioner will reset patch version when incrementing minor version", () => {
        const versioner = new Versioner(["v1.0.0"], { minor: true });
        expect(versioner.incrementVersion("1.1.9")).toBe("1.2.0");
    });

    test("Versioner will reset patch and minor version when incrementing major version", () => {
        const versioner = new Versioner(["v1.0.0"], { major: true });
        expect(versioner.incrementVersion("1.1.9")).toBe("2.0.0");
    });
});

describe("Versioner e2e", () => {
    test("Versioner will increment the major version", async () => {
        const versioner = new Versioner(["v1.0.0"], { major: true });
        const version = await versioner.calculateNextVersion();

        expect(version).toBe("v2.0.0");
    });

    test("Versioner will increment the minor version", async () => {
        const versioner = new Versioner(["v1.0.0"], { minor: true });
        const version = await versioner.calculateNextVersion();

        expect(version).toBe("v1.1.0");
    });

    test("Versioner will increment the patch version", async () => {
        const versioner = new Versioner(["v1.0.0"], null);
        const version = await versioner.calculateNextVersion();

        expect(version).toBe("v1.0.1");
    });

    test("Versioner will use pre-release labels", async () => {
        const versioner = new Versioner(["v1.0.0"], { suffix: "preview" });
        const version = await versioner.calculateNextVersion();

        expect(version).toBe("v1.0.1-preview");
    })

    test("Versioner will ignore with pre-release labels", async () => {
        const versioner = new Versioner(["v1.0.0-release"], {});
        const version = await versioner.calculateNextVersion();

        expect(version).toBe("v0.0.1");
    })

    test("Versioner will ignore pre-release labels when creating a preview release", async () => {
        const versioner = new Versioner(["v1.0.0-release"], { suffix: "preview" });
        const version = await versioner.calculateNextVersion();

        expect(version).toBe("v0.0.1-preview");
    })

    test("CI Failure bug", async () => {
        const versioner = new Versioner(["v0.0.1",
            "v0.0.1-release",
            "v0.0.2",
            "v0.0.3",
            "v0.1.3",
            "v0.1.4",
            "v0.1.5",
            "v0.1.6",
            "v0.1.7-17-make-everything-configurable",
            "v0.2.0-17-make-everything-configurable",
            "v1.0.0",
            "v1.0.0-17-make-everything-configurable",
            "v1.0.0-release"], { suffix: "preview" });
        const version = await versioner.calculateNextVersion();

        expect(version).toBe("v1.0.1-preview");
    })

    test("Versioner will use prefix", async () => {
        const versioner = new Versioner(["ver1.0.0"], { prefix: "ver" });
        const version = await versioner.calculateNextVersion();

        expect(version).toBe("ver1.0.1");
    });
});
