import Jimp from 'jimp'
import { defaultblack, defaultred, OPTIONPLAYBACK, transitionType } from './constants.js'
import type { CoreplayInstance } from './main.js'
import { CompanionFeedbackDefinitions } from '@companion-module/base'
import { Mfeedback } from './types.js'

type PlaybackOptions = 'program' | 'preview'

export function UpdateFeedbacks(self: CoreplayInstance): void {
	const feedbacks = {
		playerstate: {
			name: 'Playhead state',
			type: 'boolean',
			defaultStyle: {
				bgcolor: defaultred,
				color: defaultblack,
			},
			options: [
				OPTIONPLAYBACK,
				{
					id: 'state',
					type: 'dropdown',
					label: 'State',
					default: 'stopped',
					choices: [
						{ id: 'stopped', label: 'Stopped' },
						{ id: 'playing', label: 'Playing' },
						{ id: 'paused', label: 'Paused' },
					],
				},
			],
			callback: ({ options }) => {
				try {
					if (self.state.players['1'][options.playback].state === options.state) {
						return true
					}
				} catch (error) {
					self.log('error', `Error checking playback state: ${error}`)
				}
				return false
			},
		} as Mfeedback<{
			playback: PlaybackOptions
			state: 'stopped' | 'playing' | 'paused'
		}>,

		tallyBool: {
			name: 'Tally',
			type: 'boolean',
			defaultStyle: {
				bgcolor: defaultred,
				color: defaultblack,
			},
			options: [
				{
					id: 'playback',
					type: 'dropdown',
					label: 'Playback',
					default: 'any',
					choices: [
						{ id: 'any', label: 'Any' },
						{ id: 'program', label: 'Program' },
						{ id: 'preview', label: 'Preview' },
					],
				},
				{
					id: 'state',
					type: 'dropdown',
					label: 'State',
					default: 'any',
					choices: [
						{ id: 'any', label: 'Any' },
						{ id: 'stopped', label: 'Stopped' },
						{ id: 'playing', label: 'Playing' },
						{ id: 'paused', label: 'Paused' },
					],
				},
				{
					id: 'type',
					type: 'dropdown',
					label: 'Type',
					default: 'collections',
					choices: [
						{ id: 'collections', label: 'Single Media' },
						{ id: 'playlists', label: 'Playlist' },
					],
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
					tooltip: `Number of Slot, use 0 for any slot`,
					isVisible: (opt) => opt.type == 'collections',
					default: 1,
					min: 0,
					max: 255,
					step: 1,
				},
				{
					id: 'cue',
					type: 'textinput',
					label: 'Cue',
					tooltip: `Number of Cue, or 'any'`,
					isVisible: (opt) => opt.type == 'playlists',
					default: '1',
					regex: '/^\\d+(\\.\\d+)?$|any/',
				},
			],
			callback: ({ options }) => {
				try {
					let num: string, item: string, itemname: string
					if (options.type === 'collections') {
						num = Math.min(Math.max(Math.round(options.number), 1), 255).toString()
						item = Math.min(Math.max(Math.round(options.slot), 0), 255).toString()
						itemname = 'slots'
					} else if (options.type === 'playlists') {
						num = Math.max(Math.round(options.number), 1).toString()
						if (options.cue == 'any') {
							item = 'any'
						} else if (options.cue.match(/^\d+$/)) {
							item = parseInt(options.cue).toString() + '.0'
						} else if (options.cue.match(/^\d+\.\d+$/)) {
							const [a, b] = options.cue.split('.')
							item = parseInt(a).toString() + '.' + parseInt(b).toString()
						} else {
							return false
						}
						itemname = 'entries'
					} else {
						return false
					}

					if (item === 'any' || item === '0') {
						if (
							(((options.playback === 'any' || options.playback === 'program') &&
								self.state.players['1'].program.mediaUrl.startsWith(`core://${options.type}/${num}/${itemname}/`)) ||
								((options.playback === 'any' || options.playback === 'preview') &&
									self.state.players['1'].preview.mediaUrl.startsWith(`core://${options.type}/${num}/${itemname}/`))) &&
							(options.state === 'any' ||
								self.state.players['1'][options.playback as PlaybackOptions].state === options.state)
						) {
							return true
						}
					}

					if (
						(((options.playback === 'any' || options.playback === 'program') &&
							self.state.players['1'].program.mediaUrl == `core://${options.type}/${num}/${itemname}/${item}`) ||
							((options.playback === 'any' || options.playback === 'preview') &&
								self.state.players['1'].preview.mediaUrl == `core://${options.type}/${num}/${itemname}/${item}`)) &&
						(options.state === 'any' ||
							self.state.players['1'][options.playback as PlaybackOptions].state === options.state)
					) {
						return true
					}
				} catch (error) {
					self.log('error', `Error checking feedback boolean tally: ${error}`)
				}
				return false
			},
		} as Mfeedback<{
			playback: PlaybackOptions | 'any'
			state: 'any' | 'stopped' | 'playing' | 'paused'
			type: 'collections' | 'playlists'
			number: number
			cue: string
			slot: number
		}>,

		takeRunning: {
			name: 'Take in progress',
			type: 'boolean',
			options: [],
			defaultStyle: {
				color: defaultblack,
				bgcolor: defaultred,
			},
			callback: () => {
				return self.state.players['1'].takeProgress !== null
			},
		} as Mfeedback<unknown>,

		transitionType: {
			name: 'Player Configuration: Transition type',
			type: 'boolean',
			options: [
				{
					id: 'transitionType',
					label: 'Transition Type',
					type: 'dropdown',
					choices: transitionType,
					default: 'crossfade',
				},
			],
			defaultStyle: {
				color: defaultblack,
				bgcolor: defaultred,
			},
			callback: ({ options }): boolean => {
				return self.state.players['1'].takeConfiguration.transitionType == options.transitionType
			},
		} as Mfeedback<{
			transitionType: 'directCut' | 'crossfade' | 'dipToColor'
		}>,

		startPoint: {
			name: 'Player Configuration: Playhead Option',
			type: 'boolean',
			options: [
				{
					id: 'startPoint',
					label: 'Playhead Option',
					type: 'dropdown',
					choices: [
						{ id: 'inpoint', label: 'From inpoint' },
						{ id: 'position', label: 'From current position in preview' },
					],
					default: 'inpoint',
				},
			],
			defaultStyle: {
				color: defaultblack,
				bgcolor: defaultred,
			},
			callback: ({ options }): boolean => {
				return self.state.players['1'].takeConfiguration.startPoint == options.startPoint
			},
		} as Mfeedback<{
			startPoint: 'inpoint' | 'position'
		}>,

		mode: {
			name: 'Player Configuration: Preset Toggle',
			type: 'boolean',
			options: [
				{
					id: 'mode',
					label: 'Preset Toggle',
					type: 'dropdown',
					choices: [
						{ id: 'swap', label: 'Swap' },
						{ id: 'copy', label: 'Copy' },
					],
					default: 'copy',
				},
			],
			defaultStyle: {
				color: defaultblack,
				bgcolor: defaultred,
			},
			callback: ({ options }) => {
				return self.state.players['1'].takeConfiguration.mode == options.mode
			},
		} as Mfeedback<{
			mode: 'swap' | 'copy'
		}>,

		previewImage: {
			name: 'Preview Thumbnail',
			type: 'advanced',
			options: [
				{
					id: 'type',
					type: 'dropdown',
					label: 'Type',
					default: 'collections',
					choices: [
						{ id: 'collections', label: 'Single Media' },
						{ id: 'playlists', label: 'Playlist' },
					],
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
					tooltip: `Number of Cue`,
					isVisible: (opt) => opt.type == 'playlists',
					default: '1',
					regex: '/^\\d+(\\.\\d+)?$/',
				},
			],
			callback: async ({ options }) => {
				try {
					let num: string, item: string
					if (options.type === 'collections') {
						num = Math.min(Math.max(Math.round(options.number), 1), 255).toString()
						item = Math.min(Math.max(Math.round(options.slot), 1), 255).toString()
					} else if (options.type === 'playlists') {
						num = Math.max(Math.round(options.number), 1).toString()
						item = options.cue

						const mediaUrl: string | undefined = self.state.playlists[num]?.entries[item]?.mediaUrl ?? undefined
						if (mediaUrl) {
							num = mediaUrl.split('/')[3]
							item = mediaUrl.split('/')[5]
						} else {
							self.log('error', `Can't get thumbnail for playlist ${num}, entry ${item}. Can't retrieve mediaUrl.`)
							return {}
						}
					} else {
						self.log('error', `Can't get thumbnail. Type is neither collection nor playlist.`)
						return {}
					}

					const thumbnails: Record<string, any> = self.state.collections[num]?.slots[item]?.metadata.thumbnails ?? {}
					let thumbUrl = ''
					if (thumbnails.medium) thumbUrl = thumbnails.medium.url
					else if (thumbnails.large) thumbUrl = thumbnails.large.url
					else if (thumbnails.small) thumbUrl = thumbnails.small.url
					else {
						self.log('debug', `Can't get thumbnail for collection ${num}, slot ${item}. No thumbnail is provided.`)
						return {}
					}

					try {
						const maxsize = 144
						const image = await Jimp.read(self.host + thumbUrl)
						const width = image.getWidth()
						const height = image.getHeight()
						if (width < 1 || height < 1) {
							return {}
						}
						const ar = width / height
						const tw = ar >= 1 ? maxsize : Math.round(maxsize * ar)
						const th = ar >= 1 ? Math.round(maxsize / ar) : maxsize
						const buff = image.resize(tw, th).bitmap.data

						return {
							imageBuffer: buff,
							imageBufferEncoding: { pixelFormat: 'RGBA' },
							imageBufferPosition: {
								x: Math.floor((maxsize - tw) / 4),
								y: Math.floor((maxsize - th) / 4),
								width: tw,
								height: th,
								drawScale: 0.5,
							},
						}
					} catch (error) {
						self.log('debug', `Can't get thumbnail from ${self.host + thumbUrl}: ${error}`)
						return {}
					}
				} catch (error) {
					self.log('error', `Error checking feedback preview thumbnail: ${error}`)
				}
				return {}
			},
		} as Mfeedback<{
			type: 'collections' | 'playlists'
			number: number
			slot: number
			cue: string
		}>,
	}
	self.setFeedbackDefinitions(feedbacks as unknown as CompanionFeedbackDefinitions)
}
