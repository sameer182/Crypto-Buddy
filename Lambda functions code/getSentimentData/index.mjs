//Import axios and AWS
import axios from 'axios';
import AWS from 'aws-sdk';

// Create DynamoDB service object
const dynamodb = new AWS.DynamoDB();

export const handler = async (event) => {
    
    // Iterate over each record in the event
    for (let record of event.Records) {
        if (record.eventName === "INSERT") {
            // Extract data from the event
            const crypto = record.dynamodb.NewImage.Currency.S;
            const time = record.dynamodb.NewImage.NewsTimeStamp.N;
            const text = record.dynamodb.NewImage.Title.S;

            console.log(`Crypto: ${crypto}; Time: ${time}; Text: ${text};`);
            
            // Call text-processing to get sentiment
            const sentiment = await tpSentiment(text);

            // Determine sentiment label based on the highest probability
            let sentimentLabel;
            const { pos, neutral, neg } = sentiment.probability;
            if (pos > neutral && pos > neg) {
                sentimentLabel = "Positive";  
            } else if (neutral > pos && neutral > neg) {
                sentimentLabel = "Neutral";
            } else {
                sentimentLabel = "Negative";
            }

            //Output sentiment label and its data
            console.log(`Sentiment label: ${sentimentLabel}`);
            console.log("Sentiment Data: ", sentiment.probability);

            // Save data in new table
            await saveSentimentData(crypto, time, sentimentLabel, sentiment, text);
        }
    }

    const response = {
        statusCode: 200,
        body: JSON.stringify('Hello from Lambda!'),
    };
    return response;
};

// Calls text-processing web service and returns sentiment.
async function tpSentiment(text) {
    // URL of web service
    let url = `http://text-processing.com/api/sentiment/`;

    // Sent POST request to endpoint with Axios
    let response = await axios.post(url, {
        text: text
    }, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    // Return sentiment
    return response.data;
}

// Saves sentiment data into DynamoDB table
async function saveSentimentData(crypto, time, sentimentLabel, sentiment, text) {
    // Define parameters for DynamoDB putItem operation
    const params = {
        TableName: 'SentimentData',
        Item: {
            'Crypto': { S: crypto },
            'CryptoTimeStamp': { N: time },
            'Sentiment': { S: sentimentLabel }, 
            'Data': { S: JSON.stringify(sentiment.probability) }, 
            'Title': { S: text } 
        }
    };

    try {
        // Call DynamoDB to add the item to the table
        await dynamodb.putItem(params).promise();
        console.log(`Successfully saved sentiment data for Crypto: ${crypto}, Time: ${time}`);
    } catch (err) {
        console.error('Unable to save sentiment data:', err);
        throw err; 
    }
}
