const templeTours = new Proxy({"src":"/_astro/temple-tours.CYFhwWbO.jpg","width":3072,"height":2050,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/services/temple-tours.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/services/temple-tours.jpg");
							return target[name];
						}
					});

export { templeTours as default };
