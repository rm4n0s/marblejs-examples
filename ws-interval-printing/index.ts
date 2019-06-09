import * as path from "path";
import {
  createServer,
  combineRoutes,
  httpListener,
  r,
  createContextToken,
  bindTo,
  matchEvent
} from "@marblejs/core";
import {
  webSocketListener,
  WsEffect,
  MarbleWebSocketServer
} from "@marblejs/websockets";
import { mergeMap, switchMap, map, mapTo } from "rxjs/operators";
import { interval } from "rxjs";
import { readFile } from "@marblejs/core/dist/+internal";

const STATIC_PATH = path.resolve(__dirname, ".");

const getIndex$ = r.pipe(
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

const api$ = combineRoutes("/", [getIndex$]);

const middlewares = [];

const effects = [api$];

const serverPort = 3001;
const serverIP = "localhost";
const wsServerPort = 8080;

const WebSocketServerToken = createContextToken<MarbleWebSocketServer>();

const sayHelloWorldOnlyOnce$: WsEffect = event$ =>
  event$.pipe(
    matchEvent("HELLO_ONLY_ONCE"),
    mapTo({ type: "HELLO_ONLY_ONCE", payload: "Hello, world only once!" })
  );

const sayHelloWorldEverySec$: WsEffect = (event$, client) =>
  event$.pipe(
    matchEvent("HELLO_EVERY_SEC"),
    switchMap(_ =>
      interval(1000).pipe(
        mergeMap(_ => client.sendBroadcastResponse({ type: "HELLO_EVERY_SEC", payload: "hello world" }))
      )
    )
  );

const webSocketServer = webSocketListener({
  effects: [sayHelloWorldOnlyOnce$, sayHelloWorldEverySec$]
});

console.log(`http://${serverIP}:${serverPort}`);
console.log(`ws://${serverIP}:${wsServerPort}`);

const server = createServer({
  port: serverPort,
  hostname: serverIP,
  httpListener: httpListener({ middlewares, effects }),
  dependencies: [
    bindTo(WebSocketServerToken)(webSocketServer({ port: wsServerPort }).run)
  ]
});

server.run();
