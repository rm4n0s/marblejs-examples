to fail
curl --header "Content-Type: application/json" -d '{"login":"lala","password":"lala"}' -X POST http://localhost:3001/login

to pass
curl --header "Content-Type: application/json" -d '{"login":"manos","password":"iamhacker"}' -X POST http://localhost:3001/login

curl -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc1VzZXIiOnRydWUsImV4cCI6MTU1OTg2NTUwOCwiaWF0IjoxNTU5ODUxMTA4fQ.DZ-fAmaqJpKZaG8htRpllyOaR0ENmQzo8KN2CuMSerM" -X GET http://localhost:3001/user