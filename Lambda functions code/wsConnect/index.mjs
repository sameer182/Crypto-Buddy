//Import library and scan command
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand } from "@aws-sdk/lib-dynamodb";

//Create new Client
const ddbClient = new DynamoDBClient();

export const handler = async (event) => {
    //Get connection ID from event
    let connId = event.requestContext.connectionId;
    console.log("Client connected with ID: " + connId);

    //Parameters for storing connection ID in DynamoDB
    const params = {
        TableName: "WebSocketClients",
        Item: {
            ConnectionId: connId
        }
    };

    //Store connection Id for later communication with client
    try {
        await ddbClient.send( new PutCommand(params) );
        console.log("Connection ID stored.");

        //Return response
        return {
            statusCode: 200,
            body: "Client connected with ID: " + connId
        };
    }
    catch (err) {
        console.error(JSON.stringify(err));
        return {
            statusCode: 500,
            body: "Server Error: " + JSON.stringify(err)
        };
    }
};
  

