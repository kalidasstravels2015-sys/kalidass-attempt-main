const landt = new Proxy({"src":"/_astro/landt.D8wPIvUE.webp","width":480,"height":360,"format":"webp"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/partners/landt.webp";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/partners/landt.webp");
							return target[name];
						}
					});

export { landt as default };
