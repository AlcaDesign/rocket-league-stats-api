import Connection, { ConnectionError } from './Connection';
import type { Commands, Events } from './types';

export class ClientError extends Error {}

export interface ClientOptions {
	/**
	 * Hostname to connect to the Rocket League client.
	 * @default '127.0.0.1'
	 */
	host: string;
	/**
	 * Port to connect to the Rocket League client.
	 * @default 49124
	 */
	port: number;
	/**
	 * Whether to use the wss: (true) or ws: (false) protocol.
	 * @default false
	 */
	secure: boolean;
}

/**
 * @see https://www.rocketleague.com/developer/stats-api
 */
export default class Client {
	/**
	 * Client options to use when connecting, etc. Recommended to configure with the constructor initially.
	 */
	options: ClientOptions;
	socket?: Connection;
	protected reconnectAttempts = 0;
	protected reconnectTimeout: Parameters<typeof clearTimeout>[0] = undefined;
	protected wasCloseCalled = false;
	/**
	 * A lifecycle event for when the socket is successfully connected.
	 */
	onSocketConnected?: () => void;
	/**
	 * A lifecycle event for when the socket is closed.
	 */
	onSocketClosed?: (event: { wasCloseCalled: boolean; }) => void;
	/** Emitted for any internal errors. */
	onError?: (err: Error) => void;
	/** All events received on the socket except for UpdateState (tick event). */
	onEvent?: (event: Events.AllEventNames, data: object) => void;
	/**
	 * Sent X amount of times per second based on the player's PacketSendRate preference.
	 * @see https://www.rocketleague.com/developer/stats-api#UpdateState
	 */
	onUpdateState?: (data: Events.Event_UpdateState) => void;
	/**
	 * Sent one frame after the ball is hit.
	 * @see https://www.rocketleague.com/developer/stats-api#BallHit
	 */
	onBallHit?: (data: Events.Event_BallHit) => void;
	/**
	 * Sent when a vehicle collects a boost pad or pill.
	 * @SPECTATOR
	 * @see https://www.rocketleague.com/developer/stats-api#BoostPickup
	 */
	onBoostPickup?: (data: Events.Event_BoostPickup) => void;
	/**
	 * Sent when the in-game clock has changed.
	 * @SPECTATOR
	 * @see https://www.rocketleague.com/developer/stats-api#ClockUpdatedSeconds
	 */
	onClockUpdatedSeconds?: (data: Events.Event_ClockUpdatedSeconds) => void;
	/**
	 * Sent at the start of each round when the countdown starts.
	 * @see https://www.rocketleague.com/developer/stats-api#CountdownBegin
	 */
	onCountdownBegin?: (data: Events.Event_CountdownBegin) => void;
	/**
	 * Sent when the ball hits a crossbar.
	 * @see https://www.rocketleague.com/developer/stats-api#CrossbarHit
	 */
	onCrossbarHit?: (data: Events.Event_CrossbarHit) => void;
	/**
	 * Sent when a goal replay starts.
	 * @see https://www.rocketleague.com/developer/stats-api#GoalReplayStart
	 */
	onGoalReplayStart?: (data: Events.Event_GoalReplayStart) => void;
	/**
	 * Sent when a goal replay ends.
	 * @see https://www.rocketleague.com/developer/stats-api#GoalReplayWillEnd
	 */
	onGoalReplayWillEnd?: (data: Events.Event_GoalReplayWillEnd) => void;
	/**
	 * Sent when the ball explodes during a goal replay. If the replay is skipped this event will not fire.
	 * @see https://www.rocketleague.com/developer/stats-api#GoalReplayEnd
	 */
	onGoalReplayEnd?: (data: Events.Event_GoalReplayEnd) => void;
	/**
	 * Sent when a goal is scored.
	 * @see https://www.rocketleague.com/developer/stats-api#GoalScored
	 */
	onGoalScored?: (data: Events.Event_GoalScored) => void;
	/**
	 * Sent when all teams are created and replicated.
	 * @see https://www.rocketleague.com/developer/stats-api#MatchCreated
	 */
	onMatchCreated?: (data: Events.Event_MatchCreated) => void;
	/**
	 * Sent when the first countdown starts.
	 * @see https://www.rocketleague.com/developer/stats-api#MatchInitialized
	 */
	onMatchInitialized?: (data: Events.Event_MatchInitialized) => void;
	/**
	 * Sent when the game is paused by a match admin.
	 * @see https://www.rocketleague.com/developer/stats-api#MatchPaused
	 */
	onMatchPaused?: (data: Events.Event_MatchPaused) => void;
	/**
	 * Sent when the game is unpaused by a match admin.
	 * @see https://www.rocketleague.com/developer/stats-api#MatchUnpaused
	 */
	onMatchUnpaused?: (data: Events.Event_MatchUnpaused) => void;
	/**
	 * Sent when the match ends and a winner is chosen.
	 * @see https://www.rocketleague.com/developer/stats-api#MatchUnpaused
	 */
	onMatchEnded?: (data: Events.Event_MatchEnded) => void;
	/**
	 * Sent when leaving the game.
	 * @see https://www.rocketleague.com/developer/stats-api#MatchDestroyed
	 */
	onMatchDestroyed?: (data: Events.Event_MatchDestroyed) => void;
	/**
	 * Sent when a player is added to the current match.
	 * @see https://www.rocketleague.com/developer/stats-api#PlayerJoined
	 */
	onPlayerJoined?: (data: Events.Event_PlayerJoined) => void;
	/**
	 * Sent when a player is removed from the current match.
	 * @see https://www.rocketleague.com/developer/stats-api#PlayerLeft
	 */
	onPlayerLeft?: (data: Events.Event_PlayerLeft) => void;
	/**
	 * Sent when the game enters the podium state after the match ends.
	 * @see https://www.rocketleague.com/developer/stats-api#PodiumStart
	 */
	onPodiumStart?: (data: Events.Event_PodiumStart) => void;
	/**
	 * Sent when a replay is initialized. Does not pertain to goal replays,
	 * only replays you load via the Match History menu.
	 * @see https://www.rocketleague.com/developer/stats-api#ReplayCreated
	 */
	onReplayCreated?: (data: Events.Event_ReplayCreated) => void;
	/**
	 * Sent when the game enters the active state (after the countdown finishes).
	 * @see https://www.rocketleague.com/developer/stats-api#RoundStarted
	 */
	onRoundStarted?: (data: Events.Event_RoundStarted) => void;
	/**
	 * Sent when someone earns a stat.
	 * @see https://www.rocketleague.com/developer/stats-api#StatfeedEvent
	 */
	onStatfeedEvent?: (data: Events.Event_StatfeedEvent) => void;

