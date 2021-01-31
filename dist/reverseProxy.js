"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const fastify_1 = __importDefault(require("fastify"));
const fastify_cors_1 = __importDefault(require("fastify-cors"));
const node_fetch_1 = __importDefault(require("node-fetch"));
const app = fastify_1.default();
app.register(fastify_cors_1.default);
async function proxy(req, res) {
    let { port } = req.params;
    let restOfUrl = req.url
        .split("/")
        .filter((_, i) => i > 1)
        .join("/");
    if (restOfUrl !== "") {
        restOfUrl = `/${restOfUrl}`;
    }
    let response = await node_fetch_1.default(`http://localhost:${port}${restOfUrl}`, {
        method: req.method,
        headers: {
            ...req.headers,
        },
        body: req.body,
    });
    response.headers.forEach((value, name) => {
        res.header(name, value);
    });
    res.send(response.body);
}
app.all("/:port", proxy);
app.all("/:port/*", proxy);
async function main() {
    await app.ready();
    let init = await app.listen(9009, "0.0.0.0");
    console.log(init);
}
main();
//# sourceMappingURL=reverseProxy.js.map