const saravn = new Proxy({"src":"/_astro/saravn.8waAhv1q.png","width":5008,"height":2504,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/partners/saravn.png";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/partners/saravn.png");
							return target[name];
						}
					});

export { saravn as default };
