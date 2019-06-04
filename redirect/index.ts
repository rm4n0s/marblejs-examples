import * as path from "path";
import { createServer, combineRoutes, httpListener, r , HttpStatus} from "@marblejs/core";
import { mergeMap, map, mapTo } from "rxjs/operators";
import { readFile } from "@marblejs/core/dist/+internal";

const STATIC_PATH = path.resolve(__dirname, ".");

const getIndexFile$ = r.pipe(
  r.matchPath("/index.html"),
  r.matchType("GET"),
  r.useEffect(req$ =>
    req$.pipe(
      mapTo("index.html"),
      mergeMap(readFile(STATIC_PATH)),
      map(body => ({ body }))
    )
  )
);

const root$ = r.pipe(
  r.matchPath("/"),
  r.matchType("GET"),
  r.useEffect(req$ =>
    req$.pipe(
      mapTo({
        status: HttpStatus.MOVED_PERMANENTLY,
        headers: { Location: "/index.html" }
      })
    )
  )
);

const api$ = combineRoutes("/", [root$, getIndexFile$]);

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
