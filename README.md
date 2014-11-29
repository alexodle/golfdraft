# README #

## Run webserver locally ##

Requires mongodb and redis instances. See server/config.js default values for setup.

```
npm install
grunt rund
```

Navigate to http://localhost:3000

## Run tests ##

```grunt test```

## Build prod files (checked in) ##

If building, keep in a separate commit in master.

```grunt build```

## Live updating of scores ##

Running the following command will update the scores from Yahoo, based on the URL in server/config.js.

```
node server/runUpdateScore.js
```

In prod, while a tournament is running, I run this command every 10 minutes using a simple cron job. The server is notified immediately via a redis message. The UI is updated immediately via socket.io update.

## Reset data locally ##

It will often be helpful to reset data locally so you can do some manual testing.

```node ./server/refreshData.js```


