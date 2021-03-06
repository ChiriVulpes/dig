(() => {
	/**
	 * @enum {number}
	 */
	const ModuleState = {
		Unprocessed: 0,
		Waiting: 1,
		Processed: 2,
		Error: 3,
	};

	/**
	 * @typedef {(getModule: (module: string) => any, module: Module, ...args: any[]) => any} ModuleInitializer
	 */

	/**
	 * @typedef {{ _name: string; _state: ModuleState; _requirements: string[]; _initializer: ModuleInitializer; _error?: Error  }} Module
	 */

	/**
	 * @type {Map<string, Module>}
	 */
	const moduleMap = new Map();
	/**
	 * @type {Set<string>}
	 */
	const requirements = new Set();

	/**
	 * @param {string} name
	 * @param {string[]} reqs
	 * @param {ModuleInitializer} fn
	 */
	function define (name, reqs, fn) {
		if (Array.isArray(name)) {
			fn = reqs;
			reqs = name;
			name = document.currentScript.getAttribute("src");
			if (name.startsWith("node_modules/"))
				name = `@${name.slice("node_modules/".length)}`;
			if (name.endsWith(".js"))
				name = `${name.slice(0, -3)}`;
		}

		if (moduleMap.has(name))
			throw new Error(`Module "${name}" cannot be redefined`);

		/**
		 * @type {Module}
		 */
		const module = {
			_name: name,
			_state: ModuleState.Unprocessed,
			_requirements: reqs.slice(2).map(req => findModuleName(name, req)),
			_initializer: fn,
		};
		moduleMap.set(name, module);
		for (const req of module._requirements)
			requirements.add(req);

		if (initialProcessCompleted)
			processModules();
	}

	/**
	 * @param {string} name
	 */
	function getModule (name) {
		return moduleMap.get(name);
	}

	/**
	 * @param {string} name
	 */
	function initializeModuleByName (name) {
		initializeModule(getModule(name));
	}

	/**
	 * @param {Module} module 
	 * @param  {...any} args 
	 */
	function initializeModule (module, ...args) {
		if (module._state)
			throw new Error(`Module "${module._name}" has already been processed`);

		try {
			module._initializer(getModule, module, ...args);
			module._state = ModuleState.Processed;

		} catch (err) {
			module._state = ModuleState.Error;
			module._error = err;
			err.message = `[Module initialization ${module._name}] ${err.message}`;
			console.error(err);
		}
	}


	////////////////////////////////////
	// Add the above functions to Window
	//

	/** 
	 * @type {Window & typeof globalThis & { define: typeof define; getModule: typeof getModule; initializeModule: typeof initializeModuleByName }} 
	 */
	const moddableWindow = (window);
	moddableWindow.define = define;
	moddableWindow.getModule = getModule;
	moddableWindow.initializeModule = initializeModuleByName;


	////////////////////////////////////
	// Actually process the modules
	//

	document.addEventListener("DOMContentLoaded", processModules);

	let initialProcessCompleted = false;
	async function processModules () {
		while (requirements.size) {
			const remainingRequirements = Array.from(requirements);
			await Promise.all(remainingRequirements.map(tryImportAdditionalModule));
			for (const req of remainingRequirements)
				requirements.delete(req);
		}

		for (const [name, module] of moduleMap.entries())
			processModule(name, module);

		initialProcessCompleted = true;
	}

	/**
	 * @param {string} req 
	 */
	async function tryImportAdditionalModule (req) {
		if (moduleMap.has(req))
			return;

		await importAdditionalModule(req);

		if (!moduleMap.has(req))
			throw new Error(`The required module '${req}' could not be asynchronously loaded.`);
	}

	/**
	 * @param {string} req
	 */
	async function importAdditionalModule (req) {
		const script = document.createElement("script");
		/** @type {Promise<void>} */
		const promise = new Promise(resolve => script.addEventListener("load", () => resolve()));
		script.src = req[0] === "@" ? `node_modules/${req.slice(1)}.js` : `js/${req}.js`;
		document.head.appendChild(script);
		return promise;
	}

	/**
	 * @param {string} name 
	 * @param {Module | undefined} module 
	 * @param {string[]} requiredBy 
	 */
	function processModule (name, module = moduleMap.get(name), requiredBy = []) {
		if (!module)
			throw new Error(`No "${name}" module defined`);

		if (module._state === ModuleState.Waiting)
			throw new Error(`Circular dependency! Dependency chain: ${[...requiredBy, name].map(m => `"${m}"`).join(" > ")}`);

		if (!module._state) {
			module._state = ModuleState.Waiting;
			const args = module._requirements
				.map(req => processModule(req, undefined, [...requiredBy, name]));

			module._state = ModuleState.Unprocessed;
			initializeModule(module, ...args);
		}

		return module;
	}


	////////////////////////////////////
	// Utils
	//

	/**
	 * @param {string} name 
	 * @param {string} requirement 
	 */
	function findModuleName (name, requirement) {
		let root = dirname(name);
		if (requirement.startsWith("./"))
			return join(root, requirement.slice(2));

		while (requirement.startsWith("../"))
			root = dirname(root), requirement = requirement.slice(3);

		return requirement;
	}

	/**
	 * @param {string} name 
	 */
	function dirname (name) {
		const lastIndex = name.lastIndexOf("/");
		return lastIndex === -1 ? "" : name.slice(0, lastIndex);
	}

	/**
	 * @param  {...string} path 
	 */
	function join (...path) {
		return path.filter(p => p).join("/");
	}
})();
