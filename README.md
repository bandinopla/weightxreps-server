![Logo](https://weightxreps.net/logo.png)

# Welcome
I am thrilled to announce that I am releasing my backend code to the community as open source. This has been a long-time goal of mine and I am excited to see the impact it will have. 

By making the code available to all, I am hoping to attract contributions from other developers that can help enhance the codebase. This will result in a stronger and more reliable code, as well as promote collaboration and creativity within the community. 

I believe that this open source release will be a great step forward for the project and I can't wait to see what the community will create with it.


# The Server
This is the code for the server side of http://weightxreps.net 

> Weight For Reps is a training journal logging tool to help you keep track of your weight training. Mostly orientated towards Powerlifting/Weightlifting style of training.

The server runs in [NodeJS](https://nodejs.org/en/) as a [GraphQL](https://graphql.org/) server but it is wrapped with [Express](https://expressjs.com/) so the potential to use it for other things is there but currently not used.

The Front-End comunicates with this server vía [GraphQL](https://graphql.org/) calls to `http://weightxreps.net/wxr-server-2/graphql` using [Apollo GraphQL](https://www.apollographql.com/docs/react/) ( both client and server )

---

## :newspaper: Run a local dev database
The serves uses a [MySQL database](https://www.mysql.com/). To setup a development database on your machine use [docker-compose](https://docs.docker.com/get-started/08_using_compose/). The docker compose related files are in `wxr-dev-db` folder. Note: it will be empty...
```bash
cd wxr-dev-db
docker-compose up
```

#### :seedling: Seeding the database
To fill this new "empty" database with dummy data, run this command:
```bash
npm run reset-db
```
Everytime you run that script, the _database will be truncated_, all data will be deleted and new dummy data will be created.

The database connection settings live in the `.env` file. Make sure they match your dev database settings. Read the `docker-compose.yml` to see which username, password and database name are used in dev mode...

---

## :coffee: Run local dev server
To start playing with the code you will need [NodeJS](https://nodejs.org/en/) and keep in mind that the server in which the site is currently hosted works with Node Version 14.20.1 so if you plan to add some new feature make sure it is in range on the features provided up to that point or else the code wont run.

> in VS Code you can go to "Run > run Dev" or "Run > Production" _it will only serve to set the NODE_ENV environment variable to development or production_

or vía NPM ( you will need to install [NodeMon](https://nodemon.io/) )
``` 
npm run dev
```

The code will load the `.env` file to configure itself.

The code lives in the `./server` folder. The code that handles the GraphQL shema is is `./server/db/resolvers`

#### :warning: Files you need !

- `firebase-adminsdk-credentials.js`
you will need to create & place this file inside of `server` with a [firebase account](https://console.firebase.google.com/).  
- `.env` place this at the root of this proyect. This file should contain the info to connect to the database in your dev environment. Use `.env.example` as base.

---

## :globe_with_meridians: SBD Rank
This is the data used in the [SBD World Rank](https://weightxreps.net/sbd-stats) setion of the site.

To update the SBD rank data run `npm run update-sbd-rank` that will download the latest ZIP from openpowerlifting, process it and store the resulting data in `server/db/resolvers/sbd-stats.js` after that is done, that's all there is to it... the server should be re-run and the new data will be used.

> Note: it will take a while to process...

---

## :satellite: Official Exercises
They are hard-coded in `server/utils/ename2type.js` These are the exercises that the site "understands" and adds them to the [community stats](https://weightxreps.net/community-stats).

---

## :trophy: How to contribute?
You fork this repo, do your thing, and do a **pull request**.

---

## :hearts: Support / Donate
If you have a weightxreps.net account log in and go to the [donations page](https://weightxreps.net/donate)

If you want to donate directly, my paypal is pablo@weightxreps.net

