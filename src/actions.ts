import type { CoreplayInstance } from './main.js'
import {
	OPTIONPLAYBACK,
	playlistsort,
	startPoint,
	mode,
	transitionType,
	toggleChoice,
	takeConfigurationChoices,
} from './constants.js'
import { CompanionActionDefinitions } from '@companion-module/base'
import { Maction } from './types.js'

type PlaybackOptions = 'program' | 'preview'

export function UpdateActions(self: CoreplayInstance): void {
	const actions = {
		transport: {
			name: 'Player: Transport',
			options: [
				OPTIONPLAYBACK,
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					default: 'stop',
					choices: [
						{ id: 'stop', label: 'Stop' },
						{ id: 'play', label: 'Play' },
						{ id: 'pause', label: 'Pause' },
						{ id: 'tglstop', label: 'Toggle Play/Stop' },
						{ id: 'tglpause', label: 'Toggle Play/Pause' },
					],
				},
			],
			callback: async (event) => {
				const path = `/players/1/${event.options.playback}/`

				if (event.options.action === 'stop') {
					await self.requestAPI('POST', `${path}stop`).catch((e) => {
						self.log('error', 'Request failed: ' + e)
					})
				} else if (event.options.action === 'play') {
					await self.requestAPI('POST', `${path}play`).catch((e) => {
						self.log('error', 'Request failed: ' + e)
					})
				} else if (event.options.action === 'pause') {
					await self.requestAPI('POST', `${path}pause`).catch((e) => {
						self.log('error', 'Request failed: ' + e)
					})
				} else if (event.options.action === 'tglstop') {
					if (self.state.players['1'][event.options.playback ?? 'program'].state == 'playing') {
						await self.requestAPI('POST', `${path}stop`).catch((e) => {
							self.log('error', 'Request failed: ' + e)
						})
					} else {
						await self.requestAPI('POST', `${path}play`).catch((e) => {
							self.log('error', 'Request failed: ' + e)
						})
					}
				} else if (event.options.action === 'tglpause') {
					if (self.state.players['1'][event.options.playback ?? 'program'].state == 'playing') {
						await self.requestAPI('POST', `${path}pause`).catch((e) => {
							self.log('error', 'Request failed: ' + e)
						})
					} else {
						await self.requestAPI('POST', `${path}play`).catch((e) => {
							self.log('error', 'Request failed: ' + e)
						})
					}
				}
			},
		} as Maction<{ playback: PlaybackOptions; action: string }>,

		take: {
			name: 'Player: Take',
			options: [
				{
					id: 'properties',
					label: 'Override Take Configuration properties',
					type: 'multidropdown',
					choices: takeConfigurationChoices,
					default: [],
				},
				{
					id: 'transitionDuration',
					label: 'Take Duration',
					isVisible: (opt: any) => opt.properties?.includes('transitionDuration'),
					type: 'number',
					default: 0,
					min: 0,
					max: 600,
				},
				{
					id: 'transitionType',
					label: 'Transition Type',
					isVisible: (opt: any) => opt.properties?.includes('transitionType'),
					type: 'dropdown',
					choices: transitionType,
					default: 'crossfade',
				},
				{
					id: 'startPoint',
					label: 'Playhead Option',
					isVisible: (opt: any) => opt.properties?.includes('startPoint'),
					type: 'dropdown',
					choices: [
						{ id: 'inpoint', label: 'From inpoint' },
						{ id: 'position', label: 'From current position in preview' },
					],
					default: 'inpoint',
				},
				{
					id: 'mode',
					label: 'Preset Toggle',
					isVisible: (opt: any) => opt.properties?.includes('mode'),
					type: 'dropdown',
					choices: [
						{ id: 'swap', label: 'Swap' },
						{ id: 'copy', label: 'Copy' },
					],
					default: 'copy',
				},
			],
			callback: async ({ options }) => {
				const properties = options.properties ?? []
				let takeConfiguration: Record<string, unknown> | undefined = undefined
				if (properties.length > 0) {
					takeConfiguration = self.state.players[1].takeConfiguration ?? {}
					properties.forEach((prop) => {
						if (options[prop] !== undefined && takeConfiguration) takeConfiguration[prop] = options[prop]
					})
					await self.requestAPI('POST', `/players/1/take`, takeConfiguration).catch((e) => {
						self.log('error', 'Request failed: ' + e)
					})
				} else {
					await self.requestAPI('POST', `/players/1/take`, {}).catch((e) => {
						self.log('error', 'Request failed: ' + e)
					})
				}
			},
		} as Maction<{
			properties: Array<'transitionDuration' | 'transitionType' | 'startPoint' | 'mode'>
			transitionDuration: number
			transitionType: string
			startPoint: string
			mode: string
		}>,

		seek: {
			name: 'Player: Seek to time',
			options: [
				OPTIONPLAYBACK,
				{
					id: 'type',
					type: 'dropdown',
					label: 'Type',
					choices: [
						{ id: 'abs', label: 'Time absolut' },
						{ id: 'inc', label: 'Time incremental' },
						{ id: 'rel', label: 'Percent' },
					],
					default: 'abs',
				},
				{
					id: 'abs',
					type: 'textinput',
					label: 'Time',
					default: '',
					regex: `/^[+-]?((\\d+:)?(\\d+:))?\\d+(\\.\\d+)?$/`,
					useVariables: true,
					tooltip: `enter the time in seconds like 1.5 or m:s.s or h:m:s.s\nEnter a negative time to seek from the end, e.g. '-10' will seek ten seconds from the outpoint.`,
					isVisible: (options) => {
						return options.type === 'abs'
					},
				},
				{
					id: 'inc',
					type: 'number',
					label: 'Time increment',
					default: 0,
					min: -600,
					max: 600,
					step: 0.1,
					tooltip: `the time increment with each action run\nCorePlay can only seek to the nearest keyframe, if you seek in too small increments, you will never reach the next keyframe`,
					isVisible: (options) => {
						return options.type === 'inc'
					},
				},
				{
					id: 'rel',
					type: 'number',
					label: 'Percent (0.0 - 1.0)',
					default: 0,
					min: 0,
					max: 1,
					step: 0.01,
					range: true,
					tooltip: `the relative position to seek to from 0.0 to 1.0\n0.0 is the inpoint, 1.0 is the outpoint, 0.5 is half way between inpoint and outpoint`,
					isVisible: (options) => {
						return options.type === 'rel'
					},
				},
			],
			callback: async ({ options }) => {
				const path = `/players/1/${options.playback}/seek`
				try {
					if (options.type === 'abs') {
						const mediaUrl: string | undefined = self.state.players['1'][`${options.playback}`].mediaUrl ?? undefined
						if (!mediaUrl) {
							self.log('debug', `No valid media in playback ${options.playback} to seek at.`)
							return
						}
						const media = self.state.collections[mediaUrl.split('/')[3]]?.slots[mediaUrl.split('/')[5]] ?? undefined
						if (!media) {
							self.log('debug', `Could not get media data for mediaUrl ${mediaUrl}`)
							return
						}
						const duration: number | null = media.duration
						if (duration === null) {
							self.log('info', `Can't seek at an infinite media`)
							return
						}

						const time = parseFloat(`${options.abs}`)
						if (isNaN(time)) {
							self.log('error', `The entered time string "${options.abs}" could not be evaluated to a number.`)
							return
						}
						let position = 0
						if (time >= 0) {
							position = Math.min(Math.max(time, 0), duration)
						} else {
							position = Math.min(Math.max(duration + time, 0), duration)
						}
						await self.requestAPI('POST', `${path}?position=${position}`)
					} else if (options.type === 'inc') {
						const currPosition: number = self.state.players['1'][`${options.playback}`].position ?? 0
						console.log('posting', `${path}?mediaPosition=${Math.max(currPosition + Number(options.inc), 0)}`)
						await self.requestAPI('POST', `${path}?position=${Math.max(currPosition + Number(options.inc), 0)}`)
					} else if (options.type === 'rel') {
						const normalizedPosition = Math.max(Math.min(Number(options.rel), 1), 0)
						await self.requestAPI('POST', `${path}?normalizedPosition=${normalizedPosition}`)
					} else {
						self.log('error', `Can't seek, invalid type given: ${options.type}`)
					}
				} catch (error) {
					self.log('error', `Seek action failed: ${error}`)
				}
			},
		} as Maction<{ playback: PlaybackOptions; type: 'abs' | 'inc' | 'rel'; abs?: string; inc?: string; rel?: string }>,

		selectItem: {
			name: 'Playlist: Select Item',
			options: [
				OPTIONPLAYBACK,
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					default: 'next',
					choices: [
						{ id: 'previous', label: 'Previous Item' },
						{ id: 'next', label: 'Next Item' },
					],
				},
			],
			callback: async (event) => {
				const path = `/players/1/${event.options.playback}/`

				switch (event.options.action) {
					case 'previous':
						await self.requestAPI('POST', `${path}previous`).catch((e) => {
							self.log('error', 'Request failed: ' + e)
						})
						break

					case 'next':
						await self.requestAPI('POST', `${path}next`).catch((e) => {
							self.log('error', 'Request failed: ' + e)
						})
						break

					default:
						break
				}
			},
		} as Maction<{ playback: PlaybackOptions; action: 'previous' | 'next' }>,

		setMedia: {
			name: 'Player: Set Media by index',
			options: [
				OPTIONPLAYBACK,
				{
					id: 'type',
					label: 'Type',
					type: 'dropdown',
					choices: [
						{ id: 'collections', label: 'Single Media' },
						{ id: 'playlists', label: 'Playlist' },
					],
					default: 'collections',
				},
				{
					id: 'number',
					type: 'number',
					label: 'Number',
					tooltip: `Number of Collection or Playlist`,
					default: 1,
					min: 0,
					max: 999999999,
					step: 1,
				},
				{
					id: 'slot',
					type: 'number',
					label: 'Slot',
					tooltip: `Number of Slot`,
					isVisible: (opt) => opt.type == 'collections',
					default: 1,
					min: 1,
					max: 255,
					step: 1,
				},
				{
					id: 'cue',
					type: 'textinput',
					label: 'Cue',
					tooltip: `Number of Cue, type 'first' to reference the first cue, regardles of its number`,
					isVisible: (opt) => opt.type == 'playlists',
					default: 'first',
					regex: '/^\\d+(\\.\\d+)?|first$/',
				},
			],
			callback: async ({ options }) => {
				let num: string, item: string, itemname: string
				if (options.type === 'collections') {
					num = Math.min(Math.max(Math.round(Number(options.number)), 1), 255).toString()
					item = Math.min(Math.max(Math.round(Number(options.slot)), 1), 255).toString()
					itemname = 'slots'
				} else if (options.type === 'playlists') {
					num = Math.max(Math.round(Number(options.number)), 1).toString()
					if (options.cue == 'first') {
						item = 'first'
					} else if (options.cue.match(/^\d+$/)) {
						item = parseInt(options.cue).toString() + '.0'
					} else if (options.cue.match(/^\d+\.\d+$/)) {
						const [a, b] = options.cue.split('.')
						item = parseInt(a).toString() + '.' + parseInt(b).toString()
					} else {
						const err = `Playlist item doesn't have correct format. Is: $(options.cue), should be number or number.number or 'first'`
						self.log('error', err)
						return Promise.reject(Error(err))
					}
					if (item === 'first') {
						item = Object.keys(self.state.playlists[num].entries).sort(playlistsort)[0]
						if (!item) {
							const err = 'Error finding first item of playlist ' + num
							self.log('error', err)
							return Promise.reject(Error(err))
						}
					}
					itemname = 'entries'
				} else {
					return Promise.reject(Error('invalid item type given'))
				}

				const path = `/players/1/${options.playback}/media`
				await self
					.requestAPI('POST', path, { mediaUrl: `core://${options.type}/${num}/${itemname}/${item}` })
					.catch((e) => {
						self.log('error', 'Request failed: ' + e)
					})
			},
		} as Maction<{
			playback: PlaybackOptions
			type: 'collections' | 'playlists'
			number: number
			slot: number
			cue: string
		}>,

		mute: {
			name: 'Audio: Mute',
			options: [
				OPTIONPLAYBACK,
				{
					id: 'action',
					type: 'dropdown',
					label: 'Action',
					default: 'next',
					choices: [
						{ id: 'mute', label: 'Mute' },
						{ id: 'unmute', label: 'Unmute' },
					],
				},
			],
			callback: async (event) => {
				const path = `/players/1/${event.options.playback}/`

				switch (event.options.action) {
					case 'mute':
						await self.requestAPI('POST', `${path}mute`)
						break

					case 'unmute':
						await self.requestAPI('POST', `${path}unmute`)
						break

					default:
						break
				}
			},
		} as Maction<{ playback: PlaybackOptions; action: 'mute' | 'unmute' }>,

		volume: {
			name: 'Audio: Volume',
			options: [
				OPTIONPLAYBACK,
				{
					id: 'volume',
					type: 'number',
					label: 'Volume',
					default: 0,
					min: -200,
					max: 12,
					step: 3,
					range: true,
					tooltip: `Range is from +12dB to -200dB, -200dB is like -infinity`,
				},
			],
			callback: async (event) => {
				const volume = Math.min(Math.max(Number(event.options.volume), -200), 12)
				const path = `/players/1/${event.options.playback}/setVolume?volume=${volume.toFixed(2)}`

				await self.requestAPI('POST', path).catch((e) => {
					self.log('error', 'Request failed: ' + e)
				})
			},
		} as Maction<{ playback: PlaybackOptions; volume: number }>,

		setTakeConfiguration: {
			name: 'Player: Set Default Take Configuration',
			options: [
				{
					id: 'properties',
					label: 'Properties to set',
					type: 'multidropdown',
					choices: takeConfigurationChoices,
					default: [],
				},
				{
					id: 'transitionDuration',
					label: 'Take Duration',
					isVisible: (opt: any) => opt.properties?.includes('transitionDuration'),
					type: 'number',
					default: 0,
					min: 0,
					max: 600,
				},
				{
					id: 'transitionType',
					label: 'Transition Type',
					isVisible: (opt: any) => opt.properties?.includes('transitionType'),
					type: 'dropdown',
					choices: [...transitionType, toggleChoice],
					default: 'toggle',
				},
				{
					id: 'startPoint',
					label: 'Playhead Option',
					isVisible: (opt: any) => opt.properties?.includes('startPoint'),
					type: 'dropdown',
					choices: [...startPoint, toggleChoice],
					default: 'toggle',
				},
				{
					id: 'mode',
					label: 'Preset Toggle',
					isVisible: (opt: any) => opt.properties?.includes('mode'),
					type: 'dropdown',
					choices: [...mode, toggleChoice],
					default: 'toggle',
				},
			],
			callback: async ({ options }) => {
				const properties = options.properties ?? []
				if (properties.length == 0) return
				const takeConfiguration: Record<string, unknown> = self.state.players[1].takeConfiguration ?? {}
				properties.forEach((prop) => {
					if (options[prop] == 'toggle' && takeConfiguration !== undefined) {
						let choices: { id: string; label: string }[]
						switch (prop) {
							case 'transitionType':
								choices = transitionType
								break
							case 'mode':
								choices = mode
								break
							case 'startPoint':
								choices = startPoint
								break
							default:
								choices = []
								break
						}
						let index = choices.findIndex((choice) => choice.id == self.state.players['1'].takeConfiguration[prop])
						console.log('options', options, 'current', self.state.players['1'].takeConfiguration[prop])
						console.log('original index', index)
						if (index == -1) {
							throw Error('Toggle not possible, value not found')
						}
						index += 1
						index = index % choices.length
						takeConfiguration[prop] = choices[index].id
						console.log('new index', index, choices[index].id)
					} else if (options[prop] !== undefined && takeConfiguration) takeConfiguration[prop] = options[prop]
				})
				try {
					await self.requestAPI('POST', '/players/1/takeConfiguration', takeConfiguration)
				} catch (error) {
					self.log('error', `Can't send take configuration: ${error}`)
				}
			},
		} as Maction<{
			playback: PlaybackOptions
			properties: Array<'transitionDuration' | 'transitionType' | 'startPoint' | 'mode'>
			transitionDuration: number
			transitionType: string
			startPoint: string
			mode: string
		}>,
	}

	self.setActionDefinitions(actions as unknown as CompanionActionDefinitions)
}
