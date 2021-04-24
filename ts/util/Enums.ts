export module EnumProperty {
	export const KEYS = Symbol("KEYS");
	export const VALUES = Symbol("VALUES");
	export const ENTRIES = Symbol("ENTRIES");
}

export type EnumObject<T> = T & {
	[EnumProperty.KEYS]?: ReadonlyArray<keyof T>;
	[EnumProperty.VALUES]?: ReadonlyArray<T[keyof T]>;
	[EnumProperty.ENTRIES]?: ReadonlyArray<[keyof T, T[keyof T]]>;
};

export namespace EnumObject {
	export function get<E> (enumObject: E) {
		return enumObject as EnumObject<E>;
	}
}

namespace Enums {

	export function getNth<E, K extends string> (enumObject: { [key in K]: E }, n: number): E | undefined {
		return values(enumObject)[n];
	}

	export function getLength (enumObject: any) {
		return keys(enumObject).length;
	}

	export function keys<T> (enumObject: T) {
		const e = EnumObject.get(enumObject);
		if (!e[EnumProperty.KEYS]) {
			e[EnumProperty.KEYS] = (Object.keys(e) as Extract<keyof T, string | number>[])
				.filter(key => isNaN(+key));
		}

		return e[EnumProperty.KEYS]!;
	}

	export function values<T> (enumObject: T) {
		const e = EnumObject.get(enumObject);
		if (!e[EnumProperty.VALUES]) {
			e[EnumProperty.VALUES] = keys(enumObject)
				.map(key => enumObject[key] as T[keyof T]);
		}

		return e[EnumProperty.VALUES]!;
	}

	export function entries<T> (enumObject: T) {
		const e = EnumObject.get(enumObject);
		if (!e[EnumProperty.ENTRIES]) {
			e[EnumProperty.ENTRIES] = keys(enumObject)
				.map(key => [key, enumObject[key]] as [keyof T, T[keyof T]]);
		}

		return e[EnumProperty.ENTRIES]!;
	}

}

export default Enums;
