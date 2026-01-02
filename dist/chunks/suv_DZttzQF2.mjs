const suv = new Proxy({"src":"/_astro/suv.BGjYeEYK.webp","width":600,"height":462,"format":"webp"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/fleet/suv.webp";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/fleet/suv.webp");
							return target[name];
						}
					});

export { suv as default };
