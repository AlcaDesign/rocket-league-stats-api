# @alca/rocket-league-stats-api

Connect to the Rocket League's Stats API over WebSocket.

# Install

```bash
npm i @alca/rocket-league-stats-api
```

# Usage

```ts
import RocketLeagueStatsApiClient from '@alca/rocket-league-stats-api';

const client = new RocketLeagueStatsApiClient();

client.connect();

client.onSocketOpen = () => console.log('Connected!');

client.onGoalScored = data => {
	console.log(`${data.Scorer.Name} scored! ${data.Assister ? `(${data.Assister.Name} assisted)` : ''}`);
};
```

## Configuration

See the [configuration section](https://www.rocketleague.com/developer/stats-api#configuration) of the official documentation. The "WebPort" port value (`49124` by default) is what is used for the WebSocket connection. The port can be changed but will need to be passed to the client constructor or changed in the options property before connecting.

# Notes

## Duplicate StatfeedEvent for local bots and splitscreen

If you play an offline Exhibition or play with a splitscreen player, you will receive multiple events to `onStatfeedEvent`. Some care should be taken to throttle duplicate data.