
import { query, transaction } from "../../db/connection";
import { BaseSetting } from "../../db/resolvers/settings/BaseSetting";
import isValidUrl from "../../utils/isValidUrl";
import { MustBe } from "../../utils/objectSchemaValidator";
import { hashObject } from "../../utils/token";
import { getDeveloperServices, revokeClientsFrom } from "../model";
import { DeveloperConfigSettingName } from "./graphqlSettingTypeDefs";

/**
 * @typedef {import("../../db/schema/types").DeveloperService} DeveloperService
 */
/**
 * @typedef {import("../../db/schema/types").DeveloperConfigSetting["config"]} Config
 */

const EXAMPLE_ID = "example.com";

export class DeveloperConfigSetting extends BaseSetting {

    constructor() {
        super("oauth-dev-config", DeveloperConfigSettingName, false);
    }

    async getSetting(userInfo, addExampleData=true) {

        let services = await getDeveloperServices(userInfo.id);

        //
        // add sample data to let the user quickly see an example config...
        //
        if( addExampleData )
        {
            if(! services.length )
            {
                services.push({
                    id: EXAMPLE_ID,
                    name:"Example Service!",
                    url:"http://your.app.site",
                    redirectUris: [
                        "http://your.app.site/wxr-oauth",
                        "http://localhost:3000/wxr-oauth"
                    ]
                });
            }
        }
        

        return this.__asSetting({
            config: {
                services
            }
        });
    }


    //
    // the first save is used to build the changelog, we send that to client, and clients confirm and we come here one last time with a confirmation code in the config.
    //
    async setValue(userInfo, value) { 

        //
        // delete/remove dummy data that might be in the config. (In case they sent it and didn't bothered in deleting it...)
        //
        value = {
            ...value,
            services: Array.isArray(value.services) ? value.services?.filter(s=>s.id!=EXAMPLE_ID) : value.services
        }


        //
        // check if user already saw the changes made and confirmed them.
        //
        if (this.userConfirmedThis(value)) {
            return this.__asSetting({
                config: await this.save(userInfo, value, true)
            });
        }

        //
        // First time saving, show user a preview of what is about to happen...
        //
        return {

            __typename: this.__typename,
            waitingCodeToChange: false,

            id: this.id + "-PENDING", 

            config: {
                confirmChanges: {
                    hash: hashObject(value),
                    changelog: await this.save(userInfo, value, false)
                }
            }
        }; //asi como viene lo devuelve...
    }

    /** 
     * @param {Config} config   
     */
    userConfirmedThis(config) {
        const proof = config.confirmChanges?.hash;

        if (!proof) return false;

        const original = { ...config };
        delete original.confirmChanges;

        const hash = hashObject(original);
        const isValid = hash == proof;

        if (!isValid) {
            throw new Error("Invalid confirmation token, can't be thrusted.");
        }

        return true;
    }

    /** 
     * @param {Config} config 
     * @param {boolean} commit 
     * @return {Config}
     */
    async save(userInfo, config, commit = false) {

        let setting = await this.getSetting(userInfo, false); 

        //del original: eliminados o editados.
        //del nuevo: creados.
        let { changelog, services } = await this.resolveSaveOperations(userInfo.id, setting.config, config); 

        if(!commit) return changelog;
 
        // //create
        // //delete
        // //modify
        let tran = await transaction();


        try { 
            //
            // CREATE
            // 
            for ( const service of services?.create ) 
            {
                let op = await tran.query(`INSERT INTO oauth_clients SET ?`, { 
                    client_id: service.id,
                    app_name: service.name,
                    app_url: service.url,
                    redirect_uri: service.redirectUris.join(","),
                    uid: userInfo.id
                });

                if( !op.affectedRows )
                {
                    throw new Error(`Failed to create service <${service.id}>`);
                } 

                service.dbid = op.insertId;
            } 

            //
            // DELETE
            //
            for ( const service of services?.remove ) 
            {
                let del = await tran.query(`DELETE FROM oauth_clients WHERE id=?`, [ service.dbid ]);

                if( !del.affectedRows )
                {
                    throw new Error(`Failed to delete service <${service.id}>`);
                } 
            }
            
            //
            // MODIFY
            //
            for( const service of services?.modify )
            {
                let fields = {};

                service.id && (fields.client_id = service.id);
                service.name && (fields.app_name = service.name);
                service.url && (fields.app_url = service.url); 
                service.redirectUris && (fields.redirect_uri = service.redirectUris.join(",")); 

                let op = await tran.query(`UPDATE oauth_clients SET ? WHERE id=?`, [ fields, service.dbid ]);

                if( !op.changedRows )
                {
                    throw new Error(`Failed to edit/modify service <${service.id}>`);
                }
            }

            //
            // ok...
            //
            await tran.commit();

        }
        catch( error ) {
            await tran.abort( error.message + ". Save operation aborted. Nothing was saved." ); 
            throw error;
        }

        return config;
    }