	constructor(opts: Partial<ClientOptions> = {}) {
		this.options = {
			host: opts.host ?? '127.0.0.1',
			port: opts.port ?? 49124,
			secure: opts.secure ?? false,
		};
	}
	protected handleOpen() {
		this.reconnectAttempts = 0;
		clearTimeout(this.reconnectTimeout);
		this.onSocketConnected?.();
	}
	protected handleClose() {
		this.socket?.removeListeners();
		this.socket = undefined;
		this.onSocketClosed?.({ wasCloseCalled: this.wasCloseCalled });
		if(this.wasCloseCalled) {
			return;
		}
		this.reconnectAttempts++;
		const jitter = Math.random() * 0.8 + 0.2;
		const minDelay = 0x80;
		const maxDelay = 0x2000;
		const t = Math.min(2 ** this.reconnectAttempts, maxDelay) / maxDelay;
		const range = maxDelay - minDelay;
		const delay = Math.floor(minDelay + jitter * t * range);
		this.reconnectTimeout = setTimeout(() => this.connect(), delay);
	}
	protected handleError(error: Error): void;
	protected handleError(message: string, errorOptions?: ErrorOptions): void;
	protected handleError(msg: Error | string, errorOptions?: ErrorOptions) {
		let err: ClientError;
		if(typeof msg === 'string') {
			err = new ClientError(msg, errorOptions);
		}
		else if(msg instanceof Error) {
			if(msg instanceof ConnectionError) {
				err = new ClientError(`Connection error: ${msg.message}`, { cause: msg });
			}
			else if(msg instanceof ClientError === false) {
				err = new ClientError(`Unhandled error: [${msg.name}] ${msg.message}`, { cause: msg });
			}
			else {
				err = msg;
			}
		}
		else {
			throw new TypeError('Error is not a string or Error instance', { cause: msg });
		}
		if(!this.onError) {
			throw err;
		}
		this.onError(err);
	}
	protected handleMessage(event: Events.AllEventNames, dataStr: string) {
		let data: object;
		try {
			data = JSON.parse(dataStr);
		} catch(err) {
			this.handleError('Failed to parse event data', { cause: err });
			return;
		}
		if(!data || typeof data !== 'object') {
			this.handleError('Data did not parse as an object', { cause: { data } });
			return;
		}
		if(event !== 'UpdateState') {
			this.onEvent?.(event, data);
		}
		switch(event) {
			case 'UpdateState': { this.onUpdateState?.(data as any); break; }
			case 'ClockUpdatedSeconds': { this.onClockUpdatedSeconds?.(data as any); break; }

			case 'BallHit': { this.onBallHit?.(data as any); break; }

			case 'StatfeedEvent': { this.onStatfeedEvent?.(data as any); break; }

			case 'CrossbarHit': { this.onCrossbarHit?.(data as any); break; }
			case 'GoalScored': { this.onGoalScored?.(data as any); break; }

			case 'BoostPickup': { this.onBoostPickup?.(data as any); break; }

			case 'GoalReplayStart': { this.onGoalReplayStart?.(data as any); break; }
			case 'GoalReplayWillEnd': { this.onGoalReplayWillEnd?.(data as any); break; }
			case 'GoalReplayEnd': { this.onGoalReplayEnd?.(data as any); break; }

			case 'PlayerJoined': { this.onPlayerJoined?.(data as any); break; }
			case 'PlayerLeft': { this.onPlayerLeft?.(data as any); break; }

			case 'RoundStarted': { this.onRoundStarted?.(data as any); break; }
			case 'CountdownBegin': { this.onCountdownBegin?.(data as any); break; }
			case 'PodiumStart': { this.onPodiumStart?.(data as any); break; }

			case 'MatchCreated': { this.onMatchCreated?.(data as any); break; }
			case 'MatchInitialized': { this.onMatchInitialized?.(data as any); break; }
			case 'MatchPaused': { this.onMatchPaused?.(data as any); break; }
			case 'MatchUnpaused': { this.onMatchUnpaused?.(data as any); break; }
			case 'MatchEnded': { this.onMatchEnded?.(data as any); break; }
			case 'MatchDestroyed': { this.onMatchDestroyed?.(data as any); break; }

			case 'ReplayCreated': { this.onReplayCreated?.(data as any); break; }

			default: { throw new Error(`Unhandled event "${event}"`); }
		}
	}
	protected sendCommand(command: string, data: object) {
		if(!this.isConnected()) {
			throw new ClientError('Not connected');
		}
		return this.socket.send({
			Command: command,
			Data: data
		});
	}
	/**
	 * Connect to the Rocket League client. Will ignore subsequent calls to connect if already connected.
	 */
	connect() {
		if(this.socket) {
			return;
		}
		clearTimeout(this.reconnectTimeout);
		this.wasCloseCalled = false;
		this.socket = new Connection(this.options.host, this.options.port, this.options.secure);
		this.socket.onOpen = () => this.handleOpen();
		this.socket.onClose = _e => this.handleClose();
		this.socket.onError = err => this.handleError(err);
		this.socket.onMessage = (event, dataStr) => this.handleMessage(event, dataStr);
	}
	/**
	 * Close to connection to the Rocket League client. Will ignore subsequent calls to close.
	 */
	close() {
		clearTimeout(this.reconnectTimeout);
		this.wasCloseCalled = true;
		this.socket?.close();
		this.socket = undefined;
	}
	/**
	 * Tests if the client has a socket that is open.
	 */
	isConnected(): this is { socket: Connection; } {
		return this.socket?.isConnected() ?? false;
	}

