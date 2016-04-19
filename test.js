const testers  = require( './testers.json' );
const fs       = require( 'fs' );
var successful = 0;
var version    = process.versions.node;
var es_staging = /--es_staging/.test( process.execArgv ) ? '--es_staging' : '';
if ( es_staging ) version += '--es_staging';
console.log( 'Testing ' + version );

// This function is needed to run the tests and was extracted from:
// https://github.com/kangax/compat-table/blob/gh-pages/node.js
global.__createIterableObject = function ( arr, methods ) {
    methods = methods || {};
    if ( typeof Symbol !== 'function' || !Symbol.iterator )
        return {};

    arr.length++;
    var iterator                = {
        next     : function () {
            return {
                value : arr.shift(),
                done  : arr.length <= 0
            };
        },
        'return' : methods[ 'return' ],
        'throw'  : methods[ 'throw' ]
    };
    var iterable                = {};
    iterable[ Symbol.iterator ] = function () {
        return iterator;
    };

    return iterable;
};

var results = {
    _version    : version,
    _v8         : process.versions.v8,
    _successful : 0,
    _count      : 0,
    _percent    : 0
};

function errors( e ) {
    return !!e && e.message;
}

Promise.all(
    Object.keys( testers ).map( function ( name ) {
        var script      = testers[ name ];
        results[ name ] = false; //make SURE it makes it to the output
        results._count++;

        script = script.trim()
        if ( script.indexOf( '/*' ) == 0 && script.lastIndexOf( '*/' ) == ( script.length - 2 ) ) {
            script = script.substring( 2, script.length - 2 )
        }

        return run( script )
            .catch( errors ) //we don't want the `all` to catch any errors
            .then( function ( result ) {
                //expected results: `e.message` or true/false
                results[ name ] = typeof result === 'string' ? result : !!result;
                if ( results[ name ] === true ) successful++;
            } );
    } )
       )
       .then( function () {
           results._successful = successful;
           results._percent    = successful / results._count;
           var json            = JSON.stringify( results, null, 2 );
           fs.writeFileSync( __dirname + '/results/' + version + '.json', json );
       } )
       .catch( console.log );

function run( script ) {
    //kangax's Promise tests reply on a asyncTestPassed
    //function that doesn't do anything that works here.
    // So, we'll swap it out to resolve/reject a promise when done.
    var async = /asyncTestPassed/.test( script );
    if ( async ) script = script.replace( /asyncTestPassed\(\)/, 'accept(true)' ) + '\nsetTimeout(reject, 500);';

    try {
        var fn = new Function( "accept, reject", script );
        return (async ? new Promise( fn ) : Promise.resolve( fn() || Promise.reject() ))
        //if it fails, try using strict mode...
            .catch( function () {
                var fn = new Function( "accept, reject", '"use strict"\n' + script );
                return async ? new Promise( fn ) : Promise.resolve( fn() );
            } );
    }
    catch ( e ) {
        return Promise.resolve( e.message );
    }
}
