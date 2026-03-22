const request = require("supertest");
const path = require("path");
const fs = require("fs");

const TEST_DB = path.join(__dirname, "../../data/test.db");
process.env.DB_PATH = TEST_DB;
process.env.JWT_SECRET = "test-vault-secret";

let app, server, db, vaultToken, vaultId;
const MASTER_PWD = "MySecureMaster123!";

beforeAll(() => {
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
  const { getDb, initDb } = require("../src/db");
  db = getDb(); initDb(db);
  const mod = require("../src/index");
  app = mod.app; server = mod.server;
});

afterAll(() => {
  if (db) db.close();
  if (server) server.close();
  if (fs.existsSync(TEST_DB)) fs.unlinkSync(TEST_DB);
});

describe("Vault", () => {
  test("POST /api/vault/create - create vault", async () => {
    const res = await request(app).post("/api/vault/create")
      .send({ name: "My Vault", master_password: MASTER_PWD });
    expect(res.status).toBe(201);
    expect(res.body.vault.name).toBe("My Vault");
    vaultId = res.body.vault.id;
  });

  test("POST /api/vault/create - rejects short password", async () => {
    const res = await request(app).post("/api/vault/create")
      .send({ name: "Bad", master_password: "123" });
    expect(res.status).toBe(400);
  });

  test("POST /api/vault/unlock - success", async () => {
    const res = await request(app).post("/api/vault/unlock")
      .send({ vault_id: vaultId, master_password: MASTER_PWD });
    expect(res.status).toBe(200);
    expect(res.body.token).toBeDefined();
    vaultToken = res.body.token;
  });

  test("POST /api/vault/unlock - wrong password", async () => {
    const res = await request(app).post("/api/vault/unlock")
      .send({ vault_id: vaultId, master_password: "wrong" });
    expect(res.status).toBe(401);
  });

  test("GET /api/vault/list - list vaults", async () => {
    const res = await request(app).get("/api/vault/list");
    expect(res.status).toBe(200);
    expect(res.body.vaults.length).toBe(1);
  });
});

describe("Entries", () => {
  let entryId;
  test("POST /api/vault/entries - create entry", async () => {
    const res = await request(app).post("/api/vault/entries")
      .set("Authorization", `Bearer ${vaultToken}`)
      .set("x-master-key", MASTER_PWD)
      .send({ title: "GitHub", username: "bala", password: "gh-secret-123", url: "https://github.com", notes: "My GitHub account", category: "dev" });
    expect(res.status).toBe(201);
    expect(res.body.entry.title).toBe("GitHub");
    entryId = res.body.entry.id;
  });

  test("POST /api/vault/entries - rejects no master key", async () => {
    const res = await request(app).post("/api/vault/entries")
      .set("Authorization", `Bearer ${vaultToken}`)
      .send({ title: "Test", password: "test123" });
    expect(res.status).toBe(400);
  });

  test("GET /api/vault/entries - list & decrypt entries", async () => {
    const res = await request(app).get("/api/vault/entries")
      .set("Authorization", `Bearer ${vaultToken}`)
      .set("x-master-key", MASTER_PWD);
    expect(res.status).toBe(200);
    expect(res.body.entries.length).toBe(1);
    expect(res.body.entries[0].password).toBe("gh-secret-123");
    expect(res.body.entries[0].notes).toBe("My GitHub account");
  });

  test("PUT /api/vault/entries/:id - update", async () => {
    const res = await request(app).put(`/api/vault/entries/${entryId}`)
      .set("Authorization", `Bearer ${vaultToken}`)
      .set("x-master-key", MASTER_PWD)
      .send({ title: "GitHub Updated", password: "new-secret-456" });
    expect(res.status).toBe(200);

    // Verify decryption
    const get = await request(app).get("/api/vault/entries")
      .set("Authorization", `Bearer ${vaultToken}`)
      .set("x-master-key", MASTER_PWD);
    expect(get.body.entries[0].password).toBe("new-secret-456");
  });

  test("DELETE /api/vault/entries/:id", async () => {
    const res = await request(app).delete(`/api/vault/entries/${entryId}`)
      .set("Authorization", `Bearer ${vaultToken}`);
    expect(res.status).toBe(200);
  });

  test("Rejects unauthenticated access", async () => {
    const res = await request(app).get("/api/vault/entries");
    expect(res.status).toBe(401);
  });
});

describe("Password Generator", () => {
  test("POST /api/vault/generate - default", async () => {
    const res = await request(app).post("/api/vault/generate").send({});
    expect(res.status).toBe(200);
    expect(res.body.password.length).toBe(20);
  });

  test("POST /api/vault/generate - custom length", async () => {
    const res = await request(app).post("/api/vault/generate").send({ length: 32 });
    expect(res.status).toBe(200);
    expect(res.body.password.length).toBe(32);
  });
});

describe("Health", () => {
  test("GET /api/health", async () => {
    const res = await request(app).get("/api/health");
    expect(res.status).toBe(200);
    expect(res.body.status).toBe("ok");
  });
});
