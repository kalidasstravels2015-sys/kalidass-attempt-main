const Navagraha = new Proxy({"src":"/_astro/Navagraha.DhBRN1tP.jpg","width":800,"height":600,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/temple/Navagraha.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/temple/Navagraha.jpg");
							return target[name];
						}
					});

export { Navagraha as default };
