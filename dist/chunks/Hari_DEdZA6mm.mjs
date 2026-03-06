const Hari = new Proxy({"src":"/_astro/Hari.Bd2-AQ5g.png","width":1664,"height":2560,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/drivers/Hari.png";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/drivers/Hari.png");
							return target[name];
						}
					});

export { Hari as default };
