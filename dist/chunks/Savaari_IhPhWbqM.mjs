const Savaari = new Proxy({"src":"/_astro/Savaari.aEZbQDqg.png","width":2214,"height":798,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/partners/Savaari.png";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/partners/Savaari.png");
							return target[name];
						}
					});

export { Savaari as default };
