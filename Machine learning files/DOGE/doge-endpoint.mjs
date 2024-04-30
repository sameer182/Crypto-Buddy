//Import AWS
import { SageMakerRuntimeClient, InvokeEndpointCommand } from "@aws-sdk/client-sagemaker-runtime"; 

//Create SageMakerRuntimeClient
const client = new SageMakerRuntimeClient({});

const endpointData = {
    "instances":
      [
        {"start":"2023-12-22 00:00:00","target":[0.07524158,0.07402967,0.07264349,0.07473464,0.07235834,0.07418017,0.07266725,0.07205734,0.07128900,0.07093256,0.07286528,0.07216031,0.06496012,0.06654432,0.06548291,0.06382742,0.06197390,0.06439773,0.06275808,0.06579975,0.06697998,0.06342345,0.06409673,0.06339176,0.06422347,0.06442941,0.06383534,0.06184717,0.06223530,0.06952262,0.06769287,0.06381950,0.06195014,0.06260758,0.06174420,0.06324918,0.06347889,0.06243332,0.06443734,0.06314621,0.06237787,0.06286898,0.06279769,0.06236995,0.06202935,0.06206104,0.06217193,0.06347097,0.06326503,0.06459576,0.06449278,0.06434228,0.06513438,0.06419970,0.06772455,0.06755029,0.06804931,0.06618788,0.06746316,0.07082958,0.06823942,0.06698790,0.06661561,0.06694037,0.06823942,0.06821565,0.07067908,0.07729312,0.09176479,0.09292917,0.11037121,0.11244652,0.12156359,0.14413052,0.12122298,0.12502506,0.12486664,0.13035590,0.14158788,0.13463324,0.14416220,0.13319954,0.13384114,0.14035220,0.12956380,0.11289801,0.12220519,0.11369011,0.10203040,0.12047049,0.12306858,0.12112793,0.12824099,0.13981357,0.13882345,0.14439983,0.15087129,0.17426992,0.16871730,0.16352905]}
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
        EndpointName: "dogeEndpoint",
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