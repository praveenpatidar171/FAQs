import request from "supertest";
import app, { server } from "../index";  // Adjust path if needed
import redis from "../utils/redis";

let token: string;

beforeAll(async () => {
    // First, sign up a test admin and log in
    await request(app).post("/api/v1/auth/signup").send({
        fullName: "testadmin",
        email: "testadmin@example.com",
        password: "password123",
        role: "admin"
    });

    const res = await request(app).post("/api/v1/auth/login").send({
        email: "testadmin@example.com",
        password: "password123"
    });

    token = res.body.token;  // Store token for auth requests
});

afterAll(async () => {
    await redis.quit(); 
    server.close()
});

describe("FAQ API Tests", () => {

    let faqId: number; // Store FAQ ID for update/delete tests

    it("Should create a new FAQ", async () => {
        const res = await request(app)
            .post("/api/v1/faqs")
            .set("Authorization", `Bearer ${token}`)
            .send({ question: "Test Question?", answer: "Test Answer." });

        expect(res.status).toBe(201);
        expect(res.body.success).toBe(true);
        faqId = res.body.faq.id;
    });

    it("Should fetch FAQs in English", async () => {
        const res = await request(app).get("/api/v1/faqs/?lang=en");
        expect(res.status).toBe(200);
        expect(res.body.faqs.length).toBeGreaterThan(0);
    });

    it("Should fetch FAQs in Hindi (Triggers Translation)", async () => {
        const res = await request(app).get("/api/v1/faqs/?lang=hi");
        expect(res.status).toBe(200);
        expect(res.body.faqs.length).toBeGreaterThan(0);
    }, 15000);

    it("Should update an FAQ", async () => {
        const res = await request(app)
            .put(`/api/v1/faqs/${faqId}`)
            .set("Authorization", `Bearer ${token}`)
            .send({ question: "Updated Question?", answer: "Updated Answer." });

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

    it("Should delete an FAQ", async () => {
        const res = await request(app)
            .delete(`/api/v1/faqs/${faqId}`)
            .set("Authorization", `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body.success).toBe(true);
    });

});
