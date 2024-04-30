//Import modules
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, DeleteCommand } from "@aws-sdk/lib-dynamodb";

//Create client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

export const handler = async(event) => {
    //Get connection ID from event
    let connId = event.requestContext.connectionId;
    console.log("Disconnecting client with ID: " + connId);

    //Parameters for deleting connection ID from DynamoDB
    const command = new DeleteCommand({
        TableName: "WebSocketClients",
        Key: {
            ConnectionId: connId
        }
      });
    

    //Send delete command
    try {
        await docClient.send(command);
        console.log("Connection ID deleted.");

        //Return response
        return {
            statusCode: 200,
            body: "Client disconnected. ID: " + connId
        };
    }
    catch (err) {
        console.log("Error disconnecting client with ID: " + connId + ": " + JSON.stringify(err));
        return {
            statusCode: 500,
            body: "Server Error: " + JSON.stringify(err)
        };
    }
};
