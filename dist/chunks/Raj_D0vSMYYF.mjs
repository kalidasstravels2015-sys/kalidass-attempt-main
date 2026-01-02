const Raj = new Proxy({"src":"/_astro/Raj.Lf5P6x4Y.png","width":1376,"height":1835,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/drivers/Raj.png";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/drivers/Raj.png");
							return target[name];
						}
					});

export { Raj as default };
