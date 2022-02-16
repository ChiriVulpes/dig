export default class HashSet<T extends any[], HASH> {

	private readonly map = new Map<HASH, T>();

	public constructor (private readonly hash: (...value: T) => HASH) { }

	public add (...value: T) {
		// for (const value of values)
		this.map.set(this.hash(...value), value);

		return this;
	}

	public delete (...value: T) {
		// for (const value of values)
		this.map.delete(this.hash(...value));

		return this;
	}

	public has (...value: T) {
		// for (const value of values)
		if (!this.map.has(this.hash(...value)))
			return false;

		return true;
	}

	public clear () {
		this.map.clear();
		return this;
	}

	public values () {
		return this.map.values();
	}
}
