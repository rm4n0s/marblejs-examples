import * as path from "path";
import * as fs from "fs";
import { createServer, combineRoutes, httpListener, r } from "@marblejs/core";
import { mergeMap, map, mapTo } from "rxjs/operators";
import { readFile } from "@marblejs/core/dist/+internal";
import { logger$ } from "@marblejs/middleware-logger";

const STATIC_PATH = path.resolve(__dirname, ".");

const getIndexFile$ = r.pipe(
  r.matchPath("/"),
  r.matchType("GET"),
  r.useEffect(req$ =>
    req$.pipe(
      mapTo("index.html"),
      mergeMap(readFile(STATIC_PATH)),
      map(body => ({ body, headers: { "Content-Type": "text/html" } }))
    )
  )
);

const api$ = combineRoutes("/", [getIndexFile$]);

const middlewares = [logger$()];

const effects = [api$];

const serverPort = 3001;
const serverIP = "127.0.0.1";

const httpsOptions = {
  key: fs.readFileSync(STATIC_PATH + "/key.pem"),
  cert: fs.readFileSync(STATIC_PATH + "/cert.pem")
};

console.log(`https://${serverIP}:${serverPort}`);
const server = createServer({
  port: serverPort,
  hostname: serverIP,
  options: { httpsOptions },
  httpListener: httpListener({ middlewares, effects })
});

server.run();
