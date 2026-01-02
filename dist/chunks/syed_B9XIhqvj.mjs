const syed = new Proxy({"src":"/_astro/syed.DQuKTBT9.jpg","width":640,"height":640,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/drivers/syed.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/drivers/syed.jpg");
							return target[name];
						}
					});

export { syed as default };
