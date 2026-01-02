const coimbatore = new Proxy({"src":"/_astro/coimbatore.BOhHbT27.webp","width":1920,"height":1080,"format":"webp"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/hero/coimbatore.webp";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/hero/coimbatore.webp");
							return target[name];
						}
					});

export { coimbatore as default };
