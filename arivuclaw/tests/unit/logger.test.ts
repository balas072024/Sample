/**
 * SCENARIO 8: Logger utility
 */

import { Logger } from "../../src/utils/logger";

describe("Scenario 8: Logger", () => {
  it("creates a logger instance", () => {
    const log = Logger.create("test");
    expect(log).toBeDefined();
    expect(typeof log.info).toBe("function");
    expect(typeof log.warn).toBe("function");
    expect(typeof log.error).toBe("function");
    expect(typeof log.debug).toBe("function");
  });

  it("logs at different levels without throwing", () => {
    const log = Logger.create("test-module");
    expect(() => log.info("info message")).not.toThrow();
    expect(() => log.warn("warn message")).not.toThrow();
    expect(() => log.error("error message")).not.toThrow();
    expect(() => log.debug("debug message")).not.toThrow();
  });

  it("accepts additional arguments", () => {
    const log = Logger.create("test");
    expect(() => log.info("message", { key: "value" }, 42)).not.toThrow();
  });

  it("sets global log level", () => {
    expect(() => Logger.setLevel("warn")).not.toThrow();
    expect(() => Logger.setLevel("info")).not.toThrow();
  });
});
