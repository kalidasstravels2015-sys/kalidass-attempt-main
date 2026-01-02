const Rameshwaram = new Proxy({"src":"/_astro/Rameshwaram.Dwnj3PQX.jpg","width":960,"height":540,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/hero/Rameshwaram.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/hero/Rameshwaram.jpg");
							return target[name];
						}
					});

export { Rameshwaram as default };
