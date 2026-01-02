const swiftDzire = new Proxy({"src":"/_astro/swift-dzire.DgrkO5f3.webp","width":750,"height":542,"format":"webp"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/fleet/swift-dzire.webp";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/fleet/swift-dzire.webp");
							return target[name];
						}
					});

export { swiftDzire as default };
