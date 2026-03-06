const neelakandan = new Proxy({"src":"/_astro/neelakandan.BicAZMKP.jpg","width":1792,"height":2400,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/drivers/neelakandan.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/drivers/neelakandan.jpg");
							return target[name];
						}
					});

export { neelakandan as default };
