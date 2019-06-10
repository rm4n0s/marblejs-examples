import * as path from "path";
import * as fs from "fs";
import {
  createServer,
  combineRoutes,
  httpListener,
  r,
  createContextToken,
  bindTo,
  matchEvent,
  HttpServerEffect,
  ServerEvent
} from "@marblejs/core";
import {
  webSocketListener,
  WsEffect,
  MarbleWebSocketServer,
  mapToServer
} from "@marblejs/websockets";
import { mergeMap, switchMap, map, mapTo } from "rxjs/operators";
import { interval, merge } from "rxjs";
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

const WebSocketServerToken = createContextToken<MarbleWebSocketServer>();


const upgradeProtocol$: HttpServerEffect = (event$, server, { ask }) =>
  event$.pipe(
    matchEvent(ServerEvent.upgrade),
    mapToServer({
      path: '/ws',
      server: ask(WebSocketServerToken),
    }),
  );
  
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
        mergeMap(_ =>
          client.sendBroadcastResponse({
            type: "HELLO_EVERY_SEC",
            payload: "hello world"
          })
        )
      )
    )
  );

const webSocketServer = webSocketListener({
  effects: [sayHelloWorldOnlyOnce$, sayHelloWorldEverySec$]
});

const httpsOptions = {
  key: fs.readFileSync(STATIC_PATH + "/key.pem"),
  cert: fs.readFileSync(STATIC_PATH + "/cert.pem")
};

console.log(`https://${serverIP}:${serverPort}`);
console.log(`wss://${serverIP}:${serverPort}/ws`);

const server = createServer({
  port: serverPort,
  hostname: serverIP,
  options: { httpsOptions },
  httpListener: httpListener({ middlewares, effects }),
  dependencies: [bindTo(WebSocketServerToken)(webSocketServer().run)],
  event$:  (...args) => merge(upgradeProtocol$(...args))
});

server.run();
