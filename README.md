# scheduled-tasks
application can schedule tasks for some time or with some delay

Application has two endpoints:

## POST /tasks/echoAtTime
Example of request:
```json
{
	"message":"task message",
	"echoAtTime": "2019-03-04 09:54:00.032"
}
```

## POST /tasks/echoAfterDelay
Example of request:
```json
{
	"message":"task message",
	"scheduledTimeDelay": 2
}
```

For running application in TRACE mode use command below:

```bash
 npm run devTrace
 ```
 In this case will be used `develompent.json` configuration file.
 You can find example of configuration file in [development.example.json](./config/development.example.json)
 
 For running application in production mode use next command:
 ```bash
npm start
```
 In this case will be used `production.json` configuration file.

## Configuration properties

|Name|Description|
|----|-----------|
|PORT|Port, which will be used for express API|
|REDIS_URL|Connection string to redis DB|
|PROCESS_QUEUE_NAME|Name of KEY which will be used for message processing|
|BACKUP_QUEUE_NAME|Name of backup queue for [reliable queue](https://redis.io/commands/rpoplpush) pattern implementation|
|WAIT_QUEUE_NAME|Name of [Redis Sorted Set](https://redis.io/topics/data-types-intro), which will be used for postponed messages implementation|
|PROCESS_QUEUE_POLLING_FREQUENCY_MS| Polling frequency for process key|
|PROCESS_BRPOPLPUSH_TIMEOUT_S| [BRPOPLPUSH](https://redis.io/commands/rpoplpush) timeout value|
|WAITING_QUEUE_POLLING_FREQUENCY_MS| Polling period for waiting sorted set|
|WAIT_QUEUE_BATCH_SIZE| Batch size (Number of records, which can be processed by one poll)|

