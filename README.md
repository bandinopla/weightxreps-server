![Logo](https://github.com/bandinopla/weightxreps-client/raw/main/public/session-banner.jpg)

# Welcome
I am thrilled to announce that I am releasing my [backend code](https://github.com/bandinopla/weightxreps-server) and [frontend code](https://github.com/bandinopla/weightxreps-client) to the community as open source. This has been a long-time goal of mine and I am excited to see the impact it will have. 

By making the code available to all, I am hoping to attract contributions from other developers that can help enhance the codebase. This will result in a stronger and more reliable code, as well as promote collaboration and creativity within the community. 

I believe that this open source release will be a great step forward for the project and I can't wait to see what the community will create with it.


# The Server
This is the code for the server side of http://weightxreps.net 

> Weight For Reps is a training journal logging tool to help you keep track of your weight training. Mostly orientated towards Powerlifting/Weightlifting style of training.

The server runs in [NodeJS](https://nodejs.org/en/) as a [GraphQL](https://graphql.org/) server but it is wrapped with [Express](https://expressjs.com/) so the potential to use it for other things is there but currently not used.

The Front-End comunicates with this server vía [GraphQL](https://graphql.org/) calls to `http://weightxreps.net/wxr-server-2/graphql` using [Apollo GraphQL](https://www.apollographql.com/docs/react/) ( both client and server )

---

## :newspaper: Run dev environment
To setup a development database on your machine use [docker](https://www.docker.com/). VS Code should detect the `.devcontainer` folder automatically. A notification will pop up, asking if you want to "Reopen in Container." Click on that option.

If you don’t see the notification, you can manually start the container by:
- Going to the Command Palette (`Ctrl+Shift+P` or `Cmd+Shift+P` on macOS).
- Typing and selecting "`Dev Containers: Reopen in Container`".

---

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
you will need to create & place this file inside of `server` with a [firebase account](https://console.firebase.google.com/).  

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

