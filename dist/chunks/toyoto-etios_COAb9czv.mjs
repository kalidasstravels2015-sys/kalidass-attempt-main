const toyotoEtios = new Proxy({"src":"/_astro/toyoto-etios.RUG9Hjld.jpg","width":600,"height":399,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/fleet/toyoto-etios.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/fleet/toyoto-etios.jpg");
							return target[name];
						}
					});

export { toyotoEtios as default };
