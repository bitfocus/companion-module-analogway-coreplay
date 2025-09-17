type Presetoptions = {
	state: string
	position: number
	normalizedPosition: number
	mediaPosition: 0
	isResourceConstrained: boolean
	mediaUrl: string
	volume: number // -200 = mute, -39 ... +12
	isMuted: boolean
}

type Collection = {
	name: string
	slots: Record<string, Slot>
}

type Slot = {
	name: string
	contentUrl: string
	inpoint: number | null
	outpoint: number | null
	customDuration: number | null
	duration: number | null
	mediaDuration: number | null
	infiniteDuration: boolean
	scaleMode: string
	isPlayable: boolean
	mediaExists: boolean
	imageSequence: null | {
		framerate: number
		firstFrame: number
		lastFrame: number
	}
	metadata: {
		type: string
		contentUrl?: string
		duration: number | null
		supported: boolean
		caveats: unknown[]
		thumbnails: Record<string, unknown>
		video?: unknown[]
		audio?: unknown[]
		container?: Record<string, unknown>
		image?: Record<string, unknown>
		imageSequence?: Record<string, unknown>
	}
}

type Playlist = {
	name: string
	entries: Record<string, Entry>
}

type Entry = {
	endAction: string
	mediaUrl: string
	transitionDuration: number
	startPoint: string
}

type Storage = {
	availableSize: number
	[other: string]: unknown
}

type Playeroptions = {
	preview: Presetoptions
	program: Presetoptions
	takeProgress: number | null
	takeConfiguration: {
		transitionDuration: number
		startPoint: string
		mode: string
		transitionType: string
	}
}

export type State = {
	storages: Record<string, Storage>
	system: {
		uptime: number
		productType?: string
		serialNumber?: string
		hostname?: string
		firmwareVersion?: {
			major: number
			minor: number
			patch: number
			tag?: string
		}
	}
	players: {
		1: Playeroptions
		[player: string]: Playeroptions
	}
	playlists: Record<string, Playlist>
	collections: Record<string, Collection>
	jobs: Record<string, unknown>
}

export const DEFAULTSTATE: State = {
	storages: {},
	jobs: {},
	system: {
		uptime: 0,
	},
	players: {
		1: {
			preview: {
				state: 'stopped',
				position: 0,
				normalizedPosition: 0,
				mediaPosition: 0,
				isResourceConstrained: false,
				mediaUrl: '',
				volume: 0, // -200 = mute, -39 ... +12
				isMuted: false,
			},
			program: {
				state: 'stopped',
				position: 0,
				normalizedPosition: 0,
				mediaPosition: 0,
				isResourceConstrained: false,
				mediaUrl: '',
				volume: 0, // -200 = mute, -39 ... +12
				isMuted: false,
			},
			takeProgress: null,
			takeConfiguration: {
				transitionDuration: 0,
				startPoint: 'inpoint',
				mode: 'swap',
				transitionType: 'crossfade',
			},
		},
	},
	playlists: {},
	collections: {},
}
