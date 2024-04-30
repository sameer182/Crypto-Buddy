"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
// Axios will handle HTTP requests to web service
const axios_1 = __importDefault(require("axios"));
// Module that reads keys from .env file
const dotenv = __importStar(require("dotenv"));
// Import AWS modules
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
// Create new DocumentClient
const client = new client_dynamodb_1.DynamoDBClient({});
const documentClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
// Copy variables in file into environment variables
dotenv.config();
// Displays data from web service and uploads it to DynamoDB
function processData(data, fromCurr, toCurr) {
    return __awaiter(this, void 0, void 0, function* () {
        let itemCount = 0;
        //Returns the latest 500 data points
        const dates = Object.keys(data['Time Series (Digital Currency Daily)']).slice(0, 500);
        for (let dt of dates) {
            // Convert data to unix timestamp
            const date = new Date(dt);
            // Extract the high, low, rate, market cap data
            const high = data['Time Series (Digital Currency Daily)'][dt]['2a. high (GBP)'];
            const low = data['Time Series (Digital Currency Daily)'][dt]['3a. low (GBP)'];
            const rate = data['Time Series (Digital Currency Daily)'][dt]['4a. close (GBP)'];
            const marketCap = data['Time Series (Digital Currency Daily)'][dt]['6. market cap (USD)'];
            //Log downloaded data
            console.log(`TimeStamp: ${date.getTime()}. ${fromCurr} to ${toCurr} = ${rate}, High: ${high}, Low: ${low}, Market Cap: ${marketCap}`);
            ++itemCount;
            // Prepare data for DynamoDB upload
            const item = {
                CurrencyTimeStamp: date.getTime(),
                Currency: fromCurr,
                Currency2: toCurr,
                Price: rate,
                Highest: high,
                Lowest: low,
                MarketCap: marketCap
            };
            // Upload data to DynamoDB
            yield putData(item);
        }
        console.log(`Number of data items: ${itemCount}`);
    });
}
// Downloads data from AlphaVantage
function downloadData() {
    return __awaiter(this, void 0, void 0, function* () {
        // Currency symbol
        const currencies = ["BTC", "BNB", "LTC", "DOGE", "XRP"];
        const toCurrency = "GBP";
        // Base url
        let baseUrl = "https://www.alphavantage.co/query?function=DIGITAL_CURRENCY_DAILY";
        // Add API key
        baseUrl += "&apikey=" + process.env.ALPHAVANTAGE_API_KEY;
        // Request full data points
        baseUrl += "&outputsize=full";
        //Iterate over each currency
        for (let fromCurrency of currencies) {
            // Add currency symbols
            let url = baseUrl += "&symbol=" + fromCurrency + "&market=" + toCurrency;
            // Send GET to endpoint with Axios
            try {
                const { data } = yield axios_1.default.get(url);
                console.log(data); // Add this line to see the raw response
                // Output the data and upload to DynamoDB
                yield processData(data, fromCurrency, toCurrency);
            }
            catch (error) {
                console.error("Error downloading data:", error);
            }
        }
    });
}
// Store downloaded data in DynamoDB
function putData(item) {
    return __awaiter(this, void 0, void 0, function* () {
        // Prepare data for DynamoDB upload
        const command = new lib_dynamodb_1.PutCommand({
            TableName: "Crypto",
            Item: item,
        });
        // Store data in DynamoDB and handle errors
        try {
            const response = yield documentClient.send(command);
            console.log("Data uploaded successfully:", response);
        }
        catch (err) {
            console.error("ERROR uploading data:", err);
        }
    });
}
// Call function to download and upload data
downloadData();
