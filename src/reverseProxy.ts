import fastify, { FastifyReply, FastifyRequest } from "fastify";
import fastifyCors from "fastify-cors";
import { RouteGenericInterface } from "fastify/types/route";
import fetch from "node-fetch";
import { Server, IncomingMessage, ServerResponse } from "http";

const app = fastify();
app.register(fastifyCors);

type FastifyReq = FastifyRequest<
  RouteGenericInterface,
  Server,
  IncomingMessage
>;
type FastifyRes = FastifyReply<
  Server,
  IncomingMessage,
  ServerResponse,
  RouteGenericInterface,
  unknown
>;

async function proxy(req: FastifyReq, res: FastifyRes) {
  console.log("here", req.hostname);
  let port = req.hostname.split(".")[0];

  // req.params as { port: string };
  // let restOfUrl = req.url
  //   .split("/")
  //   .filter((_, i) => i > 1)
  //   .join("/");

  // if (restOfUrl !== "") {
  //   restOfUrl = `/${restOfUrl}`;
  // }

  console.log({ port });

  let response = await fetch(`http://localhost:${port}${req.url}`, {
    method: req.method,
    headers: {
      ...req.headers,
    } as any,
    body: req.body as any,
  });

  response.headers.forEach((value, name) => {
    res.header(name, value);
  });

  res.send(response.body);
}

app.all("/", proxy);
app.all("/:port", proxy);
app.all("/:port/*", proxy);

async function main() {
  await app.ready();
  let init = await app.listen(9009, "0.0.0.0");
  console.log(init);
}

main();
