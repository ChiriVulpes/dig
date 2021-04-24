import Enums from "./Enums";
import Random from "./Random";

export enum SoundType {
	Hit,
	Break,
}

const versionCount: Record<SoundType, number> = {
	[SoundType.Hit]: 5,
	[SoundType.Break]: 1,
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

	public static get (type: SoundType, which = Random.int(versionCount[type])) {
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