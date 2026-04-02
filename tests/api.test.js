const request = require("supertest");
const app = require("../src/app");

describe("Collaborative Docs API", () => {
  it("should create a document", async () => {
    const response = await request(app)
      .post("/api/documents")
      .send({
        title: "Test Document",
        content: "<p>Hello world</p>",
        ownerId: 1
      });

    expect(response.statusCode).toBe(201);
    expect(response.body.title).toBe("Test Document");
    expect(response.body.content).toContain("Hello world");
  });

  it("should reject document creation without title", async () => {
    const response = await request(app)
      .post("/api/documents")
      .send({
        title: "",
        content: "<p>No title</p>",
        ownerId: 1
      });

    expect(response.statusCode).toBe(400);
    expect(response.body.error).toBe("Title is required");
  });

  it("should share a document with another user", async () => {
    const createResponse = await request(app)
      .post("/api/documents")
      .send({
        title: "Share Test Doc",
        content: "<p>Shared content</p>",
        ownerId: 1
      });

    const docId = createResponse.body.id;

    const shareResponse = await request(app)
      .post(`/api/documents/${docId}/share?userId=1`)
      .send({
        targetUserId: 2
      });

    expect(shareResponse.statusCode).toBe(200);
    expect(shareResponse.body.success).toBe(true);
  });
});
