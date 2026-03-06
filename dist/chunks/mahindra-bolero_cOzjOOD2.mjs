const mahindraBolero = new Proxy({"src":"/_astro/mahindra-bolero.iS6JdULZ.webp","width":900,"height":686,"format":"webp"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/fleet/mahindra-bolero.webp";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/fleet/mahindra-bolero.webp");
							return target[name];
						}
					});

export { mahindraBolero as default };
