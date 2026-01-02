const airportTransfer = new Proxy({"src":"/_astro/airport-transfer.OPpX5T_k.jpg","width":1280,"height":853,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/services/airport-transfer.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/services/airport-transfer.jpg");
							return target[name];
						}
					});

export { airportTransfer as default };
