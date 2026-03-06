const tempo = new Proxy({"src":"/_astro/tempo.C9P19uvI.webp","width":1164,"height":590,"format":"webp"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/fleet/tempo.webp";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/fleet/tempo.webp");
							return target[name];
						}
					});

export { tempo as default };
