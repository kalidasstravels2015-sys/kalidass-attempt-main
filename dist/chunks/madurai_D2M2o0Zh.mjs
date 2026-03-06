const madurai = new Proxy({"src":"/_astro/madurai.BoGoHrZr.jpg","width":960,"height":569,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/hero/madurai.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/hero/madurai.jpg");
							return target[name];
						}
					});

export { madurai as default };
