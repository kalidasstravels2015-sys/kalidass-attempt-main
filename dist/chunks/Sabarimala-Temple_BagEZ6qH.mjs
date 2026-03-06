const SabarimalaTemple = new Proxy({"src":"/_astro/Sabarimala-Temple.Ca7uWOVM.jpg","width":1200,"height":749,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/temple/Sabarimala-Temple.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/temple/Sabarimala-Temple.jpg");
							return target[name];
						}
					});

export { SabarimalaTemple as default };
