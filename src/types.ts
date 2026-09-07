export namespace Commands {
	export namespace ChangePov {
		export type Focus = 'Ball' | `${number}`;
		export type Perspective = 'Fly' | 'SoftAttach' | 'HardAttach' | 'PlayerView' | 'AutoCam' | 'Camera_Director';
	}
}

export interface BaseMessage {
	Event: Events.AllEventNames;
	Data: string;
}

export interface Vector {
	X: number;
	Y: number;
	Z: number;
}

export interface Player {
	/** Display name. */
	Name: string;
	/** Platform identifier in the format Platform|Uid|Splitscreen (e.g. "Steam|123|0", "Epic|456|0"). */
	PrimaryId: string;
	/** Spectator shortcut number. */
	Shortcut: number;
	/** Team index (0 = Blue, 1 = Orange). */
	TeamNum: number;
	/** Total match score. */
	Score: number;
	/** Goals scored this match. */
	Goals: number;
	/** Shot attempts this match. */
	Shots: number;
	/** Assists earned this match. */
	Assists: number;
	/** Saves made this match. */
	Saves: number;
	/** Total ball touches. */
	Touches: number;
	/** Touches by the car body (not ball). */
	CarTouches: number;
	/** Demolitions inflicted. */
	Demos: number;
	/** Asset names of the equipped loadout for the player's current team sorted by product slot. */
	Loadout: string[];
	/**
	 * True if the player currently has a vehicle.
	 * @SPECTATOR
	 */
	bHasCar: boolean;
	/**
	 * Vehicle speed in Unreal Units/second.
	 * @SPECTATOR
	 */
	Speed: number;
	/**
	 * Boost amount 0–100.
	 * @SPECTATOR
	 */
	Boost: number;
	/**
	 * True if the player is currently boosting.
	 * @SPECTATOR
	 */
	bBoosting?: boolean;
	/**
	 * True if at least 3 wheels are touching the world.
	 * @SPECTATOR
	 */
	bOnGround?: boolean;
	/**
	 * True if the vehicle is on a wall.
	 * @SPECTATOR
	 */
	bOnWall?: boolean;
	/**
	 * True if the player is holding handbrake.
	 * @SPECTATOR
	 */
	bPowersliding?: boolean;
	/**
	 * True if the vehicle is currently destroyed.
	 * @SPECTATOR
	 */
	bDemolished?: boolean;
	/**
	 * True if the vehicle is at supersonic speed.
	 * @SPECTATOR
	 */
	bSupersonic?: boolean;
	/**
	 * Class name of the player's currently available Rumble pickup. Omitted when not playing with rumble powerups.
	 * @SPECTATOR
	 */
	PickupClass?: string;
	/**
	 * The player who demolished this player. Present only when demolished.
	 */
	Attacker?: PlayerRef;
}

export type PlayerRef = Pick<Player, 'Name' | 'Shortcut' | 'TeamNum'>;

export interface BallLastTouch {
	/** The player who made the last touch. */
	Player: PlayerRef;
	/** Speed of the ball resulting from this hit. */
	Speed: number;
}

export namespace Events {
	export type AllEventNames =
		| 'UpdateState'
		| 'BallHit'
		| 'BoostPickup'
		| 'ClockUpdatedSeconds'
		| 'CountdownBegin'
		| 'CrossbarHit'
		| 'GoalReplayStart'
		| 'GoalReplayWillEnd'
		| 'GoalReplayEnd'
		| 'GoalScored'
		| 'MatchCreated'
		| 'MatchInitialized'
		| 'MatchPaused'
		| 'MatchUnpaused'
		| 'MatchEnded'
		| 'MatchDestroyed'
		| 'PlayerJoined'
		| 'PlayerLeft'
		| 'PodiumStart'
		| 'ReplayCreated'
		| 'RoundStarted'
		| 'StatfeedEvent';

	interface EventBase {
		/** Only set for online or LAN matches. */
		MatchGuid: string;
	}

	export namespace Partials_UpdateState {
		export interface GameTeam {
			/** Team name. */
			Name: string;
			/** Team index. */
			TeamNum: number;
			/** Team goal count. */
			Score: number;
			/**
			 * Hex color code (no #) for the team’s primary color.
			 * @example "FF9F00"
			 */
			ColorPrimary: string;
			/** Hex color code for the team’s secondary color.
			 * @example "E5E5E5"
			 */
			ColorSecondary: string;
		}
		export interface GameBall {
			/** Current ball speed in Unreal Units/second. */
			Speed: number;
			/** Index of the last team to touch the ball. `255` if the ball has not been touched. */
			TeamNum: number;
		}
		/**
		 * Match metadata.
		 */
		export interface Game {
			/** One entry per team, ordered by TeamNum. */
			Teams: GameTeam[];
			/** Playlist Id of the current match. */
			PlaylistId: number;
			/** Seconds remaining in the match. */
			TimeSeconds: number;
			/** True if the match is in overtime. */
			bOvertime: boolean;
			/** Current ball state. */
			Ball: GameBall;
			/** True if a goal replay or history replay is active. */
			bReplay: boolean;
			/** True if a team has won. */
			bHasWinner: boolean;
			/** Name of the winning team. Empty string if no winner yet. */
			Winner: string;
			/** Asset name of the current map (e.g. "Stadium_P").
			 * @example "Wasteland_GRS_P"
			 */
			Arena: string;
			/** True if the client is currently viewing a specific vehicle. */
			bHasTarget: boolean;
			/** Player currently being viewed. Members are an empty string or 0 if the player does not have a spectator target. */
			Target?: PlayerRef;
			/** Current frame number if a replay is active. */
			Frame?: number;
			/** Seconds elapsed since game start if a replay is active. */
			Elapsed?: number;
		}
	}
	/**
	 * Sent X amount of times per second based on the player's PacketSendRate preference.
	 */
	export interface Event_UpdateState extends EventBase {
		/** One entry per player in the match. */
		Players: Player[];
		/** Match metadata. */
		Game: Partials_UpdateState.Game;
	}

