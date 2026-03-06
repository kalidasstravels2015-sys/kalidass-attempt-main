const vijay = new Proxy({"src":"/_astro/vijay.DpjTZL-v.png","width":2176,"height":1952,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/drivers/vijay.png";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/drivers/vijay.png");
							return target[name];
						}
					});

export { vijay as default };
