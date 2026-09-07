import { BaseMessage, Events } from './types';

export class ConnectionError extends Error {}

export default class Connection {
	ws: WebSocket;
	onOpen?: (e: Event) => void;
	onMessage?: (event: Events.AllEventNames, dataStr: string) => void;
	onClose?: (e: CloseEvent) => void;
	onError?: (err: ConnectionError) => void;
	constructor(host: string, port: number, secure: boolean) {
		const url = new URL(`ws://${host}`);
		url.port = port.toString();
		url.protocol = secure ? 'wss:' : 'ws:';
		this.ws = new WebSocket(url);
		this.ws.onopen = e => this.onOpen?.(e);
		this.ws.onclose = e => this.onClose?.(e);
		// this.ws.onerror = _e => this.handleError('WebSocket error');
		this.ws.onmessage = e => this.handleMessage(e);
	}
	handleMessage(e: MessageEvent) {
		try {
			const { Event: event, Data: dataStr } = JSON.parse(e.data) as BaseMessage;
			this.onMessage?.(event, dataStr);
		} catch(err) {
			this.handleError('Failed to parse WebSocket message data', { cause: err });
			return;
		}
	}
	protected handleError(error: Error): void;
	protected handleError(message: string, errorOptions?: ErrorOptions): void;
	protected handleError(msg: Error | string, errorOptions?: ErrorOptions) {
		let err: Error;
		if(typeof msg === 'string') {
			err = new ConnectionError(msg, errorOptions);
		}
		else if(msg instanceof Error) {
			if(msg instanceof ConnectionError === false) {
				err = new ConnectionError('Unhandled error', { cause: msg });
			}
			else {
				err = msg;
			}
		}
		else {
			throw new TypeError('Error is not a string or Error instance');
		}
		if(!this.onError) {
			throw err;
		}
		this.onError(err);
	}
	removeListeners() {
		this.onOpen = undefined;
		this.onMessage = undefined;
		this.onClose = undefined;
		this.onError = undefined;
	}
	close() {
		this.ws.close();
	}
	isConnected(): boolean {
		return this.ws.readyState === WebSocket.OPEN;
	}
	send(message: object) {
		this.ws.send(JSON.stringify(message));
	}
}