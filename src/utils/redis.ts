import Redis from "ioredis";


// Connect to Redis inside Docker
const redis = new Redis({
    host: "127.0.0.1", // Redis is running locally in Docker
    port: 6379, //  Redis port in docker
});

export default redis;