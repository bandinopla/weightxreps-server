![Logo](https://github.com/bandinopla/weightxreps-client/raw/main/public/session-banner.jpg)
> [Weight For Reps](http://weightxreps.net) is a training journal logging tool to help you keep track of your weight training. Mostly orientated towards Powerlifting/Weightlifting style of training.

# Welcome! 

I am thrilled to announce 😂 that I am releasing my [backend code](https://github.com/bandinopla/weightxreps-server) and [frontend code](https://github.com/bandinopla/weightxreps-client) to the community as open source. This has been a long-time goal of mine and I am excited to see the impact it will have. 
<br/><br/>

# The Server 

The server runs in [NodeJS](https://nodejs.org/en/) / [Express](https://expressjs.com/) and uses  [GraphQL](https://graphql.org/) vía [Apollo Server (v3)](https://www.apollographql.com/docs/apollo-server/v3) to connect with the frontend.

## Endpoints


- graphql -> http://weightxreps.net/api/graphql 
    - Schema documentation at [GraphQL Explorer](https://studio.apollographql.com/sandbox?endpoint=https%3A%2F%2Fstaging.weightxreps.net%2Fapi%2Fgraphql) That link points to the staging DB but the schema is the same.
- OAuth2 -> http://weightxreps.net/api/auth 
    - > Read our [api/auth documentation](docs/OAUTH.md) if you are an app developer.

## :newspaper: Run in docker
To setup a development database on your machine use [docker](https://www.docker.com/). VS Code should detect the `.devcontainer` folder automatically. A notification will pop up, asking if you want to "Reopen in Container." Click on that option.

If you don’t see the notification, you can manually start the container by:
- Going to the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS).
- Typing and selecting "`Dev Containers: Reopen in Container`".

## No docker? 
Then the specs needed to run this are:
- Node: `v20.17.0`
- Database: [`mariadb v10.6.19`](https://mariadb.com/kb/en/mariadb-10-6-19-release-notes/) with `@@sql_mode=""` and [`mysql_native_password`](https://dev.mysql.com/doc/refman/8.4/en/native-pluggable-authentication.html) 
- Create/Edit `.env` with the DB relevant variables. (use `.env.example` as base)
- Seed database with fake data `npm run seed-db`
- *...know that the server is running on linux in production.*

---

## Seed Dev Database
You have 2 options:
1. ### Drop tables + seed 
```
npm run seed-db
```
2. ### Truncate (empty) tables + seed  
```
npm run truncate-db
```

## :coffee: Run local dev server 

In VS Code you can go to "Run > run Dev" or "Run > Production" _it will only serve to set the NODE_ENV environment variable to development or production_

or vía NPM ( you will need to install [NodeMon](https://nodemon.io/) )
``` 
npm run dev
```

**GraphQl** > Then you can navigate to `/graphql` to access the graphql explorer & interact with the server as the front-end would do.

The code lives in the `./server` folder. The code that handles the GraphQL is in `./server/db`

> If you are developing both backend and front end (or make changes to the schema), clone both repos into a folder and name each folder `client` and `server`. This is required because the server [generates code](https://the-guild.dev/graphql/codegen) when you make changes in the graphql schema and run `npm run exportschema` and goes one level up and expect a client folder to exist... these files will be dynamically created **automatically**:
- `generated---db-introspection.json`
- `generated---db-types-and-hooks.tsx`

#### :warning: Files you need !

- `firebase-adminsdk-credentials.js`
you will need to create & place this file inside of `server` with a [firebase account](https://console.firebase.google.com/). This is used by the "login with" widget which uses Firebase.
 

## Save Editor Data Format
When saving a workout, the resolver will recieve an array of `JEditorSaveRow` which is a scalar that can have many diferent interpretations...
- [resolver `saveJEditor`](server/db/resolvers/save-journal.js) 
- [scalar `JEditorSaveRow`](docs/JEditorSaveRow.md)


## :globe_with_meridians: SBD Rank
This is the data used in the [SBD World Rank](https://weightxreps.net/sbd-stats) setion of the site.

To update the SBD rank data run `npm run update-sbd-rank` that will download the latest ZIP from openpowerlifting, process it and store the resulting data in `server/db/resolvers/sbd-stats.js` after that is done, that's all there is to it... the server should be re-run and the new data will be used.

> Note: it will take a while to process...

---

## :satellite: Official Exercises
They are hard-coded in `server/utils/ename2type.js` These are the exercises that the site "understands" and adds them to the [community stats](https://weightxreps.net/community-stats).

---

## :trophy: How to contribute? 

If you would like to contribute, follow these steps:

1. Fork the `weightxreps-server` repository.
2. Create a new branch in your fork to make your changes.
3. Commit your changes to your new branch.
4. Push your changes to your fork on GitHub.
5. Submit a pull request from your branch to the `weightxreps-server` repository.

I will review your pull request and, if everything looks good, merge it into the main codebase.

#### Questions?

If you have any questions about contributing, feel free to open an issue in the `weightxreps-server` repository and ask.


---

## :hearts: Support / Donate
If you have a weightxreps.net account log in and go to the [donations page](https://weightxreps.net/donate)

If you want to donate directly, my paypal is pablo@weightxreps.net

