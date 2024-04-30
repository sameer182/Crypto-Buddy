export const handler = async(event) => {
    console.log("EVENT:" + JSON.stringify(event));

    //Build and return response with error message
    const response = {
        statusCode: 500,
        body: JSON.stringify('ERROR. Message not recognized.'),
    };
    return response;
};
