import * as path from "path";
import {
  createServer,
  combineRoutes,
  httpListener,
  r,
  use
} from "@marblejs/core";
import { mergeMap, map } from "rxjs/operators";
import { readFile } from "@marblejs/core/dist/+internal";
import { requestValidator$, t } from "@marblejs/middleware-io";

const STATIC_PATH = path.resolve(__dirname, ".");

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
      mergeMap(readFile(STATIC_PATH + "/static")),
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
