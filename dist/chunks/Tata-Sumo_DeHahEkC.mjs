const TataSumo = new Proxy({"src":"/_astro/Tata-Sumo.CjZPpH77.png","width":664,"height":374,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/fleet/Tata-Sumo.png";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/fleet/Tata-Sumo.png");
							return target[name];
						}
					});

export { TataSumo as default };
