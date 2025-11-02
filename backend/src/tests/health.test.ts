import request from "supertest";
import app from "../app";

describe("health", () => {
  it("deve responder 200 OK", async () => {
    const res = await request(app).get("/health");
    expect(res.statusCode).toBe(200);
    expect(res.body.ok).toBe(true);
  });
});