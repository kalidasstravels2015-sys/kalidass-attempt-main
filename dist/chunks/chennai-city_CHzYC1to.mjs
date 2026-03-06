const chennaiCity = new Proxy({"src":"/_astro/chennai-city.C3dtdxDt.jpg","width":600,"height":338,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/temple/chennai-city.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/temple/chennai-city.jpg");
							return target[name];
						}
					});

export { chennaiCity as default };
