const Natraj = new Proxy({"src":"/_astro/Natraj.kruc5l10.png","width":1792,"height":2400,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/drivers/Natraj.png";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/drivers/Natraj.png");
							return target[name];
						}
					});

export { Natraj as default };
