# scheduled-tasks app
application can schedule tasks for some time or with some delay

Application has two endpoints:

## POST /tasks/echoAtTime
Example of request:
```json
{
	"message":"task message",
	"echoAtTime": "2019-03-04 09:54:00.032+02"
}
```

`We should understand  - if we specify echoAtTime without time zone (+02) UTC time zone (+00) will be used by default`

## POST /tasks/echoAfterDelay
Example of request:
```json
{
	"message":"task message",
	"scheduledTimeDelay": 2
}
```

For running application in DEVELOPMENT TRACE mode use command below:

```bash
 npm run dev
 ```
 In this case will be used `develompent.json` configuration file or environment variables.
 You can find example of configuration file in [development.example.json](./config/development.example.json)
 
 For running application in production mode use next command:
 ```bash
npm start
```
 In this case will be used `production.json` configuration file or environment variables.

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


##How to run application using Docker compose

[Compose](https://docs.docker.com/compose/overview/) is a tool for defining and running multi-container Docker applications. 
With Compose, you use a YAML file to configure your application’s services. 
Then, with a single command, you create and start all the services from your configuration. 

By default application works with next [docker compose configuration](./docker-compose.yml): 
```yaml
version: '3.7'
services:
  redis:
    image: redis
    command: redis-server /usr/local/etc/redis/redis.conf
    volumes:
      - ./redis/redis.conf:/usr/local/etc/redis/redis.conf
      - ./redis/data:/data
    ports:
      - "6380:6380"
  app:
    image: shkarupanick/scheduled-tasks:scheduleAtTime
    depends_on:
      - redis
    ports:
      - "127.0.0.1:3001-3003:3000"
```

You can change `replicas` property of app container for managing number of application instances.

You can use docker-compose [run](https://docs.docker.com/compose/reference/run/) command for container starting.


Also you can easy scale application using next commands:
`docker-compose up --scale app=3`

##### Limitations:
You can use only one redis instance (scale redis=1). Redis cluster is not configured yet.

