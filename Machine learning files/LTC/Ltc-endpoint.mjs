//Import AWS
import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime"; 

//Create SageMakerRuntimeClient
const client = new SageMakerRuntimeClient({});

const endpointData = {
    "instances":
      [
        {"start":"2023-12-22 00:00:00","target":[58.28271800,57.38764500,56.33415200,57.20546200,58.01340400,60.18375800,60.60357100,58.02132500,57.99756200,57.68864300,59.18571200,57.79953700,51.67660400,52.60336100,52.27860000,51.99344400,50.90826700,53.64893300,53.06277900,55.52621000,56.93614800,57.79953700,57.01535800,55.27273800,54.75787300,55.00342400,55.01926600,53.94993100,56.46880900,56.52425600,56.83317500,53.35585600,51.88255000,52.38157300,51.88255000,53.11030500,53.91032600,54.14003500,54.20340300,53.44298700,52.88059600,53.49843400,53.90240500,54.50440100,53.02317400,53.62517000,54.09250900,54.35390200,55.86681300,55.95394400,56.08068000,56.67475500,57.68072200,54.63113700,55.29650100,55.25689600,55.91433900,55.42323700,56.08068000,56.47673000,55.16976500,54.57569000,54.49648000,54.49648000,55.77176100,55.57373600,56.97575300,58.59163700,58.99560800,63.30463200,67.22552700,74.84552900,71.84347000,70.45729500,64.89675300,68.01762700,69.70480000,69.95827200,71.81970700,69.25330300,82.26750600,77.24559200,77.02380400,74.52076800,71.09097500,66.63145200,68.06515300,68.73051700,62.14024500,67.05126500,67.92257500,66.06114000,67.53444600,71.01176500,71.74841800,75.85941700,74.10095500,74.54453100,86.38642600,82.46553100]}
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
        EndpointName: "ltcEndpoint",
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