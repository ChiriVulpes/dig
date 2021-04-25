import Enums from "./Enums";
import Random from "./Random";

export enum SoundType {
	Hit,
	Break,
	Metal,
	Gem,
	BreakGem,
	Explode,
}

const versionCount: Record<SoundType, number> = {
	[SoundType.Hit]: 5,
	[SoundType.Metal]: 4,
	[SoundType.Break]: 4,
	[SoundType.Gem]: 4,
	[SoundType.BreakGem]: 3,
	[SoundType.Explode]: 1,
};

export default class Sound {
	public static preload () {
		for (const sound of Enums.values(SoundType)) {
			for (let i = 0; i < versionCount[sound]; i++) {
				Sound.get(sound, i);
			}
		}
	}

	private static readonly sounds = new Map<string, Sound>();

	public static get (type: SoundType, which?: number): Sound;
	public static get (type?: SoundType, which?: number): Sound | undefined;
	public static get (type?: SoundType, which = type === undefined ? 0 : Random.int(versionCount[type])) {
		if (type === undefined)
			return undefined;

		const name = `${SoundType[type]}${which}`;
		let sprite = this.sounds.get(name);
		if (!sprite)
			this.sounds.set(name, sprite = new Sound(name));

		return sprite;
	}

	public audio?: HTMLAudioElement;

	public constructor (public readonly name: string) {
		const audio = document.createElement("audio");
		audio.src = `sfx/${name}.mp3`;
		audio.addEventListener("canplaythrough", () => this.audio = audio);
	}

	public play () {
		this.audio?.play();
	}
}