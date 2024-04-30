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
Object.defineProperty(exports, "__esModule", { value: true });
//Use Node module for accessing newsapi
const NewsAPI = require('newsapi');
//Module that reads keys from .env file
const dotenv = __importStar(require("dotenv"));
// Import AWS modules
const client_dynamodb_1 = require("@aws-sdk/client-dynamodb");
const lib_dynamodb_1 = require("@aws-sdk/lib-dynamodb");
//Copy variables in file into environment variables
dotenv.config();
// Create new DocumentClient
const client = new client_dynamodb_1.DynamoDBClient({});
const documentClient = lib_dynamodb_1.DynamoDBDocumentClient.from(client);
//Pulls and logs data from API
function getNews() {
    return __awaiter(this, void 0, void 0, function* () {
        //Create new NewsAPI instance
        const newsapi = new NewsAPI(process.env.NEWS_API_KEY);
        //Array of crypto currencies and its symbols
        const cryptos = [
            { name: 'Bitcoin', symbol: 'BTC' },
            { name: 'Litecoin', symbol: 'LTC' },
            { name: 'Binancecoin', symbol: 'BNB' },
            { name: 'Dogecoin', symbol: 'DOGE' },
            { name: 'Ripple', symbol: 'XRP' }
        ];
        //Download news-data 10 articles for each crypto 
        for (let crypto of cryptos) {
            const result = yield newsapi.v2.everything({
                q: crypto.name,
                pageSize: 10,
                language: 'en'
            });
            //Output article titles and dates 
            console.log(`Number of articles for ${crypto} : ${result.articles.length}`);
            for (let article of result.articles) {
                const date = new Date(article.publishedAt);
                console.log(`Unix Time: ${date.getTime()}; Title: ${article.title}; URL: ${article.url}`);
                //Store downloaded data in DynamoDB
                const command = new lib_dynamodb_1.PutCommand({
                    TableName: "News-data",
                    Item: {
                        "Currency": crypto.symbol,
                        "Title": article.title,
                        "NewsTimeStamp": date.getTime(),
                        "URL": article.url
                    }
                });
                //Store data in DynamoDB and handle errors
                try {
                    const response = yield documentClient.send(command);
                    console.log(response);
                }
                catch (err) {
                    console.error("ERROR uploading data: " + JSON.stringify(err));
                }
            }
        }
    });
}
getNews();