    /** 
     * Validates data and organizes the data to be manipulated in a way that is easy to handle.
     * 
     * @param {number} uid Developer's ID in weightxreps.
     * @param {Config} original 
     * @param {Config} modified 
     * @returns {{ changelog?:string, services:{ create?:DeveloperService[], remove?:DeveloperService[], modify?:DeveloperService[] } }}
     */
    async resolveSaveOperations(uid, original, modified) {

        let changelog = [];

        let originalServices = original.services;

        let services2save = modified.services;

        //validate fields...
        await this.throwErrorIfInvalidFields( uid, original, modified);

        /**
         * @type {DeveloperService[]}
         */
        let remove = []; 

        /**
         * @type {DeveloperService[]}
         */
        let create = [];
 

        /**
         * @type {DeveloperService[]}
         */
        let modify = [];

        //--------------------------------------------------------
        services2save?.forEach((s,i) => {

            if( services2save.findLastIndex(z=>z.id==s.id)>i )
            {
                throw new Error(`Cannot redeclare service's ID '<${s.id}>. There can only be ONE.`);
            }

            //
            // complete possibly missing "dbid" ( example, if you manually delete the field in the yaml and hit save... )
            //
            if( !s.dbid )
            { 
                let other = originalServices?.find( z=>z.id==s.id);
                if( other )
                {
                    s.dbid = other.dbid;
                }
            }

            //
            // check if this is a service that doesn't exists in the db...
            //
            if ( !originalServices?.find(z => z.dbid == s.dbid) ) {
                create.push(s);
                changelog.push(`CREATE NEW Service <${s.id}>`);
            }
        });

        originalServices?.forEach(s => {

            let other = services2save?.find(z => z.dbid == s.dbid);

            if ( !other ) {
                remove.push(s);
                changelog.push(`DELETE Service <${s.id}>`);
            }
            else 
            {
                let changes = { dbid: s.dbid };

                [ "id", "name", "url", "redirectUris"].forEach(key => {
                    let val0 = s[key];
                    let val = other[key];

                    if (Array.isArray(val0)) val0 = val0.join(",");
                    if (Array.isArray(val)) val = val.join(",");

                    if (val0 != val) {
                        changes[key] = other[key];
                        changelog.push(`MODIFY Service <${s.id}>.${key} from <${val0}> to <${val}>`);
                    }
                });

                if (Object.keys(changes).length > 1) {
                    modify.push(changes);
                }
            }

        });

        if(!changelog.length) {
            throw new Error(`Nothing to save...`);
        }

       return {
            changelog: changelog.map((txt, i) => `${i + 1}) ${txt}`).join("\n--\n"),
            services: {
                create,
                modify,
                remove
            }
       }
    }

    /** 
     * Validate the `newConfig`, make sure it is the right shape and has no conflicting data (like ids pointing to other's people stuff)
     * 
     * @param {number} uid Developer's id (user in weightxreps) 
     * @param {Config} [originalConfig] Original config in case there's any...
     * @param {Config} newConfig Thenew config that will replace the original...
     */
    async throwErrorIfInvalidFields( uid, originalConfig, newConfig ) {
 
        //validate URLS
        let errors = [];

        //
        // shape of the config...
        //
        let configSchema = MustBe.Object({
            services: MustBe.Array(0,5).of([
                MustBe.Object({
                    id: MustBe.String(3,80).andMatch(/^[a-zA-Z0-9._-]+$/,"Invalid ID. It should only contain letters, numbers, dots (.), underscores (_), and hyphens (-)."),
                    dbid: MustBe.String(1,10).optional,
                    name:MustBe.String(3,80),
                    redirectUris:MustBe.Array(1,4).of([ 
                        MustBe.String(10,500).andPass(isValidUrl)
                    ]),
                    url:MustBe.String(10,500).andPass(isValidUrl)
                })
            ])
        });  

        //
        // validate structure of the new config...
        //
        if( !configSchema.validate("config", newConfig, err=>errors.push(err )) )
        {
            throw new Error( errors.join("\n"));
        } 

        //
        // check for collisions with existing services. Service ids must be unique...
        //
        let sids = newConfig.services.flatMap( s=>s.id ) ;
        let dbids = newConfig.services.flatMap( s=>s.dbid ).filter(v=>v) ;

        if( sids.length || dbids.length )
        { 
            sids.push("0");
            dbids.push("0");

            let collisions = await query(`SELECT id, uid, client_id 
                                         FROM oauth_clients WHERE (client_id IN (?) OR id IN (?)) `,[ sids, dbids ]);

            if( collisions.length )
            {
                let errors = newConfig.services.reduce((out, s, i)=>{

                    if( collisions.find(r=>r.id==s.dbid && r.uid!=uid) ) out.push(`Service[${i}].dbid = <${s.dbid}> references a service used by another developer. Typo?`);
                    if( collisions.find(r=>r.client_id==s.id && r.uid!=uid) ) out.push(`Service[${i}] with id <${s.id}> is being used by another developer. Pick another id.`);
                    if( !collisions.find(r=>r.id==s.dbid) ) out.push(`Service[${i}].dbid = <${s.dbid}> points to nowhere. No service has that dbid. Typo?`);

                    return out;
                },[]); 

                if( errors.length )
                    throw new Error(errors.join("\n"));
 
            } 
        }  

    }
}