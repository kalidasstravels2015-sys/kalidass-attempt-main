const maniPerumal = new Proxy({"src":"/_astro/mani-perumal.BNU0XOjH.jpg","width":853,"height":1111,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/mani-perumal.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/mani-perumal.jpg");
							return target[name];
						}
					});

export { maniPerumal as default };