	// Commands

	/**
	 * Changes the spectator/replay viewpoint. At least one of Focus or Perspective must be supplied; both may be combined.
	 * @SPECTATOR
	 * @REPLAY
	 * @param opts.focus What to look at -- the ball or a specific player.
	 * @param opts.perspective Camera mode to switch to.
	 * @see https://www.rocketleague.com/developer/stats-api#ChangePOV
	 */
	changePov(opts: Partial<{ focus: Commands.ChangePov.Focus; perspective: Commands.ChangePov.Perspective; }>) {
		return this.sendCommand('ChangePOV', {
			Focus: opts.focus,
			Perspective: opts.perspective,
		});
	}
	/**
	 * Loads and begins playback of a replay by file name or by file path.
	 * @param opts.fileName Name of the replay file to play. Takes precedence over Path when both are set.
	 * @param opts.path File path of a replay to play. Used when FileName is empty.
	 * @see https://www.rocketleague.com/developer/stats-api#LoadReplay
	 */
	loadReplay(opts: Partial<{ fileName: string; path: string; }>) {
		return this.sendCommand('LoadReplay', {
			FileName: opts.fileName,
			Path: opts.path,
		});
	}
	/**
	 * Jumps replay playback to a target frame or time.
	 * @REPLAY
	 * @param opts.frame Target frame number. Takes precedence over timeSeconds when set.
	 * @param opts.timeSeconds Target time in seconds.
	 * @see https://www.rocketleague.com/developer/stats-api#SeekReplay
	 */
	seekReplay(opts: Partial<{ frame: number; timeSeconds: number; }>) {
		return this.sendCommand('SeekReplay', {
			Frame: opts.frame,
			TimeSeconds: opts.timeSeconds,
		});
	}
	/**
	 * Sets replay playback speed.
	 * @REPLAY
	 * @param speed Playback multiplier. 1.0 = normal, 0.5 = half speed, 2.0 = double. Must be ≥ 0.
	 * @see https://www.rocketleague.com/developer/stats-api#SetGameSpeed
	 */
	setGameSpeed(speed: number) {
		return this.sendCommand('SetGameSpeed', {
			Speed: speed,
		});
	}
	/**
	 * Shows or hides the in-game HUD.
	 * @param visible true shows the HUD; false hides it.
	 * @see https://www.rocketleague.com/developer/stats-api#SetHUDVisibility
	 */
	setHudVisibility(visible: boolean) {
		return this.sendCommand('SetHUDVisibility', {
			bVisible: visible,
		});
	}
	/**
	 * Pauses or unpauses the current match or replay.
	 * @param paused true pauses; false resumes.
	 * @see https://www.rocketleague.com/developer/stats-api#SetMatchPaused
	 */
	setMatchPaused(paused: boolean) {
		return this.sendCommand('SetMatchPaused', {
			bPaused: paused,
		});
	}
}