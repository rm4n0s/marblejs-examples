import {
  createServer,
  combineRoutes,
  httpListener,
  r,
  HttpMiddlewareEffect
} from "@marblejs/core";
import { map } from "rxjs/operators";

let idCounter = 1;

const requestIdCreator$: HttpMiddlewareEffect = (req$, res) =>
  req$.pipe(
    map(req => {
      req.headers["request-id"] = idCounter.toString();
      idCounter++;
      return req;
    })
  );

const index$ = r.pipe(
  r.matchPath("/"),
  r.matchType("GET"),
  r.useEffect(req$ =>
    req$.pipe(
      map(body => ({ body: `The request id is ${body.headers["request-id"]}` }))
    )
  )
);

const api$ = combineRoutes("/", [index$]);

const middlewares = [requestIdCreator$];

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
