import Bound from "util/decorator/Bound";

class Watch<T> {

	private lastValue?: T;
	public constructor (private readonly getter: () => T) { }

	@Bound public changes () {
		const value = this.getter();
		if (this.lastValue === value)
			return false;

		this.lastValue = value;
		return true;
	}

}

export default function <T> (getter: () => T) {
	return new Watch(getter).changes;
}
