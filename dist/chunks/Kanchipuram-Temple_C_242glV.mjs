const KanchipuramTemple = new Proxy({"src":"/_astro/Kanchipuram-Temple.D4A_Ug_K.jpg","width":1004,"height":565,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/temple/Kanchipuram-Temple.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/temple/Kanchipuram-Temple.jpg");
							return target[name];
						}
					});

export { KanchipuramTemple as default };
