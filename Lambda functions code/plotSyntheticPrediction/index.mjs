//Importing AWS, axios and plotly
import AWS from 'aws-sdk';
import axios from 'axios';
import Plotly from 'plotly';

//My student id
let studentID = 'M00837788';

// URL where student data is available
let url = 'https://y2gtfx0jg3.execute-api.us-east-1.amazonaws.com/prod/';

// Authentication details for Plotly
const PLOTLY_USERNAME = 'samlimbu';
const PLOTLY_KEY = 'Hg0AjaWr6W0yJ9MrHgfv';

// Initialize Plotly with user details.
let plotly = Plotly(PLOTLY_USERNAME, PLOTLY_KEY);

const sagemakerRuntime = new AWS.SageMakerRuntime();

// Plots the specified data
async function plotData(studentID, xValues, predictionXValues, yValuesOriginal, yValuesMean, yValuesQuantile1, yValuesQuantile9) {
    // Data structures
    let originalData = {
        x: xValues,
        y: yValuesOriginal,
        type: "scatter",
        mode: 'line',
        name: 'Original Data',
        marker: {
            color: 'rgb(219, 64, 82)',
            size: 12
        }
    };

    let meanData = {
        x: predictionXValues,
        y: yValuesMean,
        type: "scatter",
        mode: 'lines',
        name: 'Mean',
        line: {
            color: 'rgb(23, 190, 207)',
            width: 2
        }
    };

    let quantileData1 = {
        x: predictionXValues,
        y: yValuesQuantile1,
        type: "scatter",
        mode: 'lines',
        name: '0.1 Quantile Prediction',
        line: {
            color: 'rgb(255, 127, 14)',
            width: 2
        }
    };

    let quantileData9 = {
        x: predictionXValues,
        y: yValuesQuantile9,
        type: "scatter",
        mode: 'lines',
        name: '0.9 Quantile Prediction',
        line: {
            color: 'rgb(44, 160, 44)',
            width: 2
        }
    };

    let data = [originalData, meanData, quantileData9, quantileData1];

    // Layout of graph
    let layout = {
        title: "Synthetic Data for Student " + studentID,
        font: {
            size: 25
        },
        xaxis: {
            title: 'Time (hours)'
        },
        yaxis: {
            title: 'Value'
        }
    };

    let graphOptions = {
        layout: layout,
        filename: "date-axes",
        fileopt: "overwrite"
    };

    // Wrap Plotly callback in a promise
    return new Promise((resolve, reject) => {
        plotly.plot(data, graphOptions, function (err, msg) {
            if (err)
                reject(err);
            else {
                resolve(msg);
            }
        });
    });
}

// Handler function
async function handler(event) {
    try {
        // Get synthetic data
        let yValuesOriginal = (await axios.get(url + studentID)).data.target;

        // Send last 100 synthetic data points to endpoint
        const endpointData = {
            "instances": [
                {"start": "2024-04-07 23:00:00", "target": [112.40896932273421,106.87176491264717,113.17121793109577,115.51089593983576,111.25380716132598,112.1433949774067,110.05027553876579,120.19229117258618,116.297795940333,117.81064825074738,128.22292615161845,119.481011979073,131.42834307878616,131.67780570768352,127.27608735403076,127.06048976870221,126.14630591320169,121.51678722554209,128.43477439064827,129.65088355866902,126.63820654582935,119.10352029305629,113.89471365381876,117.97547683304198,116.95236895993902,109.85224374417628,120.43369589460396,113.9920378103935,113.16626812723854,115.45025549394092,117.51889016502417,125.17477957546474,124.29344629592806,122.3790763108493,123.1271926086417,127.67184573307557,130.61520352385503,129.64816218167354,133.44321859640525,136.1269434732796,136.52493225651673,126.89410268070267,126.29136822437863,122.01768150472935,126.37571036916752,127.22934357475629,119.58356607622241,127.01397236028433,126.05374205616397,120.90654055082128,115.72076899561404,122.45403078782292,120.65665022156814,128.68470644566074,122.55212667832181,128.205350540346,126.70749280646496,129.01672628688152,132.79733187166195,133.12260272925496,141.4654364994986,142.1521281792007,134.74813830276375,133.35761171382032,133.87169340353725,141.99121909578002,133.77728178847073,134.0841019059558,126.36200773603582,124.42983517556131,133.74166777172664,132.31129287522012,127.09211991003812,120.24517897732252,128.239675020533,129.02545990840053,122.2246102982741,129.52966688391305,127.27326322846942,132.6682938456975,133.07928312366658,141.5412309227441,135.08792949925365,142.26403475174496,148.04310911130895,143.1835218849421,139.95002438289444,148.5279330686942,137.07021226298502,142.14556130107275,139.85931766601107,136.65920648335026,129.45907448089258,129.3317291037689,128.85500035922595,130.32699024765,127.90720502035589,130.91687295113152,123.64937573236227,130.93969975072218]}
            ],
            "configuration": {
                "num_samples": 50,
                "output_types": ["mean", "quantiles"],
                "quantiles": ["0.1", "0.9"]
            }
        };

        //Invoking the AWS sagemaker endpoint, cryptoEndpoint
        const params = {
            Body: JSON.stringify(endpointData),
            EndpointName: 'cryptoEndpoint', 
            ContentType: 'application/json',
            Accept: 'application/json'
        };

        const data = await sagemakerRuntime.invokeEndpoint(params).promise();
        let predictedData = JSON.parse(data.Body.toString());
        
        
        //Extracts the values of mean, quantile 0.1 and quantile 0.9 data from the AWS sagemaker response.
        let predictedDataMean = predictedData.predictions[0].mean;
        let predictedDataQuantile10 = predictedData.predictions[0].quantiles["0.1"];
        let predictedDataQuantile90 = predictedData.predictions[0].quantiles["0.9"];
        
        console.log("Mean Data: ", predictedDataMean + "\nQuantile 0.1: ", predictedDataQuantile10 + "\nQuantile 0.9: ", predictedDataQuantile90 );

        // Add basic X values for plot
        let xValues = [];
        for (let i = 0; i < yValuesOriginal.length; ++i) {
            xValues.push(i);
        }

         // Configure the x-values for the predictions to start after the original data
         let predictionStartIndex = yValuesOriginal.length;
         let predictionXValues = [];
         for (let i = predictionStartIndex; i < predictionStartIndex + predictedDataMean.length; ++i) {
             predictionXValues.push(i);
         }

        // Plot original, mean, quantiles (0.1 and 0.9) data
        let plotResult = await plotData(studentID, xValues, predictionXValues, yValuesOriginal, predictedDataMean, predictedDataQuantile10, predictedDataQuantile90);

        console.log("Plot for student" + studentID + " available at: " + plotResult.url);

        return {
            statusCode: 200,
            body: "Ok"
        };
    } catch (err) {
        console.log("ERROR: " + JSON.stringify(err));
        return {
            statusCode: 500,
            body: "Error plotting data for student ID: " + studentID
        };
    }
}
// Export the handler function
export { handler };


