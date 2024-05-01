const request = require("supertest");
const ioClient = require("socket.io-client");
const redis = require("redis");
const { promisify } = require("util");

// Import your app
const app = require("./your_app_file"); // Adjust the path as needed

// Set up a mock Redis client
const mockRedisClient = {
  lrange: promisify((key, start, end, callback) => {
    // Mock implementation of lrange
    callback(null, ["user1:message1", "user2:message2"]);
  }),
  rpush: jest.fn()
};
jest.mock("redis", () => ({
  createClient: jest.fn(() => mockRedisClient)
}));

// Mock Socket.IO server
const mockServer = {
  on: jest.fn(),
  emit: jest.fn()
};
jest.mock("socket.io", () => jest.fn(() => mockServer));

describe("Your application tests", () => {
  let server;

  beforeAll(done => {
    // Start your server before running tests
    server = app.listen(done);
  });

  afterAll(done => {
    // Close the server after running tests
    server.close(done);
  });

  test("GET /chat route", async () => {
    const response = await request(server).get("/chat?username=testUser");
    expect(response.status).toBe(200);
    expect(response.text).toContain("testUser");
  });

  test("GET / route", async () => {
    const response = await request(server).get("/");
    expect(response.status).toBe(200);
    expect(response.text).toContain("Welcome to the homepage");
  });

  test("Socket.IO connection", async () => {
    // Mock Socket.IO client
    const socket = ioClient(`http://localhost:${server.address().port}`);
    
    // Simulate a connection event
    socket.emit("connection");
    
    // Check if the server emitted the 'joined' event
    expect(mockServer.emit).toHaveBeenCalledWith("joined", "testUser");
    
    // Simulate receiving a message event
    socket.emit("message", { message: "testMessage", from: "testUser" });
    
    // Check if the message was stored in Redis
    expect(mockRedisClient.rpush).toHaveBeenCalledWith("messages", "testUser:testMessage");
  });
});
