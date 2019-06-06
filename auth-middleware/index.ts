import {
  createServer,
  combineRoutes,
  httpListener,
  r,
  use,
  HttpError,
  HttpStatus
} from "@marblejs/core";
import { requestValidator$, t } from "@marblejs/middleware-io";
import { logger$ } from "@marblejs/middleware-logger";
import { bodyParser$ } from "@marblejs/middleware-body";
import {
  generateExpirationInHours,
  generateToken,
  authorize$
} from "@marblejs/middleware-jwt";
import { mergeMap, map, catchError } from "rxjs/operators";
import { throwError, of } from "rxjs";

const USERNAME = "manos";
const PASSWORD = "iamhacker";
const SECRET = "mylittlesecret";

const validator$ = requestValidator$({
  body: t.type({
    login: t.string,
    password: t.string
  })
});

interface PayloadI {
  isUser: boolean;
  exp: number;
}

function generateTokenPayload(): PayloadI {
  return {
    isUser: true,
    exp: generateExpirationInHours(4)
  };
}

function isUser(login: string, password: string) {
  console.log(login, password);
  if (login == USERNAME && password == PASSWORD) {
    return of({});
  } else {
    return throwError(new Error());
  }
}
const login$ = r.pipe(
  r.matchPath("/login"),
  r.matchType("POST"),
  r.useEffect(req$ =>
    req$.pipe(
      use(validator$),
      mergeMap(req =>
        of(req).pipe(
          map(req => req.body),
          mergeMap(body => isUser(body.login, body.password)),
          map(generateTokenPayload),
          map(generateToken({ secret: SECRET })),
          map(token => ({ body: { token } })),
          catchError(() =>
            throwError(
              new HttpError("Unauthorized user", HttpStatus.UNAUTHORIZED)
            )
          )
        )
      )
    )
  )
);

const verifyUser$ = (payload: PayloadI) => {
  if (payload.isUser) {
    return of({});
  } else {
    return throwError(new Error());
  }
};
const configAuth = { secret: SECRET };

const getUser$ = r.pipe(
  r.matchPath("/user"),
  r.matchType("GET"),
  r.useEffect(req$ =>
    req$.pipe(
      use(authorize$(configAuth, verifyUser$)),
      map(body => ({ body: `I am the best user` }))
    )
  )
);

const index$ = r.pipe(
  r.matchPath("/"),
  r.matchType("GET"),
  r.useEffect(req$ => req$.pipe(map(body => ({ body: `love` }))))
);

const api$ = combineRoutes("/", [login$, index$, getUser$]);

const middlewares = [logger$(), bodyParser$()];

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
