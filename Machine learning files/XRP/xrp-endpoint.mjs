//Import AWS
import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime"; 

//Create SageMakerRuntimeClient
const client = new SageMakerRuntimeClient({});

const endpointData = {
    "instances":
      [
        {"start":"2023-12-22 00:00:00","target":[0.49458724,0.49070595,0.48484441,0.51185502,0.49260699,0.50219140,0.50266666,0.49347830,0.49165647,0.48761676,0.49854774,0.49474566,0.46123983,0.46480428,0.45601197,0.44983359,0.43684315,0.45751696,0.44904149,0.47589368,0.47676499,0.45141779,0.45521987,0.45648723,0.45601197,0.45601197,0.45030885,0.43723920,0.43114003,0.43834814,0.43280344,0.41783275,0.41054543,0.41038701,0.40698098,0.42163483,0.42005063,0.41513961,0.42393192,0.40452547,0.39866393,0.40064418,0.40436705,0.41078306,0.39858472,0.40151549,0.40001050,0.40698098,0.40769387,0.41680302,0.41498119,0.41672381,0.42100115,0.41561487,0.42599138,0.44531862,0.44698203,0.43533816,0.44127891,0.44563546,0.44531862,0.43494211,0.42852610,0.42313982,0.43169450,0.42971425,0.43613026,0.46424981,0.45545750,0.46472507,0.47628973,0.51027082,0.49672591,0.51304317,0.46828952,0.48484441,0.49664670,0.49110200,0.49086437,0.48159680,0.57268830,0.54496480,0.54583611,0.52991490,0.50234982,0.47771551,0.49038911,0.51114213,0.46298245,0.48373547,0.50726084,0.48436915,0.48848807,0.50100325,0.50741926,0.50036957,0.48460678,0.49458724,0.49910221,0.49363672]}
      ],
      "configuration":
         {
           "num_samples": 50,
            "output_types":["mean","quantiles","samples"],
            "quantiles":["0.1","0.9"]
         }
  }

//Calls endpoint and logs results
async function invokeEndpoint () {
    //Create and send command with data
    const command = new InvokeEndpointCommand({
        EndpointName: "xrpEndpoint",
        Body: JSON.stringify(endpointData),
        ContentType: "application/json",
        Accept: "application/json"
    });
    const response = await client.send(command);

    //Must install @types/node for this to work
    let predictions = JSON.parse(Buffer.from(response.Body).toString('utf8'));
    console.log(predictions);
    console.log(JSON.stringify(predictions));
}

invokeEndpoint();