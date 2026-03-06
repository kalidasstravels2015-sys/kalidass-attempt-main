const Mani = new Proxy({"src":"/_astro/Mani.Ch5S-9E-.png","width":1856,"height":2304,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/drivers/Mani.png";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/drivers/Mani.png");
							return target[name];
						}
					});

export { Mani as default };
