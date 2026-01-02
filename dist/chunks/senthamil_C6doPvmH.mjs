const senthamil = new Proxy({"src":"/_astro/senthamil.DuobjdMm.png","width":1792,"height":2400,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/drivers/senthamil.png";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/drivers/senthamil.png");
							return target[name];
						}
					});

export { senthamil as default };