	export namespace Partials_BallHit {
		export interface Ball {
			/** Ball speed before the hit (Unreal Units/second). */
			PreHitSpeed: number;
			/** Ball speed after the hit (Unreal Units/second). */
			PostHitSpeed: number;
			/** World position of the ball at impact. */
			Location: Vector;
		}
	}
	export interface Event_BallHit extends EventBase {
		/** Players that hit the ball that frame. */
		Players: PlayerRef[];
		/** Ball state at the moment of the hit. */
		Ball: Partials_BallHit.Ball;
	}

	export interface Event_BoostPickup extends EventBase {
		/** The player who collected the boost. */
		Player: PlayerRef;
		/** World location of the pickup. */
		Location: Vector;
		/** Amount of boost granted by the pickup. */
		BoostAmount: number;
		/** Pickup class: BoostType_Pad (small pad), BoostType_Pill (full/big boost). */
		BoostType: 'BoostType_Pad' | 'BoostType_Pill';
		/** True if the pickup occurred during replay playback. */
		bReplay: boolean;
	}

	export interface Event_ClockUpdatedSeconds extends EventBase {
		/** Seconds remaining in the match. */
		TimeSeconds: number;
		/** True if the game is in overtime. */
		bOvertime: boolean;
	}

	export interface Event_CountdownBegin extends EventBase {
	}

	export interface Event_CrossbarHit extends EventBase {
		/** Ball speed on impact. */
		BallSpeed: number;
		/** Impact force of the ball relative to the crossbar normal. */
		ImpactForce: number;
		/** The last touch of the ball before the crossbar hit. */
		BallLastTouch: BallLastTouch;
		/** World position of the ball when the impact occurred. */
		BallLocation: Vector;
	}

	export interface Event_GoalReplayStart extends EventBase {
	}

	export interface Event_GoalReplayWillEnd extends EventBase {
	}

	export interface Event_GoalReplayEnd extends EventBase {
	}

	export interface Event_GoalScored extends EventBase {
		/** Speed of the ball (Unreal Units/second) when it crossed the goal line. */
		GoalSpeed: number;
		/** Length of the previous round in seconds. */
		GoalTime: number;
		/** World position of the ball when the goal was scored. */
		ImpactLocation: Vector;
		/** The player who scored the goal. */
		Scorer: PlayerRef;
		/** The last touch of the ball before the goal. */
		BallLastTouch: BallLastTouch;
		/** Present only when an assist was recorded. */
		Assister?: PlayerRef;
	}

	export interface Event_MatchCreated extends EventBase {
	}

	export interface Event_MatchInitialized extends EventBase {
	}

	export interface Event_MatchPaused extends EventBase {
	}

	export interface Event_MatchUnpaused extends EventBase {
	}

	export interface Event_MatchEnded extends EventBase {
		/** Team index of the winning team. */
		WinnerTeamNum: number;
	}

	export interface Event_MatchDestroyed extends EventBase {
	}

	export interface Event_PlayerJoined extends EventBase {
		/** Display name of the player who joined. */
		PlayerName: string;
		/** Platform identifier in the format Platform|Uid|Splitscreen (e.g. "Steam|123|0", "Epic|456|0"). */
		PrimaryId: string;
	}

	export interface Event_PlayerLeft extends EventBase {
		/** Display name of the player who left. */
		PlayerName: string;
		/** Platform identifier in the format Platform|Uid|Splitscreen (e.g. "Steam|123|0", "Epic|456|0"). */
		PrimaryId: string;
	}

	export interface Event_PodiumStart extends EventBase {
	}

	export interface Event_ReplayCreated extends EventBase {
		/** File name of the replay. */
		FileName: string;
		/** Timestamp the replay was created. */
		Date: string;
	}

	export interface Event_RoundStarted extends EventBase {
	}

	export interface Event_StatfeedEvent extends EventBase {
		/**
		 * Asset name of the StatEvent (e.g. "Demolish", "Save").
		 */
		EventName:
			| 'Demolish'
			| 'Demolition'
			| 'Goal'
			| 'Win'
			| 'MVP'
			| 'AerialGoal'
			| 'BackwardsGoal'
			| 'BicycleGoal'
			| 'LongGoal'
			| 'TurtleGoal'
			| 'PoolShot'
			| 'OvertimeGoal'
			| 'HatTrick'
			| 'Assist'
			| 'Playmaker'
			| 'Save'
			| 'EpicSave'
			| 'Savior'
			| 'Shot'
			| 'Center'
			| 'Clear'
			| 'FirstTouch'
			| 'BreakoutDamage'
			| 'BreakoutDamageLarge'
			| 'LowFive'
			| 'HighFive'
			| 'HoopsSwishGoal'
			| 'BicycleHit'
			| 'OwnGoal'
			| 'FlipReset';
		/**
		 * Localized display label for the stat (e.g. "Demolition").
		 */
		Type: string;
		/** Player who earned the stat. */
		MainTarget: PlayerRef;
		/** Player involved in the stat (e.g. the demolished player). */
		SecondaryTarget?: PlayerRef;
	}
}