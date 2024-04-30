// Axios will handle HTTP requests to web service
import axios from 'axios';

// Module that reads keys from .env file
import * as dotenv from 'dotenv';

// Import AWS modules
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

// Define interface for Alpha Vantage data
interface AlphaVantageForex {
    [key: string]: {
        [key: string]: {
            [key: string]: number
        }
    }
}

// Define interface for DynamoDB item
interface DynamoDBItem {
    CurrencyTimeStamp: number;
    Currency: string;
    Currency2: string;
    Price: number;
    Highest: number;
    Lowest: number;
    MarketCap: number;
}

// Create new DocumentClient
const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);

// Copy variables in file into environment variables
dotenv.config();

// Displays data from web service and uploads it to DynamoDB
async function processData(data: AlphaVantageForex, fromCurr: string, toCurr: string): Promise<void> {
    let itemCount: number = 0;

    //Returns the latest 500 data points
    const dates = Object.keys(data['Time Series (Digital Currency Daily)']).slice(0, 500);
    for (let dt of dates) {  
        // Convert data to unix timestamp
        const date = new Date(dt);

        // Extract the high, low, rate, market cap data
        const high = data['Time Series (Digital Currency Daily)'] [dt] ['2a. high (GBP)'];
        const low = data['Time Series (Digital Currency Daily)'] [dt] ['3a. low (GBP)'];
        const rate = data['Time Series (Digital Currency Daily)'][dt]['4a. close (GBP)'];
        const marketCap = data['Time Series (Digital Currency Daily)'] [dt] ['6. market cap (USD)'];
        
       //Log downloaded data
       console.log(`TimeStamp: ${date.getTime()}. ${fromCurr} to ${toCurr} = ${rate}, High: ${high}, Low: ${low}, Market Cap: ${marketCap}`);
       ++itemCount;

        // Prepare data for DynamoDB upload
        const item: DynamoDBItem = {
            CurrencyTimeStamp: date.getTime(),
            Currency: fromCurr,
            Currency2: toCurr,
            Price: rate,
            Highest: high,
            Lowest: low,
            MarketCap: marketCap
        };

        // Upload data to DynamoDB
        await putData(item);
    }
    console.log(`Number of data items: ${itemCount}`);
}

// Downloads data from AlphaVantage
async function downloadData(): Promise<void> {
    // Currency symbol
    const currencies: string[] = ["BTC", "BNB", "LTC", "DOGE", "XRP"];
    const toCurrency: string = "GBP";

    // Base url
    let baseUrl: string = "https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY";

    // Add API key
    baseUrl += "&apikey=" + process.env.ALPHAVANTAGE_API_KEY;

    // Request full data points
    baseUrl += "&outputsize=full";
    //Iterate over each currency
    for (let fromCurrency of currencies) {
        // Add currency symbols
        let url: string = baseUrl += "&symbol=" + fromCurrency + "&market=" + toCurrency;

        // Send GET to endpoint with Axios
        try {
            const { data } = await axios.get<AlphaVantageForex>(url);
            console.log(data); // Add this line to see the raw response

            // Output the data and upload to DynamoDB
            await processData(data, fromCurrency, toCurrency);
        } catch (error) {
            console.error("Error downloading data:", error);
        }
    }
}

// Store downloaded data in DynamoDB
async function putData(item: DynamoDBItem): Promise<void> {
    // Prepare data for DynamoDB upload
    const command = new PutCommand({
        TableName: "Crypto",
        Item: item,
    });

    // Store data in DynamoDB and handle errors
    try {
        const response = await documentClient.send(command);
        console.log("Data uploaded successfully:", response);
    } catch (err) {
        console.error("ERROR uploading data:", err);
    }
}

// Call function to download and upload data
downloadData();
