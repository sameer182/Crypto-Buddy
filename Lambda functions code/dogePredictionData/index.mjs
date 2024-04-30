//Importing AWS and plotly
import AWS from 'aws-sdk';
import Plotly from 'plotly';

// Authentication details for Plotly
const PLOTLY_USERNAME = 'samlimbu';
const PLOTLY_KEY = 'Hg0AjaWr6W0yJ9MrHgfv';

// Initialize Plotly with user details.
const plotly = Plotly(PLOTLY_USERNAME, PLOTLY_KEY);

const sagemakerRuntime = new AWS.SageMakerRuntime();
const dynamodb = new AWS.DynamoDB.DocumentClient();

async function handler(event) {
    try {
        for (const record of event.Records) {
         // Check if the event is an INSERT operation
         if (record.eventName === "INSERT") {
        // Retrieve the new item from the event
        const newItem = AWS.DynamoDB.Converter.unmarshall(record.dynamodb.NewImage);
        
        // Get prices data from DynamoDB
        const priceData = await getPriceData();

        // Extract prices and currencytimestamps from DynamoDB response
        const prices = priceData.Items.map(item => item.Price);
        const timestamps = priceData.Items.map(item => item.CurrencyTimeStamp);
        
        // Slice the last 100 prices
        const last100Prices = prices.slice(-100);

        // Define endpoint data
        const endpointData = {
            "instances": [
                {"start":"2023-12-22 00:00:00","target": last100Prices}  
            ],
            "configuration": {
                "num_samples": 50,
                "output_types": ["mean", "quantiles", "samples"],
                "quantiles": ["0.1", "0.9"]
            }
        };

        // Make a request to the endpoint
        const data = await sagemakerRuntime.invokeEndpoint({
            Body: JSON.stringify(endpointData),
            EndpointName: 'dogeEndpoint',
            ContentType: 'application/json',
            Accept: 'application/json'
        }).promise();

        let predictedData = JSON.parse(data.Body.toString());

        // Get the last timestamp from the original data
        const lastTimestamp = timestamps[timestamps.length - 1];

        // Create an array to hold the timestamps for the predicted data
        let predictedTimestamps = [];
        // Calculate the predicted timestamps, starting the day after the last original timestamp
        for (let i = 1; i <= predictedData.predictions[0].mean.length; i++) {
            let newTimestamp = lastTimestamp + i * 86400000; // 86400000 milliseconds in a day
            predictedTimestamps.push(newTimestamp);
        }

        // Convert original timestamps from Unix to 'yyyy-mm-dd'
        let xValuesOriginal = timestamps.map(ts => new Date(ts).toISOString().split('T')[0]);

        // Convert predicted timestamps from Unix to 'yyyy-mm-dd'
        let xValuesPredicted = predictedTimestamps.map(ts => new Date(ts).toISOString().split('T')[0]);

        // Plot the data using the xValuesOriginal and xValuesPredicted
        let plotResult = await plotData(xValuesOriginal, prices, xValuesPredicted, predictedData);
        
        //Print the Predicted Mean, Quantile 0.1 and 0.9 data
        console.log("Mean Data: ", JSON.stringify(predictedData.predictions[0].mean) + "\nQuantile 0.1: ", JSON.stringify(predictedData.predictions[0].quantiles['0.1']) 
        + "\nQuantile 0.9: ", JSON.stringify(predictedData.predictions[0].quantiles['0.9']));

        console.log("Plot available at: " + plotResult.url);
        
         // Save the plot URL into DynamoDB under the currency name "BNB"
         await savePlotToDynamoDB(plotResult.url);
         }
}

        return {
            statusCode: 200,
            body: "Ok"
        };
    } catch (err) {
        console.log("ERROR: " + JSON.stringify(err));
        return {
            statusCode: 500,
            body: "Error plotting data"
        };
    }
}

// Function to save the plot URL into DynamoDB
async function savePlotToDynamoDB(url) {
    const currency = 'DOGE';
    const params = {
        TableName: 'PredictionData',
        Item: {
            Currency: currency,
            url: url
        }
    };
    try {
        await dynamodb.put(params).promise();
        console.log("URL has been successfully saved in DynamoDB.");
    } catch (error) {
        console.error("Error saving URL in DynamoDB:", error);
    }
}

// Function to retrieve data from DynamoDB
async function getPriceData() {
    const params = {
        TableName: 'Crypto',
        KeyConditionExpression: 'Currency = :currency',
        ExpressionAttributeValues: {
            ':currency': 'DOGE'
        }
    };

    return dynamodb.query(params).promise();
}

// Plots the specified data
async function plotData(xValuesOriginal, yValuesOriginal, xValuesPredicted, predictedData) {

    // Data structure for original data
    let originalData = {
        x: xValuesOriginal,
        y: yValuesOriginal,
        type: "scatter",
        mode: 'line',
        name: 'Original Data',
        marker: {
            color: 'rgb(219, 64, 82)',
            size: 12
        }
    };

    // Data structure for predicted mean data
    let predictedMeanData = {
        x: xValuesPredicted,
        y: predictedData.predictions[0].mean,
        type: "scatter",
        mode: 'line',
        name: 'Mean',
        marker: {
            color: 'rgb(44, 160, 255)',
            size: 12
        }
    };

    // Data structure for quantile 0.1 data
    let quantile01Data = {
        x: xValuesPredicted,
        y: predictedData.predictions[0].quantiles['0.1'],
        type: "scatter",
        mode: 'line',
        name: '0.1 Quantile Prediction',
        marker: {
            color: 'rgb(255, 127, 14)',
            size: 12
        }
    };

    // Data structure for quantile 0.9 data
    let quantile09Data = {
        x: xValuesPredicted,
        y: predictedData.predictions[0].quantiles['0.9'],
        type: "scatter",
        mode: 'line',
        name: '0.9 Quantile Prediction',
        marker: {
            color: 'rgb(44, 160, 44)',
            size: 12
        }
    };

    let data = [originalData, predictedMeanData, quantile01Data, quantile09Data];

    // Layout of graph
    let layout = {
        title: "DOGE Prediction Price Data",
        font: {
            size: 14,
        },
        xaxis: {
            title: 'Timestamp'
        },
        yaxis: {
            title: 'Price in GBP'
        }
    };

    let graphOptions = {
        layout: layout,
        filename: "DOGE-price-plot",
        fileopt: "overwrite"
    };

    // Wrap Plotly callback in a promise
    return new Promise((resolve, reject) => {
        plotly.plot(data, graphOptions, function(err, msg) {
            if (err)
                reject(err);
            else {
                resolve(msg);
            }
        });
    });
}

// Export the handler function for AWS Lambda
export { handler };
