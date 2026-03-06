const MahabalipuramECRTemples = new Proxy({"src":"/_astro/Mahabalipuram-ECR-Temples.BczoXBxC.jpg","width":960,"height":640,"format":"jpg"}, {
						get(target, name, receiver) {
							if (name === 'clone') {
								return structuredClone(target);
							}
							if (name === 'fsPath') {
								return "D:/websites/kalidass-attempt-main/src/assets/images/temple/Mahabalipuram-ECR-Temples.jpg";
							}
							if (target[name] !== undefined && globalThis.astroAsset) globalThis.astroAsset?.referencedImages.add("D:/websites/kalidass-attempt-main/src/assets/images/temple/Mahabalipuram-ECR-Temples.jpg");
							return target[name];
						}
					});

export { MahabalipuramECRTemples as default };
