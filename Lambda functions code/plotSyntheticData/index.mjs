// Importing axios and plotly
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

// Plots the specified data
async function plotData(studentID, xValues, yValues) {
    // Data structure
    let studentData = {
        x: xValues,
        y: yValues,
        type: "scatter",
        mode: 'line',
        name: studentID,
        marker: {
            color: 'rgb(219, 64, 82)',
            size: 12
        }
    };
    let data = [studentData];

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
        let yValues = (await axios.get(url + studentID)).data.target;

        // Add basic X values for plot
        let xValues = [];
        for (let i = 0; i < yValues.length; ++i) {
            xValues.push(i);
        }

        // Call function to plot data
        let plotResult = await plotData(studentID, xValues, yValues);
        console.log("Plot for student '" + studentID + "' available at: " + plotResult.url);

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
