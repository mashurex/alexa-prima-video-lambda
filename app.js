/**
 * @author Mustafa Ashurex <ashurexm@gmail.com>
 * @description AWS Lambda function for Alexa Skill that gets new releases from Amazon Video.
 */

var aws = require('aws-lib');
var fs = require('fs');

var prodAdv;
var appConfig;

function buildSpeechletResponse(title, output, repromptText, shouldEndSession) {
    return {
        outputSpeech: {
            type: "PlainText",
            text: output
        },
        card: {
            type: "Simple",
            title: 'Prime Video - ' + title,
            content: output
        },
        reprompt: {
            outputSpeech: {
                type: "PlainText",
                text: repromptText
            }
        },
        shouldEndSession: shouldEndSession
    };
}

function buildResponse(sessionAttributes, speechletResponse) {
    return {
        version: "1.0",
        sessionAttributes: sessionAttributes,
        response: speechletResponse
    };
}


function onSessionStarted(sessionStartedRequest, session) {
    console.log("onSessionStarted requestId=" + sessionStartedRequest.requestId + ", sessionId=" + session.sessionId);
}

function onLaunch(launchRequest, session, callback) {
    console.log("onLaunch requestId=" + launchRequest.requestId + ", sessionId=" + session.sessionId);
    getWelcomeResponse(callback);
}

function getWelcomeResponse(callback) {
    var sessionAttributes = {};
    var cardTitle = "Welcome";
    var speechOutput = "Welcome to Prime Video for Alexa, " +
        "I can tell you about the newest movie releases on Amazon Video by saying, " +
        "Alexa ask Prime Video for the newest movies.";
    // If the user either does not reply to the welcome message or says something that is not
    // understood, they will be prompted again with this text.
    var repromptText = "Please ask for new releases by asking, what are the latest movies?";
    var shouldEndSession = false;

    callback(sessionAttributes, buildSpeechletResponse(cardTitle, speechOutput, repromptText, shouldEndSession));
}

function fetchNewReleases(intent, session, callback) {
    var repromptText = null;
    var sessionAttributes = {};
    var shouldEndSession = true;
    var speechOutput = "";

    console.time('GetNewReleases');
    prodAdv.call("BrowseNodeLookup", {
        // Sample Movie Node ID: 2858905011
        BrowseNodeId: appConfig.search.movies.browseNodeId,
        ResponseGroup: 'Request,BrowseNodeInfo,NewReleases,TopSellers'
    }, function(err, result) {
        if(err) {
            console.log(err);
            speechOutput = 'Sorry, I encountered errors fetching the Amazon Video top sellers for you.';
        } else {
            // console.log(JSON.stringify(result));
            speechOutput = 'Here are the latest releases to Amazon Video: ';
            var results = result.BrowseNodes.BrowseNode.NewReleases.NewRelease;
            for(var i = 0; i < results.length; i++)
            {
                speechOutput += results[i].Title + '. ';
            }
        }

        console.timeEnd('GetNewReleases');
        return callback(sessionAttributes, buildSpeechletResponse('New Releases',
            speechOutput, repromptText, shouldEndSession));
    });
}

/**
 * Called when the user ends the session.
 * Is not called when the skill returns shouldEndSession=true.
 */
function onSessionEnded(sessionEndedRequest, session) {
    console.log("onSessionEnded requestId=" + sessionEndedRequest.requestId + ", sessionId=" + session.sessionId);
    // Add cleanup logic here
}


function onIntent(intentRequest, session, callback) {
    console.log("onIntent requestId=" + intentRequest.requestId + ", sessionId=" + session.sessionId);

    var intent = intentRequest.intent,
        intentName = intentRequest.intent.name;

    console.log(intent);

    // Dispatch to intent handlers.
    if ("GetNewReleases" === intentName) {
        fetchNewReleases(intent, session, callback);
    }
    else if ("AMAZON.HelpIntent" === intentName) {
        getWelcomeResponse(callback);
    }
    else { throw "Invalid intent"; }
}

/**
 * Reads configuration and returns an error if any occur, otherwise sets global appConfig variable.
 */
function readConfiguration(callback) {
    fs.readFile(process.env.LAMBDA_TASK_ROOT + '/config.json', 'utf8', function (err,data) {
        if (err) {
            return callback(err);
        } else {
            try {
                var config = JSON.parse(data);
                appConfig = config;
                prodAdv = aws.createProdAdvClient(config.aws.accessKey, config.aws.secretKey, config.aws.advertisingKey, {
                    version: '2013-08-01'
                });

                return callback(null);
            }
            catch(e) {
                return callback(new Error(e));
            }
        }
    });
}

/**
 * Default AWS Lambda code entrance.
 * @param event
 * @param context
 * @returns {*}
 */
exports.handler = function(event, context) {

    try {
        readConfiguration(function(err){
            if(err) {
                return context.fail(err);
            }

            // Prevent getting called by any other Alexa function
            // Example: amzn1.echo-sdk-ams.app.[specific app id]
            if (appConfig.alexa.allowedAppId &&
                event.session.application.applicationId !== appConfig.alexa.allowedAppId) {
                return context.fail("Invalid Alexa Application ID!");
            }

            if (event.session.new) {
                onSessionStarted({requestId: event.request.requestId}, event.session);
            }

            if (event.request.type === "LaunchRequest") {
                onLaunch(event.request,
                    event.session,
                    function callback(sessionAttributes, speechletResponse) {
                        return context.succeed(buildResponse(sessionAttributes, speechletResponse));
                    });
            }
            else if (event.request.type === 'IntentRequest') {
                onIntent(event.request, event.session, function callback(sessionAttributes, speechletResponse) {
                    return context.succeed(buildResponse(sessionAttributes, speechletResponse));
                });
            }
            else if (event.request.type === "SessionEndedRequest") {
                onSessionEnded(event.request, event.session);
                return context.succeed();
            }
        });
    } catch (e) {
        console.error(e);
        return context.fail(e);
    }
};
