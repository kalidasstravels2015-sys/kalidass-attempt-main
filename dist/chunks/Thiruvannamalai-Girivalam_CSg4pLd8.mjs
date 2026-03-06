const ThiruvannamalaiGirivalam = new Proxy({"src":"/_astro/Thiruvannamalai-Girivalam.CoSwMw4L.jpg","width":840,"height":425,"format":"jpg","orientation":1}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/temple/Thiruvannamalai-Girivalam.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/temple/Thiruvannamalai-Girivalam.jpg");
							return target[name];
						}
					});

export { ThiruvannamalaiGirivalam as default };
