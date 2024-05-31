import AWS from '../config/aws.js'
import Logbook from "../config/logger.js";

export function invokePhoneCode(mobile_number) {
    const lambda = new AWS.Lambda();
    const params = {
        FunctionName: 'arn:aws:lambda:eu-west-1:975050270717:function:sendPhoneCode',
        InvocationType: 'RequestResponse', // 'RequestResponse' for synchronous invocation
        Payload: JSON.stringify(mobile_number)
    };
    lambda.invoke(params, (err, data) => {
        if (err) {
            Logbook.error(err);
        } else {
            Logbook.info('Lambda function triggered successfully')
        }
    });
}