const Vadivel = new Proxy({"src":"/_astro/Vadivel.Bhqw311G.png","width":1792,"height":2400,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/drivers/Vadivel.png";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/drivers/Vadivel.png");
							return target[name];
						}
					});

export { Vadivel as default };
