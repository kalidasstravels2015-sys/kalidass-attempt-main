const TirupatiBalaji = new Proxy({"src":"/_astro/Tirupati-Balaji.BkwefYkL.jpg","width":960,"height":640,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/temple/Tirupati-Balaji.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/temple/Tirupati-Balaji.jpg");
							return target[name];
						}
					});

export { TirupatiBalaji as default };
