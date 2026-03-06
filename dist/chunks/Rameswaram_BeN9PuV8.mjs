const Rameswaram = new Proxy({"src":"/_astro/Rameswaram.BEjODBk2.jpg","width":880,"height":542,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/temple/Rameswaram.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/temple/Rameswaram.jpg");
							return target[name];
						}
					});

export { Rameswaram as default };
