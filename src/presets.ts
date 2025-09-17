import { CoreplayInstance } from './main.js'
import { darkred, defaultblack, defaultred, defaultwhite, playlistsort, transitionType } from './constants.js'
import { CompanionPresetDefinitions } from '@companion-module/base'

export async function UpdatePresets(self: CoreplayInstance): Promise<void> {
	const presets: CompanionPresetDefinitions = {}

	// Transition presets
	presets['take'] = {
		type: 'button',
		name: `Take`,
		category: 'Transition',
		style: {
			text: `TAKE`,
			color: defaultwhite,
			bgcolor: darkred,
			size: 16,
		},
		steps: [
			{
				down: [
					{
						actionId: 'take',
						options: {
							properties: [],
							transitionDuration: 0.7,
							transitionType: 'crossfade',
							mode: 'swap',
							startPoint: 'inpoint',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'takeRunning',
				options: {},
				style: {
					color: defaultwhite,
					bgcolor: defaultred,
				},
			},
		],
	}

	presets['trans07'] = {
		type: 'button',
		name: `Take`,
		category: 'Transition',
		style: {
			text: `TRANS 0.7`,
			color: defaultwhite,
			bgcolor: darkred,
			size: 16,
		},
		steps: [
			{
				down: [
					{
						actionId: 'take',
						options: {
							properties: ['transitionDuration', 'transitionType'],
							transitionDuration: 0.7,
							transitionType: 'crossfade',
							mode: 'swap',
							startPoint: 'inpoint',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'takeRunning',
				options: {},
				style: {
					color: defaultwhite,
					bgcolor: defaultred,
				},
			},
		],
	}

	presets['cut'] = {
		type: 'button',
		name: `Cut`,
		category: 'Transition',
		style: {
			text: `CUT`,
			color: defaultwhite,
			bgcolor: darkred,
			size: 16,
		},
		steps: [
			{
				down: [
					{
						actionId: 'take',
						options: {
							properties: ['transitionDuration', 'transitionType'],
							transitionDuration: 0,
							transitionType: 'directCut',
							mode: 'swap',
							startPoint: 'inpoint',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [
			{
				feedbackId: 'takeRunning',
				options: {},
				style: {
					color: defaultwhite,
					bgcolor: defaultred,
				},
			},
		],
	}

	presets['transitionTypeToggle'] = {
		type: 'button',
		name: `Toggle Transition Type`,
		category: 'Transition',
		style: {
			text: `Transition:\\n$(coreplay:take1_transitionType)`,
			color: defaultwhite,
			bgcolor: 'rgb(9, 9, 115)' as unknown as number,
			size: 12,
		},
		steps: [
			{
				down: [
					{
						actionId: 'setTakeConfiguration',
						options: {
							properties: ['transitionType'],
							transitionDuration: 1,
							transitionType: 'toggle',
							startPoint: 'inpoint',
							mode: 'copy',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['startPointToggle'] = {
		type: 'button',
		name: `Toggle Transition Playhead Option`,
		category: 'Transition',
		style: {
			text: `Playhead Option:\\n$(coreplay:take1_startPoint)`,
			color: defaultwhite,
			bgcolor: 'rgb(9, 9, 115)' as unknown as number,
			size: 12,
		},
		steps: [
			{
				down: [
					{
						actionId: 'setTakeConfiguration',
						options: {
							properties: ['startPoint'],
							transitionDuration: 1,
							transitionType: 'crossfade',
							startPoint: 'toggle',
							mode: 'copy',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	presets['modeToggle'] = {
		type: 'button',
		name: `Toggle Preset Toggle`,
		category: 'Transition',
		style: {
			text: `Preset Toggle:\\n$(coreplay:take1_presetToggle)`,
			color: defaultwhite,
			bgcolor: 'rgb(9, 9, 115)' as unknown as number,
			size: 12,
		},
		steps: [
			{
				down: [
					{
						actionId: 'setTakeConfiguration',
						options: {
							properties: ['mode'],
							transitionDuration: 1,
							transitionType: 'crossfade',
							startPoint: 'inpoint',
							mode: 'toggle',
						},
					},
				],
				up: [],
			},
		],
		feedbacks: [],
	}

	for (const transition of transitionType) {
		presets[`startPoint${transition.id}`] = {
			type: 'button',
			name: `$Transition Type: ${transition.label}`,
			category: 'Transition',
			style: {
				text: `Transition\\n${transition.label}`,
				color: defaultwhite,
				bgcolor: 'rgb(6, 6, 147)' as unknown as number,
				size: 12,
			},
			steps: [
				{
					down: [
						{
							actionId: 'setTakeConfiguration',
							options: {
								properties: ['transitionType'],
								transitionDuration: 1,
								transitionType: transition.id,
								startPoint: 'inpoint',
								mode: 'copy',
							},
						},
					],
					up: [],
				},
			],
			feedbacks: [
				{
					feedbackId: 'transitionType',
					options: {
						transitionType: transition.id,
					},
					style: {
						bgcolor: 'rgb(85, 85, 198)' as unknown as number,
					},
				},
			],
		}
	}

	// Transport presets
	for (const playback of ['Program', 'Preview']) {
		for (const action of [
			{ name: 'Play', option: 'play', icon: '▶️' },
			{ name: 'Pause', option: 'pause', icon: '⏸️' },
			{ name: 'Stop', option: 'stop', icon: '⏹️' },
			{ name: 'Toggle Play/Pause', option: 'tglpause', icon: '⏯️' },
			{ name: 'Toggle Play/Stop', option: 'tglstop', icon: '▶️/⏹️' },
		]) {
			presets[`${playback}${action.option}`] = {
				type: 'button',
				name: `${action.name} ${playback}`,
				category: 'Transport',
				style: {
					text: `${action.icon}\\n${playback}`,
					color:
						playback == 'Program' ? ('rgb(255,100,100)' as unknown as number) : ('rgb(0, 255, 0)' as unknown as number), // FIXME: remove type casting when base allows strings
					bgcolor: defaultblack,
					size: 16,
				},
				steps: [
					{
						down: [
							{
								actionId: 'transport',
								options: {
									playback: playback.toLowerCase(),
									action: action.option,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'playerstate',
						options: {
							playback: playback.toLowerCase(),
							state: 'paused',
						},
						style: {
							bgcolor: 'rgb(138, 138, 0)' as unknown as number,
						},
					},
					{
						feedbackId: 'playerstate',
						options: {
							playback: playback.toLowerCase(),
							state: 'playing',
						},
						style: {
							bgcolor: 'rgb(138, 0, 0)' as unknown as number,
						},
					},
				],
			}
		}
	}

	// Seek presets
	for (const playback of ['Program', 'Preview']) {
		for (const action of [
			{ name: 'Goto Inpoint', option: { type: 'rel', rel: 0 }, text: '⏮️' },
			{ name: 'Goto Outpoint', option: { type: 'rel', rel: 1 }, text: '⏭️' },
			{ name: 'Goto -10s', option: { type: 'abs', abs: '-10' }, text: '⏭️ -10' },
			{ name: 'Goto -20s', option: { type: 'abs', rel: '-20' }, text: '⏭️ -20' },
			{ name: 'Seek 1s back', option: { type: 'inc', rel: -1 }, text: '⏪ 1' },
			{ name: 'Seek 1s ahead', option: { type: 'inc', rel: 1 }, text: '⏩ 1' },
			{ name: 'Seek 5s back', option: { type: 'inc', rel: -5 }, text: '⏪ 5' },
			{ name: 'Seek 5s ahead', option: { type: 'inc', rel: 5 }, text: '⏩ 5' },
			{ name: 'Seek 10s back', option: { type: 'inc', rel: -10 }, text: '⏪ 10' },
			{ name: 'Seek 10s ahead', option: { type: 'inc', rel: 10 }, text: '⏩ 10' },
			{ name: 'Jog 0.1s back', option: { type: 'inc', rel: -0.1 }, text: '↺' },
			{ name: 'Jog 0.1s ahead', option: { type: 'inc', rel: 0.1 }, text: '↻' },
		]) {
			presets[`${playback}${action.name.replaceAll(/\s/g, '_')}`] = {
				type: 'button',
				name: `${action.name} ${playback}`,
				category: 'Transport',
				style: {
					text: `${action.text}\\n${playback}`,
					color:
						playback == 'Program' ? ('rgb(255,100,100)' as unknown as number) : ('rgb(0, 255, 0)' as unknown as number), // FIXME: remove type casting when base allows strings
					bgcolor: defaultblack,
					size: 16,
				},
				steps: [
					{
						down: [
							{
								actionId: 'seek',
								options: {
									playback: playback.toLowerCase(),
									abs: '0',
									inc: 0,
									rel: 0,
									...action.option,
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'playerstate',
						options: {
							playback: playback.toLowerCase(),
							state: 'paused',
						},
						style: {
							bgcolor: 'rgb(138, 138, 0)' as unknown as number,
						},
					},
					{
						feedbackId: 'playerstate',
						options: {
							playback: playback.toLowerCase(),
							state: 'playing',
						},
						style: {
							bgcolor: 'rgb(138, 0, 0)' as unknown as number,
						},
					},
				],
			}
		}
	}

	// Selection presets
	for (const playback of ['Program', 'Preview']) {
		for (const action of ['Previous', 'Next']) {
			const icon = action === 'Previous' ? '🔼' : action === 'Next' ? '🔽' : ''
			presets[`${playback}${action}`] = {
				type: 'button',
				name: `Select ${action} item, ${playback}`,
				category: 'Select',
				style: {
					text: `${icon}\\n${playback}`,
					color:
						playback == 'Program' ? ('rgb(255,100,100)' as unknown as number) : ('rgb(0, 255, 0)' as unknown as number), // FIXME: remove type casting when base allows strings
					bgcolor: defaultblack,
					size: 16,
				},
				steps: [
					{
						down: [
							{
								actionId: 'select',
								options: {
									playback: playback.toLowerCase(),
									action: action.toLowerCase(),
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'playerstate',
						options: {
							playback: playback.toLowerCase(),
							state: 'paused',
						},
						style: {
							bgcolor: 'rgb(138, 138, 0)' as unknown as number,
						},
					},
					{
						feedbackId: 'playerstate',
						options: {
							playback: playback.toLowerCase(),
							state: 'playing',
						},
						style: {
							bgcolor: 'rgb(138, 0, 0)' as unknown as number,
						},
					},
				],
			}
		}
	}

	// Collections presets
	for (const playback of ['Program', 'Preview']) {
		for (const collection of Object.keys(self.state.collections)) {
			for (const item of Object.keys(self.state.collections[collection].slots)) {
				const png = await self.getThumbAsPNG('collections', Number(collection), item)

				presets[`${playback}_coll_${collection}_${item}`] = {
					type: 'button',
					name: `Set collection ${collection} slot ${item} in ${playback}`,
					category: `Collection ${collection.padStart(3, '0')}, ${playback}`,
					style: {
						text: `Set collection\\n${collection} slot ${item}\\nin ${playback}`,
						color:
							playback == 'Program'
								? ('rgb(255,100,100)' as unknown as number)
								: ('rgb(0, 255, 0)' as unknown as number), // FIXME: remove type casting when base allows strings
						bgcolor: defaultblack,
						size: 11,
					},
					steps: [
						{
							down: [
								{
									actionId: 'setMedia',
									options: {
										playback: playback.toLowerCase(),
										type: 'collections',
										number: Number(collection),
										slot: Number(item),
										cue: 'first',
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'tallyBool',
							options: {
								playback: 'preview',
								state: 'any',
								type: 'collections',
								number: Number(collection),
								slot: Number(item),
								cue: '1',
							},
							style: {
								bgcolor: 'rgb(138, 138, 0)' as unknown as number,
							},
						},
						{
							feedbackId: 'tallyBool',
							options: {
								playback: 'program',
								state: 'any',
								type: 'collections',
								number: Number(collection),
								slot: Number(item),
								cue: '1',
							},
							style: {
								bgcolor: 'rgb(138, 0, 0)' as unknown as number,
							},
						},
					],
				}

				presets[`${playback}_coll_${collection}_${item}_thumb`] = {
					type: 'button',
					name: `Set collection ${collection} slot ${item} in ${playback}`,
					category: `Collection ${collection.padStart(3, '0')}, ${playback}`,
					style: {
						textExpression: true,
						text: `$(coreplay:collections)[${collection}]['slots'][${item}]['name'] ?? 'Media ${collection} / ${item}'`,
						show_topbar: false,
						color:
							playback == 'Program'
								? ('rgb(255,100,100)' as unknown as number)
								: ('rgb(0, 255, 0)' as unknown as number), // FIXME: remove type casting when base allows strings
						bgcolor: defaultblack,
						size: 'auto',
					},
					previewStyle: {
						textExpression: true,
						show_topbar: false,
						text: `$(coreplay:collections)[${collection}]['slots'][${item}]['name'] ?? 'Media ${collection} / ${item}'`,
						size: 'auto',
						color:
							playback == 'Program'
								? ('rgb(255,100,100)' as unknown as number)
								: ('rgb(0, 255, 0)' as unknown as number), // FIXME: remove type casting when base allows strings
						bgcolor: defaultblack,
						png64: png,
					},
					steps: [
						{
							down: [
								{
									actionId: 'setMedia',
									options: {
										playback: playback.toLowerCase(),
										type: 'collections',
										number: Number(collection),
										slot: Number(item),
										cue: 'first',
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'tallyBool',
							options: {
								playback: 'preview',
								state: 'any',
								type: 'collections',
								number: Number(collection),
								slot: Number(item),
								cue: '1',
							},
							style: {
								bgcolor: 'rgb(138, 138, 0)' as unknown as number,
							},
						},
						{
							feedbackId: 'tallyBool',
							options: {
								playback: 'program',
								state: 'any',
								type: 'collections',
								number: Number(collection),
								slot: Number(item),
								cue: '1',
							},
							style: {
								bgcolor: 'rgb(138, 0, 0)' as unknown as number,
							},
						},
						{
							feedbackId: 'previewImage',
							options: {
								type: 'collections',
								number: Number(collection),
								slot: Number(item),
								cue: '1',
							},
						},
					],
				}
			}
		}
	}

	// Playlists presets
	for (const playback of ['Program', 'Preview']) {
		for (const playlist of Object.keys(self.state.playlists)) {
			presets[`${playback}_playl_${playlist}_first`] = {
				type: 'button',
				name: `Set playlist ${playlist} first entry in ${playback}`,
				category: `Playlist ${playlist.padStart(3, '0')}, ${playback}`,
				style: {
					textExpression: true,
					text: `\`Set playlist ${playlist}\\n\${$(coreplay:playlists)[${playlist}]['name']}\\nin ${playback}\``,
					color:
						playback == 'Program' ? ('rgb(255,100,100)' as unknown as number) : ('rgb(0, 255, 0)' as unknown as number), // FIXME: remove type casting when base allows strings
					bgcolor: defaultblack,
					size: 11,
				},
				steps: [
					{
						down: [
							{
								actionId: 'setMedia',
								options: {
									playback: playback.toLowerCase(),
									type: 'playlists',
									number: Number(playlist),
									slot: 1,
									cue: 'first',
								},
							},
						],
						up: [],
					},
				],
				feedbacks: [
					{
						feedbackId: 'tallyBool',
						options: {
							playback: 'preview',
							state: 'any',
							type: 'playlists',
							number: Number(playlist),
							slot: 1,
							cue: 'any',
						},
						style: {
							bgcolor: 'rgb(138, 138, 0)' as unknown as number,
						},
					},
					{
						feedbackId: 'tallyBool',
						options: {
							playback: 'program',
							state: 'any',
							type: 'playlists',
							number: Number(playlist),
							slot: 1,
							cue: 'any',
						},
						style: {
							bgcolor: 'rgb(138, 0, 0)' as unknown as number,
						},
					},
				],
			}

			for (const item of Object.keys(self.state.playlists[playlist].entries).sort(playlistsort)) {
				presets[`${playback}_playl_${playlist}_${item}`] = {
					type: 'button',
					name: `Set playlist ${playlist} entry ${item} in ${playback}`,
					category: `Playlist ${playlist.padStart(3, '0')}, ${playback}`,
					style: {
						text: `Set playlist\\n${playlist} entry ${item}\\nin ${playback}`,
						color:
							playback == 'Program'
								? ('rgb(255,100,100)' as unknown as number)
								: ('rgb(0, 255, 0)' as unknown as number), // FIXME: remove type casting when base allows strings
						bgcolor: defaultblack,
						size: 11,
					},
					steps: [
						{
							down: [
								{
									actionId: 'setMedia',
									options: {
										playback: playback.toLowerCase(),
										type: 'playlists',
										number: Number(playlist),
										slot: 1,
										cue: item,
									},
								},
							],
							up: [],
						},
					],
					feedbacks: [
						{
							feedbackId: 'tallyBool',
							options: {
								playback: 'preview',
								state: 'any',
								type: 'playlists',
								number: Number(playlist),
								slot: 1,
								cue: item,
							},
							style: {
								bgcolor: 'rgb(138, 138, 0)' as unknown as number,
							},
						},
						{
							feedbackId: 'tallyBool',
							options: {
								playback: 'program',
								state: 'any',
								type: 'playlists',
								number: Number(playlist),
								slot: 1,
								cue: item,
							},
							style: {
								bgcolor: 'rgb(138, 0, 0)' as unknown as number,
							},
						},
					],
				}
			}
		}
	}

	self.setPresetDefinitions(presets)
}
