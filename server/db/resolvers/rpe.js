


/**
 * Habilita `%alias%.rpePercent` en el SQL que lo incluya.
 * Ese valor se lo pasas como 4to parámetro a la función `sql1RMFormula`
 * Hace un left join de la tabla de RPE filtrando la fila que tenga ese rep y rpe. 
 * El objetivo es obtener el `rpePercent`
 * 
 * -----
 * SELECT * FROM (SELECT rep, rpe, percent FROM `rpe_override`
UNION 
SELECT rep, rpe, percent FROM rpe where rep=5 ) B GROUP BY rep, rpe;
 */
export const rpePercentLeftJoin = (alias, rep, rpe)=>{
    return `#
            # rpe
            #
            # LEFT JOIN ( SELECT percent AS rpePercent, rep, rpe FROM rpe ) AS ${alias} ON RPE.rep=${rep} AND RPE.rpe=${rpe}
            LEFT JOIN (
                SELECT percent AS rpePercent, rep, rpe AS _rpe FROM (SELECT rep, rpe, percent FROM rpe_override
                                UNION 
                              SELECT rep, rpe AS _rpe, percent FROM rpe ) B 
                GROUP BY rep, rpe
            ) 
            AS ${alias} ON RPE.rep=${rep} AND RPE._rpe=${rpe} 
            `
}