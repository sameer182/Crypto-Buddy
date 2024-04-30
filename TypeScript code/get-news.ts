//Use Node module for accessing newsapi
const NewsAPI = require('newsapi');

//Module that reads keys from .env file
import * as dotenv from 'dotenv';

// Import AWS modules
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { PutCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";

//Copy variables in file into environment variables
dotenv.config();

//Define structure of article returned from NewsAPI
interface Article {
    title: string,
    publishedAt: string,
    url: string
}

//Define structure of data returned from NewsAPI
interface NewsAPIResult {
    articles: Array<Article>
}

// Create new DocumentClient
const client = new DynamoDBClient({});
const documentClient = DynamoDBDocumentClient.from(client);

//Pulls and logs data from API
async function getNews(): Promise<void> {
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
        const result: NewsAPIResult = await newsapi.v2.everything({
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
        const command = new PutCommand({
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
                const response = await documentClient.send(command);
                console.log(response);
            } catch (err) {
                console.error("ERROR uploading data: " + JSON.stringify(err));
            }
        }
    }
}

getNews();
