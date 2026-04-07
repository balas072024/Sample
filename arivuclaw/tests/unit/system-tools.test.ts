/**
 * SCENARIO 5: System Tools — clipboard, screenshot, TTS, process management
 */

import { SystemTools } from "../../src/tools/system-tools";
import * as os from "os";

describe("Scenario 5: System Tools", () => {
  describe("getFullSystemInfo", () => {
    it("returns comprehensive system info", () => {
      const info = SystemTools.getFullSystemInfo();
      expect(info.hostname).toBeDefined();
      expect(info.platform).toBeDefined();
      expect(info.arch).toBeDefined();
      expect(info.cpus).toBeGreaterThan(0);
      expect(info.totalMemory).toBeDefined();
      expect(info.freeMemory).toBeDefined();
      expect(info.homeDir).toBeDefined();
      expect(info.user).toBeDefined();
    });

    it("returns correct platform", () => {
      const info = SystemTools.getFullSystemInfo();
      expect(info.platform).toBe(os.platform());
    });
  });

  describe("getNetworkInterfaces", () => {
    it("returns network interfaces", () => {
      const interfaces = SystemTools.getNetworkInterfaces();
      expect(typeof interfaces).toBe("object");
    });
  });

  describe("listProcesses", () => {
    it("lists running processes", () => {
      const output = SystemTools.listProcesses();
      expect(output.length).toBeGreaterThan(0);
    });

    it("filters processes by name", () => {
      const output = SystemTools.listProcesses("node");
      // Should contain node process or be empty
      expect(typeof output).toBe("string");
    });
  });

  describe("detectPackageManager", () => {
    it("detects a package manager", () => {
      const pm = SystemTools.detectPackageManager();
      expect(typeof pm).toBe("string");
      expect(pm.length).toBeGreaterThan(0);
    });
  });

  describe("dockerAvailable", () => {
    it("returns boolean", () => {
      const available = SystemTools.dockerAvailable();
      expect(typeof available).toBe("boolean");
    });
  });

  describe("findFiles", () => {
    it("finds files by pattern", () => {
      const output = SystemTools.findFiles("*.ts", process.cwd());
      expect(typeof output).toBe("string");
    });
  });

  describe("diskUsage", () => {
    it("returns disk usage info", () => {
      const output = SystemTools.diskUsage("/");
      expect(output).toContain("Filesystem");
    });
  });

  describe("gitStatus", () => {
    it("returns git status", () => {
      const output = SystemTools.gitStatus(process.cwd());
      expect(output).toContain("branch");
    });
  });
});
