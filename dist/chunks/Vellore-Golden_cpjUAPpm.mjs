const VelloreGolden = new Proxy({"src":"/_astro/Vellore-Golden.DKjHkEsS.jpg","width":870,"height":450,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/temple/Vellore-Golden.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/temple/Vellore-Golden.jpg");
							return target[name];
						}
					});

export { VelloreGolden as default };
