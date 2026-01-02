const actingDrivers = new Proxy({"src":"/_astro/acting-drivers.CdNre4-L.jpg","width":2400,"height":1767,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/services/acting-drivers.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/services/acting-drivers.jpg");
							return target[name];
						}
					});

export { actingDrivers as default };
