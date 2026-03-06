const corporate = new Proxy({"src":"/_astro/corporate.Dk9b_RDV.jpg","width":500,"height":350,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/services/corporate.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/services/corporate.jpg");
							return target[name];
						}
					});

export { corporate as default };
