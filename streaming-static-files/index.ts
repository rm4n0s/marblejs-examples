import * as path from "path";
import * as fs from "fs";
import {
  createServer,
  combineRoutes,
  httpListener,
  r,
  use
} from "@marblejs/core";
import {  map } from "rxjs/operators";
import { requestValidator$, t } from "@marblejs/middleware-io";

const STATIC_PATH = path.resolve(__dirname, "./static");

const getFileValidator$ = requestValidator$({
  params: t.type({ dir: t.string })
});

const getStatic$ = r.pipe(
  r.matchPath("/static/:dir*"),
  r.matchType("GET"),
  r.useEffect(req$ =>
    req$.pipe(
      use(getFileValidator$),
      map(req => req.params.dir),
      map(dir => fs.createReadStream(path.resolve(STATIC_PATH, dir))),
      map(body => ({ body }))
    )
  )
);

const api$ = combineRoutes("/", [getStatic$]);

const middlewares = [];

const effects = [api$];

const serverPort = 3001;
const serverIP = "localhost";

console.log(`${serverIP}:${serverPort}`);
const server = createServer({
  port: serverPort,
  hostname: serverIP,
  httpListener: httpListener({ middlewares, effects })
});

server.run();
