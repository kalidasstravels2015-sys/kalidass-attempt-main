const Kanyakumari = new Proxy({"src":"/_astro/Kanyakumari.BskE9BFw.jpg","width":960,"height":696,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/hero/Kanyakumari.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/hero/Kanyakumari.jpg");
							return target[name];
						}
					});

export { Kanyakumari as default };
