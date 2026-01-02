const venkatesh = new Proxy({"src":"/_astro/venkatesh.BJlByxF7.png","width":1732,"height":2218,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/drivers/venkatesh.png";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/drivers/venkatesh.png");
							return target[name];
						}
					});

export { venkatesh as default };
