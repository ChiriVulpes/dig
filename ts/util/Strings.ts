namespace Strings {
	export function capitalise<STRING extends string> (str: STRING) {
		return `${str[0].toUpperCase()}${str.slice(1)}` as Capitalize<STRING>;
	}
}

export default Strings;
