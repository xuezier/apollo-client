export interface IApolloLongPollingResponseData {
    namespaceName: string;
    notificationId: number;
    messages: {
        details: {
            [x: string]: number;
        }
    };
}
