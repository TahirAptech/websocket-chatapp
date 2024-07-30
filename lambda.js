// const AWS = require('aws-sdk')

// const api = new AWS.ApiGatewayManagementApi({
//     endpoint: 'zewb3pssyh.execute-api.eu-central-1.amazonaws.com/production/'
// })

// const options = ['Yes', 'No', 'Maybe', 'Probably', 'Probably Not']
// let connections = [];

// exports.handler = async (event) => {
//     console.log(event)

//     const route = event.requestContext.routeKey
//     const connectionId = event.requestContext.connectionId

//     switch (route) {
//         case '$connect':
//             connections.push(connectionId)
//             console.log('Connection occurred')
//             break
//         case '$disconnect':
//             connections = connections.filter(conn => conn !== connectionId)
//             console.log('Disconnection occurred')
//             break
//         case 'message':
//             let msg = JSON.parse(event.body)
//             console.log('Received message:', msg)
//             let otherUser = connections.filter(conn => conn !== connectionId);
//             if (otherUser)
//                 await replyToMessage(msg.msg, otherUser)
//             break
//         default:
//             console.log('Received unknown route:', route)
//     }

//     return {
//         statusCode: 200
//     }
// }

// async function replyToMessage(response, connectionId) {
//     const data = { message: response }
//     const params = {
//         ConnectionId: connectionId,
//         Data: Buffer.from(JSON.stringify(data))
//     }

//     return api.postToConnection(params).promise()
// }








const AWS = require('aws-sdk');

const api = new AWS.ApiGatewayManagementApi({
    endpoint: 'zewb3pssyh.execute-api.eu-central-1.amazonaws.com/production/'
});

// const options = ['Yes', 'No', 'Maybe', 'Probably', 'Probably Not'];
let connections = [];

exports.handler = async (event) => {
    console.log(event);

    const route = event.requestContext.routeKey;
    const connectionId = event.requestContext.connectionId;
    switch (route) {
        case '$connect':
            console.log('Connection occurred');
            connections.push(connectionId);
            break;
        case '$disconnect':
            console.log('Disconnection occurred');
            connections = connections.filter(conn => conn !== connectionId);
            break;
        case 'message':
            let bodyData = JSON.parse(event.body);
            await broadcastMessage(bodyData, connectionId);
            break;
        default:
            console.log('Received unknown route:', route);
    }

    return {
        statusCode: 200
    };
};

async function broadcastMessage(bodyData, senderConnectionId) {
    const postCalls = connections.map(async (connectionId) => {
        if (connectionId !== senderConnectionId) {
            try {
                const params = {
                    ConnectionId: connectionId,
                    Data: Buffer.from(JSON.stringify(bodyData))
                };
                await api.postToConnection(params).promise();
            } catch (err) {
                console.error(`Failed to send message to connection ${connectionId}:`, err);
                if (err.statusCode === 410) {
                    connections = connections.filter(conn => conn !== connectionId);
                }
            }
        }
    });

    await Promise.all(postCalls);
}
