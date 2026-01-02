const tnPolice = new Proxy({"src":"/_astro/tn-police.BvAj9knV.png","width":310,"height":328,"format":"png"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/partners/tn-police.png";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/partners/tn-police.png");
							return target[name];
						}
					});

export { tnPolice as default };
