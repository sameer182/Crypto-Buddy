//Import library and scan command
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommand, QueryCommand, DeleteCommand } from "@aws-sdk/lib-dynamodb";

//Create client
const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

//Returns all of the connection IDs
export async function getConnectionIds() {
    const scanCommand = new ScanCommand({
        TableName: "WebSocketClients"
    });
    
    const response  = await docClient.send(scanCommand);
    return response.Items;
};


//Deletes the specified connection ID
export async function deleteConnectionId(connectionId){
    console.log("Deleting connection Id: " + connectionId);

    const deleteCommand = new DeleteCommand ({
        TableName: "WebSocketClients",
        Key: {
            ConnectionId: connectionId
        }
    });
    return docClient.send(deleteCommand);
};

//Return object will all the final data
export async function getData() {
    const coins = ["BTC","BNB", "DOGE", "LTC", "XRP"];
    //Return news-data
    const newsData = await getNewsData();
    //Return sentiment analysis data
    const sentimentCounts = await getSentimentAnalaysis();
    
    const finalData = {};
    
    for (let coin of coins) {
        finalData[coin] = await getCoinData(coin);
    }
    
    // Add sentiment data to final data
    finalData['sentiment'] = sentimentCounts;
    // Add news data to final data
    finalData['news'] = newsData; 
    //Add prediction data to final data
    finalData['prediciton'] = await getPredictionData(); 
    console.log(JSON.stringify(finalData));
    return finalData;
    
}

//Get the data of cryptocurrencies
async function getCoinData(coin) {
    console.log("Geting data for " + coin);
    try {
        const queryCommand = new QueryCommand({
            TableName: "Crypto",
            Limit: 100,
            ScanIndexForward: false,
            KeyConditionExpression: "Currency = :curr",
            ExpressionAttributeValues: {
                ":curr": coin
            }
        });
        let result = await docClient.send(queryCommand);
        // console.log(JSON.stringify(result.Items));
        
        //Build data structure
        const coinData = {actual: {times: [], values: [], marketCap: []}};
        // coinData.actual.times = result.Items.map( item => item.CurrencyTimeStamp);
        
        //Get the timestamp and Convert Unix timestamps to yyyy-mm-dd format
          coinData.actual.times = result.Items.map(item => {
          const timestamp = new Date(item.CurrencyTimeStamp); 
          return timestamp.toISOString().split('T')[0]; 
});
        //Get the price
        coinData.actual.values = result.Items.map( item => item.Price);
        //Get the MarketCap and returns only first two decimals
        coinData.actual.marketCap = result.Items.map( item => Number(item.MarketCap).toFixed(2));
        return coinData;
       
    }
    catch (er) {
        console.log("error: " + JSON.stringify(er));
    }
}

//Get news data of all cryptocurrencies
async function getNewsData() {
    try {
        const coins = ["BTC", "LTC", "BNB", "XRP", "DOGE"];
        const latestNews = {};

        for (let coin of coins) {
            const queryCommand = new QueryCommand({
                TableName: "News-data",
                Limit: 5,
                KeyConditionExpression: "Currency = :curr",
                ExpressionAttributeValues: {
                    ":curr": coin
                },
                ScanIndexForward: false 
            });
            const result = await docClient.send(queryCommand);
            // Extracting titles and URL from the latest news items
            const newsData = result.Items.map(item => ({ title: item.Title, url: item.URL }));
            latestNews[coin] = newsData;
        }

        return latestNews;
    } catch (error) {
        console.error("Error fetching news data:", error);
        return {};
    }
}

// Get the prediction data for all cryptocurrencies
async function getPredictionData() {
    try {
        const coins = ["BTC", "LTC", "BNB", "DOGE", "XRP"]; 
        const predictionData = {};

        for (let coin of coins) {
            const queryCommand = new QueryCommand({
                TableName: "PredictionData",
                KeyConditionExpression: "Currency = :currency",
                ExpressionAttributeValues: {
                    ":currency": coin // Specify the currency name
                }
            });
            const result = await docClient.send(queryCommand);
            // Directly map the URL from the prediction data
            predictionData[coin] = result.Items[0].url;
        }

        return predictionData;
    } catch (error) {
        console.error("Error fetching prediction data:", error);
        return {};
    }
}

//Get the sentiment analaysis data 
async function getSentimentAnalaysis() {

try {
    const coins = ["BTC", "LTC", "BNB", "DOGE", "XRP"]; 
    const sentimentData = {};
    
    for (let coin of coins) {
        const queryCommand = new QueryCommand({
            TableName: 'SentimentData',
            KeyConditionExpression: 'Crypto = :crypto',
            ExpressionAttributeValues: {
                ':crypto': coin 
            }
        });

        const result = await docClient.send(queryCommand);

        // Process the result to get sentiment data
        let sentimentCounts = {
            'Positive': 0,
            'Neutral': 0,
            'Negative': 0
        };

        result.Items.forEach(item => {
            // Accessing sentiment directly
            const sentiment = item.Sentiment; 
            if (sentiment === 'Positive') {
                sentimentCounts.Positive++;
            } else if (sentiment === 'Neutral') {
                sentimentCounts.Neutral++;
            } else if (sentiment === 'Negative') {
                sentimentCounts.Negative++;
            }
        });
        // Store sentiment data for the current coin
        sentimentData[coin] = sentimentCounts; 
    }
        return sentimentData;
} catch (error) {
    console.error("Error fetching sentiment data:", error);
}
}